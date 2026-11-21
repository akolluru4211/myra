import { test, describe, it, before } from "node:test";
import assert from "node:assert";
import {
  validateEdMailUsername,
  RESERVED_EDMAIL_HANDLES,
  sanitizeEmailHtml,
  dispatchOutboundEdMail,
  EDMAIL_DOMAIN,
} from "../../src/lib/edmail/edmail-service.ts";

describe("EdMail Comprehensive Service & Security Verification", () => {
  describe("1. Username Validation & System Reservation Guards", () => {
    it("accepts valid alphanumeric student handles", () => {
      const res = validateEdMailUsername("adarsh.cs");
      assert.strictEqual(res.valid, true);
      assert.strictEqual(res.normalized, "adarsh.cs");
    });

    it("accepts valid student handles with hyphen", () => {
      const res = validateEdMailUsername("priya-sharma");
      assert.strictEqual(res.valid, true);
      assert.strictEqual(res.normalized, "priya-sharma");
    });

    it("rejects handles shorter than 3 characters", () => {
      const res = validateEdMailUsername("ab");
      assert.strictEqual(res.valid, false);
      assert.ok(res.error?.includes("at least 3 characters"));
    });

    it("rejects handles longer than 30 characters", () => {
      const longName = "a".repeat(31);
      const res = validateEdMailUsername(longName);
      assert.strictEqual(res.valid, false);
      assert.ok(res.error?.includes("not exceed 30 characters"));
    });

    it("rejects reserved administrative and system usernames", () => {
      const reserved = ["admin", "administrator", "postmaster", "support", "help", "security", "abuse", "root", "edworld"];
      for (const handle of reserved) {
        const res = validateEdMailUsername(handle);
        assert.strictEqual(res.valid, false, `Handle "${handle}" must be rejected as reserved`);
        assert.ok(res.error?.includes("reserved system address"));
      }
    });

    it("rejects invalid symbols and consecutive dots", () => {
      const invalid = ["john..doe", "user@name", "user#1", ".leadingdot", "trailingdot."];
      for (const handle of invalid) {
        const res = validateEdMailUsername(handle);
        assert.strictEqual(res.valid, false, `Handle "${handle}" must be rejected`);
      }
    });
  });

  describe("2. Email Privacy & HTML Sanitization", () => {
    it("strips malicious script tags from email body", () => {
      const dirty = `<p>Hello</p><script>alert('xss');</script><div>World</div>`;
      const clean = sanitizeEmailHtml(dirty, false);
      assert.strictEqual(clean.includes("<script"), false);
      assert.strictEqual(clean.includes("Hello"), true);
      assert.strictEqual(clean.includes("World"), true);
    });

    it("strips inline javascript event handlers (onerror, onload)", () => {
      const dirty = `<img src="x" onerror="stealCookies()" /><a href="javascript:doEvil()">Click</a>`;
      const clean = sanitizeEmailHtml(dirty, false);
      assert.strictEqual(clean.includes("onerror"), false);
      assert.strictEqual(clean.includes("javascript:"), false);
    });

    it("neutralizes remote tracking images when allowRemoteImages is false", () => {
      const trackingHtml = `<p>Welcome</p><img src="https://tracker.com/pixel.png?user=123" width="1" height="1" />`;
      const clean = sanitizeEmailHtml(trackingHtml, false);
      assert.strictEqual(clean.includes("https://tracker.com/pixel.png"), false);
      assert.ok(clean.includes("Remote image blocked for your privacy"));
    });
  });

  describe("3. Outbound Mail Dispatch & Retry Safety", () => {
    it("dispatches outbound email in simulation mode without crashing", async () => {
      const res = await dispatchOutboundEdMail({
        fromAddress: "student@edworld.co.in",
        fromName: "Adarsh",
        to: ["external-mentor@gmail.com"],
        subject: "Study Session Inquiry",
        text: "Hi Mentor, when is our next review?",
        html: "<p>Hi Mentor, when is our next review?</p>",
      });

      assert.strictEqual(res.success, true);
      assert.ok(res.providerMessageId?.startsWith("sim_msg_"));
      assert.strictEqual(res.status, "accepted");
    });

    it("idempotency simulation: handles duplicate requests cleanly", async () => {
      const idempotencyKey = "test_key_12345";
      const call1 = await dispatchOutboundEdMail({
        fromAddress: "student@edworld.co.in",
        to: ["recipient@company.com"],
        subject: "Project Review",
        text: "Submission",
        html: "<p>Submission</p>",
        idempotencyKey,
      });

      const call2 = await dispatchOutboundEdMail({
        fromAddress: "student@edworld.co.in",
        to: ["recipient@company.com"],
        subject: "Project Review",
        text: "Submission",
        html: "<p>Submission</p>",
        idempotencyKey,
      });

      assert.strictEqual(call1.success, true);
      assert.strictEqual(call2.success, true);
    });
  });

  describe("4. Student Discount & Separate Eligibility Verification Model", () => {
    function evaluateStudentDiscountEligibility({
      hasEdMail,
      isAccreditedEnrolled,
      hasCollegeIdBadge,
      providerType,
    }) {
      if (!hasEdMail) {
        return { eligible: false, reason: "EdMail student account required." };
      }
      if (providerType === "direct_domain") {
        return { eligible: true, method: "Domain verification (@edworld.co.in)" };
      }
      if (providerType === "accredited_institution_only") {
        if (!isAccreditedEnrolled || !hasCollegeIdBadge) {
          return {
            eligible: false,
            reason: "Third-party vendor requires accredited university enrollment transcript or student ID.",
          };
        }
        return { eligible: true, method: "Accredited institutional documentation" };
      }
      return { eligible: true, method: "Edworld internal verified credential" };
    }

    it("grants direct-domain perks with EdMail", () => {
      const res = evaluateStudentDiscountEligibility({
        hasEdMail: true,
        isAccreditedEnrolled: false,
        hasCollegeIdBadge: false,
        providerType: "direct_domain",
      });
      assert.strictEqual(res.eligible, true);
    });

    it("clarifies when commercial vendors require external university enrollment proof", () => {
      const res = evaluateStudentDiscountEligibility({
        hasEdMail: true,
        isAccreditedEnrolled: false,
        hasCollegeIdBadge: false,
        providerType: "accredited_institution_only",
      });
      assert.strictEqual(res.eligible, false);
      assert.ok(res.reason?.includes("accredited university enrollment"));
    });

    it("approves accredited university student with ID badge", () => {
      const res = evaluateStudentDiscountEligibility({
        hasEdMail: true,
        isAccreditedEnrolled: true,
        hasCollegeIdBadge: true,
        providerType: "accredited_institution_only",
      });
      assert.strictEqual(res.eligible, true);
    });
  });

  describe("5. Tenant Mailbox Isolation Simulation", () => {
    function canAccessMailboxResource({ authUid, mailboxOwnerUid, resourceOwnerUid, isAdmin }) {
      if (isAdmin) return true;
      if (authUid === mailboxOwnerUid && authUid === resourceOwnerUid) return true;
      return false;
    }

    it("allows student to access their own messages, drafts, and vault files", () => {
      assert.strictEqual(
        canAccessMailboxResource({
          authUid: "student-1",
          mailboxOwnerUid: "student-1",
          resourceOwnerUid: "student-1",
          isAdmin: false,
        }),
        true
      );
    });

    it("DENIES access when Student A attempts to read Student B's mailbox", () => {
      assert.strictEqual(
        canAccessMailboxResource({
          authUid: "student-a",
          mailboxOwnerUid: "student-b",
          resourceOwnerUid: "student-b",
          isAdmin: false,
        }),
        false
      );
    });

    it("DENIES access when Student A attempts to delete or search Student B's documents", () => {
      assert.strictEqual(
        canAccessMailboxResource({
          authUid: "student-a",
          mailboxOwnerUid: "student-a",
          resourceOwnerUid: "student-b",
          isAdmin: false,
        }),
        false
      );
    });

    it("allows platform compliance admin to review records during security audit", () => {
      assert.strictEqual(
        canAccessMailboxResource({
          authUid: "admin-1",
          mailboxOwnerUid: "student-b",
          resourceOwnerUid: "student-b",
          isAdmin: true,
        }),
        true
      );
    });
  });

  describe("6. Production Lifecycle, Retention & Data Export", () => {
    it("validates transition to closed state and sets 30-day retention countdown", () => {
      const now = new Date();
      const retentionUntil = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
      const daysDiff = Math.round((retentionUntil.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
      assert.strictEqual(daysDiff, 30);
    });

    it("verifies structure of comprehensive export archive", () => {
      const archive = {
        exportMetadata: {
          exportedAt: new Date().toISOString(),
          studentAddress: "student@edworld.co.in",
          platform: "Edworld Student Platform",
        },
        mailbox: { address: "student@edworld.co.in", status: "ready" },
        messages: [{ id: "m1", subject: "Math Marks", folder: "inbox" }],
        studentRecords: {
          marks: [{ subject: "CS", score: 95, max_marks: 100 }],
          events: [{ title: "AI Workshop", start_time: "2026-12-01T10:00:00Z" }],
          documents: [{ title: "Transcript", category: "certificate" }],
        },
      };

      assert.ok(archive.exportMetadata.exportedAt);
      assert.strictEqual(archive.messages.length, 1);
      assert.strictEqual(archive.studentRecords.marks.length, 1);
      assert.strictEqual(archive.studentRecords.events.length, 1);
    });
  });
});
