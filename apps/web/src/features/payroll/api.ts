import type {
  CreatePayrollRunInput,
  PayrollPreview,
  PayrollRunResponse,
  PayslipResponse,
} from '@myfactorydesk/shared'
import { api, type ApiData, type ApiList } from '@/lib/api'

export type PayrollRunListResult = ApiList<PayrollRunResponse>

export async function listPayrollRuns(): Promise<PayrollRunListResult> {
  const res = await api.get<PayrollRunListResult>('/payroll/runs?pageSize=50')
  return res.data
}

export async function getPayrollRun(id: string): Promise<PayrollRunResponse> {
  const res = await api.get<ApiData<PayrollRunResponse>>(`/payroll/runs/${id}`)
  return res.data.data
}

export async function previewPayrollRun(id: string): Promise<PayrollPreview> {
  const res = await api.get<ApiData<PayrollPreview>>(`/payroll/runs/${id}/preview`)
  return res.data.data
}

export async function createPayrollRun(
  input: CreatePayrollRunInput,
): Promise<PayrollRunResponse> {
  const res = await api.post<ApiData<PayrollRunResponse>>('/payroll/runs', input)
  return res.data.data
}

export async function finalizePayrollRun(id: string): Promise<PayrollRunResponse> {
  const res = await api.post<ApiData<PayrollRunResponse>>(`/payroll/runs/${id}/finalize`)
  return res.data.data
}

export async function markPayrollRunPaid(id: string): Promise<PayrollRunResponse> {
  const res = await api.post<ApiData<PayrollRunResponse>>(`/payroll/runs/${id}/mark-paid`)
  return res.data.data
}

export async function getPayslip(id: string): Promise<PayslipResponse> {
  const res = await api.get<ApiData<PayslipResponse>>(`/payslips/${id}`)
  return res.data.data
}

export async function getPayslipPdf(id: string): Promise<{ blob: Blob; filename: string }> {
  const res = await api.get<Blob>(`/payslips/${id}/pdf`, { responseType: 'blob' })
  const disposition = res.headers['content-disposition'] ?? ''
  const match = /filename="?([^";]+)"?/.exec(disposition)
  const filename = match?.[1] ?? `payslip-${id}.pdf`
  return { blob: res.data, filename }
}
