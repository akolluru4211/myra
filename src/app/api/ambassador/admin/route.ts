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
    const status = searchParams.get("status");
    const college = searchParams.get("college");

    // Fetch applications
    let appSql = `
      SELECT id, user_id, student_name, email, college_name, degree_year,
             why_ambassador, relevant_experience, social_links, status,
             decision_message, internal_notes, reviewed_by, reviewed_at, created_at
      FROM public.ambassador_applications
      WHERE 1=1
    `;
    const appParams: any[] = [];
    if (status && status !== "all") {
      appParams.push(status);
      appSql += ` AND status = $${appParams.length}`;
    }
    if (college && college !== "all") {
      appParams.push(`%${college.trim()}%`);
      appSql += ` AND college_name ILIKE $${appParams.length}`;
    }
    appSql += ` ORDER BY created_at DESC`;
    const { rows: applications } = await queryDb(appSql, appParams);

    // Fetch active ambassadors
    const { rows: ambassadors } = await queryDb(
      `SELECT a.id, a.user_id, a.college_name, a.referral_code, a.is_active, a.status,
              a.status_reason, a.verified_rewards, a.assigned_tasks, a.campus_events, a.joined_at,
              COALESCE(p.name, u.name, 'Learner') as student_name,
              COALESCE(u.email, p.email, 'No email') as email
       FROM public.ambassadors a
       LEFT JOIN public.profiles p ON p.id = a.user_id
       LEFT JOIN public.users u ON u.id = a.user_id
       ORDER BY a.joined_at DESC`
    );

    return NextResponse.json({
      success: true,
      applications,
      ambassadors,
    });
  } catch (err: any) {
    console.error("[Ambassador Admin GET Error]:", err);
    return NextResponse.json({ success: false, error: "Failed to fetch ambassador admin records" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const actor = await resolveStaffClearance(req);
    if (!actor) {
      return NextResponse.json({ success: false, error: "Unauthorized: Staff clearance required." }, { status: 403 });
    }

    const body = await req.json().catch(() => ({}));
    const { action, ambassadorId, targetStatus, reason, newTask, newEvent } = body;

    // Action 1: Status Change (Active <-> Suspended)
    if (action === "update_status") {
      if (!ambassadorId || !targetStatus) {
        return NextResponse.json({ success: false, error: "ambassadorId and targetStatus required." }, { status: 400 });
      }
      if (!reason || !reason.trim()) {
        return NextResponse.json({ success: false, error: "A clear administrative reason is required for status modifications." }, { status: 400 });
      }

      const isActive = targetStatus === "active";
      await queryDb(
        `UPDATE public.ambassadors
         SET status = $1, is_active = $2, status_reason = $3, updated_at = NOW()
         WHERE id = $4 OR user_id = $4`,
        [targetStatus, isActive, reason, ambassadorId]
      );

      await queryDb(
        `INSERT INTO public.staff_audit_history (
          item_type, item_id, action, reviewer_id, reviewer_name, reason, new_status
        ) VALUES ('ambassador_status', $1, 'update_status', $2, $3, $4, $5)`,
        [ambassadorId, actor.id, actor.name, reason, targetStatus]
      );

      return NextResponse.json({ success: true, message: `Ambassador status updated to ${targetStatus}` });
    }

    // Action 2: Add Task Assignment
    if (action === "assign_task") {
      if (!ambassadorId || !newTask || !newTask.title) {
        return NextResponse.json({ success: false, error: "ambassadorId and valid task payload required." }, { status: 400 });
      }

      const taskItem = {
        id: `task_${Date.now()}`,
        title: newTask.title,
        description: newTask.description || "",
        dueDate: newTask.dueDate || null,
        assignedBy: actor.name,
        assignedAt: new Date().toISOString(),
        status: "pending",
      };

      await queryDb(
        `UPDATE public.ambassadors
         SET assigned_tasks = COALESCE(assigned_tasks, '[]'::jsonb) || $1::jsonb, updated_at = NOW()
         WHERE id = $2 OR user_id = $2`,
        [JSON.stringify([taskItem]), ambassadorId]
      );

      return NextResponse.json({ success: true, message: "Task assigned successfully to ambassador", task: taskItem });
    }

    // Action 3: Add Approved Campus Event
    if (action === "add_event") {
      if (!ambassadorId || !newEvent || !newEvent.title) {
        return NextResponse.json({ success: false, error: "ambassadorId and valid event payload required." }, { status: 400 });
      }

      const eventItem = {
        id: `event_${Date.now()}`,
        title: newEvent.title,
        eventDate: newEvent.eventDate || null,
        venue: newEvent.venue || "Campus Auditorium",
        status: "approved",
        approvedBy: actor.name,
      };

      await queryDb(
        `UPDATE public.ambassadors
         SET campus_events = COALESCE(campus_events, '[]'::jsonb) || $1::jsonb, updated_at = NOW()
         WHERE id = $2 OR user_id = $2`,
        [JSON.stringify([eventItem]), ambassadorId]
      );

      return NextResponse.json({ success: true, message: "Campus event recorded for ambassador", event: eventItem });
    }

    return NextResponse.json({ success: false, error: "Unknown action" }, { status: 400 });
  } catch (err: any) {
    console.error("[Ambassador Admin POST Error]:", err);
    return NextResponse.json({ success: false, error: "Failed to process ambassador admin action" }, { status: 500 });
  }
}
