import assert from "node:assert/strict";
import test, { describe, it } from "node:test";
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
  renderEventInvitationText,
  escapeHtml,
  validateUrl,
} from "../../src/lib/email-templates.ts";
import {
  sendOtpVerificationEmail,
  sendConnectionRequestNotification,
  sendConnectionAcceptedNotification,
  sendJobAlertEmail,
  sendEventInvitationEmail,
} from "../../src/lib/email-service.ts";

describe("EdWorld Email Template Pack Integration & Invariant Tests", () => {
  const sampleData = {
    otp: {
      otp: "948201",
      purpose: "signup",
      expiresMinutes: 5,
      studentName: "Adarsh Kolluru",
      identifier: "student.test@edworld.test",
    },
    connReq: {
      recipientName: "Adarsh Kolluru",
      recipientEmail: "adarsh@edworld.test",
      requesterName: "Dr. Ananya Sharma",
      requesterHeadline: "Senior Lead AI Researcher at Microsoft",
      requesterCollegeOrCompany: "Microsoft Hyderabad",
      message: "Loved your open-source EdBuild project on real-time proctoring!",
      acceptUrl: "https://edworld.co.in/network",
    },
    connAcc: {
      recipientName: "Adarsh Kolluru",
      requesterEmail: "adarsh@edworld.test",
      accepterName: "Rohit Verma",
      accepterHeadline: "Incoming Software Engineer at Google",
      accepterCollegeOrCompany: "IIT Bombay",
      profileUrl: "https://edworld.co.in/u/rohitv/portfolio",
    },
    jobAlert: {
      recipientName: "Adarsh",
      roleTitle: "Next.js / Full-Stack Engineer Intern",
      companyName: "Acme Corp Bangalore",
      location: "Bengaluru, Karnataka (Hybrid)",
      type: "internship",
      deadline: "December 15, 2026",
      salaryRange: "₹35,000 / month",
      jobId: "job_94829",
      listingUrl: "https://edworld.co.in/jobs/job_94829",
    },
    eventInvitation: {
      recipientName: "Adarsh",
      eventName: "Smart India Hackathon 2026 Kickoff & Generative AI Sprint",
      organizer: "EdWorld Co. & Google Cloud",
      date: "Saturday, Dec 5, 2026 at 10:00 AM",
      timeZone: "IST (UTC+05:30)",
      locationOrOnline: "Online Live Stream & Discord Squad Rooms",
      description: "Build generative AI copilot solutions for regional education in India.",
      eventId: "sih_2026",
      eventUrl: "https://edworld.co.in/#events",
    },
  };

  describe("1. OTP Verification Email & Text Fallback", () => {
    it("renders prominent code, actual expiry, and security disclaimer", () => {
      const html = renderOtpVerificationEmail(sampleData.otp);
      const text = renderOtpVerificationText(sampleData.otp);

      // Invariants: code is prominent in HTML body
      assert.ok(html.includes("948201"));
      assert.ok(html.includes("Expires in 5 minutes"));
      assert.ok(html.includes("Keep this code strictly private"));

      // Code must NOT leak into the subject or preheader
      assert.equal(html.includes("previewText:"), false);
      assert.equal(/<title>[^<]*948201[^<]*<\/title>/i.test(html), false);

      // Text version contains code, expiry, and security notice
      assert.ok(text.includes("ONE-TIME SECURITY CODE: 948201"));
      assert.ok(text.includes("Expires in: 5 minutes"));
      assert.ok(text.includes("Keep this code strictly private"));
    });
  });

  describe("2. Connection Request Received Email & Text Fallback", () => {
    it("shows requester details and safe Review Request CTA linking to Networking", () => {
      const html = renderConnectionRequestReceivedEmail(sampleData.connReq);
      const text = renderConnectionRequestText(sampleData.connReq);

      assert.ok(html.includes("Dr. Ananya Sharma"));
      assert.ok(html.includes("Senior Lead AI Researcher at Microsoft"));
      assert.ok(html.includes("Microsoft Hyderabad"));
      assert.ok(html.includes("Loved your open-source EdBuild project"));
      assert.ok(html.includes("Review &amp; Respond to Request") || html.includes("Review & Respond to Request"));
      assert.ok(html.includes("https://edworld.co.in/network"));

      assert.ok(text.includes("Dr. Ananya Sharma sent you a connection request"));
      assert.ok(text.includes("https://edworld.co.in/network"));
      assert.ok(text.includes("choose to accept or decline once signed in"));
    });

    it("handles missing optional message and company gracefully", () => {
      const html = renderConnectionRequestReceivedEmail({
        recipientName: "Test User",
        requesterName: "Peer",
      });
      assert.ok(html.includes("Peer"));
      assert.ok(html.includes("New Connection Request"));
      assert.ok(!html.includes("undefined"));
    });
  });

  describe("3. Connection Request Accepted Email & Text Fallback", () => {
    it("shows who accepted and provides View Connection button", () => {
      const html = renderConnectionAcceptedEmail(sampleData.connAcc);
      const text = renderConnectionAcceptedText(sampleData.connAcc);

      assert.ok(html.includes("Rohit Verma"));
      assert.ok(html.includes("Incoming Software Engineer at Google"));
      assert.ok(html.includes("View Network &amp; Profile") || html.includes("View Network & Profile"));
      assert.ok(html.includes("https://edworld.co.in/u/rohitv/portfolio"));

      assert.ok(text.includes("Rohit Verma accepted your connection request"));
      assert.ok(text.includes("https://edworld.co.in/u/rohitv/portfolio"));
    });
  });

  describe("4. Job / Internship Alert Email & Text Fallback", () => {
    it("shows role, employer, location, compensation, and deadline", () => {
      const html = renderJobAlertEmail(sampleData.jobAlert);
      const text = renderJobAlertText(sampleData.jobAlert);

      assert.ok(html.includes("Next.js / Full-Stack Engineer Intern"));
      assert.ok(html.includes("Acme Corp Bangalore"));
      assert.ok(html.includes("Bengaluru, Karnataka (Hybrid)"));
      assert.ok(html.includes("December 15, 2026"));
      assert.ok(html.includes("₹35,000 / month"));
      assert.ok(html.includes("View Internship &amp; Apply") || html.includes("View Internship & Apply"));
      assert.ok(html.includes("Manage alerts"));
      assert.ok(html.includes("Unsubscribe from alerts"));

      assert.ok(text.includes("New Internship Opportunity: Next.js / Full-Stack Engineer Intern"));
      assert.ok(text.includes("Acme Corp Bangalore"));
      assert.ok(text.includes("Application Deadline: December 15, 2026"));
      assert.ok(text.includes("/settings/alerts"));
      assert.ok(text.includes("/newsletter/unsubscribe"));
    });

    it("renders cleanly without optional deadline and compensation", () => {
      const html = renderJobAlertEmail({
        roleTitle: "Backend Developer",
        companyName: "Infosys",
      });
      assert.ok(html.includes("Backend Developer"));
      assert.ok(html.includes("Infosys"));
      assert.ok(!html.includes("undefined"));
    });
  });

  describe("5. Event Invitation Email & Text Fallback", () => {
    it("shows event name, date, time zone, location, and registration button", () => {
      const html = renderEventInvitationEmail(sampleData.eventInvitation);
      const text = renderEventInvitationText(sampleData.eventInvitation);

      assert.ok(html.includes("Smart India Hackathon 2026 Kickoff &amp; Generative AI Sprint"));
      assert.ok(html.includes("EdWorld Co. &amp; Google Cloud"));
      assert.ok(html.includes("Saturday, Dec 5, 2026 at 10:00 AM"));
      assert.ok(html.includes("IST (UTC+05:30)"));
      assert.ok(html.includes("Online Live Stream &amp; Discord Squad Rooms"));
      assert.ok(html.includes("View Event &amp; Register") || html.includes("View Event & Register"));
      assert.ok(html.includes("Manage alerts"));
      assert.ok(html.includes("Unsubscribe from alerts"));

      assert.ok(text.includes("You are invited to: Smart India Hackathon 2026 Kickoff & Generative AI Sprint"));
      assert.ok(text.includes("Date: Saturday, Dec 5, 2026 at 10:00 AM (IST (UTC+05:30))"));
      assert.ok(text.includes("/settings/alerts"));
    });
  });

  describe("6. Responsive Desktop & Mobile Media Queries & Zero-Image Broken State", () => {
    it("includes viewport meta tag and max-width 600px mobile styles", () => {
      const html = renderBrandedEmailHtml({
        previewText: "Preview",
        title: "Test",
        contentHtml: "<p>Hello</p>",
      });

      assert.ok(html.includes('meta name="viewport" content="width=device-width, initial-scale=1.0"'));
      assert.ok(html.includes("@media only screen and (max-width: 600px)"));
      assert.ok(html.includes(".cta-button {"));
      assert.ok(html.includes("display: block !important;"));
      assert.ok(html.includes("width: 100% !important;"));
    });

    it("uses bulletproof CSS monogram badge avoiding broken image placeholders", () => {
      const html = renderBrandedEmailHtml({
        previewText: "Test",
        title: "Test",
        contentHtml: "<p>Test</p>",
      });

      assert.ok(html.includes("monogram-badge"));
      assert.ok(html.includes('E<span style="color: #059669;">.</span>'));
      assert.ok(html.includes("EdWorld <span style=\"color: #059669;\">Co.</span>"));
      assert.equal(/<img\b/i.test(html), false);
    });
  });

  describe("7. Safe URL Validation & Dynamic Content Escaping", () => {
    it("escapes hostile script injection in dynamic fields", () => {
      const malicious = '<script>alert("xss")</script>&"\'';
      const escaped = escapeHtml(malicious);
      assert.equal(escaped.includes("<script>"), false);
      assert.ok(escaped.includes("&lt;script&gt;"));
      assert.ok(escaped.includes("&amp;"));
      assert.ok(escaped.includes("&quot;"));
      assert.ok(escaped.includes("&#39;"));
    });

    it("validates and forces verified URLs for CTAs", () => {
      assert.equal(validateUrl("https://edworld.co.in/jobs/1"), "https://edworld.co.in/jobs/1");
      assert.equal(validateUrl("/network"), "https://edworld.co.in/network");
      assert.equal(validateUrl(null, "/auth/login"), "https://edworld.co.in/auth/login");
    });
  });

  describe("8. Notification Preferences & Dispatch Simulation", () => {
    it("dispatches job alert when enabled", async () => {
      const res = await sendJobAlertEmail({
        email: "test.student@edworld.test",
        roleTitle: "React Engineer",
        companyName: "Startup Inc",
      });
      assert.equal(res.success, true);
    });

    it("dispatches event invitation when enabled", async () => {
      const res = await sendEventInvitationEmail({
        email: "test.student@edworld.test",
        eventName: "AI Hackathon",
      });
      assert.equal(res.success, true);
    });

    it("dispatches OTP verification email independently of optional alert preferences", async () => {
      const res = await sendOtpVerificationEmail({
        email: "test.student@edworld.test",
        otp: "123456",
        purpose: "signup",
      });
      assert.equal(res.success, true);
    });
  });
});
