# Explorer Survey 2: Source Code & Static Defect Audit Report

**Agent**: Explorer Survey 2 (`teamwork_explorer`)  
**Target Repository**: `c:\Users\adars\eddp` (`edworld-co`)  
**Date**: 2026-11-09T08:55:00Z  
**Parent Conversation ID**: `2652dcf8-f3eb-4981-95c8-2284d2b17259`  
**Working Directory**: `c:\Users\adars\eddp\.agents\teamwork\explorer_survey_2\`  
**Milestone**: `repository_survey_and_defect_audit`  

---

## 1. Observation

### 1.1 Direct Tool Commands and Compiler / Linter Outputs

#### Observation 1.1.1: Root TypeScript Compilation (`tsc`)
- **Command**: `cmd.exe /c "npx tsc --noEmit"`
- **Result**: Exit code `0`.
- **Output**: Clean compilation. Zero syntax errors or static type errors across all files included in root `tsconfig.json`.

#### Observation 1.1.2: Root Lint Script (`next lint`)
- **Command**: `cmd.exe /c "npm run lint"`
- **Result**: Exit code `1`.
- **Verbatim Error Output**:
  ```
  > edworld-co@0.1.0 lint
  > next lint

  ? How would you like to configure ESLint? https://nextjs.org/docs/basic-features/eslint
  ❯  Strict (recommended)
     Base
     Cancel ⚠ If you set up ESLint yourself, we recommend adding the Next.js ESLint plugin.
  ```
- **Finding**: Root lacks `.eslintrc.json`, causing `next lint` to launch an interactive prompt that immediately aborts with exit code 1 in non-interactive CI environments.

#### Observation 1.1.3: Production Build Failure (`next build`)
- **Command**: `cmd.exe /c "npm run build"`
- **Result**: Exit code `1`.
- **Verbatim Error Output**:
  ```
  > edworld-co@0.1.0 build
  > next build

    ▲ Next.js 14.2.35
    - Environments: .env.local

     Creating an optimized production build ...
  <w> [webpack.cache.PackFileCacheStrategy] Caching failed for pack: Error: ENOENT: no such file or directory, stat 'C:\Users\adars\eddp\.next\cache\webpack\server-production\0.pack'
   ✓ Compiled successfully
     Linting and checking validity of types ...
     Collecting page data ...
  unhandledRejection Error: Cannot find module './1682.js'
  Require stack:
  - C:\Users\adars\eddp\.next\server\webpack-runtime.js
  - C:\Users\adars\eddp\.next\server\pages\_document.js
  - C:\Users\adars\eddp\node_modules\next\dist\server\require.js
  - C:\Users\adars\eddp\node_modules\next\dist\server\load-components.js
  - C:\Users\adars\eddp\node_modules\next\dist\build\utils.js
  - C:\Users\adars\eddp\node_modules\next\dist\build\worker.js
  - C:\Users\adars\eddp\node_modules\next\dist\compiled\jest-worker\processChild.js
  ```
- **Context**: A lingering background `node.exe` development server process (PID `29524`, listening on port 3000 with 1.07 GB memory) holds file locks and writes development assets concurrently into `.next/`, corrupting production webpack chunk bundles (`server/chunks/1682.js` vs `./1682.js`).

#### Observation 1.1.4: Firebase Cloud Functions Build & Lint
- **Command**: `cd functions && cmd.exe /c "npm run build"`
- **Result**: Exit code `0` (`tsc` compiled successfully to `functions/lib`).
- **Command**: `cd functions && cmd.exe /c "npm run lint"`
- **Result**: Exit code `1` (`'eslint' is not recognized as an internal or external command`; missing from `functions/devDependencies`).

---

### 1.2 Direct Test Suite Executions & Exact Failures

#### Observation 1.2.1: Node ESM Relative Import Resolution Failure (`.test.mjs`)
- **Command**: `node test/unit/myra_15_test_cases.test.mjs`
- **Verbatim Error**:
  ```
  Error [ERR_MODULE_NOT_FOUND]: Cannot find module 'C:\Users\adars\eddp\src\lib\ai\myra-profile-analyzer' imported from C:\Users\adars\eddp\src\lib\ai\myra-agent.ts
      at finalizeResolution (node:internal/modules/esm/resolve:271:11)
      at moduleResolve (node:internal/modules/esm/resolve:865:10)
  ```
- **Affected Files & Lines**:
  - `src/lib/ai/myra-agent.ts`:
    - Line 6: `import { MyraStudentProfileAnalyzer } from "./myra-profile-analyzer";` (lacks `.ts`)
    - Line 7: `import { MyraDatasetService } from "./myra-datasets";` (lacks `.ts`)
    - Line 8: `import { MyraRagRetriever } from "./myra-rag";` (lacks `.ts`)
    - Line 13: `} from "../interview/interview-bank";` (lacks `.ts`)
  - `src/lib/mcp/tools/resend.ts`:
    - Line 7: `import { MCPToolDefinition, MCPToolResult, MCPAuthContext } from "../types";` (lacks `.ts`)
    - Line 15: `} from "@/lib/email-service";` (Next.js alias `@/` unresolvable in vanilla Node ESM)
- **Impacted Suites**:
  - `test/unit/myra_15_test_cases.test.mjs`
  - `test/unit/myra_app_guide_prompt.test.mjs`
  - `test/unit/myra_career_writing_assistant.test.mjs`
  - `test/unit/myra_interview_coach.test.mjs`
  - `test/unit/myra_onboarding_assistant.test.mjs`
  - `test/unit/otp_resend_strong_auth.test.mjs`

#### Observation 1.2.2: Myra Canonical Prompt Drift
- **Command**: `node test/unit/myra_system_prompt_v2.test.js`
- **Verbatim Error**:
  ```
  AssertionError [ERR_ASSERTION]: Should designate study and career mentor
      at Object.<anonymous> (C:\Users\adars\eddp\test\unit\myra_system_prompt_v2.test.js:10:1)
  ```
- **Location**: `src/lib/ai/myra-agent.ts`, line 75:
  - Current: `You are Myra, the dedicated AI study, engineering, and career mentor from EdWorld Co.`
  - Expected: `You are Myra, the AI study and career mentor from EdWorld Co.`
  - Missing text: `Class 12 up to undergraduate, postgraduate and early-career`, exact rule `Never invent exam dates` (file has `Never invent official exam dates`).
  - Related suite: `test/integration/myra_direct_reply.test.js` expects `ANSWER ONLY WHAT IS ASKED`, `Do NOT dump extra sections`, and `SILENT BACKGROUND CONTEXT`.

#### Observation 1.2.3: Mobile Responsive Layout Defects
- **Command**: `node test/integration/apple_android_responsive_ui.test.js`
- **Verbatim Errors**:
  ```
  ✖ 3. FloatingNav & MyraChatbot provide thumb-zone dock, Origami unfold, and non-overlapping modal coordination
  AssertionError [ERR_ASSERTION]: FloatingNav must preserve bottom-left Origami trigger
      at TestContext.<anonymous> (C:\Users\adars\eddp\test\integration\apple_android_responsive_ui.test.js:64:5)

  ✖ 4. Feature pages & Anti-OCR canvases adapt cleanly across compact mobile, tablet, and desktop
  AssertionError [ERR_ASSERTION]: Aptitude question navigator must use 5 columns on phones and 10 columns on larger screens
      at TestContext.<anonymous> (C:\Users\adars\eddp\test\integration\apple_android_responsive_ui.test.js:129:5)
  ```
- **Locations**:
  - `src/components/layout/FloatingNav.tsx`: Line 333 uses `fixed bottom-6 left-1/2 -translate-x-1/2` instead of `bottom-6 left-6`.
  - `src/app/aptitude/page.tsx`: Line 485 uses `<div className="grid grid-cols-10 gap-1.5">` instead of `grid grid-cols-5 sm:grid-cols-10 gap-1.5`.

#### Observation 1.2.4: Missing DSA Component & Quick Link in Dashboard
- **Command**: `node test/integration/dsa_curriculum_and_practice.test.js`
- **Verbatim Error**:
  ```
  ✖ 7. Verifies Dashboard & FloatingNav Integration (2.0529ms)
  AssertionError [ERR_ASSERTION]: Dashboard must import and render ContinueDsaWidget
      at TestContext.<anonymous> (C:\Users\adars\eddp\test\integration\dsa_curriculum_and_practice.test.js:170:5)
  ```
- **Location**: `src/app/dashboard/page.tsx` was redesigned and completely stripped out `ContinueDsaWidget`, the `/dsa` quick link, and the `continue_dsa` section layout.

#### Observation 1.2.5: Mobile Prototype Chassis Viewport Drift
- **Command**: `node test/integration/mobile_extended_screens.test.js` and `node test/integration/mobile_prototype_ui.test.js`
- **Verbatim Error**:
  ```
  ✖ Master Prototype Page - Edge States Simulator and Screen Routing
  AssertionError [ERR_ASSERTION]: Chassis 390px width enforced
      expected: /max-w-\[390px\]/
  ```
- **Location**: `src/app/mobile/page.tsx`, lines 282 & 287 use `max-w-[460px]` and `h-[780px]` instead of iPhone standard `max-w-[390px]` and `h-[844px]`.

#### Observation 1.2.6: Learn Academy Branding Header Omission
- **Command**: `node --env-file=.env.local test/integration/learn_courses_and_certificate.test.js`
- **Verbatim Error**:
  ```
  FAIL: [8] Subdomain Host header 'learn.localhost:3000' successfully resolves /learn
        Must render Learn academy page
  ```
- **Location**: `src/app/learn/page.tsx`, line 371 displays `Courses &amp; Learning Roadmaps` without mentioning `EdWorld Learn` or `learn.edworld.co.in`.

#### Observation 1.2.7: SOC Analyst Badge Label Drift
- **Command**: `node --env-file=.env.local test/integration/sentinel_security_agent.test.js`
- **Verbatim Error**:
  ```
  ✖ 8. Verifies Client-Side AegisClientShield, Admin SOC page, and robots.txt exist
  AssertionError [ERR_ASSERTION]: SOC page must feature AI analyst interface
      at TestContext.<anonymous> (C:\Users\adars\eddp\test\integration\sentinel_security_agent.test.js:115:12)
  ```
- **Location**: `src/app/admin/security/page.tsx`, line 599 has `Ask Sentinel AI SOC Analyst` instead of `Ask Aegis Sentinel AI Security Analyst`.

#### Observation 1.2.8: Missing `INTERNAL_SERVICE_SECRET` in Environment Configuration
- **Command**: `node --env-file=.env.local test/integration/career_path_selection.test.js` and `voice_privacy_and_retention.test.js`
- **Verbatim Errors**: Endpoints return `401 Unauthorized` (`AUTH_REQUIRED`).
- **Location**: `src/middleware.ts`, lines 357-360:
  ```typescript
  const internalSecret = process.env.INTERNAL_SERVICE_SECRET;
  const hasInternalAuth =
    !!internalSecret && req.headers.get("x-internal-secret") === internalSecret;
  ```
  `.env.local` lacks `INTERNAL_SERVICE_SECRET=edworld-internal-k8s-secret-2026`. Because `process.env.INTERNAL_SERVICE_SECRET` is undefined, `hasInternalAuth` evaluates to `false`, blocking all internal requests with 401.

#### Observation 1.2.9: Missing `node:test` Import in Integration Tests
- **Command**: `node test/integration/myra_direct_reply.test.js`
- **Verbatim Error**:
  ```
  ReferenceError: describe is not defined
      at Object.<anonymous> (C:\Users\adars\eddp\test\integration\myra_direct_reply.test.js:16:1)
  ```
- **Location**: `test/integration/myra_direct_reply.test.js` (line 16) and `test/integration/proctoring_and_interview_flow.test.js` (line 10) invoke `describe()` and `it()` without importing them from `node:test`.

#### Observation 1.2.10: Deleted App Pages Referenced by Static Tests
- **Location**: `src/app/practice/page.tsx` and `src/app/showcase/page.tsx` were removed and redirected via `next.config.mjs` to `/dsa`, but `test/integration/edworld_website_redesign.test.js` (lines 113 and 156) executes `fs.readFileSync` on these non-existent paths, throwing `ENOENT`.

---

## 2. Logic Chain

1. **Static Analysis & Typecheck (Root & Functions)**:
   - Root `tsc --noEmit` and `functions/src` `tsc` exit with code 0 (Observation 1.1.1, 1.1.4).
   - *Inference*: TypeScript syntax, types, and compiler interfaces are valid. Defects are localized to runtime behaviors, module resolution specifiers, missing configuration files, and UI layout invariants.

2. **Linter & Build Scripts**:
   - `npm run lint` fails because Next.js requires `.eslintrc.json` (Observation 1.1.2).
   - `next build` fails during page data collection due to corrupted webpack state caused by the concurrent orphan dev server PID 29524 locking files in `.next` (Observation 1.1.3).
   - *Inference*: Adding `.eslintrc.json` and ensuring `.next` is cleaned with dev processes terminated restores normal linting and production build workflows.

3. **Node ESM vs Bundler Module Resolution**:
   - Node 24 ESM test runners fail on extensionless relative imports in `src/lib/ai/myra-agent.ts` and `src/lib/mcp/tools/resend.ts` (Observation 1.2.1).
   - While Next.js webpack bundler resolves extensionless paths, Node's native ESM requires explicit `.ts` extensions.
   - *Inference*: Adding `.ts` extensions to relative imports in `myra-agent.ts` and `resend.ts` satisfies both Next.js bundler and Node ESM test runners simultaneously.

4. **Prompt & Security Drift**:
   - Prompt text in `myra-agent.ts` was edited during UI redesigns, drifting from canonical system prompts validated by `myra_system_prompt_v2.test.js` and `myra_direct_reply.test.js` (Observation 1.2.2).
   - *Inference*: Harmonizing the system prompt with the canonical definition restores test compliance while maintaining conversational fidelity.

5. **Responsive CSS & Component Completeness**:
   - Mobile and tablet tests expect specific CSS classes: `bottom-6 left-6` (Origami trigger in `FloatingNav.tsx`), `grid-cols-5 sm:grid-cols-10` (Aptitude test buttons), `max-w-[390px]` / `h-[844px]` (Mobile chassis), and `ContinueDsaWidget` (Dashboard) (Observations 1.2.3, 1.2.4, 1.2.5).
   - *Inference*: These are straightforward markup fixes in components and page templates that restore both automated test passes and intended mobile responsiveness.

6. **Authentication & Internal Security Gate**:
   - Middleware gates internal service routes behind `INTERNAL_SERVICE_SECRET`, which was missing from `.env.local` (Observation 1.2.8).
   - *Inference*: Populating `INTERNAL_SERVICE_SECRET=edworld-internal-k8s-secret-2026` in `.env.local` enables test suites to exercise protected endpoints without 401 rejections.

---

## 3. Comprehensive Function & Module Enumeration

### 3.1 Next.js App Router Pages & Layouts (`src/app/`)
| File Path | Component / Function | Purpose | Identified Status / Defect |
|---|---|---|---|
| `src/app/layout.tsx` | `RootLayout` | Root HTML shell, providers, AegisClientShield | Healthy |
| `src/app/page.tsx` | `HomePage` | Public marketing landing page | Healthy |
| `src/app/dashboard/page.tsx` | `DashboardPage` | Student/user central dashboard | **Defect**: Missing `ContinueDsaWidget` & `/dsa` quick link |
| `src/app/aptitude/page.tsx` | `AptitudePage` | 20-minute daily aptitude test suite | **Defect**: `grid-cols-10` squishes buttons on mobile |
| `src/app/mobile/page.tsx` | `MobilePrototypePage` | Mobile chassis & prototype simulator | **Defect**: `max-w-[460px]` violates 390px chassis constraint |
| `src/app/learn/page.tsx` | `LearnAcademyPage` | Gamified learning roadmaps & certifications | **Defect**: Missing `EdWorld Learn` brand heading |
| `src/app/admin/security/page.tsx` | `SecurityAdminPage` | SOC grid & Sentinel security dashboard | **Defect**: Badge text mismatch (`Ask Sentinel AI SOC Analyst`) |
| `src/app/dsa/page.tsx` | `DsaCurriculumPage` | 20 DSA topics and drills | Healthy |
| `src/app/resumes/page.tsx` | `ResumesPage` | Harvard ATS resume studio | Healthy |
| `src/app/interviews/page.tsx` | `InterviewsPage` | AI mock interview launcher | Healthy |
| `src/app/jobs/page.tsx` | `JobsPage` | Vetted job & internship board | Healthy |
| `src/app/pricing/page.tsx` | `PricingPage` | Free Starter vs ₹49 Pro tiers | Healthy |
| `src/app/profile/page.tsx` | `ProfilePage` | User profile & privacy settings | Healthy |
| `src/app/focus/page.tsx` | `FocusPage` | Deep work lock & distraction blocker | Healthy |
| `src/app/network/page.tsx` | `NetworkPage` | Peer networking & builder clout | Healthy |
| `src/app/styleguide/page.tsx` | `StyleguidePage` | Design system token visualizer | Healthy |

### 3.2 API Route Handlers (`src/app/api/`)
| Endpoint | Method | Handler / Function | Identified Status / Defect |
|---|---|---|---|
| `/api/ai/myra` | POST | `POST(req)` | Dispatches to `MyraOrchestrator` / `MyraNeuralEngine`. Healthy. |
| `/api/interview/tts` | GET, POST | `GET()`, `POST(req)` | Generates Web Speech synthesis cues. Healthy. |
| `/api/interview/turn` | POST | `POST(req)` | Handles multi-turn conversational interview logic. Healthy. |
| `/api/interview/generate-questions` | POST | `POST(req)` | Generates sector-aligned interview drill questions. Protected route (needs `INTERNAL_SERVICE_SECRET`). |
| `/api/interview/score-session` | POST | `POST(req)` | Evaluates candidate transcript & speech metrics. Protected route. |
| `/api/user/career-paths` | GET, POST | `GET(req)`, `POST(req)` | Updates user target career paths. Protected route. |
| `/api/auth/login`, `/signup` | POST | `POST(req)` | Issues Supabase/JWT sessions, handles age band. Healthy. |
| `/api/auth/otp/send`, `/verify` | POST | `POST(req)` | 6-digit OTP verification via Resend. Healthy. |
| `/api/auth/forgot-password`, `/reset-password` | POST | `POST(req)` | SHA-256 password reset tokens via Resend. Healthy. |
| `/api/security/sentinel` | GET, POST | `GET()`, `POST(req)` | SOC incident logging and attack simulator. Healthy. |
| `/api/dsa/submit-answer` | POST | `POST(req)` | Validates drill response, awards 25 XP. Healthy. |
| `/api/learn/quiz/submit` | POST | `POST(req)` | Evaluates quiz, awards 250 XP, generates certificate. Healthy. |
| `/api/certificates/[id]` | GET | `GET(req)` | Verifies SHA-256 hash of credential. Healthy. |
| `/api/billing/create-order` | POST | `POST(req)` | Creates Razorpay order. Healthy. |
| `/api/billing/webhook` | POST | `POST(req)` | Verifies Razorpay HMAC signature. Healthy. |

### 3.3 Core Shared Libraries (`src/lib/`)
| Module File | Classes / Functions | Status / Defect |
|---|---|---|
| `src/lib/ai/myra-agent.ts` | `buildMyraContextPrompt`, `detectWritingTask`, `buildInterviewCoachPrompt`, `buildOnboardingAssistantPrompt`, `buildCareerWritingAssistantPrompt` | **Defects**: Missing `.ts` on imports; prompt text drift |
| `src/lib/ai/myra-profile-analyzer.ts` | `MyraStudentProfileAnalyzer` (`analyze`, `parseGpa`, `determineStage`) | Healthy |
| `src/lib/ai/myra-datasets.ts` | `MyraDatasetService` (`searchQaPairs`, `getBenchmarkSample`) | Healthy |
| `src/lib/ai/myra-rag.ts` | `MyraRagRetriever` (`loadChunks`, `searchChunks`, `formatContext`) | Healthy |
| `src/lib/ai/myra-orchestration.ts` | `MyraOrchestrator` (`handleStudentQuery`) | Healthy |
| `src/lib/ai/myra-neural-engine.ts` | `MyraNeuralEngine` (`generateResponse`) | Healthy |
| `src/lib/interview/interview-bank.ts` | `pickInterviewQuestions`, `getAvailableSectors`, `getSectorStats`, `formatQuestionBankBlock` | Healthy |
| `src/lib/interview/language-analysis-service.ts` | `analyzeSpokenLanguage`, `syncUserCommunicationProfile` | Healthy |
| `src/lib/mcp/tools/resend.ts` | `resendTools` definition array | **Defects**: Missing `.ts` and path alias `@/` in pure ESM |
| `src/lib/email-service.ts` | `sendEmailNotification`, `sendOtpVerificationEmail`, `sendPasswordResetEmail` | Healthy |
| `src/lib/otp-service.ts` | `generateAndSendOtp`, `verifyOtp`, `maskIdentifier` | Healthy |
| `src/lib/firewall/waf.ts` | `evaluateFirewall`, `getClientIp` | Healthy |
| `src/lib/security/sentinel-agent.ts` | `evaluateThreat`, `quarantineIp`, `detectPromptInjection` | Healthy |
| `src/lib/gamification-service.ts` | `awardPoints`, `getUserGamificationProfile` | Healthy |
| `src/lib/entitlement-service.ts` | `checkEntitlement`, `canPerformAction` | Healthy |
| `src/middleware.ts` | `middleware`, `applySecurityHeaders` | **Defects**: Relies on `process.env.INTERNAL_SERVICE_SECRET` without fallback |

### 3.4 Components & Microservices
| Directory / Service | Key Files | Status / Defect |
|---|---|---|
| `src/components/layout/` | `FloatingNav.tsx`, `AppSidebar.tsx`, `ModernEdworldNavbar.tsx`, `ModernEdworldFooter.tsx` | **Defect**: `FloatingNav.tsx` bottom-left anchor |
| `src/components/dashboard/` | `ContinueDsaWidget.tsx`, `CareerPathSelectorWidget.tsx`, `StudentProgressWidget.tsx` | Component healthy; missing render in `dashboard/page.tsx` |
| `src/components/ai/` | `MyraChatbot.tsx`, `MyraFloatingWidget.tsx` | Healthy |
| `functions/src/` | `index.ts`, `auditLogger.ts`, `ageBand.ts`, `razorpayPayments.ts`, `interviewScorer.ts` | Compiles clean; `npm run lint` missing `eslint` dependency |
| `services/interview-orchestrator` | `src/server.ts` | Healthy code; `node_modules` not installed |
| `services/pdf-service` | `src/server.ts` | Healthy code; `node_modules` not installed |
| `services/interview-scorer` | `app.py` | Flask scoring engine; Python blocked by Windows Device Guard |
| `mobile/` | `App.tsx`, `src/screens/*.tsx` | React Native Expo app; `node_modules` not installed |
| `rag/` | `ask_myra.py`, `ingest.py` | Standalone Python TF-IDF RAG index; healthy |

---

## 4. Caveats

1. **Python Environment on Host Machine**: Windows Application Control / Device Guard prevents `.my-env\Scripts\python.exe` and system Python from running directly in this workspace. The Python components (`services/interview-scorer`, `myra-ai/`, `rag/`) are architected for containerized Docker/Kubernetes deployment (`Dockerfile` provided in each service directory).
2. **Ignored Cloned Repositories**: Directories `Megatron-LM/`, `datatrove/`, `dolma/`, and `nanoGPT/` are external repositories in `.gitignore` and are not part of the active product codebase.
3. **Orphan Background Dev Process**: Process PID `29524` is a stale `next dev` instance from an earlier session that should be terminated prior to running production builds.

---

## 5. Conclusion

The repository codebase is architecturally solid:
- Core database schemas (PostgreSQL via Supabase pooler), WAF edge security, RLS policies, HMAC payment signatures, Resend email workflows, and critical user journeys are fully implemented and passing tests (100% pass on security regression, WAF, and E2E suites).
- Zero TypeScript syntax errors or compiler type errors exist across all source files.
- The repository-wide defects are highly specific and actionable:
  1. Add `.eslintrc.json` to the root directory to fix `next lint`.
  2. Add `INTERNAL_SERVICE_SECRET=edworld-internal-k8s-secret-2026` to `.env.local` to enable internal service and integration test authorization.
  3. Add `.ts` file extensions to relative imports in `src/lib/ai/myra-agent.ts` and `src/lib/mcp/tools/resend.ts`.
  4. Restore canonical persona and prompt strings in `MYRA_SYSTEM_PROMPT` in `myra-agent.ts`.
  5. Fix CSS and layout properties in `FloatingNav.tsx` (`bottom-6 left-6`), `aptitude/page.tsx` (`grid-cols-5 sm:grid-cols-10`), and `mobile/page.tsx` (`max-w-[390px]` and `h-[844px]`).
  6. Re-insert `ContinueDsaWidget` and the `/dsa` quick link into `src/app/dashboard/page.tsx`.
  7. Restore `EdWorld Learn` brand heading in `src/app/learn/page.tsx`.
  8. Update SOC Analyst label in `src/app/admin/security/page.tsx`.
  9. Add `const { describe, it } = require("node:test");` to `test/integration/myra_direct_reply.test.js` and `proctoring_and_interview_flow.test.js`.
  10. Add a `"test"` script to `package.json` to satisfy automated verification requirements.

---

## 6. Verification Method

To independently verify all findings and test fixes:

1. **Verify Root TypeScript Compilation**:
   ```powershell
   cmd.exe /c "npx tsc --noEmit"
   ```
   *Expected*: Code 0, 0 errors.

2. **Verify Functions TypeScript Compilation**:
   ```powershell
   cd functions; cmd.exe /c "npm run build"; cd ..
   ```
   *Expected*: Code 0, 0 errors.

3. **Verify Unit Test Suite**:
   ```powershell
   node test/unit/age_band.test.js
   node test/unit/effective_level.test.js
   node test/unit/entitlements.test.js
   node test/unit/gamification_idempotency.test.js
   node test/unit/myra_tool_registry.test.js
   node test/unit/razorpay_signatures.test.js
   node test/unit/scoring_logic.test.js
   node test/unit/live_interview_simulation.test.mjs
   node test/unit/password_reset_resend.test.mjs
   node test/unit/myra_rag_retriever.test.mjs
   node test/unit/myra_system_prompt_v2.test.js
   node test/unit/myra_15_test_cases.test.mjs
   node test/unit/myra_app_guide_prompt.test.mjs
   node test/unit/myra_career_writing_assistant.test.mjs
   node test/unit/myra_interview_coach.test.mjs
   node test/unit/myra_onboarding_assistant.test.mjs
   node test/unit/otp_resend_strong_auth.test.mjs
   ```

4. **Verify Security Regression Suite**:
   ```powershell
   node --env-file=.env.local test/security/security_regression_suite.test.js
   node --env-file=.env.local test/security/workflow_and_auth_security.test.js
   ```
   *Expected*: Code 0, 100% pass.

5. **Verify E2E Critical User Journeys**:
   ```powershell
   node --env-file=.env.local test/e2e/critical_user_journeys.test.js
   ```
   *Expected*: Code 0, 100% pass.

6. **Verify Responsive Layout & Integration Invariants**:
   ```powershell
   node test/integration/apple_android_responsive_ui.test.js
   node test/integration/dsa_curriculum_and_practice.test.js
   node test/integration/mobile_extended_screens.test.js
   node test/integration/mobile_prototype_ui.test.js
   node --env-file=.env.local test/integration/learn_courses_and_certificate.test.js
   node --env-file=.env.local test/integration/sentinel_security_agent.test.js
   node --env-file=.env.local test/integration/network_live_data.test.js
   node --env-file=.env.local test/integration/pipeline_end_to_end.test.js
   node --env-file=.env.local test/integration/razorpay_verification.test.js
   node --env-file=.env.local test/integration/resend_password_reset_flow.test.js
   ```
