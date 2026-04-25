## ADDED Requirements

### Requirement: Monorepo workspace layout
The repository SHALL be organised as a pnpm workspace with `apps/api` (NestJS backend), `apps/web` (Vite + React PWA), and `packages/shared` (Zod schemas and TypeScript types). A root `package.json` SHALL expose `dev`, `lint`, `typecheck`, and `format` scripts that run across all workspaces.

#### Scenario: pnpm install resolves all workspaces
- **WHEN** a developer runs `pnpm install` at the repo root
- **THEN** dependencies for `apps/api`, `apps/web`, and `packages/shared` install without errors
- **AND** `@myfactorydesk/shared` is available as a workspace dependency to both apps

#### Scenario: pnpm dev runs api and web in parallel
- **WHEN** a developer runs `pnpm dev` at the repo root
- **THEN** both `apps/api` (port 3000) and `apps/web` (port 5173) start in parallel and watch for changes

### Requirement: Local development infrastructure via Docker Compose
The repository SHALL provide a `docker-compose.yml` that runs PostgreSQL 16 and Redis 7 locally with named volumes for persistence. Postgres SHALL listen on `5432` with database `myfactorydesk`, user `app`, password `app`. Redis SHALL listen on `6379`.

#### Scenario: docker compose up starts the dev stack
- **WHEN** a developer runs `docker compose up -d` at the repo root
- **THEN** Postgres becomes reachable at `postgresql://app:app@localhost:5432/myfactorydesk`
- **AND** Redis becomes reachable at `redis://localhost:6379`

### Requirement: V1 Prisma schema and first migration
`apps/api/prisma/schema.prisma` SHALL define the V1 domain model exactly as specified in `CLAUDE.md` §Domain Model: enums (`Role`, `SalaryType`, `AttendanceStatus`, `PayrollStatus`) and models (`User`, `Employee`, `Attendance`, `Advance`, `PayrollRun`, `Payslip`). All money columns SHALL be `@db.Decimal(12, 2)`. All foreign keys SHALL be indexed. The schema SHALL include unique constraints on `User.phone`, `Employee.empCode`, `Attendance(employeeId, date)`, `PayrollRun(month, year)`, and `Payslip(payrollRunId, employeeId)`.

#### Scenario: First migration creates all V1 tables
- **WHEN** a developer runs `pnpm --filter api prisma migrate dev --name init`
- **THEN** all V1 tables exist in Postgres
- **AND** `pnpm --filter api prisma generate` produces a typed client without errors

#### Scenario: Money columns reject precision-loss assignments
- **WHEN** Prisma writes a money value
- **THEN** the column type is `Decimal(12, 2)` and the underlying driver returns a string-form Decimal on read

### Requirement: Shared Zod schema package
`packages/shared` SHALL export Zod schemas for every V1 request and response shape, organised by domain (`employee`, `attendance`, `advance`, `payroll`, `auth`, `common`). Money fields SHALL be `z.string().regex(/^\d+(\.\d{1,2})?$/)`. Date-only fields SHALL be `z.string().regex(/^\d{4}-\d{2}-\d{2}$/)`. The package SHALL be consumable from both `apps/api` (via `nestjs-zod`) and `apps/web` (via `@hookform/resolvers/zod`).

#### Scenario: API and web share the same schema
- **WHEN** a developer imports `CreateEmployeeSchema` from `@myfactorydesk/shared` in either `apps/api` or `apps/web`
- **THEN** the same Zod schema instance is used for validation in both apps

### Requirement: NestJS bootstrap conventions
The API SHALL set the global prefix to `/api/v1`, register a global `ValidationPipe` with `whitelist: true` and `forbidNonWhitelisted: true`, register a global exception filter that returns errors in the format `{ error: { code, message, details? } }`, expose Swagger at `/api/docs`, and apply CORS based on `CORS_ORIGIN`. A `/health` endpoint SHALL return `{ status: 'ok', timestamp }` without auth.

#### Scenario: Health endpoint responds without auth
- **WHEN** a client sends `GET /api/v1/health`
- **THEN** the response is `200` with body `{ data: { status: 'ok', timestamp: <ISO 8601> } }`

#### Scenario: Validation errors return the standard envelope
- **WHEN** a client posts an invalid body to any validated endpoint
- **THEN** the response is `400` with body `{ error: { code: 'VALIDATION_ERROR', message: <string>, details: <issues> } }`

### Requirement: Environment variable contract
Both apps SHALL ship `.env.example` files documenting every variable. The API SHALL fail fast at startup if any of `DATABASE_URL`, `REDIS_URL`, `JWT_ACCESS_SECRET`, `JWT_REFRESH_SECRET`, `ENCRYPTION_KEY` are missing. Real `.env` files SHALL be git-ignored.

#### Scenario: Missing required env crashes startup
- **WHEN** the API starts without `JWT_ACCESS_SECRET` set
- **THEN** the process exits with a non-zero code and a clear error message naming the missing variable

### Requirement: Money and date conventions in transit
All money values in JSON request and response bodies SHALL be strings (e.g., `"15000.50"`). All date-only values SHALL be strings of the form `YYYY-MM-DD`. All timestamps SHALL be ISO 8601 strings in UTC. Empty arrays SHALL be returned as `[]`, never `null`.

#### Scenario: Response serialises Decimal as string
- **WHEN** the API returns an employee with `basicSalary` of ₹15,000.50
- **THEN** the JSON contains `"basicSalary": "15000.50"`, never a number
