import { maskTail } from './pii'

describe('maskTail', () => {
  it('masks PAN to leave last 4 visible', () => {
    expect(maskTail('ABCDE1234F')).toBe('XXXXXX234F')
  })

  it('masks 12-digit Aadhaar', () => {
    expect(maskTail('123456789012')).toBe('XXXXXXXX9012')
  })

  it('returns all-X for short values', () => {
    expect(maskTail('1234')).toBe('XXXX')
    expect(maskTail('12')).toBe('XX')
    expect(maskTail('')).toBe('')
  })
})
