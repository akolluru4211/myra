# Project: Repository-Wide Code Audit & Bug Clearance (edworld-co)

## Architecture
- **Primary Web & API**: Next.js 14.2.35 (App Router), React 18.3.1, TypeScript 5.6.2, Tailwind CSS 3.4.11.
- **Backend / Authentication**: Supabase (PostgreSQL pooler on AWS), Firebase Auth/Admin, Resend (Email/OTP), Razorpay (Payments).
- **Subprojects**:
  - `functions/`: Firebase Cloud Functions (TypeScript 5.6, Node 20).
  - `mobile/`: React Native Expo 51 application.
  - `services/`: `interview-orchestrator` (Express), `pdf-service` (Express/Puppeteer), `interview-scorer` (Python Flask).
  - `myra-ai/` & `rag/`: AI knowledge retrieval and benchmark evaluation.
- **Verification Harness**: 17 unit test suites (`test/unit/`), 21 integration test suites (`test/integration/`), 2 security test suites (`test/security/`), 1 E2E critical journeys suite (`test/e2e/`), and 51 operational verification scripts (`scripts/`).

---

## Feature / Defect Inventory
Every defect and requirement identified from the survey phase is recorded below:

| # | Feature / Defect | Description | Milestone | Source |
|---|---|---|---|---|
| 1 | LINT-01 | Missing root `.eslintrc.json` causing interactive hang on `npm run lint` | M1 | Survey 1, 2, 3 |
| 2 | BUILD-01 | Production build failure during page data collection (`/admin/edbuild` module resolution and stale `.next` chunks) | M1 | Survey 1, 2, 3 |
| 3 | TEST-PKG | Missing standard `"test"` script in root `package.json` | M1 | Survey 1, 3 |
| 4 | ESM-01 | Node ESM extensionless imports in `src/lib/ai/myra-agent.ts` causing `ERR_MODULE_NOT_FOUND` in unit tests | M2 | Survey 2, 3 |
| 5 | ESM-02 | Relative import and path alias resolution in `src/lib/mcp/tools/resend.ts` for Node ESM runners | M2 | Survey 2, 3 |
| 6 | PROMPT-01 | Persona and guidance text drift in `MYRA_SYSTEM_PROMPT` (`src/lib/ai/myra-agent.ts`) breaking `myra_system_prompt_v2.test.js` | M2 | Survey 1, 2, 3 |
| 7 | AUTH-SEC | Missing `INTERNAL_SERVICE_SECRET` environment configuration causing 401 rejections on internal endpoints | M2 | Survey 2, 3 |
| 8 | UI-RESP-01 | Origami trigger positioning in `src/components/layout/FloatingNav.tsx` (`bottom-6 left-6`) | M3 | Survey 1, 2, 3 |
| 9 | UI-RESP-02 | Aptitude test navigator button column responsiveness in `src/app/aptitude/page.tsx` (`grid-cols-5 sm:grid-cols-10`) | M3 | Survey 1, 2, 3 |
| 10 | UI-RESP-03 | Mobile chassis container dimension enforcement in `src/app/mobile/page.tsx` (`max-w-[390px]`, `h-[844px]`) | M3 | Survey 1, 2, 3 |
| 11 | UI-DASH-01 | Missing `ContinueDsaWidget` import and render in `src/app/dashboard/page.tsx` | M3 | Survey 1, 2, 3 |
| 12 | UI-BRAND-01 | Brand header and copy alignment in `src/app/learn/page.tsx` and `src/app/admin/security/page.tsx` | M3 | Survey 2, 3 |
| 13 | TEST-SYNTAX | Missing `describe`/`it` imports in `myra_direct_reply.test.js` and `proctoring_and_interview_flow.test.js` | M3 | Survey 1, 3 |
| 14 | TEST-SYNC | Sync redirected routes in `test/integration/edworld_website_redesign.test.js` (`/practice` -> `/dsa`, `/showcase`) | M3 | Survey 1, 2, 3 |
| 15 | REG-TEST-01 | Automated test coverage for `src/lib/career/roadmap-generator.ts` | M4 | Survey 3 |
| 16 | REG-TEST-02 | Automated test coverage for `src/lib/interview/language-analysis-service.ts` | M4 | Survey 3 |
| 17 | REG-TEST-03 | Automated test coverage for `src/lib/email-service.ts` | M4 | Survey 3 |
| 18 | REG-TEST-04 | Automated test coverage for `src/middleware.ts` WAF rules and edge routing | M4 | Survey 3 |
| 19 | E2E-GATE | Full repository dual-track verification: static typecheck, lint, production build, 100% test pass, Challenger stress test, and Forensic Audit | M5 | Acceptance Criteria |

---

## Milestones

| # | Name | Scope | Dependencies | Status |
|---|---|---|---|---|
| M1 | Tooling & Build Pipeline | Create `.eslintrc.json`, add `"test"` script to `package.json`, fix page data collection (`/admin/edbuild`), clean `.next` cache, verify `npm run lint` and `npm run build` | none | DONE |
| M2 | Core Logic & Module Resolution | Fix ESM imports in `myra-agent.ts` & `resend.ts`, restore canonical `MYRA_SYSTEM_PROMPT` in `myra-agent.ts`, configure `INTERNAL_SERVICE_SECRET`, verify 17/17 unit tests | M1 | DONE |
| M3 | UI Responsive & Integration Repairs | Fix `FloatingNav.tsx`, `aptitude/page.tsx`, `mobile/page.tsx`, `dashboard/page.tsx`, brand headers, missing `node:test` imports, and redirected route assertions | M2 | IN_PROGRESS |
| M4 | Regression Suite Expansion | Implement new automated tests: `test/unit/career_roadmap_generator.test.ts`, `test/unit/language_analysis_service.test.ts`, `test/unit/email_service_resend.test.ts`, `test/unit/middleware_waf.test.ts` | M3 | PLANNED |
| M5 | Final Dual-Track Gate & Audit | Run all lint, build, unit, integration, security, and E2E test suites; execute Challenger and Forensic Auditor checks | M4 | PLANNED |

---

## Interface Contracts

### 1. `src/lib/ai/myra-agent.ts` ↔ Test Suites
- System prompt `MYRA_SYSTEM_PROMPT` must contain:
  - Canonical designation: `"You are Myra, the AI study and career mentor from EdWorld Co."`
  - Target audience: `"Class 12 up to undergraduate, postgraduate and early-career"`
  - Factuality rule: `"Never invent exam dates"`
- Imports must use explicit extensions (e.g. `import { MyraStudentProfileAnalyzer } from "./myra-profile-analyzer.ts"`) to allow both Node ESM execution and Next.js bundler resolution.

### 2. `src/middleware.ts` ↔ Internal Service Endpoints
- Header `x-internal-secret` checked against `process.env.INTERNAL_SERVICE_SECRET`.
- When `INTERNAL_SERVICE_SECRET` is configured (or fallback provided), internal API requests must return `200 OK` or valid functional status instead of `401 AUTH_REQUIRED`.

### 3. Responsive UI Contracts
- `src/components/layout/FloatingNav.tsx`: Origami trigger anchored at `bottom-6 left-6`.
- `src/app/aptitude/page.tsx`: Question navigator button grid uses `grid-cols-5 sm:grid-cols-10 gap-1.5`.
- `src/app/mobile/page.tsx`: Mobile simulator chassis adheres to `max-w-[390px]` and `h-[844px]`.
- `src/app/dashboard/page.tsx`: Imports and renders `<ContinueDsaWidget userId={...} />`.

---

## Code Layout
- Root Next.js Application: `src/`
  - Pages & Routes: `src/app/`
  - Components: `src/components/`
  - Library modules: `src/lib/`
  - Hooks: `src/hooks/`
- Test Suites: `test/`
  - Unit tests: `test/unit/`
  - Integration tests: `test/integration/`
  - Security tests: `test/security/`
  - E2E tests: `test/e2e/`
- Tooling & Configuration:
  - `.eslintrc.json`
  - `package.json`
  - `tsconfig.json`
  - `next.config.mjs`
