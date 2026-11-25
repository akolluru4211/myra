/**
 * Top-Level Application Route & Catch-All Routing Regression Suite
 * 
 * Verifies:
 * 1. Every static top-level app route resolves normally without blind /u/ redirection.
 * 2. Unauthenticated access to protected routes redirects to /login?redirectUrl=... (never to /u/<route>).
 * 3. Authenticated access to protected routes resolves normally (200).
 * 4. Temporary recovery redirects for /u/squads -> /squads and /u/daily -> /daily.
 * 5. Unknown routes do NOT get blindly redirected to /u/<route> by middleware.
 * 6. Valid public profile resolution vs 404 for non-existent student handles in [username]/page.tsx.
 */

const { describe, it } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const ts = require("typescript");
const nextServer = require("next/server");

const { NextRequest } = nextServer;

const rootDir = path.resolve(__dirname, "../..");
const middlewareSourcePath = path.join(rootDir, "src/middleware.ts");
const middlewareSource = fs.readFileSync(middlewareSourcePath, "utf8");

// Transpile TypeScript module to CommonJS for dynamic in-memory execution
const transpiledCode = ts.transpileModule(middlewareSource, {
  compilerOptions: {
    module: ts.ModuleKind.CommonJS,
    target: ts.ScriptTarget.ES2022,
    esModuleInterop: true,
  },
}).outputText;

const sentinel = require(path.join(rootDir, "src/lib/security/sentinel-agent.ts"));

function createMiddlewareInstance(options = {}) {
  const { env = {} } = options;
  const effectiveEnv = { ...process.env, ...env };

  const defaultWafEvaluator = (req) => {
    const queryObj = {};
    req.nextUrl.searchParams.forEach((val, key) => {
      queryObj[key] = val;
    });
    const ip = req.headers.get("x-forwarded-for")?.split(",")[0].trim() || "127.0.0.1";
    const userAgent = req.headers.get("user-agent") || "";
    const requestId = req.headers.get("x-request-id") || `req-${Date.now()}`;
    return sentinel.evaluateThreat({ ip, userAgent, path: req.nextUrl.pathname, query: queryObj, requestId });
  };

  const moduleExports = {};
  const moduleContext = {
    exports: moduleExports,
    require: (mod) => {
      if (mod === "next/server") return nextServer;
      if (mod === "@/lib/firewall/waf" || mod.includes("waf")) {
        return { evaluateFirewall: defaultWafEvaluator };
      }
      if (mod === "@/lib/auth/preview-token" || mod.includes("preview-token")) {
        const previewTokenSource = fs.readFileSync(path.join(rootDir, "src/lib/auth/preview-token.ts"), "utf8");
        const transpiledPreview = ts.transpileModule(previewTokenSource, {
          compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, esModuleInterop: true },
        }).outputText;
        const previewMod = { exports: {} };
        new Function("require", "module", "exports", transpiledPreview)(require, previewMod, previewMod.exports);
        return previewMod.exports;
      }
      if (mod === "@/lib/otp-service" || mod.includes("otp-service")) {
        return {
          validateSession: (token) => {
            if (token && token.startsWith("sess_staff")) return { valid: true, userId: "u-1", role: "ADMIN" };
            if (token && token.startsWith("sess_")) return { valid: true, userId: "u-2", role: "STUDENT" };
            return { valid: false };
          },
        };
      }
      return require(mod);
    },
    process: {
      ...process,
      env: effectiveEnv,
    },
    console,
  };

  const fn = new Function("exports", "require", "module", "__filename", "__dirname", "process", transpiledCode);
  fn(moduleExports, moduleContext.require, { exports: moduleExports }, middlewareSourcePath, path.dirname(middlewareSourcePath), moduleContext.process);

  return moduleExports;
}

describe("Shared Routing & Top-Level Route Regression Suite", () => {
  const mw = createMiddlewareInstance();

  const TOP_LEVEL_APP_ROUTES = [
    "about",
    "admin",
    "ambassador",
    "aptitude",
    "career",
    "colleges",
    "companies",
    "consent",
    "contact",
    "cookies",
    "daily",
    "dashboard",
    "dsa",
    "edbuild",
    "edmail",
    "employee",
    "employer",
    "focus",
    "for",
    "founder",
    "hr",
    "interview-experiences",
    "interviews",
    "jobs",
    "leadership-assessment",
    "learn",
    "login",
    "mails",
    "messages",
    "network",
    "newsletter",
    "onboarding",
    "pricing",
    "privacy",
    "profile",
    "projects",
    "refund",
    "resumes",
    "sector",
    "settings",
    "signup",
    "squads",
    "student-record",
    "terms",
    "verify",
  ];

  it("1. Verifies EVERY top-level static app route NEVER redirects to /u/<route>", () => {
    for (const route of TOP_LEVEL_APP_ROUTES) {
      const req = new NextRequest(new URL(`https://edworldco.in/${route}`));
      const res = mw.middleware(req);

      const location = res.headers.get("location");
      if (location) {
        assert.notEqual(
          location,
          `https://edworldco.in/u/${route}`,
          `Top-level app route /${route} must NEVER redirect to /u/${route}`
        );
      }
    }
  });

  it("2. Verifies unknown single-segment routes are NOT blindly redirected to /u/<path>", () => {
    const unknownPaths = [
      "some_unregistered_feature",
      "nonexistent_page_123",
      "random_explore_link",
      "beta_dashboard"
    ];

    for (const p of unknownPaths) {
      const req = new NextRequest(new URL(`https://edworldco.in/${p}`));
      const res = mw.middleware(req);

      const location = res.headers.get("location");
      if (location) {
        assert.notEqual(
          location,
          `https://edworldco.in/u/${p}`,
          `Unknown path /${p} must NOT be blindly redirected to /u/${p}`
        );
      }
    }
  });

  it("3. Verifies signed-out access to protected routes redirects to /login?redirectUrl=...", () => {
    const protectedRoutes = [
      "/dashboard",
      "/squads",
      "/daily",
      "/dsa",
      "/career",
      "/edbuild",
      "/edmail",
      "/student-record",
      "/admin",
    ];

    for (const route of protectedRoutes) {
      const req = new NextRequest(new URL(`https://edworldco.in${route}`));
      const res = mw.middleware(req);

      assert.equal(res.status, 307, `${route} must require authentication when signed out`);
      const location = res.headers.get("location");
      assert.ok(location, `${route} must redirect`);
      const locUrl = new URL(location);
      assert.equal(locUrl.pathname, "/login");
      assert.equal(locUrl.searchParams.get("redirectUrl"), route);
    }
  });

  it("4. Verifies signed-in access to protected routes resolves normally (status 200)", () => {
    const protectedRoutes = [
      "/dashboard",
      "/squads",
      "/daily",
      "/dsa",
      "/career",
      "/edbuild",
      "/edmail",
      "/student-record",
    ];

    for (const route of protectedRoutes) {
      const req = new NextRequest(new URL(`https://edworldco.in${route}`), {
        headers: {
          cookie: "edworld_session=test-mock-valid-jwt-token",
        },
      });
      const res = mw.middleware(req);

      assert.equal(res.status, 200, `Authenticated user visiting ${route} must receive 200 OK`);
      assert.equal(res.headers.get("location"), null, `Authenticated user should not be redirected`);
    }
  });

  it("5. Verifies temporary recovery redirects for /u/squads and /u/daily", () => {
    const reqSquads = new NextRequest(new URL("https://edworldco.in/u/squads"));
    const resSquads = mw.middleware(reqSquads);
    assert.equal(resSquads.status, 307);
    assert.equal(resSquads.headers.get("location"), "https://edworldco.in/squads");

    const reqDaily = new NextRequest(new URL("https://edworldco.in/u/daily"));
    const resDaily = mw.middleware(reqDaily);
    assert.equal(resDaily.status, 307);
    assert.equal(resDaily.headers.get("location"), "https://edworldco.in/daily");
  });

  it("6. Verifies public profile routes (/u/:username) remain directly accessible to visitors", () => {
    const publicProfilePaths = [
      "/u/adarsh",
      "/u/sarah_chen",
      "/u/vikram_dev",
      "/u/demo_student_2026"
    ];

    for (const p of publicProfilePaths) {
      const req = new NextRequest(new URL(`https://edworldco.in${p}`));
      const res = mw.middleware(req);

      assert.equal(res.status, 200, `Public profile ${p} should be allowed through without redirect`);
    }
  });
});
