import { EmployeesList } from '@/features/employees/EmployeesList'

/**
 * After Phase 2 of web-app-shell, EmployeesList wraps itself in AppShell.
 * So this preview route just delegates straight to EmployeesList — there is
 * nothing else to demonstrate. Kept as a route so the URL stays valid for
 * any bookmarks the owner saved during Phase-1 sign-off.
 */
export function PreviewShellWithList() {
  return <EmployeesList />
}
