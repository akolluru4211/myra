/**
 * Focused Unit & Integration Tests: Middleware Route Access, Subdomain Resolution & Preview Tokens
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

const transpiledCode = ts.transpileModule(middlewareSource, {
  compilerOptions: {
    module: ts.ModuleKind.CommonJS,
    target: ts.ScriptTarget.ES2022,
    esModuleInterop: true,
  },
}).outputText;

const previewTokenSource = fs.readFileSync(path.join(rootDir, "src/lib/auth/preview-token.ts"), "utf8");
const transpiledPreview = ts.transpileModule(previewTokenSource, {
  compilerOptions: {
    module: ts.ModuleKind.CommonJS,
    target: ts.ScriptTarget.ES2022,
    esModuleInterop: true,
  },
}).outputText;

const previewTokenModule = {};
const previewFn = new Function("exports", "require", "process", transpiledPreview);
previewFn(previewTokenModule, require, process);

function createMiddlewareInstance(options = {}) {
  const { env = {} } = options;

  const effectiveEnv = {
    ...process.env,
    ...env,
  };

  const moduleExports = {};
  const customRequire = (moduleName) => {
    if (moduleName === "next/server") return nextServer;
    if (moduleName === "@/lib/firewall/waf") {
      return {
        evaluateFirewall: () => ({ blocked: false, threatType: null }),
      };
    }
    if (moduleName === "@/lib/auth/preview-token") {
      return previewTokenModule;
    }
    if (moduleName === "@/lib/otp-service") {
      return {
        validateSession: (token) => {
          if (token === "sess_staff_admin") {
            return { valid: true, userId: "u-admin", role: "ADMIN" };
          }
          if (token === "sess_student") {
            return { valid: true, userId: "u-student", role: "STUDENT" };
          }
          return { valid: false };
        },
      };
    }
    return require(moduleName);
  };

  const fn = new Function("exports", "require", "process", transpiledCode);
  fn(moduleExports, customRequire, { env: effectiveEnv });
  return moduleExports;
}

describe("Middleware Route Access, Subdomains & Preview Token Suite", () => {
  // 1. Exact public matching vs similarly named private routes
  it("1. Exact public matching does not leak similarly named private routes", () => {
    const mw = createMiddlewareInstance();

    // Intentionally public
    const reqPublic = new NextRequest(new URL("https://edworldco.in/about"));
    const resPublic = mw.middleware(reqPublic);
    assert.equal(resPublic.status, 200);

    // Similarly named private route should be blocked / redirected to login
    const reqPrivate = new NextRequest(new URL("https://edworldco.in/about-internal-dashboard"));
    const resPrivate = mw.middleware(reqPrivate);
    assert.equal(resPrivate.status, 307);
    assert.ok(resPrivate.headers.get("location").includes("/login?redirectUrl="));
  });

  // 2. Subdomain destination resolution happens BEFORE launch/access checks
  it("2. Subdomain rewrites are gated by Coming Soon mode", () => {
    const mw = createMiddlewareInstance({
      env: { COMING_SOON_MODE: "true" },
    });

    // Subdomain request when coming soon is active
    const reqSub = new NextRequest(new URL("https://placeholder/"), {
      headers: { host: "career.edworldco.in" },
    });
    const resSub = mw.middleware(reqSub);

    assert.ok(
      resSub.status === 307 || resSub.headers.get("x-coming-soon-gated") === "true",
      "Subdomain must not return rewrite before coming soon check"
    );
  });

  // 3. Client-controlled preview=true or fake cookies are rejected
  it("3. Client-controlled preview=true or forged cookie cannot bypass coming-soon", () => {
    const mw = createMiddlewareInstance({
      env: { COMING_SOON_MODE: "true" },
    });

    // Unsigned query param
    const reqForgedQuery = new NextRequest(new URL("https://edworldco.in/dsa?preview=true"));
    const resForgedQuery = mw.middleware(reqForgedQuery);
    assert.equal(resForgedQuery.status, 307);
    assert.ok(resForgedQuery.headers.get("location").includes("/?coming_soon=true"));

    // Unsigned cookie
    const reqForgedCookie = new NextRequest(new URL("https://edworldco.in/dsa"), {
      headers: { cookie: "edw_preview=true" },
    });
    const resForgedCookie = mw.middleware(reqForgedCookie);
    assert.equal(resForgedCookie.status, 307);
    assert.ok(resForgedCookie.headers.get("location").includes("/?coming_soon=true"));
  });

  // 4. Authorized staff session allows preview access
  it("4. Authorized staff session allows preview during coming-soon", () => {
    const mw = createMiddlewareInstance({
      env: { COMING_SOON_MODE: "true" },
    });

    const reqStaff = new NextRequest(new URL("https://edworldco.in/about"), {
      headers: { cookie: "edworld_session=sess_staff_admin" },
    });
    const resStaff = mw.middleware(reqStaff);
    assert.equal(resStaff.status, 200);
  });

  // 5. Server-signed preview token allows signed-out preview browsing
  it("5. Server-signed preview token allows browsing, expired token is denied", () => {
    const mw = createMiddlewareInstance({
      env: { COMING_SOON_MODE: "true" },
    });

    // Valid signed token
    const validToken = previewTokenModule.generatePreviewToken("staff-1", 3600);
    const reqValidToken = new NextRequest(new URL(`https://edworldco.in/about?preview_token=${validToken}`));
    const resValidToken = mw.middleware(reqValidToken);
    assert.equal(resValidToken.status, 200);

    // Expired token
    const expiredToken = previewTokenModule.generatePreviewToken("staff-1", -10);
    const reqExpiredToken = new NextRequest(new URL(`https://edworldco.in/about?preview_token=${expiredToken}`));
    const resExpiredToken = mw.middleware(reqExpiredToken);
    assert.equal(resExpiredToken.status, 307);
    assert.ok(resExpiredToken.headers.get("location").includes("/?coming_soon=true"));
  });

  // 6. Preview access does NOT bypass protected student/admin authorization
  it("6. Preview token does not grant access to protected student data", () => {
    const mw = createMiddlewareInstance({
      env: { COMING_SOON_MODE: "true" },
    });

    const validToken = previewTokenModule.generatePreviewToken("staff-1", 3600);
    // Student private dashboard with valid preview token but NO student session
    const reqDashboard = new NextRequest(new URL(`https://edworldco.in/dashboard?preview_token=${validToken}`));
    const resDashboard = mw.middleware(reqDashboard);

    // Must still redirect to login for protected dashboard
    assert.equal(resDashboard.status, 307);
    assert.ok(resDashboard.headers.get("location").includes("/login?redirectUrl="));
  });

  // 7. Subdomain rewrites when coming-soon is OFF
  it("7. Subdomain rewrites function normally when coming-soon is off", () => {
    const mw = createMiddlewareInstance({
      env: { COMING_SOON_MODE: "false" },
    });

    const reqLearn = new NextRequest(new URL("https://placeholder/dsa-mastery?tab=syllabus"), {
      headers: { host: "learn.edworld.co.in" },
    });
    const resLearn = mw.middleware(reqLearn);
    const rewriteHeader = resLearn.headers.get("x-middleware-rewrite");
    assert.ok(rewriteHeader.includes("/learn/dsa-mastery"));
    assert.ok(rewriteHeader.includes("tab=syllabus"), "Original query parameters must be preserved");
  });
});
