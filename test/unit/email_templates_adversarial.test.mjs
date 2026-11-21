import assert from "node:assert/strict";
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

/**
 * Universal Empirical Oracle:
 * Every rendered email template in the system MUST satisfy all 6 invariant constraints.
 */
function verifyInvariants(html, contextName) {
  // 1. Must return a valid non-empty HTML string
  assert.equal(typeof html, "string", `${contextName}: Output must be a string`);
  assert.ok(html.length > 100, `${contextName}: Output HTML is suspiciously short (${html.length} chars)`);
  assert.ok(html.startsWith("<!DOCTYPE html>"), `${contextName}: Output must start with <!DOCTYPE html>`);
  assert.ok(html.includes("</html>"), `${contextName}: Output must close </html> tag`);

  // 2. Oracle: ZERO <img tags anywhere in rendered HTML
  const hasImgTag = /<img\b/i.test(html);
  assert.equal(hasImgTag, false, `${contextName}: VIOLATION - Contains <img tag in rendered HTML!`);

  // 3. Oracle: ZERO remote image URLs (.png, .jpg, .jpeg, .gif, .webp, .svg, .ico, .avif)
  const remoteImagePattern = /https?:\/\/[^\s"'<>]+\.(png|jpe?g|gif|webp|svg|ico|bmp|avif)(\?[^\s"'<>]*)?/i;
  const remoteImageMatch = html.match(remoteImagePattern);
  assert.equal(
    remoteImageMatch,
    null,
    `${contextName}: VIOLATION - Contains remote image URL reference: ${remoteImageMatch ? remoteImageMatch[0] : ""}`
  );

  // 4. Oracle: ZERO remote CSS url(...) images
  const cssUrlPattern = /url\s*\(\s*['"]?https?:\/\/[^\s"')]+/i;
  const cssUrlMatch = html.match(cssUrlPattern);
  assert.equal(
    cssUrlMatch,
    null,
    `${contextName}: VIOLATION - Contains remote CSS url() reference: ${cssUrlMatch ? cssUrlMatch[0] : ""}`
  );

  // 5. Oracle: ZERO encryption jargon ("256-BIT", "AUTH SENTINEL")
  const has256Bit = /256-bit/i.test(html);
  assert.equal(has256Bit, false, `${contextName}: VIOLATION - Contains '256-bit' encryption jargon!`);

  const hasAuthSentinel = /auth\s*sentinel/i.test(html);
  assert.equal(hasAuthSentinel, false, `${contextName}: VIOLATION - Contains 'AUTH SENTINEL' legacy jargon!`);

  // 6. Oracle: Brand Identity & Compliance Stamps Preserved
  assert.ok(html.includes("DPDP ACT 2023 COMPLIANT"), `${contextName}: Must preserve DPDP ACT 2023 COMPLIANT`);
  assert.ok(html.includes("STUDENT DATA PROTECTED"), `${contextName}: Must preserve STUDENT DATA PROTECTED`);
  assert.ok(html.includes('E<span style="color: #059669;">.</span>'), `${contextName}: Must contain inline monogram badge 'E.'`);
  assert.ok(html.includes("EdWorld Co."), `${contextName}: Must contain brand name 'EdWorld Co.'`);
}

async function runAdversarialTestSuite() {
  console.log("===============================================================================");
  console.log("🔥 EMPIRICAL ADVERSARIAL STRESS HARNESS: src/lib/email-templates.ts 🔥");
  console.log("===============================================================================\n");

  let testCount = 0;
  const startTime = Date.now();

  function testCase(name, fn) {
    testCount++;
    try {
      fn();
      console.log(`  ✓ Test ${testCount}: ${name}`);
    } catch (err) {
      console.error(`  ❌ FAILED Test ${testCount}: ${name}`);
      throw err;
    }
  }

  // -------------------------------------------------------------------------
  // SUITE 1: renderBrandedEmailHtml core template generator
  // -------------------------------------------------------------------------
  console.log("--- Suite 1: renderBrandedEmailHtml Base Canvas Stress ---");

  testCase("renderBrandedEmailHtml: Baseline standard parameters", () => {
    const html = renderBrandedEmailHtml({
      previewText: "Test preview message",
      title: "Test System Announcement",
      contentHtml: "<p>Hello student, this is a test notification.</p>",
      ctaText: "Explore Now",
      ctaUrl: "https://edworld.co.in/dashboard",
      footerNote: "Test footer note",
    });
    verifyInvariants(html, "renderBrandedEmailHtml: Baseline");
    assert.ok(html.includes("Test preview message"));
    assert.ok(html.includes("Test System Announcement"));
    assert.ok(html.includes("Explore Now &rarr;"));
    assert.ok(html.includes("https://edworld.co.in/dashboard"));
    assert.ok(html.includes("Test footer note"));
  });

  testCase("renderBrandedEmailHtml: Empty string inputs", () => {
    const html = renderBrandedEmailHtml({
      previewText: "",
      title: "",
      contentHtml: "",
      ctaText: "",
      ctaUrl: "",
      footerNote: "",
    });
    verifyInvariants(html, "renderBrandedEmailHtml: Empty strings");
    // Fallback footerNote must activate
    assert.ok(html.includes("You received this email because of your verified account on EdWorld Co."));
    // CTA button container should not render when empty
    assert.equal(html.includes('<div class="cta-container">'), false);
  });

  testCase("renderBrandedEmailHtml: Asymmetric CTA props (ctaText without ctaUrl)", () => {
    const html1 = renderBrandedEmailHtml({
      previewText: "Preview",
      title: "Title",
      contentHtml: "<p>Content</p>",
      ctaText: "Click Me",
      ctaUrl: undefined,
    });
    verifyInvariants(html1, "renderBrandedEmailHtml: ctaText only");
    assert.equal(html1.includes('<div class="cta-container">'), false);

    const html2 = renderBrandedEmailHtml({
      previewText: "Preview",
      title: "Title",
      contentHtml: "<p>Content</p>",
      ctaText: undefined,
      ctaUrl: "https://edworld.co.in/target",
    });
    verifyInvariants(html2, "renderBrandedEmailHtml: ctaUrl only");
    assert.equal(html2.includes('<div class="cta-container">'), false);
  });

  testCase("renderBrandedEmailHtml: Hostile XSS & Injection Payloads", () => {
    const hostileTitle = `<script>alert('pwned')</script>" autofocus onfocus="alert(1)`;
    const hostilePreview = `"><svg onload=alert(document.cookie)> & < > " '`;
    const hostileContent = `<div class="evil"><iframe src="javascript:alert(1)"></iframe></div>`;
    const html = renderBrandedEmailHtml({
      previewText: hostilePreview,
      title: hostileTitle,
      contentHtml: hostileContent,
      ctaText: `"><script>alert(2)</script>`,
      ctaUrl: `javascript:alert(document.domain)`,
    });
    verifyInvariants(html, "renderBrandedEmailHtml: XSS injection");
    // Even if injected strings contain svg, remote image oracle must pass
    assert.equal(/<img\b/i.test(html), false);
  });

  testCase("renderBrandedEmailHtml: Massive payload stress (100,000 characters)", () => {
    const hugeContent = "<p>" + "A".repeat(100000) + "</p>";
    const html = renderBrandedEmailHtml({
      previewText: "Massive stress preview",
      title: "Stress Title",
      contentHtml: hugeContent,
    });
    verifyInvariants(html, "renderBrandedEmailHtml: Massive payload");
    assert.ok(html.length > 100000);
  });

  testCase("renderBrandedEmailHtml: Legacy logoUrl passed in props is safely ignored without <img", () => {
    const html = renderBrandedEmailHtml({
      previewText: "Logo test",
      title: "Logo test",
      contentHtml: "<p>Testing</p>",
      logoUrl: "https://evil-remote-cdn.com/exploit.png",
    });
    verifyInvariants(html, "renderBrandedEmailHtml: Legacy logoUrl prop");
    assert.equal(html.includes("evil-remote-cdn.com"), false);
    assert.equal(/<img\b/i.test(html), false);
  });

  // -------------------------------------------------------------------------
  // SUITE 2: renderAmbassadorApprovedEmail
  // -------------------------------------------------------------------------
  console.log("\n--- Suite 2: renderAmbassadorApprovedEmail Stress ---");

  testCase("renderAmbassadorApprovedEmail: Baseline standard parameters", () => {
    const html = renderAmbassadorApprovedEmail({
      name: "Priya Sharma",
      collegeName: "IIT Hyderabad",
      referralCode: "PRIYA-IITH-2026",
    });
    verifyInvariants(html, "renderAmbassadorApprovedEmail: Baseline");
    assert.ok(html.includes("Priya Sharma"));
    assert.ok(html.includes("IIT Hyderabad"));
    assert.ok(html.includes("PRIYA-IITH-2026"));
  });

  testCase("renderAmbassadorApprovedEmail: Empty strings and special characters", () => {
    const html = renderAmbassadorApprovedEmail({
      name: "",
      collegeName: "St. John's & Mary's College / University (A+)",
      referralCode: "CODE!@#$%^&*()_+",
    });
    verifyInvariants(html, "renderAmbassadorApprovedEmail: Special characters");
    assert.ok(html.includes("CODE!@#$%^&amp;*()_+") || html.includes("CODE!@#$%^&*()_+"));
  });

  // -------------------------------------------------------------------------
  // SUITE 3: renderInterviewScorecardEmail
  // -------------------------------------------------------------------------
  console.log("\n--- Suite 3: renderInterviewScorecardEmail Stress ---");

  testCase("renderInterviewScorecardEmail: Score boundaries (>=80, 60-79, <60, edge values)", () => {
    // Score >= 80 -> Emerald (#059669)
    const htmlHigh = renderInterviewScorecardEmail({
      name: "Rohit",
      sessionTitle: "DSA System Design Round",
      overallScore: 80,
      sessionId: "session-abc-123",
    });
    verifyInvariants(htmlHigh, "renderInterviewScorecardEmail: Score 80");
    assert.ok(htmlHigh.includes("#059669"), "Score 80 must have emerald color #059669");

    // Score 79 -> Blue (#2563EB)
    const htmlMid = renderInterviewScorecardEmail({
      name: "Rohit",
      sessionTitle: "DSA System Design Round",
      overallScore: 79,
      sessionId: "session-abc-123",
    });
    verifyInvariants(htmlMid, "renderInterviewScorecardEmail: Score 79");
    assert.ok(htmlMid.includes("#2563EB"), "Score 79 must have blue color #2563EB");

    // Score 60 -> Blue (#2563EB)
    const htmlMidLow = renderInterviewScorecardEmail({
      name: "Rohit",
      sessionTitle: "DSA System Design Round",
      overallScore: 60,
      sessionId: "session-abc-123",
    });
    verifyInvariants(htmlMidLow, "renderInterviewScorecardEmail: Score 60");
    assert.ok(htmlMidLow.includes("#2563EB"), "Score 60 must have blue color #2563EB");

    // Score 59 -> Amber (#D97706)
    const htmlLow = renderInterviewScorecardEmail({
      name: "Rohit",
      sessionTitle: "DSA System Design Round",
      overallScore: 59,
      sessionId: "session-abc-123",
    });
    verifyInvariants(htmlLow, "renderInterviewScorecardEmail: Score 59");
    assert.ok(htmlLow.includes("#D97706"), "Score 59 must have amber color #D97706");

    // Score 0 and negative
    const htmlZero = renderInterviewScorecardEmail({
      name: "Rohit",
      sessionTitle: "DSA System Design Round",
      overallScore: 0,
      sessionId: "session-zero",
    });
    verifyInvariants(htmlZero, "renderInterviewScorecardEmail: Score 0");
    assert.ok(htmlZero.includes("#D97706"));

    // Score float 92.5
    const htmlFloat = renderInterviewScorecardEmail({
      name: "Rohit",
      sessionTitle: "DSA System Design Round",
      overallScore: 92.5,
      sessionId: "session-float",
    });
    verifyInvariants(htmlFloat, "renderInterviewScorecardEmail: Score Float");
    assert.ok(htmlFloat.includes("92.5"));
  });

  // -------------------------------------------------------------------------
  // SUITE 4 & 5: renderConnectionRequestReceivedEmail & renderConnectionAcceptedEmail
  // -------------------------------------------------------------------------
  console.log("\n--- Suite 4 & 5: Network Connection Emails Stress ---");

  testCase("renderConnectionRequestReceivedEmail: Full parameters vs omitted optional fields", () => {
    // With all optional fields
    const htmlFull = renderConnectionRequestReceivedEmail({
      recipientName: "Ananya",
      requesterName: "Vikram Reddy",
      requesterHeadline: "Full Stack Engineer @ Google",
      requesterCollegeOrCompany: "Google / BITS Pilani",
      message: "Hey! Loved your open source project on Web3 compilers. Let's connect!",
    });
    verifyInvariants(htmlFull, "renderConnectionRequestReceivedEmail: Full");
    assert.ok(htmlFull.includes("Full Stack Engineer @ Google"));
    assert.ok(htmlFull.includes("Hey! Loved your open source"));

    // With omitted optional fields
    const htmlMinimal = renderConnectionRequestReceivedEmail({
      recipientName: "Ananya",
      requesterName: "Vikram Reddy",
    });
    verifyInvariants(htmlMinimal, "renderConnectionRequestReceivedEmail: Minimal");
    assert.equal(htmlMinimal.includes("undefined"), false);
  });

  testCase("renderConnectionAcceptedEmail: Full parameters vs omitted optional fields", () => {
    const htmlFull = renderConnectionAcceptedEmail({
      recipientName: "Vikram",
      accepterName: "Ananya Patel",
      accepterHeadline: "ML Researcher @ Microsoft",
      accepterCollegeOrCompany: "Microsoft / IIT Bombay",
    });
    verifyInvariants(htmlFull, "renderConnectionAcceptedEmail: Full");
    assert.ok(htmlFull.includes("Ananya Patel"));
    assert.ok(htmlFull.includes("ML Researcher @ Microsoft"));

    const htmlMinimal = renderConnectionAcceptedEmail({
      recipientName: "Vikram",
      accepterName: "Ananya Patel",
    });
    verifyInvariants(htmlMinimal, "renderConnectionAcceptedEmail: Minimal");
    assert.equal(htmlMinimal.includes("undefined"), false);
  });

  // -------------------------------------------------------------------------
  // SUITE 6 & 7: Password Reset & Confirmation Emails
  // -------------------------------------------------------------------------
  console.log("\n--- Suite 6 & 7: Password Recovery Emails Stress ---");

  testCase("renderPasswordResetEmail: Default expiresIn vs explicit expiresIn vs edge links", () => {
    const htmlDefault = renderPasswordResetEmail({
      name: "Siddharth",
      resetLink: "https://edworld.co.in/auth/reset-password?token=sec_abc123&uid=usr_456",
    });
    verifyInvariants(htmlDefault, "renderPasswordResetEmail: Default expiry");
    assert.ok(htmlDefault.includes("1 hour"), "Must default to 1 hour");
    assert.ok(htmlDefault.includes("sec_abc123"));

    const htmlCustom = renderPasswordResetEmail({
      name: "Siddharth",
      resetLink: "https://edworld.co.in/auth/reset",
      expiresIn: "30 minutes",
    });
    verifyInvariants(htmlCustom, "renderPasswordResetEmail: Custom expiry");
    assert.ok(htmlCustom.includes("30 minutes"));

    const htmlEmptyExpiry = renderPasswordResetEmail({
      name: "Siddharth",
      resetLink: "https://edworld.co.in/auth/reset",
      expiresIn: "",
    });
    verifyInvariants(htmlEmptyExpiry, "renderPasswordResetEmail: Empty expiry");
    assert.ok(htmlEmptyExpiry.includes("1 hour"), "Empty expiry string must fall back to 1 hour");
  });

  testCase("renderPasswordChangedConfirmationEmail: Baseline and special characters", () => {
    const html = renderPasswordChangedConfirmationEmail({
      name: "Kiran Kumar",
    });
    verifyInvariants(html, "renderPasswordChangedConfirmationEmail: Baseline");
    assert.ok(html.includes("Password Updated Successfully"));
    assert.ok(html.includes("Kiran Kumar"));
    assert.ok(html.includes("Automated account security alert from EdWorld Co."));
  });

  // -------------------------------------------------------------------------
  // SUITE 8: renderSignupWelcomeEmail
  // -------------------------------------------------------------------------
  console.log("\n--- Suite 8: renderSignupWelcomeEmail Stress ---");

  testCase("renderSignupWelcomeEmail: Name variations (Full name, single, whitespace, empty)", () => {
    // Full name
    const htmlFull = renderSignupWelcomeEmail({
      name: "Aarav Kumar",
      email: "aarav@gmail.com",
    });
    verifyInvariants(htmlFull, "renderSignupWelcomeEmail: Full name");
    assert.ok(htmlFull.includes("Welcome to EdWorld Co., Aarav!"));

    // Single name
    const htmlSingle = renderSignupWelcomeEmail({
      name: "Aarav",
      email: "aarav@gmail.com",
    });
    verifyInvariants(htmlSingle, "renderSignupWelcomeEmail: Single name");
    assert.ok(htmlSingle.includes("Welcome to EdWorld Co., Aarav!"));

    // Trailing/leading spaces
    const htmlPadded = renderSignupWelcomeEmail({
      name: "   Sneha   Rao   ",
      email: "sneha@gmail.com",
    });
    verifyInvariants(htmlPadded, "renderSignupWelcomeEmail: Padded name");
    assert.ok(htmlPadded.includes("Welcome to EdWorld Co., Sneha!"));

    // Empty name
    const htmlEmpty = renderSignupWelcomeEmail({
      name: "",
      email: "guest@edworld.co.in",
    });
    verifyInvariants(htmlEmpty, "renderSignupWelcomeEmail: Empty name");
    assert.ok(htmlEmpty.includes("Welcome to EdWorld Co., Learner!"), "Empty name must fall back to Learner");

    // Undefined careerStage
    const htmlNoCareer = renderSignupWelcomeEmail({
      name: "Dev",
      email: "dev@edworld.co.in",
      careerStage: undefined,
    });
    verifyInvariants(htmlNoCareer, "renderSignupWelcomeEmail: Undefined careerStage");
    assert.equal(htmlNoCareer.includes("undefined"), false);
  });

  // -------------------------------------------------------------------------
  // SUITE 9: renderProjectCompletionCertificateEmail (CRITICAL LOGO FIX SITE)
  // -------------------------------------------------------------------------
  console.log("\n--- Suite 9: renderProjectCompletionCertificateEmail Stress ---");

  testCase("renderProjectCompletionCertificateEmail: Dual Monogram Zero-Image Verification", () => {
    const html = renderProjectCompletionCertificateEmail({
      studentName: "Meera Krishnan",
      projectName: "Autonomous Drone Swarm Controller",
      certificateUrl: "https://edworld.co.in/credentials/cert_swarm_2026",
      certificateCode: "EDW-CERT-98234-XYZ",
    });

    verifyInvariants(html, "renderProjectCompletionCertificateEmail: Dual Monogram");
    assert.ok(html.includes("Meera"), "First name parsed correctly");
    assert.ok(html.includes("Autonomous Drone Swarm Controller"));
    assert.ok(html.includes("EDW-CERT-98234-XYZ"));
    assert.ok(html.includes("https://edworld.co.in/credentials/cert_swarm_2026"));

    // Count occurrences of the bulletproof inline monogram 'E.'
    // There MUST be at least TWO monograms:
    // 1 in the master header
    // 1 in the certificate credential card body
    const monogramMatches = html.match(/E<span style="color: #059669;">\.<\/span>/g);
    assert.ok(
      monogramMatches && monogramMatches.length >= 2,
      `Expected at least 2 inline monograms, found ${monogramMatches ? monogramMatches.length : 0}`
    );

    // Verify ZERO <img tags anywhere in this certificate template
    assert.equal(/<img\b/i.test(html), false, "Must not contain any <img tag");
    assert.equal(html.includes("edworld-logo.png"), false, "Must not contain edworld-logo.png reference");
  });

  testCase("renderProjectCompletionCertificateEmail: Empty studentName and edge inputs", () => {
    const html = renderProjectCompletionCertificateEmail({
      studentName: "",
      projectName: "NextGen AI & Security",
      certificateUrl: "https://edworld.co.in/cert/123",
      certificateCode: "CODE-123",
    });
    verifyInvariants(html, "renderProjectCompletionCertificateEmail: Empty studentName");
    assert.ok(html.includes("Dear <strong>Learner</strong>"), "Empty studentName must fall back to Learner");
  });

  // -------------------------------------------------------------------------
  // SUITE 10: renderOtpVerificationEmail (OTP Login / Signup / Resend)
  // -------------------------------------------------------------------------
  console.log("\n--- Suite 10: renderOtpVerificationEmail Stress ---");

  testCase("renderOtpVerificationEmail: Purpose variants ('signup', 'login', 'auth', custom, undefined)", () => {
    // Signup
    const htmlSignup = renderOtpVerificationEmail({
      otp: "847291",
      purpose: "signup",
      expiresMinutes: 5,
      identifier: "student@college.edu",
      studentName: "Pooja Hegde",
    });
    verifyInvariants(htmlSignup, "renderOtpVerificationEmail: signup");
    assert.ok(htmlSignup.includes("complete your account creation"));
    assert.ok(htmlSignup.includes("847291"));
    assert.ok(htmlSignup.includes("5 minutes"));
    assert.ok(htmlSignup.includes("student@college.edu"));

    // Login
    const htmlLogin = renderOtpVerificationEmail({
      otp: "192837",
      purpose: "login",
      expiresMinutes: 10,
      identifier: "+919876543210",
      studentName: "Rahul",
    });
    verifyInvariants(htmlLogin, "renderOtpVerificationEmail: login");
    assert.ok(htmlLogin.includes("sign in securely to your account"));
    assert.ok(htmlLogin.includes("192837"));
    assert.ok(htmlLogin.includes("10 minutes"));

    // Auth / fallback purpose
    const htmlAuth = renderOtpVerificationEmail({
      otp: "999888",
      purpose: "auth",
    });
    verifyInvariants(htmlAuth, "renderOtpVerificationEmail: auth");
    assert.ok(htmlAuth.includes("verify your identity"));

    // Undefined purpose
    const htmlUndefined = renderOtpVerificationEmail({
      otp: "555444",
    });
    verifyInvariants(htmlUndefined, "renderOtpVerificationEmail: undefined purpose");
    assert.ok(htmlUndefined.includes("verify your identity"));

    // Custom purpose string
    const htmlCustom = renderOtpVerificationEmail({
      otp: "111222",
      purpose: "password_reset_confirmation",
    });
    verifyInvariants(htmlCustom, "renderOtpVerificationEmail: custom purpose");
    assert.ok(htmlCustom.includes("verify your identity"));
  });

  testCase("renderOtpVerificationEmail: Expiry fallback & defaults", () => {
    // undefined expiresMinutes -> defaults to 5
    const html1 = renderOtpVerificationEmail({ otp: "123456" });
    verifyInvariants(html1, "renderOtpVerificationEmail: default expiry");
    assert.ok(html1.includes("5 minutes"));

    // expiresMinutes = 0 -> falls back to 5 via || operator
    const html2 = renderOtpVerificationEmail({ otp: "123456", expiresMinutes: 0 });
    verifyInvariants(html2, "renderOtpVerificationEmail: 0 expiry fallback");
    assert.ok(html2.includes("5 minutes"));

    // float expiresMinutes = 2.5
    const html3 = renderOtpVerificationEmail({ otp: "123456", expiresMinutes: 2.5 });
    verifyInvariants(html3, "renderOtpVerificationEmail: float expiry");
    assert.ok(html3.includes("2.5 minutes"));
  });

  testCase("renderOtpVerificationEmail: StudentName and Identifier fallbacks", () => {
    // Missing studentName -> Learner
    const html1 = renderOtpVerificationEmail({ otp: "123456" });
    assert.ok(html1.includes("Hello <strong>Learner</strong>"));
    // Missing identifier -> "your email"
    assert.ok(html1.includes("was sent to your email by EdWorld Co."));

    // Empty studentName -> Learner
    const html2 = renderOtpVerificationEmail({ otp: "123456", studentName: "" });
    assert.ok(html2.includes("Hello <strong>Learner</strong>"));

    // Whitespace studentName -> Learner
    const html3 = renderOtpVerificationEmail({ otp: "123456", studentName: "   " });
    verifyInvariants(html3, "renderOtpVerificationEmail: whitespace name");
  });

  // -------------------------------------------------------------------------
  // SUITE 11: Null & Undefined Parameter Robustness across all 10 functions
  // -------------------------------------------------------------------------
  console.log("\n--- Suite 11: Null & Undefined Parameter Robustness ---");

  testCase("Robustness: All 10 functions invoked with empty object {}", () => {
    // 1. renderBrandedEmailHtml
    const h1 = renderBrandedEmailHtml({});
    verifyInvariants(h1, "Empty props: renderBrandedEmailHtml");

    // 2. renderAmbassadorApprovedEmail
    const h2 = renderAmbassadorApprovedEmail({});
    verifyInvariants(h2, "Empty props: renderAmbassadorApprovedEmail");

    // 3. renderInterviewScorecardEmail
    const h3 = renderInterviewScorecardEmail({});
    verifyInvariants(h3, "Empty props: renderInterviewScorecardEmail");

    // 4. renderConnectionRequestReceivedEmail
    const h4 = renderConnectionRequestReceivedEmail({});
    verifyInvariants(h4, "Empty props: renderConnectionRequestReceivedEmail");

    // 5. renderConnectionAcceptedEmail
    const h5 = renderConnectionAcceptedEmail({});
    verifyInvariants(h5, "Empty props: renderConnectionAcceptedEmail");

    // 6. renderPasswordResetEmail
    const h6 = renderPasswordResetEmail({});
    verifyInvariants(h6, "Empty props: renderPasswordResetEmail");

    // 7. renderPasswordChangedConfirmationEmail
    const h7 = renderPasswordChangedConfirmationEmail({});
    verifyInvariants(h7, "Empty props: renderPasswordChangedConfirmationEmail");

    // 8. renderSignupWelcomeEmail
    const h8 = renderSignupWelcomeEmail({});
    verifyInvariants(h8, "Empty props: renderSignupWelcomeEmail");

    // 9. renderProjectCompletionCertificateEmail
    const h9 = renderProjectCompletionCertificateEmail({});
    verifyInvariants(h9, "Empty props: renderProjectCompletionCertificateEmail");

    // 10. renderOtpVerificationEmail
    const h10 = renderOtpVerificationEmail({});
    verifyInvariants(h10, "Empty props: renderOtpVerificationEmail");
  });

  testCase("Robustness: All 10 functions invoked with null fields", () => {
    const h1 = renderBrandedEmailHtml({ previewText: null, title: null, contentHtml: null });
    verifyInvariants(h1, "Null props: renderBrandedEmailHtml");

    const h2 = renderAmbassadorApprovedEmail({ name: null, collegeName: null, referralCode: null });
    verifyInvariants(h2, "Null props: renderAmbassadorApprovedEmail");

    const h3 = renderInterviewScorecardEmail({ name: null, sessionTitle: null, overallScore: null, sessionId: null });
    verifyInvariants(h3, "Null props: renderInterviewScorecardEmail");

    const h4 = renderConnectionRequestReceivedEmail({ recipientName: null, requesterName: null, message: null });
    verifyInvariants(h4, "Null props: renderConnectionRequestReceivedEmail");

    const h5 = renderConnectionAcceptedEmail({ recipientName: null, accepterName: null });
    verifyInvariants(h5, "Null props: renderConnectionAcceptedEmail");

    const h6 = renderPasswordResetEmail({ name: null, resetLink: null, expiresIn: null });
    verifyInvariants(h6, "Null props: renderPasswordResetEmail");

    const h7 = renderPasswordChangedConfirmationEmail({ name: null });
    verifyInvariants(h7, "Null props: renderPasswordChangedConfirmationEmail");

    const h8 = renderSignupWelcomeEmail({ name: null, email: null });
    verifyInvariants(h8, "Null props: renderSignupWelcomeEmail");

    const h9 = renderProjectCompletionCertificateEmail({ studentName: null, projectName: null, certificateUrl: null, certificateCode: null });
    verifyInvariants(h9, "Null props: renderProjectCompletionCertificateEmail");

    const h10 = renderOtpVerificationEmail({ otp: null, purpose: null, expiresMinutes: null, identifier: null, studentName: null });
    verifyInvariants(h10, "Null props: renderOtpVerificationEmail");
  });

  // -------------------------------------------------------------------------
  // SUITE 12: High-Volume Fuzzing & Mutation Stress Loop (1,000 Iterations)
  // -------------------------------------------------------------------------
  console.log("\n--- Suite 12: High-Volume Fuzzing Stress Loop (1,000 Iterations) ---");

  const fuzzVectors = [
    "",
    "   ",
    "\t\n\r",
    "<script>alert(1)</script>",
    "'; DROP TABLE users; --",
    "E<span style='color:red'>.</span>",
    "🔥 ✦ • 🔐 \u0000 \uFFFF \u200B \uFEFF",
    "A".repeat(5000),
    "你好世界 / مرحبًا / გამარჯობა / שָׁלוֹם",
    "\"'`><&!@#$%^&*()_+-=[]{}|;:,./?",
    "undefined",
    "null",
    "NaN",
  ];

  let fuzzIterations = 0;
  for (let i = 0; i < 100; i++) {
    for (const vector of fuzzVectors) {
      fuzzIterations++;

      // Fuzz Branded Base
      const h1 = renderBrandedEmailHtml({
        previewText: vector,
        title: vector,
        contentHtml: `<p>${vector}</p>`,
        ctaText: vector,
        ctaUrl: `https://edworld.co.in/${encodeURIComponent(vector)}`,
        footerNote: vector,
      });
      verifyInvariants(h1, `Fuzz Base [${fuzzIterations}]`);

      // Fuzz OTP
      const h2 = renderOtpVerificationEmail({
        otp: vector.slice(0, 8) || "999999",
        purpose: vector,
        expiresMinutes: (i % 15) + 1,
        identifier: vector,
        studentName: vector,
      });
      verifyInvariants(h2, `Fuzz OTP [${fuzzIterations}]`);

      // Fuzz Certificate
      const h3 = renderProjectCompletionCertificateEmail({
        studentName: vector,
        projectName: vector,
        certificateUrl: `https://edworld.co.in/c/${encodeURIComponent(vector)}`,
        certificateCode: vector || "EDW-001",
      });
      verifyInvariants(h3, `Fuzz Certificate [${fuzzIterations}]`);
    }
  }

  const durationMs = Date.now() - startTime;
  console.log(`  ✓ Completed ${fuzzIterations * 3} randomized mutation renders across 100 cycles.`);
  console.log(`  ✓ Execution time: ${durationMs}ms`);

  console.log("\n===============================================================================");
  console.log(`🎉 ALL ${testCount} UNIT SUITES & ${fuzzIterations * 3} ADVERSARIAL STRESS RENDERS PASSED! 🎉`);
  console.log("===============================================================================");
}

runAdversarialTestSuite().catch((err) => {
  console.error("\n💥 UNHANDLED EXCEPTION IN ADVERSARIAL TEST HARNESS:", err);
  process.exit(1);
});
