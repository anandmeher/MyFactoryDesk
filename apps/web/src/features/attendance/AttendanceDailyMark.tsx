import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { formatInTimeZone } from 'date-fns-tz'
import type { AttendanceMark } from '@myfactorydesk/shared'
import { AppShell } from '@/components/shell'
import { Button } from '@/components/ui/Button'
import { EmptyState } from '@/components/ui/EmptyState'
import { ErrorState } from '@/components/ui/ErrorState'
import { Skeleton } from '@/components/ui/Skeleton'
import { getCurrentUser } from '@/lib/auth'
import { apiErrorMessage } from '@/lib/error'
import { useEmployeesList } from '@/features/employees/hooks/useEmployees'
import { useAttendanceList, useBulkMarkAttendance } from './hooks/useAttendance'

const IST = 'Asia/Kolkata'
const todayIST = () => formatInTimeZone(new Date(), IST, 'yyyy-MM-dd')

const CAN_MARK = new Set(['OWNER', 'MANAGER'])

type Status = AttendanceMark['status']
type RowState = {
  status: Status | null
  overtimeHours: string // raw input, validated when saving
  showOt: boolean
}

const STATUS_BUTTONS: Array<{ key: Status; label: string; tone: string }> = [
  { key: 'PRESENT', label: 'P', tone: 'bg-emerald-600 text-white' },
  { key: 'HALF_DAY', label: 'HD', tone: 'bg-amber-500 text-white' },
  { key: 'PAID_LEAVE', label: 'L', tone: 'bg-sky-600 text-white' },
  { key: 'ABSENT', label: 'A', tone: 'bg-red-600 text-white' },
]

export function AttendanceDailyMark() {
  const user = getCurrentUser()
  const canMark = user ? CAN_MARK.has(user.role) : false

  const [date, setDate] = useState<string>(todayIST())
  const [rows, setRows] = useState<Record<string, RowState>>({})

  const employeesQuery = useEmployeesList({ active: true })
  const employees = employeesQuery.data?.data ?? []

  const attendanceQuery = useAttendanceList({ from: date, to: date })
  const existing = attendanceQuery.data ?? []

  // Re-seed local state whenever the date or fetched rows change.
  useEffect(() => {
    if (employees.length === 0) return
    const next: Record<string, RowState> = {}
    for (const emp of employees) {
      const existingRow = existing.find((a) => a.employeeId === emp.id)
      next[emp.id] = {
        status: existingRow ? (existingRow.status as Status) : null,
        overtimeHours:
          existingRow && existingRow.overtimeHours !== '0.00'
            ? existingRow.overtimeHours
            : '',
        showOt: Boolean(existingRow && existingRow.overtimeHours !== '0.00'),
      }
    }
    setRows(next)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [date, employeesQuery.dataUpdatedAt, attendanceQuery.dataUpdatedAt])

  const markedCount = useMemo(
    () => Object.values(rows).filter((r) => r.status !== null).length,
    [rows],
  )

  const setStatus = (employeeId: string, status: Status) => {
    setRows((prev) => ({
      ...prev,
      [employeeId]: {
        status: prev[employeeId]?.status === status ? null : status,
        overtimeHours: prev[employeeId]?.overtimeHours ?? '',
        showOt: prev[employeeId]?.showOt ?? false,
      },
    }))
  }

  const setOt = (employeeId: string, value: string) => {
    setRows((prev) => ({
      ...prev,
      [employeeId]: {
        status: prev[employeeId]?.status ?? null,
        overtimeHours: value,
        showOt: true,
      },
    }))
  }

  const toggleOt = (employeeId: string) => {
    setRows((prev) => ({
      ...prev,
      [employeeId]: {
        status: prev[employeeId]?.status ?? null,
        overtimeHours: prev[employeeId]?.overtimeHours ?? '',
        showOt: !(prev[employeeId]?.showOt ?? false),
      },
    }))
  }

  const markAllPresent = () => {
    setRows((prev) => {
      const next = { ...prev }
      for (const emp of employees) {
        next[emp.id] = {
          status: 'PRESENT',
          overtimeHours: prev[emp.id]?.overtimeHours ?? '',
          showOt: prev[emp.id]?.showOt ?? false,
        }
      }
      return next
    })
  }

  const mutation = useBulkMarkAttendance()

  const onSave = () => {
    const marks: AttendanceMark[] = []
    for (const emp of employees) {
      const r = rows[emp.id]
      if (!r || !r.status) continue
      const ot = r.overtimeHours.trim()
      marks.push({
        employeeId: emp.id,
        status: r.status,
        ...(ot && /^\d+(\.\d{1,2})?$/.test(ot) ? { overtimeHours: ot } : {}),
      })
    }
    if (marks.length === 0) return
    mutation.mutate({ date, marks })
  }

  return (
    <AppShell pageTitle="Attendance">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold text-slate-900">Daily attendance</h1>
        <Link
          to="/attendance/summary"
          className="text-sm font-medium text-brand hover:underline"
        >
          Summary →
        </Link>
      </div>

      <div className="space-y-3 rounded-lg bg-white p-3 shadow-sm ring-1 ring-slate-200/60">
        <label className="block text-sm font-medium text-slate-700">
          Date
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="mt-1 block w-full rounded border border-slate-300 px-3 py-2 text-base focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand"
          />
        </label>
        {canMark && (
          <Button variant="secondary" size="md" onClick={markAllPresent} className="w-full">
            Mark all present
          </Button>
        )}
        {!canMark && (
          <p className="text-xs text-slate-500">
            Read-only view — only OWNER and MANAGER can mark attendance.
          </p>
        )}
      </div>

      {employeesQuery.isLoading || attendanceQuery.isLoading ? (
        <div className="space-y-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-20 w-full" />
          ))}
        </div>
      ) : employeesQuery.isError ? (
        <ErrorState
          message={apiErrorMessage(employeesQuery.error)}
          onRetry={() => void employeesQuery.refetch()}
        />
      ) : employees.length === 0 ? (
        <EmptyState
          title="No active employees"
          description="Add employees first to mark attendance."
        />
      ) : (
        <ul className="space-y-2 pb-24">
          {employees.map((emp) => {
            const r = rows[emp.id]
            const status = r?.status ?? null
            return (
              <li
                key={emp.id}
                className="rounded-lg bg-white p-3 shadow-sm ring-1 ring-slate-200/60"
              >
                <div className="flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <p className="font-medium truncate">{emp.name}</p>
                    <p className="text-xs text-slate-500">
                      {emp.empCode} · {emp.designation}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => toggleOt(emp.id)}
                    disabled={!canMark}
                    className="text-xs font-medium text-brand hover:underline disabled:text-slate-400 disabled:no-underline"
                  >
                    OT
                  </button>
                </div>
                <div className="mt-2 grid grid-cols-4 gap-2">
                  {STATUS_BUTTONS.map((b) => {
                    const selected = status === b.key
                    return (
                      <button
                        key={b.key}
                        type="button"
                        disabled={!canMark}
                        onClick={() => setStatus(emp.id, b.key)}
                        className={
                          'min-h-tap rounded-md text-base font-semibold transition disabled:cursor-not-allowed disabled:opacity-50 ' +
                          (selected
                            ? b.tone
                            : 'bg-slate-100 text-slate-700 hover:bg-slate-200')
                        }
                        aria-pressed={selected}
                      >
                        {b.label}
                      </button>
                    )
                  })}
                </div>
                {r?.showOt && (
                  <label className="mt-2 block text-xs text-slate-600">
                    OT hours
                    <input
                      type="text"
                      inputMode="decimal"
                      placeholder="e.g. 1.5"
                      value={r.overtimeHours}
                      onChange={(e) => setOt(emp.id, e.target.value)}
                      disabled={!canMark}
                      className="mt-1 block w-full rounded border border-slate-300 px-3 py-2 text-base disabled:bg-slate-50"
                    />
                  </label>
                )}
              </li>
            )
          })}
        </ul>
      )}

      {canMark && employees.length > 0 && (
        <div className="fixed inset-x-0 bottom-0 z-10 border-t border-slate-200 bg-white p-3 shadow-[0_-4px_12px_rgba(0,0,0,0.04)]">
          <div className="mx-auto flex max-w-2xl items-center justify-between gap-3">
            <p className="text-sm text-slate-600">
              {markedCount} marked
              {mutation.isError && (
                <span className="block text-xs text-red-600">
                  {apiErrorMessage(mutation.error)}
                </span>
              )}
              {mutation.isSuccess && (
                <span className="block text-xs text-emerald-700">
                  Saved {mutation.data?.count ?? markedCount}
                </span>
              )}
            </p>
            <Button
              size="tap"
              onClick={onSave}
              disabled={markedCount === 0 || mutation.isPending}
            >
              {mutation.isPending ? 'Saving…' : 'Save'}
            </Button>
          </div>
        </div>
      )}
    </AppShell>
  )
}
