## 1. Shell Foundation (Phase 1)

- [x] 1.1 `apps/web/src/components/shell/` created; `index.ts` barrel exports `AppShell`, `useAppShell`, `NAV`, `NavItem`
- [x] 1.2 `nav.ts` — `NAV` for Dashboard + Employees (live), Attendance + Advances + Payroll (`soon: true`). Optional `visibleTo` field reserved for role-scoped entries when needed; unused for V1
- [x] 1.3 `AppShellContext.tsx` — `{ isDrawerOpen, openDrawer, closeDrawer, toggleDrawer }`. Throws if `useAppShell()` is called outside the provider (catches misuse early)
- [x] 1.4 `useFocusTrap.ts` — Esc → `onEscape`, initial focus to first focusable, Tab/Shift+Tab cycles inside ref, restores previously-focused element on unmount. Vanilla DOM, no deps
- [x] 1.5 `AppHeader.tsx` — sticky `h-14`, hamburger (`md:hidden`), brand "MyFactoryDesk" + optional `pageTitle` after a thin separator, `UserMenu` on the right
- [x] 1.6 `UserMenu.tsx` — initials avatar + name (sm+); popover on click with name, phone, role badge (colour by role), Logout. Closes on outside-click and Esc; no portal
- [x] 1.7 `AppSidebar.tsx` — drawer (`< md`) with backdrop + slide animation; fixed rail (`md:fixed md:left-0 md:top-14 md:bottom-0 md:w-64`). `useFocusTrap` is wired to the drawer ref. Drawer auto-closes on `location.pathname` change
- [x] 1.8 Active highlight via `useMatch({ path: item.to + '/*', end: false })` so `/employees/:id` lights "Employees". Soon-flagged items render as a non-link `<span aria-disabled="true">` with a "soon" pill
- [x] 1.9 `AppFooter.tsx` — version line + clickable `tel:` link to support number. Dev-only "View OpenSpec progress" link gated on `import.meta.env.DEV` (verified absent from production bundle)
- [x] 1.10 `AppShell.tsx` — wraps `AppShellProvider` + header + sidebar + content (`md:ml-64 px-4 py-4`) + footer. `min-h-screen` plus content `flex-1` keeps the footer at the bottom on short pages without `position: fixed`
- [x] 1.11 `apps/web/.env.example` — added `VITE_APP_VERSION` and `VITE_SUPPORT_PHONE` with sensible defaults

## 2. Mockup Routes (Phase 1)

- [x] 2.1 `PreviewShell.tsx` — greeting (time-of-day aware), four feature tiles with lucide icons, an explainer card listing what the owner is reviewing
- [x] 2.2 `PreviewShellWithList.tsx` — mounts `EmployeesList` inside `AppShell`. Note in the file explains why the nested `AppLayout` is intentional during Phase 1 and gets cleaned up in Phase 2
- [x] 2.3 Routes wired in `App.tsx` at `/preview/shell` and `/preview/shell-with-list`, both inside `RequireAuth`
- [x] 2.4 Confirmed: `NAV` in `nav.ts` contains only Dashboard/Employees/Attendance/Advances/Payroll — no preview entry. Smoke test confirmed no visible nav entry pointing at `/preview/*`

## 3. Visual Reskin (Phase 1, applies inside the shell only)

- [x] 3.1 No Tailwind config change needed — `colors.brand.DEFAULT = '#1f2937'` was already configured (Group 7), which makes `ring-brand`, `bg-brand`, `text-brand` work everywhere. `h-14` and the rest are built-in Tailwind utilities
- [x] 3.2 `PreviewShell` cards use `bg-white shadow-sm ring-1 ring-slate-200/60 hover:ring-slate-300 transition` per the design's "ring instead of border" choice
- [x] 3.3 Every interactive shell element gets `focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2` (header buttons use `ring-white` + `ring-offset-brand` against the dark header — same effect, different ground)
- [x] 3.4 Type scale applied: `text-base` body in tiles + cards, `text-sm` secondary lines, `text-2xl`/`text-base` for page hero (preview only) and header brand respectively, `text-xs uppercase tracking-wide` for the "Workspace" sidebar section label and the role badge

## 4. Quality Gates (Phase 1)

- [x] 4.1 `pnpm --filter @myfactorydesk/web typecheck` — clean
- [x] 4.2 `pnpm --filter @myfactorydesk/web build` — production bundle 418 KB JS / 134 KB gzipped, +15 KB raw / +4 KB gzipped vs the Group 8 baseline (well under the 30 KB gzip budget). CSS 19 KB / 4 KB gzipped, +1.4 KB gzipped
- [ ] 4.3 Manual 360 × 800 viewport walkthrough — **owed** (needs a real browser; cannot be done from this environment). Code-level checks confirmed: both preview routes return 200 from the dev server, `min-h-tap` is on every nav row, drawer uses `translate-x-full → translate-x-0`, Esc handler is wired via `useFocusTrap`, backdrop has `onClick={closeDrawer}`
- [ ] 4.4 Manual desktop ≥ 1280 px walkthrough — **owed** (same reason). Code-level: `md:hidden` on hamburger, `hidden md:fixed md:left-0 md:top-14 md:bottom-0 md:w-64` on the rail, `md:ml-64` on the main content offset
- [ ] 4.5 Manual focus-trap walkthrough — **owed** (keyboard interaction). Code-level: `useFocusTrap` pushes focus to first focusable on `active=true`, cycles Tab/Shift+Tab between first and last focusable, restores `previouslyFocused?.focus?.()` on unmount
- [x] 4.6 Production-build OpenSpec link — verified absent. `grep "View OpenSpec progress" dist/assets/index-*.js` returns 0 matches (Vite tree-shakes the dev branch via `import.meta.env.DEV`)
- [x] 4.x Regression smoke: existing `/auth/login` + `/employees` API path still works through the dev stack with the shell additions in place

## 5. Owner Sign-Off Gate

- [x] 5.1 Owner walked the preview routes — chose to approve based on a code-level walkthrough rather than running them on a phone in this session
- [x] 5.2 Approval recorded in chat ("apporved, continue") on 2026-04-25
- [x] 5.3 No revisions requested — skipped
- [x] 5.4 Approved → proceed to Group 6

## 6. Rollout (Phase 2 — gated on 5.4 approval)

- [x] 6.1 `Dashboard.tsx` now uses `AppShell pageTitle="Dashboard"`. Tile grid is **derived from `NAV`** (per design D4) — adding a NAV entry adds a tile automatically. Tiles use the same `min-h-tap`, lucide icon, ring + shadow card, and "soon" pill style as the sidebar
- [x] 6.2 `EmployeesList.tsx` uses `AppShell pageTitle="Employees"`. Search bar + active-only toggle moved into the shell's main content slot. The "+ Add" button moved out of the (now removed) custom header into the page heading; row cards reskinned to `rounded-lg + ring-1 ring-slate-200/60`
- [x] 6.3 `NewEmployee.tsx` uses `AppShell pageTitle="New employee"` with an inline `← Employees` back link above the page heading
- [x] 6.4 `EmployeeDetail.tsx` uses `AppShell pageTitle={emp.name}` via a small `DetailFrame` wrapper (handles loading/error/data branches uniformly). Inline back link above the heading; Edit button rendered alongside the heading via the `action` slot. Inner cards reskinned to ring style
- [x] 6.5 `Login.tsx` confirmed unchanged — already a full-bleed centred form, never imported `AppLayout`
- [x] 6.6 `apps/web/src/components/AppLayout.tsx` deleted
- [x] 6.7 `grep -r "AppLayout" apps/web/src` returns 0 matches (verified, exit code 1)
- [x] 6.8 Quality gates re-run on the rolled-out app: typecheck clean; build 418 KB JS / 134 KB gzipped (no further regression); preview routes still 200; all rolled-out source files transform via Vite; auth + employees API regression smoke green

## 7. Wrap

- [x] 7.1 `openspec/changes/web-app-shell/tasks.md` updated with all groups
- [ ] 7.2 Before / after screenshots in the PR description — **owed** (needs a real browser; cannot capture from this environment)
- [ ] 7.3 Note deferred items in the PR: dark mode, RTL, brand identity overhaul, Storybook — captured in proposal.md but worth restating in PR body
- [x] 7.x Tweaked `PreviewShellWithList`: after Phase 2 it just renders `<EmployeesList />` directly (which now wraps itself in `AppShell`). Comment in the file explains the route is preserved as a stable URL for any owner bookmarks from sign-off
