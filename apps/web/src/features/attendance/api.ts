import type {
  AttendanceResponse,
  AttendanceSummaryRow,
  BulkMarkAttendanceInput,
} from '@myfactorydesk/shared'
import { api, type ApiData } from '@/lib/api'

export async function bulkMarkAttendance(
  input: BulkMarkAttendanceInput,
): Promise<{ count: number }> {
  const res = await api.post<ApiData<{ count: number }>>('/attendance/bulk', input)
  return res.data.data
}

export async function listAttendance(query: {
  from: string
  to: string
  employeeId?: string
}): Promise<AttendanceResponse[]> {
  const params = new URLSearchParams({ from: query.from, to: query.to })
  if (query.employeeId) params.set('employeeId', query.employeeId)
  const res = await api.get<ApiData<AttendanceResponse[]>>(`/attendance?${params.toString()}`)
  return res.data.data
}

export async function getAttendanceSummary(query: {
  month: number
  year: number
}): Promise<AttendanceSummaryRow[]> {
  const params = new URLSearchParams({
    month: String(query.month),
    year: String(query.year),
  })
  const res = await api.get<ApiData<AttendanceSummaryRow[]>>(
    `/attendance/summary?${params.toString()}`,
  )
  return res.data.data
}
