import { useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { formatInTimeZone } from 'date-fns-tz'
import type { AttendanceResponse } from '@myfactorydesk/shared'
import { AppShell } from '@/components/shell'
import { ErrorState } from '@/components/ui/ErrorState'
import { Skeleton } from '@/components/ui/Skeleton'
import { apiErrorMessage } from '@/lib/error'
import { useEmployee } from '@/features/employees/hooks/useEmployees'
import { useAttendanceList } from './hooks/useAttendance'

const IST = 'Asia/Kolkata'
const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
]

const STATUS_TONE: Record<AttendanceResponse['status'], string> = {
  PRESENT: 'bg-emerald-500 text-white',
  HALF_DAY: 'bg-amber-500 text-white',
  PAID_LEAVE: 'bg-sky-500 text-white',
  UNPAID_LEAVE: 'bg-slate-400 text-white',
  ABSENT: 'bg-red-500 text-white',
  HOLIDAY: 'bg-violet-500 text-white',
}

const STATUS_LABEL: Record<AttendanceResponse['status'], string> = {
  PRESENT: 'P',
  HALF_DAY: 'HD',
  PAID_LEAVE: 'L',
  UNPAID_LEAVE: 'UL',
  ABSENT: 'A',
  HOLIDAY: 'H',
}

function thisMonthIST() {
  const ym = formatInTimeZone(new Date(), IST, 'yyyy-MM')
  const [y, m] = ym.split('-')
  return { year: Number(y), month: Number(m) }
}

function pad2(n: number) {
  return n < 10 ? `0${n}` : String(n)
}

function monthBounds(year: number, month: number): { from: string; to: string; days: number } {
  const days = new Date(Date.UTC(year, month, 0)).getUTCDate()
  return {
    from: `${year}-${pad2(month)}-01`,
    to: `${year}-${pad2(month)}-${pad2(days)}`,
    days,
  }
}

export function AttendanceCalendar() {
  const { employeeId = '' } = useParams<{ employeeId: string }>()
  const initial = useMemo(thisMonthIST, [])
  const [month, setMonth] = useState(initial.month)
  const [year, setYear] = useState(initial.year)

  const employeeQuery = useEmployee(employeeId)
  const { from, to, days } = useMemo(() => monthBounds(year, month), [year, month])

  const attendanceQuery = useAttendanceList({ from, to, employeeId })

  const byDate = useMemo(() => {
    const map = new Map<string, AttendanceResponse>()
    for (const row of attendanceQuery.data ?? []) map.set(row.date, row)
    return map
  }, [attendanceQuery.data])

  const grid = useMemo(
    () => Array.from({ length: days }, (_, i) => `${year}-${pad2(month)}-${pad2(i + 1)}`),
    [days, year, month],
  )

  return (
    <AppShell pageTitle="Attendance calendar">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold text-slate-900">
          {employeeQuery.data?.name ?? 'Employee'}
          {employeeQuery.data && (
            <span className="ml-2 text-sm font-normal text-slate-500">
              {employeeQuery.data.empCode}
            </span>
          )}
        </h1>
        <Link to="/attendance/summary" className="text-sm font-medium text-brand hover:underline">
          Summary →
        </Link>
      </div>

      <div className="grid grid-cols-2 gap-2 rounded-lg bg-white p-3 shadow-sm ring-1 ring-slate-200/60">
        <label className="block text-sm font-medium text-slate-700">
          Month
          <select
            value={month}
            onChange={(e) => setMonth(Number(e.target.value))}
            className="mt-1 block w-full rounded border border-slate-300 px-3 py-2 text-base"
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
            className="mt-1 block w-full rounded border border-slate-300 px-3 py-2 text-base"
          />
        </label>
      </div>

      {attendanceQuery.isLoading ? (
        <Skeleton className="h-64 w-full" />
      ) : attendanceQuery.isError ? (
        <ErrorState
          message={apiErrorMessage(attendanceQuery.error)}
          onRetry={() => void attendanceQuery.refetch()}
        />
      ) : (
        <div className="rounded-lg bg-white p-3 shadow-sm ring-1 ring-slate-200/60">
          <div className="grid grid-cols-7 gap-1">
            {grid.map((dateStr) => {
              const day = Number(dateStr.slice(8, 10))
              const row = byDate.get(dateStr)
              return (
                <div
                  key={dateStr}
                  className={
                    'flex aspect-square flex-col items-center justify-center rounded text-xs font-medium ' +
                    (row ? STATUS_TONE[row.status] : 'bg-slate-100 text-slate-500')
                  }
                  title={`${dateStr}${row ? ` · ${row.status}` : ''}`}
                >
                  <span className="text-sm font-semibold">{day}</span>
                  {row && <span className="text-[10px]">{STATUS_LABEL[row.status]}</span>}
                </div>
              )
            })}
          </div>
          <Legend />
        </div>
      )}
    </AppShell>
  )
}

function Legend() {
  const items: Array<{ key: AttendanceResponse['status']; label: string }> = [
    { key: 'PRESENT', label: 'Present' },
    { key: 'HALF_DAY', label: 'Half day' },
    { key: 'PAID_LEAVE', label: 'Paid leave' },
    { key: 'UNPAID_LEAVE', label: 'Unpaid leave' },
    { key: 'ABSENT', label: 'Absent' },
    { key: 'HOLIDAY', label: 'Holiday' },
  ]
  return (
    <ul className="mt-4 grid grid-cols-2 gap-2 text-xs sm:grid-cols-3">
      {items.map((it) => (
        <li key={it.key} className="flex items-center gap-2">
          <span className={'inline-block h-3 w-3 rounded ' + STATUS_TONE[it.key]} />
          {it.label}
        </li>
      ))}
    </ul>
  )
}
