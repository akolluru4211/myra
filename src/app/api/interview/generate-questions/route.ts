import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { UniversalAI, InterviewQuestionItem } from "@/lib/ai/universal-ai";
import { MyraOrchestrator } from "@/lib/ai/myra-orchestration";
import { pickInterviewQuestions } from "@/lib/interview/interview-bank";

export const dynamic = "force-dynamic";

export interface GeneratedQuestion {
  id: string;
  text: string;
  category: string;
  difficultyLevel: 0 | 1 | 2;
  keyPoints?: string[];
  suggestedDurationSeconds?: number;
  isWarmup?: boolean;
  type: "warmup" | "project_deep_dive" | "technical" | "behavioral" | "system_design";
  contextSource?: string;
  adaptiveFocus?: string;
}

export async function POST(req: NextRequest) {
  let body: any = {};
  try {
    body = await req.json().catch(() => ({}));
    const {
      jobDescription = "",
      sector = "",
      category = "Software Engineering",
      effectiveLevel = 0,
      userId = "learner-user",
      candidateName = "",
      resumeId = null,
      resumeContent = null,
      rawResumeText = "",
      targetRole = "",
      companyTrack = "faang",
      mode = "ai_resume",
    } = body;

    const firstName = candidateName ? candidateName.trim().split(" ")[0] : "";
    const effectiveRole = targetRole || (sector ? `${sector} Specialist` : category) || "Software Engineer";
    const levelLabel = effectiveLevel === 2 ? "Senior" : effectiveLevel === 1 ? "Mid-Level" : "Junior/Entry";

    const companyTrackNames: Record<string, string> = {
      faang: "Big Tech (Google / Meta / Amazon)",
      startups: "High-Growth Unicorn (Stripe / Uber)",
      fintech: "FinTech & Quantitative Systems (Goldman / Citadel)",
      general: "General Tech Industry",
    };
    const trackLabel = companyTrackNames[companyTrack] || companyTrackNames.faang;

    // Fast-path: Direct 1,000 Questions Bank drill mode
    if (mode === "question_bank") {
      const bankQuestions = pickInterviewQuestions({
        sector: sector || targetRole || category,
        level: levelLabel,
        limit: 5,
        seed: Date.now(),
      });

      const formattedBankQuestions: GeneratedQuestion[] = bankQuestions.map((q, idx) => ({
        id: q.id || `bank_q_${idx + 1}`,
        text: idx === 0 && firstName
          ? `Hi ${firstName}, welcome to your sector interview drill for ${q.sector}. ${q.question}`
          : q.question,
        category: q.sector || category,
        difficultyLevel: (q.level.toLowerCase().includes("senior") ? 2 : q.level.toLowerCase().includes("mid") ? 1 : 0) as 0 | 1 | 2,
        keyPoints: ["STAR structured delivery", "Concrete trade-off metrics", "Industry standard methodology"],
        suggestedDurationSeconds: idx === 0 ? 90 : 120,
        isWarmup: idx === 0,
        type: idx === 0 ? "warmup" : idx === 1 ? "project_deep_dive" : idx === 2 ? "technical" : idx === 3 ? "behavioral" : "system_design",
        contextSource: `1,000 Questions Bank • ${q.sector} (${q.round})`,
        adaptiveFocus: `${q.sector} Sector Competency`,
      }));

      return NextResponse.json({
        success: true,
        source: "EdWorld 1,000 Questions Bank",
        modelUsed: "1,000 Questions Bank & 46 Sectors Engine",
        resumeConnected: false,
        resumeTitle: null,
        questions: formattedBankQuestions,
        extractedSkillsCount: 0,
        extractedProjectsCount: 0,
        adaptiveProfileApplied: false,
        sector: sector || targetRole,
      });
    }

    let resumeTitle = "";
    let resumeSummary = "";
    let extractedSkills: string[] = [];
    let extractedProjects: Array<{ title: string; description?: string; technologies?: string[] }> = [];
    let extractedExperience: Array<{ company?: string; role?: string; description?: string }> = [];

    // 1. Load Resume from Supabase if resumeId is provided
    if (resumeId && userId && userId !== "guest") {
      try {
        const { data: dbResume } = await supabase
          .from("resumes")
          .select("id, title, content")
          .eq("id", resumeId)
          .maybeSingle();

        if (dbResume && dbResume.content) {
          resumeTitle = dbResume.title || "User Resume";
          const c = dbResume.content;
          resumeSummary = c.summary || "";
          
          if (c.skills) {
            if (Array.isArray(c.skills.technical)) extractedSkills.push(...c.skills.technical);
            if (Array.isArray(c.skills.tools)) extractedSkills.push(...c.skills.tools);
            if (Array.isArray(c.skills.soft)) extractedSkills.push(...c.skills.soft);
            if (Array.isArray(c.skills)) extractedSkills.push(...c.skills);
          }

          if (Array.isArray(c.projects)) {
            extractedProjects = c.projects.map((p: any) => ({
              title: p.title || p.name || "Project",
              description: p.description || p.bullets?.join("; ") || "",
              technologies: Array.isArray(p.technologies) ? p.technologies : [],
            }));
          }

          if (Array.isArray(c.experience)) {
            extractedExperience = c.experience.map((e: any) => ({
              company: e.company || e.organization || "",
              role: e.role || e.title || "",
              description: e.description || e.bullets?.join("; ") || "",
            }));
          }
        }
      } catch (err) {
        console.warn("[Fetch Resume Supabase Note]:", err);
      }
    } else if (resumeContent) {
      // In-memory or parsed resume object
      resumeTitle = resumeContent.title || "Custom Resume";
      resumeSummary = resumeContent.summary || "";
      if (Array.isArray(resumeContent.skills)) {
        extractedSkills = resumeContent.skills;
      } else if (resumeContent.skills) {
        extractedSkills = [
          ...(resumeContent.skills.technical || []),
          ...(resumeContent.skills.tools || []),
        ];
      }
      if (Array.isArray(resumeContent.projects)) {
        extractedProjects = resumeContent.projects;
      }
      if (Array.isArray(resumeContent.experience)) {
        extractedExperience = resumeContent.experience;
      }
    }

    // 2. Fetch User's Historical Communication Profile & Learned Cognitive Memory
    let userCommProfile: any = null;
    let learnedMemoryContext = "";
    if (userId && userId !== "guest") {
      try {
        const { data: profileData } = await supabase
          .from("communication_profiles")
          .select("*")
          .eq("user_id", userId)
          .maybeSingle();
        userCommProfile = profileData;

        // Fetch cognitive learning profile (topics asked, searched, and struggle areas)
        const { data: learningData } = await supabase
          .from("user_ai_learning_profiles")
          .select("cognitive_memory")
          .eq("user_id", userId)
          .maybeSingle();

        if (learningData && learningData.cognitive_memory) {
          const mem = learningData.cognitive_memory;
          const struggles = mem.strugglePoints?.map((s: any) => s.concept).join(", ");
          const searched = mem.searchedTechnologies?.map((t: any) => t.tech).join(", ");
          if (struggles || searched) {
            learnedMemoryContext = `\nLearned Student Growth Areas (Test these concepts carefully): ${struggles || "None"}\nRecent Technologies Explored by Student: ${searched || "None"}`;
          }
        }
      } catch (err) {
        console.warn("[Fetch Comm/Learning Profile Note]:", err);
      }
    }

    const sectorContext = sector ? `Target Sector/Industry: ${sector}\n` : "";
    const trackContext = `Interview Style & Company Track: ${trackLabel}\n`;
    const combinedContext = `${trackContext}${sectorContext}${rawResumeText || ""}\nJob Description (JD):\n${jobDescription || "Standard Role"}${learnedMemoryContext}`.trim();

    // 3. Call Universal AI Engine (Claude 3.5/3.7 Sonnet -> Gemini 2.5 Flash -> OpenAI -> Deterministic)
    const aiResult = await UniversalAI.generateResumeInterviewQuestions({
      targetRole: effectiveRole,
      category,
      experienceLevel: levelLabel,
      resumeTitle,
      resumeSummary,
      skills: extractedSkills,
      projects: extractedProjects,
      workExperience: extractedExperience,
      rawResumeText: combinedContext,
    });

    const formattedQuestions: GeneratedQuestion[] = aiResult.questions.map((q: InterviewQuestionItem, idx: number) => {
      let qText = q.text;
      if (idx === 0 && firstName && !qText.includes(firstName)) {
        qText = `Hi ${firstName}, welcome to your mock interview for ${effectiveRole}. ${qText}`;
      }
      return {
        id: q.id || `q_${idx + 1}`,
        text: qText,
        category: q.category || category,
        difficultyLevel: q.difficultyLevel,
        keyPoints: q.keyPoints,
        suggestedDurationSeconds: q.suggestedDurationSeconds,
        isWarmup: idx === 0,
        type: q.type,
        contextSource: q.contextSource,
        adaptiveFocus: q.adaptiveFocus || (userCommProfile?.primary_weakness ? `Targeting: ${userCommProfile.primary_weakness}` : undefined),
      };
    });

    // Log to myra_interactions for audit and telemetry
    if (userId && userId !== "guest" && userId !== "learner-user") {
      try {
        await supabase.from("myra_interactions").insert({
          user_id: userId,
          feature_context: "interview_generate",
          input_summary: `Role: ${effectiveRole}, Category: ${category}, Level: ${levelLabel}`,
          output_summary: `Generated ${formattedQuestions.length} calibrated mock questions.`,
          model_version: aiResult.modelUsed || MyraOrchestrator.getModelVersion(),
          status: "success",
          metadata: { questionCount: formattedQuestions.length, resumeConnected: aiResult.resumeConnected },
        });
      } catch (logErr) {
        console.warn("[Myra Question Log Warning]:", logErr);
      }
    }

    return NextResponse.json({
      success: true,
      source: aiResult.modelUsed,
      modelUsed: aiResult.modelUsed,
      resumeConnected: aiResult.resumeConnected,
      resumeTitle: resumeTitle || null,
      questions: formattedQuestions,
      extractedSkillsCount: extractedSkills.length,
      extractedProjectsCount: extractedProjects.length,
      adaptiveProfileApplied: Boolean(userCommProfile),
    });
  } catch (error: any) {
    console.error("[Generate Questions Error]:", error);
    // Graceful fallback to 1,000 Questions Bank
    const fallbackBankQuestions = pickInterviewQuestions({
      sector: body?.sector || body?.targetRole || "Software development",
      limit: 5,
      seed: 42,
    });

    const fallbackFormatted: GeneratedQuestion[] = fallbackBankQuestions.map((q, idx) => ({
      id: q.id || `bank_err_fallback_${idx + 1}`,
      text: q.question,
      category: q.sector || "General",
      difficultyLevel: (q.level.toLowerCase().includes("senior") ? 2 : q.level.toLowerCase().includes("mid") ? 1 : 0) as 0 | 1 | 2,
      keyPoints: ["STAR structured delivery", "Clear communication", "Practical trade-offs"],
      suggestedDurationSeconds: idx === 0 ? 90 : 120,
      isWarmup: idx === 0,
      type: idx === 0 ? "warmup" : idx === 1 ? "project_deep_dive" : idx === 2 ? "technical" : idx === 3 ? "behavioral" : "system_design",
      contextSource: `1,000 Questions Bank • ${q.sector} (${q.round})`,
    }));

    return NextResponse.json({
      success: true,
      source: "EdWorld 1,000 Questions Bank (Resilient Fallback)",
      modelUsed: "1,000 Questions Bank Engine",
      resumeConnected: false,
      questions: fallbackFormatted,
    });
  }
}
