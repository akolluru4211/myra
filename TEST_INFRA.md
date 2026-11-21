# Test Infrastructure Specification (TEST_INFRA.md)

**Project**: Edworld Co (`edworld-co`)  
**Standard**: Requirement-Driven Opaque-Box Quality Assurance  
**Harness Scope**: End-to-End (E2E), Integration, Security & Unit Verification  
**Target Runtimes**: Node.js 20+ / Node.js 24+, TypeScript 5.6, Next.js 14 App Router  

---

## 1. Test Philosophy

### 1.1 Opaque-Box Verification
Tests interact with platform capabilities strictly through public interfaces, business logic contracts, cryptographic boundaries, and observable state transitions. Internal implementation details (transient variables, private helper signatures, temporary DOM tokens) are never assumed. Tests validate that given valid, invalid, or adversarial inputs, the system behaves strictly according to the documented product specification.

### 1.2 Requirement-Driven Coverage
Every test case in the test hierarchy derives from explicit, authoritative product requirements documented in:
- `ORIGINAL_REQUEST.md`: Full audit and clearance of static and functional/runtime defects.
- `PROJECT.md`: System architecture, interface contracts, and feature/defect inventory (LINT-01 through E2E-GATE).
- `docs/MANUAL_QA_MASTER_CHECKLIST.md`: Features 1 through 13 acceptance criteria (COPPA age-banding, ATS scoring, voice interview heuristics, gamification single source of truth, Razorpay HMAC verification, WAF protection).

### 1.3 Strict Integrity & Anti-Facade Standard
In compliance with project integrity guidelines:
- **Zero Mock Pass Facades**: No test suite may return hardcoded `true` or bypass real validation logic.
- **Genuine Computation**: All calculations (e.g. ATS keyword matching ratios, WPM calculations, filler word deductions, HMAC-SHA256 signatures, WAF threat regexes, age boundaries) execute real algorithmic evaluations.
- **Adversarial & Boundary Verification**: Suites must actively challenge system limits with malformed inputs, SQL injection strings, cross-site scripting (XSS) vectors, path traversals, scanner bot user-agents, token expirations, and COPPA age edge conditions.

---

## 2. Four-Tier Testing Hierarchy

The testing architecture organizes all automated verification into four comprehensive tiers:

```
┌─────────────────────────────────────────────────────────────┐
│  Tier 4: Real-World Resilient User Journeys                 │
│  Multi-step persona simulations (College, Switcher, Youth)  │
├─────────────────────────────────────────────────────────────┤
│  Tier 3: Cross-Feature State Transitions & Combinations     │
│  Pipelines combining Auth, Tests, Roadmap, Job & Certificate│
├─────────────────────────────────────────────────────────────┤
│  Tier 2: Boundary, Corner & Adversarial Edge Cases          │
│  COPPA thresholds, empty strings, rate limits, WAF attacks  │
├─────────────────────────────────────────────────────────────┤
│  Tier 1: Core Feature Verification                          │
│  Individual feature specs (Auth, ATS, Interview, Payments)  │
└─────────────────────────────────────────────────────────────┘
```

### Tier 1: Core Feature Verification
Validates primary happy-path behavior and contract compliance for every individual platform feature:
- **T1.1 Authentication & Youth Age-Gating**: DOB collection, age classification (`13-15`, `16-17`, `18+`), COPPA under-13 restriction.
- **T1.2 Resume ATS Matching & Scoring**: Keyword tokenization, technical/tools extraction, missing skills detection, score normalization (25–98 scale).
- **T1.3 Mock Interview & AI Scorer**: Speech analysis, STAR method keyword recognition, filler word detection, pacing (WPM), non-punitive scoring.
- **T1.4 Dynamic Career Roadmap**: Milestone bucketing (1-year, 3-year, 5-year horizons), curated skill tags, resource linking.
- **T1.5 Aptitude Testing Engine**: Multi-category question sampling (Quantitative, Logical, Verbal, Technical), correct option validation, difficulty weights.
- **T1.6 Web Application Firewall (WAF)**: Threat mitigation for SQLi, XSS, Path Traversal, and Automated Exploit Scanners.
- **T1.7 Monetization & Razorpay Verification**: Order generation age checks, HMAC-SHA256 payment signature verification, webhook signature authenticity.

### Tier 2: Boundary, Corner & Adversarial Edge Cases
Stresses edge conditions, invalid states, resource boundaries, and attack vectors:
- **T2.1 Exact Age-Gate Calendar Boundaries**: Birthday today, birthday tomorrow, leap year birth dates (Feb 29), exact 13th and 18th milestones.
- **T2.2 Empty, Malformed & Extreme Payloads**: Empty resumes, oversized text buffers, unicode/special character names, missing fields.
- **T2.3 Anti-Ghostwriting Guards**: SOP and appraisal assistants rejecting inputs under 20-25 words.
- **T2.4 Gamification Idempotency**: Deduplication preventing double-awarding XP on identical `(userId, sourceFeature, sourceId)`.
- **T2.5 Entitlement Quota Boundaries**: Free tier limits (1 resume, 2 mock interviews) strictly enforced; Pro tier unconstrained.
- **T2.6 Token Expiration & HMAC Tampering**: Rejection of expired OTP/reset tokens and tampered payment signatures.

### Tier 3: Cross-Feature State Transitions & Combinations
Validates end-to-end data flow across multiple modules and dependent services:
- **T3.1 Complete Learning & Leveling Pipeline**: Registration $\rightarrow$ Age Gate $\rightarrow$ Onboarding $\rightarrow$ Aptitude Assessment $\rightarrow$ Gamification XP $\rightarrow$ `effectiveLevel` elevation.
- **T3.2 Career Switcher Evolution**: Target Role Selection $\rightarrow$ ATS Gap Analysis $\rightarrow$ Roadmap Generation $\rightarrow$ Project Studio $\rightarrow$ Non-accreditation Certificate generation.
- **T3.3 Mock Interview to Verified Application**: Voice Interview Session $\rightarrow$ Language Analysis $\rightarrow$ Profile Readiness Metric $\rightarrow$ Curated Job Board Match $\rightarrow$ One-Click Application with Snapshot.
- **T3.4 Minor to Adult Lifecycle Progression**: Under-16 registration $\rightarrow$ Guardian consent approval $\rightarrow$ Age milestone maturation $\rightarrow$ Career/monetization feature unlocking.

### Tier 4: Real-World Resilient User Journeys
Simulates complete, multi-session user scenarios under production conditions:
- **Journey A: High-Performing College Senior**: Completes technical onboarding, practices DSA, achieves 85%+ on mock interview, attains Level 2 status, and applies to curated tech roles.
- **Journey B: Career Switcher to Cloud Architect**: Transitions from non-tech background, analyzes resume against Cloud Engineer job, identifies Docker/Kubernetes gaps, generates 3-year milestone roadmap.
- **Journey C: Youth Explorer (14 Years Old)**: Obtains parental consent, completes mandatory AI Ethics module, logs reflection in private growth journal, searches scholarships, confirms zero adult job leakage.
- **Journey D: Enterprise Pro Upgrade & Billing Lifecycle**: Free tier user encounters quota limit, upgrades via Razorpay checkout, verifies HMAC signature, transitions to Pro tier, processes webhook renewal, and validates grace period behavior.

---

## 3. Feature Inventory & Test Coverage Map

| Feature ID | Feature Name | Core Modules | Automated Test Coverage | Tiers Covered |
| :--- | :--- | :--- | :--- | :--- |
| **F-01** | Auth & Youth Age-Gating | `src/app/api/auth/*`, `user_dob_records` | `test/e2e/comprehensive_e2e_suite.test.js`, `test/integration/auth_onboarding_flow.test.js` | Tier 1, Tier 2, Tier 3, Tier 4 |
| **F-02** | Resume Maker & ATS | `src/lib/services/job-match-scorer.ts` | `test/e2e/comprehensive_e2e_suite.test.js`, `test/unit/scoring_logic.test.js` | Tier 1, Tier 2, Tier 3, Tier 4 |
| **F-03** | Mock Interview Studio | `src/lib/interview/*`, `interview-bank.ts` | `test/e2e/comprehensive_e2e_suite.test.js`, `test/unit/live_interview_simulation.test.mjs` | Tier 1, Tier 2, Tier 3, Tier 4 |
| **F-04** | Telemetry & Leveling | `src/lib/gamification-service.ts` | `test/e2e/comprehensive_e2e_suite.test.js`, `test/unit/effective_level.test.js` | Tier 1, Tier 2, Tier 3 |
| **F-05** | Project Studio & Certs | `src/lib/projects/*` | `test/e2e/comprehensive_e2e_suite.test.js`, `test/integration/learn_courses_and_certificate.test.js` | Tier 1, Tier 3 |
| **F-06** | Networking & Mentorship| `src/app/api/social/*`, `types.ts` | `test/e2e/comprehensive_e2e_suite.test.js`, `test/e2e/critical_user_journeys.test.js` | Tier 1, Tier 4 |
| **F-07** | Job Board & Match | `src/lib/data/curated-jobs.ts` | `test/e2e/comprehensive_e2e_suite.test.js`, `test/unit/scoring_logic.test.js` | Tier 1, Tier 3, Tier 4 |
| **F-08** | School Track & Ethics | `src/app/api/school/*` | `test/e2e/comprehensive_e2e_suite.test.js`, `test/unit/age_band.test.js` | Tier 1, Tier 4 |
| **F-09** | Gamification Idempotency| `src/lib/gamification-service.ts` | `test/e2e/comprehensive_e2e_suite.test.js`, `test/unit/gamification_idempotency.test.js` | Tier 1, Tier 2, Tier 3 |
| **F-10** | Razorpay Monetization | `src/lib/entitlement-service.ts` | `test/e2e/comprehensive_e2e_suite.test.js`, `test/unit/razorpay_signatures.test.js` | Tier 1, Tier 2, Tier 4 |
| **F-11** | Institutional & WAF | `src/lib/firewall/waf.ts` | `test/e2e/comprehensive_e2e_suite.test.js`, `test/security/workflow_and_auth_security.test.js` | Tier 1, Tier 2 |
| **F-12** | Stage-Specific Expansion | `src/lib/career/roadmap-generator.ts` | `test/e2e/comprehensive_e2e_suite.test.js`, `test/e2e/critical_user_journeys.test.js` | Tier 1, Tier 2, Tier 3, Tier 4 |
| **F-13** | Verification & Launch | All Suites | Full automated verification pipeline (`package.json`) | All Tiers |

---

## 4. Test Architecture & Runner Commands

### 4.1 Test Harness Layout
```
test/
├── e2e/
│   ├── comprehensive_e2e_suite.test.js    # Comprehensive Tiers 1-4 Test Suite (Primary)
│   └── critical_user_journeys.test.js     # Baseline Critical User Journeys
├── security/
│   ├── security_regression_suite.test.js   # RBAC, PII redaction, isolation
│   └── workflow_and_auth_security.test.js  # WAF threat rules, prototype pollution
├── integration/
│   ├── auth_onboarding_flow.test.js       # Lifecycle integration
│   ├── razorpay_verification.test.js      # HMAC payment verification
│   └── ...                                # 19 additional integration suites
└── unit/
    ├── scoring_logic.test.js              # Heuristic scoring tests
    ├── entitlements.test.js               # Plan quota limit tests
    ├── age_band.test.js                   # Age classification tests
    └── ...                                # 14 additional unit suites
```

### 4.2 Standard Execution Commands

#### Primary E2E Test Suite (Tiers 1-4)
```powershell
node test/e2e/comprehensive_e2e_suite.test.js
```
*Expected Result*: 100% Pass across all 4 tiers (25+ test specifications, 0 failures).

#### Baseline E2E Suite
```powershell
node test/e2e/critical_user_journeys.test.js
```
*Expected Result*: 5/5 Critical User Journeys Pass.

#### Complete E2E Track Verification
```powershell
node test/e2e/comprehensive_e2e_suite.test.js && node test/e2e/critical_user_journeys.test.js
```

#### Full Regression & Security Verification
```powershell
node test/security/security_regression_suite.test.js
node test/security/workflow_and_auth_security.test.js
```

---

## 5. Continuous Integration & Quality Gates

To maintain quality and prevent regressions:
1. **Type Safety**: `npx tsc --noEmit` must return code 0 with zero errors.
2. **Lint Integrity**: `npm run lint` must complete non-interactively with zero errors.
3. **E2E Gate**: `node test/e2e/comprehensive_e2e_suite.test.js` must exit with code 0 before any staging promotion.
4. **Adversarial Resilience**: Zero false-positive blocks on authentic engineering terminology, 100% block rate on malicious attack payloads.
