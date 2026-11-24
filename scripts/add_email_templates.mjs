import fs from 'node:fs';

let code = fs.readFileSync('src/lib/email-templates.ts', 'utf8');

// 1. Refactor renderOtpVerificationEmail to ensure OTP is kept out of title/subject
const oldOtpFn = code.substring(code.indexOf('export function renderOtpVerificationEmail'));
// We want to replace renderOtpVerificationEmail and append the new templates and plain-text renderers

const newTemplates = `/**
 * Generates branded email for OTP verification
 * Keeps the code out of the subject and preheader, displays prominent code with actual expiry.
 */
export function renderOtpVerificationEmail(params: {
  otp?: string;
  purpose?: "login" | "signup" | "auth" | string;
  expiresMinutes?: number;
  identifier?: string;
  studentName?: string;
} = {}): string {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://edworld.co.in";
  const rawStudent = (params.studentName || "").trim();
  const firstName = escapeHtml(rawStudent ? rawStudent.split(" ")[0] : "Learner");
  const purposeText =
    params.purpose === "signup"
      ? "complete your account creation"
      : params.purpose === "login"
      ? "sign in securely to your account"
      : "verify your identity";
  const safePurpose = escapeHtml(purposeText);
  const expiry = params.expiresMinutes || 5;
  const safeOtp = escapeHtml(params.otp || "");
  const safeIdentifier = escapeHtml(params.identifier || "your email");

  return renderBrandedEmailHtml({
    previewText: \`Your single-use security verification code is ready. Valid for \${expiry} minutes.\`,
    title: "Your EdWorld Verification Code",
    contentHtml: \`
      <p style="font-size: 15px; color: #0F172A; line-height: 1.6; margin-top: 0;">
        Hello <strong>\${firstName}</strong>,
      </p>
      <p style="font-size: 14px; color: #334155; line-height: 1.6;">
        Use the single-use 6-digit code below to \${safePurpose} on EdWorld Co. This code will expire in <strong>\${expiry} minutes</strong>.
      </p>

      <div style="background-color: #F8FAFC; border: 2px solid #E2E8F0; border-radius: 14px; padding: 26px; margin: 28px 0; text-align: center;">
        <div style="font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace; font-size: 11px; font-weight: 800; color: #2563EB; text-transform: uppercase; letter-spacing: 1.5px; margin-bottom: 8px;">
          ✦ ONE-TIME SECURITY CODE
        </div>
        <div style="font-size: 40px; font-weight: 900; font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace; letter-spacing: 12px; color: #0F172A; text-indent: 12px; margin: 12px 0;">
          \${safeOtp}
        </div>
        <div style="font-size: 12px; color: #64748B; font-weight: 500;">
          Expires in \${expiry} minutes &bull; Single-use only
        </div>
      </div>

      <div style="background-color: #FEF3C7; border: 2px solid #F59E0B; border-radius: 10px; padding: 14px 18px; margin: 20px 0;">
        <p style="font-size: 12.5px; color: #92400E; margin: 0; line-height: 1.5;">
          <strong>Security Notice:</strong> Keep this code strictly private. EdWorld Co. support staff and mentors will never ask for your verification code or password.
        </p>
      </div>

      <p style="font-size: 13px; color: #64748B; line-height: 1.6;">
        If you did not request this verification code, please ignore this email or reach out immediately to our grievance redressal officer at <a href="mailto:edworld.eden@gmail.com" style="color: #2563EB; font-weight: 700; text-decoration: underline;">edworld.eden@gmail.com</a>.
      </p>
    \`,
    ctaText: "Open EdWorld Co.",
    ctaUrl: \`\${appUrl}/auth/login\`,
    footerNote: \`This automated security notification was sent to \${safeIdentifier} by EdWorld Co.\`,
  });
}

/**
 * Plain-text generator for OTP verification
 */
export function renderOtpVerificationText(params: {
  otp?: string;
  purpose?: string;
  expiresMinutes?: number;
  studentName?: string;
} = {}): string {
  const firstName = (params.studentName || "Learner").trim().split(" ")[0];
  const expiry = params.expiresMinutes || 5;
  const purpose = params.purpose === "signup" ? "complete your account creation" : "sign in securely to your account";
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://edworld.co.in";

  return [
    \`Hello \${firstName},\`,
    "",
    \`Use the single-use 6-digit code below to \${purpose} on EdWorld Co.\`,
    \`This code will expire in \${expiry} minutes.\`,
    "",
    "----------------------------------------",
    \`ONE-TIME SECURITY CODE: \${params.otp || ""}\`,
    \`Expires in: \${expiry} minutes\`,
    "----------------------------------------",
    "",
    "SECURITY NOTICE: Keep this code strictly private. Never share this code with anyone. EdWorld Co. will never ask for your code.",
    "",
    \`Sign in: \${appUrl}/auth/login\`,
    "",
    "EdWorld Co. • DPDP Act 2023 Compliant • Student Data Protected"
  ].join("\\n");
}

/**
 * Plain-text generator for Connection Request Received
 */
export function renderConnectionRequestText(params: {
  recipientName?: string;
  requesterName?: string;
  requesterHeadline?: string;
  requesterCollegeOrCompany?: string;
  message?: string;
  acceptUrl?: string;
} = {}): string {
  const recipient = (params.recipientName || "Learner").trim();
  const requester = (params.requesterName || "A fellow member").trim();
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://edworld.co.in";
  const url = params.acceptUrl || \`\${appUrl}/network\`;

  return [
    \`Hi \${recipient},\`,
    "",
    \`\${requester} sent you a connection request on EdWorld Co.\`,
    params.requesterHeadline ? \`Role: \${params.requesterHeadline}\` : "",
    params.requesterCollegeOrCompany ? \`Organization: \${params.requesterCollegeOrCompany}\` : "",
    params.message ? \`\\nNote: \"\${params.message}\"\` : "",
    "",
    \`Review and manage this request in your Networking hub:\`,
    url,
    "",
    "Note: You can review details and choose to accept or decline once signed in.",
    "",
    "EdWorld Co. • DPDP Act 2023 Compliant • Student Data Protected"
  ].filter(Boolean).join("\\n");
}

/**
 * Plain-text generator for Connection Accepted
 */
export function renderConnectionAcceptedText(params: {
  recipientName?: string;
  accepterName?: string;
  accepterHeadline?: string;
  profileUrl?: string;
} = {}): string {
  const recipient = (params.recipientName || "Learner").trim();
  const accepter = (params.accepterName || "Your connection").trim();
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://edworld.co.in";
  const url = params.profileUrl || \`\${appUrl}/network\`;

  return [
    \`Hi \${recipient},\`,
    "",
    \`\${accepter} accepted your connection request on EdWorld Co.\`,
    params.accepterHeadline ? \`Headline: \${params.accepterHeadline}\` : "",
    "",
    \`View your connection and explore their public portfolio:\`,
    url,
    "",
    "EdWorld Co. • DPDP Act 2023 Compliant • Student Data Protected"
  ].filter(Boolean).join("\\n");
}

/**
 * Generates branded email for Job or Internship alert
 * Displays role, employer, location, and application deadline with direct link.
 */
export function renderJobAlertEmail(params: {
  recipientName?: string;
  roleTitle?: string;
  companyName?: string;
  location?: string;
  type?: "job" | "internship" | string;
  deadline?: string;
  salaryRange?: string;
  jobId?: string;
  listingUrl?: string;
  manageAlertsUrl?: string;
  unsubscribeUrl?: string;
} = {}): string {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://edworld.co.in";
  const safeRecipient = escapeHtml(params.recipientName || "Learner");
  const isInternship = (params.type || "").toLowerCase().includes("intern");
  const opportunityType = isInternship ? "Internship" : "Job";
  const safeRole = escapeHtml(params.roleTitle || "Software Engineer");
  const safeCompany = escapeHtml(params.companyName || "Partner Organization");
  const safeLocation = escapeHtml(params.location || "Remote / Pan India");
  const safeDeadline = params.deadline ? escapeHtml(params.deadline) : "";
  const safeSalary = params.salaryRange ? escapeHtml(params.salaryRange) : "";
  const ctaUrl = params.listingUrl || (params.jobId ? \`\${appUrl}/jobs/\${params.jobId}\` : \`\${appUrl}/jobs\`);

  return renderBrandedEmailHtml({
    previewText: \`New \${opportunityType} Opportunity: \${safeRole} at \${safeCompany}\`,
    title: \`New \${opportunityType} Alert: \${safeRole}\`,
    isAlert: true,
    alertType: isInternship ? "internship" : "job",
    manageAlertsUrl: params.manageAlertsUrl,
    unsubscribeUrl: params.unsubscribeUrl,
    contentHtml: \`
      <p style="font-size: 15px; color: #0F172A; line-height: 1.6; margin-top: 0;">
        Hi <strong>\${safeRecipient}</strong>,
      </p>
      <p style="font-size: 14px; color: #334155; line-height: 1.6;">
        A new verified <strong>\${opportunityType.toLowerCase()}</strong> matching your career interests was recently posted on EdWorld Co.
      </p>

      <div style="background-color: #F8FAFC; border: 2px solid #E2E8F0; border-radius: 14px; padding: 22px; margin: 24px 0;">
        <div style="font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace; font-size: 11px; font-weight: 800; color: #2563EB; text-transform: uppercase; letter-spacing: 1.5px; margin-bottom: 8px;">
          ✦ VERIFIED \${opportunityType.toUpperCase()} LISTING
        </div>
        <div style="font-size: 20px; font-weight: 900; color: #0F172A; margin: 4px 0;">
          \${safeRole}
        </div>
        <div style="font-size: 14px; font-weight: 700; color: #475569; margin-bottom: 12px;">
          \${safeCompany}
        </div>

        <table width="100%" border="0" cellspacing="0" cellpadding="4" style="font-size: 13px; color: #334155; margin-top: 8px;">
          <tr>
            <td style="width: 100px; color: #64748B; font-weight: 600;">Location:</td>
            <td><strong>\${safeLocation}</strong></td>
          </tr>
          \${safeSalary ? \`
            <tr>
              <td style="color: #64748B; font-weight: 600;">Compensation:</td>
              <td><strong>\${safeSalary}</strong></td>
            </tr>
          \` : ""}
          \${safeDeadline ? \`
            <tr>
              <td style="color: #64748B; font-weight: 600;">Deadline:</td>
              <td><strong style="color: #DC2626;">\${safeDeadline}</strong></td>
            </tr>
          \` : ""}
        </table>
      </div>

      <p style="font-size: 13px; color: #64748B; line-height: 1.5;">
        You can submit your application using your verified EdWorld profile, Project Studio credentials, and saved resumes.
      </p>
    \`,
    ctaText: \`View \${opportunityType} & Apply\`,
    ctaUrl,
    footerNote: "You received this email because you opted in to job & internship alerts on EdWorld Co.",
  });
}

/**
 * Plain-text generator for Job / Internship alert
 */
export function renderJobAlertText(params: {
  recipientName?: string;
  roleTitle?: string;
  companyName?: string;
  location?: string;
  type?: string;
  deadline?: string;
  salaryRange?: string;
  jobId?: string;
  listingUrl?: string;
} = {}): string {
  const recipient = (params.recipientName || "Learner").trim();
  const isInternship = (params.type || "").toLowerCase().includes("intern");
  const opportunityType = isInternship ? "Internship" : "Job";
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://edworld.co.in";
  const ctaUrl = params.listingUrl || (params.jobId ? \`\${appUrl}/jobs/\${params.jobId}\` : \`\${appUrl}/jobs\`);

  return [
    \`Hi \${recipient},\`,
    "",
    \`New \${opportunityType} Opportunity: \${params.roleTitle || "Software Engineer"}\`,
    \`Company: \${params.companyName || "Partner Organization"}\`,
    \`Location: \${params.location || "Remote / Pan India"}\`,
    params.salaryRange ? \`Compensation: \${params.salaryRange}\` : "",
    params.deadline ? \`Application Deadline: \${params.deadline}\` : "",
    "",
    \`View listing and apply:\`,
    ctaUrl,
    "",
    \`Manage your alert preferences: \${appUrl}/settings/alerts\`,
    \`Unsubscribe: \${appUrl}/newsletter/unsubscribe\`,
    "",
    "EdWorld Co. • DPDP Act 2023 Compliant • Student Data Protected"
  ].filter(Boolean).join("\\n");
}

/**
 * Generates branded email for Event Invitation
 * Displays event name, date, time zone, and location or online status with registration link.
 */
export function renderEventInvitationEmail(params: {
  recipientName?: string;
  eventName?: string;
  organizer?: string;
  date?: string;
  timeZone?: string;
  locationOrOnline?: string;
  eventId?: string;
  eventUrl?: string;
  description?: string;
  manageAlertsUrl?: string;
  unsubscribeUrl?: string;
} = {}): string {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://edworld.co.in";
  const safeRecipient = escapeHtml(params.recipientName || "Learner");
  const safeEvent = escapeHtml(params.eventName || "EdWorld Tech Summit & Hackathon");
  const safeOrganizer = escapeHtml(params.organizer || "EdWorld Co.");
  const safeDate = escapeHtml(params.date || "Upcoming");
  const safeTimeZone = escapeHtml(params.timeZone || "IST (UTC+05:30)");
  const safeLocation = escapeHtml(params.locationOrOnline || "Online Live Session");
  const safeDesc = params.description ? escapeHtml(params.description) : "";
  const ctaUrl = params.eventUrl || (params.eventId ? \`\${appUrl}/#events\` : \`\${appUrl}/#events\`);

  return renderBrandedEmailHtml({
    previewText: \`You're invited: \${safeEvent} by \${safeOrganizer}\`,
    title: \`Event Invitation: \${safeEvent}\`,
    isAlert: true,
    alertType: "event",
    manageAlertsUrl: params.manageAlertsUrl,
    unsubscribeUrl: params.unsubscribeUrl,
    contentHtml: \`
      <p style="font-size: 15px; color: #0F172A; line-height: 1.6; margin-top: 0;">
        Hi <strong>\${safeRecipient}</strong>,
      </p>
      <p style="font-size: 14px; color: #334155; line-height: 1.6;">
        You are invited to participate in <strong>\${safeEvent}</strong>, hosted by <strong>\${safeOrganizer}</strong>.
      </p>

      <div style="background-color: #F8FAFC; border: 2px solid #E2E8F0; border-radius: 14px; padding: 22px; margin: 24px 0;">
        <div style="font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace; font-size: 11px; font-weight: 800; color: #059669; text-transform: uppercase; letter-spacing: 1.5px; margin-bottom: 8px;">
          ✦ UPCOMING EVENT &bull; LIVE REGISTRATION
        </div>
        <div style="font-size: 20px; font-weight: 900; color: #0F172A; margin: 4px 0;">
          \${safeEvent}
        </div>
        <div style="font-size: 14px; font-weight: 700; color: #475569; margin-bottom: 12px;">
          Organized by \${safeOrganizer}
        </div>

        <table width="100%" border="0" cellspacing="0" cellpadding="4" style="font-size: 13px; color: #334155; margin-top: 8px;">
          <tr>
            <td style="width: 100px; color: #64748B; font-weight: 600;">Date &amp; Time:</td>
            <td><strong>\${safeDate} (\${safeTimeZone})</strong></td>
          </tr>
          <tr>
            <td style="color: #64748B; font-weight: 600;">Venue / Mode:</td>
            <td><strong>\${safeLocation}</strong></td>
          </tr>
        </table>

        \${safeDesc ? \`
          <div style="margin-top: 14px; padding-top: 12px; border-top: 1px dashed #CBD5E1; font-size: 13px; color: #475569; line-height: 1.5;">
            \${safeDesc}
          </div>
        \` : ""}
      </div>

      <p style="font-size: 13px; color: #64748B; line-height: 1.5;">
        Save your spot early to receive live session links, calendar invites, and team matchmaking opportunities.
      </p>
    \`,
    ctaText: "View Event & Register",
    ctaUrl,
    footerNote: "You received this invitation because you are subscribed to EdWorld events and hackathon alerts.",
  });
}

/**
 * Plain-text generator for Event Invitation
 */
export function renderEventInvitationText(params: {
  recipientName?: string;
  eventName?: string;
  organizer?: string;
  date?: string;
  timeZone?: string;
  locationOrOnline?: string;
  description?: string;
  eventId?: string;
  eventUrl?: string;
} = {}): string {
  const recipient = (params.recipientName || "Learner").trim();
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://edworld.co.in";
  const ctaUrl = params.eventUrl || (params.eventId ? \`\${appUrl}/#events\` : \`\${appUrl}/#events\`);

  return [
    \`Hi \${recipient},\`,
    "",
    \`You are invited to: \${params.eventName || "EdWorld Tech Summit"}\`,
    \`Organizer: \${params.organizer || "EdWorld Co."}\`,
    \`Date: \${params.date || "Upcoming"} (\${params.timeZone || "IST (UTC+05:30)"})\`,
    \`Venue / Mode: \${params.locationOrOnline || "Online Live Session"}\`,
    params.description ? \`\\nDetails: \${params.description}\` : "",
    "",
    \`View event and register:\`,
    ctaUrl,
    "",
    \`Manage alert preferences: \${appUrl}/settings/alerts\`,
    \`Unsubscribe: \${appUrl}/newsletter/unsubscribe\`,
    "",
    "EdWorld Co. • DPDP Act 2023 Compliant • Student Data Protected"
  ].filter(Boolean).join("\\n");
}
`;

const otpIndex = code.indexOf('export function renderOtpVerificationEmail');
code = code.substring(0, otpIndex) + newTemplates;

fs.writeFileSync('src/lib/email-templates.ts', code, 'utf8');
console.log('Successfully added new templates and plain-text generators to src/lib/email-templates.ts');
