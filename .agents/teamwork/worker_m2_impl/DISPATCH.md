# DISPATCH — Worker M2 Implementation (`worker_m2_impl`)

## Objective
Implement Milestone 2: Student Email OTP Login & Sign-up Verification via Resend, including backend API normalization, OTP service improvements, login & signup UI integration, and ESM resolution.

## Input Artifacts
- ORIGINAL_REQUEST: `c:\Users\adars\eddp\.agents\teamwork\ORIGINAL_REQUEST.md`
- Approved Plan: `C:/Users/adars/.gemini/antigravity/brain/fbfa0bd9-70ff-4f87-b947-3f66925c8ac1/student_email_otp_resend_logo_and_copy_cleanup_plan.md`
- Scope Document: `c:\Users\adars\eddp\.agents\teamwork\orchestrator\PROJECT.md`
- Explorer 1 Report: `c:\Users\adars\eddp\.agents\teamwork\explorer_m2_1\handoff.md`
- Explorer 2 Report: `c:\Users\adars\eddp\.agents\teamwork\explorer_m2_2\handoff.md`
- Explorer 3 Report: `c:\Users\adars\eddp\.agents\teamwork\explorer_m2_3\handoff.md`

## Mandatory Warning
DO NOT CHEAT. All implementations must be genuine. DO NOT hardcode test results, create dummy/facade implementations, or circumvent the intended task. A teamwork_auditor will independently verify your work. Integrity violations WILL be detected and your work WILL be rejected.

## Detailed Tasks

### Task 1: API Route Handlers Normalization
1. **`src/app/api/auth/otp/send/route.ts`**:
   - Accept `body.identifier || body.email`.
   - Accept `body.purpose || "login"`.
2. **`src/app/api/auth/otp/verify/route.ts`**:
   - Accept `code: body.code || body.otp`.
   - Accept `identifier: body.identifier || body.email`.
   - Return `{ success: true, token: result.token, sessionToken: result.token, user, profile, redirectTo }` (returning both `token` and `sessionToken`).
   - Set cookies:
     - `edworld_session`: `httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "lax", maxAge: 30 * 24 * 60 * 60, path: "/"`.
     - `edworld_auth`: `value: "true", httpOnly: false, secure: process.env.NODE_ENV === "production", sameSite: "lax", maxAge: 30 * 24 * 60 * 60, path: "/"` (client-readable for immediate hydration).
   - Return HTTP 403 with `{ error: "ACCOUNT_SUSPENDED", message: "Your account is temporarily suspended. Please contact EdWorld support." }` when `result.status === "SUSPENDED"`.

### Task 2: OTP Service Improvements (`src/lib/otp-service.ts`)
1. In `getRedirectForRole`: add `case "TEACHER": return "/school/teacher";`.
2. In `resolveUserAndRole`: persist student metadata (`career_stage`, `age_band`, `grade_level`) when creating new profile.

### Task 3: Login & Signup UI Integration
1. **`src/app/auth/login/page.tsx`**:
   - Implement segmented tab switcher for "Email OTP" (Student default) vs "Password".
   - Under Email OTP:
     - Step 1: Input field for "Email or Mobile Number", button "Send OTP".
     - Step 2: "Enter the 6-digit OTP", numeric 6-box input array with `inputMode="numeric"`, `pattern="[0-9]*"`, `handlePaste`, 45-second countdown timer, "Resend OTP", "Verify & Sign In", and "Change email/number".
   - Must satisfy all string and functional assertions in `scripts/verify_otp_authentication.js`:
     - `Sign in to Edworld`
     - `Email or Mobile Number`
     - `Send OTP`
     - `Enter the 6-digit OTP`
     - `inputMode="numeric"`
     - `handlePaste`
     - `Resend OTP` / countdown
     - `Change email/number`
2. **`src/app/auth/signup/page.tsx`**:
   - Provide student email verification with 6-digit OTP dispatched via Resend before or during student profile creation and routing to `/onboarding`.

### Task 4: Node ESM Directory Resolution
- In `src/lib/email-service.ts`: import from `./supabase.ts` (or add `src/lib/supabase/index.ts`) to ensure `node test/unit/otp_resend_strong_auth.test.mjs` executes natively without `ERR_UNSUPPORTED_DIR_IMPORT`.

### Task 5: Automated Verification
Execute and verify:
- `npx.cmd tsx test/unit/otp_resend_strong_auth.test.mjs`
- `node test/unit/otp_resend_strong_auth.test.mjs`
- `node scripts/verify_otp_authentication.js`
- `node tests/relational_er_verification.test.mjs`
- `npx.cmd tsc --noEmit`
- `npm.cmd run build`

## Output Requirements
- Working directory: `c:\Users\adars\eddp\.agents\teamwork\worker_m2_impl\`
- Report path: `c:\Users\adars\eddp\.agents\teamwork\worker_m2_impl\handoff.md`
- Send completion message to parent `aa16fbe2-f04a-4645-9b2f-312222847c08`.


## 2026-11-09T20:21:55Z
You are Worker M2 (`worker_m2_impl`), a teamwork_worker.
Your working directory is: `c:\Users\adars\eddp\.agents\teamwork\worker_m2_impl\`
Your parent orchestrator is: `aa16fbe2-f04a-4645-9b2f-312222847c08`

Assigned Deliverables:
1. Normalize `src/app/api/auth/otp/send/route.ts` and `src/app/api/auth/otp/verify/route.ts` to accept `email` & `otp` aliases, return both `token` and `sessionToken`, set `edworld_session` and `edworld_auth` cookies, and return 403 on suspended users.
2. In `src/lib/otp-service.ts`: add `case "TEACHER": return "/school/teacher"` in `getRedirectForRole`, and persist student profile metadata.
3. In `src/app/auth/login/page.tsx`: add the segmented "Email OTP" (Student default) vs "Password" tab, 6-box input array, 45s countdown timer, handlePaste, Change email/number, matching `scripts/verify_otp_authentication.js`.
4. In `src/app/auth/signup/page.tsx`: provide student email OTP verification before/during profile creation.
5. In `src/lib/email-service.ts`: update `./supabase` import to `./supabase.ts` (or add `src/lib/supabase/index.ts`) to fix Node ESM directory resolution.
6. Genuinely execute and verify:
   - `npx.cmd tsx test/unit/otp_resend_strong_auth.test.mjs`
   - `node test/unit/otp_resend_strong_auth.test.mjs`
   - `node scripts/verify_otp_authentication.js`
   - `node tests/relational_er_verification.test.mjs`
   - `npx.cmd tsc --noEmit`
   - `npm.cmd run build`
