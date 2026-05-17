## Context

The web app reached a "scaffold" plateau: 12 routed screens shipped against three different ad-hoc styling habits. Lists in `EmployeesList`, `PayrollList`, and `AdvancesList` each define their own card-row recipe; every form (`NewEmployee`, `NewAdvance`, `NewPayrollRun`) reinvents its own footer save bar; the dark `bg-brand` (#1f2937) header reads more like a debug toolbar than a product chrome on a white-canvas surface.

The owner's brief is two phrases — "slick enterprise look" and "white theme". Both translate concretely:
- **White theme** → app surface is `bg-white`, not `bg-slate-50`. `slate-50` becomes a secondary tone for inset wells and disabled states. The dark `#1f2937` chrome retires from background use.
- **Enterprise** → the cues a manager recognises from paid SaaS (Linear, Notion, Stripe Dashboard): generous whitespace, hairline borders instead of heavy shadows, a single accent colour (not a rainbow of badge tones), tabular density on lists at desktop sizes, sticky toolbars that don't shout.

**Constraints inherited from the project:**
- **Mobile-first**: 360 × 800 viewport floor (per `mobile-web-pwa`); ≥ 56px tap targets on every interactive element on mobile.
- **No new runtime deps**: Tailwind + `lucide-react` + `clsx` + `tailwind-merge` is the entire UI surface. No Radix, no Headless UI, no shadcn install, no framer-motion.
- **One codebase / PWA**: same components render mobile and desktop; responsive switches via Tailwind `md:` (768px) breakpoint.
- **Bundle budget**: net change ≤ +30 KB gzipped. Hand-rolled primitives, not a library import.
- **PWA manifest**: `theme_color` ties to the OS status bar — flipping it from `#1f2937` to `#ffffff` is a one-line change but ships in the same commit as the header reskin.
- **No backend changes**: the spec layer for `auth`, `employees`, `attendance`, `advances`, `payroll-runs`, `payroll-calculation`, `payslip-pdf` is untouched.

**Stakeholders:** the owner (final approver of look + density), staff/manager/accountant (daily users on phones), the developer who will keep adding screens (me).

## Goals / Non-Goals

**Goals:**
- A single design-token file (`apps/web/src/lib/tokens.ts` + `tailwind.config.js` extension) is the source of truth for every colour, radius, shadow, motion duration used in the app.
- Every authenticated screen is built from the **same** primitives (`Button`, `Input`, `Card`, `Badge`, `Table`, `Toolbar`, `PageHeader`, `Section`, `StatTile`) and **same** page templates (`ListPage`, `DetailPage`, `FormPage`, `WizardPage`). Raw Tailwind layout classes inside `apps/web/src/features/**` are forbidden after migration.
- All 12 v1 routes land redesigned in coordinated phases — no half-painted state where Employees uses the new system but Payroll still uses the old one in the same merged commit set.
- Owner reviews the redesign **before** live screens swap, via two preview routes: a primitive gallery and a page-by-page mock walkthrough.
- Mobile and desktop both look polished. List pages use card-rows on mobile and a tabular `Table` on `≥ md`, sharing the same data layer.
- Accessibility holds the line: WCAG AA contrast on the new palette, `focus-visible:ring-2` on every interactive, ≥ 56px tap targets on mobile, keyboard navigation preserved.
- Bundle size stays ≤ +30 KB gzipped.

**Non-Goals:**
- **Brand identity overhaul** — the logo wordmark "MyFactoryDesk" stays, the system font stack stays. Only the chrome surface treatment changes.
- **Dark mode** — punted; the canvas is intentionally light per the brief.
- **Internationalisation / RTL** — out of v1; copy stays English.
- **Animation library** — no framer-motion or react-spring; `transition-colors` and `translate-x` for the drawer are enough.
- **Storybook** — overkill for V1; the `/preview/design-system` route serves as a living gallery instead.
- **A switch-user / multi-tenant UI** — single business in v1; user menu remains "name + role badge + logout".
- **PDF redesign** — `payslip-pdf` rendering is untouched; only the on-screen `PayslipDetail` view is reskinned.
- **New module surfaces** (Sales / GST / Production) — those land under module-2 changes; this redesign is locked to v1's 12 routes.

## Decisions

### D1. White canvas, slate-50 reserved for inset wells

**Choice:** App surface is `bg-white`. `bg-slate-50` is reserved for: (a) the body background of pages that need to "frame" white cards (e.g., the daily attendance page where each employee card visually pops on a faintly-grey backdrop), (b) disabled input backgrounds, (c) table zebra rows on `≥ md` only.

**Why:** A pure-white app surface is the strongest single signal of "enterprise" — Linear, Vercel, Stripe, Notion all ship this. Mixing slate-50 selectively (not as the default) gives us the depth Material/Bootstrap apps achieve with shadows, without the visual noise.

**Alternatives considered:**
- **Keep `slate-50` everywhere** (current state): reads softer but blurs hierarchy — cards barely distinguish from canvas without a heavier shadow.
- **Off-white tinted `stone-50` / `zinc-50`**: minor warmth shift, but worse contrast against the indigo accent and harder to keep consistent.

### D2. Single accent colour: `indigo-600`

**Choice:** Primary actions, active nav state, focus rings, link colour, progress indicators all use `indigo-600` (text/border) and `indigo-50` (subtle backgrounds). Status semantics use Tailwind defaults: `emerald-600` (success/PAID), `amber-600` (warning/DRAFT), `red-600` (danger/error), `sky-600` (info/FINALIZED). Brand `#1f2937` retires from background use; survives only as `text-slate-900` for headings.

**Why:** A single accent is the cleanest enterprise signal — multi-coloured chrome reads as consumer/social. Indigo over the existing slate-grey-900 because (a) it has stronger AA contrast on white than slate, (b) it visually distinguishes the active nav from the heading text, (c) it's the only neutral-adjacent hue Tailwind ships that doesn't conflict with the existing emerald/amber/red status palette already used in `PayrollList` and `AttendanceDailyMark`.

**Alternatives considered:**
- **Keep `#1f2937` (slate-800) as the accent**: too close to body text colour; active states wouldn't pop on the white canvas.
- **Blue-600**: very common, slightly more consumer-feeling than indigo.
- **Custom brand colour from owner**: deferred — owner brief said "white theme", not "rebrand"; accent can swap later by editing tokens.

### D3. Token file in `apps/web/src/lib/tokens.ts`, mirrored in `tailwind.config.js`

**Choice:** A single TypeScript file exports the design tokens (`color`, `space`, `radius`, `shadow`, `motion`). `tailwind.config.js` extends `theme` from those same constants so a token change updates both runtime code (any conditional class) and Tailwind's generated utilities. No CSS-vars: with no dark mode, runtime theming buys nothing.

**Why:** Tokens-as-TS-constants are the simplest source of truth — type-checked, importable in tests, no parsing layer. CSS-vars would be needed only if we shipped dark mode (we're not). The duplication between `tokens.ts` and `tailwind.config.js` is a small price for getting both worlds.

**Alternatives considered:**
- **CSS custom properties + `var(--color-accent)` in Tailwind**: enables dark mode but adds a layer of indirection that's wasted today.
- **Style Dictionary / Theo**: build-step heavy for a 1-token-file project.
- **Inline numbers in Tailwind config**: hard to share with non-Tailwind code paths (e.g., the upcoming Toast portal).

### D4. Page templates own page chrome; features own data

**Choice:** Three new page templates under `apps/web/src/components/page/`:
- `ListPage` — owns `PageHeader` + filter `Toolbar` slot + content slot (where the feature renders its `Table` or card list) + pagination meta footer.
- `DetailPage` — owns breadcrumb back link + `PageHeader` (title + subtitle + status `Badge` + actions slot) + sectioned content + optional sticky action bar.
- `FormPage` — owns `PageHeader` + grouped form `Section`s + sticky save bar with primary/secondary actions.
- `WizardPage` — owns stepper at top + per-step content + bottom Next/Back bar.

Feature folders (`features/employees`, `features/payroll`, etc.) supply only the data hooks and the in-content rendering; no feature folder writes its own page header or sticky bar.

**Why:** This is the single biggest source of drift today — every page invents its own title bar and footer bar. Templates give us a fix-once-help-everywhere lever and a place to enforce accessibility (focus management on form save, breadcrumb landmarks on detail).

**Alternatives considered:**
- **One mega-template `Page` with prop slots**: prop explosion, less discoverable.
- **No template, just a styling guide**: relies on every contributor remembering the pattern; today's drift proves this fails.

### D5. Lists are responsive: card-rows on mobile, `<Table>` on `≥ md`

**Choice:** `EmployeesList`, `AdvancesList`, `PayrollList`, `AttendanceSummary`, and `PayrollRunDetail`'s payslip rows render as touch-friendly card-rows on `< md` and as a proper `<Table>` (with sortable headers, hover row, sticky header) on `≥ md`. Same data hook drives both; the conditional is a single `<div className="md:hidden">` / `<div className="hidden md:block">` swap inside the feature, both rendering through `design-system` primitives.

**Why:** Enterprise users on desktop expect a table — they want to scan 50 employees, not scroll a card list. Mobile users need fat tap targets — they don't want to pinch-zoom into a 12-column table. Same data, two views, both polished.

**Alternatives considered:**
- **Card-rows everywhere**: cleaner mobile, but a table view is a "feels like a real product" moment on desktop.
- **A "responsive table" library**: extra dep, awkward at our viewport range.
- **CSS `display: table` magic on the same DOM**: a11y hazards (screen readers see inconsistent semantics).

### D6. Sticky bars use the `Toolbar` primitive — never a hand-rolled `fixed bottom-0` div

**Choice:** A single `Toolbar` primitive renders sticky action bars (top filter toolbar on lists, bottom save bar on forms, bottom Next/Back on wizards). It owns: the safe-area-inset padding for iOS notch/keyboard, the elevation (`shadow-[0_-4px_12px_rgba(0,0,0,0.04)]` on bottom variants), the focus-trap awareness (doesn't trap; allows tab through to content), and the responsive behaviour (full-bleed on mobile, contained `max-w-2xl mx-auto` on desktop).

**Why:** Today three places hand-roll this (`AttendanceDailyMark`, `EmployeeDetail`, `PayrollRunDetail`) and each forgets a different detail (one misses safe-area-inset, another misses focus order). One primitive = one bug surface.

**Alternatives considered:**
- **Inline pattern**: continues today's drift.
- **Use a library bottom-sheet**: bottom-sheet ≠ toolbar; semantics differ.

### D7. Preview routes for owner sign-off

**Choice:** Two new hidden routes:
- `/preview/design-system` — a single-page gallery: every primitive at every variant + size + state (default, hover, focus, disabled, loading), the colour ramp, the type scale, the spacing scale, the shadow ramp.
- `/preview/pages` — a vertically stacked walkthrough of every redesigned page rendered with stub data (no API calls). Each section is a labelled `<section>` so the owner can scroll the whole product in one screen.

Both are wrapped in `RequireAuth` (so we test from inside the authenticated context), absent from `NAV`, and survive into production as a living style guide.

**Why:** The brief explicitly said "show how it looks" before shipping. A code-level preview gives the owner the real fonts, real touch behaviour, and real PWA install — none of which Figma captures. Survives post-launch as the style-guide lookup site.

**Alternatives considered:**
- **Figma mock**: doesn't show real touch / PWA behaviour; asks owner to install another tool.
- **Storybook**: too much ceremony for our scale.
- **Per-PR Vercel preview only**: no consolidated gallery surface; owner can't review the whole system in one place.

### D8. Phased migration: shell + tokens first, then features in order

**Choice:** Six commits land in this sequence (each a reviewable PR-sized chunk):
1. **Tokens + Tailwind config + primitive base classes** — no UI consumer changes; just adds the new files. Existing pages continue to work because `Button`/`Input` keep their old API.
2. **`design-system` primitives + `/preview/design-system`** — new primitives in place; preview gallery live; old screens unchanged.
3. **`page-ux` templates + `/preview/pages`** — page templates land with stub-data previews; old screens still unchanged.
4. **`AppShell` reskin** — header flips white; sidebar restyled. This change is visible product-wide on the next deploy. Reversible by reverting one commit.
5. **Feature migration: Login + Dashboard + Employees** — these three migrate together since they share the most chrome.
6. **Feature migration: Attendance + Advances + Payroll** — the operational screens migrate; old per-screen styling files deleted.

Each commit must build, type-check, and run `pnpm --filter @myfactorydesk/web build` cleanly.

**Why:** Reversibility per layer. If commit 4 (shell reskin) has a problem on iOS Safari, we revert just it without losing the primitives or preview routes. Reviewers see a small, well-scoped PR each time.

**Alternatives considered:**
- **One big-bang PR**: unreviewable, hard to revert partial.
- **Long-lived feature branch with all of it**: drifts from `main` while module 2 wants to merge.
- **Feature flag gate**: too much ceremony for a static UI change with no behaviour fork.

### D9. Loading / empty / error are the same three components, used everywhere

**Choice:** `<LoadingState />`, `<EmptyState />`, `<ErrorState />` from `design-system` are the only way pages render those states. They accept variant props (`fullPage` | `inline`, `withRetry`, `icon`) but never re-style.

**Why:** Today each list duplicates a block of `Skeleton` rows or hand-rolls an error message. Centralising these is a one-day win that pays back forever.

**Alternatives considered:**
- **Per-feature skeletons** (today): drift, inconsistency.
- **Suspense boundaries with a global fallback**: TanStack Query usage in this codebase reads from `query.isLoading`, not Suspense; rewriting that is a separate change.

### D10. PWA `theme_color` flips with the shell reskin

**Choice:** `apps/web/public/manifest.webmanifest` `theme_color: "#1f2937"` becomes `"#ffffff"` in the same commit that flips the header background. iOS Safari and Android Chrome both pick up the change on next install/refresh.

**Why:** A white in-app header with a slate-grey OS status bar above it would look broken — they must move together. Same commit, easy revert.

**Alternatives considered:**
- **Defer manifest change**: leaves a visible mismatch on installed PWAs.

### D11. Page-by-page UX intent

The spec under `specs/page-ux/spec.md` carries the full per-page requirements (testable scenarios). The summary intent for each page below is the design vocabulary they share:

- **Login**: full-bleed centred card, rounded `2xl`, brand wordmark above the form, `Input` primitives, `Button` size `tap` for submit, link "Forgot?" muted below, no shell.
- **Dashboard**: `PageHeader` with greeting, KPI strip of four `StatTile`s (employees count, today's attendance %, pending advances ₹, latest payroll status), section divider, then the existing tile grid upgraded to `StatTile`s for module entries.
- **EmployeesList**: `ListPage` template; `Toolbar` with search input + active-only toggle + density toggle; mobile card-rows with avatar circle (initials), name, code, designation, salary; desktop `Table` with sortable columns; pagination meta in the page footer slot.
- **NewEmployee / EmployeeDetail**: `FormPage` with sections (Identity, Employment, Salary, Bank, Statutory IDs); sticky save bar; detail view shows a header `Toolbar` with Edit / Mark inactive actions gated by role.
- **AttendanceDailyMark**: `PageHeader` with date chip + "← / →" prev/next day arrows; `Toolbar` (top) with "Mark all P", filter by department (deferred but slot reserved); employee rows render in a tightened density; sticky bottom `Toolbar` with marked count + Save.
- **AttendanceCalendar**: `DetailPage` with employee header; calendar grid uses status-coloured dots (4-dot legend at top), not full-cell fills, for legibility; tap a day → bottom sheet with that day's mark.
- **AttendanceSummary**: `ListPage` with month picker in `Toolbar`; mobile = stacked rows per employee with per-status counts; desktop = `Table` with sortable columns.
- **AdvancesList**: `ListPage`; row shows employee, amount, scheduled month/year `Badge`, status `Badge`; mobile cards / desktop table.
- **NewAdvance / EditAdvance**: `FormPage`; employee picker (combobox over the existing Input), amount, scheduled month/year, optional notes; sticky save bar.
- **PayrollList**: `ListPage` with "+ New run" in the header primary slot; rows render month/year, status `Badge`, total amount when finalized; tap → run detail.
- **NewPayrollRun**: `WizardPage` with three steps — (1) Choose month/year (validation: no duplicate run), (2) Preview (calculator output per employee in a table; total card), (3) Finalize (confirmation; only OWNER can submit).
- **PayrollRunDetail**: `DetailPage`; header has run period + status `Badge` + total payout `StatTile`; payslip rows in a `Table`; sticky bottom `Toolbar` for Finalize / Mark paid (gated by status + role).
- **PayslipDetail**: print-ready layout that mirrors the PDF; `PageHeader` with Download / Share actions; salary breakdown in two-column section pairs (Earnings | Deductions); footer line "Net pay" in display-large type.

## Risks / Trade-offs

- **[Risk] Visual regression on a real iOS PWA install** → header status-bar mismatch, drawer focus escape, sticky-footer keyboard cover. **Mitigation**: preview routes get walked on a real installed PWA on the owner's phone before commit-4 (shell reskin) ships. Manual screenshot pass on every page at 360 × 800 before the rollout commits.
- **[Risk] Bundle size overrun** → hand-rolled `Table`, `Tabs`, `Combobox`, `Toast` could each grow. **Mitigation**: build-size diff posted in commit 2 PR; budget hard-cap +30 KB gzipped. Drop `Tabs`/`Combobox` from v1 if they push us over (they're not blocking).
- **[Risk] Token drift returns** — the next contributor adds `bg-blue-500` instead of importing the accent. **Mitigation**: a Tailwind ESLint rule (deferred, not blocking this change) plus a code-review heuristic; document the pattern in the design-system preview gallery so it's discoverable.
- **[Risk] Owner sees the white theme and asks for a bolder brand colour** → we'd need to flip the accent. **Mitigation**: D3 (single token file) makes the accent swap a one-liner across the app — no per-page reskin needed.
- **[Risk] `Table` accessibility on mobile screen readers when wrapped with `display: none` for `< md`** → SR users get one tree, sighted users get the other. **Mitigation**: render only one tree per breakpoint via JS `useMediaQuery` (Tailwind `md:hidden` / `md:block` is fine for visual but both DOM trees ship — accept the small DOM cost; ARIA labels on each).
- **[Risk] Migration commits land out of order** because reviewers approve them out of sequence. **Mitigation**: each commit's PR description states its hard prerequisite (commit N requires commit N-1 merged); CI fails on missing tokens / primitives so an out-of-order merge breaks build loudly.
- **[Risk] Module-2 (Sales/GST) work starts before this finishes** and re-introduces ad-hoc styling. **Mitigation**: this change must complete before module 2 begins; CLAUDE.md scope rule "Build module 1 completely before starting module 2" already enforces this.

## Migration Plan

This is greenfield UI on top of existing screens — no data migration, no backend touched, no schema change.

**Commit 1 — Tokens + Tailwind config**
1. Add `apps/web/src/lib/tokens.ts` exporting `color`, `space`, `radius`, `shadow`, `motion` constants.
2. Extend `apps/web/tailwind.config.js` `theme.extend` from those constants (palette additions: `accent` → `indigo-600` family; semantic `success`/`warning`/`danger`/`info` aliases).
3. Add `cn()` helpers if missing (already exists at `lib/cn.ts`).
4. **No consumer changes**; existing screens build identically.

**Commit 2 — `design-system` primitives + `/preview/design-system` route**
1. Upgrade `Button`, `Input`, `Skeleton`, `EmptyState`, `ErrorState` in place to use new tokens.
2. Add new primitives: `Card`, `Badge`, `Table`, `Toolbar`, `Select`, `Textarea`, `Tabs`, `StatTile`, `Toast`, `LoadingState`.
3. Add `/preview/design-system` route rendering the gallery.
4. Existing screens still work because primitive APIs stay backwards-compatible.

**Commit 3 — `page-ux` templates + `/preview/pages` route**
1. Add `PageHeader`, `Section` to `components/page/`.
2. Add `ListPage`, `DetailPage`, `FormPage`, `WizardPage` to `components/page/`.
3. Add `/preview/pages` route stacking every redesigned page with stub data.
4. Owner reviews `/preview/design-system` and `/preview/pages` on a real phone.

**Commit 4 — `AppShell` reskin + manifest `theme_color` flip**
1. `AppHeader`: white background, hairline bottom border (`border-b border-slate-200`), heading uses `text-slate-900`, hamburger button uses `text-slate-700` with `hover:bg-slate-100`.
2. `AppSidebar`: nav active state changes to `bg-indigo-50 text-indigo-700` with a 3px `border-l-2 border-indigo-600` accent; hover state uses `bg-slate-50`.
3. `AppFooter`: refined typography per tokens.
4. `apps/web/public/manifest.webmanifest`: `theme_color` → `#ffffff`.
5. Visual smoke test on every existing screen at 360 × 800 (no other changes; just confirm chrome flip didn't break content).

**Commit 5 — Feature migration: Login, Dashboard, Employees**
1. `Login`: rebuild on the design-system `Input`/`Button`; layout per design-system pattern (no shell, centred card).
2. `Dashboard`: migrate to `PageHeader` + KPI `StatTile` strip + tile grid using `StatTile`.
3. `EmployeesList`: migrate to `ListPage` with mobile card-rows + desktop `Table`.
4. `NewEmployee`, `EmployeeDetail`: migrate to `FormPage` / `DetailPage`.
5. Visual smoke test on each at 360 × 800 and ≥ 1024 px.

**Commit 6 — Feature migration: Attendance, Advances, Payroll, Payslip**
1. `AttendanceDailyMark`: migrate header + sticky-footer to `Toolbar`; tighten row density.
2. `AttendanceCalendar`, `AttendanceSummary`: migrate to `DetailPage` / `ListPage`.
3. `AdvancesList`, `NewAdvance`, `EditAdvance`: migrate to `ListPage` / `FormPage`.
4. `PayrollList`, `NewPayrollRun`, `PayrollRunDetail`, `PayslipDetail`: migrate to `ListPage` / `WizardPage` / `DetailPage`.
5. Delete any dead per-feature styling helpers; grep proves no `bg-slate-50` literal in feature folders (only token references).
6. Visual smoke test on every screen at 360 × 800 and ≥ 1024 px.
7. Bundle size diff vs commit 1 baseline; must be ≤ +30 KB gzipped.

**Rollback strategy:**
- Per-commit revert. Each commit is independently revertable; the only ordering constraint is commits 1 → 2 → 3 (additive, no consumer impact) before 4 → 5 → 6 (consumer impact).
- If commit 4 (shell reskin) regresses on iOS PWA, revert just commit 4; primitives and templates stay; preview routes still work.
- If a feature-migration commit (5 or 6) breaks a screen in production, revert just that commit; the new chrome (4) stays — old feature code will still render against the new chrome since `AppShell` is backwards-compatible.

## Open Questions

- **Accent colour finalisation** — design.md picks `indigo-600` as the safest enterprise default. Confirm with owner during `/preview/design-system` walkthrough; the swap is a one-liner.
- **Density toggle on `EmployeesList`** — included as an optional control. Confirm whether owner wants this exposed to users or whether one density (compact on desktop, comfortable on mobile) is enough.
- **Tabs primitive ship-or-defer** — only `EmployeeDetail` needs Tabs in v1 (Employment / Salary / Bank). Confirm whether tabs vs. accordion is preferred on mobile during the page preview review.
- **Toast notifications** — bundle has space; confirm whether mutation success/error inline messages are enough or if a Toast portal is wanted (advances form save, attendance bulk save).
- **PWA install prompt** — out of scope; tracked separately. Note here only because the white `theme_color` will subtly change the install banner appearance on Android.
