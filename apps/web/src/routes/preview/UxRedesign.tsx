import {
  ArrowLeft,
  ArrowRight,
  Bell,
  Calendar,
  CalendarDays,
  Check,
  CheckCircle2,
  ChevronRight,
  Clock,
  Download,
  FileText,
  Filter,
  Home,
  IndianRupee,
  LogOut,
  Mail,
  Menu,
  MoreVertical,
  Phone,
  Plus,
  Receipt,
  Search,
  Share2,
  TrendingUp,
  User,
  Users,
  Wallet,
  X,
} from 'lucide-react'
import { useState, type ReactNode } from 'react'

// =============================================================================
// Self-contained UX redesign preview.
//
// This file imports nothing from /features so it never touches API calls or
// mutates any real state. It renders every redesigned v1 page stacked
// vertically as section mocks so the owner can scroll the whole product.
// =============================================================================

const SECTIONS = [
  { id: 'tokens', label: 'Tokens & primitives' },
  { id: 'shell', label: 'New shell chrome' },
  { id: 'login', label: 'Login' },
  { id: 'dashboard', label: 'Dashboard' },
  { id: 'employees-list', label: 'Employees · List' },
  { id: 'employees-detail', label: 'Employees · Detail' },
  { id: 'employees-form', label: 'Employees · Form' },
  { id: 'attendance-mark', label: 'Attendance · Daily mark' },
  { id: 'attendance-calendar', label: 'Attendance · Calendar' },
  { id: 'attendance-summary', label: 'Attendance · Summary' },
  { id: 'advances-list', label: 'Advances · List' },
  { id: 'advances-form', label: 'Advances · Form' },
  { id: 'payroll-list', label: 'Payroll · Runs list' },
  { id: 'payroll-wizard', label: 'Payroll · New run wizard' },
  { id: 'payroll-detail', label: 'Payroll · Run detail' },
  { id: 'payslip-detail', label: 'Payslip · Print view' },
]

export function UxRedesign() {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 antialiased">
      <PreviewHeader />
      <main className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6">
        <Hero />
        <SectionAnchorMenu />

        <Section id="tokens" title="1 · Tokens & primitives">
          <Tokens />
          <Primitives />
        </Section>

        <Section id="shell" title="2 · New shell chrome (white theme)">
          <ShellPreview />
        </Section>

        <Section id="login" title="3 · Login">
          <DeviceFrame>
            <LoginMock />
          </DeviceFrame>
        </Section>

        <Section id="dashboard" title="4 · Dashboard">
          <DeviceFrame>
            <ShellFrame title="Dashboard">
              <DashboardMock />
            </ShellFrame>
          </DeviceFrame>
        </Section>

        <Section id="employees-list" title="5 · Employees · List">
          <DeviceFrame>
            <ShellFrame title="Employees">
              <EmployeesListMock />
            </ShellFrame>
          </DeviceFrame>
          <DesktopFrame>
            <ShellFrame title="Employees" desktop>
              <EmployeesTableMock />
            </ShellFrame>
          </DesktopFrame>
        </Section>

        <Section id="employees-detail" title="6 · Employees · Detail">
          <DeviceFrame>
            <ShellFrame title="Sumit Patel">
              <EmployeeDetailMock />
            </ShellFrame>
          </DeviceFrame>
        </Section>

        <Section id="employees-form" title="7 · Employees · Form (New / Edit)">
          <DeviceFrame>
            <ShellFrame title="New employee">
              <EmployeeFormMock />
            </ShellFrame>
          </DeviceFrame>
        </Section>

        <Section id="attendance-mark" title="8 · Attendance · Daily mark">
          <DeviceFrame>
            <ShellFrame title="Attendance">
              <AttendanceMarkMock />
            </ShellFrame>
          </DeviceFrame>
        </Section>

        <Section id="attendance-calendar" title="9 · Attendance · Calendar">
          <DeviceFrame>
            <ShellFrame title="Sumit Patel · April">
              <AttendanceCalendarMock />
            </ShellFrame>
          </DeviceFrame>
        </Section>

        <Section id="attendance-summary" title="10 · Attendance · Monthly summary">
          <DeviceFrame>
            <ShellFrame title="April 2026">
              <AttendanceSummaryMock />
            </ShellFrame>
          </DeviceFrame>
        </Section>

        <Section id="advances-list" title="11 · Advances · List">
          <DeviceFrame>
            <ShellFrame title="Advances">
              <AdvancesListMock />
            </ShellFrame>
          </DeviceFrame>
        </Section>

        <Section id="advances-form" title="12 · Advances · Form">
          <DeviceFrame>
            <ShellFrame title="New advance">
              <AdvanceFormMock />
            </ShellFrame>
          </DeviceFrame>
        </Section>

        <Section id="payroll-list" title="13 · Payroll · Runs list">
          <DeviceFrame>
            <ShellFrame title="Payroll runs">
              <PayrollListMock />
            </ShellFrame>
          </DeviceFrame>
        </Section>

        <Section id="payroll-wizard" title="14 · Payroll · New run (wizard)">
          <DeviceFrame>
            <ShellFrame title="New payroll run">
              <PayrollWizardMock />
            </ShellFrame>
          </DeviceFrame>
        </Section>

        <Section id="payroll-detail" title="15 · Payroll · Run detail">
          <DeviceFrame>
            <ShellFrame title="April 2026 · Payroll">
              <PayrollRunDetailMock />
            </ShellFrame>
          </DeviceFrame>
        </Section>

        <Section id="payslip-detail" title="16 · Payslip · Print view">
          <DeviceFrame wide>
            <ShellFrame title="Payslip · Sumit Patel · Apr 2026">
              <PayslipDetailMock />
            </ShellFrame>
          </DeviceFrame>
        </Section>

        <FooterNote />
      </main>
    </div>
  )
}

// =============================================================================
// Page wrappers (preview chrome around each mock)
// =============================================================================

function PreviewHeader() {
  return (
    <div className="sticky top-0 z-40 border-b border-slate-200 bg-white/90 backdrop-blur">
      <div className="mx-auto flex h-14 w-full max-w-6xl items-center gap-3 px-4 sm:px-6">
        <span className="rounded-md bg-indigo-600 px-2 py-1 text-xs font-semibold uppercase tracking-wide text-white">
          Preview
        </span>
        <div className="min-w-0">
          <h1 className="truncate text-sm font-semibold text-slate-900">
            MyFactoryDesk · Enterprise white-theme UX
          </h1>
          <p className="text-xs text-slate-500">
            Stub data · no live actions · scroll to review every page
          </p>
        </div>
      </div>
    </div>
  )
}

function Hero() {
  return (
    <header className="mb-10">
      <p className="text-xs font-semibold uppercase tracking-wider text-indigo-600">
        Mock for sign-off
      </p>
      <h2 className="mt-2 text-3xl font-semibold tracking-tight text-slate-900 sm:text-4xl">
        A clean, slick, white-theme product
      </h2>
      <p className="mt-3 max-w-2xl text-base text-slate-600">
        One coherent design system applied across every v1 page: tokens, primitives, page
        templates, and consistent sticky toolbars. Mobile and desktop views shown where they
        diverge.
      </p>
      <p className="mt-4 text-sm text-slate-500">
        Open this URL on your phone to feel the real touch behaviour. Use the menu below to jump
        to any page.
      </p>
    </header>
  )
}

function SectionAnchorMenu() {
  return (
    <nav
      aria-label="Preview sections"
      className="mb-12 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm"
    >
      <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-slate-500">
        Jump to a page
      </p>
      <ul className="grid gap-2 sm:grid-cols-2 md:grid-cols-3">
        {SECTIONS.map((s) => (
          <li key={s.id}>
            <a
              href={`#${s.id}`}
              className="flex items-center justify-between gap-2 rounded-lg px-3 py-2 text-sm text-slate-700 hover:bg-indigo-50 hover:text-indigo-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2"
            >
              <span>{s.label}</span>
              <ChevronRight size={16} className="text-slate-400" />
            </a>
          </li>
        ))}
      </ul>
    </nav>
  )
}

function Section({
  id,
  title,
  children,
}: {
  id: string
  title: string
  children: ReactNode
}) {
  return (
    <section id={id} className="mb-16 scroll-mt-20">
      <div className="mb-4 flex items-baseline justify-between gap-3">
        <h3 className="text-xl font-semibold tracking-tight text-slate-900">{title}</h3>
        <a
          href="#top"
          onClick={(e) => {
            e.preventDefault()
            window.scrollTo({ top: 0, behavior: 'smooth' })
          }}
          className="text-xs font-medium text-indigo-600 hover:underline"
        >
          ↑ Top
        </a>
      </div>
      <div className="space-y-6">{children}</div>
    </section>
  )
}

function DeviceFrame({
  children,
  wide,
}: {
  children: ReactNode
  wide?: boolean
}) {
  return (
    <div className="flex justify-center">
      <div
        className={`overflow-hidden rounded-[2rem] border-[10px] border-slate-900 bg-white shadow-2xl ${
          wide ? 'w-full max-w-md' : 'w-[360px]'
        }`}
      >
        <div className="h-[720px] overflow-y-auto bg-white">{children}</div>
      </div>
    </div>
  )
}

function DesktopFrame({ children }: { children: ReactNode }) {
  return (
    <div className="hidden lg:block">
      <p className="mb-3 text-xs font-medium uppercase tracking-wider text-slate-500">
        Desktop view (≥ 1024px)
      </p>
      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        {children}
      </div>
    </div>
  )
}

function ShellFrame({
  title,
  children,
  desktop,
}: {
  title: string
  children: ReactNode
  desktop?: boolean
}) {
  return (
    <div className="flex h-full min-h-full flex-col bg-white">
      <header className="flex h-14 shrink-0 items-center gap-3 border-b border-slate-200 bg-white px-3">
        {!desktop && (
          <button
            type="button"
            aria-label="Open navigation"
            className="flex h-10 w-10 items-center justify-center rounded-lg text-slate-700 hover:bg-slate-100"
          >
            <Menu size={20} />
          </button>
        )}
        {desktop && (
          <span className="font-semibold tracking-tight text-slate-900">MyFactoryDesk</span>
        )}
        <div className="flex min-w-0 items-baseline gap-2">
          {!desktop && (
            <span className="font-semibold tracking-tight text-slate-900">MyFactoryDesk</span>
          )}
          <span aria-hidden className="text-slate-300">
            ·
          </span>
          <span className="truncate text-sm text-slate-500">{title}</span>
        </div>
        <div className="ml-auto flex items-center gap-2">
          <button
            type="button"
            className="flex h-9 w-9 items-center justify-center rounded-lg text-slate-500 hover:bg-slate-100"
            aria-label="Notifications"
          >
            <Bell size={18} />
          </button>
          <span className="flex h-9 items-center gap-2 rounded-full pl-1 pr-3 text-sm font-medium text-slate-700 hover:bg-slate-100">
            <span className="flex h-7 w-7 items-center justify-center rounded-full bg-indigo-600 text-xs font-semibold text-white">
              SP
            </span>
            <span className="hidden sm:inline">Suresh</span>
          </span>
        </div>
      </header>
      <div className="flex flex-1 overflow-hidden">
        {desktop && <DesktopSidebar />}
        <div className="flex-1 overflow-y-auto bg-white">{children}</div>
      </div>
    </div>
  )
}

function DesktopSidebar() {
  const items: Array<{ icon: typeof Home; label: string; active?: boolean }> = [
    { icon: Home, label: 'Dashboard' },
    { icon: Users, label: 'Employees', active: true },
    { icon: CalendarDays, label: 'Attendance' },
    { icon: Wallet, label: 'Advances' },
    { icon: Receipt, label: 'Payroll' },
  ]
  return (
    <aside className="w-60 shrink-0 border-r border-slate-200 bg-white p-3">
      <p className="mb-2 px-2 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
        Workspace
      </p>
      <ul className="space-y-1">
        {items.map((it) => (
          <li key={it.label}>
            <a
              href="#"
              className={`relative flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition ${
                it.active
                  ? 'border-l-2 border-indigo-600 bg-indigo-50 pl-[10px] text-indigo-700'
                  : 'text-slate-700 hover:bg-slate-50'
              }`}
            >
              <it.icon size={18} />
              {it.label}
            </a>
          </li>
        ))}
      </ul>
    </aside>
  )
}

// =============================================================================
// Tokens & primitives
// =============================================================================

// Static lists so Tailwind JIT finds the classes.
const SLATE = [
  { s: 50, cls: 'bg-slate-50' },
  { s: 100, cls: 'bg-slate-100' },
  { s: 200, cls: 'bg-slate-200' },
  { s: 300, cls: 'bg-slate-300' },
  { s: 500, cls: 'bg-slate-500' },
  { s: 700, cls: 'bg-slate-700' },
  { s: 900, cls: 'bg-slate-900' },
]
const INDIGO = [
  { s: 50, cls: 'bg-indigo-50' },
  { s: 100, cls: 'bg-indigo-100' },
  { s: 500, cls: 'bg-indigo-500' },
  { s: 600, cls: 'bg-indigo-600' },
  { s: 700, cls: 'bg-indigo-700' },
]
const EMERALD = [
  { s: 50, cls: 'bg-emerald-50' },
  { s: 100, cls: 'bg-emerald-100' },
  { s: 500, cls: 'bg-emerald-500' },
  { s: 600, cls: 'bg-emerald-600' },
  { s: 700, cls: 'bg-emerald-700' },
]
const AMBER = [
  { s: 50, cls: 'bg-amber-50' },
  { s: 100, cls: 'bg-amber-100' },
  { s: 500, cls: 'bg-amber-500' },
  { s: 600, cls: 'bg-amber-600' },
  { s: 700, cls: 'bg-amber-700' },
]
const SKY = [
  { s: 50, cls: 'bg-sky-50' },
  { s: 100, cls: 'bg-sky-100' },
  { s: 500, cls: 'bg-sky-500' },
  { s: 600, cls: 'bg-sky-600' },
  { s: 700, cls: 'bg-sky-700' },
]
const RED = [
  { s: 50, cls: 'bg-red-50' },
  { s: 100, cls: 'bg-red-100' },
  { s: 500, cls: 'bg-red-500' },
  { s: 600, cls: 'bg-red-600' },
  { s: 700, cls: 'bg-red-700' },
]

function Ramp({ name, shades }: { name: string; shades: Array<{ s: number; cls: string }> }) {
  return (
    <div>
      <p className="mb-2 text-xs font-medium uppercase tracking-wider text-slate-500">{name}</p>
      <div className="flex overflow-hidden rounded-lg border border-slate-200">
        {shades.map((sh) => (
          <div key={sh.s} className="flex-1">
            <div className={`h-12 ${sh.cls}`} />
            <p className="px-1 py-1 text-center text-[10px] text-slate-500">{sh.s}</p>
          </div>
        ))}
      </div>
    </div>
  )
}

function Tokens() {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="grid gap-6 sm:grid-cols-2">
        <div>
          <p className="mb-3 text-sm font-semibold text-slate-900">Surface</p>
          <div className="space-y-2 text-sm">
            <div className="flex items-center justify-between rounded border border-slate-200 bg-white px-3 py-2">
              <span>Canvas</span>
              <code className="text-xs text-slate-500">bg-white</code>
            </div>
            <div className="flex items-center justify-between rounded border border-slate-200 bg-slate-50 px-3 py-2">
              <span>Inset / framed</span>
              <code className="text-xs text-slate-500">bg-slate-50</code>
            </div>
            <div className="flex items-center justify-between rounded border border-slate-200 bg-slate-100 px-3 py-2">
              <span>Disabled</span>
              <code className="text-xs text-slate-500">bg-slate-100</code>
            </div>
          </div>
        </div>
        <div>
          <p className="mb-3 text-sm font-semibold text-slate-900">Type scale</p>
          <div className="space-y-1.5">
            <p className="text-3xl font-semibold tracking-tight text-slate-900">Display 30/36</p>
            <p className="text-xl font-semibold text-slate-900">Title 20/28</p>
            <p className="text-base text-slate-700">Body 16/24 — the rest of the page sets</p>
            <p className="text-sm text-slate-600">Small 14/20 — secondary copy</p>
            <p className="text-xs uppercase tracking-wider text-slate-500">Caption 12/16</p>
          </div>
        </div>
      </div>

      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        <Ramp name="Slate (neutral)" shades={SLATE} />
        <Ramp name="Indigo (accent)" shades={INDIGO} />
        <Ramp name="Emerald (success)" shades={EMERALD} />
        <Ramp name="Amber (warning)" shades={AMBER} />
        <Ramp name="Sky (info)" shades={SKY} />
        <Ramp name="Red (danger)" shades={RED} />
      </div>
    </div>
  )
}

function Primitives() {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <p className="mb-4 text-sm font-semibold text-slate-900">Primitives gallery</p>

      <div className="space-y-6">
        <div>
          <p className="mb-2 text-xs font-medium uppercase tracking-wider text-slate-500">
            Buttons
          </p>
          <div className="flex flex-wrap items-center gap-2">
            <Btn variant="primary">Primary</Btn>
            <Btn variant="secondary">Secondary</Btn>
            <Btn variant="ghost">Ghost</Btn>
            <Btn variant="danger">Danger</Btn>
            <Btn variant="link">Link</Btn>
            <Btn variant="primary" size="sm">
              Small
            </Btn>
            <Btn variant="primary" size="tap">
              Tap target
            </Btn>
            <Btn variant="primary" disabled>
              Disabled
            </Btn>
          </div>
        </div>

        <div>
          <p className="mb-2 text-xs font-medium uppercase tracking-wider text-slate-500">
            Inputs
          </p>
          <div className="grid gap-3 sm:grid-cols-2">
            <Input label="Phone" placeholder="10-digit mobile" />
            <Input label="Search" placeholder="Search by name or code" leftIcon={Search} />
            <Input label="Disabled" placeholder="Read only" disabled />
            <Input label="Error state" placeholder="invalid" error="Phone must be 10 digits" />
          </div>
        </div>

        <div>
          <p className="mb-2 text-xs font-medium uppercase tracking-wider text-slate-500">
            Badges
          </p>
          <div className="flex flex-wrap items-center gap-2">
            <Badge tone="amber">DRAFT</Badge>
            <Badge tone="sky">FINALIZED</Badge>
            <Badge tone="emerald">PAID</Badge>
            <Badge tone="red">OVERDUE</Badge>
            <Badge tone="slate">INACTIVE</Badge>
            <Badge tone="indigo">ACTIVE</Badge>
          </div>
        </div>

        <div>
          <p className="mb-2 text-xs font-medium uppercase tracking-wider text-slate-500">
            StatTile
          </p>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <StatTile icon={Users} label="Active employees" value="24" delta="+2 this month" />
            <StatTile
              icon={CheckCircle2}
              label="Today's attendance"
              value="92%"
              delta="22/24 marked"
              tone="emerald"
            />
            <StatTile icon={Wallet} label="Pending advances" value="₹ 18,500" delta="3 open" />
            <StatTile
              icon={Receipt}
              label="Apr 2026 payroll"
              value="DRAFT"
              delta="Due 30 Apr"
              tone="amber"
            />
          </div>
        </div>
      </div>
    </div>
  )
}

// =============================================================================
// Shell
// =============================================================================

function ShellPreview() {
  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <div>
        <p className="mb-3 text-xs font-medium uppercase tracking-wider text-slate-500">
          Mobile · drawer open
        </p>
        <DeviceFrame>
          <div className="relative h-full w-full">
            <ShellFrame title="Dashboard">
              <div className="p-4 text-sm text-slate-500">(content dimmed under backdrop)</div>
            </ShellFrame>
            <div className="absolute inset-0 z-10 bg-slate-900/40 backdrop-blur-sm" />
            <aside className="absolute left-0 top-0 z-20 h-full w-72 border-r border-slate-200 bg-white shadow-xl">
              <div className="flex h-14 items-center justify-between border-b border-slate-200 px-3">
                <span className="font-semibold tracking-tight text-slate-900">MyFactoryDesk</span>
                <button
                  type="button"
                  aria-label="Close"
                  className="flex h-10 w-10 items-center justify-center rounded-lg text-slate-700 hover:bg-slate-100"
                >
                  <X size={20} />
                </button>
              </div>
              <nav className="p-3">
                <p className="mb-2 px-2 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                  Workspace
                </p>
                <ul className="space-y-1">
                  {[
                    { icon: Home, label: 'Dashboard' },
                    { icon: Users, label: 'Employees', active: true },
                    { icon: CalendarDays, label: 'Attendance' },
                    { icon: Wallet, label: 'Advances' },
                    { icon: Receipt, label: 'Payroll' },
                  ].map((it) => (
                    <li key={it.label}>
                      <a
                        href="#"
                        className={`relative flex items-center gap-3 rounded-lg px-3 py-3 text-sm font-medium ${
                          it.active
                            ? 'border-l-2 border-indigo-600 bg-indigo-50 pl-[10px] text-indigo-700'
                            : 'text-slate-700 hover:bg-slate-50'
                        }`}
                      >
                        <it.icon size={18} />
                        {it.label}
                      </a>
                    </li>
                  ))}
                </ul>
              </nav>
              <div className="absolute inset-x-0 bottom-0 border-t border-slate-200 p-3">
                <button className="flex w-full items-center gap-2 rounded-lg px-3 py-3 text-sm font-medium text-slate-700 hover:bg-slate-50">
                  <LogOut size={18} />
                  Log out
                </button>
              </div>
            </aside>
          </div>
        </DeviceFrame>
      </div>

      <div>
        <p className="mb-3 text-xs font-medium uppercase tracking-wider text-slate-500">
          Desktop · fixed rail
        </p>
        <DesktopFrame>
          <ShellFrame title="Dashboard" desktop>
            <div className="p-6 text-sm text-slate-500">
              Active route gets the indigo accent bar and tinted background. Hover items show a
              subtle slate-50 wash.
            </div>
          </ShellFrame>
        </DesktopFrame>
      </div>
    </div>
  )
}

// =============================================================================
// Page mocks
// =============================================================================

function LoginMock() {
  return (
    <div className="flex h-full flex-col bg-white">
      <div className="mx-auto flex w-full max-w-sm flex-1 flex-col justify-center px-6">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-600 text-lg font-bold text-white">
            M
          </div>
          <h1 className="text-2xl font-semibold tracking-tight text-slate-900">MyFactoryDesk</h1>
          <p className="mt-1 text-sm text-slate-500">Sign in to continue</p>
        </div>

        <form className="space-y-4">
          <Input label="Phone" placeholder="10-digit mobile" leftIcon={Phone} />
          <Input label="Password" type="password" placeholder="••••••••" />
          <div className="text-right">
            <a href="#" className="text-xs font-medium text-indigo-600 hover:underline">
              Forgot password?
            </a>
          </div>
          <Btn variant="primary" size="tap" className="w-full">
            Sign in
          </Btn>
        </form>
      </div>
      <p className="px-6 pb-6 text-center text-xs text-slate-400">v1.0.0 · Support +91 99999 99999</p>
    </div>
  )
}

function DashboardMock() {
  return (
    <div className="space-y-6 p-4">
      <div>
        <p className="text-xs font-medium uppercase tracking-wider text-slate-400">
          Signed in as OWNER
        </p>
        <h1 className="mt-1 text-2xl font-semibold tracking-tight text-slate-900">
          Good evening, Suresh
        </h1>
        <p className="text-sm text-slate-500">Saturday, 26 April · IST</p>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <StatTile icon={Users} label="Active employees" value="24" delta="+2 this month" />
        <StatTile
          icon={CheckCircle2}
          label="Today's attendance"
          value="92%"
          delta="22/24 marked"
          tone="emerald"
        />
        <StatTile icon={Wallet} label="Pending advances" value="₹ 18,500" delta="3 open" />
        <StatTile
          icon={Receipt}
          label="Apr payroll"
          value="DRAFT"
          delta="Due 30 Apr"
          tone="amber"
        />
      </div>

      <div>
        <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-slate-500">
          Modules
        </p>
        <div className="space-y-2">
          {[
            { icon: Users, label: 'Employees', sub: '24 active · 2 inactive' },
            { icon: CalendarDays, label: 'Attendance', sub: 'Today · 22 marked' },
            { icon: Wallet, label: 'Advances', sub: '3 pending recovery' },
            { icon: Receipt, label: 'Payroll', sub: 'Apr 2026 · DRAFT' },
          ].map((it) => (
            <ModuleRow key={it.label} {...it} />
          ))}
        </div>
      </div>
    </div>
  )
}

function ModuleRow({ icon: Icon, label, sub }: { icon: typeof Home; label: string; sub: string }) {
  return (
    <a
      href="#"
      className="flex min-h-[64px] items-center gap-3 rounded-xl border border-slate-200 bg-white p-4 shadow-sm transition hover:border-indigo-300 hover:shadow"
    >
      <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600">
        <Icon size={20} />
      </span>
      <span className="flex-1 min-w-0">
        <span className="block text-sm font-semibold text-slate-900">{label}</span>
        <span className="block text-xs text-slate-500">{sub}</span>
      </span>
      <ChevronRight size={18} className="text-slate-400" />
    </a>
  )
}

function EmployeesListMock() {
  const rows = [
    { name: 'Sumit Patel', code: 'EMP-001', role: 'Operator', salary: '₹ 18,000', initials: 'SP' },
    {
      name: 'Anita Sharma',
      code: 'EMP-002',
      role: 'Supervisor',
      salary: '₹ 25,000',
      initials: 'AS',
    },
    { name: 'Ravi Kumar', code: 'EMP-003', role: 'Operator', salary: '₹ 16,500', initials: 'RK' },
    { name: 'Priya Das', code: 'EMP-004', role: 'Helper', salary: '₹ 12,000', initials: 'PD' },
    {
      name: 'Mohan Reddy',
      code: 'EMP-005',
      role: 'Operator',
      salary: '₹ 17,500',
      initials: 'MR',
    },
  ]
  return (
    <div className="flex flex-col">
      <div className="border-b border-slate-200 p-4">
        <div className="mb-3 flex items-center justify-between">
          <h1 className="text-xl font-semibold tracking-tight text-slate-900">Employees</h1>
          <Btn variant="primary" size="sm">
            <Plus size={16} /> Add
          </Btn>
        </div>
        <Input placeholder="Search by name or code" leftIcon={Search} />
        <div className="mt-3 flex flex-wrap items-center gap-2 text-xs">
          <FilterChip active>Active</FilterChip>
          <FilterChip>All</FilterChip>
          <FilterChip>Inactive</FilterChip>
          <span className="ml-auto text-slate-500">24 results</span>
        </div>
      </div>
      <ul className="divide-y divide-slate-100">
        {rows.map((r) => (
          <li key={r.code}>
            <a
              href="#"
              className="flex min-h-[68px] items-center gap-3 px-4 py-3 hover:bg-slate-50"
            >
              <span className="flex h-10 w-10 items-center justify-center rounded-full bg-indigo-50 text-sm font-semibold text-indigo-700">
                {r.initials}
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold text-slate-900">{r.name}</p>
                <p className="text-xs text-slate-500">
                  {r.code} · {r.role}
                </p>
              </div>
              <div className="text-right">
                <p className="text-sm font-semibold text-slate-900">{r.salary}</p>
                <p className="text-xs text-slate-500">basic</p>
              </div>
              <ChevronRight size={16} className="text-slate-300" />
            </a>
          </li>
        ))}
      </ul>
    </div>
  )
}

function EmployeesTableMock() {
  const rows = [
    { name: 'Sumit Patel', code: 'EMP-001', role: 'Operator', salary: '₹ 18,000', joined: '2024-03-12', status: 'ACTIVE' },
    {
      name: 'Anita Sharma',
      code: 'EMP-002',
      role: 'Supervisor',
      salary: '₹ 25,000',
      joined: '2023-11-04',
      status: 'ACTIVE',
    },
    { name: 'Ravi Kumar', code: 'EMP-003', role: 'Operator', salary: '₹ 16,500', joined: '2025-01-18', status: 'ACTIVE' },
    { name: 'Priya Das', code: 'EMP-004', role: 'Helper', salary: '₹ 12,000', joined: '2025-08-02', status: 'ACTIVE' },
    {
      name: 'Mohan Reddy',
      code: 'EMP-005',
      role: 'Operator',
      salary: '₹ 17,500',
      joined: '2024-06-22',
      status: 'INACTIVE',
    },
  ]
  return (
    <div className="p-6">
      <div className="mb-5 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-slate-900">Employees</h1>
          <p className="text-sm text-slate-500">24 active · 2 inactive</p>
        </div>
        <div className="flex items-center gap-2">
          <Btn variant="secondary" size="sm">
            <Filter size={16} /> Filter
          </Btn>
          <Btn variant="primary" size="sm">
            <Plus size={16} /> New employee
          </Btn>
        </div>
      </div>
      <div className="overflow-hidden rounded-xl border border-slate-200">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-50 text-xs font-semibold uppercase tracking-wider text-slate-500">
            <tr>
              <th className="px-4 py-3">Employee</th>
              <th className="px-4 py-3">Role</th>
              <th className="px-4 py-3">Joined</th>
              <th className="px-4 py-3 text-right">Basic</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 bg-white">
            {rows.map((r, i) => (
              <tr key={r.code} className={i % 2 ? 'bg-slate-50/40' : ''}>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-3">
                    <span className="flex h-8 w-8 items-center justify-center rounded-full bg-indigo-50 text-xs font-semibold text-indigo-700">
                      {r.name.split(' ').map((s) => s[0]).join('')}
                    </span>
                    <div>
                      <p className="font-semibold text-slate-900">{r.name}</p>
                      <p className="text-xs text-slate-500">{r.code}</p>
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3 text-slate-700">{r.role}</td>
                <td className="px-4 py-3 text-slate-500">{r.joined}</td>
                <td className="px-4 py-3 text-right tabular-nums font-medium text-slate-900">
                  {r.salary}
                </td>
                <td className="px-4 py-3">
                  <Badge tone={r.status === 'ACTIVE' ? 'emerald' : 'slate'}>{r.status}</Badge>
                </td>
                <td className="px-4 py-3">
                  <button className="text-slate-400 hover:text-slate-700">
                    <MoreVertical size={16} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="mt-3 text-xs text-slate-500">Showing 1–5 of 24 · Page 1 of 5</p>
    </div>
  )
}

function EmployeeDetailMock() {
  return (
    <div className="space-y-4">
      <div className="border-b border-slate-200 bg-white px-4 pb-4 pt-3">
        <a href="#" className="mb-2 inline-flex items-center gap-1 text-xs text-slate-500 hover:text-slate-700">
          <ArrowLeft size={14} /> Employees
        </a>
        <div className="flex items-start gap-3">
          <span className="flex h-12 w-12 items-center justify-center rounded-full bg-indigo-50 text-base font-semibold text-indigo-700">
            SP
          </span>
          <div className="flex-1 min-w-0">
            <h1 className="truncate text-xl font-semibold tracking-tight text-slate-900">
              Sumit Patel
            </h1>
            <p className="text-xs text-slate-500">EMP-001 · Operator · joined 12 Mar 2024</p>
            <div className="mt-2 flex gap-2">
              <Badge tone="emerald">ACTIVE</Badge>
              <Badge tone="indigo">FULL-TIME</Badge>
            </div>
          </div>
          <Btn variant="secondary" size="sm">
            Edit
          </Btn>
        </div>
      </div>

      <div className="space-y-4 p-4">
        <DetailSection title="Identity">
          <DetailRow label="Phone" value="+91 98765 43210" />
          <DetailRow label="Email" value="sumit.p@example.com" />
          <DetailRow label="Date of birth" value="14 Aug 1992" />
        </DetailSection>
        <DetailSection title="Salary structure">
          <DetailRow label="Basic" value="₹ 18,000" mono />
          <DetailRow label="HRA" value="₹ 4,500" mono />
          <DetailRow label="Conveyance" value="₹ 1,500" mono />
          <DetailRow label="Total CTC" value="₹ 24,000" mono strong />
        </DetailSection>
        <DetailSection title="Bank">
          <DetailRow label="Account" value="••• •••• 4421" />
          <DetailRow label="IFSC" value="HDFC0001234" />
        </DetailSection>
      </div>

      <div className="sticky bottom-0 border-t border-slate-200 bg-white px-4 py-3 shadow-[0_-4px_12px_rgba(0,0,0,0.04)]">
        <div className="flex items-center gap-2">
          <Btn variant="secondary" size="tap" className="flex-1">
            Mark inactive
          </Btn>
          <Btn variant="primary" size="tap" className="flex-1">
            View payslips
          </Btn>
        </div>
      </div>
    </div>
  )
}

function DetailSection({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="rounded-xl border border-slate-200 bg-white">
      <div className="border-b border-slate-100 px-4 py-2.5">
        <h2 className="text-xs font-semibold uppercase tracking-wider text-slate-500">{title}</h2>
      </div>
      <div className="divide-y divide-slate-100 px-4">{children}</div>
    </section>
  )
}

function DetailRow({
  label,
  value,
  mono,
  strong,
}: {
  label: string
  value: string
  mono?: boolean
  strong?: boolean
}) {
  return (
    <div className="flex items-center justify-between py-2.5 text-sm">
      <span className="text-slate-500">{label}</span>
      <span
        className={`${mono ? 'tabular-nums' : ''} ${strong ? 'font-semibold text-slate-900' : 'text-slate-900'}`}
      >
        {value}
      </span>
    </div>
  )
}

function EmployeeFormMock() {
  return (
    <div className="flex h-full flex-col">
      <div className="border-b border-slate-200 px-4 py-3">
        <h1 className="text-xl font-semibold tracking-tight text-slate-900">New employee</h1>
        <p className="text-xs text-slate-500">Identity, employment, salary, bank</p>
      </div>
      <div className="flex-1 space-y-5 overflow-y-auto p-4 pb-24">
        <FormSection title="Identity">
          <Input label="Full name" placeholder="As per ID" />
          <Input label="Phone" placeholder="10-digit mobile" />
          <Input label="Email (optional)" placeholder="name@example.com" />
        </FormSection>
        <FormSection title="Employment">
          <Input label="Employee code" placeholder="EMP-006" />
          <Input label="Designation" placeholder="Operator" />
          <Input label="Date of joining" type="date" defaultValue="2026-04-26" />
        </FormSection>
        <FormSection title="Salary structure">
          <Input label="Basic salary" placeholder="0.00" leftIcon={IndianRupee} />
          <Input label="HRA" placeholder="0.00" leftIcon={IndianRupee} />
          <Input label="Conveyance" placeholder="0.00" leftIcon={IndianRupee} />
        </FormSection>
      </div>
      <div className="sticky bottom-0 border-t border-slate-200 bg-white px-4 py-3 shadow-[0_-4px_12px_rgba(0,0,0,0.04)]">
        <div className="flex items-center gap-2">
          <Btn variant="ghost" size="tap" className="flex-1">
            Cancel
          </Btn>
          <Btn variant="primary" size="tap" className="flex-1">
            Save employee
          </Btn>
        </div>
      </div>
    </div>
  )
}

function FormSection({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section>
      <h2 className="mb-3 text-xs font-semibold uppercase tracking-wider text-slate-500">{title}</h2>
      <div className="space-y-3">{children}</div>
    </section>
  )
}

function AttendanceMarkMock() {
  const employees = [
    { name: 'Sumit Patel', code: 'EMP-001', initials: 'SP', mark: 'P' as const },
    { name: 'Anita Sharma', code: 'EMP-002', initials: 'AS', mark: 'P' as const },
    { name: 'Ravi Kumar', code: 'EMP-003', initials: 'RK', mark: 'HD' as const },
    { name: 'Priya Das', code: 'EMP-004', initials: 'PD', mark: 'A' as const },
    { name: 'Mohan Reddy', code: 'EMP-005', initials: 'MR', mark: null },
  ]
  return (
    <div className="flex h-full flex-col">
      <div className="border-b border-slate-200 px-4 py-3">
        <div className="mb-3 flex items-center justify-between">
          <h1 className="text-xl font-semibold tracking-tight text-slate-900">Daily attendance</h1>
          <a href="#" className="text-xs font-medium text-indigo-600 hover:underline">
            Summary →
          </a>
        </div>
        <div className="flex items-center justify-between rounded-xl border border-slate-200 bg-white p-2">
          <button className="flex h-10 w-10 items-center justify-center rounded-lg text-slate-700 hover:bg-slate-100">
            <ArrowLeft size={18} />
          </button>
          <div className="text-center">
            <p className="text-sm font-semibold text-slate-900">Sat · 26 Apr 2026</p>
            <p className="text-[11px] text-slate-500">IST</p>
          </div>
          <button className="flex h-10 w-10 items-center justify-center rounded-lg text-slate-700 hover:bg-slate-100">
            <ArrowRight size={18} />
          </button>
        </div>
        <div className="mt-3 flex items-center gap-2">
          <Btn variant="secondary" size="sm" className="flex-1">
            <Check size={14} /> Mark all P
          </Btn>
          <Btn variant="ghost" size="sm" className="flex-1">
            Clear all
          </Btn>
        </div>
      </div>

      <ul className="flex-1 divide-y divide-slate-100 overflow-y-auto pb-24">
        {employees.map((e) => (
          <li key={e.code} className="px-4 py-3">
            <div className="flex items-center gap-3">
              <span className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-100 text-xs font-semibold text-slate-700">
                {e.initials}
              </span>
              <div className="flex-1 min-w-0">
                <p className="truncate text-sm font-semibold text-slate-900">{e.name}</p>
                <p className="text-xs text-slate-500">{e.code}</p>
              </div>
              <button className="text-xs font-medium text-indigo-600 hover:underline">OT</button>
            </div>
            <div className="mt-2 grid grid-cols-4 gap-2">
              {(['P', 'HD', 'L', 'A'] as const).map((b) => (
                <MarkButton key={b} mark={b} active={e.mark === b} />
              ))}
            </div>
          </li>
        ))}
      </ul>

      <div className="sticky bottom-0 border-t border-slate-200 bg-white px-4 py-3 shadow-[0_-4px_12px_rgba(0,0,0,0.04)]">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-sm font-semibold text-slate-900">4 of 5 marked</p>
            <p className="text-xs text-slate-500">1 unmarked · 0 overtime</p>
          </div>
          <Btn variant="primary" size="tap">
            Save
          </Btn>
        </div>
      </div>
    </div>
  )
}

function MarkButton({
  mark,
  active,
}: {
  mark: 'P' | 'HD' | 'L' | 'A'
  active: boolean
}) {
  const ACTIVE: Record<string, string> = {
    P: 'bg-emerald-600 text-white',
    HD: 'bg-amber-500 text-white',
    L: 'bg-sky-600 text-white',
    A: 'bg-red-600 text-white',
  }
  return (
    <button
      type="button"
      className={`min-h-[48px] rounded-lg text-sm font-semibold transition ${
        active ? ACTIVE[mark] : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
      }`}
      aria-pressed={active}
    >
      {mark}
    </button>
  )
}

function AttendanceCalendarMock() {
  // 30 days; simulate per-day status
  const days = Array.from({ length: 30 }, (_, i) => i + 1)
  const status = (d: number): 'P' | 'A' | 'HD' | 'L' | 'H' | null => {
    if (d > 26) return null
    if ([7, 14, 21, 28].includes(d)) return 'H'
    if (d % 11 === 0) return 'A'
    if (d % 9 === 0) return 'HD'
    if (d % 7 === 3) return 'L'
    return 'P'
  }
  const dot: Record<string, string> = {
    P: 'bg-emerald-500',
    A: 'bg-red-500',
    HD: 'bg-amber-500',
    L: 'bg-sky-500',
    H: 'bg-slate-300',
  }
  return (
    <div className="space-y-4 p-4">
      <a href="#" className="inline-flex items-center gap-1 text-xs text-slate-500 hover:text-slate-700">
        <ArrowLeft size={14} /> Attendance summary
      </a>
      <div>
        <h1 className="text-xl font-semibold tracking-tight text-slate-900">Sumit Patel</h1>
        <p className="text-sm text-slate-500">EMP-001 · April 2026</p>
      </div>
      <div className="grid grid-cols-2 gap-2">
        <StatTile icon={Check} label="Present" value="20" tone="emerald" />
        <StatTile icon={X} label="Absent" value="2" tone="red" />
        <StatTile icon={Clock} label="Half day" value="3" tone="amber" />
        <StatTile icon={Calendar} label="Leave" value="1" tone="sky" />
      </div>
      <div className="flex flex-wrap items-center gap-3 text-xs text-slate-600">
        <Legend dot="bg-emerald-500" label="Present" />
        <Legend dot="bg-red-500" label="Absent" />
        <Legend dot="bg-amber-500" label="Half day" />
        <Legend dot="bg-sky-500" label="Leave" />
        <Legend dot="bg-slate-300" label="Holiday" />
      </div>
      <div className="rounded-xl border border-slate-200 bg-white p-3">
        <div className="grid grid-cols-7 gap-1 text-center text-[10px] font-medium uppercase tracking-wider text-slate-400">
          {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((d, i) => (
            <span key={`${d}-${i}`}>{d}</span>
          ))}
        </div>
        <div className="mt-2 grid grid-cols-7 gap-1">
          {/* April 2026 starts on Wednesday (offset 3) */}
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={`pad-${i}`} className="aspect-square" />
          ))}
          {days.map((d) => {
            const s = status(d)
            return (
              <button
                key={d}
                className={`aspect-square rounded-lg text-xs font-medium transition ${
                  s
                    ? 'bg-white text-slate-900 hover:bg-slate-50'
                    : 'bg-slate-50 text-slate-400'
                } ${d === 26 ? 'ring-2 ring-indigo-500' : ''}`}
              >
                <span className="block leading-none">{d}</span>
                {s && (
                  <span
                    aria-hidden
                    className={`mx-auto mt-1 block h-1.5 w-1.5 rounded-full ${dot[s]}`}
                  />
                )}
              </button>
            )
          })}
        </div>
      </div>
    </div>
  )
}

function Legend({ dot, label }: { dot: string; label: string }) {
  return (
    <span className="inline-flex items-center gap-1.5">
      <span className={`h-2 w-2 rounded-full ${dot}`} />
      {label}
    </span>
  )
}

function AttendanceSummaryMock() {
  const rows = [
    { name: 'Sumit Patel', code: 'EMP-001', p: 20, hd: 3, l: 1, a: 2 },
    { name: 'Anita Sharma', code: 'EMP-002', p: 22, hd: 1, l: 2, a: 1 },
    { name: 'Ravi Kumar', code: 'EMP-003', p: 18, hd: 4, l: 1, a: 3 },
    { name: 'Priya Das', code: 'EMP-004', p: 21, hd: 2, l: 1, a: 2 },
  ]
  return (
    <div className="flex h-full flex-col">
      <div className="border-b border-slate-200 px-4 py-3">
        <h1 className="text-xl font-semibold tracking-tight text-slate-900">Monthly summary</h1>
        <div className="mt-3 flex items-center gap-2">
          <button className="flex h-10 w-10 items-center justify-center rounded-lg border border-slate-200 hover:bg-slate-50">
            <ArrowLeft size={16} />
          </button>
          <div className="flex-1 rounded-lg border border-slate-200 px-3 py-2 text-center text-sm font-semibold text-slate-900">
            April 2026
          </div>
          <button className="flex h-10 w-10 items-center justify-center rounded-lg border border-slate-200 hover:bg-slate-50">
            <ArrowRight size={16} />
          </button>
        </div>
      </div>
      <ul className="divide-y divide-slate-100 overflow-y-auto">
        {rows.map((r) => (
          <li key={r.code} className="px-4 py-3">
            <div className="flex items-baseline justify-between">
              <p className="text-sm font-semibold text-slate-900">{r.name}</p>
              <p className="text-xs text-slate-500">{r.code}</p>
            </div>
            <div className="mt-2 grid grid-cols-4 gap-2 text-xs">
              <Pill tone="emerald" label="P" value={r.p} />
              <Pill tone="amber" label="HD" value={r.hd} />
              <Pill tone="sky" label="L" value={r.l} />
              <Pill tone="red" label="A" value={r.a} />
            </div>
          </li>
        ))}
      </ul>
    </div>
  )
}

function Pill({ tone, label, value }: { tone: BadgeTone; label: string; value: number }) {
  const tokens = TONES[tone]
  return (
    <div className={`flex items-center justify-between rounded-lg px-2 py-1 ${tokens.softBg}`}>
      <span className={`font-medium ${tokens.softText}`}>{label}</span>
      <span className={`tabular-nums font-semibold ${tokens.softText}`}>{value}</span>
    </div>
  )
}

function AdvancesListMock() {
  const rows = [
    {
      name: 'Sumit Patel',
      code: 'EMP-001',
      amount: '₹ 5,000',
      schedule: 'Apr 2026',
      status: 'PENDING',
    },
    {
      name: 'Anita Sharma',
      code: 'EMP-002',
      amount: '₹ 8,000',
      schedule: 'Apr 2026',
      status: 'PENDING',
    },
    {
      name: 'Ravi Kumar',
      code: 'EMP-003',
      amount: '₹ 5,500',
      schedule: 'Mar 2026',
      status: 'RECOVERED',
    },
  ]
  return (
    <div className="flex flex-col">
      <div className="border-b border-slate-200 px-4 py-3">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-semibold tracking-tight text-slate-900">Advances</h1>
          <Btn variant="primary" size="sm">
            <Plus size={16} /> New
          </Btn>
        </div>
        <p className="mt-1 text-xs text-slate-500">3 pending · ₹ 18,500 outstanding</p>
      </div>
      <ul className="divide-y divide-slate-100">
        {rows.map((r, i) => (
          <li key={i}>
            <a href="#" className="flex items-center gap-3 px-4 py-3 hover:bg-slate-50">
              <span className="flex h-9 w-9 items-center justify-center rounded-full bg-indigo-50 text-xs font-semibold text-indigo-700">
                {r.name.split(' ').map((s) => s[0]).join('')}
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold text-slate-900">{r.name}</p>
                <p className="text-xs text-slate-500">
                  {r.code} · scheduled {r.schedule}
                </p>
              </div>
              <div className="text-right">
                <p className="text-sm font-semibold tabular-nums text-slate-900">{r.amount}</p>
                <Badge tone={r.status === 'PENDING' ? 'amber' : 'emerald'}>{r.status}</Badge>
              </div>
            </a>
          </li>
        ))}
      </ul>
    </div>
  )
}

function AdvanceFormMock() {
  return (
    <div className="flex h-full flex-col">
      <div className="border-b border-slate-200 px-4 py-3">
        <h1 className="text-xl font-semibold tracking-tight text-slate-900">New advance</h1>
        <p className="text-xs text-slate-500">Loan / advance with scheduled deduction month</p>
      </div>
      <div className="flex-1 space-y-3 overflow-y-auto p-4 pb-24">
        <Input label="Employee" placeholder="Search employee…" leftIcon={User} />
        <Input label="Amount" placeholder="0.00" leftIcon={IndianRupee} />
        <div className="grid grid-cols-2 gap-3">
          <Input label="Deduct in month" type="month" defaultValue="2026-04" />
          <Input label="Reference (optional)" placeholder="ADV-042" />
        </div>
        <Input label="Notes (optional)" placeholder="Reason for advance" />
      </div>
      <div className="sticky bottom-0 border-t border-slate-200 bg-white px-4 py-3 shadow-[0_-4px_12px_rgba(0,0,0,0.04)]">
        <div className="flex items-center gap-2">
          <Btn variant="ghost" size="tap" className="flex-1">
            Cancel
          </Btn>
          <Btn variant="primary" size="tap" className="flex-1">
            Save advance
          </Btn>
        </div>
      </div>
    </div>
  )
}

function PayrollListMock() {
  const runs = [
    { period: 'April 2026', status: 'DRAFT', total: '—', sub: 'Created 25 Apr · 24 employees' },
    {
      period: 'March 2026',
      status: 'PAID',
      total: '₹ 4,82,500',
      sub: 'Finalized 31 Mar · Paid 02 Apr',
    },
    {
      period: 'February 2026',
      status: 'PAID',
      total: '₹ 4,76,000',
      sub: 'Finalized 28 Feb · Paid 04 Mar',
    },
  ]
  return (
    <div className="flex flex-col">
      <div className="border-b border-slate-200 px-4 py-3">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-semibold tracking-tight text-slate-900">Payroll runs</h1>
          <Btn variant="primary" size="sm">
            <Plus size={16} /> New run
          </Btn>
        </div>
        <p className="mt-1 text-xs text-slate-500">3 runs · current cycle in DRAFT</p>
      </div>
      <ul className="divide-y divide-slate-100">
        {runs.map((r) => (
          <li key={r.period}>
            <a href="#" className="flex items-center gap-3 px-4 py-4 hover:bg-slate-50">
              <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-indigo-50 text-indigo-700">
                <Receipt size={18} />
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-slate-900">{r.period}</p>
                <p className="text-xs text-slate-500">{r.sub}</p>
              </div>
              <div className="text-right">
                <p className="text-sm font-semibold tabular-nums text-slate-900">{r.total}</p>
                <Badge
                  tone={
                    r.status === 'DRAFT' ? 'amber' : r.status === 'FINALIZED' ? 'sky' : 'emerald'
                  }
                >
                  {r.status}
                </Badge>
              </div>
            </a>
          </li>
        ))}
      </ul>
    </div>
  )
}

function PayrollWizardMock() {
  const [step, setStep] = useState<1 | 2 | 3>(2)
  return (
    <div className="flex h-full flex-col">
      <div className="border-b border-slate-200 px-4 py-3">
        <h1 className="text-xl font-semibold tracking-tight text-slate-900">New payroll run</h1>
        <Stepper current={step} steps={['Period', 'Preview', 'Finalize']} />
        <div className="mt-3 flex items-center gap-1 text-xs">
          <button onClick={() => setStep(1)} className="text-indigo-600 hover:underline">
            ← Back
          </button>
          <span className="ml-auto text-slate-500">Step {step} of 3</span>
        </div>
      </div>
      <div className="flex-1 space-y-3 overflow-y-auto p-4 pb-24">
        {step === 1 && (
          <div className="space-y-3">
            <Input label="Month" type="month" defaultValue="2026-04" />
            <p className="text-xs text-slate-500">
              We'll create a DRAFT run for the selected month with all active employees.
            </p>
          </div>
        )}
        {step === 2 && (
          <>
            <div className="rounded-xl border border-slate-200 bg-white p-3">
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                Run preview · April 2026
              </p>
              <div className="mt-2 grid grid-cols-2 gap-3">
                <StatTile icon={Users} label="Employees" value="24" />
                <StatTile
                  icon={IndianRupee}
                  label="Total payout"
                  value="₹ 4,82,500"
                  tone="emerald"
                />
              </div>
            </div>
            <div className="rounded-xl border border-slate-200 bg-white">
              <div className="border-b border-slate-100 px-3 py-2 text-xs font-semibold uppercase tracking-wider text-slate-500">
                Per employee
              </div>
              <ul className="divide-y divide-slate-100 text-sm">
                {[
                  { name: 'Sumit Patel', net: '₹ 17,200' },
                  { name: 'Anita Sharma', net: '₹ 23,500' },
                  { name: 'Ravi Kumar', net: '₹ 14,800' },
                  { name: 'Priya Das', net: '₹ 11,400' },
                ].map((p) => (
                  <li key={p.name} className="flex items-center justify-between px-3 py-2.5">
                    <span className="text-slate-700">{p.name}</span>
                    <span className="tabular-nums font-medium text-slate-900">{p.net}</span>
                  </li>
                ))}
              </ul>
            </div>
          </>
        )}
        {step === 3 && (
          <div className="rounded-xl border border-amber-200 bg-amber-50 p-4">
            <p className="text-sm font-semibold text-amber-900">Finalize this run?</p>
            <p className="mt-1 text-xs text-amber-800">
              Once finalized, payslip values are frozen and cannot be edited. Only the OWNER role
              can finalize.
            </p>
          </div>
        )}
      </div>
      <div className="sticky bottom-0 border-t border-slate-200 bg-white px-4 py-3 shadow-[0_-4px_12px_rgba(0,0,0,0.04)]">
        <div className="flex items-center gap-2">
          <Btn
            variant="secondary"
            size="tap"
            className="flex-1"
            onClick={() => setStep((s) => (s > 1 ? ((s - 1) as 1 | 2) : 1))}
          >
            Back
          </Btn>
          <Btn
            variant="primary"
            size="tap"
            className="flex-1"
            onClick={() => setStep((s) => (s < 3 ? ((s + 1) as 2 | 3) : 3))}
          >
            {step === 3 ? 'Finalize' : 'Continue'}
          </Btn>
        </div>
      </div>
    </div>
  )
}

function Stepper({ current, steps }: { current: number; steps: string[] }) {
  return (
    <ol className="mt-3 flex items-center gap-2">
      {steps.map((s, i) => {
        const idx = i + 1
        const done = idx < current
        const active = idx === current
        return (
          <li key={s} className="flex flex-1 items-center gap-2">
            <span
              className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-semibold ${
                done
                  ? 'bg-emerald-600 text-white'
                  : active
                    ? 'bg-indigo-600 text-white'
                    : 'bg-slate-100 text-slate-500'
              }`}
            >
              {done ? <Check size={14} /> : idx}
            </span>
            <span
              className={`flex-1 text-xs font-medium ${
                active ? 'text-slate-900' : 'text-slate-500'
              }`}
            >
              {s}
            </span>
            {idx < steps.length && <span className="h-px flex-1 bg-slate-200" />}
          </li>
        )
      })}
    </ol>
  )
}

function PayrollRunDetailMock() {
  const rows = [
    { name: 'Sumit Patel', code: 'EMP-001', gross: '₹ 22,500', adv: '₹ 5,000', net: '₹ 17,200' },
    { name: 'Anita Sharma', code: 'EMP-002', gross: '₹ 27,000', adv: '₹ 0', net: '₹ 23,500' },
    { name: 'Ravi Kumar', code: 'EMP-003', gross: '₹ 17,200', adv: '₹ 2,400', net: '₹ 14,800' },
    { name: 'Priya Das', code: 'EMP-004', gross: '₹ 12,000', adv: '₹ 600', net: '₹ 11,400' },
  ]
  return (
    <div className="flex h-full flex-col">
      <div className="space-y-3 border-b border-slate-200 px-4 py-3">
        <a href="#" className="inline-flex items-center gap-1 text-xs text-slate-500 hover:text-slate-700">
          <ArrowLeft size={14} /> Payroll runs
        </a>
        <div className="flex items-start justify-between gap-2">
          <div>
            <h1 className="text-xl font-semibold tracking-tight text-slate-900">April 2026</h1>
            <p className="text-xs text-slate-500">24 employees · Created 25 Apr</p>
          </div>
          <Badge tone="amber">DRAFT</Badge>
        </div>
        <div className="grid grid-cols-2 gap-2">
          <StatTile icon={IndianRupee} label="Total gross" value="₹ 5,38,200" />
          <StatTile icon={TrendingUp} label="Total net" value="₹ 4,82,500" tone="emerald" />
        </div>
      </div>
      <ul className="divide-y divide-slate-100 overflow-y-auto pb-24">
        {rows.map((r) => (
          <li key={r.code}>
            <a href="#" className="flex items-center gap-3 px-4 py-3 hover:bg-slate-50">
              <span className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-100 text-xs font-semibold text-slate-700">
                {r.name.split(' ').map((s) => s[0]).join('')}
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold text-slate-900">{r.name}</p>
                <p className="text-xs text-slate-500">
                  Gross {r.gross} · Adv {r.adv}
                </p>
              </div>
              <div className="text-right">
                <p className="text-sm font-semibold tabular-nums text-slate-900">{r.net}</p>
                <p className="text-[11px] text-slate-500">net</p>
              </div>
              <ChevronRight size={16} className="text-slate-300" />
            </a>
          </li>
        ))}
      </ul>
      <div className="sticky bottom-0 border-t border-slate-200 bg-white px-4 py-3 shadow-[0_-4px_12px_rgba(0,0,0,0.04)]">
        <div className="flex items-center gap-2">
          <Btn variant="secondary" size="tap" className="flex-1">
            Recalculate
          </Btn>
          <Btn variant="primary" size="tap" className="flex-1">
            Finalize
          </Btn>
        </div>
      </div>
    </div>
  )
}

function PayslipDetailMock() {
  return (
    <div className="space-y-4">
      <div className="border-b border-slate-200 px-4 py-3">
        <a href="#" className="mb-2 inline-flex items-center gap-1 text-xs text-slate-500 hover:text-slate-700">
          <ArrowLeft size={14} /> April 2026 · Payroll
        </a>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-semibold tracking-tight text-slate-900">Sumit Patel</h1>
            <p className="text-xs text-slate-500">EMP-001 · Operator · April 2026</p>
          </div>
          <div className="flex items-center gap-2">
            <button className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 text-slate-700 hover:bg-slate-50">
              <Share2 size={16} />
            </button>
            <button className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 text-slate-700 hover:bg-slate-50">
              <Download size={16} />
            </button>
          </div>
        </div>
        <div className="mt-2 flex gap-2">
          <Badge tone="emerald">PAID</Badge>
          <Badge tone="indigo">FINALIZED</Badge>
        </div>
      </div>

      <div className="grid gap-4 px-4 sm:grid-cols-2">
        <PaySection title="Earnings" tone="emerald">
          <PayRow label="Basic (22 days)" value="₹ 13,200" />
          <PayRow label="HRA" value="₹ 4,200" />
          <PayRow label="Conveyance" value="₹ 1,400" />
          <PayRow label="Overtime (4 hrs)" value="₹ 720" />
          <PayRow label="Gross earnings" value="₹ 19,520" total />
        </PaySection>
        <PaySection title="Deductions" tone="red">
          <PayRow label="Advance recovery" value="₹ 5,000" />
          <PayRow label="Total deductions" value="₹ 5,000" total />
        </PaySection>
      </div>

      <div className="px-4 pb-6">
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4">
          <p className="text-xs font-semibold uppercase tracking-wider text-emerald-700">Net pay</p>
          <p className="mt-1 text-3xl font-bold tabular-nums text-emerald-900">₹ 14,520</p>
          <p className="mt-1 text-xs text-emerald-800">Paid 02 May 2026 to acct ••• 4421</p>
        </div>
      </div>

      <div className="px-4 pb-6">
        <div className="rounded-xl border border-slate-200 bg-white">
          <div className="border-b border-slate-100 px-4 py-2.5">
            <h2 className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Attendance
            </h2>
          </div>
          <div className="divide-y divide-slate-100 px-4">
            <DetailRow label="Days in month" value="30" />
            <DetailRow label="Present" value="20" />
            <DetailRow label="Half day" value="3" />
            <DetailRow label="Paid leave" value="1" />
            <DetailRow label="Absent" value="2" />
            <DetailRow label="Holidays" value="4" />
          </div>
        </div>
      </div>
    </div>
  )
}

function PaySection({
  title,
  tone,
  children,
}: {
  title: string
  tone: 'emerald' | 'red'
  children: ReactNode
}) {
  return (
    <section className="rounded-xl border border-slate-200 bg-white">
      <div className={`flex items-center gap-2 border-b border-slate-100 px-4 py-2.5`}>
        <span
          className={`h-2 w-2 rounded-full ${tone === 'emerald' ? 'bg-emerald-500' : 'bg-red-500'}`}
        />
        <h2 className="text-xs font-semibold uppercase tracking-wider text-slate-500">{title}</h2>
      </div>
      <div className="divide-y divide-slate-100 px-4">{children}</div>
    </section>
  )
}

function PayRow({ label, value, total }: { label: string; value: string; total?: boolean }) {
  return (
    <div
      className={`flex items-center justify-between py-2.5 text-sm ${
        total ? 'font-semibold text-slate-900' : 'text-slate-700'
      }`}
    >
      <span>{label}</span>
      <span className="tabular-nums">{value}</span>
    </div>
  )
}

// =============================================================================
// Tiny inline primitives used only by the preview (not exported).
// These mirror the design intent so the proper /components/ui/* implementation
// has a target to match.
// =============================================================================

type BtnVariant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'link'
type BtnSize = 'sm' | 'md' | 'tap'

function Btn({
  variant = 'primary',
  size = 'md',
  className = '',
  children,
  ...rest
}: React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: BtnVariant; size?: BtnSize }) {
  const V: Record<BtnVariant, string> = {
    primary: 'bg-indigo-600 text-white hover:bg-indigo-700 active:bg-indigo-800',
    secondary:
      'bg-white text-slate-900 border border-slate-300 hover:bg-slate-50 active:bg-slate-100',
    ghost: 'bg-transparent text-slate-700 hover:bg-slate-100',
    danger: 'bg-red-600 text-white hover:bg-red-700',
    link: 'bg-transparent text-indigo-600 hover:underline',
  }
  const S: Record<BtnSize, string> = {
    sm: 'px-3 py-1.5 text-sm rounded-lg',
    md: 'px-4 py-2 text-sm rounded-lg',
    tap: 'min-h-[48px] px-4 py-3 text-base rounded-xl font-semibold',
  }
  return (
    <button
      className={`inline-flex items-center justify-center gap-2 font-medium transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60 ${V[variant]} ${S[size]} ${className}`}
      {...rest}
    >
      {children}
    </button>
  )
}

function Input({
  label,
  leftIcon: LeftIcon,
  error,
  className = '',
  ...rest
}: React.InputHTMLAttributes<HTMLInputElement> & {
  label?: string
  leftIcon?: typeof Search
  error?: string
}) {
  return (
    <label className="block">
      {label && <span className="mb-1.5 block text-sm font-medium text-slate-700">{label}</span>}
      <span className="relative block">
        {LeftIcon && (
          <LeftIcon
            size={16}
            className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
          />
        )}
        <input
          className={`block w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-base text-slate-900 placeholder:text-slate-400 focus:border-indigo-500 focus:outline-none focus:ring-4 focus:ring-indigo-500/20 disabled:cursor-not-allowed disabled:bg-slate-50 disabled:text-slate-500 ${LeftIcon ? 'pl-9' : ''} ${error ? 'border-red-400 focus:border-red-500 focus:ring-red-500/20' : ''} ${className}`}
          {...rest}
        />
      </span>
      {error && <span className="mt-1 block text-xs text-red-600">{error}</span>}
    </label>
  )
}

type BadgeTone = 'amber' | 'sky' | 'emerald' | 'red' | 'slate' | 'indigo'
const TONES: Record<BadgeTone, { softBg: string; softText: string; ring: string }> = {
  amber: { softBg: 'bg-amber-50', softText: 'text-amber-700', ring: 'ring-amber-200' },
  sky: { softBg: 'bg-sky-50', softText: 'text-sky-700', ring: 'ring-sky-200' },
  emerald: { softBg: 'bg-emerald-50', softText: 'text-emerald-700', ring: 'ring-emerald-200' },
  red: { softBg: 'bg-red-50', softText: 'text-red-700', ring: 'ring-red-200' },
  slate: { softBg: 'bg-slate-100', softText: 'text-slate-600', ring: 'ring-slate-200' },
  indigo: { softBg: 'bg-indigo-50', softText: 'text-indigo-700', ring: 'ring-indigo-200' },
}

function Badge({ tone = 'slate', children }: { tone?: BadgeTone; children: ReactNode }) {
  const t = TONES[tone]
  return (
    <span
      className={`inline-flex items-center rounded-md px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide ring-1 ${t.softBg} ${t.softText} ${t.ring}`}
    >
      {children}
    </span>
  )
}

function FilterChip({ active, children }: { active?: boolean; children: ReactNode }) {
  return (
    <button
      type="button"
      className={`rounded-full px-3 py-1 text-xs font-medium transition ${
        active
          ? 'bg-indigo-600 text-white'
          : 'border border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
      }`}
    >
      {children}
    </button>
  )
}

function StatTile({
  icon: Icon,
  label,
  value,
  delta,
  tone = 'indigo',
}: {
  icon: typeof Home
  label: string
  value: string
  delta?: string
  tone?: BadgeTone
}) {
  const t = TONES[tone]
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-3 shadow-sm">
      <div className="flex items-center gap-2">
        <span
          className={`flex h-8 w-8 items-center justify-center rounded-lg ${t.softBg} ${t.softText}`}
        >
          <Icon size={16} />
        </span>
        <span className="text-xs font-medium text-slate-500">{label}</span>
      </div>
      <p className="mt-2 text-2xl font-semibold tabular-nums tracking-tight text-slate-900">
        {value}
      </p>
      {delta && <p className={`mt-0.5 text-[11px] ${t.softText}`}>{delta}</p>}
    </div>
  )
}

function FooterNote() {
  return (
    <footer className="mt-12 rounded-2xl border border-slate-200 bg-white p-6 text-sm text-slate-600 shadow-sm">
      <p className="font-semibold text-slate-900">Decision time</p>
      <p className="mt-2">
        If this look is the direction, reply <code className="rounded bg-slate-100 px-1">approve</code> and I'll finish the
        OpenSpec proposal (specs + tasks) and start the migration in the order documented in
        <code className="ml-1 rounded bg-slate-100 px-1">design.md</code>: tokens → primitives → templates → shell reskin
        → feature pages.
      </p>
      <p className="mt-2">
        For tweaks, name the section (e.g., "Dashboard tiles too big" or "Use blue not indigo")
        and I'll iterate on this preview before locking the spec.
      </p>
      <p className="mt-3 text-xs text-slate-500">
        <FileText size={12} className="mr-1 inline" />
        proposal.md and design.md are saved at openspec/changes/enterprise-white-theme-ux/.
        Specs and tasks are paused awaiting approval.
      </p>
      <p className="mt-1 text-xs text-slate-500">
        <Mail size={12} className="mr-1 inline" />
        Open this URL on a phone for the real touch feel.
      </p>
    </footer>
  )
}
