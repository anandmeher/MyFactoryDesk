import { useEffect, useRef } from 'react'
import { Link, useLocation, useMatch } from 'react-router-dom'
import { cn } from '@/lib/cn'
import { getCurrentUser } from '@/lib/auth'
import { useAppShell } from './AppShellContext'
import { NAV, type NavItem } from './nav'
import { useFocusTrap } from './useFocusTrap'

export function AppSidebar() {
  const { isDrawerOpen, closeDrawer } = useAppShell()
  const location = useLocation()
  const drawerRef = useRef<HTMLDivElement>(null)
  const user = getCurrentUser()

  // Auto-close drawer on route change (mobile UX).
  useEffect(() => {
    if (isDrawerOpen) closeDrawer()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.pathname])

  useFocusTrap(drawerRef, isDrawerOpen, closeDrawer)

  // Filter NAV by role visibility (visibleTo undefined → visible to all).
  const items = NAV.filter(
    (n) => !n.visibleTo || (user && n.visibleTo.includes(user.role as never)),
  )

  return (
    <>
      {/* Mobile drawer + backdrop */}
      <div
        aria-hidden={!isDrawerOpen}
        className={cn(
          'fixed inset-0 z-40 bg-black/40 backdrop-blur-sm transition-opacity md:hidden',
          isDrawerOpen ? 'opacity-100' : 'pointer-events-none opacity-0',
        )}
        onClick={closeDrawer}
      />
      <aside
        ref={drawerRef}
        role="navigation"
        aria-label="Primary"
        className={cn(
          // Mobile drawer
          'fixed left-0 top-0 z-50 h-full w-72 bg-white shadow-xl transition-transform duration-200 md:hidden',
          isDrawerOpen ? 'translate-x-0' : '-translate-x-full',
        )}
      >
        <SidebarBody items={items} />
      </aside>

      {/* Desktop fixed rail */}
      <aside
        role="navigation"
        aria-label="Primary"
        className="hidden md:fixed md:left-0 md:top-14 md:bottom-0 md:z-20 md:flex md:w-64 md:flex-col md:border-r md:border-slate-200 md:bg-white"
      >
        <SidebarBody items={items} />
      </aside>
    </>
  )
}

function SidebarBody({ items }: { items: ReadonlyArray<NavItem> }) {
  return (
    <nav className="flex h-full flex-col overflow-y-auto px-3 py-4">
      <p className="px-3 pb-2 text-xs font-medium uppercase tracking-wide text-slate-400">
        Workspace
      </p>
      <ul className="space-y-1">
        {items.map((item) => (
          <li key={item.to}>
            <SidebarItem item={item} />
          </li>
        ))}
      </ul>
    </nav>
  )
}

function SidebarItem({ item }: { item: NavItem }) {
  // Match nested routes too (active when on /employees/:id, etc.).
  const matched = useMatch({ path: item.to + '/*', end: false })
  const isActive = Boolean(matched)
  const Icon = item.icon

  if (item.soon) {
    return (
      <span
        aria-disabled="true"
        className="flex min-h-tap items-center gap-3 rounded-lg px-3 text-sm font-medium text-slate-400 cursor-not-allowed"
      >
        <Icon size={20} />
        <span className="flex-1">{item.label}</span>
        <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-slate-500">
          soon
        </span>
      </span>
    )
  }

  return (
    <Link
      to={item.to}
      className={cn(
        'flex min-h-tap items-center gap-3 rounded-lg px-3 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2',
        isActive
          ? 'bg-brand text-white shadow-sm'
          : 'text-slate-700 hover:bg-slate-100',
      )}
      aria-current={isActive ? 'page' : undefined}
    >
      <Icon size={20} />
      <span className="flex-1">{item.label}</span>
    </Link>
  )
}
