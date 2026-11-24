import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { resolveServerSessionUserId } from "@/lib/auth/server-session";

export const dynamic = "force-dynamic";

/**
 * Calculates letter grade based on percentage if not manually provided.
 */
function calculateGrade(score: number, maxMarks: number): string {
  if (maxMarks <= 0) return "N/A";
  const pct = (score / maxMarks) * 100;
  if (pct >= 90) return "A+";
  if (pct >= 80) return "A";
  if (pct >= 70) return "B";
  if (pct >= 60) return "C";
  if (pct >= 50) return "D";
  return "F";
}

/**
 * GET: Retrieve student marks
 */
export async function GET(req: NextRequest) {
  try {
    const userId = await resolveServerSessionUserId(req);
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const subject = searchParams.get("subject");

    let query = supabase
      .from("student_marks")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });

    if (subject) {
      query = query.ilike("subject", `%${subject}%`);
    }

    const { data: marks, error } = await query;
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      marks: marks || [],
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Failed to load marks" }, { status: 500 });
  }
}

/**
 * POST: Add mark record (manually or saved from email attachment)
 */
export async function POST(req: NextRequest) {
  try {
    const userId = await resolveServerSessionUserId(req);
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const {
      subject,
      assessmentName,
      score,
      maxMarks = 100,
      grade,
      termOrSemester,
      source = "student_entered",
      isVerified = false,
      verifiedBy,
      markSheetFilename,
      sourceMessageId,
      notes,
    } = body;

    if (!subject || score === undefined || score === null) {
      return NextResponse.json({ error: "Subject and score are required." }, { status: 400 });
    }

    const numScore = Number(score);
    const numMax = Number(maxMarks) || 100;
    const computedGrade = grade || calculateGrade(numScore, numMax);

    // Get student mailbox if available
    const { data: mailbox } = await supabase
      .from("edmail_mailboxes")
      .select("id")
      .eq("user_id", userId)
      .maybeSingle();

    // Check for duplicate record if sourceMessageId is provided
    if (sourceMessageId) {
      const { data: existingMarks } = await supabase
        .from("student_marks")
        .select("id")
        .eq("user_id", userId)
        .eq("source_message_id", sourceMessageId)
        .eq("subject", subject.trim())
        .limit(1);

      if (existingMarks && existingMarks.length > 0) {
        return NextResponse.json({
          success: true,
          mark: existingMarks[0],
          notice: "Mark record already saved from this email.",
        });
      }
    }

    // Enforce verified status authenticity:
    // Only mark as institution_verified if source is trusted or approved
    const finalVerified = source === "institution_verified" && Boolean(isVerified);
    const finalSource = finalVerified
      ? "institution_verified"
      : source === "email_attachment"
      ? "email_attachment"
      : "student_entered";

    const { data: mark, error } = await supabase
      .from("student_marks")
      .insert({
        user_id: userId,
        mailbox_id: mailbox?.id || null,
        subject: subject.trim(),
        assessment_name: (assessmentName || "General Assessment").trim(),
        score: numScore,
        max_marks: numMax,
        grade: computedGrade,
        term_or_semester: termOrSemester || null,
        source: finalSource,
        is_verified: finalVerified,
        verified_by: finalVerified ? verifiedBy || "EdWorld Institutional Integration" : null,
        verified_at: finalVerified ? new Date().toISOString() : null,
        mark_sheet_filename: markSheetFilename || null,
        source_message_id: sourceMessageId || null,
        notes: notes || null,
      })
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      mark,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Failed to save mark record" }, { status: 500 });
  }
}

/**
 * DELETE: Remove a mark record
 */
export async function DELETE(req: NextRequest) {
  try {
    const userId = await resolveServerSessionUserId(req);
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const markId = searchParams.get("id");

    if (!markId) {
      return NextResponse.json({ error: "Mark ID is required" }, { status: 400 });
    }

    const { error } = await supabase
      .from("student_marks")
      .delete()
      .eq("id", markId)
      .eq("user_id", userId);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, deletedId: markId });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Failed to delete mark record" }, { status: 500 });
  }
}
