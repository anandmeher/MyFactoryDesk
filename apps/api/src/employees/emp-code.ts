import { formatInTimeZone } from 'date-fns-tz'

const IST = 'Asia/Kolkata'

/** Year for empCode generation — always IST per CLAUDE.md §Dates. */
export function currentISTYear(now: Date = new Date()): number {
  return Number(formatInTimeZone(now, IST, 'yyyy'))
}

/**
 * Pure helper: given the highest existing sequence for the year, return the next code.
 * Format: `EMP{YYYY}{4-digit-sequence}` per spec (e.g., `EMP20260001`).
 */
export function buildEmpCode(year: number, sequence: number): string {
  if (sequence < 1 || sequence > 9999) {
    throw new Error(`empCode sequence out of range: ${sequence}`)
  }
  return `EMP${year}${String(sequence).padStart(4, '0')}`
}

/** Parses the 4-digit suffix out of EMP{YYYY}{NNNN}. Returns null if not matching. */
export function parseEmpCodeSequence(code: string, year: number): number | null {
  const m = new RegExp(`^EMP${year}(\\d{4})$`).exec(code)
  if (!m) return null
  return Number(m[1])
}
