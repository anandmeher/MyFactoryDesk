## ADDED Requirements

### Requirement: Bulk daily attendance marking in a single transaction
The API SHALL accept `POST /api/v1/attendance/bulk` from `OWNER` or `MANAGER` with body `{ date: "YYYY-MM-DD", marks: [{ employeeId, status, overtimeHours?, remarks? }] }`. `status` is one of `PRESENT`, `HALF_DAY`, `PAID_LEAVE`, `UNPAID_LEAVE`, `ABSENT`, `HOLIDAY`. The entire write SHALL be wrapped in `prisma.$transaction` and SHALL upsert on the `(employeeId, date)` unique key.

#### Scenario: Bulk mark inserts all rows atomically
- **WHEN** an `OWNER` posts marks for 10 employees on `"2026-04-25"`
- **THEN** all 10 attendance rows are written or none are (atomic)
- **AND** subsequent calls with the same `(employeeId, date)` overwrite the previous status (upsert)

#### Scenario: Invalid status is rejected
- **WHEN** a client posts a `status` not in the enum
- **THEN** the response is `400 VALIDATION_ERROR` with the offending row indices in `details`

#### Scenario: Non-privileged role is forbidden
- **WHEN** a `STAFF` user posts to `/attendance/bulk`
- **THEN** the response is `403`

### Requirement: Date semantics anchor to IST
Attendance dates SHALL be stored as `@db.Date` with no time component. The "month" an attendance row belongs to SHALL be determined by interpreting the date string in the `Asia/Kolkata` timezone, regardless of the server's local timezone.

#### Scenario: Date "2026-04-25" belongs to April 2026 even on a UTC server
- **WHEN** the server is running with `TZ=UTC` and an attendance row is written for `"2026-04-25"`
- **THEN** the monthly summary for `month=4, year=2026` includes that row

### Requirement: Overtime hours captured per row
Each attendance row SHALL accept an optional `overtimeHours` field (a string representing a non-negative `Decimal` with up to 2 decimal places). Overtime SHALL be stored on the `Attendance` row, not aggregated separately.

#### Scenario: Overtime hours stored as Decimal
- **WHEN** an `OWNER` posts a mark with `"overtimeHours": "2.50"`
- **THEN** the row is stored with `overtimeHours = 2.50` (Decimal, scale 2)

### Requirement: Range query for attendance
The API SHALL accept `GET /api/v1/attendance?from=YYYY-MM-DD&to=YYYY-MM-DD&employeeId=<id>` from any authenticated role. `employeeId` is optional. Results SHALL be ordered by `(date ASC, employeeId ASC)`.

#### Scenario: Range query returns inclusive bounds
- **WHEN** a client calls `?from=2026-04-01&to=2026-04-30`
- **THEN** rows for both `2026-04-01` and `2026-04-30` are included if they exist

#### Scenario: from > to is rejected
- **WHEN** a client calls `?from=2026-04-30&to=2026-04-01`
- **THEN** the response is `400 VALIDATION_ERROR`

### Requirement: Monthly summary aggregates per employee
The API SHALL accept `GET /api/v1/attendance/summary?month=<1-12>&year=<YYYY>` from any authenticated role and return one row per active employee with counts: `{ employeeId, name, empCode, present, halfDay, paidLeave, unpaidLeave, absent, holiday, overtimeHours }`. `overtimeHours` is summed across the month as `Decimal`.

#### Scenario: Summary includes all active employees, even with zero rows
- **WHEN** a client calls `GET /api/v1/attendance/summary?month=4&year=2026`
- **THEN** every active employee appears in the response, with zeros if they have no attendance rows that month

#### Scenario: Summary respects IST month boundaries
- **WHEN** the summary is requested for April 2026 on a UTC-running server
- **THEN** rows whose `date = "2026-04-01"` through `"2026-04-30"` are included, regardless of the server's local timezone
