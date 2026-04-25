import { Body, Controller, Get, HttpCode, HttpStatus, Post, Query } from '@nestjs/common'
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger'
import { Role } from '@prisma/client'
import {
  AttendanceQuery,
  AttendanceQuerySchema,
  AttendanceSummaryQuery,
  AttendanceSummaryQuerySchema,
  BulkMarkAttendanceInput,
  BulkMarkAttendanceSchema,
} from '@myfactorydesk/shared'
import { Roles } from '../auth/decorators/roles.decorator'
import { ZodPipe } from '../common/pipes/zod.pipe'
import { AttendanceService } from './attendance.service'

@ApiTags('attendance')
@ApiBearerAuth()
@Controller('attendance')
export class AttendanceController {
  constructor(private readonly attendance: AttendanceService) {}

  @Post('bulk')
  @Roles(Role.OWNER, Role.MANAGER)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Bulk mark attendance for one date (OWNER/MANAGER)' })
  async bulkMark(
    @Body(new ZodPipe(BulkMarkAttendanceSchema)) dto: BulkMarkAttendanceInput,
  ) {
    return this.attendance.bulkMark(dto)
  }

  @Get()
  @ApiOperation({ summary: 'List attendance rows in a date range' })
  async list(@Query(new ZodPipe(AttendanceQuerySchema)) query: AttendanceQuery) {
    return this.attendance.list(query)
  }

  @Get('summary')
  @ApiOperation({ summary: 'Monthly attendance summary per active employee' })
  async summary(
    @Query(new ZodPipe(AttendanceSummaryQuerySchema)) query: AttendanceSummaryQuery,
  ) {
    return this.attendance.summary(query)
  }
}
