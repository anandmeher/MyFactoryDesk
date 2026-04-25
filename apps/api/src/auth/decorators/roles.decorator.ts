import { SetMetadata } from '@nestjs/common'
import type { Role } from '@prisma/client'

export const ROLES_KEY = 'roles'

/** Restrict a route to one or more roles. Caller must also pass JwtAuthGuard. */
export const Roles = (...roles: Role[]): MethodDecorator & ClassDecorator =>
  SetMetadata(ROLES_KEY, roles)
