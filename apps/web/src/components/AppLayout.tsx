import { Link } from 'react-router-dom'
import type { ReactNode } from 'react'

export function AppLayout({
  title,
  back,
  action,
  children,
}: {
  title: string
  back?: string
  action?: ReactNode
  children: ReactNode
}) {
  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-brand text-white px-4 py-3 flex items-center justify-between sticky top-0 z-10">
        <div className="flex items-center gap-3">
          {back && (
            <Link
              to={back}
              className="rounded p-1 hover:bg-white/10 -ml-1"
              aria-label="Back"
            >
              ←
            </Link>
          )}
          <h1 className="text-lg font-semibold truncate">{title}</h1>
        </div>
        {action}
      </header>
      <main className="p-4 space-y-4 pb-24">{children}</main>
    </div>
  )
}
