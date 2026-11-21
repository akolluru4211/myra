# Dispatch: Worker M2 (Core Logic & Module Resolution)

## Identity
- Role: Core Logic & AI Worker
- Type: teamwork_worker
- Working directory: c:\Users\adars\eddp\.agents\teamwork\worker_m2\
- Parent: Orchestrator (2652dcf8-f3eb-4981-95c8-2284d2b17259)

## Mandatory Inputs & Context
- ORIGINAL_REQUEST.md: c:\Users\adars\eddp\.agents\teamwork\ORIGINAL_REQUEST.md
- PROJECT.md: c:\Users\adars\eddp\.agents\teamwork\orchestrator\PROJECT.md
- Survey 2 Report: c:\Users\adars\eddp\.agents\teamwork\explorer_survey_2\handoff.md
- Survey 3 Report: c:\Users\adars\eddp\.agents\teamwork\explorer_survey_3\handoff.md
- Workspace root: c:\Users\adars\eddp

## Assigned Scope & Exclusive File Ownership
- `src/lib/ai/myra-agent.ts`
- `src/lib/mcp/tools/resend.ts`

## Tasks to Execute
1. In `src/lib/ai/myra-agent.ts`:
   - Add `.ts` file extensions to relative imports:
     - `import { MyraStudentProfileAnalyzer } from "./myra-profile-analyzer.ts";`
     - `import { MyraDatasetService } from "./myra-datasets.ts";`
     - `import { MyraRagRetriever } from "./myra-rag.ts";`
     - `import { ... } from "../interview/interview-bank.ts";`
   - Harmonize `MYRA_SYSTEM_PROMPT` to contain canonical required substrings for `test/unit/myra_system_prompt_v2.test.js`:
     - `"You are Myra, the AI study and career mentor from EdWorld Co."` (ensure phrase `"AI study and career mentor from EdWorld Co"` is present verbatim).
     - Include audience: `"Class 12 up to undergraduate, postgraduate and early-career"`.
     - Include factuality rule: `"Never invent exam dates"`.
     - Include concise direct reply rules: `"ANSWER ONLY WHAT IS ASKED"`, `"Do NOT dump extra sections"`, `"SILENT BACKGROUND CONTEXT"`.
2. In `src/lib/mcp/tools/resend.ts`:
   - Add `.ts` extension to `../types.ts`.
   - Replace `@/lib/email-service` path alias with relative path `../../email-service.ts` so vanilla Node ESM loaders can resolve it directly.
3. Verify fixes:
   - Run `node test/unit/myra_system_prompt_v2.test.js` -> MUST PASS (exit code 0).
   - Run all `.test.mjs` unit suites under vanilla node:
     `node test/unit/myra_15_test_cases.test.mjs`
     `node test/unit/myra_app_guide_prompt.test.mjs`
     `node test/unit/myra_career_writing_assistant.test.mjs`
     `node test/unit/myra_interview_coach.test.mjs`
     `node test/unit/myra_onboarding_assistant.test.mjs`
     `node test/unit/otp_resend_strong_auth.test.mjs`
     `node test/unit/live_interview_simulation.test.mjs`
     `node test/unit/myra_rag_retriever.test.mjs`
     `node test/unit/password_reset_resend.test.mjs`
   - Run all `.test.js` unit suites:
     `node test/unit/age_band.test.js`
     `node test/unit/effective_level.test.js`
     `node test/unit/entitlements.test.js`
     `node test/unit/gamification_idempotency.test.js`
     `node test/unit/myra_tool_registry.test.js`
     `node test/unit/razorpay_signatures.test.js`
     `node test/unit/scoring_logic.test.js`
   - Verify `cmd /c npx tsc --noEmit` and `cmd /c npm run lint` pass with 0 errors.
4. Report detailed findings and test outputs in `c:\Users\adars\eddp\.agents\teamwork\worker_m2\handoff.md`.

## Mandatory Integrity Warning
DO NOT CHEAT. All implementations must be genuine. DO NOT hardcode test results, create dummy/facade implementations, or circumvent the intended task. A teamwork_auditor will independently verify your work. Integrity violations WILL be detected and your work WILL be rejected.

## 2026-11-09T14:40:59Z
You are Worker M2. Read your dispatch instructions at c:\Users\adars\eddp\.agents\teamwork\worker_m2\DISPATCH.md.
MANDATORY: Read ORIGINAL_REQUEST.md at c:\Users\adars\eddp\.agents\teamwork\ORIGINAL_REQUEST.md before starting work.
Your working directory is c:\Users\adars\eddp\.agents\teamwork\worker_m2\.
Implement Milestone M2:
1. Fix relative imports in src/lib/ai/myra-agent.ts by adding .ts extensions.
2. Restore canonical prompt strings and guidance in MYRA_SYSTEM_PROMPT in src/lib/ai/myra-agent.ts ("AI study and career mentor from EdWorld Co", "Class 12 up to undergraduate, postgraduate and early-career", "Never invent exam dates", etc.).
3. Fix relative imports in src/lib/mcp/tools/resend.ts (add .ts to ../types.ts, replace @/lib/email-service with relative path ../../email-service.ts).
4. Run tests: verify node test/unit/myra_system_prompt_v2.test.js passes, verify all .test.mjs pass under vanilla node, verify all 17 unit test suites pass 100%, verify npx tsc --noEmit and npm run lint pass with 0 errors.
5. Write full report to c:\Users\adars\eddp\.agents\teamwork\worker_m2\handoff.md and notify me via send_message when done.

MANDATORY INTEGRITY WARNING:
DO NOT CHEAT. All implementations must be genuine. DO NOT hardcode test results, create dummy/facade implementations, or circumvent the intended task. A teamwork_auditor will independently verify your work. Integrity violations WILL be detected and your work WILL be rejected.

## 2026-11-09T14:46:28Z
**Context**: Worker M2 status check
**Content**: Heartbeat check. Please update your progress.md with your current status on editing src/lib/ai/myra-agent.ts and src/lib/mcp/tools/resend.ts, and running test verifications.
**Action**: Update progress.md and report current status.

## 2026-11-09T14:53:57Z
**Context**: Worker M2 status check
**Content**: Heartbeat check. Code edits in myra-agent.ts and resend.ts are confirmed in place. How are the unit test executions progressing? Please update progress.md and finalize handoff.md.
**Action**: Update progress.md and deliver handoff.md.
