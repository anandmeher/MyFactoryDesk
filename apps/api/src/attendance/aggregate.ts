import { Prisma } from '@prisma/client'
import type { AttendanceStatus } from '@prisma/client'
import type { AttendanceSummaryRow } from '@myfactorydesk/shared'

export type SummaryEmployee = { id: string; empCode: string; name: string }
export type SummaryRow = {
  employeeId: string
  status: AttendanceStatus
  overtimeHours: Prisma.Decimal
}

/**
 * Pure aggregator: given the active employees and the raw attendance rows for a
 * month, return one summary row per employee (with zeros for employees that
 * have no attendance rows). Decoupled from Prisma so it is trivially unit-testable.
 */
export function aggregateMonthlySummary(
  employees: SummaryEmployee[],
  rows: SummaryRow[],
): AttendanceSummaryRow[] {
  const ot = new Map<string, Prisma.Decimal>()
  const out = new Map<string, AttendanceSummaryRow>()

  for (const e of employees) {
    out.set(e.id, {
      employeeId: e.id,
      empCode: e.empCode,
      name: e.name,
      present: 0,
      halfDay: 0,
      paidLeave: 0,
      unpaidLeave: 0,
      absent: 0,
      holiday: 0,
      overtimeHours: '0.00',
    })
    ot.set(e.id, new Prisma.Decimal(0))
  }

  for (const row of rows) {
    const summary = out.get(row.employeeId)
    if (!summary) continue // soft-deleted/unknown employee — drop silently
    switch (row.status) {
      case 'PRESENT':
        summary.present += 1
        break
      case 'HALF_DAY':
        summary.halfDay += 1
        break
      case 'PAID_LEAVE':
        summary.paidLeave += 1
        break
      case 'UNPAID_LEAVE':
        summary.unpaidLeave += 1
        break
      case 'ABSENT':
        summary.absent += 1
        break
      case 'HOLIDAY':
        summary.holiday += 1
        break
    }
    ot.set(row.employeeId, ot.get(row.employeeId)!.plus(row.overtimeHours))
  }

  for (const [id, total] of ot.entries()) {
    out.get(id)!.overtimeHours = total.toFixed(2)
  }

  return Array.from(out.values())
}

/**
 * Resolve the inclusive `[start, endExclusive)` UTC date range that covers a
 * given (year, month) interpreted in IST. `Attendance.date` is stored as
 * `@db.Date` anchored at UTC midnight of the calendar day (see
 * employees.service.ts toDate helper) — so a UTC range works for `@db.Date`
 * comparisons regardless of the server's TZ.
 */
export function monthRangeUtc(year: number, month: number): { start: Date; endExclusive: Date } {
  // Days in month, leap-year aware. Pure arithmetic, no `new Date()` for clock time.
  const daysInMonth = new Date(Date.UTC(year, month, 0)).getUTCDate()
  const start = new Date(Date.UTC(year, month - 1, 1))
  const endExclusive = new Date(Date.UTC(year, month - 1, daysInMonth + 1))
  return { start, endExclusive }
}
