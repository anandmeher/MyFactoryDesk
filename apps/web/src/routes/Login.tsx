import { useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { LoginSchema, type AuthResponse } from '@myfactorydesk/shared'
import { api, type ApiData } from '@/lib/api'
import { setSession } from '@/lib/auth'

type LocationState = { from?: { pathname?: string } }

export function Login() {
  const navigate = useNavigate()
  const location = useLocation()
  const [phone, setPhone] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)

    const parsed = LoginSchema.safeParse({ phone, password })
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? 'Invalid input')
      return
    }

    setSubmitting(true)
    try {
      const res = await api.post<ApiData<AuthResponse>>('/auth/login', parsed.data)
      setSession(res.data.data)
      const dest = (location.state as LocationState | null)?.from?.pathname ?? '/dashboard'
      navigate(dest, { replace: true })
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { error?: { message?: string } } } }).response?.data?.error
          ?.message ?? 'Login failed'
      setError(msg)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 px-4">
      <form
        onSubmit={onSubmit}
        className="w-full max-w-sm space-y-4 rounded-lg bg-white p-6 shadow"
      >
        <h1 className="text-xl font-semibold text-brand">MyFactoryDesk</h1>
        <p className="text-sm text-slate-500">Sign in to continue.</p>

        <div className="space-y-1">
          <label htmlFor="phone" className="text-sm font-medium">Phone</label>
          <input
            id="phone"
            inputMode="numeric"
            autoComplete="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="10-digit mobile"
            className="w-full rounded border border-slate-300 px-3 py-2 text-base"
          />
        </div>

        <div className="space-y-1">
          <label htmlFor="password" className="text-sm font-medium">Password</label>
          <input
            id="password"
            type="password"
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full rounded border border-slate-300 px-3 py-2 text-base"
          />
        </div>

        {error && (
          <div role="alert" className="rounded bg-red-50 px-3 py-2 text-sm text-red-700">
            {error}
          </div>
        )}

        <button
          type="submit"
          disabled={submitting}
          className="w-full min-h-tap rounded bg-brand px-4 py-3 text-white font-medium disabled:opacity-60"
        >
          {submitting ? 'Signing in…' : 'Sign in'}
        </button>
      </form>
    </div>
  )
}
