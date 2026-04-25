## ADDED Requirements

### Requirement: Installable PWA shell
`apps/web` SHALL be a Vite + React + TypeScript application configured as a PWA via `vite-plugin-pwa`. The manifest SHALL declare `name: "MyFactoryDesk"`, `short_name: "MyFactoryDesk"`, `theme_color: "#1f2937"`, `background_color: "#ffffff"`, `display: "standalone"`, and a placeholder icon set. A service worker SHALL be registered to enable installability and shell caching.

#### Scenario: Lighthouse PWA criteria pass
- **WHEN** Lighthouse audits the deployed staging URL
- **THEN** the manifest is detected and the app is marked as installable
- **AND** the service worker registers and caches the shell

### Requirement: Mobile-first viewport
Every screen SHALL render correctly on a 360 × 800 viewport without horizontal scrolling. Tap targets (buttons, list rows in attendance) SHALL be at least 56 px tall.

#### Scenario: Daily attendance row meets tap-target size
- **WHEN** the daily attendance screen renders on a 360-wide viewport
- **THEN** each employee row is at least 56 px tall

### Requirement: Authenticated routing with token refresh
The web app SHALL store `accessToken` and `refreshToken` in `localStorage`. An Axios interceptor SHALL attach `Authorization: Bearer <accessToken>` to every API call. On a `401` response, the interceptor SHALL attempt one `POST /auth/refresh` call; on success it SHALL retry the original request once; on failure it SHALL clear tokens and redirect to `/login`.

#### Scenario: Expired access token transparently refreshes
- **WHEN** the API returns `401 TOKEN_EXPIRED` for an authenticated request
- **THEN** the client calls `/auth/refresh`, stores the new tokens, and retries the original request once
- **AND** the user does not see an error if the refresh succeeds

#### Scenario: Failed refresh redirects to login
- **WHEN** `/auth/refresh` returns `401`
- **THEN** the client clears tokens from `localStorage` and navigates to `/login`

### Requirement: Login route
The web SHALL provide `/login` with a phone-number input and a password input. On submit it SHALL call `POST /api/v1/auth/login`, store both tokens, and navigate to `/dashboard`. On error it SHALL render an inline error using the API's `error.message`.

#### Scenario: Successful login navigates to dashboard
- **WHEN** a user enters valid credentials
- **THEN** tokens are stored and `/dashboard` renders with the user's name

### Requirement: Route guard for authenticated pages
A route guard component SHALL redirect any unauthenticated visitor of `/dashboard`, `/employees`, `/attendance`, `/advances`, `/payroll`, or `/payslips` to `/login`.

#### Scenario: Visiting a protected route without a token
- **WHEN** an unauthenticated user navigates to `/employees`
- **THEN** the app redirects to `/login`

### Requirement: Employees screens
The web SHALL provide:
- `/employees` — list with search box and active filter; cards on mobile, table on desktop.
- `/employees/new` — create form using `CreateEmployeeSchema` from `@myfactorydesk/shared`.
- `/employees/:id` — detail view with edit and soft-delete actions, role-gated to OWNER/MANAGER (delete: OWNER only).

All forms SHALL use React Hook Form with Zod resolver. Money inputs SHALL accept decimal strings and display via `Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' })`.

#### Scenario: Create employee end-to-end
- **WHEN** a `MANAGER` opens `/employees/new`, fills the form, and submits
- **THEN** the API call posts the validated body, the new record appears in the list, and the user is redirected to `/employees/:id`

### Requirement: Daily attendance marking screen
The web SHALL provide `/attendance` showing a date picker (defaults to today in IST) and one row per active employee. Each row SHALL expose four quick-action buttons — `P` (present), `HD` (half-day), `L` (leave), `A` (absent). The screen SHALL provide a "Mark all present" action and a per-row OT-hours input. A floating Save button SHALL show the count of marked employees and POST `/attendance/bulk` on tap.

#### Scenario: Bulk save sends one request
- **WHEN** a user marks 30 employees and taps Save
- **THEN** exactly one `POST /attendance/bulk` request is made
- **AND** on success a toast confirms and the screen shows the saved state

### Requirement: Attendance calendar and summary screens
The web SHALL provide:
- `/attendance/calendar/:employeeId` — monthly calendar view with status colours per day.
- `/attendance/summary` — current-month aggregated counts; stacked cards on mobile.

#### Scenario: Calendar reflects most recent marks
- **WHEN** a user navigates from `/attendance` (after saving) to the calendar for an employee
- **THEN** today's status reflects what was just saved

### Requirement: Advances screen
The web SHALL provide `/advances` to list and filter advances by employee and deduction period, plus a create form gated to `OWNER` and `ACCOUNTANT`. Edit and delete are visible only when `isDeducted=false`.

#### Scenario: Locked advance hides edit button
- **WHEN** an advance has `isDeducted=true`
- **THEN** the row shows a lock icon and no edit/delete actions

### Requirement: Payroll run wizard
The web SHALL provide:
- `/payroll` — list of runs with status badges (DRAFT/FINALIZED/PAID).
- `/payroll/new` — month/year picker, creates a DRAFT run via `POST /payroll/runs`.
- `/payroll/:id` — preview table of all employees with computed payslips, plus a "Finalize" button (with confirmation dialog) for OWNER only.
- `/payslips/:id` — single payslip view with Download PDF and Share via WhatsApp actions.

#### Scenario: Finalize is OWNER-only
- **WHEN** an `ACCOUNTANT` opens `/payroll/:id` for a DRAFT run
- **THEN** the Finalize button is hidden

#### Scenario: Confirmation dialog on finalize
- **WHEN** an `OWNER` taps Finalize
- **THEN** a confirmation dialog appears warning that the action is irreversible
- **AND** finalize fires only after explicit confirmation

### Requirement: Loading, error, and empty states
Every screen that fetches data SHALL render a loading skeleton during the initial fetch, an error state with a Retry button on failure, and an empty state with a clear next-action CTA when the result set is empty.

#### Scenario: Empty employees list shows CTA
- **WHEN** `/employees` loads and the API returns an empty list
- **THEN** the screen shows a "No employees yet" message and a "+ Add Employee" button (visible only to OWNER/MANAGER)

### Requirement: Server state via TanStack Query
All server data SHALL be fetched via TanStack Query hooks living in `src/features/<domain>/hooks/`. Defaults: `staleTime: 5 * 60_000`, `retry: 1`. Mutations SHALL invalidate the relevant queries on success.

#### Scenario: Create invalidates list
- **WHEN** a new employee is created via the create form
- **THEN** the `/employees` list query is invalidated and refetched on next mount
