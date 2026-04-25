import { ConfigService } from '@nestjs/config'
import { CryptoService } from './crypto.service'

const KEY_HEX = '04262645f1b35990c600e9c92d844ce0c23b34ac8e8b512aab89101ef1ee62a5'

function fakeConfig(value: string | undefined): ConfigService {
  return {
    get: () => value,
  } as unknown as ConfigService
}

describe('CryptoService', () => {
  it('round-trips PAN and Aadhaar values', () => {
    const svc = new CryptoService(fakeConfig(KEY_HEX) as never)

    const pan = 'ABCDE1234F'
    const aadhaar = '123456789012'

    const encPan = svc.encrypt(pan)
    const encAadhaar = svc.encrypt(aadhaar)

    expect(encPan).not.toContain(pan)
    expect(encAadhaar).not.toContain(aadhaar)
    expect(encPan.split(':')).toHaveLength(3)
    expect(encAadhaar.split(':')).toHaveLength(3)

    expect(svc.decrypt(encPan)).toBe(pan)
    expect(svc.decrypt(encAadhaar)).toBe(aadhaar)
  })

  it('produces a different ciphertext on each encrypt (random IV)', () => {
    const svc = new CryptoService(fakeConfig(KEY_HEX) as never)
    const a = svc.encrypt('ABCDE1234F')
    const b = svc.encrypt('ABCDE1234F')
    expect(a).not.toBe(b)
  })

  it('rejects malformed payloads', () => {
    const svc = new CryptoService(fakeConfig(KEY_HEX) as never)
    expect(() => svc.decrypt('not-a-payload')).toThrow(/iv:tag:ct/)
  })

  it('detects tampering via GCM auth tag', () => {
    const svc = new CryptoService(fakeConfig(KEY_HEX) as never)
    const enc = svc.encrypt('ABCDE1234F')
    const [iv, tag, ct] = enc.split(':') as [string, string, string]
    // Flip the first byte of the auth tag (16 bytes — no base64url padding ambiguity).
    const flipped = tag[0] === 'A' ? 'B' : 'A'
    const tampered = `${iv}:${flipped}${tag.slice(1)}:${ct}`
    expect(() => svc.decrypt(tampered)).toThrow()
  })

  it('rejects keys that are not 32 bytes', () => {
    const shortHex = '00'.repeat(16) // 16 bytes
    expect(() => new CryptoService(fakeConfig(shortHex) as never)).toThrow(/32 bytes/)
  })
})
