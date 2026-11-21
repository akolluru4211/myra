## 2026-11-09T20:26:00Z
You are Test Writer M4 Instance 2 (`test_writer_m4_2`).
Working directory: c:\Users\adars\eddp\.agents\teamwork\test_writer_m4_2\
Project root: c:\Users\adars\eddp
Original request: c:\Users\adars\eddp\.agents\teamwork\ORIGINAL_REQUEST.md
Master project plan: c:\Users\adars\eddp\.agents\teamwork\orchestrator_gen2\PROJECT.md

MANDATORY INTEGRITY WARNING:
DO NOT CHEAT. All implementations must be genuine. DO NOT hardcode test results, create dummy/facade implementations, or circumvent the intended task. A teamwork_auditor will independently verify your work. Integrity violations WILL be detected and your work WILL be rejected.

EXCLUSIVE FILE WRITE OWNERSHIP:
You have exclusive write ownership of:
1. c:\Users\adars\eddp\test\unit\email_service_resend.test.js
2. c:\Users\adars\eddp\test\unit\middleware_waf.test.js

SCOPE & REQUIREMENTS:
Author two comprehensive, high-quality automated regression test suites using Node native test runner (`node:test` and `node:assert`):

1. `test/unit/email_service_resend.test.js`:
   - Target module: `src/lib/email-service.ts`
   - Test email payload validation: recipient email formatting, required subject line, text and HTML content boundaries.
   - Test recipient routing and default configurations: verify inbound contact inquiries route to `edworld.eden@gmail.com`.
   - Test newsletter subscription logic, email state tracking, and deduplication/validation.
   - Test Resend client initialization, API error handling, and graceful fallback behavior when API key is missing or invalid.
   - Ensure tests are robust and deterministic (use mocks or dependency injection/stubs where appropriate so network calls are not made).

2. `test/unit/middleware_waf.test.js`:
   - Target module: `src/middleware.ts`
   - Test WAF inspection and security rules: SQL injection patterns (`UNION SELECT`, `' OR '1'='1`), path traversal (`../`), malicious query strings, and suspicious request headers.
   - Test public route and static asset bypassing (`/_next/`, `/static/`, `/favicon.ico`, `/images/`, public assets).
   - Test route normalization and redirect rules (`/practice` -> `/dsa`, `/showcase` -> `/dsa`).
   - Test subdomain routing and sector header injection (`career.*` maps to sector `career`, `learn.*` maps to sector `learn`).
   - Test `x-internal-secret` authentication header verification against `INTERNAL_SERVICE_SECRET`.

EXECUTION & VERIFICATION:
- Name the test files `.test.js` so they are automatically discovered by `npm test` (`node --test test/unit/*.test.js`).
- Verify your test suites run cleanly:
  - `node test/unit/email_service_resend.test.js`
  - `node test/unit/middleware_waf.test.js`
  - `cmd /c npx tsc --noEmit`
  - `cmd /c npm test`
- Write a detailed handoff.md in your working directory (`c:\Users\adars\eddp\.agents\teamwork\test_writer_m4_2\handoff.md`).
- Notify orchestrator via send_message when complete.
