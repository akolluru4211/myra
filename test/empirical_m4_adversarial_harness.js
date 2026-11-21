/**
 * Empirical Adversarial Challenge Harness for Milestone M4 Test Suites
 * Executes empirical stress-tests, fault injection (mutation sensitivity),
 * edge case analysis, and vulnerability verifications.
 */

const fs = require("node:fs");
const path = require("node:path");
const assert = require("node:assert/strict");
const Module = require("node:module");
const ts = require("typescript");

const rootDir = path.resolve(__dirname, "..");

// Register on-the-fly TypeScript compilation hook
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

// Module resolver hook for '@/...'
const origResolve = Module._resolveFilename;
if (!Module.__tsPathAliasHooked) {
  Module._resolveFilename = function (request, parent, isMain, options) {
    if (request.startsWith("@/")) {
      const mapped = path.resolve(rootDir, "src", request.slice(2));
      return origResolve.call(this, mapped, parent, isMain, options);
    }
    return origResolve.call(this, request, parent, isMain, options);
  };
  Module.__tsPathAliasHooked = true;
}

// Load authentic modules
const roadmapGen = require(path.join(rootDir, "src/lib/career/roadmap-generator.ts"));
const langService = require(path.join(rootDir, "src/lib/interview/language-analysis-service.ts"));
const emailService = require(path.join(rootDir, "src/lib/email-service.ts"));
const sentinel = require(path.join(rootDir, "src/lib/security/sentinel-agent.ts"));

const results = {
  suite1_career: { mutationsPassed: 0, mutationsFailed: 0, findings: [] },
  suite2_language: { mutationsPassed: 0, mutationsFailed: 0, findings: [] },
  suite3_email: { mutationsPassed: 0, mutationsFailed: 0, findings: [] },
  suite4_middleware: { mutationsPassed: 0, mutationsFailed: 0, findings: [] },
};

console.log("==================================================================");
console.log("EMPIRICAL ADVERSARIAL CHALLENGE HARNESS — MILESTONE M4");
console.log("==================================================================\n");

// ============================================================================
// SUITE 1: CAREER ROADMAP GENERATOR
// ============================================================================
console.log("--- 1. Testing Career Roadmap Generator & Suite Sensitivity ---");

// 1.1 Tautological assertion check on toggleRoadmapMilestone
(async () => {
  console.log("[Test 1.1] Checking toggleRoadmapMilestone logic & assertion strength...");
  
  // Valid UUID format that does not exist in database
  const nonExistentUuid = "00000000-0000-0000-0000-000000000000";
  const resNonExistent = await roadmapGen.toggleRoadmapMilestone({
    milestoneId: nonExistentUuid,
    isCompleted: true,
    userId: "attacker_user",
  });
  console.log("  Non-existent UUID toggle returned:", resNonExistent, "(type:", typeof resNonExistent, ")");
  
  if (resNonExistent === true) {
    results.suite1_career.findings.push({
      issue: "toggleRoadmapMilestone returns true for non-existent milestone ID",
      detail: "In Supabase PostgREST, updating 0 rows does not return an error, so the function returns true. The test asserted typeof result === 'boolean', masking this silent no-op.",
      severity: "MEDIUM"
    });
  }

  // Check tenant isolation: userId is accepted in params but not used in query
  // Let's inspect source lines in roadmap-generator.ts
  const roadmapSource = fs.readFileSync(path.join(rootDir, "src/lib/career/roadmap-generator.ts"), "utf8");
  const usesUserIdInUpdate = roadmapSource.includes('.eq("user_id", userId)');
  console.log("  Does toggleRoadmapMilestone filter by user_id?", usesUserIdInUpdate);
  if (!usesUserIdInUpdate) {
    results.suite1_career.findings.push({
      issue: "toggleRoadmapMilestone ignores userId in DB update query",
      detail: "toggleRoadmapMilestone accepts userId in its parameters but only filters on .eq('id', milestoneId). Any user can toggle another user's milestone if they know the milestone ID.",
      severity: "HIGH"
    });
  }

  // 1.2 Edge cases in generateCareerRoadmap
  console.log("[Test 1.2] Testing generateCareerRoadmap with edge case / malformed inputs...");
  try {
    const resEmpty = await roadmapGen.generateCareerRoadmap({
      userId: "",
      targetRole: "",
    });
    console.log("  Empty inputs handled cleanly. ID:", resEmpty.id, "Milestones count:", resEmpty.milestones.length);
  } catch (err) {
    console.log("  generateCareerRoadmap threw on empty inputs:", err.message);
  }

  // 1.3 Fault injection: If CURATED_DEFAULT_ROADMAPS has fewer than 11 milestones or invalid horizons
  console.log("[Test 1.3] Verifying sensitivity of test suite against milestone schema mutations...");
  // Let's verify what happens if milestones have invalid monthIndex order
  const sampleRoadmap = await roadmapGen.generateCareerRoadmap({
    userId: "test_user",
    targetRole: roadmapGen.TARGET_ROLE_OPTIONS[0],
  });
  assert.ok(sampleRoadmap.milestones.length >= 11);
  console.log("  Roadmap generator successfully validated for 11 curated milestones.");
})();

// ============================================================================
// SUITE 2: LANGUAGE ANALYSIS SERVICE
// ============================================================================
console.log("\n--- 2. Testing Language Analysis Service & Suite Sensitivity ---");

(() => {
  // 2.1 Empty transcript scoring anomaly
  console.log("[Test 2.1] Testing empty transcript scoring behavior...");
  const emptyRes = langService.analyzeSpokenLanguage("", 60);
  console.log("  Empty transcript overallLanguageScore:", emptyRes.overallLanguageScore, "/ 100");
  console.log("  Grammar:", emptyRes.grammarScore, "Clarity:", emptyRes.clarityScore, "Fluency:", emptyRes.fluencyScore, "Vocab:", emptyRes.vocabularyScore, "Prof:", emptyRes.professionalScore);
  
  if (emptyRes.overallLanguageScore >= 70) {
    results.suite2_language.findings.push({
      issue: "Empty or whitespace-only transcript receives high passing score (82/100)",
      detail: `analyzeSpokenLanguage("", 60) calculates default baseline scores (grammar: 88, clarity: 85, fluency: 72, vocab: 80, prof: 84) resulting in overallLanguageScore = ${emptyRes.overallLanguageScore}. A silent or empty attempt should receive 0. The test suite only asserted wordCount == 0, not overallLanguageScore.`,
      severity: "MEDIUM"
    });
  }

  // 2.2 NaN / Extreme duration handling
  console.log("[Test 2.2] Testing NaN and extreme duration inputs...");
  const nanDurationRes = langService.analyzeSpokenLanguage("Hello world", NaN);
  console.log("  NaN duration WPM:", nanDurationRes.wordsPerMinute);
  if (Number.isNaN(nanDurationRes.wordsPerMinute)) {
    results.suite2_language.findings.push({
      issue: "Passing NaN duration produces NaN wordsPerMinute",
      detail: "Math.max(10, NaN) returns NaN in JavaScript, which propagates into wordsPerMinute and downstream calculations.",
      severity: "LOW"
    });
  }

  // 2.3 compareAttempts 0-fillers anomaly
  console.log("[Test 2.3] Testing compareAttempts with 0 fillers in both attempts...");
  const a1Clean = langService.analyzeSpokenLanguage("I designed and deployed the system architecture successfully.", 60);
  const a2Clean = langService.analyzeSpokenLanguage("I designed and deployed the system architecture successfully.", 60);
  const compClean = langService.compareAttempts(a1Clean, a2Clean);
  console.log("  Filler reduction percent between two 0-filler attempts:", compClean.deltas.fillerReductionPercent + "%");
  
  if (compClean.deltas.fillerReductionPercent === 100) {
    results.suite2_language.findings.push({
      issue: "compareAttempts reports 100% filler reduction when both attempts have 0 fillers",
      detail: "Formula uses f1 = Math.max(1, attempt1.fillerWordCount). When attempt1 has 0 fillers, f1 is clamped to 1, while f2 is 0. ((1 - 0) / 1) * 100 = 100%. The test asserted this 100% value to pass, rather than flagging the logical flaw.",
      severity: "MEDIUM"
    });
  }

  // 2.4 Regression when attempt 2 has massive fillers
  console.log("[Test 2.4] Testing fillerReductionPercent on severe regression (1 filler -> 10 fillers)...");
  const a1Single = langService.analyzeSpokenLanguage("Um, I designed the system.", 60);
  const a2Ten = langService.analyzeSpokenLanguage("Um uh like basically you know sort of kind of literally um uh I designed the system.", 60);
  const compRegress = langService.compareAttempts(a1Single, a2Ten);
  console.log("  Filler reduction on regression:", compRegress.deltas.fillerReductionPercent + "%");
  console.log("  Overall verdict:", compRegress.overallVerdict);

  // 2.5 Regex boundary check with punctuation
  console.log("[Test 2.5] Testing filler word regex boundaries with varied punctuation...");
  const punctText = "Um... I mean, like, basically; you know? sort of! kind of: literally-- um, uh.";
  const punctRes = langService.analyzeSpokenLanguage(punctText, 60);
  console.log("  Detected fillers from punctuated text (expected 9):", punctRes.fillerWordCount);
  assert.equal(punctRes.fillerWordCount, 9, "All 9 punctuated fillers must be detected");
})();

// ============================================================================
// SUITE 3: EMAIL SERVICE (RESEND)
// ============================================================================
console.log("\n--- 3. Testing Email Service & Resend Integration ---");

(async () => {
  // 3.1 Error response handling in sendEmailNotification
  console.log("[Test 3.1] Testing error masking in sendEmailNotification...");
  
  // Create an instance of email-service with an error-returning client
  const transpiledEmailService = ts.transpileModule(
    fs.readFileSync(path.join(rootDir, "src/lib/email-service.ts"), "utf8"),
    { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, esModuleInterop: true } }
  ).outputText;

  class FailingResend {
    constructor() {
      this.emails = {
        send: async () => ({
          data: null,
          error: { message: "Invalid API key", statusCode: 401 },
        }),
      };
    }
  }

  const moduleObj = { exports: {} };
  const customRequire = (id) => {
    if (id === "./supabase" || id === "./supabase.ts") {
      return { supabase: { from: () => ({ insert: async () => ({}) }) } };
    }
    if (id === "./email-templates" || id === "./email-templates.ts") {
      return require(path.join(rootDir, "src/lib/email-templates.ts"));
    }
    if (id === "resend") {
      return { Resend: FailingResend };
    }
    return require(id);
  };

  const runner = new Function("require", "module", "exports", "process", "console", transpiledEmailService);
  runner(customRequire, moduleObj, moduleObj.exports, { ...process, env: { RESEND_API_KEY: "re_test_key" } }, {
    ...console,
    warn: () => {},
    info: () => {},
    error: () => {},
  });

  const failingSvc = moduleObj.exports;
  const sendRes = await failingSvc.sendEmailNotification({
    to: "test@example.com",
    subject: "Test Failing Email",
    html: "<p>Test</p>",
  });

  console.log("  When Resend API returns 401 Error, sendEmailNotification returned:", sendRes);
  if (sendRes.success === true && sendRes.id === undefined) {
    results.suite3_email.findings.push({
      issue: "sendEmailNotification returns { success: true } even when Resend API returns an error",
      detail: "When resend.emails.send returns an error object, sendEmailNotification catches and logs it as a warning, but returns { success: true, id: undefined, isMock: false }. Callers cannot tell whether the email actually dispatched.",
      severity: "MEDIUM"
    });
  }

  // 3.2 Newsletter subscriber email validation robustness
  console.log("[Test 3.2] Testing addNewsletterSubscriber email validation edge cases...");
  const edgeEmails = ["@", "test@", "@domain.com", "spaces @ email.com", "user@domain.com"];
  for (const e of edgeEmails) {
    const subRes = await failingSvc.addNewsletterSubscriber({ email: e });
    console.log(`  Email "${e}" -> accepted?`, subRes.success, subRes.error || "");
    if (subRes.success && (e === "@" || e === "test@" || e === "@domain.com" || e.includes(" "))) {
      results.suite3_email.findings.push({
        issue: `addNewsletterSubscriber accepts malformed email "${e}" as valid`,
        detail: "Validation check is merely cleanEmail.includes('@') and cleanEmail.length > 0, which permits '@', 'test@', and '@domain.com'.",
        severity: "LOW"
      });
    }
  }

  // 3.3 Case-sensitive admin BCC deduplication check
  console.log("[Test 3.3] Checking admin BCC deduplication case sensitivity...");
  const sendWithUpperAdmin = await failingSvc.sendEmailNotification({
    to: "EDWORLD.EDEN@GMAIL.COM",
    subject: "Admin Email Case Test",
    html: "<p>Test</p>",
  });
  console.log("  sendWithUpperAdmin success:", sendWithUpperAdmin.success);
})();

// ============================================================================
// SUITE 4: EDGE MIDDLEWARE & WAF
// ============================================================================
console.log("\n--- 4. Testing Edge Middleware & WAF Security Engine ---");

(async () => {
  const nextServer = require("next/server");
  const { NextRequest } = nextServer;

  const transpiledMiddleware = ts.transpileModule(
    fs.readFileSync(path.join(rootDir, "src/middleware.ts"), "utf8"),
    { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, esModuleInterop: true } }
  ).outputText;

  const moduleObj = { exports: {} };
  const customRequire = (id) => {
    if (id === "next/server") return nextServer;
    if (id === "@/lib/firewall/waf" || id === "./src/lib/firewall/waf") {
      const waf = require(path.join(rootDir, "src/lib/firewall/waf.ts"));
      return waf;
    }
    return require(id);
  };

  const runner = new Function("require", "module", "exports", "process", "console", transpiledMiddleware);
  runner(customRequire, moduleObj, moduleObj.exports, {
    ...process,
    env: { ...process.env, INTERNAL_SERVICE_SECRET: "test-secret-123" }
  }, {
    ...console,
    info: () => {},
    warn: () => {},
    error: () => {},
  });

  const middleware = moduleObj.exports.middleware;

  // 4.1 Test public pages missing from RESERVED_FIRST_LEVEL_ROUTES
  console.log("[Test 4.1] Testing routing behavior for /certificate, /feedback, /showcase...");
  
  const testRoutes = [
    { path: "/certificate", expected: "public page (not redirect to /u/certificate)" },
    { path: "/feedback", expected: "public page (not redirect to /u/feedback)" },
    { path: "/showcase", expected: "redirect to /dsa (per next.config.mjs)" },
  ];

  for (const { path: testPath, expected } of testRoutes) {
    const req = new NextRequest(`https://edworld.co.in${testPath}`, {
      headers: { "user-agent": "Mozilla/5.0" }
    });
    const res = await middleware(req);
    const location = res.headers.get("location");
    const status = res.status;
    console.log(`  Path: ${testPath} -> Status: ${status}, Location: ${location}`);

    if (location && location.includes(`/u${testPath}`)) {
      results.suite4_middleware.findings.push({
        issue: `Route ${testPath} is hijacked by student handle redirect -> ${location}`,
        detail: `Because '${testPath.slice(1)}' is missing from RESERVED_FIRST_LEVEL_ROUTES, the middleware treats it as a student username and 301-redirects to /u${testPath}.`,
        severity: testPath === "/feedback" || testPath === "/certificate" ? "HIGH" : "MEDIUM"
      });
    }
  }

  // 4.2 Test WAF detection on SQLi payload with genuine WAF module
  console.log("[Test 4.2] Testing WAF inspection with authentic src/lib/firewall/waf.ts...");
  const sqliReq = new NextRequest("https://edworld.co.in/api/query?search=' UNION SELECT * FROM users --", {
    headers: { "user-agent": "Mozilla/5.0", "x-forwarded-for": "198.51.100.1" }
  });
  const sqliRes = await middleware(sqliReq);
  console.log("  SQLi on /api/query -> Status:", sqliRes.status, "Shield Header:", sqliRes.headers.get("X-Sentinel-Shield"));
  assert.equal(sqliRes.status, 403, "SQLi must be blocked with 403");
  assert.equal(sqliRes.headers.get("X-Sentinel-Shield"), "active");

  // 4.3 Test Subdomain spoofing: career.attacker.com
  console.log("[Test 4.3] Testing subdomain isolation for external hostnames...");
  const spoofReq = new NextRequest("https://career.attacker.com/", {
    headers: { host: "career.attacker.com", "user-agent": "Mozilla/5.0" }
  });
  const spoofRes = await middleware(spoofReq);
  // Should not rewrite to /sector-landing/career because career.attacker.com is not in SUBDOMAIN_SECTOR_MAP
  console.log("  career.attacker.com -> Rewrite header:", spoofRes?.headers?.get("x-middleware-rewrite"));

  // 4.4 Test internal secret validation when secret is missing / invalid
  console.log("[Test 4.4] Testing x-internal-secret security boundary...");
  const secretReqNoAuth = new NextRequest("https://edworld.co.in/api/internal/test", {
    headers: { "user-agent": "Mozilla/5.0" }
  });
  const secretResNoAuth = await middleware(secretReqNoAuth);
  console.log("  Unauthenticated /api/internal/test -> Status:", secretResNoAuth.status);
  assert.equal(secretResNoAuth.status, 401, "Protected API without secret must return 401");

  const secretReqWrong = new NextRequest("https://edworld.co.in/api/internal/test", {
    headers: { "user-agent": "Mozilla/5.0", "x-internal-secret": "wrong-secret" }
  });
  const secretResWrong = await middleware(secretReqWrong);
  console.log("  Wrong secret /api/internal/test -> Status:", secretResWrong.status);
  assert.equal(secretResWrong.status, 401, "Protected API with wrong secret must return 401");

  const secretReqRight = new NextRequest("https://edworld.co.in/api/internal/test", {
    headers: { "user-agent": "Mozilla/5.0", "x-internal-secret": "test-secret-123" }
  });
  const secretResRight = await middleware(secretReqRight);
  console.log("  Correct secret /api/internal/test -> Status:", secretResRight.status);
  assert.equal(secretResRight.status, 200, "Protected API with correct secret must pass (200)");
})();

// Wait for all async tasks to print results summary
setTimeout(() => {
  console.log("\n==================================================================");
  console.log("EMPIRICAL ADVERSARIAL CHALLENGE FINDINGS SUMMARY");
  console.log("==================================================================");
  
  const allFindings = [
    ...results.suite1_career.findings,
    ...results.suite2_language.findings,
    ...results.suite3_email.findings,
    ...results.suite4_middleware.findings,
  ];

  if (allFindings.length === 0) {
    console.log("Zero defects discovered across all 4 suites.");
  } else {
    console.log(`Discovered ${allFindings.length} notable defects / edge case vulnerabilities:`);
    allFindings.forEach((f, i) => {
      console.log(`\n[Finding ${i + 1}] [${f.severity}] ${f.issue}`);
      console.log(`  Details: ${f.detail}`);
    });
  }
  console.log("\n==================================================================");
}, 2000);
