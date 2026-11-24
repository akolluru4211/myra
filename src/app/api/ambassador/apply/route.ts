import { NextRequest, NextResponse } from "next/server";
import { queryDb } from "@/lib/db-server";
import { resolveMyraUser } from "@/lib/ai/myra-session";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const queryUserId = searchParams.get("userId");
    const sessionUserId = await resolveMyraUser(req);
    const userId = queryUserId || sessionUserId;

    if (!userId) {
      return NextResponse.json({ success: false, error: "User ID required" }, { status: 400 });
    }

    // 1. Fetch student's latest application
    const { rows: appRows } = await queryDb(
      `SELECT id, user_id, student_name, email, college_name, degree_year,
              why_ambassador, relevant_experience, social_links, status,
              decision_message, internal_notes, reviewed_by, reviewed_at, created_at, updated_at
       FROM public.ambassador_applications
       WHERE user_id = $1
       ORDER BY created_at DESC
       LIMIT 1`,
      [userId]
    );

    // 2. Fetch active ambassador appointment and verified rewards
    const { rows: ambRows } = await queryDb(
      `SELECT user_id, college_name, referral_code, is_active, status,
              status_reason, verified_rewards, assigned_tasks, campus_events, joined_at
       FROM public.ambassadors
       WHERE user_id = $1
       LIMIT 1`,
      [userId]
    );

    // 3. Count verified referred students without leaking their private PII
    let referralCount = 0;
    if (ambRows.length > 0) {
      const amb = ambRows[0];
      const countRes = await queryDb(
        `SELECT COUNT(*) as total FROM public.ambassador_referrals WHERE referral_code = $1 AND is_verified = true`,
        [amb.referral_code]
      );
      referralCount = parseInt(countRes.rows[0]?.total || "0", 10);
    }

    return NextResponse.json({
      success: true,
      application: appRows[0] || null,
      ambassador: ambRows.length > 0 ? {
        ...ambRows[0],
        referralCount,
      } : null,
    });
  } catch (err: any) {
    console.error("[Ambassador Apply GET Error]:", err);
    return NextResponse.json({ success: false, error: "Failed to load ambassador status" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const sessionUserId = await resolveMyraUser(req);
    const body = await req.json().catch(() => ({}));
    const {
      userId = sessionUserId,
      studentName = "Learner",
      email,
      collegeName,
      degreeYear,
      whyAmbassador,
      relevantExperience,
      socialLinks = {},
      isResubmission = false,
    } = body;

    if (!userId || !collegeName || !whyAmbassador) {
      return NextResponse.json({ success: false, error: "College name and statement of purpose are required." }, { status: 400 });
    }

    // Check for existing active application to prevent duplicates
    const { rows: existing } = await queryDb(
      `SELECT id, status FROM public.ambassador_applications WHERE user_id = $1 ORDER BY created_at DESC LIMIT 1`,
      [userId]
    );

    if (existing.length > 0) {
      const prev = existing[0];
      if (prev.status === "approved") {
        return NextResponse.json({ success: false, error: "You are already an approved campus ambassador!" }, { status: 400 });
      }
      if (prev.status === "submitted" || prev.status === "under_review") {
        return NextResponse.json({ success: false, error: "You already have an active application under review." }, { status: 400 });
      }
      // If changes were requested, allow updating the existing application
      if (prev.status === "changes_requested" || isResubmission) {
        const updateRes = await queryDb(
          `UPDATE public.ambassador_applications
           SET college_name = $1,
               degree_year = $2,
               why_ambassador = $3,
               relevant_experience = $4,
               social_links = $5,
               status = 'submitted',
               decision_message = null,
               updated_at = NOW()
           WHERE id = $6
           RETURNING *`,
          [collegeName, degreeYear || "Undergraduate", whyAmbassador, relevantExperience || "", JSON.stringify(socialLinks), prev.id]
        );

        // Update item in admin review queue
        await queryDb(
          `UPDATE public.admin_review_queue
           SET status = 'pending',
               title = $1,
               institution = $2,
               proposed_values = $3,
               applicant_feedback = null,
               updated_at = NOW()
           WHERE requester_id = $4 AND review_type = 'ambassador_application'`,
          [
            `Ambassador Resubmission: ${studentName}`,
            collegeName,
            JSON.stringify({ whyAmbassador, relevantExperience }),
            userId,
          ]
        );

        return NextResponse.json({
          success: true,
          message: "Ambassador application resubmitted successfully for staff review.",
          application: updateRes.rows[0],
        });
      }
    }

    // Create new application
    const insertRes = await queryDb(
      `INSERT INTO public.ambassador_applications (
        user_id, student_name, email, college_name, degree_year,
        why_ambassador, relevant_experience, social_links, status
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'submitted')
      RETURNING *`,
      [
        userId,
        studentName,
        email || "student@college.edu",
        collegeName,
        degreeYear || "Undergraduate",
        whyAmbassador,
        relevantExperience || "",
        JSON.stringify(socialLinks),
      ]
    );

    const newApp = insertRes.rows[0];

    // Push into unified admin review queue
    await queryDb(
      `INSERT INTO public.admin_review_queue (
        review_type, requester_id, requester_name, requester_email,
        institution, title, status, evidence, proposed_values
      ) VALUES ($1, $2, $3, $4, $5, 'pending', $6, $7, $8)`,
      [
        "ambassador_application",
        userId,
        studentName,
        email || "student@college.edu",
        collegeName,
        `Campus Ambassador Application: ${studentName} (${collegeName})`,
        JSON.stringify({ whyAmbassador, relevantExperience, socialLinks }),
        JSON.stringify({ collegeName, degreeYear, whyAmbassador }),
      ]
    );

    return NextResponse.json({
      success: true,
      message: "Application submitted successfully.",
      application: newApp,
    });
  } catch (err: any) {
    console.error("[Ambassador Apply POST Error]:", err);
    return NextResponse.json({ success: false, error: "Failed to submit ambassador application" }, { status: 500 });
  }
}
