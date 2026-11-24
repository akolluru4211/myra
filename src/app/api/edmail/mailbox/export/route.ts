import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { resolveServerSessionUserId } from "@/lib/auth/server-session";

export const dynamic = "force-dynamic";

/**
 * POST: Request a complete student data export (Mailbox, Marks, Events, Certificates)
 * Compliant with GDPR / DPDP right to data portability.
 */
export async function POST(req: NextRequest) {
  try {
    const userId = await resolveServerSessionUserId(req);
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized: Authentication required." }, { status: 401 });
    }

    // 1. Get mailbox
    const { data: mailbox, error: boxErr } = await supabase
      .from("edmail_mailboxes")
      .select("*")
      .eq("user_id", userId)
      .maybeSingle();

    if (boxErr || !mailbox) {
      return NextResponse.json({ error: "No EdMail mailbox found." }, { status: 404 });
    }

    // 2. Fetch all messages
    const { data: messages } = await supabase
      .from("edmail_messages")
      .select("id, thread_id, direction, folder, from_address, to_addresses, subject, body_text, delivery_status, received_at, created_at")
      .eq("mailbox_id", mailbox.id)
      .order("created_at", { ascending: true });

    // 3. Fetch Student Records
    const { data: marks } = await supabase
      .from("student_marks")
      .select("*")
      .eq("user_id", userId);

    const { data: events } = await supabase
      .from("student_events")
      .select("*")
      .eq("user_id", userId);

    const { data: documents } = await supabase
      .from("edmail_documents")
      .select("*")
      .eq("user_id", userId);

    const exportArchive = {
      exportMetadata: {
        exportedAt: new Date().toISOString(),
        studentAddress: mailbox.address,
        studentUserId: userId,
        platform: "Edworld Student Platform",
        formatVersion: "1.0",
      },
      mailbox: {
        address: mailbox.address,
        status: mailbox.status,
        recoveryEmail: mailbox.recovery_email,
        createdAt: mailbox.created_at,
      },
      messages: messages || [],
      studentRecords: {
        marks: marks || [],
        events: events || [],
        documents: documents || [],
      },
    };

    // Update export timestamp on mailbox
    await supabase
      .from("edmail_mailboxes")
      .update({ export_requested_at: new Date().toISOString() })
      .eq("id", mailbox.id);

    return NextResponse.json({
      success: true,
      exportArchive,
      messageCount: messages?.length || 0,
      marksCount: marks?.length || 0,
      eventsCount: events?.length || 0,
      documentsCount: documents?.length || 0,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Failed to generate export" }, { status: 500 });
  }
}
