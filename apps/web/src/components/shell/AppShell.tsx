import type { ReactNode } from 'react'
import { AppFooter } from './AppFooter'
import { AppHeader } from './AppHeader'
import { AppShellProvider } from './AppShellContext'
import { AppSidebar } from './AppSidebar'

export function AppShell({
  pageTitle,
  children,
}: {
  pageTitle?: string
  children: ReactNode
}) {
  return (
    <AppShellProvider>
      <div className="min-h-screen bg-slate-50">
        <AppHeader pageTitle={pageTitle} />
        <AppSidebar />
        <div className="md:ml-64 flex min-h-[calc(100vh-3.5rem)] flex-col">
          <main className="flex-1 px-4 py-4 sm:px-6">{children}</main>
          <AppFooter />
        </div>
      </div>
    </AppShellProvider>
  )
}
