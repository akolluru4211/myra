import type { UserRole, CareerStage } from "../types";

/**
 * Disallowed or auth-looping paths that should NEVER be redirected to after sign-in.
 */
const BLOCKED_AUTH_PATHS = [
  "/login",
  "/signup",
  "/auth",
  "/auth/login",
  "/auth/signup",
  "/auth/callback",
  "/auth/forgot-password",
  "/auth/reset-password",
  "/auth/verify-email",
  "/logout",
  "/api/auth",
];

/**
 * Validates a redirect candidate path.
 *
 * Rules:
 * 1. Must be a relative same-origin path starting with exactly one leading slash `/`.
 * 2. Reject protocol-relative URLs (`//evil.com`), backslash bypasses (`/\evil.com`), or external protocols (`https:`, `javascript:`, `data:`).
 * 3. Reject paths that loop back into sign-in or auth callback flows.
 * 4. Preserve valid query strings and hash fragments (`/dsa?tab=practice#problem-42`).
 * 5. Return sanitized valid path or null if invalid.
 */
export function validateRedirectDestination(candidate?: string | null): string | null {
  if (!candidate || typeof candidate !== "string") {
    return null;
  }

  const trimmed = candidate.trim();
  if (!trimmed) {
    return null;
  }

  // Must start with '/' but NOT '//' or '/\'
  if (!trimmed.startsWith("/") || trimmed.startsWith("//") || trimmed.startsWith("/\\")) {
    return null;
  }

  // Prevent CRLF injection or control characters
  if (/[\r\n\0]/.test(trimmed)) {
    return null;
  }

  // Parse path and query/hash
  let parsedUrl: URL;
  try {
    // Parse using dummy base to safely inspect path and query
    parsedUrl = new URL(trimmed, "http://localhost");
  } catch {
    return null;
  }

  const pathname = parsedUrl.pathname.toLowerCase();

  // Reject external scheme / protocol spoofing
  if (parsedUrl.origin !== "http://localhost") {
    return null;
  }

  // Reject auth loops
  const isAuthLoop = BLOCKED_AUTH_PATHS.some(
    (blocked) => pathname === blocked || pathname.startsWith(`${blocked}/`)
  );
  if (isAuthLoop) {
    return null;
  }

  // Return the path + search + hash relative string
  const validPath = `${parsedUrl.pathname}${parsedUrl.search}${parsedUrl.hash}`;
  return validPath;
}

/**
 * Role-to-default-portal mapping
 */
export function getDefaultPortalForRole(role?: UserRole | string): string {
  const normalized = (role || "CLIENT").toUpperCase();
  switch (normalized) {
    case "HR":
      return "/hr";
    case "FOUNDER":
    case "EXECUTIVE":
      return "/founder";
    case "COLLEGE_ADMIN":
    case "PLACEMENT_OFFICER":
      return "/colleges";
    case "ADMIN":
    case "SUPER_ADMIN":
      return "/admin";
    case "EMPLOYEE":
      return "/employee";
    case "CLIENT":
    default:
      return "/dashboard";
  }
}

/**
 * Resolves the final safe destination after sign-in.
 *
 * Priority Order:
 * 1. Required Onboarding Check:
 *    - If onboardingCompleted is false/uncompleted for a student (or general CLIENT),
 *      they MUST be routed to `/onboarding`, preserving the intended destination if valid.
 * 2. Valid Deep Link / Intended Destination:
 *    - If valid redirectUrl/next was provided, verify role can access it (or if student destination).
 * 3. Default Role Portal:
 *    - Fall back to role-specific default portal (/dashboard for students, /admin for admin, etc.).
 */
export function resolvePostSignInDestination(params: {
  role?: UserRole | string;
  onboardingCompleted?: boolean | null;
  requestedDestination?: string | null;
  careerStage?: CareerStage | string;
}): {
  destination: string;
  requiresOnboarding: boolean;
  preservedDestination?: string;
} {
  const {
    role = "CLIENT",
    onboardingCompleted,
    requestedDestination,
  } = params;

  const validTarget = validateRedirectDestination(requestedDestination);
  const normalizedRole = (role || "CLIENT").toUpperCase();
  const isStudentOrClient = normalizedRole === "CLIENT" || normalizedRole === "STUDENT";

  // Incomplete required onboarding gate
  if (isStudentOrClient && onboardingCompleted === false) {
    // Preserve valid destination as query parameter to resume after onboarding
    let onboardingUrl = "/onboarding";
    if (validTarget && validTarget !== "/dashboard" && validTarget !== "/onboarding") {
      onboardingUrl = `/onboarding?resume=${encodeURIComponent(validTarget)}`;
    }
    return {
      destination: onboardingUrl,
      requiresOnboarding: true,
      preservedDestination: validTarget || undefined,
    };
  }

  // If a valid destination was requested
  if (validTarget) {
    // If the valid target is an admin/portal page but user is just a student, enforce RBAC fallback
    const targetPath = validTarget.split("?")[0].toLowerCase();
    const isAdminTarget = targetPath === "/admin" || targetPath.startsWith("/admin/");
    const isHrTarget = targetPath === "/hr" || targetPath.startsWith("/hr/");
    const isFounderTarget = targetPath === "/founder" || targetPath.startsWith("/founder/");
    const isCollegeTarget = targetPath === "/colleges" || targetPath.startsWith("/colleges/");
    const isEmployeeTarget = targetPath === "/employee" || targetPath.startsWith("/employee/");

    if (
      (isAdminTarget && normalizedRole !== "ADMIN" && normalizedRole !== "SUPER_ADMIN") ||
      (isHrTarget && normalizedRole !== "HR" && normalizedRole !== "ADMIN" && normalizedRole !== "SUPER_ADMIN") ||
      (isFounderTarget && normalizedRole !== "FOUNDER" && normalizedRole !== "EXECUTIVE") ||
      (isCollegeTarget && normalizedRole !== "COLLEGE_ADMIN" && normalizedRole !== "PLACEMENT_OFFICER" && normalizedRole !== "ADMIN") ||
      (isEmployeeTarget && normalizedRole !== "EMPLOYEE" && normalizedRole !== "ADMIN")
    ) {
      // Role not permitted for target, route to their authorized default portal
      return {
        destination: getDefaultPortalForRole(role),
        requiresOnboarding: false,
      };
    }

    return {
      destination: validTarget,
      requiresOnboarding: false,
    };
  }

  // Default to role portal
  return {
    destination: getDefaultPortalForRole(role),
    requiresOnboarding: false,
  };
}
