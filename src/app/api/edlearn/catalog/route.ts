import { NextRequest, NextResponse } from "next/server";
import { EDLEARN_COURSES } from "@/lib/learn/edlearn-courses";
import { queryDb } from "@/lib/db-server";
import { resolveMyraUser } from "@/lib/ai/myra-session";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const userId = await resolveMyraUser(req);
    const { searchParams } = new URL(req.url);
    const category = searchParams.get("category");
    const search = searchParams.get("search");

    // Fetch user progress for all EdLearn courses if signed in
    let userProgressMap: Record<string, any> = {};
    if (userId) {
      try {
        const { rows } = await queryDb(
          `SELECT course_slug, completed_lessons, current_lesson_id, capstone_status, capstone_grade
           FROM public.edlearn_progress
           WHERE user_id = $1`,
          [userId]
        );
        for (const row of rows) {
          userProgressMap[row.course_slug] = row;
        }
      } catch (e) {
        console.warn("Could not query edlearn_progress:", e);
      }
    }

    const coursesList = Object.values(EDLEARN_COURSES).map((course) => {
      const prog = userProgressMap[course.slug] || {};
      const completedCount = Array.isArray(prog.completed_lessons) ? prog.completed_lessons.length : 0;
      const totalLessons = course.modules.reduce((acc, m) => acc + m.lessons.length, 0);
      const percent = totalLessons > 0 ? Math.round((completedCount / totalLessons) * 100) : 0;

      return {
        slug: course.slug,
        title: course.title,
        tagline: course.tagline,
        track: course.track,
        level: course.level,
        estimatedHours: course.estimatedHours,
        prerequisites: course.prerequisites,
        skills: course.skills,
        icon: course.icon,
        color: course.color,
        totalModules: course.modules.length,
        totalLessons,
        capstoneTitle: course.capstone.title,
        progress: {
          completedLessons: completedCount,
          totalLessons,
          percentage: percent,
          currentLessonId: prog.current_lesson_id || course.modules[0]?.lessons[0]?.id,
          capstoneStatus: prog.capstone_status || "not_started",
          passed: prog.capstone_status === "passed",
        },
      };
    });

    let filtered = coursesList;
    if (category && category !== "all" && category !== "All") {
      filtered = filtered.filter((c) => c.track.toLowerCase() === category.toLowerCase());
    }
    if (search && search.trim()) {
      const q = search.trim().toLowerCase();
      filtered = filtered.filter(
        (c) =>
          c.title.toLowerCase().includes(q) ||
          c.tagline.toLowerCase().includes(q) ||
          c.skills.some((s) => s.toLowerCase().includes(q))
      );
    }

    return NextResponse.json({
      success: true,
      courses: filtered,
    });
  } catch (err: any) {
    console.error("[EdLearn Catalog Error]:", err);
    return NextResponse.json({ success: false, error: "Failed to retrieve EdLearn catalog" }, { status: 500 });
  }
}
