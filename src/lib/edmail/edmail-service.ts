/**
 * EdMail Domain Service & Provider Adapter
 * Handles student mailbox creation, verification, inbound/outbound mail routing,
 * sanitization, and quota enforcement for @edworld.co.in.
 */

import { supabase } from "../supabase.ts";
import { Resend } from "resend";

export const EDMAIL_DOMAIN = "edworld.co.in";
export const EDMAIL_WEBMAIL_HOST = "mails.edworld.co.in";
export const EDMAIL_DEFAULT_QUOTA_BYTES = 512 * 1024 * 1024; // 512 MB
export const EDMAIL_DAILY_SEND_LIMIT = 100;
export const EDMAIL_MAX_ATTACHMENT_SIZE_BYTES = 15 * 1024 * 1024; // 15 MB per file
export const EDMAIL_MAX_RECIPIENTS = 25;

// System reserved addresses that cannot be claimed by students
export const RESERVED_EDMAIL_HANDLES = new Set([
  "admin",
  "administrator",
  "postmaster",
  "hostmaster",
  "webmaster",
  "support",
  "help",
  "info",
  "contact",
  "billing",
  "security",
  "abuse",
  "root",
  "system",
  "noreply",
  "no-reply",
  "notifications",
  "edworld",
  "myra",
  "edmail",
  "compliance",
  "legal",
  "privacy",
  "career",
  "admissions",
  "feedback",
  "grievance",
  "verify",
  "verification",
  "certificate",
  "certificates",
  "scholarship",
  "discount",
  "offers",
  "ambassador",
  "moderator",
]);

export interface EdMailbox {
  id: string;
  user_id: string;
  username: string;
  address: string;
  recovery_email: string;
  status: "pending_verification" | "provisioning" | "ready" | "suspended" | "closed" | "failed";
  storage_used_bytes: number;
  storage_quota_bytes: number;
  daily_send_count: number;
  daily_send_limit: number;
  last_send_reset_at: string;
  guardian_consent_verified: boolean;
  eligibility_verified: boolean;
  closed_at?: string | null;
  retention_until?: string | null;
  export_requested_at?: string | null;
  created_at: string;
  updated_at: string;
}

export interface EdMailMessage {
  id: string;
  mailbox_id: string;
  thread_id: string;
  provider_message_id?: string;
  direction: "inbound" | "outbound";
  folder: "inbox" | "sent" | "drafts" | "archive" | "trash" | "spam";
  from_address: string;
  from_name?: string;
  to_addresses: string[];
  cc_addresses: string[];
  bcc_addresses: string[];
  subject: string;
  snippet: string;
  body_text: string;
  body_html: string;
  is_read: boolean;
  is_starred: boolean;
  labels: string[];
  delivery_status: "draft" | "queued" | "accepted" | "delivered" | "failed" | "bounced";
  delivery_error?: string;
  attachments?: EdMailAttachment[];
  received_at: string;
  created_at: string;
}

export interface EdMailAttachment {
  id?: string;
  filename: string;
  content_type: string;
  byte_size: number;
  content_base64?: string;
  storage_path?: string;
  scan_status?: "clean" | "suspicious" | "pending";
}

export interface EdMailDocument {
  id: string;
  mailbox_id: string;
  user_id: string;
  category: "study_material" | "certificate" | "resume" | "general";
  title: string;
  filename: string;
  content_type: string;
  byte_size: number;
  storage_path?: string;
  source: "upload" | "email_attachment" | "edworld_verified";
  is_verified: boolean;
  verification_issuer?: string;
  verification_badge?: string;
  source_message_id?: string;
  tags: string[];
  created_at: string;
}

/**
 * Validates whether a requested username is eligible and conforms to policies.
 */
export function validateEdMailUsername(rawUsername: string): { valid: boolean; normalized: string; error?: string } {
  const normalized = (rawUsername || "").trim().toLowerCase();
  
  if (!normalized) {
    return { valid: false, normalized, error: "Username is required." };
  }

  if (normalized.length < 3) {
    return { valid: false, normalized, error: "Username must be at least 3 characters long." };
  }

  if (normalized.length > 30) {
    return { valid: false, normalized, error: "Username must not exceed 30 characters." };
  }

  // Allowed: lowercase alphanumeric, dots, and hyphens (cannot start or end with dot/hyphen)
  if (!/^[a-z0-9][a-z0-9.-]*[a-z0-9]$/.test(normalized) || normalized.includes("..")) {
    return { valid: false, normalized, error: "Username can only contain letters, numbers, hyphens, and periods without consecutive punctuation." };
  }

  if (RESERVED_EDMAIL_HANDLES.has(normalized)) {
    return { valid: false, normalized, error: `The address "${normalized}@${EDMAIL_DOMAIN}" is a reserved system address.` };
  }

  return { valid: true, normalized };
}

/**
 * Checks if username is currently available.
 */
export async function checkEdMailAvailability(username: string, currentUserId?: string): Promise<{ available: boolean; reason?: string }> {
  const val = validateEdMailUsername(username);
  if (!val.valid) {
    return { available: false, reason: val.error };
  }

  try {
    const { data, error } = await supabase
      .from("edmail_mailboxes")
      .select("id, user_id")
      .eq("username", val.normalized)
      .maybeSingle();

    if (error && error.code !== "PGRST116") {
      // In local dev/fallback mode
      return { available: true };
    }

    if (data) {
      if (currentUserId && data.user_id === currentUserId) {
        return { available: true };
      }
      return { available: false, reason: "Username is already claimed by another student." };
    }

    return { available: true };
  } catch {
    return { available: true };
  }
}

/**
 * Sanitizes HTML email body and neutralizes remote tracking images unless approved.
 */
export function sanitizeEmailHtml(rawHtml: string, allowRemoteImages: boolean = false): string {
  if (!rawHtml) return "";

  let sanitized = rawHtml
    // Strip script tags
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "")
    // Strip onerror/onload and other inline handlers
    .replace(/\son\w+="[^"]*"/gi, "")
    .replace(/\son\w+='[^']*'/gi, "")
    .replace(/\son\w+=\w+/gi, "")
    // Strip javascript: uris
    .replace(/href=["']javascript:[^"']*["']/gi, 'href="#"');

  if (!allowRemoteImages) {
    // Replace remote images with a data-placeholder to protect student IP & tracking
    sanitized = sanitized.replace(/<img\b[^>]*src=["'](https?:\/\/[^"']+)["'][^>]*\/?>/gi, () => {
      return '<div class="edmail-blocked-image p-2 rounded bg-slate-100 text-slate-500 text-xs my-2 border border-slate-200 flex items-center justify-between"><span>Remote image blocked for your privacy.</span></div>';
    });
  }

  return sanitized;
}

/**
 * Retrieves the Resend API client or returns null if in simulation/audit mode.
 */
function getResendClient(): Resend | null {
  const key = process.env.RESEND_API_KEY;
  if (!key || key.includes("placeholder") || key.includes("your-key")) {
    return null;
  }
  return new Resend(key);
}

/**
 * Dispatches an outbound email via managed provider (Resend) with idempotency key.
 */
export async function dispatchOutboundEdMail(params: {
  fromAddress: string;
  fromName?: string;
  to: string[];
  cc?: string[];
  bcc?: string[];
  subject: string;
  text: string;
  html: string;
  idempotencyKey?: string;
  attachments?: { filename: string; content: string }[];
}): Promise<{ success: boolean; providerMessageId?: string; error?: string; status: "accepted" | "failed" | "queued" }> {
  const resend = getResendClient();

  if (!resend) {
    // Sandbox / Test Mode: Return deterministic mock provider ID
    const mockId = `sim_msg_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
    return {
      success: true,
      providerMessageId: mockId,
      status: "accepted",
    };
  }

  try {
    const formattedFrom = params.fromName
      ? `${params.fromName} <${params.fromAddress}>`
      : params.fromAddress;

    // In testing/sandbox, if the sending domain isn't verified in Resend yet,
    // route test/sandbox emails via onboarding@resend.dev so real deliveries succeed.
    let resolvedFrom = formattedFrom;
    const isSandboxRecipient = params.to.every(t => t.includes("resend.dev") || t.includes("example.com"));
    if (isSandboxRecipient || process.env.NODE_ENV === "test" || process.env.EDMAIL_USE_RESEND_SANDBOX === "true") {
      resolvedFrom = params.fromName ? `${params.fromName} <onboarding@resend.dev>` : "onboarding@resend.dev";
    }

    const payload: any = {
      from: resolvedFrom,
      to: params.to,
      subject: params.subject,
      html: params.html,
      text: params.text,
    };

    if (params.cc && params.cc.length > 0) payload.cc = params.cc;
    if (params.bcc && params.bcc.length > 0) payload.bcc = params.bcc;
    if (params.attachments && params.attachments.length > 0) {
      payload.attachments = params.attachments;
    }

    const sendOptions: any = {};
    if (params.idempotencyKey) {
      sendOptions.headers = {
        "Idempotency-Key": params.idempotencyKey,
      };
    }

    const { data, error } = await resend.emails.send(payload, sendOptions);

    if (error) {
      return {
        success: false,
        error: error.message || "Provider dispatch failed",
        status: "failed",
      };
    }

    return {
      success: true,
      providerMessageId: data?.id,
      status: "accepted",
    };
  } catch (err: any) {
    return {
      success: false,
      error: err.message || "Failed to dispatch email",
      status: "failed",
    };
  }
}
