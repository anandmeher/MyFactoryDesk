## ADDED Requirements

### Requirement: Single source of design tokens

The web app SHALL define design tokens in exactly one TypeScript module, `apps/web/src/lib/tokens.ts`, exporting `color`, `space`, `radius`, `shadow`, and `motion` constants. `apps/web/tailwind.config.js` SHALL extend its `theme` from those constants so a token edit propagates to both runtime code and Tailwind-generated utilities. No other file in `apps/web/src/**` SHALL define hex colour literals, raw shadow strings, or raw spacing numbers for visual styling — they MUST reference tokens (directly via import or via Tailwind utilities derived from tokens).

#### Scenario: Token file is the only source of palette literals

- **WHEN** `grep -RE "#[0-9a-fA-F]{6}" apps/web/src apps/web/tailwind.config.js` is run after migration completes
- **THEN** the only matches are inside `apps/web/src/lib/tokens.ts` and `apps/web/tailwind.config.js`
- **AND** every feature file under `apps/web/src/features/**` and every primitive under `apps/web/src/components/ui/**` references colours via Tailwind utility classes (which themselves derive from tokens) or via imports from `tokens.ts`

#### Scenario: Tailwind config inherits from tokens

- **WHEN** a developer changes the accent value in `apps/web/src/lib/tokens.ts` and runs `pnpm --filter @myfactorydesk/web build`
- **THEN** the generated CSS reflects the new accent on every utility class derived from it (`bg-accent-600`, `text-accent-700`, `ring-accent-500`)
- **AND** no second edit is needed in `tailwind.config.js`

### Requirement: White-canvas palette

The app surface SHALL be `bg-white`. `bg-slate-50` SHALL be reserved for: (a) the page-body backdrop on screens that need to visually frame white cards, (b) disabled input backgrounds, (c) table zebra rows on viewports `≥ md`. Heading text SHALL use `text-slate-900`. Body text SHALL use `text-slate-700`. Muted/secondary text SHALL use `text-slate-500`. Captions SHALL use `text-slate-400`. Hairline borders SHALL use `border-slate-200`.

#### Scenario: App surface defaults to white

- **WHEN** any authenticated screen renders inside `AppShell`
- **THEN** the outermost shell container's background is `bg-white`
- **AND** the only `bg-slate-50` usage in the rendered DOM is on disabled inputs, table zebra rows, or explicit "framed" page bodies that the page template opts into

### Requirement: Single accent colour for primary intent

The design system SHALL use exactly one accent colour family for primary actions, active navigation state, focus rings, link colour, progress indicators, and selected states. The default accent is the indigo family (`indigo-600` for solid backgrounds, `indigo-700` for text on white, `indigo-500` for focus rings, `indigo-50` for tinted backgrounds). Status colours SHALL use Tailwind defaults: `emerald` (success / PAID), `amber` (warning / DRAFT), `red` (danger / error), `sky` (info / FINALIZED). The legacy brand colour `#1f2937` SHALL NOT be used as a background; it survives only as a synonym of `text-slate-900` for heading text.

#### Scenario: Primary button uses the accent

- **WHEN** a `Button` is rendered with `variant="primary"`
- **THEN** its background is `bg-accent-600` (indigo-600)
- **AND** its hover state is `bg-accent-700`
- **AND** its focus ring is `ring-accent-500`

#### Scenario: Status badges use the semantic palette

- **WHEN** a payroll run with status `DRAFT` is rendered inside a `Badge`
- **THEN** the badge uses `bg-amber-50 text-amber-700 ring-1 ring-amber-200`
- **WHEN** the same run becomes `FINALIZED`
- **THEN** the badge uses `bg-sky-50 text-sky-700 ring-1 ring-sky-200`
- **WHEN** the run becomes `PAID`
- **THEN** the badge uses `bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200`

#### Scenario: Brand grey does not appear as a background

- **WHEN** `grep -RE "bg-(brand|slate-(800|900))" apps/web/src` is run after migration completes
- **THEN** there are no matches outside `tokens.ts` / `tailwind.config.js`

### Requirement: Component primitives are the only authoring surface for UI

Every authenticated screen SHALL render its UI through the design-system primitives located in `apps/web/src/components/ui/`. The full primitive set v1 SHALL include: `Button`, `Input`, `Select`, `Textarea`, `Card`, `Badge`, `Table`, `Toolbar`, `Tabs`, `StatTile`, `Toast`, `Skeleton`, `LoadingState`, `EmptyState`, `ErrorState`. Feature folders (`apps/web/src/features/**`) SHALL NOT define their own variant of any of these — they MUST import the primitive.

#### Scenario: Button has the documented variants and sizes

- **WHEN** the design-system gallery is reviewed
- **THEN** `Button` exposes variants `primary`, `secondary`, `ghost`, `danger`, `link`
- **AND** `Button` exposes sizes `sm`, `md`, `tap`
- **AND** every variant × size combination renders without layout breakage at 360px width
- **AND** every variant has a visible disabled state, hover state, and focus-visible state

#### Scenario: Feature folders do not redefine primitives

- **WHEN** `grep -RE "(button|input|select|textarea|table|tabs)\b.*className" apps/web/src/features` is reviewed after migration completes
- **THEN** matches occur only inside JSX that imports a primitive from `@/components/ui/*` (raw `<button>`, `<input>`, `<table>`, `<select>`, `<textarea>` HTML tags do not appear in feature folders)

### Requirement: Focus-visible ring on every interactive element

Every interactive element rendered through the design system (buttons, links, inputs, selects, textareas, tab triggers, table row buttons, toolbar buttons) SHALL render a `ring-2 ring-accent-500 ring-offset-2` outline when focused via keyboard. The ring SHALL NOT appear on mouse focus (`focus-visible` only). The ring SHALL be visible against both white and `slate-50` backgrounds.

#### Scenario: Tab key reveals focus rings

- **WHEN** a user navigates the EmployeesList page using only the keyboard (Tab key)
- **THEN** every focused element shows the 2px accent ring
- **AND** clicking the same element with the mouse does not produce the ring

### Requirement: Tap-target floor on mobile is preserved

Every interactive element rendered through the design system on viewports `< md` (768px) SHALL have a minimum height of 56px (the `min-h-tap` Tailwind utility). On viewports `≥ md`, dense controls (toolbar buttons, table row clickables, secondary `Button size="sm"`) MAY shrink to 32–40px. The primitive itself MUST enforce the floor on mobile — feature code does not need to add `min-h-tap` manually.

#### Scenario: Buttons meet tap-target on mobile

- **WHEN** any `Button` with `size="tap"` renders on a 360 × 800 viewport
- **THEN** its rendered height is at least 56px

#### Scenario: Toolbar buttons meet tap-target on mobile

- **WHEN** the bottom save bar (`Toolbar variant="bottom"`) renders on a 360 × 800 viewport
- **THEN** every button inside it is at least 56px tall

### Requirement: WCAG AA contrast across the palette

Every text + background combination in the design system SHALL meet WCAG AA contrast (4.5:1 for body text, 3:1 for ≥ 18pt or bold ≥ 14pt). This applies to: heading on white, body on white, muted on white, link on white, button text on its background, badge text on its background, sidebar nav text on its background (default and active), header text on white.

#### Scenario: Primary button label contrast

- **WHEN** the primary button (`bg-accent-600 text-white`) is measured for contrast
- **THEN** the contrast ratio is ≥ 4.5:1

#### Scenario: Muted secondary text contrast

- **WHEN** muted text (`text-slate-500`) on a white card (`bg-white`) is measured
- **THEN** the contrast ratio is ≥ 4.5:1

#### Scenario: Sidebar active-state contrast

- **WHEN** the active nav item (`bg-indigo-50 text-indigo-700`) is measured
- **THEN** the contrast ratio is ≥ 4.5:1

### Requirement: Loading, empty, and error states are unified primitives

Every screen SHALL render loading states via `<LoadingState />`, empty states via `<EmptyState />`, and error states via `<ErrorState />`. These primitives accept variant props (`fullPage` | `inline`, optional `withRetry`, optional `icon`, optional `action` slot). No screen SHALL render a hand-rolled `<Skeleton />` block, raw inline error message, or ad-hoc empty placeholder for a list/detail data state.

#### Scenario: List loading uses the shared skeleton state

- **WHEN** `EmployeesList` is fetching its first page
- **THEN** the page renders `<LoadingState variant="list" />` (an internal arrangement of `<Skeleton />` rows)
- **AND** the skeleton row count and dimensions match the gallery sample at `/preview/design-system`

#### Scenario: List error state shows retry

- **WHEN** the employees list query fails
- **THEN** the page renders `<ErrorState message="..." withRetry onRetry={refetch} />`
- **AND** the retry button is the design-system `Button variant="secondary"`

#### Scenario: List empty state shows action

- **WHEN** the employees list returns zero rows and the user role can create
- **THEN** the page renders `<EmptyState title="..." action={<Button>+ Add Employee</Button>} />`

### Requirement: Reskinned `AppShell` chrome conforms to the white theme

When `AppShell` (defined by the `app-shell` capability) renders, its chrome SHALL conform to the following design-system contract: the header background is `bg-white` with a `border-b border-slate-200` hairline, the brand mark uses `text-slate-900 font-semibold tracking-tight`, the page-title slot uses `text-slate-500`, the hamburger button uses `text-slate-700 hover:bg-slate-100`, the sidebar background is `bg-white` with a `border-r border-slate-200` hairline on `≥ md`, the active sidebar item uses `bg-indigo-50 text-indigo-700` with a `border-l-2 border-indigo-600` accent bar, hover sidebar items use `bg-slate-50`, and the footer text uses `text-slate-500`. The `theme_color` declared in `apps/web/public/manifest.webmanifest` SHALL be `#ffffff`.

#### Scenario: Header background is white with hairline border

- **WHEN** the app loads any authenticated screen
- **THEN** `AppHeader`'s root element computed style has background `rgb(255, 255, 255)` and a 1px bottom border in `slate-200`
- **AND** no element inside `AppHeader` uses `bg-brand` or any slate-800/900 background utility

#### Scenario: Active nav item uses indigo accent

- **WHEN** the user is on `/employees` (or any `/employees/*` nested route)
- **THEN** the "Employees" sidebar item renders with `bg-indigo-50` background, `text-indigo-700` text, and a 2px `border-l` `indigo-600` accent bar on its left edge

#### Scenario: PWA manifest theme_color is white

- **WHEN** `apps/web/public/manifest.webmanifest` is parsed
- **THEN** `theme_color` is `"#ffffff"`

### Requirement: Design-system preview route is the living gallery

A hidden route at `/preview/design-system` SHALL render every primitive at every documented variant + size + state, the colour ramp, the type scale, the spacing scale, and the shadow ramp. The route SHALL be wrapped in `RequireAuth` (so the authenticated context applies), SHALL NOT appear in `AppSidebar`'s `NAV` list, and SHALL survive into production builds as a developer/owner reference.

#### Scenario: Gallery renders every Button variant × size

- **WHEN** `/preview/design-system` is opened
- **THEN** the page renders every `Button` variant (`primary`, `secondary`, `ghost`, `danger`, `link`) at every size (`sm`, `md`, `tap`) in default, hover, focus, and disabled states

#### Scenario: Gallery renders the colour ramp

- **WHEN** `/preview/design-system` is opened
- **THEN** the page renders swatches for: white, the slate ramp (50, 100, 200, 300, 500, 700, 900), the accent ramp (50, 100, 500, 600, 700), and the four semantic ramps (emerald, amber, red, sky) at 50/600/700

#### Scenario: Gallery is reachable only when authenticated

- **WHEN** an unauthenticated visitor navigates to `/preview/design-system`
- **THEN** the app redirects to `/login` (carrying `from` state)

### Requirement: Bundle-size budget for the design system

The net gzipped JavaScript bundle increase introduced by the design-system primitives + page templates + preview routes SHALL be ≤ 30 KB measured against the pre-change `pnpm --filter @myfactorydesk/web build` baseline. No new runtime npm dependency SHALL be added to `apps/web/package.json` to achieve the design system (Tailwind, `lucide-react`, `clsx`, `tailwind-merge` are the permitted UI dependencies).

#### Scenario: Build size diff stays within budget

- **WHEN** the migration is complete and `pnpm --filter @myfactorydesk/web build` is run
- **THEN** the gzipped bundle size of the main entry chunk grows by no more than 30 KB compared to the baseline captured at the start of this change

#### Scenario: No new UI runtime dependency

- **WHEN** the diff of `apps/web/package.json` is reviewed against `main`
- **THEN** the `dependencies` block has no additions in the categories of UI libraries, headless component libraries, animation libraries, icon libraries beyond `lucide-react`, or styling helpers beyond `clsx`/`tailwind-merge`
