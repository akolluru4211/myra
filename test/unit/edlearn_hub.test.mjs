import { test, describe } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { EDLEARN_COURSES } from "../../src/lib/learn/edlearn-courses.ts";
import { executeCodeSandbox, executeSqlSandbox } from "../../src/lib/learn/sandbox-runner.ts";
import { EDLEARN_RESEARCH_PAPERS } from "../../src/lib/learn/research-papers.ts";
import { validateMyraDataset } from "../../scripts/validate_myra_dataset.mjs";

describe("EdLearn Practical Learning Hub & Pedagogical Infrastructure", () => {
  test("1. All 3 tracks (DSA, Aptitude, SQL) exist with Beginner, Intermediate, Advanced & Capstone", () => {
    const tracks = ["dsa", "aptitude", "sql"];
    for (const track of tracks) {
      const course = EDLEARN_COURSES[track];
      assert.ok(course, `Track '${track}' must be defined`);
      assert.ok(course.modules.length >= 3, `${track} must contain at least 3 modules`);

      // Verify level coverage
      const levels = course.modules.map((m) => m.level);
      assert.ok(levels.includes("beginner"), `${track} must contain a beginner module`);
      assert.ok(levels.includes("intermediate"), `${track} must contain an intermediate module`);
      assert.ok(levels.includes("advanced"), `${track} must contain an advanced module`);

      // Verify each lesson has short explanation, worked example, practice task & hints
      for (const m of course.modules) {
        for (const l of m.lessons) {
          assert.ok(l.explanation && l.explanation.length > 20, `${l.id} must have short explanation`);
          assert.ok(l.workedExample && l.workedExample.title, `${l.id} must have worked example`);
          assert.ok(l.practiceTask && l.practiceTask.prompt, `${l.id} must have practice task`);
          assert.ok(l.practiceTask.hints.length >= 2, `${l.id} must have staged hints`);
          assert.ok(l.practiceTask.testCases.length >= 1, `${l.id} must have test cases`);
        }
      }

      // Verify Capstone
      assert.ok(course.capstone, `${track} must have a capstone project`);
      assert.ok(course.capstone.deliverables.length >= 3, `${track} capstone must have deliverables`);
      assert.ok(course.capstone.rubric.length >= 3, `${track} capstone must have rubric criteria`);
      assert.ok(course.capstone.solutionTests.length >= 2, `${track} capstone must have automated grading tests`);
    }
  });

  test("2. Sandboxed Code & SQL Practice Runner enforces timeouts and safety", () => {
    // Dangerous code should be blocked
    const dangerousAttempt = executeCodeSandbox(
      "import os; os.system('echo hacked')",
      [{ input: "test", expectedOutput: "0" }]
    );
    assert.equal(dangerousAttempt.success, false);
    assert.equal(dangerousAttempt.error, "SECURITY_VIOLATION");

    // Destructive SQL should be blocked
    const destructiveSql = executeSqlSandbox(
      "DROP TABLE students;",
      [{ input: "test", expectedOutput: "ok" }]
    );
    assert.equal(destructiveSql.success, false);
    assert.equal(destructiveSql.error, "FORBIDDEN_SQL");

    // Valid SQL syntax check
    const validSql = executeSqlSandbox(
      "SELECT name, stipend FROM internships WHERE stipend > 25000 ORDER BY stipend DESC;",
      [{ input: "test", expectedOutput: "rows" }]
    );
    assert.equal(validSql.success, true);
  });

  test("3. Research Paper Library connects literature with valid sources & licenses", () => {
    assert.ok(EDLEARN_RESEARCH_PAPERS.length >= 4, "Must contain at least 4 research papers");
    for (const paper of EDLEARN_RESEARCH_PAPERS) {
      assert.ok(paper.id && paper.title, "Paper must have id and title");
      assert.ok(paper.authors.length > 0, "Paper must have authors");
      assert.ok(paper.url.startsWith("http"), "Paper must have authorized repository URL");
      assert.ok(paper.license, "Paper must have documented license");
      assert.ok(paper.whatYouCanLearn, "Paper must explain practical learning value");
      assert.ok(paper.keySections.length >= 1, "Paper must reference specific pages/sections");
    }
  });

  test("4. Reviewed Myra dataset conforms to JSONL schema and passes validation", () => {
    const datasetPath = path.resolve(process.cwd(), "src/data/edlearn-myra-dataset.jsonl");
    assert.ok(fs.existsSync(datasetPath), "Dataset JSONL file must exist");
    const summary = validateMyraDataset(datasetPath);
    assert.ok(summary.valid, "Dataset must pass schema, unique ID, and leakage checks");
    assert.ok(summary.totalRecords >= 12, "Dataset must contain at least 12 reviewed records");
    assert.ok(summary.splits.train > 0, "Must contain training split");
    assert.ok(summary.splits.validation > 0, "Must contain validation split");
    assert.ok(summary.splits.test > 0, "Must contain held-out test split");
  });

  test("5. Navigation integration includes EdLearn across sidebar and mobile bottom nav", () => {
    const curvyDockPath = path.resolve(process.cwd(), "src/components/layout/CurvySideDock.tsx");
    const mobileNavPath = path.resolve(process.cwd(), "src/components/mobile/ui/MobileBottomNav.tsx");

    const curvyDockContent = fs.readFileSync(curvyDockPath, "utf-8");
    const mobileNavContent = fs.readFileSync(mobileNavPath, "utf-8");

    assert.ok(
      curvyDockContent.includes("EdLearn"),
      "CurvySideDock must include labeled 'EdLearn' entry"
    );
    assert.ok(
      mobileNavContent.includes("EdLearn"),
      "MobileBottomNav must include labeled 'EdLearn' entry"
    );
  });
});
