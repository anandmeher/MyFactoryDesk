## ADDED Requirements

### Requirement: HTML payslip template lives in source
The HTML payslip template SHALL reside at `apps/api/src/payroll/templates/payslip.html`. The template SHALL render company name, payslip period (month + year in IST), employee details (name, empCode, designation), earnings breakdown, deductions breakdown, advances applied, net pay (in words and figures), and `calculatorVersion`. All money values SHALL be formatted via `Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' })`.

#### Scenario: Template renders all required sections
- **WHEN** a payslip is rendered through the template with a complete `Payslip` record
- **THEN** the HTML contains the company name, employee details, earnings table, deductions table, advances table, net pay (figures and words), and `calculatorVersion` string

### Requirement: PDF generation endpoint
The API SHALL accept `GET /api/v1/payslips/:id/pdf` from any authenticated role. The endpoint SHALL render the HTML template via Puppeteer and return a `Content-Type: application/pdf` response with `Content-Disposition: inline; filename="payslip-<empCode>-<YYYY>-<MM>.pdf"`.

#### Scenario: PDF is returned for a finalized payslip
- **WHEN** any authenticated user calls `GET /api/v1/payslips/:id/pdf` for a payslip in a `FINALIZED` or `PAID` run
- **THEN** the response is `200` with `Content-Type: application/pdf` and a non-empty body
- **AND** the filename contains the empCode and the payslip period

#### Scenario: PDF is rejected for DRAFT
- **WHEN** any user calls `/payslips/:id/pdf` for a payslip in a `DRAFT` run
- **THEN** the response is `409` with `{ error: { code: 'PAYSLIP_NOT_FINALIZED' } }`

### Requirement: Synchronous render with queue fallback
The first implementation SHALL render PDFs synchronously inside the request. If P95 latency for `/payslips/:id/pdf` exceeds 2 seconds in production, the implementation SHALL be migrated to a BullMQ-backed job with a `GET /payslips/:id/pdf?async=1` returning a `jobId` and a polling endpoint. The synchronous path SHALL remain available regardless.

#### Scenario: Synchronous render under threshold
- **WHEN** the API responds to `GET /payslips/:id/pdf` in V1
- **THEN** the response body is the PDF bytes directly, with no job-id indirection

### Requirement: Puppeteer launched with stable flags
Puppeteer SHALL be launched with `--no-sandbox --disable-setuid-sandbox` (required on Railway/Render container hosts) and SHALL reuse a single browser instance across requests via a singleton service that handles graceful shutdown on SIGTERM.

#### Scenario: Browser reuse across requests
- **WHEN** two consecutive PDF requests are made
- **THEN** the same Puppeteer `Browser` instance handles both, with a fresh page per request

### Requirement: WhatsApp share link
The frontend SHALL provide a "Share via WhatsApp" action on the payslip detail page that opens `https://wa.me/<E.164-phone>?text=<encodedMessage>`, where `<encodedMessage>` includes the payslip period and a link to the payslip detail page. The link SHALL only be enabled for payslips in `FINALIZED` or `PAID` runs.

#### Scenario: WhatsApp share opens with prefilled text
- **WHEN** a user taps "Share via WhatsApp" on a finalized payslip
- **THEN** a `wa.me` URL opens with the recipient's phone and a prefilled message containing the period and payslip link
