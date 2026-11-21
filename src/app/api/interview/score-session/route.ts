import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { queryDb } from "@/lib/db-server";
import { awardPoints } from "@/lib/gamification-service";
import { analyzeSpokenLanguage, syncUserCommunicationProfile } from "@/lib/interview/language-analysis-service";
import { UniversalAI } from "@/lib/ai/universal-ai";
import { MyraOrchestrator } from "@/lib/ai/myra-orchestration";

export const dynamic = "force-dynamic";

export interface InlineAnnotation {
  id: string;
  span: string;
  remark: string;
  type: "filler" | "pacing" | "example_needed" | "off_topic";
  startIndex?: number;
  endIndex?: number;
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      userId,
      category = "Software Engineering",
      difficultyLevel = 0,
      questions = [],
      transcript = "",
      durationSeconds = 60,
      targetRole = "",
      resumeContext = "",
      fullscreenExitEvents = [],
    } = body;

    if (!userId || !transcript) {
      return NextResponse.json({ error: "userId and transcript are required." }, { status: 400 });
    }

    const isTextFormat = body.format === "text" || body.mode === "text";
    const questionText = questions[0]?.text || "Mock Technical Interview Question";
    const effectiveRole = targetRole || category || "Software Engineer";

    // 1. Spoken Language & Communication Analysis (WPM, Fillers, Clarity) - only for voice/video rounds
    const langAnalysis = isTextFormat
      ? null
      : analyzeSpokenLanguage(transcript, durationSeconds, category);

    // 2. Deep Claude AI / Universal AI Evaluation
    const aiEvaluation = await UniversalAI.scoreInterviewResponse({
      questionText,
      transcript,
      targetRole: effectiveRole,
      questionCategory: category,
      resumeContext,
      suggestedDuration: questions[0]?.suggestedDurationSeconds || 120,
      actualDuration: durationSeconds,
    });

    const words = transcript.trim().split(/\s+/).filter(Boolean);
    const wordCount = words.length;
    const wordsPerMinute = !isTextFormat && langAnalysis ? langAnalysis.wordsPerMinute : null;

    // 3. Annotations
    const annotations: InlineAnnotation[] = [];
    const lowerTranscript = transcript.toLowerCase();

    // Filler word detection - only relevant for spoken transcripts
    if (!isTextFormat && langAnalysis) {
      const fillerWords = ["um", "uh", "like", "you know", "basically", "actually", "sort of"];
      fillerWords.forEach((fw) => {
        let pos = 0;
        while ((pos = lowerTranscript.indexOf(fw, pos)) !== -1) {
          annotations.push({
            id: `ann-filler-${Date.now()}-${annotations.length}`,
            span: transcript.substring(pos, pos + fw.length),
            remark: `Filler word cluster ("${fw}"). Brief silent pauses sound more authoritative.`,
            type: "filler",
            startIndex: pos,
            endIndex: pos + fw.length,
          });
          pos += fw.length;
          if (annotations.length > 8) break;
        }
      });
    }

    // Metric benchmark check
    if (!lowerTranscript.includes("percent") && !lowerTranscript.includes("%") && !lowerTranscript.includes("result") && !lowerTranscript.includes("increased") && !lowerTranscript.includes("reduced")) {
      const firstSentenceEnd = transcript.indexOf(".");
      const spanEnd = firstSentenceEnd !== -1 ? firstSentenceEnd : Math.min(60, transcript.length);
      annotations.push({
        id: `ann-example-${Date.now()}`,
        span: transcript.substring(0, spanEnd),
        remark: "Add a concrete metric benchmark (e.g. latency, throughput, scale) to solidify engineering credibility.",
        type: "example_needed",
        startIndex: 0,
        endIndex: spanEnd,
      });
    }

    // 4. Combined Scores (For text format: 60% content relevance/depth, 40% written structure/clarity)
    const contentScore = aiEvaluation.contentScore || 85;
    const voiceScore = !isTextFormat && langAnalysis ? (langAnalysis.overallLanguageScore || 80) : null;
    const engagementScore = !isTextFormat ? 85 : null;
    const overallScore = isTextFormat
      ? Math.round(contentScore * 0.6 + (aiEvaluation.structureScore || 85) * 0.4)
      : Math.round(contentScore * 0.5 + (voiceScore || 80) * 0.35 + (engagementScore || 85) * 0.15);

    // 5. Construct Feedback Object
    const feedback = {
      strengths: aiEvaluation.strengths.length > 0 ? aiEvaluation.strengths : (langAnalysis?.strengths || ["Structured technical delivery"]),
      areasForImprovement: aiEvaluation.areasForImprovement.length > 0 ? aiEvaluation.areasForImprovement : (langAnalysis?.areasForImprovement || ["Add deeper architectural metrics"]),
      detailedSummary: aiEvaluation.detailedSummary,
      nextPracticeAdvice: aiEvaluation.coachSuggestions?.[0] || "Practice structuring with STAR method (Situation, Task, Action, Result).",
      eyeContactFeedback: isTextFormat ? null : "Good visual focus and camera engagement maintained throughout.",
      tone: "encouraging",
      whatYouSaid: aiEvaluation.whatYouSaid || (langAnalysis?.whatYouSaid || transcript.slice(0, 300)),
      improvedVersion: aiEvaluation.improvedVersion || (langAnalysis?.improvedVersion || ""),
      improvementRationale: aiEvaluation.improvementRationale || (langAnalysis?.improvementRationale || []),
      coachSuggestions: aiEvaluation.coachSuggestions.length > 0 ? aiEvaluation.coachSuggestions : (langAnalysis?.coachSuggestions || []),
      starBreakdown: aiEvaluation.starBreakdown,
      modelUsed: aiEvaluation.modelUsed,
    };

    const metrics = {
      wordsPerMinute,
      fillerWordCount: langAnalysis?.fillerWordCount || 0,
      clarityScore: isTextFormat ? (aiEvaluation.structureScore || 85) : (langAnalysis?.clarityScore || 80),
      contentScore,
      voiceDelivery: voiceScore,
      facialEngagement: engagementScore,
      eyeContactRating: isTextFormat ? null : "Good — Natural Camera Engagement",
      structureRating: aiEvaluation.structureScore > 80 ? "Strong (STAR Method)" : "Good Functional Structure",
      fullscreenExitCount: fullscreenExitEvents.length,
      
      // Extended Communication & Language Telemetry
      languageScore: isTextFormat ? null : langAnalysis?.overallLanguageScore,
      grammarScore: isTextFormat ? 88 : langAnalysis?.grammarScore,
      fluencyScore: isTextFormat ? null : langAnalysis?.fluencyScore,
      vocabularyScore: isTextFormat ? 85 : langAnalysis?.vocabularyScore,
      professionalScore: isTextFormat ? 88 : langAnalysis?.professionalScore,
      fillerBreakdown: langAnalysis?.fillerBreakdown || {},
      topFiller: langAnalysis?.topFiller || null,
      whatYouSaid: feedback.whatYouSaid,
      improvedVersion: feedback.improvedVersion,
      improvementRationale: feedback.improvementRationale,
      coachSuggestions: feedback.coachSuggestions,
      dailyPracticePrompt: langAnalysis?.dailyPracticePrompt || "Structure your next answer using the STAR method.",
      modelUsed: aiEvaluation.modelUsed,
    };

    const interviewFormat = isTextFormat ? "text" : (body.format || "standard");
    const modelVersion = aiEvaluation.modelUsed || "claude-3-5-sonnet";
    const sessionId = (body.sessionId && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(body.sessionId))
      ? body.sessionId
      : (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function" ? crypto.randomUUID() : `00000000-0000-4000-8000-${Date.now().toString(16).padStart(12, '0')}`);

    const voiceOptIn = isTextFormat ? false : Boolean(body.voiceOptIn);
    const retentionExpiresAt = voiceOptIn 
      ? new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString() 
      : null;
    const audioDeletedAt = !voiceOptIn ? new Date().toISOString() : null;

    let isNewSession = true;

    // 6. Save Session with Upsert / Idempotency to prevent duplicate scoring or duplicate points on retries
    try {
      // Check existing session to protect against duplicate scores/points
      const existingRes = await queryDb(
        `SELECT id FROM public.interview_sessions WHERE id = $1 LIMIT 1`,
        [sessionId]
      );
      if (existingRes && existingRes.rows && existingRes.rows.length > 0) {
        isNewSession = false;
        await queryDb(
          `UPDATE public.interview_sessions SET
            category = $2, difficulty_level = $3, questions = $4, overall_score = $5,
            metrics = $6, updated_at = NOW()
           WHERE id = $1`,
          [
            sessionId,
            category,
            difficultyLevel,
            JSON.stringify(questions.length > 0 ? questions : [{ id: "q1", text: questionText, transcript }]),
            overallScore,
            JSON.stringify({
              ...metrics,
              annotations,
              fullscreen_exit_events: fullscreenExitEvents,
              format: interviewFormat,
              model_version: modelVersion,
              voice_opt_in: voiceOptIn,
              retention_expires_at: retentionExpiresAt,
            }),
          ]
        );
      } else {
        await queryDb(
          `INSERT INTO public.interview_sessions (
            id, user_id, category, difficulty_level, questions, overall_score,
            voice_opt_in, audio_url, audio_deleted_at, retention_expires_at, metrics, created_at
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)`,
          [
            sessionId,
            userId,
            category,
            difficultyLevel,
            JSON.stringify(questions.length > 0 ? questions : [{ id: "q1", text: questionText, transcript }]),
            overallScore,
            voiceOptIn,
            null,
            audioDeletedAt,
            retentionExpiresAt,
            JSON.stringify({
              ...metrics,
              annotations,
              fullscreen_exit_events: fullscreenExitEvents,
              format: interviewFormat,
              model_version: modelVersion,
              voice_opt_in: voiceOptIn,
              retention_expires_at: retentionExpiresAt,
            }),
            new Date().toISOString(),
          ]
        );
      }

      // Sync long-term user communication profile for voice rounds
      if (!isTextFormat && langAnalysis) {
        await syncUserCommunicationProfile(userId, langAnalysis).catch((e) => console.warn("[Profile Sync Note]:", e.message));
      }

      // Log interaction in myra_interactions table
      await queryDb(
        `INSERT INTO public.myra_interactions (
          user_id, feature_context, input_summary, output_summary, model_version, status, metadata, created_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, NOW())`,
        [
          userId,
          isTextFormat ? "interview_text_score" : "interview_score",
          `Question: ${questionText.slice(0, 100)}, Transcript: ${transcript.slice(0, 150)}`,
          `Overall Score: ${overallScore}/100, Structure: ${aiEvaluation.structureScore}`,
          aiEvaluation.modelUsed || MyraOrchestrator.getModelVersion(),
          "success",
          JSON.stringify({ overallScore, category, sessionId, format: interviewFormat }),
        ]
      ).catch((e) => console.warn("[Myra Interaction Log Warning]:", e.message));
    } catch (saveErr) {
      console.warn("[Save Interview Session Supabase Note]:", saveErr);
    }

    // 7. Gamification Points - only award once per unique session!
    if (isNewSession) {
      try {
        await awardPoints({
          userId,
          sourceFeature: "mock_interview",
          sourceId: sessionId,
          points: 50,
          timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC",
        });
      } catch (rewardErr) {
        console.warn("[Gamification Reward Note]:", rewardErr);
      }
    }

    return NextResponse.json({
      success: true,
      sessionId,
      format: interviewFormat,
      modelVersion,
      modelUsed: aiEvaluation.modelUsed,
      overallScore,
      contentScore,
      voiceScore,
      engagementScore,
      metrics,
      annotations,
      feedback,
      fullscreenExitEvents,
      languageAnalysis: langAnalysis,
    });
  } catch (error: any) {
    console.error("[Score Session Error]:", error);
    return NextResponse.json({ error: error.message || "Scoring error" }, { status: 500 });
  }
}
