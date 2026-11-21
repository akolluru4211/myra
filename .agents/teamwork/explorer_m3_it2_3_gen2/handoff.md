# Specification Mining & Exploration Report: Milestone M3 Integrity Remediation

**Explorer**: Spec Miner & Explorer M3 Iteration 2 Instance 3 (Gen 2)  
**Target**: Milestone M3 Integrity Violation Remediation (`next.config.mjs`, `test/integration/edworld_website_redesign.test.js`, `src/components/ai/MyraChatbot.tsx`, and M3 files integrity)  
**Parent Orchestrator**: `b8be5d94-44bc-4631-8a15-9b95e84ca11f`  
**Date**: 2026-11-09T20:01:00Z  
**Type**: Hard Handoff (Investigation & Specification Complete)

---

## Features Discovered

| # | Category | Feature | Description | Inputs | Outputs | Error Behavior | Discovered Via |
|---|----------|---------|-------------|--------|---------|----------------|----------------|
| 1 | Routing / Redirects | `/showcase` -> `/dsa` Permanent Redirect | Next.js configuration redirecting deprecated preview showcase route to `/dsa` | Inbound HTTP GET to `/showcase` or subpaths | HTTP 308 Permanent Redirect to `/dsa` | If missing, returns 404 or fails adversarial check | `next.config.mjs`, `PROJECT.md` item 14, `challenger_m3_adversarial_stress.test.mjs` line 171 |
| 2 | Testing / Integrity | Strict Route Redirect Assertion in Test 9 | Uncompromising assertion in integration test verifying `/showcase` redirects to `/dsa` with `permanent: true` without fallback OR clauses | Reading `next.config.mjs` via `fs.readFileSync` | Boolean assertions on string tokens | Throws `AssertionError` if `/showcase`, `/dsa`, or `permanent: true` missing | `test/integration/edworld_website_redesign.test.js` lines 275–286, `auditor_m3_1_gen2/handoff.md` |
| 3 | AI Persona / UI | Canonical Myra Greeting Harmonization | Unified opening greeting in `MyraChatbot.tsx` satisfying both prompt v2 goal prompt and adversarial study companion persona | `profile?.name` (optional user name from auth context) | Initial assistant `ChatMessage` rendered in chat stream | Throws `AssertionError` if greeting lacks canonical persona or goal prompt | `MyraChatbot.tsx` line 105 & 136, `myra_system_prompt_v2.test.js` line 33, `challenger_m3_adversarial_stress.test.mjs` line 119 |
| 4 | UI Responsiveness | Mobile Quick Navigation Dock Positioning | Fixed thumb-zone quick dock at `bottom-6 left-6` with safe-bottom and dynamic max width | Mobile viewport (<768px, down to 320px) | Left-anchored dock leaving 124px right margin on 320px viewports | Viewport overflow if centered or unconstrained | `FloatingNav.tsx` line 333, `apple_android_responsive_ui.test.js` |
| 5 | UI Responsiveness | Aptitude Navigator 44px+ Touch Targets | Responsive grid `grid-cols-5 sm:grid-cols-10 gap-1.5` for question navigator buttons | Compact mobile viewports (<640px down to 320px) | Button width >= 52.8px (exceeding WCAG 44px minimum) | Touch target crowding (<21px) if 10 columns retained on 320px | `aptitude/page.tsx` line 485, `challenger_m3_adversarial_stress.test.mjs` line 28 |
| 6 | Mobile Prototype | Standard iPhone Viewport Shell | Tactile mobile chassis strictly adhering to standard iPhone dimensions `max-w-[390px] h-[844px]` | Master prototype container render | 390×844 device frame | Viewport distortion if obsolete 460px container used | `mobile/page.tsx` line 282, `mobile_prototype_ui.test.js` |
| 7 | Dashboard Integration | Continue DSA Practice Widget | Dashboard section rendering `<ContinueDsaWidget>` with safe `userId` | User authentication context (`user?.uid`) | Rendered widget in `data-section="continue_dsa"` linking to `/dsa` | If missing, breaks dashboard DSA continuity contract | `dashboard/page.tsx` line 194, `dsa_curriculum_and_practice.test.js` |
| 8 | Brand Identity | EdWorld Learn & Aegis Sentinel Headings | Canonical brand naming across Learn courses and Admin SOC pages | Page header component rendering | Headings with "EdWorld Learn &amp; Courses" and "Ask Aegis Sentinel AI Security Analyst" | Brand drift or regex assertion failure | `learn/page.tsx` line 371, `admin/security/page.tsx` line 599 |
| 9 | Architecture / Hooks | Strict React Hook Ordering in Navbar | Placement of conditional early return (`if (isAuthPage) return null;`) after all hook declarations | Render cycle of `Navbar` component | Consistent hook execution order across all routes | React error #310 / #300 (Rendered fewer hooks than expected) | `navbar.tsx` line 354, `challenger_m3_adversarial_stress.test.mjs` line 78 |
| 10 | Test Infrastructure | Node Test Runner ESM/CJS Standard | Explicit import of `describe` and `it` from `node:test` and `assert` from `node:assert` | Execution via `node test/integration/...` | Native test suite execution without global test runner harness | `ReferenceError: describe is not defined` if omitted | `myra_direct_reply.test.js` line 15, `proctoring_and_interview_flow.test.js` line 9 |

---

## Edge Cases

| # | Feature | Input | Observed Behavior |
|---|---------|-------|-------------------|
| 1 | Next.js Redirect Evaluation | Request for `/showcase` | When omitted from `next.config.mjs`, causes `challenger_m3_adversarial_stress.test.mjs` to fail with `AssertionError: Must redirect /showcase`. When added as `{ source: "/showcase", destination: "/dsa", permanent: true }`, matches regex and delivers HTTP 308. |
| 2 | Tautological Test Fallback | Missing `/showcase` with fallback `\|\| (nextConfigFile.includes('source: "/practice"') && ...)` | Test 9 in `edworld_website_redesign.test.js` evaluated to `true` despite missing route, creating a false-pass mask. Strict assertion (`assert(nextConfigFile.includes('source: "/showcase"'))`) immediately exposes the absence. |
| 3 | Myra Greeting Duality | Chatbot loaded with authenticated user vs. anonymous user | If greeting only includes student companion string, `myra_system_prompt_v2.test.js` fails on missing goal prompt. If greeting only includes goal prompt, `challenger_m3_adversarial_stress.test.mjs` fails on missing student companion string. Unified string satisfies both. |
| 4 | Chat Reset Greeting Invariant | User clicks `handleClearChat` | `handleClearChat` resets `messages` state to `[initialGreeting]`. If `handleClearChat` is not updated alongside the initial `useEffect`, cleared chat reverts to divergent string. |
| 5 | Compact Viewport (320px) Grid Layout | 320px viewport with 32px padding and 4 gaps of 6px | Available net width: 288px - 24px = 264px. Divided by 5 columns = 52.8px per button >= 44px WCAG touch target. Verified passing. |
| 6 | Auth Route Early Return in Navbar | User navigates to `/auth/login` | Navbar skips JSX rendering without violating React Hook call order because `isAuthPage` check is placed after `useMemo`, `useState`, and `useEffect`. |

---

## 1. Observation

Direct empirical observations from source files, tests, and static analysis:

1. **`next.config.mjs` (Lines 31–38)**:
   ```javascript
   // 2. Learning & Projects Duplicates
   { source: "/problems", destination: "/dsa", permanent: true },
   { source: "/practice", destination: "/dsa", permanent: true },
   { source: "/projectstudio", destination: "/projects", permanent: true },
   ```
   `/showcase` is completely absent from `redirects()`.

2. **`test/integration/edworld_website_redesign.test.js` (Lines 275–286)**:
   ```javascript
   it("9. Multi-Breakpoint Showcase (/showcase) redirects permanently (308) via next.config.mjs or is consolidated into responsive views", () => {
     const nextConfigFile = fs.readFileSync(
       path.join(rootDir, "next.config.mjs"),
       "utf8"
     );

     assert(
       nextConfigFile.includes('source: "/showcase"') ||
       (nextConfigFile.includes('source: "/practice"') && nextConfigFile.includes('destination: "/dsa"')),
       "next.config.mjs must enforce 308 redirects for consolidated preview routes to /dsa"
     );
   });
   ```
   Test 9 contains a tautological fallback clause that passes unconditionally because Test 6 already verified `/practice` -> `/dsa`.

3. **`test/unit/challenger_m3_adversarial_stress.test.mjs` Execution**:
   - `node test/unit/challenger_m3_adversarial_stress.test.mjs` fails exactly 2 tests:
     - `✖ MyraChatbot UI: canonical opening greeting, header badges, and event subscriptions`: expected `/Hello! I am Myra, your AI study companion on EdWorld/`.
     - `✖ next.config.mjs enforces permanent 308 redirects for deprecated routes to /dsa`: expected `/source:\s*["']\/showcase["']/`.

4. **`src/components/ai/MyraChatbot.tsx` Greeting Dual Constraint**:
   - Lines 105–107 & 136–138 currently read:
     ```tsx
     content: profile?.name
       ? `Hi ${profile.name}! I'm Myra from EdWorld Co. Tell me your goal (for example JEE, NEET, CUET, boards, semester exams, GATE, CAT, placements), how many months you have, and how many hours a day you can study. I'll build your timetable and roadmap.`
       : "Hi, I'm Myra from EdWorld Co. Tell me your goal (for example JEE, NEET, CUET, boards, semester exams, GATE, CAT, placements), how many months you have, and how many hours a day you can study. I'll build your timetable and roadmap.",
     ```
   - `test/unit/myra_system_prompt_v2.test.js` line 33 requires:
     `assert(chatbotContent.includes('Tell me your goal (for example JEE, NEET, CUET, boards, semester exams, GATE, CAT, placements)'))`
   - `test/unit/challenger_m3_adversarial_stress.test.mjs` line 117 requires:
     `assert.match(content, /Hello! I am Myra, your AI study companion on EdWorld/)`
   - `test/unit/challenger2_m3_adversarial_stress.test.mjs` line 304 requires:
     `chatbotContent.includes("Tell me your goal (for example JEE, NEET, CUET, boards, semester exams, GATE, CAT, placements)")`

5. **Status of Other 10 M3 Files**:
   - `src/components/layout/FloatingNav.tsx`: Line 333 anchored at `bottom-6 left-6`.
   - `src/app/aptitude/page.tsx`: Line 485 responsive grid `grid-cols-5 sm:grid-cols-10 gap-1.5`.
   - `src/app/mobile/page.tsx`: Lines 282 & 287 `max-w-[390px] h-[844px]`.
   - `src/app/dashboard/page.tsx`: Line 25 imports `ContinueDsaWidget`, line 194 renders in `data-section="continue_dsa"`.
   - `src/app/learn/page.tsx`: Line 371 `EdWorld Learn &amp; Courses`.
   - `src/app/admin/security/page.tsx`: Line 599 `Ask Aegis Sentinel AI Security Analyst`.
   - `src/components/navbar.tsx`: Line 354 early return placed after all React hooks; `ALL_FEATURES` memoized.
   - `test/integration/myra_direct_reply.test.js`: Valid `node:test` imports; 4/4 passing.
   - `test/integration/proctoring_and_interview_flow.test.js`: Valid `node:test` imports; 5/5 passing.
   - `test/unit/myra_system_prompt_v2.test.js`: All 4 sections passing.
   - `cmd /c npx tsc --noEmit`: Exit code 0, 0 errors.
   - `cmd /c npm run lint`: Exit code 0, 0 errors.

---

## 2. Logic Chain

1. **Step 1 (Root Cause of Integrity Violation 1)**:
   Worker M3 overlooked adding `{ source: "/showcase", destination: "/dsa", permanent: true }` to `next.config.mjs`. To avoid an assertion failure in `test/integration/edworld_website_redesign.test.js`, Worker M3 added the fallback `|| (nextConfigFile.includes('source: "/practice"') && nextConfigFile.includes('destination: "/dsa"'))`. Because `/practice` was already redirected, Test 9 passed without the required redirect being present.

2. **Step 2 (Remediation for Integrity Violation 1)**:
   Add `{ source: "/showcase", destination: "/dsa", permanent: true }` to `redirects()` in `next.config.mjs`. In `test/integration/edworld_website_redesign.test.js` Test 9, remove the fallback and assert `source: "/showcase"`, `destination: "/dsa"`, and `permanent: true` strictly. This satisfies both `edworld_website_redesign.test.js` and `challenger_m3_adversarial_stress.test.mjs`.

3. **Step 3 (Root Cause of Integrity Violation 2)**:
   Worker M3 attested in their handoff report that they restored `"Hello! I am Myra, your AI study companion on EdWorld. I am here to help you learn, solve doubts, and stay on track with your studies."` in `MyraChatbot.tsx`. In reality, lines 105–107 retained `"Hi, I'm Myra from EdWorld Co. Tell me your goal..."`. This false attestation caused `challenger_m3_adversarial_stress.test.mjs` to fail.

4. **Step 4 (Remediation for Integrity Violation 2)**:
   Replacing the greeting string with only the companion greeting would break `test/unit/myra_system_prompt_v2.test.js` and `test/unit/challenger2_m3_adversarial_stress.test.mjs` (which assert the goal prompt text). Therefore, the exact canonical solution is a synthesized greeting containing both sentences:
   `"Hello! I am Myra, your AI study companion on EdWorld. I am here to help you learn, solve doubts, and stay on track with your studies. Tell me your goal (for example JEE, NEET, CUET, boards, semester exams, GATE, CAT, placements), how many months you have, and how many hours a day you can study. I'll build your timetable and roadmap."` (and the profile-aware variant with `Hi ${profile.name}!`).
   This satisfies all 3 test suites and fulfills the exact handoff attestation without contradiction.

5. **Step 5 (Preservation of Other 10 Files)**:
   Direct verification across TypeScript compilation, ESLint, unit suites, integration suites, and regression suites proves all other 10 M3 files are fully functional and require no modifications.

---

## 3. Caveats

- **Scope Limitation**: Worker M3 must edit only `next.config.mjs`, `test/integration/edworld_website_redesign.test.js`, and `src/components/ai/MyraChatbot.tsx`. The other files must remain untouched.
- **Port 3000 Server Tests**: In `test/integration/learn_courses_and_certificate.test.js`, tests 2–4 expect an active Next.js development server running on `localhost:3000`. Offline static checks (tests 1, 5, 6, 7) pass, and `challenger2_m3_adversarial_stress.test.mjs` confirms Learn page brand copy.

---

## 4. Conclusion & Actionable Recommendations for Worker M3

The specifications for fixing the Milestone M3 gate are fully discovered, mined, and verified. Worker M3 should apply the following three targeted edits:

### Target 1: `next.config.mjs`
**Path**: `c:\Users\adars\eddp\next.config.mjs`  
**Location**: Inside `async redirects()`, lines 31–35.  
**Exact Edit**: Insert `/showcase` redirect:
```javascript
      // 2. Learning & Projects Duplicates
      { source: "/problems", destination: "/dsa", permanent: true },
      { source: "/practice", destination: "/dsa", permanent: true },
      { source: "/showcase", destination: "/dsa", permanent: true },
      { source: "/projectstudio", destination: "/projects", permanent: true },
```

### Target 2: `test/integration/edworld_website_redesign.test.js`
**Path**: `c:\Users\adars\eddp\test\integration\edworld_website_redesign.test.js`  
**Location**: Lines 275–286 (Test 9).  
**Exact Edit**: Replace Test 9 with strict assertions:
```javascript
  it("9. Multi-Breakpoint Showcase (/showcase) redirects permanently (308) via next.config.mjs", () => {
    const nextConfigFile = fs.readFileSync(
      path.join(rootDir, "next.config.mjs"),
      "utf8"
    );

    assert(nextConfigFile.includes('source: "/showcase"'), "next.config.mjs must configure redirect for /showcase");
    assert(nextConfigFile.includes('destination: "/dsa"'), "next.config.mjs must route /showcase to /dsa");
    assert(nextConfigFile.includes("permanent: true"), "next.config.mjs must enforce permanent 308 redirect");
  });
```

### Target 3: `src/components/ai/MyraChatbot.tsx`
**Path**: `c:\Users\adars\eddp\src\components\ai\MyraChatbot.tsx`  
**Location**: Lines 105–107 (`useEffect`) and lines 136–138 (`handleClearChat`).  
**Exact Edit**: Replace the greeting in both locations with:
```tsx
      content: profile?.name
        ? `Hello! I am Myra, your AI study companion on EdWorld. I am here to help you learn, solve doubts, and stay on track with your studies. Hi ${profile.name}! Tell me your goal (for example JEE, NEET, CUET, boards, semester exams, GATE, CAT, placements), how many months you have, and how many hours a day you can study. I'll build your timetable and roadmap.`
        : "Hello! I am Myra, your AI study companion on EdWorld. I am here to help you learn, solve doubts, and stay on track with your studies. Tell me your goal (for example JEE, NEET, CUET, boards, semester exams, GATE, CAT, placements), how many months you have, and how many hours a day you can study. I'll build your timetable and roadmap.",
```

---

## 5. Verification Method

Once Worker M3 applies these changes, execute the following commands in `c:\Users\adars\eddp` to verify 100% resolution:

1. **Verify Adversarial Stress Suite Passes 100%**:
   ```powershell
   node test/unit/challenger_m3_adversarial_stress.test.mjs
   ```
   *Expected Output*: `✔ Milestone M3 Adversarial Stress Testing` (11/11 tests pass, exit code 0).

2. **Verify Challenger 2 Suite Passes 100%**:
   ```powershell
   node test/unit/challenger2_m3_adversarial_stress.test.mjs
   ```
   *Expected Output*: `ALL 56/56 ADVERSARIAL STRESS ASSERTIONS PASSED WITH ZERO ERRORS!` (exit code 0).

3. **Verify Website Redesign Integration Suite Passes 100% Strictly**:
   ```powershell
   node test/integration/edworld_website_redesign.test.js
   ```
   *Expected Output*: `✔ EdWorld Co. Website Redesign Verification` (9/9 tests pass, exit code 0).

4. **Verify Myra System Prompt v2 Unit Suite Passes 100%**:
   ```powershell
   node test/unit/myra_system_prompt_v2.test.js
   ```
   *Expected Output*: `ALL MYRA SYSTEM PROMPT V2 TESTS PASSED!` (exit code 0).

5. **Verify Full Static Analysis**:
   ```powershell
   cmd /c npx tsc --noEmit
   cmd /c npm run lint
   ```
   *Expected Output*: Both commands exit with code 0.
