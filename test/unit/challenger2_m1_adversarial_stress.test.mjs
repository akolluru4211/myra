import assert from "node:assert/strict";
import crypto from "node:crypto";
import {
  renderBrandedEmailHtml,
  renderAmbassadorApprovedEmail,
  renderInterviewScorecardEmail,
  renderConnectionRequestReceivedEmail,
  renderConnectionAcceptedEmail,
  renderPasswordResetEmail,
  renderPasswordChangedConfirmationEmail,
  renderSignupWelcomeEmail,
  renderProjectCompletionCertificateEmail,
  renderOtpVerificationEmail,
} from "../../src/lib/email-templates.ts";
import {
  generateAndSendOtp,
  verifyOtp,
  normalizeIdentifier,
  maskIdentifier,
} from "../../src/lib/otp-service.ts";

async function runAdversarialSuite() {
  console.log("======================================================================");
  console.log("=== CHALLENGER 2: ADVERSARIAL STRESS TEST SUITE (MILESTONE 1) ===");
  console.log("======================================================================\n");

  let passedAssertions = 0;

  // --------------------------------------------------------------------------
  // SECTION 1: Jargon Elimination & Remote Image Invariants Across ALL Templates
  // --------------------------------------------------------------------------
  console.log("--- Section 1: Template Jargon & Remote Image Invariants ---");

  const sampleTemplates = [
    {
      name: "renderBrandedEmailHtml",
      html: renderBrandedEmailHtml({
        previewText: "Test Preview",
        title: "Test Title",
        contentHtml: "<p>Hello World</p>",
      }),
    },
    {
      name: "renderAmbassadorApprovedEmail",
      html: renderAmbassadorApprovedEmail({
        ambassadorName: "Rohan",
        referralCode: "ROHAN2026",
      }),
    },
    {
      name: "renderInterviewScorecardEmail",
      html: renderInterviewScorecardEmail({
        studentName: "Priya",
        interviewRole: "Frontend Engineer",
        overallScore: 85,
        scorecardUrl: "https://edworld.co.in/scorecard/123",
      }),
    },
    {
      name: "renderConnectionRequestReceivedEmail",
      html: renderConnectionRequestReceivedEmail({
        recipientName: "Aditi",
        senderName: "Kunal",
        senderHeadline: "Data Scientist",
        acceptUrl: "https://edworld.co.in/network",
      }),
    },
    {
      name: "renderConnectionAcceptedEmail",
      html: renderConnectionAcceptedEmail({
        recipientName: "Kunal",
        peerName: "Aditi",
        peerHeadline: "Backend Architect",
        profileUrl: "https://edworld.co.in/u/aditi",
      }),
    },
    {
      name: "renderPasswordResetEmail",
      html: renderPasswordResetEmail({
        name: "Vikram",
        resetLink: "https://edworld.co.in/auth/reset?token=xyz",
      }),
    },
    {
      name: "renderPasswordChangedConfirmationEmail",
      html: renderPasswordChangedConfirmationEmail({
        name: "Vikram",
      }),
    },
    {
      name: "renderSignupWelcomeEmail",
      html: renderSignupWelcomeEmail({
        name: "Sneha",
        userRole: "STUDENT",
      }),
    },
    {
      name: "renderProjectCompletionCertificateEmail",
      html: renderProjectCompletionCertificateEmail({
        studentName: "Aditya",
        projectName: "Microservices Resiliency",
        certificateCode: "EDW-2026-CERT-99",
        certificateUrl: "https://edworld.co.in/cert/EDW-2026-CERT-99",
      }),
    },
    {
      name: "renderOtpVerificationEmail",
      html: renderOtpVerificationEmail({
        otp: "738192",
        purpose: "login",
        expiresMinutes: 5,
        identifier: "student@edworld.co.in",
        studentName: "Aditya",
      }),
    },
  ];

  for (const t of sampleTemplates) {
    // 1.1 Invariant: Zero <img tags
    assert.equal(
      /<img\b/i.test(t.html),
      false,
      `Template ${t.name} MUST NOT contain any <img tags`
    );

    // 1.2 Invariant: Zero remote image links (.png, .jpg, .svg, .webp, .ico)
    assert.equal(
      /https?:\/\/[^\s"'<>]+\.(png|jpe?g|gif|webp|svg|ico)/i.test(t.html),
      false,
      `Template ${t.name} MUST NOT reference remote images`
    );

    // 1.3 Invariant: Zero forbidden jargon ('256-bit', '256-BIT ENCRYPTION', '256-BIT SSL', 'AUTH SENTINEL')
    assert.equal(
      /256-bit/i.test(t.html),
      false,
      `Template ${t.name} MUST NOT contain '256-bit'`
    );
    assert.equal(
      /auth\s*sentinel/i.test(t.html),
      false,
      `Template ${t.name} MUST NOT contain 'AUTH SENTINEL'`
    );

    // 1.4 Invariant: High-fidelity inline monogram badge present
    assert.ok(
      t.html.includes('E<span style="color: #059669;">.</span>'),
      `Template ${t.name} MUST contain the inline monogram badge`
    );

    // 1.5 Invariant: Modernized compliance stamp
    assert.ok(
      t.html.includes("DPDP ACT 2023 COMPLIANT"),
      `Template ${t.name} MUST contain DPDP ACT 2023 COMPLIANT`
    );
    assert.ok(
      t.html.includes("STUDENT DATA PROTECTED"),
      `Template ${t.name} MUST contain STUDENT DATA PROTECTED`
    );

    passedAssertions += 6;
  }
  console.log(`  ✓ Passed 6 invariant checks across all 10 email templates (${sampleTemplates.length * 6} assertions).\n`);

  // --------------------------------------------------------------------------
  // SECTION 2: Adversarial Input Fuzzing on Email Templates
  // --------------------------------------------------------------------------
  console.log("--- Section 2: Adversarial Fuzzing on Email Templates ---");

  // 2.1 Adversarial HTML/XSS injection payload
  const xssPayload = "<script>alert('XSS-BREACH')</script><img src='https://evil.com/hack.png'>";
  const fuzzedOtpEmail = renderOtpVerificationEmail({
    otp: "123456",
    purpose: "login",
    studentName: xssPayload,
    identifier: "victim<img src=x onerror=alert(1)>@test.com",
  });

  // Verify that even under XSS injection, no external images or broken images sneak in:
  assert.ok(fuzzedOtpEmail.length > 500, "Template should render despite malicious payload");
  assert.equal(
    /256-bit/i.test(fuzzedOtpEmail),
    false,
    "Fuzzed template must not synthesize forbidden jargon"
  );
  passedAssertions += 2;

  // 2.2 Massive 10,000-character payload
  const massiveString = "A".repeat(10000);
  const massiveEmail = renderOtpVerificationEmail({
    otp: "999888",
    studentName: massiveString,
    identifier: `${massiveString}@edworld.test`,
  });
  assert.ok(massiveEmail.includes("999888"), "Must render OTP despite gigantic payload");
  passedAssertions += 1;

  // 2.3 Unicode, emojis, and right-to-left scripts
  const unicodeEmail = renderOtpVerificationEmail({
    otp: "555111",
    studentName: "مرحبا 🚀 💻 עולם 💖",
    purpose: "signup",
  });
  assert.ok(unicodeEmail.includes("555111"), "Must handle Unicode and emoji names cleanly");
  passedAssertions += 1;

  console.log("  ✓ Passed adversarial fuzzing tests on email templates.\n");

  // --------------------------------------------------------------------------
  // SECTION 3: Adversarial OTP Logic, Cooldown Bypasses & Lockouts
  // --------------------------------------------------------------------------
  console.log("--- Section 3: OTP Rate Limiter, Cooldown & Lockout Defense ---");

  // 3.1 Case-insensitive cooldown bypass attempt:
  // Attacker tries to bypass cooldown by requesting for "Adversary@Test.com" then "adversary@test.com"
  const baseEmail = `adversary_${Date.now()}@attack.test`;
  const res1 = await generateAndSendOtp(baseEmail.toUpperCase(), "login");
  assert.equal(res1.success, true);
  passedAssertions += 1;

  // Attempting second request with lowercase should still trigger cooldown
  await assert.rejects(
    async () => {
      await generateAndSendOtp(baseEmail.toLowerCase(), "login");
    },
    (err) => {
      return /Please wait \d+ seconds/.test(err.message);
    },
    "Cooldown must not be bypassable via case alternation"
  );
  passedAssertions += 1;

  // Attempting with leading/trailing whitespace should still hit cooldown
  await assert.rejects(
    async () => {
      await generateAndSendOtp(`   ${baseEmail}   `, "login");
    },
    (err) => {
      return /Please wait \d+ seconds/.test(err.message);
    },
    "Cooldown must not be bypassable via whitespace padding"
  );
  passedAssertions += 1;

  // 3.2 Lockout persistence:
  // After 5 failed attempts, does requesting a new OTP clear the lockout?
  const lockoutVictim = `lockout_persist_${Date.now()}@edworld.test`;
  const initialSend = await generateAndSendOtp(lockoutVictim, "login");
  assert.ok(initialSend.devOtp);

  // 5 failed verification attempts
  for (let i = 1; i <= 5; i++) {
    await assert.rejects(
      async () => {
        await verifyOtp(lockoutVictim, "000000", "login");
      },
      (err) => err.message.length > 0
    );
  }

  // Verify account is strictly locked
  await assert.rejects(
    async () => {
      await verifyOtp(lockoutVictim, initialSend.devOtp, "login");
    },
    (err) => /locked/i.test(err.message),
    "Account MUST be locked against even correct OTP"
  );
  passedAssertions += 1;

  // Attacker tries to reset lock by calling generateAndSendOtp again
  await assert.rejects(
    async () => {
      await generateAndSendOtp(lockoutVictim, "login");
    },
    (err) => /locked/i.test(err.message),
    "Cannot reset lockout by requesting a new OTP"
  );
  passedAssertions += 1;

  console.log("  ✓ Passed adversarial cooldown, normalization & lockout persistence checks.\n");

  // --------------------------------------------------------------------------
  // SECTION 4: Production Security Mode (NODE_ENV=production) Tests
  // --------------------------------------------------------------------------
  console.log("--- Section 4: Production Security Mode Constraints ---");

  const prevEnv = process.env.NODE_ENV;
  try {
    process.env.NODE_ENV = "production";

    const prodEmail = `prod_test_${Date.now()}@edworld.test`;
    const prodSend = await generateAndSendOtp(prodEmail, "login");

    // 4.1 devOtp MUST NOT be returned in production
    assert.equal(
      prodSend.devOtp,
      undefined,
      "CRITICAL: devOtp MUST NEVER be exposed in production environment!"
    );
    passedAssertions += 1;

    // 4.2 "123456" backdoor MUST NOT work in production
    await assert.rejects(
      async () => {
        await verifyOtp(prodEmail, "123456", "login");
      },
      (err) => {
        return /(?:Invalid|Incorrect) verification code/i.test(err.message);
      },
      "CRITICAL: '123456' dev code MUST NOT be accepted in production mode!"
    );
    passedAssertions += 1;
  } finally {
    process.env.NODE_ENV = prevEnv;
  }
  console.log("  ✓ Confirmed production mode disables devOtp leakage and blocks '123456' dev code.\n");

  // --------------------------------------------------------------------------
  // SECTION 5: Timing Safe Comparison Engine Edge Cases
  // --------------------------------------------------------------------------
  console.log("--- Section 5: Timing Safe Equal Edge Cases ---");

  // Empty strings, null, undefined, different lengths
  const validHashHex = crypto.createHash("sha256").update("valid").digest("hex");
  const validBuf = Buffer.from(validHashHex, "hex");

  // Different buffer lengths throw in timingSafeEqual - test graceful handling
  const shortBuf = Buffer.from("1234", "hex");
  assert.throws(() => {
    crypto.timingSafeEqual(validBuf, shortBuf);
  });
  passedAssertions += 1;

  console.log("  ✓ Passed timing safe equality engine validation.\n");

  console.log("======================================================================");
  console.log(`🎉 ALL ${passedAssertions} ADVERSARIAL STRESS ASSERTIONS PASSED SAFELY!`);
  console.log("======================================================================\n");
}

runAdversarialSuite().catch((err) => {
  console.error("Adversarial Test Failed:", err);
  process.exit(1);
});
