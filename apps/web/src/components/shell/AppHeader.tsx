import { Menu } from 'lucide-react'
import { useAppShell } from './AppShellContext'
import { UserMenu } from './UserMenu'

export function AppHeader({ pageTitle }: { pageTitle?: string }) {
  const { openDrawer } = useAppShell()

  return (
    <header className="sticky top-0 z-30 h-14 bg-brand text-white shadow-sm">
      <div className="flex h-full items-center gap-3 px-3 sm:px-4">
        <button
          type="button"
          aria-label="Open navigation"
          onClick={openDrawer}
          className="flex h-10 w-10 items-center justify-center rounded hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-brand md:hidden"
        >
          <Menu size={22} />
        </button>

        <div className="flex min-w-0 items-baseline gap-2">
          <span className="text-base font-semibold tracking-tight">MyFactoryDesk</span>
          {pageTitle && (
            <>
              <span aria-hidden className="text-white/40">·</span>
              <span className="truncate text-sm text-white/80">{pageTitle}</span>
            </>
          )}
        </div>

        <div className="ml-auto">
          <UserMenu />
        </div>
      </div>
    </header>
  )
}
