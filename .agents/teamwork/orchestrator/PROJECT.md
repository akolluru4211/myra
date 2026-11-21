# Project: Student Email OTP, Resend Dispatch, Logo Fix & Copy Cleanup

## Architecture
- Email service: Resend dispatch via `src/lib/email-templates.ts` and `src/lib/email.ts`.
- Auth backend: Next.js App Router API endpoints (`/api/auth/otp/send`, `/api/auth/otp/verify`).
- Auth storage: Supabase / PostgreSQL tables for user/profile and OTP code verification.
- Frontend UI: `src/app/auth/login/page.tsx`, `src/app/auth/signup/page.tsx` with responsive OTP verification inputs.
- Branding & Copy: Inline vector SVG monogram and clean compliance phrasing (DPDP 2023 Compliant, Student Data Protected).

## Feature Inventory
| # | Feature | Description | Milestone | Source |
|---|---------|-------------|-----------|--------|
| 1 | Inline SVG Monogram | Replace external/broken `<img src="${logoUrl}">` in email templates with reliable inline SVG/CSS table-safe monogram | M1 | Approved Plan §2.1 & §3.1 |
| 2 | Encryption Jargon Removal | Eliminate '256-BIT ENCRYPTION' and '256-BIT SSL ENCRYPTED' from email templates and website pages | M1 | Approved Plan §2.2 & §3.1 |
| 3 | OTP Send Endpoint | `/api/auth/otp/send` for student login/signup generating cryptographically secure 6-digit OTP and sending via Resend | M2 | Approved Plan §3.2 |
| 4 | OTP Verify Endpoint | `/api/auth/otp/verify` validating OTP, provisioning session/cookies, creating/retrieving student profile | M2 | Approved Plan §3.2 |
| 5 | Student OTP UI Integration | Email OTP tab and input flow on `/auth/login` and `/auth/signup` | M2 | Approved Plan §3.2 |
| 6 | Automated Tests & Typecheck | Run automated tests and `npx tsc --noEmit` ensuring zero regressions | M3 | Approved Plan §4 |

## Milestones
| # | Name | Scope | Dependencies | Status |
|---|------|-------|-------------|--------|
| 1 | Logo Fix & Copy Cleanup | `src/lib/email-templates.ts` and marketing/auth copy | none | DONE |
| 2 | Student OTP via Resend | `/api/auth/otp/*`, auth pages UI, Resend email templates | M1 | IN_PROGRESS |
| 3 | Verification & Typecheck | Automated test suites (`otp_resend_strong_auth.test.mjs`, `relational_er_verification.test.mjs`, `tsc --noEmit`) | M1, M2 | PLANNED |

## Code Layout
- `src/lib/email-templates.ts`: Email templates, branding monogram, compliance badges.
- `src/lib/email.ts`: Resend API integration.
- `src/app/api/auth/otp/send/route.ts`: OTP generation and email dispatch.
- `src/app/api/auth/otp/verify/route.ts`: OTP verification and session issuance.
- `src/app/auth/login/page.tsx`: Student login UI with OTP support.
- `src/app/auth/signup/page.tsx`: Student signup UI with OTP support.
- `test/unit/`: Test suites.
