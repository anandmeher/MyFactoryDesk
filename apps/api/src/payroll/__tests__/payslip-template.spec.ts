import type { PayslipResponse } from '@myfactorydesk/shared'
import { renderPayslipHtml, type PayslipTemplateInput } from '../payslip-template'

const basePayslip: PayslipResponse = {
  id: 'pl_abc123',
  payrollRunId: 'run_xyz789',
  employeeId: 'emp_001',
  empCode: 'E001',
  employeeName: 'Asha Singh',
  daysPayable: 30,
  daysWorked: '30.00',
  basicEarned: '15000.00',
  hraEarned: '1500.00',
  allowancesBreakdown: [{ name: 'Travel', amount: '500.00' }],
  allowancesTotal: '500.00',
  otAmount: '0.00',
  grossEarnings: '17000.00',
  fixedDeductionsBreakdown: [{ name: 'PT', amount: '200.00' }],
  fixedDeductionsTotal: '200.00',
  advancesApplied: [],
  advanceDeducted: '0.00',
  totalDeductions: '200.00',
  netPay: '16800.00',
  carriedForward: [],
  calculatorVersion: 'v1.0.0',
  calculatedAt: '2026-04-30T10:00:00.000Z',
}

function buildInput(overrides: Partial<PayslipTemplateInput> = {}): PayslipTemplateInput {
  return {
    payslip: basePayslip,
    run: { month: 4, year: 2026, finalizedAt: '2026-04-30T10:00:00.000Z' },
    employee: {
      empCode: 'E001',
      name: 'Asha Singh',
      designation: 'Operator',
      dateOfJoining: new Date('2024-01-15T00:00:00.000Z'),
    },
    company: {
      name: 'Acme Paper Plates',
      addressLines: ['Plot 7, MIDC', 'Pune, MH 411019'],
    },
    ...overrides,
  }
}

describe('renderPayslipHtml', () => {
  it('returns a complete HTML document', () => {
    const html = renderPayslipHtml(buildInput())
    expect(html).toMatch(/^<!doctype html>/i)
    expect(html).toContain('</html>')
  })

  it('shows the period label, employee, and company', () => {
    const html = renderPayslipHtml(buildInput())
    expect(html).toContain('April 2026')
    expect(html).toContain('Asha Singh')
    expect(html).toContain('E001')
    expect(html).toContain('Operator')
    expect(html).toContain('Acme Paper Plates')
    expect(html).toContain('Plot 7, MIDC')
    expect(html).toContain('Pune, MH 411019')
  })

  it('formats every money figure as INR currency', () => {
    const html = renderPayslipHtml(buildInput())
    // ₹17,000.00 (gross), ₹16,800.00 (net), ₹200.00 (PT)
    expect(html).toMatch(/₹\s?17,000\.00/)
    expect(html).toMatch(/₹\s?16,800\.00/)
    expect(html).toMatch(/₹\s?200\.00/)
  })

  it('escapes HTML in employee name (XSS guard)', () => {
    const html = renderPayslipHtml(
      buildInput({
        employee: {
          empCode: 'E001',
          name: 'Asha <script>alert(1)</script>',
          designation: 'Operator',
          dateOfJoining: new Date('2024-01-15T00:00:00.000Z'),
        },
      }),
    )
    expect(html).toContain('Asha &lt;script&gt;alert(1)&lt;/script&gt;')
    expect(html).not.toContain('<script>alert(1)</script>')
  })

  it('omits the OT row when amount is zero', () => {
    const html = renderPayslipHtml(buildInput())
    expect(html).not.toMatch(/Overtime/)
  })

  it('includes the OT row when amount is positive', () => {
    const html = renderPayslipHtml(
      buildInput({
        payslip: { ...basePayslip, otAmount: '750.00', grossEarnings: '17750.00' },
      }),
    )
    expect(html).toContain('Overtime')
    expect(html).toMatch(/₹\s?750\.00/)
  })

  it('renders advances applied with remaining sublabel when partial', () => {
    const html = renderPayslipHtml(
      buildInput({
        payslip: {
          ...basePayslip,
          advancesApplied: [
            { advanceId: 'adv_partial1234', amountApplied: '1000.00', remaining: '500.00' },
            { advanceId: 'adv_full5678', amountApplied: '500.00', remaining: '0.00' },
          ],
          advanceDeducted: '1500.00',
          totalDeductions: '1700.00',
        },
      }),
    )
    expect(html).toContain('adv_part') // truncated id appears
    expect(html).toMatch(/Remaining.*₹\s?500\.00/)
    // The fully-applied advance should NOT show a "Remaining" sublabel
    expect((html.match(/Remaining/g) ?? []).length).toBe(1)
  })

  it('omits the carry-forward section when empty', () => {
    const html = renderPayslipHtml(buildInput())
    expect(html).not.toContain('Carried forward to next month')
  })

  it('shows the carry-forward section when populated', () => {
    const html = renderPayslipHtml(
      buildInput({
        payslip: {
          ...basePayslip,
          carriedForward: [{ advanceId: 'adv_carry9999', remaining: '300.00' }],
        },
      }),
    )
    expect(html).toContain('Carried forward to next month')
    expect(html).toContain('adv_carr')
  })

  it('embeds the calculator version and payslip id in the footer', () => {
    const html = renderPayslipHtml(buildInput())
    expect(html).toContain('v1.0.0')
    expect(html).toContain('pl_abc123')
  })
})
