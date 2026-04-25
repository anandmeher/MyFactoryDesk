import { z } from 'zod'

/**
 * Money values cross the wire as strings to avoid JS float drift.
 * Backend converts to decimal.js, frontend formats via Intl.NumberFormat.
 */
export const MoneyString = z
  .string()
  .regex(/^\d+(\.\d{1,2})?$/, 'must be a non-negative decimal with up to 2 decimal places')

export const SignedMoneyString = z
  .string()
  .regex(/^-?\d+(\.\d{1,2})?$/, 'must be a decimal with up to 2 decimal places')

export const DateOnlyString = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, 'must be a YYYY-MM-DD date')

export const PhoneString = z
  .string()
  .regex(/^[6-9]\d{9}$/, 'must be a 10-digit Indian mobile number')

export const PaginationSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
})
export type Pagination = z.infer<typeof PaginationSchema>

export const PaginationMetaSchema = z.object({
  total: z.number().int().nonnegative(),
  page: z.number().int().min(1),
  pageSize: z.number().int().min(1),
  totalPages: z.number().int().nonnegative(),
})
export type PaginationMeta = z.infer<typeof PaginationMetaSchema>

export const ErrorEnvelopeSchema = z.object({
  error: z.object({
    code: z.string(),
    message: z.string(),
    details: z.unknown().optional(),
  }),
})
export type ErrorEnvelope = z.infer<typeof ErrorEnvelopeSchema>

export const Role = z.enum(['OWNER', 'MANAGER', 'STAFF', 'ACCOUNTANT'])
export type Role = z.infer<typeof Role>

export const SalaryType = z.enum(['MONTHLY', 'DAILY'])
export type SalaryType = z.infer<typeof SalaryType>

export const AttendanceStatus = z.enum([
  'PRESENT',
  'HALF_DAY',
  'PAID_LEAVE',
  'UNPAID_LEAVE',
  'ABSENT',
  'HOLIDAY',
])
export type AttendanceStatus = z.infer<typeof AttendanceStatus>

export const PayrollStatus = z.enum(['DRAFT', 'FINALIZED', 'PAID'])
export type PayrollStatus = z.infer<typeof PayrollStatus>
