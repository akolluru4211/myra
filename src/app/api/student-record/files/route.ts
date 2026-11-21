import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { validateSession } from "@/lib/otp-service";
import { createClient } from "@/lib/supabase/server";
import {
  validateStudentRecordFile,
  uploadPrivateStudentRecordFile,
  getSignedDownloadUrl,
  deletePrivateStudentRecordFile,
} from "@/lib/storage/student-record-storage";

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
 * GET: Retrieve short-lived signed download URL for an authorized record file
 */
export async function GET(req: NextRequest) {
  try {
    const userId = await resolveAuthenticatedUserId(req);
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const storagePath = searchParams.get("path");

    if (!storagePath) {
      return NextResponse.json({ error: "Storage path required" }, { status: 400 });
    }

    // Enforce ownership: storagePath must begin with userId or be linked to a record owned by userId
    if (!storagePath.startsWith(userId) && !storagePath.startsWith("local_vault/" + userId)) {
      return NextResponse.json({ error: "Forbidden: Cannot access another student's file" }, { status: 403 });
    }

    const signed = await getSignedDownloadUrl(storagePath, 900); // 15 mins
    if (!signed.url) {
      return NextResponse.json({ error: signed.error || "Failed to generate download link" }, { status: 500 });
    }

    return NextResponse.json({ success: true, downloadUrl: signed.url });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Failed to process download" }, { status: 500 });
  }
}

/**
 * POST: Upload a file to private Supabase Storage and link to Student Record
 */
export async function POST(req: NextRequest) {
  try {
    const userId = await resolveAuthenticatedUserId(req);
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    const category = (formData.get("category") as any) || "notes";
    const recordId = formData.get("recordId") as string | null;

    if (!file) {
      return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
    }

    const validation = validateStudentRecordFile({
      name: file.name,
      size: file.size,
      type: file.type || "application/pdf",
    });

    if (!validation.valid) {
      return NextResponse.json({ error: validation.error }, { status: 400 });
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const uploadRes = await uploadPrivateStudentRecordFile(
      userId,
      category,
      buffer,
      file.name,
      file.type || "application/pdf"
    );

    if (!uploadRes.success || !uploadRes.storagePath) {
      return NextResponse.json({ error: uploadRes.error || "Upload failed" }, { status: 500 });
    }

    // Link to specific record if recordId provided
    if (recordId) {
      if (category === "marks") {
        await supabase
          .from("student_marks")
          .update({
            mark_sheet_filename: uploadRes.filename,
            mark_sheet_storage_path: uploadRes.storagePath,
            updated_at: new Date().toISOString(),
          })
          .eq("id", recordId)
          .eq("user_id", userId);
      } else if (category === "certificates") {
        await supabase
          .from("student_certificates")
          .update({
            filename: uploadRes.filename,
            storage_path: uploadRes.storagePath,
            byte_size: file.size,
            updated_at: new Date().toISOString(),
          })
          .eq("id", recordId)
          .eq("user_id", userId);
      }
    }

    return NextResponse.json({
      success: true,
      filename: uploadRes.filename,
      storagePath: uploadRes.storagePath,
      byteSize: file.size,
      contentType: file.type || "application/pdf",
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Failed to upload file" }, { status: 500 });
  }
}

/**
 * DELETE: Delete a student file from storage
 */
export async function DELETE(req: NextRequest) {
  try {
    const userId = await resolveAuthenticatedUserId(req);
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const storagePath = searchParams.get("path");

    if (!storagePath) {
      return NextResponse.json({ error: "Storage path required" }, { status: 400 });
    }

    if (!storagePath.startsWith(userId) && !storagePath.startsWith("local_vault/" + userId)) {
      return NextResponse.json({ error: "Forbidden: Cannot delete another student's file" }, { status: 403 });
    }

    await deletePrivateStudentRecordFile(storagePath);

    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Failed to delete file" }, { status: 500 });
  }
}
