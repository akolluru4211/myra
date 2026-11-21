import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export const dynamic = "force-dynamic";

/**
 * GET: EdMail Health & Operational Telemetry
 * Provides queue status, delivery counts, database connectivity, and error rates
 * while ensuring zero student PII or message content is exposed.
 */
export async function GET(req: NextRequest) {
  try {
    const startTime = Date.now();

    // 1. Database connection check
    const { count: mailboxCount, error: boxErr } = await supabase
      .from("edmail_mailboxes")
      .select("*", { count: "exact", head: true });

    if (boxErr) {
      return NextResponse.json({
        status: "unhealthy",
        database: "disconnected",
        error: boxErr.message,
        timestamp: new Date().toISOString(),
      }, { status: 503 });
    }

    // 2. Delivery counts (last 24h)
    const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

    const { count: inboundDelivered } = await supabase
      .from("edmail_delivery_logs")
      .select("*", { count: "exact", head: true })
      .eq("event_type", "inbound.delivered")
      .gte("created_at", yesterday);

    const { count: inboundRejected } = await supabase
      .from("edmail_delivery_logs")
      .select("*", { count: "exact", head: true })
      .eq("event_type", "inbound.rejected_unknown_mailbox")
      .gte("created_at", yesterday);

    // 3. Outbound queue age check
    const { count: queuedOutbound } = await supabase
      .from("edmail_messages")
      .select("*", { count: "exact", head: true })
      .eq("direction", "outbound")
      .eq("delivery_status", "queued");

    const latencyMs = Date.now() - startTime;

    return NextResponse.json({
      status: "healthy",
      latencyMs,
      database: "connected",
      totalMailboxes: mailboxCount || 0,
      telemetry24h: {
        inboundDelivered: inboundDelivered || 0,
        inboundRejected: inboundRejected || 0,
        queuedOutbound: queuedOutbound || 0,
      },
      providerConfig: {
        domain: "edworld.co.in",
        provider: "resend",
        mode: process.env.RESEND_API_KEY ? "live" : "simulation",
      },
      timestamp: new Date().toISOString(),
    });
  } catch (err: any) {
    return NextResponse.json({
      status: "error",
      error: err.message || "Health check failed",
      timestamp: new Date().toISOString(),
    }, { status: 500 });
  }
}
