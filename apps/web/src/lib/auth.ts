import type { AuthUser } from '@myfactorydesk/shared'

const ACCESS_KEY = 'mfd.accessToken'
const REFRESH_KEY = 'mfd.refreshToken'
const USER_KEY = 'mfd.user'

export function getAccessToken(): string | null {
  return localStorage.getItem(ACCESS_KEY)
}

export function getRefreshToken(): string | null {
  return localStorage.getItem(REFRESH_KEY)
}

export function getCurrentUser(): AuthUser | null {
  const raw = localStorage.getItem(USER_KEY)
  if (!raw) return null
  try {
    return JSON.parse(raw) as AuthUser
  } catch {
    return null
  }
}

export function setSession(tokens: { accessToken: string; refreshToken: string; user: AuthUser }): void {
  localStorage.setItem(ACCESS_KEY, tokens.accessToken)
  localStorage.setItem(REFRESH_KEY, tokens.refreshToken)
  localStorage.setItem(USER_KEY, JSON.stringify(tokens.user))
}

export function setTokens(accessToken: string, refreshToken: string): void {
  localStorage.setItem(ACCESS_KEY, accessToken)
  localStorage.setItem(REFRESH_KEY, refreshToken)
}

export function clearSession(): void {
  localStorage.removeItem(ACCESS_KEY)
  localStorage.removeItem(REFRESH_KEY)
  localStorage.removeItem(USER_KEY)
}

export function isAuthenticated(): boolean {
  return getAccessToken() !== null
}
