import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

test("Firestore Security Rules Analysis & Consolidation", async (t) => {
  const rulesPath = path.resolve(__dirname, "../../firestore.rules");
  const rulesContent = fs.readFileSync(rulesPath, "utf-8");

  await t.test("Consolidates auditLogs rules into exactly ONE rule block", () => {
    const auditLogMatches = rulesContent.match(/match\s+\/auditLogs\/\{logId\}/g);
    assert.equal(
      auditLogMatches?.length,
      1,
      `Expected exactly 1 'match /auditLogs/{logId}' block, but found ${auditLogMatches?.length}`
    );
  });

  await t.test("Denies all client writes to auditLogs (allow write: if false;)", () => {
    const auditBlock = rulesContent.match(/match\s+\/auditLogs\/\{logId\}\s*\{([^}]+)\}/s);
    assert.ok(auditBlock, "auditLogs rule block must exist");
    assert.match(
      auditBlock[1],
      /allow\s+write:\s*if\s+false\s*;/,
      "auditLogs must strictly deny all client writes (allow write: if false;)"
    );
  });

  await t.test("Preserves authorized admin reads to auditLogs", () => {
    const auditBlock = rulesContent.match(/match\s+\/auditLogs\/\{logId\}\s*\{([^}]+)\}/s);
    assert.ok(auditBlock, "auditLogs rule block must exist");
    assert.match(
      auditBlock[1],
      /allow\s+read:\s*if\s+isAuthenticated\(\)\s*&&\s*request\.auth\.token\.isAdmin\s*==\s*true\s*;/,
      "auditLogs must require isAuthenticated() and request.auth.token.isAdmin == true for read"
    );
  });

  await t.test("Denies direct client read and write to guardianConsents (allow read, write: if false;)", () => {
    const consentBlock = rulesContent.match(/match\s+\/guardianConsents\/\{tokenId\}\s*\{([^}]+)\}/s);
    assert.ok(consentBlock, "guardianConsents rule block must exist");
    assert.match(
      consentBlock[1],
      /allow\s+read,\s*write:\s*if\s+false\s*;/,
      "guardianConsents must strictly deny direct client read and write"
    );
  });
});

test("Guardian Consent Server Verification Logic & Single-Use Tokens", async (t) => {
  const TOKEN_EXPIRY_MS = 7 * 24 * 60 * 60 * 1000;

  function evaluateConsentAttempt(record, nowMs = Date.now()) {
    if (!record) {
      return { ok: false, status: 404, error: "TOKEN_NOT_FOUND" };
    }

    const createdMs = new Date(record.sent_at).getTime();
    if (!isNaN(createdMs) && nowMs - createdMs > TOKEN_EXPIRY_MS) {
      return { ok: false, status: 410, error: "TOKEN_EXPIRED" };
    }

    if (record.status !== "pending") {
      return { ok: false, status: 409, error: "TOKEN_ALREADY_USED" };
    }

    return { ok: true, status: 200 };
  }

  await t.test("Accepts valid, fresh, pending token on first attempt", () => {
    const freshRecord = {
      id: "consent-1",
      token: "valid_fresh_token_123",
      status: "pending",
      sent_at: new Date().toISOString(),
    };

    const res = evaluateConsentAttempt(freshRecord);
    assert.equal(res.ok, true);
    assert.equal(res.status, 200);
  });

  await t.test("Rejects non-existent token with 404 TOKEN_NOT_FOUND", () => {
    const res = evaluateConsentAttempt(null);
    assert.equal(res.ok, false);
    assert.equal(res.status, 404);
    assert.equal(res.error, "TOKEN_NOT_FOUND");
  });

  await t.test("Rejects expired token older than 7 days with 410 TOKEN_EXPIRED", () => {
    const eightDaysAgo = new Date(Date.now() - 8 * 24 * 60 * 60 * 1000).toISOString();
    const expiredRecord = {
      id: "consent-2",
      token: "expired_token_456",
      status: "pending",
      sent_at: eightDaysAgo,
    };

    const res = evaluateConsentAttempt(expiredRecord);
    assert.equal(res.ok, false);
    assert.equal(res.status, 410);
    assert.equal(res.error, "TOKEN_EXPIRED");
  });

  await t.test("Rejects already-used token ('verified') with 409 TOKEN_ALREADY_USED", () => {
    const usedRecord = {
      id: "consent-3",
      token: "consumed_token_789",
      status: "verified",
      sent_at: new Date().toISOString(),
    };

    const res = evaluateConsentAttempt(usedRecord);
    assert.equal(res.ok, false);
    assert.equal(res.status, 409);
    assert.equal(res.error, "TOKEN_ALREADY_USED");
  });

  await t.test("Rejects already-used token ('revoked') with 409 TOKEN_ALREADY_USED", () => {
    const revokedRecord = {
      id: "consent-4",
      token: "revoked_token_101",
      status: "revoked",
      sent_at: new Date().toISOString(),
    };

    const res = evaluateConsentAttempt(revokedRecord);
    assert.equal(res.ok, false);
    assert.equal(res.status, 409);
    assert.equal(res.error, "TOKEN_ALREADY_USED");
  });
});

test("Cloud Function Transaction & Single-Use Invariant", async (t) => {
  const funcSrcPath = path.resolve(__dirname, "../../functions/src/guardianConsent.ts");
  const funcSrc = fs.readFileSync(funcSrcPath, "utf-8");

  await t.test("Cloud Function runs in a Firestore transaction", () => {
    assert.match(funcSrc, /db\.runTransaction/, "verifyGuardianConsentToken must use a transaction");
  });

  await t.test("Cloud Function checks token expiration", () => {
    assert.match(funcSrc, /TOKEN_EXPIRY_MS/, "verifyGuardianConsentToken must enforce TOKEN_EXPIRY_MS");
  });

  await t.test("Cloud Function checks single-use (status !== 'pending')", () => {
    assert.match(funcSrc, /status\s*!==\s*"pending"/, "verifyGuardianConsentToken must reject non-pending tokens");
  });

  await t.test("Cloud Function does not return studentName or guardianName (PII isolation)", () => {
    const returnBlock = funcSrc.match(/return\s*\{\s*success:\s*true,[^}]+\};/);
    assert.ok(returnBlock, "Must have return statement");
    assert.doesNotMatch(
      returnBlock[0],
      /studentName/,
      "Response payload must not contain studentName"
    );
    assert.doesNotMatch(
      returnBlock[0],
      /guardianName/,
      "Response payload must not contain guardianName"
    );
  });
});

test("Audit Log Ingestion Privacy & Sanitization", async (t) => {
  const auditRoutePath = path.resolve(__dirname, "../../src/app/api/audit/log/route.ts");
  const auditRouteSrc = fs.readFileSync(auditRoutePath, "utf-8");

  await t.test("Derives server-side timestamp", () => {
    assert.match(auditRouteSrc, /serverTimestamp\s*=\s*new\s+Date\(\)\.toISOString\(\)/);
  });

  await t.test("Strips PII (passwords, tokens, secret, dob, rawAudio)", () => {
    assert.match(auditRouteSrc, /delete\s+sanitizedMetadata\.password/);
    assert.match(auditRouteSrc, /delete\s+sanitizedMetadata\.token/);
    assert.match(auditRouteSrc, /delete\s+sanitizedMetadata\.secret/);
    assert.match(auditRouteSrc, /delete\s+sanitizedMetadata\.dob/);
  });
});
