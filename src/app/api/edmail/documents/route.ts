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

/**
 * GET: List all saved documents and certificates for the student
 */
export async function GET(req: NextRequest) {
  try {
    const userId = await resolveAuthenticatedUserId(req);
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const category = searchParams.get("category"); // 'study_material' | 'certificate' | 'all'

    let query = supabase
      .from("edmail_documents")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });

    if (category && category !== "all") {
      query = query.eq("category", category);
    }

    const { data: documents, error } = await query;
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      documents: documents || [],
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Failed to load documents" }, { status: 500 });
  }
}

/**
 * POST: Upload a document directly or save from an email attachment
 */
export async function POST(req: NextRequest) {
  try {
    const userId = await resolveAuthenticatedUserId(req);
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const {
      title,
      filename,
      contentType = "application/pdf",
      byteSize = 0,
      category = "study_material",
      source = "upload",
      isVerified = false,
      verificationIssuer,
      verificationBadge,
      sourceMessageId,
      tags = [],
    } = body;

    // Verify student mailbox
    const { data: mailbox } = await supabase
      .from("edmail_mailboxes")
      .select("id, storage_used_bytes, storage_quota_bytes")
      .eq("user_id", userId)
      .single();

    if (!mailbox) {
      return NextResponse.json({ error: "Mailbox not found" }, { status: 404 });
    }

    if (mailbox.storage_used_bytes + byteSize > mailbox.storage_quota_bytes) {
      return NextResponse.json({ error: "Storage quota exceeded (512 MB limit). Please delete older files to free space." }, { status: 413 });
    }

    const { data: document, error } = await supabase
      .from("edmail_documents")
      .insert({
        mailbox_id: mailbox.id,
        user_id: userId,
        category,
        title: title || filename || "Untitled Document",
        filename: filename || "document.pdf",
        content_type: contentType,
        byte_size: byteSize,
        source,
        is_verified: Boolean(isVerified),
        verification_issuer: verificationIssuer || null,
        verification_badge: verificationBadge || null,
        source_message_id: sourceMessageId || null,
        tags: Array.isArray(tags) ? tags : [],
      })
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Update storage usage
    if (byteSize > 0) {
      await supabase
        .from("edmail_mailboxes")
        .update({
          storage_used_bytes: mailbox.storage_used_bytes + byteSize,
          updated_at: new Date().toISOString(),
        })
        .eq("id", mailbox.id);
    }

    return NextResponse.json({
      success: true,
      document,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Failed to save document" }, { status: 500 });
  }
}

/**
 * DELETE: Remove a document from student vault
 */
export async function DELETE(req: NextRequest) {
  try {
    const userId = await resolveAuthenticatedUserId(req);
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const documentId = searchParams.get("id");

    if (!documentId) {
      return NextResponse.json({ error: "Document ID is required" }, { status: 400 });
    }

    const { data: doc } = await supabase
      .from("edmail_documents")
      .select("id, mailbox_id, byte_size")
      .eq("id", documentId)
      .eq("user_id", userId)
      .single();

    if (!doc) {
      return NextResponse.json({ error: "Document not found or unauthorized" }, { status: 404 });
    }

    await supabase
      .from("edmail_documents")
      .delete()
      .eq("id", documentId)
      .eq("user_id", userId);

    // Reclaim storage space
    if (doc.byte_size > 0) {
      const { data: box } = await supabase
        .from("edmail_mailboxes")
        .select("storage_used_bytes")
        .eq("id", doc.mailbox_id)
        .single();

      if (box) {
        await supabase
          .from("edmail_mailboxes")
          .update({
            storage_used_bytes: Math.max(0, box.storage_used_bytes - doc.byte_size),
            updated_at: new Date().toISOString(),
          })
          .eq("id", doc.mailbox_id);
      }
    }

    return NextResponse.json({ success: true, deletedId: documentId });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Failed to delete document" }, { status: 500 });
  }
}
