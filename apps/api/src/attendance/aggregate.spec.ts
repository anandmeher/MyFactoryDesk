import { Prisma } from '@prisma/client'
import { aggregateMonthlySummary, monthRangeUtc, type SummaryEmployee, type SummaryRow } from './aggregate'

const D = (s: string | number) => new Prisma.Decimal(s)

const E = (id: string, empCode: string, name: string): SummaryEmployee => ({ id, empCode, name })
const R = (employeeId: string, status: SummaryRow['status'], overtimeHours: Prisma.Decimal | string = '0'): SummaryRow => ({
  employeeId,
  status,
  overtimeHours: typeof overtimeHours === 'string' ? D(overtimeHours) : overtimeHours,
})

describe('aggregateMonthlySummary', () => {
  it('returns one zero row per active employee even with no attendance', () => {
    const out = aggregateMonthlySummary(
      [E('e1', 'EMP20260001', 'Alice'), E('e2', 'EMP20260002', 'Bob')],
      [],
    )
    expect(out).toHaveLength(2)
    expect(out[0]).toEqual({
      employeeId: 'e1',
      empCode: 'EMP20260001',
      name: 'Alice',
      present: 0,
      halfDay: 0,
      paidLeave: 0,
      unpaidLeave: 0,
      absent: 0,
      holiday: 0,
      overtimeHours: '0.00',
    })
    expect(out[1].employeeId).toBe('e2')
    expect(out[1].overtimeHours).toBe('0.00')
  })

  it('counts each status correctly', () => {
    const rows: SummaryRow[] = [
      R('e1', 'PRESENT'),
      R('e1', 'PRESENT'),
      R('e1', 'HALF_DAY'),
      R('e1', 'PAID_LEAVE'),
      R('e1', 'UNPAID_LEAVE'),
      R('e1', 'ABSENT'),
      R('e1', 'HOLIDAY'),
      R('e1', 'PRESENT'),
    ]
    const [s] = aggregateMonthlySummary([E('e1', 'EMP1', 'X')], rows)
    expect(s).toMatchObject({
      present: 3,
      halfDay: 1,
      paidLeave: 1,
      unpaidLeave: 1,
      absent: 1,
      holiday: 1,
    })
  })

  it('sums overtime as Decimal with 2-decimal output', () => {
    const rows: SummaryRow[] = [
      R('e1', 'PRESENT', '2.50'),
      R('e1', 'PRESENT', '0.75'),
      R('e1', 'PRESENT', '1.00'),
    ]
    const [s] = aggregateMonthlySummary([E('e1', 'EMP1', 'X')], rows)
    expect(s.overtimeHours).toBe('4.25')
  })

  it('drops attendance rows for unknown employee ids', () => {
    const out = aggregateMonthlySummary(
      [E('e1', 'EMP1', 'X')],
      [R('e1', 'PRESENT'), R('ghost', 'PRESENT')],
    )
    expect(out).toHaveLength(1)
    expect(out[0].present).toBe(1)
  })

  it('preserves employee ordering as given', () => {
    const out = aggregateMonthlySummary(
      [E('e2', 'EMP2', 'B'), E('e1', 'EMP1', 'A')],
      [R('e1', 'PRESENT')],
    )
    expect(out.map((r) => r.employeeId)).toEqual(['e2', 'e1'])
  })
})

describe('monthRangeUtc', () => {
  it('April 2026 spans 2026-04-01 to 2026-05-01 exclusive', () => {
    const { start, endExclusive } = monthRangeUtc(2026, 4)
    expect(start.toISOString()).toBe('2026-04-01T00:00:00.000Z')
    expect(endExclusive.toISOString()).toBe('2026-05-01T00:00:00.000Z')
  })

  it('handles February in a leap year (2024)', () => {
    const { start, endExclusive } = monthRangeUtc(2024, 2)
    expect(start.toISOString()).toBe('2024-02-01T00:00:00.000Z')
    expect(endExclusive.toISOString()).toBe('2024-03-01T00:00:00.000Z')
  })

  it('handles February in a non-leap year (2026)', () => {
    const { start, endExclusive } = monthRangeUtc(2026, 2)
    expect(start.toISOString()).toBe('2026-02-01T00:00:00.000Z')
    expect(endExclusive.toISOString()).toBe('2026-03-01T00:00:00.000Z')
  })

  it('handles December rollover', () => {
    const { start, endExclusive } = monthRangeUtc(2026, 12)
    expect(start.toISOString()).toBe('2026-12-01T00:00:00.000Z')
    expect(endExclusive.toISOString()).toBe('2027-01-01T00:00:00.000Z')
  })
})
