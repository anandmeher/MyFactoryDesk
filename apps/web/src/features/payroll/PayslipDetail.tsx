import { useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { AppShell } from '@/components/shell'
import { Button } from '@/components/ui/Button'
import { ErrorState } from '@/components/ui/ErrorState'
import { Skeleton } from '@/components/ui/Skeleton'
import { apiErrorMessage } from '@/lib/error'
import { formatINR } from '@/lib/format'
import { useEmployee } from '@/features/employees/hooks/useEmployees'
import { getPayslipPdf } from './api'
import { usePayslip } from './hooks/usePayroll'

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
]

export function PayslipDetail() {
  const { id = '' } = useParams<{ id: string }>()
  const query = usePayslip(id)
  const employeeQuery = useEmployee(query.data?.employeeId)
  const [downloading, setDownloading] = useState(false)
  const [downloadError, setDownloadError] = useState<string | null>(null)

  if (query.isLoading) {
    return (
      <AppShell pageTitle="Payslip">
        <Skeleton className="h-72 w-full" />
      </AppShell>
    )
  }

  if (query.isError || !query.data) {
    return (
      <AppShell pageTitle="Payslip">
        <ErrorState
          message={apiErrorMessage(query.error)}
          onRetry={() => void query.refetch()}
        />
      </AppShell>
    )
  }

  const p = query.data
  const phone = employeeQuery.data?.phone ?? ''
  const monthName = MONTH_NAMES[(extractMonthFromCalculatedAt(p) ?? 1) - 1]
  const period = monthYearFromInputs(p) ?? p.calculatedAt.slice(0, 10)

  const waText = encodeURIComponent(
    `Hi ${p.employeeName}, your payslip for ${period}: Net ${formatINR(p.netPay)}.`,
  )
  const waHref = phone ? `https://wa.me/91${phone}?text=${waText}` : null

  async function handleDownload() {
    if (downloading) return
    setDownloadError(null)
    setDownloading(true)
    try {
      const { blob, filename } = await getPayslipPdf(p.id)
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = filename
      document.body.appendChild(a)
      a.click()
      a.remove()
      // Revoke after the click event has flushed.
      setTimeout(() => URL.revokeObjectURL(url), 0)
    } catch (err) {
      setDownloadError(apiErrorMessage(err))
    } finally {
      setDownloading(false)
    }
  }

  return (
    <AppShell pageTitle="Payslip">
      <div>
        <Link
          to="/payroll"
          className="inline-flex items-center gap-1 text-sm text-slate-600 hover:text-slate-900"
        >
          ← Payroll
        </Link>
        <div className="mt-1 flex items-center justify-between">
          <div>
            <h1 className="text-xl font-semibold text-slate-900">{p.employeeName}</h1>
            <p className="text-xs text-slate-500">
              {p.empCode} · {monthName} · v{p.calculatorVersion}
            </p>
          </div>
          <div className="text-right">
            <p className="text-xs text-slate-500">Net pay</p>
            <p className="text-base font-semibold">{formatINR(p.netPay)}</p>
          </div>
        </div>
      </div>

      <Section title="Earnings">
        <Row label="Days payable" value={String(p.daysPayable)} />
        <Row label="Days worked" value={p.daysWorked} />
        <Row label="Basic" value={formatINR(p.basicEarned)} />
        <Row label="HRA" value={formatINR(p.hraEarned)} />
        {p.allowancesBreakdown.map((a) => (
          <Row key={a.name} label={a.name} value={formatINR(a.amount)} />
        ))}
        <Row label="Allowances total" value={formatINR(p.allowancesTotal)} />
        <Row label="Overtime" value={formatINR(p.otAmount)} />
        <Row label="Gross" value={formatINR(p.grossEarnings)} bold />
      </Section>

      <Section title="Deductions">
        {p.fixedDeductionsBreakdown.map((d) => (
          <Row key={d.name} label={d.name} value={formatINR(d.amount)} />
        ))}
        <Row label="Fixed total" value={formatINR(p.fixedDeductionsTotal)} />
        {p.advancesApplied.map((a) => (
          <Row
            key={a.advanceId}
            label={`Advance (${a.advanceId.slice(0, 6)})`}
            value={formatINR(a.amountApplied)}
            sublabel={a.remaining !== '0.00' ? `Remaining ${formatINR(a.remaining)}` : undefined}
          />
        ))}
        <Row label="Advance total" value={formatINR(p.advanceDeducted)} />
        <Row label="Total deductions" value={formatINR(p.totalDeductions)} bold />
      </Section>

      {p.carriedForward.length > 0 && (
        <Section title="Carried forward to next month">
          {p.carriedForward.map((c) => (
            <Row
              key={c.advanceId}
              label={`Advance (${c.advanceId.slice(0, 6)})`}
              value={formatINR(c.remaining)}
            />
          ))}
        </Section>
      )}

      <div className="flex flex-col gap-2 sm:flex-row">
        <Button
          type="button"
          size="tap"
          onClick={handleDownload}
          disabled={downloading}
          className="flex-1"
        >
          {downloading ? 'Preparing PDF…' : 'Download PDF'}
        </Button>
        {waHref && (
          <a
            href={waHref}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex min-h-tap flex-1 items-center justify-center rounded border border-emerald-300 bg-white px-4 py-3 text-base font-medium text-emerald-700 hover:bg-emerald-50"
          >
            Share via WhatsApp
          </a>
        )}
      </div>
      {downloadError && (
        <p className="text-sm text-rose-600" role="alert">
          {downloadError}
        </p>
      )}
    </AppShell>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-lg bg-white p-4 shadow-sm ring-1 ring-slate-200/60">
      <h2 className="mb-2 text-sm font-semibold uppercase tracking-wide text-slate-500">
        {title}
      </h2>
      <dl className="space-y-1 text-sm">{children}</dl>
    </section>
  )
}

function Row({
  label,
  value,
  sublabel,
  bold,
}: {
  label: string
  value: string
  sublabel?: string
  bold?: boolean
}) {
  return (
    <div className={`flex items-baseline justify-between ${bold ? 'border-t border-slate-200 pt-1 font-semibold' : ''}`}>
      <dt>
        {label}
        {sublabel && <span className="ml-2 text-xs text-slate-500">{sublabel}</span>}
      </dt>
      <dd>{value}</dd>
    </div>
  )
}

function extractMonthFromCalculatedAt(p: { calculatedAt: string }): number | null {
  // calculatedAt is when the payslip was finalized — useful as a proxy month label
  const m = p.calculatedAt.match(/^\d{4}-(\d{2})/)
  return m ? Number(m[1]) : null
}

function monthYearFromInputs(_p: unknown): string | null {
  // We don't surface inputsJson on the wire; the PDF itself will show the proper period.
  // Keep this stub so the link copy can degrade gracefully.
  return null
}
