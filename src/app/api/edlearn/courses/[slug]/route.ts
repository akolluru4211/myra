import { NextRequest, NextResponse } from "next/server";
import { EDLEARN_COURSES } from "@/lib/learn/edlearn-courses";
import { queryDb } from "@/lib/db-server";
import { resolveMyraUser } from "@/lib/ai/myra-session";

export const dynamic = "force-dynamic";

export async function GET(
  req: NextRequest,
  { params }: { params: { slug: string } }
) {
  try {
    const slug = params.slug?.toLowerCase();
    const course = EDLEARN_COURSES[slug];

    if (!course) {
      return NextResponse.json({ success: false, error: "Course not found" }, { status: 404 });
    }

    const userId = await resolveMyraUser(req);
    let progressData = null;

    if (userId) {
      try {
        const { rows } = await queryDb(
          `SELECT completed_lessons, current_lesson_id, practice_scores, capstone_status, capstone_grade
           FROM public.edlearn_progress
           WHERE user_id = $1 AND course_slug = $2
           LIMIT 1`,
          [userId, slug]
        );
        if (rows.length > 0) {
          progressData = rows[0];
        }
      } catch (e) {
        console.warn("Could not query progress for course:", e);
      }
    }

    // Sanitize course details: strip secret solutions from practice tasks in public payload
    const sanitizedModules = course.modules.map((m) => ({
      id: m.id,
      title: m.title,
      level: m.level,
      summary: m.summary,
      lessons: m.lessons.map((l) => ({
        id: l.id,
        title: l.title,
        level: l.level,
        estimatedMinutes: l.estimatedMinutes,
        explanation: l.explanation,
        workedExample: l.workedExample,
        practiceTask: {
          prompt: l.practiceTask.prompt,
          starterCode: l.practiceTask.starterCode,
          testCases: l.practiceTask.testCases.map((tc) => ({
            input: tc.input,
            description: tc.description,
          })),
          hints: l.practiceTask.hints,
          commonMistakes: l.practiceTask.commonMistakes.map((cm) => ({
            explanation: cm.explanation,
            suggestedFix: cm.suggestedFix,
          })),
        },
      })),
    }));

    return NextResponse.json({
      success: true,
      course: {
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
        modules: sanitizedModules,
        capstone: {
          id: course.capstone.id,
          title: course.capstone.title,
          scenario: course.capstone.scenario,
          deliverables: course.capstone.deliverables,
          rubric: course.capstone.rubric,
          passingScore: course.capstone.passingScore,
          starterCodeOrData: course.capstone.starterCodeOrData,
        },
        userProgress: progressData,
      },
    });
  } catch (err: any) {
    console.error("[EdLearn Course Detail Error]:", err);
    return NextResponse.json({ success: false, error: "Failed to retrieve course details" }, { status: 500 });
  }
}
