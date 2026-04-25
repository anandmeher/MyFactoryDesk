import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  Query,
} from '@nestjs/common'
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger'
import { Role } from '@prisma/client'
import {
  CreateEmployeeInput,
  CreateEmployeeSchema,
  EmployeeListQuery,
  EmployeeListQuerySchema,
  EmployeeResponse,
  UpdateEmployeeInput,
  UpdateEmployeeSchema,
} from '@myfactorydesk/shared'
import { z } from 'zod'
import { CurrentUser } from '../auth/decorators/current-user.decorator'
import { Roles } from '../auth/decorators/roles.decorator'
import type { AuthUser } from '../auth/types'
import { ZodPipe } from '../common/pipes/zod.pipe'
import { EmployeesService } from './employees.service'

const IncludePiiQuerySchema = z.object({
  includePii: z
    .union([z.boolean(), z.enum(['true', 'false'])])
    .transform((v) => (typeof v === 'boolean' ? v : v === 'true'))
    .default(false),
})

@ApiTags('employees')
@ApiBearerAuth()
@Controller('employees')
export class EmployeesController {
  constructor(private readonly employees: EmployeesService) {}

  @Post()
  @Roles(Role.OWNER, Role.MANAGER)
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create employee (OWNER/MANAGER)' })
  async create(
    @Body(new ZodPipe(CreateEmployeeSchema)) dto: CreateEmployeeInput,
  ): Promise<EmployeeResponse> {
    return this.employees.create(dto)
  }

  @Get()
  @ApiOperation({ summary: 'List employees with search, filter, pagination' })
  async list(
    @Query(new ZodPipe(EmployeeListQuerySchema)) query: EmployeeListQuery,
  ) {
    return this.employees.list(query)
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get employee detail; OWNER may pass ?includePii=true' })
  async getOne(
    @Param('id') id: string,
    @Query(new ZodPipe(IncludePiiQuerySchema)) query: { includePii: boolean },
    @CurrentUser() user: AuthUser,
  ): Promise<EmployeeResponse> {
    const allow = query.includePii && user.role === Role.OWNER
    return this.employees.get(id, allow)
  }

  @Patch(':id')
  @Roles(Role.OWNER, Role.MANAGER)
  @ApiOperation({ summary: 'Update employee (OWNER/MANAGER)' })
  async update(
    @Param('id') id: string,
    @Body(new ZodPipe(UpdateEmployeeSchema)) dto: UpdateEmployeeInput,
  ): Promise<EmployeeResponse> {
    return this.employees.update(id, dto)
  }

  @Delete(':id')
  @Roles(Role.OWNER)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Soft-delete employee (OWNER only)' })
  async remove(@Param('id') id: string): Promise<EmployeeResponse> {
    return this.employees.softDelete(id)
  }
}
