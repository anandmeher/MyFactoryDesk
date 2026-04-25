import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import type { CreatePayrollRunInput } from '@myfactorydesk/shared'
import {
  createPayrollRun,
  finalizePayrollRun,
  getPayrollRun,
  getPayslip,
  listPayrollRuns,
  markPayrollRunPaid,
  previewPayrollRun,
} from '../api'

export const payrollKeys = {
  all: ['payroll'] as const,
  runs: () => [...payrollKeys.all, 'runs'] as const,
  run: (id: string) => [...payrollKeys.all, 'run', id] as const,
  preview: (id: string) => [...payrollKeys.all, 'preview', id] as const,
  payslip: (id: string) => [...payrollKeys.all, 'payslip', id] as const,
}

export function usePayrollRuns() {
  return useQuery({ queryKey: payrollKeys.runs(), queryFn: listPayrollRuns })
}

export function usePayrollRun(id: string | undefined) {
  return useQuery({
    queryKey: payrollKeys.run(id ?? ''),
    queryFn: () => getPayrollRun(id as string),
    enabled: Boolean(id),
  })
}

export function usePayrollPreview(id: string | undefined) {
  return useQuery({
    queryKey: payrollKeys.preview(id ?? ''),
    queryFn: () => previewPayrollRun(id as string),
    enabled: Boolean(id),
  })
}

export function useCreatePayrollRun() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (input: CreatePayrollRunInput) => createPayrollRun(input),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: payrollKeys.all })
    },
  })
}

export function useFinalizePayrollRun(id: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: () => finalizePayrollRun(id),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: payrollKeys.all })
    },
  })
}

export function useMarkPayrollRunPaid(id: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: () => markPayrollRunPaid(id),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: payrollKeys.all })
    },
  })
}

export function usePayslip(id: string | undefined) {
  return useQuery({
    queryKey: payrollKeys.payslip(id ?? ''),
    queryFn: () => getPayslip(id as string),
    enabled: Boolean(id),
  })
}
