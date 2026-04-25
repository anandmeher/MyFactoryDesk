import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from '@nestjs/common'
import { Reflector } from '@nestjs/core'
import type { Role } from '@prisma/client'
import type { Request } from 'express'
import { ROLES_KEY } from '../decorators/roles.decorator'
import type { AuthUser } from '../types'

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const required = this.reflector.getAllAndOverride<Role[] | undefined>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ])
    if (!required || required.length === 0) return true

    const req = context.switchToHttp().getRequest<Request & { user?: AuthUser }>()
    const user = req.user
    if (!user) {
      throw new ForbiddenException({ code: 'FORBIDDEN', message: 'Not authenticated' })
    }
    if (!required.includes(user.role)) {
      throw new ForbiddenException({ code: 'FORBIDDEN', message: 'Insufficient role' })
    }
    return true
  }
}
