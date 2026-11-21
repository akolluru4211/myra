import type { NextRequest } from "next/server";

export async function resolveMyraUser(req: NextRequest): Promise<string | null> {
  // Resolve authenticated caller identity strictly
  let authUserId: string | null = null;
  try {
    const { createClient } = await import("@/lib/supabase/server");
    const supabaseServer = createClient();
    const { data: { user } } = await supabaseServer.auth.getUser();
    if (user?.id) {
      authUserId = user.id;
    }
  } catch {}

  if (!authUserId) {
    const sessionCookie = 
      req.cookies.get("edworld_session")?.value ||
      req.headers.get("authorization")?.replace(/^Bearer\s+/i, "");
    if (sessionCookie && sessionCookie.startsWith("edw_sess_")) {
      const { validateSession } = await import("@/lib/otp-service");
      const sess = validateSession(sessionCookie);
      if (sess.valid && sess.userId) {
        authUserId = sess.userId;
      }
    }
  }
  return authUserId;
}

