import { Module } from '@nestjs/common'
import { PayrollController } from './payroll.controller'
import { PayrollService } from './payroll.service'
import { PayslipsController } from './payslips.controller'

@Module({
  controllers: [PayrollController, PayslipsController],
  providers: [PayrollService],
  exports: [PayrollService],
})
export class PayrollModule {}
