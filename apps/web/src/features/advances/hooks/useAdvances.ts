import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import type { AdvanceQuery, CreateAdvanceInput, UpdateAdvanceInput } from '@myfactorydesk/shared'
import {
  createAdvance,
  deleteAdvance,
  listAdvances,
  updateAdvance,
  type AdvanceListResult,
} from '../api'

export const advancesKeys = {
  all: ['advances'] as const,
  list: (query: Partial<AdvanceQuery>) => [...advancesKeys.all, 'list', query] as const,
}

export function useAdvancesList(query: Partial<AdvanceQuery> = {}) {
  return useQuery({
    queryKey: advancesKeys.list(query),
    queryFn: () => listAdvances({ ...query, pageSize: query.pageSize ?? 100 }),
  })
}

export function useCreateAdvance() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (input: CreateAdvanceInput) => createAdvance(input),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: advancesKeys.all })
    },
  })
}

export function useUpdateAdvance(id: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (input: UpdateAdvanceInput) => updateAdvance(id, input),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: advancesKeys.all })
    },
  })
}

export function useDeleteAdvance() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => deleteAdvance(id),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: advancesKeys.all })
    },
  })
}

export type { AdvanceListResult }
