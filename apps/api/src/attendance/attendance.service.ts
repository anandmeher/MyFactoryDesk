import { BadRequestException, Injectable } from '@nestjs/common'
import { Prisma, type Attendance } from '@prisma/client'
import type {
  AttendanceMark,
  AttendanceQuery,
  AttendanceResponse,
  AttendanceSummaryQuery,
  AttendanceSummaryRow,
  BulkMarkAttendanceInput,
} from '@myfactorydesk/shared'
import { PrismaService } from '../prisma/prisma.service'
import { aggregateMonthlySummary, monthRangeUtc, type SummaryRow } from './aggregate'

@Injectable()
export class AttendanceService {
  constructor(private readonly prisma: PrismaService) {}

  async bulkMark(input: BulkMarkAttendanceInput): Promise<{ count: number }> {
    const date = this.toDate(input.date)
    const employeeIds = Array.from(new Set(input.marks.map((m) => m.employeeId)))
    if (employeeIds.length !== input.marks.length) {
      throw new BadRequestException({
        code: 'VALIDATION_ERROR',
        message: 'Duplicate employeeId in marks',
      })
    }

    // Verify every referenced employee exists; the unique upsert will succeed
    // even for unknown ids (Prisma treats them as inserts), so we pre-validate.
    const found = await this.prisma.employee.findMany({
      where: { id: { in: employeeIds } },
      select: { id: true },
    })
    if (found.length !== employeeIds.length) {
      const known = new Set(found.map((r) => r.id))
      const missing = employeeIds.filter((id) => !known.has(id))
      throw new BadRequestException({
        code: 'VALIDATION_ERROR',
        message: 'Unknown employeeId(s) in marks',
        details: { missing },
      })
    }

    const writes = input.marks.map((mark) => this.upsertMark(mark, date))
    const written = await this.prisma.$transaction(writes)
    return { count: written.length }
  }

  async list(query: AttendanceQuery): Promise<AttendanceResponse[]> {
    const where: Prisma.AttendanceWhereInput = {
      date: { gte: this.toDate(query.from), lte: this.toDate(query.to) },
    }
    if (query.employeeId) where.employeeId = query.employeeId

    const rows = await this.prisma.attendance.findMany({
      where,
      orderBy: [{ date: 'asc' }, { employeeId: 'asc' }],
    })
    return rows.map((row) => this.toResponse(row))
  }

  async summary(query: AttendanceSummaryQuery): Promise<AttendanceSummaryRow[]> {
    const { start, endExclusive } = monthRangeUtc(query.year, query.month)

    const [employees, rows] = await this.prisma.$transaction([
      this.prisma.employee.findMany({
        where: { isActive: true },
        select: { id: true, empCode: true, name: true },
        orderBy: { empCode: 'asc' },
      }),
      this.prisma.attendance.findMany({
        where: { date: { gte: start, lt: endExclusive } },
        select: { employeeId: true, status: true, overtimeHours: true },
      }),
    ])

    return aggregateMonthlySummary(employees, rows as SummaryRow[])
  }

  // --- helpers -------------------------------------------------------------

  private upsertMark(mark: AttendanceMark, date: Date) {
    const overtimeHours = mark.overtimeHours
      ? new Prisma.Decimal(mark.overtimeHours)
      : new Prisma.Decimal(0)
    const remarks = mark.remarks ?? null
    return this.prisma.attendance.upsert({
      where: { employeeId_date: { employeeId: mark.employeeId, date } },
      create: {
        employeeId: mark.employeeId,
        date,
        status: mark.status,
        overtimeHours,
        remarks,
      },
      update: {
        status: mark.status,
        overtimeHours,
        remarks,
      },
    })
  }

  private toDate(yyyyMmDd: string): Date {
    // Same convention as EmployeesService: anchor `@db.Date` columns at UTC
    // midnight of the calendar day so round-trip is timezone-independent.
    return new Date(`${yyyyMmDd}T00:00:00.000Z`)
  }

  private fromDate(d: Date): string {
    return d.toISOString().slice(0, 10)
  }

  private toResponse(row: Attendance): AttendanceResponse {
    return {
      id: row.id,
      employeeId: row.employeeId,
      date: this.fromDate(row.date),
      status: row.status,
      overtimeHours: row.overtimeHours.toFixed(2),
      remarks: row.remarks,
      createdAt: row.createdAt.toISOString(),
      updatedAt: row.updatedAt.toISOString(),
    }
  }
}
