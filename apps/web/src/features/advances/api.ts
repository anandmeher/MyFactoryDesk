import type {
  AdvanceQuery,
  AdvanceResponse,
  CreateAdvanceInput,
  UpdateAdvanceInput,
} from '@myfactorydesk/shared'
import { api, type ApiData, type ApiList } from '@/lib/api'

export type AdvanceListResult = ApiList<AdvanceResponse>

export async function listAdvances(
  query: Partial<AdvanceQuery> = {},
): Promise<AdvanceListResult> {
  const params = new URLSearchParams()
  if (query.page) params.set('page', String(query.page))
  if (query.pageSize) params.set('pageSize', String(query.pageSize))
  if (query.employeeId) params.set('employeeId', query.employeeId)
  if (query.deductionMonth) params.set('deductionMonth', String(query.deductionMonth))
  if (query.deductionYear) params.set('deductionYear', String(query.deductionYear))
  if (query.isDeducted !== undefined) params.set('isDeducted', String(query.isDeducted))
  const qs = params.toString()
  const res = await api.get<AdvanceListResult>(`/advances${qs ? `?${qs}` : ''}`)
  return res.data
}

export async function createAdvance(input: CreateAdvanceInput): Promise<AdvanceResponse> {
  const res = await api.post<ApiData<AdvanceResponse>>('/advances', input)
  return res.data.data
}

export async function updateAdvance(
  id: string,
  input: UpdateAdvanceInput,
): Promise<AdvanceResponse> {
  const res = await api.patch<ApiData<AdvanceResponse>>(`/advances/${id}`, input)
  return res.data.data
}

export async function deleteAdvance(id: string): Promise<void> {
  await api.delete(`/advances/${id}`)
}
