import { Link } from 'react-router-dom'
import type { PayrollRunResponse } from '@myfactorydesk/shared'
import { AppShell } from '@/components/shell'
import { Button } from '@/components/ui/Button'
import { EmptyState } from '@/components/ui/EmptyState'
import { ErrorState } from '@/components/ui/ErrorState'
import { Skeleton } from '@/components/ui/Skeleton'
import { getCurrentUser } from '@/lib/auth'
import { apiErrorMessage } from '@/lib/error'
import { usePayrollRuns } from './hooks/usePayroll'

const CAN_CREATE = new Set(['OWNER', 'ACCOUNTANT'])

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
]

function StatusBadge({ status }: { status: PayrollRunResponse['status'] }) {
  const tone =
    status === 'DRAFT'
      ? 'bg-amber-100 text-amber-800'
      : status === 'FINALIZED'
        ? 'bg-sky-100 text-sky-800'
        : 'bg-emerald-100 text-emerald-800'
  return (
    <span className={`inline-flex rounded px-2 py-0.5 text-xs font-medium ${tone}`}>
      {status}
    </span>
  )
}

export function PayrollList() {
  const user = getCurrentUser()
  const canCreate = user ? CAN_CREATE.has(user.role) : false
  const query = usePayrollRuns()

  return (
    <AppShell pageTitle="Payroll">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold text-slate-900">Payroll runs</h1>
        {canCreate && (
          <Link
            to="/payroll/new"
            className="inline-flex min-h-[40px] items-center rounded bg-brand px-3 text-sm font-medium text-white hover:bg-slate-700"
          >
            + New run
          </Link>
        )}
      </div>

      {query.isLoading && (
        <div className="space-y-2">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-16 w-full" />
          ))}
        </div>
      )}

      {query.isError && (
        <ErrorState message={apiErrorMessage(query.error)} onRetry={() => void query.refetch()} />
      )}

      {query.data && query.data.data.length === 0 && (
        <EmptyState
          title="No payroll runs"
          description={canCreate ? 'Create one to start a draft.' : undefined}
          action={
            canCreate ? (
              <Link to="/payroll/new">
                <Button size="tap">+ New run</Button>
              </Link>
            ) : null
          }
        />
      )}

      {query.data && query.data.data.length > 0 && (
        <ul className="space-y-2">
          {query.data.data.map((run) => (
            <li key={run.id}>
              <Link
                to={`/payroll/${run.id}`}
                className="flex min-h-tap items-center justify-between gap-3 rounded-lg bg-white p-4 shadow-sm ring-1 ring-slate-200/60 hover:ring-slate-300"
              >
                <div>
                  <p className="font-medium">
                    {MONTH_NAMES[run.month - 1]} {run.year}
                  </p>
                  <p className="text-xs text-slate-500">
                    {run.finalizedAt && `Finalized ${run.finalizedAt.slice(0, 10)}`}
                    {run.paidAt && ` · Paid ${run.paidAt.slice(0, 10)}`}
                  </p>
                </div>
                <StatusBadge status={run.status} />
              </Link>
            </li>
          ))}
        </ul>
      )}
    </AppShell>
  )
}
