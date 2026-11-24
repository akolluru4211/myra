import { NextRequest, NextResponse } from "next/server";
import { queryDb } from "@/lib/db-server";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export interface EventRecord {
  id: string;
  title: string;
  organizer: string;
  category: string;
  mode: string;
  is_free: boolean;
  prize_pool: string;
  banner_style: {
    theme?: string;
    bgGradient?: string;
    badgeColor?: string;
    accentColor?: string;
    headline?: string;
    subHeadline?: string;
    imageUrl?: string;
  };
  description: string;
  eligibility: string;
  registration_deadline: string;
  registration_url: string;
  registration_status: string;
  skills: string[];
  team_size: string;
  featured: boolean;
  display_order: number;
  created_at: string;
  is_saved?: boolean;
}

export async function GET(req: NextRequest) {
  try {
    const searchParams = req.nextUrl.searchParams;
    const category = searchParams.get("category");
    const search = searchParams.get("search");
    const queryUserId = searchParams.get("userId");
    const includeExpired = searchParams.get("includeExpired") === "true";

    // Resolve userId if logged in (validate UUID format so non-UUID auth tokens do not cause postgres type cast error)
    const isUuid = (val: string | null): boolean => {
      if (!val) return false;
      return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(val);
    };

    let userId = (queryUserId && isUuid(queryUserId)) ? queryUserId : null;
    if (!userId) {
      try {
        const supabase = createClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (user?.id && isUuid(user.id)) userId = user.id;
      } catch (e) {
        // Continue unauthenticated
      }
    }

    let sql = `
      SELECT 
        e.id,
        e.title,
        e.organizer,
        e.category,
        e.mode,
        e.is_free,
        e.prize_pool,
        e.banner_style,
        e.description,
        e.eligibility,
        e.registration_deadline,
        e.registration_url,
        e.registration_status,
        e.skills,
        e.team_size,
        e.featured,
        e.display_order,
        e.created_at,
        ${userId ? `EXISTS(SELECT 1 FROM public.user_saved_events use WHERE use.event_id = e.id AND use.user_id = $1::uuid)` : `false`} AS is_saved
      FROM public.events e
      WHERE 1=1
    `;

    const params: any[] = [];
    if (userId) {
      params.push(userId);
    }

    // Hide expired events by default unless requested (e.g. for management)
    if (!includeExpired) {
      sql += ` AND (e.registration_deadline IS NULL OR e.registration_deadline >= NOW() - INTERVAL '1 day')`;
    }

    if (category && category !== "all" && category !== "All") {
      params.push(category);
      sql += ` AND e.category ILIKE $${params.length}`;
    }

    if (search && search.trim()) {
      params.push(`%${search.trim()}%`);
      sql += ` AND (e.title ILIKE $${params.length} OR e.organizer ILIKE $${params.length} OR e.description ILIKE $${params.length})`;
    }

    // Order by featured priority/order first, then upcoming deadline date, then creation
    sql += ` ORDER BY e.display_order ASC, e.registration_deadline ASC NULLS LAST, e.created_at DESC;`;

    const { rows } = await queryDb<EventRecord>(sql, params);

    return NextResponse.json({
      success: true,
      total: rows.length,
      events: rows,
    });
  } catch (err: any) {
    console.error("[EventsAPI:GET] Error:", err);
    return NextResponse.json(
      { success: false, error: "Failed to retrieve events catalog" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();

    // Check staff/admin authorization
    let isStaff = false;
    if (user?.id) {
      const { data: profile } = await supabase
        .from("profiles")
        .select("role, is_admin")
        .eq("id", user.id)
        .maybeSingle();
      if (profile?.is_admin || ["ADMIN", "SUPER_ADMIN", "FOUNDER", "STAFF"].includes(profile?.role)) {
        isStaff = true;
      }
    }

    // Support internal service header for automated testing or backend worker dispatch
    const internalSecret = req.headers.get("x-internal-secret");
    if (internalSecret && internalSecret === process.env.INTERNAL_SERVICE_SECRET) {
      isStaff = true;
    }

    if (!isStaff) {
      return NextResponse.json(
        { success: false, error: "Unauthorized: Staff permission required to manage featured events." },
        { status: 403 }
      );
    }

    const body = await req.json();
    const {
      title,
      organizer,
      category = "Hackathon",
      mode = "Online",
      is_free = true,
      prize_pool = "Exciting Prizes",
      banner_style = {},
      description = "",
      eligibility = "Open to all college students",
      registration_deadline = null,
      registration_url = "/dashboard",
      registration_status = "Open",
      skills = [],
      team_size = "1-4 Members",
      featured = true,
      display_order = 0,
    } = body;

    if (!title || !organizer) {
      return NextResponse.json(
        { success: false, error: "Missing required fields: title and organizer are required." },
        { status: 400 }
      );
    }

    const insertSql = `
      INSERT INTO public.events (
        title, organizer, category, mode, is_free, prize_pool, banner_style,
        description, eligibility, registration_deadline, registration_url,
        registration_status, skills, team_size, featured, display_order, created_at
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, NOW())
      RETURNING *;
    `;

    const values = [
      title,
      organizer,
      category,
      mode,
      is_free,
      prize_pool,
      JSON.stringify(banner_style),
      description,
      eligibility,
      registration_deadline ? new Date(registration_deadline).toISOString() : null,
      registration_url,
      registration_status,
      skills,
      team_size,
      featured,
      display_order,
    ];

    const { rows } = await queryDb<EventRecord>(insertSql, values);

    return NextResponse.json({
      success: true,
      event: rows[0],
    });
  } catch (err: any) {
    console.error("[EventsAPI:POST] Error:", err);
    return NextResponse.json(
      { success: false, error: err?.message || "Failed to create event" },
      { status: 500 }
    );
  }
}
