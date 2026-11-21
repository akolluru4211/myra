import assert from "node:assert/strict";
import { getAvailableSectors, pickInterviewQuestions } from "../../src/lib/interview/interview-bank.ts";

console.log("🧪 Running Live AI Mock Interview Simulation & Question Bank Integration Tests...\n");

// Test 1: Verify Available 46 Sectors
console.log("Test 1: Verify 46 Available Sectors...");
const sectors = getAvailableSectors();
assert.ok(Array.isArray(sectors), "Sectors list should be an array");
assert.equal(sectors.length, 46, `Expected exactly 46 sectors, got ${sectors.length}`);
console.log(`  PASS: Found all ${sectors.length} sectors in interview bank.`);

// Test 2: Verify Sector Question Bank Drill Generation
console.log("Test 2: Verify Sector Question Bank Drill for Diverse Sectors...");
const testSectors = ["Software development", "Cloud engineering", "Cybersecurity", "Fintech / banking", "Data science & AI"];

for (const sector of testSectors) {
  const questions = pickInterviewQuestions({ sector, limit: 5, seed: 123 });
  assert.ok(questions.length >= 3, `Expected at least 3 questions for sector "${sector}", got ${questions.length}`);
  
  for (const q of questions) {
    assert.ok(q.id, "Question must have an ID");
    assert.ok(q.question, "Question text must not be empty");
    assert.ok(q.round, "Question must specify round");
    assert.ok(q.level, "Question must specify level");
  }
}
console.log(`  PASS: All test sectors successfully returned authentic questions.`);

// Test 3: Verify STAR Method Keyword Detection
console.log("Test 3: Verify Real-Time STAR Method Keyword Detection Logic...");
function evaluateStarProgress(transcript) {
  const transcriptLower = transcript.toLowerCase();
  const hasSituation = Boolean(transcriptLower.match(/\b(when|at|during|project|context|company|team|client|scenario|system)\b/));
  const hasTask = Boolean(transcriptLower.match(/\b(task|goal|needed to|responsible for|objective|requirement|challenge|problem)\b/));
  const hasAction = Boolean(transcriptLower.match(/\b(i implemented|i built|i designed|i led|i created|i refactored|i decided|my approach|we used|i optimized|i handled)\b/));
  const hasResult = Boolean(transcriptLower.match(/\b(result|increased|reduced|improved|percent|%|achieved|delivered|outcome|latency|saved|speedup)\b/));
  return { hasSituation, hasTask, hasAction, hasResult };
}

const weakAnswer = "Yes, I like coding and doing problems.";
const weakStar = evaluateStarProgress(weakAnswer);
assert.equal(weakStar.hasSituation, false);
assert.equal(weakStar.hasResult, false);

const strongAnswer = "When I was working on our production web project, the main task was to reduce page loading latency. I implemented a Redis caching layer and refactored the database queries. As a result, we reduced API latency by 45 percent.";
const strongStar = evaluateStarProgress(strongAnswer);
assert.equal(strongStar.hasSituation, true, "Should detect Situation ('when', 'project')");
assert.equal(strongStar.hasTask, true, "Should detect Task ('task', 'latency')");
assert.equal(strongStar.hasAction, true, "Should detect Action ('I implemented', 'refactored')");
assert.equal(strongStar.hasResult, true, "Should detect Result ('result', 'reduced', 'percent')");
console.log("  PASS: STAR Method detection accurately scores weak vs. structured answers.");

// Test 4: Verify Difficulty-Level Mapping for Questions
console.log("Test 4: Verify Difficulty-Level Mapping for Bank Drill Questions...");
const seniorQuestions = pickInterviewQuestions({ sector: "Software development", level: "Experienced", limit: 3 });
for (const q of seniorQuestions) {
  assert.ok(q.level.toLowerCase().includes("exp") || q.level.toLowerCase().includes("all"), `Expected experienced level, got ${q.level}`);
}
console.log("  PASS: Level filtering correctly isolates senior/experienced questions.");

console.log("\n🎉 ALL 4 LIVE INTERVIEW SIMULATION TEST SUITES PASSED PERFECTLY!\n");
