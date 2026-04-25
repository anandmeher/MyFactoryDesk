import { zodResolver } from '@hookform/resolvers/zod'
import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { CreateAdvanceSchema, type CreateAdvanceInput } from '@myfactorydesk/shared'
import { AppShell } from '@/components/shell'
import { Button } from '@/components/ui/Button'
import { ErrorState } from '@/components/ui/ErrorState'
import { Input } from '@/components/ui/Input'
import { Skeleton } from '@/components/ui/Skeleton'
import { api, type ApiData } from '@/lib/api'
import { apiErrorMessage } from '@/lib/error'
import type { AdvanceResponse } from '@myfactorydesk/shared'
import { useEmployeesList } from '@/features/employees/hooks/useEmployees'
import { useUpdateAdvance } from './hooks/useAdvances'

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
]

async function getAdvance(id: string): Promise<AdvanceResponse> {
  const res = await api.get<ApiData<AdvanceResponse>>(`/advances/${id}`)
  return res.data.data
}

export function EditAdvance() {
  const { id = '' } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const employeesQuery = useEmployeesList({ active: true })
  const employees = employeesQuery.data?.data ?? []
  const [submitError, setSubmitError] = useState<string | null>(null)

  const advanceQuery = useQuery({
    queryKey: ['advances', 'detail', id],
    queryFn: () => getAdvance(id),
    enabled: Boolean(id),
  })

  const update = useUpdateAdvance(id)

  const form = useForm<CreateAdvanceInput>({
    resolver: zodResolver(CreateAdvanceSchema),
    defaultValues: {
      employeeId: '',
      amount: '',
      date: '',
      deductionMonth: 1,
      deductionYear: 2026,
      remarks: '',
    },
  })

  useEffect(() => {
    if (advanceQuery.data) {
      form.reset({
        employeeId: advanceQuery.data.employeeId,
        amount: advanceQuery.data.amount,
        date: advanceQuery.data.date,
        deductionMonth: advanceQuery.data.deductionMonth,
        deductionYear: advanceQuery.data.deductionYear,
        remarks: advanceQuery.data.remarks ?? '',
      })
    }
  }, [advanceQuery.data, form])

  async function onSubmit(values: CreateAdvanceInput) {
    setSubmitError(null)
    try {
      const payload: CreateAdvanceInput = { ...values }
      if (!payload.remarks) delete payload.remarks
      await update.mutateAsync(payload)
      navigate('/advances', { replace: true })
    } catch (err) {
      setSubmitError(apiErrorMessage(err, 'Could not save advance'))
    }
  }

  const errors = form.formState.errors

  if (advanceQuery.isLoading) {
    return (
      <AppShell pageTitle="Edit advance">
        <Skeleton className="h-72 w-full" />
      </AppShell>
    )
  }

  if (advanceQuery.isError) {
    return (
      <AppShell pageTitle="Edit advance">
        <ErrorState
          message={apiErrorMessage(advanceQuery.error)}
          onRetry={() => void advanceQuery.refetch()}
        />
      </AppShell>
    )
  }

  if (advanceQuery.data?.isDeducted || advanceQuery.data?.payrollRunId) {
    return (
      <AppShell pageTitle="Edit advance">
        <ErrorState message="This advance has been linked to a payroll run and cannot be edited." />
      </AppShell>
    )
  }

  return (
    <AppShell pageTitle="Edit advance">
      <div>
        <Link
          to="/advances"
          className="inline-flex items-center gap-1 text-sm text-slate-600 hover:text-slate-900"
        >
          ← Advances
        </Link>
        <h1 className="mt-1 text-xl font-semibold text-slate-900">Edit advance</h1>
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
          <Button type="submit" size="tap" className="flex-1" disabled={update.isPending}>
            {update.isPending ? 'Saving…' : 'Save'}
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
