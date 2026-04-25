import { Injectable } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { createCipheriv, createDecipheriv, randomBytes } from 'node:crypto'
import type { Env } from '../../config/env.validation'

const ALGO = 'aes-256-gcm'
const IV_BYTES = 12
const KEY_BYTES = 32

/**
 * AES-256-GCM at-rest encryption for PII (PAN/Aadhaar).
 * Output format: `iv:tag:ciphertext`, each segment base64url-encoded.
 * Key comes from ENCRYPTION_KEY env (64 hex chars). See design.md §D8.
 */
@Injectable()
export class CryptoService {
  private readonly key: Buffer

  constructor(config: ConfigService<Env, true>) {
    const hex = config.get('ENCRYPTION_KEY', { infer: true })
    const key = Buffer.from(hex, 'hex')
    if (key.length !== KEY_BYTES) {
      throw new Error(`ENCRYPTION_KEY must decode to ${KEY_BYTES} bytes`)
    }
    this.key = key
  }

  encrypt(plaintext: string): string {
    const iv = randomBytes(IV_BYTES)
    const cipher = createCipheriv(ALGO, this.key, iv)
    const ct = Buffer.concat([cipher.update(plaintext, 'utf8'), cipher.final()])
    const tag = cipher.getAuthTag()
    return `${iv.toString('base64url')}:${tag.toString('base64url')}:${ct.toString('base64url')}`
  }

  decrypt(payload: string): string {
    const parts = payload.split(':')
    if (parts.length !== 3) {
      throw new Error('Malformed ciphertext: expected iv:tag:ct')
    }
    const [ivB64, tagB64, ctB64] = parts as [string, string, string]
    const iv = Buffer.from(ivB64, 'base64url')
    const tag = Buffer.from(tagB64, 'base64url')
    const ct = Buffer.from(ctB64, 'base64url')

    const decipher = createDecipheriv(ALGO, this.key, iv)
    decipher.setAuthTag(tag)
    const plain = Buffer.concat([decipher.update(ct), decipher.final()])
    return plain.toString('utf8')
  }
}
