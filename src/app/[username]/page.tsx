import { permanentRedirect, notFound } from "next/navigation";
import { supabase } from "@/lib/supabase";

// Reserved first-level route segments that belong to authenticated or app-internal sections
const RESERVED_FIRST_LEVEL_ROUTES = new Set([
  "about",
  "admin",
  "ambassador",
  "api",
  "aptitude",
  "auth",
  "billing",
  "career",
  "colleges",
  "college",
  "companies",
  "consent",
  "contact",
  "cookies",
  "daily",
  "dashboard",
  "dsa",
  "edbuild",
  "edmail",
  "employee",
  "employer",
  "focus",
  "for",
  "for-career",
  "for-college",
  "for-professionals",
  "founder",
  "hr",
  "interview-experiences",
  "interviews",
  "jobs",
  "leadership-assessment",
  "learn",
  "login",
  "mails",
  "messages",
  "mobile",
  "network",
  "networking",
  "newsletter",
  "offers",
  "onboarding",
  "portfolio",
  "practice",
  "pricing",
  "privacy",
  "problems",
  "profile",
  "projects",
  "projectstudio",
  "refund",
  "resumes",
  "sector",
  "sector-landing",
  "settings",
  "signup",
  "squads",
  "student-record",
  "styleguide",
  "terms",
  "u",
  "verify",
]);

interface LegacyUsernameProps {
  params: {
    username: string;
  };
}

export default async function LegacyUsernameCatchAllRoute({ params }: LegacyUsernameProps) {
  const username = params?.username?.trim().toLowerCase();

  // If segment is empty, matches a known system route, or contains a dot (static asset)
  if (!username || RESERVED_FIRST_LEVEL_ROUTES.has(username) || username.includes(".")) {
    notFound();
  }

  // Check if a registered user exists with this username (or as uid)
  try {
    const { data: profile } = await supabase
      .from("profiles")
      .select("username, id")
      .or(`username.eq.${username},id.eq.${username}`)
      .maybeSingle();

    if (profile?.username) {
      permanentRedirect(`/u/${profile.username}`);
    }
  } catch (err: any) {
    // If it's a redirect error thrown by Next.js permanentRedirect, rethrow it
    if (err?.digest?.startsWith("NEXT_REDIRECT")) {
      throw err;
    }
  }

  // If not found in database, return 404
  notFound();
}
