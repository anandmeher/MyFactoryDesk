import { z } from 'zod'
import { AttendanceStatus, DateOnlyString, MoneyString } from './common'

export const AttendanceMarkSchema = z.object({
  employeeId: z.string().min(1),
  status: AttendanceStatus,
  overtimeHours: MoneyString.optional(),
  remarks: z.string().max(200).optional(),
})
export type AttendanceMark = z.infer<typeof AttendanceMarkSchema>

export const BulkMarkAttendanceSchema = z.object({
  date: DateOnlyString,
  marks: z.array(AttendanceMarkSchema).min(1).max(500),
})
export type BulkMarkAttendanceInput = z.infer<typeof BulkMarkAttendanceSchema>

export const AttendanceQuerySchema = z
  .object({
    from: DateOnlyString,
    to: DateOnlyString,
    employeeId: z.string().min(1).optional(),
  })
  .refine((q) => q.from <= q.to, { message: 'from must be <= to', path: ['from'] })
export type AttendanceQuery = z.infer<typeof AttendanceQuerySchema>

export const AttendanceResponseSchema = z.object({
  id: z.string(),
  employeeId: z.string(),
  date: DateOnlyString,
  status: AttendanceStatus,
  overtimeHours: MoneyString,
  remarks: z.string().nullable(),
  createdAt: z.string(),
  updatedAt: z.string(),
})
export type AttendanceResponse = z.infer<typeof AttendanceResponseSchema>

export const AttendanceSummaryQuerySchema = z.object({
  month: z.coerce.number().int().min(1).max(12),
  year: z.coerce.number().int().min(2000).max(2100),
})
export type AttendanceSummaryQuery = z.infer<typeof AttendanceSummaryQuerySchema>

export const AttendanceSummaryRowSchema = z.object({
  employeeId: z.string(),
  empCode: z.string(),
  name: z.string(),
  present: z.number().int().nonnegative(),
  halfDay: z.number().int().nonnegative(),
  paidLeave: z.number().int().nonnegative(),
  unpaidLeave: z.number().int().nonnegative(),
  absent: z.number().int().nonnegative(),
  holiday: z.number().int().nonnegative(),
  overtimeHours: MoneyString,
})
export type AttendanceSummaryRow = z.infer<typeof AttendanceSummaryRowSchema>
