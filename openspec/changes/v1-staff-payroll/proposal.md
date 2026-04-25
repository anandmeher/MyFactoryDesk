## Why

The paper plates manufacturing business currently has no system for staff and payroll management. Owner/manager need to track daily attendance, advances, and run monthly payroll for factory staff from their phones. V1 delivers an end-to-end Staff & Payroll module — installable as a PWA — so the first real payroll run can happen on actual factory data and de-risk the rest of the roadmap (sales/billing, production, reports) by proving the foundation.

This change covers the full V1 scope locked down in `CLAUDE.md` (the 12 sequential prompts in `PROMPTS.md`). It is intentionally large because every piece is mutually dependent: payroll needs employees + attendance + advances + auth; the PWA needs every backend endpoint to be useful on mobile.

## What Changes

- Stand up a pnpm monorepo with `apps/api` (NestJS), `apps/web` (Vite + React PWA), and `packages/shared` (Zod schemas/types).
- Provision local dev infra via `docker-compose.yml` (Postgres 16 + Redis 7) and document env vars in `.env.example` files.
- Define the V1 Prisma schema (User, Employee, Attendance, Advance, PayrollRun, Payslip) with first migration.
- Ship `@myfactorydesk/shared` Zod schemas as the single source of truth for request/response shapes (consumed by both API and web).
- Build phone+password JWT auth (15m access / 7d refresh) with role-based guards (`OWNER`, `MANAGER`, `STAFF`, `ACCOUNTANT`).
- Build Employee CRUD with auto-generated `empCode`, AES-GCM encryption for PAN/Aadhaar, and soft-delete (never hard-delete records with payroll history).
- Build Attendance: bulk daily marking in a single transaction, range query, monthly summary aggregation — all IST-aware.
- Build Advances CRUD with `deductionMonth`/`deductionYear` scheduling.
- Build the payroll calculator as a **pure function** with comprehensive unit tests written **before** the implementation (TDD-mandated for this module per CLAUDE.md §Tests).
- Build the PayrollRun state machine: `DRAFT → FINALIZED → PAID`, with idempotent preview, transactional finalize, and frozen calculator-version audit trail.
- Generate payslip PDFs via Puppeteer from an HTML template; download + WhatsApp-share via `wa.me/<phone>?text=<link>`.
- Build the React PWA shell (installable, mobile-first, 360px viewport) with routes for login, dashboard, employees, attendance (daily-mark + monthly calendar + summary), advances, and payroll (runs list + preview + payslip detail).
- Wire global error filter, global ValidationPipe, OpenAPI/Swagger at `/api/docs`, and CORS for the web origin.
- Seed an OWNER user (`9999999999` / `changeme`) and 3 sample employees so the system is usable end-to-end on first boot.

## Capabilities

### New Capabilities

- `platform-foundation`: pnpm workspace layout, Docker Compose for Postgres+Redis, Prisma schema for V1 entities, `@myfactorydesk/shared` Zod package, `.env.example` contracts, NestJS bootstrap (global prefix `/api/v1`, ValidationPipe, exception filter, Swagger).
- `auth`: phone+password login with bcrypt(12), JWT access (15m) + refresh (7d) issuance/rotation/logout, JWT strategy + auth guard, `@Roles()` + roles guard, `@CurrentUser()` decorator, standard error codes (`INVALID_CREDENTIALS`, `TOKEN_EXPIRED`, `INVALID_TOKEN`).
- `employees`: Employee master CRUD with auto `empCode` (`EMP{YYYY}{0001}`), encrypted PAN/Aadhaar (AES-GCM, key from env), soft-delete (`isActive=false`, `dateOfLeaving=today`), pagination + search + active-filter, role-scoped writes (OWNER/MANAGER), OWNER-only delete, OWNER-only PII decryption.
- `attendance`: `POST /attendance/bulk` upserts many `(employeeId, date)` rows in one transaction; range `GET` and monthly summary `GET`; IST-anchored "which month does this belong to" logic; manual overtime hours per row.
- `advances`: Advance/loan CRUD with money as `Decimal(12,2)`, scheduling via `deductionMonth`/`deductionYear`, FIFO consumption ordering, `isDeducted` flag toggled on payroll finalize.
- `payroll-calculation`: Pure-function `calculatePayslip(input) → output` in `apps/api/src/payroll/calculator.ts`; no DB / no `Date.now()` / no I/O; full math per `PAYROLL.md` (proration by `daysPayable`, half-day weighting, OT formula, FIFO advance application with carry-forward, banker's rounding at output boundary); comprehensive Jest tests covering all 18 rows of the test matrix written **before** implementation.
- `payroll-runs`: `PayrollRun` state machine `DRAFT → FINALIZED → PAID`; `POST /runs` is idempotent on `(month, year)`; `GET /runs/:id/preview` recomputes without writing; `POST /runs/:id/finalize` (OWNER only) wraps payslip insert + advance linking + carry-forward reschedule in `prisma.$transaction` and freezes `calculatorVersion`; `409 CONFLICT` on edit attempts post-finalize.
- `payslip-pdf`: HTML payslip template + Puppeteer renderer; `GET /payslips/:id/pdf` returns PDF; sync if <2s otherwise via BullMQ; WhatsApp share link generation.
- `mobile-web-pwa`: Vite + React + TS + Tailwind + shadcn/ui PWA (manifest, service worker via `vite-plugin-pwa`, installable, theme `#1f2937`); Axios client with token attach + 401-refresh-once; TanStack Query for all server state; React Hook Form + Zod for all forms; routes for `/login`, `/dashboard`, `/employees`, `/attendance` (+ `/calendar/:employeeId`, `/summary`), `/advances`, `/payroll` (+ `/new`, `/:id`, `/payslips/:id`); every screen verified at 360×800; ≥56px tap targets; loading skeletons + error states + empty states with CTAs.

### Modified Capabilities

_None — this is a greenfield V1; `openspec/specs/` is currently empty._

## Impact

- **New repo structure**: monorepo gains `apps/api`, `apps/web`, `packages/shared`, `docs/`, `docker-compose.yml`, `pnpm-workspace.yaml` — there is no prior code beyond docs to migrate.
- **New external dependencies**:
  - API: NestJS, Prisma, `@prisma/client`, PostgreSQL driver, Redis client, BullMQ, `@nestjs/jwt`, `@nestjs/passport`, `passport-jwt`, `bcrypt`, `nestjs-zod`, `zod`, `decimal.js`, `date-fns`, `date-fns-tz`, `puppeteer`, `@nestjs/swagger`.
  - Web: React, react-router-dom, `@tanstack/react-query` (+ devtools), `react-hook-form`, `@hookform/resolvers`, `zod`, `axios`, `date-fns(-tz)`, `decimal.js`, `lucide-react`, `tailwindcss`, `vite-plugin-pwa`, `workbox-window`, shadcn/ui components.
- **New runtime infra**: Postgres 16 (durable, money math), Redis 7 (BullMQ queue for PDF jobs), Puppeteer (Chromium) on the API host.
- **New env contract**: `DATABASE_URL`, `REDIS_URL`, `JWT_ACCESS_SECRET`, `JWT_REFRESH_SECRET`, `JWT_ACCESS_TTL`, `JWT_REFRESH_TTL`, `ENCRYPTION_KEY`, `NODE_ENV`, `PORT`, `CORS_ORIGIN`, `VITE_API_URL`. `ENCRYPTION_KEY` rotation requires a re-encryption migration plan (deferred to v1.1).
- **Compliance posture**: PAN/Aadhaar encrypted at rest (AES-GCM), never logged; payroll calculations versioned and frozen on finalize so historical payslips remain auditable. PF/ESI/TDS auto-calc explicitly **out of scope** — modeled as flat `fixedDeductions` rows so the schema stays stable when they land in v1.1.
- **Deployment**: API to Railway/Render (must support Chromium for Puppeteer), web to Vercel; staging URL is part of V1 Definition of Done so this change includes deploy wiring (CI lint/typecheck/test on PR, auto-deploy from `main` to staging).
- **Out of V1 (explicitly not in this change)**: biometric/geo-fenced attendance, multi-shift, leave approvals, OT auto-calculation from punch times, PF/ESI/TDS auto-calc, sales/billing/inventory/production modules, multi-tenancy, audit log table, file uploads, Hindi/Odia localization.
