import type { UserRole } from "@/lib/types";

// In-memory resilient active sessions store (persisted on globalThis for Edge / Next.js chunks)
const globalForSessions = globalThis as unknown as {
  edworldActiveSessions?: Map<string, { userId: string; role: UserRole; expiresAt: number }>;
};

const activeSessions = globalForSessions.edworldActiveSessions ??=
  new Map<string, { userId: string; role: UserRole; expiresAt: number }>();

/**
 * Validates a registered, unexpired session token.
 * Edge-safe and independent of Node-specific libraries or email dispatchers.
 */
export function validateSession(token: string): { valid: boolean; userId?: string; role?: UserRole } {
  if (!token) return { valid: false };

  // 1. Check in-memory active session tokens (edw_sess_...)
  const session = activeSessions.get(token);
  if (session && session.expiresAt >= Date.now()) {
    return { valid: true, userId: session.userId, role: session.role };
  }
  if (session && session.expiresAt < Date.now()) {
    activeSessions.delete(token);
  }

  return { valid: false };
}

export function registerSession(token: string, userId: string, role: UserRole, expiresAt: number) {
  activeSessions.set(token, { userId, role, expiresAt });
}
