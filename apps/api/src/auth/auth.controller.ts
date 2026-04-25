import { Body, Controller, HttpCode, HttpStatus, Post } from '@nestjs/common'
import { ApiBody, ApiOperation, ApiTags } from '@nestjs/swagger'
import {
  AuthResponse,
  LoginInput,
  LoginSchema,
  LogoutInput,
  LogoutSchema,
  RefreshTokenInput,
  RefreshTokenSchema,
} from '@myfactorydesk/shared'
import { ZodPipe } from '../common/pipes/zod.pipe'
import { AuthService } from './auth.service'
import { Public } from './decorators/public.decorator'

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly auth: AuthService) {}

  @Public()
  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Login with phone and password' })
  @ApiBody({ schema: { type: 'object', properties: { phone: { type: 'string' }, password: { type: 'string' } } } })
  async login(@Body(new ZodPipe(LoginSchema)) dto: LoginInput): Promise<AuthResponse> {
    return this.auth.login(dto.phone, dto.password)
  }

  @Public()
  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Rotate the refresh token; returns a new pair' })
  async refresh(@Body(new ZodPipe(RefreshTokenSchema)) dto: RefreshTokenInput): Promise<AuthResponse> {
    return this.auth.refresh(dto.refreshToken)
  }

  @Public()
  @Post('logout')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Revoke the given refresh token (idempotent)' })
  async logout(@Body(new ZodPipe(LogoutSchema)) dto: LogoutInput): Promise<void> {
    await this.auth.logout(dto.refreshToken)
  }
}
