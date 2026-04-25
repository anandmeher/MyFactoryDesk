import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Button } from '@/components/ui/Button'
import { EmptyState } from '@/components/ui/EmptyState'
import { ErrorState } from '@/components/ui/ErrorState'
import { Input } from '@/components/ui/Input'
import { Skeleton } from '@/components/ui/Skeleton'
import { AppLayout } from '@/components/AppLayout'
import { getCurrentUser } from '@/lib/auth'
import { apiErrorMessage } from '@/lib/error'
import { formatINR } from '@/lib/format'
import { useEmployeesList } from './hooks/useEmployees'

const CAN_WRITE = new Set(['OWNER', 'MANAGER'])

export function EmployeesList() {
  const [search, setSearch] = useState('')
  const [activeOnly, setActiveOnly] = useState(true)
  const user = getCurrentUser()
  const canWrite = user ? CAN_WRITE.has(user.role) : false

  const query = useEmployeesList({
    search: search.trim() || undefined,
    active: activeOnly,
  })

  return (
    <AppLayout
      title="Employees"
      back="/dashboard"
      action={
        canWrite && (
          <Link
            to="/employees/new"
            className="rounded bg-white/10 px-3 py-1 text-sm hover:bg-white/20"
          >
            + Add
          </Link>
        )
      }
    >
      <div className="space-y-2 rounded bg-white p-3 shadow-sm">
        <Input
          placeholder="Search by name or empCode"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          aria-label="Search employees"
        />
        <label className="flex items-center gap-2 text-sm text-slate-700">
          <input
            type="checkbox"
            checked={activeOnly}
            onChange={(e) => setActiveOnly(e.target.checked)}
            className="h-4 w-4"
          />
          Active employees only
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
          title={search ? 'No matches' : 'No employees yet'}
          description={search ? 'Try a different search.' : undefined}
          action={
            canWrite && !search ? (
              <Link to="/employees/new">
                <Button size="tap">+ Add Employee</Button>
              </Link>
            ) : null
          }
        />
      )}

      {query.data && query.data.data.length > 0 && (
        <ul className="space-y-2">
          {query.data.data.map((emp) => (
            <li key={emp.id}>
              <Link
                to={`/employees/${emp.id}`}
                className="flex min-h-tap items-center justify-between gap-3 rounded bg-white p-4 shadow-sm hover:bg-slate-50"
              >
                <div className="min-w-0">
                  <p className="font-medium truncate">{emp.name}</p>
                  <p className="text-xs text-slate-500">
                    {emp.empCode} · {emp.designation}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium">{formatINR(emp.basicSalary)}</p>
                  {!emp.isActive && (
                    <span className="text-xs text-amber-700">inactive</span>
                  )}
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </AppLayout>
  )
}
