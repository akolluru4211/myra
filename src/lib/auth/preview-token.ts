import crypto from "crypto";

/**
 * Server-Validated, Signed, Expiring Preview Token Helper
 *
 * Rules:
 * 1. Used for secure staff preview when coming-soon mode is active.
 * 2. Scoped strictly to preview browsing access. Never grants access to protected student/admin endpoints or data.
 * 3. Uses HMAC-SHA256 signature with an expiration timestamp (default 2 hours, max 24 hours).
 * 4. Verifies staff role or signature integrity. Client-tampered values (`preview=true` or arbitrary cookies) are rejected.
 */

const PREVIEW_SECRET = process.env.PREVIEW_SECRET || process.env.INTERNAL_SERVICE_SECRET || "edworld_preview_signing_key_default";

export interface PreviewTokenPayload {
  scope: "preview_access";
  issuedAt: number;
  expiresAt: number;
  staffId?: string;
}

/**
 * Creates a signed preview token.
 */
export function generatePreviewToken(staffId: string = "staff-reviewer", durationSeconds: number = 7200): string {
  const issuedAt = Math.floor(Date.now() / 1000);
  const expiresAt = issuedAt + Math.min(durationSeconds, 86400); // Max 24 hours
  const payload: PreviewTokenPayload = {
    scope: "preview_access",
    issuedAt,
    expiresAt,
    staffId,
  };

  const payloadB64 = Buffer.from(JSON.stringify(payload)).toString("base64url");
  const signature = crypto
    .createHmac("sha256", PREVIEW_SECRET)
    .update(payloadB64)
    .digest("base64url");

  return `${payloadB64}.${signature}`;
}

/**
 * Verifies a signed preview token.
 */
export function verifyPreviewToken(token?: string | null): { valid: boolean; payload?: PreviewTokenPayload; error?: string } {
  if (!token || typeof token !== "string") {
    return { valid: false, error: "Missing preview token" };
  }

  const parts = token.split(".");
  if (parts.length !== 2) {
    return { valid: false, error: "Malformed preview token format" };
  }

  const [payloadB64, providedSig] = parts;

  // Verify HMAC-SHA256 signature with timing-safe comparison
  const expectedSig = crypto
    .createHmac("sha256", PREVIEW_SECRET)
    .update(payloadB64)
    .digest("base64url");

  const providedBuf = Buffer.from(providedSig);
  const expectedBuf = Buffer.from(expectedSig);

  if (providedBuf.length !== expectedBuf.length || !crypto.timingSafeEqual(providedBuf, expectedBuf)) {
    return { valid: false, error: "Invalid preview token signature" };
  }

  try {
    const payloadJson = Buffer.from(payloadB64, "base64url").toString("utf8");
    const payload: PreviewTokenPayload = JSON.parse(payloadJson);

    if (payload.scope !== "preview_access") {
      return { valid: false, error: "Invalid token scope" };
    }

    const now = Math.floor(Date.now() / 1000);
    if (payload.expiresAt < now) {
      return { valid: false, error: "Preview token expired" };
    }

    return { valid: true, payload };
  } catch {
    return { valid: false, error: "Invalid payload JSON" };
  }
}
