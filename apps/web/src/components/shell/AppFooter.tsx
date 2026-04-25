export function AppFooter() {
  const version = import.meta.env.VITE_APP_VERSION ?? '0.0.0'
  const support = import.meta.env.VITE_SUPPORT_PHONE ?? '+91 9999999999'
  const isDev = import.meta.env.DEV

  return (
    <footer className="border-t border-slate-200 bg-white">
      <div className="mx-auto max-w-screen-md px-4 py-4 text-center text-xs text-slate-500 sm:flex sm:max-w-none sm:items-center sm:justify-between sm:text-left">
        <p>
          MyFactoryDesk · <span className="tabular-nums">v{version}</span>
        </p>
        <p>
          Support:{' '}
          <a
            href={`tel:${support.replace(/\s/g, '')}`}
            className="text-slate-700 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2 rounded"
          >
            {support}
          </a>
        </p>
        {isDev && (
          <p>
            <a
              href="/openspec/changes/v1-staff-payroll/tasks.md"
              className="text-slate-700 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2 rounded"
            >
              View OpenSpec progress
            </a>
          </p>
        )}
      </div>
    </footer>
  )
}
