import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { resolveServerSessionUserId } from "@/lib/auth/server-session";

export const dynamic = "force-dynamic";

/**
 * POST: Student initiates mailbox closure / deletion
 * In accordance with Edworld retention policy:
 * 1. Mailbox status transitions to 'closed'.
 * 2. Incoming messages are rejected with closed mailbox notice.
 * 3. 30-day retention grace period set before permanent cryptographic erasure.
 */
export async function POST(req: NextRequest) {
  try {
    const userId = await resolveServerSessionUserId(req);
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized: Authentication required." }, { status: 401 });
    }

    const { data: mailbox, error: boxErr } = await supabase
      .from("edmail_mailboxes")
      .select("id, address, status")
      .eq("user_id", userId)
      .maybeSingle();

    if (boxErr || !mailbox) {
      return NextResponse.json({ error: "No active EdMail mailbox found." }, { status: 404 });
    }

    const now = new Date();
    const retentionUntil = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000); // 30-day grace period

    // Update mailbox to closed state
    const { error: updateErr } = await supabase
      .from("edmail_mailboxes")
      .update({
        status: "closed",
        closed_at: now.toISOString(),
        retention_until: retentionUntil.toISOString(),
        updated_at: now.toISOString(),
      })
      .eq("id", mailbox.id);

    if (updateErr) {
      return NextResponse.json({ error: updateErr.message }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      notice: "Mailbox marked as closed. You have a 30-day retention grace period before permanent erasure.",
      closedAt: now.toISOString(),
      retentionUntil: retentionUntil.toISOString(),
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Failed to close mailbox" }, { status: 500 });
  }
}
