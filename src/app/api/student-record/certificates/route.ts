import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { validateSession } from "@/lib/otp-service";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

async function resolveAuthenticatedUserId(req: NextRequest): Promise<string | null> {
  try {
    const supabaseServer = createClient();
    const { data: { user } } = await supabaseServer.auth.getUser();
    if (user?.id) return user.id;
  } catch {}

  const sessionToken = req.cookies.get("edworld_session")?.value;
  if (sessionToken) {
    const sess = validateSession(sessionToken);
    if (sess.valid && sess.userId) return sess.userId;
  }

  return null;
}

export async function GET(req: NextRequest) {
  try {
    const userId = await resolveAuthenticatedUserId(req);
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data: certs, error } = await supabase
      .from("student_certificates")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, certificates: certs || [] });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Failed to load certificates" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const userId = await resolveAuthenticatedUserId(req);
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const {
      title,
      issuer,
      issueDate,
      credentialId,
      verificationUrl,
      source = "upload",
      sourceMessageId,
      filename,
      storagePath,
      byteSize = 0,
    } = body;

    if (!title || !issuer) {
      return NextResponse.json({ error: "Title and issuer are required" }, { status: 400 });
    }

    // Only trusted platform or institutional integration can grant verified status
    const isVerified = source === "edworld_issued";

    const { data: newCert, error } = await supabase
      .from("student_certificates")
      .insert({
        user_id: userId,
        title,
        issuer,
        issue_date: issueDate || null,
        credential_id: credentialId || null,
        verification_url: verificationUrl || null,
        is_verified: isVerified,
        verified_by: isVerified ? "Edworld Certification Authority" : null,
        filename: filename || null,
        storage_path: storagePath || null,
        byte_size: byteSize,
        source: source === "edworld_issued" ? "edworld_issued" : source === "email_attachment" ? "email_attachment" : "upload",
        source_message_id: sourceMessageId || null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, certificate: newCert });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Failed to create certificate" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const userId = await resolveAuthenticatedUserId(req);
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    if (!id) {
      return NextResponse.json({ error: "Certificate ID required" }, { status: 400 });
    }

    const { error } = await supabase
      .from("student_certificates")
      .delete()
      .eq("id", id)
      .eq("user_id", userId);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Failed to delete certificate" }, { status: 500 });
  }
}
