import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { sendSignupWelcomeEmail } from "@/lib/email-service";
import { resolvePostSignInDestination, validateRedirectDestination } from "@/lib/auth/redirect-validator";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const requestUrl = new URL(req.url);
  const code = requestUrl.searchParams.get("code");
  const nextParam = validateRedirectDestination(
    requestUrl.searchParams.get("next") || requestUrl.searchParams.get("redirectUrl"),
  );
  const origin = requestUrl.origin;

  function redirectToLogin(message?: string) {
    const loginUrl = new URL("/auth/login", origin);
    if (message) loginUrl.searchParams.set("error", message);
    if (nextParam) loginUrl.searchParams.set("redirectUrl", nextParam);
    return NextResponse.redirect(loginUrl);
  }

  const providerError = requestUrl.searchParams.get("error");
  if (providerError) {
    return redirectToLogin(providerError === "access_denied"
      ? "Google sign-in was canceled."
      : "Google sign-in failed. Please try again.");
  }

  if (code) {
    try {
      // The server client reads the PKCE verifier and writes the Supabase session cookies.
      const supabase = createClient();
      const { data, error } = await supabase.auth.exchangeCodeForSession(code);
      if (error) {
        console.error("[OAuth Callback Exchange Error]:", error.message);
        return redirectToLogin("Could not complete sign-in. Please try again.");
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
          return redirectToLogin("Unable to load student profile. Please retry.");
        }

        let onboardingCompleted = existingProfile?.onboarding_completed;
        const userRole = existingProfile?.role || "CLIENT";
        const careerStage = existingProfile?.career_stage || "STUDENT";

        if (!existingProfile) {
          // Initialize new profile for Google user
          try {
            const { data: newProfile, error: profileError } = await supabase.from("profiles").upsert({
              id: user.id,
              user_id: user.id,
              name: userName,
              display_name: userName,
              email: user.email,
              role: "CLIENT",
              career_stage: "STUDENT",
              onboarding_completed: false,
              interests: [
                { id: "swe", name: "Software Engineering", category: "Engineering", selfLevel: 0, effectiveLevel: 0 },
                { id: "fullstack", name: "Full Stack Development", category: "Engineering", selfLevel: 0, effectiveLevel: 0 },
              ],
              updated_at: new Date().toISOString(),
            }, { onConflict: "id", ignoreDuplicates: true }).select("id").maybeSingle();
            if (profileError) throw profileError;
            onboardingCompleted = false;

            // Send custom welcome email for first-time Google sign-up
            if (newProfile && user.email) {
              sendSignupWelcomeEmail({
                email: user.email,
                name: userName,
              }).catch((e) => console.warn("[OAuth Welcome Email Warning]:", e));
            }
          } catch (profileErr) {
            console.error("[OAuth Profile Insert Error]:", profileErr);
            return redirectToLogin("Unable to set up your student profile. Please retry.");
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
    } catch (err) {
      console.error("[OAuth Callback Exception]:", err);
      return redirectToLogin("Authentication failed. Please try again.");
    }
  }

  return redirectToLogin();
}
