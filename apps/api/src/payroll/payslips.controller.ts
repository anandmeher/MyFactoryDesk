import { Controller, Get, Param } from '@nestjs/common'
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger'
import { PayrollService } from './payroll.service'

@ApiTags('payslips')
@ApiBearerAuth()
@Controller('payslips')
export class PayslipsController {
  constructor(private readonly payroll: PayrollService) {}

  @Get(':id')
  @ApiOperation({ summary: 'Get a single payslip with full breakdown' })
  async getOne(@Param('id') id: string) {
    return this.payroll.getPayslip(id)
  }
}
