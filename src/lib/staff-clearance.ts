import { NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { validateSession } from "@/lib/otp-service";

export interface StaffActor {
  id: string;
  name: string;
  role: "SUPPORT" | "REVIEWER" | "ADMIN" | "SUPER_ADMIN" | "FOUNDER";
  institution?: string | null;
}

export async function resolveStaffClearance(req: NextRequest): Promise<StaffActor | null> {
  // 1. Supabase SSR session
  try {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      const { data: profile } = await supabase
        .from("profiles")
        .select("id, name, display_name, role, institution, is_admin")
        .eq("id", user.id)
        .maybeSingle();

      const staffRoles = ["SUPPORT", "REVIEWER", "ADMIN", "SUPER_ADMIN", "FOUNDER", "EXECUTIVE"];
      const userRole = (profile?.role || "").toUpperCase();
      if (profile?.is_admin || staffRoles.includes(userRole)) {
        return {
          id: user.id,
          name: profile?.display_name || profile?.name || "Staff Reviewer",
          role: (profile?.is_admin ? "ADMIN" : userRole) as any,
          institution: profile?.institution || null,
        };
      }
    }
  } catch (err) {
    // Continue fallback
  }

  // 2. Cookie or Bearer Session
  const sessionToken = req.cookies.get("edworld_session")?.value || req.headers.get("authorization")?.replace("Bearer ", "");
  if (sessionToken) {
    const sess = validateSession(sessionToken);
    if (sess.valid && sess.userId) {
      const sessRole = (sess.role || "").toUpperCase();
      const staffRoles = ["SUPPORT", "REVIEWER", "ADMIN", "SUPER_ADMIN", "FOUNDER", "EXECUTIVE"];
      if (staffRoles.includes(sessRole)) {
        return {
          id: sess.userId,
          name: "Authorized Reviewer",
          role: sessRole as any,
          institution: null,
        };
      }
    }
  }

  // 3. In staging/dev mode without session header, allow default staff reviewer for testing
  if (process.env.NODE_ENV !== "production") {
    return {
      id: "staff_reviewer_dev",
      name: "EdWorld Reviewer",
      role: "ADMIN",
      institution: null,
    };
  }

  return null;
}
