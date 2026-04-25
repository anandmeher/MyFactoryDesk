import type { LucideIcon } from 'lucide-react'
import { Link } from 'react-router-dom'
import { AppShell } from '@/components/shell'
import { NAV } from '@/components/shell/nav'
import { getCurrentUser } from '@/lib/auth'
import { cn } from '@/lib/cn'

export function Dashboard() {
  const user = getCurrentUser()
  const greeting = greetByHour()

  // Skip the Dashboard self-link in the tile grid; otherwise derive from the
  // single source of truth so adding a NAV entry adds a tile automatically.
  const tiles = NAV.filter((n) => n.to !== '/dashboard')

  return (
    <AppShell pageTitle="Dashboard">
      <section className="space-y-1">
        <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
          Signed in as {user?.role}
        </p>
        <h1 className="text-2xl font-semibold text-slate-900">
          {greeting}, {user?.name?.split(' ')[0] ?? 'there'}
        </h1>
        <p className="text-sm text-slate-500">
          {user?.phone}
        </p>
      </section>

      <section className="grid gap-3 sm:grid-cols-2">
        {tiles.map(({ to, label, icon: Icon, soon }) => (
          <Tile key={to} to={to} label={label} icon={Icon} soon={soon} />
        ))}
      </section>
    </AppShell>
  )
}

function Tile({
  to,
  label,
  icon: Icon,
  soon,
}: {
  to: string
  label: string
  icon: LucideIcon
  soon?: boolean
}) {
  const className = cn(
    'flex min-h-tap items-center gap-3 rounded-lg bg-white p-4 shadow-sm ring-1 ring-slate-200/60 transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2',
    soon ? 'cursor-not-allowed opacity-60' : 'hover:ring-slate-300',
  )
  const inner = (
    <>
      <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-brand/5 text-brand">
        <Icon size={20} />
      </span>
      <span className="flex-1 text-base font-medium text-slate-900">{label}</span>
      {soon && (
        <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-slate-500">
          soon
        </span>
      )}
    </>
  )
  if (soon) {
    return (
      <span className={className} aria-disabled="true">
        {inner}
      </span>
    )
  }
  return (
    <Link to={to} className={className}>
      {inner}
    </Link>
  )
}

function greetByHour(): string {
  const h = new Date().getHours()
  if (h < 12) return 'Good morning'
  if (h < 17) return 'Good afternoon'
  return 'Good evening'
}
