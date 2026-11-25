import fs from 'node:fs';
import path from 'node:path';
import {
  renderBrandedEmailHtml,
  renderOtpVerificationEmail,
  renderOtpVerificationText,
  renderConnectionRequestReceivedEmail,
  renderConnectionRequestText,
  renderConnectionAcceptedEmail,
  renderConnectionAcceptedText,
  renderJobAlertEmail,
  renderJobAlertText,
  renderEventInvitationEmail,
  renderEventInvitationText
} from '../src/lib/email-templates.ts';

const outDir = path.resolve('public/email-previews');
if (!fs.existsSync(outDir)) {
  fs.mkdirSync(outDir, { recursive: true });
}

// 1. OTP Verification
const otpData = {
  otp: '849201',
  purpose: 'login',
  expiresMinutes: 5,
  identifier: 'student@edworld.co.in',
  studentName: 'Aarav Patel'
};
fs.writeFileSync(path.join(outDir, '1-otp-verification.html'), renderOtpVerificationEmail(otpData));
fs.writeFileSync(path.join(outDir, '1-otp-verification.txt'), renderOtpVerificationText(otpData));
fs.writeFileSync(path.join(outDir, 'verification-email.html'), renderOtpVerificationEmail(otpData));

// 2. Connection Request
const connReqData = {
  recipientName: 'Aarav Patel',
  requesterName: 'Priya Iyer',
  requesterHeadline: 'Product Design Lead at Swiggy',
  requesterCollegeOrCompany: 'BITS Pilani Alumni',
  message: 'Hi Aarav, saw your EdBuild system design project. Would love to connect and exchange notes!',
  acceptUrl: 'https://edworld.co.in/network'
};
fs.writeFileSync(path.join(outDir, '2-connection-request.html'), renderConnectionRequestReceivedEmail(connReqData));
fs.writeFileSync(path.join(outDir, '2-connection-request.txt'), renderConnectionRequestText(connReqData));

// 3. Connection Accepted
const connAccData = {
  recipientName: 'Aarav Patel',
  accepterName: 'Priya Iyer',
  accepterHeadline: 'Product Design Lead at Swiggy',
  profileUrl: 'https://edworld.co.in/u/priyai/portfolio'
};
fs.writeFileSync(path.join(outDir, '3-connection-accepted.html'), renderConnectionAcceptedEmail(connAccData));
fs.writeFileSync(path.join(outDir, '3-connection-accepted.txt'), renderConnectionAcceptedText(connAccData));

// 4. Job / Internship Alert
const jobAlertData = {
  recipientName: 'Aarav',
  roleTitle: 'Frontend Engineering Intern (React / Next.js)',
  companyName: 'Razorpay',
  location: 'Bengaluru, India (Hybrid)',
  type: 'internship',
  deadline: 'Dec 20, 2026',
  salaryRange: '₹40,000 / month',
  jobId: 'rzp_intern_2026',
  listingUrl: 'https://edworld.co.in/jobs/rzp_intern_2026'
};
fs.writeFileSync(path.join(outDir, '4-job-alert.html'), renderJobAlertEmail(jobAlertData));
fs.writeFileSync(path.join(outDir, '4-job-alert.txt'), renderJobAlertText(jobAlertData));

// 5. Event Invitation
const eventData = {
  recipientName: 'Aarav',
  eventName: 'Google Cloud Generative AI Winter Hackathon 2026',
  organizer: 'EdWorld Co. & Google Cloud India',
  date: 'Saturday, Dec 12, 2026 at 9:30 AM',
  timeZone: 'IST (UTC+05:30)',
  locationOrOnline: 'Online Live Stream & Virtual Squads',
  description: '48-hour buildathon with mentorship from top engineers, cash prizes, and Cloud credits.',
  eventId: 'gc_winter_2026',
  eventUrl: 'https://edworld.co.in/#events'
};
fs.writeFileSync(path.join(outDir, '5-event-invitation.html'), renderEventInvitationEmail(eventData));
fs.writeFileSync(path.join(outDir, '5-event-invitation.txt'), renderEventInvitationText(eventData));

// 6. Community Announcement
const announcementHtml = renderBrandedEmailHtml({
  previewText: 'Announcing EdWorld Co. Winter Mentorship Cohort 2026',
  title: 'Winter Mentorship Cohort 2026 is Live',
  contentHtml: `
    <div style="color: #334155;">
      <p style="margin: 0 0 16px; font-size: 15px; line-height: 1.65; color: #334155;">
        We are thrilled to announce the opening of applications for our 2026 Winter Mentorship Cohort.
      </p>
      <p style="margin: 0 0 16px; font-size: 15px; line-height: 1.65; color: #334155;">
        Selected students will be paired with industry mentors from top engineering organizations, participate in weekly mock interviews, and collaborate on open-source projects.
      </p>
      <p style="margin: 0 0 16px; font-size: 15px; line-height: 1.65; color: #334155;">
        Spots are limited to ensure high-touch guidance. Review the curriculum and apply through your dashboard today.
      </p>
    </div>
  `,
  ctaText: 'Apply for Cohort',
  ctaUrl: 'https://edworld.co.in/dashboard',
  footerNote: 'You received this official community broadcast as a registered member of EdWorld Co.'
});
fs.writeFileSync(path.join(outDir, 'community-announcement.html'), announcementHtml);

console.log('All HTML and TXT email previews successfully generated in public/email-previews/');
