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
 * GET: Retrieve student's portfolio-eligible and published items
 */
export async function GET(req: NextRequest) {
  try {
    const userId = await resolveAuthenticatedUserId(req);
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const [projectsRes, certsRes] = await Promise.all([
      supabase.from("student_projects").select("*").eq("user_id", userId),
      supabase.from("student_certificates").select("*").eq("user_id", userId),
    ]);

    return NextResponse.json({
      success: true,
      projects: projectsRes.data || [],
      certificates: certsRes.data || [],
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Failed to load portfolio items" }, { status: 500 });
  }
}

/**
 * POST: Publish or update visibility of an evidence item in portfolio
 */
export async function POST(req: NextRequest) {
  try {
    const userId = await resolveAuthenticatedUserId(req);
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const {
      itemType, // 'project' | 'certificate'
      itemId,
      isPublished = true,
      publishedFields = {},
    } = body;

    if (!itemType || !itemId) {
      return NextResponse.json({ error: "itemType and itemId are required" }, { status: 400 });
    }

    const table = itemType === "project" ? "student_projects" : "student_certificates";

    const { data: updated, error } = await supabase
      .from(table)
      .update({
        is_published: Boolean(isPublished),
        published_fields: publishedFields,
        updated_at: new Date().toISOString(),
      })
      .eq("id", itemId)
      .eq("user_id", userId)
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      item: updated,
      notice: isPublished ? "Published to portfolio" : "Removed from public portfolio",
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Failed to update portfolio item" }, { status: 500 });
  }
}

/**
 * DELETE: Revoke public link / unpublish an item from the portfolio
 */
export async function DELETE(req: NextRequest) {
  try {
    const userId = await resolveAuthenticatedUserId(req);
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const itemType = searchParams.get("itemType"); // 'project' | 'certificate'
    const itemId = searchParams.get("itemId");

    if (!itemType || !itemId) {
      return NextResponse.json({ error: "itemType and itemId are required" }, { status: 400 });
    }

    const table = itemType === "project" ? "student_projects" : "student_certificates";

    const { error } = await supabase
      .from(table)
      .update({
        is_published: false,
        updated_at: new Date().toISOString(),
      })
      .eq("id", itemId)
      .eq("user_id", userId);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      notice: "Public link revoked. Note: Previously submitted job applications retain the submitted snapshot.",
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Failed to revoke portfolio link" }, { status: 500 });
  }
}
