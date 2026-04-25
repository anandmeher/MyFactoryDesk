import { LogOut } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { api } from '@/lib/api'
import { clearSession, getCurrentUser, getRefreshToken } from '@/lib/auth'
import { cn } from '@/lib/cn'

const ROLE_BADGE: Record<string, string> = {
  OWNER: 'bg-amber-100 text-amber-900',
  MANAGER: 'bg-sky-100 text-sky-900',
  ACCOUNTANT: 'bg-violet-100 text-violet-900',
  STAFF: 'bg-slate-100 text-slate-700',
}

export function UserMenu() {
  const user = getCurrentUser()
  const navigate = useNavigate()
  const [open, setOpen] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    function onDocClick(e: MouseEvent) {
      if (!containerRef.current?.contains(e.target as Node)) setOpen(false)
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') setOpen(false)
    }
    document.addEventListener('mousedown', onDocClick)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onDocClick)
      document.removeEventListener('keydown', onKey)
    }
  }, [open])

  async function logout() {
    const refreshToken = getRefreshToken()
    if (refreshToken) {
      try {
        await api.post('/auth/logout', { refreshToken })
      } catch {
        /* best-effort */
      }
    }
    clearSession()
    navigate('/login', { replace: true })
  }

  if (!user) return null
  const initials = user.name
    .split(' ')
    .map((s) => s[0])
    .filter(Boolean)
    .slice(0, 2)
    .join('')
    .toUpperCase()

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
        className="flex h-10 min-w-[40px] items-center gap-2 rounded-full bg-white/10 px-2 text-sm font-medium text-white hover:bg-white/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-brand"
      >
        <span className="flex h-7 w-7 items-center justify-center rounded-full bg-white text-brand text-xs font-semibold">
          {initials || '?'}
        </span>
        <span className="hidden sm:inline truncate max-w-[10ch]">{user.name}</span>
      </button>

      {open && (
        <div
          role="menu"
          className="absolute right-0 top-full mt-2 w-64 origin-top-right rounded-lg bg-white text-slate-900 shadow-lg ring-1 ring-slate-200/60"
        >
          <div className="p-3 border-b border-slate-100">
            <p className="text-sm font-medium truncate">{user.name}</p>
            <p className="text-xs text-slate-500 truncate">{user.phone}</p>
            <span
              className={cn(
                'mt-2 inline-block rounded px-2 py-0.5 text-xs font-medium',
                ROLE_BADGE[user.role] ?? ROLE_BADGE.STAFF,
              )}
            >
              {user.role}
            </span>
          </div>
          <button
            type="button"
            role="menuitem"
            onClick={logout}
            className="flex min-h-tap w-full items-center gap-2 rounded-b-lg px-3 text-sm hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-inset"
          >
            <LogOut size={16} />
            Log out
          </button>
        </div>
      )}
    </div>
  )
}
