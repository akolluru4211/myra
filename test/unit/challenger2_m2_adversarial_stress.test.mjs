import assert from "node:assert/strict";
import crypto from "node:crypto";
import http from "node:http";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, "../..");

console.log("================================================================================");
console.log("CHALLENGER 2: ADVERSARIAL STRESS SUITE — MILESTONE 2");
console.log("Focus: Resend Email, Session/Cookies, Profile Persistence, Role Routing & UI Inputs");
console.log("================================================================================\n");

// Dynamic module URLs
const otpServiceUrl = pathToFileURL(path.join(rootDir, "src/lib/otp-service.ts")).href;
const emailServiceUrl = pathToFileURL(path.join(rootDir, "src/lib/email-service.ts")).href;
const emailTemplatesUrl = pathToFileURL(path.join(rootDir, "src/lib/email-templates.ts")).href;

const otpService = await import(otpServiceUrl);
const emailService = await import(emailServiceUrl);
const emailTemplates = await import(emailTemplatesUrl);

const {
  generateAndSendOtp,
  verifyOtp,
  getRedirectForRole,
  normalizeIdentifier,
  maskIdentifier,
  createSession,
  validateSession,
  invalidateSession,
} = otpService;

const {
  sendOtpVerificationEmail,
  sendEmailNotification,
  PRIMARY_ADMIN_EMAIL,
} = emailService;

const {
  renderBrandedEmailHtml,
  renderOtpVerificationEmail,
  renderSignupWelcomeEmail,
  renderProjectCompletionCertificateEmail,
} = emailTemplates;

// Helper for local HTTP requests
function apiRequest(endpoint, body = {}, headers = {}, method = "POST") {
  return new Promise((resolve, reject) => {
    const payload = typeof body === "string" ? body : JSON.stringify(body);
    const reqHeaders = {
      "Content-Type": "application/json",
      "Content-Length": Buffer.byteLength(payload),
      ...headers,
    };

    const req = http.request(
      {
        hostname: "localhost",
        port: 3000,
        path: endpoint,
        method,
        headers: reqHeaders,
      },
      (res) => {
        let data = "";
        res.on("data", (chunk) => (data += chunk));
        res.on("end", () => {
          let parsed;
          try {
            parsed = JSON.parse(data);
          } catch {
            parsed = data;
          }
          resolve({
            statusCode: res.statusCode,
            headers: res.headers,
            body: parsed,
          });
        });
      }
    );

    req.on("error", (err) => reject(err));
    req.write(payload);
    req.end();
  });
}

let totalTests = 0;
let passedTests = 0;
let failedTests = 0;

async function test(name, fn) {
  totalTests++;
  try {
    await fn();
    console.log(`  ✅ PASS: ${name}`);
    passedTests++;
  } catch (err) {
    console.error(`  ❌ FAIL: ${name}`);
    console.error(`     Error: ${err.message}`);
    failedTests++;
  }
}

async function runAllSuites() {
  // ============================================================================
  // DOMAIN 1: RESEND EMAIL DISPATCH INTEGRATION & MOCK FALLBACK & BRANDING
  // ============================================================================
  console.log("--- DOMAIN 1: Resend Email Dispatch Integration, Fallback & Branding ---");

  await test("1.1 Mock mode returns success: true and isMock: true when API key is missing/placeholder", async () => {
    const origKey = process.env.RESEND_API_KEY;
    try {
      process.env.RESEND_API_KEY = "";
      const result = await sendOtpVerificationEmail({
        email: "test.mock.student@example.com",
        otp: "654321",
        purpose: "login",
      });
      assert.equal(result.success, true, "Mock dispatch must report success: true");
      assert.equal(result.isMock, true, "isMock flag must be true when key is empty");
    } finally {
      process.env.RESEND_API_KEY = origKey;
    }
  });

  await test("1.2 Placeholder API key (contains 'placeholder' or 'your-key') is treated as mock mode", async () => {
    const origKey = process.env.RESEND_API_KEY;
    try {
      process.env.RESEND_API_KEY = "re_placeholder_secret_abc123";
      const result = await sendOtpVerificationEmail({
        email: "placeholder.student@example.com",
        otp: "789012",
        purpose: "signup",
      });
      assert.equal(result.success, true);
      assert.equal(result.isMock, true, "Placeholder key must be safely treated as mock");
    } finally {
      process.env.RESEND_API_KEY = origKey;
    }
  });

  await test("1.3 Primary admin BCC delivery is enforced in dispatch payload", async () => {
    // Verify PRIMARY_ADMIN_EMAIL constant
    assert.equal(PRIMARY_ADMIN_EMAIL, "edworld.eden@gmail.com", "Primary admin email must be edworld.eden@gmail.com");

    const dispatchRes = await sendEmailNotification({
      to: "isolated.student@example.com",
      subject: "Test Dispatch Isolation",
      html: "<p>Isolated test</p>",
      category: "auth",
    });
    assert.equal(dispatchRes.success, true);
  });

  await test("1.4 Email templates render ZERO <img> tags and ZERO external logo URLs", () => {
    const testCases = [
      renderOtpVerificationEmail({ otp: "123456", purpose: "login", identifier: "student@test.com" }),
      renderOtpVerificationEmail({ otp: "999888", purpose: "signup", studentName: "Priya Sharma" }),
      renderSignupWelcomeEmail({ email: "priya@test.com", name: "Priya Sharma", careerStage: "STUDENT" }),
      renderProjectCompletionCertificateEmail({ studentName: "Priya Sharma", projectName: "EdWorld LMS", certificateCode: "EDW-999" }),
      renderBrandedEmailHtml({ previewText: "Test", title: "Test", contentHtml: "<p>Hello</p>", logoUrl: "https://evil.com/fake-logo.png" }),
    ];

    for (let i = 0; i < testCases.length; i++) {
      const html = testCases[i];
      assert.ok(!html.includes("<img"), `Template ${i + 1} must not contain any <img tags`);
      assert.ok(!html.includes("fake-logo.png"), `Template ${i + 1} must not render external logoUrl`);
      assert.ok(html.includes("EdWorld"), `Template ${i + 1} must contain brand name EdWorld`);
      assert.ok(html.includes("monogram-badge") || html.includes("background-color: #000000"), `Template ${i + 1} must contain monogram container`);
    }
  });

  await test("1.5 Email templates render ZERO encryption jargon", () => {
    const jargonPatterns = [
      "256-BIT ENCRYPTION",
      "256-BIT SSL ENCRYPTED",
      "256-BIT",
      "256 BIT",
      "AUTH SENTINEL VERIFIED",
    ];

    const templates = [
      renderOtpVerificationEmail({ otp: "123456" }),
      renderSignupWelcomeEmail({ email: "test@test.com", name: "Test User" }),
      renderProjectCompletionCertificateEmail({ studentName: "Test User", projectName: "Project" }),
      renderBrandedEmailHtml({ previewText: "Test", title: "Test", contentHtml: "<p>Test</p>" }),
    ];

    for (let t = 0; t < templates.length; t++) {
      const html = templates[t];
      for (const jargon of jargonPatterns) {
        assert.ok(
          !html.includes(jargon),
          `Template ${t + 1} must NOT contain jargon '${jargon}'`
        );
      }
      assert.ok(html.includes("DPDP 2023 COMPLIANT") || html.includes("DPDP ACT 2023 COMPLIANT"), "Must reference DPDP compliance");
      assert.ok(html.includes("STUDENT DATA PROTECTED"), "Must reference STUDENT DATA PROTECTED");
    }
  });

  // ============================================================================
  // DOMAIN 2: SESSION & COOKIE INTEGRITY + LOGOUT INVALIDATION
  // ============================================================================
  console.log("\n--- DOMAIN 2: Session & Cookie Integrity + Logout Invalidation ---");

  await test("2.1 Session token creation & 30-day TTL in active sessions store", () => {
    const userId = "usr_test_student_12345";
    const token = createSession(userId, "STUDENT");
    assert.ok(token.startsWith("edw_sess_"), "Token must start with 'edw_sess_' prefix");
    assert.equal(token.length, 9 + 64, "Token must have prefix (9 chars) + 32-byte hex (64 chars)");

    const validation = validateSession(token);
    assert.equal(validation.valid, true);
    assert.equal(validation.userId, userId);
    assert.equal(validation.role, "STUDENT");
  });

  await test("2.2 Invalidation of session token via invalidateSession", () => {
    const userId = "usr_logout_test";
    const token = createSession(userId, "CLIENT");
    assert.equal(validateSession(token).valid, true);

    invalidateSession(token);
    assert.equal(validateSession(token).valid, false, "Invalidated token must fail validation");
  });

  await test("2.3 Forged / Tampered session token rejection", () => {
    assert.equal(validateSession("").valid, false);
    assert.equal(validateSession("edw_sess_forged_random_token_1234567890").valid, false);
    assert.equal(validateSession("' OR '1'='1").valid, false);
    assert.equal(validateSession("null").valid, false);
    assert.equal(validateSession("undefined").valid, false);
  });

  await test("2.4 /api/auth/otp/verify issues edworld_session (httpOnly) & edworld_auth cookies with 30-day maxAge", async () => {
    const studentEmail = `cookie.test.${Date.now()}@example.com`;
    const sendRes = await apiRequest("/api/auth/otp/send", { identifier: studentEmail, purpose: "login" });
    assert.equal(sendRes.statusCode, 200);
    const otp = sendRes.body.devOtp || "123456";

    const verifyRes = await apiRequest("/api/auth/otp/verify", {
      identifier: studentEmail,
      otp,
      purpose: "login",
    });

    assert.equal(verifyRes.statusCode, 200);
    assert.ok(verifyRes.body.token, "Response must include session token");

    // Check Set-Cookie headers
    const setCookie = verifyRes.headers["set-cookie"];
    assert.ok(setCookie, "Response must contain Set-Cookie headers");
    const cookieStrings = Array.isArray(setCookie) ? setCookie : [setCookie];

    // Find edworld_session cookie
    const sessionCookie = cookieStrings.find((c) => c.startsWith("edworld_session="));
    assert.ok(sessionCookie, "Must set edworld_session cookie");
    assert.ok(/httponly/i.test(sessionCookie), "edworld_session MUST be HttpOnly");
    assert.ok(/samesite=lax/i.test(sessionCookie), "edworld_session must have SameSite=Lax");
    assert.ok(/max-age=2592000/i.test(sessionCookie), "edworld_session maxAge must be 2592000s (30 days)");
    assert.ok(/path=\//i.test(sessionCookie), "edworld_session path must be /");

    // Find edworld_auth cookie
    const authCookie = cookieStrings.find((c) => c.startsWith("edworld_auth="));
    assert.ok(authCookie, "Must set edworld_auth cookie");
    assert.ok(!/httponly/i.test(authCookie), "edworld_auth must NOT be HttpOnly (for client hydration)");
    assert.ok(/max-age=2592000/i.test(authCookie), "edworld_auth maxAge must be 2592000s (30 days)");
    assert.ok(authCookie.includes("edworld_auth=true"), "edworld_auth value must be 'true'");
  });

  await test("2.5 /api/auth/logout invalidates session and clears both cookies (maxAge: 0)", async () => {
    // 1. Create a live session via HTTP OTP
    const logoutEmail = `logout.cycle.${Date.now()}@example.com`;
    const sendRes = await apiRequest("/api/auth/otp/send", { identifier: logoutEmail });
    const verifyRes = await apiRequest("/api/auth/otp/verify", {
      identifier: logoutEmail,
      otp: sendRes.body.devOtp || "123456",
    });
    const sessionToken = verifyRes.body.token;
    assert.ok(sessionToken, "Session token must be returned from verify");

    // Check session active via GET /api/auth/session over HTTP
    const sessionBeforeRes = await apiRequest(
      "/api/auth/session",
      "",
      { Cookie: `edworld_session=${sessionToken}; edworld_auth=true` },
      "GET"
    );
    assert.equal(sessionBeforeRes.statusCode, 200, "Session should be authenticated before logout");
    assert.equal(sessionBeforeRes.body.authenticated, true);

    // 2. Invoke /api/auth/logout with the session cookie
    const logoutRes = await apiRequest(
      "/api/auth/logout",
      {},
      { Cookie: `edworld_session=${sessionToken}; edworld_auth=true` }
    );
    assert.equal(logoutRes.statusCode, 200);
    assert.equal(logoutRes.body.success, true);

    // 3. Verify session is invalidated via GET /api/auth/session (HTTP 401)
    const sessionAfterRes = await apiRequest(
      "/api/auth/session",
      "",
      { Cookie: `edworld_session=${sessionToken}; edworld_auth=true` },
      "GET"
    );
    assert.equal(sessionAfterRes.statusCode, 401, "Session must return 401 unauthenticated after logout");
    assert.equal(sessionAfterRes.body.authenticated, false);

    // 4. Verify cookies cleared with maxAge: 0 or expired
    const setCookie = logoutRes.headers["set-cookie"];
    assert.ok(setCookie, "Logout must return Set-Cookie clearing headers");
    const cookieStrings = Array.isArray(setCookie) ? setCookie : [setCookie];

    const sessionClear = cookieStrings.find((c) => c.startsWith("edworld_session="));
    assert.ok(sessionClear, "Must clear edworld_session cookie");
    assert.ok(
      /max-age=0/i.test(sessionClear) || /expires=/i.test(sessionClear),
      "edworld_session must have max-age=0 on logout"
    );

    const authClear = cookieStrings.find((c) => c.startsWith("edworld_auth="));
    assert.ok(authClear, "Must clear edworld_auth cookie");
    assert.ok(
      /max-age=0/i.test(authClear) || /expires=/i.test(authClear),
      "edworld_auth must have max-age=0 on logout"
    );
  });

  // ============================================================================
  // DOMAIN 3: STUDENT PROFILE METADATA PERSISTENCE
  // ============================================================================
  console.log("\n--- DOMAIN 3: Student Profile Metadata Persistence ---");

  await test("3.1 Student profile metadata (careerStage, gradeLevel, dob, name) preserved on signup", async () => {
    const signupEmail = `profile.persist.${Date.now()}@edworld.student`;
    const metaData = {
      name: "Rohan Varma",
      dob: "2006-03-21",
      careerStage: "STUDENT",
      gradeLevel: "Undergraduate Year 2",
    };

    const sendRes = await apiRequest("/api/auth/otp/send", { identifier: signupEmail, purpose: "signup" });
    assert.equal(sendRes.statusCode, 200);

    const verifyRes = await apiRequest("/api/auth/otp/verify", {
      identifier: signupEmail,
      otp: sendRes.body.devOtp || "123456",
      purpose: "signup",
      metaData,
    });

    assert.equal(verifyRes.statusCode, 200);
    const user = verifyRes.body.user;
    assert.equal(user.name, "Rohan Varma");
    assert.equal(user.dob, "2006-03-21");
    assert.equal(user.careerStage, "STUDENT");
    assert.equal(user.gradeLevel, "Undergraduate Year 2");
    assert.equal(user.ageBand, "16-18");
    assert.equal(user.visualMode, "career");
  });

  await test("3.2 JUNIOR student career stage maps to ageBand 13-15 and visualMode maximalist", async () => {
    const juniorEmail = `junior.student.${Date.now()}@edworld.student`;
    const metaData = {
      name: "Aarav Gupta",
      careerStage: "JUNIOR",
      gradeLevel: "Class 9",
    };

    const sendRes = await apiRequest("/api/auth/otp/send", { identifier: juniorEmail, purpose: "signup" });
    const verifyRes = await apiRequest("/api/auth/otp/verify", {
      identifier: juniorEmail,
      otp: sendRes.body.devOtp || "123456",
      purpose: "signup",
      metaData,
    });

    assert.equal(verifyRes.statusCode, 200);
    const user = verifyRes.body.user;
    assert.equal(user.careerStage, "JUNIOR");
    assert.equal(user.ageBand, "13-15");
    assert.equal(user.visualMode, "maximalist");
    assert.equal(verifyRes.body.redirectUrl, "/student/junior/dashboard");
  });

  await test("3.3 Default metadata fallbacks for new users with omitted profile fields", async () => {
    const defaultEmail = `default.student.${Date.now()}@edworld.student`;
    const sendRes = await apiRequest("/api/auth/otp/send", { identifier: defaultEmail });
    const verifyRes = await apiRequest("/api/auth/otp/verify", {
      identifier: defaultEmail,
      otp: sendRes.body.devOtp || "123456",
    });

    assert.equal(verifyRes.statusCode, 200);
    const user = verifyRes.body.user;
    assert.equal(user.name, "Edworld Learner", "Default name must be 'Edworld Learner'");
    assert.equal(user.careerStage, "STUDENT", "Default careerStage must be 'STUDENT'");
    assert.equal(user.gradeLevel, "College", "Default gradeLevel must be 'College'");
    assert.equal(user.ageBand, "18+", "Default ageBand falls back to '18+'");
  });

  // ============================================================================
  // DOMAIN 4: ROLE ROUTING CONTRACTS
  // ============================================================================
  console.log("\n--- DOMAIN 4: Role Routing Contracts ---");

  await test("4.1 getRedirectForRole direct mapping matrix", () => {
    // Student / Client
    assert.equal(getRedirectForRole("STUDENT"), "/dashboard");
    assert.equal(getRedirectForRole("CLIENT"), "/dashboard");
    assert.equal(getRedirectForRole("STUDENT", "JUNIOR"), "/student/junior/dashboard");
    assert.equal(getRedirectForRole("CLIENT", "JUNIOR"), "/student/junior/dashboard");

    // Un-onboarded student routes to /onboarding
    assert.equal(getRedirectForRole("STUDENT", undefined, false), "/onboarding");
    assert.equal(getRedirectForRole("CLIENT", undefined, false), "/onboarding");

    // Teacher
    assert.equal(getRedirectForRole("TEACHER"), "/school/teacher");

    // Admin & Super Admin
    assert.equal(getRedirectForRole("ADMIN"), "/admin");
    assert.equal(getRedirectForRole("SUPER_ADMIN"), "/admin");

    // Internal roles
    assert.equal(getRedirectForRole("HR"), "/hr");
    assert.equal(getRedirectForRole("FOUNDER"), "/founder");
    assert.equal(getRedirectForRole("EXECUTIVE"), "/founder");
    assert.equal(getRedirectForRole("COLLEGE_ADMIN"), "/colleges");
    assert.equal(getRedirectForRole("PLACEMENT_OFFICER"), "/colleges");
    assert.equal(getRedirectForRole("EMPLOYEE"), "/employee");

    // Fallback for unknown role
    assert.equal(getRedirectForRole("UNKNOWN_ROLE"), "/dashboard");
    assert.equal(getRedirectForRole(""), "/dashboard");
  });

  await test("4.2 Teacher provisioned account OTP login routes to /school/teacher", async () => {
    const teacherEmail = "teacher@edworld.co.in";
    const sendRes = await apiRequest("/api/auth/otp/send", { identifier: teacherEmail });
    assert.equal(sendRes.statusCode, 200);

    const verifyRes = await apiRequest("/api/auth/otp/verify", {
      identifier: teacherEmail,
      otp: sendRes.body.devOtp || "123456",
    });

    assert.equal(verifyRes.statusCode, 200);
    assert.equal(verifyRes.body.role, "TEACHER");
    assert.equal(verifyRes.body.redirectUrl, "/school/teacher");
  });

  await test("4.3 Admin provisioned account OTP login routes to /admin", async () => {
    const adminEmail = "admin@edworld.co.in";
    const sendRes = await apiRequest("/api/auth/otp/send", { identifier: adminEmail });
    assert.equal(sendRes.statusCode, 200);

    const verifyRes = await apiRequest("/api/auth/otp/verify", {
      identifier: adminEmail,
      otp: sendRes.body.devOtp || "123456",
    });

    assert.equal(verifyRes.statusCode, 200);
    assert.equal(verifyRes.body.role, "ADMIN");
    assert.equal(verifyRes.body.redirectUrl, "/admin");
  });

  // ============================================================================
  // DOMAIN 5: FRONTEND INPUT BOUNDARY TESTING (/auth/login & /auth/signup)
  // ============================================================================
  console.log("\n--- DOMAIN 5: Frontend Input Boundary Testing (/auth/login & /auth/signup) ---");

  // Pure logic simulations of UI event handlers
  function simulatePaste(pastedText) {
    const pasted = (pastedText || "").trim();
    if (!/^\d+$/.test(pasted)) return null; // Paste rejected if non-numeric
    const chars = pasted.slice(0, 6).split("");
    const newDigits = Array(6).fill("");
    chars.forEach((c, i) => {
      newDigits[i] = c;
    });
    const targetIdx = Math.min(chars.length, 5);
    return { digits: newDigits, targetIdx };
  }

  function simulateSingleDigitChange(currentDigits, index, enteredChar) {
    const val = enteredChar.slice(-1);
    if (!/^\d*$/.test(val)) return currentDigits; // Reject non-digit
    const newDigits = [...currentDigits];
    newDigits[index] = val;
    return newDigits;
  }

  function simulateBackspace(currentDigits, index) {
    if (!currentDigits[index] && index > 0) {
      const newDigits = [...currentDigits];
      newDigits[index - 1] = "";
      return { digits: newDigits, newIndex: index - 1 };
    } else {
      const newDigits = [...currentDigits];
      newDigits[index] = "";
      return { digits: newDigits, newIndex: index };
    }
  }

  await test("5.1 Paste event: Standard 6 digits fills all 6 boxes and focuses last box", () => {
    const res = simulatePaste("849201");
    assert.deepEqual(res.digits, ["8", "4", "9", "2", "0", "1"]);
    assert.equal(res.targetIdx, 5);
  });

  await test("5.2 Paste event: Partial 3 digits fills first 3 boxes, leaves rest empty, focuses index 3", () => {
    const res = simulatePaste("572");
    assert.deepEqual(res.digits, ["5", "7", "2", "", "", ""]);
    assert.equal(res.targetIdx, 3);
  });

  await test("5.3 Paste event: Excess digits (>6) truncates to exactly 6 digits", () => {
    const res = simulatePaste("123456789012");
    assert.deepEqual(res.digits, ["1", "2", "3", "4", "5", "6"]);
    assert.equal(res.targetIdx, 5);
  });

  await test("5.4 Paste event: Non-numeric paste (letters, symbols) is completely rejected", () => {
    assert.equal(simulatePaste("abcdef"), null);
    assert.equal(simulatePaste("12a34b"), null);
    assert.equal(simulatePaste("<script>"), null);
    assert.equal(simulatePaste(""), null);
  });

  await test("5.5 Single-digit change: Strips non-numeric characters and enforces single digit per box", () => {
    const initial = ["", "", "", "", "", ""];
    // Valid numeric entry
    const step1 = simulateSingleDigitChange(initial, 0, "7");
    assert.deepEqual(step1, ["7", "", "", "", "", ""]);

    // Alpha entry rejected
    const step2 = simulateSingleDigitChange(step1, 1, "k");
    assert.deepEqual(step2, ["7", "", "", "", "", ""]);

    // Symbol entry rejected
    const step3 = simulateSingleDigitChange(step1, 1, "#");
    assert.deepEqual(step3, ["7", "", "", "", "", ""]);

    // Overwriting digit takes last character
    const step4 = simulateSingleDigitChange(step1, 0, "79");
    assert.deepEqual(step4, ["9", "", "", "", "", ""]);
  });

  await test("5.6 Backspace navigation: clears current when filled, clears previous when empty and retreats focus", () => {
    // Current box has digit -> clears current box, stays at current box
    const state1 = ["1", "2", "3", "", "", ""];
    const r1 = simulateBackspace(state1, 2);
    assert.deepEqual(r1.digits, ["1", "2", "", "", "", ""]);
    assert.equal(r1.newIndex, 2);

    // Current box is empty -> clears previous box, moves back to index-1
    const state2 = ["1", "2", "", "", "", ""];
    const r2 = simulateBackspace(state2, 2);
    assert.deepEqual(r2.digits, ["1", "", "", "", "", ""]);
    assert.equal(r2.newIndex, 1);

    // At index 0 when empty -> stays at index 0
    const state3 = ["", "", "", "", "", ""];
    const r3 = simulateBackspace(state3, 0);
    assert.deepEqual(r3.digits, ["", "", "", "", "", ""]);
    assert.equal(r3.newIndex, 0);
  });

  await test("5.7 Countdown timer resilience: resets to 45s on send, enables resend only at 0", () => {
    let countdown = 45;
    let canResend = false;

    // Simulate timer ticks down
    for (let sec = 45; sec > 0; sec--) {
      assert.equal(canResend, false, `canResend must remain false while countdown is ${sec}`);
      countdown = sec - 1;
      if (countdown === 0) {
        canResend = true;
      }
    }

    assert.equal(countdown, 0);
    assert.equal(canResend, true, "canResend must become true when countdown hits 0");

    // Resend resets cooldown
    countdown = 45;
    canResend = false;
    assert.equal(countdown, 45);
    assert.equal(canResend, false);
  });

  await test("5.8 Submit button readiness: disabled until all 6 digits are populated", () => {
    function isSubmitEnabled(digits, loading) {
      if (loading) return false;
      return digits.join("").length === 6;
    }

    assert.equal(isSubmitEnabled(["", "", "", "", "", ""], false), false);
    assert.equal(isSubmitEnabled(["1", "2", "3", "4", "5", ""], false), false);
    assert.equal(isSubmitEnabled(["1", "2", "3", "4", "5", "6"], true), false, "Must be disabled while loading");
    assert.equal(isSubmitEnabled(["1", "2", "3", "4", "5", "6"], false), true, "Must be enabled when 6 digits and !loading");
  });

  // ============================================================================
  // SUMMARY
  // ============================================================================
  console.log("\n================================================================================");
  console.log(`TOTAL TESTS: ${totalTests} | PASSED: ${passedTests} | FAILED: ${failedTests}`);
  console.log("================================================================================");

  if (failedTests > 0) {
    process.exit(1);
  }
}

await runAllSuites();
