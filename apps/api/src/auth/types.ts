import type { Role } from '@prisma/client'

/** What the JWT carries. Keep small. */
export type JwtPayload = {
  sub: string
  role: Role
}

/** What request.user looks like after JwtStrategy validates. */
export type AuthUser = {
  id: string
  phone: string
  name: string
  role: Role
  employeeId: string | null
}
