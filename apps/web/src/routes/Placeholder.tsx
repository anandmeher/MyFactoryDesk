import { Link } from 'react-router-dom'

export function Placeholder({ title }: { title: string }) {
  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-brand text-white px-4 py-3">
        <h1 className="text-lg font-semibold">{title}</h1>
      </header>
      <main className="p-4 space-y-4">
        <div className="rounded bg-white p-6 shadow-sm text-center">
          <p className="text-slate-500">Coming in a later milestone.</p>
        </div>
        <Link
          to="/dashboard"
          className="block min-h-tap rounded bg-white p-3 text-center font-medium shadow-sm"
        >
          ← Dashboard
        </Link>
      </main>
    </div>
  )
}
