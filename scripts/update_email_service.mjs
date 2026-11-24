import fs from 'node:fs';

let code = fs.readFileSync('src/lib/email-service.ts', 'utf8');

// 1. Update imports from ./email-templates.ts
const oldImportsTarget = `import { 
  renderBrandedEmailHtml, 
  renderConnectionRequestReceivedEmail, 
  renderConnectionAcceptedEmail,
  renderSignupWelcomeEmail,
  renderProjectCompletionCertificateEmail,
  renderOtpVerificationEmail
} from "./email-templates.ts";`;

const newImports = `import { 
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
import { getUserAlertPreferences } from "./alerts/multi-channel-service.ts";`;

code = code.replace(oldImportsTarget, newImports);

// 2. Update sendConnectionRequestNotification to include text fallback
const oldConnReq = `export async function sendConnectionRequestNotification(params: {
  recipientEmail: string;
  recipientName: string;
  requesterName: string;
  requesterHeadline?: string;
  requesterCollegeOrCompany?: string;
  message?: string;
}) {
  const html = renderConnectionRequestReceivedEmail({
    recipientName: params.recipientName,
    requesterName: params.requesterName,
    requesterHeadline: params.requesterHeadline,
    requesterCollegeOrCompany: params.requesterCollegeOrCompany,
    message: params.message,
  });

  return sendEmailNotification({
    to: params.recipientEmail,
    subject: \`👋 \${params.requesterName} wants to connect with you on EdWorld Co\`,
    html,
    category: "system",
    metadata: {
      type: "CONNECTION_REQUEST_RECEIVED",
      requesterName: params.requesterName,
      recipientEmail: params.recipientEmail,
    },
  });
}`;

const newConnReq = `export async function sendConnectionRequestNotification(params: {
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
    subject: \`👋 \${params.requesterName} wants to connect with you on EdWorld Co\`,
    html,
    text,
    category: "system",
    metadata: {
      type: "CONNECTION_REQUEST_RECEIVED",
      requesterName: params.requesterName,
      recipientEmail: params.recipientEmail,
    },
  });
}`;

code = code.replace(oldConnReq, newConnReq);

// 3. Update sendConnectionAcceptedNotification to include text fallback
const oldConnAcc = `export async function sendConnectionAcceptedNotification(params: {
  requesterEmail: string;
  requesterName: string;
  accepterName: string;
  accepterHeadline?: string;
  accepterCollegeOrCompany?: string;
}) {
  const html = renderConnectionAcceptedEmail({
    recipientName: params.requesterName,
    accepterName: params.accepterName,
    accepterHeadline: params.accepterHeadline,
    accepterCollegeOrCompany: params.accepterCollegeOrCompany,
  });

  return sendEmailNotification({
    to: params.requesterEmail,
    subject: \`✨ \${params.accepterName} accepted your connection request on EdWorld Co\`,
    html,
    category: "system",
    metadata: {
      type: "CONNECTION_REQUEST_ACCEPTED",
      accepterName: params.accepterName,
      requesterEmail: params.requesterEmail,
    },
  });
}`;

const newConnAcc = `export async function sendConnectionAcceptedNotification(params: {
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
    subject: \`✨ \${params.accepterName} accepted your connection request on EdWorld Co\`,
    html,
    text,
    category: "system",
    metadata: {
      type: "CONNECTION_REQUEST_ACCEPTED",
      accepterName: params.accepterName,
      requesterEmail: params.requesterEmail,
    },
  });
}`;

code = code.replace(oldConnAcc, newConnAcc);

// 4. Update sendOtpVerificationEmail to keep OTP out of subject and preheader and include text
const oldOtpSend = `    const subject =
      purpose === "signup"
        ? \`🔐 Verify your EdWorld account (Code: \${params.otp})\`
        : \`🔐 Your EdWorld Sign-In Code: \${params.otp}\`;

    const html = renderOtpVerificationEmail({
      otp: params.otp,
      purpose,
      expiresMinutes: expiry,
      identifier: cleanEmail,
      studentName: params.studentName,
    });

    const res = await sendEmailNotification({
      to: cleanEmail,
      subject,
      html,
      category: "auth",
      metadata: {
        type: "OTP_VERIFICATION",
        purpose,
        email: cleanEmail,
        expiresInMinutes: expiry,
      },
    });`;

const newOtpSend = `    // Keep the verification code out of the subject and preheader for privacy
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
    });`;

code = code.replace(oldOtpSend, newOtpSend);

// 5. Append sendJobAlertEmail and sendEventInvitationEmail with notification preferences check & deduplication
const newSendFns = `
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
        console.info(\`[Job Alert Skipped] User \${params.userId} has notifyJobs disabled.\`);
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

    const subject = \`💼 New \${isInternship ? "Internship" : "Job"} Opportunity: \${params.roleTitle} at \${params.companyName}\`;

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
        idempotencyKey: params.idempotencyKey || \`job_alert_\${params.jobId || "generic"}_\${cleanEmail}\`,
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
        console.info(\`[Event Invitation Skipped] User \${params.userId} has notifyHackathons disabled.\`);
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

    const subject = \`🗓️ Event Invitation: \${params.eventName}\`;

    const res = await sendEmailNotification({
      to: cleanEmail,
      subject,
      html,
      text,
      category: "system",
      metadata: {
        type: "EVENT_INVITATION",
        eventId: params.eventId,
        idempotencyKey: params.idempotencyKey || \`event_invitation_\${params.eventId || "generic"}_\${cleanEmail}\`,
      },
    });

    return { success: res.success, id: res.id, error: res.error };
  } catch (err: any) {
    console.error("[sendEventInvitationEmail Exception]:", err?.message || err);
    return { success: false, error: err?.message || "Failed to dispatch event invitation email" };
  }
}
`;

code += newSendFns;
fs.writeFileSync('src/lib/email-service.ts', code, 'utf8');
console.log('Successfully updated src/lib/email-service.ts');
