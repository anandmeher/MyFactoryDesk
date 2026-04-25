import { useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { formatInTimeZone } from 'date-fns-tz'
import { AppShell } from '@/components/shell'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { apiErrorMessage } from '@/lib/error'
import { useCreatePayrollRun } from './hooks/usePayroll'

const IST = 'Asia/Kolkata'

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
]

function thisMonthIST() {
  const ym = formatInTimeZone(new Date(), IST, 'yyyy-MM')
  const [y, m] = ym.split('-')
  return { year: Number(y), month: Number(m) }
}

export function NewPayrollRun() {
  const navigate = useNavigate()
  const create = useCreatePayrollRun()
  const initial = useMemo(thisMonthIST, [])
  const [month, setMonth] = useState(initial.month)
  const [year, setYear] = useState(initial.year)
  const [submitError, setSubmitError] = useState<string | null>(null)

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSubmitError(null)
    try {
      const run = await create.mutateAsync({ month, year })
      navigate(`/payroll/${run.id}`, { replace: true })
    } catch (err) {
      setSubmitError(apiErrorMessage(err, 'Could not create run'))
    }
  }

  return (
    <AppShell pageTitle="New payroll run">
      <div>
        <Link
          to="/payroll"
          className="inline-flex items-center gap-1 text-sm text-slate-600 hover:text-slate-900"
        >
          ← Payroll
        </Link>
        <h1 className="mt-1 text-xl font-semibold text-slate-900">New run</h1>
      </div>

      <form
        onSubmit={onSubmit}
        className="space-y-4 rounded-lg bg-white p-4 shadow-sm ring-1 ring-slate-200/60"
      >
        <div className="grid grid-cols-2 gap-3">
          <label className="block space-y-1">
            <span className="text-sm font-medium text-slate-700">Month</span>
            <select
              value={month}
              onChange={(e) => setMonth(Number(e.target.value))}
              className="block w-full rounded border border-slate-300 px-3 py-2 text-base"
            >
              {MONTH_NAMES.map((name, i) => (
                <option key={i} value={i + 1}>
                  {name}
                </option>
              ))}
            </select>
          </label>
          <label className="block space-y-1">
            <span className="text-sm font-medium text-slate-700">Year</span>
            <Input
              type="number"
              min={2000}
              max={2100}
              value={year}
              onChange={(e) => setYear(Number(e.target.value))}
            />
          </label>
        </div>

        <p className="text-xs text-slate-500">
          If a draft for this period already exists, you'll be taken to it (no duplicates).
        </p>

        {submitError && (
          <div role="alert" className="rounded bg-red-50 px-3 py-2 text-sm text-red-700">
            {submitError}
          </div>
        )}

        <div className="flex gap-2 pt-2">
          <Button
            type="button"
            variant="secondary"
            size="tap"
            className="flex-1"
            onClick={() => navigate('/payroll')}
          >
            Cancel
          </Button>
          <Button type="submit" size="tap" className="flex-1" disabled={create.isPending}>
            {create.isPending ? 'Creating…' : 'Create'}
          </Button>
        </div>
      </form>
    </AppShell>
  )
}
