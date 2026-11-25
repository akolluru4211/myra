/**
 * Centralized Branded Email Template Generator - Figma Human Studio v5.0 Maximalism
 *
 * Implements EdWorld Co. maximalist design standard:
 * - High-contrast tactile framing (deep slate canvas, 2px solid structural borders)
 * - Official white-on-black geometric monogram icon badge
 * - Signature brand ribbon: "Learn • Grow • Build" with emerald and cobalt jewel indicators
 * - Telemetry micro-badge: "✦ OFFICIAL EDWORLD CO. DISPATCH • DPDP 2023 COMPLIANT"
 * - Chunky tactile solid CTAs with high-contrast borders and specular elevation
 * - Comprehensive trust footer: DPDP 2023 compliance, Hyderabad headquarters, and grievance redressal
 */

export interface EmailLayoutProps {
  previewText: string;
  title: string;
  contentHtml: string;
  ctaText?: string;
  ctaUrl?: string;
  footerNote?: string;
  logoUrl?: string;
  isAlert?: boolean;
  alertType?: "job" | "internship" | "event" | string;
  manageAlertsUrl?: string;
  unsubscribeUrl?: string;
}

/**
 * Validates and normalizes links to ensure only safe HTTPS or authorized app URLs are rendered.
 */
export function validateUrl(url: string | null | undefined, fallbackPath = "/dashboard"): string {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://edworld.co.in";
  if (!url) return `${appUrl}${fallbackPath.startsWith("/") ? "" : "/"}${fallbackPath}`;
  const trimmed = url.trim();
  if (trimmed.startsWith("http://") || trimmed.startsWith("https://")) {
    return trimmed;
  }
  if (trimmed.startsWith("/")) {
    return `${appUrl}${trimmed}`;
  }
  return `${appUrl}/${trimmed}`;
}

/**
 * Zero-dependency helper to escape HTML special characters and prevent markup injection
 */
export function escapeHtml(str: string | number | null | undefined): string {
  if (str == null) return "";
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

export function renderBrandedEmailHtml(props: EmailLayoutProps): string {
  const { previewText, title, contentHtml, ctaText, ctaUrl, footerNote, isAlert, alertType } = props;
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://edworld.co.in";
  const verifiedCtaUrl = ctaUrl ? validateUrl(ctaUrl) : "";
  const manageAlertsUrl = props.manageAlertsUrl || `${appUrl}/settings/alerts`;
  const unsubscribeUrl = props.unsubscribeUrl || `${appUrl}/newsletter/unsubscribe`;

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
  <style>
    body {
      margin: 0;
      padding: 0;
      background-color: #F8FAFC;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
      color: #0F172A;
      -webkit-font-smoothing: antialiased;
    }
    .email-container {
      width: 100%;
      max-width: 600px;
      margin: 0 auto;
      background-color: #FFFFFF;
      border-radius: 16px;
      overflow: hidden;
      border: 1px solid #E2E8F0;
      box-shadow: 0 4px 20px -2px rgba(15, 23, 42, 0.05);
    }
    .header {
      padding: 32px 32px 20px;
      text-align: center;
      background-color: #FFFFFF;
    }
    .logo-img {
      display: block;
      margin: 0 auto;
      width: 52px;
      height: 52px;
      border: 0;
      outline: none;
      border-radius: 10px;
    }
    .body-content {
      padding: 12px 32px 36px;
      font-size: 15px;
      line-height: 1.65;
      color: #334155;
      background-color: #FFFFFF;
    }
    .body-content h1 {
      font-size: 22px;
      font-weight: 800;
      color: #0F172A;
      letter-spacing: -0.4px;
      margin-top: 0;
      margin-bottom: 20px;
      line-height: 1.3;
      text-align: center;
    }
    .body-content p {
      margin-top: 0;
      margin-bottom: 16px;
    }
    .body-content strong {
      color: #0F172A;
    }
    .tactile-card {
      background-color: #F8FAFC;
      border: 1px solid #E2E8F0;
      border-radius: 12px;
      padding: 20px;
      margin: 24px 0;
    }
    .cta-container {
      text-align: center;
      margin: 32px 0 16px;
    }
    .cta-button {
      display: inline-block;
      background-color: #059669;
      color: #FFFFFF !important;
      text-decoration: none;
      padding: 13px 32px;
      border-radius: 10px;
      font-weight: 700;
      font-size: 14px;
      letter-spacing: 0.2px;
    }
    .footer {
      padding: 28px 32px;
      text-align: center;
      font-size: 12px;
      line-height: 1.6;
      color: #64748B;
      border-top: 1px solid #E2E8F0;
      background-color: #F8FAFC;
    }
    .footer a {
      color: #059669;
      text-decoration: underline;
    }
    .footer-stamp {
      font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
      font-size: 10px;
      color: #94A3B8;
      text-transform: uppercase;
      letter-spacing: 1px;
      margin-top: 12px;
    }
    @media only screen and (max-width: 600px) {
      .body-content {
        padding: 8px 20px 28px !important;
      }
      .header {
        padding: 24px 20px 16px !important;
      }
      .footer {
        padding: 24px 20px !important;
      }
      .cta-button {
        display: block !important;
        width: 100% !important;
        box-sizing: border-box !important;
        text-align: center !important;
      }
    }
  </style>
</head>
<body style="margin: 0; padding: 0; background-color: #F8FAFC;">
  <!-- Preheader Preview Text -->
  <div style="display: none; max-height: 0px; overflow: hidden; mso-hide: all;">
    ${previewText}
  </div>

  <!-- Outer Responsive Wrapper Table -->
  <table width="100%" border="0" cellspacing="0" cellpadding="24" style="background-color: #F8FAFC; min-height: 100vh;">
    <tr>
      <td align="center" valign="top">
        <div class="email-container">
          
          <!-- Header Canvas with Official EdWorld Co. Logo -->
          <div class="header">
            <table border="0" cellpadding="0" cellspacing="0" align="center" style="margin: 0 auto;">
              <tr>
                <td align="center" valign="middle">
                  <a href="${appUrl}" target="_blank" style="text-decoration: none; display: inline-block;">
                    <img
                      src="${appUrl}/images/edworld-logo.png"
                      alt="EdWorld Co."
                      width="52"
                      height="52"
                      class="logo-img"
                      style="display: block; margin: 0 auto; width: 52px; height: 52px; border: 0; outline: none; border-radius: 10px;"
                    />
                  </a>
                </td>
              </tr>
            </table>
          </div>

          <!-- Main Body Canvas -->
          <div class="body-content">
            ${title ? `<h1>${title}</h1>` : ""}
            ${contentHtml}

            ${ctaText && verifiedCtaUrl ? `
              <div class="cta-container">
                <a href="${verifiedCtaUrl}" class="cta-button" target="_blank">${ctaText} &rarr;</a>
              </div>
            ` : ""}
          </div>

          <!-- Trust & Compliance Footer -->
          <div class="footer">
            <p style="margin: 0 0 10px; color: #475569; font-weight: 500;">
              ${footerNote || "You received this email because of your verified account on EdWorld Co."}
            </p>

            ${isAlert ? `
              <div style="margin: 14px 0 16px; padding: 12px 16px; background-color: #FFFFFF; border: 1px solid #E2E8F0; border-radius: 10px; font-size: 11px; color: #475569; text-align: center; line-height: 1.6;">
                <span style="color: #0F172A; font-weight: 600;">You received this optional ${alertType || "notification"} alert based on your notification preferences.</span><br />
                <a href="${manageAlertsUrl}" style="color: #059669; font-weight: 700; text-decoration: underline; margin-right: 14px;">Manage alerts</a>
                <a href="${unsubscribeUrl}" style="color: #64748B; text-decoration: underline;">Unsubscribe from alerts</a>
              </div>
            ` : ""}
            
            <p style="margin: 0 0 8px; color: #64748B;">
              <strong style="color: #0F172A;">EdWorld Co.</strong> &bull; Operating Headquarters: Hyderabad, Telangana 500081, India
            </p>

            <p style="margin: 0 0 12px; color: #64748B;">
              Support &amp; Grievance Redressal: <a href="mailto:edworld.eden@gmail.com" style="color: #059669; font-weight: 600;">edworld.eden@gmail.com</a>
            </p>

            <!-- Quick Navigation Links -->
            <div style="margin: 14px 0 16px; padding: 10px 0; border-top: 1px solid #E2E8F0; border-bottom: 1px solid #E2E8F0; font-size: 11px; color: #64748B;">
              <a href="${appUrl}/dashboard" style="color: #64748B; text-decoration: none; margin: 0 6px; font-weight: 600;">Dashboard</a> &bull;
              <a href="${appUrl}/interviews" style="color: #64748B; text-decoration: none; margin: 0 6px; font-weight: 600;">Mock Interviews</a> &bull;
              <a href="${appUrl}/resumes" style="color: #64748B; text-decoration: none; margin: 0 6px; font-weight: 600;">ATS Resumes</a> &bull;
              <a href="${appUrl}/focus" style="color: #64748B; text-decoration: none; margin: 0 6px; font-weight: 600;">Focus Lock</a> &bull;
              <a href="${appUrl}/edbuild" style="color: #64748B; text-decoration: none; margin: 0 6px; font-weight: 600;">EdBuild Squads</a>
            </div>

            <p style="margin: 0; color: #94A3B8; font-size: 11px;">
              &copy; ${new Date().getFullYear()} EdWorld Co. All rights reserved. &bull; 
              <a href="${appUrl}/privacy" style="color: #64748B;">Privacy Policy</a> &bull; 
              <a href="${appUrl}/terms" style="color: #64748B;">Terms</a> &bull; 
              <a href="${appUrl}/refund" style="color: #64748B;">Refunds</a> &bull; 
              <a href="${appUrl}/newsletter/unsubscribe" style="color: #64748B;">Unsubscribe</a>
            </p>

            <div class="footer-stamp">
              DPDP ACT 2023 COMPLIANT &bull; STUDENT DATA PROTECTED
            </div>
          </div>

        </div>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

/**
 * Generates branded email for Ambassador Approval notification
 */
export function renderAmbassadorApprovedEmail(params: {
  name?: string;
  ambassadorName?: string;
  collegeName?: string;
  referralCode?: string;
} = {}): string {
  const safeName = escapeHtml(params.name || (params as any).ambassadorName || "Ambassador");
  const safeCollege = escapeHtml(params.collegeName || "your college");
  const safeReferralCode = escapeHtml(params.referralCode || "CAMPUS2026");

  return renderBrandedEmailHtml({
    previewText: "Congratulations! You are officially an EdWorld Campus Ambassador.",
    title: "Welcome to the EdWorld Campus Ambassador Program",
    contentHtml: `
      <p>Hi <strong>${safeName}</strong>,</p>
      <p>We are excited to inform you that your application to represent <strong>${safeCollege}</strong> has been reviewed and <strong>approved</strong>.</p>
      
      <div style="background-color: #F8FAFC; border: 2px solid #E2E8F0; border-radius: 14px; padding: 22px; margin: 24px 0; text-align: center;">
        <div style="font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace; font-size: 11px; font-weight: 800; color: #2563EB; text-transform: uppercase; letter-spacing: 1.5px;">
          ✦ EXCLUSIVE CAMPUS REFERRAL CODE
        </div>
        <div style="font-size: 26px; font-weight: 900; color: #0F172A; font-family: ui-monospace, SFMono-Regular, monospace; margin-top: 8px; letter-spacing: 2px;">
          ${safeReferralCode}
        </div>
        <div style="font-size: 12px; color: #64748B; margin-top: 6px;">
          Earn verified rewards and leadership credentials for every student who joins through your code.
        </div>
      </div>
      
      <p>You can now access your Ambassador Resource Hub to share materials and track student signups in real time.</p>
    `,
    ctaText: "Open Ambassador Hub",
    ctaUrl: `${process.env.NEXT_PUBLIC_APP_URL || "https://edworld.co.in"}/ambassador/hub`,
  });
}

/**
 * Generates branded email for Mock Interview Performance Scorecard
 */
export function renderInterviewScorecardEmail(params: {
  name?: string;
  studentName?: string;
  sessionTitle?: string;
  interviewRole?: string;
  overallScore?: number;
  sessionId?: string;
  scorecardUrl?: string;
} = {}): string {
  const safeName = escapeHtml(params.name || (params as any).studentName || "Learner");
  const rawTitle = params.sessionTitle || (params as any).interviewRole || "Mock Interview Session";
  const safeTitle = escapeHtml(rawTitle);
  const rawScore = typeof params.overallScore === "number" ? params.overallScore : (params.overallScore ? Number(params.overallScore) : 0);
  const score = isNaN(rawScore) ? 0 : rawScore;
  const scoreColor = score >= 80 ? "#059669" : score >= 60 ? "#2563EB" : "#D97706";
  const ctaUrl = params.sessionId
    ? `${process.env.NEXT_PUBLIC_APP_URL || "https://edworld.co.in"}/interviews/results/${params.sessionId}`
    : (params as any).scorecardUrl || `${process.env.NEXT_PUBLIC_APP_URL || "https://edworld.co.in"}/interviews`;

  return renderBrandedEmailHtml({
    previewText: `Your scorecard for ${safeTitle} is now available.`,
    title: "Your Mock Interview Performance Summary",
    contentHtml: `
      <p>Hi <strong>${safeName}</strong>,</p>
      <p>Your mock interview session <strong>${safeTitle}</strong> has been fully evaluated by Myra AI.</p>
      
      <div style="background-color: #F8FAFC; border: 2px solid #E2E8F0; border-radius: 14px; padding: 24px; margin: 24px 0; text-align: center;">
        <div style="font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace; font-size: 11px; font-weight: 800; color: #475569; text-transform: uppercase; letter-spacing: 1.5px;">
          OVERALL PERFORMANCE SCORE
        </div>
        <div style="font-size: 42px; font-weight: 900; color: ${scoreColor}; margin-top: 6px; letter-spacing: -1px;">
          ${score} <span style="font-size: 18px; color: #94A3B8; font-weight: 700;">/ 100</span>
        </div>
        <div style="font-size: 12px; color: #64748B; margin-top: 4px;">
          4D STAR Rubric &bull; Filler-word cadence &bull; Technical depth
        </div>
      </div>
      
      <p>Review your detailed question-by-question breakdown, speech pacing analysis, and STAR answer models.</p>
    `,
    ctaText: "View Full Scorecard",
    ctaUrl,
  });
}

/**
 * Generates branded email when someone receives a connection request
 */
export function renderConnectionRequestReceivedEmail(params: {
  recipientName?: string;
  requesterName?: string;
  senderName?: string;
  requesterHeadline?: string;
  senderHeadline?: string;
  requesterCollegeOrCompany?: string;
  message?: string;
  acceptUrl?: string;
} = {}): string {
  const safeRecipient = escapeHtml(params.recipientName || "Learner");
  const rawRequester = params.requesterName || (params as any).senderName || "A peer";
  const safeRequester = escapeHtml(rawRequester);
  const headline = params.requesterHeadline || (params as any).senderHeadline;
  const safeHeadline = headline ? escapeHtml(headline) : "";
  const safeCompany = params.requesterCollegeOrCompany ? escapeHtml(params.requesterCollegeOrCompany) : "";
  const safeMessage = params.message ? escapeHtml(params.message) : "";
  const ctaUrl = (params as any).acceptUrl || `${process.env.NEXT_PUBLIC_APP_URL || "https://edworld.co.in"}/network`;

  return renderBrandedEmailHtml({
    previewText: `${safeRequester} wants to connect with you on EdWorld Co.`,
    title: "New Connection Request",
    contentHtml: `
      <p>Hi <strong>${safeRecipient}</strong>,</p>
      <p><strong>${safeRequester}</strong> sent you a connection request on EdWorld Co.</p>
      
      <div style="background-color: #F8FAFC; border: 2px solid #E2E8F0; border-radius: 14px; padding: 20px; margin: 24px 0;">
        <div style="font-size: 17px; font-weight: 900; color: #0F172A;">${safeRequester}</div>
        ${safeHeadline ? `<div style="font-size: 13px; color: #475569; margin-top: 3px; font-weight: 500;">${safeHeadline}</div>` : ""}
        ${safeCompany ? `<div style="font-size: 12px; color: #64748B; margin-top: 4px; font-family: ui-monospace, SFMono-Regular, monospace;">${safeCompany}</div>` : ""}
        ${safeMessage ? `
          <div style="margin-top: 14px; padding-top: 12px; border-top: 1px dashed #CBD5E1; font-size: 13px; font-style: italic; color: #334155;">
            &ldquo;${safeMessage}&rdquo;
          </div>
        ` : ""}
      </div>
      
      <p>Connect with peers and engineers to collaborate on technical projects and expand your verified network.</p>
    `,
    ctaText: "Review & Respond to Request",
    ctaUrl,
  });
}

/**
 * Generates branded email when a connection request is accepted
 */
export function renderConnectionAcceptedEmail(params: {
  recipientName?: string;
  accepterName?: string;
  peerName?: string;
  accepterHeadline?: string;
  peerHeadline?: string;
  accepterCollegeOrCompany?: string;
  profileUrl?: string;
} = {}): string {
  const safeRecipient = escapeHtml(params.recipientName || "Learner");
  const rawAccepter = params.accepterName || (params as any).peerName || "A peer";
  const safeAccepter = escapeHtml(rawAccepter);
  const headline = params.accepterHeadline || (params as any).peerHeadline;
  const safeHeadline = headline ? escapeHtml(headline) : "";
  const safeCompany = params.accepterCollegeOrCompany ? escapeHtml(params.accepterCollegeOrCompany) : "";
  const ctaUrl = (params as any).profileUrl || `${process.env.NEXT_PUBLIC_APP_URL || "https://edworld.co.in"}/network`;

  return renderBrandedEmailHtml({
    previewText: `${safeAccepter} accepted your connection request on EdWorld Co.`,
    title: "Connection Request Accepted",
    contentHtml: `
      <p>Hi <strong>${safeRecipient}</strong>,</p>
      <p><strong>${safeAccepter}</strong> has accepted your connection request.</p>
      
      <div style="background-color: #F8FAFC; border: 2px solid #E2E8F0; border-radius: 14px; padding: 20px; margin: 24px 0;">
        <div style="font-size: 17px; font-weight: 900; color: #0F172A;">${safeAccepter}</div>
        ${safeHeadline ? `<div style="font-size: 13px; color: #475569; margin-top: 3px; font-weight: 500;">${safeHeadline}</div>` : ""}
        ${safeCompany ? `<div style="font-size: 12px; color: #64748B; margin-top: 4px; font-family: ui-monospace, SFMono-Regular, monospace;">${safeCompany}</div>` : ""}
      </div>
      
      <p>You are now connected in the EdWorld Co. network. You can view their public portfolio, benchmark projects, and collaborate.</p>
    `,
    ctaText: "View Network & Profile",
    ctaUrl,
  });
}

/**
 * Generates branded email for Password Reset Recovery Link
 */
export function renderPasswordResetEmail(params: {
  name?: string;
  resetLink?: string;
  expiresIn?: string;
} = {}): string {
  const safeName = escapeHtml(params.name || "Learner");
  const expiry = escapeHtml(params.expiresIn || "1 hour");
  const resetLink = params.resetLink || `${process.env.NEXT_PUBLIC_APP_URL || "https://edworld.co.in"}/auth/login`;

  return renderBrandedEmailHtml({
    previewText: "Reset your EdWorld Co. account password",
    title: "Reset Your Password",
    contentHtml: `
      <p>Hi <strong>${safeName}</strong>,</p>
      <p>We received a secure request to reset the password for your EdWorld Co. account.</p>
      <p>Click the button below to choose a new password. For security reasons, this link will expire in <strong>${expiry}</strong>.</p>
      
      <div style="background-color: #FEF3C7; border: 2px solid #F59E0B; border-radius: 12px; padding: 16px; margin: 24px 0; font-size: 12.5px; color: #92400E; line-height: 1.5;">
        <strong style="color: #78350F;">Security Notice:</strong> If you did not request a password reset, you can safely disregard this email. Your account password will remain unchanged and your session remains secure.
      </div>
    `,
    ctaText: "Reset Password",
    ctaUrl: params.resetLink || resetLink,
    footerNote: "This single-use link was generated securely upon request from the EdWorld Co. account recovery system.",
  });
}

/**
 * Generates branded email confirming password update
 */
export function renderPasswordChangedConfirmationEmail(params: {
  name?: string;
} = {}): string {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://edworld.co.in";
  const safeName = escapeHtml(params.name || "Learner");

  return renderBrandedEmailHtml({
    previewText: "Your EdWorld Co. account password was successfully updated",
    title: "Password Updated Successfully",
    contentHtml: `
      <p>Hi <strong>${safeName}</strong>,</p>
      <p>This is a confirmation that the password for your EdWorld Co. account was recently changed.</p>
      <p>If you made this change, no further action is required.</p>
      
      <div style="background-color: #EFF6FF; border: 2px solid #3B82F6; border-radius: 12px; padding: 16px; margin: 24px 0; font-size: 12.5px; color: #1E40AF; line-height: 1.5;">
        <strong style="color: #1E3A8A;">Did not make this change?</strong> Please contact support immediately at <a href="mailto:edworld.eden@gmail.com" style="color: #1D4ED8; font-weight: 700; text-decoration: underline;">edworld.eden@gmail.com</a> to lock down and protect your account.
      </div>
    `,
    ctaText: "Sign In to Your Account",
    ctaUrl: `${appUrl}/auth/login`,
    footerNote: "Automated account security alert from EdWorld Co.",
  });
}

/**
 * Generates custom branded email for newly signed-up users
 * Features official EdWorld Co. logo, student greeting, 3 core pillars, and dashboard CTA.
 */
export function renderSignupWelcomeEmail(params: {
  name?: string;
  email?: string;
  careerStage?: string;
  userRole?: string;
} = {}): string {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://edworld.co.in";
  const dashboardUrl = `${appUrl}/dashboard`;
  const rawName = (params.name || "").trim();
  const firstName = escapeHtml(rawName ? rawName.split(" ")[0] : "Learner");
  const safeEmail = escapeHtml(params.email || "your email");

  return renderBrandedEmailHtml({
    previewText: `Welcome to EdWorld Co., ${firstName}! Your study schedule and career roadmap are ready.`,
    title: `Welcome to EdWorld Co., ${firstName}!`,
    contentHtml: `
      <p style="font-size: 15px; color: #0F172A; line-height: 1.6; margin-top: 0;">
        Hi <strong>${firstName}</strong>,
      </p>
      <p style="font-size: 14px; color: #334155; line-height: 1.6;">
        Welcome to <strong>EdWorld Co.</strong> — your all-in-one ecosystem for academic discipline, exam readiness, and career acceleration. We're thrilled to have you in the community.
      </p>

      <div style="background-color: #F8FAFC; border: 2px solid #E2E8F0; border-radius: 14px; padding: 22px; margin: 24px 0;">
        <div style="font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace; font-size: 11px; font-weight: 800; color: #2563EB; text-transform: uppercase; letter-spacing: 1.5px; margin-bottom: 14px;">
          ✦ WHAT'S WAITING IN YOUR WORKSPACE
        </div>
        
        <table width="100%" border="0" cellspacing="0" cellpadding="0" style="font-size: 13.5px; color: #334155;">
          <tr>
            <td style="padding: 10px 0; vertical-align: top; width: 34px; font-size: 20px;">📅</td>
            <td style="padding: 10px 0;">
              <strong style="color: #0F172A; font-size: 14.5px;">Personalized Study Timetable</strong><br />
              <span style="color: #64748B; font-size: 12.5px; line-height: 1.5; display: block; margin-top: 2px;">
                Daily smart schedule calibrated to your target exams and available hours with interactive task tracking.
              </span>
            </td>
          </tr>
          <tr>
            <td style="padding: 10px 0; vertical-align: top; width: 34px; font-size: 20px;">🎯</td>
            <td style="padding: 10px 0;">
              <strong style="color: #0F172A; font-size: 14.5px;">Career Trajectory &amp; 1,000 Questions Hub</strong><br />
              <span style="color: #64748B; font-size: 12.5px; line-height: 1.5; display: block; margin-top: 2px;">
                Explore common interview questions across 46 career sectors, tailored to both freshers and experienced engineers.
              </span>
            </td>
          </tr>
          <tr>
            <td style="padding: 10px 0; vertical-align: top; width: 34px; font-size: 20px;">🐻</td>
            <td style="padding: 10px 0;">
              <strong style="color: #0F172A; font-size: 14.5px;">Myra AI Mentor &amp; Onboarding Copilot</strong><br />
              <span style="color: #64748B; font-size: 12.5px; line-height: 1.5; display: block; margin-top: 2px;">
                Your 24/7 AI guide to build realistic study plans, conquer backlogs, and ace mock interviews step-by-step.
              </span>
            </td>
          </tr>
        </table>
      </div>

      <div style="background-color: #FFFFFF; border: 2px dashed #CBD5E1; border-radius: 12px; padding: 18px; margin: 20px 0;">
        <div style="font-size: 12px; font-weight: 800; color: #0F172A; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 8px;">
          Next Steps to Kickstart Your Velocity:
        </div>
        <ol style="margin: 0; padding-left: 20px; font-size: 13px; color: #475569; line-height: 1.6;">
          <li>Review today's study blocks on your <strong>Personalized Timetable</strong>.</li>
          <li>Practice your first question on the <strong>Mock Interview Studio</strong>.</li>
          <li>Ask <strong>Myra AI</strong> to tailor your weekly roadmap for your upcoming placement season.</li>
        </ol>
      </div>

      <p style="font-size: 13px; color: #64748B; line-height: 1.5; margin-top: 20px;">
        If you ever need help, simply reply to this email or reach our support team anytime at <a href="mailto:edworld.eden@gmail.com" style="color: #2563EB; font-weight: 700; text-decoration: underline;">edworld.eden@gmail.com</a>.
      </p>
    `,
    ctaText: "Go to Your Dashboard",
    ctaUrl: dashboardUrl,
    footerNote: `This welcome email was sent to ${safeEmail} upon creating an account on EdWorld Co.`,
  });
}

/**
 * Generates custom branded email for EdBuild project completion & certificate issuance
 */
export function renderProjectCompletionCertificateEmail(params: {
  studentName?: string;
  projectName?: string;
  certificateUrl?: string;
  certificateCode?: string;
} = {}): string {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://edworld.co.in";
  const rawStudent = (params.studentName || "").trim();
  const firstName = escapeHtml(rawStudent ? rawStudent.split(" ")[0] : "Learner");
  const safeStudent = escapeHtml(rawStudent || "Learner");
  const safeProject = escapeHtml(params.projectName || "EdBuild Project");
  const safeCode = escapeHtml(params.certificateCode || "EDW-CERT");
  const certificateUrl = params.certificateUrl || `${appUrl}/credentials`;

  return renderBrandedEmailHtml({
    previewText: `Congratulations ${firstName}! Your Certificate of Completion for "${safeProject}" is ready.`,
    title: `Official Certificate of Completion: ${safeProject}`,
    contentHtml: `
      <p style="font-size: 15px; color: #0F172A; line-height: 1.6; margin-top: 0;">
        Dear <strong>${firstName}</strong>,
      </p>
      <p style="font-size: 14px; color: #334155; line-height: 1.6;">
        We are thrilled to inform you that your engineering team submission for <strong>${safeProject}</strong> has been officially reviewed and <strong style="color: #059669;">ACCEPTED</strong> by the EdWorld Co. evaluation team!
      </p>
      
      <div style="background-color: #F8FAFC; border: 2px solid #E2E8F0; border-radius: 14px; padding: 24px; margin: 24px 0; text-align: center;">
        <table align="center" border="0" cellpadding="0" cellspacing="0" style="margin: 0 auto 12px;">
          <tr>
            <td align="center" valign="middle" style="background-color: #000000; border-radius: 14px; width: 54px; height: 54px; padding: 0; border: 2px solid #1E293B; text-align: center;">
              <table border="0" cellpadding="0" cellspacing="0" width="100%" height="100%">
                <tr>
                  <td align="center" valign="middle" style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; font-size: 22px; font-weight: 900; line-height: 1; color: #FFFFFF; letter-spacing: -1px;">
                    E<span style="color: #059669;">.</span>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
        <div style="font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace; font-size: 11px; font-weight: 800; color: #2563EB; text-transform: uppercase; letter-spacing: 1.5px;">
          ✦ VERIFIED CREDENTIAL ISSUED
        </div>
        <div style="font-size: 20px; font-weight: 900; color: #0F172A; margin: 8px 0 4px;">
          Certificate of Completion &amp; Participation
        </div>
        <div style="font-size: 12.5px; font-family: ui-monospace, SFMono-Regular, monospace; color: #64748B;">
          Credential ID: <strong style="color: #0F172A;">${safeCode}</strong>
        </div>
      </div>

      <p style="font-size: 14px; color: #334155; line-height: 1.6;">
        In recognition of your dedication, consistent teamwork, and technical execution, we proudly present your official certificate signed by our founder.
      </p>

      <blockquote style="margin: 20px 0; padding: 14px 18px; border-left: 4px solid #2563EB; background-color: #F8FAFC; font-style: italic; color: #334155; font-size: 13.5px; border-radius: 0 10px 10px 0;">
        &ldquo;Keep learning. Keep building.&rdquo; &mdash; <strong>Adarsh Kolluru</strong>, Founder, EdWorld Co.
      </blockquote>
    `,
    ctaText: "View & Download Official Certificate",
    ctaUrl: certificateUrl,
    footerNote: `This official verified credential was issued to ${safeStudent} for the project "${safeProject}" and dispatched from certificate@edworld.co.in.`,
  });
}

/**
 * Generates branded email for OTP verification
 */
/**
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
    previewText: `Your single-use security verification code is ready. Valid for ${expiry} minutes.`,
    title: "Your EdWorld Verification Code",
    contentHtml: `
      <p style="font-size: 15px; color: #0F172A; line-height: 1.6; margin-top: 0;">
        Hello <strong>${firstName}</strong>,
      </p>
      <p style="font-size: 14px; color: #334155; line-height: 1.6;">
        Use the single-use 6-digit code below to ${safePurpose} on EdWorld Co. This code will expire in <strong>${expiry} minutes</strong>.
      </p>

      <div style="background-color: #F8FAFC; border: 2px solid #E2E8F0; border-radius: 14px; padding: 26px; margin: 28px 0; text-align: center;">
        <div style="font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace; font-size: 11px; font-weight: 800; color: #2563EB; text-transform: uppercase; letter-spacing: 1.5px; margin-bottom: 8px;">
          ✦ ONE-TIME SECURITY CODE
        </div>
        <div style="font-size: 40px; font-weight: 900; font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace; letter-spacing: 12px; color: #0F172A; text-indent: 12px; margin: 12px 0;">
          ${safeOtp}
        </div>
        <div style="font-size: 12px; color: #64748B; font-weight: 500;">
          Expires in ${expiry} minutes &bull; Single-use only
        </div>
      </div>

      <div style="background-color: #FEF3C7; border: 2px solid #F59E0B; border-radius: 10px; padding: 14px 18px; margin: 20px 0;">
        <p style="font-size: 12.5px; color: #92400E; margin: 0; line-height: 1.5;">
          <strong>Security Notice:</strong> Keep this code strictly private. Never share this code with anyone. EdWorld Co. support staff and mentors will never ask for your verification code or password.
        </p>
      </div>

      <p style="font-size: 13px; color: #64748B; line-height: 1.6;">
        If you did not request this verification code, please ignore this email or reach out immediately to our grievance redressal officer at <a href="mailto:edworld.eden@gmail.com" style="color: #2563EB; font-weight: 700; text-decoration: underline;">edworld.eden@gmail.com</a>.
      </p>
    `,
    ctaText: "Open EdWorld Co.",
    ctaUrl: `${appUrl}/auth/login`,
    footerNote: `This automated security notification was sent to ${safeIdentifier} by EdWorld Co.`,
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
    `Hello ${firstName},`,
    "",
    `Use the single-use 6-digit code below to ${purpose} on EdWorld Co.`,
    `This code will expire in ${expiry} minutes.`,
    "",
    "----------------------------------------",
    `ONE-TIME SECURITY CODE: ${params.otp || ""}`,
    `Expires in: ${expiry} minutes`,
    "----------------------------------------",
    "",
    "SECURITY NOTICE: Keep this code strictly private. Never share this code with anyone. EdWorld Co. will never ask for your code.",
    "",
    `Sign in: ${appUrl}/auth/login`,
    "",
    "EdWorld Co. • DPDP Act 2023 Compliant • Student Data Protected"
  ].join("\n");
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
  const url = params.acceptUrl || `${appUrl}/network`;

  return [
    `Hi ${recipient},`,
    "",
    `${requester} sent you a connection request on EdWorld Co.`,
    params.requesterHeadline ? `Role: ${params.requesterHeadline}` : "",
    params.requesterCollegeOrCompany ? `Organization: ${params.requesterCollegeOrCompany}` : "",
    params.message ? `\nNote: "${params.message}"` : "",
    "",
    `Review and manage this request in your Networking hub:`,
    url,
    "",
    "Note: You can review details and choose to accept or decline once signed in.",
    "",
    "EdWorld Co. • DPDP Act 2023 Compliant • Student Data Protected"
  ].filter(Boolean).join("\n");
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
  const url = params.profileUrl || `${appUrl}/network`;

  return [
    `Hi ${recipient},`,
    "",
    `${accepter} accepted your connection request on EdWorld Co.`,
    params.accepterHeadline ? `Headline: ${params.accepterHeadline}` : "",
    "",
    `View your connection and explore their public portfolio:`,
    url,
    "",
    "EdWorld Co. • DPDP Act 2023 Compliant • Student Data Protected"
  ].filter(Boolean).join("\n");
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
  const ctaUrl = params.listingUrl || (params.jobId ? `${appUrl}/jobs/${params.jobId}` : `${appUrl}/jobs`);

  return renderBrandedEmailHtml({
    previewText: `New ${opportunityType} Opportunity: ${safeRole} at ${safeCompany}`,
    title: `New ${opportunityType} Alert: ${safeRole}`,
    isAlert: true,
    alertType: isInternship ? "internship" : "job",
    manageAlertsUrl: params.manageAlertsUrl,
    unsubscribeUrl: params.unsubscribeUrl,
    contentHtml: `
      <p style="font-size: 15px; color: #0F172A; line-height: 1.6; margin-top: 0;">
        Hi <strong>${safeRecipient}</strong>,
      </p>
      <p style="font-size: 14px; color: #334155; line-height: 1.6;">
        A new verified <strong>${opportunityType.toLowerCase()}</strong> matching your career interests was recently posted on EdWorld Co.
      </p>

      <div style="background-color: #F8FAFC; border: 2px solid #E2E8F0; border-radius: 14px; padding: 22px; margin: 24px 0;">
        <div style="font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace; font-size: 11px; font-weight: 800; color: #2563EB; text-transform: uppercase; letter-spacing: 1.5px; margin-bottom: 8px;">
          ✦ VERIFIED ${opportunityType.toUpperCase()} LISTING
        </div>
        <div style="font-size: 20px; font-weight: 900; color: #0F172A; margin: 4px 0;">
          ${safeRole}
        </div>
        <div style="font-size: 14px; font-weight: 700; color: #475569; margin-bottom: 12px;">
          ${safeCompany}
        </div>

        <table width="100%" border="0" cellspacing="0" cellpadding="4" style="font-size: 13px; color: #334155; margin-top: 8px;">
          <tr>
            <td style="width: 100px; color: #64748B; font-weight: 600;">Location:</td>
            <td><strong>${safeLocation}</strong></td>
          </tr>
          ${safeSalary ? `
            <tr>
              <td style="color: #64748B; font-weight: 600;">Compensation:</td>
              <td><strong>${safeSalary}</strong></td>
            </tr>
          ` : ""}
          ${safeDeadline ? `
            <tr>
              <td style="color: #64748B; font-weight: 600;">Deadline:</td>
              <td><strong style="color: #DC2626;">${safeDeadline}</strong></td>
            </tr>
          ` : ""}
        </table>
      </div>

      <p style="font-size: 13px; color: #64748B; line-height: 1.5;">
        You can submit your application using your verified EdWorld profile, Project Studio credentials, and saved resumes.
      </p>
    `,
    ctaText: `View ${opportunityType} & Apply`,
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
  const ctaUrl = params.listingUrl || (params.jobId ? `${appUrl}/jobs/${params.jobId}` : `${appUrl}/jobs`);

  return [
    `Hi ${recipient},`,
    "",
    `New ${opportunityType} Opportunity: ${params.roleTitle || "Software Engineer"}`,
    `Company: ${params.companyName || "Partner Organization"}`,
    `Location: ${params.location || "Remote / Pan India"}`,
    params.salaryRange ? `Compensation: ${params.salaryRange}` : "",
    params.deadline ? `Application Deadline: ${params.deadline}` : "",
    "",
    `View listing and apply:`,
    ctaUrl,
    "",
    `Manage your alert preferences: ${appUrl}/settings/alerts`,
    `Unsubscribe: ${appUrl}/newsletter/unsubscribe`,
    "",
    "EdWorld Co. • DPDP Act 2023 Compliant • Student Data Protected"
  ].filter(Boolean).join("\n");
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
  const ctaUrl = params.eventUrl || (params.eventId ? `${appUrl}/#events` : `${appUrl}/#events`);

  return renderBrandedEmailHtml({
    previewText: `You're invited: ${safeEvent} by ${safeOrganizer}`,
    title: `Event Invitation: ${safeEvent}`,
    isAlert: true,
    alertType: "event",
    manageAlertsUrl: params.manageAlertsUrl,
    unsubscribeUrl: params.unsubscribeUrl,
    contentHtml: `
      <p style="font-size: 15px; color: #0F172A; line-height: 1.6; margin-top: 0;">
        Hi <strong>${safeRecipient}</strong>,
      </p>
      <p style="font-size: 14px; color: #334155; line-height: 1.6;">
        You are invited to participate in <strong>${safeEvent}</strong>, hosted by <strong>${safeOrganizer}</strong>.
      </p>

      <div style="background-color: #F8FAFC; border: 2px solid #E2E8F0; border-radius: 14px; padding: 22px; margin: 24px 0;">
        <div style="font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace; font-size: 11px; font-weight: 800; color: #059669; text-transform: uppercase; letter-spacing: 1.5px; margin-bottom: 8px;">
          ✦ UPCOMING EVENT &bull; LIVE REGISTRATION
        </div>
        <div style="font-size: 20px; font-weight: 900; color: #0F172A; margin: 4px 0;">
          ${safeEvent}
        </div>
        <div style="font-size: 14px; font-weight: 700; color: #475569; margin-bottom: 12px;">
          Organized by ${safeOrganizer}
        </div>

        <table width="100%" border="0" cellspacing="0" cellpadding="4" style="font-size: 13px; color: #334155; margin-top: 8px;">
          <tr>
            <td style="width: 100px; color: #64748B; font-weight: 600;">Date &amp; Time:</td>
            <td><strong>${safeDate} (${safeTimeZone})</strong></td>
          </tr>
          <tr>
            <td style="color: #64748B; font-weight: 600;">Venue / Mode:</td>
            <td><strong>${safeLocation}</strong></td>
          </tr>
        </table>

        ${safeDesc ? `
          <div style="margin-top: 14px; padding-top: 12px; border-top: 1px dashed #CBD5E1; font-size: 13px; color: #475569; line-height: 1.5;">
            ${safeDesc}
          </div>
        ` : ""}
      </div>

      <p style="font-size: 13px; color: #64748B; line-height: 1.5;">
        Save your spot early to receive live session links, calendar invites, and team matchmaking opportunities.
      </p>
    `,
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
  const ctaUrl = params.eventUrl || (params.eventId ? `${appUrl}/#events` : `${appUrl}/#events`);

  return [
    `Hi ${recipient},`,
    "",
    `You are invited to: ${params.eventName || "EdWorld Tech Summit"}`,
    `Organizer: ${params.organizer || "EdWorld Co."}`,
    `Date: ${params.date || "Upcoming"} (${params.timeZone || "IST (UTC+05:30)"})`,
    `Venue / Mode: ${params.locationOrOnline || "Online Live Session"}`,
    params.description ? `\nDetails: ${params.description}` : "",
    "",
    `View event and register:`,
    ctaUrl,
    "",
    `Manage alert preferences: ${appUrl}/settings/alerts`,
    `Unsubscribe: ${appUrl}/newsletter/unsubscribe`,
    "",
    "EdWorld Co. • DPDP Act 2023 Compliant • Student Data Protected"
  ].filter(Boolean).join("\n");
}
