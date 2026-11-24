import { NextRequest, NextResponse } from "next/server";
import { queryDb } from "@/lib/db-server";
import { resolveStaffClearance } from "@/lib/staff-clearance";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const actor = await resolveStaffClearance(req);
    if (!actor) {
      return NextResponse.json({ success: false, error: "Unauthorized: Staff clearance required." }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const college = searchParams.get("college");
    const role = searchParams.get("role");
    const status = searchParams.get("status"); // active, suspended
    const search = searchParams.get("search");

    let sql = `
      SELECT 
        COALESCE(u.id, p.id) AS id,
        COALESCE(p.name, u.name, 'Learner') AS name,
        COALESCE(u.email, p.email, 'No email') AS email,
        COALESCE(p.institution, 'Unspecified College') AS college,
        COALESCE(p.grade_level, u.grade, 'Undergraduate') AS degree_year,
        COALESCE(p.career_stage, u.career_stage, 'college') AS career_stage,
        COALESCE(p.primary_goal, 'Campus Placements') AS primary_goal,
        COALESCE(u.is_admin, p.is_admin, false) AS is_admin,
        COALESCE(p.created_at, u.created_at, NOW()) AS created_at
      FROM public.users u
      FULL OUTER JOIN public.profiles p ON u.id = p.id
      WHERE 1=1
    `;
    const params: any[] = [];

    // College staff scoped to their institution
    if (actor.role === "REVIEWER" && actor.institution) {
      params.push(actor.institution);
      sql += ` AND p.institution ILIKE $${params.length}`;
    } else if (college && college !== "all" && college !== "All") {
      params.push(`%${college.trim()}%`);
      sql += ` AND p.institution ILIKE $${params.length}`;
    }

    if (role && role !== "all") {
      if (role === "ADMIN" || role === "ADMINISTRATOR") {
        sql += ` AND (u.is_admin = true OR p.is_admin = true)`;
      } else if (role === "STUDENT") {
        sql += ` AND (u.is_admin = false OR u.is_admin IS NULL) AND (p.is_admin = false OR p.is_admin IS NULL)`;
      }
    }

    if (search && search.trim()) {
      params.push(`%${search.trim().toLowerCase()}%`);
      sql += ` AND (LOWER(COALESCE(p.name, u.name, '')) LIKE $${params.length} OR LOWER(COALESCE(u.email, p.email, '')) LIKE $${params.length} OR LOWER(COALESCE(p.institution, '')) LIKE $${params.length})`;
    }

    sql += ` ORDER BY COALESCE(u.created_at, p.created_at) DESC LIMIT 100`;

    const { rows } = await queryDb(sql, params);

    return NextResponse.json({
      success: true,
      total: rows.length,
      users: rows.map(r => ({
        ...r,
        role: r.is_admin ? "ADMIN" : "STUDENT",
        is_suspended: false,
      })),
    });
  } catch (err: any) {
    console.error("[Staff Directory Error]:", err);
    return NextResponse.json({ success: false, error: "Failed to retrieve student directory" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const actor = await resolveStaffClearance(req);
    if (!actor) {
      return NextResponse.json({ success: false, error: "Unauthorized: Staff clearance required." }, { status: 403 });
    }

    const body = await req.json().catch(() => ({}));
    const { targetUserId, fieldsToUpdate, reason, notifyStudent = true } = body;

    if (!targetUserId || !fieldsToUpdate || typeof fieldsToUpdate !== "object") {
      return NextResponse.json({ success: false, error: "targetUserId and proposed fieldsToUpdate object are required." }, { status: 400 });
    }

    if (!reason || !reason.trim()) {
      return NextResponse.json({ success: false, error: "A clear administrative audit reason is required for student profile corrections." }, { status: 400 });
    }

    // Security Gate: Prevent non-admins from updating sensitive fields
    const allowedCorrectionFields = ["name", "institution", "grade_level", "career_stage", "primary_goal"];
    const sensitiveRestrictedFields = ["role", "email", "is_admin", "is_suspended", "verified_marks"];

    const attemptedKeys = Object.keys(fieldsToUpdate);
    for (const key of attemptedKeys) {
      if (sensitiveRestrictedFields.includes(key) && actor.role !== "ADMIN" && actor.role !== "SUPER_ADMIN") {
        return NextResponse.json({
          success: false,
          error: `Permission Denied: Only platform administrators can modify protected credentials or roles ('${key}').`,
        }, { status: 403 });
      }
      if (!allowedCorrectionFields.includes(key) && !sensitiveRestrictedFields.includes(key)) {
        return NextResponse.json({ success: false, error: `Invalid profile field: '${key}'` }, { status: 400 });
      }
    }

    // Fetch existing values for audit history
    const { rows: currentRows } = await queryDb(
      `SELECT name, institution, grade_level, career_stage, primary_goal FROM public.profiles WHERE id = $1 LIMIT 1`,
      [targetUserId]
    );
    const previousValues = currentRows[0] || {};

    // Perform updates
    for (const key of attemptedKeys) {
      if (allowedCorrectionFields.includes(key)) {
        await queryDb(
          `UPDATE public.profiles SET ${key} = $1, updated_at = NOW() WHERE id = $2`,
          [fieldsToUpdate[key], targetUserId]
        );
      }
    }

    // Record immutable audit history
    await queryDb(
      `INSERT INTO public.staff_audit_history (
        item_type, item_id, action, reviewer_id, reviewer_name, reason,
        previous_values, new_values, applicant_message
      ) VALUES ($1, $2, 'correct_profile', $3, $4, $5, $6, $7, $8)`,
      [
        "profile_correction",
        targetUserId,
        actor.id,
        actor.name,
        reason,
        JSON.stringify(previousValues),
        JSON.stringify(fieldsToUpdate),
        notifyStudent ? `Your student profile details were updated by staff (${reason}). If you notice an error, contact academic support.` : null,
      ]
    );

    return NextResponse.json({
      success: true,
      message: "Student profile corrected and recorded to audit trail successfully.",
      previousValues,
      newValues: fieldsToUpdate,
    });
  } catch (err: any) {
    console.error("[Staff Profile Correction Error]:", err);
    return NextResponse.json({ success: false, error: "Failed to correct student profile" }, { status: 500 });
  }
}
