import { zodResolver } from '@hookform/resolvers/zod'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { Link, useNavigate } from 'react-router-dom'
import { formatInTimeZone } from 'date-fns-tz'
import { CreateAdvanceSchema, type CreateAdvanceInput } from '@myfactorydesk/shared'
import { AppShell } from '@/components/shell'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { apiErrorMessage } from '@/lib/error'
import { useEmployeesList } from '@/features/employees/hooks/useEmployees'
import { useCreateAdvance } from './hooks/useAdvances'

const IST = 'Asia/Kolkata'

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
]

export function NewAdvance() {
  const navigate = useNavigate()
  const create = useCreateAdvance()
  const employeesQuery = useEmployeesList({ active: true })
  const employees = employeesQuery.data?.data ?? []
  const [submitError, setSubmitError] = useState<string | null>(null)

  const today = formatInTimeZone(new Date(), IST, 'yyyy-MM-dd')
  const istNow = formatInTimeZone(new Date(), IST, 'yyyy-MM').split('-')
  const defaultMonth = Number(istNow[1])
  const defaultYear = Number(istNow[0])

  const form = useForm<CreateAdvanceInput>({
    resolver: zodResolver(CreateAdvanceSchema),
    defaultValues: {
      employeeId: '',
      amount: '',
      date: today,
      deductionMonth: defaultMonth,
      deductionYear: defaultYear,
      remarks: '',
    },
  })

  async function onSubmit(values: CreateAdvanceInput) {
    setSubmitError(null)
    try {
      const payload: CreateAdvanceInput = { ...values }
      if (!payload.remarks) delete payload.remarks
      await create.mutateAsync(payload)
      navigate('/advances', { replace: true })
    } catch (err) {
      setSubmitError(apiErrorMessage(err, 'Could not save advance'))
    }
  }

  const errors = form.formState.errors

  return (
    <AppShell pageTitle="New advance">
      <div>
        <Link
          to="/advances"
          className="inline-flex items-center gap-1 text-sm text-slate-600 hover:text-slate-900"
        >
          ← Advances
        </Link>
        <h1 className="mt-1 text-xl font-semibold text-slate-900">New advance</h1>
      </div>

      <form
        onSubmit={form.handleSubmit(onSubmit)}
        className="space-y-4 rounded-lg bg-white p-4 shadow-sm ring-1 ring-slate-200/60"
        noValidate
      >
        <Field label="Employee" error={errors.employeeId?.message}>
          <select
            {...form.register('employeeId')}
            className="block w-full rounded border border-slate-300 px-3 py-2 text-base"
          >
            <option value="">Select…</option>
            {employees.map((emp) => (
              <option key={emp.id} value={emp.id}>
                {emp.name} ({emp.empCode})
              </option>
            ))}
          </select>
        </Field>

        <Field label="Amount (₹)" error={errors.amount?.message}>
          <Input
            {...form.register('amount')}
            invalid={!!errors.amount}
            inputMode="decimal"
            placeholder="5000.00"
          />
        </Field>

        <Field label="Date" error={errors.date?.message}>
          <Input type="date" {...form.register('date')} invalid={!!errors.date} />
        </Field>

        <div className="grid grid-cols-2 gap-3">
          <Field label="Deduct in month" error={errors.deductionMonth?.message}>
            <select
              {...form.register('deductionMonth', { valueAsNumber: true })}
              className="block w-full rounded border border-slate-300 px-3 py-2 text-base"
            >
              {MONTH_NAMES.map((name, i) => (
                <option key={i} value={i + 1}>
                  {name}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Year" error={errors.deductionYear?.message}>
            <Input
              type="number"
              min={2000}
              max={2100}
              {...form.register('deductionYear', { valueAsNumber: true })}
              invalid={!!errors.deductionYear}
            />
          </Field>
        </div>

        <Field label="Remarks (optional)" error={errors.remarks?.message}>
          <Input {...form.register('remarks')} invalid={!!errors.remarks} />
        </Field>

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
            onClick={() => navigate('/advances')}
          >
            Cancel
          </Button>
          <Button type="submit" size="tap" className="flex-1" disabled={create.isPending}>
            {create.isPending ? 'Saving…' : 'Save'}
          </Button>
        </div>
      </form>
    </AppShell>
  )
}

function Field({
  label,
  error,
  children,
}: {
  label: string
  error?: string
  children: React.ReactNode
}) {
  return (
    <label className="block space-y-1">
      <span className="text-sm font-medium text-slate-700">{label}</span>
      {children}
      {error && <span className="block text-xs text-red-600">{error}</span>}
    </label>
  )
}
