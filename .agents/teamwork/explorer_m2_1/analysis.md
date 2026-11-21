# Analysis Report — Milestone 2: Student Email OTP Login & Sign-up Verification via Resend

## Executive Summary
Milestone 2 aims to provide a seamless, high-trust student authentication experience via 6-digit OTP dispatched by Resend.
The core cryptographic engine (`src/lib/otp-service.ts`) and email templates (`src/lib/email-templates.ts` / `src/lib/email-service.ts`) are already high quality, timing-safe, and rate-limited.
However, two critical friction points and integration gaps were identified:
1. **API Parameter Mismatch**: `/api/auth/otp/verify` expects `{ identifier, code }`, but `useAuth().verifyOtp` in `auth-context.tsx` sends `{ identifier, otp }`. Also, neither route handler supports `body.email` as an alias for `body.identifier`.
2. **Missing UI Integration**: Both `src/app/auth/login/page.tsx` and `src/app/auth/signup/page.tsx` currently only support password-based auth, completely lacking the Email OTP tab/flow with 6-box input, countdown timer, and Resend dispatch.
3. **ESM Import Collision in Tests**: Node ESM fails when resolving `./supabase` because both `src/lib/supabase.ts` and `src/lib/supabase/` exist. Adding `src/lib/supabase/index.ts` resolves this for both native Node and bundlers.

---

## 1. API Route Analysis

### 1.1 `src/app/api/auth/otp/send/route.ts`
- **Current State**:
  - Rate limiting implemented: `rateLimit("otp_send_" + ip, { limit: 5, windowMs: 60 * 1000 })`.
  - Expects `const { identifier, purpose } = body;`.
  - Calls `generateAndSendOtp(identifier, purpose || "login", ip)`.
- **Defects & Gaps**:
  - If client submits `{ email: "student@univ.edu", purpose: "login" }`, `identifier` is undefined and the route returns HTTP 400 `INVALID_IDENTIFIER`.
- **Recommended Worker Action**:
  - Accept `const identifier = (body.identifier || body.email || "").trim();`.

### 1.2 `src/app/api/auth/otp/verify/route.ts`
- **Current State**:
  - Rate limiting implemented: `rateLimit("otp_verify_" + ip, { limit: 10, windowMs: 60 * 1000 })`.
  - Expects `const { identifier, code, purpose, metaData } = body;`.
  - Checks `if (!identifier || !code) { return NextResponse.json({ error: "MISSING_FIELDS" }, { status: 400 }); }`.
  - Sets `edworld_session` HTTP-only cookie for 30 days upon successful verification.
- **Defects & Gaps**:
  - In `src/lib/auth-context.tsx` (line 753), `verifyOtp` dispatches `{ identifier, otp, purpose, ...metaData }` where the field is named `otp`, NOT `code`.
  - As a result, calling `verifyOtp()` from the client causes `code` to be `undefined`, instantly rejecting verification with `MISSING_FIELDS`.
  - Does not alias `body.email` to `body.identifier`.
- **Recommended Worker Action**:
  - Normalize payload fields:
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

---

## 2. Core Service Layer Analysis

### 2.1 `src/lib/otp-service.ts`
- **Architecture**:
  - Uses `globalThis.edworldOtpStore` for resilient cross-route state persistence in Next.js serverless/chunk environments.
  - Generates cryptographically secure 6-digit numeric OTP via `crypto.randomInt(100000, 999999)`.
  - Stores SHA-256 HMAC hash with salt (`process.env.OTP_SALT` or fallback).
  - Timing-safe equality verification via `crypto.timingSafeEqual` prevents side-channel timing attacks.
  - Defense parameters:
    - Expiration: 5 minutes TTL.
    - Cooldown: 45 seconds before resending is permitted.
    - Rate limit: max 4 requests per 10 minutes per identifier.
    - Brute-force lockout: 5 failed attempts locks verification for 15 minutes (`lockedUntil`).
    - Anti-replay: Single-use consumption (`record.used = true`).
  - Account provisioning: Automatically resolves roles via `resolveUserAndRole()`, maps to `/dashboard`, `/onboarding`, or role portals, and inserts new learner profiles into Supabase `profiles`.

### 2.2 `src/lib/email-service.ts` & `src/lib/email-templates.ts`
- **Branding & Delivery**:
  - `sendOtpVerificationEmail()` renders high-contrast, responsive HTML using `renderOtpVerificationEmail()` in `src/lib/email-templates.ts`.
  - Clean inline geometric monogram (table-safe CSS, zero external image dependency).
  - No `256-BIT ENCRYPTION` jargon; uses clean DPDP 2023 compliance and student protection badges.
  - Dispatches via Resend SDK (`resend.emails.send`). Falls back cleanly to mock mode with zero unhandled exceptions if `RESEND_API_KEY` is not present in local test environments.

### 2.3 `src/lib/supabase` Directory/File Collision
- **Observation**:
  - Both `src/lib/supabase.ts` (file) and `src/lib/supabase/` (directory) exist in `src/lib`.
  - When running tests with native Node.js ESM (`node test/unit/otp_resend_strong_auth.test.mjs`), Node throws `ERR_UNSUPPORTED_DIR_IMPORT: Directory import '.../src/lib/supabase' is not supported resolving ES modules imported from .../src/lib/email-service.ts`.
  - In `npx.cmd tsx`, it resolves properly, but for native Node test suites, adding `src/lib/supabase/index.ts` re-exporting `createClient` and singleton `supabase` fixes the ambiguity permanently.

---

## 3. UI Authentication Pages Analysis

### 3.1 `src/app/auth/login/page.tsx`
- **Current State**:
  - Contains only standard password login form using `loginWithEmail(email, password)`.
  - Has zero OTP login UI.
- **Required Changes for Milestone 2**:
  - Add a high-visibility mode toggle at the top of the form:
    - Tab 1: **"Password Login"** (existing form)
    - Tab 2: **"Email OTP Login"** (new Resend OTP flow)
  - OTP Login Flow:
    1. **Email Step**:
       - Email input with university/student placeholder.
       - "Send Verification Code" CTA button with spinner.
       - Invokes `/api/auth/otp/send` with `{ identifier: email, purpose: 'login' }`.
    2. **Verification Step**:
       - Masked email display (e.g. `s***t@university.edu`) with "Edit" option.
       - 6-digit OTP input: High-contrast auto-focus numeric boxes or tracked monospace input.
       - Dynamic countdown timer: "Resend code in Xs" (45s cooldown).
       - "Verify & Sign In" CTA button.
       - Calls `/api/auth/otp/verify` with `{ identifier: email, code: otp, purpose: 'login' }`.
       - On success: sets session and routes immediately to `redirectUrl || "/dashboard"`.

### 3.2 `src/app/auth/signup/page.tsx`
- **Current State**:
  - Contains standard multi-field password registration form (Name, Email, WhatsApp Phone, Passwords, Terms, Age consent).
  - Calls `signupWithEmail(...)` directly into Supabase.
- **Required Changes for Milestone 2**:
  - Provide an intuitive OTP verification step:
    - After entering student profile information, students can verify their email instantly with a 6-digit Resend OTP before finalize.
    - Alternatively, provide a "Fast OTP Sign-Up" tab allowing 1-click registration: Email -> 6-digit OTP -> Dashboard / Onboarding.

### 3.3 `src/lib/auth-context.tsx`
- Fix line 753 so that `verifyOtp` sends `{ identifier, code: otp, otp, purpose, ...metaData }` to ensure compatibility with backend route expectations.

---

## 4. Test Suites & Verification Status

| Test Suite | Command | Result | Notes |
|---|---|---|---|
| OTP & Resend Auth Strong | `npx.cmd tsx test/unit/otp_resend_strong_auth.test.mjs` | **7/7 PASSED** | Validates generation, hashing, timing-safe equality, cooldown, anti-replay, 5-attempt lockout, and MCP tools |
| Relational ER Verification | `node tests/relational_er_verification.test.mjs` | **ALL PASSED** | 24 canonical entities, 23 foreign keys, indexes, and RLS |
| TypeScript Compiler | `npx.cmd tsc --noEmit` | **0 ERRORS** | Clean type safety |
