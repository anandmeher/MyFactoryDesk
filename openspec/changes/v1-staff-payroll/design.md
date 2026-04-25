## Context

This is a greenfield V1 for a single-business paper plates manufacturer in India. The user is a solo developer running it for one factory; it must work on a 360px Android phone over flaky 4G, and the first real users are factory staff who are not power users. The build deadline is "before next monthly payroll cycle" — explicit in `CLAUDE.md` Week 4 ("Run one real payroll on actual factory data").

Currently the repo contains only documentation (`CLAUDE.md`, `README.md`, `PAYROLL.md`, `PROMPTS.md`) and the OpenSpec scaffold. There is no prior code, no migrations, no users — every constraint here is forward-looking.

**Key constraints inherited from `CLAUDE.md`:**
- Currency INR, locale `en-IN`, timezone `Asia/Kolkata` (IST). Server may run in UTC; UI must always render IST.
- Money math is `Decimal` end-to-end. Plain `number` arithmetic on money is a defect.
- PAN and Aadhaar are PII and must be encrypted at rest with AES-GCM.
- Payroll calculator is the highest-risk code; it gets unit tests **before** implementation.
- Once a `PayrollRun` is `FINALIZED`, payslips in it are immutable.
- Multi-tenancy, audit log, file uploads, and PF/ESI/TDS auto-calc are explicitly **out** of V1.

**Stakeholders:**
- **Owner** (single user with full access — finalizes payroll, sees PII).
- **Manager** (marks attendance, edits employees, no payroll finalize).
- **Accountant** (reads payroll, marks paid, creates draft runs).
- **Staff** (read-only view of own data — minimal in V1).

## Goals / Non-Goals

**Goals:**
- Ship one usable PWA covering login → employees → attendance → advances → payroll run → payslip PDF on a phone.
- Make the payroll calculator provably correct via TDD on the 18-row test matrix in `PAYROLL.md`.
- Make every endpoint validate input with the same Zod schemas the web uses (single source of truth in `packages/shared`).
- Get to a deployed staging URL in week 1 so deploy is not the deathbed of the project.
- Keep historical payslips replay-able via frozen `calculatorVersion` + JSON snapshot of inputs.

**Non-Goals:**
- Multi-tenancy / multi-factory support. (Single business in V1; would require `tenantId` everywhere — punted.)
- Biometric/geo-fenced attendance, multi-shift, leave-approval workflows.
- Auto-computed PF/ESI/TDS — modeled as flat `fixedDeductions` rows so v1.1 can add real logic without schema churn.
- Sales / billing / production / inventory modules.
- Offline-first attendance marking. PWA is installable but assumes network for writes; offline write queue is a v1.1 candidate.
- Localization (Hindi/Odia). English-only in V1; revisit after first real cycle.
- File uploads (employee photos, ID-proof scans) — Cloudflare R2 in v1.1.

## Decisions

### D1. Monorepo with pnpm workspaces, not separate repos
**Choice:** `apps/api`, `apps/web`, `packages/shared` in one pnpm workspace.
**Why:** Solo dev. The Zod schemas in `packages/shared` are the contract between API and web; co-locating them in one repo means a schema change on the API side immediately propagates type errors to the web build. Splitting repos would force versioning the shared package — too much ceremony for one developer.
**Alternatives:** Nx (overkill for 2 apps + 1 lib), Turborepo (fine, but pnpm scripts suffice for the V1 size), separate repos (rejected: contract drift risk).

### D2. NestJS for the API, not bare Express/Fastify
**Choice:** NestJS with `@nestjs/swagger`, global `ValidationPipe`, global exception filter, `@Roles()` + `RolesGuard`.
**Why:** The auth+roles+validation pattern is repeated on every endpoint; NestJS's DI + guards + decorators express that in 2 lines per route. Auto-generated OpenAPI at `/api/docs` is required by the V1 Definition of Done.
**Alternatives:** Express + manual middleware (more boilerplate, no first-class OpenAPI), Fastify (faster but smaller ecosystem of payment-related libs), Hono/elysia (too new for a payroll system).

### D3. Prisma ORM, not raw SQL or TypeORM
**Choice:** Prisma with `schema.prisma` as the source of truth; migrations checked in.
**Why:** Type-safe queries, clean migration story, `Decimal` field type maps to `decimal.js`, painless `prisma.$transaction` for the bulk-attendance and finalize-payroll multi-row writes.
**Alternatives:** Drizzle (fine, but Prisma's `Decimal` ergonomics for money are better), TypeORM (decorator-based migrations are brittle), raw `pg` (too much boilerplate for V1 scope).

### D4. Calendar dates stored as `@db.Date`, timestamps as UTC `DateTime`
**Choice:** `Attendance.date`, `Advance.date`, `Employee.dateOfJoining`, `Employee.dateOfLeaving`, `PayrollRun` month-anchor → `@db.Date`. Everything else (`createdAt`, `updatedAt`, `finalizedAt`) → `DateTime` stored UTC.
**Why:** Attendance for "2026-04-25" must mean April 25 in IST regardless of where the server runs. Storing as `DATE` removes any time-of-day ambiguity. API accepts/returns `"YYYY-MM-DD"` strings for these fields and ISO timestamps for the rest. All business-logic month math goes through `date-fns-tz` with zone `"Asia/Kolkata"`.
**Alternatives:** Store everything as UTC timestamp at midnight IST (lossy and confusing), store everything as string (no DB-level constraints).

### D5. Payroll calculator is a pure function, no DB access
**Choice:** `calculatePayslip(input: PayslipInput): PayslipOutput` lives in `apps/api/src/payroll/calculator.ts`. No Prisma, no `Date.now()`, no env reads. The DB-touching wrapper is `PayrollService`.
**Why:** This is the highest-risk code in the system per `CLAUDE.md` §Tests. Pure functions are trivially unit-testable; the 18-row test matrix in `PAYROLL.md` becomes 18 tests with no fixtures, no mocks. It also enables replay: feed the frozen JSON inputs of an old payslip through the same `calculatorVersion` and reproduce the exact output.
**Alternatives:** Calculator as a service method (couples it to DB; tests need mocks; replay is harder).

### D6. Proration divides by `daysPayable`, not `daysInMonth`
**Choice:** `perDay = basicSalary / daysPayable` where `daysPayable = daysBetween(max(monthStart, dateOfJoining), min(monthEnd, dateOfLeaving ?? monthEnd)) + 1`.
**Why:** An employee who joins on the 15th of a 30-day month and works all 16 remaining days should earn the **full** monthly salary for those 16 days, not 16/30ths of it. `PAYROLL.md` is explicit on this. The test matrix verifies the join-mid-month case against this expectation.
**Alternatives:** Divide by `daysInMonth` (simpler but wrong for join/leave mid-month per the business rule).

### D7. Advances applied FIFO with carry-forward, never let `netPay < 0`
**Choice:** Iterate `advancesScheduled` in insertion order. For each, take `min(advance.amount, availableForAdvance)`. The unconsumed remainder gets re-scheduled to the next month on `finalize()` (DB write happens in the service, not the calculator).
**Why:** Predictable for the staff who took the advance ("the oldest one comes off first"); also keeps `netPay >= 0` which is a hard rule per `CLAUDE.md`.
**Alternatives:** Pro-rate across all advances (less predictable), let net go negative (illegal in practice; staff don't owe the company).

### D8. AES-GCM for PAN/Aadhaar with key from `ENCRYPTION_KEY` env
**Choice:** Encrypt at the service layer before write; decrypt only on read by OWNER role; never log the plaintext. Use Node's built-in `crypto.createCipheriv('aes-256-gcm', ...)` — no extra deps. Store as `iv:tag:ciphertext` (all base64url) in a single string column.
**Why:** PAN and Aadhaar are regulated PII in India. AES-GCM is authenticated, so tampering is detectable. Single-key for V1 keeps complexity down; key rotation is a v1.1 problem (would need a `keyId` prefix on stored values).
**Alternatives:** pgcrypto (pushes key into DB connection layer, harder to rotate), client-side encryption (defeats search/list).

### D9. JWT in `localStorage` on web, with refresh-once on 401
**Choice:** Access token (15m) and refresh token (7d) both in `localStorage`. Axios interceptor attaches `Authorization: Bearer <access>` and on 401 retries the original request once after a `POST /auth/refresh` call. If refresh fails, redirect to `/login`.
**Why:** PWA on iOS Safari has flaky 3rd-party-cookie behavior; HttpOnly cookies require backend on the same domain as the web app, which is a deploy constraint we can't promise (web on Vercel, API on Railway). `localStorage` is XSS-vulnerable; mitigation is a strict CSP and no untrusted third-party JS in the bundle.
**Alternatives:** HttpOnly cookies + same-origin proxy (more deploy ops), in-memory only (poor UX — re-login on every reload), session cookies (incompatible with mobile install / standalone PWA quirks).

### D10. Puppeteer for PDF, sync if <2s else BullMQ
**Choice:** First implementation is synchronous: `GET /payslips/:id/pdf` launches Puppeteer, renders the HTML template, returns the PDF buffer. If P95 latency exceeds ~2s in real use, move to BullMQ with a job-status endpoint.
**Why:** A single payslip PDF is small; one Chromium render is ~1–2s on warm machines. Adding BullMQ on day one means a queue, a worker process, polling UI, and infra cost — premature for V1's expected load (≤30 employees per month).
**Alternatives:** wkhtmltopdf (less Node-native, harder templating), client-side PDF generation (can't sign / can't render server-only data).

### D11. Tailwind + shadcn/ui for the PWA
**Choice:** Vite + React + TS, Tailwind for utility classes, shadcn/ui for button/input/dialog/etc. (copied into the repo, not a dep). PWA via `vite-plugin-pwa` with default Workbox config.
**Why:** shadcn components are owned (we copy them in) — no breaking-change tax from a UI lib. Tailwind makes 360px-first responsive layout fast. `vite-plugin-pwa` gives an installable manifest + service worker with one config block.
**Alternatives:** Material UI / Chakra (heavier, less customizable for "thumb-sized buttons"), Next.js (overkill — no SSR/SEO need for an internal tool), Capacitor wrapper (premature; PWA install covers V1).

### D12. Single source of truth for shapes is `packages/shared`
**Choice:** Every Zod schema lives in `@paper-plates/shared`. The API uses `nestjs-zod` to validate; the web uses `@hookform/resolvers/zod` and `axios` typed off `z.infer<>`. Money is `z.string().regex(/^\d+(\.\d{1,2})?$/)`; date-only is `z.string().regex(/^\d{4}-\d{2}-\d{2}$/)`.
**Why:** Prevents the classic "frontend says one shape, backend rejects with 400" drift. Money-as-string at the wire boundary avoids JS float bugs.
**Alternatives:** OpenAPI-driven codegen (slower iteration), TypeScript-only shared types (no runtime validation).

### D13. Calculator versioning, frozen inputs on finalize
**Choice:** When a `PayrollRun` is finalized, every `Payslip` row stores `calculatorVersion: "v1.0.0"` and `inputsJson` (the exact `PayslipInput` it was computed from). Bump `calculatorVersion` whenever the math changes; never recalculate historical payslips silently.
**Why:** Pre-empts the "why does last March's payslip read differently now?" argument that destroys trust.
**Alternatives:** Recompute on read (terrifying — math drift is invisible), no audit JSON (bug repros impossible).

### D14. State machine for `PayrollRun` enforced at the service layer
**Choice:** `DRAFT → FINALIZED → PAID`. Each transition is its own endpoint (`finalize`, `markPaid`). Any write to a payslip in a non-`DRAFT` run returns `409 CONFLICT` with code `RUN_FINALIZED`. The transition itself is wrapped in `prisma.$transaction`.
**Why:** Encoded in the API surface (separate endpoints per transition) makes role-gating trivial — only OWNER hits `finalize`. Idempotency on `POST /runs` (returns existing run for the same month/year) prevents accidental duplicate runs.

### D15. CI gates: lint + typecheck + tests on every PR; main → staging
**Choice:** GitHub Actions: `pnpm lint && pnpm typecheck && pnpm -r test`. On merge to `main`, deploy API to Railway and web to Vercel. No manual deploy step.
**Why:** Solo dev means there's no second pair of eyes; CI is the only gate. Auto-deploy to staging means "is it live?" is never blocked on the dev's attention.

## Risks / Trade-offs

- **Puppeteer on Railway/Render** → Chromium adds ~250MB to the image and cold-starts slow. Mitigation: keep API on a long-lived dyno; if cold-start PDFs become an issue, move PDF generation to a dedicated worker on Railway (still cheap) or precompute on finalize.
- **`localStorage` JWT** → XSS exfiltrates the token. Mitigation: strict CSP (`script-src 'self'`), no third-party scripts in V1, sanitize all user-rendered text. Accept the residual risk; revisit when bringing in any third-party widget.
- **IST timezone bugs** → server in UTC, business in IST. A test that passes locally can fail in prod if dates are formatted in the server's timezone. Mitigation: ban `new Date(...)` for business-date math — only `date-fns-tz` with explicit zone. Add a CI lint rule for `toLocaleDateString` without an explicit `'en-IN'` + `Asia/Kolkata`. Add an integration test that runs with `TZ=UTC` env to ensure attendance "2026-04-25" still belongs to April 2026.
- **`decimal.js` precision creep** → intermediate divides can produce 30 decimal places. Mitigation: keep all intermediates as `Decimal`, round only at the **output boundary** with `Decimal.ROUND_HALF_EVEN`. The calculator tests assert exact `toFixed(2)` strings.
- **`ENCRYPTION_KEY` rotation** → if the env var is ever rotated without re-encryption, every PAN/Aadhaar becomes unreadable. Mitigation for V1: document loudly in the README that the key must not change once production data exists; v1.1 adds a `keyId` prefix and rotation migration script.
- **Single-row `PayrollRun(month, year)` uniqueness** → an accidental duplicate `POST /runs` in DRAFT could create two drafts. Mitigation: unique constraint at the DB level + service returns existing on conflict.
- **Soft-delete + payroll history** → soft-deleted employees still appear in old payslips (correct), but care needed in attendance and employee list endpoints to filter `isActive=true` by default. Mitigation: every list endpoint takes an explicit `active` filter param; default `true`.
- **Test scope creep** → the temptation is to write E2E tests for every endpoint. Mitigation: payroll calculator gets exhaustive unit tests, auth flows get e2e, everything else gets a smoke test only — explicit per `CLAUDE.md` §Tests.

## Migration Plan

This is a greenfield V1, so "migration" is "fresh deploy". No existing data to migrate.

**Deploy sequence (matches `CLAUDE.md` Build Order weeks):**
1. **Week 1 end:** API + web deployed to staging URLs with auth + employee CRUD working. This is the milestone that proves deploy infra works.
2. **Week 2 end:** Attendance endpoints + UI on staging.
3. **Week 3 end:** Payroll endpoints + payslip PDF on staging.
4. **Week 4:** Real payroll run on actual factory data. Bugs found here are V1's exit criteria — fix and ship.

**Rollback strategy:**
- Each deploy is a Vercel + Railway deploy that pins a commit SHA; rollback = redeploy previous SHA from the dashboard.
- Prisma migrations are forward-only by convention; if a migration is bad, fix forward with a new migration. No `prisma migrate reset` in production.
- For the first month after V1 ships, take a daily Postgres backup (Railway has this built in).

## Open Questions

- **Where is staging hosted exactly?** Railway is the working assumption for the API; Vercel for the web. Confirm before the Week-1 milestone — Render is an acceptable fallback if Railway pricing changes.
- **Which phone numbers are seeded as test users?** Currently the seed creates one OWNER (`9999999999` / `changeme`). Real users are owner + 1 manager + 1 accountant — collect real (non-personal) numbers from the factory before going live.
- **WhatsApp share UX**: `wa.me/<phone>?text=<link>` requires the payslip URL to be publicly accessible (or the recipient must be logged in). For V1 the link points to a logged-in route; staff get the PDF as an attachment via WhatsApp directly from the owner's phone. A signed, time-limited public URL is a v1.1 candidate.
- **Holiday calendar**: V1 treats `holiday` as an attendance status the marker selects manually (i.e., on Diwali everyone's row is set to `holiday`). A factory-wide holiday list that auto-marks the day is deferred — collect feedback after the first real month.
- **`fixedDeductions` UX**: Currently set per-employee on the Employee record. If most employees share the same deductions (e.g., a flat ₹500 PT), a "deduction template" feature might be added in V1.1. Defer until real users complain.
