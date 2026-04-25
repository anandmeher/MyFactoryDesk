import { buildEmpCode, currentISTYear, parseEmpCodeSequence } from './emp-code'

describe('emp-code', () => {
  it('builds zero-padded 4-digit codes', () => {
    expect(buildEmpCode(2026, 1)).toBe('EMP20260001')
    expect(buildEmpCode(2026, 42)).toBe('EMP20260042')
    expect(buildEmpCode(2026, 9999)).toBe('EMP20269999')
  })

  it('rejects out-of-range sequences', () => {
    expect(() => buildEmpCode(2026, 0)).toThrow()
    expect(() => buildEmpCode(2026, 10000)).toThrow()
  })

  it('parses the suffix back out', () => {
    expect(parseEmpCodeSequence('EMP20260042', 2026)).toBe(42)
    expect(parseEmpCodeSequence('EMP20260042', 2027)).toBeNull()
    expect(parseEmpCodeSequence('NOT-A-CODE', 2026)).toBeNull()
  })

  it('uses IST for the current year (a UTC date late on Dec 31 is next year in IST)', () => {
    // 2026-12-31T20:00:00Z = 2027-01-01T01:30 IST
    const lateUtc = new Date('2026-12-31T20:00:00Z')
    expect(currentISTYear(lateUtc)).toBe(2027)
  })
})
