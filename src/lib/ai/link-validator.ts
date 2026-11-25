/**
 * Unified Link Validator for Myra AI Chat and Web Search Citations
 *
 * Rules:
 * 1. Allow validated same-origin internal app paths (e.g., "/dsa", "/dashboard", "/career/roadmap").
 * 2. Allow validated external HTTPS URLs (e.g., "https://github.com/owner/repo", "https://docs.python.org").
 * 3. Enforce strictly HTTPS for external URLs (reject plain HTTP, FTP, file, javascript:, data:, vbscript:, etc.).
 * 4. Reject malformed URLs, IP/localhost addresses, internal cloud metadata endpoints, CRLF injection, and control characters.
 * 5. Provide sanitized output for safe rendering in chat or plain-text fallback for invalid links.
 */

export interface ValidatedLinkResult {
  isValid: boolean;
  isExternal: boolean;
  sanitizedUrl: string | null;
  displayLabel: string;
  reason?: string;
}

// Disallowed internal private network / cloud metadata hosts
const BLOCKED_HOSTNAMES = new Set([
  "localhost",
  "127.0.0.1",
  "0.0.0.0",
  "::1",
  "169.254.169.254", // AWS/GCP/Azure instance metadata
  "metadata.google.internal",
  "instance-data",
]);

/**
 * Validates any candidate link (internal app path or external URL).
 * Used for model-generated markdown links, user-provided URLs, and web search citations.
 */
export function validateChatLink(rawCandidate?: string | null, customLabel?: string): ValidatedLinkResult {
  const fallbackLabel = (customLabel || rawCandidate || "").trim();

  if (!rawCandidate || typeof rawCandidate !== "string") {
    return {
      isValid: false,
      isExternal: false,
      sanitizedUrl: null,
      displayLabel: fallbackLabel,
      reason: "Empty or missing URL candidate.",
    };
  }

  const trimmed = rawCandidate.trim();

  // Check for control characters or CRLF injection
  if (/[\r\n\0\t\x00-\x1F\x7F]/.test(trimmed)) {
    return {
      isValid: false,
      isExternal: false,
      sanitizedUrl: null,
      displayLabel: fallbackLabel,
      reason: "Dangerous characters or CRLF detected.",
    };
  }

  // 1. Internal App Relative Path (starts with "/" but not "//" or "/\")
  if (trimmed.startsWith("/")) {
    if (trimmed.startsWith("//") || trimmed.startsWith("/\\")) {
      return {
        isValid: false,
        isExternal: false,
        sanitizedUrl: null,
        displayLabel: fallbackLabel,
        reason: "Protocol-relative or malformed path disallowed.",
      };
    }

    // Must be a valid relative path without external scheme injection
    try {
      const dummy = new URL(trimmed, "https://edworld.co");
      // Ensure pathname didn't escape to external host
      if (dummy.origin !== "https://edworld.co") {
        return {
          isValid: false,
          isExternal: false,
          sanitizedUrl: null,
          displayLabel: fallbackLabel,
          reason: "Path escaped same-origin boundary.",
        };
      }

      const cleanRelative = `${dummy.pathname}${dummy.search}${dummy.hash}`;
      return {
        isValid: true,
        isExternal: false,
        sanitizedUrl: cleanRelative,
        displayLabel: customLabel ? customLabel.trim() : cleanRelative,
      };
    } catch {
      return {
        isValid: false,
        isExternal: false,
        sanitizedUrl: null,
        displayLabel: fallbackLabel,
        reason: "Malformed internal relative path.",
      };
    }
  }

  // 2. External URL Validation (strictly HTTPS required)
  try {
    const parsed = new URL(trimmed);

    // Only HTTPS allowed (HTTP, javascript:, data:, mailto:, file: all rejected)
    if (parsed.protocol !== "https:") {
      return {
        isValid: false,
        isExternal: true,
        sanitizedUrl: null,
        displayLabel: fallbackLabel,
        reason: `Insecure or unsupported protocol: ${parsed.protocol}. Only HTTPS is permitted.`,
      };
    }

    const hostname = parsed.hostname.toLowerCase();

    // Check blocked hostnames (localhost, link-local, cloud metadata)
    if (BLOCKED_HOSTNAMES.has(hostname) || hostname.endsWith(".internal") || hostname.endsWith(".local")) {
      return {
        isValid: false,
        isExternal: true,
        sanitizedUrl: null,
        displayLabel: fallbackLabel,
        reason: "Access to private or metadata hosts is blocked.",
      };
    }

    // Reject raw IPv4 private addresses (10.x, 192.168.x, 172.16-31.x)
    if (/^(10\.|192\.168\.|172\.(1[6-9]|2[0-9]|3[0-1])\.)/.test(hostname)) {
      return {
        isValid: false,
        isExternal: true,
        sanitizedUrl: null,
        displayLabel: fallbackLabel,
        reason: "Private network IP addresses are disallowed.",
      };
    }

    // Cleaned sanitized URL
    const sanitizedUrl = parsed.toString();
    return {
      isValid: true,
      isExternal: true,
      sanitizedUrl,
      displayLabel: customLabel ? customLabel.trim() : sanitizedUrl,
    };
  } catch {
    return {
      isValid: false,
      isExternal: false,
      sanitizedUrl: null,
      displayLabel: fallbackLabel,
      reason: "Malformed URL syntax.",
    };
  }
}

/**
 * Validates an HTTPS target URL specifically for the external web lookup / search provider.
 * Returns the validated HTTPS URL string, or null if invalid or disallowed.
 */
export function validateExternalLookupUrl(rawUrl?: string | null): string | null {
  const result = validateChatLink(rawUrl);
  if (result.isValid && result.isExternal && result.sanitizedUrl) {
    return result.sanitizedUrl;
  }
  return null;
}
