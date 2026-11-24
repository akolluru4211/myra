import { NextRequest, NextResponse } from "next/server";
import { validateSession } from "@/lib/otp-service";
import { supabase } from "@/lib/supabase";
import { rateLimit, getClientIp } from "@/lib/rate-limiter";

// Fast in-memory profile cache to avoid redundant database calls and eliminate lag
const profileCache = new Map<string, { profile: any; expiresAt: number }>();
const CACHE_TTL_MS = 30 * 1000; // 30 seconds

export async function GET(req: NextRequest) {
  try {
    const ip = getClientIp(req);
    const limiter = rateLimit(`session_${ip}`, { limit: 120, windowMs: 60 * 1000 });
    if (!limiter.allowed) {
      return NextResponse.json({ authenticated: false, error: "RATE_LIMIT_EXCEEDED" }, { status: 429 });
    }

    const token = 
      req.cookies.get("edworld_session")?.value ||
      req.headers.get("authorization")?.replace(/^Bearer\s+/i, "") ||
      req.headers.get("x-session-token");

    if (!token) {
      return NextResponse.json({ authenticated: false }, { status: 401 });
    }

    const { valid, userId, role } = validateSession(token);
    if (!valid || !userId) {
      return NextResponse.json({ authenticated: false }, { status: 401 });
    }

    // Check fast cache first
    const now = Date.now();
    const cached = profileCache.get(userId);
    let profile = cached && cached.expiresAt > now ? cached.profile : null;

    if (!profile) {
      // Fetch fresh profile with a 1.2s timeout so slow networks never freeze navigation
      try {
        const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(userId);
        
        let queryPromise: Promise<{ data: any }>;
        if (isUuid) {
          queryPromise = Promise.resolve(
            supabase
              .from("profiles")
              .select("id, email, name, role, age_band, career_stage, grade_level, phone, is_suspended, onboarding_completed")
              .eq("id", userId)
              .maybeSingle()
          );
        } else {
          // If non-UUID ID (e.g. usr_...), lookup by active session email if mapped or fallback
          queryPromise = Promise.resolve({
            data: {
              id: userId,
              name: "Edworld Student",
              role: role || "CLIENT",
              onboarding_completed: true,
              career_stage: "STUDENT",
              age_band: "18+",
            }
          });
        }

        const timeoutPromise = new Promise<{ data: any }>((resolve) =>
          setTimeout(() => resolve({ data: null }), 1200)
        );

        const result = await Promise.race([queryPromise, timeoutPromise]);
        profile = result?.data || null;

        if (profile) {
          profileCache.set(userId, { profile, expiresAt: now + CACHE_TTL_MS });
        }
      } catch (e) {
        // Fallback gracefully on query error
        profile = null;
      }
    }

    if (profile?.is_suspended) {
      return NextResponse.json({ authenticated: false, error: "ACCOUNT_SUSPENDED" }, { status: 403 });
    }

    const isOnboardingDone = Boolean(profile?.onboarding_completed);

    return NextResponse.json({
      authenticated: true,
      userId,
      role: role || profile?.role || "CLIENT",
      profile: {
        ...profile,
        onboarding_completed: isOnboardingDone,
      },
      user: {
        uid: userId,
        email: profile?.email || "",
        name: profile?.name || "Learner",
        phone: profile?.phone,
        ageBand: profile?.age_band || "18+",
        careerStage: profile?.career_stage || (profile?.age_band === "13-15" ? "JUNIOR" : profile?.age_band === "16-18" ? "STUDENT" : "PROFESSIONAL"),
        gradeLevel: profile?.grade_level || "College",
        onboarding_completed: isOnboardingDone,
      }
    });
  } catch (err) {
    return NextResponse.json({ authenticated: false }, { status: 500 });
  }
}
