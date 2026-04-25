import { ConflictException, Injectable, UnauthorizedException } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { JwtService } from '@nestjs/jwt'
import bcrypt from 'bcrypt'
import { createHash, randomBytes } from 'node:crypto'
import { PrismaService } from '../prisma/prisma.service'
import type { Env } from '../config/env.validation'
import type { AuthResponse, AuthUser } from '@myfactorydesk/shared'
import type { JwtPayload } from './types'

const BCRYPT_COST = 12
const REFRESH_BYTES = 48 // 64 base64url chars

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
    private readonly config: ConfigService<Env, true>,
  ) {}

  async hashPassword(password: string): Promise<string> {
    return bcrypt.hash(password, BCRYPT_COST)
  }

  async login(phone: string, password: string): Promise<AuthResponse> {
    const user = await this.prisma.user.findUnique({ where: { phone } })
    if (!user || !user.isActive) {
      // Hash a dummy password so timing matches the success path.
      await bcrypt.compare(password, '$2b$12$invalidinvalidinvalidinvalidinvalidinvalidinvaliduC')
      throw this.invalidCredentials()
    }
    const ok = await bcrypt.compare(password, user.passwordHash)
    if (!ok) throw this.invalidCredentials()

    return this.issueTokens(user)
  }

  async refresh(refreshToken: string): Promise<AuthResponse> {
    const tokenHash = this.hashToken(refreshToken)
    const record = await this.prisma.refreshToken.findUnique({
      where: { tokenHash },
      include: { user: true },
    })
    if (!record) {
      throw new UnauthorizedException({ code: 'INVALID_TOKEN', message: 'Refresh token invalid' })
    }
    if (record.revokedAt) {
      throw new UnauthorizedException({ code: 'INVALID_TOKEN', message: 'Refresh token revoked' })
    }
    if (record.expiresAt.getTime() < Date.now()) {
      throw new UnauthorizedException({ code: 'TOKEN_EXPIRED', message: 'Refresh token expired' })
    }
    if (!record.user.isActive) {
      throw new UnauthorizedException({ code: 'INVALID_TOKEN', message: 'User inactive' })
    }

    // Rotation: revoke the old token, issue a new pair atomically.
    return this.prisma.$transaction(async (tx) => {
      await tx.refreshToken.update({
        where: { id: record.id },
        data: { revokedAt: new Date() },
      })
      return this.issueTokensWithTx(tx, record.user)
    })
  }

  async logout(refreshToken: string): Promise<void> {
    const tokenHash = this.hashToken(refreshToken)
    const record = await this.prisma.refreshToken.findUnique({ where: { tokenHash } })
    if (!record || record.revokedAt) return // idempotent
    await this.prisma.refreshToken.update({
      where: { id: record.id },
      data: { revokedAt: new Date() },
    })
  }

  /** Public for use by seed scripts and tests. */
  async issueTokens(
    user: { id: string; phone: string; name: string; role: AuthUser['role']; employeeId: string | null },
  ): Promise<AuthResponse> {
    return this.issueTokensWithTx(this.prisma, user)
  }

  // --- internals -----------------------------------------------------------

  private async issueTokensWithTx(
    tx: {
      refreshToken: {
        create: (args: {
          data: { userId: string; tokenHash: string; expiresAt: Date }
        }) => Promise<unknown>
      }
    },
    user: { id: string; phone: string; name: string; role: AuthUser['role']; employeeId: string | null },
  ): Promise<AuthResponse> {
    const payload: JwtPayload = { sub: user.id, role: user.role }
    const accessToken = await this.jwt.signAsync(payload, {
      secret: this.config.get('JWT_ACCESS_SECRET', { infer: true }),
      expiresIn: this.config.get('JWT_ACCESS_TTL', { infer: true }),
    })

    // Refresh token is an opaque random string (NOT a JWT) — we only need
    // server-side lookups + revocation, no need for self-contained claims.
    const refreshToken = randomBytes(REFRESH_BYTES).toString('base64url')
    const tokenHash = this.hashToken(refreshToken)
    const expiresAt = new Date(Date.now() + this.parseTtl(this.config.get('JWT_REFRESH_TTL', { infer: true })))

    await tx.refreshToken.create({
      data: { userId: user.id, tokenHash, expiresAt },
    })

    return {
      accessToken,
      refreshToken,
      user: {
        id: user.id,
        phone: user.phone,
        name: user.name,
        role: user.role,
        employeeId: user.employeeId,
      },
    }
  }

  private hashToken(token: string): string {
    return createHash('sha256').update(token).digest('hex')
  }

  private invalidCredentials(): UnauthorizedException {
    return new UnauthorizedException({
      code: 'INVALID_CREDENTIALS',
      message: 'Invalid phone or password',
    })
  }

  /** Parse strings like "15m", "7d", "3600s", "2h" into milliseconds. */
  private parseTtl(ttl: string): number {
    const match = /^(\d+)\s*(ms|s|m|h|d)$/.exec(ttl.trim())
    if (!match) {
      throw new ConflictException({ code: 'CONFIG_ERROR', message: `Invalid TTL: ${ttl}` })
    }
    const n = Number(match[1])
    const unit = match[2]
    const factor =
      unit === 'ms' ? 1
        : unit === 's' ? 1000
          : unit === 'm' ? 60_000
            : unit === 'h' ? 3_600_000
              : 86_400_000 // d
    return n * factor
  }
}
