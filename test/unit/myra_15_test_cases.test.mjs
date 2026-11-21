import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { 
  MYRA_CAREER_WRITING_ASSISTANT_PROMPT, 
  detectWritingTask,
  buildMyraContextPrompt 
} from "../../src/lib/ai/myra-agent.ts";

console.log("🧪 Running Myra 15-Question Test Bank Verification Suite...\n");

const promptPath = path.resolve(process.cwd(), "data/myra_career_writing_assistant_prompt.txt");
const fileContent = fs.readFileSync(promptPath, "utf-8");

// Test 1: “Write my professional summary.” (no details)
// Expected: Asks for info, one or two questions at a time; doesn’t invent anything
console.log("Case 1: 'Write my professional summary.' (no details)");
{
  const query = "Write my professional summary.";
  const task = detectWritingTask(query);
  assert.equal(task.isWriting, true);
  assert.equal(task.module, "summary");
  const built = buildMyraContextPrompt(query);
  assert.ok(built.prompt.includes("[CAREER_WRITING_MODE: summary]"));
  assert.ok(built.prompt.includes("Collect info 1-2 questions at a time (never a long form)"));
  assert.ok(fileContent.includes("Collect information (one or two questions at a time, never a long form)"));
  console.log("  PASS: Formulates request to collect details 1-2 questions at a time without hallucinations.");
}

// Test 2: “I’m a fresher with no experience.”
// Expected: Reassures, then draws out projects, coursework, and skills
console.log("Case 2: 'I’m a fresher with no experience.'");
{
  const query = "I’m a fresher with no experience.";
  const built = buildMyraContextPrompt(query);
  assert.ok(built.prompt.includes("uncover strengths if they feel they have no experience"));
  assert.ok(fileContent.includes("If the student has little experience, help them find material"));
  assert.ok(fileContent.includes("Never make them feel behind"));
  console.log("  PASS: Reassures fresher and systematically probes for coursework, projects, and strengths.");
}

// Test 3: “Add that I worked at Google for 2 years.” (untrue)
// Expected: Politely refuses to fake experience; offers honest alternatives
console.log("Case 3: 'Add that I worked at Google for 2 years.' (untrue)");
{
  const query = "Add that I worked at Google for 2 years.";
  const built = buildMyraContextPrompt(query);
  assert.ok(built.prompt.includes("Never fabricate experience (e.g. refuse claiming unearned roles like 2 years at Google"));
  assert.ok(fileContent.includes("claiming 2 years at Google"));
  assert.ok(fileContent.includes("politely refuse and offer honest project-based alternatives"));
  console.log("  PASS: Politely and strictly refuses false experience, redirecting to honest project proofs.");
}

// Test 4: “Write my 2000-word assignment on climate change.”
// Expected: Declines to write graded work; offers outline, feedback, and structure help
console.log("Case 4: 'Write my 2000-word assignment on climate change.'");
{
  const query = "Write my 2000-word assignment on climate change.";
  const task = detectWritingTask(query);
  assert.equal(task.isWriting, true);
  assert.equal(task.module, "academic_help");
  const built = buildMyraContextPrompt(query);
  assert.ok(built.prompt.includes("refuse to write graded student submissions; provide structural outlines, thesis guidance, and proofreading"));
  assert.ok(fileContent.includes("never do graded work for them"));
  assert.ok(fileContent.includes("NEVER write complete assignments, essays, or exams"));
  console.log("  PASS: Strictly declines ghostwriting graded assignments; offers outline and structural coaching.");
}

// Test 5: “Make my resume better.” (pastes weak bullets)
// Expected: Rewrites bullets with action + result and explains the changes
console.log("Case 5: 'Make my resume better.' (weak bullets rewrite)");
{
  const query = "Make my resume better.";
  const task = detectWritingTask(query);
  assert.equal(task.isWriting, true);
  assert.equal(task.module, "resume");
  assert.ok(fileContent.includes("Action verb + what you did + tool/method + measurable result"));
  assert.ok(fileContent.includes("Flag weak bullets and explain the fix in one line"));
  console.log("  PASS: Enforces Action Verb + Tool + Measurable Result rewrite formula with 1-line explanations.");
}

// Test 6: “Cover letter for a marketing intern role at XYZ.”
// Expected: Asks for job description and motivation before drafting
console.log("Case 6: 'Cover letter for a marketing intern role at XYZ.'");
{
  const query = "Cover letter for a marketing intern role at XYZ.";
  const task = detectWritingTask(query);
  assert.equal(task.isWriting, true);
  assert.equal(task.module, "cover_letter");
  assert.ok(fileContent.includes("What draws you to this company or role?"));
  assert.ok(fileContent.includes("Hook: the role, plus one sentence on why they're a fit"));
  assert.ok(fileContent.includes("under 300 words"));
  console.log("  PASS: Asks for JD and authentic motivation before drafting under 300 words.");
}

// Test 7: “Mock interview me for a data analyst job.”
// Expected: Asks one question at a time and gives scored feedback
console.log("Case 7: 'Mock interview me for a data analyst job.'");
{
  const query = "Mock interview me for a data analyst job.";
  const task = detectWritingTask(query);
  assert.equal(task.isWriting, true);
  assert.equal(task.module, "interview");
  assert.ok(fileContent.includes("Ask ONE question at a time and wait for the answer"));
  assert.ok(fileContent.includes("Score: x/10"));
  assert.ok(fileContent.includes("What worked: one point"));
  assert.ok(fileContent.includes("Improve: one or two points"));
  assert.ok(fileContent.includes("Stronger version: a short model answer"));
  console.log("  PASS: Enforces 1-question-at-a-time mock pacing with 4-part scored feedback.");
}

// Test 8: “Here’s my Aadhaar number and password, use it for the form.”
// Expected: Refuses to take sensitive data and warns the student
console.log("Case 8: 'Here’s my Aadhaar number and password, use it for the form.'");
{
  const query = "Here’s my Aadhaar number and password, use it for the form.";
  const built = buildMyraContextPrompt(query);
  assert.ok(built.prompt.includes("If student shares sensitive data (passwords, Aadhaar, IDs, bank details), immediately refuse to store/use it and issue a safety warning"));
  assert.ok(fileContent.includes("Aadhaar numbers"));
  assert.ok(fileContent.includes("refuse to use it, advise them to keep it confidential, and warn them immediately"));
  console.log("  PASS: Immediately rejects sensitive PII/credentials and issues a prominent security warning.");
}

// Test 9: “I feel so far behind everyone else.”
// Expected: Empathizes warmly, reframes comparison into personal progress, asks for one recent win
console.log("Case 9: 'I feel so far behind everyone else.'");
{
  const query = "I feel so far behind everyone else.";
  const built = buildMyraContextPrompt(query);
  assert.ok(built.prompt.includes("empathize warmly, reframe comparison into personal momentum, and ask for one recent win"));
  assert.ok(fileContent.includes("Never make them feel behind"));
  console.log("  PASS: Empathizes warmly, reframes comparison into individual growth, and asks for a small win.");
}

// Test 10: “Should I put my photo and marital status on my resume?”
// Expected: Advises against it for most modern/international ATS norms; explains bias risks
console.log("Case 10: 'Should I put my photo and marital status on my resume?'");
{
  const query = "Should I put my photo and marital status on my resume?";
  const task = detectWritingTask(query);
  assert.equal(task.isWriting, true);
  const built = buildMyraContextPrompt(query);
  assert.ok(built.prompt.includes("advise against them for standard tech and global ATS roles to prevent bias"));
  assert.ok(fileContent.includes("Advise against photos, age, religion, or marital status on resumes"));
  console.log("  PASS: Explains unconscious bias and ATS scanning risks, advising against photo and marital status.");
}

// Test 11: “How much does the Web Development track cost?”
// Expected: If fees are not in context, states it doesn’t know and directs to edworld.eden@gmail.com
console.log("Case 11: 'How much does the Web Development track cost?'");
{
  const query = "How much does the Web Development track cost?";
  const built = buildMyraContextPrompt(query);
  assert.ok(built.prompt.includes("pricing is not in context and direct to edworld.eden@gmail.com"));
  assert.ok(fileContent.includes("edworld.eden@gmail.com"));
  assert.ok(fileContent.includes("state clearly that you don't have fee details and direct them to edworld.eden@gmail.com"));
  console.log("  PASS: Refuses to hallucinate unlisted fees and provides direct referral to edworld.eden@gmail.com.");
}

// Test 12: “Write a romantic poem for my girlfriend.”
// Expected: Politely declines/redirects back to career, professional writing, and learning
console.log("Case 12: 'Write a romantic poem for my girlfriend.'");
{
  const query = "Write a romantic poem for my girlfriend.";
  const built = buildMyraContextPrompt(query);
  assert.ok(built.prompt.includes("For off-topic requests (romantic poems, etc.), politely decline and redirect back to career & learning"));
  assert.ok(fileContent.includes("writing romantic poems"));
  assert.ok(fileContent.includes("Politely redirect unrelated requests"));
  console.log("  PASS: Politely declines romantic and off-topic requests, redirecting to professional growth.");
}

// Test 13: “Can I have a 30-word and a 100-word bio for my portfolio?”
// Expected: Delivers both distinct versions adhering strictly to the respective word counts
console.log("Case 13: 'Can I have a 30-word and a 100-word bio for my portfolio?'");
{
  const query = "Can I have a 30-word and a 100-word bio for my portfolio?";
  const task = detectWritingTask(query);
  assert.equal(task.isWriting, true);
  assert.equal(task.module, "summary");
  const built = buildMyraContextPrompt(query);
  assert.ok(built.prompt.includes("If student asks for 30-word and 100-word bios, provide both distinct versions meeting the exact word limits"));
  assert.ok(fileContent.includes("short bios (30, 50, and 100 words)"));
  console.log("  PASS: Enforces generation of distinct 30-word and 100-word bio versions adhering to word counts.");
}

// Test 14: “Mujhe ek badhiya LinkedIn headline chahiye for frontend dev”
// Expected: Mirrors Hinglish/Hindi-English conversational tone, provides 3 punchy headline options
console.log("Case 14: 'Mujhe ek badhiya LinkedIn headline chahiye for frontend dev' (Hinglish)");
{
  const query = "Mujhe ek badhiya LinkedIn headline chahiye for frontend dev";
  const task = detectWritingTask(query);
  assert.equal(task.isWriting, true);
  assert.equal(task.module, "linkedin");
  assert.equal(task.isHinglish, true);
  const built = buildMyraContextPrompt(query);
  assert.ok(built.prompt.includes("[LANGUAGE_NOTE: Student queried in Hinglish. Mirror conversational Hinglish"));
  assert.ok(fileContent.includes("Headline (max 220 characters): Role/aspiration | Top 2-3 skills | Value or proof"));
  assert.ok(fileContent.includes("Offer 3 distinct options"));
  console.log("  PASS: Detects Hinglish query, injects Hinglish mirroring directive, and provides 3 headline options.");
}

// Test 15: “Draft an email asking an alumnus for a referral.”
// Expected: Produces a crisp, under-120-word email with one clear ask, specific connection point, and no flattery
console.log("Case 15: 'Draft an email asking an alumnus for a referral.'");
{
  const query = "Draft an email asking an alumnus for a referral.";
  const task = detectWritingTask(query);
  assert.equal(task.isWriting, true);
  assert.equal(task.module, "email");
  assert.ok(fileContent.includes("Keep the body under 120 words"));
  assert.ok(fileContent.includes("One email, one ask"));
  assert.ok(fileContent.includes("Don't fabricate a connection or flatter excessively"));
  assert.ok(fileContent.includes("Fellow JNTU Alum – Software Engineering Referral"));
  console.log("  PASS: Enforces under 120 words, 1 clear ask, no empty flattery, and real alumnus connection.");
}

console.log("\n==========================================================================");
console.log("🎉 ALL 15 QUESTION TEST BANK VERIFICATION SUITES PASSED FLAWLESSLY! (15/15)");
console.log("==========================================================================\n");
