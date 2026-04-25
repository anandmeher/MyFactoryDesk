## Context

The web app already renders Login, Dashboard, and Employees (List/New/Detail) on top of an ad-hoc `AppLayout` (sticky brand bar + back arrow + content). It's functional but visually thin and per-page — every new route would copy the same boilerplate. We're about to add Attendance, Advances, Payroll, and Payslips screens (Groups 9–15 of `v1-staff-payroll`); doing the chrome refactor now is much cheaper than later.

The owner has explicitly asked to **see a mockup before confirming**. So the design ships in two phases: a hidden preview route the owner taps through on a phone, then a rollout once approved. This phasing is what shapes most of the decisions below.

**Constraints inherited from `mobile-web-pwa` and `CLAUDE.md`:**
- 360 × 800 phone viewport floor; no horizontal scroll.
- ≥ 56 px tap targets on interactive elements (nav rows, header buttons).
- Brand colour `#1f2937` (theme_color in PWA manifest); slate canvas.
- One codebase, no extra runtime deps. `lucide-react` already installed.
- All server state via TanStack Query; no extra state libs.
- No localisation (English only) and no RTL.

**Stakeholders:** the owner (final approver of look + nav), staff/manager/accountant (daily users on phones), and the developer (me) who will keep adding screens.

## Goals / Non-Goals

**Goals:**
- One `AppShell` everyone wraps in, replacing per-screen `AppLayout`.
- Slide-out drawer on phones, fixed rail on ≥ md — same component, responsive layout, no per-breakpoint duplication.
- Sticky header with brand, page title, and a user menu (role badge + logout). The previous "back arrow" affordance is preserved via an optional `back` prop.
- Footer with build version + support contact (always visible, low-attention) plus a dev-only OpenSpec progress link.
- A hidden `/preview/shell` route demoing the chrome over a stub dashboard so the owner can sign off **before** the rollout.
- Active route highlight, full-keyboard accessibility (Tab + Enter on nav), `Esc` to close drawer.
- ZERO regression in existing routes during Phase 1 (preview only).

**Non-Goals:**
- Brand identity overhaul (logo, palette, typography family). Same brand `#1f2937`, same slate canvas, same system font stack.
- Dark mode — punted; the canvas is already light.
- Internationalisation / RTL — out of v1.
- A right-rail or content-aware secondary navigation. The shell is left-only.
- Configurable layouts per role. Nav order is fixed; visibility per-role is the only variable.
- Animations beyond a simple drawer slide and active-state colour transition. No skeleton loading screens for the shell itself (it's chrome — content inside owns its own skeletons).

## Decisions

### D1. One `AppShell` component, not separate Mobile + Desktop layouts
**Choice:** Single `AppShell` with internal responsive switches via Tailwind (`md:` breakpoint). Drawer state lives in the shell as `useState` plus a context for child components that need to open/close it.
**Why:** Two layouts mean two places to fix bugs; on a 360-wide phone we'll never need the desktop variant rendered. Tailwind's `md:` (768px) gives a clean cutover. Shell state in React (not URL) keeps deep links clean.
**Alternatives:** Separate `MobileShell` / `DesktopShell` (rejected: duplication). URL-driven open state like `?menu=open` (rejected: pollutes URL, confuses back button).

### D2. Slide-out drawer on mobile uses a backdrop, no portal
**Choice:** Drawer renders inline as a fixed-position element with translate-x animation. Backdrop is a sibling element with `bg-black/40 backdrop-blur-sm`, click-to-close.
**Why:** No portal means no React tree contortions; the focus-trap can be handled with a small `useEffect` hook listening for `Esc` and tracking focus. With no third-party libs, the bundle stays at ~400 KB.
**Alternatives:** Headless UI `Dialog` (extra dep), DaisyUI drawer (extra dep), CSS `:has()` selector (Safari support edge cases on iOS < 17).

### D3. Mock-before-confirm via a hidden `/preview/shell` route
**Choice:** Add a route at `/preview/shell` that renders `AppShell` over a stub dashboard. The route is **not in the user-facing nav menu**; it is reachable only by typing the URL. It is wrapped in `RequireAuth` so non-logged-in users still bounce to login (we want to test the shell while authenticated). The route stays in the codebase even after rollout, as a living style guide for shell variants.
**Why:** The owner asked to "show mock before confirming". A code-level mock (rather than Figma) means we get pixel-accurate device behaviour: real fonts, real touch handling, real PWA install. Keeping it after rollout costs nothing and pays back when adding new shell variants.
**Alternatives:** Figma mock (rejected: doesn't show real touch behaviour, asks the owner to install another tool). Storybook (overkill for V1; later if we have ≥ 10 components). A short-lived branch that gets force-deleted (rejected: signal lost).

### D4. Nav menu data-driven from a single `routes` constant
**Choice:** `apps/web/src/components/shell/nav.ts` exports a `NAV` array `{ to, label, icon, soon? }`. Sidebar maps over it; soon-flagged items render disabled with a "soon" badge instead of a link.
**Why:** The order matters and is small (≤ 8 entries for v1). A single source of truth means the dashboard tile grid (already in `Dashboard.tsx`) can also be derived from `NAV`, keeping them in sync.
**Alternatives:** Inline JSX in the sidebar (rejected: duplicates with Dashboard tiles). React Router's `routes` data API (overkill, also we'd lose the icon/label association).

### D5. `back` is page-level, the shell stays unchanged
**Choice:** `AppShell` does NOT render a back button. Pages that need a back action render their own — typically as a header inside their content (e.g., `EmployeeDetail` keeps "← Employees" inline above its read view). The shell's header always shows the brand + a hamburger to open the menu.
**Why:** Mixing brand-level chrome with page-level navigation creates an ambiguous header (do I tap to go back, or does the menu open?). Keeping the shell brand-only and pages back-aware is the cleanest mobile pattern (Material Design and iOS HIG both follow this).
**Alternatives:** Auto-derive back from history (rejected: native back button already does that; redundancy confuses users). Slot in the header for back (rejected: unclear precedence with hamburger).

### D6. Footer is informational only, not a navigation surface
**Choice:** Two-line footer: line 1 = "MyFactoryDesk · v0.0.0" (build version from `import.meta.env.VITE_APP_VERSION` with a fallback), line 2 = "Support: +91 9999999999" (configurable via env). On mobile it sticks to the bottom of the page only when the content is shorter than the viewport (no `position: fixed` — keeps the keyboard from covering it on input focus).
**Why:** Footers as nav don't carry their weight on small screens; the sidebar already covers nav. A version + support number gives users something to reference without competing with the primary content.
**Alternatives:** Fixed-bottom footer (rejected: covers content under iOS soft keyboard). Hidden footer (rejected: loses the "what version am I on?" affordance during real-user reports).

### D7. Visual reskin: tighter scale, softer surface, sharper focus rings
**Choice:**
- Surface: slate-50 canvas (already used), white cards with `shadow-sm` + `ring-1 ring-slate-200/60` for definition.
- Type scale: `text-base` (16px) body, `text-sm` (14px) secondary, `text-lg` (18px) page title in header, `text-xs` (12px) labels and captions. Line-height `leading-relaxed` on body content.
- Spacing: `gap-3` (12px) between siblings, `p-4` (16px) inside cards, `space-y-4` between sections.
- Brand: `#1f2937` reserved for the active sidebar item, primary buttons (already), and the header background. Hover/active states use `bg-slate-100` with a 1px ring.
- Focus: every interactive element gets `focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2`.
- Icons: `lucide-react` at 20px in nav, 16px inline.
**Why:** Builds on what's already there (slate canvas, brand `#1f2937`) without introducing new tokens. The `ring` instead of `border` on cards is the single shadcn-influenced touch that gives "slick" without new deps.
**Alternatives:** Heavy shadows (rejected: feels dated on phones). Glassmorphism (rejected: hits iOS Safari perf and is busy at 360px).

### D8. Phase 1 ships behind `/preview/shell` only; rollout is a single later commit
**Choice:** Phase 1 (this change) lands the shell, the preview route, and the nav config — but every existing screen continues to use `AppLayout`. Phase 2 (a follow-up commit, gated on owner sign-off) replaces `AppLayout` usage in Login, Dashboard, EmployeesList, NewEmployee, EmployeeDetail with `AppShell`.
**Why:** Maximises reversibility. If the owner doesn't like the mock, the shell never reaches end users and only the preview route needs reverting. Maximises reviewability — the rollout PR is a mechanical find-replace and easy to scan.
**Alternatives:** Feature flag (rejected: too much ceremony for a static UI change). Big-bang rollout (rejected: contradicts "show mock before confirming").

## Risks / Trade-offs

- **Drawer focus-trap edge cases on iOS PWA standalone mode** → If a screen reader or keyboard navigates outside the drawer while open, focus could escape. Mitigation: add a small `useFocusTrap` hook that pushes focus back to the first nav item; verify on iOS Safari standalone before rollout.
- **Owner taps "Looks great"; later finds a screen breaks at 360 wide** → Phase 1 only verifies the **shell**; we don't replay all existing flows inside it. Mitigation: include a second preview route `/preview/shell-with-list` that mounts the real EmployeesList inside the shell, so the owner sees a representative content surface, not just a stub.
- **Sidebar items grow past viewport** → V1 has ≤ 6 entries, so a 56-px-per-row drawer fits 360 × 800. Mitigation: make the drawer scroll vertically internally; add an explicit overflow rule.
- **Bundle size creeps if we accidentally pull in extra icons** → `lucide-react` tree-shakes per import. Mitigation: import only the icons used (`Home`, `Users`, `CalendarDays`, `Wallet`, `Receipt`, `Menu`, `X`, `LogOut`); CI bundle-size diff in a follow-up.
- **`back` prop disappearing confuses users on Detail screens** → Mitigation: every detail page must render its own back affordance (lint rule deferred; visual review during preview).

## Migration Plan

This change is greenfield UI — no data to migrate, no backend touched.

**Phase 1 (this change):**
1. Land `AppShell`, `AppHeader`, `AppSidebar`, `AppFooter` under `src/components/shell/`.
2. Land the `/preview/shell` route (and the variant `/preview/shell-with-list`).
3. Owner walks the preview on a phone connected to staging or local.
4. Either: owner approves → Phase 2 lands; or owner asks for revisions → re-iterate within Phase 1 without touching live screens.

**Phase 2 (follow-up commit, gated on sign-off):**
1. Replace `AppLayout` usage in: `EmployeesList`, `NewEmployee`, `EmployeeDetail`, `Dashboard`. Login keeps its full-bleed centred layout (no shell).
2. Delete `AppLayout` once no callers remain.
3. Visual smoke test on 360 × 800 (every screen).

**Rollback:**
- Phase 1: revert the change commit; the preview route disappears; existing screens are untouched.
- Phase 2: revert the rollout commit; screens flip back to `AppLayout`. Shell stays under the preview route until a fresh attempt.

## Open Questions

- **Should the user menu in the header expose a "Switch user" affordance** (sign out + redirect to login)? Default in this design is a simple "Logout" item; no switch-user concept in v1.
- **Footer support number** — currently the seeded owner phone. Confirm with owner before staging deploy.
- **Active-route highlight on nested routes** (`/employees/new`, `/employees/:id`): use `useMatch('/employees/*')`. Confirm this matches the owner's expectation when reviewing the preview.
- **Should `/preview/shell` survive into production?** Default: yes, behind auth, useful as a living style guide. Confirm during sign-off.
