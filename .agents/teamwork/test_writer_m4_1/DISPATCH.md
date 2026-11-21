## 2026-11-09T20:15:54Z
You are Test Writer M4 Instance 1 (`test_writer_m4_1`).
Working directory: c:\Users\adars\eddp\.agents\teamwork\test_writer_m4_1\
Project root: c:\Users\adars\eddp
Original request: c:\Users\adars\eddp\.agents\teamwork\ORIGINAL_REQUEST.md
Master project plan: c:\Users\adars\eddp\.agents\teamwork\orchestrator_gen2\PROJECT.md

MANDATORY INTEGRITY WARNING:
DO NOT CHEAT. All tests must be genuine and execute against actual source logic or authentic imported functions. DO NOT hardcode trivial pass assertions or dummy checks. A teamwork_auditor will independently verify your work.

EXCLUSIVE FILE WRITE OWNERSHIP:
You have exclusive write ownership of:
1. c:\Users\adars\eddp\test\unit\career_roadmap_generator.test.js
2. c:\Users\adars\eddp\test\unit\language_analysis_service.test.js

SCOPE & REQUIREMENTS:
Author two comprehensive, high-quality automated regression test suites using Node native test runner (`node:test` and `node:assert`):

1. `test/unit/career_roadmap_generator.test.js`:
   - Target module: `src/lib/career/roadmap-generator.ts`
   - Test `TARGET_ROLE_OPTIONS`: check role array contents, lengths, and valid career paths.
   - Test `RoadmapMilestone` & `CareerRoadmapData` schema validation.
   - Test milestone horizons: `1_year`, `3_year`, `5_year` grouping, month index ordering, and range labels.
   - Test curated roadmap data defaults, fallback generation, and resource URL formats (`/dsa`, `/career`).
   - Test `toggleRoadmapMilestone` input handling and error resiliency.
   - Test `getActiveCareerRoadmap` query handling and null safety for missing/empty users.

2. `test/unit/language_analysis_service.test.js`:
   - Target module: `src/lib/interview/language-analysis-service.ts`
   - Test `analyzeSpokenLanguage`:
     - Word count, duration calculation, and words per minute (WPM) accuracy across variable speech speeds.
     - Sentence metrics: sentenceCount, avgSentenceLength, long/short sentence identification.
     - Filler word detection across all patterns (`actually`, `basically`, `like`, `you know`, `sort of`, `kind of`, `literally`, `um`, `uh`), frequency breakdown, and `topFiller` identification.
     - Grammar and phrasing issue matching from `COMMON_GRAMMAR_AND_PHRASING_FIXES`.
     - STAR technique pattern recognition (`situation`, `task`, `action`, `result`, `optimized`, `built`, `led`).
     - Composite scores: grammarScore, clarityScore, fluencyScore, vocabularyScore, professionalScore, and overallLanguageScore bounding (0–100 range).
     - Feedback and coaching output generation: strengths, areasForImprovement, coachSuggestions.
   - Test `compareInterviewAttempts` (deltas, score progression, filler word reduction percentage, structure verdicts).

EXECUTION & VERIFICATION:
- Name the test files `.test.js` so they are automatically discovered by `npm test` (`node --test test/unit/*.test.js`).
- Verify your test suites run cleanly:
  - `node test/unit/career_roadmap_generator.test.js`
  - `node test/unit/language_analysis_service.test.js`
  - `cmd /c npx tsc --noEmit`
  - `cmd /c npm test`
- Write a detailed handoff.md in your working directory (`c:\Users\adars\eddp\.agents\teamwork\test_writer_m4_1\handoff.md`).
- Notify orchestrator via send_message when complete.
