import test from "node:test";
import assert from "node:assert/strict";
import {
  validateRedirectDestination,
  getDefaultPortalForRole,
  resolvePostSignInDestination,
} from "../../src/lib/auth/redirect-validator.ts";

test("Post-Sign-In Redirect Validation & Sanitization", async (t) => {
  await t.test("Valid relative paths are preserved with query string and hash fragment", () => {
    assert.equal(
      validateRedirectDestination("/dsa?problem=two-sum#solution"),
      "/dsa?problem=two-sum#solution"
    );
    assert.equal(
      validateRedirectDestination("/interviews/results/1234?view=detailed"),
      "/interviews/results/1234?view=detailed"
    );
    assert.equal(
      validateRedirectDestination("/squads"),
      "/squads"
    );
    assert.equal(
      validateRedirectDestination("/daily"),
      "/daily"
    );
  });

  await t.test("Rejects external destinations and protocol bypasses", () => {
    assert.equal(validateRedirectDestination("https://malicious.com/phishing"), null);
    assert.equal(validateRedirectDestination("http://attacker.com"), null);
    assert.equal(validateRedirectDestination("//attacker.com/evil"), null);
    assert.equal(validateRedirectDestination("/\\attacker.com/evil"), null);
    assert.equal(validateRedirectDestination("javascript:alert(1)"), null);
    assert.equal(validateRedirectDestination("data:text/html,evil"), null);
  });

  await t.test("Rejects malformed inputs, control characters, and CRLF injections", () => {
    assert.equal(validateRedirectDestination(null), null);
    assert.equal(validateRedirectDestination(undefined), null);
    assert.equal(validateRedirectDestination(""), null);
    assert.equal(validateRedirectDestination("   "), null);
    assert.equal(validateRedirectDestination("/dsa\r\nSet-Cookie:evil=1"), null);
    assert.equal(validateRedirectDestination("/dsa\0evil"), null);
  });

  await t.test("Rejects destinations that loop back into sign-in or auth callback flows", () => {
    assert.equal(validateRedirectDestination("/login"), null);
    assert.equal(validateRedirectDestination("/signup"), null);
    assert.equal(validateRedirectDestination("/auth/login"), null);
    assert.equal(validateRedirectDestination("/auth/signup"), null);
    assert.equal(validateRedirectDestination("/auth/callback"), null);
    assert.equal(validateRedirectDestination("/auth/callback?code=xyz"), null);
    assert.equal(validateRedirectDestination("/auth/forgot-password"), null);
    assert.equal(validateRedirectDestination("/auth/reset-password"), null);
    assert.equal(validateRedirectDestination("/auth/verify-email"), null);
  });
});

test("Default Portal Resolutions by Role", async (t) => {
  await t.test("Default portal for students / clients is /dashboard", () => {
    assert.equal(getDefaultPortalForRole("CLIENT"), "/dashboard");
    assert.equal(getDefaultPortalForRole("student"), "/dashboard");
    assert.equal(getDefaultPortalForRole(undefined), "/dashboard");
  });

  await t.test("Default portal for admins is /admin", () => {
    assert.equal(getDefaultPortalForRole("ADMIN"), "/admin");
    assert.equal(getDefaultPortalForRole("SUPER_ADMIN"), "/admin");
  });

  await t.test("Default portal for HR is /hr", () => {
    assert.equal(getDefaultPortalForRole("HR"), "/hr");
  });

  await t.test("Default portal for Founder is /founder", () => {
    assert.equal(getDefaultPortalForRole("FOUNDER"), "/founder");
    assert.equal(getDefaultPortalForRole("EXECUTIVE"), "/founder");
  });

  await t.test("Default portal for College Admin is /colleges", () => {
    assert.equal(getDefaultPortalForRole("COLLEGE_ADMIN"), "/colleges");
    assert.equal(getDefaultPortalForRole("PLACEMENT_OFFICER"), "/colleges");
  });

  await t.test("Default portal for Employee is /employee", () => {
    assert.equal(getDefaultPortalForRole("EMPLOYEE"), "/employee");
  });
});

test("Post-Sign-In Routing Order: Onboarding vs Deep Links vs Roles", async (t) => {
  await t.test("Incomplete required onboarding sends student to /onboarding preserving deep link", () => {
    const res = resolvePostSignInDestination({
      role: "CLIENT",
      onboardingCompleted: false,
      requestedDestination: "/dsa?topic=graphs#graph-1",
    });

    assert.equal(res.requiresOnboarding, true);
    assert.equal(
      res.destination,
      "/onboarding?resume=%2Fdsa%3Ftopic%3Dgraphs%23graph-1"
    );
    assert.equal(res.preservedDestination, "/dsa?topic=graphs#graph-1");
  });

  await t.test("Completed onboarding resumes valid deep link", () => {
    const res = resolvePostSignInDestination({
      role: "CLIENT",
      onboardingCompleted: true,
      requestedDestination: "/squads?filter=python",
    });

    assert.equal(res.requiresOnboarding, false);
    assert.equal(res.destination, "/squads?filter=python");
  });

  await t.test("Completed onboarding falls back to /dashboard if no deep link provided", () => {
    const res = resolvePostSignInDestination({
      role: "CLIENT",
      onboardingCompleted: true,
      requestedDestination: null,
    });

    assert.equal(res.requiresOnboarding, false);
    assert.equal(res.destination, "/dashboard");
  });

  await t.test("Completed onboarding falls back to /dashboard if deep link was an auth loop or external", () => {
    const resAuthLoop = resolvePostSignInDestination({
      role: "CLIENT",
      onboardingCompleted: true,
      requestedDestination: "/auth/login?redirectUrl=/dashboard",
    });
    assert.equal(resAuthLoop.destination, "/dashboard");

    const resExternal = resolvePostSignInDestination({
      role: "CLIENT",
      onboardingCompleted: true,
      requestedDestination: "https://evil.com/phish",
    });
    assert.equal(resExternal.destination, "/dashboard");
  });

  await t.test("Role-restricted pages fallback to authorized default portal for unauthorized roles", () => {
    // Student trying to deep link to /admin
    const resStudentToAdmin = resolvePostSignInDestination({
      role: "CLIENT",
      onboardingCompleted: true,
      requestedDestination: "/admin/ambassadors",
    });
    assert.equal(resStudentToAdmin.destination, "/dashboard");

    // Student trying to deep link to /hr
    const resStudentToHr = resolvePostSignInDestination({
      role: "CLIENT",
      onboardingCompleted: true,
      requestedDestination: "/hr/provision-account",
    });
    assert.equal(resStudentToHr.destination, "/dashboard");

    // Admin allowed to deep link to /admin
    const resAdminToAdmin = resolvePostSignInDestination({
      role: "ADMIN",
      onboardingCompleted: true,
      requestedDestination: "/admin/ambassadors",
    });
    assert.equal(resAdminToAdmin.destination, "/admin/ambassadors");
  });
});
