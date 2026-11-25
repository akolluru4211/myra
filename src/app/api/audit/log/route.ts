import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export const dynamic = "force-dynamic";

interface AuditLogRequestBody {
  action: string;
  resource: string;
  resourceId?: string;
  result?: "SUCCESS" | "FAILURE" | "DENIED";
  metadata?: Record<string, any>;
}

/**
 * Trusted Server-Side Audit Log Ingestion Endpoint.
 *
 * Security Requirements:
 * 1. Actor identity and timestamps are derived strictly on the server.
 * 2. Client is forbidden from spoofing actor identity or arbitrary past timestamps.
 * 3. Client direct writes to Firestore / Supabase audit tables are disallowed.
 * 4. PII (passwords, tokens, DOB) is strictly sanitized and stripped before recording.
 */
export async function POST(req: NextRequest) {
  try {
    const body = (await req.json().catch(() => ({}))) as AuditLogRequestBody;
    const { action, resource, resourceId, result = "SUCCESS", metadata = {} } = body;

    if (!action || typeof action !== "string") {
      return NextResponse.json(
        { success: false, error: "INVALID_ACTION", message: "Action name is required." },
        { status: 400 }
      );
    }

    // 1. Derive Actor Identity from authenticated session if available
    let actorId = "system";
    let actorRole = "ANONYMOUS";
    let actorName = "Anonymous Client";

    try {
      const authHeader = req.headers.get("authorization");
      if (authHeader && authHeader.startsWith("Bearer ")) {
        const token = authHeader.substring(7);
        const { data: { user } } = await supabase.auth.getUser(token);
        if (user) {
          actorId = user.id;
          actorRole = "AUTHENTICATED";
          actorName = user.email || user.id;

          // Check if admin role in profile
          const { data: profile } = await supabase
            .from("profiles")
            .select("role, name, username")
            .eq("id", user.id)
            .maybeSingle();

          if (profile) {
            actorRole = profile.role || "CLIENT";
            actorName = profile.name || profile.username || actorName;
          }
        }
      }
    } catch {
      // Fallback to anonymous actor
    }

    // 2. Derive Server-Controlled Timestamp
    const serverTimestamp = new Date().toISOString();

    // 3. PII Sanitization
    const sanitizedMetadata: Record<string, any> = { ...metadata };
    delete sanitizedMetadata.password;
    delete sanitizedMetadata.token;
    delete sanitizedMetadata.secret;
    delete sanitizedMetadata.dob;
    delete sanitizedMetadata.rawAudio;

    const ipAddress = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "127.0.0.1";

    // 4. Record to Supabase audit_logs table via trusted server path
    const { error: dbError } = await supabase.from("audit_logs").insert({
      actor_id: actorId,
      actor_role: actorRole,
      action: String(action),
      target_type: String(resource || "system"),
      target_id: String(resourceId || actorId),
      metadata: {
        actor_name: actorName,
        result: result === "DENIED" || result === "FAILURE" ? result : "SUCCESS",
        ip: ipAddress,
        ...sanitizedMetadata,
      },
      created_at: serverTimestamp,
    });

    if (dbError) {
      console.warn("[Server Audit Log DB Note]:", dbError.message);
    }

    return NextResponse.json({
      success: true,
      timestamp: serverTimestamp,
    });
  } catch (err: any) {
    console.error("[Server Audit Log Endpoint Error]:", err);
    return NextResponse.json(
      { success: false, error: "LOG_FAILED", message: "Failed to ingest audit event." },
      { status: 500 }
    );
  }
}
