import {
  ConflictException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common'
import { Prisma, type Employee } from '@prisma/client'
import type {
  Allowance,
  CreateEmployeeInput,
  EmployeeResponse,
  FixedDeduction,
  UpdateEmployeeInput,
} from '@myfactorydesk/shared'
import { formatInTimeZone } from 'date-fns-tz'
import { CryptoService } from '../common/crypto/crypto.service'
import { PrismaService } from '../prisma/prisma.service'
import { buildEmpCode, currentISTYear, parseEmpCodeSequence } from './emp-code'
import { maskTail } from './pii'

const IST = 'Asia/Kolkata'

type ListResult = {
  data: EmployeeResponse[]
  meta: { total: number; page: number; pageSize: number; totalPages: number }
}

@Injectable()
export class EmployeesService {
  private readonly logger = new Logger(EmployeesService.name)

  constructor(
    private readonly prisma: PrismaService,
    private readonly crypto: CryptoService,
  ) {}

  async create(input: CreateEmployeeInput): Promise<EmployeeResponse> {
    return this.prisma.$transaction(async (tx) => {
      const empCode = input.empCode ?? (await this.nextEmpCode(tx))

      try {
        const created = await tx.employee.create({
          data: {
            empCode,
            name: input.name,
            phone: input.phone,
            designation: input.designation,
            dateOfJoining: this.toDate(input.dateOfJoining),
            dateOfLeaving: input.dateOfLeaving ? this.toDate(input.dateOfLeaving) : null,
            salaryType: input.salaryType,
            basicSalary: new Prisma.Decimal(input.basicSalary),
            hra: new Prisma.Decimal(input.hra),
            allowances: input.allowances as unknown as Prisma.InputJsonValue,
            fixedDeductions: input.fixedDeductions as unknown as Prisma.InputJsonValue,
            panEncrypted: input.pan ? this.crypto.encrypt(input.pan) : null,
            aadhaarEncrypted: input.aadhaar ? this.crypto.encrypt(input.aadhaar) : null,
          },
        })
        return this.toResponse(created, false)
      } catch (e) {
        if (this.isUniqueViolation(e, 'empCode')) {
          throw new ConflictException({
            code: 'EMP_CODE_EXISTS',
            message: `empCode ${empCode} already exists`,
          })
        }
        throw e
      }
    })
  }

  async list(query: {
    page: number
    pageSize: number
    search?: string
    active: boolean
  }): Promise<ListResult> {
    const where: Prisma.EmployeeWhereInput = {
      isActive: query.active,
    }
    if (query.search) {
      where.OR = [
        { name: { contains: query.search, mode: 'insensitive' } },
        { empCode: { contains: query.search, mode: 'insensitive' } },
      ]
    }

    const skip = (query.page - 1) * query.pageSize
    const [total, rows] = await this.prisma.$transaction([
      this.prisma.employee.count({ where }),
      this.prisma.employee.findMany({
        where,
        orderBy: [{ isActive: 'desc' }, { empCode: 'asc' }],
        skip,
        take: query.pageSize,
      }),
    ])

    return {
      data: rows.map((row) => this.toResponse(row, false)),
      meta: {
        total,
        page: query.page,
        pageSize: query.pageSize,
        totalPages: Math.max(1, Math.ceil(total / query.pageSize)),
      },
    }
  }

  async get(id: string, includePii: boolean): Promise<EmployeeResponse> {
    const row = await this.prisma.employee.findUnique({ where: { id } })
    if (!row) {
      throw new NotFoundException({ code: 'NOT_FOUND', message: `Employee ${id} not found` })
    }
    if (includePii) {
      // Audit access without leaking the value itself.
      this.logger.log(`PII access: employee=${row.id} empCode=${row.empCode}`)
    }
    return this.toResponse(row, includePii)
  }

  async update(id: string, input: UpdateEmployeeInput): Promise<EmployeeResponse> {
    const existing = await this.prisma.employee.findUnique({ where: { id } })
    if (!existing) {
      throw new NotFoundException({ code: 'NOT_FOUND', message: `Employee ${id} not found` })
    }

    const data: Prisma.EmployeeUpdateInput = {}
    if (input.name !== undefined) data.name = input.name
    if (input.phone !== undefined) data.phone = input.phone
    if (input.empCode !== undefined) data.empCode = input.empCode
    if (input.designation !== undefined) data.designation = input.designation
    if (input.dateOfJoining !== undefined) data.dateOfJoining = this.toDate(input.dateOfJoining)
    if (input.dateOfLeaving !== undefined) {
      data.dateOfLeaving = input.dateOfLeaving ? this.toDate(input.dateOfLeaving) : null
    }
    if (input.salaryType !== undefined) data.salaryType = input.salaryType
    if (input.basicSalary !== undefined) data.basicSalary = new Prisma.Decimal(input.basicSalary)
    if (input.hra !== undefined) data.hra = new Prisma.Decimal(input.hra)
    if (input.allowances !== undefined) {
      data.allowances = input.allowances as unknown as Prisma.InputJsonValue
    }
    if (input.fixedDeductions !== undefined) {
      data.fixedDeductions = input.fixedDeductions as unknown as Prisma.InputJsonValue
    }
    if (input.pan !== undefined) {
      data.panEncrypted = input.pan === null ? null : this.crypto.encrypt(input.pan)
    }
    if (input.aadhaar !== undefined) {
      data.aadhaarEncrypted = input.aadhaar === null ? null : this.crypto.encrypt(input.aadhaar)
    }

    try {
      const row = await this.prisma.employee.update({ where: { id }, data })
      return this.toResponse(row, false)
    } catch (e) {
      if (this.isUniqueViolation(e, 'empCode')) {
        throw new ConflictException({
          code: 'EMP_CODE_EXISTS',
          message: `empCode already exists`,
        })
      }
      throw e
    }
  }

  async softDelete(id: string): Promise<EmployeeResponse> {
    const existing = await this.prisma.employee.findUnique({ where: { id } })
    if (!existing) {
      throw new NotFoundException({ code: 'NOT_FOUND', message: `Employee ${id} not found` })
    }
    const todayIST = formatInTimeZone(new Date(), IST, 'yyyy-MM-dd')
    const row = await this.prisma.employee.update({
      where: { id },
      data: {
        isActive: false,
        dateOfLeaving: this.toDate(todayIST),
      },
    })
    return this.toResponse(row, false)
  }

  // --- helpers -------------------------------------------------------------

  private async nextEmpCode(tx: Prisma.TransactionClient): Promise<string> {
    const year = currentISTYear()
    // Highest sequence used so far this year. Lexical max works because the suffix is fixed-width.
    const last = await tx.employee.findFirst({
      where: { empCode: { startsWith: `EMP${year}` } },
      orderBy: { empCode: 'desc' },
      select: { empCode: true },
    })
    const lastSeq = last ? parseEmpCodeSequence(last.empCode, year) ?? 0 : 0
    return buildEmpCode(year, lastSeq + 1)
  }

  private toDate(yyyyMmDd: string): Date {
    // Calendar dates (`@db.Date`) are stored without a time component.
    // Anchor at UTC midnight of the same calendar day so Prisma round-trips
    // the day cleanly regardless of the connection's session timezone.
    return new Date(`${yyyyMmDd}T00:00:00.000Z`)
  }

  private fromDate(d: Date): string {
    // Round-trip partner of toDate: read the UTC calendar day directly.
    return d.toISOString().slice(0, 10)
  }

  private toResponse(row: Employee, includePii: boolean): EmployeeResponse {
    const dateOfJoining = this.fromDate(row.dateOfJoining)
    const dateOfLeaving = row.dateOfLeaving ? this.fromDate(row.dateOfLeaving) : null

    return {
      id: row.id,
      empCode: row.empCode,
      name: row.name,
      phone: row.phone,
      designation: row.designation,
      dateOfJoining,
      dateOfLeaving,
      salaryType: row.salaryType,
      basicSalary: row.basicSalary.toFixed(2),
      hra: row.hra.toFixed(2),
      allowances: (row.allowances as unknown as Allowance[]) ?? [],
      fixedDeductions: (row.fixedDeductions as unknown as FixedDeduction[]) ?? [],
      pan: this.formatPii(row.panEncrypted, includePii),
      aadhaar: this.formatPii(row.aadhaarEncrypted, includePii),
      isActive: row.isActive,
      createdAt: row.createdAt.toISOString(),
      updatedAt: row.updatedAt.toISOString(),
    }
  }

  private formatPii(encrypted: string | null, includePii: boolean): string | null {
    if (!encrypted) return null
    const plain = this.crypto.decrypt(encrypted)
    return includePii ? plain : maskTail(plain)
  }

  private isUniqueViolation(e: unknown, field: string): boolean {
    if (!(e instanceof Prisma.PrismaClientKnownRequestError)) return false
    if (e.code !== 'P2002') return false
    const target = (e.meta?.target as string[] | string | undefined) ?? []
    return Array.isArray(target) ? target.includes(field) : target === field
  }
}
