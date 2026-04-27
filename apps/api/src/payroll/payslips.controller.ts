import { Controller, Get, Header, Param, StreamableFile } from '@nestjs/common'
import { ApiBearerAuth, ApiOperation, ApiProduces, ApiTags } from '@nestjs/swagger'
import { Role } from '@prisma/client'
import { Roles } from '../auth/decorators/roles.decorator'
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

  @Get(':id/pdf')
  @Roles(Role.OWNER, Role.MANAGER, Role.ACCOUNTANT, Role.STAFF)
  @ApiOperation({ summary: 'Render payslip as a downloadable PDF' })
  @ApiProduces('application/pdf')
  @Header('Content-Type', 'application/pdf')
  async getPdf(@Param('id') id: string): Promise<StreamableFile> {
    const { buffer, filename } = await this.payroll.renderPayslipPdf(id)
    return new StreamableFile(buffer, {
      type: 'application/pdf',
      disposition: `attachment; filename="${filename}"`,
    })
  }
}
