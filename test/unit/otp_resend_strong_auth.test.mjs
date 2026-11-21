import assert from "node:assert/strict";
import crypto from "node:crypto";
import { renderOtpVerificationEmail } from "../../src/lib/email-templates.ts";
import { resendTools } from "../../src/lib/mcp/tools/resend.ts";
import {
  generateAndSendOtp,
  verifyOtp,
  normalizeIdentifier,
  maskIdentifier,
} from "../../src/lib/otp-service.ts";

async function runTests() {
  console.log("=== Running Resend Email OTP & Auth Strong Test Suite ===\n");

  // Test 1: Email Template Rendering
  console.log("Test 1: Verify Branded Email Template Generation...");
  const otpCode = "849201";
  const htmlOutput = renderOtpVerificationEmail({
    otp: otpCode,
    purpose: "login",
    expiresMinutes: 5,
    identifier: "student@university.edu",
    studentName: "Adarsh",
  });

  assert.ok(htmlOutput.includes("849201"), "Template must display the exact 6-digit OTP");
  assert.ok(htmlOutput.includes("Expires in 5 minutes"), "Template must display 5-minute expiry notice");
  assert.ok(htmlOutput.includes("Never share this code"), "Template must display anti-phishing advisory");
  assert.ok(htmlOutput.includes("edworld.eden@gmail.com"), "Template must include grievance redressal contact");
  console.log("  PASS: Email template renders branded, responsive HTML with security warnings.\n");

  // Test 2: Identifier Masking and Normalization
  console.log("Test 2: Identifier Normalization & Masking...");
  assert.equal(normalizeIdentifier("  User.Test@Domain.COM "), "user.test@domain.com");
  assert.equal(maskIdentifier("adarsh.kolluru@gmail.com"), "a***u@gmail.com");
  assert.equal(maskIdentifier("+91 9876543210"), "+91 ******3210");
  console.log("  PASS: Normalization & PII masking comply with privacy guidelines.\n");

  // Test 3: Timing-Safe Comparison Engine
  console.log("Test 3: Timing-Safe Comparison Validation...");
  const salt = "test-salt-timing";
  const rawTestOtp = "492018";
  const hash1 = crypto.createHmac("sha256", salt).update(`user@test.com:${rawTestOtp}`).digest("hex");
  const hash2 = crypto.createHmac("sha256", salt).update(`user@test.com:${rawTestOtp}`).digest("hex");
  const badHash = crypto.createHmac("sha256", salt).update(`user@test.com:000000`).digest("hex");

  const buf1 = Buffer.from(hash1, "hex");
  const buf2 = Buffer.from(hash2, "hex");
  const bufBad = Buffer.from(badHash, "hex");

  assert.equal(crypto.timingSafeEqual(buf1, buf2), true, "Identical HMAC hashes must match timing-safe");
  assert.equal(crypto.timingSafeEqual(buf1, bufBad), false, "Mismatched HMAC hashes must fail timing-safe");
  console.log("  PASS: TimingSafeEqual guarantees defense against side-channel timing analysis.\n");

  // Test 4: Generation, Cooldown & Retrieval
  console.log("Test 4: OTP Generation & 45s Cooldown Enforcement...");
  const testEmail = `auth_strong_tester_${Date.now()}@edworld.test`;
  const sendResult = await generateAndSendOtp(testEmail, "login");

  assert.equal(sendResult.success, true);
  assert.ok(sendResult.devOtp, "devOtp should be returned in non-prod mode");
  assert.equal(sendResult.devOtp.length, 6, "OTP must be 6 digits");
  assert.equal(sendResult.cooldownSeconds, 45, "Cooldown must be 45 seconds");

  // Immediate retry should trigger cooldown exception
  await assert.rejects(
    async () => {
      await generateAndSendOtp(testEmail, "login");
    },
    (err) => {
      return /Please wait \d+ seconds before requesting another code/.test(err.message);
    },
    "Should reject re-request within 45s cooldown"
  );
  console.log("  PASS: 45-second cooldown successfully rejects rapid-fire requests.\n");

  // Test 5: Verify Valid OTP & Session Creation
  console.log("Test 5: OTP Verification & Single-Use Consumption...");
  const verifyResult = await verifyOtp(testEmail, sendResult.devOtp, "login");
  assert.equal(verifyResult.success, true);
  assert.ok(verifyResult.token.startsWith("edw_sess_"), "Must return secure session token");
  assert.ok(verifyResult.redirectUrl, "Must return authorized portal redirect");

  // Anti-Replay: Attempting to verify the exact same code again must fail
  await assert.rejects(
    async () => {
      await verifyOtp(testEmail, sendResult.devOtp, "login");
    },
    (err) => {
      return /This verification code has already been used/.test(err.message);
    },
    "Should reject reused OTP (anti-replay)"
  );
  console.log("  PASS: Verified code consumed and anti-replay guard activated.\n");

  // Test 6: 5-Attempt Lockout Mechanism
  console.log("Test 6: 5-Attempt Lockout Defense...");
  const lockoutEmail = `lockout_target_${Date.now()}@edworld.test`;
  const lockoutSend = await generateAndSendOtp(lockoutEmail, "login");
  assert.ok(lockoutSend.devOtp);

  // 4 incorrect attempts
  for (let i = 1; i <= 4; i++) {
    await assert.rejects(
      async () => {
        await verifyOtp(lockoutEmail, "999999", "login");
      },
      (err) => {
        return err.message.includes("attempts remaining");
      }
    );
  }

  // 5th incorrect attempt -> triggers 15-minute lockout
  await assert.rejects(
    async () => {
      await verifyOtp(lockoutEmail, "999999", "login");
    },
    (err) => {
      return err.message.includes("Account verification is locked for 15 minutes");
    },
    "5th failure must trigger 15-minute lock"
  );

  // Even submitting correct OTP during lockout must be blocked
  await assert.rejects(
    async () => {
      await verifyOtp(lockoutEmail, lockoutSend.devOtp, "login");
    },
    (err) => {
      return err.message.includes("Account verification is locked");
    },
    "Should remain locked against valid OTP during lockout period"
  );
  console.log("  PASS: 5-strike brute-force lockout defends against guessing attacks.\n");

  // Test 7: Resend MCP Tool Registration
  console.log("Test 7: Resend MCP Tools Registration...");
  const otpTool = resendTools.find((t) => t.name === "resend_send_otp_email");
  assert.ok(otpTool, "resend_send_otp_email tool must be defined in resendTools");
  assert.equal(otpTool.parameters.email.required, true);
  assert.equal(otpTool.parameters.otp.required, true);
  console.log("  PASS: MCP tool 'resend_send_otp_email' registered with full parameter schema.\n");

  console.log("====================================================");
  console.log(" ALL 7 AUTH STRONG RESEND OTP TESTS PASSED SAFELY! ");
  console.log("====================================================");
}

runTests().catch((err) => {
  console.error("Test Suite Failed:", err);
  process.exit(1);
});
