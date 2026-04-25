import { zodResolver } from '@hookform/resolvers/zod'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { Link, useNavigate } from 'react-router-dom'
import { CreateEmployeeSchema, type CreateEmployeeInput } from '@myfactorydesk/shared'
import { AppShell } from '@/components/shell'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { apiErrorMessage } from '@/lib/error'
import { useCreateEmployee } from './hooks/useEmployees'

export function NewEmployee() {
  const navigate = useNavigate()
  const create = useCreateEmployee()
  const [submitError, setSubmitError] = useState<string | null>(null)

  const form = useForm<CreateEmployeeInput>({
    resolver: zodResolver(CreateEmployeeSchema),
    defaultValues: {
      name: '',
      phone: '',
      designation: '',
      dateOfJoining: new Date().toISOString().slice(0, 10),
      salaryType: 'MONTHLY',
      basicSalary: '',
      hra: '0.00',
      allowances: [],
      fixedDeductions: [],
    },
  })

  async function onSubmit(values: CreateEmployeeInput) {
    setSubmitError(null)
    try {
      const created = await create.mutateAsync(values)
      navigate(`/employees/${created.id}`, { replace: true })
    } catch (err) {
      setSubmitError(apiErrorMessage(err, 'Could not create employee'))
    }
  }

  const errors = form.formState.errors

  return (
    <AppShell pageTitle="New employee">
      <div>
        <Link
          to="/employees"
          className="inline-flex items-center gap-1 text-sm text-slate-600 hover:text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2 rounded"
        >
          ← Employees
        </Link>
        <h1 className="mt-1 text-xl font-semibold text-slate-900">New employee</h1>
      </div>

      <form
        onSubmit={form.handleSubmit(onSubmit)}
        className="space-y-4 rounded-lg bg-white p-4 shadow-sm ring-1 ring-slate-200/60"
        noValidate
      >
        <Field label="Name" error={errors.name?.message}>
          <Input
            {...form.register('name')}
            invalid={!!errors.name}
            autoComplete="name"
          />
        </Field>

        <Field label="Phone" error={errors.phone?.message}>
          <Input
            {...form.register('phone')}
            invalid={!!errors.phone}
            inputMode="numeric"
            placeholder="10-digit mobile"
          />
        </Field>

        <Field label="Designation" error={errors.designation?.message}>
          <Input {...form.register('designation')} invalid={!!errors.designation} />
        </Field>

        <Field label="Date of joining" error={errors.dateOfJoining?.message}>
          <Input
            type="date"
            {...form.register('dateOfJoining')}
            invalid={!!errors.dateOfJoining}
          />
        </Field>

        <div className="grid grid-cols-2 gap-3">
          <Field label="Basic salary (₹)" error={errors.basicSalary?.message}>
            <Input
              {...form.register('basicSalary')}
              invalid={!!errors.basicSalary}
              inputMode="decimal"
              placeholder="15000.00"
            />
          </Field>
          <Field label="HRA (₹)" error={errors.hra?.message}>
            <Input
              {...form.register('hra')}
              invalid={!!errors.hra}
              inputMode="decimal"
              placeholder="0.00"
            />
          </Field>
        </div>

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
            onClick={() => navigate('/employees')}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            size="tap"
            className="flex-1"
            disabled={create.isPending}
          >
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
