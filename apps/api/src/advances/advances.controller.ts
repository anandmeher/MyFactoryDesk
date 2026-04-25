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
  AdvanceQuery,
  AdvanceQuerySchema,
  AdvanceResponse,
  CreateAdvanceInput,
  CreateAdvanceSchema,
  UpdateAdvanceInput,
  UpdateAdvanceSchema,
} from '@myfactorydesk/shared'
import { Roles } from '../auth/decorators/roles.decorator'
import { ZodPipe } from '../common/pipes/zod.pipe'
import { AdvancesService } from './advances.service'

@ApiTags('advances')
@ApiBearerAuth()
@Controller('advances')
export class AdvancesController {
  constructor(private readonly advances: AdvancesService) {}

  @Post()
  @Roles(Role.OWNER, Role.ACCOUNTANT)
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create advance (OWNER/ACCOUNTANT)' })
  async create(
    @Body(new ZodPipe(CreateAdvanceSchema)) dto: CreateAdvanceInput,
  ): Promise<AdvanceResponse> {
    return this.advances.create(dto)
  }

  @Get()
  @ApiOperation({ summary: 'List advances with filters and pagination' })
  async list(@Query(new ZodPipe(AdvanceQuerySchema)) query: AdvanceQuery) {
    return this.advances.list(query)
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get advance by id' })
  async getOne(@Param('id') id: string): Promise<AdvanceResponse> {
    return this.advances.get(id)
  }

  @Patch(':id')
  @Roles(Role.OWNER, Role.ACCOUNTANT)
  @ApiOperation({ summary: 'Update advance (OWNER/ACCOUNTANT, before deduction)' })
  async update(
    @Param('id') id: string,
    @Body(new ZodPipe(UpdateAdvanceSchema)) dto: UpdateAdvanceInput,
  ): Promise<AdvanceResponse> {
    return this.advances.update(id, dto)
  }

  @Delete(':id')
  @Roles(Role.OWNER)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete advance (OWNER, before deduction)' })
  async remove(@Param('id') id: string): Promise<void> {
    await this.advances.delete(id)
  }
}
