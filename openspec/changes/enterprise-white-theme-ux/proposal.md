## Why

The v1 surface (Login, Dashboard, Employees, Attendance, Advances, Payroll, Payslip) now spans 12 routed screens that were each built incrementally: button variants drift, page headers vary in title size and spacing, list rows differ in density between Employees/Payroll/Advances, the dark `#1f2937` header reads as "scaffold" against an otherwise off-white canvas, and form/wizard pages (NewEmployee, NewPayrollRun, AttendanceDailyMark) each invented their own footer-action patterns. Before the owner shows the app to a real factory user, this drift needs to settle into one coherent **enterprise white-theme** look — the kind of clean, calm surface a manager expects from a paid SaaS product, not a prototype.

This change introduces a single design system (tokens + reusable primitives + page templates) and applies it to **every v1 page** in one coordinated pass. Doing it now — before module 2 (Sales / GST billing) lands — costs one focused refactor; doing it after means re-skinning twice as many screens and risks visual inconsistency between modules at launch.

## What Changes

- **New design tokens**: a white-canvas palette (`bg-white` for the app surface; `bg-slate-50` reserved for inset wells and disabled states), a refined neutral ramp, a single accent (`indigo-600`) for primary actions and active nav, and semantic tokens for success/warning/danger/info. Dark `#1f2937` is retired as the chrome background and kept only as `text-slate-900` for headings.
- **Reskinned `AppShell`**: white sticky header with a subtle bottom border (replaces the dark brand bar), white sidebar with hairline divider, refined typography in nav rows. **BREAKING (UI-only)**: header background changes from `bg-brand` → `bg-white`; nav active state changes from solid brand fill to indigo-tinted background with left accent bar.
- **Component primitives** (under `apps/web/src/components/ui/`): standardised `Button` (5 variants × 3 sizes), `Input`, `Select`, `Textarea`, `Card`, `Badge`, `Table`, `Tabs`, `Toolbar`, `PageHeader`, `Section`, `StatTile`, `Toast`. Every primitive uses the new tokens; existing `Button`/`Input`/`Skeleton`/`EmptyState`/`ErrorState` are upgraded in place.
- **Page templates**: `ListPage`, `DetailPage`, `FormPage`, `WizardPage`, `EmptyState`, `LoadingState`, `ErrorState` — composable shells that own the page's title bar, primary action slot, breadcrumbs, content padding, and sticky-footer slot. Every routed screen migrates to one of these templates.
- **Per-page redesign** (all 12 v1 routes — see `design.md` §Page-by-page):
  - `Login` — full-bleed split with subtle gradient divider, brand mark, rounded card; consistent input styles.
  - `Dashboard` — KPI strip (employees count, attendance % today, pending advances, latest run status) above the existing tile grid; tiles upgraded to `StatTile` with icon, label, and quick-glance secondary metric.
  - `EmployeesList` — sticky search/filter toolbar, table on `≥ md` and card list on mobile, density-toggle, pagination meta.
  - `NewEmployee` / `EmployeeDetail` — `FormPage` template with section groupings (Identity, Employment, Salary structure, Bank), inline validation states, sticky save bar.
  - `AttendanceDailyMark` — refined date-picker chip row, batch-action toolbar (Mark all P / clear), per-row density tightened, sticky bottom action bar uses the new `Toolbar` primitive.
  - `AttendanceCalendar` / `AttendanceSummary` — calendar uses status-coloured dots (not full-cell fills) for legibility; summary becomes a sortable `Table`.
  - `AdvancesList` / `NewAdvance` / `EditAdvance` — list shows status badges + scheduled-month pill; forms use `FormPage`.
  - `PayrollList` — runs as cards with month/year, status `Badge`, totals; "+ New run" promoted to primary action slot.
  - `NewPayrollRun` — wizard (Select month → Preview → Finalize) using `WizardPage` with stepper.
  - `PayrollRunDetail` — header with run status + total payout `StatTile` row, employee payslip rows in a `Table`, sticky action bar (Finalize / Mark paid) gated by status + role.
  - `PayslipDetail` — print-ready layout that mirrors the PDF, share/download actions in the page header.
- **Loading / empty / error states**: every page surfaces these via the shared primitives — no more inline skeleton blocks duplicated per screen.
- **Accessibility**: maintain ≥ 56px tap targets on mobile, retain `focus-visible:ring-2 ring-indigo-500 ring-offset-2` on every interactive element, ensure WCAG AA contrast across the new palette, preserve keyboard shortcuts (`Esc` closes drawer, sticky bars don't trap focus).
- **PWA theme**: update `theme_color` in the manifest from `#1f2937` to `#ffffff` so the iOS/Android status bar matches the new chrome.

## Capabilities

### New Capabilities

- `design-system`: design tokens (color, spacing, type, radii, shadow, motion), the reusable UI primitives (`Button`, `Input`, `Select`, `Textarea`, `Card`, `Badge`, `Table`, `Tabs`, `Toolbar`, `PageHeader`, `Section`, `StatTile`, `Toast`), and the loading/empty/error state primitives. Owns the contract that every authenticated screen renders only via these primitives — raw Tailwind layout classes inside feature folders are forbidden once migration completes.
- `page-ux`: the reusable page templates (`ListPage`, `DetailPage`, `FormPage`, `WizardPage`) and the per-page UX requirements for each of the 12 v1 routes (header/title shape, primary-action slot, sticky footer behaviour, mobile vs desktop layout switch, loading/empty/error semantics).

### Modified Capabilities

_None at the spec layer in this change._ The `app-shell` capability is still in-flight via the `web-app-shell` change (not yet archived to `openspec/specs/`); its chrome reskin rules (white header, indigo accent active-state, hairline borders) are owned here by `design-system` requirements that `app-shell` must conform to. Once `web-app-shell` archives, a follow-up delta can fold the styling rules into the canonical `app-shell` spec — this change does not block on that.

## Impact

- **Affected files**: every file under `apps/web/src/components/ui/`, `apps/web/src/components/shell/`, `apps/web/src/routes/`, and `apps/web/src/features/**` — touched in a coordinated sweep. New files: `apps/web/src/components/ui/{Card,Badge,Table,Tabs,Toolbar,Select,Textarea,Toast}.tsx`, `apps/web/src/components/page/{ListPage,DetailPage,FormPage,WizardPage,PageHeader,Section,StatTile}.tsx`, `apps/web/src/lib/tokens.ts`. `tailwind.config.js` extended with the new palette and motion tokens. `apps/web/public/manifest.webmanifest` `theme_color` updated.
- **No backend changes**. No API contract or schema impact; no Zod schema in `packages/shared` is touched.
- **No new runtime dependencies**. We continue to use Tailwind + `lucide-react` + `clsx`/`tailwind-merge`. No headless-UI, no Radix, no shadcn install — primitives are hand-rolled to keep the bundle ≤ 450 KB.
- **PWA manifest**: `theme_color` flips from `#1f2937` to `#ffffff`; users will see the OS status bar tint update on next install/refresh. No service-worker invalidation needed.
- **Bundle size budget**: net change must stay within +30 KB gzipped. Verified by `pnpm --filter @myfactorydesk/web build` size diff before/after.
- **Phased rollout**: lands behind two preview routes first (`/preview/design-system` showing the primitive gallery, and `/preview/pages` showing each redesigned page rendered with stub data) so the owner can review on a phone before the live screens swap. Live screens migrate page-by-page in the order: shell → primitives → Login → Dashboard → Employees → Attendance → Advances → Payroll → Payslip.
- **Out of scope**: dark mode, Hindi/Odia localisation, RTL, brand identity overhaul (logo/typography family stays system-font), animation library (no framer-motion), Storybook setup. These are punted to v1.1+.
- **Risk**: visual regression on 360 × 800 viewport — mitigated by the preview routes and a manual screenshot pass on every page before the rollout commit.
