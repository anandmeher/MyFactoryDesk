# Claude Code — Starter Prompts

Use these prompts in order with Claude Code. Each one is scoped to fit comfortably in a single Claude Code session. Verify each step works before moving to the next.

> **Tip:** Open the project in your terminal, run `claude` (or your Claude Code launcher), and paste these prompts one at a time. After each, review the diff before accepting changes.

---

## Prompt 1 — Initialize Monorepo

```
Read CLAUDE.md to understand the project. Then set up the monorepo skeleton:

1. Create pnpm-workspace.yaml with apps/* and packages/* as workspaces.
2. Create root package.json with scripts: dev (run api + web in parallel using `pnpm -r --parallel dev`), lint, typecheck, format.
3. Create docker-compose.yml with services for postgres:16-alpine (port 5432, db `paperplates`, user `app`, password `app`) and redis:7-alpine (port 6379). Use named volumes for persistence.
4. Create .gitignore covering node_modules, .env, dist, build, .turbo, *.log, coverage.
5. Add .editorconfig and .prettierrc (2-space indent, single quotes, no semicolons in TS).
6. Create empty directories: apps/api, apps/web, packages/shared, docs.

Do NOT scaffold the apps yet. Stop after this and confirm the structure.
```

---

## Prompt 2 — Scaffold Backend (NestJS + Prisma)

```
Scaffold apps/api as a NestJS project with Prisma:

1. `cd apps/api && nest new . --package-manager pnpm --skip-git` (use the current directory).
2. Install: @nestjs/config, @nestjs/jwt, @nestjs/passport, passport, passport-jwt, bcrypt, prisma, @prisma/client, zod, nestjs-zod, decimal.js, date-fns, date-fns-tz.
3. Install dev: @types/bcrypt, @types/passport-jwt, prisma.
4. Initialize Prisma: `pnpm prisma init` — set datasource to PostgreSQL.
5. Configure NestJS to load .env via @nestjs/config in AppModule.
6. Create apps/api/.env.example with all variables documented in CLAUDE.md §Environment Variables.
7. Add a /health endpoint that returns { status: 'ok', timestamp }.
8. Add ValidationPipe globally and a global exception filter that returns errors in the format from CLAUDE.md §API Conventions.
9. Set global prefix to /api/v1.
10. Add @nestjs/swagger and expose /api/docs.

Verify: `pnpm dev` starts the API on port 3000, /health returns 200, /api/docs renders.
```

---

## Prompt 3 — Prisma Schema for V1

```
Create the V1 Prisma schema based on CLAUDE.md §Domain Model.

In apps/api/prisma/schema.prisma, define these models exactly per the spec:
- enums: Role, SalaryType, AttendanceStatus, PayrollStatus
- models: User, Employee, Attendance, Advance, PayrollRun, Payslip

Apply ALL these requirements:
- Money fields: @db.Decimal(12, 2)
- Decimal fields with smaller scale (e.g., daysPresent): @db.Decimal(5, 2)
- Date-only fields (Attendance.date, Advance.date): @db.Date
- Indexes on every foreign key and on Attendance.date
- Unique constraints: User.phone, Employee.empCode, Attendance(employeeId, date), PayrollRun(month, year), Payslip(payrollRunId, employeeId)
- Soft-delete pattern for Employee (isActive + dateOfLeaving)
- createdAt / updatedAt on User and Employee

After writing the schema:
1. Run `pnpm prisma migrate dev --name init`
2. Run `pnpm prisma generate`
3. Verify with `pnpm prisma studio` that all tables exist.
```

---

## Prompt 4 — Shared Zod Schemas

```
Set up packages/shared as a TypeScript package and create Zod schemas for v1 entities.

1. Create packages/shared/package.json (name "@paper-plates/shared", main "src/index.ts", peerDependency on zod).
2. Create packages/shared/tsconfig.json extending a base config.
3. In packages/shared/src/, create one file per domain:
   - employee.ts — CreateEmployeeSchema, UpdateEmployeeSchema, EmployeeResponseSchema
   - attendance.ts — BulkMarkAttendanceSchema, AttendanceQuerySchema, AttendanceResponseSchema
   - advance.ts — CreateAdvanceSchema, AdvanceResponseSchema
   - payroll.ts — CreatePayrollRunSchema, PayslipResponseSchema, PayrollPreviewSchema
   - auth.ts — LoginSchema, RefreshTokenSchema, AuthResponseSchema
   - common.ts — PaginationSchema, money helpers, date helpers
4. Money fields: z.string().regex(/^\d+(\.\d{1,2})?$/) with a transform to Decimal on the backend.
5. Date-only fields: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).
6. Export everything from src/index.ts.
7. Add @paper-plates/shared as a workspace dependency in apps/api and apps/web.

Verify: import a schema in apps/api/src/main.ts as a smoke test, then remove the import.
```

---

## Prompt 5 — Auth Module

```
Implement the auth module in apps/api per CLAUDE.md §Auth.

1. Create AuthModule with:
   - AuthController: POST /auth/login (phone + password), POST /auth/refresh (refresh token), POST /auth/logout
   - AuthService: validateUser (bcrypt compare), issueTokens (access 15m, refresh 7d)
   - JwtStrategy + JwtAuthGuard
   - RolesGuard + @Roles() decorator that reads roles from route metadata
   - CurrentUser() param decorator
2. Validate request bodies with the Zod schemas from @paper-plates/shared via nestjs-zod.
3. Hash passwords with bcrypt cost 12.
4. Return errors in the format: { error: { code, message } }. Use codes like INVALID_CREDENTIALS, TOKEN_EXPIRED, INVALID_TOKEN.
5. Create a seed script in apps/api/prisma/seed.ts that creates one OWNER user (phone: 9999999999, password: changeme) and 3 sample employees with linked STAFF user accounts.
6. Add `prisma.seed` config to package.json: `"prisma": { "seed": "ts-node prisma/seed.ts" }`.

Add tests in apps/api/test/auth.e2e-spec.ts covering: successful login, wrong password, locked-out user, refresh token flow.

Verify: `pnpm prisma db seed`, then `curl -X POST http://localhost:3000/api/v1/auth/login -d '{"phone":"9999999999","password":"changeme"}'` returns tokens.
```

---

## Prompt 6 — Employee CRUD

```
Implement Employee CRUD in apps/api per CLAUDE.md §V1 Scope.

Endpoints (all under /api/v1/employees, all require JWT):
- POST / — create. Roles: OWNER, MANAGER.
- GET / — list with pagination, search by name/empCode, filter by isActive. All authenticated roles.
- GET /:id — detail. All authenticated roles.
- PATCH /:id — update. Roles: OWNER, MANAGER.
- DELETE /:id — soft delete (sets isActive=false, dateOfLeaving=today). Roles: OWNER only.

Requirements:
- Validate request bodies with Zod schemas from @paper-plates/shared.
- PAN and Aadhaar must be encrypted before save (AES-GCM with key from ENCRYPTION_KEY env). Decrypt only when explicitly requested by OWNER role.
- Money fields stored as Prisma Decimal; serialize as string in responses.
- Generate empCode automatically if not provided: format `EMP{YYYY}{4-digit-sequence}`, e.g., `EMP20260001`.
- E2E tests covering each endpoint + permission checks.

Update CLAUDE.md if any conventions changed during implementation.
```

---

## Prompt 7 — Frontend Scaffold (Vite + React + PWA)

```
Scaffold apps/web as a Vite + React + TypeScript PWA.

1. `cd apps/web && pnpm create vite@latest . -- --template react-ts` (use current dir).
2. Install: react-router-dom, @tanstack/react-query, @tanstack/react-query-devtools, react-hook-form, @hookform/resolvers, zod, axios, date-fns, date-fns-tz, decimal.js, lucide-react, tailwindcss, @vitejs/plugin-pwa, vite-plugin-pwa, workbox-window, clsx, tailwind-merge.
3. Set up Tailwind CSS per official Vite guide; configure for mobile-first (default breakpoints fine).
4. Configure vite-plugin-pwa with: name "Paper Plates", short_name "PaperPlates", theme_color "#1f2937", background_color "#ffffff", display "standalone", icons (use placeholders for now, real icons later).
5. Install shadcn/ui CLI and initialize with the slate theme: `pnpm dlx shadcn@latest init`.
6. Add components: button, input, label, card, table, dialog, form, select, toast, badge, skeleton.
7. Create:
   - src/lib/api.ts — Axios instance with baseURL from VITE_API_URL, attaches access token from localStorage, handles 401 by attempting refresh once.
   - src/lib/queryClient.ts — TanStack Query client with sensible defaults (5min stale, 1 retry).
   - src/lib/auth.ts — login/logout/getCurrentUser helpers.
   - src/routes/ — route definitions.
   - src/App.tsx — wraps Routes in QueryClientProvider, BrowserRouter, Toaster.
8. Build a /login page that calls POST /auth/login, stores tokens, redirects to /dashboard.
9. Build a placeholder /dashboard with "Hello, {user.name}" and a logout button.
10. Add a route guard component that redirects to /login if no token.

Verify: `pnpm dev` from apps/web, log in with seeded user, see the dashboard.
```

---

## Prompt 8 — Employee List + Add Screens

```
Build the Employees feature on the frontend.

Routes:
- /employees — list with search box and filter (Active / Inactive / All). Mobile: cards. Desktop: table.
- /employees/new — form to create.
- /employees/:id — detail view + edit button (inline edit or /employees/:id/edit).

Requirements:
- Use TanStack Query for all server state. Hooks live in src/features/employees/hooks/.
- Forms use React Hook Form + Zod schemas from @paper-plates/shared.
- Money inputs: enter as decimal string, format with Intl.NumberFormat 'en-IN' for display.
- Show loading skeletons, error states with retry, empty states with CTAs.
- All screens must work on a 360x800 viewport (test in Chrome DevTools mobile mode).
- Optimistic updates on create/update with rollback on failure.

Test the end-to-end flow: log in → see seeded employees → add a new one → edit → soft-delete.
```

---

## Prompt 9 — Attendance Module (Backend)

```
Build the Attendance module per CLAUDE.md §V1 Scope.

Endpoints (all under /api/v1/attendance, JWT required):
- POST /bulk — body: { date: "YYYY-MM-DD", marks: [{ employeeId, status, overtimeHours?, remarks? }] }. Wraps the whole insert in prisma.$transaction. Upserts on (employeeId, date). Roles: OWNER, MANAGER.
- GET ?from=&to=&employeeId= — query attendance by range and optional employee. All roles.
- GET /summary?month=&year= — returns aggregated counts per employee for the given month: { employeeId, present, halfDay, paidLeave, unpaidLeave, absent, holiday, overtimeHours }. All roles.

Critical timezone handling per CLAUDE.md §Dates:
- API accepts date strings in IST ("2026-04-25").
- Internally, dates are stored as @db.Date (no time).
- The "month" of an attendance record is determined by its IST date — a punch at "2026-04-25" belongs to April 2026 regardless of the server's local timezone.
- All date math uses date-fns + date-fns-tz with zone "Asia/Kolkata".

Add unit tests for the summary aggregation logic.
Add e2e tests for bulk marking with mixed statuses and timezone correctness.
```

---

## Prompt 10 — Attendance Module (Frontend)

```
Build the daily-mark attendance screen — the most-used screen in the app, optimized for phones.

Route: /attendance
- Date picker at top (defaults to today in IST).
- List of all active employees, each row shows: photo (or initials), name, designation.
- Each row has 4 quick buttons: P (present, green), HD (half-day, yellow), L (leave, blue), A (absent, red).
- Tapping a button selects the status; the row visually shows the selection.
- A "Mark all present" button at top to bulk-set everyone to P.
- An overtime hours input that appears under a row when long-pressed (or via a small "OT" link).
- Floating "Save" button at the bottom shows count of marked employees.
- On save: POST to /attendance/bulk inside a single request. Show toast on success/failure.
- After save, the screen shows the saved state for that date with the option to edit.

Also build:
- /attendance/calendar/:employeeId — monthly calendar view with status colors per day.
- /attendance/summary — current-month summary table (mobile: stacked cards).

Test on a 360-wide viewport. Each row should be at least 56px tall for thumb-friendly tapping.
```

---

## Prompt 11 — Payroll Calculator (Pure Functions + Tests First)

```
Implement the payroll calculator in apps/api/src/payroll/calculator.ts as PURE functions.

Per CLAUDE.md §Payroll Calculation:
- Single exported function: calculatePayslip(input: PayslipInput): PayslipOutput
- No DB calls. No date.now(). No side effects.
- All money inputs/outputs are Decimal (decimal.js).
- Inputs: see CLAUDE.md spec.
- Math: see CLAUDE.md spec.

CRITICAL: Write tests FIRST in apps/api/src/payroll/__tests__/calculator.spec.ts covering all edge cases listed in CLAUDE.md §Payroll:
- Full month, all present
- Joined mid-month
- Left mid-month
- All absent (clamp net to 0, show carry-forward for advance)
- Mixed half-days (e.g., 4 half-days = 2 working days)
- Advance > available (carry forward calculation)
- February 28 days
- February 29 days (leap year)
- Overtime hours with default 1.5x and custom 2x multipliers
- Per-allowance "always pay full" flag honored
- Zero basic salary edge case
- Holidays don't reduce pay

Each test asserts exact decimal values. Use Decimal.toFixed(2) for assertions.

Once tests are green, write the wrapper service (PayrollService) that pulls inputs from the DB and calls the calculator. Do NOT write the wrapper before the calculator is fully tested.
```

---

## Prompt 12 — Payroll Run Workflow

```
Build the PayrollRun workflow per CLAUDE.md §Payroll state machine.

Endpoints (all under /api/v1/payroll, JWT required):
- POST /runs — body: { month, year }. Creates a DRAFT run if none exists for that month/year. OWNER/ACCOUNTANT only.
- GET /runs — list with pagination. All roles.
- GET /runs/:id — detail with all payslips. All roles.
- GET /runs/:id/preview — recomputes all payslips on the fly without saving (for what-if). DRAFT only.
- POST /runs/:id/finalize — locks the run. Saves all calculated payslips. Marks linked advances as deducted. OWNER only.
- POST /runs/:id/mark-paid — sets status to PAID. OWNER/ACCOUNTANT.
- GET /payslips/:id — get one payslip detail.
- GET /payslips/:id/pdf — generate PDF on demand using Puppeteer + HTML template at apps/api/src/payroll/templates/payslip.html.

Rules:
- Once FINALIZED, payslips are read-only. Reject any edit attempt with 409 CONFLICT.
- Finalization wraps the whole operation in prisma.$transaction.
- Use BullMQ for PDF generation if it takes >2s, else generate synchronously.

Frontend:
- /payroll — list of runs with status badges.
- /payroll/new — form to start a new run (pick month/year).
- /payroll/:id — preview table with all employees + computed payslips. "Finalize" button (with confirm dialog) for OWNER.
- /payslips/:id — single payslip view + Download PDF + Share via WhatsApp button (uses wa.me/<phone>?text=<link>).
```

---

## After V1 Ships

When v1 is in real use and stable, the next priorities are:
1. Sales / Purchase / Billing module with GST
2. Production tracking (raw material → finished goods)
3. Reports + dashboard

Update CLAUDE.md with the v2 plan before starting v2.
