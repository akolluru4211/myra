import { NextRequest, NextResponse } from "next/server";
import { EDLEARN_RESEARCH_PAPERS } from "@/lib/learn/research-papers";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const course = searchParams.get("course");
    const topic = searchParams.get("topic");
    const query = searchParams.get("search");

    let papers = EDLEARN_RESEARCH_PAPERS;

    if (course && course !== "all" && course !== "All") {
      papers = papers.filter((p) => p.courseSlugs.includes(course.toLowerCase()));
    }

    if (topic && topic !== "all" && topic !== "All") {
      papers = papers.filter((p) =>
        p.topics.some((t) => t.toLowerCase() === topic.toLowerCase())
      );
    }

    if (query && query.trim()) {
      const q = query.trim().toLowerCase();
      papers = papers.filter(
        (p) =>
          p.title.toLowerCase().includes(q) ||
          p.authors.some((a) => a.toLowerCase().includes(q)) ||
          p.abstract.toLowerCase().includes(q) ||
          p.whatYouCanLearn.toLowerCase().includes(q)
      );
    }

    return NextResponse.json({
      success: true,
      total: papers.length,
      papers,
    });
  } catch (err: any) {
    console.error("[EdLearn Papers Error]:", err);
    return NextResponse.json({ success: false, error: "Failed to retrieve papers catalog" }, { status: 500 });
  }
}
