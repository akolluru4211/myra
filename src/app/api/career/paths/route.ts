import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { CAREER_PATH_SEED } from "@/lib/data/career-path-seed";

export const dynamic = "force-dynamic";

export interface CareerPathRecord {
  id: string;
  name: string;
  category: string;
  description: string;
  typical_skills: string[];
  active: boolean;
  display_order: number;
}

export async function GET() {
  let rows: CareerPathRecord[];
  let source = "database";
  try {
    const { data, error } = await createClient()
      .from("career_paths")
      .select("id,name,category,description,typical_skills,active,display_order")
      .eq("active", true)
      .order("display_order")
      .order("name");
    if (error) throw error;
    rows = data ?? [];
  } catch (err) {
    console.error("[CareerPathsAPI:GET] Catalog query failed:", err);
    rows = CAREER_PATH_SEED;
    source = "seed";
  }

    // Group paths by category preserving order
    const categoriesMap: Record<string, CareerPathRecord[]> = {};
    for (const path of rows) {
      if (!categoriesMap[path.category]) {
        categoriesMap[path.category] = [];
      }
      categoriesMap[path.category].push(path);
    }

    const categories = Object.keys(categoriesMap).map((catName) => ({
      name: catName,
      paths: categoriesMap[catName],
    }));

    return NextResponse.json({
      success: true,
      source,
      total: rows.length,
      categories,
      paths: rows,
    });
}

