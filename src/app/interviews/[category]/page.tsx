"use client";

export const dynamic = "force-dynamic";

import React, { useState, useEffect } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/lib/auth-context";
import { AVAILABLE_CATEGORIES } from "@/lib/mock-data";
import { SkillLevel } from "@/lib/types";
import { supabase } from "@/lib/supabase";
import MediaRecorderStudio from "@/components/interview/MediaRecorderStudio";
import PreFlightAudioCheckModal from "@/components/interview/PreFlightAudioCheckModal";
import { VoiceChoice } from "@/lib/interview/voice-profiles";
import { getAvailableSectors } from "@/lib/interview/interview-bank";
import { 
  ArrowLeft, 
  Sparkles, 
  ShieldCheck, 
  TrendingUp, 
  Award, 
  CheckCircle2, 
  Layers,
  HelpCircle, 
  Lock, 
  ArrowRight, 
  FileText, 
  Play, 
  RotateCcw, 
  Briefcase, 
  Code2, 
  Cpu, 
  Check, 
  ChevronRight, 
  AlertTriangle,
  Maximize2,
  ExternalLink,
  Search,
  BookOpen
} from "lucide-react";
import { useExamProctoring } from "@/hooks/useExamProctoring";

interface SavedResume {
  id: string;
  title: string;
  content: any;
  updated_at: string;
}

export default function ActiveInterviewStudioPage() {
  const params = useParams();
  const router = useRouter();
  const { user, profile } = useAuth();
  const categoryId = params?.category as string;
  const searchParams = useSearchParams();

  // Career Track Gating: 18+ only
  const isMinorUser = user ? user.ageBand !== "18+" : false;

  const categoryObj = AVAILABLE_CATEGORIES.find(
    (c) => c.id === categoryId || c.name.toLowerCase().includes(categoryId?.toLowerCase() || "")
  ) || AVAILABLE_CATEGORIES[0];

  const categoryName = categoryObj.name;

  const interestObj = profile?.interests?.find(
    (i) => i.id === categoryObj.id || i.name.toLowerCase() === categoryName.toLowerCase() || categoryName.toLowerCase().includes(i.name.toLowerCase())
  );
  const effectiveLevel: SkillLevel = interestObj ? interestObj.effectiveLevel : 0;

  // State
  const [targetRole, setTargetRole] = useState(categoryName);
  const [selectedSector, setSelectedSector] = useState<string>("Software & Full-Stack");
  const [interviewMode, setInterviewMode] = useState<"ai_resume" | "question_bank" | "text">("ai_resume");
  const [sectorSearch, setSectorSearch] = useState("");
  const allAvailableSectors = getAvailableSectors();
  const [jobDescriptionInput, setJobDescriptionInput] = useState("");
  const [savedResumes, setSavedResumes] = useState<SavedResume[]>([]);
  const [selectedResumeId, setSelectedResumeId] = useState<string>("");
  const [rawResumeInput, setRawResumeInput] = useState("");
  const [loadingResumes, setLoadingResumes] = useState(true);

  // Active Session State
  const [sessionStarted, setSessionStarted] = useState(false);
  const [questions, setQuestions] = useState<any[]>([]);
  const [currentQuestionIdx, setCurrentQuestionIdx] = useState(0);
  const [generating, setGenerating] = useState(false);
  const [aiModelUsed, setAiModelUsed] = useState<string>("");
  const [resumeConnected, setResumeConnected] = useState(false);
  const [sessionTranscripts, setSessionTranscripts] = useState<Record<number, string>>({});
  const [activeTextDraft, setActiveTextDraft] = useState("");
  const [activeTextSessionId, setActiveTextSessionId] = useState<string>("");
  const [hasRecoverableDraft, setHasRecoverableDraft] = useState(false);
  const [scoringError, setScoringError] = useState<string | null>(null);

  // Voice & Pre-Flight Hardware Check State
  const [isPreFlightOpen, setIsPreFlightOpen] = useState(false);
  const [audioOptIn, setAudioOptIn] = useState(false);
  const [voiceChoice, setVoiceChoice] = useState<VoiceChoice>("elena-tech-lead");
  const [speakingSpeed, setSpeakingSpeed] = useState(1.0);
  const [companyTrack, setCompanyTrack] = useState<string>("Big Tech (FAANG)");
  const [useKeyboardFallback, setUseKeyboardFallback] = useState(false);

  // Myra Auto-Setup & Progress States
  const [isAutoSettingUp, setIsAutoSettingUp] = useState(false);
  const [myraNotice, setMyraNotice] = useState<string | null>(null);
  const [isScoring, setIsScoring] = useState(false);
  const [scoringStageIndex, setScoringStageIndex] = useState(0);
  const [generatingStageIndex, setGeneratingStageIndex] = useState(0);

  // Proctoring in Live Mock Interview - strictly disabled for text practice mode
  const isTextPractice = interviewMode === "text";
  const {
    violationCount,
    maxViolations,
    isDisqualified,
    activeWarning,
    requestFullscreen,
    dismissWarning,
  } = useExamProctoring({
    enabled: sessionStarted && !isScoring && !isTextPractice,
    maxViolations: 2,
    onDisqualify: (reason) => {
      // Auto-terminate interview
      alert(`Interview Terminated: ${reason}`);
      router.push("/interviews");
    },
  });

  const scoringStages = [
    "Evaluating interview audio telemetry...",
    "Analyzing STAR narrative structure...",
    "Cross-referencing JD competency keywords...",
    "Synthesizing actionable upgrade roadmap..."
  ];

  const generatingStages = [
    "Analyzing resume projects and technical stack...",
    "Cross-referencing target Job Description competencies...",
    "Synthesizing high-signal situational questions...",
    "Finalizing proctored interview environment..."
  ];

  useEffect(() => {
    const jobTitleParam = searchParams.get("jobTitle");
    const jdParam = searchParams.get("jd");
    const resumeIdParam = searchParams.get("resumeId");
    const sectorParam = searchParams.get("sector");
    const modeParam = searchParams.get("mode");

    if (jobTitleParam) setTargetRole(jobTitleParam);
    if (jdParam) setJobDescriptionInput(jdParam);
    if (resumeIdParam) setSelectedResumeId(resumeIdParam);
    if (sectorParam) setSelectedSector(sectorParam);
    if (modeParam === "question_bank") setInterviewMode("question_bank");
    if (modeParam === "text") setInterviewMode("text");
  }, [searchParams]);

  // Check for saved in-progress text practice session to allow seamless refresh & resume
  useEffect(() => {
    if (!user) return;
    try {
      const storageKey = `edworld_${user.uid}_text_practice_draft`;
      const saved = localStorage.getItem(storageKey);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.questions && parsed.questions.length > 0 && !sessionStarted) {
          setHasRecoverableDraft(true);
        }
      }
    } catch (e) {
      console.warn("Check text draft error:", e);
    }
  }, [user, sessionStarted]);

  // Progress timer for generating questions
  useEffect(() => {
    if (!generating) {
      setGeneratingStageIndex(0);
      return;
    }
    const interval = setInterval(() => {
      setGeneratingStageIndex((prev) => (prev < generatingStages.length - 1 ? prev + 1 : prev));
    }, 1800);
    return () => clearInterval(interval);
  }, [generating]);

  // Progress timer for scoring session
  useEffect(() => {
    if (!isScoring) {
      setScoringStageIndex(0);
      return;
    }
    const interval = setInterval(() => {
      setScoringStageIndex((prev) => (prev < scoringStages.length - 1 ? prev + 1 : prev));
    }, 1800);
    return () => clearInterval(interval);
  }, [isScoring]);

  // Fetch User's Saved Resumes from Supabase
  useEffect(() => {
    if (!user || isMinorUser) {
      setLoadingResumes(false);
      return;
    }

    const fetchResumes = async () => {
      try {
        const { data } = await supabase
          .from("resumes")
          .select("id, title, content, updated_at")
          .eq("user_id", user.uid)
          .order("updated_at", { ascending: false });

        if (data && data.length > 0) {
          setSavedResumes(data);
          // Default to the most recently updated resume if not already set
          setSelectedResumeId((prev) => (prev ? prev : data[0].id));
        } else {
          setSelectedResumeId("custom");
        }
      } catch (err) {
        console.warn("[Fetch Resumes Supabase Note]:", err);
      } finally {
        setLoadingResumes(false);
      }
    };

    fetchResumes();
  }, [user, isMinorUser]);

  // Selected Resume Details Preview
  const selectedResumeObj = savedResumes.find((r) => r.id === selectedResumeId);
  const resumeSkills: string[] = selectedResumeObj?.content?.skills?.technical || 
    selectedResumeObj?.content?.skills?.tools || 
    (Array.isArray(selectedResumeObj?.content?.skills) ? selectedResumeObj.content.skills : []) || [];
  const resumeProjects: Array<{ title: string; technologies?: string[] }> = selectedResumeObj?.content?.projects || [];

  // "Let Myra set this up for me" Handler
  const handleMyraAutoSetup = () => {
    setIsAutoSettingUp(true);
    const inferredRole = profile?.targetRole || selectedResumeObj?.content?.target_role || categoryName;
    setTargetRole(inferredRole);

    const lowerRole = inferredRole.toLowerCase();
    let bestSector = "Software & Full-Stack";
    if (lowerRole.includes("data") || lowerRole.includes("ai") || lowerRole.includes("ml")) {
      bestSector = "AI, ML & Data Science";
    } else if (lowerRole.includes("cloud") || lowerRole.includes("devops") || lowerRole.includes("sre")) {
      bestSector = "Cloud & DevOps";
    } else if (lowerRole.includes("security") || lowerRole.includes("cyber")) {
      bestSector = "CyberSecurity";
    }
    setSelectedSector(bestSector);

    if (savedResumes.length > 0 && !selectedResumeId) {
      setSelectedResumeId(savedResumes[0].id);
    }

    if (!jobDescriptionInput.trim()) {
      setJobDescriptionInput(
        `Core Competencies for ${inferredRole}:\n- Architecture design and rigorous technical problem solving\n- Robust error boundaries, performance optimization, and testing\n- Clear communication of engineering trade-offs, constraints, and business outcomes`
      );
    }

    setMyraNotice(`Myra configured your setup for ${inferredRole} using your saved resume!`);
    setTimeout(() => setIsAutoSettingUp(false), 350);
  };

  const handleResumeTextPractice = () => {
    if (!user) return;
    try {
      const storageKey = `edworld_${user.uid}_text_practice_draft`;
      const saved = localStorage.getItem(storageKey);
      if (saved) {
        const parsed = JSON.parse(saved);
        setQuestions(parsed.questions || []);
        setSessionTranscripts(parsed.answers || {});
        setCurrentQuestionIdx(parsed.currentIdx || 0);
        setActiveTextDraft(parsed.activeDraft || "");
        setActiveTextSessionId(parsed.sessionId || "");
        setSelectedSector(parsed.sector || selectedSector);
        setInterviewMode("text");
        setSessionStarted(true);
        setHasRecoverableDraft(false);
      }
    } catch (e) {
      console.warn("Restore text draft error:", e);
    }
  };

  const handleStartSession = async (overrideMode?: "text" | "question_bank" | "ai_resume") => {
    const activeMode = overrideMode || interviewMode;

    // Validate resume input if in AI Resume mode
    if (activeMode === "ai_resume") {
      const hasResume = (selectedResumeId && selectedResumeId !== "custom" && selectedResumeId !== "none") || (selectedResumeId === "custom" && rawResumeInput.trim().length > 10);
      if (!hasResume && savedResumes.length === 0) {
        alert("Please build or paste your resume details first so questions can be calibrated to your projects!");
        return;
      }
    }

    setGenerating(true);
    setScoringError(null);
    try {
      const candidateName = user?.name || profile?.name || "";
      const firstName = candidateName ? candidateName.trim().split(" ")[0] : "";
      
      const payload: any = {
        category: categoryName,
        targetRole: targetRole || categoryName,
        sector: selectedSector,
        effectiveLevel,
        candidateName,
        userId: user?.uid,
        jobDescription: jobDescriptionInput,
        mode: activeMode,
      };

      if (activeMode === "ai_resume") {
        if (selectedResumeId && selectedResumeId !== "custom" && selectedResumeId !== "none") {
          payload.resumeId = selectedResumeId;
          payload.resumeContent = selectedResumeObj?.content;
        } else if (selectedResumeId === "custom" && rawResumeInput.trim()) {
          payload.rawResumeText = rawResumeInput.trim();
        }
      }

      const res = await fetch("/api/interview/generate-questions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      let generatedQs = data.questions;

      if (!generatedQs || generatedQs.length === 0) {
        // Fallback questions calibrated to role
        generatedQs = [
          {
            id: "warmup-1",
            text: firstName
              ? `Hi ${firstName}, welcome to your practice round for ${targetRole || categoryName}. To start, walk me through the key architectural decisions of the most complex project you have built.`
              : `Welcome! Walk me through the key architectural decisions and metrics of the most complex project you have built.`,
            difficultyLevel: 0,
            type: "warmup",
            contextSource: "Core Competency Evaluation",
            suggestedDurationSeconds: 120,
          },
          {
            id: "q-project-1",
            text: `Based on your technical experience and the requirements for ${targetRole || categoryName}, how did you handle data consistency, performance bottlenecks, and automated unit testing in your last major deployment?`,
            difficultyLevel: effectiveLevel,
            type: "project_deep_dive",
            contextSource: "Engineering Tradeoffs",
            suggestedDurationSeconds: 150,
          },
          {
            id: "q-tech-3",
            text: `Looking at this target role's production requirements, suppose you experience an unexpected latency spike or service outage. What is your step-by-step triage and post-mortem workflow?`,
            difficultyLevel: effectiveLevel,
            type: "technical",
            contextSource: "System Reliability",
            suggestedDurationSeconds: 120,
          },
          {
            id: "q-behavioral-4",
            text: `Describe a situation where you had a strong technical disagreement with a teammate or stakeholder. How did you present your reasoning and reach consensus?`,
            difficultyLevel: effectiveLevel,
            type: "behavioral",
            contextSource: "Collaboration & Culture",
            suggestedDurationSeconds: 120,
          },
          {
            id: "q-design-5",
            text: `If you were asked to design a real-time notification engine supporting millions of active users, what components and protocols would you choose, and where are the single points of failure?`,
            difficultyLevel: effectiveLevel,
            type: "system_design",
            contextSource: "Scale & Architecture",
            suggestedDurationSeconds: 180,
          },
        ];
      }

      // Limit to 5 questions
      const finalQuestions = generatedQs.slice(0, 5);
      setQuestions(finalQuestions);
      setAiModelUsed(data.modelUsed || data.source || "Universal Deterministic Engine");
      setResumeConnected(Boolean(data.resumeConnected));

      if (activeMode === "text") {
        // Text mode: bypass audio modal, bypass proctoring, start immediately
        const newSessionId = typeof crypto !== "undefined" && typeof crypto.randomUUID === "function" ? crypto.randomUUID() : `text-${Date.now()}`;
        setActiveTextSessionId(newSessionId);
        setCurrentQuestionIdx(0);
        setSessionTranscripts({});
        setActiveTextDraft("");
        setSessionStarted(true);

        if (user) {
          localStorage.setItem(`edworld_${user.uid}_text_practice_draft`, JSON.stringify({
            sessionId: newSessionId,
            sector: selectedSector,
            category: categoryName,
            questions: finalQuestions,
            answers: {},
            currentIdx: 0,
            activeDraft: "",
            updatedAt: Date.now()
          }));
        }
      } else {
        // Voice mode: open preflight check
        setIsPreFlightOpen(true);
      }
    } catch (e) {
      console.warn("Question generation note:", e);
      if (activeMode === "text") {
        setSessionStarted(true);
      } else {
        setIsPreFlightOpen(true);
      }
    } finally {
      setGenerating(false);
    }
  };

  const handlePreFlightProceed = async (config: {
    audioOptIn: boolean;
    voiceChoice: VoiceChoice;
    speakingSpeed: number;
    companyTrack?: string;
    isAudioOnly: boolean;
    useKeyboardFallback: boolean;
  }) => {
    setAudioOptIn(config.audioOptIn);
    setVoiceChoice(config.voiceChoice);
    setSpeakingSpeed(config.speakingSpeed);
    if (config.companyTrack) setCompanyTrack(config.companyTrack);
    setUseKeyboardFallback(config.useKeyboardFallback);
    setIsPreFlightOpen(false);

    try {
      await requestFullscreen();
    } catch (fsErr) {
      console.warn("Fullscreen request note:", fsErr);
    }
    setSessionStarted(true);
  };

  const handleQuestionSubmit = async (sessionSubmission: {
    transcript: string;
    durationSeconds: number;
    isAudioOnly?: boolean;
    voiceOptIn?: boolean;
    fullscreenExitEvents?: Array<{ timestamp: string; questionIndex: number }>;
  }) => {
    if (!user) return;

    const updatedTranscripts = {
      ...sessionTranscripts,
      [currentQuestionIdx]: sessionSubmission.transcript,
    };
    setSessionTranscripts(updatedTranscripts);

    if (currentQuestionIdx < questions.length - 1) {
      setCurrentQuestionIdx((prev) => prev + 1);
      return;
    }

    // Finished all questions -> Score Session
    setIsScoring(true);
    setScoringError(null);
    try {
      const combinedTranscript = Object.values(updatedTranscripts).join(" \n\n ");

      const res = await fetch("/api/interview/score-session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sessionId: activeTextSessionId || undefined,
          userId: user.uid,
          category: categoryName,
          targetRole: targetRole || categoryName,
          difficultyLevel: effectiveLevel,
          format: interviewMode === "text" ? "text" : "standard",
          mode: interviewMode,
          questions: questions.length > 0 ? questions : [{ id: "q1", text: "Interview Question", transcript: sessionSubmission.transcript }],
          transcript: combinedTranscript || sessionSubmission.transcript,
          durationSeconds: sessionSubmission.durationSeconds,
          resumeContext: selectedResumeObj?.title ? `Resume: ${selectedResumeObj.title}` : "",
          voiceOptIn: interviewMode === "text" ? false : audioOptIn,
          fullscreenExitEvents: sessionSubmission.fullscreenExitEvents || [],
        }),
      });

      const data = await res.json();
      if (data.success && data.sessionId) {
        localStorage.setItem(`edworld_${user.uid}_interview_${data.sessionId}`, JSON.stringify(data));
        // Clear in-progress text draft now that session is successfully scored
        if (interviewMode === "text") {
          localStorage.removeItem(`edworld_${user.uid}_text_practice_draft`);
        }
        router.push(`/interviews/results/${data.sessionId}`);
      } else {
        setScoringError(data.error || "Scoring evaluation failed. Your answers are saved.");
      }
    } catch (e: any) {
      console.warn("Session score submission error:", e);
      setScoringError("Network or server connection issue while evaluating. Your submitted answers are safe.");
    } finally {
      setIsScoring(false);
    }
  };

  // Text Practice Specific Handlers:
  const handleTextAnswerChange = (val: string) => {
    setActiveTextDraft(val);
    if (!user) return;
    try {
      localStorage.setItem(`edworld_${user.uid}_text_practice_draft`, JSON.stringify({
        sessionId: activeTextSessionId,
        sector: selectedSector,
        category: categoryName,
        questions,
        answers: sessionTranscripts,
        currentIdx: currentQuestionIdx,
        activeDraft: val,
        updatedAt: Date.now()
      }));
    } catch (e) {
      console.warn("Draft auto-save note:", e);
    }
  };

  const handleTextQuestionNext = async () => {
    const trimmed = activeTextDraft.trim();
    if (!trimmed) return;

    const updatedTranscripts = {
      ...sessionTranscripts,
      [currentQuestionIdx]: trimmed,
    };
    setSessionTranscripts(updatedTranscripts);

    if (currentQuestionIdx < questions.length - 1) {
      const nextIdx = currentQuestionIdx + 1;
      setCurrentQuestionIdx(nextIdx);
      setActiveTextDraft(updatedTranscripts[nextIdx] || "");

      if (user) {
        localStorage.setItem(`edworld_${user.uid}_text_practice_draft`, JSON.stringify({
          sessionId: activeTextSessionId,
          sector: selectedSector,
          category: categoryName,
          questions,
          answers: updatedTranscripts,
          currentIdx: nextIdx,
          activeDraft: updatedTranscripts[nextIdx] || "",
          updatedAt: Date.now()
        }));
      }
    } else {
      // Final Question: Get feedback!
      await handleQuestionSubmit({
        transcript: trimmed,
        durationSeconds: 120,
        voiceOptIn: false,
        isAudioOnly: false,
        fullscreenExitEvents: [],
      });
    }
  };

  if (isMinorUser) {
    return (
      <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center p-6 bg-white">
        <div className="max-w-md w-full bg-white rounded-3xl p-8 border border-neutral-200 shadow-xl text-center space-y-4">
          <div className="w-12 h-12 rounded-2xl bg-neutral-100 text-black flex items-center justify-center mx-auto">
            <Lock className="w-6 h-6" />
          </div>
          <h1 className="text-xl font-bold text-black">Career Track Restricted</h1>
          <p className="text-xs text-neutral-500">
            Mock interviews and speech diagnostics are available for 18+ Career Track members.
          </p>
          <Link href="/dashboard" className="inline-block px-4 py-2 rounded-xl bg-black text-white text-xs font-bold">
            Return to Dashboard
          </Link>
        </div>
      </div>
    );
  }

  const currentQ = questions[currentQuestionIdx] || {
    id: "warmup-1",
    text: "Tell me about yourself, your background, and what drives your passion for this domain.",
    difficultyLevel: 0,
    type: "warmup",
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-white py-8 px-4 sm:px-6 lg:px-8 text-black select-none">
      
      {/* Tab/Window Switch Warning Modal during Active Interview */}
      {activeWarning && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in">
          <div className="max-w-md w-full bg-white rounded-3xl p-6 sm:p-8 border-2 border-black shadow-2xl text-center space-y-5">
            <div className={`w-14 h-14 rounded-2xl mx-auto flex items-center justify-center ${
              isDisqualified ? "bg-red-100 text-red-600" : "bg-neutral-100 text-black"
            }`}>
              <AlertTriangle className="w-7 h-7" />
            </div>

            <div className="space-y-2">
              <span className={`px-2.5 py-0.5 rounded-md text-[10px] font-mono font-bold uppercase tracking-wider ${
                isDisqualified ? "bg-red-600 text-white" : "bg-black text-white"
              }`}>
                Lockdown Violation
              </span>
              <h2 className="text-xl font-extrabold text-black">
                {isDisqualified ? "Interview Terminated" : "Tab or Window Switch Detected"}
              </h2>
              <p className="text-xs text-neutral-600 leading-relaxed">
                {activeWarning}
              </p>
            </div>

            <div className="p-3 rounded-xl bg-neutral-50 border border-neutral-200 text-[11px] text-neutral-600 font-mono">
              Strikes: {Math.min(violationCount, maxViolations + 1)} / {maxViolations + 1} &bull; Fullscreen Enforced
            </div>

            {!isDisqualified ? (
              <button
                type="button"
                onClick={dismissWarning}
                className="w-full py-3 px-4 rounded-xl bg-black hover:bg-neutral-800 text-white text-xs font-bold transition-all shadow-xs cursor-pointer"
              >
                Resume Interview Session
              </button>
            ) : (
              <Link
                href="/interviews"
                className="inline-block w-full py-3 px-4 rounded-xl bg-black text-white text-xs font-bold"
              >
                Return to Interviews
              </Link>
            )}
          </div>
        </div>
      )}

      <div className="max-w-4xl mx-auto space-y-6">
        
        {/* Navigation Bar */}
        <div className="flex items-center justify-between">
          <Link href="/interviews" className="text-xs font-bold text-neutral-500 hover:text-black flex items-center gap-1.5 transition-colors">
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Mock Interview Studio</span>
          </Link>
          <div className="flex items-center gap-2">
            <span className="text-xs font-black text-black bg-neutral-100 border border-neutral-300 px-3 py-1 rounded-full">
              {categoryName} &bull; Level {effectiveLevel}
            </span>
          </div>
        </div>

        {/* Session In-Progress Recovery Banner */}
        {hasRecoverableDraft && !sessionStarted && (
          <div className="p-4 sm:p-5 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-950 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-xs animate-in fade-in">
            <div className="space-y-0.5">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-600 animate-pulse" />
                <h4 className="text-xs font-black uppercase tracking-wider text-emerald-900">
                  Unfinished Practice Session Found
                </h4>
              </div>
              <p className="text-xs text-emerald-800">
                You have a saved in-progress text practice session. Resume right where you left off or start fresh.
              </p>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={handleResumeTextPractice}
                className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-extrabold shadow-sm transition-all cursor-pointer"
              >
                Resume Saved Session
              </button>
              <button
                type="button"
                onClick={() => {
                  if (user) localStorage.removeItem(`edworld_${user.uid}_text_practice_draft`);
                  setHasRecoverableDraft(false);
                }}
                className="px-3 py-2 rounded-xl bg-white border border-emerald-300 text-emerald-800 hover:bg-emerald-100 text-xs font-bold transition-all cursor-pointer"
              >
                Discard
              </button>
            </div>
          </div>
        )}

        {/* Global Scoring Error Banner with Retry */}
        {scoringError && (
          <div className="p-4 sm:p-5 rounded-2xl bg-amber-50 border border-amber-200 text-amber-950 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-xs">
            <div className="space-y-0.5">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-600" />
                <h4 className="text-xs font-black uppercase tracking-wider text-amber-900">
                  Evaluation Note
                </h4>
              </div>
              <p className="text-xs text-amber-800">
                {scoringError}
              </p>
            </div>
            <button
              type="button"
              onClick={() => handleQuestionSubmit({
                transcript: activeTextDraft || Object.values(sessionTranscripts).join(" "),
                durationSeconds: 120,
              })}
              className="px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-500 text-white text-xs font-extrabold shadow-sm transition-all cursor-pointer shrink-0"
            >
              Retry feedback
            </button>
          </div>
        )}

        {!sessionStarted ? (
          /* RESUME-FIRST PRE-SESSION SETUP: 3-STEP FLOW */
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-neutral-200 shadow-xs space-y-8 animate-in fade-in">
            
            {/* 3-Step Flow Stepper Header */}
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <span className="px-3 py-1 rounded-full text-[10px] font-mono font-bold uppercase tracking-wider bg-black text-white flex items-center gap-1.5 shadow-2xs">
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Resume-First Interview Flow</span>
                </span>
                <span className="text-[10px] font-mono text-neutral-500 bg-neutral-50 px-2 py-0.5 rounded-md border border-neutral-200">
                  Calibrated to your experience
                </span>
              </div>

              <div>
                <h1 className="text-2xl sm:text-3xl font-extrabold text-black tracking-tight">
                  EdInterview &bull; {categoryName}
                </h1>
                <p className="text-xs sm:text-sm text-neutral-600 mt-1">
                  Step 1: Connect your resume. Step 2: Input target JD. Step 3: Face questions calibrated to your actual projects.
                </p>
              </div>

              {/* 3-Step Visual Progress Flow */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
                <div className="p-4 rounded-2xl bg-neutral-50 border-2 border-black space-y-1">
                  <div className="flex items-center gap-2 text-xs font-bold text-black">
                    <span className="w-5 h-5 rounded-full bg-black text-white flex items-center justify-center text-[11px] font-mono font-black">1</span>
                    <span>Build / Select Resume</span>
                  </div>
                  <p className="text-[10px] text-neutral-500">Your projects &amp; verified skills</p>
                </div>

                <div className="p-4 rounded-2xl bg-neutral-50 border border-neutral-200 space-y-1">
                  <div className="flex items-center gap-2 text-xs font-bold text-black">
                    <span className="w-5 h-5 rounded-full bg-neutral-200 text-black flex items-center justify-center text-[11px] font-mono font-black">2</span>
                    <span>Target Role &amp; JD</span>
                  </div>
                  <p className="text-[10px] text-neutral-500">Specific job requirements</p>
                </div>

                <div className="p-4 rounded-2xl bg-neutral-50 border border-neutral-200 space-y-1">
                  <div className="flex items-center gap-2 text-xs font-bold text-black">
                    <span className="w-5 h-5 rounded-full bg-neutral-200 text-black flex items-center justify-center text-[11px] font-mono font-black">3</span>
                    <span>Lockdown Interview</span>
                  </div>
                  <p className="text-[10px] text-neutral-500">Video round &amp; STAR scoring</p>
                </div>
              </div>
            </div>

            {/* STEP 1: RESUME REQUIREMENT & SELECTOR (Optional for Text Practice) */}
            {interviewMode === "text" ? (
              <div className="p-4 sm:p-5 rounded-2xl bg-emerald-50 border border-emerald-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <div className="space-y-0.5">
                  <span className="text-[10px] font-extrabold uppercase tracking-wider text-emerald-800 bg-emerald-100/80 px-2 py-0.5 rounded-full border border-emerald-300">
                    Text Practice Mode Active
                  </span>
                  <h3 className="text-xs font-bold text-emerald-950 mt-1">
                    No Resume, Camera, or Microphone Required
                  </h3>
                  <p className="text-xs text-emerald-800">
                    Questions will be sampled from the 46-sector question bank for <strong>{selectedSector}</strong>. You can answer and refine your STAR stories by typing.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => handleStartSession("text")}
                  disabled={generating}
                  className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-black shrink-0 shadow-sm transition-all cursor-pointer"
                >
                  {generating ? "Loading Questions..." : "Begin Text Drill"}
                </button>
              </div>
            ) : (
              <div className="space-y-4 p-5 rounded-2xl bg-neutral-50 border border-neutral-200">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-xs font-bold text-black uppercase tracking-wider flex items-center gap-1.5">
                      <FileText className="w-3.5 h-3.5 text-black" />
                      <span>Step 1: Your Active ATS Resume (Mandatory for Voice Rounds)</span>
                    </h3>
                    <p className="text-[11px] text-neutral-500 mt-0.5">
                      Questions are directly derived from the technical projects, languages, and metrics in your resume.
                    </p>
                  </div>

                  <Link
                    href="/resumes"
                    className="px-3 py-1.5 rounded-xl bg-white hover:bg-neutral-100 border border-neutral-200 text-black text-xs font-bold flex items-center gap-1 shadow-2xs transition-all"
                    target="_blank"
                  >
                    <span>Build New Resume</span>
                    <ExternalLink className="w-3 h-3 text-neutral-500" />
                  </Link>
                </div>

              {savedResumes.length === 0 && !loadingResumes ? (
                /* No Resume Warning & Quick Gate */
                <div className="p-5 rounded-xl bg-white border border-neutral-300 space-y-3">
                  <div className="flex items-center gap-2 text-black font-bold text-xs">
                    <AlertTriangle className="w-4 h-4 text-black" />
                    <span>No Saved Resume Detected</span>
                  </div>
                  <p className="text-xs text-neutral-600 leading-relaxed">
                    EdWorld mock rounds evaluate your real project architectural decisions against recruiter criteria. You can create your ATS resume in 2 minutes, or paste your experience bullets below.
                  </p>
                  <div className="flex flex-wrap gap-2 pt-1">
                    <Link
                      href="/resumes"
                      className="px-4 py-2 rounded-xl bg-black text-white text-xs font-bold flex items-center gap-1.5 hover:bg-neutral-800"
                    >
                      <span>Build ATS Resume First</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </Link>
                    <button
                      type="button"
                      onClick={() => setSelectedResumeId("custom")}
                      className="px-4 py-2 rounded-xl bg-neutral-100 border border-neutral-200 text-black text-xs font-bold hover:bg-neutral-200"
                    >
                      Paste Resume Text Instead
                    </button>
                  </div>
                </div>
              ) : (
                /* Saved Resumes Selector */
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {savedResumes.map((resume) => (
                    <button
                      key={resume.id}
                      type="button"
                      onClick={() => setSelectedResumeId(resume.id)}
                      className={`p-3.5 rounded-2xl text-left border transition-all flex flex-col justify-between cursor-pointer ${
                        selectedResumeId === resume.id
                          ? "border-black bg-white text-black shadow-xs ring-2 ring-black"
                          : "border-neutral-200 bg-white text-neutral-700 hover:border-neutral-400"
                      }`}
                    >
                      <div className="space-y-1">
                        <div className="flex items-center justify-between">
                          <FileText className={`w-4 h-4 ${selectedResumeId === resume.id ? "text-black" : "text-neutral-400"}`} />
                          {selectedResumeId === resume.id && (
                            <CheckCircle2 className="w-4 h-4 text-black" />
                          )}
                        </div>
                        <p className="font-bold text-xs line-clamp-1">{resume.title || "Portfolio Resume"}</p>
                        <p className="text-[10px] text-neutral-500">
                          Updated {new Date(resume.updated_at).toLocaleDateString()}
                        </p>
                      </div>
                    </button>
                  ))}

                  <button
                    type="button"
                    onClick={() => setSelectedResumeId("custom")}
                    className={`p-3.5 rounded-2xl text-left border transition-all flex flex-col justify-between cursor-pointer ${
                      selectedResumeId === "custom"
                        ? "border-black bg-white text-black shadow-xs ring-2 ring-black"
                        : "border-neutral-200 bg-white text-neutral-700 hover:border-neutral-400"
                    }`}
                  >
                    <div className="space-y-1">
                      <div className="flex items-center justify-between">
                        <Code2 className={`w-4 h-4 ${selectedResumeId === "custom" ? "text-black" : "text-neutral-400"}`} />
                        {selectedResumeId === "custom" && <CheckCircle2 className="w-4 h-4 text-black" />}
                      </div>
                      <p className="font-bold text-xs">Paste Resume Text</p>
                      <p className="text-[10px] text-neutral-500">Manual bullet points</p>
                    </div>
                  </button>
                </div>
              )}

              {/* Custom Resume Text Box if Selected */}
              {selectedResumeId === "custom" && (
                <div className="pt-2 animate-in fade-in space-y-1.5">
                  <label className="text-[11px] font-bold text-black">
                    Paste Your Key Projects &amp; Skills:
                  </label>
                  <textarea
                    rows={4}
                    value={rawResumeInput}
                    onChange={(e) => setRawResumeInput(e.target.value)}
                    placeholder="e.g. Project: E-commerce microservice built with Node.js, Redis cache, Postgres. Handled 10k req/sec with zero downtime during flash sales. Skills: TypeScript, Docker, Kafka, AWS..."
                    className="w-full p-3.5 rounded-2xl bg-white border border-neutral-300 text-xs text-black focus:outline-none focus:ring-2 focus:ring-black"
                  />
                </div>
              )}

              {/* Connected Resume Deep-Dive Insights */}
              {selectedResumeObj && selectedResumeId !== "custom" && (
                <div className="p-3.5 rounded-xl bg-white border border-neutral-200 space-y-2">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-black" />
                    <span className="font-bold text-xs text-black">
                      Connected Resume: {selectedResumeObj.title}
                    </span>
                  </div>
                  
                  {resumeSkills.length > 0 && (
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="text-[10px] font-mono text-neutral-500">Skills to test:</span>
                      {resumeSkills.slice(0, 6).map((sk, i) => (
                        <span key={i} className="px-2 py-0.5 rounded-md bg-neutral-100 text-[10px] font-bold text-black border border-neutral-200">
                          {sk}
                        </span>
                      ))}
                      {resumeSkills.length > 6 && (
                        <span className="text-[10px] font-bold text-neutral-500">+{resumeSkills.length - 6} more</span>
                      )}
                    </div>
                  )}

                  {resumeProjects.length > 0 && (
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="text-[10px] font-mono text-neutral-500">Projects for deep-dive:</span>
                      {resumeProjects.slice(0, 3).map((pj, i) => (
                        <span key={i} className="px-2 py-0.5 rounded-md bg-neutral-100 text-[10px] font-bold text-black border border-neutral-200">
                          {pj.title}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
            )}

            {/* STEP 2: TARGET ROLE & JOB DESCRIPTION */}
            <div className="space-y-4 pt-2">
              <div className="space-y-1">
                <h3 className="text-xs font-bold text-black uppercase tracking-wider flex items-center gap-1.5">
                  <Briefcase className="w-3.5 h-3.5 text-black" />
                  <span>Step 2: Target Job Description (JD) &amp; Role</span>
                </h3>
                <p className="text-[11px] text-neutral-500">
                  The AI interviewer will ask questions cross-referencing your resume against these specific JD requirements.
                </p>
              </div>

              {/* Target Role Input */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-black uppercase tracking-wider">
                  Target Role Title
                </label>
                <input
                  type="text"
                  value={targetRole}
                  onChange={(e) => setTargetRole(e.target.value)}
                  placeholder="e.g. Full-Stack Software Engineer, Machine Learning Engineer, Systems Architect..."
                  className="w-full p-3.5 rounded-2xl bg-neutral-50 border border-neutral-200 text-xs font-medium text-black focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent transition-all"
                />
              </div>

              {/* Interview Mode Selector */}
              <div className="space-y-2">
                <label className="block text-xs font-bold text-black uppercase tracking-wider flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-black" />
                    <span>Interview Format Mode</span>
                  </span>
                  <span className="text-[10px] font-mono text-neutral-500">Dual-Engine Supported</span>
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                  <button
                    type="button"
                    onClick={() => setInterviewMode("text")}
                    className={`p-3.5 rounded-2xl border text-left transition-all cursor-pointer ${
                      interviewMode === "text"
                        ? "bg-emerald-600 text-white border-emerald-600 shadow-md"
                        : "bg-white text-neutral-800 border-neutral-200 hover:bg-neutral-50"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-extrabold flex items-center gap-1.5">
                        <BookOpen className="w-3.5 h-3.5" />
                        <span>Text Practice</span>
                      </span>
                      {interviewMode === "text" && <Check className="w-3.5 h-3.5 text-white" />}
                    </div>
                    <p className={`text-[11px] mt-1 leading-snug ${
                      interviewMode === "text" ? "text-emerald-100" : "text-neutral-500"
                    }`}>
                      No resume, mic, or camera needed. Type written answers at your own pace.
                    </p>
                  </button>

                  <button
                    type="button"
                    onClick={() => setInterviewMode("ai_resume")}
                    className={`p-3.5 rounded-2xl border text-left transition-all cursor-pointer ${
                      interviewMode === "ai_resume"
                        ? "bg-black text-white border-black shadow-sm"
                        : "bg-white text-neutral-800 border-neutral-200 hover:bg-neutral-50"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-extrabold">AI Resume-Calibrated</span>
                      {interviewMode === "ai_resume" && <Check className="w-3.5 h-3.5 text-white" />}
                    </div>
                    <p className={`text-[11px] mt-1 leading-snug ${
                      interviewMode === "ai_resume" ? "text-neutral-300" : "text-neutral-500"
                    }`}>
                      Synthesized deep questions tailored to your specific projects and target JD.
                    </p>
                  </button>

                  <button
                    type="button"
                    onClick={() => setInterviewMode("question_bank")}
                    className={`p-3.5 rounded-2xl border text-left transition-all cursor-pointer ${
                      interviewMode === "question_bank"
                        ? "bg-black text-white border-black shadow-sm"
                        : "bg-white text-neutral-800 border-neutral-200 hover:bg-neutral-50"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-extrabold">1,000 Questions Bank</span>
                      {interviewMode === "question_bank" && <Check className="w-3.5 h-3.5 text-white" />}
                    </div>
                    <p className={`text-[11px] mt-1 leading-snug ${
                      interviewMode === "question_bank" ? "text-neutral-300" : "text-neutral-500"
                    }`}>
                      Authentic industry interview questions across 46 sectors with STAR benchmarks.
                    </p>
                  </button>
                </div>
              </div>

              {/* Sector Selection (46 Sectors Search & Filter) */}
              <div className="space-y-2">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <label className="block text-xs font-bold text-black uppercase tracking-wider flex items-center gap-1.5">
                    <Cpu className="w-3.5 h-3.5 text-black" />
                    <span>Industry Sector ({allAvailableSectors.length} Sectors Available)</span>
                  </label>
                  <span className="text-[10px] font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                    Active: {selectedSector}
                  </span>
                </div>

                {/* Quick Sector Search Input */}
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-neutral-400" />
                  <input
                    type="text"
                    placeholder="Search 46 sectors (e.g. Software, Cloud, DevOps, Cyber, Fintech, AI...)"
                    value={sectorSearch}
                    onChange={(e) => setSectorSearch(e.target.value)}
                    className="w-full pl-8 pr-3 py-2 text-xs bg-neutral-50 border border-neutral-200 rounded-xl text-black placeholder:text-neutral-400 focus:outline-none focus:ring-1 focus:ring-black"
                  />
                </div>

                <div className="max-h-36 overflow-y-auto p-1 border border-neutral-200 rounded-xl bg-neutral-50/50 flex flex-wrap gap-1.5">
                  {allAvailableSectors
                    .filter((sec) => !sectorSearch || sec.toLowerCase().includes(sectorSearch.toLowerCase()))
                    .map((sec) => (
                      <button
                        key={sec}
                        type="button"
                        onClick={() => setSelectedSector(sec)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition-all truncate cursor-pointer ${
                          selectedSector.toLowerCase() === sec.toLowerCase()
                            ? "bg-black text-white border-black shadow-2xs"
                            : "bg-white text-neutral-700 border-neutral-200 hover:bg-neutral-100"
                        }`}
                      >
                        {sec}
                      </button>
                    ))}
                </div>
              </div>

              {/* Job Description Textarea */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-bold text-black uppercase tracking-wider">
                    Target Job Description (JD)
                  </label>
                  <span className="text-[10px] font-mono text-neutral-500">Pasted or calibrated</span>
                </div>
                <textarea
                  rows={4}
                  value={jobDescriptionInput}
                  onChange={(e) => setJobDescriptionInput(e.target.value)}
                  placeholder="Paste the job requirements, responsibilities, or target tech stack here (e.g. Distributed caching, REST/GraphQL APIs, Kubernetes orchestration, 99.99% uptime)..."
                  className="w-full p-3.5 rounded-2xl bg-neutral-50 border border-neutral-200 text-xs text-black focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent transition-all"
                />
              </div>
            </div>

            {/* STEP 3: LAUNCH LOCKDOWN INTERVIEW */}
            <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-3 border-t border-neutral-200 pt-4">
              <div className="flex items-center gap-2 text-xs text-neutral-500">
                <ShieldCheck className="w-4 h-4 text-black" />
                <span>Fullscreen lockdown &amp; tab switch monitoring will activate upon start.</span>
              </div>

              <button
                type="button"
                onClick={() => handleStartSession()}
                disabled={generating}
                className="w-full sm:w-auto px-7 py-3.5 rounded-2xl bg-black hover:bg-neutral-800 text-white text-xs font-extrabold uppercase tracking-wider flex items-center justify-center gap-2 shadow-md transition-all active:scale-95 disabled:opacity-50 cursor-pointer"
              >
                <Play className="w-4 h-4 fill-current text-white" />
                <span>{generating ? "Calibrating Questions from Resume & JD..." : "Step 3: Generate Questions & Launch"}</span>
              </button>
            </div>
          </div>
        ) : (
          /* ACTIVE INTERVIEW STUDIO (Text Practice or Voice MediaRecorderStudio) */
          interviewMode === "text" ? (
            /* TEXT PRACTICE STUDIO: No mic, no camera, no proctoring */
            <div className="bg-white rounded-3xl p-6 sm:p-8 border border-neutral-200 shadow-sm space-y-6 animate-in fade-in">
              {/* Top Progress & Mode Header */}
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-neutral-100 pb-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="px-3 py-1 rounded-full text-xs font-black font-mono uppercase bg-emerald-600 text-white">
                      Question {currentQuestionIdx + 1} of {questions.length}
                    </span>
                    <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
                      Text Practice &bull; {selectedSector}
                    </span>
                  </div>
                  <p className="text-xs text-neutral-500">
                    Auto-saving your written draft &bull; No camera or microphone needed
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-xs font-mono font-bold text-neutral-600">
                    Difficulty Level: {currentQ.difficultyLevel || effectiveLevel}
                  </span>
                </div>
              </div>

              {/* Question Card */}
              <div className="p-5 sm:p-6 rounded-2xl bg-neutral-50 border border-neutral-200/80 space-y-3">
                <div className="flex items-center justify-between text-xs text-neutral-500 font-mono">
                  <span className="font-bold text-neutral-800 uppercase tracking-wider">
                    {currentQ.type ? currentQ.type.replace("_", " ") : "Technical"} Prompt
                  </span>
                  <span>{currentQ.contextSource || selectedSector}</span>
                </div>

                <h2 className="text-base sm:text-lg font-bold text-black leading-relaxed">
                  &ldquo;{currentQ.text}&rdquo;
                </h2>

                {currentQ.keyPoints && currentQ.keyPoints.length > 0 && (
                  <div className="pt-2 border-t border-neutral-200/60 flex items-center gap-2 flex-wrap">
                    <span className="text-[10px] font-bold text-neutral-500 uppercase tracking-wider">Evaluated on:</span>
                    {currentQ.keyPoints.map((kp: string, idx: number) => (
                      <span key={idx} className="text-[10px] font-medium px-2 py-0.5 rounded-md bg-white border border-neutral-200 text-neutral-700">
                        {kp}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* Written Answer Area */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label htmlFor="text-answer-field" className="text-xs font-black text-black uppercase tracking-wider flex items-center gap-1.5">
                    <span>Your Written Answer</span>
                    <span className="text-neutral-400 font-normal lowercase">(required)</span>
                  </label>
                  <span className="text-[11px] font-mono text-neutral-500">
                    {activeTextDraft.trim().split(/\s+/).filter(Boolean).length} words
                  </span>
                </div>

                <textarea
                  id="text-answer-field"
                  rows={8}
                  value={activeTextDraft}
                  onChange={(e) => handleTextAnswerChange(e.target.value)}
                  placeholder="Type your structured answer here. For situational and behavioral questions, use the STAR format:&#10;• Situation: Set the context and business problem&#10;• Task: What was your specific goal or challenge?&#10;• Action: Architectural choices, trade-offs, and how you solved it&#10;• Result: Measurable outcomes (latency, uptime, business impact)"
                  className="w-full p-4 rounded-2xl bg-white border-2 border-neutral-200 text-sm text-black focus:outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-600/20 transition-all font-sans leading-relaxed resize-y min-h-[180px]"
                />
              </div>

              {/* Action Buttons: Submit Answer between questions, Get feedback on final question */}
              <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-3 border-t border-neutral-100">
                <p className="text-xs text-neutral-500">
                  {currentQuestionIdx < questions.length - 1
                    ? `Click submit to advance to question ${currentQuestionIdx + 2}.`
                    : "Final question — click Get feedback to run server-side STAR scoring."}
                </p>

                <div className="flex items-center gap-3 w-full sm:w-auto">
                  {currentQuestionIdx > 0 && (
                    <button
                      type="button"
                      onClick={() => {
                        const prevIdx = currentQuestionIdx - 1;
                        setCurrentQuestionIdx(prevIdx);
                        setActiveTextDraft(sessionTranscripts[prevIdx] || "");
                      }}
                      className="px-4 py-2.5 rounded-xl bg-neutral-100 hover:bg-neutral-200 text-neutral-800 text-xs font-bold transition-all cursor-pointer"
                    >
                      Previous Question
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={handleTextQuestionNext}
                    disabled={!activeTextDraft.trim() || isScoring}
                    className="w-full sm:w-auto px-6 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:bg-neutral-200 disabled:text-neutral-400 disabled:cursor-not-allowed text-white text-xs font-extrabold flex items-center justify-center gap-2 shadow-sm transition-all cursor-pointer active:scale-95"
                  >
                    <span>
                      {isScoring
                        ? "Evaluating..."
                        : currentQuestionIdx < questions.length - 1
                        ? "Submit answer"
                        : "Get feedback"}
                    </span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ) : (
            /* VOICE STUDIO (Full MediaRecorderStudio with Screen Lockdown) */
            <div className="space-y-4">
              {/* Header with AI Model Badge, Generation Source Label & Progress */}
              <div className="bg-white rounded-2xl p-4 border border-neutral-200 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="px-3 py-1 rounded-full text-[10px] font-mono font-bold uppercase bg-black text-white">
                      Question {currentQuestionIdx + 1} of {questions.length}
                    </span>
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-neutral-100 text-black border border-neutral-200">
                      Calibrated from your resume &amp; {targetRole || categoryName} JD
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-2 text-[11px] font-mono text-neutral-500">
                  <span>Lockdown:</span>
                  <span className="font-bold text-black bg-neutral-100 px-2 py-0.5 rounded-md border border-neutral-200">
                    {violationCount}/{maxViolations} Strikes
                  </span>
                </div>
              </div>

              <MediaRecorderStudio
                questionText={currentQ.text}
                category={categoryName}
                difficultyLevel={currentQ.difficultyLevel || effectiveLevel}
                suggestedDurationSeconds={currentQ.suggestedDurationSeconds || 120}
                currentQuestionIndex={currentQuestionIdx + 1}
                totalQuestions={questions.length || 3}
                adaptiveFocus={currentQ.adaptiveFocus}
                userId={user?.uid}
                targetRole={targetRole || categoryName}
                companyTrack={companyTrack}
                resumeContext={selectedResumeObj?.title ? `Resume: ${selectedResumeObj.title}` : ""}
                voiceChoice={voiceChoice}
                speakingSpeed={speakingSpeed}
                audioOptIn={audioOptIn}
                initialUseKeyboardFallback={useKeyboardFallback}
                onSubmitSession={handleQuestionSubmit}
              />
            </div>
          )
        )}

        {/* Hardware Pre-Flight & Voice Privacy Consent Modal */}
        <PreFlightAudioCheckModal
          isOpen={isPreFlightOpen}
          initialCompanyTrack={companyTrack}
          onProceed={handlePreFlightProceed}
          onCancel={() => setIsPreFlightOpen(false)}
        />

        {/* Multi-Stage Branded Progress Loader during Generation or Scoring */}
        {(generating || isScoring) && (
          <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in">
            <div className="max-w-md w-full bg-white border border-neutral-300 rounded-3xl p-6 sm:p-8 text-center space-y-5 shadow-2xl">
              <div className="relative w-16 h-16 mx-auto">
                <div className="w-16 h-16 rounded-full border-4 border-black border-t-transparent animate-spin flex items-center justify-center">
                  <Sparkles className="w-6 h-6 text-black" />
                </div>
              </div>
              <div className="space-y-1">
                <h3 className="text-lg font-black text-black">
                  {isScoring ? "Evaluating Your Session" : "Calibrating Your Interview"}
                </h3>
                <p className="text-xs text-neutral-600 font-medium">
                  {isScoring ? scoringStages[scoringStageIndex] : generatingStages[generatingStageIndex]}
                </p>
              </div>
              <div className="w-full bg-neutral-100 rounded-full h-2 overflow-hidden border border-neutral-200">
                <div
                  className="bg-black h-full transition-all duration-500 rounded-full"
                  style={{ width: `${((isScoring ? scoringStageIndex + 1 : generatingStageIndex + 1) / 4) * 100}%` }}
                />
              </div>
              <p className="text-[11px] text-neutral-400 font-mono">
                Matching Resume Experience ↔ Target JD Competencies
              </p>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
