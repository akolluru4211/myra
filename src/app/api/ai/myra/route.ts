import { NextRequest, NextResponse } from "next/server";
import { resolveMyraUser } from "@/lib/ai/myra-session";
import { MyraOrchestrator } from "@/lib/ai/myra-orchestration";
import { 
  buildMyraContextPrompt, 
  StudentProfileContext, 
  MYRA_ONBOARDING_OPENING_MESSAGE,
  MYRA_CAREER_WRITING_OPENING_MESSAGE 
} from "@/lib/ai/myra-agent";
import { resolveWebReach } from "@/lib/ai/web-reach";
import { 
  syncUserLearningProfile, 
  getUserLearningProfile, 
  resetUserLearningProfile,
  MyraCognitiveMemory 
} from "@/lib/ai/myra-learning-engine";
import { formatToolRegistrySystemPrompt, isActionOffLimits } from "@/lib/ai/myra-tools";
import { proposeToolAction, executeConfirmedToolAction } from "@/lib/ai/myra-tool-executor";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  if (!body || typeof body !== "object" || Array.isArray(body) ||
      (body.message != null && typeof body.message !== "string")) {
    return NextResponse.json({ error: "Invalid Myra request." }, { status: 400 });
  }

  try {
    const { 
      message, 
      userId: requestedUserId, 
      profile, 
      history = [], 
      action, 
      tool, 
      parameters,
      interviewContext,
      onboardingContext,
      writingContext,
      mode
    } = body || {};

    // 0. Handle Onboarding Fast-Path Initial Greeting
    if (mode === "onboarding" && (!message || message.trim().toLowerCase() === "start" || message.trim().toLowerCase() === "init")) {
      const studentName = profile?.name ? profile.name.split(" ")[0] : null;
      const initialGreeting = studentName
        ? `Hi ${studentName}! 👋 Welcome to EdWorld Co. I'm here to help you get set up and make a plan that fits your goals. It'll only take about 10 minutes. First, what brings you to EdWorld?`
        : MYRA_ONBOARDING_OPENING_MESSAGE;

      return NextResponse.json({
        reply: initialGreeting,
        model: "Myra Onboarding Assistant",
        stage: 1,
        actionProposal: null,
      });
    }

    // 0B. Handle Career & Writing Fast-Path Initial Greeting
    if (mode === "career_writing" && (!message || message.trim().toLowerCase() === "start" || message.trim().toLowerCase() === "init")) {
      return NextResponse.json({
        reply: MYRA_CAREER_WRITING_OPENING_MESSAGE,
        model: "Myra Career & Writing Assistant",
        module: writingContext?.module || "Professional Summary",
        actionProposal: null,
      });
    }

    const userId = await resolveMyraUser(req);
    if (requestedUserId && requestedUserId !== userId) {
      return NextResponse.json(
        { error: userId ? "Student identity does not match the session." : "Please sign in to use personalized Myra features." },
        { status: userId ? 403 : 401 }
      );
    }

    // 0A. Handle Direct Action Execution (Confirmed by User)
    if (action === "execute_confirmed") {
      if (!userId) {
        return NextResponse.json({ error: "Authentication required to execute actions." }, { status: 401 });
      }
      if (!tool) {
        return NextResponse.json({ error: "Tool name is required." }, { status: 400 });
      }

      const execResult = await executeConfirmedToolAction(userId, tool, parameters || {});
      return NextResponse.json(execResult, { status: execResult.success ? 200 : 400 });
    }

    // 0B. Handle Direct Action Proposal (e.g. from Resume or Interview UI buttons)
    if (action === "propose_direct") {
      if (!userId) {
        return NextResponse.json({ error: "Authentication required to propose actions." }, { status: 401 });
      }
      if (!tool) {
        return NextResponse.json({ error: "Tool name is required." }, { status: 400 });
      }

      const proposalResult = await proposeToolAction(userId, tool, parameters || {}, message);
      if (proposalResult.error) {
        return NextResponse.json({ error: proposalResult.error }, { status: 400 });
      }
      return NextResponse.json({ success: true, proposal: proposalResult.proposal });
    }

    if (!message || typeof message !== "string" || !message.trim()) {
      return NextResponse.json(
        { error: "Query message is required." },
        { status: 400 }
      );
    }

    // Aegis Sentinel AI Prompt-Injection & Jailbreak Inspection
    const { evaluateThreat } = await import("@/lib/security/sentinel-agent");
    const threatCheck = evaluateThreat({
      ip: req.headers.get("x-forwarded-for")?.split(",")[0] || "127.0.0.1",
      userAgent: req.headers.get("user-agent") || "",
      path: "/api/ai/myra",
      bodyText: message,
      requestId: req.headers.get("x-request-id") || undefined,
    });

    if (threatCheck.blocked || threatCheck.threatVectors.includes("PROMPT_INJECTION") || threatCheck.threatVectors.includes("OWASP_EXPLOIT")) {
      return NextResponse.json(
        {
          reply: "I am your AI career mentor. Your message was flagged by Aegis Sentinel AI for safety and prompt integrity guidelines.",
          error: "PROMPT_SECURITY_FLAGGED",
          riskScore: threatCheck.riskScore,
        },
        { status: 403 }
      );
    }

    // Check for off-limits prompt keywords
    const safetyCheck = isActionOffLimits(message);
    if (safetyCheck.forbidden) {
      return NextResponse.json({
        reply: `I am unable to carry out that request. ${safetyCheck.reason}`,
        model: "Myra Safety Guardrail",
        actionProposal: null,
      });
    }

    // 1. Fetch user's existing cognitive memory & database profile if userId is available
    let existingMemory: MyraCognitiveMemory | null = null;
    let dbProfile: any = null;
    if (userId) {
      try {
        existingMemory = await getUserLearningProfile(userId);
      } catch (e) {
        console.warn("Could not retrieve user learning profile:", e);
      }
      try {
        const { queryDb } = await import("@/lib/db-server");
        const { rows } = await queryDb(
          `SELECT id, name, display_name, target_role, career_stage, headline, institution, degree, field_of_study, graduation_year, cgpa, interests, primary_goal 
           FROM public.profiles 
           WHERE id = $1 LIMIT 1`,
          [userId]
        );
        if (rows && rows.length > 0) {
          dbProfile = rows[0];
        }
      } catch (pErr) {
        console.warn("Could not retrieve user db profile:", pErr);
      }
    }

    // Merge memory, database records, and request profile into authoritative profile context
    const enrichedProfile: StudentProfileContext = {
      name: profile?.name || dbProfile?.display_name || dbProfile?.name || undefined,
      institution: profile?.institution || dbProfile?.institution || undefined,
      degree: profile?.degree || dbProfile?.degree || undefined,
      field_of_study: profile?.field_of_study || dbProfile?.field_of_study || undefined,
      graduation_year: profile?.graduation_year || dbProfile?.graduation_year || undefined,
      cgpa: profile?.cgpa || dbProfile?.cgpa || undefined,
      targetRole: profile?.targetRole || dbProfile?.target_role || "Software Engineer",
      primaryGoal: profile?.primaryGoal || dbProfile?.primary_goal || undefined,
      interests: profile?.interests || (Array.isArray(dbProfile?.interests) ? dbProfile.interests : []),
      dailyStudyHours: profile?.dailyStudyHours || 2,
      careerStage: profile?.careerStage || dbProfile?.career_stage || "STUDENT",
      frequentTopics: existingMemory?.frequentTopics?.slice(0, 5) || profile?.frequentTopics,
      searchedTechnologies: existingMemory?.searchedTechnologies?.slice(0, 5) || profile?.searchedTechnologies,
      strugglePoints: existingMemory?.strugglePoints?.slice(-5) || profile?.strugglePoints,
      learningStylePreference: existingMemory?.learningStylePreference || profile?.learningStylePreference,
      interviewContext: interviewContext || profile?.interviewContext,
      onboardingContext: onboardingContext || (mode === "onboarding" ? { stage: 1 } : profile?.onboardingContext),
      writingContext: writingContext || (mode === "career_writing" ? { module: "Professional Summary" } : profile?.writingContext),
    };

    // Dynamically separate explicit [CONTEXT: ...] prefix from actual student query if present
    let rawStudentQuery = (message || "").trim();
    let detectedScreenContext = body?.screenContext || "";
    if (rawStudentQuery.startsWith("[CONTEXT:")) {
      const newlineIdx = rawStudentQuery.indexOf("\n");
      if (newlineIdx !== -1) {
        if (!detectedScreenContext) {
          detectedScreenContext = rawStudentQuery.slice(0, newlineIdx).trim();
        }
        rawStudentQuery = rawStudentQuery.slice(newlineIdx + 1).trim();
      }
    }
    const finalStudentQuery = rawStudentQuery || detectedScreenContext || "Hello Myra";

    // 2. Dynamically resolve live GitHub repository or web URL / search reach
    let webReachContext = null;
    try {
      webReachContext = await resolveWebReach(finalStudentQuery);
    } catch (e) {
      console.warn("Web reach resolution skipped:", e);
    }

    // 3. Build adaptive prompt with learned memory, web data and strict tool registry
    const { systemPrompt, prompt } = buildMyraContextPrompt(
      finalStudentQuery,
      enrichedProfile,
      history,
      webReachContext
    );

    const toolPrompt = formatToolRegistrySystemPrompt();
    const combinedSystemPrompt = `${systemPrompt}\n\n${toolPrompt}`;

    // 4. Generate AI response through centralized Myra Orchestration Service
    const orchestrationResult = await MyraOrchestrator.execute({
      userId: userId ?? undefined,
      featureContext: "ask_myra",
      prompt,
      rawQuery: finalStudentQuery,
      systemPromptOverride: combinedSystemPrompt,
      clientProfile: enrichedProfile,
      temperature: 0.6,
      maxTokens: 1000,
      metadata: { hasWebReach: Boolean(webReachContext) },
    });

    if (orchestrationResult.rateLimited) {
      return NextResponse.json(
        { 
          error: orchestrationResult.error || "Rate limit reached.", 
          reply: orchestrationResult.text,
          rateLimited: true 
        },
        { status: 429 }
      );
    }

    // 4B. Detect & process any tool action blocks generated by the model
    let actionProposal = null;
    let rawText = orchestrationResult.text || "";

    const actionMatch = rawText.match(/```(?:myra_action|json)?\s*(\{\s*"tool"[\s\S]*?\})\s*```/);
    if (actionMatch && actionMatch[1]) {
      try {
        const parsedAction = JSON.parse(actionMatch[1]);
        if (userId && parsedAction?.tool) {
          const propRes = await proposeToolAction(
            userId,
            parsedAction.tool,
            parsedAction.parameters || {},
            message.trim()
          );
          if (propRes.proposal) {
            actionProposal = propRes.proposal;
          }
        }
      } catch (parseErr) {
        console.warn("[Myra Action Block Parse Note]:", parseErr);
      }
      // Strip action block from conversational text
      rawText = rawText.replace(/```(?:myra_action|json)?\s*\{\s*"tool"[\s\S]*?\}\s*```/, "").trim();
    }

    // Clean and sanitize text to ensure zero asterisks and high readability
    const replyText = sanitizeMyraText(rawText);
    const modelName = orchestrationResult.modelUsed;

    // 5. Asynchronously teach Myra and update student cognitive memory
    let updatedMemory: MyraCognitiveMemory | null = null;
    if (userId) {
      try {
        updatedMemory = await syncUserLearningProfile(
          userId,
          message.trim(),
          replyText,
          Boolean(webReachContext)
        );
      } catch (learnErr) {
        console.warn("[Myra Learning Sync Note]:", learnErr);
      }
    }

    return NextResponse.json({
      reply: replyText,
      model: modelName,
      actionProposal,
      webReach: webReachContext ? { url: webReachContext.url, title: webReachContext.title, sourceType: webReachContext.sourceType } : null,
      memory: updatedMemory ? {
        totalInteractions: updatedMemory.totalInteractions,
        frequentTopics: updatedMemory.frequentTopics.slice(0, 6),
        searchedTechnologies: updatedMemory.searchedTechnologies.slice(0, 6),
        strugglePoints: updatedMemory.strugglePoints.slice(-4),
      } : null,
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error("Myra AI route outer error:", error);
    
    return NextResponse.json({ error: "Myra could not complete the request. Please try again." }, { status: 500 });
  }
}

/**
 * Strips all asterisk symbols (*, **, ***) and cleans up formatting
 * to guarantee polite, clean, plain-text responses without markdown asterisks.
 */
function sanitizeMyraText(text: string): string {
  if (!text) return "";
  // Strip bold/italic asterisks: **word** -> word, *word* -> word
  let cleaned = text.replace(/\*{1,3}([^*]+)\*{1,3}/g, "$1");
  // Strip any leftover standalone asterisks
  cleaned = cleaned.replace(/\*/g, "");
  return cleaned.trim();
}

export async function GET(req: NextRequest) {
  const userId = await resolveMyraUser(req);
  if (!userId) {
    return NextResponse.json({ error: "Authentication required to view memory." }, { status: 401 });
  }

  const requestedUserId = req.nextUrl.searchParams.get("userId");
  if (requestedUserId && requestedUserId !== userId) {
    return NextResponse.json({ error: "Student identity does not match the session." }, { status: 403 });
  }
  if (req.nextUrl.searchParams.has("action")) {
    return NextResponse.json({ error: "Use DELETE to reset memory." }, { status: 405, headers: { Allow: "GET, DELETE" } });
  }

  try {
    const memory = await getUserLearningProfile(userId);
    return NextResponse.json({ success: true, memory }, { headers: { "Cache-Control": "private, no-store" } });
  } catch {
    return NextResponse.json({ error: "Failed to load Myra memory." }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  const userId = await resolveMyraUser(req);
  if (!userId) {
    return NextResponse.json({ error: "Authentication required to reset memory." }, { status: 401 });
  }

  const requestedUserId = req.nextUrl.searchParams.get("userId");
  if (requestedUserId && requestedUserId !== userId) {
    return NextResponse.json({ error: "Student identity does not match the session." }, { status: 403 });
  }

  const success = await resetUserLearningProfile(userId);
  return success
    ? NextResponse.json({ success: true })
    : NextResponse.json({ error: "Failed to reset Myra memory." }, { status: 500 });
}
