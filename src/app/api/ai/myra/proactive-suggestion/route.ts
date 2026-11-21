import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { resolveMyraUser } from "@/lib/ai/myra-session";
import { buildMyraUserContext } from "@/lib/ai/myra-context-builder";

export const dynamic = "force-dynamic";

/**
 * GET /api/ai/myra/proactive-suggestion?userId=<uid>
 * Returns exactly one active contextual proactive suggestion for today.
 * If not yet generated, generates it on-the-fly and saves with date_bucket = CURRENT_DATE.
 */
export async function GET(req: NextRequest) {
  try {
    const userId = await resolveMyraUser(req);
    if (!userId) return NextResponse.json({ error: "Sign in to view suggestions." }, { status: 401 });
    const requestedUserId = req.nextUrl.searchParams.get("userId");
    if (requestedUserId && requestedUserId !== userId) {
      return NextResponse.json({ error: "Student identity does not match the session." }, { status: 403 });
    }
    const supabase = createClient();

    const todayDateStr = new Date().toISOString().split("T")[0]; // YYYY-MM-DD

    // 1. Check if suggestion already exists for today
    const { data: existing, error: readError } = await supabase
      .from("myra_proactive_suggestions")
      .select("*")
      .eq("user_id", userId)
      .eq("date_bucket", todayDateStr)
      .maybeSingle();

    if (readError) throw readError;
    if (existing) {
      if (existing.dismissed) {
        return NextResponse.json({ suggestion: null, dismissedToday: true });
      }
      return NextResponse.json({ suggestion: existing });
    }

    // 2. Build scoped longitudinal context
    const context = await buildMyraUserContext(userId, "proactive_suggestion");
    const p = context.profileSnapshot;
    const signals = context.longitudinalSignals;
    const candidateName = p?.name ? p.name.split(" ")[0] : "Learner";
    const targetRole = p?.targetRole || "your target role";

    // Rule-based high-confidence suggestions based on actual facts
    let suggestionText = "";
    let actionLabel = "";
    let actionUrl = "";
    let contextReason = "";

    if (signals?.scoreTrend === "dipping") {
      suggestionText = `Hey ${candidateName}, your recent mock interview scores dipped slightly on answer structure. Want to do a quick 10-minute STAR method behavioral drill for ${targetRole}?`;
      actionLabel = "Practice STAR Method";
      actionUrl = "/interviews/star-method";
      contextReason = "interview_structure_dip";
    } else if (signals?.hasUnlistedProjects) {
      suggestionText = `You recently added new verified projects that aren't highlighted in your primary resume yet. Want to align your resume keywords for ${targetRole}?`;
      actionLabel = "Update Resume";
      actionUrl = "/resumes";
      contextReason = "unlisted_projects";
    } else if (signals?.daysSinceLastInterview && signals.daysSinceLastInterview > 5) {
      suggestionText = `It's been ${signals.daysSinceLastInterview} days since your last technical drill. Keep your interview reflexes sharp with a 3D mock session!`;
      actionLabel = "Start 3D Mock Interview";
      actionUrl = "/interviews";
      contextReason = "interview_cadence";
    } else if (signals?.daysSinceLastResumeUpdate && signals.daysSinceLastResumeUpdate > 14) {
      suggestionText = `Review your resume and compare it with job descriptions you are targeting.`;
      actionLabel = "Check Job Matches";
      actionUrl = "/resumes";
      contextReason = "resume_freshness";
    } else {
      suggestionText = `Would you like to practice interview questions for ${targetRole}?`;
      actionLabel = "Practice Interviews";
      actionUrl = "/interviews";
      contextReason = "general_acceleration";
    }

    // 3. Insert single suggestion for today with UNIQUE(user_id, date_bucket)
    const { data: newSuggestion, error: insertErr } = await supabase
      .from("myra_proactive_suggestions")
      .upsert(
        {
          user_id: userId,
          suggestion_text: suggestionText,
          action_label: actionLabel,
          action_url: actionUrl,
          context_reason: contextReason,
          dismissed: false,
          acted_on: false,
          date_bucket: todayDateStr,
        },
        { onConflict: "user_id,date_bucket", ignoreDuplicates: true }
      )
      .select()
      .maybeSingle();

    if (insertErr) throw insertErr;
    if (newSuggestion) return NextResponse.json({ suggestion: newSuggestion });

    const { data: concurrentSuggestion, error: retryError } = await supabase
      .from("myra_proactive_suggestions")
      .select("*")
      .eq("user_id", userId)
      .eq("date_bucket", todayDateStr)
      .single();
    if (retryError) throw retryError;
    return NextResponse.json({
      suggestion: concurrentSuggestion.dismissed ? null : concurrentSuggestion,
      dismissedToday: concurrentSuggestion.dismissed,
    });
  } catch (err: any) {
    console.error("[Proactive Suggestion GET Error]:", err);
    return NextResponse.json({ error: "Failed to load proactive suggestion" }, { status: 500 });
  }
}

/**
 * POST /api/ai/myra/proactive-suggestion
 * Dismiss or mark as acted upon.
 */
export async function POST(req: NextRequest) {
  try {
    const userId = await resolveMyraUser(req);
    if (!userId) return NextResponse.json({ error: "Sign in to update suggestions." }, { status: 401 });

    const body = await req.json().catch(() => null);
    if (!body || typeof body !== "object") {
      return NextResponse.json({ error: "Invalid suggestion request." }, { status: 400 });
    }
    const { suggestionId, userId: requestedUserId, action = "dismiss" } = body;
    if (requestedUserId && requestedUserId !== userId) {
      return NextResponse.json({ error: "Student identity does not match the session." }, { status: 403 });
    }
    if (typeof suggestionId !== "string" || !suggestionId || (action !== "dismiss" && action !== "act")) {
      return NextResponse.json({ error: "A suggestion ID and valid action are required." }, { status: 400 });
    }

    const { data, error } = await createClient()
      .from("myra_proactive_suggestions")
      .update(action === "dismiss" ? { dismissed: true } : { acted_on: true })
      .eq("id", suggestionId)
      .eq("user_id", userId)
      .select("id")
      .maybeSingle();
    if (error) throw error;
    if (!data) return NextResponse.json({ error: "Suggestion unavailable." }, { status: 404 });
    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error("[Proactive Suggestion POST Error]:", err);
    return NextResponse.json({ error: "Failed to update suggestion" }, { status: 500 });
  }
}
