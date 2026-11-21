/**
 * Automated Regression Test Suite: Edge Middleware & Web Application Firewall (WAF)
 * Target Module: src/middleware.ts
 * 
 * Verifies:
 * 1. Edge Middleware matcher configuration and static asset early-return bypasses.
 * 2. WAF request inspection & OWASP threat defense (SQLi, path traversal, malicious bots, honeypots).
 * 3. False positive immunity for legitimate technical terminology in queries.
 * 4. Public route vs. protected route authorization boundaries.
 * 5. Route normalization and permanent redirect rules (/practice -> /dsa, /showcase -> /dsa, username handles).
 * 6. Multi-tenant subdomain routing and internal rewrite mappings (career.*, student.*, learn.*).
 * 7. Internal service secret verification (x-internal-secret vs INTERNAL_SERVICE_SECRET).
 * 8. Hardened HTTP security headers, anti-AI-scraping, and Content-Security-Policy compliance.
 * 9. Unified Coming Soon gating and production environment route lockdown.
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

// Import Sentinel Agent for accurate, realistic threat evaluation
const sentinel = require(path.join(rootDir, "src/lib/security/sentinel-agent.ts"));

/**
 * Factory to create an isolated instance of middleware with custom environment variables.
 */
function createMiddlewareInstance(options = {}) {
  const {
    env = {},
    customWafEvaluator = null,
    silent = true,
  } = options;

  const effectiveEnv = {
    ...process.env,
    ...env,
  };

  const defaultWafEvaluator = (req) => {
    const queryObj = {};
    req.nextUrl.searchParams.forEach((val, key) => {
      queryObj[key] = val;
    });

    const userAgent = req.headers.get("user-agent") || "";
    const ip = req.headers.get("x-forwarded-for")?.split(",")[0].trim() ||
      req.headers.get("x-real-ip")?.trim() ||
      `10.0.${Math.floor(Math.random() * 250)}.${Math.floor(Math.random() * 250)}`;
    const requestId = req.headers.get("x-request-id") || `req-${Date.now()}`;

    const assessment = sentinel.evaluateThreat({
      ip,
      userAgent,
      path: req.nextUrl.pathname,
      method: req.method,
      query: queryObj,
      bodyText: req.nextUrl.search ? decodeURIComponent(req.nextUrl.search) : "",
      requestId,
    });

    if (assessment.blocked) {
      const primaryVector = assessment.threatVectors[0];
      let threatType = "SUSPICIOUS_PAYLOAD";
      let statusCode = 403;

      if (primaryVector === "HONEYPOT_TRAP") {
        threatType = "HONEYPOT_TRAP";
        statusCode = 403;
      } else if (primaryVector === "AI_AGENT_CRAWLER") {
        threatType = "AI_CRAWLER";
        statusCode = 403;
      } else if (primaryVector === "HEADLESS_AUTOMATION") {
        threatType = "MALICIOUS_BOT";
        statusCode = 403;
      } else if (primaryVector === "VELOCITY_DDOS") {
        threatType = "VELOCITY_LIMIT";
        statusCode = 429;
      } else if (primaryVector === "OWASP_EXPLOIT") {
        const matchStr = assessment.matchedSignatures.join(" ");
        if (matchStr.includes("SQLI")) threatType = "SQLI";
        else if (matchStr.includes("XSS")) threatType = "XSS";
        else if (matchStr.includes("RCE")) threatType = "RCE";
        else if (matchStr.includes("SSRF")) threatType = "SSRF";
        else if (matchStr.includes("PATH_TRAVERSAL")) threatType = "PATH_TRAVERSAL";
        statusCode = 403;
      }

      return {
        blocked: true,
        statusCode,
        threatType,
        threatVector: primaryVector,
        riskScore: assessment.riskScore,
        reason: assessment.primaryReason,
        matchedPattern: assessment.matchedSignatures[0] || "Aegis Threat Signature",
        assessment,
      };
    }

    return {
      blocked: false,
      statusCode: 200,
      assessment,
    };
  };

  const activeWafEvaluator = customWafEvaluator || defaultWafEvaluator;

  const customRequire = (id) => {
    if (id === "next/server") {
      return nextServer;
    }
    if (id === "@/lib/firewall/waf" || id === "./src/lib/firewall/waf") {
      return { evaluateFirewall: activeWafEvaluator };
    }
    return require(id);
  };

  const customConsole = silent
    ? { ...console, info: () => {}, warn: () => {}, error: () => {} }
    : console;

  const moduleObj = { exports: {} };
  const runner = new Function("require", "module", "exports", "process", "console", transpiledCode);
  runner(customRequire, moduleObj, moduleObj.exports, { ...process, env: effectiveEnv }, customConsole);

  return moduleObj.exports;
}

describe("Next.js Edge Middleware & WAF Security Engine (src/middleware.ts)", () => {

  // ---------------------------------------------------------------------------
  // 1. Matcher Configuration & Static Asset Early-Exit Bypass
  // ---------------------------------------------------------------------------
  describe("1. Matcher Configuration & Static Asset Early-Exit Bypass", () => {
    it("exports standard matcher pattern protecting application routes while excluding static assets", () => {
      const mw = createMiddlewareInstance();
      assert.ok(mw.config && Array.isArray(mw.config.matcher), "Middleware must export config.matcher array");
      const pattern = mw.config.matcher[0];
      assert.ok(pattern.includes("_next/static"), "Matcher must exclude _next/static");
      assert.ok(pattern.includes("_next/image"), "Matcher must exclude _next/image");
      assert.ok(pattern.includes("favicon.ico"), "Matcher must exclude favicon.ico");
    });

    it("immediately bypasses Next.js internal static assets without firewall overhead", () => {
      const mw = createMiddlewareInstance();
      const staticPaths = [
        "/_next/static/chunks/main-app.js",
        "/_next/static/css/app.css",
        "/images/brand/logo.svg",
        "/images/hero-preview.png",
        "/extensions/chrome-extension.crx",
        "/favicon.ico",
        "/sitemap.xml",
        "/robots.txt",
      ];

      for (const p of staticPaths) {
        const req = new NextRequest(new URL(`https://edworldco.in${p}`));
        const res = mw.middleware(req);

        assert.equal(res.status, 200, `Static path ${p} should return 200 next()`);
        assert.ok(res.headers.get("x-request-id"), `Static path ${p} must have x-request-id header`);
        // Static assets should NOT run the full security header pipeline
        assert.equal(res.headers.get("X-Sentinel-Shield"), null, "Static assets bypass full sentinel shield application");
      }
    });
  });

  // ---------------------------------------------------------------------------
  // 2. Web Application Firewall (WAF) Request Inspection & Exploit Interception
  // ---------------------------------------------------------------------------
  describe("2. WAF Request Inspection & Threat Interception", () => {
    it("blocks SQL Injection UNION SELECT attack on API routes with 403 JSON and threat metadata", async () => {
      const mw = createMiddlewareInstance();
      const req = new NextRequest(
        new URL("https://edworldco.in/api/users?query=UNION+SELECT+username,password+FROM+users")
      );
      const res = mw.middleware(req);

      assert.equal(res.status, 403, "SQLi attack must be rejected with HTTP 403");
      assert.equal(res.headers.get("X-Sentinel-Shield"), "active");
      assert.equal(res.headers.get("X-Robots-Tag"), "noai, noimageai");

      const body = await res.json();
      assert.equal(body.success, false);
      assert.equal(body.error.code, "FIREWALL_BLOCKED");
      assert.equal(body.error.threat_type, "SQLI");
      assert.ok(body.error.risk_score >= 80);
      assert.ok(body.error.request_id);
    });

    it("blocks SQL Injection boolean tautology (' OR '1'='1) on API routes", async () => {
      const mw = createMiddlewareInstance();
      const req = new NextRequest(
        new URL("https://edworldco.in/api/jobs/search?filter=1'+OR+'1'='1")
      );
      const res = mw.middleware(req);

      assert.equal(res.status, 403);
      const body = await res.json();
      assert.equal(body.success, false);
      assert.equal(body.error.code, "FIREWALL_BLOCKED");
      assert.equal(body.error.threat_type, "SQLI");
    });

    it("blocks SQL Injection attacks on standard page routes with hardened 403 HTML page", async () => {
      const mw = createMiddlewareInstance();
      const req = new NextRequest(
        new URL("https://edworldco.in/explore?category=tech';+DROP+TABLE+users;--")
      );
      const res = mw.middleware(req);

      assert.equal(res.status, 403);
      assert.equal(res.headers.get("content-type"), "text/html");
      assert.equal(res.headers.get("X-Frame-Options"), "DENY");

      const html = await res.text();
      assert.ok(html.includes("403 Request Blocked by Firewall"));
      assert.ok(html.includes("Reference ID:"));
    });

    it("blocks Path Traversal (../) exploitation attempts", async () => {
      const mw = createMiddlewareInstance();
      const req = new NextRequest(
        new URL("https://edworldco.in/api/documents?path=../../etc/passwd")
      );
      const res = mw.middleware(req);

      assert.equal(res.status, 403);
      const body = await res.json();
      assert.equal(body.success, false);
      assert.equal(body.error.threat_type, "PATH_TRAVERSAL");
    });

    it("blocks Honeypot Decoy Traps (/.env, /.git/config, /wp-admin) with maximum risk score", async () => {
      const mw = createMiddlewareInstance();
      const honeypotPaths = ["/.env", "/.git/config", "/wp-admin", "/.aws/credentials"];

      for (const trapPath of honeypotPaths) {
        const req = new NextRequest(new URL(`https://edworldco.in${trapPath}`));
        const res = mw.middleware(req);

        assert.equal(res.status, 403, `Honeypot trap ${trapPath} must return 403`);
        const html = await res.text();
        assert.ok(html.includes("Honeypot trap triggered") || html.includes("403 Request Blocked"));
      }
    });

    it("blocks unauthorized AI scrapers and automated crawler user agents", async () => {
      const mw = createMiddlewareInstance();
      const botUserAgents = [
        "Mozilla/5.0 (compatible; GPTBot/1.2; +https://openai.com/gptbot)",
        "ClaudeBot/1.0; +https://www.anthropic.com/claudebot",
        "PerplexityBot/1.0 (+https://perplexity.ai/perplexitybot)",
        "Bytespider",
      ];

      for (const ua of botUserAgents) {
        const req = new NextRequest(new URL("https://edworldco.in/learn"), {
          headers: { "user-agent": ua },
        });
        const res = mw.middleware(req);

        assert.equal(res.status, 403, `AI crawler UA '${ua}' should be blocked`);
      }
    });

    it("ensures zero false positives: allows legitimate technical search terms through unhindered", () => {
      const mw = createMiddlewareInstance();
      const legitimateQueries = [
        "https://edworldco.in/api/jobs/maintenance",
        "https://edworldco.in/api/landing?query=Senior+React+and+SQL+Database+Engineer",
        "https://edworldco.in/api/landing?skill=c%2B%2B",
        "https://edworldco.in/contact?subject=Question+about+SQL+interview+coaching",
      ];

      for (const q of legitimateQueries) {
        const req = new NextRequest(new URL(q));
        const res = mw.middleware(req);

        assert.notEqual(res.status, 403, `Legitimate query '${q}' must NOT be blocked by WAF`);
      }
    });
  });

  // ---------------------------------------------------------------------------
  // 3. Public Route Access & Authentication Bypasses
  // ---------------------------------------------------------------------------
  describe("3. Public Route Access & Authentication Bypasses", () => {
    it("allows unauthenticated access to the root landing page (/)", () => {
      const mw = createMiddlewareInstance();
      const req = new NextRequest(new URL("https://edworldco.in/"));
      const res = mw.middleware(req);

      assert.equal(res.status, 200);
      assert.equal(res.headers.get("X-Sentinel-Shield"), "active");
    });

    it("allows unauthenticated access to canonical public pages", () => {
      const mw = createMiddlewareInstance();
      const publicPages = [
        "/login",
        "/signup",
        "/about",
        "/contact",
        "/pricing",
        "/learn",
        "/privacy",
        "/terms",
        "/cookies",
        "/refund",
        "/newsletter",
        "/for-career",
        "/for-college",
        "/for-professionals",
        "/sector/technology",
      ];

      for (const pagePath of publicPages) {
        const req = new NextRequest(new URL(`https://edworldco.in${pagePath}`));
        const res = mw.middleware(req);

        assert.equal(res.status, 200, `Public page ${pagePath} should be accessible without authentication`);
        assert.equal(res.headers.get("X-Sentinel-Shield"), "active");
      }
    });

    it("allows unauthenticated access to public API endpoints", () => {
      const mw = createMiddlewareInstance();
      const publicApis = [
        "/api/auth/login",
        "/api/auth/signup",
        "/api/auth/otp/send",
        "/api/auth/otp/verify",
        "/api/auth/forgot-password",
        "/api/auth/session",
        "/api/health",
        "/api/landing",
        "/api/billing/webhook",
        "/api/feature-flags",
      ];

      for (const apiPath of publicApis) {
        const req = new NextRequest(new URL(`https://edworldco.in${apiPath}`));
        const res = mw.middleware(req);

        assert.equal(res.status, 200, `Public API ${apiPath} should be accessible without session token`);
      }
    });
  });

  // ---------------------------------------------------------------------------
  // 4. Route Normalization, Student Handle 301s & Redirect Rules
  // ---------------------------------------------------------------------------
  describe("4. Route Normalization & Redirect Rules", () => {
    it("301-redirects direct student handle URLs to /u/:username", () => {
      const mw = createMiddlewareInstance();
      const usernames = ["adarsh_2026", "sarah_chen", "vikram_dev", "priya-engineer"];

      for (const username of usernames) {
        const req = new NextRequest(new URL(`https://edworldco.in/${username}`));
        const res = mw.middleware(req);

        assert.equal(res.status, 301, `Handle /${username} must return 301 redirect`);
        assert.equal(res.headers.get("location"), `https://edworldco.in/u/${username}`);
        assert.equal(res.headers.get("X-Sentinel-Shield"), "active");
      }
    });

    it("does not treat reserved first-level route segments as student handles", () => {
      const mw = createMiddlewareInstance();
      const reservedRoutes = ["practice", "dsa", "dashboard", "admin", "career", "jobs", "problems", "projects"];

      for (const segment of reservedRoutes) {
        const req = new NextRequest(new URL(`https://edworldco.in/${segment}`));
        const res = mw.middleware(req);

        const location = res.headers.get("location");
        if (location) {
          assert.notEqual(
            location,
            `https://edworldco.in/u/${segment}`,
            `Reserved route /${segment} must NOT be redirected to /u/${segment}`
          );
        }
      }
    });

    it("verifies single-segment paths not in RESERVED_FIRST_LEVEL_ROUTES redirect to /u/:username", () => {
      const mw = createMiddlewareInstance();
      // Any first-level single segment path not in RESERVED_FIRST_LEVEL_ROUTES triggers the student handle redirect
      const candidateHandles = ["showcase", "feedback", "random_student_name"];

      for (const handle of candidateHandles) {
        const req = new NextRequest(new URL(`https://edworldco.in/${handle}`));
        const res = mw.middleware(req);

        assert.equal(res.status, 301, `Single-segment route /${handle} must 301 redirect to /u/${handle}`);
        assert.equal(res.headers.get("location"), `https://edworldco.in/u/${handle}`);
      }
    });

    it("verifies permanent redirects in next.config.mjs for /practice -> /dsa and /showcase -> /dsa", async () => {
      const nextConfigPath = path.join(rootDir, "next.config.mjs");
      const nextConfigContent = fs.readFileSync(nextConfigPath, "utf8");

      assert.ok(
        nextConfigContent.includes('source: "/practice"') && nextConfigContent.includes('destination: "/dsa"'),
        "next.config.mjs must contain permanent redirect for /practice -> /dsa"
      );
      assert.ok(
        nextConfigContent.includes('source: "/showcase"') && nextConfigContent.includes('destination: "/dsa"'),
        "next.config.mjs must contain permanent redirect for /showcase -> /dsa"
      );
      assert.ok(
        nextConfigContent.includes('source: "/problems"') && nextConfigContent.includes('destination: "/dsa"'),
        "next.config.mjs must contain redirect for /problems -> /dsa"
      );
      assert.ok(
        nextConfigContent.includes('source: "/projectstudio"') && nextConfigContent.includes('destination: "/projects"'),
        "next.config.mjs must contain redirect for /projectstudio -> /projects"
      );
    });

    it("redirects unauthenticated users attempting protected page routes to /login?redirectUrl=...", () => {
      const mw = createMiddlewareInstance();
      const protectedRoutes = ["/dashboard", "/employee", "/hr", "/founder", "/admin", "/profile"];

      for (const route of protectedRoutes) {
        const req = new NextRequest(new URL(`https://edworldco.in${route}`));
        const res = mw.middleware(req);

        assert.equal(res.status, 307, `Protected page ${route} should redirect to /login`);
        const location = res.headers.get("location");
        assert.ok(location.includes("/login?redirectUrl="));
        assert.ok(location.includes(encodeURIComponent(route)));
      }
    });
  });

  // ---------------------------------------------------------------------------
  // 5. Subdomain Routing & Sector Header Injection
  // ---------------------------------------------------------------------------
  describe("5. Subdomain Routing & Sector Header Injection", () => {
    it("rewrites root on career subdomains internally to /sector-landing/career", () => {
      const mw = createMiddlewareInstance();
      const careerHosts = [
        "career.edworldco.in",
        "career.edworld.co.in",
        "student.edworldco.in",
        "student.edworld.co.in",
        "working.edworldco.in",
        "career.localhost",
      ];

      for (const host of careerHosts) {
        const req = new NextRequest(new URL("https://placeholder.domain/"), {
          headers: { host },
        });
        const res = mw.middleware(req);

        const rewriteHeader = res.headers.get("x-middleware-rewrite");
        assert.ok(
          rewriteHeader && rewriteHeader.includes("/sector-landing/career"),
          `Host ${host} root must rewrite internally to /sector-landing/career, got: ${rewriteHeader}`
        );
        assert.equal(res.headers.get("X-Sentinel-Shield"), "active");
      }
    });

    it("redirects auth attempts from public career subdomain to main app domain", () => {
      const mw = createMiddlewareInstance({
        env: { NEXT_PUBLIC_APP_DOMAIN: "edworldco.in" },
      });

      const req = new NextRequest(new URL("https://placeholder.domain/login?ref=campus"), {
        headers: { host: "career.edworldco.in" },
      });
      const res = mw.middleware(req);

      assert.equal(res.status, 307);
      assert.equal(res.headers.get("location"), "https://edworldco.in/login?ref=campus");
    });

    it("rewrites root on learn subdomains internally to /learn", () => {
      const mw = createMiddlewareInstance();
      const learnHosts = ["learn.edworld.co.in", "learn.edworldco.in", "learn.localhost"];

      for (const host of learnHosts) {
        const req = new NextRequest(new URL("https://placeholder.domain/"), {
          headers: { host },
        });
        const res = mw.middleware(req);

        const rewriteHeader = res.headers.get("x-middleware-rewrite");
        assert.ok(
          rewriteHeader && rewriteHeader.includes("/learn"),
          `Host ${host} root must rewrite to /learn, got: ${rewriteHeader}`
        );
      }
    });

    it("rewrites nested course paths on learn subdomains internally to /learn/:path", () => {
      const mw = createMiddlewareInstance();
      const req = new NextRequest(new URL("https://placeholder.domain/dsa-mastery"), {
        headers: { host: "learn.edworld.co.in" },
      });
      const res = mw.middleware(req);

      const rewriteHeader = res.headers.get("x-middleware-rewrite");
      assert.ok(
        rewriteHeader && rewriteHeader.includes("/learn/dsa-mastery"),
        `Nested path on learn subdomain must rewrite to /learn/dsa-mastery, got: ${rewriteHeader}`
      );
    });
  });

  // ---------------------------------------------------------------------------
  // 6. x-internal-secret Authentication Header Verification
  // ---------------------------------------------------------------------------
  describe("6. x-internal-secret Authentication Header Verification", () => {
    const internalSecret = "live_prod_internal_service_secret_998877";

    it("rejects protected API requests with 401 when no auth session or secret is present", async () => {
      const mw = createMiddlewareInstance({
        env: { INTERNAL_SERVICE_SECRET: internalSecret },
      });

      const req = new NextRequest(new URL("https://edworldco.in/api/internal/system-task"));
      const res = mw.middleware(req);

      assert.equal(res.status, 401);
      assert.equal(res.headers.get("Cache-Control"), "no-store");

      const body = await res.json();
      assert.equal(body.success, false);
      assert.equal(body.error.code, "AUTH_REQUIRED");
      assert.ok(body.error.request_id);
    });

    it("rejects protected API requests with 401 when x-internal-secret does not match", async () => {
      const mw = createMiddlewareInstance({
        env: { INTERNAL_SERVICE_SECRET: internalSecret },
      });

      const req = new NextRequest(new URL("https://edworldco.in/api/internal/system-task"), {
        headers: { "x-internal-secret": "forged_secret_attempt" },
      });
      const res = mw.middleware(req);

      assert.equal(res.status, 401);
      const body = await res.json();
      assert.equal(body.error.code, "AUTH_REQUIRED");
    });

    it("strictly rejects requests when INTERNAL_SERVICE_SECRET is unset, preventing empty fallback bypasses", async () => {
      const mw = createMiddlewareInstance({
        env: { INTERNAL_SERVICE_SECRET: "" },
      });

      const req = new NextRequest(new URL("https://edworldco.in/api/internal/system-task"), {
        headers: { "x-internal-secret": "" },
      });
      const res = mw.middleware(req);

      assert.equal(res.status, 401);
      const body = await res.json();
      assert.equal(body.error.code, "AUTH_REQUIRED");
    });

    it("permits protected API requests when x-internal-secret exactly matches INTERNAL_SERVICE_SECRET", () => {
      const mw = createMiddlewareInstance({
        env: { INTERNAL_SERVICE_SECRET: internalSecret },
      });

      const req = new NextRequest(new URL("https://edworldco.in/api/internal/system-task"), {
        headers: { "x-internal-secret": internalSecret },
      });
      const res = mw.middleware(req);

      assert.equal(res.status, 200);
      assert.ok(res.headers.get("x-request-id"));
      assert.equal(res.headers.get("X-Sentinel-Shield"), "active");
    });

    it("permits protected API requests when authenticated via session cookie or bearer token", () => {
      const mw = createMiddlewareInstance({
        env: { INTERNAL_SERVICE_SECRET: internalSecret },
      });

      // 1. Session cookie authentication
      const reqCookie = new NextRequest(new URL("https://edworldco.in/api/user/profile"), {
        headers: { cookie: "edworld_session=sess_token_abc123" },
      });
      const resCookie = mw.middleware(reqCookie);
      assert.equal(resCookie.status, 200);

      // 2. Authorization Bearer header authentication
      const reqBearer = new NextRequest(new URL("https://edworldco.in/api/user/profile"), {
        headers: { authorization: "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." },
      });
      const resBearer = mw.middleware(reqBearer);
      assert.equal(resBearer.status, 200);
    });
  });

  // ---------------------------------------------------------------------------
  // 7. Security Headers & Defense Hardening
  // ---------------------------------------------------------------------------
  describe("7. Security Headers & Defense Hardening", () => {
    it("applies all mandatory security, anti-scraping, and CSP headers to responses", () => {
      const mw = createMiddlewareInstance();
      const req = new NextRequest(new URL("https://edworldco.in/"));
      const res = mw.middleware(req);

      assert.equal(res.headers.get("X-Frame-Options"), "DENY");
      assert.equal(res.headers.get("X-Content-Type-Options"), "nosniff");
      assert.equal(res.headers.get("X-XSS-Protection"), "1; mode=block");
      assert.equal(res.headers.get("Referrer-Policy"), "strict-origin-when-cross-origin");
      assert.ok(res.headers.get("Strict-Transport-Security").includes("max-age=31536000"));
      assert.equal(res.headers.get("Permissions-Policy"), "camera=(self), microphone=(self), geolocation=()");
      assert.equal(res.headers.get("X-Permitted-Cross-Domain-Policies"), "none");
      assert.equal(res.headers.get("X-Robots-Tag"), "noai, noimageai");
      assert.equal(res.headers.get("X-Sentinel-Shield"), "active");
      assert.equal(res.headers.get("X-Content-Security-Policy"), "default-src 'self'");
      assert.ok(res.headers.get("x-request-id"));
    });
  });

  // ---------------------------------------------------------------------------
  // 8. Coming Soon Gating & Environment Route Lockdown
  // ---------------------------------------------------------------------------
  describe("8. Coming Soon Gating & Environment Route Lockdown", () => {
    it("redirects unauthorized visitors to /?coming_soon=true when COMING_SOON_MODE is active", () => {
      const mw = createMiddlewareInstance({
        env: { COMING_SOON_MODE: "true" },
      });

      const req = new NextRequest(new URL("https://edworldco.in/dsa"));
      const res = mw.middleware(req);

      assert.equal(res.status, 307);
      assert.equal(res.headers.get("location"), "https://edworldco.in/?coming_soon=true");
    });

    it("allows coming-soon preview bypass via ?preview=true query parameter or cookie", () => {
      const mw = createMiddlewareInstance({
        env: { COMING_SOON_MODE: "true" },
      });

      // 1. Query parameter bypass
      const reqQuery = new NextRequest(new URL("https://edworldco.in/about?preview=true"));
      const resQuery = mw.middleware(reqQuery);
      assert.equal(resQuery.status, 200);

      // 2. Cookie bypass
      const reqCookie = new NextRequest(new URL("https://edworldco.in/about"), {
        headers: { cookie: "edw_preview=true" },
      });
      const resCookie = mw.middleware(reqCookie);
      assert.equal(resCookie.status, 200);
    });

    it("hides dev-only routes (/mobile, /styleguide) with 404 in production environment", () => {
      const mwProd = createMiddlewareInstance({
        env: { NODE_ENV: "production" },
      });

      const reqMobile = new NextRequest(new URL("https://edworldco.in/mobile"));
      const resMobile = mwProd.middleware(reqMobile);
      assert.equal(resMobile.status, 404);

      const reqStyleguide = new NextRequest(new URL("https://edworldco.in/styleguide"));
      const resStyleguide = mwProd.middleware(reqStyleguide);
      assert.equal(resStyleguide.status, 404);
    });
  });
});
