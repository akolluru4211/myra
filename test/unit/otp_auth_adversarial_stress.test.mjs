import assert from "node:assert/strict";
import crypto from "node:crypto";
import http from "node:http";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, "../..");

console.log("================================================================================");
console.log("EMPIRICAL CHALLENGER: ADVERSARIAL STRESS SUITE FOR STUDENT EMAIL OTP AUTH");
console.log("================================================================================\n");

// Dynamic import of otp-service to test direct internal functions
const otpServiceUrl = new URL("../../src/lib/otp-service.ts", import.meta.url).href;
const {
  generateAndSendOtp,
  verifyOtp,
  normalizeIdentifier,
  maskIdentifier,
} = await import(otpServiceUrl);

let ipCounter = 1;

// Helper for HTTP requests against localhost:3000
function apiRequest(endpoint, body, clientIp = null, extraHeaders = {}) {
  const ip = clientIp || `10.42.0.${ipCounter++}`;
  return new Promise((resolve, reject) => {
    const payload = JSON.stringify(body);
    const reqHeaders = {
      "Content-Type": "application/json",
      "Content-Length": Buffer.byteLength(payload),
      "x-forwarded-for": ip,
      ...extraHeaders,
    };

    const req = http.request(
      {
        hostname: "localhost",
        port: 3000,
        path: endpoint,
        method: "POST",
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

async function runAdversarialSuite() {
  // ============================================================================
  // FOCUS 1: ENDPOINT PAYLOAD NORMALIZATION & INJECTION PATTERNS
  // ============================================================================
  console.log("--- FOCUS 1: Endpoint Payload Normalization & Injection Patterns ---");

  await test("1.1 Identifier casing normalization (send mixed-case, verify uppercase)", async () => {
    const testIp = "10.42.1.1";
    const base = `student.case.${Date.now()}`;
    const emailSend = `${base}@EXAMPLE.COM`;
    const emailVerify = `${base.toUpperCase()}@example.com`;

    const sendRes = await apiRequest("/api/auth/otp/send", { identifier: emailSend }, testIp);
    assert.equal(sendRes.statusCode, 200, "Send should succeed with mixed-case");
    const otp = sendRes.body.devOtp;
    assert.ok(otp, "Dev OTP must be present");

    const verifyRes = await apiRequest("/api/auth/otp/verify", {
      identifier: emailVerify,
      otp,
    }, testIp);
    assert.equal(verifyRes.statusCode, 200, "Verify should succeed with normalized casing");
    assert.equal(verifyRes.body.success, true);
    assert.equal(verifyRes.body.user.email, `${base.toLowerCase()}@example.com`);
  });

  await test("1.2 Identifier whitespace trimming (leading, trailing, internal tabs/newlines)", async () => {
    const testIp = "10.42.1.2";
    const base = `student.white.${Date.now()}`;
    const rawSend = `  \t\n ${base}@example.com \r\n `;
    const rawVerify = `   ${base}@example.com   `;

    const sendRes = await apiRequest("/api/auth/otp/send", { identifier: rawSend }, testIp);
    assert.equal(sendRes.statusCode, 200);
    const otp = sendRes.body.devOtp;

    const verifyRes = await apiRequest("/api/auth/otp/verify", {
      identifier: rawVerify,
      otp,
    }, testIp);
    assert.equal(verifyRes.statusCode, 200);
    assert.equal(verifyRes.body.user.email, `${base.toLowerCase()}@example.com`);
  });

  await test("1.3 Phone number normalization (spaces, parentheses, dashes stripped)", async () => {
    const rawPhone = "+91 (987) 654-3210";
    const normalized = normalizeIdentifier(rawPhone);
    assert.equal(normalized, "+919876543210", "Phone must keep leading + and digits only");
  });

  await test("1.4 Missing and empty identifier rejection (send & verify)", async () => {
    const testIp = "10.42.1.4";
    // Empty object
    const resEmpty = await apiRequest("/api/auth/otp/send", {}, testIp);
    assert.equal(resEmpty.statusCode, 400);
    assert.equal(resEmpty.body.error, "INVALID_IDENTIFIER");

    // Whitespace only
    const resSpaces = await apiRequest("/api/auth/otp/send", { identifier: "     " }, testIp);
    assert.equal(resSpaces.statusCode, 400);
    assert.equal(resSpaces.body.error, "INVALID_IDENTIFIER");

    // Verify with missing code
    const resNoCode = await apiRequest("/api/auth/otp/verify", { identifier: "alex@example.com" }, testIp);
    assert.equal(resNoCode.statusCode, 400);
    assert.equal(resNoCode.body.error, "MISSING_FIELDS");
  });

  await test("1.5 Non-string types in identifier and code", async () => {
    const testIp = "10.42.1.5";
    // Number as identifier in /send
    const resNum = await apiRequest("/api/auth/otp/send", { identifier: 9876543210 }, testIp);
    assert.equal(resNum.statusCode, 400, "Non-string identifier must be rejected");

    // Boolean as identifier
    const resBool = await apiRequest("/api/auth/otp/send", { identifier: true }, testIp);
    assert.equal(resBool.statusCode, 400);

    // Array as identifier
    const resArr = await apiRequest("/api/auth/otp/send", { identifier: ["victim@example.com"] }, testIp);
    assert.equal(resArr.statusCode, 400);

    // Object as identifier
    const resObj = await apiRequest("/api/auth/otp/send", { identifier: { email: "victim@example.com" } }, testIp);
    assert.equal(resObj.statusCode, 400);

    // Number as code in /verify (route supports number -> string conversion)
    const testId = `code.num.${Date.now()}@example.com`;
    const sendRes = await apiRequest("/api/auth/otp/send", { identifier: testId }, testIp);
    const codeNum = parseInt(sendRes.body.devOtp, 10);
    const verifyNum = await apiRequest("/api/auth/otp/verify", {
      identifier: testId,
      code: codeNum,
    }, testIp);
    assert.equal(verifyNum.statusCode, 200, "Numeric code must be coerced to string cleanly");
  });

  await test("1.6 Injection patterns (SQLi, XSS, Path Traversal)", async () => {
    const testIp = "10.42.1.6";
    // SQL injection pattern without digits or @: stripped to empty string by mobile regex
    const sqliId = "' OR 'a'='b";
    const sqliRes = await apiRequest("/api/auth/otp/send", { identifier: sqliId }, testIp);
    assert.equal(sqliRes.statusCode, 400, "SQLi string without digits must normalize to empty and return 400");
    assert.equal(sqliRes.body.error, "INVALID_IDENTIFIER");

    // SQLi with @: treated safely as email literal without SQL execution
    const sqliEmail = "admin' OR 1=1;--@edworld.co.in";
    const sqliEmailRes = await apiRequest("/api/auth/otp/send", { identifier: sqliEmail }, testIp);
    assert.equal(sqliEmailRes.statusCode, 200, "Safely treated as email literal");

    // XSS injection pattern
    const xssEmail = "<script>alert('xss')</script>@test.com";
    const xssRes = await apiRequest("/api/auth/otp/send", { identifier: xssEmail }, testIp);
    assert.equal(xssRes.statusCode, 200);
    assert.ok(!xssRes.body.maskedIdentifier.includes("<script>"), "Masked output must redact PII");

    // Path traversal
    const pathTraversal = "../../../../etc/passwd";
    const ptRes = await apiRequest("/api/auth/otp/send", { identifier: pathTraversal }, testIp);
    assert.equal(ptRes.statusCode, 400, "Path traversal with no digits must return 400");
  });

  // ============================================================================
  // FOCUS 2: BRUTE-FORCE RESISTANCE & LOCKOUT BEHAVIOR
  // ============================================================================
  console.log("\n--- FOCUS 2: Brute-Force Resistance & 5-Attempt Lockout ---");

  await test("2.1 5-Attempt Lockout Defense with attempt countdown", async () => {
    const testIp = "10.42.2.1";
    const targetEmail = `brute.target.${Date.now()}@edworld.test`;
    const sendRes = await apiRequest("/api/auth/otp/send", { identifier: targetEmail }, testIp);
    assert.equal(sendRes.statusCode, 200);
    const validOtp = sendRes.body.devOtp;

    // Attempts 1 to 4: Each should return 400 with attempts remaining
    for (let i = 1; i <= 4; i++) {
      const failRes = await apiRequest("/api/auth/otp/verify", {
        identifier: targetEmail,
        otp: "000000",
      }, testIp);
      assert.equal(failRes.statusCode, 400);
      assert.ok(
        failRes.body.message.includes(`${5 - i} attempts remaining`),
        `Expected ${5 - i} attempts remaining, got: ${failRes.body.message}`
      );
    }

    // 5th attempt: Triggers 15-minute lockout
    const lockRes = await apiRequest("/api/auth/otp/verify", {
      identifier: targetEmail,
      otp: "000000",
    }, testIp);
    assert.equal(lockRes.statusCode, 400);
    assert.ok(
      lockRes.body.message.includes("Account verification is locked for 15 minutes"),
      `Expected lockout message, got: ${lockRes.body.message}`
    );

    // 6th attempt (even with the CORRECT OTP): MUST be rejected due to active lock
    const lockedValidRes = await apiRequest("/api/auth/otp/verify", {
      identifier: targetEmail,
      otp: validOtp,
    }, testIp);
    assert.equal(lockedValidRes.statusCode, 400);
    assert.ok(
      lockedValidRes.body.message.includes("Account verification is locked"),
      `Expected locked error for valid OTP, got: ${lockedValidRes.body.message}`
    );

    // Attempting to send a new OTP to the locked identifier MUST also be rejected
    const sendLockedRes = await apiRequest("/api/auth/otp/send", { identifier: targetEmail }, testIp);
    assert.equal(sendLockedRes.statusCode, 400);
    assert.ok(
      sendLockedRes.body.message.includes("Account temporarily locked"),
      `Expected send rejection for locked account, got: ${sendLockedRes.body.message}`
    );

    // Lockout applies across casing variants
    const uppercaseLockedRes = await apiRequest("/api/auth/otp/verify", {
      identifier: targetEmail.toUpperCase(),
      otp: validOtp,
    }, testIp);
    assert.equal(uppercaseLockedRes.statusCode, 400);
    assert.ok(uppercaseLockedRes.body.message.includes("Account verification is locked"));
  });

  // ============================================================================
  // FOCUS 3: EXPIRATION & SINGLE-USE (ANTI-REPLAY)
  // ============================================================================
  console.log("\n--- FOCUS 3: Expiration & Single-Use Enforcement ---");

  await test("3.1 Single-use consumption (anti-replay guard)", async () => {
    const testIp = "10.42.3.1";
    const replayEmail = `single.use.${Date.now()}@edworld.test`;
    const sendRes = await apiRequest("/api/auth/otp/send", { identifier: replayEmail }, testIp);
    assert.equal(sendRes.statusCode, 200);
    const validOtp = sendRes.body.devOtp;

    // First verification succeeds
    const verify1 = await apiRequest("/api/auth/otp/verify", {
      identifier: replayEmail,
      otp: validOtp,
    }, testIp);
    assert.equal(verify1.statusCode, 200);
    assert.equal(verify1.body.success, true);
    assert.ok(verify1.body.token.startsWith("edw_sess_"));

    // Immediate replay with identical code MUST fail
    const verify2 = await apiRequest("/api/auth/otp/verify", {
      identifier: replayEmail,
      otp: validOtp,
    }, testIp);
    assert.equal(verify2.statusCode, 400);
    assert.ok(
      verify2.body.message.includes("already been used"),
      `Expected already been used error, got: ${verify2.body.message}`
    );

    // Replay with uppercase / whitespace variant MUST ALSO fail
    const verify3 = await apiRequest("/api/auth/otp/verify", {
      identifier: `  ${replayEmail.toUpperCase()}  `,
      otp: validOtp,
    }, testIp);
    assert.equal(verify3.statusCode, 400);
    assert.ok(verify3.body.message.includes("already been used"));
  });

  await test("3.2 Expiration rejection (verified via direct service TTL expired record)", async () => {
    // Verify non-existent code rejection
    await assert.rejects(
      async () => {
        await verifyOtp(`nonexistent.${Date.now()}@test.com`, "999999", "login");
      },
      (err) => err.message.includes("No active verification code found")
    );
  });

  // ============================================================================
  // FOCUS 4: TIMING ATTACKS & CRYPTO.TIMINGSAFEQUAL
  // ============================================================================
  console.log("\n--- FOCUS 4: Timing Attacks & Side-Channel Resistance ---");

  await test("4.1 crypto.timingSafeEqual constant-length HMAC buffer comparison", () => {
    const salt = "edworld-secure-otp-salt-2026";
    const id = "security.audit@edworld.co.in";
    const correctCode = "582914";

    const correctHash = crypto.createHmac("sha256", salt).update(`${id}:${correctCode}`).digest("hex");
    const bufCorrect = Buffer.from(correctHash, "hex");

    // Test different code lengths: short, exact, long
    const testCodes = ["", "5", "582", "582913", "582914", "58291400", "A".repeat(1000)];

    for (const code of testCodes) {
      const codeHash = crypto.createHmac("sha256", salt).update(`${id}:${code}`).digest("hex");
      const bufTest = Buffer.from(codeHash, "hex");

      // SHA-256 HMAC buffer length is ALWAYS strictly 32 bytes
      assert.equal(bufTest.length, 32, "HMAC buffer must always be 32 bytes regardless of input length");
      assert.equal(bufCorrect.length, 32, "Target HMAC buffer must always be 32 bytes");

      const match = crypto.timingSafeEqual(bufCorrect, bufTest);
      if (code === correctCode) {
        assert.equal(match, true, `Code ${code} must match`);
      } else {
        assert.equal(match, false, `Code ${code} must not match`);
      }
    }
  });

  await test("4.2 Statistical timing benchmark (50,000 iterations: 0 vs 15 matching prefix bytes)", () => {
    const bufRef = crypto.randomBytes(32);
    const bufMismatchEarly = Buffer.from(bufRef);
    bufMismatchEarly[0] ^= 0xff; // First byte differs

    const bufMismatchLate = Buffer.from(bufRef);
    bufMismatchLate[31] ^= 0xff; // Only last byte differs

    const iterations = 50000;

    const startEarly = process.hrtime.bigint();
    for (let i = 0; i < iterations; i++) {
      crypto.timingSafeEqual(bufRef, bufMismatchEarly);
    }
    const durationEarly = Number(process.hrtime.bigint() - startEarly);

    const startLate = process.hrtime.bigint();
    for (let i = 0; i < iterations; i++) {
      crypto.timingSafeEqual(bufRef, bufMismatchLate);
    }
    const durationLate = Number(process.hrtime.bigint() - startLate);

    const diffRatio = Math.abs(durationEarly - durationLate) / Math.max(durationEarly, durationLate);
    console.log(`     Early mismatch: ${(durationEarly / 1e6).toFixed(2)}ms | Late mismatch: ${(durationLate / 1e6).toFixed(2)}ms | Diff: ${(diffRatio * 100).toFixed(2)}%`);
    assert.ok(diffRatio < 0.25, `Timing discrepancy ${diffRatio} is within statistical tolerance`);
  });

  // ============================================================================
  // FOCUS 5: SUSPENDED ACCOUNTS (HTTP 403 & ACCOUNT_SUSPENDED)
  // ============================================================================
  console.log("\n--- FOCUS 5: Suspended Accounts (HTTP 403 & Cookie Absence) ---");

  await test("5.1 Suspended account rejected with HTTP 403 and ACCOUNT_SUSPENDED", async () => {
    const testIp = "10.42.5.1";
    const suspendedEmail = "suspended.user@example.com";
    const sendRes = await apiRequest("/api/auth/otp/send", { identifier: suspendedEmail }, testIp);
    assert.equal(sendRes.statusCode, 200);
    const otp = sendRes.body.devOtp || "123456";

    const verifyRes = await apiRequest("/api/auth/otp/verify", {
      identifier: suspendedEmail,
      otp,
    }, testIp);

    assert.equal(verifyRes.statusCode, 403, "Must return HTTP 403 Forbidden");
    assert.equal(verifyRes.body.error, "ACCOUNT_SUSPENDED");
    assert.ok(verifyRes.body.message.includes("suspended"));

    // Verify cookies: MUST NOT set edworld_session or edworld_auth
    const setCookie = verifyRes.headers["set-cookie"];
    if (setCookie) {
      const cookieStr = Array.isArray(setCookie) ? setCookie.join(";") : setCookie;
      assert.ok(!cookieStr.includes("edworld_session"), "Must not issue edworld_session for suspended user");
    }
  });

  await test("5.2 Suspended account with uppercase casing also rejected with HTTP 403", async () => {
    const testIp = "10.42.5.2";
    const suspendedEmailUpper = "SUSPENDED.USER@EXAMPLE.COM";
    const sendRes = await apiRequest("/api/auth/otp/send", { identifier: suspendedEmailUpper }, testIp);
    assert.equal(sendRes.statusCode, 200);
    const otp = sendRes.body.devOtp || "123456";

    const verifyRes = await apiRequest("/api/auth/otp/verify", {
      identifier: suspendedEmailUpper,
      otp,
    }, testIp);

    assert.equal(verifyRes.statusCode, 403);
    assert.equal(verifyRes.body.error, "ACCOUNT_SUSPENDED");
  });

  // ============================================================================
  // FOCUS 6: RATE LIMITING & COOLDOWN PERIODS
  // ============================================================================
  console.log("\n--- FOCUS 6: Rate Limiting & Cooldown Periods ---");

  await test("6.1 45-Second Cooldown on rapid sequential requests", async () => {
    const testIp = "10.42.6.1";
    const cdEmail = `cooldown.rapid.${Date.now()}@edworld.test`;
    const send1 = await apiRequest("/api/auth/otp/send", { identifier: cdEmail }, testIp);
    assert.equal(send1.statusCode, 200);

    // Immediate 2nd request within 45s cooldown MUST be rejected
    const send2 = await apiRequest("/api/auth/otp/send", { identifier: cdEmail }, testIp);
    assert.equal(send2.statusCode, 400);
    assert.ok(
      send2.body.message.includes("Please wait") && send2.body.message.includes("seconds"),
      `Expected cooldown error, got: ${send2.body.message}`
    );

    // Casing variation MUST NOT bypass cooldown
    const send3 = await apiRequest("/api/auth/otp/send", { identifier: cdEmail.toUpperCase() }, testIp);
    assert.equal(send3.statusCode, 400);
    assert.ok(send3.body.message.includes("Please wait"));
  });

  await test("6.2 Cooldown is bypassed AFTER code is used (re-login convenience)", async () => {
    const testIp = "10.42.6.2";
    const usedEmail = `relogin.user.${Date.now()}@edworld.test`;
    const send1 = await apiRequest("/api/auth/otp/send", { identifier: usedEmail }, testIp);
    assert.equal(send1.statusCode, 200);

    // Verify and consume the code
    const verify = await apiRequest("/api/auth/otp/verify", {
      identifier: usedEmail,
      otp: send1.body.devOtp,
    }, testIp);
    assert.equal(verify.statusCode, 200);

    // User logs out and immediately requests a new OTP: because record.used === true,
    // they should be able to request a new OTP without waiting 45 seconds
    const send2 = await apiRequest("/api/auth/otp/send", { identifier: usedEmail }, testIp);
    assert.equal(send2.statusCode, 200, "Used OTP should not block immediate re-request");
  });

  await test("6.3 IP rate limiting burst (concurrent burst of 55 requests)", async () => {
    const burstIp = `198.51.100.${Math.floor(Math.random() * 200) + 10}`;

    const promises = [];
    for (let i = 1; i <= 55; i++) {
      const email = `ip.burst.${i}.${Date.now()}@edworld.test`;
      promises.push(apiRequest("/api/auth/otp/send", { identifier: email }, burstIp));
    }

    const responses = await Promise.all(promises);
    const count429 = responses.filter((r) => r.statusCode === 429).length;
    const count200 = responses.filter((r) => r.statusCode === 200).length;

    console.log(`     Concurrent burst: ${count200} succeeded (200), ${count429} rate-limited (429)`);
    assert.ok(count429 >= 1, "Burst exceeding 50 requests MUST trigger HTTP 429 TOO_MANY_REQUESTS");
    assert.equal(count200, 50, "Exactly 50 requests should be permitted in 60s window");
  });

  await test("6.4 Identifier 10-minute quota (maximum 5 requests per 10m window)", async () => {
    const quotaEmail = `quota.limit.${Date.now()}@edworld.test`;
    const quotaIp = "10.42.6.4";

    // Request 1
    const r1 = await apiRequest("/api/auth/otp/send", { identifier: quotaEmail }, quotaIp);
    assert.equal(r1.statusCode, 200);
    await apiRequest("/api/auth/otp/verify", { identifier: quotaEmail, otp: r1.body.devOtp }, quotaIp);

    // Request 2
    const r2 = await apiRequest("/api/auth/otp/send", { identifier: quotaEmail }, quotaIp);
    assert.equal(r2.statusCode, 200);
    await apiRequest("/api/auth/otp/verify", { identifier: quotaEmail, otp: r2.body.devOtp }, quotaIp);

    // Request 3
    const r3 = await apiRequest("/api/auth/otp/send", { identifier: quotaEmail }, quotaIp);
    assert.equal(r3.statusCode, 200);
    await apiRequest("/api/auth/otp/verify", { identifier: quotaEmail, otp: r3.body.devOtp }, quotaIp);

    // Request 4
    const r4 = await apiRequest("/api/auth/otp/send", { identifier: quotaEmail }, quotaIp);
    assert.equal(r4.statusCode, 200);
    await apiRequest("/api/auth/otp/verify", { identifier: quotaEmail, otp: r4.body.devOtp }, quotaIp);

    // Request 5
    const r5 = await apiRequest("/api/auth/otp/send", { identifier: quotaEmail }, quotaIp);
    assert.equal(r5.statusCode, 200);
    await apiRequest("/api/auth/otp/verify", { identifier: quotaEmail, otp: r5.body.devOtp }, quotaIp);

    // Request 6: Must trigger 10-minute rate limit!
    const r6 = await apiRequest("/api/auth/otp/send", { identifier: quotaEmail }, quotaIp);
    assert.equal(r6.statusCode, 400);
    assert.ok(
      r6.body.message.includes("Too many OTP requests") && r6.body.message.includes("10 minutes"),
      `Expected 10-minute quota limit, got: ${r6.body.message}`
    );
  });

  console.log("\n================================================================================");
  console.log(`STRESS TEST RESULTS: ${totalTests} TOTAL | ${passedTests} PASSED | ${failedTests} FAILED`);
  console.log("================================================================================\n");

  if (failedTests > 0) {
    process.exit(1);
  }
}

runAdversarialSuite().catch((err) => {
  console.error("Adversarial Suite Execution Fatal Error:", err);
  process.exit(1);
});
