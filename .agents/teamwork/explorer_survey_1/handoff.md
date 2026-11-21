# Baseline Survey & Repository Architecture Report

**Agent**: Explorer Survey 1 (`teamwork_explorer`)  
**Target Repository**: `c:\Users\adars\eddp`  
**Date**: 2026-11-09T08:52:00Z  
**Parent Orchestrator**: `2652dcf8-f3eb-4981-95c8-2284d2b17259`

---

## Executive Summary

A comprehensive architectural and tooling survey was conducted across the repository. The project is primarily a **Next.js 14 (App Router) / React 18 / TypeScript 5** full-stack web application with Supabase (PostgreSQL) and Firebase backends, supplemented by subprojects for Firebase Functions, Expo/React Native mobile, microservices (Express/Puppeteer, Flask scoring), and AI pipelines (Myra AI, RAG).

### Baseline Command Execution Matrix
| Target / Script | Command | Result | Exit Code | Root Cause / Note |
|---|---|---|---|---|
| **Root Typecheck** | `cmd /c npx tsc --noEmit` | **PASS** | `0` | Zero type errors across all included TypeScript files. |
| **Root Lint** | `cmd /c npm run lint` (`next lint`) | **FAIL** | `1` | Missing `.eslintrc.json` prompts interactively and aborts in non-interactive shell. |
| **Root Build** | `cmd /c npm run build` (`next build`) | **FAIL** | `1` | Hangs on interactive lint prompt; with `--no-lint` fails with `PageNotFoundError: Cannot find module for page: /admin/edbuild` during page data collection. |
| **Functions Build** | `cd functions && cmd /c npm run build` (`tsc`) | **PASS** | `0` | Clean TypeScript compilation to `functions/lib`. |
| **Functions Lint** | `cd functions && cmd /c npm run lint` | **FAIL** | `1` | `'eslint' is not recognized as an internal or external command`; `eslint` is absent from `functions/devDependencies`. |
| **Services: Orchestrator** | `cd services/interview-orchestrator && cmd /c npm run build` | **FAIL** | `1` | TS2307: `node_modules` not installed. |
| **Services: PDF** | `cd services/pdf-service && cmd /c npm run build` | **FAIL** | `1` | TS2307: `node_modules` not installed. |
| **Services: Scorer** | `cd services/interview-scorer && py -m pytest` | **FAIL** | `1` | `ModuleNotFoundError: No module named 'flask'`; virtual environment blocked by Windows Device Guard. |
| **Unit Tests (`test/unit/`)** | Batch test execution (17 suites) | **16 PASS / 1 FAIL** | — | `test/unit/myra_system_prompt_v2.test.js` failed on persona string assertion. |
| **Integration Tests (`test/integration/`)** | Batch test execution (21 suites) | **7 PASS / 14 FAIL** | — | Failures due to test runner syntax (omitted `node:test` imports), deleted pages (`/practice`, `/showcase`), missing dashboard widgets (`ContinueDsaWidget`), mobile container constraints, and unmocked authenticated routes. |
| **Security Tests (`test/security/`)** | `test/security/*.test.js` (2 suites) | **2 PASS / 0 FAIL** | `0` | All regression and workflow auth security tests pass. |
| **E2E Tests (`test/e2e/`)** | `test/e2e/critical_user_journeys.test.js` (1 suite) | **1 PASS / 0 FAIL** | `0` | Critical user journeys test passes. |
| **Verification Scripts (`scripts/`)** | `scripts/verify_*.js` (51 scripts) | **18 PASS / 33 FAIL** | — | Fails largely due to live database connection requirements (local Postgres port 5432 closed / remote Supabase DNS unresolvable) and feature regressions. |

---

## 1. Repository Architecture & Directory Inventory

### 1.1 Structural Layout
```
c:\Users\adars\eddp\
├── src/                               # Primary Next.js 14 App Router application
│   ├── app/                           # Route handlers and UI pages
│   │   ├── (auth)/, admin/, api/,     # Route groups and core endpoints
│   │   ├── career/, dashboard/, dsa/, # Student/Professional feature areas
│   │   ├── interviews/, jobs/, learn/,# Domain modules
│   │   └── layout.tsx, middleware.ts  # Root layout & auth/security gate middleware
│   ├── components/                    # Reusable React components
│   │   ├── ai/, auth/, dashboard/,    # Domain component directories
│   │   ├── focus/, interview/,        # Interview and focus tools
│   │   ├── landing/, layout/, mobile/,# Navigation, landing, and mobile components
│   │   └── ui/                        # Core UI primitives
│   ├── hooks/                         # Client React hooks
│   └── lib/                           # Core utilities, AI agents, Supabase/Firebase clients
├── functions/                         # Firebase Cloud Functions (TypeScript 5.6, Node 20)
├── mobile/                            # React Native / Expo application (Expo 51, React 18.2)
├── services/                          # Backend microservices
│   ├── interview-orchestrator/        # Express/TypeScript pipeline coordinator
│   ├── pdf-service/                   # Express/Puppeteer PDF generator
│   └── interview-scorer/              # Python/Flask AI scoring service
├── myra-ai/                           # Myra AI prompt sets, training datasets, SQLite/Vector DBs
├── rag/                               # RAG ingestion scripts, embeddings, and chunks
├── supabase/                          # Supabase config and PostgreSQL migrations
├── k8s/                               # Kubernetes staging and production deployment manifests
├── test/                              # Automated test suites
│   ├── unit/                          # 17 unit test suites (.js and .mjs)
│   ├── integration/                   # 21 integration test suites (.js)
│   ├── security/                      # 2 security test suites (.js)
│   ├── e2e/                           # 1 end-to-end critical journey suite (.js)
│   └── load/                          # k6 load testing script
├── scripts/                           # 74 operational and verification scripts
└── External / Third-party (Ignored)   # datatrove, dolma, Megatron-LM, nanoGPT, backups, scratch
```

### 1.2 Languages, Frameworks, and Package Managers
1. **Primary Frontend & API**:
   - **Framework**: Next.js 14.2.35 (App Router)
   - **Language**: TypeScript 5.6.2, React 18.3.1
   - **Styling**: Tailwind CSS 3.4.11, PostCSS 8.4.47, Lucide Icons
   - **Package Manager**: npm (Node.js v24.19.0 runtime environment on Windows)
2. **Backend & Cloud Infrastructure**:
   - **Database / Auth**: Supabase (`@supabase/supabase-js` 2.112.4, `@supabase/server` 1.4.1), Firebase 10.13.2 / Firebase Admin 12.5.0, PostgreSQL (`pg` 8.23.0)
   - **Email / Communications**: Resend 6.31.0
   - **Payment Gateway**: Razorpay 2.9.8
   - **AI SDKs**: `@anthropic-ai/sdk` 0.126.0, `@google/genai` 2.23.0, OpenAI 4.61.0
3. **Subprojects**:
   - `functions/`: Firebase Functions (Node.js 20, TypeScript 5.6.2, npm)
   - `mobile/`: Expo 51.0.0, React Native 0.74.2, TypeScript 5.3.3
   - `services/interview-orchestrator`: Express 4.19.2, TypeScript 5.4.5
   - `services/pdf-service`: Express 4.19.2, Puppeteer 22.10.0, TypeScript 5.4.5
   - `services/interview-scorer`: Python 3.14 / Flask (Dockerized service)

---

## 2. Configuration & Build Tooling Inventory

1. **Root `package.json`**:
   - Scripts configured:
     - `"dev": "next dev"`
     - `"build": "next build"`
     - `"start": "next start"`
     - `"lint": "next lint"`
   - Note: No `"test"` or `"typecheck"` script is defined in `package.json`.
2. **Root `tsconfig.json`**:
   - `target`: `es5`
   - `module`: `esnext`
   - `moduleResolution`: `bundler`
   - `strict`: `true`
   - `paths`: `@/*: ["./src/*"]`
   - `exclude`: `["node_modules", "functions", "mobile", "services"]`
3. **Root `next.config.mjs`**:
   - Configures strict redirects for canonical routes (e.g. `/practice` -> `/dsa`, `/for-career` -> `/for/students`).
   - Configures security headers (HSTS, X-Frame-Options, CSP/Permissions-Policy).
   - Remote image patterns for Unsplash, GitHub, Google, Firebase Storage.
4. **Root `.gitignore`**:
   - Ignores build artifacts (`.next/`, `out/`, `build/`, `dist/`), dependencies (`node_modules/`), test coverage (`/coverage`), and upstream/clone folders (`Megatron-LM/`, `datatrove/`, `dolma/`, `nanoGPT/`, `backups/`, `scratch/`).

---

## 3. Five-Component Handoff Report

### 3.1 Observation

1. **TypeScript Typecheck**:
   - Command: `cmd /c npx tsc --noEmit`
   - Result: Exit code `0`, no standard error or output. All included TypeScript files in `src/` typecheck cleanly under `strict: true`.

2. **Root Linter (`npm run lint`)**:
   - Command: `cmd /c npm run lint` (`next lint`)
   - Verbatim Output:
     ```
     > edworld-co@0.1.0 lint
     > next lint

     ? How would you like to configure ESLint? https://nextjs.org/docs/basic-features/eslint
     ❯  Strict (recommended)
        Base
        Cancel ⚠ If you set up ESLint yourself, we recommend adding the Next.js ESLint plugin. See https://nextjs.org/docs/basic-features/eslint#migrating-existing-config
     ```
   - Exit code: `1`. No `.eslintrc.json` or `.eslintrc.js` exists in the repository root.

3. **Root Production Build (`npm run build`)**:
   - Command: `cmd /c npm run build` (`next build`)
   - Observation: When executed normally, `next build` triggers the internal linter, which hangs awaiting stdin due to the missing ESLint configuration.
   - Command: `cmd /c npx next build --no-lint`
   - Verbatim Output:
     ```
      ⚠ Linting is disabled.
       ▲ Next.js 14.2.35
       - Environments: .env.local

        Creating an optimized production build ...
     <w> [webpack.cache.PackFileCacheStrategy] Caching failed for pack: Error: ENOENT: no such file or directory, stat 'C:\Users\adars\eddp\.next\cache\webpack\server-production\0.pack'
      ✓ Compiled successfully
        Checking validity of types ...
        Collecting page data ...
     PageNotFoundError: Cannot find module for page: /admin/edbuild
         at getPagePath (C:\Users\adars\eddp\node_modules\next\dist\server\require.js:94:15)
         at requirePage (C:\Users\adars\eddp\node_modules\next\dist\server\require.js:99:22)
         at C:\Users\adars\eddp\node_modules\next\dist\server\load-components.js:103:84
         at process.processTicksAndRejections (node:internal/process/task_queues:104:5)
         at async loadComponentsImpl (C:\Users\adars\eddp\node_modules\next\dist\server\load-components.js:103:26)
         at async C:\Users\adars\eddp\node_modules\next\dist\build\utils.js:1116:32
         at async Span.traceAsyncFn (C:\Users\adars\eddp\node_modules\next\dist\trace\trace.js:154:20) {
       code: 'ENOENT'
     }

     > Build error occurred
     Error: Failed to collect page data for /admin/edbuild
         at C:\Users\adars\eddp\node_modules\next\dist\build\utils.js:1269:15
         at process.processTicksAndRejections (node:internal/process/task_queues:104:5) {
       type: 'Error'
     }
     ```
   - Exit code: `1`.

4. **Functions Project (`functions/`)**:
   - Command: `cmd /c "cd functions && npm run build"` -> Exit code `0` (`tsc` compiled cleanly).
   - Command: `cmd /c "cd functions && npm run lint"` -> Exit code `1`:
     `'eslint' is not recognized as an internal or external command, operable program or batch file.`

5. **Microservices (`services/`)**:
   - `services/interview-orchestrator`: `npm run build` exits with code `1`:
     `src/server.ts(1,58): error TS2307: Cannot find module 'express' or its corresponding type declarations.`
   - `services/pdf-service`: `npm run build` exits with code `1`:
     `src/server.ts(1,58): error TS2307: Cannot find module 'express' or its corresponding type declarations.`
   - `services/interview-scorer`: `py -m pytest` exits with code `1`:
     `ModuleNotFoundError: No module named 'flask'`. (Local python executable `.my-env\Scripts\python.exe` is blocked by Windows Device Guard).

6. **Unit Tests (`test/unit/`)**:
   - 17 total test files examined.
   - 16 files pass: `age_band.test.js`, `effective_level.test.js`, `entitlements.test.js`, `gamification_idempotency.test.js`, `live_interview_simulation.test.mjs`, `myra_15_test_cases.test.mjs`, `myra_app_guide_prompt.test.mjs`, `myra_career_writing_assistant.test.mjs`, `myra_interview_coach.test.mjs`, `myra_onboarding_assistant.test.mjs`, `myra_rag_retriever.test.mjs`, `myra_tool_registry.test.js`, `otp_resend_strong_auth.test.mjs`, `password_reset_resend.test.mjs`, `razorpay_signatures.test.js`, `scoring_logic.test.js`.
   - 1 file fails: `test/unit/myra_system_prompt_v2.test.js`:
     ```
     AssertionError [ERR_ASSERTION]: Should designate study and career mentor
         at Object.<anonymous> (C:\Users\adars\eddp\test\unit\myra_system_prompt_v2.test.js:10:1)
     ```
     In `src/lib/ai/myra-agent.ts:75`, the text is `"You are Myra, the dedicated AI study, engineering, and career mentor from EdWorld Co."`, but the test strictly expects `"AI study and career mentor from EdWorld Co"`.

7. **Integration Tests (`test/integration/`)**:
   - 21 total test files examined.
   - 7 pass: `auth_onboarding_flow.test.js`, `featured_events_flow.test.js`, `myra_floating_circle_and_data_reply.test.js`, `pipeline_end_to_end.test.js`, `razorpay_verification.test.js`, `resend_password_reset_flow.test.js`, `voice_interview_policy.test.js`.
   - 14 fail:
     1. `apple_android_responsive_ui.test.js`: Missing Origami trigger in `FloatingNav.tsx`; aptitude navigator column assertion.
     2. `career_path_selection.test.js`: HTTP 401 on unauthenticated test requests to `/api/user/career-paths`.
     3. `dsa_curriculum_and_practice.test.js`: `AssertionError: Dashboard must import and render ContinueDsaWidget`.
     4. `edworld_website_redesign.test.js`: `ENOENT` on deleted `src/app/practice/page.tsx` and `src/app/showcase/page.tsx`; missing `'Skills & Career OS'` tagline.
     5. `learn_courses_and_certificate.test.js`: Subdomain Host header test failure (`learn.localhost:3000`).
     6. `mobile_extended_screens.test.js`: `max-w-[390px]` assertion failure in `src/app/mobile/page.tsx`.
     7. `mobile_prototype_ui.test.js`: `max-w-[390px]` assertion failure in `src/app/mobile/page.tsx`.
     8. `myra_direct_reply.test.js`: `ReferenceError: describe is not defined` (missing `const { describe, it } = require("node:test")`).
     9. `network_live_data.test.js`: Remote database DNS resolution failure (`getaddrinfo ENOTFOUND db.wgyscapdywroefsjenno.supabase.co`).
     10. `proctoring_and_interview_flow.test.js`: `ReferenceError: describe is not defined` (missing `const { describe, it } = require("node:test")`).
     11. `resume_voice_assist.test.js`: Question generation source tags assertion failure.
     12. `rls_enforcement.test.js`: Local Postgres port 5432 `ECONNREFUSED`.
     13. `sentinel_security_agent.test.js`: SOC page AI analyst interface assertion failure.
     14. `voice_privacy_and_retention.test.js`: Audio discard assertion failure.

8. **Security & E2E Suites**:
   - `test/security/security_regression_suite.test.js`: PASS.
   - `test/security/workflow_and_auth_security.test.js`: PASS.
   - `test/e2e/critical_user_journeys.test.js`: PASS.

---

### 3.2 Logic Chain

1. **Static Analysis & Tooling Chain**:
   - Observation 1 demonstrates that the TypeScript codebase has zero compiler errors when evaluated with standard `tsc --noEmit`.
   - Observation 2 demonstrates that the root project lacks any ESLint configuration (`.eslintrc.json` or equivalent). Next.js requires an ESLint config file to run `next lint` non-interactively; without it, `next lint` prompts the user interactively, which immediately fails in CI / background tasks with exit code `1`.
   - Therefore, creating `.eslintrc.json` with standard Next.js extensions (e.g. `{"extends": "next/core-web-vitals"}`) is required to unblock `npm run lint`.

2. **Build Failure Chain**:
   - Observation 3 shows that during `next build`, after TypeScript checks succeed, page data collection fails with `PageNotFoundError: Cannot find module for page: /admin/edbuild`.
   - Inspection of `.next/server/app-paths-manifest.json` revealed that webpack's output manifest was incomplete (only containing 5 API routes) alongside a corrupted pack cache (`0.pack ENOENT`).
   - Therefore, unblocking the root build requires resolving the ESLint configuration blocker, clearing stale `.next` cache artifacts, and verifying that all app routes in `src/app/` (specifically `/admin/edbuild`) resolve cleanly during static optimization.

3. **Subprojects Dependency Chain**:
   - Observations 4 and 5 indicate that subproject dependencies (`functions`, `services/interview-orchestrator`, `services/pdf-service`) are either partially installed or uninstalled.
   - In `functions/package.json`, `"eslint": "eslint --ext .js,.ts ."` is configured in `scripts`, but `eslint` is absent from `devDependencies`, causing `npm run lint` to fail with command not found.
   - Microservices under `services/` do not have `node_modules` present in this checkout.

4. **Test Suite Defect Chain**:
   - Observations 6 and 7 show that automated tests fail across three distinct categories:
     a) **Test code syntax/harness defects**: `myra_direct_reply.test.js` and `proctoring_and_interview_flow.test.js` call `describe()` without importing `describe` and `it` from `node:test`.
     b) **Divergent strings & refactored routes**:
        - `myra_system_prompt_v2.test.js` fails because `src/lib/ai/myra-agent.ts` was edited to include `"engineering"`.
        - `edworld_website_redesign.test.js` attempts to open deleted files (`src/app/practice/page.tsx` and `src/app/showcase/page.tsx`) that were consolidated and redirected in `next.config.mjs`.
        - `mobile_extended_screens.test.js` and `mobile_prototype_ui.test.js` fail on missing regex pattern `max-w-[390px]` in `src/app/mobile/page.tsx`.
        - `dsa_curriculum_and_practice.test.js` fails on missing `ContinueDsaWidget` import in `src/app/dashboard/page.tsx`.
     c) **Environment / Live Network Dependencies**:
        - `career_path_selection.test.js` issues unauthenticated requests to `/api/user/career-paths`.
        - `network_live_data.test.js` and `rls_enforcement.test.js` require an active PostgreSQL / Supabase server.

---

### 3.3 Caveats

1. **Live Network / Database Services**: Tests requiring active network connections to Supabase cloud (`db.wgyscapdywroefsjenno.supabase.co`) or a local Postgres daemon on port 5432 failed due to network isolation/offline state.
2. **Third-Party Submodules**: Ignored folders (`Megatron-LM`, `nanoGPT`, `datatrove`, `dolma`) were excluded from the baseline survey per `.gitignore`.
3. **Execution Environment**: Windows environment execution requires `.cmd` wrappers (`npm.cmd`) or `cmd /c` to bypass PowerShell script execution restrictions. Python virtual environments in `.my-env` are blocked by local Windows Device Guard policy; `py.exe` was used for Python inspection.

---

### 3.4 Conclusion

The repository is healthy in terms of core TypeScript static typing (`tsc --noEmit` passes 100%), core security suites (100% pass), and e2e critical user journeys (100% pass). However, the baseline state currently fails Acceptance Criteria on:
1. **Lint Script**: `next lint` fails due to missing `.eslintrc.json`. `functions/lint` fails due to missing `eslint` dependency.
2. **Build Script**: `next build` fails due to interactive lint blocking and `/admin/edbuild` page data collection failure.
3. **Test Suites**:
   - Unit tests: 1 assertion mismatch in `myra_system_prompt_v2.test.js`.
   - Integration tests: 14 test suites fail due to test harness missing imports, deleted file paths, missing UI tokens/widgets, and unmocked auth headers.

Addressing these specific static, build, and test issues will bring the repository into full compliance with the Acceptance Criteria.

---

### 3.5 Verification Method

An engineer or subsequent agent can independently verify these findings using the following commands from the repository root (`c:\Users\adars\eddp`):

1. **Verify TypeScript Status**:
   ```cmd
   cmd /c npx tsc --noEmit
   ```
   *Expected outcome*: Exits with code `0` (clean).

2. **Verify Root Lint Failure**:
   ```cmd
   cmd /c npm run lint
   ```
   *Expected outcome*: Exits with code `1`, displaying interactive prompt `How would you like to configure ESLint?`.

3. **Verify Root Build Failure**:
   ```cmd
   cmd /c npx next build --no-lint
   ```
   *Expected outcome*: Exits with code `1` and error `PageNotFoundError: Cannot find module for page: /admin/edbuild`.

4. **Verify Unit Test Baseline**:
   ```cmd
   cmd /c node test/unit/myra_system_prompt_v2.test.js
   ```
   *Expected outcome*: Exits with code `1` (`AssertionError: Should designate study and career mentor`).

5. **Verify Integration Test Harness Failure**:
   ```cmd
   cmd /c node test/integration/myra_direct_reply.test.js
   ```
   *Expected outcome*: Exits with code `1` (`ReferenceError: describe is not defined`).
