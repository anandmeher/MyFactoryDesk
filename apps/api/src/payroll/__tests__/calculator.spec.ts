import { Decimal } from 'decimal.js'
import { CALCULATOR_VERSION, calculatePayslip, type PayslipInput } from '../calculator'
import { buildInput } from './fixtures'

const D = (v: string | number) => new Decimal(v)

describe('calculatePayslip — PAYROLL.md test matrix', () => {
  it('exports a CALCULATOR_VERSION string', () => {
    expect(typeof CALCULATOR_VERSION).toBe('string')
    expect(CALCULATOR_VERSION).toMatch(/^v\d+\.\d+\.\d+$/)
  })

  // 1. Full month, all present, no OT, no advance
  it('row 1: full month, all present', () => {
    const out = calculatePayslip(buildInput())
    expect(out.daysPayable).toBe(30)
    expect(out.daysWorked.toFixed(2)).toBe('30.00')
    expect(out.basicEarned.toFixed(2)).toBe('15000.00')
    expect(out.hraEarned.toFixed(2)).toBe('1500.00')
    expect(out.allowancesTotal.toFixed(2)).toBe('500.00')
    expect(out.otAmount.toFixed(2)).toBe('0.00')
    expect(out.grossEarnings.toFixed(2)).toBe('17000.00')
    expect(out.fixedDeductionsTotal.toFixed(2)).toBe('200.00')
    expect(out.advanceDeducted.toFixed(2)).toBe('0.00')
    expect(out.totalDeductions.toFixed(2)).toBe('200.00')
    expect(out.netPay.toFixed(2)).toBe('16800.00')
    expect(out.carriedForward).toEqual([])
  })

  // 2. Joined on the 15th of a 30-day month — full salary across the 16 payable days
  it('row 2: joined on 15th of 30-day month', () => {
    const input = buildInput({
      dateOfJoining: new Date('2026-04-15T00:00:00.000Z'),
      attendance: {
        present: 16,
        halfDay: 0,
        paidLeave: 0,
        unpaidLeave: 0,
        absent: 0,
        holiday: 0,
      },
      fixedDeductions: [],
      allowances: [],
      hra: D('0'),
    })
    const out = calculatePayslip(input)
    expect(out.daysPayable).toBe(16)
    expect(out.daysWorked.toFixed(2)).toBe('16.00')
    // perDay = 15000 / 16 = 937.50; basicEarned = 937.50 * 16 = 15000
    expect(out.basicEarned.toFixed(2)).toBe('15000.00')
    expect(out.netPay.toFixed(2)).toBe('15000.00')
  })

  // 3. Left on the 10th of a 31-day month
  it('row 3: left on 10th of 31-day month', () => {
    const input = buildInput({
      month: 5,
      year: 2026,
      daysInMonth: 31,
      dateOfLeaving: new Date('2026-05-10T00:00:00.000Z'),
      attendance: {
        present: 10,
        halfDay: 0,
        paidLeave: 0,
        unpaidLeave: 0,
        absent: 0,
        holiday: 0,
      },
      fixedDeductions: [],
      allowances: [],
      hra: D('0'),
    })
    const out = calculatePayslip(input)
    expect(out.daysPayable).toBe(10)
    expect(out.daysWorked.toFixed(2)).toBe('10.00')
    expect(out.basicEarned.toFixed(2)).toBe('15000.00')
  })

  // 4. Joined and left in the same month
  it('row 4: joined and left in same month', () => {
    const input = buildInput({
      dateOfJoining: new Date('2026-04-05T00:00:00.000Z'),
      dateOfLeaving: new Date('2026-04-20T00:00:00.000Z'),
      attendance: {
        present: 16,
        halfDay: 0,
        paidLeave: 0,
        unpaidLeave: 0,
        absent: 0,
        holiday: 0,
      },
      fixedDeductions: [],
      allowances: [],
      hra: D('0'),
    })
    const out = calculatePayslip(input)
    // Apr-5 through Apr-20 inclusive = 16 days
    expect(out.daysPayable).toBe(16)
    expect(out.basicEarned.toFixed(2)).toBe('15000.00')
  })

  // 5. All absent — gross zero, fixed deductions still apply, netPay clamped to 0
  it('row 5: all absent (netPay clamped to 0)', () => {
    const input = buildInput({
      attendance: {
        present: 0,
        halfDay: 0,
        paidLeave: 0,
        unpaidLeave: 0,
        absent: 30,
        holiday: 0,
      },
    })
    const out = calculatePayslip(input)
    expect(out.daysWorked.toFixed(2)).toBe('0.00')
    expect(out.basicEarned.toFixed(2)).toBe('0.00')
    expect(out.hraEarned.toFixed(2)).toBe('0.00')
    expect(out.allowancesTotal.toFixed(2)).toBe('0.00')
    expect(out.grossEarnings.toFixed(2)).toBe('0.00')
    expect(out.fixedDeductionsTotal.toFixed(2)).toBe('200.00')
    expect(out.totalDeductions.toFixed(2)).toBe('200.00')
    expect(out.netPay.toFixed(2)).toBe('0.00') // clamped
  })

  // 6. Half-days only (4 half-days = 2 days worked)
  it('row 6: half-days only', () => {
    const input = buildInput({
      attendance: {
        present: 0,
        halfDay: 4,
        paidLeave: 0,
        unpaidLeave: 0,
        absent: 26,
        holiday: 0,
      },
      fixedDeductions: [],
      allowances: [],
      hra: D('0'),
    })
    const out = calculatePayslip(input)
    expect(out.daysWorked.toFixed(2)).toBe('2.00')
    // perDay = 15000/30 = 500. basicEarned = 500 * 2 = 1000
    expect(out.basicEarned.toFixed(2)).toBe('1000.00')
  })

  // 7. Mixed status: present + halfDay + paidLeave + unpaidLeave + absent
  it('row 7: mixed attendance', () => {
    const input = buildInput({
      attendance: {
        present: 10,
        halfDay: 4,
        paidLeave: 2,
        unpaidLeave: 3,
        absent: 11,
        holiday: 0,
      },
      fixedDeductions: [],
      allowances: [],
      hra: D('0'),
    })
    const out = calculatePayslip(input)
    // daysWorked = 10 + 2 + (4 * 0.5) + 0 (holiday) = 14
    expect(out.daysWorked.toFixed(2)).toBe('14.00')
    expect(out.basicEarned.toFixed(2)).toBe('7000.00')
  })

  // 8. Overtime 10h × 1.5x on 15000 monthly basic in 30-day month
  it('row 8: overtime at 1.5x', () => {
    const input = buildInput({
      overtimeHours: D('10'),
      otMultiplier: D('1.5'),
      fixedDeductions: [],
      allowances: [],
      hra: D('0'),
    })
    const out = calculatePayslip(input)
    // OT = 10 × (15000/30/8) × 1.5 = 10 × 62.5 × 1.5 = 937.50
    expect(out.otAmount.toFixed(2)).toBe('937.50')
  })

  // 9. Overtime at 2.0x
  it('row 9: overtime at 2.0x', () => {
    const input = buildInput({
      overtimeHours: D('10'),
      otMultiplier: D('2.0'),
      fixedDeductions: [],
      allowances: [],
      hra: D('0'),
    })
    const out = calculatePayslip(input)
    // OT = 10 × 62.5 × 2.0 = 1250.00
    expect(out.otAmount.toFixed(2)).toBe('1250.00')
  })

  // 10. Advance ₹5000 with gross only ₹3000 → carry forward 2000, netPay = 0
  it('row 10: advance exceeds gross, carry forward', () => {
    const input = buildInput({
      basicSalary: D('3000'),
      hra: D('0'),
      allowances: [],
      fixedDeductions: [],
      advancesScheduled: [{ id: 'adv_1', amount: D('5000') }],
    })
    const out = calculatePayslip(input)
    expect(out.grossEarnings.toFixed(2)).toBe('3000.00')
    expect(out.advanceDeducted.toFixed(2)).toBe('3000.00')
    expect(out.advancesApplied).toHaveLength(1)
    expect(out.advancesApplied[0].id).toBe('adv_1')
    expect(out.advancesApplied[0].amountApplied.toFixed(2)).toBe('3000.00')
    expect(out.advancesApplied[0].remaining.toFixed(2)).toBe('2000.00')
    expect(out.carriedForward).toEqual([
      { advanceId: 'adv_1', remaining: expect.any(Decimal) },
    ])
    expect(out.carriedForward[0].remaining.toFixed(2)).toBe('2000.00')
    expect(out.netPay.toFixed(2)).toBe('0.00')
  })

  // 11. Multiple advances FIFO: earlier applied first, later carries forward
  it('row 11: multiple advances FIFO', () => {
    const input = buildInput({
      basicSalary: D('4000'),
      hra: D('0'),
      allowances: [],
      fixedDeductions: [],
      advancesScheduled: [
        { id: 'adv_old', amount: D('3000') },
        { id: 'adv_new', amount: D('3000') },
      ],
    })
    const out = calculatePayslip(input)
    expect(out.grossEarnings.toFixed(2)).toBe('4000.00')
    // adv_old applied in full (3000), adv_new partially applied (1000)
    expect(out.advancesApplied).toHaveLength(2)
    expect(out.advancesApplied[0].id).toBe('adv_old')
    expect(out.advancesApplied[0].amountApplied.toFixed(2)).toBe('3000.00')
    expect(out.advancesApplied[0].remaining.toFixed(2)).toBe('0.00')
    expect(out.advancesApplied[1].id).toBe('adv_new')
    expect(out.advancesApplied[1].amountApplied.toFixed(2)).toBe('1000.00')
    expect(out.advancesApplied[1].remaining.toFixed(2)).toBe('2000.00')
    expect(out.advanceDeducted.toFixed(2)).toBe('4000.00')
    expect(out.netPay.toFixed(2)).toBe('0.00')
    expect(out.carriedForward).toEqual([
      { advanceId: 'adv_new', remaining: expect.any(Decimal) },
    ])
    expect(out.carriedForward[0].remaining.toFixed(2)).toBe('2000.00')
  })

  // 12. Allowance with alwaysFull: paid in full regardless of daysWorked
  it('row 12: alwaysFull allowance', () => {
    const input = buildInput({
      attendance: {
        present: 15,
        halfDay: 0,
        paidLeave: 0,
        unpaidLeave: 0,
        absent: 15,
        holiday: 0,
      },
      allowances: [{ name: 'Phone', amount: D('1000'), alwaysFull: true }],
      fixedDeductions: [],
      hra: D('0'),
    })
    const out = calculatePayslip(input)
    expect(out.allowancesTotal.toFixed(2)).toBe('1000.00')
    expect(out.allowancesBreakdown).toHaveLength(1)
    expect(out.allowancesBreakdown[0].amount.toFixed(2)).toBe('1000.00')
  })

  // 13. Allowance without alwaysFull: pro-rated by daysWorked / daysPayable
  it('row 13: pro-rated allowance', () => {
    const input = buildInput({
      attendance: {
        present: 15,
        halfDay: 0,
        paidLeave: 0,
        unpaidLeave: 0,
        absent: 15,
        holiday: 0,
      },
      allowances: [{ name: 'Phone', amount: D('1000'), alwaysFull: false }],
      fixedDeductions: [],
      hra: D('0'),
    })
    const out = calculatePayslip(input)
    // allowance = 1000 * (15/30) = 500
    expect(out.allowancesTotal.toFixed(2)).toBe('500.00')
  })

  // 14. Holidays in attendance — paid like worked days, don't reduce pay
  it('row 14: holidays do not reduce pay', () => {
    const input = buildInput({
      attendance: {
        present: 20,
        halfDay: 0,
        paidLeave: 0,
        unpaidLeave: 0,
        absent: 0,
        holiday: 10,
      },
      fixedDeductions: [],
      allowances: [],
      hra: D('0'),
    })
    const out = calculatePayslip(input)
    // daysWorked = 20 + 0 + 10 + 0 = 30 (holidays count as paid)
    expect(out.daysWorked.toFixed(2)).toBe('30.00')
    expect(out.basicEarned.toFixed(2)).toBe('15000.00')
  })

  // 15. February non-leap year (28 days)
  it('row 15: February non-leap (28 days)', () => {
    const input = buildInput({
      month: 2,
      year: 2026,
      daysInMonth: 28,
      basicSalary: D('14000'),
      attendance: {
        present: 28,
        halfDay: 0,
        paidLeave: 0,
        unpaidLeave: 0,
        absent: 0,
        holiday: 0,
      },
      fixedDeductions: [],
      allowances: [],
      hra: D('0'),
    })
    const out = calculatePayslip(input)
    expect(out.daysPayable).toBe(28)
    expect(out.basicEarned.toFixed(2)).toBe('14000.00')
  })

  // 16. February leap year (29 days)
  it('row 16: February leap year (29 days)', () => {
    const input = buildInput({
      month: 2,
      year: 2024,
      daysInMonth: 29,
      basicSalary: D('14500'),
      dateOfJoining: new Date('2020-01-01T00:00:00.000Z'),
      attendance: {
        present: 29,
        halfDay: 0,
        paidLeave: 0,
        unpaidLeave: 0,
        absent: 0,
        holiday: 0,
      },
      fixedDeductions: [],
      allowances: [],
      hra: D('0'),
    })
    const out = calculatePayslip(input)
    expect(out.daysPayable).toBe(29)
    expect(out.basicEarned.toFixed(2)).toBe('14500.00')
  })

  // 17. Zero basic salary — only alwaysFull allowances pay
  it('row 17: zero basic salary, alwaysFull allowance still pays', () => {
    const input = buildInput({
      basicSalary: D('0'),
      hra: D('0'),
      allowances: [{ name: 'Stipend', amount: D('500'), alwaysFull: true }],
      fixedDeductions: [],
    })
    const out = calculatePayslip(input)
    expect(out.basicEarned.toFixed(2)).toBe('0.00')
    expect(out.hraEarned.toFixed(2)).toBe('0.00')
    expect(out.allowancesTotal.toFixed(2)).toBe('500.00')
    expect(out.grossEarnings.toFixed(2)).toBe('500.00')
    expect(out.netPay.toFixed(2)).toBe('500.00')
  })

  // 18. Decimal precision: 1500 / 30 * 22 = 1100.00 exactly
  it('row 18: decimal precision (no float drift)', () => {
    const input = buildInput({
      basicSalary: D('1500'),
      hra: D('0'),
      allowances: [],
      fixedDeductions: [],
      attendance: {
        present: 22,
        halfDay: 0,
        paidLeave: 0,
        unpaidLeave: 0,
        absent: 8,
        holiday: 0,
      },
    })
    const out = calculatePayslip(input)
    expect(out.basicEarned.toFixed(2)).toBe('1100.00')
    expect(out.basicEarned.toFixed(10)).toBe('1100.0000000000')
  })

  // Bonus: notEmployed when daysPayable <= 0 (left before period started)
  it('returns notEmployed when employee left before the period', () => {
    const input: PayslipInput = buildInput({
      dateOfJoining: new Date('2024-01-01T00:00:00.000Z'),
      dateOfLeaving: new Date('2026-03-15T00:00:00.000Z'),
    })
    const out = calculatePayslip(input)
    expect(out.notEmployed).toBe(true)
    expect(out.daysPayable).toBe(0)
    expect(out.netPay.toFixed(2)).toBe('0.00')
    expect(out.grossEarnings.toFixed(2)).toBe('0.00')
  })
})
