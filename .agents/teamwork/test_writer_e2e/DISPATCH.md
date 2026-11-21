# Dispatch: E2E Test Writer (E2E Testing Track)

## Identity
- Role: E2E Testing Specialist
- Type: teamwork_test_writer
- Working directory: c:\Users\adars\eddp\.agents\teamwork\test_writer_e2e\
- Parent: Orchestrator (2652dcf8-f3eb-4981-95c8-2284d2b17259)

## Mandatory Inputs & Context
- ORIGINAL_REQUEST.md: c:\Users\adars\eddp\.agents\teamwork\ORIGINAL_REQUEST.md
- PROJECT.md: c:\Users\adars\eddp\.agents\teamwork\orchestrator\PROJECT.md
- Explorer 3 Report: c:\Users\adars\eddp\.agents\teamwork\explorer_survey_3\handoff.md
- Workspace root: c:\Users\adars\eddp

## Assigned Scope & Ownership
Exclusive File Ownership:
- `TEST_INFRA.md` (at project root `c:\Users\adars\eddp\TEST_INFRA.md`)
- `TEST_READY.md` (at project root `c:\Users\adars\eddp\TEST_READY.md`)
- New comprehensive E2E test suites in `test/e2e/` (e.g. `test/e2e/comprehensive_e2e_suite.test.js`)

## Tasks to Execute
1. Author `TEST_INFRA.md` following the required template:
   - Test Philosophy (Opaque-box, requirement-driven, Tiers 1-4).
   - Feature Inventory coverage.
   - Test architecture and runner command.
2. Develop comprehensive automated test cases covering Tiers 1-4 based strictly on `ORIGINAL_REQUEST.md` and feature requirements:
   - Tier 1: Feature coverage (onboarding, resume ATS, mock interview, career path, aptitude test, WAF security, payments).
   - Tier 2: Boundary & Corner Cases (empty inputs, rate limits, edge tokens, token expiry).
   - Tier 3: Cross-Feature Combinations (signup -> onboarding -> aptitude -> interview -> certificate).
   - Tier 4: Real-world user journeys.
3. Verify tests execute cleanly via `node` or test runner.
4. When complete, publish `TEST_READY.md` summarizing coverage and test runner command.
5. Report handoff in `c:\Users\adars\eddp\.agents\teamwork\test_writer_e2e\handoff.md`.

## Mandatory Integrity Warning
DO NOT CHEAT. All implementations must be genuine. DO NOT hardcode test results, create dummy/facade implementations, or circumvent the intended task. A teamwork_auditor will independently verify your work. Integrity violations WILL be detected and your work WILL be rejected.


## 2026-11-09T08:57:30Z
[Message] timestamp=2026-11-09T08:57:30Z sender=2652dcf8-f3eb-4981-95c8-2284d2b17259 priority=MESSAGE_PRIORITY_HIGH content=You are E2E Test Writer. Read your dispatch instructions at c:\Users\adars\eddp\.agents\teamwork\test_writer_e2e\DISPATCH.md.
MANDATORY: Read ORIGINAL_REQUEST.md at c:\Users\adars\eddp\.agents\teamwork\ORIGINAL_REQUEST.md before starting work.
Your working directory is c:\Users\adars\eddp\.agents\teamwork\test_writer_e2e\.
Create TEST_INFRA.md and author comprehensive requirement-driven E2E test suites (Tiers 1-4) in test/e2e/ adhering to the project requirements. When complete, publish TEST_READY.md.
Write full report to c:\Users\adars\eddp\.agents\teamwork\test_writer_e2e\handoff.md and notify me via send_message when done.

MANDATORY INTEGRITY WARNING:
DO NOT CHEAT. All implementations must be genuine. DO NOT hardcode test results, create dummy/facade implementations, or circumvent the intended task. A teamwork_auditor will independently verify your work. Integrity violations WILL be detected and your work WILL be rejected.
