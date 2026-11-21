import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { 
  MYRA_CAREER_WRITING_OPENING_MESSAGE, 
  MYRA_CAREER_WRITING_ASSISTANT_PROMPT, 
  buildCareerWritingAssistantPrompt,
  buildMyraContextPrompt 
} from "../../src/lib/ai/myra-agent.ts";

console.log("🧪 Running Myra Career & Writing Assistant Test Suite...\n");

// Test 1: Verify prompt file exists and contains all 10 modules
console.log("Test 1: Verify data/myra_career_writing_assistant_prompt.txt Structure & Modules...");
const promptPath = path.resolve(process.cwd(), "data/myra_career_writing_assistant_prompt.txt");
assert.ok(fs.existsSync(promptPath), "Prompt file must exist at data/myra_career_writing_assistant_prompt.txt");

const fileContent = fs.readFileSync(promptPath, "utf-8");
const expectedModules = [
  "Professional Summary",
  "Resume / CV",
  "Cover Letter",
  "LinkedIn Profile",
  "Statement of Purpose",
  "Professional Emails",
  "Interview Prep",
  "Project Descriptions",
  "Career Guidance",
  "Academic Help"
];

for (const mod of expectedModules) {
  assert.ok(fileContent.includes(mod), `Prompt file must contain module "${mod}"`);
}
console.log(`  PASS: Found all 10 modules in prompt file.`);

// Test 2: Verify Opening Message & Official Prompt Export
console.log("Test 2: Verify Opening Message & System Prompt Exports...");
assert.equal(
  MYRA_CAREER_WRITING_OPENING_MESSAGE,
  "Hi, I'm Myra, your career and writing assistant at EdWorld Co. ✨ I can help you create a professional summary, resume, cover letter, LinkedIn profile, emails, interview answers, and more. What would you like to work on today?"
);
assert.ok(MYRA_CAREER_WRITING_ASSISTANT_PROMPT.includes("ROLE & MISSION"));
assert.ok(MYRA_CAREER_WRITING_ASSISTANT_PROMPT.includes("WRITING STANDARDS"));
assert.ok(MYRA_CAREER_WRITING_ASSISTANT_PROMPT.includes("Indian English"));
console.log("  PASS: Opening message and official system prompt verified.");

// Test 3: Verify buildCareerWritingAssistantPrompt Helper
console.log("Test 3: Verify buildCareerWritingAssistantPrompt Context Generator...");
const sampleProfile = {
  name: "Aakash Verma",
  gradeLevel: "Final Year BCA",
  careerStage: "STUDENT",
  targetRole: "Data Analyst",
  resumeSkills: ["Python", "SQL", "Tableau"],
};

const result = buildCareerWritingAssistantPrompt(sampleProfile, "Resume / CV", "Improve my project bullet point for an attendance app");
assert.ok(result.systemPrompt.includes("Myra, the AI study and career mentor"));
assert.ok(result.prompt.includes("[CAREER_WRITING_MODE: Resume / CV]"));
assert.ok(result.prompt.includes("Improve my project bullet point"));
console.log("  PASS: buildCareerWritingAssistantPrompt successfully injects enriched writing context.");

// Test 4: Verify Dynamic Writing Query Detection
console.log("Test 4: Verify Dynamic Writing Query Detection in buildMyraContextPrompt...");
const writingQueries = [
  "Can you help me write a cold email to an engineering manager?",
  "Please optimize my resume bullet points for ATS",
  "Help me draft a cover letter for a frontend role at Stripe",
  "Write a professional summary for my LinkedIn About section",
  "Help me structure my Statement of Purpose (SOP) for MS in CS"
];

for (const q of writingQueries) {
  const built = buildMyraContextPrompt(q, sampleProfile);
  assert.ok(built.prompt.includes("[CAREER_WRITING_MODE:"), `Query "${q}" should trigger CAREER_WRITING_MODE`);
}
console.log("  PASS: All 5 writing queries automatically routed to Career & Writing Assistant.");

// Test 5: Verify Guardrails & Writing Standards Enforcement
console.log("Test 5: Verify Guardrails & Writing Standards (No Fakes, Academic Integrity, Indian English)...");
assert.ok(fileContent.includes("Never invent facts, achievements, grades, companies, or numbers"), "Must forbid inventing facts");
assert.ok(fileContent.includes("[X%]"), "Must specify [X%] placeholder for missing data");
assert.ok(fileContent.includes("never do graded work for them"), "Must uphold academic integrity");
assert.ok(fileContent.includes("Indian English"), "Default style must be Indian English");
assert.ok(fileContent.includes("SELF-CHECK BEFORE EVERY REPLY"), "Must include 5-point self-check");
console.log("  PASS: All guardrails and writing standards verified.");

console.log("\n🎉 ALL 5 MYRA CAREER & WRITING ASSISTANT TEST SUITES PASSED PERFECTLY!\n");
