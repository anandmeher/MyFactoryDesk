import { QueryClientProvider } from '@tanstack/react-query'
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { queryClient } from '@/lib/queryClient'
import { Dashboard } from '@/routes/Dashboard'
import { Login } from '@/routes/Login'
import { Placeholder } from '@/routes/Placeholder'
import { RequireAuth } from '@/routes/RequireAuth'

export function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route
            path="/dashboard"
            element={
              <RequireAuth>
                <Dashboard />
              </RequireAuth>
            }
          />
          <Route
            path="/employees/*"
            element={
              <RequireAuth>
                <Placeholder title="Employees" />
              </RequireAuth>
            }
          />
          <Route
            path="/attendance/*"
            element={
              <RequireAuth>
                <Placeholder title="Attendance" />
              </RequireAuth>
            }
          />
          <Route
            path="/advances/*"
            element={
              <RequireAuth>
                <Placeholder title="Advances" />
              </RequireAuth>
            }
          />
          <Route
            path="/payroll/*"
            element={
              <RequireAuth>
                <Placeholder title="Payroll" />
              </RequireAuth>
            }
          />
          <Route
            path="/payslips/*"
            element={
              <RequireAuth>
                <Placeholder title="Payslip" />
              </RequireAuth>
            }
          />
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </BrowserRouter>
      {import.meta.env.DEV && <ReactQueryDevtools initialIsOpen={false} />}
    </QueryClientProvider>
  )
}
