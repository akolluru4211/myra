import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { validateSession } from "@/lib/otp-service";
import { createClient } from "@/lib/supabase/server";

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

/**
 * POST: Save or update draft message
 */
export async function POST(req: NextRequest) {
  try {
    const userId = await resolveAuthenticatedUserId(req);
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const {
      draftId,
      to = [],
      cc = [],
      bcc = [],
      subject = "",
      bodyText = "",
      bodyHtml = "",
      threadId,
    } = body;

    const { data: mailbox } = await supabase
      .from("edmail_mailboxes")
      .select("id, address")
      .eq("user_id", userId)
      .single();

    if (!mailbox) {
      return NextResponse.json({ error: "Mailbox not found" }, { status: 404 });
    }

    const resolvedThreadId = threadId || `thread_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const snippet = (bodyText || subject || "Empty draft").slice(0, 100);

    let result;
    if (draftId) {
      // Update existing draft
      result = await supabase
        .from("edmail_messages")
        .update({
          to_addresses: Array.isArray(to) ? to : [],
          cc_addresses: Array.isArray(cc) ? cc : [],
          bcc_addresses: Array.isArray(bcc) ? bcc : [],
          subject,
          snippet,
          body_text: bodyText,
          body_html: bodyHtml,
          updated_at: new Date().toISOString(),
        })
        .eq("id", draftId)
        .eq("mailbox_id", mailbox.id)
        .select()
        .single();
    } else {
      // Create new draft
      result = await supabase
        .from("edmail_messages")
        .insert({
          mailbox_id: mailbox.id,
          thread_id: resolvedThreadId,
          direction: "outbound",
          folder: "drafts",
          from_address: mailbox.address,
          to_addresses: Array.isArray(to) ? to : [],
          cc_addresses: Array.isArray(cc) ? cc : [],
          bcc_addresses: Array.isArray(bcc) ? bcc : [],
          subject,
          snippet,
          body_text: bodyText,
          body_html: bodyHtml,
          is_read: true,
          is_starred: false,
          labels: [],
          delivery_status: "draft",
          received_at: new Date().toISOString(),
        })
        .select()
        .single();
    }

    if (result.error) {
      return NextResponse.json({ error: result.error.message }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      draft: result.data,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Failed to save draft" }, { status: 500 });
  }
}
