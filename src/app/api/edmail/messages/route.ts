import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { resolveServerSessionUserId } from "@/lib/auth/server-session";
import { sanitizeEmailHtml } from "@/lib/edmail/edmail-service";

export const dynamic = "force-dynamic";

/**
 * GET: Fetch messages for the authenticated student's mailbox
 */
export async function GET(req: NextRequest) {
  try {
    const userId = await resolveServerSessionUserId(req);
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const folder = searchParams.get("folder") || "inbox";
    const label = searchParams.get("label");
    const search = searchParams.get("search")?.toLowerCase();

    // 1. Get student's mailbox ID
    const { data: mailbox, error: boxErr } = await supabase
      .from("edmail_mailboxes")
      .select("id, address")
      .eq("user_id", userId)
      .maybeSingle();

    if (boxErr || !mailbox) {
      return NextResponse.json({ messages: [], unreadCounts: {} });
    }

    // 2. Build query
    let query = supabase
      .from("edmail_messages")
      .select("id, thread_id, direction, folder, from_address, from_name, to_addresses, cc_addresses, bcc_addresses, subject, snippet, is_read, is_starred, labels, delivery_status, received_at, created_at")
      .eq("mailbox_id", mailbox.id)
      .order("created_at", { ascending: false });

    if (folder === "starred") {
      query = query.eq("is_starred", true);
    } else if (folder !== "all") {
      query = query.eq("folder", folder);
    }

    if (label) {
      query = query.contains("labels", [label]);
    }

    const { data: messages, error: msgErr } = await query;
    if (msgErr) {
      return NextResponse.json({ error: msgErr.message }, { status: 500 });
    }

    let filtered = messages || [];
    if (search) {
      filtered = filtered.filter(
        (m: any) =>
          m.subject?.toLowerCase().includes(search) ||
          m.from_address?.toLowerCase().includes(search) ||
          m.from_name?.toLowerCase().includes(search) ||
          m.snippet?.toLowerCase().includes(search)
      );
    }

    // Calculate unread counts by folder
    const { data: unreadData } = await supabase
      .from("edmail_messages")
      .select("folder, count")
      .eq("mailbox_id", mailbox.id)
      .eq("is_read", false);

    const counts: Record<string, number> = { inbox: 0, sent: 0, drafts: 0, archive: 0, trash: 0, spam: 0, starred: 0 };
    (unreadData || []).forEach((row: any) => {
      if (counts[row.folder] !== undefined) {
        counts[row.folder] = (counts[row.folder] || 0) + 1;
      }
    });

    return NextResponse.json({
      success: true,
      messages: filtered,
      mailboxAddress: mailbox.address,
      unreadCounts: counts,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Failed to fetch messages" }, { status: 500 });
  }
}

/**
 * PATCH: Bulk or single message action (mark read, star, move folder, set labels)
 */
export async function PATCH(req: NextRequest) {
  try {
    const userId = await resolveServerSessionUserId(req);
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { messageIds, action, value } = body;

    if (!Array.isArray(messageIds) || messageIds.length === 0) {
      return NextResponse.json({ error: "No message IDs provided." }, { status: 400 });
    }

    // Verify ownership of the mailbox
    const { data: mailbox } = await supabase
      .from("edmail_mailboxes")
      .select("id")
      .eq("user_id", userId)
      .single();

    if (!mailbox) {
      return NextResponse.json({ error: "Mailbox not found." }, { status: 404 });
    }

    let updates: any = { updated_at: new Date().toISOString() };
    if (action === "mark_read") {
      updates.is_read = Boolean(value);
    } else if (action === "star") {
      updates.is_starred = Boolean(value);
    } else if (action === "move_folder") {
      updates.folder = value;
    } else if (action === "set_labels") {
      updates.labels = value;
    }

    const { error } = await supabase
      .from("edmail_messages")
      .update(updates)
      .eq("mailbox_id", mailbox.id)
      .in("id", messageIds);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, updatedCount: messageIds.length });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Failed to update messages" }, { status: 500 });
  }
}
