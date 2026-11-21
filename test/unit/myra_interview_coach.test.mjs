import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, "../..");

console.log("🧪 Running Myra Interview Coach & 1,000 Questions Bank Tests...\n");

// 1. Verify JSON file integrity
const jsonPath = path.join(rootDir, "src/lib/data/interview_questions_1000.json");
const dataJsonPath = path.join(rootDir, "data/interview_questions_1000.json");
const csvPath = path.join(rootDir, "data/interview_questions_1000.csv");
const promptPath = path.join(rootDir, "data/myra_interview_coach_prompt.txt");

assert.ok(fs.existsSync(jsonPath), "src/lib/data/interview_questions_1000.json must exist");
assert.ok(fs.existsSync(dataJsonPath), "data/interview_questions_1000.json must exist");
assert.ok(fs.existsSync(csvPath), "data/interview_questions_1000.csv must exist");
assert.ok(fs.existsSync(promptPath), "data/myra_interview_coach_prompt.txt must exist");

const questions = JSON.parse(fs.readFileSync(jsonPath, "utf-8"));
console.log(`✅ Loaded ${questions.length} questions from JSON`);
assert.equal(questions.length, 1000, "Question bank must contain exactly 1,000 questions");

// 2. Verify schema and sectors
const sectors = new Set();
const ids = new Set();
for (const q of questions) {
  assert.ok(q.id && typeof q.id === "string", "Question must have valid id");
  assert.ok(q.sector && typeof q.sector === "string", "Question must have valid sector");
  assert.ok(q.round && typeof q.round === "string", "Question must have valid round");
  assert.ok(q.level && typeof q.level === "string", "Question must have valid level");
  assert.ok(q.question && typeof q.question === "string", "Question must have valid text");
  sectors.add(q.sector);
  ids.add(q.id);
}
assert.equal(ids.size, 1000, "All 1,000 question IDs must be unique");
assert.equal(sectors.size, 46, "There must be exactly 46 sectors in the question bank");
console.log(`✅ Verified 1,000 unique questions across ${sectors.size} distinct sectors`);

// 3. Verify interview-bank module functions
const {
  pickInterviewQuestions,
  formatQuestionBankBlock,
  getAvailableSectors,
  getSectorStats,
  getAllInterviewQuestions,
} = await import("../../src/lib/interview/interview-bank.ts");

const all = getAllInterviewQuestions();
assert.equal(all.length, 1000, "getAllInterviewQuestions must return 1,000 items");

const availableSectors = getAvailableSectors();
assert.equal(availableSectors.length, 46, "getAvailableSectors must return 46 sectors");

const stats = getSectorStats();
assert.equal(stats.length, 46, "getSectorStats must return statistics for 46 sectors");
const totalCountFromStats = stats.reduce((acc, curr) => acc + curr.count, 0);
assert.equal(totalCountFromStats, 1000, "Total question count in stats must equal 1,000");
console.log(`✅ Verified getAvailableSectors() & getSectorStats() for 46 sectors`);

// 4. Test sampling with pickInterviewQuestions
const techQuestions = pickInterviewQuestions({ sector: "Software development", limit: 5 });
assert.equal(techQuestions.length, 5, "Should pick 5 questions for Software development");
for (const q of techQuestions) {
  assert.ok(q.sector.toLowerCase().includes("software"), "Picked question should belong to requested sector");
}

// Test fallback behavior when unknown sector is requested
const fallbackQuestions = pickInterviewQuestions({ sector: "UnknownNonexistentSector", limit: 3 });
assert.equal(fallbackQuestions.length, 3, "Fallback should return general questions for unknown sector");
for (const q of fallbackQuestions) {
  assert.ok(q.sector.toLowerCase().includes("general"), "Fallback question should belong to General sector");
}

const bankingFresher = pickInterviewQuestions({ sector: "Banking", level: "Fresher", limit: 3 });
assert.ok(bankingFresher.length <= 3 && bankingFresher.length > 0, "Should pick questions for Banking Fresher");

const generalSeedA = pickInterviewQuestions({ sector: "General", limit: 4, seed: 42 });
const generalSeedB = pickInterviewQuestions({ sector: "General", limit: 4, seed: 42 });
assert.deepEqual(generalSeedA.map(q => q.id), generalSeedB.map(q => q.id), "Seed must guarantee deterministic selection");
console.log(`✅ Verified pickInterviewQuestions() filtering and deterministic seed sampling`);

// 5. Test formatQuestionBankBlock
const block = formatQuestionBankBlock(techQuestions);
assert.ok(block.startsWith("[QUESTION_BANK]"), "Block must start with [QUESTION_BANK]");
assert.ok(block.endsWith("[/QUESTION_BANK]"), "Block must end with [/QUESTION_BANK]");
assert.ok(block.includes(techQuestions[0].id), "Block must contain sampled question id");
console.log(`✅ Verified formatQuestionBankBlock() formatting`);

// 6. Test Myra agent prompt integration
const { 
  MYRA_SYSTEM_PROMPT, 
  buildMyraContextPrompt, 
  buildInterviewCoachPrompt 
} = await import("../../src/lib/ai/myra-agent.ts");

assert.ok(MYRA_SYSTEM_PROMPT.includes("MYRA AI - INTERVIEW COACH PROMPT (EdWorld Co)"), "System prompt must include Interview Coach header");
assert.ok(MYRA_SYSTEM_PROMPT.includes("STAR = Situation, Task, Action, Result"), "System prompt must include STAR framework");
assert.ok(MYRA_SYSTEM_PROMPT.includes("Present (who you are now), Past"), "System prompt must include Present-Past-Future framework");
assert.ok(MYRA_SYSTEM_PROMPT.includes("Tele-MANAS 14416 (India) or 112"), "System prompt must preserve emergency support");
assert.ok(MYRA_SYSTEM_PROMPT.includes("TIMETABLE BUILDER"), "System prompt must retain study mentor rules");
assert.ok(MYRA_SYSTEM_PROMPT.includes("ROLE & IN-APP GUIDE"), "System prompt must retain in-app guide rules");
console.log(`✅ Verified MYRA_SYSTEM_PROMPT has Study Mentor, In-App Guide, and Interview Coach`);

// 7. Test interview query triggering in buildMyraContextPrompt
const contextPrompt = buildMyraContextPrompt("I need help with mock interview for banking clerk fresher", {
  name: "Adarsh",
  targetRole: "Banking Clerk",
  careerStage: "Fresher"
});

assert.ok(contextPrompt.prompt.includes("[QUESTION_BANK]"), "buildMyraContextPrompt must inject [QUESTION_BANK] for interview queries");
assert.ok(contextPrompt.prompt.includes("Interview Coach"), "Prompt must include interview coaching guidelines");
assert.ok(contextPrompt.systemPrompt.includes("MYRA AI - INTERVIEW COACH PROMPT"), "System prompt must be present");

// 8. Test buildInterviewCoachPrompt helper
const coachHelper = buildInterviewCoachPrompt("Civil engineering", "Technical", "Fresher", 5);
assert.equal(coachHelper.questions.length, 5, "buildInterviewCoachPrompt should pick 5 questions");
assert.ok(coachHelper.questionBlock.includes("[QUESTION_BANK]"), "Helper questionBlock must be formatted");

console.log("\n🎉 ALL 8 TEST SUITES PASSED PERFECTLY!\n");
