import { createContext, useContext, useMemo, useState, type ReactNode } from 'react'

type Ctx = {
  isDrawerOpen: boolean
  openDrawer: () => void
  closeDrawer: () => void
  toggleDrawer: () => void
}

const AppShellContext = createContext<Ctx | null>(null)

export function AppShellProvider({ children }: { children: ReactNode }) {
  const [isDrawerOpen, setOpen] = useState(false)
  const value = useMemo<Ctx>(
    () => ({
      isDrawerOpen,
      openDrawer: () => setOpen(true),
      closeDrawer: () => setOpen(false),
      toggleDrawer: () => setOpen((v) => !v),
    }),
    [isDrawerOpen],
  )
  return <AppShellContext.Provider value={value}>{children}</AppShellContext.Provider>
}

export function useAppShell(): Ctx {
  const ctx = useContext(AppShellContext)
  if (!ctx) throw new Error('useAppShell must be used inside <AppShellProvider>')
  return ctx
}
