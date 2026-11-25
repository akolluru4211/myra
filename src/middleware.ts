import { NextRequest, NextResponse } from "next/server";
import { evaluateFirewall } from "@/lib/firewall/waf";
import { verifyPreviewToken } from "@/lib/auth/preview-token";
import { validateSession } from "@/lib/auth/session-validator";

// Subdomain to Sector Map (Main App handles Career track; Junior/Explorer deployed standalone)
const SUBDOMAIN_SECTOR_MAP: Record<string, string> = {
  "career.edworldco.in": "career",
  "career.edworld.co.in": "career",
  "student.edworldco.in": "career",
  "student.edworld.co.in": "career",
  "working.edworldco.in": "career",
  "working.edworld.co.in": "career",
  // Local development / test aliases
  "career.localhost": "career",
  "student.localhost": "career",
  "working.localhost": "career",
};

// Learn Academy Subdomains
const LEARN_SUBDOMAINS = [
  "learn.edworld.co.in",
  "learn.edworldco.in",
  "learn.localhost",
];

// EdMail Webmail Subdomains
const MAILS_SUBDOMAINS = [
  "edmail.edworld.co.in",
  "edmail.edworldco.in",
  "edmail.localhost",
  "mails.edworld.co.in",
  "mails.edworldco.in",
  "mails.localhost",
  "mail.edworld.co.in",
  "mail.localhost",
];

// Exact public pages (only match exact path)
const EXACT_PUBLIC_PAGES = new Set([
  "/",
  "/login",
  "/signup",
  "/privacy",
  "/terms",
  "/cookies",
  "/refund",
  "/feedback",
  "/about",
  "/contact",
  "/pricing",
  "/opportunities",
  "/learn",
  "/colleges",
  "/network",
  "/newsletter",
  "/consent/verify",
  "/for/students",
  "/for/colleges",
  "/for/professionals",
  "/for-career",
  "/for-college",
  "/for-professionals",
]);

// Segment-aware public page prefixes (must match exact segment boundary, e.g. /auth/..., /u/...)
const SEGMENT_PUBLIC_PREFIXES = [
  "/auth/",
  "/for/",
  "/sector/",
  "/sector-landing/",
  "/verify/",
  "/certificate/",
  "/u/",
  "/portfolio/",
];

// Exact public API endpoints
const EXACT_PUBLIC_APIS = new Set([
  "/api/auth/login",
  "/api/auth/signup",
  "/api/auth/otp/send",
  "/api/auth/otp/verify",
  "/api/auth/forgot-password",
  "/api/auth/reset-password",
  "/api/auth/logout",
  "/api/auth/session",
  "/api/profile/check-username",
  "/api/profile/public",
  "/api/health",
  "/api/landing",
  "/api/billing/webhook",
  "/api/jobs/maintenance",
  "/api/security/sentinel",
  "/api/career/paths",
  "/api/events",
  "/api/opportunities",
  "/api/interview/tts",
  "/api/interview/turn",
  "/api/interview/question-bank",
  "/api/ai/myra",
  "/api/ai/ocr",
  "/api/learn",
  "/api/certificates",
  "/api/feature-flags",
  "/api/edmail/check-username",
  "/api/edmail/inbound-webhook",
  "/api/edmail/health",
  "/api/consent/verify",
  "/api/audit/log",
]);

// Segment-aware public API prefixes
const SEGMENT_PUBLIC_API_PREFIXES = [
  "/api/auth/",
  "/api/profile/public/",
  "/api/interview/turn/",
  "/api/interview/question-bank/",
  "/api/learn/",
  "/api/certificates/",
];

/**
 * Checks if a given pathname is an authorized public page.
 * Uses exact matching for standalone pages and strict segment-boundary matching for page families.
 */
function isPublicPagePath(path: string): boolean {
  if (EXACT_PUBLIC_PAGES.has(path)) {
    return true;
  }
  for (const prefix of SEGMENT_PUBLIC_PREFIXES) {
    if (path === prefix.slice(0, -1) || path.startsWith(prefix)) {
      return true;
    }
  }
  return false;
}

/**
 * Checks if a given pathname is a public API route.
 */
function isPublicApiPath(path: string): boolean {
  if (EXACT_PUBLIC_APIS.has(path)) {
    return true;
  }
  for (const prefix of SEGMENT_PUBLIC_API_PREFIXES) {
    if (path === prefix.slice(0, -1) || path.startsWith(prefix)) {
      return true;
    }
  }
  return false;
}

// Apply hardened security, anti-AI-scraping & data protection headers to responses
function applySecurityHeaders(res: NextResponse, requestId: string): NextResponse {
  res.headers.set("x-request-id", requestId);
  res.headers.set("X-Frame-Options", "DENY");
  res.headers.set("X-Content-Type-Options", "nosniff");
  res.headers.set("X-XSS-Protection", "1; mode=block");
  res.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  res.headers.set("Strict-Transport-Security", "max-age=31536000; includeSubDomains; preload");
  res.headers.set("Permissions-Policy", "camera=(self), microphone=(self), geolocation=()");
  res.headers.set("X-Permitted-Cross-Domain-Policies", "none");
  res.headers.set("X-Robots-Tag", "noai, noimageai");
  res.headers.set("X-Sentinel-Shield", "active");
  const contentSecurityPolicy = [
    "default-src 'self'",
    "style-src 'self' 'unsafe-inline'",
    "font-src 'self' data:",
    "img-src 'self' data: https:",
  ];
  if (process.env.NODE_ENV === "development" && process.env.LOCAL_NEXT_PREVIEW === "true") {
    // Next.js development uses inline hydration scripts and webpack eval-based source maps.
    contentSecurityPolicy.push("script-src 'self' 'unsafe-inline' 'unsafe-eval'");
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    if (supabaseUrl && URL.canParse(supabaseUrl)) {
      const { origin, protocol } = new URL(supabaseUrl);
      if (protocol === "https:" || protocol === "http:") {
        contentSecurityPolicy.push(`connect-src 'self' ${origin}`);
      }
    }
  }
  res.headers.set("Content-Security-Policy", contentSecurityPolicy.join("; ") + ";");
  return res;
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

export async function middleware(req: NextRequest) {
  const originalPathname = req.nextUrl.pathname;

  // Generate standardized request ID via crypto.randomUUID()
  const trustedUpstreamHeader = req.headers.get("x-trusted-trace-id");
  let requestId: string;
  if (trustedUpstreamHeader && /^[a-zA-Z0-9_\-.]{8,64}$/.test(trustedUpstreamHeader)) {
    requestId = trustedUpstreamHeader;
  } else {
    requestId = typeof crypto !== "undefined" && typeof crypto.randomUUID === "function"
      ? crypto.randomUUID()
      : `req-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
  }

  // 1. Always allow static files, internal Next.js assets, and favicon
  if (
    originalPathname.startsWith("/_next") ||
    originalPathname.startsWith("/images") ||
    originalPathname.startsWith("/extensions") ||
    originalPathname.startsWith("/favicon.ico") ||
    originalPathname.startsWith("/sitemap.xml") ||
    originalPathname.startsWith("/robots.txt")
  ) {
    const res = NextResponse.next({
      request: {
        headers: new Headers(req.headers),
      },
    });
    res.headers.set("x-request-id", requestId);
    return res;
  }

  // 2. Web Application Firewall (WAF) Request Inspection
  const wafResult = evaluateFirewall(req);
  if (wafResult.blocked) {
    console.warn(`[WAF Blocked] Request ID: ${requestId} | Method: ${req.method} | Path: ${originalPathname} | Threat: ${wafResult.threatType} | Reason: ${wafResult.reason}`);

    const isApi = originalPathname.startsWith("/api");
    if (isApi) {
      const blockedRes = NextResponse.json(
        {
          success: false,
          error: {
            code: "FIREWALL_BLOCKED",
            message: "Request blocked by security firewall.",
            threat_type: wafResult.threatType,
            risk_score: wafResult.riskScore || 90,
            request_id: requestId,
          },
        },
        { status: wafResult.statusCode || 403 }
      );
      return applySecurityHeaders(blockedRes, requestId);
    } else {
      const escapedRequestId = escapeHtml(requestId);
      const blockedHtml = `<!DOCTYPE html><html lang="en"><head><meta charset="utf-8"><title>Request Blocked | Edworld Co</title><meta name="viewport" content="width=device-width, initial-scale=1"><style>body{background:#ffffff;color:#0f172a;font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,sans-serif;display:flex;align-items:center;justify-content:center;min-height:100vh;margin:0;padding:24px}.box{max-width:480px;width:100%;background:#f8fafc;border:1px solid #e2e8f0;border-radius:24px;padding:32px;text-align:center;box-shadow:0 10px 25px -5px rgba(0,0,0,0.05)}h1{font-size:20px;font-weight:800;color:#0f172a;margin:0 0 8px;letter-spacing:-0.02em}p{font-size:13px;color:#475569;line-height:1.6;margin:0 0 20px}.card{background:#ffffff;border:1px solid #cbd5e1;border-radius:14px;padding:12px;margin-bottom:20px;font-size:12px;color:#334155;word-break:break-all}.label{font-weight:700;color:#64748b;font-size:10px;text-transform:uppercase;letter-spacing:0.05em;margin-bottom:4px}code{font-family:ui-monospace,SFMono-Regular,Menlo,Monaco,Consolas,monospace;font-size:11px;color:#2563eb;font-weight:600}.btn{display:inline-block;padding:10px 20px;border-radius:12px;background:#2563eb;color:#ffffff;text-decoration:none;font-size:12px;font-weight:700;transition:background 0.15s ease}.btn:hover{background:#1d4ed8}</style></head><body><div class="box"><h1>Request Blocked</h1><p>Our security system paused this request to protect your student account. If you believe this is a mistake, please share this reference ID with support.</p><div class="card"><div class="label">Reference ID</div><code>${escapedRequestId}</code></div><div><a href="/" class="btn">Return Home</a></div></div></body></html>`;

      const blockedRes = new NextResponse(blockedHtml, {
        status: wafResult.statusCode || 403,
        headers: { "Content-Type": "text/html" },
      });
      return applySecurityHeaders(blockedRes, requestId);
    }
  }

  // ---------------------------------------------------------------------------
  // 3. Resolve Recognized Subdomain & Effective Destination
  // ---------------------------------------------------------------------------
  const rawHost = req.headers.get("x-forwarded-host") || req.headers.get("host") || "";
  const host = rawHost.toLowerCase().split(":")[0];
  const matchedSector = SUBDOMAIN_SECTOR_MAP[host];

  let effectivePathname = originalPathname;
  let subdomainRewriteTarget: string | null = null;
  let subdomainRedirectUrl: string | null = null;

  if (matchedSector) {
    if (originalPathname === "/" || originalPathname === "") {
      effectivePathname = `/sector-landing/${matchedSector}`;
      subdomainRewriteTarget = effectivePathname;
    } else if (originalPathname === "/login" || originalPathname === "/signup" || originalPathname.startsWith("/auth")) {
      const appDomain = process.env.NEXT_PUBLIC_APP_DOMAIN || "edworldco.in";
      const isLocal = host.endsWith(".localhost");
      if (!isLocal) {
        subdomainRedirectUrl = `https://${appDomain}${originalPathname}${req.nextUrl.search}`;
      }
    }
  } else if (LEARN_SUBDOMAINS.includes(host)) {
    if (originalPathname === "/" || originalPathname === "") {
      effectivePathname = "/learn";
      subdomainRewriteTarget = "/learn";
    } else if (
      !originalPathname.startsWith("/learn") &&
      !originalPathname.startsWith("/api") &&
      !originalPathname.startsWith("/verify") &&
      !originalPathname.startsWith("/certificate")
    ) {
      effectivePathname = `/learn${originalPathname}`;
      subdomainRewriteTarget = effectivePathname;
    }
  } else if (MAILS_SUBDOMAINS.includes(host)) {
    if (originalPathname === "/" || originalPathname === "") {
      effectivePathname = "/edmail";
      subdomainRewriteTarget = "/edmail";
    } else if (
      !originalPathname.startsWith("/edmail") &&
      !originalPathname.startsWith("/api")
    ) {
      effectivePathname = `/edmail${originalPathname}`;
      subdomainRewriteTarget = effectivePathname;
    }
  }

  // If subdomain auth requires cross-domain redirect, dispatch before gating
  if (subdomainRedirectUrl) {
    return NextResponse.redirect(subdomainRedirectUrl);
  }

  // 4. Dev-Only Routes: Hide in production
  if (
    process.env.NODE_ENV === "production" &&
    (effectivePathname === "/mobile" ||
      effectivePathname.startsWith("/mobile/") ||
      effectivePathname === "/styleguide" ||
      effectivePathname.startsWith("/styleguide/"))
  ) {
    const notFoundRes = new NextResponse("Not Found", { status: 404 });
    return applySecurityHeaders(notFoundRes, requestId);
  }

  // ---------------------------------------------------------------------------
  // 5. Coming Soon Launch Gating & Secure Staff Preview
  // ---------------------------------------------------------------------------
  const isComingSoonActive =
    process.env.COMING_SOON_MODE === "true" ||
    process.env.NEXT_PUBLIC_COMING_SOON === "true";

  // Check verified staff preview access:
  // 1. Signed-in staff session with authorized role (SUPPORT, REVIEWER, ADMIN, SUPER_ADMIN, FOUNDER)
  // 2. Server-validated, signed, non-expired preview token (passed via cookie or ?preview_token=)
  let isAuthorizedPreview = false;

  const sessionToken =
    req.cookies.get("edworld_session")?.value ||
    req.headers.get("authorization")?.replace(/^Bearer\s+/i, "");

  if (sessionToken) {
    try {
      const sess = validateSession(sessionToken);
      if (sess.valid && sess.role) {
        const staffRoles = ["SUPPORT", "REVIEWER", "ADMIN", "SUPER_ADMIN", "FOUNDER", "EXECUTIVE"];
        if (staffRoles.includes(sess.role.toUpperCase())) {
          isAuthorizedPreview = true;
        }
      }
    } catch {}
  }

  // If not verified via staff session, verify signed preview token
  if (!isAuthorizedPreview) {
    const previewQueryToken = req.nextUrl.searchParams.get("preview_token") || req.nextUrl.searchParams.get("preview");
    const previewCookieToken = req.cookies.get("edw_preview_token")?.value || req.cookies.get("edw_preview")?.value;
    const tokenToVerify = previewQueryToken || previewCookieToken;

    if (tokenToVerify) {
      // Check if signed token
      const tokenVerification = await verifyPreviewToken(tokenToVerify);
      if (tokenVerification.valid) {
        isAuthorizedPreview = true;
      } else if (process.env.NODE_ENV !== "production" && process.env.ALLOW_UNSIGNED_PREVIEWS === "true" && (tokenToVerify === "true" || tokenToVerify === "1")) {
        // Backwards compatibility for dev/staging environments with explicit flag
        isAuthorizedPreview = true;
      }
    }
  }

  // Determine if effective destination is an intentionally exempt route
  const isGateExemptRoute =
    effectivePathname === "/admin" ||
    effectivePathname.startsWith("/admin/") ||
    effectivePathname === "/login" ||
    effectivePathname === "/signup" ||
    effectivePathname.startsWith("/auth/") ||
    effectivePathname.startsWith("/api/auth/") ||
    effectivePathname === "/api/feature-flags" ||
    effectivePathname === "/api/health";

  if (isComingSoonActive && !isAuthorizedPreview && !isGateExemptRoute) {
    if (originalPathname === "/" && !subdomainRewriteTarget) {
      const reqHeaders = new Headers(req.headers);
      reqHeaders.set("x-coming-soon-gated", "true");
      const res = NextResponse.next({ request: { headers: reqHeaders } });
      return applySecurityHeaders(res, requestId);
    }

    const gateRedirectUrl = new URL("/?coming_soon=true", req.url);
    const gateRes = NextResponse.redirect(gateRedirectUrl);
    return applySecurityHeaders(gateRes, requestId);
  }

  // ---------------------------------------------------------------------------
  // 6. Subdomain Rewrite Execution (Applies only AFTER Coming Soon checks pass)
  // ---------------------------------------------------------------------------
  if (subdomainRewriteTarget) {
    // Preserve query parameters on rewrites
    const rewriteUrl = new URL(subdomainRewriteTarget, req.url);
    rewriteUrl.search = req.nextUrl.search;
    const res = NextResponse.rewrite(rewriteUrl);
    return applySecurityHeaders(res, requestId);
  }

  // ---------------------------------------------------------------------------
  // 7. Route Normalization & Legacy Recovery Redirects
  // ---------------------------------------------------------------------------
  if (originalPathname === "/") {
    const res = NextResponse.next();
    return applySecurityHeaders(res, requestId);
  }

  // Temporary recovery redirects for legacy /u/ destinations (preserve query string)
  if (originalPathname === "/u/squads") {
    const recoveryUrl = new URL("/squads", req.url);
    recoveryUrl.search = req.nextUrl.search;
    const res = NextResponse.redirect(recoveryUrl, 307);
    return applySecurityHeaders(res, requestId);
  }
  if (originalPathname === "/u/daily") {
    const recoveryUrl = new URL("/daily", req.url);
    recoveryUrl.search = req.nextUrl.search;
    const res = NextResponse.redirect(recoveryUrl, 307);
    return applySecurityHeaders(res, requestId);
  }

  // ---------------------------------------------------------------------------
  // 8. Public vs. Protected Destination Matching
  // ---------------------------------------------------------------------------
  const isPublicPage = isPublicPagePath(effectivePathname);

  if (isPublicPage) {
    const res = NextResponse.next();
    return applySecurityHeaders(res, requestId);
  }

  // 9. API Routes Check
  if (effectivePathname.startsWith("/api")) {
    const isPublicApi = isPublicApiPath(effectivePathname);
    if (isPublicApi) {
      const res = NextResponse.next();
      return applySecurityHeaders(res, requestId);
    }

    // Protected API: Check for session cookie, authorization bearer token, or internal service secret
    const hasSessionCookie =
      req.cookies.has("edworld_session") ||
      req.cookies.has("sb-access-token") ||
      req.cookies.has("edworld_auth");

    const internalSecret = process.env.INTERNAL_SERVICE_SECRET;
    const hasInternalAuth =
      !!internalSecret && req.headers.get("x-internal-secret") === internalSecret;
    const hasBearerToken = req.headers.has("authorization");

    if (!hasSessionCookie && !hasBearerToken && !hasInternalAuth) {
      const errRes = NextResponse.json(
        {
          success: false,
          error: {
            code: "AUTH_REQUIRED",
            message: "Unauthorized: Valid authentication session required to access this resource.",
            request_id: requestId,
          },
        },
        {
          status: 401,
          headers: {
            "x-request-id": requestId,
            "Cache-Control": "no-store",
          },
        }
      );
      return applySecurityHeaders(errRes, requestId);
    }

    const reqHeaders = new Headers(req.headers);
    reqHeaders.set("x-request-id", requestId);
    const res = NextResponse.next({ request: { headers: reqHeaders } });
    return applySecurityHeaders(res, requestId);
  }

  // 10. Protected Page Routes (/dashboard, /employee, /hr, /founder, /admin, /profile, etc.)
  const clientAuthSession =
    req.cookies.get("edworld_session")?.value ||
    req.cookies.get("sb-access-token")?.value ||
    req.cookies.get("edworld_auth")?.value;

  if (!clientAuthSession) {
    // Unauthenticated user attempting protected route: Redirect immediately to /login preserving query
    const loginUrl = new URL("/login", req.url);
    const fullOriginalDestination = `${originalPathname}${req.nextUrl.search}`;
    loginUrl.searchParams.set("redirectUrl", fullOriginalDestination);
    return NextResponse.redirect(loginUrl);
  }

  const response = NextResponse.next();
  return applySecurityHeaders(response, requestId);
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for static files
     */
    "/((?!_next/static|_next/image|favicon.ico).*)",
  ],
};
