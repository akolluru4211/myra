import { NextRequest, NextResponse } from "next/server";
import { queryDb } from "@/lib/db-server";
import { validateSession } from "@/lib/otp-service";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const token =
      req.cookies.get("edworld_session")?.value ||
      req.headers.get("authorization")?.replace(/^Bearer\s+/i, "") ||
      req.headers.get("x-session-token");

    const auth = validateSession(token || "");
    if (!auth.valid) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const category = searchParams.get("category");
    const search = searchParams.get("search");

    let sql = `
      SELECT id, name, goal, description, category, current_members, max_members, meeting_cadence, created_at
      FROM public.study_squads
      WHERE is_active = true
    `;
    const params: any[] = [];

    if (category && category !== "all" && category !== "All") {
      params.push(category);
      sql += ` AND category = $${params.length}`;
    }

    if (search && search.trim()) {
      params.push(`%${search.trim().toLowerCase()}%`);
      sql += ` AND (LOWER(name) LIKE $${params.length} OR LOWER(goal) LIKE $${params.length} OR LOWER(description) LIKE $${params.length})`;
    }

    sql += ` ORDER BY created_at DESC LIMIT 50`;

    const { rows } = await queryDb(sql, params);

    return NextResponse.json({
      success: true,
      squads: rows,
      total: rows.length,
    });
  } catch (err: any) {
    console.error("[Study Squads API Error]:", err);
    return NextResponse.json({ success: false, error: "Failed to fetch study squads" }, { status: 500 });
  }
}
