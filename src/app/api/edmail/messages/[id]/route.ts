import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { validateSession } from "@/lib/otp-service";
import { createClient } from "@/lib/supabase/server";
import { sanitizeEmailHtml } from "@/lib/edmail/edmail-service";

export const dynamic = "force-dynamic";

async function resolveAuthenticatedUserId(req: NextRequest): Promise<string | null> {
  try {
    const supabaseServer = createClient();
    const { data: { user } } = await supabaseServer.auth.getUser();
    if (user?.id) return user.id;
  } catch {}

  const sessionToken = req.cookies.get("edworld_session")?.value;
  if (sessionToken) {
    const sess = validateSession(sessionToken);
    if (sess.valid && sess.userId) return sess.userId;
  }

  return null;
}

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: messageId } = await params;
    const userId = await resolveAuthenticatedUserId(req);
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Ensure student owns the mailbox containing this message
    const { data: mailbox } = await supabase
      .from("edmail_mailboxes")
      .select("id")
      .eq("user_id", userId)
      .single();

    if (!mailbox) {
      return NextResponse.json({ error: "Mailbox not found" }, { status: 404 });
    }

    const { data: message, error } = await supabase
      .from("edmail_messages")
      .select("*")
      .eq("id", messageId)
      .eq("mailbox_id", mailbox.id)
      .single();

    if (error || !message) {
      return NextResponse.json({ error: "Message not found" }, { status: 404 });
    }

    // Automatically mark as read if unread
    if (!message.is_read) {
      await supabase
        .from("edmail_messages")
        .update({ is_read: true, updated_at: new Date().toISOString() })
        .eq("id", messageId);
      message.is_read = true;
    }

    // Fetch attachments
    const { data: attachments } = await supabase
      .from("edmail_attachments")
      .select("*")
      .eq("message_id", messageId);

    // Fetch entire thread if part of a conversation
    let threadMessages: any[] = [];
    if (message.thread_id) {
      const { data: thread } = await supabase
        .from("edmail_messages")
        .select("id, from_address, from_name, to_addresses, snippet, created_at, delivery_status")
        .eq("mailbox_id", mailbox.id)
        .eq("thread_id", message.thread_id)
        .order("created_at", { ascending: true });
      threadMessages = thread || [];
    }

    // Sanitize HTML body for security & privacy
    const sanitizedHtml = sanitizeEmailHtml(message.body_html || "", false);

    return NextResponse.json({
      success: true,
      message: {
        ...message,
        body_html: sanitizedHtml,
        attachments: attachments || [],
      },
      thread: threadMessages,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Failed to load message" }, { status: 500 });
  }
}
