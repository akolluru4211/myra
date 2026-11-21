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

    const { data: apps, error } = await supabase
      .from("student_applications")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, applications: apps || [] });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Failed to load applications" }, { status: 500 });
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
      company,
      roleTitle,
      status = "applied",
      appliedDate,
      location,
      salaryOrStipend,
      jobUrl,
      notes,
      source = "external",
    } = body;

    if (!company || !roleTitle) {
      return NextResponse.json({ error: "Company and role title are required" }, { status: 400 });
    }

    const { data: newApp, error } = await supabase
      .from("student_applications")
      .insert({
        user_id: userId,
        company,
        role_title: roleTitle,
        status: status || "applied",
        applied_date: appliedDate || new Date().toISOString().split("T")[0],
        location: location || null,
        salary_or_stipend: salaryOrStipend || null,
        job_url: jobUrl || null,
        notes: notes || null,
        source: source || "external",
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, application: newApp });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Failed to create application" }, { status: 500 });
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
      return NextResponse.json({ error: "Application ID required" }, { status: 400 });
    }

    const { error } = await supabase
      .from("student_applications")
      .delete()
      .eq("id", id)
      .eq("user_id", userId);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Failed to delete application" }, { status: 500 });
  }
}
