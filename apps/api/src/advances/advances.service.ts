import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common'
import { Prisma, type Advance } from '@prisma/client'
import type {
  AdvanceQuery,
  AdvanceResponse,
  CreateAdvanceInput,
  UpdateAdvanceInput,
} from '@myfactorydesk/shared'
import { PrismaService } from '../prisma/prisma.service'

type ListResult = {
  data: AdvanceResponse[]
  meta: { total: number; page: number; pageSize: number; totalPages: number }
}

@Injectable()
export class AdvancesService {
  constructor(private readonly prisma: PrismaService) {}

  async create(input: CreateAdvanceInput): Promise<AdvanceResponse> {
    const employee = await this.prisma.employee.findUnique({
      where: { id: input.employeeId },
      select: { id: true },
    })
    if (!employee) {
      throw new BadRequestException({
        code: 'VALIDATION_ERROR',
        message: 'Unknown employeeId',
        details: { employeeId: input.employeeId },
      })
    }

    const created = await this.prisma.advance.create({
      data: {
        employeeId: input.employeeId,
        amount: new Prisma.Decimal(input.amount),
        date: this.toDate(input.date),
        deductionMonth: input.deductionMonth,
        deductionYear: input.deductionYear,
        remarks: input.remarks ?? null,
      },
    })
    return this.toResponse(created)
  }

  async list(query: AdvanceQuery): Promise<ListResult> {
    const where: Prisma.AdvanceWhereInput = {}
    if (query.employeeId) where.employeeId = query.employeeId
    if (query.deductionMonth !== undefined) where.deductionMonth = query.deductionMonth
    if (query.deductionYear !== undefined) where.deductionYear = query.deductionYear
    if (query.isDeducted !== undefined) where.isDeducted = query.isDeducted

    const skip = (query.page - 1) * query.pageSize
    const [total, rows] = await this.prisma.$transaction([
      this.prisma.advance.count({ where }),
      this.prisma.advance.findMany({
        where,
        orderBy: [{ date: 'desc' }, { id: 'desc' }],
        skip,
        take: query.pageSize,
      }),
    ])

    return {
      data: rows.map((r) => this.toResponse(r)),
      meta: {
        total,
        page: query.page,
        pageSize: query.pageSize,
        totalPages: Math.max(1, Math.ceil(total / query.pageSize)),
      },
    }
  }

  async get(id: string): Promise<AdvanceResponse> {
    const row = await this.prisma.advance.findUnique({ where: { id } })
    if (!row) throw new NotFoundException({ code: 'NOT_FOUND', message: `Advance ${id} not found` })
    return this.toResponse(row)
  }

  async update(id: string, input: UpdateAdvanceInput): Promise<AdvanceResponse> {
    const existing = await this.prisma.advance.findUnique({ where: { id } })
    if (!existing) {
      throw new NotFoundException({ code: 'NOT_FOUND', message: `Advance ${id} not found` })
    }
    this.assertEditable(existing)

    const data: Prisma.AdvanceUpdateInput = {}
    if (input.employeeId !== undefined) {
      const employee = await this.prisma.employee.findUnique({
        where: { id: input.employeeId },
        select: { id: true },
      })
      if (!employee) {
        throw new BadRequestException({
          code: 'VALIDATION_ERROR',
          message: 'Unknown employeeId',
          details: { employeeId: input.employeeId },
        })
      }
      data.employee = { connect: { id: input.employeeId } }
    }
    if (input.amount !== undefined) data.amount = new Prisma.Decimal(input.amount)
    if (input.date !== undefined) data.date = this.toDate(input.date)
    if (input.deductionMonth !== undefined) data.deductionMonth = input.deductionMonth
    if (input.deductionYear !== undefined) data.deductionYear = input.deductionYear
    if (input.remarks !== undefined) data.remarks = input.remarks ?? null

    const row = await this.prisma.advance.update({ where: { id }, data })
    return this.toResponse(row)
  }

  async delete(id: string): Promise<void> {
    const existing = await this.prisma.advance.findUnique({ where: { id } })
    if (!existing) {
      throw new NotFoundException({ code: 'NOT_FOUND', message: `Advance ${id} not found` })
    }
    this.assertEditable(existing)
    await this.prisma.advance.delete({ where: { id } })
  }

  // --- helpers -------------------------------------------------------------

  private assertEditable(row: Advance): void {
    if (row.isDeducted || row.payrollRunId) {
      throw new ConflictException({
        code: 'ADVANCE_LOCKED',
        message: 'Advance is locked because it has been linked to a finalized payslip',
      })
    }
  }

  private toDate(yyyyMmDd: string): Date {
    return new Date(`${yyyyMmDd}T00:00:00.000Z`)
  }

  private fromDate(d: Date): string {
    return d.toISOString().slice(0, 10)
  }

  private toResponse(row: Advance): AdvanceResponse {
    return {
      id: row.id,
      employeeId: row.employeeId,
      amount: row.amount.toFixed(2),
      date: this.fromDate(row.date),
      deductionMonth: row.deductionMonth,
      deductionYear: row.deductionYear,
      remarks: row.remarks,
      isDeducted: row.isDeducted,
      payrollRunId: row.payrollRunId,
      replacesAdvanceId: row.replacesAdvanceId,
      createdAt: row.createdAt.toISOString(),
      updatedAt: row.updatedAt.toISOString(),
    }
  }
}
