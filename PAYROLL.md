# Payroll Calculation Reference

> The single most important module in the entire system. Bugs here cost real money and trust. Read this fully before touching `calculator.ts`.

## Principles

1. **Calculator is a pure function.** Inputs → outputs. No DB, no I/O, no `Date.now()`.
2. **All money is `Decimal`** from `decimal.js`. Never `number`.
3. **Tests are written before code.** Every edge case in this doc has a corresponding test.
4. **Once `FINALIZED`, payslips are immutable.** Any correction is a separate adjustment, not an edit.

## Inputs

```ts
type PayslipInput = {
  // Period
  month: number              // 1-12
  year: number
  daysInMonth: number        // 28 / 29 / 30 / 31

  // Employee snapshot (frozen at calculation time)
  basicSalary: Decimal
  hra: Decimal
  allowances: Array<{ name: string; amount: Decimal; alwaysFull: boolean }>
  fixedDeductions: Array<{ name: string; amount: Decimal }>
  dateOfJoining: Date        // for proration
  dateOfLeaving: Date | null // for proration

  // Attendance counts for this period
  attendance: {
    present: number          // whole days
    halfDay: number          // count of half-days
    paidLeave: number
    unpaidLeave: number
    absent: number
    holiday: number          // does NOT reduce pay
  }

  // Overtime
  overtimeHours: Decimal
  otMultiplier: Decimal      // typically 1.5 or 2.0

  // Advances scheduled for deduction this month
  advancesScheduled: Array<{ id: string; amount: Decimal }>

  // Optional: standard working hours per day (default 8)
  hoursPerDay?: Decimal
}
```

## Outputs

```ts
type PayslipOutput = {
  daysPresent: Decimal       // present + (halfDay * 0.5)
  daysPaidLeave: Decimal
  daysAbsent: Decimal        // absent + unpaidLeave
  daysWorked: Decimal        // for pay calculation
  daysPayable: number        // employed days in this period (handles join/leave mid-month)

  basicEarned: Decimal
  hraEarned: Decimal
  allowancesBreakdown: Array<{ name: string; amount: Decimal }>
  allowancesTotal: Decimal
  otAmount: Decimal
  grossEarnings: Decimal

  fixedDeductionsBreakdown: Array<{ name: string; amount: Decimal }>
  fixedDeductionsTotal: Decimal

  advancesApplied: Array<{ id: string; amountApplied: Decimal; remaining: Decimal }>
  advanceDeducted: Decimal
  totalDeductions: Decimal

  netPay: Decimal            // never < 0

  carriedForward: Array<{ advanceId: string; remaining: Decimal }>
}
```

## The Math

### Step 1: Compute days payable in this period

If the employee was present the whole month: `daysPayable = daysInMonth`.

Otherwise account for joins and leaves mid-month:

```
periodStart = max(firstOfMonth, dateOfJoining)
periodEnd   = min(lastOfMonth, dateOfLeaving ?? lastOfMonth)
daysPayable = daysBetween(periodStart, periodEnd) + 1
```

If `daysPayable <= 0` → employee wasn't with the company this month. Return all-zero payslip with a `notEmployed: true` flag (or skip entirely; decide at the service layer).

### Step 2: Per-day rate

```
perDay = basicSalary / daysPayable     // NOT daysInMonth — payable days
```

Use `Decimal.div(daysPayable)`. Keep precision; round only at output.

### Step 3: Days worked

```
daysWorked = present + paidLeave + (halfDay * 0.5)
```

Holidays are paid days but already counted as `paid` separately — don't double-count. `unpaidLeave` and `absent` reduce `daysWorked`.

Clamp: `daysWorked = min(daysWorked, daysPayable)` (defensive; attendance data shouldn't exceed days payable).

### Step 4: Earnings

```
basicEarned = perDay * daysWorked

hraEarned = hra * (daysWorked / daysPayable)

For each allowance:
  if alwaysFull:
    earned = amount
  else:
    earned = amount * (daysWorked / daysPayable)

allowancesTotal = sum of allowance.earned values

otAmount = overtimeHours * (perDay / hoursPerDay) * otMultiplier
         (where hoursPerDay defaults to 8)

grossEarnings = basicEarned + hraEarned + allowancesTotal + otAmount
```

### Step 5: Deductions

```
fixedDeductionsTotal = sum of all fixedDeductions
                       (these are NOT pro-rated — PF/PT/etc. are typically fixed for the month)

availableForAdvance = grossEarnings - fixedDeductionsTotal

advanceDeducted = 0
advancesApplied = []
carriedForward = []

for each advance in advancesScheduled (FIFO order):
  if availableForAdvance <= 0:
    carriedForward.push({ advanceId: advance.id, remaining: advance.amount })
    continue

  applied = min(advance.amount, availableForAdvance)
  remainingForAdvance = advance.amount - applied

  advancesApplied.push({ id: advance.id, amountApplied: applied, remaining: remainingForAdvance })
  advanceDeducted += applied
  availableForAdvance -= applied

  if remainingForAdvance > 0:
    carriedForward.push({ advanceId: advance.id, remaining: remainingForAdvance })

totalDeductions = fixedDeductionsTotal + advanceDeducted
```

### Step 6: Net pay

```
netPay = grossEarnings - totalDeductions
netPay = max(netPay, 0)   // safety clamp; should already be ≥ 0 from step 5
```

### Step 7: Round for output

Round all monetary values to 2 decimal places using banker's rounding (`Decimal.ROUND_HALF_EVEN`). Do this only at the output boundary, not during intermediate calculations.

## Edge Cases — Test Matrix

Every row here must have a passing test in `calculator.spec.ts`.

| # | Scenario | Expected behavior |
|---|---|---|
| 1 | Full month, all present, no OT, no advance | Gross = basic + hra + allowances; no deductions beyond fixed |
| 2 | Joined on the 15th of a 30-day month | `daysPayable = 16`, all earnings prorated to that |
| 3 | Left on the 10th of a 31-day month | `daysPayable = 10`, all earnings prorated to that |
| 4 | Joined and left in same month | `daysPayable` covers only those days |
| 5 | All absent | `daysWorked = 0`; basic/hra/allowances = 0; fixed deductions still apply but `netPay >= 0` |
| 6 | Half-days only (e.g., 4 half-days) | `daysWorked = 2.0` |
| 7 | Mix of present/half/leave/absent summing to less than payable days | `daysWorked` reflects the mix correctly |
| 8 | Overtime 10 hours at 1.5x on ₹15000 monthly basic in 30-day month | OT = 10 × (15000/30/8) × 1.5 = ₹937.50 |
| 9 | Overtime at 2.0x multiplier | Same formula with 2.0 |
| 10 | Advance ₹5000 with gross only ₹3000 | `advanceDeducted = 3000`, `carriedForward = [{remaining: 2000}]`, `netPay = 0` |
| 11 | Multiple advances FIFO | Earlier advance applied first, later one carries forward |
| 12 | Allowance with `alwaysFull: true` | Paid in full regardless of `daysWorked` |
| 13 | Allowance without `alwaysFull` | Pro-rated by `daysWorked / daysPayable` |
| 14 | Holidays in attendance | Don't reduce pay (no special handling needed since they're not in `daysWorked` calculation but `daysPayable` already counts them) |
| 15 | February non-leap | `daysInMonth = 28` |
| 16 | February leap year | `daysInMonth = 29` |
| 17 | Zero basic salary | All earnings derived from basic = 0; only `alwaysFull` allowances paid |
| 18 | Decimal precision | `1500 / 30 * 22 = 1100.00` exactly, no `.0000000001` |

## Output Format Examples

### Normal payslip (15-day employee in 30-day month)

```ts
{
  daysPayable: 16,           // joined on the 15th
  daysWorked: '15.00',
  basicEarned: '7500.00',    // 15000 / 16 * 15 (note: prorated to PAYABLE days)
  hraEarned: '2343.75',      // 2500 * (15/16)
  allowancesTotal: '937.50',
  otAmount: '0.00',
  grossEarnings: '10781.25',
  fixedDeductionsTotal: '500.00',
  advanceDeducted: '0.00',
  totalDeductions: '500.00',
  netPay: '10281.25',
  carriedForward: []
}
```

### All-absent month with carry-forward

```ts
{
  daysPayable: 30,
  daysWorked: '0.00',
  basicEarned: '0.00',
  hraEarned: '0.00',
  allowancesTotal: '0.00',   // assuming no alwaysFull allowances
  otAmount: '0.00',
  grossEarnings: '0.00',
  fixedDeductionsTotal: '0.00', // some businesses still apply, configurable
  advanceDeducted: '0.00',
  totalDeductions: '0.00',
  netPay: '0.00',
  carriedForward: [{ advanceId: 'adv_xyz', remaining: '5000.00' }]
}
```

## Service Layer (Wrapper)

The `PayrollService` is what touches the DB. It:

1. Loads employee snapshots for the period (frozen, in case salary changed).
2. Aggregates attendance for each employee.
3. Loads scheduled advances (`deductionMonth`/`deductionYear` matches).
4. Calls `calculatePayslip()` per employee.
5. On `finalize()`:
   - Wraps in `prisma.$transaction`.
   - Inserts `Payslip` rows.
   - Links applied advances to the payslip.
   - Marks fully-applied advances as `isDeducted = true`.
   - Reschedules carried-forward advances to next month.
   - Sets `PayrollRun.status = FINALIZED`, `finalizedAt = now`.

### Idempotency

`POST /runs/:id/preview` can be called many times in DRAFT — it's read-only. Only `finalize` writes.

`POST /runs` for an already-existing month/year returns the existing run (don't create duplicates).

## Audit Trail

Once finalized, store on each `Payslip`:
- `calculatedAt` timestamp
- `calculatorVersion` string (e.g., `"v1.0.0"`) — bump when math changes
- Frozen copy of the inputs as JSON (for replay/debugging)

This protects against future arguments like "why was last March's payslip different?"

## Versioning the Calculator

When you change calculator logic (new deduction, new rule), bump `calculatorVersion`. Past payslips remain calculated under their original version. Never silently change historical numbers.

## Things This Doc Doesn't Cover (Yet)

These come in v1.1+ with explicit requirements:
- PF (Provident Fund) — 12% of basic, employer + employee shares, capped at ₹15000 basic
- ESI (Employee State Insurance) — eligibility threshold, percentage split
- PT (Professional Tax) — Odisha slabs (varies by state)
- TDS — only relevant for higher-paid employees
- Bonus, gratuity, leave encashment

Until these land, model them as flat `fixedDeductions` rows so the schema stays stable.
