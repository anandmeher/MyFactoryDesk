## ADDED Requirements

### Requirement: Create draft payroll run is idempotent on (month, year)
The API SHALL accept `POST /api/v1/payroll/runs` from `OWNER` or `ACCOUNTANT` with body `{ month: 1-12, year: YYYY }`. If a run already exists for that `(month, year)`, the API SHALL return that run instead of creating a duplicate. New runs SHALL be created with `status = DRAFT`.

#### Scenario: First call creates a DRAFT
- **WHEN** an `OWNER` posts `{ month: 4, year: 2026 }` and no run exists
- **THEN** the response is `201` with a new run, `status = DRAFT`

#### Scenario: Second call for the same period returns the existing run
- **WHEN** the same `{ month: 4, year: 2026 }` is posted again
- **THEN** the response is `200` with the existing run, no duplicate is created

### Requirement: Preview is read-only and may be called repeatedly in DRAFT
The API SHALL accept `GET /api/v1/payroll/runs/:id/preview` from any authenticated role. While the run is in `DRAFT`, this endpoint SHALL recompute every employee's payslip on the fly using the current calculator and current attendance/advance/employee data. It SHALL NOT write to the database. Once the run is `FINALIZED`, this endpoint returns the frozen payslips instead.

#### Scenario: DRAFT preview reflects latest data
- **WHEN** an attendance row is updated and `GET /runs/:id/preview` is called immediately
- **THEN** the new attendance is reflected in the preview output

#### Scenario: FINALIZED preview returns frozen results
- **WHEN** the run has been finalized and `GET /runs/:id/preview` is called
- **THEN** the response returns the stored `Payslip` rows; subsequent changes to attendance/advances do not change them

### Requirement: Finalize wraps writes in a transaction
The API SHALL accept `POST /api/v1/payroll/runs/:id/finalize` from `OWNER` only. The operation SHALL be atomic: insert all `Payslip` rows, link applied `Advance` rows, mark fully-applied advances `isDeducted=true`, reschedule carried-forward advances to the next month, set `PayrollRun.status=FINALIZED`, set `finalizedAt=now`, all in `prisma.$transaction`. Each `Payslip` row SHALL store `calculatorVersion` and a JSON snapshot of the `PayslipInput` it was computed from.

#### Scenario: Finalize creates payslips and locks the run
- **WHEN** an `OWNER` posts `/runs/:id/finalize` for a DRAFT run
- **THEN** the response is `200` with the FINALIZED run
- **AND** one Payslip row exists per active employee in scope, each with `calculatorVersion` and `inputsJson` populated
- **AND** advances applied in full are marked `isDeducted=true`
- **AND** carry-forward remainders are scheduled as new advances for the next month with the original `id` referenced in `replacesAdvanceId`

#### Scenario: Finalize is OWNER-only
- **WHEN** an `ACCOUNTANT` calls `/runs/:id/finalize`
- **THEN** the response is `403`

#### Scenario: Finalize on already-FINALIZED run is rejected
- **WHEN** any user calls `/runs/:id/finalize` on a non-DRAFT run
- **THEN** the response is `409` with `{ error: { code: 'INVALID_STATE_TRANSITION' } }`

#### Scenario: Finalize is atomic on failure
- **WHEN** any insert fails mid-transaction
- **THEN** no Payslip rows are created and the run remains `DRAFT`

### Requirement: Mark paid transitions FINALIZED to PAID
The API SHALL accept `POST /api/v1/payroll/runs/:id/mark-paid` from `OWNER` or `ACCOUNTANT`. It SHALL succeed only when the run is `FINALIZED`. It SHALL set `status=PAID` and `paidAt=now`.

#### Scenario: Mark paid on FINALIZED run
- **WHEN** an `ACCOUNTANT` calls `/runs/:id/mark-paid` on a `FINALIZED` run
- **THEN** the run becomes `PAID` with `paidAt` set

#### Scenario: Mark paid on DRAFT run is rejected
- **WHEN** any user calls `/runs/:id/mark-paid` on a `DRAFT` run
- **THEN** the response is `409 INVALID_STATE_TRANSITION`

### Requirement: Payslip is immutable after finalize
Any direct update to a `Payslip` row in a non-`DRAFT` run SHALL fail with `409 RUN_FINALIZED`. Adjustments SHALL be modeled as separate records (out of V1 scope), never as edits to existing payslips.

#### Scenario: Edit attempt on finalized payslip
- **WHEN** any client attempts to mutate a payslip belonging to a `FINALIZED` or `PAID` run via any endpoint
- **THEN** the response is `409` with `{ error: { code: 'RUN_FINALIZED' } }`

### Requirement: List and detail endpoints
The API SHALL expose `GET /api/v1/payroll/runs` (paginated, ordered by `(year DESC, month DESC)`) and `GET /api/v1/payroll/runs/:id` (returning the run plus all its `Payslip` rows). Both are accessible to any authenticated role.

#### Scenario: List runs ordered most-recent-first
- **WHEN** any authenticated user calls `GET /api/v1/payroll/runs`
- **THEN** the response is paginated with the most recent month/year first

### Requirement: Single payslip detail endpoint
The API SHALL expose `GET /api/v1/payslips/:id` to return a single payslip with full breakdown (earnings, deductions, advances applied, carried forward). Accessible to any authenticated role.

#### Scenario: Payslip detail returns full breakdown
- **WHEN** any authenticated user calls `GET /api/v1/payslips/:id`
- **THEN** the response includes earnings breakdown, fixed deductions breakdown, advances applied with amounts, carry-forward remainders, and `calculatorVersion`
