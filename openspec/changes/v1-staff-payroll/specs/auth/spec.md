## ADDED Requirements

### Requirement: Phone and password login
The API SHALL accept `POST /api/v1/auth/login` with body `{ phone: string, password: string }` and return `{ data: { accessToken, refreshToken, user: { id, phone, name, role } } }` on success. Phone numbers SHALL be validated as 10-digit Indian mobile numbers. Passwords SHALL be compared against a bcrypt hash with cost factor 12.

#### Scenario: Successful login returns tokens
- **WHEN** a client posts valid `{ phone, password }` for an active user
- **THEN** the response is `200` with `accessToken` (15-minute TTL), `refreshToken` (7-day TTL), and the user record

#### Scenario: Wrong password returns generic error
- **WHEN** a client posts a phone that exists with an incorrect password
- **THEN** the response is `401` with `{ error: { code: 'INVALID_CREDENTIALS', message: 'Invalid phone or password' } }`
- **AND** the response time is comparable to a successful login (timing-attack resistant)

#### Scenario: Unknown phone returns the same error as wrong password
- **WHEN** a client posts a phone that does not exist in the database
- **THEN** the response is `401` with `{ error: { code: 'INVALID_CREDENTIALS', message: 'Invalid phone or password' } }`

### Requirement: Refresh token rotation
The API SHALL accept `POST /api/v1/auth/refresh` with body `{ refreshToken: string }` and return a new access token and refresh token. The previous refresh token SHALL be invalidated on successful rotation.

#### Scenario: Valid refresh token issues a new pair
- **WHEN** a client posts a valid, unexpired refresh token
- **THEN** the response is `200` with a new `accessToken` and `refreshToken`
- **AND** the previous refresh token can no longer be used

#### Scenario: Expired refresh token is rejected
- **WHEN** a client posts a refresh token whose `exp` claim is in the past
- **THEN** the response is `401` with `{ error: { code: 'TOKEN_EXPIRED' } }`

#### Scenario: Tampered refresh token is rejected
- **WHEN** a client posts a refresh token whose signature does not verify
- **THEN** the response is `401` with `{ error: { code: 'INVALID_TOKEN' } }`

### Requirement: Logout revokes the refresh token
The API SHALL accept `POST /api/v1/auth/logout` with body `{ refreshToken: string }` and mark that refresh token as revoked. Subsequent refresh attempts with the same token SHALL fail.

#### Scenario: Logout invalidates the refresh token
- **WHEN** a client posts a valid refresh token to `/auth/logout`
- **THEN** the response is `200`
- **AND** any subsequent `/auth/refresh` with the same token returns `401 INVALID_TOKEN`

### Requirement: Role-based access control
Every protected route SHALL be guarded by a JWT auth guard plus a `RolesGuard` that reads required roles from a `@Roles()` decorator. Available roles are `OWNER`, `MANAGER`, `STAFF`, `ACCOUNTANT`. Routes without `@Roles()` allow any authenticated user. A `@CurrentUser()` parameter decorator SHALL inject the authenticated user record into controller methods.

#### Scenario: Caller without required role is forbidden
- **WHEN** a `STAFF` user calls a route decorated with `@Roles('OWNER', 'MANAGER')`
- **THEN** the response is `403` with `{ error: { code: 'FORBIDDEN' } }`

#### Scenario: Caller without any token is unauthorized
- **WHEN** a client calls any protected route without `Authorization: Bearer <token>`
- **THEN** the response is `401` with `{ error: { code: 'UNAUTHORIZED' } }`

### Requirement: Password storage policy
Passwords SHALL be hashed with bcrypt at cost factor 12 before storage. The plaintext password SHALL never be logged, returned in any API response, or stored in any cache.

#### Scenario: Password is never present in user response
- **WHEN** the API returns a `User` record from any endpoint
- **THEN** the JSON does not contain a `password` or `passwordHash` field
