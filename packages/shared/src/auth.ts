import { z } from 'zod'
import { PhoneString, Role } from './common.js'

export const LoginSchema = z.object({
  phone: PhoneString,
  password: z.string().min(6).max(128),
})
export type LoginInput = z.infer<typeof LoginSchema>

export const RefreshTokenSchema = z.object({
  refreshToken: z.string().min(20),
})
export type RefreshTokenInput = z.infer<typeof RefreshTokenSchema>

export const LogoutSchema = RefreshTokenSchema
export type LogoutInput = z.infer<typeof LogoutSchema>

export const AuthUserSchema = z.object({
  id: z.string(),
  phone: PhoneString,
  name: z.string(),
  role: Role,
  employeeId: z.string().nullable(),
})
export type AuthUser = z.infer<typeof AuthUserSchema>

export const AuthResponseSchema = z.object({
  accessToken: z.string(),
  refreshToken: z.string(),
  user: AuthUserSchema,
})
export type AuthResponse = z.infer<typeof AuthResponseSchema>
