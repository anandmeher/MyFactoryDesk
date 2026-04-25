## ADDED Requirements

### Requirement: AppShell wraps every authenticated screen
After Phase 2 of this change, every routed authenticated screen (Dashboard, Employees List, New Employee, Employee Detail, Attendance, Advances, Payroll, Payslip — all current and future post-login screens) SHALL render its content inside `AppShell`. The `Login` route is the only exception and SHALL keep its full-bleed centred layout.

#### Scenario: Dashboard renders inside the shell
- **WHEN** an authenticated user navigates to `/dashboard`
- **THEN** the page renders with `AppHeader` at the top, `AppSidebar` (or its mobile drawer trigger) on the left, and `AppFooter` at the bottom
- **AND** the dashboard's tile grid appears in the shell's main content slot

#### Scenario: Login is exempt from the shell
- **WHEN** an unauthenticated user opens `/login`
- **THEN** the login form renders centred on a full-bleed canvas with no sidebar, no header brand bar, and no footer

### Requirement: Sticky AppHeader exposes brand, page title, and user menu
`AppHeader` SHALL render a sticky bar (`position: sticky; top: 0`) carrying: a hamburger button (mobile only) that opens the sidebar drawer, the brand mark, the current page title, and a user menu trigger that reveals the signed-in name, role badge, and a Logout action. The header SHALL keep height ≤ 56 px and SHALL not occlude page content (page content's first child must clear the header).

#### Scenario: Hamburger opens the drawer on mobile
- **WHEN** on a 360 × 800 viewport an authenticated user taps the hamburger
- **THEN** the sidebar drawer slides in from the left with a backdrop
- **AND** focus moves to the first nav item

#### Scenario: User menu shows role and logout
- **WHEN** an authenticated user opens the user menu
- **THEN** the menu shows the user's name, a coloured badge with the role, and a Logout item
- **AND** tapping Logout calls `POST /auth/logout`, clears session, and navigates to `/login`

### Requirement: AppSidebar is the single source of authenticated navigation
`AppSidebar` SHALL render a list of navigation entries derived from a single `NAV` constant. Each entry has a `to` route, a `label`, an `icon`, and an optional `soon` flag. Soon-flagged entries SHALL render disabled with a "soon" badge and SHALL NOT navigate when activated. The active route SHALL be visually highlighted (matched via `useMatch('/<path>/*')` so nested routes also light their parent). On viewports `< md` (768 px) the sidebar SHALL render as a slide-out drawer that opens from the hamburger and closes on backdrop tap, on `Esc`, and after a nav item is activated. On viewports `≥ md` the sidebar SHALL render as a fixed left rail.

#### Scenario: Active route is highlighted
- **WHEN** the user is on `/employees/cmoeb6hcf00033g5e8lgf4dem`
- **THEN** the "Employees" sidebar entry shows the active state (brand background, white text)

#### Scenario: Soon-flagged entries are non-interactive
- **WHEN** a `soon`-flagged entry is rendered (e.g., Attendance during phase 1)
- **THEN** it appears with a "soon" badge and a muted colour
- **AND** tapping it does nothing

#### Scenario: Drawer closes after navigation on mobile
- **WHEN** on a 360 × 800 viewport the user taps a nav item from the open drawer
- **THEN** the drawer slides out and the route navigates

#### Scenario: Esc closes the drawer
- **WHEN** the drawer is open and the user presses `Esc`
- **THEN** the drawer closes and focus returns to the hamburger button

### Requirement: AppFooter displays version and support contact
`AppFooter` SHALL render a low-attention footer at the bottom of the main content area (not fixed) showing the build version and a support phone number. In development builds the footer SHALL also include a link to the in-repo OpenSpec progress (`tasks.md`); production builds SHALL omit that link.

#### Scenario: Footer in production has no internal links
- **WHEN** the bundle is built with `NODE_ENV=production`
- **THEN** the footer renders only the version line and the support contact line

#### Scenario: Footer in dev shows OpenSpec link
- **WHEN** the dev server runs (`pnpm --filter @myfactorydesk/web dev`)
- **THEN** the footer additionally renders a "View OpenSpec progress" link

### Requirement: Tap targets and viewport floor are preserved
Every interactive element inside `AppShell` (nav rows, hamburger, user menu trigger, footer link, Logout item) SHALL be at least 56 px tall on mobile. The shell SHALL render correctly on a 360 × 800 viewport without horizontal scrolling.

#### Scenario: Nav rows meet tap-target size
- **WHEN** the sidebar drawer is open on a 360-wide viewport
- **THEN** each nav row measures at least 56 px in height

#### Scenario: No horizontal scroll on the shell
- **WHEN** the shell renders on a 360-wide viewport with the longest seeded employee name in the header
- **THEN** there is no horizontal scrollbar; the title truncates with ellipsis if needed

### Requirement: Phase-1 preview route demonstrates the shell before rollout
A hidden route at `/preview/shell` SHALL render `AppShell` over a stub dashboard so the owner can review the chrome on a real phone before approving the rollout. A second preview route at `/preview/shell-with-list` SHALL render `AppShell` wrapping the real `EmployeesList` so the owner can verify representative content. Both routes SHALL be wrapped in `RequireAuth` and SHALL NOT appear in `AppSidebar`'s `NAV` list.

#### Scenario: Preview routes require auth
- **WHEN** an unauthenticated visitor navigates to `/preview/shell`
- **THEN** the app redirects to `/login` (carrying `from` state)

#### Scenario: Preview routes are not in the sidebar
- **WHEN** any user opens the sidebar
- **THEN** no entry pointing to `/preview/*` is visible

### Requirement: Existing screens stay on AppLayout during Phase 1
Phase 1 of this change SHALL NOT modify any existing routed screen's wrapping component. `EmployeesList`, `NewEmployee`, `EmployeeDetail`, `Dashboard`, and `Login` SHALL continue to render with `AppLayout` (or the existing centred layout for Login) until Phase 2 lands.

#### Scenario: Live employees list is unchanged in Phase 1
- **WHEN** the Phase-1 commit is checked out
- **THEN** `/employees` renders with the same `AppLayout`-based chrome it had before this change
- **AND** only the `/preview/*` routes show the new shell

### Requirement: Phase 2 swaps callers and removes AppLayout
Phase 2 of this change SHALL replace every `AppLayout` usage with `AppShell` in the screens listed above (Login excepted) and SHALL remove `AppLayout.tsx` once no callers reference it.

#### Scenario: AppLayout has no callers after Phase 2
- **WHEN** the Phase-2 commit is checked out
- **THEN** `grep -r "AppLayout" apps/web/src` returns no matches outside the deletion of the file itself
- **AND** `apps/web/src/components/AppLayout.tsx` no longer exists
