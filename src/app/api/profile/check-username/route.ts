import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export const dynamic = "force-dynamic";

// Reserved route segments and system names that cannot be used as user handles
const RESERVED_USERNAMES = new Set([
  "admin",
  "administrator",
  "api",
  "app",
  "auth",
  "billing",
  "career",
  "careers",
  "certificate",
  "certificates",
  "checkout",
  "college",
  "colleges",
  "contact",
  "cookies",
  "course",
  "courses",
  "dashboard",
  "dsa",
  "edbuild",
  "edfix",
  "edworld",
  "employee",
  "explore",
  "focus",
  "founder",
  "help",
  "home",
  "hr",
  "interview",
  "interviews",
  "job",
  "jobs",
  "learn",
  "login",
  "logout",
  "messages",
  "mobile",
  "myra",
  "network",
  "null",
  "onboarding",
  "portfolio",
  "portfolios",
  "practice",
  "pricing",
  "privacy",
  "profile",
  "projects",
  "refund",
  "register",
  "reset",
  "resume",
  "resumes",
  "roadmap",
  "root",
  "security",
  "settings",
  "signin",
  "signout",
  "signup",
  "sitemap",
  "status",
  "student",
  "support",
  "system",
  "terms",
  "u",
  "undefined",
  "user",
  "users",
  "verify",
]);

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const rawUsername = searchParams.get("username") || "";
    const currentUserId = searchParams.get("userId") || "";

    const cleanUsername = rawUsername.trim().toLowerCase();

    // 1. Length & Empty Check
    if (!cleanUsername) {
      return NextResponse.json({
        available: false,
        reason: "Username cannot be empty.",
        username: cleanUsername,
      });
    }

    if (cleanUsername.length < 3) {
      return NextResponse.json({
        available: false,
        reason: "Username must be at least 3 characters.",
        username: cleanUsername,
      });
    }

    if (cleanUsername.length > 24) {
      return NextResponse.json({
        available: false,
        reason: "Username cannot exceed 24 characters.",
        username: cleanUsername,
      });
    }

    // 2. Character Format Check: lowercase letters, numbers, underscores, and hyphens only
    const validFormatRegex = /^[a-z0-9][a-z0-9_-]*[a-z0-9]$/;
    if (!validFormatRegex.test(cleanUsername) && cleanUsername.length > 1) {
      return NextResponse.json({
        available: false,
        reason:
          "Username can only contain lowercase letters, numbers, underscores, and hyphens (cannot start or end with a symbol).",
        username: cleanUsername,
      });
    }

    // 3. Reserved Words Check
    if (RESERVED_USERNAMES.has(cleanUsername)) {
      return NextResponse.json({
        available: false,
        reason: "This username is reserved for platform systems.",
        username: cleanUsername,
      });
    }

    // 4. Database Check: query profiles table
    try {
      let query = supabase
        .from("profiles")
        .select("id, username")
        .ilike("username", cleanUsername);

      if (currentUserId) {
        query = query.neq("id", currentUserId);
      }

      const { data, error } = await query.limit(1);

      if (!error && data && data.length > 0) {
        return NextResponse.json({
          available: false,
          reason: "This username is already claimed by another member.",
          username: cleanUsername,
        });
      }
    } catch (dbErr) {
      console.warn("[Username Check DB Warning]:", dbErr);
      // Fallback: If DB query encounters transient issue, format check passed
    }

    return NextResponse.json({
      available: true,
      reason: "Username is available!",
      username: cleanUsername,
      portfolioUrl: `edworld.co.in/${cleanUsername}`,
    });
  } catch (err: any) {
    console.error("[Check Username API Error]:", err);
    return NextResponse.json(
      { available: false, error: "Failed to validate username." },
      { status: 500 }
    );
  }
}
