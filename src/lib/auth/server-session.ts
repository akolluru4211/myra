import { NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { validateSession } from "@/lib/otp-service";

/**
 * Centrally and securely resolves the authenticated student user ID.
 * Supports:
 *  1. Supabase SSR session (`createClient().auth.getUser()`)
 *  2. HttpOnly `edworld_session` cookie (both `edw_sess_*` active session tokens and `usr_*` / UUIDs)
 *  3. `Authorization: Bearer <token>` header
 *  4. `sb-access-token` cookie
 */
export async function resolveServerSessionUserId(req: NextRequest): Promise<string | null> {
  // 1. Check Supabase SSR session
  try {
    const supabaseServer = createClient();
    const { data: { user } } = await supabaseServer.auth.getUser();
    if (user?.id) return user.id;
  } catch {}

  // 2. Check Authorization header
  const authHeader = req.headers.get("authorization")?.replace(/^Bearer\s+/i, "");
  if (authHeader) {
    const sess = validateSession(authHeader);
    if (sess.valid && sess.userId) return sess.userId;
  }

  // 3. Check edworld_session cookie
  const sessionToken = req.cookies.get("edworld_session")?.value;
  if (sessionToken) {
    const sess = validateSession(sessionToken);
    if (sess.valid && sess.userId) return sess.userId;
  }

  // 4. Check sb-access-token cookie
  const sbAccessToken = req.cookies.get("sb-access-token")?.value;
  if (sbAccessToken) {
    const sess = validateSession(sbAccessToken);
    if (sess.valid && sess.userId) return sess.userId;
  }

  return null;
}
