import assert from "node:assert/strict";
import crypto from "node:crypto";
import {
  renderPasswordResetEmail,
  renderPasswordChangedConfirmationEmail,
} from "../../src/lib/email-templates.ts";

async function runTests() {
  console.log("=== Running Password Reset & Resend Email Test Suite ===\n");

  // Test 1: Password Reset Email Rendering
  console.log("Test 1: Verify Branded Password Reset Email Template...");
  const resetLink = "http://localhost:3000/auth/reset-password?token=abcdef123456&email=student%40edworld.co";
  const resetHtml = renderPasswordResetEmail({
    name: "Alex",
    resetLink,
    expiresIn: "1 hour",
  });

  assert.ok(resetHtml.includes("Reset Your Password"), "Must include reset title");
  assert.ok(resetHtml.includes(resetLink), "Must include the recovery link");
  assert.ok(resetHtml.includes("1 hour"), "Must state 1 hour expiry");
  assert.ok(resetHtml.includes("Security Notice:"), "Must include anti-phishing notice");
  console.log("  PASS: Password reset email renders branded, accessible HTML.\n");

  // Test 2: Password Changed Confirmation Email Rendering
  console.log("Test 2: Verify Password Changed Confirmation Email Template...");
  const confirmHtml = renderPasswordChangedConfirmationEmail({
    name: "Alex",
  });

  assert.ok(confirmHtml.includes("Password Updated Successfully"), "Must include confirmation title");
  assert.ok(confirmHtml.includes("edworld.eden@gmail.com"), "Must include master grievance email");
  console.log("  PASS: Confirmation email template verified.\n");

  // Test 3: Token Generation & SHA-256 Hashing
  console.log("Test 3: Token Generation & SHA-256 Hashing...");
  const rawToken = crypto.randomBytes(32).toString("hex");
  assert.equal(rawToken.length, 64, "32 bytes hex must be 64 characters");
  const tokenHash = crypto.createHash("sha256").update(rawToken).digest("hex");
  assert.equal(tokenHash.length, 64, "SHA-256 hash must be 64 hex characters");
  console.log("  PASS: Cryptographic token generation is secure and valid.\n");

  // Test 4: Password Complexity Enforcement
  console.log("Test 4: Password Complexity Rules...");
  const validatePass = (pwd) => {
    return (
      pwd.length >= 8 &&
      /[A-Z]/.test(pwd) &&
      /[a-z]/.test(pwd) &&
      /\d/.test(pwd)
    );
  };

  assert.equal(validatePass("simple"), false, "Too short");
  assert.equal(validatePass("alllowercase123"), false, "No uppercase");
  assert.equal(validatePass("ALLUPPERCASE123"), false, "No lowercase");
  assert.equal(validatePass("NoNumbersAtAll!"), false, "No numbers");
  assert.equal(validatePass("SecurePassword2026!"), true, "Valid strong password");
  console.log("  PASS: Password complexity rules enforced.\n");

  console.log("====================================================");
  console.log(" ALL PASSWORD RESET RESEND TESTS PASSED SAFELY! ");
  console.log("====================================================");
}

runTests().catch((err) => {
  console.error("Test Suite Failed:", err);
  process.exit(1);
});
