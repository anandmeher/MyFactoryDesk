## ADDED Requirements

### Requirement: Calculator is a pure function
`calculatePayslip(input: PayslipInput): PayslipOutput` SHALL live in `apps/api/src/payroll/calculator.ts` and SHALL NOT perform any I/O, database access, environment reads, or calls to `Date.now()`. All inputs SHALL be passed in the `input` object; all outputs SHALL be returned in the `output` object.

#### Scenario: Same input always yields the same output
- **WHEN** `calculatePayslip(input)` is called twice with identical inputs
- **THEN** both calls return outputs whose every Decimal field, when rounded to 2 places, is byte-equal

#### Scenario: No DB or network access from the calculator
- **WHEN** the calculator module is imported
- **THEN** it imports nothing from `@prisma/client`, `axios`, `node:fs`, or any I/O-performing module

### Requirement: All money is Decimal
Every money value passing into or out of the calculator SHALL be a `decimal.js` `Decimal` instance. Internal arithmetic SHALL use `Decimal` operations only — no implicit conversion to `number`.

#### Scenario: Output money values are Decimal-typed
- **WHEN** the calculator returns a `PayslipOutput`
- **THEN** `basicEarned`, `hraEarned`, `grossEarnings`, `netPay`, and every nested money field are `Decimal` instances
- **AND** rounding to 2 places via `Decimal.toFixed(2, Decimal.ROUND_HALF_EVEN)` produces an exact string representation with no floating-point artefacts

### Requirement: Days payable accounts for join and leave mid-month
`daysPayable` SHALL equal `daysBetween(periodStart, periodEnd) + 1`, where `periodStart = max(firstOfMonth, dateOfJoining)` and `periodEnd = min(lastOfMonth, dateOfLeaving ?? lastOfMonth)`. If `daysPayable <= 0`, the calculator SHALL return an all-zero output with `notEmployed: true`.

#### Scenario: Joined on the 15th of a 30-day month
- **WHEN** `dateOfJoining = 2026-04-15` and `daysInMonth = 30`
- **THEN** `daysPayable = 16`

#### Scenario: Left on the 10th of a 31-day month
- **WHEN** `dateOfLeaving = 2026-05-10` and `daysInMonth = 31`
- **THEN** `daysPayable = 10`

#### Scenario: Joined and left in the same month
- **WHEN** `dateOfJoining = 2026-04-10` and `dateOfLeaving = 2026-04-20`
- **THEN** `daysPayable = 11`

#### Scenario: Not employed in the period
- **WHEN** `dateOfLeaving` is before the start of the month
- **THEN** the output is all-zero with `notEmployed: true`

### Requirement: Days worked from attendance
`daysWorked` SHALL equal `present + paidLeave + (halfDay * 0.5)`. Holidays SHALL NOT contribute to or reduce `daysWorked` because they are paid days that don't enter the per-day rate calculation. `daysWorked` SHALL be clamped at `daysPayable` defensively.

#### Scenario: Half-days sum correctly
- **WHEN** `attendance = { halfDay: 4, present: 0, paidLeave: 0, ... }`
- **THEN** `daysWorked = 2.0`

#### Scenario: Mixed attendance
- **WHEN** `attendance = { present: 20, halfDay: 2, paidLeave: 1, absent: 5, holiday: 2 }`
- **THEN** `daysWorked = 22.0` (20 + 1 + 1)

### Requirement: Per-day rate proration
`perDay` SHALL equal `basicSalary / daysPayable` (NOT `daysInMonth`). Intermediate Decimals SHALL not be rounded; rounding SHALL occur only at the output boundary.

#### Scenario: Decimal precision preserved through division
- **WHEN** `basicSalary = "1500.00"` and `daysPayable = 30` and `daysWorked = 22`
- **THEN** `basicEarned.toFixed(2)` equals exactly `"1100.00"` with no floating-point drift

### Requirement: HRA, allowances, and overtime
`hraEarned` SHALL equal `hra * (daysWorked / daysPayable)`. Each allowance with `alwaysFull: true` SHALL be paid in full; otherwise it is multiplied by `(daysWorked / daysPayable)`. `otAmount` SHALL equal `overtimeHours * (perDay / hoursPerDay) * otMultiplier`, where `hoursPerDay` defaults to `8`.

#### Scenario: Allowance with alwaysFull is not pro-rated
- **WHEN** `allowances = [{ name: "Travel", amount: "1000.00", alwaysFull: true }]` and `daysWorked / daysPayable = 0.5`
- **THEN** the allowance line shows `1000.00`, not `500.00`

#### Scenario: Allowance without alwaysFull is pro-rated
- **WHEN** `allowances = [{ name: "Food", amount: "1000.00", alwaysFull: false }]` and `daysWorked / daysPayable = 0.5`
- **THEN** the allowance line shows `500.00`

#### Scenario: Overtime calculation
- **WHEN** `basicSalary = "15000.00"`, `daysInMonth = daysPayable = 30`, `overtimeHours = "10.00"`, `otMultiplier = "1.5"`
- **THEN** `otAmount.toFixed(2) = "937.50"` (10 × (15000/30/8) × 1.5)

### Requirement: Fixed deductions, then advances FIFO with carry-forward
`fixedDeductionsTotal` SHALL be the sum of all fixed deductions (NOT pro-rated). Advances SHALL be applied in input order. For each advance: `applied = min(advance.amount, availableForAdvance)` where `availableForAdvance = grossEarnings - fixedDeductionsTotal - <already-applied advances>`. Any unapplied portion SHALL be added to `carriedForward` with the original advance id.

#### Scenario: Advance exceeds available — carry forward the remainder
- **WHEN** `grossEarnings = "3000"`, `fixedDeductionsTotal = "0"`, advances `[{ id: 'a', amount: "5000" }]`
- **THEN** `advanceDeducted = "3000.00"`, `netPay = "0.00"`, `carriedForward = [{ advanceId: 'a', remaining: "2000.00" }]`

#### Scenario: Multiple advances FIFO
- **WHEN** advances `[{ id: 'a', amount: "1000" }, { id: 'b', amount: "5000" }]` and `availableForAdvance = "3000"`
- **THEN** advance `a` is fully applied (`1000`), advance `b` is partially applied (`2000`), and `carriedForward = [{ advanceId: 'b', remaining: "3000.00" }]`

### Requirement: Net pay never goes negative
`netPay = max(grossEarnings - totalDeductions, 0)`. The advance application loop SHALL stop applying advances once `availableForAdvance` reaches zero.

#### Scenario: All-absent month
- **WHEN** every attendance count except `holiday` is zero
- **THEN** `grossEarnings.toFixed(2) = "0.00"`, `netPay.toFixed(2) = "0.00"`, fixed deductions appear in the breakdown but `netPay` is clamped to zero
- **AND** every scheduled advance appears in `carriedForward`

### Requirement: Banker's rounding at the output boundary
All monetary output values SHALL be rounded to 2 decimal places using `Decimal.ROUND_HALF_EVEN` (banker's rounding). Intermediate Decimals SHALL NOT be rounded.

#### Scenario: Half-cent rounds to even
- **WHEN** an intermediate value equals `2.345`
- **THEN** the rounded output is `"2.34"` (rounds to even)
- **AND** an intermediate value of `2.355` rounds to `"2.36"`

### Requirement: February day-count handling
The calculator SHALL accept `daysInMonth = 28` and `daysInMonth = 29` and prorate correctly for both. The caller is responsible for passing the correct `daysInMonth`; the calculator does not derive it.

#### Scenario: February non-leap (28)
- **WHEN** `daysInMonth = 28` and full attendance
- **THEN** the calculator produces a correct gross with no division-by-zero or off-by-one

#### Scenario: February leap (29)
- **WHEN** `daysInMonth = 29` and full attendance
- **THEN** the calculator produces a correct gross

### Requirement: Calculator versioning
The calculator module SHALL export a constant `CALCULATOR_VERSION` (semver string). Whenever the math changes, this version SHALL be bumped. The wrapping `PayrollService` SHALL persist `calculatorVersion` and a JSON copy of the `PayslipInput` on every payslip on finalize.

#### Scenario: Version bump on math change
- **WHEN** any change is made to the calculation rules
- **THEN** `CALCULATOR_VERSION` is incremented in the same commit

### Requirement: Comprehensive test matrix
The file `apps/api/src/payroll/__tests__/calculator.spec.ts` SHALL contain at least one passing test for every row of the test matrix in `PAYROLL.md` §Edge Cases — Test Matrix (rows 1 through 18). These tests SHALL be written before the calculator implementation.

#### Scenario: All test matrix rows pass
- **WHEN** `pnpm --filter api test payroll` runs
- **THEN** every test in the matrix passes
- **AND** assertions on money values use `Decimal.toFixed(2)` for byte-exact comparisons
