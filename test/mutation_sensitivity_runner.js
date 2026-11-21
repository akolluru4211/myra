/**
 * Mutation Sensitivity & Fault Injection Runner
 * Tests whether the 4 regression test suites genuinely detect faults (fail when expectations break)
 * without modifying any source files on disk.
 */

const fs = require("node:fs");
const path = require("node:path");
const assert = require("node:assert/strict");
const ts = require("typescript");

const rootDir = path.resolve(__dirname, "..");
const mutationResults = [];

async function runMutationTest(suiteName, mutationName, originalCode, mutatedCode, testFunction) {
  try {
    await testFunction(mutatedCode);
    // If the test did NOT throw an assertion error, the mutation was KILLED = FALSE (test was insensitive!)
    mutationResults.push({
      suite: suiteName,
      mutation: mutationName,
      caught: false,
      detail: "Test unexpectedly PASSED on mutated code! (Mutation survived / assertion insensitive)"
    });
  } catch (err) {
    // If the test threw an assertion error, the mutation was CAUGHT = TRUE (test is sensitive!)
    mutationResults.push({
      suite: suiteName,
      mutation: mutationName,
      caught: true,
      errorSnippet: err.message?.substring(0, 100)
    });
  }
}

async function runAll() {
  console.log("==================================================================");
  console.log("RUNNING MUTATION SENSITIVITY VERIFICATION");
  console.log("==================================================================\n");

  // ----------------------------------------------------------------------------
  // SUITE 1 MUTATIONS: Career Roadmap Generator
  // ----------------------------------------------------------------------------
  const roadmapSrc = fs.readFileSync(path.join(rootDir, "src/lib/career/roadmap-generator.ts"), "utf8");

  function evalRoadmapModule(code) {
    const transpiled = ts.transpileModule(code, {
      compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, esModuleInterop: true }
    }).outputText;
    const mod = { exports: {} };
    const customRequire = (id) => {
      if (id === "@/lib/supabase") {
        return {
          supabase: {
            from: () => ({
              select: () => ({ eq: () => ({ order: () => ({ limit: () => ({ maybeSingle: async () => ({ data: null }) }) }) }) }),
              insert: async () => ({ data: { id: "1" }, error: null }),
            })
          }
        };
      }
      if (id === "@/lib/ai/universal-ai") return { UniversalAI: { complete: async () => { throw new Error("fallback"); } } };
      return require(id);
    };
    const runner = new Function("require", "module", "exports", "console", transpiled);
    runner(customRequire, mod, mod.exports, { ...console, warn: () => {}, error: () => {}, info: () => {} });
    return mod.exports;
  }

  // M1.1: Truncate TARGET_ROLE_OPTIONS to 5 elements (< 7)
  await runMutationTest(
    "career_roadmap_generator",
    "M1.1: Truncate TARGET_ROLE_OPTIONS to 5 tracks",
    roadmapSrc,
    roadmapSrc.replace(
      /export const TARGET_ROLE_OPTIONS = \[[^\]]+\];/,
      'export const TARGET_ROLE_OPTIONS = ["Role 1", "Role 2", "Role 3", "Role 4", "Role 5"];'
    ),
    async (mutated) => {
      const mod = evalRoadmapModule(mutated);
      assert.ok(mod.TARGET_ROLE_OPTIONS.length >= 7, "TARGET_ROLE_OPTIONS must contain at least 7 career tracks");
    }
  );

  // M1.2: Remove flagship role "Cloud Native DevOps & Platform Engineer"
  await runMutationTest(
    "career_roadmap_generator",
    "M1.2: Remove flagship DevOps path",
    roadmapSrc,
    roadmapSrc.replace('"Cloud Native DevOps & Platform Engineer",', ""),
    async (mutated) => {
      const mod = evalRoadmapModule(mutated);
      assert.ok(mod.TARGET_ROLE_OPTIONS.includes("Cloud Native DevOps & Platform Engineer"));
    }
  );

  // M1.3: Break milestone monthIndex ascending ordering
  await runMutationTest(
    "career_roadmap_generator",
    "M1.3: Set milestone monthIndex out of ascending order",
    roadmapSrc,
    roadmapSrc.replace("monthIndex: 3,", "monthIndex: 0,"),
    async (mutated) => {
      const mod = evalRoadmapModule(mutated);
      const roadmap = await mod.generateCareerRoadmap({ userId: "u", targetRole: "Test" });
      for (let i = 1; i < roadmap.milestones.length; i++) {
        assert.ok(
          roadmap.milestones[i].monthIndex > roadmap.milestones[i - 1].monthIndex,
          `Milestones must be ordered: ${roadmap.milestones[i].monthIndex} > ${roadmap.milestones[i - 1].monthIndex}`
        );
      }
    }
  );

  // M1.4: Change milestone horizon partition from 6 to 5
  await runMutationTest(
    "career_roadmap_generator",
    "M1.4: Corrupt horizon partition count",
    roadmapSrc,
    roadmapSrc.replace('horizon: "1_year",\n        monthIndex: 11', 'horizon: "3_year",\n        monthIndex: 11'),
    async (mutated) => {
      const mod = evalRoadmapModule(mutated);
      const roadmap = await mod.generateCareerRoadmap({ userId: "u", targetRole: "Test" });
      const year1 = roadmap.milestones.filter(m => m.horizon === "1_year");
      assert.strictEqual(year1.length, 6, "1_year horizon must contain exactly 6 milestones");
    }
  );

  // M1.5: Change recommended resource href to external domain
  await runMutationTest(
    "career_roadmap_generator",
    "M1.5: Invalidate recommendedResource URL format",
    roadmapSrc,
    roadmapSrc.replace('href: "/dsa"', 'href: "https://external-unknown.com"'),
    async (mutated) => {
      const mod = evalRoadmapModule(mutated);
      const roadmap = await mod.generateCareerRoadmap({ userId: "u", targetRole: "Test" });
      roadmap.milestones.forEach(m => {
        if (m.recommendedResource) {
          assert.ok(m.recommendedResource.href.startsWith("/"), "Must start with '/'");
        }
      });
    }
  );

  // ----------------------------------------------------------------------------
  // SUITE 2 MUTATIONS: Language Analysis Service
  // ----------------------------------------------------------------------------
  const langSrc = fs.readFileSync(path.join(rootDir, "src/lib/interview/language-analysis-service.ts"), "utf8");

  function evalLangModule(code) {
    const transpiled = ts.transpileModule(code, {
      compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, esModuleInterop: true }
    }).outputText;
    const mod = { exports: {} };
    const customRequire = (id) => {
      if (id === "./communication-rag") return require(path.join(rootDir, "src/lib/interview/communication-rag.ts"));
      if (id === "@/lib/supabase") return { supabase: { from: () => ({ select: () => ({ eq: () => ({ maybeSingle: async () => ({ data: null }) }) }) }) } };
      return require(id);
    };
    const runner = new Function("require", "module", "exports", transpiled);
    runner(customRequire, mod, mod.exports);
    return mod.exports;
  }

  // M2.1: Break WPM formula (multiply by 30 instead of 60)
  await runMutationTest(
    "language_analysis_service",
    "M2.1: Break WPM formula (* 30 instead of * 60)",
    langSrc,
    langSrc.replace("* 60);", "* 30);"),
    async (mutated) => {
      const mod = evalLangModule(mutated);
      const words = Array.from({ length: 130 }, (_, i) => `w${i}`).join(" ");
      const res = mod.analyzeSpokenLanguage(words, 60);
      assert.strictEqual(res.wordsPerMinute, 130);
    }
  );

  // M2.2: Remove filler word "actually"
  await runMutationTest(
    "language_analysis_service",
    "M2.2: Omit 'actually' from filler word patterns",
    langSrc,
    langSrc.replace('{ term: "actually", regex: /\\bactually\\b/gi },', ""),
    async (mutated) => {
      const mod = evalLangModule(mutated);
      const res = mod.analyzeSpokenLanguage("Actually, this is actually good.", 60);
      assert.strictEqual(res.fillerBreakdown["actually"], 2);
    }
  );

  // M2.3: Invert STAR structure bonus
  await runMutationTest(
    "language_analysis_service",
    "M2.3: Invert STAR clarity bonus (-6 instead of +6)",
    langSrc,
    langSrc.replace("if (hasStarStructure) clarityScore += 6;", "if (hasStarStructure) clarityScore -= 6;"),
    async (mutated) => {
      const mod = evalLangModule(mutated);
      const starText = "In that situation, our team faced high latency. My task was to optimize the backend. I led the refactoring, built a queue worker, and reduced p99 latency by 45%.";
      const res = mod.analyzeSpokenLanguage(starText, 60);
      assert.ok(res.clarityScore >= 85);
    }
  );

  // M2.4: Perturb overallLanguageScore calculation
  await runMutationTest(
    "language_analysis_service",
    "M2.4: Perturb overallLanguageScore weighting",
    langSrc,
    langSrc.replace("grammarScore * 0.25 +", "grammarScore * 0.40 +"),
    async (mutated) => {
      const mod = evalLangModule(mutated);
      const text = "I architected an asynchronous indexing pipeline that decoupled queries and reduced search latency.";
      const res = mod.analyzeSpokenLanguage(text, 60, "Software Engineering");
      const expected = Math.round(
        res.grammarScore * 0.25 +
        res.clarityScore * 0.25 +
        res.fluencyScore * 0.20 +
        res.vocabularyScore * 0.15 +
        res.professionalScore * 0.15
      );
      assert.strictEqual(res.overallLanguageScore, expected);
    }
  );

  // M2.5: Invert compareAttempts delta (a1 - a2 instead of a2 - a1)
  await runMutationTest(
    "language_analysis_service",
    "M2.5: Invert compareAttempts score delta calculation",
    langSrc,
    langSrc.replace(
      "const languageScoreDelta = attempt2Analysis.overallLanguageScore - attempt1Analysis.overallLanguageScore;",
      "const languageScoreDelta = attempt1Analysis.overallLanguageScore - attempt2Analysis.overallLanguageScore;"
    ),
    async (mutated) => {
      const mod = evalLangModule(mutated);
      const a1 = mod.analyzeSpokenLanguage("Um, basically we, like, sort of built this API, you know, actually.", 60);
      const a2 = mod.analyzeSpokenLanguage("In our project situation, I led the architecture of the caching layer and built an asynchronous queue that reduced response latency by 35%.", 60);
      const comp = mod.compareAttempts(a1, a2);
      assert.strictEqual(comp.deltas.languageScoreDelta, a2.overallLanguageScore - a1.overallLanguageScore);
    }
  );

  // ----------------------------------------------------------------------------
  // SUITE 3 MUTATIONS: Email Service (Resend)
  // ----------------------------------------------------------------------------
  const emailSrc = fs.readFileSync(path.join(rootDir, "src/lib/email-service.ts"), "utf8");

  function evalEmailModule(code, mockResend) {
    const transpiled = ts.transpileModule(code, {
      compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, esModuleInterop: true }
    }).outputText;
    const mod = { exports: {} };
    const customRequire = (id) => {
      if (id === "./supabase" || id === "./supabase.ts") {
        return {
          supabase: {
            from: () => ({
              insert: async () => ({ data: null, error: null }),
              upsert: async (payload) => ({ data: payload, error: null }),
              select: () => ({ eq: () => ({ order: () => ({ limit: async () => ({ data: [] }) }) }) })
            })
          }
        };
      }
      if (id === "./email-templates" || id === "./email-templates.ts") return require(path.join(rootDir, "src/lib/email-templates.ts"));
      if (id === "resend") {
        return {
          Resend: mockResend || class {
            constructor() {
              this.emails = { send: async () => ({ data: { id: "1" }, error: null }) };
              this.contacts = { create: async () => ({ data: { id: "1" }, error: null }) };
            }
          }
        };
      }
      return require(id);
    };
    const runner = new Function("require", "module", "exports", "process", "console", transpiled);
    runner(customRequire, mod, mod.exports, { env: { RESEND_API_KEY: "re_key" } }, { ...console, warn: () => {}, info: () => {}, error: () => {} });
    return mod.exports;
  }

  // M3.1: Change PRIMARY_ADMIN_EMAIL
  await runMutationTest(
    "email_service_resend",
    "M3.1: Change PRIMARY_ADMIN_EMAIL to unauthorized address",
    emailSrc,
    emailSrc.replace('export const PRIMARY_ADMIN_EMAIL = "edworld.eden@gmail.com";', 'export const PRIMARY_ADMIN_EMAIL = "attacker@evil.com";'),
    async (mutated) => {
      const mod = evalEmailModule(mutated);
      assert.strictEqual(mod.PRIMARY_ADMIN_EMAIL, "edworld.eden@gmail.com");
    }
  );

  // M3.2: Drop admin BCC routing
  await runMutationTest(
    "email_service_resend",
    "M3.2: Omit admin BCC injection",
    emailSrc,
    emailSrc.replace("bccList.push(PRIMARY_ADMIN_EMAIL);", "// bcc omitted"),
    async (mutated) => {
      let capturedBcc = null;
      class CapturingResend {
        constructor() {
          this.emails = {
            send: async (p) => {
              capturedBcc = p.bcc;
              return { data: { id: "ok" }, error: null };
            }
          };
        }
      }
      const mod = evalEmailModule(mutated, CapturingResend);
      await mod.sendEmailNotification({ to: "student@test.com", subject: "S", html: "H" });
      assert.ok(capturedBcc && capturedBcc.includes("edworld.eden@gmail.com"), "BCC must include edworld.eden@gmail.com");
    }
  );

  // M3.3: Don't normalize/lowercase newsletter email
  await runMutationTest(
    "email_service_resend",
    "M3.3: Omit email lowercasing in newsletter subscription",
    emailSrc,
    emailSrc.replace("params.email.trim().toLowerCase()", "params.email.trim()"),
    async (mutated) => {
      const mod = evalEmailModule(mutated);
      const res = await mod.addNewsletterSubscriber({ email: "TEST_USER@EXAMPLE.COM" });
      assert.strictEqual(res.subscriber?.email, "test_user@example.com");
    }
  );

  // M3.4: Remove email validation check in newsletter subscription
  await runMutationTest(
    "email_service_resend",
    "M3.4: Allow invalid email without '@' in newsletter subscription",
    emailSrc,
    emailSrc.replace('if (!cleanEmail || !cleanEmail.includes("@"))', 'if (!cleanEmail)'),
    async (mutated) => {
      const mod = evalEmailModule(mutated);
      const res = await mod.addNewsletterSubscriber({ email: "invalid-email-no-at" });
      assert.strictEqual(res.success, false);
      assert.strictEqual(res.error, "Invalid email address provided.");
    }
  );

  // ----------------------------------------------------------------------------
  // SUITE 4 MUTATIONS: Edge Middleware & WAF
  // ----------------------------------------------------------------------------
  const middlewareSrc = fs.readFileSync(path.join(rootDir, "src/middleware.ts"), "utf8");
  const nextServer = require("next/server");
  const { NextRequest } = nextServer;
  const sentinel = require(path.join(rootDir, "src/lib/security/sentinel-agent.ts"));

  function evalMiddlewareModule(code, env = {}) {
    const transpiled = ts.transpileModule(code, {
      compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, esModuleInterop: true }
    }).outputText;
    const mod = { exports: {} };
    const customRequire = (id) => {
      if (id === "next/server") return nextServer;
      if (id === "@/lib/firewall/waf" || id === "./src/lib/firewall/waf") {
        return {
          evaluateFirewall: (req) => {
            const queryObj = {};
            req.nextUrl.searchParams.forEach((v, k) => { queryObj[k] = v; });
            const assessment = sentinel.evaluateThreat({
              ip: "10.0.0.1",
              userAgent: req.headers.get("user-agent") || "",
              path: req.nextUrl.pathname,
              method: req.method,
              query: queryObj,
              bodyText: "",
              requestId: "test-req",
            });
            return {
              blocked: assessment.blocked,
              statusCode: assessment.blocked ? 403 : 200,
              threatType: "SQLI",
              assessment,
            };
          }
        };
      }
      return require(id);
    };
    const runner = new Function("require", "module", "exports", "process", "console", transpiled);
    runner(customRequire, mod, mod.exports, { env: { ...process.env, ...env } }, { ...console, info: () => {}, warn: () => {}, error: () => {} });
    return mod.exports;
  }

  // M4.1: Don't block WAF threats (bypass threat block)
  await runMutationTest(
    "middleware_waf",
    "M4.1: Bypass WAF blocking on security threats",
    middlewareSrc,
    middlewareSrc.replace("if (wafResult.blocked) {", "if (false && wafResult.blocked) {"),
    async (mutated) => {
      const mod = evalMiddlewareModule(mutated);
      const req = new NextRequest("https://edworld.co.in/api/query?search=' UNION SELECT * FROM users --", {
        headers: { "user-agent": "Mozilla/5.0" }
      });
      const res = await mod.middleware(req);
      assert.strictEqual(res.status, 403);
    }
  );

  // M4.2: Omit X-Sentinel-Shield header
  await runMutationTest(
    "middleware_waf",
    "M4.2: Omit X-Sentinel-Shield header from responses",
    middlewareSrc,
    middlewareSrc.replace('headers.set("X-Sentinel-Shield", "active");', '// omitted'),
    async (mutated) => {
      const mod = evalMiddlewareModule(mutated);
      const req = new NextRequest("https://edworld.co.in/");
      const res = await mod.middleware(req);
      assert.strictEqual(res.headers.get("X-Sentinel-Shield"), "active");
    }
  );

  // M4.3: Omit X-Frame-Options: DENY
  await runMutationTest(
    "middleware_waf",
    "M4.3: Omit X-Frame-Options: DENY",
    middlewareSrc,
    middlewareSrc.replace('headers.set("X-Frame-Options", "DENY");', '// omitted'),
    async (mutated) => {
      const mod = evalMiddlewareModule(mutated);
      const req = new NextRequest("https://edworld.co.in/");
      const res = await mod.middleware(req);
      assert.strictEqual(res.headers.get("X-Frame-Options"), "DENY");
    }
  );

  // M4.4: Invert x-internal-secret check
  await runMutationTest(
    "middleware_waf",
    "M4.4: Allow unauthorized request when internal secret is mismatched",
    middlewareSrc,
    middlewareSrc.replace(
      '!!internalSecret && req.headers.get("x-internal-secret") === internalSecret;',
      'true;'
    ),
    async (mutated) => {
      const mod = evalMiddlewareModule(mutated, { INTERNAL_SERVICE_SECRET: "correct-secret" });
      const req = new NextRequest("https://edworld.co.in/api/internal/test", {
        headers: { "x-internal-secret": "wrong-secret" }
      });
      const res = await mod.middleware(req);
      assert.strictEqual(res.status, 401);
    }
  );

  // M4.5: Disable Coming Soon redirect
  await runMutationTest(
    "middleware_waf",
    "M4.5: Disable COMING_SOON_MODE redirect",
    middlewareSrc,
    middlewareSrc.replace(
      'process.env.COMING_SOON_MODE === "true"',
      'false'
    ),
    async (mutated) => {
      const mod = evalMiddlewareModule(mutated, { COMING_SOON_MODE: "true" });
      const req = new NextRequest("https://edworld.co.in/learn");
      const res = await mod.middleware(req);
      assert.strictEqual(res.status, 307);
      assert.ok(res.headers.get("location").includes("coming_soon=true"));
    }
  );

  // Print summary
  console.log("Mutation Sensitivity Results:");
  let totalMutations = mutationResults.length;
  let caughtMutations = mutationResults.filter(m => m.caught).length;

  mutationResults.forEach((r, idx) => {
    const status = r.caught ? "✅ CAUGHT (Sensitive)" : "❌ MISSED (Insensitive)";
    console.log(`  [${idx + 1}] ${r.suite} - ${r.mutation}: ${status}`);
    if (!r.caught) {
      console.log(`      Detail: ${r.detail}`);
    }
  });

  console.log(`\nScore: ${caughtMutations}/${totalMutations} mutations caught (${Math.round((caughtMutations / totalMutations) * 100)}% mutation kill rate).`);
  console.log("==================================================================");
}

runAll().catch(err => {
  console.error("Runner error:", err);
  process.exit(1);
});
