import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import type { BulkMarkAttendanceInput } from '@myfactorydesk/shared'
import {
  bulkMarkAttendance,
  getAttendanceSummary,
  listAttendance,
} from '../api'

export const attendanceKeys = {
  all: ['attendance'] as const,
  list: (query: { from: string; to: string; employeeId?: string }) =>
    [...attendanceKeys.all, 'list', query] as const,
  summary: (query: { month: number; year: number }) =>
    [...attendanceKeys.all, 'summary', query] as const,
}

export function useAttendanceList(query: { from: string; to: string; employeeId?: string }) {
  return useQuery({
    queryKey: attendanceKeys.list(query),
    queryFn: () => listAttendance(query),
  })
}

export function useAttendanceSummary(query: { month: number; year: number }) {
  return useQuery({
    queryKey: attendanceKeys.summary(query),
    queryFn: () => getAttendanceSummary(query),
  })
}

export function useBulkMarkAttendance() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (input: BulkMarkAttendanceInput) => bulkMarkAttendance(input),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: attendanceKeys.all })
    },
  })
}
