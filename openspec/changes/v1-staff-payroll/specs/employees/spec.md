## ADDED Requirements

### Requirement: Create employee
The API SHALL accept `POST /api/v1/employees` from `OWNER` or `MANAGER` users. Body fields are validated by `CreateEmployeeSchema` from `@paper-plates/shared`. If `empCode` is omitted, the API SHALL auto-generate one of the form `EMP{YYYY}{4-digit-sequence}` based on the current IST year (e.g., `EMP20260001`). The response is `201` with `{ data: <Employee> }`.

#### Scenario: Successful create with omitted empCode
- **WHEN** an `OWNER` posts a new employee with no `empCode`
- **THEN** the API generates an `empCode` like `EMP20260001` and returns the created record
- **AND** the next employee created in the same year increments to `EMP20260002`

#### Scenario: Duplicate empCode is rejected
- **WHEN** a client posts an employee with an `empCode` that already exists
- **THEN** the response is `409` with `{ error: { code: 'EMP_CODE_EXISTS' } }`

#### Scenario: Non-privileged role is forbidden
- **WHEN** a `STAFF` user posts a new employee
- **THEN** the response is `403`

### Requirement: PAN and Aadhaar are encrypted at rest
PAN and Aadhaar values SHALL be encrypted with AES-256-GCM using `ENCRYPTION_KEY` from env before persisting. The stored format SHALL be `iv:tag:ciphertext` (each part base64url-encoded). PAN and Aadhaar SHALL be redacted (e.g., `XXXX-XXXX-1234`) in all responses except when an `OWNER` requests the explicit decrypted form via a query parameter (e.g., `?includePii=true`). PAN and Aadhaar SHALL never appear in application logs.

#### Scenario: Default response masks PII
- **WHEN** any role lists or fetches an employee
- **THEN** the response shows only the last 4 characters of PAN and Aadhaar, prefixed with `X`s

#### Scenario: OWNER can request decrypted PII
- **WHEN** an `OWNER` calls `GET /employees/:id?includePii=true`
- **THEN** the response includes the decrypted PAN and Aadhaar
- **AND** an audit entry (or at minimum a structured log without the PII values themselves) records the access

#### Scenario: Non-OWNER cannot request decrypted PII
- **WHEN** a `MANAGER` calls `GET /employees/:id?includePii=true`
- **THEN** the `includePii` flag is ignored and the response is masked

### Requirement: List employees with search, filter, and pagination
The API SHALL accept `GET /api/v1/employees?page=1&pageSize=20&search=<q>&active=true` from any authenticated role. `search` matches case-insensitively against `name` and `empCode`. `active` defaults to `true`. The response includes `meta: { total, page, pageSize, totalPages }`.

#### Scenario: Default list excludes soft-deleted employees
- **WHEN** any authenticated user calls `GET /api/v1/employees` with no `active` filter
- **THEN** only employees with `isActive=true` are returned

#### Scenario: Search matches name and empCode
- **WHEN** a client calls `GET /api/v1/employees?search=ram`
- **THEN** the response includes employees whose `name` or `empCode` contain "ram" (case-insensitive)

### Requirement: Read employee detail
The API SHALL accept `GET /api/v1/employees/:id` from any authenticated role and return the full record (with PII masked unless explicitly requested per the PII rule above).

#### Scenario: Detail returns 404 for unknown id
- **WHEN** a client calls `GET /api/v1/employees/:id` with an id that does not exist
- **THEN** the response is `404` with `{ error: { code: 'NOT_FOUND' } }`

### Requirement: Update employee
The API SHALL accept `PATCH /api/v1/employees/:id` from `OWNER` or `MANAGER`. Body is validated by `UpdateEmployeeSchema`. Updates to PAN or Aadhaar SHALL re-encrypt with the current key.

#### Scenario: Partial update preserves untouched fields
- **WHEN** a `MANAGER` patches `{ basicSalary: "16000.00" }` on an employee
- **THEN** only `basicSalary` changes and all other fields remain as before

### Requirement: Soft-delete employee
The API SHALL accept `DELETE /api/v1/employees/:id` from `OWNER` only. The operation SHALL set `isActive=false` and `dateOfLeaving=<today in IST>`. The record SHALL never be hard-deleted because payroll history references it.

#### Scenario: Delete sets soft-delete fields
- **WHEN** an `OWNER` deletes an employee
- **THEN** the employee record's `isActive` becomes `false` and `dateOfLeaving` is set to today in IST
- **AND** any existing `Payslip` rows referencing the employee continue to resolve correctly

#### Scenario: Non-OWNER cannot delete
- **WHEN** a `MANAGER` calls `DELETE /api/v1/employees/:id`
- **THEN** the response is `403`

### Requirement: Money fields are Decimal end to end
Salary, HRA, allowance amounts, and fixed deduction amounts SHALL be stored as Prisma `Decimal(12, 2)` and serialised as strings in API responses. The API SHALL reject any non-string money input with a `VALIDATION_ERROR`.

#### Scenario: Numeric money input is rejected
- **WHEN** a client posts `{ basicSalary: 15000 }` (number) instead of `"15000.00"` (string)
- **THEN** the response is `400 VALIDATION_ERROR`
