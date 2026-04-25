/**
 * Payroll calculator — pure function. No DB, no I/O, no `Date.now()`.
 *
 * Inputs in, outputs out. Wraps in `PayrollService.preview/finalize` for
 * persistence and Prisma transactions; this file is decoupled so the test
 * matrix in `__tests__/calculator.spec.ts` (one passing test per row of the
 * 18-row matrix in `PAYROLL.md`) needs zero fixtures or mocks.
 *
 * --- CALCULATOR_VERSION bump policy ---
 * Bump `CALCULATOR_VERSION` whenever the math changes in a way that would
 * produce different outputs for the same input. Past payslips remain
 * frozen at the version used to compute them (stored on `Payslip.calculatorVersion`
 * + `Payslip.inputsJson`); we never silently re-compute history. Prefer
 * patch-bumping for invariant-preserving fixes (rounding tweaks,
 * defensive clamps) and minor-bumping for changed business rules
 * (new deduction lines, changed proration semantics).
 */

import { Decimal } from 'decimal.js'

export const CALCULATOR_VERSION = 'v1.0.0'

const ROUND_2 = (d: Decimal) => d.toDecimalPlaces(2, Decimal.ROUND_HALF_EVEN)
const ZERO = new Decimal(0)
const HALF = new Decimal('0.5')
const DEFAULT_HOURS_PER_DAY = new Decimal(8)

export type PayslipInput = {
  month: number
  year: number
  daysInMonth: number

  basicSalary: Decimal
  hra: Decimal
  allowances: Array<{ name: string; amount: Decimal; alwaysFull: boolean }>
  fixedDeductions: Array<{ name: string; amount: Decimal }>
  dateOfJoining: Date
  dateOfLeaving: Date | null

  attendance: {
    present: number
    halfDay: number
    paidLeave: number
    unpaidLeave: number
    absent: number
    holiday: number
  }

  overtimeHours: Decimal
  otMultiplier: Decimal
  advancesScheduled: Array<{ id: string; amount: Decimal }>

  hoursPerDay?: Decimal
}

export type PayslipOutput = {
  notEmployed: boolean

  daysPayable: number
  daysWorked: Decimal

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

  netPay: Decimal
  carriedForward: Array<{ advanceId: string; remaining: Decimal }>
}

export function calculatePayslip(input: PayslipInput): PayslipOutput {
  // Step 1 — daysPayable
  const daysPayable = computeDaysPayable(input)
  if (daysPayable <= 0) return zeroOutput(input)

  // Step 2 — perDay
  const perDay = input.basicSalary.div(daysPayable)

  // Step 3 — daysWorked. Holiday counts as a paid day per the
  // "holidays don't reduce pay" rule in PAYROLL.md row 14 (CLAUDE.md's
  // formula omits `holiday`; that's an under-specification of the same
  // intent). Half-days contribute 0.5 each.
  const daysWorkedRaw = new Decimal(input.attendance.present)
    .plus(input.attendance.paidLeave)
    .plus(input.attendance.holiday)
    .plus(new Decimal(input.attendance.halfDay).mul(HALF))
  const daysPayableD = new Decimal(daysPayable)
  const daysWorked = Decimal.min(daysWorkedRaw, daysPayableD)

  // Step 4 — earnings
  const basicEarned = perDay.mul(daysWorked)
  const proration = daysWorked.div(daysPayableD)
  const hraEarned = input.hra.mul(proration)

  const allowancesBreakdown = input.allowances.map((a) => ({
    name: a.name,
    amount: a.alwaysFull ? a.amount : a.amount.mul(proration),
  }))
  const allowancesTotal = allowancesBreakdown.reduce(
    (sum, a) => sum.plus(a.amount),
    ZERO,
  )

  const hoursPerDay = input.hoursPerDay ?? DEFAULT_HOURS_PER_DAY
  const otAmount = input.overtimeHours
    .mul(perDay.div(hoursPerDay))
    .mul(input.otMultiplier)

  const grossEarnings = basicEarned.plus(hraEarned).plus(allowancesTotal).plus(otAmount)

  // Step 5 — deductions
  const fixedDeductionsBreakdown = input.fixedDeductions.map((d) => ({
    name: d.name,
    amount: d.amount,
  }))
  const fixedDeductionsTotal = fixedDeductionsBreakdown.reduce(
    (sum, d) => sum.plus(d.amount),
    ZERO,
  )

  let availableForAdvance = grossEarnings.minus(fixedDeductionsTotal)
  const advancesApplied: Array<{ id: string; amountApplied: Decimal; remaining: Decimal }> = []
  const carriedForward: Array<{ advanceId: string; remaining: Decimal }> = []
  let advanceDeducted = ZERO

  for (const advance of input.advancesScheduled) {
    if (availableForAdvance.lte(0)) {
      // No room left this month — entire advance carries forward.
      carriedForward.push({ advanceId: advance.id, remaining: advance.amount })
      continue
    }
    const applied = Decimal.min(advance.amount, availableForAdvance)
    const remaining = advance.amount.minus(applied)
    advancesApplied.push({ id: advance.id, amountApplied: applied, remaining })
    advanceDeducted = advanceDeducted.plus(applied)
    availableForAdvance = availableForAdvance.minus(applied)
    if (remaining.gt(0)) {
      carriedForward.push({ advanceId: advance.id, remaining })
    }
  }

  const totalDeductions = fixedDeductionsTotal.plus(advanceDeducted)

  // Step 6 — netPay (clamp ≥ 0)
  const netPayRaw = grossEarnings.minus(totalDeductions)
  const netPay = Decimal.max(netPayRaw, ZERO)

  // Step 7 — round all output money to 2 decimals (banker's rounding)
  return {
    notEmployed: false,
    daysPayable,
    daysWorked: ROUND_2(daysWorked),
    basicEarned: ROUND_2(basicEarned),
    hraEarned: ROUND_2(hraEarned),
    allowancesBreakdown: allowancesBreakdown.map((a) => ({
      name: a.name,
      amount: ROUND_2(a.amount),
    })),
    allowancesTotal: ROUND_2(allowancesTotal),
    otAmount: ROUND_2(otAmount),
    grossEarnings: ROUND_2(grossEarnings),
    fixedDeductionsBreakdown: fixedDeductionsBreakdown.map((d) => ({
      name: d.name,
      amount: ROUND_2(d.amount),
    })),
    fixedDeductionsTotal: ROUND_2(fixedDeductionsTotal),
    advancesApplied: advancesApplied.map((a) => ({
      id: a.id,
      amountApplied: ROUND_2(a.amountApplied),
      remaining: ROUND_2(a.remaining),
    })),
    advanceDeducted: ROUND_2(advanceDeducted),
    totalDeductions: ROUND_2(totalDeductions),
    netPay: ROUND_2(netPay),
    carriedForward: carriedForward.map((c) => ({
      advanceId: c.advanceId,
      remaining: ROUND_2(c.remaining),
    })),
  }
}

// --- helpers --------------------------------------------------------------

function computeDaysPayable(input: PayslipInput): number {
  // Period bounds in UTC (calendar days; @db.Date round-trips at UTC midnight
  // — same convention as Employees/Attendance/Advances).
  const monthStart = Date.UTC(input.year, input.month - 1, 1)
  const monthEnd = Date.UTC(input.year, input.month - 1, input.daysInMonth)
  const join = input.dateOfJoining.getTime()
  const leave = input.dateOfLeaving ? input.dateOfLeaving.getTime() : Number.POSITIVE_INFINITY

  const periodStart = Math.max(monthStart, join)
  const periodEnd = Math.min(monthEnd, leave)
  if (periodEnd < periodStart) return 0

  // Days are calendar-aligned; we count whole days inclusive.
  const ms = periodEnd - periodStart
  return Math.floor(ms / 86_400_000) + 1
}

function zeroOutput(input: PayslipInput): PayslipOutput {
  const fixedDeductionsBreakdown = input.fixedDeductions.map((d) => ({
    name: d.name,
    amount: d.amount,
  }))
  const fixedDeductionsTotal = fixedDeductionsBreakdown.reduce(
    (sum, d) => sum.plus(d.amount),
    ZERO,
  )
  return {
    notEmployed: true,
    daysPayable: 0,
    daysWorked: ZERO,
    basicEarned: ZERO,
    hraEarned: ZERO,
    allowancesBreakdown: [],
    allowancesTotal: ZERO,
    otAmount: ZERO,
    grossEarnings: ZERO,
    // Even when not employed, we surface the fixed deductions for transparency
    // — the service layer decides whether to bother creating a payslip at all.
    fixedDeductionsBreakdown: fixedDeductionsBreakdown.map((d) => ({
      name: d.name,
      amount: ROUND_2(d.amount),
    })),
    fixedDeductionsTotal: ROUND_2(fixedDeductionsTotal),
    advancesApplied: [],
    advanceDeducted: ZERO,
    totalDeductions: ROUND_2(fixedDeductionsTotal),
    netPay: ZERO,
    carriedForward: [],
  }
}
