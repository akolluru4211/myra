import { NextRequest, NextResponse } from "next/server";
import { EDLEARN_COURSES } from "@/lib/learn/edlearn-courses";
import { executeCodeSandbox, executeSqlSandbox } from "@/lib/learn/sandbox-runner";
import { queryDb } from "@/lib/db-server";
import { resolveMyraUser } from "@/lib/ai/myra-session";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const { courseSlug, lessonId, codeOrAnswer } = body;

    if (!courseSlug || !lessonId || typeof codeOrAnswer !== "string") {
      return NextResponse.json({ success: false, error: "Missing required fields" }, { status: 400 });
    }

    const course = EDLEARN_COURSES[courseSlug.toLowerCase()];
    if (!course) {
      return NextResponse.json({ success: false, error: "Course not found" }, { status: 404 });
    }

    // Locate lesson
    let targetLesson = null;
    for (const m of course.modules) {
      for (const l of m.lessons) {
        if (l.id === lessonId) {
          targetLesson = l;
          break;
        }
      }
      if (targetLesson) break;
    }

    if (!targetLesson) {
      return NextResponse.json({ success: false, error: "Lesson not found" }, { status: 404 });
    }

    const practiceTask = targetLesson.practiceTask;
    let execResult;

    if (course.track === "SQL") {
      execResult = executeSqlSandbox(codeOrAnswer, practiceTask.testCases);
    } else {
      execResult = executeCodeSandbox(codeOrAnswer, practiceTask.testCases);
    }

    // Check for common mistake patterns to provide feedback
    let mistakeFeedback = null;
    for (const cm of practiceTask.commonMistakes) {
      if (new RegExp(cm.triggerRegexOrValue, "i").test(codeOrAnswer)) {
        mistakeFeedback = {
          explanation: cm.explanation,
          suggestedFix: cm.suggestedFix,
        };
        break;
      }
    }

    // If passed and user is authenticated, record progress
    const userId = await resolveMyraUser(req);
    if (userId && execResult.success) {
      try {
        await queryDb(
          `INSERT INTO public.edlearn_progress (user_id, course_slug, completed_lessons, current_lesson_id, updated_at)
           VALUES ($1, $2, ARRAY[$3]::text[], $3, NOW())
           ON CONFLICT (user_id, course_slug)
           DO UPDATE SET
             completed_lessons = array_append(
               array_remove(public.edlearn_progress.completed_lessons, $3),
               $3
             ),
             current_lesson_id = $3,
             updated_at = NOW()`,
          [userId, course.slug, lessonId]
        );
      } catch (e) {
        console.warn("Could not save lesson progress to DB:", e);
      }
    }

    return NextResponse.json({
      success: true,
      passed: execResult.success,
      output: execResult.output,
      executionTimeMs: execResult.executionTimeMs,
      testsPassed: execResult.testsPassed,
      totalTests: execResult.totalTests,
      details: execResult.details,
      mistakeFeedback,
    });
  } catch (err: any) {
    console.error("[EdLearn Practice Submit Error]:", err);
    return NextResponse.json({ success: false, error: "Failed to evaluate practice submission" }, { status: 500 });
  }
}
