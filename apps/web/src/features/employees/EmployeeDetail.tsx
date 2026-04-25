import { zodResolver } from '@hookform/resolvers/zod'
import { useState, type ReactNode } from 'react'
import { useForm } from 'react-hook-form'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { UpdateEmployeeSchema, type UpdateEmployeeInput } from '@myfactorydesk/shared'
import { AppShell } from '@/components/shell'
import { Button } from '@/components/ui/Button'
import { ErrorState } from '@/components/ui/ErrorState'
import { Input } from '@/components/ui/Input'
import { Skeleton } from '@/components/ui/Skeleton'
import { getCurrentUser } from '@/lib/auth'
import { apiErrorMessage } from '@/lib/error'
import { formatINR } from '@/lib/format'
import {
  useEmployee,
  useSoftDeleteEmployee,
  useUpdateEmployee,
} from './hooks/useEmployees'

const CAN_EDIT = new Set(['OWNER', 'MANAGER'])
const CAN_DELETE = new Set(['OWNER'])

export function EmployeeDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const user = getCurrentUser()
  const canEdit = user ? CAN_EDIT.has(user.role) : false
  const canDelete = user ? CAN_DELETE.has(user.role) : false

  const query = useEmployee(id)
  const [editing, setEditing] = useState(false)

  if (query.isLoading) {
    return (
      <DetailFrame name="Employee">
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-32 w-full" />
      </DetailFrame>
    )
  }

  if (query.isError || !query.data) {
    return (
      <DetailFrame name="Employee">
        <ErrorState
          message={apiErrorMessage(query.error, 'Could not load employee')}
          onRetry={() => void query.refetch()}
        />
      </DetailFrame>
    )
  }

  const emp = query.data

  return (
    <DetailFrame
      name={emp.name}
      action={
        canEdit && !editing ? (
          <Button variant="secondary" size="sm" onClick={() => setEditing(true)}>
            Edit
          </Button>
        ) : null
      }
    >
      {!editing ? (
        <ReadView
          employee={emp}
          canDelete={canDelete}
          onDeleted={() => navigate('/employees', { replace: true })}
        />
      ) : (
        <EditForm
          id={emp.id}
          initial={emp}
          onCancel={() => setEditing(false)}
          onSaved={() => setEditing(false)}
        />
      )}
    </DetailFrame>
  )
}

function DetailFrame({
  name,
  action,
  children,
}: {
  name: string
  action?: ReactNode
  children: ReactNode
}) {
  return (
    <AppShell pageTitle={name}>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <Link
            to="/employees"
            className="inline-flex items-center gap-1 text-sm text-slate-600 hover:text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2 rounded"
          >
            ← Employees
          </Link>
          <h1 className="mt-1 text-xl font-semibold text-slate-900 truncate">{name}</h1>
        </div>
        {action}
      </div>
      {children}
    </AppShell>
  )
}

function ReadView({
  employee,
  canDelete,
  onDeleted,
}: {
  employee: ReturnType<typeof useEmployee>['data'] & object
  canDelete: boolean
  onDeleted: () => void
}) {
  const del = useSoftDeleteEmployee()
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function onDelete() {
    setError(null)
    try {
      await del.mutateAsync(employee.id)
      onDeleted()
    } catch (e) {
      setError(apiErrorMessage(e, 'Could not delete'))
    }
  }

  return (
    <>
      <div className="rounded-lg bg-white p-4 shadow-sm ring-1 ring-slate-200/60 space-y-2">
        <Row label="empCode" value={employee.empCode} />
        <Row label="Phone" value={employee.phone} />
        <Row label="Designation" value={employee.designation} />
        <Row label="Date of joining" value={employee.dateOfJoining} />
        <Row label="Status" value={employee.isActive ? 'Active' : 'Inactive'} />
      </div>

      <div className="rounded-lg bg-white p-4 shadow-sm ring-1 ring-slate-200/60 space-y-2">
        <Row label="Basic salary" value={formatINR(employee.basicSalary)} />
        <Row label="HRA" value={formatINR(employee.hra)} />
      </div>

      {(employee.pan || employee.aadhaar) && (
        <div className="rounded-lg bg-white p-4 shadow-sm ring-1 ring-slate-200/60 space-y-2">
          {employee.pan && <Row label="PAN" value={employee.pan} />}
          {employee.aadhaar && <Row label="Aadhaar" value={employee.aadhaar} />}
          <p className="text-xs text-slate-400">
            PII is masked. OWNERs can view via API.
          </p>
        </div>
      )}

      {canDelete && employee.isActive && (
        <>
          {!confirmOpen ? (
            <Button
              variant="danger"
              size="tap"
              className="w-full"
              onClick={() => setConfirmOpen(true)}
            >
              Soft-delete employee
            </Button>
          ) : (
            <div className="rounded-lg bg-white p-4 shadow-sm ring-1 ring-slate-200/60 space-y-3">
              <p className="text-sm">
                Sets the employee inactive and stamps today as their date of leaving.
                Existing payslips remain intact.
              </p>
              {error && (
                <div role="alert" className="rounded bg-red-50 px-3 py-2 text-sm text-red-700">
                  {error}
                </div>
              )}
              <div className="flex gap-2">
                <Button
                  variant="secondary"
                  size="tap"
                  className="flex-1"
                  onClick={() => setConfirmOpen(false)}
                >
                  Cancel
                </Button>
                <Button
                  variant="danger"
                  size="tap"
                  className="flex-1"
                  onClick={onDelete}
                  disabled={del.isPending}
                >
                  {del.isPending ? 'Deleting…' : 'Confirm'}
                </Button>
              </div>
            </div>
          )}
        </>
      )}
    </>
  )
}

function EditForm({
  id,
  initial,
  onCancel,
  onSaved,
}: {
  id: string
  initial: ReturnType<typeof useEmployee>['data'] & object
  onCancel: () => void
  onSaved: () => void
}) {
  const update = useUpdateEmployee(id)
  const [submitError, setSubmitError] = useState<string | null>(null)

  // UpdateEmployeeSchema is the partial — we present the same fields as the create form
  // but only ship changed values. In practice we just send the whole subset.
  const form = useForm<UpdateEmployeeInput>({
    resolver: zodResolver(UpdateEmployeeSchema),
    defaultValues: {
      name: initial.name,
      phone: initial.phone,
      designation: initial.designation,
      basicSalary: initial.basicSalary,
      hra: initial.hra,
    },
  })

  async function onSubmit(values: UpdateEmployeeInput) {
    setSubmitError(null)
    try {
      await update.mutateAsync(values)
      onSaved()
    } catch (e) {
      setSubmitError(apiErrorMessage(e, 'Could not save'))
    }
  }

  const errors = form.formState.errors

  return (
    <form
      onSubmit={form.handleSubmit(onSubmit)}
      className="space-y-4 rounded-lg bg-white p-4 shadow-sm ring-1 ring-slate-200/60"
      noValidate
    >
      <Field label="Name" error={errors.name?.message}>
        <Input {...form.register('name')} invalid={!!errors.name} />
      </Field>
      <Field label="Phone" error={errors.phone?.message}>
        <Input {...form.register('phone')} invalid={!!errors.phone} inputMode="numeric" />
      </Field>
      <Field label="Designation" error={errors.designation?.message}>
        <Input {...form.register('designation')} invalid={!!errors.designation} />
      </Field>
      <div className="grid grid-cols-2 gap-3">
        <Field label="Basic (₹)" error={errors.basicSalary?.message}>
          <Input
            {...form.register('basicSalary')}
            invalid={!!errors.basicSalary}
            inputMode="decimal"
          />
        </Field>
        <Field label="HRA (₹)" error={errors.hra?.message}>
          <Input
            {...form.register('hra')}
            invalid={!!errors.hra}
            inputMode="decimal"
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
          onClick={onCancel}
        >
          Cancel
        </Button>
        <Button type="submit" size="tap" className="flex-1" disabled={update.isPending}>
          {update.isPending ? 'Saving…' : 'Save'}
        </Button>
      </div>
    </form>
  )
}

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-baseline justify-between gap-3">
      <span className="text-xs text-slate-500">{label}</span>
      <span className="text-sm font-medium text-right">{value}</span>
    </div>
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
