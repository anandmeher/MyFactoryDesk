import { z } from 'zod'
import { DateOnlyString, MoneyString } from './common.js'

export const CreateAdvanceSchema = z.object({
  employeeId: z.string().min(1),
  amount: MoneyString,
  date: DateOnlyString,
  deductionMonth: z.coerce.number().int().min(1).max(12),
  deductionYear: z.coerce.number().int().min(2000).max(2100),
  remarks: z.string().max(200).optional(),
})
export type CreateAdvanceInput = z.infer<typeof CreateAdvanceSchema>

export const UpdateAdvanceSchema = CreateAdvanceSchema.partial()
export type UpdateAdvanceInput = z.infer<typeof UpdateAdvanceSchema>

export const AdvanceQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
  employeeId: z.string().min(1).optional(),
  deductionMonth: z.coerce.number().int().min(1).max(12).optional(),
  deductionYear: z.coerce.number().int().min(2000).max(2100).optional(),
  isDeducted: z
    .union([z.boolean(), z.enum(['true', 'false'])])
    .transform((v) => (typeof v === 'boolean' ? v : v === 'true'))
    .optional(),
})
export type AdvanceQuery = z.infer<typeof AdvanceQuerySchema>

export const AdvanceResponseSchema = z.object({
  id: z.string(),
  employeeId: z.string(),
  amount: MoneyString,
  date: DateOnlyString,
  deductionMonth: z.number().int(),
  deductionYear: z.number().int(),
  remarks: z.string().nullable(),
  isDeducted: z.boolean(),
  payrollRunId: z.string().nullable(),
  replacesAdvanceId: z.string().nullable(),
  createdAt: z.string(),
  updatedAt: z.string(),
})
export type AdvanceResponse = z.infer<typeof AdvanceResponseSchema>
