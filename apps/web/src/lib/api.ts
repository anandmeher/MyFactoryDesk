import axios, { AxiosError, type AxiosRequestConfig, type InternalAxiosRequestConfig } from 'axios'
import {
  clearSession,
  getAccessToken,
  getRefreshToken,
  setTokens,
} from './auth'

const baseURL = import.meta.env.VITE_API_URL ?? 'http://localhost:3030/api/v1'

export const api = axios.create({
  baseURL,
  headers: { 'Content-Type': 'application/json' },
})

// --- Request: attach access token ------------------------------------------
api.interceptors.request.use((config) => {
  const token = getAccessToken()
  if (token) {
    config.headers = config.headers ?? {}
    ;(config.headers as Record<string, string>).Authorization = `Bearer ${token}`
  }
  return config
})

// --- Response: refresh-once on 401 -----------------------------------------
type RetriableConfig = InternalAxiosRequestConfig & { _retried?: boolean }

let refreshInflight: Promise<string | null> | null = null

async function performRefresh(): Promise<string | null> {
  const refresh = getRefreshToken()
  if (!refresh) return null
  try {
    const res = await axios.post<{
      data: { accessToken: string; refreshToken: string }
    }>(`${baseURL}/auth/refresh`, { refreshToken: refresh })
    const { accessToken, refreshToken } = res.data.data
    setTokens(accessToken, refreshToken)
    return accessToken
  } catch {
    return null
  }
}

api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const original = error.config as RetriableConfig | undefined
    const status = error.response?.status

    // Don't try to refresh on the refresh / login endpoints themselves.
    const url = original?.url ?? ''
    const isAuthEndpoint = url.includes('/auth/refresh') || url.includes('/auth/login')

    if (status === 401 && original && !original._retried && !isAuthEndpoint) {
      original._retried = true
      refreshInflight = refreshInflight ?? performRefresh()
      const newAccess = await refreshInflight
      refreshInflight = null

      if (newAccess) {
        original.headers = original.headers ?? {}
        ;(original.headers as Record<string, string>).Authorization = `Bearer ${newAccess}`
        return api.request(original as AxiosRequestConfig)
      }

      clearSession()
      // Hard navigate so all React state is reset.
      if (typeof window !== 'undefined' && window.location.pathname !== '/login') {
        window.location.assign('/login')
      }
    }

    return Promise.reject(error)
  },
)

/** Server response envelope per API conventions. */
export type ApiData<T> = { data: T }
export type ApiList<T> = {
  data: T[]
  meta: { total: number; page: number; pageSize: number; totalPages: number }
}
