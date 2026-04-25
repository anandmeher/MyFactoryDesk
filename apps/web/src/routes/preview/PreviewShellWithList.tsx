import { AppShell } from '@/components/shell'
import { EmployeesList } from '@/features/employees/EmployeesList'

/**
 * Mounts the real EmployeesList inside the new shell so the owner sees a
 * representative content surface, not just a stub. The EmployeesList
 * component still wraps itself in AppLayout — until Phase 2 swaps callers,
 * this preview route nests both layers so the owner can compare live
 * spacing and density. After Phase 2 lands, EmployeesList will use AppShell
 * directly and this preview route will simplify.
 */
export function PreviewShellWithList() {
  return (
    <AppShell pageTitle="Preview · Employees">
      <div className="rounded-lg overflow-hidden ring-1 ring-slate-200/60 bg-white">
        <EmployeesList />
      </div>
    </AppShell>
  )
}
