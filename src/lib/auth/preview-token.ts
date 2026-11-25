/**
 * Server-Validated, Signed, Expiring Preview Token Helper
 *
 * Rules:
 * 1. Used for secure staff preview when coming-soon mode is active.
 * 2. Scoped strictly to preview browsing access. Never grants access to protected student/admin endpoints or data.
 * 3. Uses HMAC-SHA256 signature with an expiration timestamp (default 2 hours, max 24 hours).
 * 4. Verifies staff role or signature integrity. Client-tampered values (`preview=true` or arbitrary cookies) are rejected.
 */

async function getSigningKey() {
  const secret = process.env.PREVIEW_SECRET || process.env.INTERNAL_SERVICE_SECRET;
  if (!secret) return null;

  return crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign", "verify"],
  );
}

function encodeBase64Url(bytes: Uint8Array) {
  return btoa(Array.from(bytes, (byte) => String.fromCharCode(byte)).join(""))
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

function decodeBase64Url(value: string) {
  return Uint8Array.from(atob(value.replace(/-/g, "+").replace(/_/g, "/")), (char) => char.charCodeAt(0));
}

export interface PreviewTokenPayload {
  scope: "preview_access";
  issuedAt: number;
  expiresAt: number;
  staffId?: string;
}

/**
 * Creates a signed preview token.
 */
export async function generatePreviewToken(staffId: string = "staff-reviewer", durationSeconds: number = 7200): Promise<string> {
  const key = await getSigningKey();
  if (!key) throw new Error("Preview token signing secret is required");

  const issuedAt = Math.floor(Date.now() / 1000);
  const expiresAt = issuedAt + Math.min(durationSeconds, 86400); // Max 24 hours
  const payload: PreviewTokenPayload = {
    scope: "preview_access",
    issuedAt,
    expiresAt,
    staffId,
  };

  const encoder = new TextEncoder();
  const payloadB64 = encodeBase64Url(encoder.encode(JSON.stringify(payload)));
  const signature = encodeBase64Url(new Uint8Array(await crypto.subtle.sign("HMAC", key, encoder.encode(payloadB64))));

  return `${payloadB64}.${signature}`;
}

/**
 * Verifies a signed preview token.
 */
export async function verifyPreviewToken(token?: string | null): Promise<{ valid: boolean; payload?: PreviewTokenPayload; error?: string }> {
  if (!token || typeof token !== "string") {
    return { valid: false, error: "Missing preview token" };
  }

  const parts = token.split(".");
  if (parts.length !== 2 || parts.some((part) => !/^[A-Za-z0-9_-]+$/.test(part))) {
    return { valid: false, error: "Malformed preview token format" };
  }

  const [payloadB64, providedSig] = parts;

  try {
    const key = await getSigningKey();
    if (!key) return { valid: false, error: "Preview token signing secret is required" };
    const signature = decodeBase64Url(providedSig);
    if (!await crypto.subtle.verify("HMAC", key, signature, new TextEncoder().encode(payloadB64))) {
      return { valid: false, error: "Invalid preview token signature" };
    }

    const payloadJson = new TextDecoder().decode(decodeBase64Url(payloadB64));
    const payload: PreviewTokenPayload = JSON.parse(payloadJson);

    if (payload.scope !== "preview_access") {
      return { valid: false, error: "Invalid token scope" };
    }

    const now = Math.floor(Date.now() / 1000);
    if (!Number.isFinite(payload.expiresAt) || payload.expiresAt <= now) {
      return { valid: false, error: "Preview token expired" };
    }

    return { valid: true, payload };
  } catch {
    return { valid: false, error: "Invalid preview token" };
  }
}
