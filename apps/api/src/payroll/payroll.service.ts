import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import {
  Prisma,
  type Advance,
  type Attendance,
  type Employee,
  type PayrollRun,
  type Payslip,
} from '@prisma/client'
import type {
  PayrollPreview,
  PayrollRunResponse,
  PayslipResponse,
} from '@myfactorydesk/shared'
import { Decimal as DecimalJs } from 'decimal.js'
import { PrismaService } from '../prisma/prisma.service'
import type { Env } from '../config/env.validation'
import { CALCULATOR_VERSION, calculatePayslip, type PayslipInput, type PayslipOutput } from './calculator'
import { renderPayslipHtml } from './payslip-template'
import { PdfService } from './pdf.service'

type AdvanceForCalc = { id: string; amount: DecimalJs; date: Date }

type ListResult = {
  data: PayrollRunResponse[]
  meta: { total: number; page: number; pageSize: number; totalPages: number }
}

@Injectable()
export class PayrollService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly pdf: PdfService,
    private readonly config: ConfigService<Env, true>,
  ) {}

  // --- runs ----------------------------------------------------------------

  async createDraft(input: { month: number; year: number }): Promise<{
    run: PayrollRunResponse
    created: boolean
  }> {
    const existing = await this.prisma.payrollRun.findUnique({
      where: { year_month: { year: input.year, month: input.month } },
    })
    if (existing) {
      return { run: this.runResponse(existing), created: false }
    }
    const created = await this.prisma.payrollRun.create({
      data: { month: input.month, year: input.year, status: 'DRAFT' },
    })
    return { run: this.runResponse(created), created: true }
  }

  async list(query: { page: number; pageSize: number }): Promise<ListResult> {
    const skip = (query.page - 1) * query.pageSize
    const [total, rows] = await this.prisma.$transaction([
      this.prisma.payrollRun.count(),
      this.prisma.payrollRun.findMany({
        orderBy: [{ year: 'desc' }, { month: 'desc' }],
        skip,
        take: query.pageSize,
      }),
    ])
    return {
      data: rows.map((r) => this.runResponse(r)),
      meta: {
        total,
        page: query.page,
        pageSize: query.pageSize,
        totalPages: Math.max(1, Math.ceil(total / query.pageSize)),
      },
    }
  }

  async getOne(runId: string): Promise<PayrollRunResponse> {
    const row = await this.prisma.payrollRun.findUnique({ where: { id: runId } })
    if (!row) {
      throw new NotFoundException({ code: 'NOT_FOUND', message: `Run ${runId} not found` })
    }
    return this.runResponse(row)
  }

  // --- preview / finalize / mark-paid -------------------------------------

  async preview(runId: string): Promise<PayrollPreview> {
    const run = await this.prisma.payrollRun.findUnique({ where: { id: runId } })
    if (!run) {
      throw new NotFoundException({ code: 'NOT_FOUND', message: `Run ${runId} not found` })
    }

    if (run.status === 'DRAFT') {
      const payslips = await this.computePayslipsForRun(run)
      return this.previewResponse(run, payslips)
    }

    const stored = await this.prisma.payslip.findMany({
      where: { payrollRunId: runId },
      include: { employee: { select: { empCode: true, name: true } } },
      orderBy: { employee: { empCode: 'asc' } },
    })
    return this.previewResponse(
      run,
      stored.map((row) => this.frozenPayslipResponse(row, row.employee.empCode, row.employee.name)),
    )
  }

  async finalize(runId: string): Promise<PayrollRunResponse> {
    const run = await this.prisma.payrollRun.findUnique({ where: { id: runId } })
    if (!run) {
      throw new NotFoundException({ code: 'NOT_FOUND', message: `Run ${runId} not found` })
    }
    if (run.status !== 'DRAFT') {
      throw new ConflictException({
        code: 'INVALID_STATE_TRANSITION',
        message: `Cannot finalize a ${run.status} run`,
      })
    }

    const employees = await this.activeEmployeesForPeriod(run.year, run.month)
    const attendance = await this.prisma.attendance.findMany({
      where: this.attendanceWhere(run.year, run.month),
    })
    const advances = await this.prisma.advance.findMany({
      where: {
        deductionMonth: run.month,
        deductionYear: run.year,
        isDeducted: false,
        payrollRunId: null,
      },
      orderBy: [{ date: 'asc' }, { id: 'asc' }],
    })

    const computed = employees.map((emp) => {
      const empAttendance = attendance.filter((a) => a.employeeId === emp.id)
      const empAdvances: AdvanceForCalc[] = advances
        .filter((a) => a.employeeId === emp.id)
        .map((a) => ({ id: a.id, amount: new DecimalJs(a.amount.toString()), date: a.date }))
      const input = this.buildPayslipInput(emp, run.month, run.year, empAttendance, empAdvances)
      const output = calculatePayslip(input)
      return { employee: emp, input, output }
    })

    // Skip not-employed payslips (employee left before/joined after the period)
    const live = computed.filter((c) => !c.output.notEmployed)

    const next = this.nextMonth(run.year, run.month)

    const finalized = await this.prisma.$transaction(async (tx) => {
      // 1. Insert Payslip rows
      for (const { employee, input, output } of live) {
        await tx.payslip.create({
          data: {
            payrollRunId: run.id,
            employeeId: employee.id,
            daysPayable: output.daysPayable,
            daysWorked: new Prisma.Decimal(output.daysWorked.toString()),
            basicEarned: new Prisma.Decimal(output.basicEarned.toString()),
            hraEarned: new Prisma.Decimal(output.hraEarned.toString()),
            allowancesBreakdown: output.allowancesBreakdown.map((a) => ({
              name: a.name,
              amount: a.amount.toFixed(2),
            })) as unknown as Prisma.InputJsonValue,
            allowancesTotal: new Prisma.Decimal(output.allowancesTotal.toString()),
            otAmount: new Prisma.Decimal(output.otAmount.toString()),
            grossEarnings: new Prisma.Decimal(output.grossEarnings.toString()),
            fixedDeductionsBreakdown: output.fixedDeductionsBreakdown.map((d) => ({
              name: d.name,
              amount: d.amount.toFixed(2),
            })) as unknown as Prisma.InputJsonValue,
            fixedDeductionsTotal: new Prisma.Decimal(output.fixedDeductionsTotal.toString()),
            advancesApplied: output.advancesApplied.map((a) => ({
              advanceId: a.id,
              amountApplied: a.amountApplied.toFixed(2),
              remaining: a.remaining.toFixed(2),
            })) as unknown as Prisma.InputJsonValue,
            advanceDeducted: new Prisma.Decimal(output.advanceDeducted.toString()),
            totalDeductions: new Prisma.Decimal(output.totalDeductions.toString()),
            netPay: new Prisma.Decimal(output.netPay.toString()),
            carriedForward: output.carriedForward.map((c) => ({
              advanceId: c.advanceId,
              remaining: c.remaining.toFixed(2),
            })) as unknown as Prisma.InputJsonValue,
            calculatorVersion: CALCULATOR_VERSION,
            inputsJson: this.inputsToJson(input) as unknown as Prisma.InputJsonValue,
          },
        })
      }

      // 2. Process advances: link every scheduled advance for any computed
      //    employee to this run; mark deducted; create carry-forward rows for
      //    the un-applied remainders.
      const seenAdvanceIds = new Set<string>()
      for (const { output } of live) {
        // Applied (fully or partially)
        for (const a of output.advancesApplied) {
          seenAdvanceIds.add(a.id)
          await tx.advance.update({
            where: { id: a.id },
            data: { isDeducted: true, payrollRunId: run.id },
          })
          if (a.remaining.gt(0)) {
            await tx.advance.create({
              data: {
                employeeId: (await tx.advance.findUnique({ where: { id: a.id }, select: { employeeId: true } }))!.employeeId,
                amount: new Prisma.Decimal(a.remaining.toString()),
                date: this.firstOfMonth(next.year, next.month),
                deductionMonth: next.month,
                deductionYear: next.year,
                replacesAdvanceId: a.id,
              },
            })
          }
        }
        // Carry-forward of advances that were never applied (zero gross room)
        for (const c of output.carriedForward) {
          if (seenAdvanceIds.has(c.advanceId)) continue
          seenAdvanceIds.add(c.advanceId)
          const original = await tx.advance.findUnique({ where: { id: c.advanceId } })
          if (!original) continue
          await tx.advance.update({
            where: { id: c.advanceId },
            data: { isDeducted: true, payrollRunId: run.id },
          })
          await tx.advance.create({
            data: {
              employeeId: original.employeeId,
              amount: new Prisma.Decimal(c.remaining.toString()),
              date: this.firstOfMonth(next.year, next.month),
              deductionMonth: next.month,
              deductionYear: next.year,
              replacesAdvanceId: c.advanceId,
            },
          })
        }
      }

      // 3. Update the run itself
      const updated = await tx.payrollRun.update({
        where: { id: run.id },
        data: { status: 'FINALIZED', finalizedAt: new Date() },
      })
      return updated
    })

    return this.runResponse(finalized)
  }

  async markPaid(runId: string): Promise<PayrollRunResponse> {
    const run = await this.prisma.payrollRun.findUnique({ where: { id: runId } })
    if (!run) {
      throw new NotFoundException({ code: 'NOT_FOUND', message: `Run ${runId} not found` })
    }
    if (run.status !== 'FINALIZED') {
      throw new ConflictException({
        code: 'INVALID_STATE_TRANSITION',
        message: `Cannot mark-paid a ${run.status} run`,
      })
    }
    const updated = await this.prisma.payrollRun.update({
      where: { id: runId },
      data: { status: 'PAID', paidAt: new Date() },
    })
    return this.runResponse(updated)
  }

  // --- single payslip ------------------------------------------------------

  async getPayslip(payslipId: string): Promise<PayslipResponse> {
    const row = await this.prisma.payslip.findUnique({
      where: { id: payslipId },
      include: { employee: { select: { empCode: true, name: true } } },
    })
    if (!row) {
      throw new NotFoundException({ code: 'NOT_FOUND', message: `Payslip ${payslipId} not found` })
    }
    return this.frozenPayslipResponse(row, row.employee.empCode, row.employee.name)
  }

  async renderPayslipPdf(payslipId: string): Promise<{ buffer: Buffer; filename: string }> {
    const row = await this.prisma.payslip.findUnique({
      where: { id: payslipId },
      include: {
        employee: true,
        payrollRun: { select: { month: true, year: true, finalizedAt: true } },
      },
    })
    if (!row) {
      throw new NotFoundException({ code: 'NOT_FOUND', message: `Payslip ${payslipId} not found` })
    }

    const payslip = this.frozenPayslipResponse(row, row.employee.empCode, row.employee.name)
    const addressLines = this.config
      .get('COMPANY_ADDRESS', { infer: true })
      .split('|')
      .map((s) => s.trim())
      .filter((s) => s.length > 0)

    const html = renderPayslipHtml({
      payslip,
      run: {
        month: row.payrollRun.month,
        year: row.payrollRun.year,
        finalizedAt: row.payrollRun.finalizedAt ? row.payrollRun.finalizedAt.toISOString() : null,
      },
      employee: {
        empCode: row.employee.empCode,
        name: row.employee.name,
        designation: row.employee.designation,
        dateOfJoining: row.employee.dateOfJoining,
      },
      company: {
        name: this.config.get('COMPANY_NAME', { infer: true }),
        addressLines,
      },
    })

    const buffer = await this.pdf.renderPdf(html)
    const safeName = row.employee.name.replace(/[^a-z0-9]+/gi, '-').replace(/^-|-$/g, '').toLowerCase()
    const filename = `payslip-${safeName || row.employee.empCode}-${row.payrollRun.year}-${String(row.payrollRun.month).padStart(2, '0')}.pdf`
    return { buffer, filename }
  }

  // --- helpers -------------------------------------------------------------

  private async computePayslipsForRun(run: PayrollRun): Promise<PayslipResponse[]> {
    const employees = await this.activeEmployeesForPeriod(run.year, run.month)
    const attendance = await this.prisma.attendance.findMany({
      where: this.attendanceWhere(run.year, run.month),
    })
    const advances = await this.prisma.advance.findMany({
      where: {
        deductionMonth: run.month,
        deductionYear: run.year,
        isDeducted: false,
        payrollRunId: null,
      },
      orderBy: [{ date: 'asc' }, { id: 'asc' }],
    })

    return employees
      .map((emp) => {
        const empAttendance = attendance.filter((a) => a.employeeId === emp.id)
        const empAdvances: AdvanceForCalc[] = advances
          .filter((a) => a.employeeId === emp.id)
          .map((a) => ({ id: a.id, amount: new DecimalJs(a.amount.toString()), date: a.date }))
        const input = this.buildPayslipInput(emp, run.month, run.year, empAttendance, empAdvances)
        const output = calculatePayslip(input)
        return { emp, input, output }
      })
      .filter((c) => !c.output.notEmployed)
      .map(({ emp, output }) => this.computedPayslipResponse(emp, output))
  }

  private async activeEmployeesForPeriod(year: number, month: number): Promise<Employee[]> {
    // "Active" for this period means: still employed at any point during the period.
    // Filter at the calculator boundary: employees that joined after period end OR
    // left before period start get dropped (notEmployed). We over-include here to
    // give the calculator final say.
    return this.prisma.employee.findMany({
      where: {
        OR: [
          { isActive: true },
          { dateOfLeaving: { gte: new Date(Date.UTC(year, month - 1, 1)) } },
        ],
      },
      orderBy: { empCode: 'asc' },
    })
  }

  private attendanceWhere(year: number, month: number): Prisma.AttendanceWhereInput {
    const daysInMonth = new Date(Date.UTC(year, month, 0)).getUTCDate()
    return {
      date: {
        gte: new Date(Date.UTC(year, month - 1, 1)),
        lt: new Date(Date.UTC(year, month - 1, daysInMonth + 1)),
      },
    }
  }

  private buildPayslipInput(
    emp: Employee,
    month: number,
    year: number,
    attendance: Attendance[],
    advancesScheduled: AdvanceForCalc[],
  ): PayslipInput {
    const counts = {
      present: 0,
      halfDay: 0,
      paidLeave: 0,
      unpaidLeave: 0,
      absent: 0,
      holiday: 0,
    }
    let overtimeHours = new DecimalJs(0)
    for (const row of attendance) {
      switch (row.status) {
        case 'PRESENT':
          counts.present += 1
          break
        case 'HALF_DAY':
          counts.halfDay += 1
          break
        case 'PAID_LEAVE':
          counts.paidLeave += 1
          break
        case 'UNPAID_LEAVE':
          counts.unpaidLeave += 1
          break
        case 'ABSENT':
          counts.absent += 1
          break
        case 'HOLIDAY':
          counts.holiday += 1
          break
      }
      overtimeHours = overtimeHours.plus(row.overtimeHours.toString())
    }

    const daysInMonth = new Date(Date.UTC(year, month, 0)).getUTCDate()
    const allowances = (emp.allowances as unknown as Array<{ name: string; amount: string; alwaysFull: boolean }>).map(
      (a) => ({ name: a.name, amount: new DecimalJs(a.amount), alwaysFull: a.alwaysFull }),
    )
    const fixedDeductions = (emp.fixedDeductions as unknown as Array<{ name: string; amount: string }>).map((d) => ({
      name: d.name,
      amount: new DecimalJs(d.amount),
    }))

    return {
      month,
      year,
      daysInMonth,
      basicSalary: new DecimalJs(emp.basicSalary.toString()),
      hra: new DecimalJs(emp.hra.toString()),
      allowances,
      fixedDeductions,
      dateOfJoining: emp.dateOfJoining,
      dateOfLeaving: emp.dateOfLeaving,
      attendance: counts,
      overtimeHours,
      otMultiplier: new DecimalJs('1.5'),
      advancesScheduled,
    }
  }

  private nextMonth(year: number, month: number): { year: number; month: number } {
    if (month === 12) return { year: year + 1, month: 1 }
    return { year, month: month + 1 }
  }

  private firstOfMonth(year: number, month: number): Date {
    return new Date(Date.UTC(year, month - 1, 1))
  }

  private inputsToJson(input: PayslipInput): unknown {
    return {
      month: input.month,
      year: input.year,
      daysInMonth: input.daysInMonth,
      basicSalary: input.basicSalary.toFixed(2),
      hra: input.hra.toFixed(2),
      allowances: input.allowances.map((a) => ({
        name: a.name,
        amount: a.amount.toFixed(2),
        alwaysFull: a.alwaysFull,
      })),
      fixedDeductions: input.fixedDeductions.map((d) => ({
        name: d.name,
        amount: d.amount.toFixed(2),
      })),
      dateOfJoining: input.dateOfJoining.toISOString(),
      dateOfLeaving: input.dateOfLeaving ? input.dateOfLeaving.toISOString() : null,
      attendance: input.attendance,
      overtimeHours: input.overtimeHours.toFixed(2),
      otMultiplier: input.otMultiplier.toFixed(2),
      advancesScheduled: input.advancesScheduled.map((a) => ({
        id: a.id,
        amount: a.amount.toFixed(2),
      })),
    }
  }

  private runResponse(row: PayrollRun): PayrollRunResponse {
    return {
      id: row.id,
      month: row.month,
      year: row.year,
      status: row.status,
      finalizedAt: row.finalizedAt ? row.finalizedAt.toISOString() : null,
      paidAt: row.paidAt ? row.paidAt.toISOString() : null,
      createdAt: row.createdAt.toISOString(),
      updatedAt: row.updatedAt.toISOString(),
    }
  }

  private previewResponse(run: PayrollRun, payslips: PayslipResponse[]): PayrollPreview {
    const sum = payslips.reduce(
      (acc, p) => ({
        gross: acc.gross.plus(p.grossEarnings),
        ded: acc.ded.plus(p.totalDeductions),
        net: acc.net.plus(p.netPay),
      }),
      { gross: new DecimalJs(0), ded: new DecimalJs(0), net: new DecimalJs(0) },
    )
    return {
      runId: run.id,
      month: run.month,
      year: run.year,
      status: run.status,
      payslips,
      totals: {
        grossEarnings: sum.gross.toFixed(2),
        totalDeductions: sum.ded.toFixed(2),
        netPay: sum.net.toFixed(2),
      },
    }
  }

  private computedPayslipResponse(emp: Employee, output: PayslipOutput): PayslipResponse {
    return {
      id: '', // No DB row yet; preview-only
      payrollRunId: '',
      employeeId: emp.id,
      empCode: emp.empCode,
      employeeName: emp.name,
      daysPayable: output.daysPayable,
      daysWorked: output.daysWorked.toFixed(2),
      basicEarned: output.basicEarned.toFixed(2),
      hraEarned: output.hraEarned.toFixed(2),
      allowancesBreakdown: output.allowancesBreakdown.map((a) => ({
        name: a.name,
        amount: a.amount.toFixed(2),
      })),
      allowancesTotal: output.allowancesTotal.toFixed(2),
      otAmount: output.otAmount.toFixed(2),
      grossEarnings: output.grossEarnings.toFixed(2),
      fixedDeductionsBreakdown: output.fixedDeductionsBreakdown.map((d) => ({
        name: d.name,
        amount: d.amount.toFixed(2),
      })),
      fixedDeductionsTotal: output.fixedDeductionsTotal.toFixed(2),
      advancesApplied: output.advancesApplied.map((a) => ({
        advanceId: a.id,
        amountApplied: a.amountApplied.toFixed(2),
        remaining: a.remaining.toFixed(2),
      })),
      advanceDeducted: output.advanceDeducted.toFixed(2),
      totalDeductions: output.totalDeductions.toFixed(2),
      netPay: output.netPay.toFixed(2),
      carriedForward: output.carriedForward.map((c) => ({
        advanceId: c.advanceId,
        remaining: c.remaining.toFixed(2),
      })),
      calculatorVersion: CALCULATOR_VERSION,
      calculatedAt: new Date().toISOString(),
    }
  }

  private frozenPayslipResponse(row: Payslip, empCode: string, employeeName: string): PayslipResponse {
    return {
      id: row.id,
      payrollRunId: row.payrollRunId,
      employeeId: row.employeeId,
      empCode,
      employeeName,
      daysPayable: row.daysPayable,
      daysWorked: row.daysWorked.toFixed(2),
      basicEarned: row.basicEarned.toFixed(2),
      hraEarned: row.hraEarned.toFixed(2),
      allowancesBreakdown: row.allowancesBreakdown as unknown as PayslipResponse['allowancesBreakdown'],
      allowancesTotal: row.allowancesTotal.toFixed(2),
      otAmount: row.otAmount.toFixed(2),
      grossEarnings: row.grossEarnings.toFixed(2),
      fixedDeductionsBreakdown: row.fixedDeductionsBreakdown as unknown as PayslipResponse['fixedDeductionsBreakdown'],
      fixedDeductionsTotal: row.fixedDeductionsTotal.toFixed(2),
      advancesApplied: row.advancesApplied as unknown as PayslipResponse['advancesApplied'],
      advanceDeducted: row.advanceDeducted.toFixed(2),
      totalDeductions: row.totalDeductions.toFixed(2),
      netPay: row.netPay.toFixed(2),
      carriedForward: row.carriedForward as unknown as PayslipResponse['carriedForward'],
      calculatorVersion: row.calculatorVersion,
      calculatedAt: row.calculatedAt.toISOString(),
    }
  }
}
