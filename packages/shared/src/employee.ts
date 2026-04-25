import { z } from 'zod'
import { DateOnlyString, MoneyString, PhoneString, SalaryType } from './common'

export const AllowanceSchema = z.object({
  name: z.string().min(1).max(60),
  amount: MoneyString,
  alwaysFull: z.boolean().default(false),
})
export type Allowance = z.infer<typeof AllowanceSchema>

export const FixedDeductionSchema = z.object({
  name: z.string().min(1).max(60),
  amount: MoneyString,
})
export type FixedDeduction = z.infer<typeof FixedDeductionSchema>

export const PanString = z
  .string()
  .regex(/^[A-Z]{5}\d{4}[A-Z]$/, 'must be a valid PAN (AAAAA9999A)')

export const AadhaarString = z
  .string()
  .regex(/^\d{12}$/, 'must be a 12-digit Aadhaar number')

export const CreateEmployeeSchema = z.object({
  name: z.string().min(1).max(120),
  phone: PhoneString,
  empCode: z
    .string()
    .regex(/^EMP\d{8}$/, 'must be EMP{YYYY}{4-digit-sequence}')
    .optional(),
  designation: z.string().min(1).max(80),
  dateOfJoining: DateOnlyString,
  dateOfLeaving: DateOnlyString.nullable().optional(),
  salaryType: SalaryType.default('MONTHLY'),
  basicSalary: MoneyString,
  hra: MoneyString.default('0.00'),
  allowances: z.array(AllowanceSchema).default([]),
  fixedDeductions: z.array(FixedDeductionSchema).default([]),
  pan: PanString.nullable().optional(),
  aadhaar: AadhaarString.nullable().optional(),
})
export type CreateEmployeeInput = z.infer<typeof CreateEmployeeSchema>

export const UpdateEmployeeSchema = CreateEmployeeSchema.partial()
export type UpdateEmployeeInput = z.infer<typeof UpdateEmployeeSchema>

/** PII is masked unless OWNER explicitly requests includePii=true */
export const MaskedPiiString = z.string().regex(/^X+\d{4}$/).nullable()

export const EmployeeResponseSchema = z.object({
  id: z.string(),
  empCode: z.string(),
  name: z.string(),
  phone: z.string(),
  designation: z.string(),
  dateOfJoining: DateOnlyString,
  dateOfLeaving: DateOnlyString.nullable(),
  salaryType: SalaryType,
  basicSalary: MoneyString,
  hra: MoneyString,
  allowances: z.array(AllowanceSchema),
  fixedDeductions: z.array(FixedDeductionSchema),
  pan: z.string().nullable(),
  aadhaar: z.string().nullable(),
  isActive: z.boolean(),
  createdAt: z.string(),
  updatedAt: z.string(),
})
export type EmployeeResponse = z.infer<typeof EmployeeResponseSchema>

export const EmployeeListQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
  search: z.string().trim().optional(),
  active: z
    .union([z.boolean(), z.enum(['true', 'false'])])
    .transform((v) => (typeof v === 'boolean' ? v : v === 'true'))
    .default(true),
})
export type EmployeeListQuery = z.infer<typeof EmployeeListQuerySchema>
