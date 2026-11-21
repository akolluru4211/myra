import test from "node:test";
import assert from "node:assert/strict";
import { MYRA_SYSTEM_PROMPT, buildMyraContextPrompt } from "../../src/lib/ai/myra-agent.ts";

test("Myra System Prompt contains the in-app guide persona and resolved EdWorld features", () => {
  // Check Role & In-App Guide persona
  assert(
    MYRA_SYSTEM_PROMPT.includes("ROLE & IN-APP GUIDE"),
    "Must include ROLE & IN-APP GUIDE section"
  );
  assert(
    MYRA_SYSTEM_PROMPT.includes("When a student taps \"Ask Myra AI\" from any screen, you are also their in-app guide"),
    "Must state role as in-app guide"
  );

  // Check no raw bracketed placeholders remain in feature titles or support contact
  assert(
    !MYRA_SYSTEM_PROMPT.includes("[SUPPORT CONTACT]"),
    "Must replace [SUPPORT CONTACT] with real contact"
  );
  assert(
    MYRA_SYSTEM_PROMPT.includes("support@edworld.co"),
    "Must include support@edworld.co"
  );

  // Check resolved feature screens
  assert(
    MYRA_SYSTEM_PROMPT.includes("Doubt Solver & Ask Myra"),
    "Must include Doubt Solver & Ask Myra feature"
  );
  assert(
    MYRA_SYSTEM_PROMPT.includes("Personalized Timetable"),
    "Must include Personalized Timetable feature"
  );
  assert(
    MYRA_SYSTEM_PROMPT.includes("AI Career Roadmap"),
    "Must include AI Career Roadmap feature"
  );
  assert(
    MYRA_SYSTEM_PROMPT.includes("Practice & DSA Arena"),
    "Must include Practice & DSA Arena feature"
  );
  assert(
    MYRA_SYSTEM_PROMPT.includes("AI Mock Interview Studio"),
    "Must include AI Mock Interview Studio feature"
  );
  assert(
    MYRA_SYSTEM_PROMPT.includes("Interactive Courses & Blueprints"),
    "Must include Interactive Courses & Blueprints feature"
  );
  assert(
    MYRA_SYSTEM_PROMPT.includes("Student Progress Widget"),
    "Must include Student Progress Widget feature"
  );
  assert(
    MYRA_SYSTEM_PROMPT.includes("Profile & Settings"),
    "Must include Profile & Settings feature"
  );

  // Check signature EdWorld features
  assert(
    MYRA_SYSTEM_PROMPT.includes("Focus Lock Studio - Focus Lock"),
    "Must include Focus Lock Studio"
  );
  assert(
    MYRA_SYSTEM_PROMPT.includes("EdBuild Collaborative Squads - EdBuild Workspaces"),
    "Must include EdBuild Collaborative Squads"
  );
  assert(
    MYRA_SYSTEM_PROMPT.includes("Placement Scam Checker - Scam Offer Checker"),
    "Must include Placement Scam Checker"
  );
  assert(
    MYRA_SYSTEM_PROMPT.includes("ATS Resume Studio - Resume Studio"),
    "Must include ATS Resume Studio"
  );

  // Check Safety Rules and Crisis Helpline
  assert(
    MYRA_SYSTEM_PROMPT.includes("Tele-MANAS 14416 (India) and 112 for emergencies"),
    "Must retain crisis helpline"
  );
});

test("buildMyraContextPrompt includes system prompt and in-app guide instruction cues", () => {
  const query = "[CONTEXT: screen=Focus Lock | feature=focus_lock | user_class=12 | first_time=true | last_error=none]\nI'm stuck on this screen. Help me.";
  const result = buildMyraContextPrompt(query, {
    name: "Alex",
    gradeLevel: "12",
    dailyStudyHours: 3,
  });

  assert(result.systemPrompt.includes("ROLE & IN-APP GUIDE"));
  assert(result.prompt.includes("User Question:"));
  assert(result.prompt.includes("Focus Lock"));
  assert(result.prompt.includes("official Myra Study Mentor & In-App Guide guidelines"));
});
