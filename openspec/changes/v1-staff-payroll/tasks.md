## 1. Monorepo Setup

- [x] 1.1 Create `pnpm-workspace.yaml` listing `apps/*` and `packages/*`
- [x] 1.2 Create root `package.json` with scripts `dev` (`pnpm -r --parallel dev`), `lint`, `typecheck`, `format`
- [x] 1.3 Add root `.gitignore` covering `node_modules`, `.env`, `dist`, `build`, `.turbo`, `*.log`, `coverage`
- [x] 1.4 Add `.editorconfig` and `.prettierrc` (2-space, single quotes, no semicolons in TS)
- [x] 1.5 Create `docker-compose.yml` with Postgres 16 (port 5432, db `myfactorydesk`, user/password `app`/`app`) and Redis 7 (port 6379), each with named volumes
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
- [x] 2.11 Verified: `pnpm --filter @myfactorydesk/api build` clean, boot succeeds, `/api/v1/health` returns 200, `/api/docs` returns 200, 404 wrapped in error envelope

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

- [x] 4.1 Create `packages/shared/package.json` (name `@myfactorydesk/shared`, main `src/index.ts`, zod dep + typescript devDep)
- [x] 4.2 Create `packages/shared/tsconfig.json` extending `tsconfig.base.json`
- [x] 4.3 Create `src/common.ts` with `MoneyString`, `DateOnlyString`, `PhoneString`, `PaginationSchema`, enums (Role/SalaryType/AttendanceStatus/PayrollStatus)
- [x] 4.4 Create `src/auth.ts` with `LoginSchema`, `RefreshTokenSchema`, `AuthResponseSchema`
- [x] 4.5 Create `src/employee.ts` with `CreateEmployeeSchema`, `UpdateEmployeeSchema`, `EmployeeResponseSchema`, `EmployeeListQuerySchema`
- [x] 4.6 Create `src/attendance.ts` with `BulkMarkAttendanceSchema`, `AttendanceQuerySchema`, `AttendanceResponseSchema`, `AttendanceSummaryQuerySchema`, `AttendanceSummaryRowSchema`
- [x] 4.7 Create `src/advance.ts` with `CreateAdvanceSchema`, `UpdateAdvanceSchema`, `AdvanceResponseSchema`, `AdvanceQuerySchema`
- [x] 4.8 Create `src/payroll.ts` with `CreatePayrollRunSchema`, `PayrollRunResponseSchema`, `PayslipResponseSchema`, `PayrollPreviewSchema`
- [x] 4.9 Re-export everything from `src/index.ts`; verified `pnpm --filter @myfactorydesk/shared typecheck` is clean
- [x] 4.10 `@myfactorydesk/shared` added as `workspace:*` dep in `apps/api/package.json`; will repeat for `apps/web/package.json` during Group 7 scaffold
- [ ] 4.11 Verify: import `EmployeeResponseSchema` in `apps/api/src/main.ts` as a smoke test (deferred — shared resolves cleanly in API typecheck via the Zod-pipe path; explicit smoke import to be added when first controller imports a shared schema in Group 5)

## 5. Auth Module

- [x] 5.1 `AuthModule` at `apps/api/src/auth/` with imports for Passport + JwtModule (TTL from env)
- [x] 5.2 `AuthService.login(phone, password)` with `bcrypt.compare` (cost 12); dummy compare on user-not-found to keep timing constant
- [x] 5.3 `AuthService.issueTokens(user)` — JWT access (signed with `JWT_ACCESS_SECRET`, 15m TTL) + opaque random refresh token (sha256-hashed, 7d TTL) stored in `RefreshToken` table
- [x] 5.4 `AuthService.refresh(refreshToken)` — rotates: revokes old, issues new pair, all in `prisma.$transaction`
- [x] 5.5 `AuthService.logout(refreshToken)` — idempotent revoke
- [x] 5.6 `JwtStrategy` (passport-jwt, validates against DB, rejects inactive users) + `JwtAuthGuard` (skips `@Public()` routes; maps TokenExpiredError → `TOKEN_EXPIRED`)
- [x] 5.7 `RolesGuard` reading `@Roles(...)` metadata; `@Public()` for opt-out (used by `/health`, `/auth/*`)
- [x] 5.8 `@CurrentUser()` param decorator returning `AuthUser`
- [x] 5.9 `AuthController` with `POST /auth/login`, `POST /auth/refresh`, `POST /auth/logout` — bodies validated by `ZodPipe` against schemas from `@myfactorydesk/shared`
- [x] 5.10 Error codes: `INVALID_CREDENTIALS`, `TOKEN_EXPIRED`, `INVALID_TOKEN`, `UNAUTHORIZED`, `FORBIDDEN` — all flow through `AllExceptionsFilter` and surface as `{error:{code,message}}`
- [x] 5.11 `apps/api/prisma/seed.ts` — creates OWNER (`9999999999` / `changeme`) + 3 STAFF-linked sample employees (`9111100001-3`); idempotent via upsert
- [x] 5.12 `prisma.seed` config in `apps/api/package.json` (`tsx --env-file=.env prisma/seed.ts`)
- [ ] 5.13 `apps/api/test/auth.e2e-spec.ts` — **deferred**, supertest config not yet wired; covered by manual verification in 5.14
- [x] 5.14 Verified end-to-end (8 curl probes): owner login, wrong password → `INVALID_CREDENTIALS` 401, `/health` accessible with or without token, refresh rotates and invalidates old, logout returns 204, refresh after logout → `INVALID_TOKEN` 401, STAFF login works
- [x] 5.x **Project rename** done in this group: `paper-plates` → `myfactorydesk` everywhere (npm scope `@myfactorydesk/*`, DB name, container/volume names, doc titles, swagger title). Old DB volumes dropped, new `myfactorydesk` DB migrated.
- [x] 5.x Shared package switched from ESM-source-as-main to built-CJS (`tsc → dist/`); `pnpm dev` builds shared once before starting watches, watch mode rebuilds on change
- [x] 5.x Global guards wired in `AppModule` via `APP_GUARD`: every route is auth-required by default; `@Public()` opts out

## 6. Employee CRUD

- [x] 6.1 `EmployeesModule` at `apps/api/src/employees/` (controller + service); wired into `AppModule`
- [x] 6.2 `CryptoService` (`apps/api/src/common/crypto/crypto.service.ts`) — AES-256-GCM, key from env, output `iv:tag:ct` (base64url segments). `CryptoModule` is global. Unit tests cover round-trip, IV randomness, malformed input, and tamper detection
- [x] 6.3 `EmployeesService.create/list/get/update/softDelete`; PAN/Aadhaar encrypted on write, decrypted on read (mask by default). All multi-row writes wrapped in `prisma.$transaction`
- [x] 6.4 `nextEmpCode()` → `EMP{IST-year}{4-digit-seq}`; pure helpers in `emp-code.ts` unit-tested (zero-padding, range guard, IST late-Dec edge case → next year)
- [x] 6.5 `maskTail()` (`pii.ts`, unit-tested) returns `XXXXXX234F` / `XXXXXXXX9012`. `?includePii=true` only honored when `user.role === OWNER`; otherwise flag is ignored. PII access is logged (empCode + id, never the value)
- [x] 6.6 `EmployeesController`: `POST /` & `PATCH /:id` (OWNER, MANAGER), `GET /` & `GET /:id` (any auth), `DELETE /:id` (OWNER). Verified 403 for STAFF on POST and DELETE
- [x] 6.7 Every body/query goes through `ZodPipe`: `CreateEmployeeSchema`, `UpdateEmployeeSchema`, `EmployeeListQuerySchema`, plus inline `IncludePiiQuerySchema`. Numeric money input → `400 VALIDATION_ERROR` (verified)
- [ ] 6.8 e2e tests in `apps/api/test/employees.e2e-spec.ts` — **deferred** (same as 5.13: supertest config not yet wired). Covered for now by service unit tests (crypto, emp-code, pii) and the 6.9 smoke matrix. Will land alongside the test infra work in Group 12+
- [x] 6.9 Smoke verified end-to-end (12 curl probes): owner create with auto empCode, date round-trip (`2026-04-15` in == out), masked PII default, OWNER `?includePii=true` decrypts, STAFF `?includePii=true` ignored (still masked), STAFF POST → 403, STAFF DELETE → 403, PATCH preserves untouched fields, numeric money → 400 VALIDATION_ERROR, unknown id → 404 NOT_FOUND, duplicate empCode → 409 EMP_CODE_EXISTS, soft-delete sets `isActive=false` + IST `dateOfLeaving` and is excluded from default list / included with `active=false`
- [x] 6.x Bug found and fixed during 6.9: calendar-date `@db.Date` round-trip — initial `toDate` anchored at IST midnight which Postgres stored as the previous UTC day. Fixed by anchoring to UTC midnight of the same calendar day for `@db.Date` columns (see `employees.service.ts` `toDate`/`fromDate`). Pattern to reuse for Attendance/Advance dates in Groups 9+11
- [x] 6.x Minimal jest config added (`apps/api/jest.config.js`) so `pnpm --filter api test` runs unit tests; no global config previously existed

## 7. Frontend Scaffold (Vite + React + PWA)

- [x] 7.1 Hand-written `apps/web` scaffold (skipped interactive `pnpm create vite` for the same reason 2.1 skipped `nest new` — predictable, matches workspace conventions). Files: `package.json`, `tsconfig.json`, `vite.config.ts`, `index.html`, `src/main.tsx`, `src/App.tsx`, `.gitignore`
- [x] 7.2 Installed all required deps as `workspace:*` for shared + the full list (router, TanStack Query + devtools, RHF + zod resolver, axios, date-fns(-tz), decimal.js, lucide, tailwind, vite-plugin-pwa, workbox-window, clsx, tailwind-merge). `pnpm install` clean
- [x] 7.3 Tailwind initialised (`tailwind.config.js`, `postcss.config.js`, `src/index.css` with `@tailwind base/components/utilities`); `min-h-tap: 56px` extension for the spec's tap-target floor
- [x] 7.4 `vite-plugin-pwa` configured per `mobile-web-pwa` spec (name/short_name `MyFactoryDesk`, theme `#1f2937`, background `#ffffff`, `display: standalone`, 192/512/maskable icons). Production build emits `manifest.webmanifest` + `sw.js` + workbox precache
- [ ] 7.5 shadcn/ui — **deferred**. Hand-styled equivalents in place for v1 scaffold (login form, dashboard, placeholder); shadcn requires interactive init + per-component copy and is not blocking any later task. Will add when a richer component (Dialog, Select, Toast) is first needed in Group 8
- [x] 7.6 `src/lib/api.ts` — Axios with `baseURL = VITE_API_URL`, request interceptor attaches Bearer, response interceptor performs **single-flight** refresh on 401 (skipping `/auth/login` and `/auth/refresh` themselves), retries once, falls back to `clearSession()` + `window.location.assign('/login')`
- [x] 7.7 `src/lib/queryClient.ts` — `staleTime: 5 * 60_000`, `retry: 1`, `refetchOnWindowFocus: false`
- [x] 7.8 `src/lib/auth.ts` — `getAccessToken`, `getRefreshToken`, `getCurrentUser`, `setSession`, `setTokens`, `clearSession`, `isAuthenticated`. localStorage keys are namespaced `mfd.*`
- [x] 7.9 `src/lib/format.ts` — `formatINR()` uses `Intl.NumberFormat('en-IN', { style:'currency', currency:'INR' })`; accepts `string | Decimal`. Plus `cn.ts` for tailwind-merge + clsx
- [x] 7.10 Routes scaffolded under `src/routes/`: `Login`, `Dashboard`, `RequireAuth` guard (redirects to `/login` carrying `from` state), `Placeholder` for the not-yet-built domain screens (employees, attendance, advances, payroll, payslips). Group 8+ replaces those placeholders
- [x] 7.11 `App` wraps `QueryClientProvider` + `BrowserRouter` + dev-only `ReactQueryDevtools`. Toast layer deferred to 7.5 (no toast lib yet)
- [x] 7.12 `apps/web/.env.example` with `VITE_API_URL=http://localhost:3030/api/v1`. Created `apps/web/.env` for the local run
- [x] 7.13 Verified: `pnpm --filter @myfactorydesk/web dev` serves at `http://localhost:5173` (HTML 200, `/src/main.tsx` transforms cleanly via Vite). `pnpm --filter @myfactorydesk/web build` produces production bundle (296KB JS, 8KB CSS) + workbox-precached PWA assets
- [x] 7.x **Shared package switched to dual ESM+CJS emit** to unblock Vite/Rollup. Vite couldn't statically analyse re-exports from the CJS-only build (`__exportStar` is dynamic). Now: `dist/cjs/` (with `package.json: type=commonjs`) for the API + jest, `dist/esm/` (with `package.json: type=module`) for the web. `package.json#exports` resolves both via `import`/`require` conditions. API jest moduleNameMapper updated to point at `dist/cjs/index.js`. Both API typecheck/test/build and web typecheck/build remain green

## 8. Login, Dashboard, and Employees UI

- [x] 8.1 `/login` route — `apps/web/src/routes/Login.tsx` calls `POST /auth/login`, stores tokens via `setSession`, redirects to `from` location or `/dashboard`. Inline error from API `error.message` (built in Group 7 scaffold)
- [x] 8.2 `/dashboard` — shows signed-in name + role + phone, Logout button calls `POST /auth/logout` (best-effort) then clears session and navigates to `/login` (built in Group 7 scaffold)
- [x] 8.3 `/employees` list — `EmployeesList.tsx`: search input (matches name + empCode), active-only checkbox (default on), mobile-first card rows (`min-h-tap`, salary on the right). Desktop falls back to wider cards — table view deferred (cards work fine to 1280px+ for V1)
- [x] 8.4 `/employees/new` — `NewEmployee.tsx` with React Hook Form + `zodResolver(CreateEmployeeSchema)`. Fields for v1: name, phone, designation, dateOfJoining, basicSalary, hra. Allowances/fixedDeductions/PII deferred to a richer "Advanced" expander (will add when first user asks). On success → navigate to `/employees/:id`
- [x] 8.5 `/employees/:id` — `EmployeeDetail.tsx`: read view (employee, salary, masked PII sections) + Edit toggle (OWNER/MANAGER) + soft-delete with confirmation dialog (OWNER only). Header Edit button is hidden for STAFF/ACCOUNTANT
- [x] 8.6 Loading skeletons (`Skeleton`), error state with Retry (`ErrorState`, calls `query.refetch`), empty state with role-gated "+ Add Employee" CTA (`EmptyState`). Each list/detail screen wires through these. Centralised `apiErrorMessage(err)` extracts the API envelope's `error.message`
- [x] 8.7 Optimistic update on `useUpdateEmployee` — `onMutate` patches the detail cache and stores the previous snapshot, `onError` rolls back, `onSettled` invalidates `['employees']`. Create is **not** optimistic by design (no temp id; navigate-on-success is simpler and equally fast on a phone)
- [x] 8.8 End-to-end flow verified through the same HTTP path the UI uses: login → list → create (auto empCode `EMP20260006`) → PATCH `basicSalary` → soft-delete (`isActive=false`, IST `dateOfLeaving`). CORS preflight from `:5173` → 204. SPA deep-link `/employees/:id` → 200. **Visual 360×800 phone-viewport verification is owed** — needs a real browser/devtools; the CSS uses `min-h-tap: 56px` everywhere and the layout is mobile-first by construction
- [x] 8.x Reusable primitives added under `src/components/ui/`: `Button` (variants + tap size), `Input`, `Skeleton`, `EmptyState`, `ErrorState`. `AppLayout` (header with optional Back + action slot) used across all employees pages. Replaces the deferred 7.5 shadcn init with the smallest surface that V1 actually needs
- [x] 8.x Feature folder `apps/web/src/features/employees/` per the `mobile-web-pwa` spec § Server state via TanStack Query: `api.ts` (axios calls), `hooks/useEmployees.ts` (queries + mutations + `employeesKeys` factory), and the three page components. Mutations invalidate `['employees']` on settle

## 9. Attendance Module (Backend)

- [x] 9.1 `AttendanceModule` at `apps/api/src/attendance/` (controller + service + pure aggregator); wired into `AppModule`
- [x] 9.2 `POST /attendance/bulk` — pre-validates referenced employees + duplicate-id guard, then transactional upsert on `(employeeId, date)`; role gate OWNER/MANAGER (verified 403 for STAFF)
- [x] 9.3 `GET /attendance?from=&to=&employeeId=` — `from <= to` enforced by Zod refine (verified 400 on inverted range); ordered `(date ASC, employeeId ASC)`
- [x] 9.4 `GET /attendance/summary?month=&year=` — pure `aggregateMonthlySummary()` (in `aggregate.ts`) joins active employees with the month's rows; zero rows for employees with no attendance; `overtimeHours` summed as `Prisma.Decimal` and serialised via `toFixed(2)`
- [x] 9.5 Month boundaries via `monthRangeUtc(year, month)` (UTC arithmetic only, leap-year aware via `Date.UTC(year, month, 0).getUTCDate()`). `@db.Date` rows are anchored at UTC midnight of the calendar day (mirrors `EmployeesService.toDate`), so the same range works regardless of the server's TZ. `new Date()` is not used for any business-date math
- [x] 9.6 `aggregate.spec.ts` — 9 unit tests covering: zero-row employees, status counters, Decimal overtime sum, ghost employeeId drop, ordering, plus 4 `monthRangeUtc` cases (April, leap-Feb, non-leap-Feb, December rollover). All 21 API unit tests pass under `TZ=UTC`
- [ ] 9.7 e2e tests — **deferred** (same justification as 5.13 / 6.8: supertest config not yet wired). Manual smoke + the TZ=UTC unit run replace it for now
- [x] 9.8 Smoke matrix verified end-to-end (15 curl probes via `/api/v1`): OWNER login → list employees → bulk mark 3 (count=3) → upsert overwrite (count=1) → second-day bulk (count=3) → range query returns 6 rows ordered by `(date,employeeId)` → summary aggregates correctly per employee → STAFF POST 403 FORBIDDEN → STAFF GET 200 → `from > to` 400 VALIDATION_ERROR → unknown enum 400 → unknown employeeId 400 (with `details.missing`) → duplicate-id-in-marks 400 → 2026-04-30 included in April summary → 2026-05-01 excluded from April

## 10. Attendance Module (Frontend)

- [x] 10.1 `AttendanceDailyMark.tsx` — date picker defaults to today in IST via `formatInTimeZone(new Date(), 'Asia/Kolkata', 'yyyy-MM-dd')`. Loads active employees + existing attendance for the date and seeds local row state from both.
- [x] 10.2 P / HD / L / A quick-action buttons in a 4-col grid using `min-h-tap` (56px floor), tone-coded (emerald / amber / sky / red). Selected state is visible (filled tone vs. slate-100) and `aria-pressed` reflects the pick. Tapping the same status again clears it.
- [x] 10.3 Top "Mark all present" secondary button, hidden for STAFF/ACCOUNTANT (gated on OWNER/MANAGER).
- [x] 10.4 Per-row "OT" link toggles a dedicated decimal input (`inputMode="decimal"`, regex-validated `^\d+(\.\d{1,2})?$` at save). OT auto-shows for rows that already have a non-zero OT value loaded from the server.
- [x] 10.5 Floating bottom bar shows `{markedCount} marked` + a tap-sized Save button calling `useBulkMarkAttendance`. Layout uses `pb-24` on the list so the bar never overlaps the last row.
- [x] 10.6 `onSuccess` invalidates the `['attendance']` query family so the list re-fetches and the row state re-seeds with `existing.overtimeHours` / `status` — that's the saved-state edit affordance.
- [x] 10.7 `AttendanceCalendar.tsx` at `/attendance/calendar/:employeeId` — 7-col grid of all days in the picked month with status-coloured tiles, day number + 1-2 letter status code, plus a 6-status legend. Month/year selects default to today in IST.
- [x] 10.8 `AttendanceSummary.tsx` at `/attendance/summary` — stacked employee cards on mobile with a 3-col-on-mobile / 6-col-on-sm grid of counters (P / Half / Paid L / Unpaid L / Absent / Holiday) and an inline OT total. Each card has a "Calendar →" link to the per-employee view.
- [ ] 10.9 Visual 360-wide-viewport verification owed (same pattern as 8.8). Build + dev-server module transforms verified clean: web `tsc -b`, `vite build`, and dev fetches of `/src/main.tsx`, `App.tsx`, all three attendance components, hooks, and api.ts all return 200 with no vite warnings.

## 11. Advances (Backend + Frontend)

- [x] 11.1 `AdvancesModule` at `apps/api/src/advances/` (controller + service); wired into `AppModule`. Endpoints: `POST /advances`, `GET /advances`, `GET /advances/:id`, `PATCH /advances/:id`, `DELETE /advances/:id`
- [x] 11.2 Role gates: `POST` & `PATCH` (OWNER, ACCOUNTANT); `DELETE` (OWNER). Verified STAFF gets 403 on POST and DELETE
- [x] 11.3 `assertEditable()` rejects `PATCH` and `DELETE` with `409 ADVANCE_LOCKED` whenever `isDeducted=true` OR `payrollRunId` is set. Verified by flipping `isDeducted` directly in Postgres and re-attempting both
- [ ] 11.4 e2e tests — **deferred** (same as 5.13 / 6.8 / 9.7: supertest config not yet wired). Manual smoke replaces for now
- [x] 11.5 `/advances` `AdvancesList` — employee dropdown (active employees), deduction month select, deduction year input. Empty/error/loading states. Edit/Delete links hidden when locked (see 11.7)
- [x] 11.6 `/advances/new` `NewAdvance` — RHF + `zodResolver(CreateAdvanceSchema)`, defaults to today/this-month in IST. Inline employee `<select>`. Visible to OWNER/ACCOUNTANT; STAFF/MANAGER hit 403 on submit. Plus `/advances/:id/edit` `EditAdvance` page that pre-populates and shows a "locked" notice instead of the form when the advance has been linked to a payslip
- [x] 11.7 Edit/Delete row buttons in the list are gated on `!isDeducted && !payrollRunId`; PII-style "deducted" badge shown on locked rows. Edit page also blocks render when the loaded advance is locked
- [x] 11.8 API smoke verified end-to-end (10 curl probes via `/api/v1`): OWNER create, list with `?employeeId=&isDeducted=false` filter, PATCH (deductionMonth 4→5), STAFF POST 403, STAFF DELETE 403, numeric amount → 400 VALIDATION_ERROR, unknown employeeId → 400, GET by id, OWNER DELETE 204, GET-after-delete 404, locked advance: PATCH 409 ADVANCE_LOCKED + DELETE 409 ADVANCE_LOCKED. Web typecheck (`tsc --noEmit`) and `vite build` clean. Visual 360-wide-viewport verification owed (same as 8.8 / 10.9)

## 12. Payroll Calculator (Tests First)

- [x] 12.1 `apps/api/src/payroll/__tests__/calculator.spec.ts` — 18 row-matrix tests + version-string + `notEmployed`-when-left-before-period (20 tests total). All assertions use `Decimal.toFixed(2)` strings (and one `toFixed(10)` for the float-drift row 18)
- [x] 12.2 `__tests__/fixtures.ts` — single `buildInput(overrides?)` helper with sensible defaults (full April 2026, 15000 basic + 1500 hra + one travel allowance + one PT deduction, no advances, no OT). Each test patches only what it cares about
- [x] 12.3 `apps/api/src/payroll/calculator.ts` exports `calculatePayslip(input): PayslipOutput` (pure — no DB / I/O / `Date.now()`) and `CALCULATOR_VERSION = 'v1.0.0'`
- [x] 12.4 Step 1: `computeDaysPayable()` uses `Date.UTC(year, month-1, …)` for the period bounds (no TZ math), takes `max(monthStart, dateOfJoining)` / `min(monthEnd, dateOfLeaving ?? +∞)`, and returns 0 when the period is empty. `zeroOutput()` returns `notEmployed: true` plus zero earnings (with fixedDeductions still surfaced)
- [x] 12.5 Step 2: `perDay = basicSalary.div(daysPayable)` (Decimal division, no rounding until output). 18-row covers the 1500/30 = 50 → ×22 = 1100.00 exact case
- [x] 12.6 Step 3: `daysWorked = present + paidLeave + holiday + halfDay * 0.5`, clamped via `Decimal.min(_, daysPayable)`. Holiday is included to satisfy row 14 ("holidays don't reduce pay"); the formula in CLAUDE.md/PAYROLL.md omits `holiday` but the comment on the same line makes the intent unambiguous — a header comment in `calculator.ts` records the decision
- [x] 12.7 Step 4: `basicEarned = perDay × daysWorked`; `hraEarned = hra × proration` (`proration = daysWorked / daysPayable`); allowances per-line respect `alwaysFull` (full vs. × proration); `otAmount = overtimeHours × (perDay / hoursPerDay) × otMultiplier` with `hoursPerDay` defaulting to 8. Verified at 1.5× (937.50) and 2.0× (1250.00)
- [x] 12.8 Step 5: `fixedDeductionsTotal` not pro-rated. Advances applied FIFO: `min(advance.amount, availableForAdvance)`; if `availableForAdvance ≤ 0` the entire advance carries forward; partial-apply pushes only the remainder to `carriedForward`. Verified: row 10 (5000 vs 3000 gross → 3000 applied + 2000 carry), row 11 (two 3000s vs 4000 gross → first full + second partial-with-carry)
- [x] 12.9 Step 6: `netPay = max(grossEarnings - totalDeductions, 0)` via `Decimal.max(_, 0)`. Verified row 5 (all-absent: gross 0, fixedDeductions 200, netPay clamped to 0.00)
- [x] 12.10 Step 7: every output money value passes through `ROUND_2` (`toDecimalPlaces(2, Decimal.ROUND_HALF_EVEN)`); intermediates stay full-precision. Row 18's `toFixed(10)` assertion proves no float drift accumulates
- [x] 12.11 `pnpm --filter @myfactorydesk/api test` green: 5 suites / 41 tests pass (20 calculator + 9 attendance aggregate + 8 employees emp-code/pii + 4 crypto). Typecheck and `nest build` both clean
- [x] 12.12 CALCULATOR_VERSION bump policy is the file's header doc — patch for invariant-preserving fixes (rounding, defensive clamps), minor for changed business rules. Frozen `Payslip.calculatorVersion` + `inputsJson` make the audit-replay possible without re-running history

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
