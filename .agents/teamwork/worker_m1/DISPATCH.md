# Dispatch: Worker (Milestone 1)

## Objective
Implement Milestone 1:
1. Replace all external image dependencies in `src/lib/email-templates.ts` with table-safe inline HTML/CSS monograms (including fixing line 559 in `renderProjectCompletionCertificateEmail`).
2. Remove unused `defaultLogoUrl` and `logoUrl` variables in `src/lib/email-templates.ts`.
3. Update footer stamp in `src/lib/email-templates.ts` (line 262) and in `src/app/admin/bulk-mail/page.tsx` (line 415) from `AUTH SENTINEL VERIFIED` to `STUDENT DATA PROTECTED`.
4. Modernize security footer notes in `src/lib/email-templates.ts` lines 448 and 643 to remove "Auth Sentinel".
5. In `src/lib/email-service.ts` line 9, change `@/lib/supabase` to `./supabase` for native Node test runner resolution.
6. Run unit tests (`node test/unit/password_reset_resend.test.mjs`, `npx tsx test/unit/otp_resend_strong_auth.test.mjs`, `node tests/relational_er_verification.test.mjs`, `npx tsc --noEmit`) and verify clean passes.

## Scope & Write Ownership
You exclusively own and may edit:
- `src/lib/email-templates.ts`
- `src/lib/email-service.ts`
- `src/app/admin/bulk-mail/page.tsx`

Do NOT edit any other files.

## Mandatory Inputs to Read
- Read `ORIGINAL_REQUEST.md` at `c:\Users\adars\eddp\.agents\teamwork\ORIGINAL_REQUEST.md`
- Read Approved Plan at `C:/Users/adars/.gemini/antigravity/brain/fbfa0bd9-70ff-4f87-b947-3f66925c8ac1/student_email_otp_resend_logo_and_copy_cleanup_plan.md`
- Read Explorer 1 handoff: `c:\Users\adars\eddp\.agents\teamwork\explorer_m1_1\handoff.md`
- Read Explorer 2 handoff: `c:\Users\adars\eddp\.agents\teamwork\explorer_m1_2\handoff.md`
- Read Explorer 3 handoff: `c:\Users\adars\eddp\.agents\teamwork\explorer_m1_3\handoff.md`

## Mandatory Integrity Warning
DO NOT CHEAT. All implementations must be genuine. DO NOT hardcode test results, create dummy/facade implementations, or circumvent the intended task. A teamwork_auditor will independently verify your work. Integrity violations WILL be detected and your work WILL be rejected.

## Required Outputs
Write `changes.md` and `handoff.md` in your working directory (`c:\Users\adars\eddp\.agents\teamwork\worker_m1\`).
Report passing build/test commands and verbatim test outputs in your handoff report.
When done, notify parent orchestrator via `send_message`.


## 2026-11-09T15:33:51Z
You are Worker 1 for Milestone 1.
Your working directory is: c:\Users\adars\eddp\.agents\teamwork\worker_m1\
Read DISPATCH.md in your working directory first.
MANDATORY: Read ORIGINAL_REQUEST.md at c:\Users\adars\eddp\.agents\teamwork\ORIGINAL_REQUEST.md.
Also read the Approved Plan at C:/Users/adars/.gemini/antigravity/brain/fbfa0bd9-70ff-4f87-b947-3f66925c8ac1/student_email_otp_resend_logo_and_copy_cleanup_plan.md.
Read Explorer handoffs:
- c:\Users\adars\eddp\.agents\teamwork\explorer_m1_1\handoff.md
- c:\Users\adars\eddp\.agents\teamwork\explorer_m1_2\handoff.md
- c:\Users\adars\eddp\.agents\teamwork\explorer_m1_3\handoff.md

Write ownership:
- src/lib/email-templates.ts
- src/lib/email-service.ts
- src/app/admin/bulk-mail/page.tsx

MANDATORY INTEGRITY WARNING:
DO NOT CHEAT. All implementations must be genuine. DO NOT hardcode test results, create dummy/facade implementations, or circumvent the intended task. A teamwork_auditor will independently verify your work. Integrity violations WILL be detected and your work WILL be rejected.

Implement the requested changes:
1. Replace all external image references in src/lib/email-templates.ts with inline HTML/CSS monograms (specifically line 559 in renderProjectCompletionCertificateEmail).
2. Clean up unused logoUrl and defaultLogoUrl variables in src/lib/email-templates.ts.
3. Update footer stamp in src/lib/email-templates.ts (line 262) and in src/app/admin/bulk-mail/page.tsx (line 415) to 'DPDP ACT 2023 COMPLIANT &bull; STUDENT DATA PROTECTED'.
4. Modernize security footer notes in src/lib/email-templates.ts lines 448 and 643 to remove 'Auth Sentinel'.
5. In src/lib/email-service.ts line 9, update import '@/lib/supabase' to './supabase'.
6. Run unit tests and typecheck:
   - node test/unit/password_reset_resend.test.mjs
   - npx.cmd tsx test/unit/otp_resend_strong_auth.test.mjs
   - node tests/relational_er_verification.test.mjs
   - npx.cmd tsc --noEmit

Document your changes in changes.md and write handoff.md in your working directory.
Report verbatim test results in your handoff report and notify the parent orchestrator via send_message when complete.
