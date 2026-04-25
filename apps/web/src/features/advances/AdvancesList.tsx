import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { AppShell } from '@/components/shell'
import { Button } from '@/components/ui/Button'
import { EmptyState } from '@/components/ui/EmptyState'
import { ErrorState } from '@/components/ui/ErrorState'
import { Skeleton } from '@/components/ui/Skeleton'
import { getCurrentUser } from '@/lib/auth'
import { apiErrorMessage } from '@/lib/error'
import { formatINR } from '@/lib/format'
import { useEmployeesList } from '@/features/employees/hooks/useEmployees'
import { useAdvancesList, useDeleteAdvance } from './hooks/useAdvances'

const CAN_WRITE = new Set(['OWNER', 'ACCOUNTANT'])
const CAN_DELETE = new Set(['OWNER'])

const MONTH_NAMES = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
]

export function AdvancesList() {
  const user = getCurrentUser()
  const canWrite = user ? CAN_WRITE.has(user.role) : false
  const canDelete = user ? CAN_DELETE.has(user.role) : false

  const [employeeFilter, setEmployeeFilter] = useState<string>('')
  const [monthFilter, setMonthFilter] = useState<string>('')
  const [yearFilter, setYearFilter] = useState<string>('')

  const employeesQuery = useEmployeesList({ active: true })
  const employees = employeesQuery.data?.data ?? []
  const employeeName = useMemo(() => {
    const map = new Map<string, string>()
    for (const e of employees) map.set(e.id, `${e.name} (${e.empCode})`)
    return map
  }, [employees])

  const query = useAdvancesList({
    employeeId: employeeFilter || undefined,
    deductionMonth: monthFilter ? Number(monthFilter) : undefined,
    deductionYear: yearFilter ? Number(yearFilter) : undefined,
  })

  const deleteMutation = useDeleteAdvance()

  const onDelete = (id: string) => {
    if (!window.confirm('Delete this advance? This cannot be undone.')) return
    deleteMutation.mutate(id)
  }

  return (
    <AppShell pageTitle="Advances">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold text-slate-900">Advances</h1>
        {canWrite && (
          <Link
            to="/advances/new"
            className="inline-flex min-h-[40px] items-center rounded bg-brand px-3 text-sm font-medium text-white hover:bg-slate-700"
          >
            + Add
          </Link>
        )}
      </div>

      <div className="grid grid-cols-1 gap-2 rounded-lg bg-white p-3 shadow-sm ring-1 ring-slate-200/60 sm:grid-cols-3">
        <label className="block text-sm font-medium text-slate-700">
          Employee
          <select
            value={employeeFilter}
            onChange={(e) => setEmployeeFilter(e.target.value)}
            className="mt-1 block w-full rounded border border-slate-300 px-3 py-2 text-base"
          >
            <option value="">All</option>
            {employees.map((emp) => (
              <option key={emp.id} value={emp.id}>
                {emp.name} ({emp.empCode})
              </option>
            ))}
          </select>
        </label>
        <label className="block text-sm font-medium text-slate-700">
          Deduction month
          <select
            value={monthFilter}
            onChange={(e) => setMonthFilter(e.target.value)}
            className="mt-1 block w-full rounded border border-slate-300 px-3 py-2 text-base"
          >
            <option value="">Any</option>
            {MONTH_NAMES.map((name, i) => (
              <option key={i} value={String(i + 1)}>
                {name}
              </option>
            ))}
          </select>
        </label>
        <label className="block text-sm font-medium text-slate-700">
          Deduction year
          <input
            type="number"
            min={2000}
            max={2100}
            value={yearFilter}
            onChange={(e) => setYearFilter(e.target.value)}
            placeholder="Any"
            className="mt-1 block w-full rounded border border-slate-300 px-3 py-2 text-base"
          />
        </label>
      </div>

      {query.isLoading && (
        <div className="space-y-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-20 w-full" />
          ))}
        </div>
      )}

      {query.isError && (
        <ErrorState message={apiErrorMessage(query.error)} onRetry={() => void query.refetch()} />
      )}

      {query.data && query.data.data.length === 0 && (
        <EmptyState
          title="No advances"
          description={canWrite ? 'Tap + Add to record one.' : undefined}
          action={
            canWrite ? (
              <Link to="/advances/new">
                <Button size="tap">+ Add advance</Button>
              </Link>
            ) : null
          }
        />
      )}

      {query.data && query.data.data.length > 0 && (
        <ul className="space-y-2">
          {query.data.data.map((adv) => (
            <li
              key={adv.id}
              className="rounded-lg bg-white p-3 shadow-sm ring-1 ring-slate-200/60"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <p className="font-medium truncate">
                    {employeeName.get(adv.employeeId) ?? adv.employeeId}
                  </p>
                  <p className="text-xs text-slate-500">
                    {adv.date} · for {MONTH_NAMES[adv.deductionMonth - 1]}{' '}
                    {adv.deductionYear}
                    {adv.isDeducted && (
                      <span className="ml-2 inline-flex rounded bg-slate-200 px-1.5 py-0.5 text-[10px] font-medium text-slate-700">
                        deducted
                      </span>
                    )}
                  </p>
                  {adv.remarks && (
                    <p className="mt-1 text-xs text-slate-600">{adv.remarks}</p>
                  )}
                </div>
                <div className="flex flex-col items-end gap-1">
                  <p className="text-sm font-semibold">{formatINR(adv.amount)}</p>
                  {!adv.isDeducted && !adv.payrollRunId && (
                    <div className="flex gap-2">
                      {canWrite && (
                        <Link
                          to={`/advances/${adv.id}/edit`}
                          className="text-xs font-medium text-brand hover:underline"
                        >
                          Edit
                        </Link>
                      )}
                      {canDelete && (
                        <button
                          type="button"
                          onClick={() => onDelete(adv.id)}
                          className="text-xs font-medium text-red-600 hover:underline disabled:text-slate-400"
                          disabled={deleteMutation.isPending}
                        >
                          Delete
                        </button>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </AppShell>
  )
}
