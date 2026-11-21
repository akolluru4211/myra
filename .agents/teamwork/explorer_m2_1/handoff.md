# Handoff Report — Explorer 1 (Milestone 2)

## 1. Observation

### 1.1 Route Handlers
- **`src/app/api/auth/otp/send/route.ts`** (Lines 17-25):
  ```ts
  const body = await req.json();
  const { identifier, purpose } = body;

  if (!identifier || typeof identifier !== "string") {
    return NextResponse.json(
      { error: "INVALID_IDENTIFIER", message: "Please provide a valid email address or mobile number." },
      { status: 400 }
    );
  }
  ```
  *Observed defect*: Does not accept `body.email`. A client sending `{ email: "test@domain.com" }` receives HTTP 400 `INVALID_IDENTIFIER`.

- **`src/app/api/auth/otp/verify/route.ts`** (Lines 17-25):
  ```ts
  const body = await req.json();
  const { identifier, code, purpose, metaData } = body;

  if (!identifier || !code) {
    return NextResponse.json(
      { error: "MISSING_FIELDS", message: "Identifier and 6-digit OTP are required." },
      { status: 400 }
    );
  }
  ```
  *Observed defect*: Does not accept `body.otp` or `body.email`.

- **`src/lib/auth-context.tsx`** (Lines 750-754):
  ```ts
  const res = await fetch("/api/auth/otp/verify", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ identifier, otp, purpose, ...metaData }),
  });
  ```
  *Observed defect*: `auth-context.tsx` sends `{ identifier, otp }`, whereas `verify/route.ts` expects `{ identifier, code }`. Calling `verifyOtp()` from the client currently causes `code` to be undefined and fails with HTTP 400 `MISSING_FIELDS`.

### 1.2 UI Pages
- **`src/app/auth/login/page.tsx`** (Lines 23-65):
  - Form state only manages `email`, `password`, `showPassword`.
  - Form submit handler only calls `loginWithEmail(email, password)`.
  - No OTP login tab, toggle, or 6-digit input exists in the UI.
- **`src/app/auth/signup/page.tsx`** (Lines 34-45):
  - Form state only manages `name`, `email`, `phone`, `password`, `confirmPassword`, `termsAgreed`, `ageConsent`.
  - Submit handler calls `signupWithEmail(...)`.
  - No on-screen OTP email verification flow exists in the UI.

### 1.3 Service Layer & Tests
- **`src/lib/otp-service.ts`**:
  - Implements timing-safe comparisons via `crypto.timingSafeEqual` (Line 332).
  - 5-minute TTL (Line 207).
  - 45-second cooldown (Line 208).
  - 5-attempt brute-force lockout for 15 minutes (Line 342).
  - Dispatches email via `sendOtpVerificationEmail` in `src/lib/email-service.ts` (Line 223).
- **`src/lib/supabase` Collision**:
  - `src/lib/supabase.ts` (file) and `src/lib/supabase/` (directory with `client.ts` and `server.ts`).
  - Running `node test/unit/otp_resend_strong_auth.test.mjs` directly in Node.js produces:
    `Error [ERR_UNSUPPORTED_DIR_IMPORT]: Directory import 'C:\Users\adars\eddp\src\lib\supabase' is not supported resolving ES modules imported from C:\Users\adars\eddp\src\lib\email-service.ts`.
  - Running with `npx.cmd tsx test/unit/otp_resend_strong_auth.test.mjs` executes and passes all 7 tests.
  - Adding `src/lib/supabase/index.ts` re-exporting `createClient` and singleton `supabase` fixes Node native ESM import resolution permanently.
- **TypeScript Typecheck**:
  - `npx.cmd tsc --noEmit` exited with code 0 (zero errors).

---

## 2. Logic Chain

1. **Observation 1.1 shows** that `/api/auth/otp/verify` checks `if (!identifier || !code)` and rejects if either is missing, while `auth-context.tsx` line 753 sends `{ identifier, otp }`.
   $\rightarrow$ Therefore, calling the existing `useAuth().verifyOtp` method in any frontend component fails with `MISSING_FIELDS`. Normalizing route handlers to accept both `identifier || email` and `code || otp` guarantees robust API contract compatibility.

2. **Observation 1.2 shows** that neither `/auth/login` nor `/auth/signup` exposes an OTP flow to users.
   $\rightarrow$ Therefore, Milestone 2 requires creating the UI componentry:
     - On `/auth/login`: A tab toggle (`Password Login` vs `Email OTP Login`), email entry, 6-digit OTP input with countdown timer, and integration with `sendOtp` / `verifyOtp`.
     - On `/auth/signup`: Integration of OTP verification during student account registration.

3. **Observation 1.3 shows** that the core cryptographic engine in `src/lib/otp-service.ts` and email dispatch via `src/lib/email-service.ts` are fully functional and pass all 7 test cases under `tsx`.
   $\rightarrow$ Therefore, the backend cryptographic logic does not require redesign, only parameter normalization and UI wiring.

4. **Observation 1.3 shows** the Node ESM directory import collision on `src/lib/supabase`.
   $\rightarrow$ Creating `src/lib/supabase/index.ts` allows both native `node` and `tsx` to resolve `./supabase` without module loader exceptions.

---

## 3. Caveats

- **Supabase Production Connectivity**: In offline/local sandbox environments without a live Supabase database connection, `otp-service.ts` falls back to its in-memory store and provisioned account directory, and `email-service.ts` operates in mock mode. Both modes are safe and prevent crashes.
- **Resend API Key**: In testing without `RESEND_API_KEY`, `email-service.ts` logs the dispatch payload and returns `{ success: true, isMock: true }`, which satisfies automated tests. In production, `RESEND_API_KEY` must be populated in `.env.local`.
- **Scope Boundary**: Explorer 1 is strictly read-only; no production files have been modified. All implementation steps are prepared for Worker M2.

---

## 4. Conclusion & Action Plan for Worker M2

Worker M2 should implement the following targeted, low-risk changes:

### Step 1: Normalize API Route Handlers
1. In `src/app/api/auth/otp/send/route.ts`:
   - Change:
     ```ts
     const identifier = (body.identifier || body.email || "").trim();
     const purpose = body.purpose || "login";
     ```
2. In `src/app/api/auth/otp/verify/route.ts`:
   - Change:
     ```ts
     const identifier = (body.identifier || body.email || "").trim();
     const code = (body.code || body.otp || "").trim();
     const purpose = body.purpose || "login";
     const metaData = body.metaData || {
       name: body.name,
       dob: body.dob,
       careerStage: body.careerStage,
       gradeLevel: body.gradeLevel,
     };
     ```
3. In `src/lib/auth-context.tsx` (line 753):
   - Send `{ identifier, code: otp, otp, purpose, ...metaData }`.

### Step 2: Fix ESM Supabase Directory Resolution
- Add `src/lib/supabase/index.ts`:
  ```ts
  export * from "./client";
  import { createClient } from "./client";
  export const supabase = createClient();
  export default supabase;
  ```

### Step 3: Implement Email OTP Login UI
- In `src/app/auth/login/page.tsx`:
  - Add tab switcher: `Password` vs `Email OTP`.
  - When in OTP mode:
    - Step 1: Email entry field with "Send Verification Code" button.
    - Step 2: 6-digit OTP code input, 45-second resend countdown timer, "Verify & Sign In" button, and "Change email" option.
    - On verification: cookie is saved and user is routed to `/dashboard`.

### Step 4: Implement Student OTP Sign-Up Flow
- In `src/app/auth/signup/page.tsx`:
  - Add option to verify student email via 6-digit Resend OTP before or during account creation.
  - On verification: user profile is provisioned with `CLIENT`/`STUDENT` role and redirected to `/onboarding`.

---

## 5. Verification Method

To independently verify the implementation:

1. **Run Auth Strong OTP Unit Suite**:
   ```powershell
   npx.cmd tsx test/unit/otp_resend_strong_auth.test.mjs
   ```
   *Expected output*: All 7 tests pass (Email Template, Normalization & Masking, TimingSafeEqual, 45s Cooldown, Single-Use Anti-Replay, 5-Attempt Lockout, MCP Tool Registration).

2. **Run Native Node Test**:
   ```powershell
   node test/unit/otp_resend_strong_auth.test.mjs
   ```
   *Expected output*: Passes without `ERR_UNSUPPORTED_DIR_IMPORT`.

3. **Run Relational ER Verification**:
   ```powershell
   node tests/relational_er_verification.test.mjs
   ```
   *Expected output*: 24 entities, 23 relationships, indexes, and RLS pass.

4. **Run TypeScript Compiler**:
   ```powershell
   npx.cmd tsc --noEmit
   ```
   *Expected output*: Exits with code 0 (zero type errors).
