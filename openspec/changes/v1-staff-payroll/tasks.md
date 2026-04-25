## 1. Monorepo Setup

- [x] 1.1 Create `pnpm-workspace.yaml` listing `apps/*` and `packages/*`
- [x] 1.2 Create root `package.json` with scripts `dev` (`pnpm -r --parallel dev`), `lint`, `typecheck`, `format`
- [x] 1.3 Add root `.gitignore` covering `node_modules`, `.env`, `dist`, `build`, `.turbo`, `*.log`, `coverage`
- [x] 1.4 Add `.editorconfig` and `.prettierrc` (2-space, single quotes, no semicolons in TS)
- [x] 1.5 Create `docker-compose.yml` with Postgres 16 (port 5432, db `paperplates`, user/password `app`/`app`) and Redis 7 (port 6379), each with named volumes
- [x] 1.6 Create empty directories: `apps/api`, `apps/web`, `packages/shared`, `docs/`
- [x] 1.7 `docker compose up -d` runs cleanly. Note: ports remapped to 5433 (postgres) and 6380 (redis) because the host already has containers on the defaults. `.env.example` reflects the remap.

## 2. Backend Bootstrap (NestJS)

- [x] 2.1 Scaffold NestJS in `apps/api` (hand-written package.json + tsconfig + nest-cli.json — no interactive `nest new`; same result, predictable, no class-validator dep)
- [x] 2.2 Install runtime deps: NestJS core/common/config/jwt/passport/swagger, prisma, bcrypt, zod, nestjs-zod, decimal.js, date-fns(-tz), puppeteer (Chromium download skipped — install with `pnpm dlx puppeteer browsers install chrome` before Group 14), bullmq, ioredis
- [x] 2.3 Install dev deps: jest, ts-jest, tsx, prisma, supertest, type packages
- [x] 2.4 Configure `@nestjs/config` to load `.env`; set global prefix `/api/v1` in `main.ts`
- [x] 2.5 Switched from class-validator-based `ValidationPipe` to per-route `ZodPipe` (CLAUDE.md "Zod everywhere") — `apps/api/src/common/pipes/zod.pipe.ts`
- [x] 2.6 Register `AllExceptionsFilter` returning `{ error: { code, message, details? } }`; maps `ZodError` to 400 `VALIDATION_ERROR`, `HttpException` to its code, unknown errors to 500 `INTERNAL_ERROR`
- [x] 2.7 Add `@nestjs/swagger` at `/api/docs`
- [x] 2.8 Add `/health` returning `{ status: 'ok', timestamp }` (verified live: 200, envelope-wrapped)
- [x] 2.9 Create `apps/api/.env.example` with every variable
- [x] 2.10 `validateEnv` in `src/config/env.validation.ts` fails startup with a clear message naming the missing variable (verified: removing `DATABASE_URL` exits non-zero with `DATABASE_URL: Required`)
- [x] 2.11 Verified: `pnpm --filter @paper-plates/api build` clean, boot succeeds, `/api/v1/health` returns 200, `/api/docs` returns 200, 404 wrapped in error envelope

## 3. Prisma Schema and First Migration

- [x] 3.1 `apps/api/prisma/schema.prisma` written by hand (skipping `prisma init` since the file already exists), datasource set to PostgreSQL with `env("DATABASE_URL")`
- [x] 3.2 Enums defined: `Role`, `SalaryType`, `AttendanceStatus`, `PayrollStatus`
- [x] 3.3 `User` model — phone unique, role, optional `employeeId @unique`, `createdAt`/`updatedAt`. Plus added `RefreshToken` model for server-side refresh-token revocation (needed for auth spec § "logout invalidates")
- [x] 3.4 `Employee` model — money columns `Decimal(12, 2)`, allowances/fixedDeductions JSON, `panEncrypted`/`aadhaarEncrypted` (AES-GCM strings), `isActive`, `dateOfJoining`/`dateOfLeaving` as `@db.Date`, `empCode @unique`
- [x] 3.5 `Attendance` — `date @db.Date`, status enum, `overtimeHours @db.Decimal(5, 2)`, `(employeeId, date)` unique, indexes on `date` and `employeeId`
- [x] 3.6 `Advance` — `amount Decimal(12, 2)`, `deductionMonth`/`deductionYear`, `isDeducted`, optional `payrollRunId`, optional `replacesAdvanceId` self-relation for carry-forward
- [x] 3.7 `PayrollRun` — `(year, month)` unique, status, `finalizedAt`, `paidAt`
- [x] 3.8 `Payslip` — `(payrollRunId, employeeId)` unique, frozen money columns + JSON breakdowns, `calculatorVersion`, `inputsJson`, `calculatedAt`
- [x] 3.9 Indexes on every FK plus `Attendance.date` and `(deductionYear, deductionMonth)` and `User.role`
- [x] 3.10 Ran `npx prisma migrate dev --name init` → migration `20260425111030_init` applied
- [x] 3.11 Prisma Client generated as part of migrate dev
- [x] 3.12 Verified via `psql \dt` — all V1 tables present (User, Employee, Attendance, Advance, PayrollRun, Payslip, RefreshToken)

## 4. Shared Zod Package

- [x] 4.1 Create `packages/shared/package.json` (name `@paper-plates/shared`, main `src/index.ts`, zod dep + typescript devDep)
- [x] 4.2 Create `packages/shared/tsconfig.json` extending `tsconfig.base.json`
- [x] 4.3 Create `src/common.ts` with `MoneyString`, `DateOnlyString`, `PhoneString`, `PaginationSchema`, enums (Role/SalaryType/AttendanceStatus/PayrollStatus)
- [x] 4.4 Create `src/auth.ts` with `LoginSchema`, `RefreshTokenSchema`, `AuthResponseSchema`
- [x] 4.5 Create `src/employee.ts` with `CreateEmployeeSchema`, `UpdateEmployeeSchema`, `EmployeeResponseSchema`, `EmployeeListQuerySchema`
- [x] 4.6 Create `src/attendance.ts` with `BulkMarkAttendanceSchema`, `AttendanceQuerySchema`, `AttendanceResponseSchema`, `AttendanceSummaryQuerySchema`, `AttendanceSummaryRowSchema`
- [x] 4.7 Create `src/advance.ts` with `CreateAdvanceSchema`, `UpdateAdvanceSchema`, `AdvanceResponseSchema`, `AdvanceQuerySchema`
- [x] 4.8 Create `src/payroll.ts` with `CreatePayrollRunSchema`, `PayrollRunResponseSchema`, `PayslipResponseSchema`, `PayrollPreviewSchema`
- [x] 4.9 Re-export everything from `src/index.ts`; verified `pnpm --filter @paper-plates/shared typecheck` is clean
- [x] 4.10 `@paper-plates/shared` added as `workspace:*` dep in `apps/api/package.json`; will repeat for `apps/web/package.json` during Group 7 scaffold
- [ ] 4.11 Verify: import `EmployeeResponseSchema` in `apps/api/src/main.ts` as a smoke test (deferred — shared resolves cleanly in API typecheck via the Zod-pipe path; explicit smoke import to be added when first controller imports a shared schema in Group 5)

## 5. Auth Module

- [ ] 5.1 Create `AuthModule` in `apps/api/src/auth/`
- [ ] 5.2 Implement `AuthService.validateUser(phone, password)` with `bcrypt.compare` (cost 12)
- [ ] 5.3 Implement `AuthService.issueTokens(user)` (access 15m, refresh 7d, separate secrets)
- [ ] 5.4 Implement `AuthService.refreshTokens(refreshToken)` with rotation (invalidate old token)
- [ ] 5.5 Implement `AuthService.logout(refreshToken)` (mark revoked)
- [ ] 5.6 Implement `JwtStrategy` and `JwtAuthGuard`
- [ ] 5.7 Implement `RolesGuard` and `@Roles(...roles)` decorator
- [ ] 5.8 Implement `@CurrentUser()` parameter decorator
- [ ] 5.9 Implement `AuthController`: `POST /auth/login`, `POST /auth/refresh`, `POST /auth/logout` — all validated via `nestjs-zod` against `@paper-plates/shared` schemas
- [ ] 5.10 Map errors to codes: `INVALID_CREDENTIALS`, `TOKEN_EXPIRED`, `INVALID_TOKEN`, `UNAUTHORIZED`, `FORBIDDEN`
- [ ] 5.11 Create `apps/api/prisma/seed.ts` that creates one OWNER (phone `9999999999`, password `changeme`) and 3 sample employees with linked STAFF user accounts
- [ ] 5.12 Add `prisma.seed` config in `apps/api/package.json`
- [ ] 5.13 Add `apps/api/test/auth.e2e-spec.ts` covering login success, wrong password, refresh rotation, expired refresh, logout invalidation
- [ ] 5.14 Verify: seed runs; `curl POST /auth/login` returns tokens; using access token on a protected route returns 200; expired access token + valid refresh token chain works end-to-end

## 6. Employee CRUD

- [ ] 6.1 Create `EmployeesModule` in `apps/api/src/employees/`
- [ ] 6.2 Implement an AES-256-GCM service `crypto.service.ts` (`encrypt(s)` → `iv:tag:ct`, `decrypt(s)`) using `ENCRYPTION_KEY` env
- [ ] 6.3 Implement `EmployeesService` with create / list / get / update / softDelete; encrypt PAN/Aadhaar on write
- [ ] 6.4 Implement automatic `empCode` generation (`EMP{YYYY}{4-digit}`) using IST year and a per-year sequence
- [ ] 6.5 Implement masking for PAN/Aadhaar in responses; `?includePii=true` query param decrypts only when caller is OWNER
- [ ] 6.6 Implement `EmployeesController` with role-gated routes: `POST /` (OWNER, MANAGER), `GET /` and `GET /:id` (any), `PATCH /:id` (OWNER, MANAGER), `DELETE /:id` (OWNER)
- [ ] 6.7 Validate every request body with the appropriate Zod schema
- [ ] 6.8 Add e2e tests in `apps/api/test/employees.e2e-spec.ts` covering each endpoint plus permission checks plus PII masking/decryption
- [ ] 6.9 Verify: smoke test create→list→get→update→soft-delete via curl/Swagger

## 7. Frontend Scaffold (Vite + React + PWA)

- [ ] 7.1 Scaffold Vite app in `apps/web` via `pnpm create vite@latest . -- --template react-ts`
- [ ] 7.2 Install: `react-router-dom`, `@tanstack/react-query`, `@tanstack/react-query-devtools`, `react-hook-form`, `@hookform/resolvers`, `zod`, `axios`, `date-fns`, `date-fns-tz`, `decimal.js`, `lucide-react`, `tailwindcss`, `@vitejs/plugin-pwa`, `vite-plugin-pwa`, `workbox-window`, `clsx`, `tailwind-merge`
- [ ] 7.3 Initialise Tailwind per the official Vite guide
- [ ] 7.4 Configure `vite-plugin-pwa` with manifest values from `mobile-web-pwa` spec
- [ ] 7.5 Initialise shadcn/ui with the slate theme (`pnpm dlx shadcn@latest init`); add components: `button`, `input`, `label`, `card`, `table`, `dialog`, `form`, `select`, `toast`, `badge`, `skeleton`
- [ ] 7.6 Create `src/lib/api.ts` (Axios instance with `baseURL = VITE_API_URL`, attach `accessToken`, refresh-once on 401)
- [ ] 7.7 Create `src/lib/queryClient.ts` (TanStack Query defaults: `staleTime: 5 * 60_000`, `retry: 1`)
- [ ] 7.8 Create `src/lib/auth.ts` with `login`, `logout`, `getCurrentUser`, `getAccessToken` helpers
- [ ] 7.9 Create `src/lib/format.ts` with `formatINR(value: string | Decimal)` using `Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' })`
- [ ] 7.10 Create the route structure under `src/routes/` and a `RequireAuth` guard component
- [ ] 7.11 Wrap `App` in `QueryClientProvider`, `BrowserRouter`, and `Toaster`
- [ ] 7.12 Create `apps/web/.env.example` with `VITE_API_URL`
- [ ] 7.13 Verify: `pnpm --filter web dev` serves at `http://localhost:5173`

## 8. Login, Dashboard, and Employees UI

- [ ] 8.1 Build `/login` route with phone+password form, calls `POST /auth/login`, stores tokens, redirects to `/dashboard`
- [ ] 8.2 Build `/dashboard` placeholder with `Hello, {user.name}` and a Logout button
- [ ] 8.3 Build `/employees` list with search box, active-filter toggle, mobile cards / desktop table
- [ ] 8.4 Build `/employees/new` create form using `CreateEmployeeSchema`
- [ ] 8.5 Build `/employees/:id` detail view with edit + soft-delete actions, role-gated
- [ ] 8.6 Implement loading skeletons, error states with Retry, and empty states with CTAs on each screen
- [ ] 8.7 Add optimistic updates for create/update with rollback on failure
- [ ] 8.8 Verify on a 360×800 viewport: login → see seeded employees → add new → edit → soft-delete

## 9. Attendance Module (Backend)

- [ ] 9.1 Create `AttendanceModule` in `apps/api/src/attendance/`
- [ ] 9.2 Implement `POST /attendance/bulk` wrapped in `prisma.$transaction` with upsert on `(employeeId, date)`; role gate OWNER/MANAGER
- [ ] 9.3 Implement `GET /attendance?from=&to=&employeeId=` (any auth role) with date-range validation
- [ ] 9.4 Implement `GET /attendance/summary?month=&year=` returning per-active-employee aggregated counts; ensure all active employees appear even with zero rows; sum `overtimeHours` as Decimal
- [ ] 9.5 Use `date-fns-tz` with `Asia/Kolkata` for all month-boundary math; never call `new Date()` for business dates
- [ ] 9.6 Add unit tests for the summary aggregation logic
- [ ] 9.7 Add e2e tests for bulk marking with mixed statuses and a `TZ=UTC`-running test that verifies April-25 belongs to April
- [ ] 9.8 Verify: bulk mark 5 employees, fetch range and summary; both shapes match the Zod schemas

## 10. Attendance Module (Frontend)

- [ ] 10.1 Build `/attendance` daily-mark screen with date picker (default today in IST) and per-employee rows
- [ ] 10.2 Add P/HD/L/A quick-action buttons (≥56px tap target each) and visible selection state
- [ ] 10.3 Add a "Mark all present" button at top
- [ ] 10.4 Add per-row OT-hours input revealed via long-press or an "OT" link
- [ ] 10.5 Add a floating Save button showing the count of marked employees; on tap, POST `/attendance/bulk`
- [ ] 10.6 On save success, refresh and show the saved state with edit affordance
- [ ] 10.7 Build `/attendance/calendar/:employeeId` monthly calendar view with status colours per day
- [ ] 10.8 Build `/attendance/summary` showing per-employee monthly counts; stacked cards on mobile
- [ ] 10.9 Verify on a 360-wide viewport: mark 30 employees, save, see saved state, view calendar and summary

## 11. Advances (Backend + Frontend)

- [ ] 11.1 Create `AdvancesModule` in `apps/api/src/advances/` with create/list/get/update/delete
- [ ] 11.2 Role-gate writes: `POST` and `PATCH` (OWNER, ACCOUNTANT); `DELETE` (OWNER)
- [ ] 11.3 Reject `PATCH` and `DELETE` with `409 ADVANCE_LOCKED` if `isDeducted=true` or `payrollRunId` is set
- [ ] 11.4 Add e2e tests covering CRUD plus locked-after-deduction behaviour
- [ ] 11.5 Build `/advances` list with employee filter and deduction-period filter
- [ ] 11.6 Build advance create form gated to OWNER and ACCOUNTANT
- [ ] 11.7 Hide edit/delete buttons when `isDeducted=true`
- [ ] 11.8 Verify on mobile viewport: create, list, edit, delete an advance

## 12. Payroll Calculator (Tests First)

- [ ] 12.1 Write `apps/api/src/payroll/__tests__/calculator.spec.ts` with one passing-target test per row of the test matrix in `PAYROLL.md` (18 rows). Use `Decimal.toFixed(2)` assertions
- [ ] 12.2 Create the test fixtures helper `__tests__/fixtures.ts` with builders for `PayslipInput`
- [ ] 12.3 Implement `apps/api/src/payroll/calculator.ts` exporting `calculatePayslip(input): PayslipOutput` and `CALCULATOR_VERSION`
- [ ] 12.4 Implement Step 1: `daysPayable` from `dateOfJoining`/`dateOfLeaving`/`daysInMonth`; return `notEmployed: true` when ≤ 0
- [ ] 12.5 Implement Step 2: `perDay = basicSalary.div(daysPayable)`
- [ ] 12.6 Implement Step 3: `daysWorked = present + paidLeave + halfDay * 0.5`; clamp to `daysPayable`
- [ ] 12.7 Implement Step 4: `basicEarned`, `hraEarned`, allowances (respecting `alwaysFull`), `otAmount`, `grossEarnings`
- [ ] 12.8 Implement Step 5: fixed deductions sum, FIFO advance application with carry-forward
- [ ] 12.9 Implement Step 6: `netPay = max(grossEarnings - totalDeductions, 0)`
- [ ] 12.10 Implement Step 7: round all output money values with `Decimal.ROUND_HALF_EVEN` to 2 places
- [ ] 12.11 Verify: `pnpm --filter api test payroll` is green for all 18 rows
- [ ] 12.12 Document `CALCULATOR_VERSION` bump policy at the top of `calculator.ts`

## 13. Payroll Runs (Backend)

- [ ] 13.1 Create `PayrollModule` in `apps/api/src/payroll/`
- [ ] 13.2 Implement `PayrollService.createDraft(month, year)` — idempotent on `(month, year)`
- [ ] 13.3 Implement `PayrollService.preview(runId)` — recompute on the fly for DRAFT, return frozen payslips for FINALIZED/PAID
- [ ] 13.4 Implement `PayrollService.finalize(runId)` — wrap in `prisma.$transaction`: insert payslips with `calculatorVersion` + `inputsJson`, link applied advances, set `isDeducted=true` on fully-applied advances, reschedule carry-forwards (new `Advance` rows with `replacesAdvanceId`), set `status=FINALIZED`, `finalizedAt=now`
- [ ] 13.5 Implement `PayrollService.markPaid(runId)` — DRAFT→reject, FINALIZED→PAID with `paidAt=now`
- [ ] 13.6 Implement `PayrollController`: `POST /runs`, `GET /runs`, `GET /runs/:id`, `GET /runs/:id/preview`, `POST /runs/:id/finalize` (OWNER only), `POST /runs/:id/mark-paid` (OWNER, ACCOUNTANT), `GET /payslips/:id`
- [ ] 13.7 Reject any payslip mutation in non-DRAFT run with `409 RUN_FINALIZED`
- [ ] 13.8 Reject `finalize` and `markPaid` with `409 INVALID_STATE_TRANSITION` from invalid prior states
- [ ] 13.9 Add integration tests for: create idempotency, preview reflects updates, finalize atomicity (force-fail mid-transaction), advance carry-forward into next month, mark-paid transitions
- [ ] 13.10 Verify: end-to-end run for the seeded employees produces correct payslips

## 14. Payslip PDF

- [ ] 14.1 Create `apps/api/src/payroll/templates/payslip.html` with company name, period (IST), employee details, earnings/deductions/advances tables, net pay (figures + words), `calculatorVersion`
- [ ] 14.2 Create a `PuppeteerService` singleton (one `Browser`, fresh `Page` per request, `--no-sandbox --disable-setuid-sandbox`, graceful shutdown on `SIGTERM`)
- [ ] 14.3 Implement `GET /payslips/:id/pdf` returning `Content-Type: application/pdf` and `Content-Disposition: inline; filename="payslip-<empCode>-<YYYY>-<MM>.pdf"`
- [ ] 14.4 Reject `/payslips/:id/pdf` for DRAFT runs with `409 PAYSLIP_NOT_FINALIZED`
- [ ] 14.5 Format all money values via `Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' })` in the template
- [ ] 14.6 Add a smoke test that the PDF endpoint returns ≥ 1 KB of `application/pdf`
- [ ] 14.7 Verify: open PDF in a browser, every section renders correctly

## 15. Payroll UI

- [ ] 15.1 Build `/payroll` runs list with status badges (DRAFT/FINALIZED/PAID)
- [ ] 15.2 Build `/payroll/new` month/year picker; calls `POST /runs`; navigates to `/payroll/:id`
- [ ] 15.3 Build `/payroll/:id` preview table with all employees + computed payslips; OWNER-only Finalize button with confirmation dialog
- [ ] 15.4 Build `/payslips/:id` single-payslip view with breakdown; Download PDF button (opens `/payslips/:id/pdf`)
- [ ] 15.5 Build "Share via WhatsApp" action that opens `https://wa.me/<phone>?text=<encoded message + payslip URL>`
- [ ] 15.6 Verify on 360-wide viewport: full happy path — create draft → preview → finalize → mark paid → download PDF → WhatsApp share

## 16. Deploy + CI

- [ ] 16.1 Add a GitHub Actions workflow running `pnpm install --frozen-lockfile && pnpm lint && pnpm typecheck && pnpm -r test` on every PR
- [ ] 16.2 Provision Railway project: API service (with Chromium support for Puppeteer), Postgres 16, Redis 7
- [ ] 16.3 Set Railway env vars from `apps/api/.env.example`; generate fresh JWT and ENCRYPTION secrets via `openssl rand -hex 32`
- [ ] 16.4 Configure Railway to auto-deploy from `main`
- [ ] 16.5 Provision Vercel project for `apps/web`; set `VITE_API_URL` to the Railway API URL; auto-deploy from `main`
- [ ] 16.6 Configure CORS_ORIGIN on the API to include the Vercel preview and production URLs
- [ ] 16.7 Confirm the staging URLs are reachable from a real phone over mobile data
- [ ] 16.8 Take the staging Postgres backup setting from default to daily

## 17. V1 Definition-of-Done Sign-off

- [ ] 17.1 Run `pnpm lint && pnpm typecheck && pnpm -r test` locally — all green
- [ ] 17.2 Walk the full happy path on a real phone connected to staging
- [ ] 17.3 Run one real payroll on actual factory data (Week-4 milestone in `CLAUDE.md`)
- [ ] 17.4 Triage and fix any bugs surfaced by 17.3 before declaring V1 done
- [ ] 17.5 Update `CLAUDE.md` with any architecture changes that arose during implementation
- [ ] 17.6 Tag the V1 release commit and capture the staging URLs in `README.md`
