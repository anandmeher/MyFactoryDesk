import { useNavigate } from 'react-router-dom'
import { api } from '@/lib/api'
import { clearSession, getCurrentUser, getRefreshToken } from '@/lib/auth'

export function Dashboard() {
  const user = getCurrentUser()
  const navigate = useNavigate()

  async function logout() {
    const refreshToken = getRefreshToken()
    if (refreshToken) {
      try {
        await api.post('/auth/logout', { refreshToken })
      } catch {
        // best-effort; clear locally regardless
      }
    }
    clearSession()
    navigate('/login', { replace: true })
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-brand text-white px-4 py-3 flex items-center justify-between">
        <h1 className="text-lg font-semibold">MyFactoryDesk</h1>
        <button
          onClick={logout}
          className="min-h-[40px] rounded bg-white/10 px-3 py-1 text-sm hover:bg-white/20"
        >
          Logout
        </button>
      </header>
      <main className="p-4 space-y-4">
        <div className="rounded bg-white p-4 shadow-sm">
          <p className="text-slate-500 text-sm">Signed in as</p>
          <p className="text-lg font-medium">{user?.name ?? 'Unknown'}</p>
          <p className="text-xs text-slate-400">{user?.role} · {user?.phone}</p>
        </div>
        <nav className="grid grid-cols-2 gap-3">
          <a href="/employees" className="min-h-tap rounded bg-white p-4 shadow-sm flex items-center justify-center font-medium">
            Employees
          </a>
          <a href="/attendance" className="min-h-tap rounded bg-white p-4 shadow-sm flex items-center justify-center font-medium text-slate-400">
            Attendance · soon
          </a>
          <a href="/advances" className="min-h-tap rounded bg-white p-4 shadow-sm flex items-center justify-center font-medium text-slate-400">
            Advances · soon
          </a>
          <a href="/payroll" className="min-h-tap rounded bg-white p-4 shadow-sm flex items-center justify-center font-medium text-slate-400">
            Payroll · soon
          </a>
        </nav>
      </main>
    </div>
  )
}
