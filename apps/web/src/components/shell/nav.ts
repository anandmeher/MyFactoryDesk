import {
  CalendarDays,
  Home,
  Receipt,
  Users,
  Wallet,
  type LucideIcon,
} from 'lucide-react'

export type NavItem = {
  to: string
  label: string
  icon: LucideIcon
  /** When true, render disabled with a "soon" badge — route exists but module not built yet. */
  soon?: boolean
  /** Roles that should see this entry. Undefined = all authenticated roles. */
  visibleTo?: ReadonlyArray<'OWNER' | 'MANAGER' | 'STAFF' | 'ACCOUNTANT'>
}

export const NAV: ReadonlyArray<NavItem> = [
  { to: '/dashboard', label: 'Dashboard', icon: Home },
  { to: '/employees', label: 'Employees', icon: Users },
  { to: '/attendance', label: 'Attendance', icon: CalendarDays },
  { to: '/advances', label: 'Advances', icon: Wallet, soon: true },
  { to: '/payroll', label: 'Payroll', icon: Receipt, soon: true },
]
