# Paper Plates Manufacturing & Sales App

> This file is read automatically by Claude Code at the start of every session. Keep it updated as the project evolves.

## Project Overview

A multi-location, mobile-first business management application for a paper plates manufacturing and sales business. Built as a PWA (Progressive Web App) so it installs on phones, tablets, and desktops without app store hassle.

**Business context:**
- Manufactures paper plates in multiple sizes (6", 8", 10", 12", etc.)
- Sells to wholesalers, retailers, and direct customers
- Has factory staff, sales staff, and management
- Operates in India — GST compliance is required (CGST/SGST/IGST, HSN codes)
- Currency: INR (₹). Locale: `en-IN`. Timezone: `Asia/Kolkata` (IST).

## Modules (in priority order)

1. **Staff & Payroll** ← v1 focus
2. Sales, Purchase & Billing (with GST)
3. Raw Material & Production tracking
4. Reports & Dashboard

Build module 1 completely before starting module 2. Resist scope creep.

## V1 Scope — Lock This Down

V1 ships when these work end-to-end on mobile:

- [ ] Phone + password login with JWT (access + refresh)
- [ ] Role-based access: `OWNER`, `MANAGER`, `STAFF`, `ACCOUNTANT`
- [ ] Employee CRUD (master data)
- [ ] Daily attendance bulk-marking screen (P / A / HD / L buttons per employee)
- [ ] Monthly attendance view per employee
- [ ] Advance/loan entry per employee
- [ ] Monthly payroll run: draft → preview → finalize → mark paid
- [ ] Payslip PDF generation + download/share
- [ ] Deployed to staging URL, accessible from a phone

**Explicitly OUT of v1** (do not build, even if tempted):
- Biometric/geo-fenced attendance
- Multi-shift complexity
- Leave approval workflows
- Overtime auto-calculation from punch times (manual OT hours entry only in v1)
- PF/ESI/TDS auto-calculation (use flat configurable deductions)
- Sales / billing / inventory / production (those are later modules)

## Tech Stack

| Layer | Choice | Why |
|---|---|---|
| Backend framework | **NestJS** (TypeScript) | Module structure, DI, guards, validation, OpenAPI |
| ORM | **Prisma** | Type-safe, great migrations, clean schema file |
| Database | **PostgreSQL 16** | Decimal math, reliable, free |
| Cache / queue | **Redis** + **BullMQ** | Background jobs (payroll runs, PDF generation) |
| Frontend | **Vite + React + TypeScript** as **PWA** | Mobile-first, installable, one codebase |
| UI | **Tailwind CSS + shadcn/ui** | Mobile-friendly components, fully customizable |
| Forms | **React Hook Form + Zod** | Schemas shared with backend |
| Server state | **TanStack Query** | Caching, refetching, optimistic updates |
| Auth | **JWT** (access 15m / refresh 7d) | Standard, works on mobile |
| PDF | **Puppeteer** | Render HTML payslip template to PDF |
| Validation | **Zod** everywhere | Single source of truth for shapes |
| Money math | **decimal.js** + Prisma `Decimal` | Never float for money |
| Dates | **date-fns** + **date-fns-tz** | IST timezone handling |
| Package manager | **pnpm** workspaces | Fast, efficient monorepo |
| Container | **Docker Compose** (dev) | Postgres + Redis locally |
| Hosting | Backend on Railway/Render, Frontend on Vercel | Cheap to start, scales fine |

## Repository Layout (Monorepo)

```
paper-plates/
├── apps/
│   ├── api/              # NestJS backend
│   └── web/              # Vite + React PWA
├── packages/
│   └── shared/           # Zod schemas, TS types shared across apps
├── docker-compose.yml    # postgres + redis for local dev
├── pnpm-workspace.yaml
├── package.json
├── CLAUDE.md             # this file
└── README.md             # human setup instructions
```

## Critical Engineering Rules

These are non-negotiable. Violating them causes real bugs in payroll/billing.

### Money
- Always `Decimal` in DB (`@db.Decimal(12, 2)` in Prisma).
- Always `decimal.js` in code. **Never** plain `number` arithmetic on money.
- Display formatting: `Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' })`.

### Dates & Time
- Store timestamps as UTC.
- Store calendar dates (like attendance day) as `DATE` (no time component).
- Convert to IST (`Asia/Kolkata`) for display and for "which month does this attendance belong to" decisions.
- Attendance API accepts date strings like `"2026-04-25"`, never timestamps.

### Validation
- Every controller validates input with Zod schemas from `packages/shared`.
- Past the controller boundary, services trust their inputs.
- Never trust client-sent IDs for ownership — always re-check on the server.

### Database
- All money columns: `Decimal(12, 2)`.
- All status fields: Prisma enums.
- All foreign keys: indexed.
- Soft-delete employees (set `dateOfLeaving`, `isActive=false`); never hard-delete records that have payroll history.
- Use transactions (`prisma.$transaction`) for any multi-row write (bulk attendance marking, payroll run finalization).

### Auth
- Passwords: `bcrypt` with cost factor 12.
- JWTs signed with secret from env, never hardcoded.
- Role check via NestJS guard on every protected route.
- PAN and Aadhaar stored encrypted (AES-GCM, key from env). Never log them.

### Errors
- Global exception filter returning `{ error: { code, message, details? } }`.
- Use specific HTTP codes (400 validation, 401 auth, 403 forbidden, 404 not found, 409 conflict).
- Never leak internal stack traces to API responses in production.

### Tests
- Payroll calculator: **mandatory** unit tests. This is the highest-risk code in the system.
- Auth flows: integration tests.
- CRUD endpoints: smoke tests are fine.

## Domain Model — V1 Tables

See `packages/shared/src/schemas/` for Zod versions. The Prisma schema is the source of truth.

- `User` — login credentials, role, optional link to Employee
- `Employee` — master record, salary structure (basic, hra, allowances JSON, deductions JSON)
- `Attendance` — one row per (employee, date) with status enum
- `Advance` — loans/advances given, with `deductionMonth`/`deductionYear` for scheduling
- `PayrollRun` — one per (month, year), states: DRAFT → FINALIZED → PAID
- `Payslip` — one per (PayrollRun, Employee), all calculated values frozen on finalize

See `docs/SCHEMA.md` (to be created) for the full Prisma schema.

## Payroll Calculation — The Core Logic

The calculator must be a **pure function** in `apps/api/src/payroll/calculator.ts`. No DB calls, no side effects. Inputs in, outputs out. This makes it trivial to unit test.

### Inputs (per employee, per month)
- `basicSalary`, `hra`, `allowances` (JSON), `deductions` (JSON, fixed)
- `daysInMonth` (28 / 29 / 30 / 31)
- `attendanceCounts`: `{ present, halfDay, paidLeave, unpaidLeave, absent, holiday }`
- `overtimeHours`
- `otMultiplier` (default 1.5)
- `advancesScheduled` (array of `{ id, amount }` for this month)
- `dateOfJoining`, `dateOfLeaving` (for proration)

### Calculation steps
```
perDay = basicSalary / daysInMonth
daysWorked = present + paidLeave + (halfDay * 0.5)   // holidays don't reduce pay
basicEarned = perDay * daysWorked
hraEarned = hra * (daysWorked / daysInMonth)         // pro-rated
allowancesTotal = sum(allowances pro-rated by daysWorked / daysInMonth)
otAmount = overtimeHours * (perDay / 8) * otMultiplier
grossEarnings = basicEarned + hraEarned + allowancesTotal + otAmount

advanceDeducted = min(sum(advancesScheduled), grossEarnings - fixedDeductions)
                  // never let netPay go below 0; carry remainder to next month
totalDeductions = sum(fixedDeductions) + advanceDeducted
netPay = grossEarnings - totalDeductions
```

### Edge cases the tests MUST cover
- Joined mid-month (pro-rate based on `dateOfJoining`)
- Left mid-month (pro-rate based on `dateOfLeaving`)
- Zero days present (all absent → near-zero gross, deductions still apply but clamp net ≥ 0)
- Half-days only (multiple half-days sum correctly)
- Advance > available — carry forward to next month
- February (28/29 days)
- Per-allowance "always pay full" flag (some allowances aren't pro-rated)

### State machine for PayrollRun
```
DRAFT  ── finalize() ──► FINALIZED ── markPaid() ──► PAID
  ▲                          │
  └── editable               └── read-only after this point
```
Once `FINALIZED`, no payslip in that run can be edited. Only owner role can finalize. Document this in the API.

## Build Order — Week by Week

### Week 1: Foundation
- `pnpm init` workspaces; scaffold `apps/api` (NestJS) and `apps/web` (Vite React)
- `docker-compose.yml` with Postgres 16 + Redis 7
- Prisma schema for `User` + `Employee` only; first migration
- Auth module: phone + password login → JWT; refresh endpoint; role guard
- Employee CRUD endpoints + simple admin UI
- **Deploy to Railway/Render + Vercel by end of week.** This is non-negotiable. Most solo projects die because deploy is left to the end.

### Week 2: Attendance
- `Attendance` model + migration
- `POST /attendance/bulk` — mark many employees for one date in a transaction
- `GET /attendance?from=&to=&employeeId=` — range query
- `GET /attendance/summary?month=&year=` — aggregated counts per employee
- Mobile UI: single-screen daily marking with P/A/HD/L row buttons
- Per-employee monthly calendar view

### Week 3: Payroll (the hard one)
- `Advance` model + CRUD
- Payroll calculator (pure functions) + comprehensive Jest tests **before** any UI
- `PayrollRun` + `Payslip` models
- API: `POST /payroll/runs` (creates DRAFT), `GET /payroll/runs/:id/preview`, `POST /payroll/runs/:id/finalize`, `POST /payroll/runs/:id/mark-paid`
- Puppeteer payslip PDF generation (HTML template → PDF)
- UI: payroll run wizard

### Week 4: Polish + Real Use
- Advance entry mobile screen
- Payslip download / WhatsApp share (use `wa.me/<number>?text=<link>`)
- Bug fixes from real-world test
- **Run one real payroll on actual factory data.** Bugs you find here are the ones that matter.

## API Conventions

- Base path: `/api/v1`
- All responses: `{ data: T }` on success, `{ error: { code, message, details? } }` on failure
- Pagination: `?page=1&pageSize=20`, response includes `meta: { total, page, pageSize, totalPages }`
- Dates in JSON: ISO 8601 strings (`"2026-04-25"` for date-only, `"2026-04-25T14:30:00Z"` for timestamps)
- Money in JSON: strings (e.g., `"15000.50"`) to avoid float issues. Parse with decimal.js client-side.
- Empty arrays return `[]`, not `null`.

## Environment Variables

Create `.env.example` with all keys documented. Real `.env` is git-ignored.

```
# Backend (apps/api/.env)
DATABASE_URL=postgresql://app:app@localhost:5432/paperplates
REDIS_URL=redis://localhost:6379
JWT_ACCESS_SECRET=<random 32-byte hex>
JWT_REFRESH_SECRET=<random 32-byte hex>
JWT_ACCESS_TTL=15m
JWT_REFRESH_TTL=7d
ENCRYPTION_KEY=<random 32-byte hex>  # for PAN/Aadhaar
NODE_ENV=development
PORT=3000
CORS_ORIGIN=http://localhost:5173

# Frontend (apps/web/.env)
VITE_API_URL=http://localhost:3000/api/v1
```

## Definition of Done (per feature)

A feature is "done" only when:
- [ ] Zod schema in `packages/shared`
- [ ] Backend endpoint with validation + auth guard
- [ ] At least smoke-test coverage; payroll math has thorough unit tests
- [ ] Frontend UI works on a 360px-wide phone viewport
- [ ] Loading + error states in the UI
- [ ] OpenAPI/Swagger doc auto-generated
- [ ] Deployed to staging and manually tested from a real phone
- [ ] Updated relevant section of `CLAUDE.md` if architecture changed

## How to Work With Claude Code on This Project

When asking Claude Code to do something, be specific. Examples:

**Good:**
- "Add the `Advance` Prisma model and migration per `CLAUDE.md` §Domain Model. Then add CRUD endpoints under `/api/v1/advances` with role guards: OWNER/ACCOUNTANT can create, all roles can read."
- "Write Jest tests for `calculatePayslip()` covering all edge cases listed in `CLAUDE.md` §Payroll. Use the existing test fixture pattern in `apps/api/src/payroll/__tests__/`."

**Bad:**
- "Build the payroll feature."
- "Make it work on mobile."

Always reference the relevant section of this file. If something is ambiguous, Claude Code should ask before coding.

## Open Decisions

Things to decide as you go (don't block v1 on these):
- Multi-tenancy — single business for now; if expanding to multiple factories, add `tenantId` everywhere
- Audit log table — defer to v1.1 unless a specific compliance need surfaces
- File uploads (employee photos, ID proofs) — use Cloudflare R2 in v1.1
- Localization (Hindi/Odia UI) — v1 is English; revisit after first cycle of real use
