import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { formatInTimeZone } from 'date-fns-tz'
import { AppShell } from '@/components/shell'
import { EmptyState } from '@/components/ui/EmptyState'
import { ErrorState } from '@/components/ui/ErrorState'
import { Skeleton } from '@/components/ui/Skeleton'
import { apiErrorMessage } from '@/lib/error'
import { useAttendanceSummary } from './hooks/useAttendance'

const IST = 'Asia/Kolkata'

function thisMonthInIST() {
  const yyyy_mm = formatInTimeZone(new Date(), IST, 'yyyy-MM')
  const [yearStr, monthStr] = yyyy_mm.split('-')
  return { year: Number(yearStr), month: Number(monthStr) }
}

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
]

export function AttendanceSummary() {
  const initial = useMemo(thisMonthInIST, [])
  const [month, setMonth] = useState(initial.month)
  const [year, setYear] = useState(initial.year)

  const query = useAttendanceSummary({ month, year })

  return (
    <AppShell pageTitle="Attendance summary">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold text-slate-900">Monthly summary</h1>
        <Link to="/attendance" className="text-sm font-medium text-brand hover:underline">
          ← Daily mark
        </Link>
      </div>

      <div className="grid grid-cols-2 gap-2 rounded-lg bg-white p-3 shadow-sm ring-1 ring-slate-200/60">
        <label className="block text-sm font-medium text-slate-700">
          Month
          <select
            value={month}
            onChange={(e) => setMonth(Number(e.target.value))}
            className="mt-1 block w-full rounded border border-slate-300 px-3 py-2 text-base focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand"
          >
            {MONTH_NAMES.map((name, i) => (
              <option key={i} value={i + 1}>
                {name}
              </option>
            ))}
          </select>
        </label>
        <label className="block text-sm font-medium text-slate-700">
          Year
          <input
            type="number"
            min={2000}
            max={2100}
            value={year}
            onChange={(e) => setYear(Number(e.target.value))}
            className="mt-1 block w-full rounded border border-slate-300 px-3 py-2 text-base focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand"
          />
        </label>
      </div>

      {query.isLoading && (
        <div className="space-y-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-32 w-full" />
          ))}
        </div>
      )}

      {query.isError && (
        <ErrorState message={apiErrorMessage(query.error)} onRetry={() => void query.refetch()} />
      )}

      {query.data && query.data.length === 0 && (
        <EmptyState title="No employees" description="Add employees to see a summary." />
      )}

      {query.data && query.data.length > 0 && (
        <ul className="space-y-2">
          {query.data.map((row) => (
            <li
              key={row.employeeId}
              className="rounded-lg bg-white p-3 shadow-sm ring-1 ring-slate-200/60"
            >
              <div className="flex items-center justify-between">
                <div className="min-w-0">
                  <p className="font-medium truncate">{row.name}</p>
                  <p className="text-xs text-slate-500">{row.empCode}</p>
                </div>
                <Link
                  to={`/attendance/calendar/${row.employeeId}`}
                  className="text-xs font-medium text-brand hover:underline"
                >
                  Calendar →
                </Link>
              </div>
              <dl className="mt-2 grid grid-cols-3 gap-2 text-center text-xs sm:grid-cols-6">
                <Cell label="Present" value={row.present} tone="text-emerald-700" />
                <Cell label="Half" value={row.halfDay} tone="text-amber-700" />
                <Cell label="Paid L" value={row.paidLeave} tone="text-sky-700" />
                <Cell label="Unpaid L" value={row.unpaidLeave} tone="text-slate-700" />
                <Cell label="Absent" value={row.absent} tone="text-red-700" />
                <Cell label="Holiday" value={row.holiday} tone="text-violet-700" />
              </dl>
              {row.overtimeHours !== '0.00' && (
                <p className="mt-2 text-xs text-slate-600">
                  Overtime: <span className="font-medium">{row.overtimeHours} h</span>
                </p>
              )}
            </li>
          ))}
        </ul>
      )}
    </AppShell>
  )
}

function Cell({ label, value, tone }: { label: string; value: number; tone: string }) {
  return (
    <div className="rounded bg-slate-50 p-2">
      <dt className="text-[10px] uppercase tracking-wide text-slate-500">{label}</dt>
      <dd className={`text-base font-semibold ${tone}`}>{value}</dd>
    </div>
  )
}
