import { Module } from '@nestjs/common'
import { PayrollController } from './payroll.controller'
import { PayrollService } from './payroll.service'
import { PayslipsController } from './payslips.controller'
import { PdfService } from './pdf.service'

@Module({
  controllers: [PayrollController, PayslipsController],
  providers: [PayrollService, PdfService],
  exports: [PayrollService],
})
export class PayrollModule {}
