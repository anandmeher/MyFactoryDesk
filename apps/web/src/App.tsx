import { QueryClientProvider } from '@tanstack/react-query'
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { queryClient } from '@/lib/queryClient'
import { AttendanceCalendar } from '@/features/attendance/AttendanceCalendar'
import { AttendanceDailyMark } from '@/features/attendance/AttendanceDailyMark'
import { AttendanceSummary } from '@/features/attendance/AttendanceSummary'
import { EmployeeDetail } from '@/features/employees/EmployeeDetail'
import { EmployeesList } from '@/features/employees/EmployeesList'
import { NewEmployee } from '@/features/employees/NewEmployee'
import { Dashboard } from '@/routes/Dashboard'
import { Login } from '@/routes/Login'
import { Placeholder } from '@/routes/Placeholder'
import { PreviewShell } from '@/routes/preview/PreviewShell'
import { PreviewShellWithList } from '@/routes/preview/PreviewShellWithList'
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
            path="/employees"
            element={
              <RequireAuth>
                <EmployeesList />
              </RequireAuth>
            }
          />
          <Route
            path="/employees/new"
            element={
              <RequireAuth>
                <NewEmployee />
              </RequireAuth>
            }
          />
          <Route
            path="/employees/:id"
            element={
              <RequireAuth>
                <EmployeeDetail />
              </RequireAuth>
            }
          />
          <Route
            path="/attendance"
            element={
              <RequireAuth>
                <AttendanceDailyMark />
              </RequireAuth>
            }
          />
          <Route
            path="/attendance/summary"
            element={
              <RequireAuth>
                <AttendanceSummary />
              </RequireAuth>
            }
          />
          <Route
            path="/attendance/calendar/:employeeId"
            element={
              <RequireAuth>
                <AttendanceCalendar />
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
          <Route
            path="/preview/shell"
            element={
              <RequireAuth>
                <PreviewShell />
              </RequireAuth>
            }
          />
          <Route
            path="/preview/shell-with-list"
            element={
              <RequireAuth>
                <PreviewShellWithList />
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
