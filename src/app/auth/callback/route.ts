import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { sendSignupWelcomeEmail } from "@/lib/email-service";
import { resolvePostSignInDestination } from "@/lib/auth/redirect-validator";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const requestUrl = new URL(req.url);
  const code = requestUrl.searchParams.get("code");
  const nextParam = requestUrl.searchParams.get("next") || requestUrl.searchParams.get("redirectUrl");
  const origin = requestUrl.origin;

  if (code) {
    try {
      // 1. Establish & verify the session
      const { data, error } = await supabase.auth.exchangeCodeForSession(code);
      if (error) {
        console.error("[OAuth Callback Exchange Error]:", error.message);
        const loginUrl = new URL("/auth/login", origin);
        loginUrl.searchParams.set("error", error.message);
        if (nextParam) loginUrl.searchParams.set("redirectUrl", nextParam);
        return NextResponse.redirect(loginUrl);
      }

      if (data?.session && data.user) {
        const user = data.user;
        const meta = user.user_metadata || {};
        const userName = meta.full_name || meta.name || user.email?.split("@")[0] || "Learner";

        // 2. Fetch or initialize profile
        const { data: existingProfile, error: profileFetchError } = await supabase
          .from("profiles")
          .select("id, onboarding_completed, role, career_stage")
          .eq("id", user.id)
          .maybeSingle();

        if (profileFetchError) {
          console.error("[OAuth Profile Fetch Error]:", profileFetchError.message);
          // Distinguish profile load error from onboarding state
          const loginUrl = new URL("/auth/login", origin);
          loginUrl.searchParams.set("error", "Unable to load student profile. Please retry.");
          if (nextParam) loginUrl.searchParams.set("redirectUrl", nextParam);
          return NextResponse.redirect(loginUrl);
        }

        let onboardingCompleted = existingProfile?.onboarding_completed;
        let userRole = existingProfile?.role || "CLIENT";
        let careerStage = existingProfile?.career_stage || "STUDENT";

        if (!existingProfile) {
          // Initialize new profile for Google user
          try {
            await supabase.from("profiles").upsert({
              id: user.id,
              name: userName,
              display_name: userName,
              email: user.email,
              age_band: "18+",
              role: "CLIENT",
              career_stage: "STUDENT",
              onboarding_completed: false,
              interests: [
                { id: "swe", name: "Software Engineering", category: "Engineering", selfLevel: 0, effectiveLevel: 0 },
                { id: "fullstack", name: "Full Stack Development", category: "Engineering", selfLevel: 0, effectiveLevel: 0 },
              ],
              updated_at: new Date().toISOString(),
            });
            onboardingCompleted = false;

            // Send custom welcome email for first-time Google sign-up
            if (user.email) {
              sendSignupWelcomeEmail({
                email: user.email,
                name: userName,
              }).catch((e) => console.warn("[OAuth Welcome Email Warning]:", e));
            }
          } catch (profileErr) {
            console.warn("[OAuth Profile Insert Note]:", profileErr);
          }
        }

        // 3. Centralized Landing Decision
        const { destination } = resolvePostSignInDestination({
          role: userRole,
          onboardingCompleted: onboardingCompleted ?? false,
          requestedDestination: nextParam,
          careerStage,
        });

        const response = NextResponse.redirect(new URL(destination, origin));

        // 4. Set session cookies
        const maxAge = 60 * 60 * 24 * 7; // 7 days
        response.cookies.set("edworld_session", data.session.access_token, {
          path: "/",
          httpOnly: true,
          secure: process.env.NODE_ENV === "production",
          sameSite: "lax",
          maxAge,
        });

        response.cookies.set("sb-access-token", data.session.access_token, {
          path: "/",
          httpOnly: true,
          secure: process.env.NODE_ENV === "production",
          sameSite: "lax",
          maxAge,
        });

        response.cookies.set("edworld_auth", "true", {
          path: "/",
          httpOnly: false,
          secure: process.env.NODE_ENV === "production",
          sameSite: "lax",
          maxAge,
        });

        return response;
      }
    } catch (err: any) {
      console.error("[OAuth Callback Exception]:", err);
      const loginUrl = new URL("/auth/login", origin);
      loginUrl.searchParams.set("error", "Authentication failed. Please try again.");
      if (nextParam) loginUrl.searchParams.set("redirectUrl", nextParam);
      return NextResponse.redirect(loginUrl);
    }
  }

  // Fallback if no code received
  const fallbackUrl = new URL("/auth/login", origin);
  if (nextParam) fallbackUrl.searchParams.set("redirectUrl", nextParam);
  return NextResponse.redirect(fallbackUrl);
}
