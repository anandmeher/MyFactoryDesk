import { Module } from '@nestjs/common'
import { ConfigModule } from '@nestjs/config'
import { APP_GUARD } from '@nestjs/core'
import { AdvancesModule } from './advances/advances.module'
import { AttendanceModule } from './attendance/attendance.module'
import { AuthModule } from './auth/auth.module'
import { JwtAuthGuard } from './auth/guards/jwt-auth.guard'
import { RolesGuard } from './auth/guards/roles.guard'
import { CryptoModule } from './common/crypto/crypto.module'
import { validateEnv } from './config/env.validation'
import { EmployeesModule } from './employees/employees.module'
import { HealthModule } from './health/health.module'
import { PrismaModule } from './prisma/prisma.module'

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, cache: true, validate: validateEnv }),
    PrismaModule,
    CryptoModule,
    AuthModule,
    HealthModule,
    EmployeesModule,
    AttendanceModule,
    AdvancesModule,
  ],
  providers: [
    // Global guards run in order: JWT first (sets req.user), then RolesGuard.
    { provide: APP_GUARD, useClass: JwtAuthGuard },
    { provide: APP_GUARD, useClass: RolesGuard },
  ],
})
export class AppModule {}
