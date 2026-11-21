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

    const { data: projects, error } = await supabase
      .from("student_projects")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, projects: projects || [] });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Failed to load projects" }, { status: 500 });
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
      description,
      githubUrl,
      liveUrl,
      techStack = [],
      role = "Creator",
      isFeatured = false,
    } = body;

    if (!title) {
      return NextResponse.json({ error: "Project title is required" }, { status: 400 });
    }

    const { data: newProj, error } = await supabase
      .from("student_projects")
      .insert({
        user_id: userId,
        title,
        description: description || null,
        github_url: githubUrl || null,
        live_url: liveUrl || null,
        tech_stack: Array.isArray(techStack) ? techStack : [],
        role: role || "Creator",
        is_featured: Boolean(isFeatured),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, project: newProj });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Failed to create project" }, { status: 500 });
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
      return NextResponse.json({ error: "Project ID required" }, { status: 400 });
    }

    const { error } = await supabase
      .from("student_projects")
      .delete()
      .eq("id", id)
      .eq("user_id", userId);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Failed to delete project" }, { status: 500 });
  }
}
