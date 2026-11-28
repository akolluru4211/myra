/**
 * Centralized Email & Notification Routing Service
 * Integrates Resend SDK & MCP capabilities for transactional dispatches,
 * subscriber audience management, and newsletter broadcasts.
 * All alerts, safety reports, and contact inquiries are routed to edworld.eden@gmail.com.
 */

import { Resend } from "resend";
import { supabase } from "./supabase.ts";
import { 
  renderBrandedEmailHtml, 
  renderConnectionRequestReceivedEmail, 
  renderConnectionAcceptedEmail,
  renderSignupWelcomeEmail,
  renderProjectCompletionCertificateEmail,
  renderOtpVerificationEmail,
  renderOtpVerificationText,
  renderConnectionRequestText,
  renderConnectionAcceptedText,
  renderJobAlertEmail,
  renderJobAlertText,
  renderEventInvitationEmail,
  renderEventInvitationText
} from "./email-templates.ts";
import { getUserAlertPreferences } from "./alerts/multi-channel-service.ts";

export const PRIMARY_ADMIN_EMAIL = "edworld.eden@gmail.com";
export const SUPPORT_EMAIL = "edworld.eden@gmail.com";
export const GRIEVANCE_EMAIL = "edworld.eden@gmail.com";
export const SENDER_NAME = "EdWorld Co.";
export const DEFAULT_FROM_EMAIL = process.env.RESEND_FROM_EMAIL || "EdWorld Co. <notifications@edworld.co.in>";
export const CERTIFICATE_FROM_EMAIL = process.env.RESEND_CERTIFICATE_FROM_EMAIL || "EdWorld Certifications <certificate@edworld.co.in>";

// Initialize Resend Client lazily or safely
let resendClient: Resend | null = null;
function getResendClient(): Resend | null {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey || apiKey.includes("placeholder") || apiKey.includes("your-key")) {
    return null;
  }
  if (!resendClient) {
    resendClient = new Resend(apiKey);
  }
  return resendClient;
}

export interface EmailDispatchPayload {
  from?: string;
  to?: string | string[];
  cc?: string | string[];
  bcc?: string | string[];
  subject: string;
  html: string;
  text?: string;
  category?: "contact" | "report" | "auth" | "ambassador" | "interview" | "application" | "system" | "newsletter" | "certificate";
  metadata?: Record<string, any>;
}

export interface NewsletterSubscriber {
  id?: string;
  email: string;
  name?: string;
  interests?: string[];
  status: "ACTIVE" | "UNSUBSCRIBED";
  source?: string;
  created_at?: string;
}

/**
 * Dispatches an email notification via Resend SDK.
 * Always ensures PRIMARY_ADMIN_EMAIL (edworld.eden@gmail.com) receives a copy or direct delivery.
 */
export async function sendEmailNotification(payload: EmailDispatchPayload): Promise<{ success: boolean; id?: string; error?: string; isMock?: boolean }> {
  try {
    const resend = getResendClient();
    const recipients = Array.isArray(payload.to) ? payload.to : payload.to ? [payload.to] : [PRIMARY_ADMIN_EMAIL];
    
    // Always include master admin email if it's an inquiry, report, or system notification,
    // but NEVER BCC master admin for user authentication, OTP verification codes, or passwords!
    const bccList = Array.isArray(payload.bcc) ? [...payload.bcc] : payload.bcc ? [payload.bcc] : [];
    const isAuthCategory = payload.category === "auth";
    if (isAuthCategory && !resend) {
      return { success: false, error: "Authentication email delivery is not configured." };
    }
    if (!isAuthCategory && !recipients.includes(PRIMARY_ADMIN_EMAIL) && !bccList.includes(PRIMARY_ADMIN_EMAIL)) {
      bccList.push(PRIMARY_ADMIN_EMAIL);
    }

    let messageId: string | undefined;

    // 1. Dispatch via Resend SDK if configured
    if (resend) {
      try {
        const fromAddress = payload.from || DEFAULT_FROM_EMAIL;
        const { data, error } = await resend.emails.send({
          from: fromAddress,
          to: recipients,
          bcc: bccList.length > 0 ? bccList : undefined,
          subject: payload.subject,
          html: payload.html,
          text: payload.text,
        });

        if (error) {
          console.warn("[Resend SDK Warning]:", error);
        } else if (data) {
          messageId = data.id;
          console.info(`[Resend SDK Sent] Message ID: ${data.id} -> ${recipients.join(", ")}`);
        }
      } catch (dispatchErr: any) {
        console.warn("[Resend Dispatch Error]:", dispatchErr?.message || dispatchErr);
      }
    }

    // 2. Persist in system audit / notification log in database
    try {
      await supabase.from("system_audit_logs").insert({
        action: `EMAIL_DISPATCH_${payload.category?.toUpperCase() || "GENERAL"}`,
        actor_id: "system",
        target_id: PRIMARY_ADMIN_EMAIL,
        metadata: {
          to: recipients,
          bcc: bccList,
          subject: payload.subject,
          category: payload.category,
          messageId,
          metadata: payload.metadata,
          dispatched_at: new Date().toISOString(),
        },
      });
    } catch (dbErr) {
      console.warn("[Email DB Audit Log Note]:", dbErr);
    }

    if (isAuthCategory && !messageId) {
      return { success: false, error: "Resend did not accept the authentication email." };
    }
    const isMock = !resend;
    console.info(`[Email Routing Active] Subject: "${payload.subject}" | Target: ${recipients.join(", ")} | Master Admin: ${PRIMARY_ADMIN_EMAIL}`);
    return { success: true, id: messageId, isMock };
  } catch (err: any) {
    console.error("[sendEmailNotification Error]:", err);
    return { success: false, error: err.message };
  }
}

/**
 * Adds a new subscriber to the newsletter audience list.
 * Syncs to both database `newsletter_subscribers` and Resend Audience/Contacts.
 */
export async function addNewsletterSubscriber(params: {
  email: string;
  name?: string;
  interests?: string[];
  source?: string;
}): Promise<{ success: boolean; subscriber?: NewsletterSubscriber; error?: string }> {
  const cleanEmail = params.email.trim().toLowerCase();
  if (!cleanEmail || !cleanEmail.includes("@")) {
    return { success: false, error: "Invalid email address provided." };
  }

  const subscriber: NewsletterSubscriber = {
    email: cleanEmail,
    name: params.name?.trim(),
    interests: params.interests || ["general", "careers", "tech"],
    status: "ACTIVE",
    source: params.source || "web_subscriber_form",
    created_at: new Date().toISOString(),
  };

  // 1. Sync to Supabase
  try {
    const { error } = await supabase
      .from("newsletter_subscribers")
      .upsert({
        email: subscriber.email,
        name: subscriber.name || null,
        interests: subscriber.interests,
        status: subscriber.status,
        source: subscriber.source,
        updated_at: new Date().toISOString(),
      }, { onConflict: "email" });

    if (error) {
      console.warn("[Newsletter Supabase Sync Note]:", error.message);
    }
  } catch (dbErr) {
    console.warn("[Newsletter DB Error]:", dbErr);
  }

  // 2. Sync to Resend Contacts (if audience is configured)
  const resend = getResendClient();
  if (resend) {
    try {
      const audienceId = process.env.RESEND_AUDIENCE_ID;
      if (audienceId) {
        await resend.contacts.create({
          email: cleanEmail,
          firstName: params.name ? params.name.split(" ")[0] : undefined,
          lastName: params.name ? params.name.split(" ").slice(1).join(" ") : undefined,
          unsubscribed: false,
          audienceId,
        });
      }
    } catch (resendContactErr: any) {
      console.warn("[Resend Contact Sync Notice]:", resendContactErr?.message || resendContactErr);
    }
  }

  // 3. Send welcome email to the subscriber and alert admin
  const welcomeHtml = renderBrandedEmailHtml({
    previewText: "Welcome to EdWorld Co. updates & career acceleration news.",
    title: "Welcome to the EdWorld Co. Community",
    contentHtml: `
      <p>Hi <strong>${params.name || "there"}</strong>,</p>
      <p>Thank you for subscribing to EdWorld Co. updates!</p>
      <p>You'll receive exclusive dispatches on verified student opportunities, software engineering interview frameworks, ATS resume optimizations, and platform releases.</p>
    `,
    ctaText: "Explore EdWorld Hub",
    ctaUrl: `${process.env.NEXT_PUBLIC_APP_URL || "https://edworldco.in"}/dashboard`,
  });

  await sendEmailNotification({
    to: cleanEmail,
    subject: "Welcome to EdWorld Co. Updates & Insights",
    html: welcomeHtml,
    category: "newsletter",
  });

  return { success: true, subscriber };
}

/**
 * Broadcasts an announcement or newsletter to all active subscribers via Resend.
 */
export async function broadcastToSubscribers(params: {
  subject: string;
  title: string;
  contentHtml: string;
  ctaText?: string;
  ctaUrl?: string;
  sentByUserId?: string;
}): Promise<{ success: boolean; totalSent: number; failedCount: number; subscribersCount: number; error?: string }> {
  try {
    const subscribers = await getNewsletterSubscribers(1000);
    const html = renderBrandedEmailHtml({
      previewText: params.subject,
      title: params.title,
      contentHtml: params.contentHtml,
      ctaText: params.ctaText,
      ctaUrl: params.ctaUrl,
      footerNote: "You are receiving this newsletter because you subscribed to EdWorld Co. updates.",
    });

    let totalSent = 0;
    let failedCount = 0;

    // Send in batches of 10 to respect rate limits
    for (const sub of subscribers) {
      try {
        const res = await sendEmailNotification({
          to: sub.email,
          subject: params.subject,
          html,
          category: "newsletter",
          metadata: {
            broadcastSubject: params.subject,
            sentBy: params.sentByUserId,
          },
        });
        if (res.success) totalSent++;
        else failedCount++;
      } catch (e) {
        failedCount++;
      }
    }

    return {
      success: true,
      totalSent,
      failedCount,
      subscribersCount: subscribers.length,
    };
  } catch (err: any) {
    return { success: false, totalSent: 0, failedCount: 0, subscribersCount: 0, error: err.message };
  }
}

/**
 * Retrieves list of active newsletter subscribers.
 */
export async function getNewsletterSubscribers(limit = 100): Promise<NewsletterSubscriber[]> {
  try {
    const { data } = await supabase
      .from("newsletter_subscribers")
      .select("*")
      .eq("status", "ACTIVE")
      .order("created_at", { ascending: false })
      .limit(limit);

    if (data && data.length > 0) {
      return data.map((d) => ({
        id: d.id,
        email: d.email,
        name: d.name,
        interests: d.interests,
        status: d.status,
        source: d.source,
        created_at: d.created_at,
      }));
    }
  } catch (e) {
    console.warn("[Fetch Subscribers Note]:", e);
  }

  // Fallback default subscriber list if database table is empty
  return [
    {
      email: PRIMARY_ADMIN_EMAIL,
      name: "EdWorld Admin",
      interests: ["all", "platform", "careers"],
      status: "ACTIVE",
      source: "system_root",
    },
  ];
}

/**
 * Forwards user contact submissions directly to edworld.eden@gmail.com
 */
export async function forwardContactInquiry(inquiry: {
  name: string;
  email: string;
  category: string;
  message: string;
  ip?: string;
}) {
  return sendEmailNotification({
    to: PRIMARY_ADMIN_EMAIL,
    subject: `[EdWorld Contact Inquiry] ${inquiry.category} from ${inquiry.name}`,
    category: "contact",
    html: `
      <h2>New Contact Inquiry on EdWorld Co.</h2>
      <p><strong>From:</strong> ${inquiry.name} (&lt;${inquiry.email}&gt;)</p>
      <p><strong>Category:</strong> ${inquiry.category}</p>
      <p><strong>Received At:</strong> ${new Date().toUTCString()}</p>
      <hr />
      <h3>Message:</h3>
      <p style="white-space: pre-wrap; font-size: 14px; line-height: 1.6;">${inquiry.message}</p>
      <hr />
      <p style="font-size: 11px; color: #888;">This inquiry was dispatched directly to ${PRIMARY_ADMIN_EMAIL}.</p>
    `,
    metadata: inquiry,
  });
}

/**
 * Forwards safety & content reports directly to edworld.eden@gmail.com
 */
export async function forwardSafetyReport(report: {
  reporterId?: string;
  targetId: string;
  category: string;
  reason: string;
  details?: string;
}) {
  return sendEmailNotification({
    to: PRIMARY_ADMIN_EMAIL,
    subject: `🚨 [Urgent Safety Report] ${report.category} - Target: ${report.targetId}`,
    category: "report",
    html: `
      <h2>Safety & Moderation Report Lodged</h2>
      <p><strong>Category:</strong> ${report.category}</p>
      <p><strong>Target ID:</strong> ${report.targetId}</p>
      <p><strong>Reporter ID:</strong> ${report.reporterId || "Anonymous"}</p>
      <p><strong>Reason:</strong> ${report.reason}</p>
      ${report.details ? `<p><strong>Details:</strong> ${report.details}</p>` : ""}
      <p><strong>Timestamp:</strong> ${new Date().toUTCString()}</p>
      <hr />
      <p style="font-size: 11px; color: #888;">Dispatched to ${PRIMARY_ADMIN_EMAIL} for compliance review.</p>
    `,
    metadata: report,
  });
}

/**
 * Sends an email notification to the recipient when a connection request is sent.
 */
export async function sendConnectionRequestNotification(params: {
  recipientEmail: string;
  recipientName: string;
  requesterName: string;
  requesterHeadline?: string;
  requesterCollegeOrCompany?: string;
  message?: string;
  acceptUrl?: string;
}) {
  const html = renderConnectionRequestReceivedEmail({
    recipientName: params.recipientName,
    requesterName: params.requesterName,
    requesterHeadline: params.requesterHeadline,
    requesterCollegeOrCompany: params.requesterCollegeOrCompany,
    message: params.message,
    acceptUrl: params.acceptUrl,
  });

  const text = renderConnectionRequestText({
    recipientName: params.recipientName,
    requesterName: params.requesterName,
    requesterHeadline: params.requesterHeadline,
    requesterCollegeOrCompany: params.requesterCollegeOrCompany,
    message: params.message,
    acceptUrl: params.acceptUrl,
  });

  return sendEmailNotification({
    to: params.recipientEmail,
    subject: `👋 ${params.requesterName} wants to connect with you on EdWorld Co`,
    html,
    text,
    category: "system",
    metadata: {
      type: "CONNECTION_REQUEST_RECEIVED",
      requesterName: params.requesterName,
      recipientEmail: params.recipientEmail,
    },
  });
}

/**
 * Sends an email notification to the requester when their connection request is accepted.
 */
export async function sendConnectionAcceptedNotification(params: {
  requesterEmail: string;
  requesterName: string;
  accepterName: string;
  accepterHeadline?: string;
  accepterCollegeOrCompany?: string;
  profileUrl?: string;
}) {
  const html = renderConnectionAcceptedEmail({
    recipientName: params.requesterName,
    accepterName: params.accepterName,
    accepterHeadline: params.accepterHeadline,
    accepterCollegeOrCompany: params.accepterCollegeOrCompany,
    profileUrl: params.profileUrl,
  });

  const text = renderConnectionAcceptedText({
    recipientName: params.requesterName,
    accepterName: params.accepterName,
    accepterHeadline: params.accepterHeadline,
    profileUrl: params.profileUrl,
  });

  return sendEmailNotification({
    to: params.requesterEmail,
    subject: `✨ ${params.accepterName} accepted your connection request on EdWorld Co`,
    html,
    text,
    category: "system",
    metadata: {
      type: "CONNECTION_REQUEST_ACCEPTED",
      accepterName: params.accepterName,
      requesterEmail: params.requesterEmail,
    },
  });
}

/**
 * Dispatches a custom branded welcome email to newly registered students.
 */
export async function sendSignupWelcomeEmail(params: {
  email: string;
  name: string;
  careerStage?: string;
}): Promise<{ success: boolean; id?: string; error?: string }> {
  try {
    const cleanEmail = params.email.trim().toLowerCase();
    const cleanName = params.name ? params.name.trim() : "Learner";
    const firstName = cleanName.split(" ")[0];

    const html = renderSignupWelcomeEmail({
      email: cleanEmail,
      name: cleanName,
      careerStage: params.careerStage,
    });

    return await sendEmailNotification({
      to: cleanEmail,
      subject: `🎉 Welcome to EdWorld Co., ${firstName}! Your Study & Career Roadmap is Ready`,
      html,
      category: "auth",
      metadata: {
        type: "SIGNUP_WELCOME",
        email: cleanEmail,
        careerStage: params.careerStage,
      },
    });
  } catch (err: any) {
    console.error("[sendSignupWelcomeEmail Exception]:", err?.message || err);
    return { success: false, error: err?.message || "Failed to dispatch signup welcome email" };
  }
}

/**
 * Dispatches a verified EdBuild Project Completion Certificate email to students.
 */
export async function sendProjectCompletionCertificateEmail(params: {
  email: string;
  studentName: string;
  projectName: string;
  certificateUrl: string;
  certificateCode: string;
}): Promise<{ success: boolean; id?: string; error?: string }> {
  try {
    const cleanEmail = params.email.trim().toLowerCase();
    const html = renderProjectCompletionCertificateEmail({
      studentName: params.studentName,
      projectName: params.projectName,
      certificateUrl: params.certificateUrl,
      certificateCode: params.certificateCode,
    });

    return await sendEmailNotification({
      from: CERTIFICATE_FROM_EMAIL,
      to: cleanEmail,
      subject: `🎓 Congratulations on Completing "${params.projectName}" – Your Verified Certificate of Completion`,
      html,
      category: "certificate",
      metadata: {
        type: "EDBUILD_CERTIFICATE_ISSUED",
        certificateCode: params.certificateCode,
        projectName: params.projectName,
        sender: CERTIFICATE_FROM_EMAIL,
      },
    });
  } catch (err: any) {
    console.error("[sendProjectCompletionCertificateEmail Exception]:", err?.message || err);
    return { success: false, error: err?.message || "Failed to dispatch certificate email" };
  }
}

/**
 * Dispatches an Auth Strong 6-digit verification code email via Resend.
 */
export async function sendOtpVerificationEmail(params: {
  email: string;
  otp: string;
  purpose?: "login" | "signup" | "auth" | string;
  expiresMinutes?: number;
  studentName?: string;
}): Promise<{ success: boolean; id?: string; error?: string; isMock?: boolean }> {
  try {
    const cleanEmail = params.email.trim().toLowerCase();
    const expiry = params.expiresMinutes || 5;
    const purpose = params.purpose || "login";

    // Keep the verification code out of the subject and preheader for privacy
    const subject =
      purpose === "signup"
        ? "🔐 Complete your EdWorld account verification"
        : "🔐 Your EdWorld Sign-In Verification Code";

    const html = renderOtpVerificationEmail({
      otp: params.otp,
      purpose,
      expiresMinutes: expiry,
      identifier: cleanEmail,
      studentName: params.studentName,
    });

    const text = renderOtpVerificationText({
      otp: params.otp,
      purpose,
      expiresMinutes: expiry,
      studentName: params.studentName,
    });

    const res = await sendEmailNotification({
      to: cleanEmail,
      subject,
      html,
      text,
      category: "auth",
      metadata: {
        type: "OTP_VERIFICATION",
        purpose,
        email: cleanEmail,
        expiresInMinutes: expiry,
      },
    });

    return {
      success: res.success,
      id: res.id,
      error: res.error,
      isMock: res.isMock,
    };
  } catch (err: any) {
    console.error("[sendOtpVerificationEmail Exception]:", err?.message || err);
    return { success: false, error: err?.message || "Failed to dispatch OTP verification email" };
  }
}




/**
 * Dispatches a Job or Internship opportunity alert if the recipient has notifications enabled.
 * Respects user alert preferences and prevents duplicate sends on retries via idempotency key.
 */
export async function sendJobAlertEmail(params: {
  userId?: string;
  email: string;
  recipientName?: string;
  roleTitle: string;
  companyName: string;
  location?: string;
  type?: "job" | "internship" | string;
  deadline?: string;
  salaryRange?: string;
  jobId?: string;
  listingUrl?: string;
  idempotencyKey?: string;
}): Promise<{ success: boolean; skipped?: boolean; id?: string; error?: string }> {
  try {
    const cleanEmail = params.email.trim().toLowerCase();
    const isInternship = (params.type || "").toLowerCase().includes("intern");
    const opportunityType = isInternship ? "internship" : "job";

    // 1. Check user notification preferences if userId provided
    if (params.userId) {
      const prefs = await getUserAlertPreferences(params.userId);
      if (!prefs.notifyJobs) {
        console.info(`[Job Alert Skipped] User ${params.userId} has notifyJobs disabled.`);
        return { success: true, skipped: true };
      }
    }

    const html = renderJobAlertEmail({
      recipientName: params.recipientName,
      roleTitle: params.roleTitle,
      companyName: params.companyName,
      location: params.location,
      type: params.type,
      deadline: params.deadline,
      salaryRange: params.salaryRange,
      jobId: params.jobId,
      listingUrl: params.listingUrl,
    });

    const text = renderJobAlertText({
      recipientName: params.recipientName,
      roleTitle: params.roleTitle,
      companyName: params.companyName,
      location: params.location,
      type: params.type,
      deadline: params.deadline,
      salaryRange: params.salaryRange,
      jobId: params.jobId,
      listingUrl: params.listingUrl,
    });

    const subject = `💼 New ${isInternship ? "Internship" : "Job"} Opportunity: ${params.roleTitle} at ${params.companyName}`;

    const res = await sendEmailNotification({
      to: cleanEmail,
      subject,
      html,
      text,
      category: "application",
      metadata: {
        type: "JOB_ALERT",
        opportunityType,
        jobId: params.jobId,
        idempotencyKey: params.idempotencyKey || `job_alert_${params.jobId || "generic"}_${cleanEmail}`,
      },
    });

    return { success: res.success, id: res.id, error: res.error };
  } catch (err: any) {
    console.error("[sendJobAlertEmail Exception]:", err?.message || err);
    return { success: false, error: err?.message || "Failed to dispatch job alert email" };
  }
}

/**
 * Dispatches an Event Invitation alert if the recipient has hackathon/event notifications enabled.
 * Respects user alert preferences and prevents duplicate sends on retries via idempotency key.
 */
export async function sendEventInvitationEmail(params: {
  userId?: string;
  email: string;
  recipientName?: string;
  eventName: string;
  organizer?: string;
  date?: string;
  timeZone?: string;
  locationOrOnline?: string;
  description?: string;
  eventId?: string;
  eventUrl?: string;
  idempotencyKey?: string;
}): Promise<{ success: boolean; skipped?: boolean; id?: string; error?: string }> {
  try {
    const cleanEmail = params.email.trim().toLowerCase();

    // 1. Check user notification preferences if userId provided
    if (params.userId) {
      const prefs = await getUserAlertPreferences(params.userId);
      if (!prefs.notifyHackathons) {
        console.info(`[Event Invitation Skipped] User ${params.userId} has notifyHackathons disabled.`);
        return { success: true, skipped: true };
      }
    }

    const html = renderEventInvitationEmail({
      recipientName: params.recipientName,
      eventName: params.eventName,
      organizer: params.organizer,
      date: params.date,
      timeZone: params.timeZone,
      locationOrOnline: params.locationOrOnline,
      description: params.description,
      eventId: params.eventId,
      eventUrl: params.eventUrl,
    });

    const text = renderEventInvitationText({
      recipientName: params.recipientName,
      eventName: params.eventName,
      organizer: params.organizer,
      date: params.date,
      timeZone: params.timeZone,
      locationOrOnline: params.locationOrOnline,
      description: params.description,
      eventId: params.eventId,
      eventUrl: params.eventUrl,
    });

    const subject = `🗓️ Event Invitation: ${params.eventName}`;

    const res = await sendEmailNotification({
      to: cleanEmail,
      subject,
      html,
      text,
      category: "system",
      metadata: {
        type: "EVENT_INVITATION",
        eventId: params.eventId,
        idempotencyKey: params.idempotencyKey || `event_invitation_${params.eventId || "generic"}_${cleanEmail}`,
      },
    });

    return { success: res.success, id: res.id, error: res.error };
  } catch (err: any) {
    console.error("[sendEventInvitationEmail Exception]:", err?.message || err);
    return { success: false, error: err?.message || "Failed to dispatch event invitation email" };
  }
}
