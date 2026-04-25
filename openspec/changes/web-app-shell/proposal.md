## Why

The web app's screens currently each render their own `AppLayout` with a flat brand bar — fine for a scaffold, but visually thin and hard to navigate as we add Attendance, Advances, Payroll, and Payslips. Before more screens land (Groups 9–15 of `v1-staff-payroll`), introducing a unified, mobile-first shell with a sticky header, a slide-out left menu, a footer, and a slick visual reskin will (1) cut per-screen layout work in half, (2) give the owner a recognisable brand surface to show real users, and (3) avoid a costly refactor later when seven screens share a stale chrome.

The owner has explicitly asked to **see a mockup before confirming** the design — so this change ships in two phases: a hidden `/preview/shell` route demoing the new chrome on a sample dashboard, then (after sign-off) a rollout that replaces `AppLayout` everywhere.

## What Changes

- Add an `AppShell` component composed of `AppHeader`, `AppSidebar` (left nav, slide-out on mobile, fixed on ≥ md), and `AppFooter`.
- Add a hidden `/preview/shell` route that renders the shell over a stub dashboard so the owner can review the look on a phone before sign-off.
- Refresh the visual language: tighter typography scale, generous whitespace, subtle elevation (shadow + ring), explicit focus rings, larger tap targets on nav items (≥ 56 px), brand colour `#1f2937` retained as the dark accent with a softer slate canvas.
- Replace per-screen `AppLayout` usage in Login (kept distinct), Dashboard, Employees List/New/Detail with `AppShell` after sign-off.
- Add navigation entries for Dashboard, Employees, Attendance, Advances, Payroll — disabled where the route is not yet built (greyed with a "soon" badge), so the menu represents the v1 surface as a whole.
- Add a footer line with build version, support phone, and a "View OpenSpec progress" link to the in-repo `tasks.md` (dev-only, no link in production).

## Capabilities

### New Capabilities

- `app-shell`: a unified mobile-first chrome consisting of a sticky `AppHeader` (brand + page title + user menu with role badge + logout), a left `AppSidebar` (icon + label, active-route highlight, slide-out drawer on phones, fixed rail on desktop), and an `AppFooter` (build/version + support contact). All app screens (post-login) wrap their content in `AppShell`.

### Modified Capabilities

_None at the spec layer._ The existing `mobile-web-pwa` requirements (installable PWA, 360 × 800 viewport floor, route guard, etc.) are unchanged — this change adds chrome around them. The "Loading, error, and empty states" requirement keeps its current contract; the new shell only changes where those states are framed.

## Impact

- **Affected files**: `apps/web/src/components/AppLayout.tsx` is replaced (kept temporarily during rollout), `apps/web/src/App.tsx` gains `/preview/shell`, every routed screen post-login wraps its content in `AppShell` instead of `AppLayout`. New files under `apps/web/src/components/shell/`.
- **No backend changes**. No API contract or schema impact.
- **No new external runtime dependencies**. `lucide-react` is already installed; we reuse it for nav icons.
- **No PWA manifest changes** — theme colour and brand stay identical.
- **Phased rollout** — Phase 1 lands the shell behind `/preview/shell` only; existing screens stay on `AppLayout` until the owner approves the mock. Phase 2 swaps every routed screen.
- **Out of scope**: brand identity overhaul (logo, palette, typography family), dark mode, RTL, internationalisation. Theme stays slate / brand `#1f2937`.
