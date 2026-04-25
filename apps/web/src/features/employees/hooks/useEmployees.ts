import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import type {
  CreateEmployeeInput,
  EmployeeResponse,
  UpdateEmployeeInput,
} from '@myfactorydesk/shared'
import {
  createEmployee,
  getEmployee,
  listEmployees,
  softDeleteEmployee,
  updateEmployee,
  type EmployeeListResult,
} from '../api'

export const employeesKeys = {
  all: ['employees'] as const,
  list: (query: { search?: string; active: boolean }) =>
    [...employeesKeys.all, 'list', query] as const,
  detail: (id: string, includePii: boolean) =>
    [...employeesKeys.all, 'detail', id, includePii] as const,
}

export function useEmployeesList(params: { search?: string; active: boolean }) {
  return useQuery({
    queryKey: employeesKeys.list(params),
    queryFn: () => listEmployees({ ...params, pageSize: 100 }),
  })
}

export function useEmployee(id: string | undefined, includePii = false) {
  return useQuery({
    queryKey: employeesKeys.detail(id ?? '', includePii),
    queryFn: () => getEmployee(id as string, includePii),
    enabled: Boolean(id),
  })
}

export function useCreateEmployee() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (input: CreateEmployeeInput) => createEmployee(input),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: employeesKeys.all })
    },
  })
}

/**
 * Optimistic update: write the new shape into the detail cache immediately,
 * roll back on error, and re-sync from server response on success.
 */
export function useUpdateEmployee(id: string) {
  const qc = useQueryClient()
  return useMutation<
    EmployeeResponse,
    Error,
    UpdateEmployeeInput,
    { previous: EmployeeResponse | undefined; key: ReturnType<typeof employeesKeys.detail> }
  >({
    mutationFn: (input) => updateEmployee(id, input),
    onMutate: async (input) => {
      const key = employeesKeys.detail(id, false)
      await qc.cancelQueries({ queryKey: key })
      const previous = qc.getQueryData<EmployeeResponse>(key)
      if (previous) {
        // Patch only the fields we know how to patch from this input.
        qc.setQueryData<EmployeeResponse>(key, {
          ...previous,
          ...(input as Partial<EmployeeResponse>),
        })
      }
      return { previous, key }
    },
    onError: (_err, _input, ctx) => {
      if (ctx?.previous) qc.setQueryData(ctx.key, ctx.previous)
    },
    onSettled: () => {
      void qc.invalidateQueries({ queryKey: employeesKeys.all })
    },
  })
}

export function useSoftDeleteEmployee() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => softDeleteEmployee(id),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: employeesKeys.all })
    },
  })
}

export type { EmployeeListResult }
