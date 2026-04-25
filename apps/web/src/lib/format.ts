import Decimal from 'decimal.js'

const inrFormatter = new Intl.NumberFormat('en-IN', {
  style: 'currency',
  currency: 'INR',
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
})

/** Format a money value (Decimal or string) for display in INR. */
export function formatINR(value: string | Decimal): string {
  const num = value instanceof Decimal ? value.toNumber() : Number(value)
  if (Number.isNaN(num)) return '—'
  return inrFormatter.format(num)
}

/** Strip the currency symbol — useful for inputs that need the bare amount. */
export function stripCurrency(formatted: string): string {
  return formatted.replace(/[^\d.-]/g, '')
}
