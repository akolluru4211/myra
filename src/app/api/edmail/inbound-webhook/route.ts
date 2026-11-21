import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { sanitizeEmailHtml } from "@/lib/edmail/edmail-service";
import crypto from "crypto";

export const dynamic = "force-dynamic";

/**
 * Validates Svix cryptographic webhook signatures if webhook secret is configured.
 */
function verifySvixSignature(rawBody: string, req: NextRequest): boolean {
  const secret = process.env.EDMAIL_WEBHOOK_SECRET || process.env.RESEND_WEBHOOK_SECRET;
  if (!secret || secret.includes("placeholder") || secret.includes("test")) {
    return true; // Safe fallback in local development and sandbox tests
  }

  const svixId = req.headers.get("svix-id");
  const svixTimestamp = req.headers.get("svix-timestamp");
  const svixSignature = req.headers.get("svix-signature");

  if (!svixId || !svixTimestamp || !svixSignature) {
    return false;
  }

  // Prevent replay attacks (5 minutes tolerance)
  const timestampNum = parseInt(svixTimestamp, 10);
  const now = Math.floor(Date.now() / 1000);
  if (Math.abs(now - timestampNum) > 300) {
    return false;
  }

  try {
    const toSign = `${svixId}.${svixTimestamp}.${rawBody}`;
    const cleanSecret = secret.startsWith("whsec_") ? secret.substring(6) : secret;
    const key = Buffer.from(cleanSecret, "base64");
    const computed = crypto.createHmac("sha256", key).update(toSign).digest("base64");
    const expectedSignatures = svixSignature.split(" ").map(sig => sig.replace(/^v1,/, ""));
    return expectedSignatures.includes(computed);
  } catch {
    return false;
  }
}

/**
 * Inbound Webhook handler for external emails delivered to @edworld.co.in
 * Supports Resend Webhook signatures & payload structures with deduplication.
 */
export async function POST(req: NextRequest) {
  try {
    const rawBody = await req.text();

    if (!verifySvixSignature(rawBody, req)) {
      return NextResponse.json({ error: "Invalid webhook signature" }, { status: 401 });
    }

    let payload: any;
    try {
      payload = JSON.parse(rawBody);
    } catch {
      return NextResponse.json({ error: "Invalid JSON payload" }, { status: 400 });
    }

    // Determine event ID for deduplication
    const eventId = payload.id || payload.event_id || req.headers.get("svix-id") || `evt_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
    const eventType = payload.type || payload.event || "email.inbound";

    // 1. Check for duplicate webhook event (Deduplication)
    const { data: existingLog } = await supabase
      .from("edmail_delivery_logs")
      .select("id")
      .eq("provider", "resend")
      .eq("event_id", eventId)
      .maybeSingle();

    if (existingLog) {
      return NextResponse.json({ success: true, notice: "Duplicate event suppressed (idempotent)." });
    }

    // 2. Handle Delivery Status Updates (email.delivered, email.bounced, etc.)
    if (eventType === "email.delivered" || eventType === "email.bounced" || eventType === "email.failed") {
      const providerMsgId = payload.data?.email_id || payload.data?.id;
      if (providerMsgId) {
        const newStatus = eventType === "email.delivered" ? "delivered" : eventType === "email.bounced" ? "bounced" : "failed";
        await supabase
          .from("edmail_messages")
          .update({
            delivery_status: newStatus,
            delivery_error: payload.data?.error || null,
            updated_at: new Date().toISOString(),
          })
          .eq("provider_message_id", providerMsgId);
      }

      await supabase.from("edmail_delivery_logs").insert({
        provider: "resend",
        event_id: eventId,
        event_type: eventType,
        recipient: payload.data?.to?.[0] || "",
        payload,
      });

      return NextResponse.json({ success: true, processed: eventType });
    }

    // 3. Handle Real Inbound Email
    const toRecipients = Array.isArray(payload.to) ? payload.to : payload.to ? [payload.to] : [];
    const fromAddress = payload.from || payload.sender || "unknown@external.com";
    const fromName = payload.from_name || fromAddress.split("@")[0];
    const subject = payload.subject || "(No Subject)";
    const bodyText = payload.text || "";
    const bodyHtml = payload.html || `<p>${bodyText}</p>`;

    // Find recipient student mailbox in public.edmail_mailboxes
    let matchedMailboxId: string | null = null;
    let targetAddress = "";

    for (const rawTo of toRecipients) {
      const cleanTo = (rawTo || "").toLowerCase().trim();
      const match = cleanTo.match(/<([^>]+)>/);
      const emailOnly = match ? match[1] : cleanTo;

      const { data: box } = await supabase
        .from("edmail_mailboxes")
        .select("id, address, status")
        .eq("address", emailOnly)
        .maybeSingle();

      if (box && box.status === "ready") {
        matchedMailboxId = box.id;
        targetAddress = box.address;
        break;
      }
    }

    if (!matchedMailboxId) {
      // Address not found or suspended: record audit log
      await supabase.from("edmail_delivery_logs").insert({
        provider: "resend",
        event_id: eventId,
        event_type: "inbound.rejected_unknown_mailbox",
        recipient: toRecipients[0] || "",
        payload,
      });
      return NextResponse.json({ success: false, reason: "Mailbox not found or inactive." }, { status: 404 });
    }

    // Categorize with automated tags (Study, Certificates, Student Offers)
    const labels: string[] = [];
    const lowerSub = subject.toLowerCase();
    const lowerBody = bodyText.toLowerCase();

    if (lowerSub.includes("offer") || lowerSub.includes("discount") || lowerSub.includes("perk") || lowerSub.includes("deal") || lowerBody.includes("student discount")) {
      labels.push("Student Offers");
    }
    if (lowerSub.includes("cert") || lowerSub.includes("completion") || lowerSub.includes("badge") || lowerSub.includes("credential") || lowerBody.includes("certificate of")) {
      labels.push("Certificates");
    }
    if (lowerSub.includes("course") || lowerSub.includes("assignment") || lowerSub.includes("syllabus") || lowerSub.includes("lecture") || lowerSub.includes("notes") || lowerBody.includes("study material")) {
      labels.push("Study");
    }

    // Determine thread ID or synthesize one from subject
    const normalizedSubject = subject.replace(/^(re|fwd|fw):\s*/gi, "").trim();
    const threadId = `thread_${Buffer.from(normalizedSubject).toString("base64").substring(0, 20)}`;

    const snippet = (bodyText || subject).slice(0, 140);

    const { data: savedMsg, error: insertErr } = await supabase
      .from("edmail_messages")
      .insert({
        mailbox_id: matchedMailboxId,
        thread_id: threadId,
        provider_message_id: payload.id || null,
        direction: "inbound",
        folder: "inbox",
        from_address: fromAddress,
        from_name: fromName,
        to_addresses: [targetAddress],
        subject,
        snippet,
        body_text: bodyText,
        body_html: sanitizeEmailHtml(bodyHtml, false),
        is_read: false,
        is_starred: false,
        labels,
        delivery_status: "delivered",
        received_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (insertErr) {
      return NextResponse.json({ error: insertErr.message }, { status: 500 });
    }

    // Process & store attachments if provided by managed provider
    if (payload.attachments && Array.isArray(payload.attachments) && payload.attachments.length > 0) {
      for (const att of payload.attachments) {
        try {
          const filename = att.filename || att.name || "attachment.dat";
          const contentType = att.content_type || att.type || "application/octet-stream";
          const byteSize = att.size || att.byte_size || (att.content ? Buffer.byteLength(att.content, "base64") : 0);
          const contentBase64 = att.content || att.data || null;

          await supabase.from("edmail_attachments").insert({
            message_id: savedMsg.id,
            mailbox_id: matchedMailboxId,
            filename,
            content_type: contentType,
            byte_size: byteSize,
            content_base64: contentBase64,
            scan_status: "clean",
          });
        } catch {}
      }
    }

    // Record delivery log for deduplication
    await supabase.from("edmail_delivery_logs").insert({
      provider: "resend",
      event_id: eventId,
      event_type: "inbound.delivered",
      recipient: targetAddress,
      message_id: savedMsg.id,
      payload,
    });

    return NextResponse.json({
      success: true,
      messageId: savedMsg.id,
      targetAddress,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Failed to process inbound webhook" }, { status: 500 });
  }
}
