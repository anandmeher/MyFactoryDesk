import { useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { AppShell } from '@/components/shell'
import { Button } from '@/components/ui/Button'
import { ErrorState } from '@/components/ui/ErrorState'
import { Skeleton } from '@/components/ui/Skeleton'
import { getCurrentUser } from '@/lib/auth'
import { apiErrorMessage } from '@/lib/error'
import { formatINR } from '@/lib/format'
import {
  useFinalizePayrollRun,
  useMarkPayrollRunPaid,
  usePayrollPreview,
} from './hooks/usePayroll'

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
]

export function PayrollRunDetail() {
  const { id = '' } = useParams<{ id: string }>()
  const user = getCurrentUser()
  const isOwner = user?.role === 'OWNER'
  const canMarkPaid = user ? user.role === 'OWNER' || user.role === 'ACCOUNTANT' : false

  const previewQuery = usePayrollPreview(id)
  const finalize = useFinalizePayrollRun(id)
  const markPaid = useMarkPayrollRunPaid(id)
  const [actionError, setActionError] = useState<string | null>(null)

  async function onFinalize() {
    if (
      !window.confirm(
        'Finalize this payroll run? Payslips will be frozen and advances marked deducted. This cannot be undone.',
      )
    )
      return
    setActionError(null)
    try {
      await finalize.mutateAsync()
    } catch (err) {
      setActionError(apiErrorMessage(err, 'Could not finalize'))
    }
  }

  async function onMarkPaid() {
    if (!window.confirm('Mark this run as paid?')) return
    setActionError(null)
    try {
      await markPaid.mutateAsync()
    } catch (err) {
      setActionError(apiErrorMessage(err, 'Could not mark paid'))
    }
  }

  if (previewQuery.isLoading) {
    return (
      <AppShell pageTitle="Payroll run">
        <Skeleton className="h-72 w-full" />
      </AppShell>
    )
  }

  if (previewQuery.isError || !previewQuery.data) {
    return (
      <AppShell pageTitle="Payroll run">
        <ErrorState
          message={apiErrorMessage(previewQuery.error)}
          onRetry={() => void previewQuery.refetch()}
        />
      </AppShell>
    )
  }

  const preview = previewQuery.data

  return (
    <AppShell pageTitle="Payroll run">
      <div>
        <Link
          to="/payroll"
          className="inline-flex items-center gap-1 text-sm text-slate-600 hover:text-slate-900"
        >
          ← Payroll
        </Link>
        <div className="mt-1 flex items-center justify-between">
          <div>
            <h1 className="text-xl font-semibold text-slate-900">
              {MONTH_NAMES[preview.month - 1]} {preview.year}
            </h1>
            <p className="text-xs text-slate-500">{preview.status}</p>
          </div>
          <div className="text-right">
            <p className="text-xs text-slate-500">Net total</p>
            <p className="text-base font-semibold">{formatINR(preview.totals.netPay)}</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-2 rounded-lg bg-white p-3 shadow-sm ring-1 ring-slate-200/60">
        <Cell label="Gross" value={preview.totals.grossEarnings} />
        <Cell label="Deductions" value={preview.totals.totalDeductions} />
        <Cell label="Net" value={preview.totals.netPay} />
      </div>

      {actionError && (
        <div role="alert" className="rounded bg-red-50 px-3 py-2 text-sm text-red-700">
          {actionError}
        </div>
      )}

      {preview.status === 'DRAFT' && isOwner && (
        <Button size="tap" onClick={onFinalize} disabled={finalize.isPending} className="w-full">
          {finalize.isPending ? 'Finalizing…' : 'Finalize run'}
        </Button>
      )}
      {preview.status === 'FINALIZED' && canMarkPaid && (
        <Button
          size="tap"
          onClick={onMarkPaid}
          disabled={markPaid.isPending}
          className="w-full"
        >
          {markPaid.isPending ? 'Saving…' : 'Mark paid'}
        </Button>
      )}

      {preview.payslips.length === 0 ? (
        <p className="rounded-lg bg-white p-4 text-sm text-slate-600 shadow-sm">
          No active employees in scope for this period.
        </p>
      ) : (
        <ul className="space-y-2">
          {preview.payslips.map((p) => (
            <li
              key={p.employeeId}
              className="rounded-lg bg-white p-3 shadow-sm ring-1 ring-slate-200/60"
            >
              <div className="flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <p className="font-medium truncate">{p.employeeName}</p>
                  <p className="text-xs text-slate-500">
                    {p.empCode} · {p.daysWorked} of {p.daysPayable} days
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-semibold">{formatINR(p.netPay)}</p>
                  <p className="text-xs text-slate-500">
                    gross {formatINR(p.grossEarnings)} − ded {formatINR(p.totalDeductions)}
                  </p>
                </div>
              </div>
              {p.id && (
                <Link
                  to={`/payslips/${p.id}`}
                  className="mt-2 inline-flex text-xs font-medium text-brand hover:underline"
                >
                  View payslip →
                </Link>
              )}
            </li>
          ))}
        </ul>
      )}
    </AppShell>
  )
}

function Cell({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded bg-slate-50 p-2 text-center">
      <p className="text-[10px] uppercase tracking-wide text-slate-500">{label}</p>
      <p className="text-sm font-semibold text-slate-900">{formatINR(value)}</p>
    </div>
  )
}
