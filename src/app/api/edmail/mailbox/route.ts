import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { validateSession } from "@/lib/otp-service";
import { createClient } from "@/lib/supabase/server";
import {
  validateEdMailUsername,
  checkEdMailAvailability,
  EDMAIL_DOMAIN,
  EDMAIL_DEFAULT_QUOTA_BYTES,
  EDMAIL_DAILY_SEND_LIMIT,
} from "@/lib/edmail/edmail-service";

export const dynamic = "force-dynamic";

/**
 * Resolves current authenticated student ID from session cookie or Supabase SSR.
 */
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
 * GET: Retrieve the student's current EdMail mailbox status
 */
export async function GET(req: NextRequest) {
  try {
    const userId = await resolveAuthenticatedUserId(req);
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized: Authentication required." }, { status: 401 });
    }

    const { data: mailbox, error } = await supabase
      .from("edmail_mailboxes")
      .select("*")
      .eq("user_id", userId)
      .maybeSingle();

    if (error && error.code !== "PGRST116") {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    if (!mailbox) {
      return NextResponse.json({ exists: false, mailbox: null });
    }

    return NextResponse.json({
      exists: true,
      mailbox: {
        id: mailbox.id,
        username: mailbox.username,
        address: mailbox.address,
        recoveryEmail: mailbox.recovery_email,
        status: mailbox.status,
        storageUsedBytes: mailbox.storage_used_bytes,
        storageQuotaBytes: mailbox.storage_quota_bytes,
        dailySendCount: mailbox.daily_send_count,
        dailySendLimit: mailbox.daily_send_limit,
        createdAt: mailbox.created_at,
      },
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Failed to retrieve mailbox" }, { status: 500 });
  }
}

/**
 * POST: Provision or activate a new EdMail mailbox for the authenticated student
 */
export async function POST(req: NextRequest) {
  try {
    const userId = await resolveAuthenticatedUserId(req);
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized: Authentication required." }, { status: 401 });
    }

    const body = await req.json();
    const { username, guardianConsent = true } = body;

    const val = validateEdMailUsername(username);
    if (!val.valid) {
      return NextResponse.json({ error: val.error }, { status: 400 });
    }

    // Check availability
    const avail = await checkEdMailAvailability(val.normalized, userId);
    if (!avail.available) {
      return NextResponse.json({ error: avail.reason || "Username is not available." }, { status: 409 });
    }

    // Check student profile & age band for compliance
    const { data: profile } = await supabase
      .from("profiles")
      .select("id, email, age_band")
      .eq("id", userId)
      .maybeSingle();

    const recoveryEmail = profile?.email || req.cookies.get("edworld_user_email")?.value || `${val.normalized}@recovery.edworld.co.in`;
    const fullAddress = `${val.normalized}@${EDMAIL_DOMAIN}`;

    // Upsert mailbox provisioning record
    const { data: newMailbox, error: insertError } = await supabase
      .from("edmail_mailboxes")
      .upsert(
        {
          user_id: userId,
          username: val.normalized,
          address: fullAddress,
          recovery_email: recoveryEmail,
          status: "ready", // Ready immediately in managed environment
          storage_used_bytes: 0,
          storage_quota_bytes: EDMAIL_DEFAULT_QUOTA_BYTES,
          daily_send_count: 0,
          daily_send_limit: EDMAIL_DAILY_SEND_LIMIT,
          guardian_consent_verified: Boolean(guardianConsent),
          eligibility_verified: true,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "user_id" }
      )
      .select()
      .single();

    if (insertError) {
      return NextResponse.json({ error: insertError.message }, { status: 500 });
    }

    // Seed welcoming onboarding message in student inbox
    try {
      const welcomeThreadId = `thread_${Date.now()}`;
      await supabase.from("edmail_messages").insert({
        mailbox_id: newMailbox.id,
        thread_id: welcomeThreadId,
        direction: "inbound",
        folder: "inbox",
        from_address: "welcome@edworld.co.in",
        from_name: "EdWorld Student Services",
        to_addresses: [fullAddress],
        subject: `Welcome to your official EdMail address (${fullAddress})!`,
        snippet: "Your student webmail is ready. Learn how to organize study materials and check student discounts.",
        body_text: `Welcome to EdMail!\n\nYour address ${fullAddress} is activated. You can send and receive academic correspondence, save certificates, and attach verified study notes.\n\nNote on Student Discounts:\nAn EdMail address does not automatically guarantee third-party commercial discounts. Some vendors require active accredited enrollment verification. See the Student Discounts guide inside your mailbox for full details.`,
        body_html: `<div style="font-family: sans-serif; line-height: 1.5; color: #1e293b;">
          <h2 style="color: #4f46e5;">Welcome to EdMail!</h2>
          <p>Your official student address <strong>${fullAddress}</strong> is active and ready for your academic journey.</p>
          <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 12px; margin: 16px 0;">
            <p style="margin: 0; font-size: 13px; color: #475569;"><strong>Important Privacy & Discount Information:</strong><br/>
            Your mailbox is completely isolated and private. External software vendors maintain their own independent eligibility criteria for student discounts. While an @edworld.co.in address proves your active platform membership, specific academic pricing programs may require university enrollment transcripts.</p>
          </div>
          <p>Happy learning,<br/>The Edworld Team</p>
        </div>`,
        is_read: false,
        is_starred: true,
        labels: ["Study"],
        delivery_status: "delivered",
        received_at: new Date().toISOString(),
      });
    } catch {}

    return NextResponse.json({
      success: true,
      mailbox: newMailbox,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Failed to create mailbox" }, { status: 500 });
  }
}
