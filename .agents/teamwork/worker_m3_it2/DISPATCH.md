## 2026-11-09T20:02:52Z
You are Worker M3 Iteration 2 (Remediation).
Working directory: c:\Users\adars\eddp\.agents\teamwork\worker_m3_it2\
Project root: c:\Users\adars\eddp
Original request: c:\Users\adars\eddp\.agents\teamwork\ORIGINAL_REQUEST.md
Master project plan: c:\Users\adars\eddp\.agents\teamwork\orchestrator_gen2\PROJECT.md
Forensic Auditor Report: c:\Users\adars\eddp\.agents\teamwork\auditor_m3_1_gen2\handoff.md
Spec Miner Report: c:\Users\adars\eddp\.agents\teamwork\explorer_m3_it2_3_gen2\handoff.md
Explorer 2 Report: c:\Users\adars\eddp\.agents\teamwork\explorer_m3_it2_2_gen2\handoff.md

MANDATORY INTEGRITY WARNING:
DO NOT CHEAT. All implementations must be genuine. DO NOT hardcode test results, create dummy/facade implementations, or circumvent the intended task. A teamwork_auditor will independently verify your work. Integrity violations WILL be detected and your work WILL be rejected.

YOUR ASSIGNMENT & FILE OWNERSHIP:
You have exclusive write ownership of exactly 3 files:
1. c:\Users\adars\eddp\next.config.mjs
2. c:\Users\adars\eddp\test\integration\edworld_website_redesign.test.js
3. c:\Users\adars\eddp\src\components\ai\MyraChatbot.tsx

Do NOT touch any other source or test files.

TASKS:
1. Edit next.config.mjs:
   In async redirects(), under '// 2. Learning & Projects Duplicates':
   Add:
   { source: "/showcase", destination: "/dsa", permanent: true },

2. Edit test/integration/edworld_website_redesign.test.js:
   In Test 9 (lines 275–286), remove the fallback OR clause and enforce strict assertions:
   it("9. Multi-Breakpoint Showcase (/showcase) redirects permanently (308) to /dsa via next.config.mjs", () => {
     const nextConfigFile = fs.readFileSync(
       path.join(rootDir, "next.config.mjs"),
       "utf8"
     );

     assert(nextConfigFile.includes('source: "/showcase"'), "next.config.mjs must configure redirect for /showcase");
     assert(nextConfigFile.includes('destination: "/dsa"'), "next.config.mjs must route /showcase to /dsa");
     assert(nextConfigFile.includes("permanent: true"), "next.config.mjs must enforce permanent 308 redirect");
   });

3. Edit src/components/ai/MyraChatbot.tsx:
   In both useEffect (lines 105–107) and handleClearChat (lines 136–138), update the greeting to:
   content: profile?.name
     ? `Hello ${profile.name}! I am Myra, your AI study companion on EdWorld. Tell me your goal (for example JEE, NEET, CUET, boards, semester exams, GATE, CAT, placements), how many months you have, and how many hours a day you can study. I'll build your timetable and roadmap.`
     : "Hello! I am Myra, your AI study companion on EdWorld. Tell me your goal (for example JEE, NEET, CUET, boards, semester exams, GATE, CAT, placements), how many months you have, and how many hours a day you can study. I'll build your timetable and roadmap.",

4. Verify your work by running:
   - node test/unit/challenger_m3_adversarial_stress.test.mjs
   - node test/unit/challenger2_m3_adversarial_stress.test.mjs
   - node test/integration/edworld_website_redesign.test.js
   - node test/unit/myra_system_prompt_v2.test.js
   - cmd /c npx tsc --noEmit
   - cmd /c npm run lint
   - cmd /c npm test

5. Produce a comprehensive, 100% truthful handoff.md in your working directory (.agents/teamwork/worker_m3_it2/handoff.md) documenting Observation, Logic Chain, Caveats, Conclusion, and Verification Method.
Notify orchestrator via send_message when complete.
