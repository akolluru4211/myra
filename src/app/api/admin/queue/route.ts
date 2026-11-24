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
    const status = searchParams.get("status"); // 'pending', 'changes_requested', 'approved', 'declined', or 'all'
    const type = searchParams.get("type"); // 'ambassador_application', 'profile_correction', etc.

    let sql = `
      SELECT id, review_type, requester_id, requester_name, requester_email, institution,
             title, status, evidence, current_values, proposed_values, reviewer_id,
             reviewer_name, internal_notes, applicant_feedback, last_decision_at, created_at, version
      FROM public.admin_review_queue
      WHERE 1=1
    `;
    const params: any[] = [];

    // College staff scoped to their institution
    if (actor.role === "REVIEWER" && actor.institution) {
      params.push(actor.institution);
      sql += ` AND institution ILIKE $${params.length}`;
    }

    if (status && status !== "all") {
      params.push(status);
      sql += ` AND status = $${params.length}`;
    }

    if (type && type !== "all") {
      params.push(type);
      sql += ` AND review_type = $${params.length}`;
    }

    sql += ` ORDER BY CASE WHEN status = 'pending' THEN 1 WHEN status = 'changes_requested' THEN 2 ELSE 3 END, created_at DESC`;

    const { rows } = await queryDb(sql, params);

    // Compute overview summary counts
    const overviewRes = await queryDb(`
      SELECT 
        COUNT(*) FILTER (WHERE status = 'pending') as pending_count,
        COUNT(*) FILTER (WHERE status = 'changes_requested') as changes_requested_count,
        COUNT(*) FILTER (WHERE status IN ('approved', 'declined')) as resolved_count,
        COUNT(*) as total_count
      FROM public.admin_review_queue
    `);

    return NextResponse.json({
      success: true,
      counts: overviewRes.rows[0] || { pending_count: 0, changes_requested_count: 0, resolved_count: 0, total_count: 0 },
      items: rows,
    });
  } catch (err: any) {
    console.error("[Admin Queue GET Error]:", err);
    return NextResponse.json({ success: false, error: "Failed to fetch review queue" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const actor = await resolveStaffClearance(req);
    if (!actor) {
      return NextResponse.json({ success: false, error: "Unauthorized: Staff clearance required." }, { status: 403 });
    }

    const body = await req.json().catch(() => ({}));
    const { itemId, action, reason, internalNotes, applicantFeedback, currentVersion } = body;

    if (!itemId || !["approve", "request_changes", "decline"].includes(action)) {
      return NextResponse.json({ success: false, error: "Item ID and valid action (approve, request_changes, decline) required." }, { status: 400 });
    }

    // Require reason when requesting changes or declining
    if ((action === "request_changes" || action === "decline") && (!reason || !reason.trim())) {
      return NextResponse.json({ success: false, error: "A clear reason is required when requesting changes or declining." }, { status: 400 });
    }

    // 1. Fetch current queue item with version concurrency check
    const { rows: itemRows } = await queryDb(
      `SELECT * FROM public.admin_review_queue WHERE id = $1 LIMIT 1`,
      [itemId]
    );

    if (itemRows.length === 0) {
      return NextResponse.json({ success: false, error: "Queue item not found" }, { status: 404 });
    }

    const item = itemRows[0];

    // Self-approval prevention: Requester cannot approve their own item
    if (item.requester_id === actor.id) {
      return NextResponse.json({ success: false, error: "Conflict of Interest: You cannot review or approve your own submission." }, { status: 403 });
    }

    // Prevent duplicate approvals
    if (item.status === "approved" && action === "approve") {
      return NextResponse.json({ success: false, error: "Item is already approved." }, { status: 409 });
    }

    // Concurrency detection: Detect if another reviewer acted on the item
    if (currentVersion != null && item.version !== currentVersion) {
      return NextResponse.json({
        success: false,
        error: `Conflict detected: Reviewer ${item.reviewer_name || "another staff member"} has already updated this request to '${item.status}'. Please refresh.`,
        conflict: true,
        currentStatus: item.status,
      }, { status: 409 });
    }

    const newStatus = action === "approve" ? "approved" : action === "request_changes" ? "changes_requested" : "declined";

    // 2. Update queue item atomically with version increment
    const updateRes = await queryDb(
      `UPDATE public.admin_review_queue
       SET status = $1,
           reviewer_id = $2,
           reviewer_name = $3,
           internal_notes = $4,
           applicant_feedback = $5,
           last_decision_at = NOW(),
           updated_at = NOW(),
           version = version + 1
       WHERE id = $6
       RETURNING *`,
      [
        newStatus,
        actor.id,
        actor.name,
        internalNotes || null,
        applicantFeedback || reason || null,
        itemId,
      ]
    );

    const updatedItem = updateRes.rows[0];

    // 3. Record in staff_audit_history
    await queryDb(
      `INSERT INTO public.staff_audit_history (
        item_type, item_id, action, reviewer_id, reviewer_name, reason,
        previous_status, new_status, internal_notes, applicant_message
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
      [
        item.review_type,
        itemId,
        action,
        actor.id,
        actor.name,
        reason || `Action: ${action}`,
        item.status,
        newStatus,
        internalNotes || null,
        applicantFeedback || null,
      ]
    );

    // 4. Propagate side-effects to associated domain models
    if (item.review_type === "ambassador_application") {
      const appStatus = newStatus === "approved" ? "approved" : newStatus === "changes_requested" ? "changes_requested" : "declined";
      await queryDb(
        `UPDATE public.ambassador_applications
         SET status = $1,
             decision_message = $2,
             internal_notes = $3,
             reviewed_by = $4,
             reviewed_at = NOW(),
             updated_at = NOW()
         WHERE id = $5 OR user_id = $6`,
        [appStatus, applicantFeedback || reason, internalNotes || null, actor.name, item.requester_id, item.requester_id]
      );

      // If approved, create/activate ambassador record once with referral code
      if (newStatus === "approved") {
        const cleanCollege = (item.institution || "CAMPUS").toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 8);
        const randSuffix = Math.floor(1000 + Math.random() * 9000);
        const referralCode = `EDW-${cleanCollege}-${randSuffix}`;

        await queryDb(
          `INSERT INTO public.ambassadors (user_id, college_name, referral_code, is_active, status, joined_at)
           VALUES ($1, $2, $3, true, 'active', NOW())
           ON CONFLICT (user_id) DO UPDATE SET is_active = true, status = 'active', updated_at = NOW()`,
          [item.requester_id, item.institution || "College", referralCode]
        );
      }
    } else if (item.review_type === "profile_correction" && newStatus === "approved") {
      // Apply proposed values to public profiles
      const proposed = item.proposed_values || {};
      const fields = Object.keys(proposed);
      if (fields.length > 0) {
        // Only allow safe student-facing fields
        const safeFields = ["name", "institution", "grade_level", "career_stage", "primary_goal"];
        for (const f of fields) {
          if (safeFields.includes(f)) {
            await queryDb(
              `UPDATE public.profiles SET ${f} = $1, updated_at = NOW() WHERE id = $2`,
              [proposed[f], item.requester_id]
            );
          }
        }
      }
    }

    return NextResponse.json({
      success: true,
      item: updatedItem,
      actionTaken: action,
      newStatus,
    });
  } catch (err: any) {
    console.error("[Admin Queue POST Error]:", err);
    return NextResponse.json({ success: false, error: "Failed to process review action" }, { status: 500 });
  }
}
