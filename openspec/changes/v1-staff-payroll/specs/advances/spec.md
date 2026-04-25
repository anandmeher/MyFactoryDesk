## ADDED Requirements

### Requirement: Create advance for an employee
The API SHALL accept `POST /api/v1/advances` from `OWNER` or `ACCOUNTANT` with body `{ employeeId, amount, date, deductionMonth, deductionYear, remarks? }`. `amount` is a money string. `date` is `YYYY-MM-DD`. `deductionMonth` is `1-12`, `deductionYear` is `YYYY`. The response is `201` with the created record.

#### Scenario: Successful create
- **WHEN** an `OWNER` posts `{ employeeId, amount: "5000.00", date: "2026-04-10", deductionMonth: 4, deductionYear: 2026 }`
- **THEN** the response is `201` with the created advance
- **AND** the record's `isDeducted` flag is `false`

#### Scenario: Non-privileged role is forbidden
- **WHEN** a `MANAGER` posts to `/advances`
- **THEN** the response is `403`

### Requirement: List advances with filters
The API SHALL accept `GET /api/v1/advances?employeeId=<id>&deductionMonth=&deductionYear=&isDeducted=` from any authenticated role with pagination. Defaults: no filter, page 1, pageSize 20, ordered by `date DESC`.

#### Scenario: Filter by employee and pending deduction
- **WHEN** a client calls `?employeeId=<id>&isDeducted=false`
- **THEN** only advances for that employee with `isDeducted=false` are returned

### Requirement: Update an advance only before deduction
The API SHALL accept `PATCH /api/v1/advances/:id` from `OWNER` or `ACCOUNTANT`. Updates SHALL be rejected with `409 ADVANCE_LOCKED` if the advance has been linked to a finalized payslip (`isDeducted=true` or `payrollRunId` set).

#### Scenario: Editable while pending
- **WHEN** an `OWNER` patches `{ deductionMonth: 5 }` on a non-deducted advance
- **THEN** the response is `200` with the updated record

#### Scenario: Locked once deducted
- **WHEN** an `OWNER` patches an advance with `isDeducted=true`
- **THEN** the response is `409` with `{ error: { code: 'ADVANCE_LOCKED' } }`

### Requirement: Delete an advance only before deduction
The API SHALL accept `DELETE /api/v1/advances/:id` from `OWNER` only. Deletion SHALL be rejected with `409 ADVANCE_LOCKED` if the advance has been linked to a finalized payslip.

#### Scenario: Deletable while pending
- **WHEN** an `OWNER` deletes a non-deducted advance
- **THEN** the response is `204` and the row is removed

### Requirement: FIFO ordering for payroll consumption
When the payroll calculator consumes advances scheduled for a given `(month, year)`, advances SHALL be ordered by `date ASC`, then `id ASC` as a tiebreaker. Advances unable to be fully applied because gross is insufficient SHALL be marked for carry-forward to the next month on payroll finalize.

#### Scenario: Older advance applied first
- **WHEN** two advances exist for the same employee scheduled for April 2026, dated `2026-04-05` and `2026-04-20`
- **THEN** the April-5 advance is applied first; only its remainder (if any) carries forward
- **AND** the April-20 advance is applied (or carried forward whole) only after the April-5 one

### Requirement: Money is Decimal everywhere
`amount` SHALL be stored as `Decimal(12, 2)` and returned as a string in JSON.

#### Scenario: Numeric amount is rejected
- **WHEN** a client posts `{ amount: 5000 }` instead of `"5000.00"`
- **THEN** the response is `400 VALIDATION_ERROR`
