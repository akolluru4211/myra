import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { resolveServerSessionUserId } from "@/lib/auth/server-session";
import {
  dispatchOutboundEdMail,
  EDMAIL_MAX_RECIPIENTS,
  EDMAIL_DAILY_SEND_LIMIT,
  sanitizeEmailHtml,
} from "@/lib/edmail/edmail-service";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const userId = await resolveServerSessionUserId(req);
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const {
      to = [],
      cc = [],
      bcc = [],
      subject = "",
      bodyText = "",
      bodyHtml = "",
      threadId,
      draftId,
      idempotencyKey,
      attachments = [],
    } = body;

    if (!Array.isArray(attachments) || attachments.length > 10 ||
        attachments.some((file) => typeof file?.filename !== "string" || !file.filename.trim() ||
          typeof file.content !== "string" || !/^[A-Za-z0-9+/]*={0,2}$/.test(file.content) ||
          file.content.length % 4 !== 0) ||
        attachments.reduce((sum, file) => sum + Buffer.from(file.content, "base64").length, 0) > 3 * 1024 * 1024) {
      return NextResponse.json({ error: "Attach up to 10 valid files totaling 3 MB or less." }, { status: 400 });
    }

    // 1. Verify mailbox existence and ownership
    const { data: mailbox, error: boxErr } = await supabase
      .from("edmail_mailboxes")
      .select("*")
      .eq("user_id", userId)
      .single();

    if (boxErr || !mailbox) {
      return NextResponse.json({ error: "EdMail mailbox not found or inactive." }, { status: 404 });
    }

    if (mailbox.status === "suspended") {
      return NextResponse.json({ error: "Mailbox is currently suspended due to safety or policy review." }, { status: 403 });
    }

    // 2. Validate recipients & quotas
    const cleanTo = Array.isArray(to) ? to.map((e: string) => e.trim().toLowerCase()).filter(Boolean) : [];
    const cleanCc = Array.isArray(cc) ? cc.map((e: string) => e.trim().toLowerCase()).filter(Boolean) : [];
    const cleanBcc = Array.isArray(bcc) ? bcc.map((e: string) => e.trim().toLowerCase()).filter(Boolean) : [];
    const totalRecipients = cleanTo.length + cleanCc.length + cleanBcc.length;

    if (totalRecipients === 0) {
      return NextResponse.json({ error: "At least one recipient email is required." }, { status: 400 });
    }

    if (totalRecipients > EDMAIL_MAX_RECIPIENTS) {
      return NextResponse.json({ error: `Exceeded recipient limit. Maximum ${EDMAIL_MAX_RECIPIENTS} recipients per email.` }, { status: 400 });
    }

    if (mailbox.daily_send_count >= mailbox.daily_send_limit) {
      return NextResponse.json({ error: `Daily send limit reached (${mailbox.daily_send_limit} emails). Quota resets every 24 hours.` }, { status: 429 });
    }

    // 3. Idempotency Check: prevent duplicate email dispatch on rapid double-clicks
    if (idempotencyKey) {
      const { data: existingLog } = await supabase
        .from("edmail_delivery_logs")
        .select("id, message_id")
        .eq("event_id", idempotencyKey)
        .maybeSingle();

      if (existingLog) {
        return NextResponse.json({
          success: true,
          messageId: existingLog.message_id,
          notice: "Request already processed (idempotent).",
        });
      }
    }

    // 4. Resolve sender profile name
    const { data: profile } = await supabase
      .from("profiles")
      .select("display_name, first_name, last_name")
      .eq("id", userId)
      .maybeSingle();

    const senderName = profile?.display_name || `${profile?.first_name || ""} ${profile?.last_name || ""}`.trim() || mailbox.username;
    const resolvedThreadId = threadId || `thread_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;

    // 5. Dispatch outbound message via managed mail provider
    const dispatchRes = await dispatchOutboundEdMail({
      fromAddress: mailbox.address,
      fromName: `${senderName} via EdMail`,
      to: cleanTo,
      cc: cleanCc,
      bcc: cleanBcc,
      subject: subject || "(No Subject)",
      text: bodyText || "",
      html: bodyHtml ? sanitizeEmailHtml(bodyHtml, false) : bodyText ? "" : "<p></p>",
      idempotencyKey,
      attachments: attachments.map(({ filename, content }) => ({ filename, content })),
    });

    if (!dispatchRes.success || dispatchRes.status !== "accepted") {
      return NextResponse.json({ error: dispatchRes.error || "Mail provider could not accept the message." }, { status: 502 });
    }
    const deliveryStatus = "accepted";

    // 6. Record outbound message in database under Sent folder
    const snippet = (bodyText || subject || "").slice(0, 140);
    const { data: savedMsg, error: saveErr } = await supabase
      .from("edmail_messages")
      .insert({
        mailbox_id: mailbox.id,
        thread_id: resolvedThreadId,
        provider_message_id: dispatchRes.providerMessageId || null,
        direction: "outbound",
        folder: "sent",
        from_address: mailbox.address,
        from_name: senderName,
        to_addresses: cleanTo,
        cc_addresses: cleanCc,
        bcc_addresses: cleanBcc,
        subject: subject || "(No Subject)",
        snippet,
        body_text: bodyText || "",
        body_html: bodyHtml ? sanitizeEmailHtml(bodyHtml, false) : "",
        is_read: true,
        is_starred: false,
        labels: [],
        delivery_status: deliveryStatus,
        delivery_error: dispatchRes.error || null,
        received_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (saveErr) {
      return NextResponse.json({ error: saveErr.message }, { status: 500 });
    }

    if (attachments.length) {
      const { error } = await supabase.from("edmail_attachments").insert(
        attachments.map(({ filename, content }) => ({
          message_id: savedMsg.id,
          mailbox_id: mailbox.id,
          filename,
          content_type: "application/octet-stream",
          byte_size: Buffer.from(content, "base64").length,
          content_base64: content,
        })),
      );
      if (error) console.error("Could not save sent attachment copies:", error.message);
    }

    // 7. If this was sent from an existing draft, delete or remove that draft
    if (draftId) {
      await supabase
        .from("edmail_messages")
        .delete()
        .eq("id", draftId)
        .eq("folder", "drafts")
        .eq("mailbox_id", mailbox.id);
    }

    // 8. Update mailbox daily send count
    await supabase
      .from("edmail_mailboxes")
      .update({
        daily_send_count: mailbox.daily_send_count + 1,
        updated_at: new Date().toISOString(),
      })
      .eq("id", mailbox.id);

    // 9. Record idempotency log
    if (idempotencyKey) {
      await supabase.from("edmail_delivery_logs").insert({
        provider: "resend",
        event_id: idempotencyKey,
        event_type: "email.sent",
        recipient: cleanTo[0] || "",
        message_id: savedMsg.id,
        payload: {
          to: cleanTo,
          subject,
          providerMessageId: dispatchRes.providerMessageId,
        },
      });
    }

    return NextResponse.json({
      success: true,
      messageId: savedMsg.id,
      providerMessageId: dispatchRes.providerMessageId,
      deliveryStatus,
      threadId: resolvedThreadId,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Failed to send email" }, { status: 500 });
  }
}
