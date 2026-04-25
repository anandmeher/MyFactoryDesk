import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Query,
  Res,
} from '@nestjs/common'
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger'
import { Role } from '@prisma/client'
import {
  CreatePayrollRunInput,
  CreatePayrollRunSchema,
} from '@myfactorydesk/shared'
import { z } from 'zod'
import type { Response } from 'express'
import { Roles } from '../auth/decorators/roles.decorator'
import { ZodPipe } from '../common/pipes/zod.pipe'
import { PayrollService } from './payroll.service'

const RunListQuery = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
})

@ApiTags('payroll')
@ApiBearerAuth()
@Controller('payroll')
export class PayrollController {
  constructor(private readonly payroll: PayrollService) {}

  @Post('runs')
  @Roles(Role.OWNER, Role.ACCOUNTANT)
  @ApiOperation({ summary: 'Create or fetch DRAFT run for (year, month). Idempotent.' })
  async createRun(
    @Body(new ZodPipe(CreatePayrollRunSchema)) dto: CreatePayrollRunInput,
    @Res({ passthrough: true }) res: Response,
  ) {
    const { run, created } = await this.payroll.createDraft(dto)
    res.status(created ? HttpStatus.CREATED : HttpStatus.OK)
    return run
  }

  @Get('runs')
  @ApiOperation({ summary: 'List runs (year DESC, month DESC), paginated' })
  async listRuns(@Query(new ZodPipe(RunListQuery)) query: z.infer<typeof RunListQuery>) {
    return this.payroll.list(query)
  }

  @Get('runs/:id')
  @ApiOperation({ summary: 'Get run by id' })
  async getRun(@Param('id') id: string) {
    return this.payroll.getOne(id)
  }

  @Get('runs/:id/preview')
  @ApiOperation({ summary: 'Preview payslips: live for DRAFT, frozen for FINALIZED/PAID' })
  async previewRun(@Param('id') id: string) {
    return this.payroll.preview(id)
  }

  @Post('runs/:id/finalize')
  @Roles(Role.OWNER)
  @ApiOperation({ summary: 'Finalize the run (OWNER only). DRAFT → FINALIZED. Atomic.' })
  async finalize(@Param('id') id: string) {
    return this.payroll.finalize(id)
  }

  @Post('runs/:id/mark-paid')
  @Roles(Role.OWNER, Role.ACCOUNTANT)
  @ApiOperation({ summary: 'FINALIZED → PAID (OWNER/ACCOUNTANT)' })
  async markPaid(@Param('id') id: string) {
    return this.payroll.markPaid(id)
  }
}
