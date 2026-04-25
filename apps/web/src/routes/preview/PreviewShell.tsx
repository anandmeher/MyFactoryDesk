import { CalendarDays, Receipt, Users, Wallet } from 'lucide-react'
import { AppShell } from '@/components/shell'
import { getCurrentUser } from '@/lib/auth'

const TILES = [
  { label: 'Mark attendance', icon: CalendarDays, hint: 'Daily P/HD/L/A bulk' },
  { label: 'Manage employees', icon: Users, hint: 'Active staff master' },
  { label: 'Run payroll', icon: Receipt, hint: 'Draft → finalize → pay' },
  { label: 'Log advances', icon: Wallet, hint: 'Schedule deductions' },
]

export function PreviewShell() {
  const user = getCurrentUser()
  const greeting = greetByHour()

  return (
    <AppShell pageTitle="Preview">
      <section className="space-y-1">
        <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
          Owner preview
        </p>
        <h1 className="text-2xl font-semibold text-slate-900">
          {greeting}, {user?.name?.split(' ')[0] ?? 'there'} 👋
        </h1>
        <p className="text-sm text-slate-500 max-w-prose">
          This is a mockup of the new app shell. Tap around — open the menu,
          try the user badge, scroll to the footer. Confirm the look on your
          phone before we roll it out across the rest of the app.
        </p>
      </section>

      <section className="grid gap-3 sm:grid-cols-2">
        {TILES.map(({ label, icon: Icon, hint }) => (
          <article
            key={label}
            className="flex items-start gap-3 rounded-lg bg-white p-4 shadow-sm ring-1 ring-slate-200/60 hover:ring-slate-300 transition"
          >
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-brand/5 text-brand">
              <Icon size={20} />
            </span>
            <div className="min-w-0">
              <p className="text-base font-medium text-slate-900">{label}</p>
              <p className="text-sm text-slate-500">{hint}</p>
            </div>
          </article>
        ))}
      </section>

      <section className="rounded-lg bg-white p-4 shadow-sm ring-1 ring-slate-200/60">
        <h2 className="text-sm font-semibold text-slate-900">What you're reviewing</h2>
        <ul className="mt-2 space-y-1.5 text-sm text-slate-600 list-disc list-inside">
          <li>Sticky header with brand, hamburger menu (mobile), and your name + role.</li>
          <li>Slide-out left menu on phone, fixed rail on desktop. Active route highlighted.</li>
          <li>Footer with build version and support number.</li>
          <li>Cards use a soft ring + subtle shadow instead of heavy borders.</li>
        </ul>
      </section>
    </AppShell>
  )
}

function greetByHour(): string {
  const h = new Date().getHours()
  if (h < 12) return 'Good morning'
  if (h < 17) return 'Good afternoon'
  return 'Good evening'
}
