import { z } from 'zod'
import { MoneyString, PayrollStatus } from './common.js'

export const CreatePayrollRunSchema = z.object({
  month: z.coerce.number().int().min(1).max(12),
  year: z.coerce.number().int().min(2000).max(2100),
})
export type CreatePayrollRunInput = z.infer<typeof CreatePayrollRunSchema>

export const PayrollRunResponseSchema = z.object({
  id: z.string(),
  month: z.number().int(),
  year: z.number().int(),
  status: PayrollStatus,
  finalizedAt: z.string().nullable(),
  paidAt: z.string().nullable(),
  createdAt: z.string(),
  updatedAt: z.string(),
})
export type PayrollRunResponse = z.infer<typeof PayrollRunResponseSchema>

export const PayslipBreakdownLineSchema = z.object({
  name: z.string(),
  amount: MoneyString,
})
export type PayslipBreakdownLine = z.infer<typeof PayslipBreakdownLineSchema>

export const PayslipAdvanceAppliedSchema = z.object({
  advanceId: z.string(),
  amountApplied: MoneyString,
  remaining: MoneyString,
})
export type PayslipAdvanceApplied = z.infer<typeof PayslipAdvanceAppliedSchema>

export const PayslipCarriedForwardSchema = z.object({
  advanceId: z.string(),
  remaining: MoneyString,
})
export type PayslipCarriedForward = z.infer<typeof PayslipCarriedForwardSchema>

export const PayslipResponseSchema = z.object({
  id: z.string(),
  payrollRunId: z.string(),
  employeeId: z.string(),
  empCode: z.string(),
  employeeName: z.string(),

  daysPayable: z.number().int().nonnegative(),
  daysWorked: MoneyString,

  basicEarned: MoneyString,
  hraEarned: MoneyString,
  allowancesBreakdown: z.array(PayslipBreakdownLineSchema),
  allowancesTotal: MoneyString,
  otAmount: MoneyString,
  grossEarnings: MoneyString,

  fixedDeductionsBreakdown: z.array(PayslipBreakdownLineSchema),
  fixedDeductionsTotal: MoneyString,

  advancesApplied: z.array(PayslipAdvanceAppliedSchema),
  advanceDeducted: MoneyString,
  totalDeductions: MoneyString,

  netPay: MoneyString,
  carriedForward: z.array(PayslipCarriedForwardSchema),

  calculatorVersion: z.string(),
  calculatedAt: z.string(),
})
export type PayslipResponse = z.infer<typeof PayslipResponseSchema>

export const PayrollPreviewSchema = z.object({
  runId: z.string(),
  month: z.number().int(),
  year: z.number().int(),
  status: PayrollStatus,
  payslips: z.array(PayslipResponseSchema),
  totals: z.object({
    grossEarnings: MoneyString,
    totalDeductions: MoneyString,
    netPay: MoneyString,
  }),
})
export type PayrollPreview = z.infer<typeof PayrollPreviewSchema>
