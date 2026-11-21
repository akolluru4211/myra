/**
 * Unit Test Suite: Career Roadmap Generator
 * Target Module: src/lib/career/roadmap-generator.ts
 *
 * Verifies:
 * 1. TARGET_ROLE_OPTIONS contents, array properties, length constraints, and career path diversity.
 * 2. RoadmapMilestone & CareerRoadmapData comprehensive schema validation.
 * 3. Milestone horizon categorization (1_year, 3_year, 5_year), month index ordering, and range labels.
 * 4. Curated roadmap data defaults, fallback generation resilience, and resource URL formats.
 * 5. toggleRoadmapMilestone input handling, parameter boundary checks, and DB error resilience.
 * 6. getActiveCareerRoadmap query handling, empty/missing user handling, and SQL injection safety.
 */

const { describe, it } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const Module = require("node:module");
const ts = require("typescript");

// Register on-the-fly TypeScript compilation hook for authentic source execution
if (!require.extensions[".ts"]) {
  require.extensions[".ts"] = function (module, filename) {
    const content = fs.readFileSync(filename, "utf8");
    const compiled = ts.transpileModule(content, {
      compilerOptions: {
        module: ts.ModuleKind.CommonJS,
        target: ts.ScriptTarget.ES2022,
        esModuleInterop: true,
      },
    }).outputText;
    module._compile(compiled, filename);
  };
}

// Intercept '@/lib/...' alias to point to 'src/lib/...'
const origResolve = Module._resolveFilename;
if (!Module.__tsPathAliasHooked) {
  Module._resolveFilename = function (request, parent, isMain, options) {
    if (request.startsWith("@/")) {
      const mapped = path.resolve(process.cwd(), "src", request.slice(2));
      return origResolve.call(this, mapped, parent, isMain, options);
    }
    return origResolve.call(this, request, parent, isMain, options);
  };
  Module.__tsPathAliasHooked = true;
}

// Authentically load the target module
const {
  TARGET_ROLE_OPTIONS,
  generateCareerRoadmap,
  getActiveCareerRoadmap,
  toggleRoadmapMilestone,
} = require("../../src/lib/career/roadmap-generator.ts");

describe("Career Roadmap Generator Unit Tests (src/lib/career/roadmap-generator.ts)", () => {
  // --------------------------------------------------------------------------
  // 1. TARGET_ROLE_OPTIONS
  // --------------------------------------------------------------------------
  describe("1. TARGET_ROLE_OPTIONS Validation", () => {
    it("should export TARGET_ROLE_OPTIONS as a non-empty array of strings", () => {
      assert.ok(Array.isArray(TARGET_ROLE_OPTIONS), "TARGET_ROLE_OPTIONS must be an array");
      assert.ok(TARGET_ROLE_OPTIONS.length >= 7, "TARGET_ROLE_OPTIONS must contain at least 7 career tracks");
      for (const role of TARGET_ROLE_OPTIONS) {
        assert.strictEqual(typeof role, "string", "Each role option must be a string");
        assert.ok(role.trim().length > 10, `Role '${role}' must be descriptive (> 10 characters)`);
      }
    });

    it("should contain unique roles with zero duplicates", () => {
      const uniqueRoles = new Set(TARGET_ROLE_OPTIONS);
      assert.strictEqual(
        uniqueRoles.size,
        TARGET_ROLE_OPTIONS.length,
        "TARGET_ROLE_OPTIONS must contain no duplicate role names"
      );
    });

    it("should include standard flagship engineering career paths", () => {
      const expectedPaths = [
        "Cloud Native DevOps & Platform Engineer",
        "Full-Stack Web Architect (TypeScript/Next.js/Postgres)",
        "Backend & Distributed Systems Engineer (Go/Java)",
        "AI & Large Language Model Application Engineer",
        "Data Engineer & Real-Time Analytics Specialist",
        "Cybersecurity & Cloud Security Engineer",
        "Product Engineering & Technical Founder Track",
      ];

      for (const pathName of expectedPaths) {
        assert.ok(
          TARGET_ROLE_OPTIONS.includes(pathName),
          `TARGET_ROLE_OPTIONS must include '${pathName}'`
        );
      }
    });
  });

  // --------------------------------------------------------------------------
  // 2. CareerRoadmapData & RoadmapMilestone Schema Validation
  // --------------------------------------------------------------------------
  describe("2. CareerRoadmapData & RoadmapMilestone Schema Validation", () => {
    it("should return a fully-formed CareerRoadmapData object adhering to the schema", async () => {
      const testUserId = "user_schema_test_01";
      const testRole = TARGET_ROLE_OPTIONS[1]; // Full-Stack Web Architect

      const roadmap = await generateCareerRoadmap({
        userId: testUserId,
        targetRole: testRole,
        currentLevel: "Intermediate",
        academicYear: "Final Year",
      });

      // Verify Top-Level Structure
      assert.ok(roadmap, "Roadmap result must be truthy");
      assert.strictEqual(typeof roadmap.id, "string", "Roadmap id must be a string");
      assert.ok(roadmap.id.length > 0, "Roadmap id must not be empty");
      assert.strictEqual(roadmap.userId, testUserId, "Roadmap userId must match input");
      assert.strictEqual(roadmap.targetRole, testRole, "Roadmap targetRole must match input");
      assert.strictEqual(roadmap.currentLevel, "Intermediate", "Roadmap currentLevel must match input");
      assert.strictEqual(typeof roadmap.summary, "string", "Roadmap summary must be a string");
      assert.ok(roadmap.summary.length >= 20, "Roadmap summary must be descriptive");

      // Verify generatedAt ISO date
      assert.strictEqual(typeof roadmap.generatedAt, "string", "generatedAt must be a string");
      const parsedDate = new Date(roadmap.generatedAt);
      assert.ok(!isNaN(parsedDate.getTime()), "generatedAt must be a valid ISO date timestamp");

      // Verify Milestones Array
      assert.ok(Array.isArray(roadmap.milestones), "roadmap.milestones must be an array");
      assert.ok(roadmap.milestones.length >= 11, "Roadmap must contain at least 11 total milestones");
    });

    it("should validate every RoadmapMilestone against strict field constraints", async () => {
      const roadmap = await generateCareerRoadmap({
        userId: "user_milestone_schema_02",
        targetRole: TARGET_ROLE_OPTIONS[0],
      });

      const validHorizons = new Set(["1_year", "3_year", "5_year"]);

      roadmap.milestones.forEach((m, index) => {
        // Milestone ID
        assert.strictEqual(typeof m.id, "string", `Milestone [${index}] id must be a string`);
        assert.ok(m.id.length > 0, `Milestone [${index}] id must not be empty`);

        // Horizon
        assert.ok(
          validHorizons.has(m.horizon),
          `Milestone [${index}] horizon '${m.horizon}' must be one of 1_year, 3_year, 5_year`
        );

        // Month Index
        assert.strictEqual(typeof m.monthIndex, "number", `Milestone [${index}] monthIndex must be a number`);
        assert.ok(m.monthIndex > 0, `Milestone [${index}] monthIndex must be positive`);

        // Month Range Label
        assert.strictEqual(typeof m.monthRangeLabel, "string", `Milestone [${index}] monthRangeLabel must be a string`);
        assert.ok(m.monthRangeLabel.length > 0, `Milestone [${index}] monthRangeLabel must not be empty`);

        // Title and Description
        assert.strictEqual(typeof m.title, "string", `Milestone [${index}] title must be a string`);
        assert.ok(m.title.length > 3, `Milestone [${index}] title must be descriptive`);
        assert.strictEqual(typeof m.description, "string", `Milestone [${index}] description must be a string`);
        assert.ok(m.description.length > 10, `Milestone [${index}] description must be substantive`);

        // Skill Tags
        assert.ok(Array.isArray(m.skillTags), `Milestone [${index}] skillTags must be an array`);
        assert.ok(m.skillTags.length >= 1, `Milestone [${index}] must have at least 1 skill tag`);
        m.skillTags.forEach((tag) => {
          assert.strictEqual(typeof tag, "string", `Skill tag must be a string`);
          assert.ok(tag.length > 0, `Skill tag must not be empty`);
        });

        // Recommended Resource
        if (m.recommendedResource) {
          assert.strictEqual(
            typeof m.recommendedResource.title,
            "string",
            `Milestone [${index}] recommendedResource.title must be string`
          );
          assert.strictEqual(
            typeof m.recommendedResource.href,
            "string",
            `Milestone [${index}] recommendedResource.href must be string`
          );
          assert.ok(
            m.recommendedResource.href.startsWith("/"),
            `Milestone [${index}] resource href '${m.recommendedResource.href}' must be a root-relative path starting with '/'`
          );
        }

        // Completion status
        assert.strictEqual(typeof m.isCompleted, "boolean", `Milestone [${index}] isCompleted must be boolean`);
        assert.strictEqual(m.isCompleted, false, `Milestone [${index}] isCompleted must initially be false`);
      });
    });
  });

  // --------------------------------------------------------------------------
  // 3. Milestone Horizons & Ordering
  // --------------------------------------------------------------------------
  describe("3. Milestone Horizons, Month Index Ordering & Range Labels", () => {
    it("should partition milestones into 1_year (6), 3_year (3), and 5_year (2) groupings", async () => {
      const roadmap = await generateCareerRoadmap({
        userId: "user_horizon_test_03",
        targetRole: TARGET_ROLE_OPTIONS[2],
      });

      const year1Milestones = roadmap.milestones.filter((m) => m.horizon === "1_year");
      const year3Milestones = roadmap.milestones.filter((m) => m.horizon === "3_year");
      const year5Milestones = roadmap.milestones.filter((m) => m.horizon === "5_year");

      assert.strictEqual(year1Milestones.length, 6, "1_year horizon must contain exactly 6 milestones");
      assert.strictEqual(year3Milestones.length, 3, "3_year horizon must contain exactly 3 milestones");
      assert.strictEqual(year5Milestones.length, 2, "5_year horizon must contain exactly 2 milestones");
      assert.strictEqual(
        year1Milestones.length + year3Milestones.length + year5Milestones.length,
        roadmap.milestones.length,
        "Total milestones must equal sum of horizon partitions"
      );
    });

    it("should maintain strictly ascending monthIndex ordering throughout the roadmap", async () => {
      const roadmap = await generateCareerRoadmap({
        userId: "user_ordering_test_04",
        targetRole: TARGET_ROLE_OPTIONS[3],
      });

      for (let i = 1; i < roadmap.milestones.length; i++) {
        const prev = roadmap.milestones[i - 1];
        const curr = roadmap.milestones[i];
        assert.ok(
          curr.monthIndex > prev.monthIndex,
          `Milestones must be ordered by monthIndex: index ${i} (${curr.monthIndex}) should be > index ${i - 1} (${prev.monthIndex})`
        );
      }
    });

    it("should adhere to canonical month boundaries per horizon", async () => {
      const roadmap = await generateCareerRoadmap({
        userId: "user_boundaries_test_05",
        targetRole: TARGET_ROLE_OPTIONS[4],
      });

      // 1_year horizon: month indices must be <= 12
      const year1 = roadmap.milestones.filter((m) => m.horizon === "1_year");
      year1.forEach((m) => {
        assert.ok(m.monthIndex >= 1 && m.monthIndex <= 12, `1_year milestone monthIndex ${m.monthIndex} must be in [1, 12]`);
      });

      // 3_year horizon: month indices must be between 13 and 36
      const year3 = roadmap.milestones.filter((m) => m.horizon === "3_year");
      year3.forEach((m) => {
        assert.ok(m.monthIndex > 12 && m.monthIndex <= 36, `3_year milestone monthIndex ${m.monthIndex} must be in (12, 36]`);
      });

      // 5_year horizon: month indices must be between 37 and 60
      const year5 = roadmap.milestones.filter((m) => m.horizon === "5_year");
      year5.forEach((m) => {
        assert.ok(m.monthIndex > 36 && m.monthIndex <= 60, `5_year milestone monthIndex ${m.monthIndex} must be in (36, 60]`);
      });
    });

    it("should verify accurate monthRangeLabel semantics across horizons", async () => {
      const roadmap = await generateCareerRoadmap({
        userId: "user_labels_test_06",
        targetRole: TARGET_ROLE_OPTIONS[5],
      });

      const year1Labels = roadmap.milestones.filter((m) => m.horizon === "1_year").map((m) => m.monthRangeLabel);
      assert.deepStrictEqual(year1Labels, [
        "Months 1 - 2",
        "Months 3 - 4",
        "Months 5 - 6",
        "Months 7 - 8",
        "Months 9 - 10",
        "Months 11 - 12",
      ]);

      const year3Labels = roadmap.milestones.filter((m) => m.horizon === "3_year").map((m) => m.monthRangeLabel);
      assert.deepStrictEqual(year3Labels, ["Year 2: Q1 - Q2", "Year 2: Q3 - Q4", "Year 3"]);

      const year5Labels = roadmap.milestones.filter((m) => m.horizon === "5_year").map((m) => m.monthRangeLabel);
      assert.deepStrictEqual(year5Labels, ["Year 4", "Year 5"]);
    });
  });

  // --------------------------------------------------------------------------
  // 4. Curated Defaults & Resource URL Formats
  // --------------------------------------------------------------------------
  describe("4. Curated Roadmap Data Defaults & Resource URL Formats", () => {
    it("should apply default parameters when currentLevel or academicYear are omitted", async () => {
      const roadmap = await generateCareerRoadmap({
        userId: "user_defaults_test_07",
        targetRole: TARGET_ROLE_OPTIONS[0],
      });

      assert.strictEqual(roadmap.currentLevel, "Foundational", "Default currentLevel must be 'Foundational'");
      assert.ok(roadmap.summary.includes("battle-tested engineering blueprint"), "Summary must reflect curated default");
    });

    it("should verify recommendedResource links map to valid internal platform modules", async () => {
      const roadmap = await generateCareerRoadmap({
        userId: "user_urls_test_08",
        targetRole: TARGET_ROLE_OPTIONS[1],
      });

      const validModulePrefixes = [
        "/dsa",
        "/learn",
        "/projectstudio",
        "/edbuild",
        "/resumes",
        "/interviews",
        "/projects",
        "/career",
        "/network",
      ];

      roadmap.milestones.forEach((m) => {
        if (m.recommendedResource) {
          const href = m.recommendedResource.href;
          const isValidPrefix = validModulePrefixes.some((p) => href.startsWith(p));
          assert.ok(
            isValidPrefix,
            `Recommended resource href '${href}' for milestone '${m.title}' must link to a valid platform route`
          );
        }
      });
    });

    it("should verify specialized DSA and Career routes in curated milestones", async () => {
      const roadmap = await generateCareerRoadmap({
        userId: "user_routes_test_09",
        targetRole: TARGET_ROLE_OPTIONS[0],
      });

      const dsaMilestone = roadmap.milestones.find((m) => m.recommendedResource?.href === "/dsa");
      assert.ok(dsaMilestone, "Must include a milestone recommending '/dsa' studio");
      assert.strictEqual(dsaMilestone.recommendedResource?.title, "DSA Studio & Arena");

      const careerMilestone = roadmap.milestones.find((m) => m.recommendedResource?.href === "/career");
      assert.ok(careerMilestone, "Must include a milestone recommending '/career' module");
      assert.strictEqual(careerMilestone.recommendedResource?.title, "Career OS");
    });
  });

  // --------------------------------------------------------------------------
  // 5. toggleRoadmapMilestone Input Handling & Error Resiliency
  // --------------------------------------------------------------------------
  describe("5. toggleRoadmapMilestone Input Handling & Error Resiliency", () => {
    it("should return false when toggling with an invalid non-UUID milestoneId without crashing", async () => {
      const result = await toggleRoadmapMilestone({
        milestoneId: "invalid_id_not_uuid",
        isCompleted: true,
        userId: "user_toggle_01",
      });

      assert.strictEqual(typeof result, "boolean", "toggleRoadmapMilestone must return a boolean");
      assert.strictEqual(result, false, "Invalid milestone ID must return false");
    });

    it("should handle empty or whitespace milestoneId gracefully", async () => {
      const result = await toggleRoadmapMilestone({
        milestoneId: "",
        isCompleted: true,
        userId: "user_toggle_02",
      });

      assert.strictEqual(result, false, "Empty milestoneId must return false without throwing");
    });

    it("should handle non-existent UUIDs without throwing unhandled exceptions", async () => {
      const nonExistentUuid = "00000000-0000-0000-0000-000000000000";
      const result = await toggleRoadmapMilestone({
        milestoneId: nonExistentUuid,
        isCompleted: false,
        userId: "user_toggle_03",
      });

      // Even if row does not exist, DB call returns cleanly without throwing
      assert.strictEqual(typeof result, "boolean");
    });

    it("should safely handle toggling isCompleted between true and false states", async () => {
      const id = "00000000-0000-0000-0000-111111111111";
      const resTrue = await toggleRoadmapMilestone({ milestoneId: id, isCompleted: true, userId: "u1" });
      const resFalse = await toggleRoadmapMilestone({ milestoneId: id, isCompleted: false, userId: "u1" });

      assert.strictEqual(typeof resTrue, "boolean");
      assert.strictEqual(typeof resFalse, "boolean");
    });
  });

  // --------------------------------------------------------------------------
  // 6. getActiveCareerRoadmap Query Handling & Null Safety
  // --------------------------------------------------------------------------
  describe("6. getActiveCareerRoadmap Query Handling & Null Safety", () => {
    it("should return null for non-existent users without throwing", async () => {
      const roadmap = await getActiveCareerRoadmap("non_existent_user_999999");
      assert.strictEqual(roadmap, null, "Non-existent user must return null");
    });

    it("should return null safely for empty string userId", async () => {
      const roadmap = await getActiveCareerRoadmap("");
      assert.strictEqual(roadmap, null, "Empty userId must return null without throwing");
    });

    it("should be resilient against SQL injection payloads in userId", async () => {
      const maliciousUserIds = [
        "user' OR '1'='1",
        "user'; DROP TABLE career_roadmaps; --",
        "admin'--",
        "' UNION SELECT * FROM users --",
        "\" OR \"\"=\"",
      ];

      for (const injectionId of maliciousUserIds) {
        const result = await getActiveCareerRoadmap(injectionId);
        assert.strictEqual(result, null, `Malicious userId '${injectionId}' must return null safely`);
      }
    });

    it("should handle special characters and unicode in userId cleanly", async () => {
      const oddIds = [
        "user_🚀_emoji",
        "user_with spaces",
        "user_日本語",
        "user_null_\u0000_char",
      ];

      for (const id of oddIds) {
        const result = await getActiveCareerRoadmap(id);
        assert.strictEqual(result, null, `Odd userId '${id}' must return null safely without throwing`);
      }
    });
  });
});
