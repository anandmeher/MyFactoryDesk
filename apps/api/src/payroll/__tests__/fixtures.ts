import { Decimal } from 'decimal.js'
import type { PayslipInput } from '../calculator'

const D = (v: string | number) => new Decimal(v)

/**
 * Default `PayslipInput` for a full April 2026 month: 15000 basic + 1500 hra,
 * one 500 allowance (not always-full), one 200 fixed PT deduction, joined
 * before the period, never left, no advances, no OT.
 *
 * Tests use `buildInput(overrides)` and patch only the fields under test —
 * keeps each test's signal-to-noise high.
 */
export function buildInput(overrides: Partial<PayslipInput> = {}): PayslipInput {
  return {
    month: 4,
    year: 2026,
    daysInMonth: 30,
    basicSalary: D('15000'),
    hra: D('1500'),
    allowances: [{ name: 'Travel', amount: D('500'), alwaysFull: false }],
    fixedDeductions: [{ name: 'PT', amount: D('200') }],
    dateOfJoining: new Date('2024-01-01T00:00:00.000Z'),
    dateOfLeaving: null,
    attendance: {
      present: 30,
      halfDay: 0,
      paidLeave: 0,
      unpaidLeave: 0,
      absent: 0,
      holiday: 0,
    },
    overtimeHours: D('0'),
    otMultiplier: D('1.5'),
    advancesScheduled: [],
    ...overrides,
  }
}
