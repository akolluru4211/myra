import { describe, it } from "node:test";
import assert from "node:assert";
import fs from "node:fs";
import path from "node:path";
import { MyraRagRetriever } from "../../src/lib/ai/myra-rag.ts";
import { buildMyraContextPrompt } from "../../src/lib/ai/myra-agent.ts";

describe("Myra AI - End-to-End Student Flow & Quality Verification", () => {
  it("preserves conversation history across multi-turn exchanges", () => {
    const history = [
      { role: "user", content: "I want to prepare for full-stack software engineering." },
      { role: "assistant", content: "Great! Let's start with foundational JavaScript and Next.js." }
    ];
    const { systemPrompt, prompt } = buildMyraContextPrompt(
      "Can you give me a 3-month roadmap for that?",
      { careerStage: "STUDENT", targetRole: "Full-Stack Engineer" },
      history
    );

    assert.ok(systemPrompt.includes("RECENT CONVERSATION HISTORY"));
    assert.ok(systemPrompt.includes("I want to prepare for full-stack software engineering"));
    assert.ok(prompt.includes("User Question: Can you give me a 3-month roadmap for that?"));
  });

  it("actively injects student grade level, goals, and guidance directives into prompt", () => {
    const { prompt } = buildMyraContextPrompt(
      "Explain quadratic equations",
      { gradeLevel: "Class 10", targetRole: "Engineering Student", dailyStudyHours: 3 }
    );

    assert.ok(prompt.includes("Actively leverage the student's grade level"));
    assert.ok(prompt.includes("If critical context is missing"));
    assert.ok(prompt.includes("Adapt the teaching mode directly to what the student asks for"));
  });

  it("retrieves relevant knowledge chunks from newly built retrieval index", () => {
    const chunks = MyraRagRetriever.loadChunks();
    assert.ok(chunks.length > 0, "Chunks index must not be empty");

    const searchResults = MyraRagRetriever.search("Fundamental Theorem Arithmetic", 3);
    assert.ok(searchResults.length > 0, "Must retrieve relevant math syllabus chunks");
    const foundMath = searchResults.some(c => 
      c.title.toLowerCase().includes("math") || 
      c.text.toLowerCase().includes("prime") ||
      c.text.toLowerCase().includes("fundamental theorem")
    );
    assert.ok(foundMath, "Must find syllabus matches for math query");
  });

  it("verified dataset v2 files exist, are non-empty, and strictly separated", () => {
    const trainPath = path.join(process.cwd(), "myra-ai", "data", "dataset_v2", "train.jsonl");
    const valPath = path.join(process.cwd(), "myra-ai", "data", "dataset_v2", "val.jsonl");
    const testPath = path.join(process.cwd(), "myra-ai", "data", "dataset_v2", "test_held_out.jsonl");

    assert.ok(fs.existsSync(trainPath), "train.jsonl must exist");
    assert.ok(fs.existsSync(valPath), "val.jsonl must exist");
    assert.ok(fs.existsSync(testPath), "test_held_out.jsonl must exist");

    const trainLines = fs.readFileSync(trainPath, "utf-8").trim().split("\n");
    const valLines = fs.readFileSync(valPath, "utf-8").trim().split("\n");
    const testLines = fs.readFileSync(testPath, "utf-8").trim().split("\n");

    assert.ok(trainLines.length >= 100, "Train split should have at least 100 entries");
    assert.ok(valLines.length >= 4, "Validation split should have at least 4 entries");
    assert.ok(testLines.length >= 6, "Test split should have at least 6 entries");

    // Zero overlap check
    const trainQs = new Set(trainLines.map(l => JSON.parse(l).messages[1].content.toLowerCase().trim()));
    const testQs = new Set(testLines.map(l => JSON.parse(l).messages[1].content.toLowerCase().trim()));
    for (const q of testQs) {
      assert.strictEqual(trainQs.has(q), false, `Test question '${q}' should not exist in train split`);
    }
  });
});
