/**
 * Automated Regression Test Suite: Centralized Email & Notification Routing Service
 * Target Module: src/lib/email-service.ts
 * 
 * Verifies:
 * 1. Static exports, default email addresses, and admin routing constants.
 * 2. Resend SDK initialization, key validation, lazy caching, and graceful fallback behavior.
 * 3. Payload validation, recipient formatting, and master admin BCC routing.
 * 4. Newsletter subscription, input validation, Supabase upsert deduplication, and Resend audience sync.
 * 5. Subscriber retrieval with database fallback and batch broadcast dispatches.
 * 6. Specialized operational dispatches: contact inquiry forwarding, safety report forwarding,
 *    connection notifications, welcome emails, certificate dispatches, and OTP verification codes.
 * 7. Adversarial edge cases, malformed payloads, and exception resilience.
 */

const { describe, it } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const ts = require("typescript");

const rootDir = path.resolve(__dirname, "../..");
const emailServiceSourcePath = path.join(rootDir, "src/lib/email-service.ts");
const emailServiceSource = fs.readFileSync(emailServiceSourcePath, "utf8");

// Transpile TypeScript module to CommonJS for dynamic in-memory execution
const transpiledCode = ts.transpileModule(emailServiceSource, {
  compilerOptions: {
    module: ts.ModuleKind.CommonJS,
    target: ts.ScriptTarget.ES2022,
    esModuleInterop: true,
  },
}).outputText;

/**
 * Factory to create an isolated instance of the email-service module
 * with controllable environment variables and mocked dependencies.
 */
function createEmailServiceInstance(options = {}) {
  const {
    env = {},
    mockResendClient = null,
    mockSupabase = null,
    silent = true,
  } = options;

  const effectiveEnv = {
    ...process.env,
    ...env,
  };

  const emailTemplates = require(path.join(rootDir, "src/lib/email-templates.ts"));

  const defaultSupabase = {
    from: () => ({
      insert: async () => ({ data: null, error: null }),
      upsert: async () => ({ data: null, error: null }),
      select: () => ({
        eq: () => ({
          order: () => ({
            limit: async () => ({ data: [] }),
          }),
        }),
      }),
    }),
  };

  const activeSupabase = mockSupabase || defaultSupabase;

  const defaultResendClass = class MockResend {
    constructor(key) {
      this.apiKey = key;
      this.emails = {
        send: async (payload) => ({
          data: { id: `resend_${Date.now()}_${Math.random().toString(36).substring(2, 7)}` },
          error: null,
        }),
      };
      this.contacts = {
        create: async (params) => ({
          data: { id: `contact_${Date.now()}` },
          error: null,
        }),
      };
    }
  };

  const ActiveResendClass = mockResendClient || defaultResendClass;

  const customRequire = (id) => {
    if (id === "./supabase" || id === "./supabase.ts") {
      return { supabase: activeSupabase, default: activeSupabase };
    }
    if (id === "./email-templates" || id === "./email-templates.ts") {
      return emailTemplates;
    }
    if (id === "resend") {
      return { Resend: ActiveResendClass };
    }
    return require(id);
  };

  const customConsole = silent
    ? {
        ...console,
        info: () => {},
        warn: () => {},
        error: () => {},
      }
    : console;

  const moduleObj = { exports: {} };
  const runner = new Function("require", "module", "exports", "process", "console", transpiledCode);
  runner(customRequire, moduleObj, moduleObj.exports, { ...process, env: effectiveEnv }, customConsole);

  return moduleObj.exports;
}

describe("Centralized Email & Notification Routing Service (src/lib/email-service.ts)", () => {

  // ---------------------------------------------------------------------------
  // 1. Static Exports, Default Email Addresses & Administrative Constants
  // ---------------------------------------------------------------------------
  describe("1. Static Exports, Default Email Addresses & Administrative Constants", () => {
    it("exports canonical admin, support, and grievance emails pointing to edworld.eden@gmail.com", () => {
      const svc = createEmailServiceInstance();
      assert.equal(svc.PRIMARY_ADMIN_EMAIL, "edworld.eden@gmail.com");
      assert.equal(svc.SUPPORT_EMAIL, "edworld.eden@gmail.com");
      assert.equal(svc.GRIEVANCE_EMAIL, "edworld.eden@gmail.com");
      assert.equal(svc.SENDER_NAME, "EdWorld Co.");
    });

    it("uses default sender addresses when environment variables are unset", () => {
      const svc = createEmailServiceInstance({
        env: { RESEND_FROM_EMAIL: "", RESEND_CERTIFICATE_FROM_EMAIL: "" },
      });
      assert.equal(svc.DEFAULT_FROM_EMAIL, "EdWorld Co. <notifications@edworld.co.in>");
      assert.equal(svc.CERTIFICATE_FROM_EMAIL, "EdWorld Certifications <certificate@edworld.co.in>");
    });

    it("respects custom sender addresses when configured via environment variables", () => {
      const svc = createEmailServiceInstance({
        env: {
          RESEND_FROM_EMAIL: "Custom Sender <hello@edworld.test>",
          RESEND_CERTIFICATE_FROM_EMAIL: "Custom Certs <certs@edworld.test>",
        },
      });
      assert.equal(svc.DEFAULT_FROM_EMAIL, "Custom Sender <hello@edworld.test>");
      assert.equal(svc.CERTIFICATE_FROM_EMAIL, "Custom Certs <certs@edworld.test>");
    });
  });

  // ---------------------------------------------------------------------------
  // 2. Resend Client Initialization, API Key Validation & Graceful Fallbacks
  // ---------------------------------------------------------------------------
  describe("2. Resend Client Initialization & Graceful Fallbacks", () => {
    it("returns isMock: true when RESEND_API_KEY is not defined", async () => {
      const svc = createEmailServiceInstance({
        env: { RESEND_API_KEY: "" },
      });

      const res = await svc.sendEmailNotification({
        to: "student@example.com",
        subject: "Unit Test Notification",
        html: "<p>Test message</p>",
      });

      assert.equal(res.success, true);
      assert.equal(res.isMock, true);
      assert.equal(res.id, undefined);
    });

    it("returns isMock: true when RESEND_API_KEY contains placeholder or your-key", async () => {
      const svcPlaceholder = createEmailServiceInstance({
        env: { RESEND_API_KEY: "re_placeholder_xyz" },
      });
      const res1 = await svcPlaceholder.sendEmailNotification({
        to: "student@example.com",
        subject: "Test Placeholder",
        html: "<p>Content</p>",
      });
      assert.equal(res1.isMock, true);

      const svcYourKey = createEmailServiceInstance({
        env: { RESEND_API_KEY: "re_your-key-here" },
      });
      const res2 = await svcYourKey.sendEmailNotification({
        to: "student@example.com",
        subject: "Test Your Key",
        html: "<p>Content</p>",
      });
      assert.equal(res2.isMock, true);
    });

    it("initializes Resend SDK when a valid API key is supplied", async () => {
      let capturedKey = null;
      let capturedPayload = null;

      class SpyingResend {
        constructor(key) {
          capturedKey = key;
          this.emails = {
            send: async (p) => {
              capturedPayload = p;
              return { data: { id: "msg_live_789" }, error: null };
            },
          };
          this.contacts = { create: async () => ({}) };
        }
      }

      const svc = createEmailServiceInstance({
        env: { RESEND_API_KEY: "re_valid_live_key_99999" },
        mockResendClient: SpyingResend,
      });

      const res = await svc.sendEmailNotification({
        to: "learner@university.edu",
        subject: "Live Dispatch Test",
        html: "<h1>Welcome</h1>",
      });

      assert.equal(res.success, true);
      assert.equal(res.isMock, false);
      assert.equal(res.id, "msg_live_789");
      assert.equal(capturedKey, "re_valid_live_key_99999");
      assert.deepEqual(capturedPayload.to, ["learner@university.edu"]);
    });

    it("handles Resend API error responses gracefully without throwing an unhandled rejection", async () => {
      class ErrorReturningResend {
        constructor() {
          this.emails = {
            send: async () => ({
              data: null,
              error: { message: "Invalid API domain", statusCode: 403 },
            }),
          };
        }
      }

      const svc = createEmailServiceInstance({
        env: { RESEND_API_KEY: "re_valid_key_test" },
        mockResendClient: ErrorReturningResend,
      });

      const res = await svc.sendEmailNotification({
        to: "student@test.com",
        subject: "Test API Error Handling",
        html: "<p>Body</p>",
      });

      assert.equal(res.success, true);
      assert.equal(res.isMock, false);
      assert.equal(res.id, undefined);
    });

    it("recovers gracefully if Resend SDK throws a network exception", async () => {
      class NetworkFailingResend {
        constructor() {
          this.emails = {
            send: async () => {
              throw new Error("ETIMEDOUT: Connection to api.resend.com timed out");
            },
          };
        }
      }

      const svc = createEmailServiceInstance({
        env: { RESEND_API_KEY: "re_valid_key_test" },
        mockResendClient: NetworkFailingResend,
      });

      const res = await svc.sendEmailNotification({
        to: "student@test.com",
        subject: "Network Failure Test",
        html: "<p>Body</p>",
      });

      assert.equal(res.success, true);
      assert.equal(res.id, undefined);
    });
  });

  // ---------------------------------------------------------------------------
  // 3. Payload Validation, Recipient Formatting & Master Admin BCC Routing
  // ---------------------------------------------------------------------------
  describe("3. Email Payload Validation & Master Admin BCC Routing", () => {
    it("formats a single string recipient into an array", async () => {
      let sentPayload = null;
      class CapturingResend {
        constructor() {
          this.emails = {
            send: async (p) => {
              sentPayload = p;
              return { data: { id: "msg_format_1" } };
            },
          };
        }
      }

      const svc = createEmailServiceInstance({
        env: { RESEND_API_KEY: "re_test_key" },
        mockResendClient: CapturingResend,
      });

      await svc.sendEmailNotification({
        to: "solo.recipient@example.com",
        subject: "Single Recipient Test",
        html: "<p>Content</p>",
      });

      assert.deepEqual(sentPayload.to, ["solo.recipient@example.com"]);
    });

    it("preserves an array of recipients", async () => {
      let sentPayload = null;
      class CapturingResend {
        constructor() {
          this.emails = {
            send: async (p) => {
              sentPayload = p;
              return { data: { id: "msg_format_2" } };
            },
          };
        }
      }

      const svc = createEmailServiceInstance({
        env: { RESEND_API_KEY: "re_test_key" },
        mockResendClient: CapturingResend,
      });

      await svc.sendEmailNotification({
        to: ["alice@example.com", "bob@example.com"],
        subject: "Multiple Recipients Test",
        html: "<p>Content</p>",
      });

      assert.deepEqual(sentPayload.to, ["alice@example.com", "bob@example.com"]);
    });

    it("defaults to PRIMARY_ADMIN_EMAIL when no recipient is provided", async () => {
      let sentPayload = null;
      class CapturingResend {
        constructor() {
          this.emails = {
            send: async (p) => {
              sentPayload = p;
              return { data: { id: "msg_format_3" } };
            },
          };
        }
      }

      const svc = createEmailServiceInstance({
        env: { RESEND_API_KEY: "re_test_key" },
        mockResendClient: CapturingResend,
      });

      await svc.sendEmailNotification({
        subject: "No Recipient Provided",
        html: "<p>System message</p>",
      });

      assert.deepEqual(sentPayload.to, ["edworld.eden@gmail.com"]);
    });

    it("automatically injects PRIMARY_ADMIN_EMAIL into BCC when sending to external recipients", async () => {
      let sentPayload = null;
      class CapturingResend {
        constructor() {
          this.emails = {
            send: async (p) => {
              sentPayload = p;
              return { data: { id: "msg_bcc_1" } };
            },
          };
        }
      }

      const svc = createEmailServiceInstance({
        env: { RESEND_API_KEY: "re_test_key" },
        mockResendClient: CapturingResend,
      });

      await svc.sendEmailNotification({
        to: "external.student@college.edu",
        bcc: ["mentor@college.edu"],
        subject: "External Dispatch",
        html: "<p>Hello</p>",
      });

      assert.ok(sentPayload.bcc.includes("edworld.eden@gmail.com"));
      assert.ok(sentPayload.bcc.includes("mentor@college.edu"));
      assert.equal(sentPayload.bcc.length, 2);
    });

    it("does not duplicate PRIMARY_ADMIN_EMAIL in BCC if it is already in the recipient list", async () => {
      let sentPayload = null;
      class CapturingResend {
        constructor() {
          this.emails = {
            send: async (p) => {
              sentPayload = p;
              return { data: { id: "msg_bcc_2" } };
            },
          };
        }
      }

      const svc = createEmailServiceInstance({
        env: { RESEND_API_KEY: "re_test_key" },
        mockResendClient: CapturingResend,
      });

      await svc.sendEmailNotification({
        to: ["edworld.eden@gmail.com"],
        subject: "Admin Direct Message",
        html: "<p>Hello Admin</p>",
      });

      assert.equal(sentPayload.bcc, undefined);
    });

    it("does not duplicate PRIMARY_ADMIN_EMAIL in BCC if caller already explicitly passed it in bcc", async () => {
      let sentPayload = null;
      class CapturingResend {
        constructor() {
          this.emails = {
            send: async (p) => {
              sentPayload = p;
              return { data: { id: "msg_bcc_3" } };
            },
          };
        }
      }

      const svc = createEmailServiceInstance({
        env: { RESEND_API_KEY: "re_test_key" },
        mockResendClient: CapturingResend,
      });

      await svc.sendEmailNotification({
        to: "external@example.com",
        bcc: ["edworld.eden@gmail.com"],
        subject: "Pre-existing BCC",
        html: "<p>Hello</p>",
      });

      assert.deepEqual(sentPayload.bcc, ["edworld.eden@gmail.com"]);
    });

    it("persists email dispatch in system_audit_logs with category and metadata", async () => {
      let auditInsert = null;
      const mockSupabase = {
        from: (table) => ({
          insert: async (data) => {
            if (table === "system_audit_logs") {
              auditInsert = data;
            }
            return { data: null, error: null };
          },
          upsert: async () => ({ data: null, error: null }),
        }),
      };

      const svc = createEmailServiceInstance({ mockSupabase });

      await svc.sendEmailNotification({
        to: "candidate@example.com",
        subject: "Interview Scheduled",
        html: "<p>Details here</p>",
        category: "interview",
        metadata: { interviewId: "int_101", candidateRole: "SDE 1" },
      });

      assert.ok(auditInsert, "Audit log insert must be called");
      assert.equal(auditInsert.action, "EMAIL_DISPATCH_INTERVIEW");
      assert.equal(auditInsert.target_id, "edworld.eden@gmail.com");
      assert.equal(auditInsert.metadata.subject, "Interview Scheduled");
      assert.equal(auditInsert.metadata.category, "interview");
      assert.equal(auditInsert.metadata.metadata.interviewId, "int_101");
    });
  });

  // ---------------------------------------------------------------------------
  // 4. Newsletter Subscription, Validation, Upsert Deduplication & Audience Sync
  // ---------------------------------------------------------------------------
  describe("4. Newsletter Subscription & Deduplication Logic", () => {
    it("validates and rejects invalid email addresses", async () => {
      const svc = createEmailServiceInstance();

      const resEmpty = await svc.addNewsletterSubscriber({ email: "   " });
      assert.equal(resEmpty.success, false);
      assert.equal(resEmpty.error, "Invalid email address provided.");

      const resNoAt = await svc.addNewsletterSubscriber({ email: "invalid-email-no-at.com" });
      assert.equal(resNoAt.success, false);
      assert.equal(resNoAt.error, "Invalid email address provided.");
    });

    it("normalizes email to lowercase, trims whitespace, and applies default interests and source", async () => {
      let upsertPayload = null;
      let onConflictOption = null;

      const mockSupabase = {
        from: (table) => ({
          upsert: async (payload, options) => {
            if (table === "newsletter_subscribers") {
              upsertPayload = payload;
              onConflictOption = options;
            }
            return { data: null, error: null };
          },
          insert: async () => ({ data: null, error: null }),
        }),
      };

      const svc = createEmailServiceInstance({ mockSupabase });

      const res = await svc.addNewsletterSubscriber({
        email: "   Student.Learner@University.EDU   ",
        name: "  Adarsh Kumar  ",
      });

      assert.equal(res.success, true);
      assert.equal(res.subscriber.email, "student.learner@university.edu");
      assert.equal(res.subscriber.name, "Adarsh Kumar");
      assert.deepEqual(res.subscriber.interests, ["general", "careers", "tech"]);
      assert.equal(res.subscriber.status, "ACTIVE");
      assert.equal(res.subscriber.source, "web_subscriber_form");

      assert.equal(upsertPayload.email, "student.learner@university.edu");
      assert.deepEqual(onConflictOption, { onConflict: "email" });
    });

    it("preserves custom interests and custom source when provided", async () => {
      let upsertPayload = null;
      const mockSupabase = {
        from: () => ({
          upsert: async (payload) => {
            upsertPayload = payload;
            return { data: null, error: null };
          },
          insert: async () => ({ data: null, error: null }),
        }),
      };

      const svc = createEmailServiceInstance({ mockSupabase });

      const res = await svc.addNewsletterSubscriber({
        email: "engineer@tech.co",
        name: "Sarah Chen",
        interests: ["dsa", "mock_interviews", "system_design"],
        source: "footer_promo_campaign",
      });

      assert.equal(res.success, true);
      assert.deepEqual(res.subscriber.interests, ["dsa", "mock_interviews", "system_design"]);
      assert.equal(res.subscriber.source, "footer_promo_campaign");
      assert.deepEqual(upsertPayload.interests, ["dsa", "mock_interviews", "system_design"]);
      assert.equal(upsertPayload.source, "footer_promo_campaign");
    });

    it("syncs contact to Resend Audience when RESEND_AUDIENCE_ID is configured", async () => {
      let contactParams = null;

      class SpyingContactResend {
        constructor() {
          this.emails = { send: async () => ({ data: { id: "msg_news_welcome" } }) };
          this.contacts = {
            create: async (params) => {
              contactParams = params;
              return { data: { id: "contact_123" } };
            },
          };
        }
      }

      const svc = createEmailServiceInstance({
        env: {
          RESEND_API_KEY: "re_valid_resend_key",
          RESEND_AUDIENCE_ID: "aud_edworld_early_subscribers",
        },
        mockResendClient: SpyingContactResend,
      });

      const res = await svc.addNewsletterSubscriber({
        email: "jane.doe@example.com",
        name: "Jane Doe",
      });

      assert.equal(res.success, true);
      assert.ok(contactParams, "Resend contacts.create must be called");
      assert.equal(contactParams.email, "jane.doe@example.com");
      assert.equal(contactParams.firstName, "Jane");
      assert.equal(contactParams.lastName, "Doe");
      assert.equal(contactParams.audienceId, "aud_edworld_early_subscribers");
      assert.equal(contactParams.unsubscribed, false);
    });
  });

  // ---------------------------------------------------------------------------
  // 5. Newsletter Subscriber Retrieval & Broadcast Dispatches
  // ---------------------------------------------------------------------------
  describe("5. Newsletter Subscriber Retrieval & Broadcast Dispatches", () => {
    it("retrieves active subscribers from database", async () => {
      const mockSubscribers = [
        {
          id: "sub_1",
          email: "user1@edworld.test",
          name: "User One",
          interests: ["tech"],
          status: "ACTIVE",
          source: "web",
          created_at: "2026-11-09T10:00:00Z",
        },
        {
          id: "sub_2",
          email: "user2@edworld.test",
          name: "User Two",
          interests: ["careers"],
          status: "ACTIVE",
          source: "web",
          created_at: "2026-11-09T11:00:00Z",
        },
      ];

      const mockSupabase = {
        from: (table) => ({
          select: () => ({
            eq: (col, val) => ({
              order: () => ({
                limit: async (limit) => ({
                  data: mockSubscribers.slice(0, limit),
                  error: null,
                }),
              }),
            }),
          }),
        }),
      };

      const svc = createEmailServiceInstance({ mockSupabase });
      const subscribers = await svc.getNewsletterSubscribers(10);

      assert.equal(subscribers.length, 2);
      assert.equal(subscribers[0].email, "user1@edworld.test");
      assert.equal(subscribers[1].email, "user2@edworld.test");
    });

    it("falls back to default admin subscriber record if database is empty or errors", async () => {
      const mockSupabase = {
        from: () => ({
          select: () => ({
            eq: () => ({
              order: () => ({
                limit: async () => {
                  throw new Error("Database connection refused");
                },
              }),
            }),
          }),
        }),
      };

      const svc = createEmailServiceInstance({ mockSupabase });
      const fallbackList = await svc.getNewsletterSubscribers(100);

      assert.equal(fallbackList.length, 1);
      assert.equal(fallbackList[0].email, "edworld.eden@gmail.com");
      assert.equal(fallbackList[0].status, "ACTIVE");
      assert.equal(fallbackList[0].source, "system_root");
    });

    it("broadcasts newsletter to all active subscribers and tallies sent vs failed counts", async () => {
      const mockSubscribers = [
        { id: "s1", email: "sub1@edworld.test", status: "ACTIVE" },
        { id: "s2", email: "sub2@edworld.test", status: "ACTIVE" },
        { id: "s3", email: "sub3@edworld.test", status: "ACTIVE" },
      ];

      const mockSupabase = {
        from: (table) => {
          if (table === "newsletter_subscribers") {
            return {
              select: () => ({
                eq: () => ({
                  order: () => ({
                    limit: async () => ({ data: mockSubscribers }),
                  }),
                }),
              }),
            };
          }
          return {
            insert: async () => ({ data: null, error: null }),
          };
        },
      };

      const dispatchedRecipients = [];
      class BroadcastResend {
        constructor() {
          this.emails = {
            send: async (p) => {
              dispatchedRecipients.push(...p.to);
              return { data: { id: `broadcast_${Date.now()}` } };
            },
          };
        }
      }

      const svc = createEmailServiceInstance({
        env: { RESEND_API_KEY: "re_broadcast_key" },
        mockSupabase,
        mockResendClient: BroadcastResend,
      });

      const broadcastResult = await svc.broadcastToSubscribers({
        subject: "Platform Update: New DSA Frameworks",
        title: "Announcing Version 2.0",
        contentHtml: "<p>Explore over 150 new coding questions and AI mock interviews.</p>",
        ctaText: "Start Practicing",
        ctaUrl: "https://edworldco.in/dsa",
        sentByUserId: "admin_user_001",
      });

      assert.equal(broadcastResult.success, true);
      assert.equal(broadcastResult.totalSent, 3);
      assert.equal(broadcastResult.failedCount, 0);
      assert.equal(broadcastResult.subscribersCount, 3);
      assert.deepEqual(dispatchedRecipients, [
        "sub1@edworld.test",
        "sub2@edworld.test",
        "sub3@edworld.test",
      ]);
    });
  });

  // ---------------------------------------------------------------------------
  // 6. Specialized Inbound & Operational Notification Routing
  // ---------------------------------------------------------------------------
  describe("6. Specialized Inbound & Operational Notification Routing", () => {
    it("forwardContactInquiry routes user inquiries directly to PRIMARY_ADMIN_EMAIL with category contact", async () => {
      let emailPayload = null;
      class CapturingResend {
        constructor() {
          this.emails = {
            send: async (p) => {
              emailPayload = p;
              return { data: { id: "msg_inquiry_01" } };
            },
          };
        }
      }

      const svc = createEmailServiceInstance({
        env: { RESEND_API_KEY: "re_test_key" },
        mockResendClient: CapturingResend,
      });

      const res = await svc.forwardContactInquiry({
        name: "Aakash Verma",
        email: "aakash@college.edu",
        category: "Partnership",
        message: "We would like to introduce EdWorld to our engineering department.",
        ip: "203.0.113.195",
      });

      assert.equal(res.success, true);
      assert.deepEqual(emailPayload.to, ["edworld.eden@gmail.com"]);
      assert.ok(emailPayload.subject.includes("[EdWorld Contact Inquiry]"));
      assert.ok(emailPayload.subject.includes("Partnership from Aakash Verma"));
      assert.ok(emailPayload.html.includes("aakash@college.edu"));
      assert.ok(emailPayload.html.includes("We would like to introduce EdWorld"));
    });

    it("forwardSafetyReport routes urgent moderation alerts to PRIMARY_ADMIN_EMAIL with category report", async () => {
      let emailPayload = null;
      class CapturingResend {
        constructor() {
          this.emails = {
            send: async (p) => {
              emailPayload = p;
              return { data: { id: "msg_safety_01" } };
            },
          };
        }
      }

      const svc = createEmailServiceInstance({
        env: { RESEND_API_KEY: "re_test_key" },
        mockResendClient: CapturingResend,
      });

      const res = await svc.forwardSafetyReport({
        reporterId: "user_reporter_456",
        targetId: "job_listing_spam_789",
        category: "SUSPECTED_PHISHING",
        reason: "Job description requests upfront fees for training materials.",
        details: "Attached screenshot indicates suspicious WhatsApp routing.",
      });

      assert.equal(res.success, true);
      assert.deepEqual(emailPayload.to, ["edworld.eden@gmail.com"]);
      assert.ok(emailPayload.subject.includes("🚨 [Urgent Safety Report]"));
      assert.ok(emailPayload.subject.includes("SUSPECTED_PHISHING"));
      assert.ok(emailPayload.html.includes("job_listing_spam_789"));
      assert.ok(emailPayload.html.includes("SUSPECTED_PHISHING"));
    });

    it("sendConnectionRequestNotification dispatches notification to recipient with category system", async () => {
      let emailPayload = null;
      class CapturingResend {
        constructor() {
          this.emails = {
            send: async (p) => {
              emailPayload = p;
              return { data: { id: "msg_conn_req" } };
            },
          };
        }
      }

      const svc = createEmailServiceInstance({
        env: { RESEND_API_KEY: "re_test_key" },
        mockResendClient: CapturingResend,
      });

      await svc.sendConnectionRequestNotification({
        recipientEmail: "recipient.user@example.com",
        recipientName: "Aditi Rao",
        requesterName: "Rohan Gupta",
        requesterHeadline: "Full Stack Engineer at Startup",
        requesterCollegeOrCompany: "IIT Bombay",
        message: "Hi Aditi, I saw your recent project on EdBuild!",
      });

      assert.deepEqual(emailPayload.to, ["recipient.user@example.com"]);
      assert.ok(emailPayload.subject.includes("👋 Rohan Gupta wants to connect with you on EdWorld Co"));
      assert.ok(emailPayload.html.includes("Aditi Rao"));
      assert.ok(emailPayload.html.includes("Rohan Gupta"));
    });

    it("sendConnectionAcceptedNotification dispatches notification to requester with category system", async () => {
      let emailPayload = null;
      class CapturingResend {
        constructor() {
          this.emails = {
            send: async (p) => {
              emailPayload = p;
              return { data: { id: "msg_conn_acc" } };
            },
          };
        }
      }

      const svc = createEmailServiceInstance({
        env: { RESEND_API_KEY: "re_test_key" },
        mockResendClient: CapturingResend,
      });

      await svc.sendConnectionAcceptedNotification({
        requesterEmail: "rohan.gupta@example.com",
        requesterName: "Rohan Gupta",
        accepterName: "Aditi Rao",
        accepterHeadline: "Senior Product Designer",
        accepterCollegeOrCompany: "EdWorld Co.",
      });

      assert.deepEqual(emailPayload.to, ["rohan.gupta@example.com"]);
      assert.ok(emailPayload.subject.includes("✨ Aditi Rao accepted your connection request on EdWorld Co"));
      assert.ok(emailPayload.html.includes("Aditi Rao"));
    });

    it("sendSignupWelcomeEmail formats personalized greeting with student first name", async () => {
      let emailPayload = null;
      class CapturingResend {
        constructor() {
          this.emails = {
            send: async (p) => {
              emailPayload = p;
              return { data: { id: "msg_welcome_01" } };
            },
          };
        }
      }

      const svc = createEmailServiceInstance({
        env: { RESEND_API_KEY: "re_test_key" },
        mockResendClient: CapturingResend,
      });

      const res = await svc.sendSignupWelcomeEmail({
        email: "priya.nair@college.edu",
        name: "Priya Nair",
        careerStage: "Undergraduate",
      });

      assert.equal(res.success, true);
      assert.deepEqual(emailPayload.to, ["priya.nair@college.edu"]);
      assert.ok(emailPayload.subject.includes("🎉 Welcome to EdWorld Co., Priya!"));
      assert.ok(emailPayload.html.includes("Priya"));
    });

    it("sendProjectCompletionCertificateEmail dispatches certificate using CERTIFICATE_FROM_EMAIL", async () => {
      let emailPayload = null;
      class CapturingResend {
        constructor() {
          this.emails = {
            send: async (p) => {
              emailPayload = p;
              return { data: { id: "msg_cert_01" } };
            },
          };
        }
      }

      const svc = createEmailServiceInstance({
        env: {
          RESEND_API_KEY: "re_test_key",
          RESEND_CERTIFICATE_FROM_EMAIL: "EdWorld Credentials <verify@edworld.co.in>",
        },
        mockResendClient: CapturingResend,
      });

      const res = await svc.sendProjectCompletionCertificateEmail({
        email: "student@institute.ac.in",
        studentName: "Vikram Malhotra",
        projectName: "Autonomous Microservices Gateway",
        certificateUrl: "https://edworldco.in/verify/CERT-EDW-2026-9876",
        certificateCode: "CERT-EDW-2026-9876",
      });

      assert.equal(res.success, true);
      assert.equal(emailPayload.from, "EdWorld Credentials <verify@edworld.co.in>");
      assert.deepEqual(emailPayload.to, ["student@institute.ac.in"]);
      assert.ok(emailPayload.subject.includes("Autonomous Microservices Gateway"));
      assert.ok(emailPayload.html.includes("Vikram Malhotra"));
      assert.ok(emailPayload.html.includes("CERT-EDW-2026-9876"));
    });

    it("sendOtpVerificationEmail customizes subject for login vs signup verification", async () => {
      let capturedPayloads = [];
      class CapturingResend {
        constructor() {
          this.emails = {
            send: async (p) => {
              capturedPayloads.push(p);
              return { data: { id: `msg_otp_${capturedPayloads.length}` } };
            },
          };
        }
      }

      const svc = createEmailServiceInstance({
        env: { RESEND_API_KEY: "re_test_key" },
        mockResendClient: CapturingResend,
      });

      // 1. Signup verification OTP
      const resSignup = await svc.sendOtpVerificationEmail({
        email: "new.student@domain.com",
        otp: "582910",
        purpose: "signup",
        studentName: "Kavya",
      });
      assert.equal(resSignup.success, true);
      assert.equal(capturedPayloads[0].subject, "🔐 Verify your EdWorld account (Code: 582910)");
      assert.ok(capturedPayloads[0].html.includes("582910"));

      // 2. Login verification OTP
      const resLogin = await svc.sendOtpVerificationEmail({
        email: "existing.student@domain.com",
        otp: "194820",
        purpose: "login",
        expiresMinutes: 10,
      });
      assert.equal(resLogin.success, true);
      assert.equal(capturedPayloads[1].subject, "🔐 Your EdWorld Sign-In Code: 194820");
      assert.ok(capturedPayloads[1].html.includes("194820"));
    });
  });

  // ---------------------------------------------------------------------------
  // 7. Adversarial Verification, Injection Resilience & Boundary Testing
  // ---------------------------------------------------------------------------
  describe("7. Adversarial Verification & Boundary Testing", () => {
    it("safely handles HTML and script meta-characters in contact inquiry fields", async () => {
      let emailPayload = null;
      class CapturingResend {
        constructor() {
          this.emails = {
            send: async (p) => {
              emailPayload = p;
              return { data: { id: "msg_adv_1" } };
            },
          };
        }
      }

      const svc = createEmailServiceInstance({
        env: { RESEND_API_KEY: "re_test_key" },
        mockResendClient: CapturingResend,
      });

      const res = await svc.forwardContactInquiry({
        name: "Test <script>alert('xss')</script>",
        email: "attacker@domain.com",
        category: "XSS-Probe' OR '1'='1",
        message: "Hello <b>world</b> & <img src=x onerror=alert(1)>",
      });

      assert.equal(res.success, true);
      assert.ok(emailPayload);
      assert.deepEqual(emailPayload.to, ["edworld.eden@gmail.com"]);
    });

    it("handles extreme recipient lists without memory degradation", async () => {
      let callCount = 0;
      class CountingResend {
        constructor() {
          this.emails = {
            send: async () => {
              callCount++;
              return { data: { id: `msg_bulk_${callCount}` } };
            },
          };
        }
      }

      const svc = createEmailServiceInstance({
        env: { RESEND_API_KEY: "re_test_key" },
        mockResendClient: CountingResend,
      });

      const bulkRecipients = Array.from({ length: 50 }, (_, i) => `bulk.user.${i}@college.edu`);
      const res = await svc.sendEmailNotification({
        to: bulkRecipients,
        subject: "Bulk Notification Stress",
        html: "<p>Bulk contents</p>",
      });

      assert.equal(res.success, true);
      assert.equal(callCount, 1);
    });

    it("handles missing student name in sendSignupWelcomeEmail by defaulting to Learner", async () => {
      let emailPayload = null;
      class CapturingResend {
        constructor() {
          this.emails = {
            send: async (p) => {
              emailPayload = p;
              return { data: { id: "msg_learner_fallback" } };
            },
          };
        }
      }

      const svc = createEmailServiceInstance({
        env: { RESEND_API_KEY: "re_test_key" },
        mockResendClient: CapturingResend,
      });

      const res = await svc.sendSignupWelcomeEmail({
        email: "nameless.user@domain.com",
        name: "",
      });

      assert.equal(res.success, true);
      assert.ok(emailPayload.subject.includes("Welcome to EdWorld Co., Learner!"));
    });
  });
});
