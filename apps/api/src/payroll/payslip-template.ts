import type { PayslipResponse } from '@myfactorydesk/shared'

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
]

export type PayslipTemplateInput = {
  payslip: PayslipResponse
  run: { month: number; year: number; finalizedAt: string | null }
  employee: {
    empCode: string
    name: string
    designation: string | null
    dateOfJoining: Date
  }
  company: {
    name: string
    addressLines: string[]
  }
}

export function renderPayslipHtml(input: PayslipTemplateInput): string {
  const { payslip: p, run, employee, company } = input
  const monthName = MONTH_NAMES[run.month - 1]
  const periodLabel = `${monthName} ${run.year}`
  const generated = new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })
  const joining = formatDateIST(employee.dateOfJoining)

  const earningsRows: TableRow[] = [
    { label: 'Basic', value: p.basicEarned },
    { label: 'HRA', value: p.hraEarned },
    ...p.allowancesBreakdown.map((a) => ({ label: a.name, value: a.amount })),
  ]
  if (Number(p.otAmount) > 0) {
    earningsRows.push({ label: `Overtime`, value: p.otAmount })
  }

  const deductionRows: TableRow[] = [
    ...p.fixedDeductionsBreakdown.map((d) => ({ label: d.name, value: d.amount })),
    ...p.advancesApplied.map((a) => ({
      label: `Advance (${a.advanceId.slice(0, 8)})`,
      value: a.amountApplied,
      sub: Number(a.remaining) > 0 ? `Remaining ${formatINR(a.remaining)}` : undefined,
    })),
  ]

  const carryRows: TableRow[] = p.carriedForward.map((c) => ({
    label: `Advance (${c.advanceId.slice(0, 8)})`,
    value: c.remaining,
  }))

  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8" />
<title>Payslip — ${esc(employee.name)} — ${esc(periodLabel)}</title>
<style>
  * { box-sizing: border-box; }
  body {
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Helvetica, Arial, sans-serif;
    color: #0f172a;
    margin: 0;
    font-size: 12px;
    line-height: 1.45;
  }
  .page { padding: 0; }
  header { border-bottom: 2px solid #0f172a; padding-bottom: 12px; margin-bottom: 16px; }
  header .top { display: flex; justify-content: space-between; align-items: flex-start; gap: 24px; }
  h1 { margin: 0 0 2px 0; font-size: 18px; }
  .muted { color: #64748b; }
  .small { font-size: 11px; }
  .right { text-align: right; }
  .grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 16px;
    margin-bottom: 16px;
  }
  .card {
    border: 1px solid #e2e8f0;
    border-radius: 6px;
    padding: 10px 12px;
  }
  .card h2 {
    font-size: 11px;
    text-transform: uppercase;
    letter-spacing: 0.04em;
    color: #475569;
    margin: 0 0 6px 0;
  }
  table { width: 100%; border-collapse: collapse; }
  td { padding: 4px 0; vertical-align: top; }
  td.amount { text-align: right; white-space: nowrap; font-variant-numeric: tabular-nums; }
  tr.subtotal td { border-top: 1px solid #cbd5e1; padding-top: 6px; font-weight: 600; }
  tr.grand td { border-top: 2px solid #0f172a; padding-top: 8px; font-weight: 700; font-size: 13px; }
  .net {
    margin-top: 16px;
    padding: 12px 16px;
    background: #f8fafc;
    border: 1px solid #e2e8f0;
    border-radius: 6px;
    display: flex;
    justify-content: space-between;
    align-items: center;
  }
  .net .label { font-size: 11px; text-transform: uppercase; letter-spacing: 0.04em; color: #475569; }
  .net .value { font-size: 18px; font-weight: 700; }
  footer {
    margin-top: 24px;
    padding-top: 8px;
    border-top: 1px solid #e2e8f0;
    color: #64748b;
    font-size: 10px;
    display: flex;
    justify-content: space-between;
  }
</style>
</head>
<body>
<div class="page">
  <header>
    <div class="top">
      <div>
        <h1>${esc(company.name)}</h1>
        ${company.addressLines.map((l) => `<div class="small muted">${esc(l)}</div>`).join('')}
      </div>
      <div class="right">
        <div class="muted small">Payslip</div>
        <div style="font-size: 14px; font-weight: 600;">${esc(periodLabel)}</div>
      </div>
    </div>
  </header>

  <div class="grid">
    <div class="card">
      <h2>Employee</h2>
      <div><strong>${esc(employee.name)}</strong></div>
      <div class="small muted">Code: ${esc(employee.empCode)}</div>
      ${employee.designation ? `<div class="small muted">${esc(employee.designation)}</div>` : ''}
      <div class="small muted">Joined: ${esc(joining)}</div>
    </div>
    <div class="card">
      <h2>Run</h2>
      <div><strong>${esc(periodLabel)}</strong></div>
      <div class="small muted">Days payable: ${p.daysPayable}</div>
      <div class="small muted">Days worked: ${esc(p.daysWorked)}</div>
      ${run.finalizedAt ? `<div class="small muted">Finalized: ${esc(formatDateIST(new Date(run.finalizedAt)))}</div>` : ''}
    </div>
  </div>

  <div class="grid">
    <div class="card">
      <h2>Earnings</h2>
      <table>
        ${earningsRows.map(rowHtml).join('')}
        <tr class="subtotal">
          <td>Allowances total</td>
          <td class="amount">${formatINR(p.allowancesTotal)}</td>
        </tr>
        <tr class="grand">
          <td>Gross earnings</td>
          <td class="amount">${formatINR(p.grossEarnings)}</td>
        </tr>
      </table>
    </div>
    <div class="card">
      <h2>Deductions</h2>
      <table>
        ${deductionRows.length ? deductionRows.map(rowHtml).join('') : '<tr><td class="muted small">None</td><td></td></tr>'}
        <tr class="subtotal">
          <td>Fixed total</td>
          <td class="amount">${formatINR(p.fixedDeductionsTotal)}</td>
        </tr>
        <tr class="subtotal">
          <td>Advances deducted</td>
          <td class="amount">${formatINR(p.advanceDeducted)}</td>
        </tr>
        <tr class="grand">
          <td>Total deductions</td>
          <td class="amount">${formatINR(p.totalDeductions)}</td>
        </tr>
      </table>
    </div>
  </div>

  <div class="net">
    <div class="label">Net pay</div>
    <div class="value">${formatINR(p.netPay)}</div>
  </div>

  ${
    carryRows.length
      ? `<div class="card" style="margin-top: 16px;">
           <h2>Carried forward to next month</h2>
           <table>${carryRows.map(rowHtml).join('')}</table>
         </div>`
      : ''
  }

  <footer>
    <span>Generated ${esc(generated)} IST · calculator ${esc(p.calculatorVersion)}</span>
    <span>Payslip ID ${esc(p.id)}</span>
  </footer>
</div>
</body>
</html>`
}

type TableRow = { label: string; value: string; sub?: string }

function rowHtml(r: TableRow): string {
  return `<tr>
    <td>${esc(r.label)}${r.sub ? ` <span class="small muted">${esc(r.sub)}</span>` : ''}</td>
    <td class="amount">${formatINR(r.value)}</td>
  </tr>`
}

function formatINR(amount: string): string {
  const n = Number(amount)
  if (!Number.isFinite(n)) return `₹${amount}`
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(n)
}

function formatDateIST(d: Date): string {
  return d.toLocaleDateString('en-IN', {
    timeZone: 'Asia/Kolkata',
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  })
}

function esc(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}
