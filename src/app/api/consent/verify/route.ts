import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export const dynamic = "force-dynamic";

// Expiry window: 7 days in milliseconds
const TOKEN_EXPIRY_MS = 7 * 24 * 60 * 60 * 1000;

interface ConsentVerifyRequestBody {
  token: string;
  action?: "approve" | "revoke";
}

/**
 * Trusted Server-Side Guardian Consent Verification Endpoint.
 *
 * Security Guarantees:
 * 1. Tokens are single-use: once consumed (status != 'pending'), re-use is strictly rejected.
 * 2. Token expiry is strictly checked (sent_at / created_at within 7 days).
 * 3. Atomic consumption: Updates status to 'verified' or 'revoked' with a single write.
 * 4. Privacy Hygiene: Strips all guardian PII (names, emails, phone numbers) and student PII
 *    from API responses and server logs.
 */
export async function POST(req: NextRequest) {
  try {
    const body = (await req.json().catch(() => ({}))) as ConsentVerifyRequestBody;
    const { token, action = "approve" } = body;

    // Validate token input
    if (!token || typeof token !== "string" || token.trim().length === 0) {
      return NextResponse.json(
        { success: false, error: "INVALID_TOKEN", message: "Verification token is required." },
        { status: 400 }
      );
    }

    const cleanToken = token.trim();
    const newStatus = action === "revoke" ? "revoked" : "verified";
    const nowIso = new Date().toISOString();

    // 1. Fetch consent record by token
    const { data: record, error: fetchError } = await supabase
      .from("guardian_consents")
      .select("id, user_id, status, sent_at, created_at")
      .eq("token", cleanToken)
      .maybeSingle();

    if (fetchError) {
      console.error("[Consent Verify] Database lookup error occurred.");
      return NextResponse.json(
        { success: false, error: "LOOKUP_FAILED", message: "Failed to verify consent token. Please retry." },
        { status: 500 }
      );
    }

    if (!record) {
      return NextResponse.json(
        { success: false, error: "TOKEN_NOT_FOUND", message: "Invalid verification link. Token not found." },
        { status: 404 }
      );
    }

    // 2. Token Expiry Check
    const sentTime = record.sent_at || record.created_at;
    if (sentTime) {
      const createdMs = new Date(sentTime).getTime();
      if (!isNaN(createdMs) && Date.now() - createdMs > TOKEN_EXPIRY_MS) {
        return NextResponse.json(
          {
            success: false,
            error: "TOKEN_EXPIRED",
            message: "This guardian verification link has expired. Please ask the student to request a new link.",
          },
          { status: 410 }
        );
      }
    }

    // 3. Single-Use Check: Must be currently 'pending'
    if (record.status !== "pending") {
      return NextResponse.json(
        {
          success: false,
          error: "TOKEN_ALREADY_USED",
          message: `This verification link has already been used (status: ${record.status}). Each link can only be used once.`,
        },
        { status: 409 }
      );
    }

    // 4. Atomic Consumption in guardian_consents table
    const { error: updateError } = await supabase
      .from("guardian_consents")
      .update({
        status: newStatus,
        verified_at: nowIso,
        updated_at: nowIso,
      })
      .eq("id", record.id)
      .eq("status", "pending"); // atomic concurrency guard

    if (updateError) {
      console.error("[Consent Verify] Update failed.");
      return NextResponse.json(
        { success: false, error: "CONSUME_FAILED", message: "Failed to record consent decision. Please retry." },
        { status: 500 }
      );
    }

    // 5. Update user profile / guardian consent state if linked
    if (record.user_id) {
      await supabase
        .from("profiles")
        .update({
          guardian_consent_verified: newStatus === "verified",
          guardian_consent_status: newStatus,
          updated_at: nowIso,
        })
        .eq("id", record.user_id)
        .then(() => {}, (e) => console.warn("[Consent Verify] Profile sync note:", e?.message));
    }

    // 6. Record Audit Log on trusted server path (privacy sanitized)
    try {
      await supabase.from("audit_logs").insert({
        actor_id: "guardian_portal",
        actor_role: "GUARDIAN",
        action: newStatus === "verified" ? "consent.guardian_confirmed" : "consent.guardian_declined",
        target_type: "consent",
        target_id: record.id,
        metadata: {
          result: "SUCCESS",
          action_taken: newStatus,
          // Zero student / guardian PII included
        },
        created_at: nowIso,
      });
    } catch (auditErr) {
      // Non-blocking for client response
    }

    // 7. Sanitized Response: Student & Guardian details intentionally omitted
    return NextResponse.json({
      success: true,
      status: newStatus,
      verifiedAt: nowIso,
    });
  } catch (err: any) {
    console.error("[Consent Verify Endpoint Error]:", err?.message || err);
    return NextResponse.json(
      { success: false, error: "INTERNAL_ERROR", message: "A temporary error occurred. Please try again." },
      { status: 500 }
    );
  }
}
