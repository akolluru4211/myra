import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { createClient } from "@/lib/supabase/server";
import { validateSession } from "@/lib/otp-service";
import { sendEmailNotification, PRIMARY_ADMIN_EMAIL } from "@/lib/email-service";
import { renderBrandedEmailHtml } from "@/lib/email-templates";
import { queryDb } from "@/lib/db-server";

export const dynamic = "force-dynamic";

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

const ALLOWED_ADMIN_ROLES = ["ADMIN", "SUPER_ADMIN", "FOUNDER", "EXECUTIVE"];

async function verifyAdminClearance(req: NextRequest): Promise<boolean> {
  try {
    // 1. Supabase SSR auth
    const supabaseServer = createClient();
    const { data: { user } } = await supabaseServer.auth.getUser();
    if (user?.id) {
      const dbRes = await queryDb(
        `SELECT is_admin, role FROM public.profiles WHERE id = $1`,
        [user.id]
      );
      const profile = dbRes.rows[0];
      if (profile?.is_admin || ALLOWED_ADMIN_ROLES.includes((profile?.role || "").toUpperCase())) {
        return true;
      }
    }

    // 2. Cookie or Bearer header session
    const sessionToken =
      req.cookies.get("edworld_session")?.value ||
      req.headers.get("authorization")?.replace("Bearer ", "");

    if (sessionToken) {
      const sess = validateSession(sessionToken);
      if (sess.valid && sess.role && ALLOWED_ADMIN_ROLES.includes(sess.role.toUpperCase())) {
        return true;
      }

      // If sess.userId exists (e.g. from raw user ID/UUID in session token), check database clearance
      const effectiveId = sess.userId || (sessionToken.startsWith("usr_") || /^[0-9a-f-]{36}$/i.test(sessionToken) ? sessionToken : null);
      if (effectiveId) {
        // Query profiles and users table using direct Postgres connection (immune to RLS)
        const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(effectiveId);
        if (isUuid) {
          const profileCheck = await queryDb(
            `SELECT is_admin, role FROM public.profiles WHERE id = $1`,
            [effectiveId]
          );
          const p = profileCheck.rows[0];
          if (p?.is_admin || ALLOWED_ADMIN_ROLES.includes((p?.role || "").toUpperCase())) {
            return true;
          }

          const userCheck = await queryDb(
            `SELECT is_admin, role FROM auth.users WHERE id = $1`,
            [effectiveId]
          );
          const u = userCheck.rows[0];
          if (u?.is_admin || ALLOWED_ADMIN_ROLES.includes((u?.role || "").toUpperCase())) {
            return true;
          }
        } else {
          // Non-uuid user identifier (e.g. usr_...)
          const profileByCustomId = await queryDb(
            `SELECT is_admin, role FROM public.profiles WHERE email ILIKE $1 OR id::text = $1`,
            [effectiveId]
          );
          const p = profileByCustomId.rows[0];
          if (p?.is_admin || ALLOWED_ADMIN_ROLES.includes((p?.role || "").toUpperCase())) {
            return true;
          }
        }
      }
    }
  } catch (err) {
    console.error("[Bulk Mail Auth Error]:", err);
  }
  return false;
}

export async function GET(req: NextRequest) {
  try {
    const isAuthorized = await verifyAdminClearance(req);
    if (!isAuthorized) {
      return NextResponse.json(
        { error: "Forbidden: Platform administrator clearance required." },
        { status: 403 }
      );
    }

    // 1. Fetch audience stats
    const { data: profiles } = await supabase
      .from("profiles")
      .select("id, role, career_stage, onboarding_completed, email");

    const allProfiles = profiles || [];
    const students = allProfiles.filter(p => !p.career_stage || p.career_stage === "STUDENT" || p.role === "STUDENT" || p.career_stage === "college");
    const onboardedStudents = students.filter(s => s.onboarding_completed);

    // 2. Fetch past bulk mail broadcasts
    const { data: logs } = await supabase
      .from("system_audit_logs")
      .select("*")
      .ilike("action", "EMAIL_DISPATCH_BULK%")
      .order("created_at", { ascending: false })
      .limit(10);

    const hasResendKey = Boolean(
      process.env.RESEND_API_KEY &&
      !process.env.RESEND_API_KEY.includes("placeholder") &&
      !process.env.RESEND_API_KEY.includes("your-key")
    );

    return NextResponse.json({
      success: true,
      counts: {
        allStudents: students.length,
        onboardedStudents: onboardedStudents.length,
        totalUsers: allProfiles.length,
      },
      hasResendKey,
      recentBroadcasts: logs || [],
    });
  } catch (err: any) {
    console.error("[Bulk Mail GET Error]:", err);
    return NextResponse.json({ error: err.message || "Failed to load audience telemetry." }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const isAuthorized = await verifyAdminClearance(req);
    if (!isAuthorized) {
      return NextResponse.json(
        { error: "Forbidden: Platform administrator clearance required to dispatch bulk emails." },
        { status: 403 }
      );
    }

    const body = await req.json();
    const {
      audience = "all_students", // "all_students" | "onboarded_students" | "all_users" | "test_admin"
      subject,
      headline,
      message,
      ctaLabel,
      ctaUrl,
      isTest = false,
    } = body;

    if (!subject?.trim() || !message?.trim()) {
      return NextResponse.json({ error: "Subject and Message body are required." }, { status: 400 });
    }

    // Sanitize URLs to prevent javascript: or data: injection
    let safeCtaUrl: string | undefined = undefined;
    if (ctaUrl && typeof ctaUrl === "string") {
      const trimmed = ctaUrl.trim();
      if (trimmed.startsWith("https://") || trimmed.startsWith("http://") || trimmed.startsWith("/")) {
        safeCtaUrl = trimmed;
      }
    }

    // 1. Resolve recipients
    let recipientEmails: string[] = [];

    if (isTest || audience === "test_admin") {
      recipientEmails = [PRIMARY_ADMIN_EMAIL];
    } else {
      const { data: profiles } = await supabase
        .from("profiles")
        .select("email, career_stage, role, onboarding_completed");

      const allProfiles = profiles || [];

      if (audience === "all_students") {
        recipientEmails = allProfiles
          .filter(p => !p.career_stage || p.career_stage === "STUDENT" || p.role === "STUDENT" || p.career_stage === "college")
          .map(p => p.email)
          .filter((e): e is string => Boolean(e && e.includes("@")));
      } else if (audience === "onboarded_students") {
        recipientEmails = allProfiles
          .filter(p => (!p.career_stage || p.career_stage === "STUDENT") && p.onboarding_completed)
          .map(p => p.email)
          .filter((e): e is string => Boolean(e && e.includes("@")));
      } else {
        // All users
        recipientEmails = allProfiles
          .map(p => p.email)
          .filter((e): e is string => Boolean(e && e.includes("@")));
      }
    }

    // Ensure test/fallback recipient if no emails exist in DB yet
    if (recipientEmails.length === 0) {
      recipientEmails = [PRIMARY_ADMIN_EMAIL];
    }

    const cleanHeadline = escapeHtml(headline || subject);
    const cleanMessage = escapeHtml(message);
    const cleanCtaLabel = ctaLabel ? escapeHtml(ctaLabel) : "";

    // Format clean HTML body for inclusion in shared branded layout
    // Message supports paragraphs separated by newlines
    const paragraphs = cleanMessage
      .split(/\n\s*\n/)
      .map(p => p.trim())
      .filter(Boolean)
      .map(p => `<p style="margin: 0 0 16px; font-size: 15px; line-height: 1.65; color: #334155;">${p.replace(/\n/g, "<br/>")}</p>`)
      .join("\n");

    const formattedBodyHtml = `
      <div style="color: #334155;">
        ${paragraphs}
      </div>
    `;

    const fullBrandedEmail = renderBrandedEmailHtml({
      previewText: subject,
      title: cleanHeadline,
      contentHtml: formattedBodyHtml,
      ctaText: cleanCtaLabel || undefined,
      ctaUrl: safeCtaUrl || undefined,
      footerNote: "You received this official community broadcast as a registered member of EdWorld Co.",
    });

    // 2. Batch dispatch via Resend SDK
    // To handle Resend limits, batch into slices of 50
    const BATCH_SIZE = 50;
    let deliveredCount = 0;
    const errors: string[] = [];

    for (let i = 0; i < recipientEmails.length; i += BATCH_SIZE) {
      const chunk = recipientEmails.slice(i, i + BATCH_SIZE);
      try {
        await sendEmailNotification({
          to: chunk.length === 1 ? chunk[0] : chunk,
          bcc: [PRIMARY_ADMIN_EMAIL],
          subject,
          html: fullBrandedEmail,
          category: "newsletter",
          metadata: {
            bulkBatchIndex: Math.floor(i / BATCH_SIZE) + 1,
            audience,
            isTest,
          }
        });
        deliveredCount += chunk.length;
      } catch (err: any) {
        errors.push(err.message || "Failed dispatch for chunk");
      }
    }

    // 3. Log bulk campaign to audit trail
    await supabase.from("system_audit_logs").insert({
      action: isTest ? "EMAIL_DISPATCH_BULK_TEST" : "EMAIL_DISPATCH_BULK_STUDENTS",
      actor_id: "admin",
      metadata: {
        subject,
        headline,
        audience,
        recipientCount: deliveredCount,
        isTest,
        errors: errors.length > 0 ? errors : undefined,
        timestamp: new Date().toISOString(),
      }
    });

    return NextResponse.json({
      success: true,
      deliveredCount,
      audience,
      isTest,
      notice: isTest
        ? `Test preview sent successfully to ${PRIMARY_ADMIN_EMAIL}`
        : `Dispatched announcement to ${deliveredCount} students via Resend.`,
    });
  } catch (err: any) {
    console.error("[Bulk Mail POST Error]:", err);
    return NextResponse.json({ error: err.message || "Failed to dispatch bulk email." }, { status: 500 });
  }
}
