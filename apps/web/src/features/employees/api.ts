import type {
  CreateEmployeeInput,
  EmployeeListQuery,
  EmployeeResponse,
  UpdateEmployeeInput,
} from '@myfactorydesk/shared'
import { api, type ApiData, type ApiList } from '@/lib/api'

export type EmployeeListResult = ApiList<EmployeeResponse>

export async function listEmployees(query: Partial<EmployeeListQuery>): Promise<EmployeeListResult> {
  const params = new URLSearchParams()
  if (query.page) params.set('page', String(query.page))
  if (query.pageSize) params.set('pageSize', String(query.pageSize))
  if (query.search) params.set('search', query.search)
  if (query.active !== undefined) params.set('active', String(query.active))
  const qs = params.toString()
  const res = await api.get<EmployeeListResult>(`/employees${qs ? `?${qs}` : ''}`)
  return res.data
}

export async function getEmployee(id: string, includePii = false): Promise<EmployeeResponse> {
  const res = await api.get<ApiData<EmployeeResponse>>(
    `/employees/${id}${includePii ? '?includePii=true' : ''}`,
  )
  return res.data.data
}

export async function createEmployee(input: CreateEmployeeInput): Promise<EmployeeResponse> {
  const res = await api.post<ApiData<EmployeeResponse>>('/employees', input)
  return res.data.data
}

export async function updateEmployee(
  id: string,
  input: UpdateEmployeeInput,
): Promise<EmployeeResponse> {
  const res = await api.patch<ApiData<EmployeeResponse>>(`/employees/${id}`, input)
  return res.data.data
}

export async function softDeleteEmployee(id: string): Promise<EmployeeResponse> {
  const res = await api.delete<ApiData<EmployeeResponse>>(`/employees/${id}`)
  return res.data.data
}
