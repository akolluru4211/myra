import { NextRequest, NextResponse } from "next/server";
import { EDLEARN_COURSES } from "@/lib/learn/edlearn-courses";
import { resolveMyraUser } from "@/lib/ai/myra-session";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const { actionType, courseSlug, lessonId, currentAttempt = "", hintLevel = 1 } = body;

    if (!courseSlug || !lessonId || !actionType) {
      return NextResponse.json({ success: false, error: "Missing required parameters" }, { status: 400 });
    }

    const course = EDLEARN_COURSES[courseSlug.toLowerCase()];
    if (!course) {
      return NextResponse.json({ success: false, error: "Course not found" }, { status: 404 });
    }

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

    const task = targetLesson.practiceTask;
    let reply = "";
    let actionRecommendation = null;

    if (actionType === "give_hint") {
      const idx = Math.min(Math.max(0, Number(hintLevel) - 1), task.hints.length - 1);
      const stage = idx + 1;
      const totalStages = task.hints.length;
      reply = `💡 **Myra Hint (Step ${stage}/${totalStages}):**\n\n${task.hints[idx]}\n\n*Try applying this observation to your draft and run the test cases again!*`;
    } else if (actionType === "explain_mistake") {
      let matchedMistake = null;
      for (const cm of task.commonMistakes) {
        if (new RegExp(cm.triggerRegexOrValue, "i").test(currentAttempt)) {
          matchedMistake = cm;
          break;
        }
      }

      if (matchedMistake) {
        reply = `🔍 **Explaining Your Mistake:**\n\n${matchedMistake.explanation}\n\n👉 **Recommended Adjustment:** ${matchedMistake.suggestedFix}`;
      } else if (!currentAttempt.trim()) {
        reply = `Your editor is currently empty! Review the worked example above, then start by sketching the function signature or first step.`;
      } else {
        reply = `Your attempt is on the right track structurally, but is either failing edge cases or output formatting. Check your return statement and ensure you match the exact return types expected in the task description.`;
      }
    } else if (actionType === "suggest_next") {
      reply = `🎯 **What to Practice Next:**\n\nAfter mastering "${targetLesson.title}", the recommended progression is to tackle the next module in ${course.title} to build towards the "${course.capstone.title}" capstone project.`;
      actionRecommendation = {
        courseSlug: course.slug,
        lessonTitle: targetLesson.title,
        capstoneTitle: course.capstone.title,
      };
    } else {
      reply = `I am here to help you master "${targetLesson.title}". You can ask me for a hint, to explain an error, or suggest the next step!`;
    }

    return NextResponse.json({
      success: true,
      actionType,
      reply,
      actionRecommendation,
    });
  } catch (err: any) {
    console.error("[EdLearn Tutor Error]:", err);
    return NextResponse.json({ success: false, error: "Failed to generate tutoring response" }, { status: 500 });
  }
}
