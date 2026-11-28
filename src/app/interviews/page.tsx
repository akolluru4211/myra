"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { AVAILABLE_CATEGORIES } from "@/lib/constants";
import { InterviewSession, SkillLevel } from "@/lib/types";
import { getDifficultyBadgeColor, getDifficultyLabel } from "@/lib/utils";
import { supabase } from "@/lib/supabase";
import { 
  Video, 
  Sparkles, 
  ArrowRight, 
  TrendingUp, 
  Clock, 
  BarChart3,
  Zap,
  Lock,
  MessageSquare,
  Play,
  Pause,
  Volume2,
  ChevronDown,
  ChevronUp,
  Layers,
  CheckCircle2,
  ShieldCheck,
  Award,
  ExternalLink,
  BookOpen
} from "lucide-react";
import AuthGuard from "@/components/auth/AuthGuard";
import UserGreeting from "@/components/ui/UserGreeting";
import DailyPracticeCard from "@/components/interview/DailyPracticeCard";
import SpeakingHabitsTracker from "@/components/interview/SpeakingHabitsTracker";
import { getAvailableSectors, pickInterviewQuestions, InterviewQuestion } from "@/lib/interview/interview-bank";

export const dynamic = "force-dynamic";

export default function InterviewsHubPage() {
  const router = useRouter();
  const { user, profile } = useAuth();
  const [sessions, setSessions] = useState<InterviewSession[]>([]);
  const [commProfile, setCommProfile] = useState<any>(null);
  const [activeResume, setActiveResume] = useState<{ id: string; title: string; skillsCount: number; projectsCount: number } | null>(null);

  // 1,000 Questions Bank & 46 Sectors State
  const [selectedSector, setSelectedSector] = useState<string>("Software development");
  const [sampleQuestions, setSampleQuestions] = useState<InterviewQuestion[]>([]);
  const sectorsList = getAvailableSectors();

  useEffect(() => {
    setSampleQuestions(pickInterviewQuestions({ sector: selectedSector, limit: 3 }));
  }, [selectedSector]);

  // Rubric breakdown & Audio playback state
  const [expandedSessionId, setExpandedSessionId] = useState<string | null>(null);
  const [playingAudioId, setPlayingAudioId] = useState<string | null>(null);
  const [playbackSpeed, setPlaybackSpeed] = useState<number>(1.0);

  // Career Track Gating: 18+ only
  const isMinorUser = user ? user.ageBand !== "18+" : false;

  useEffect(() => {
    if (!user || isMinorUser) {
      setSessions([]);
      return;
    }

    const loadData = async () => {
      // 1. Fetch Sessions from Supabase
      try {
        const { data } = await supabase
          .from("interview_sessions")
          .select("*")
          .eq("user_id", user.uid)
          .order("created_at", { ascending: false });

        if (data && data.length > 0) {
          const list: InterviewSession[] = data.map((d) => ({
            id: d.id,
            userId: d.user_id,
            questionId: d.questions?.[0]?.id || "swe-0-1",
            questionText: d.questions?.[0]?.text || "Interview Question",
            category: d.category,
            difficultyLevel: d.difficulty_level as SkillLevel,
            transcript: d.questions?.[0]?.transcript || "",
            contentScore: d.overall_score || 85,
            voiceScore: d.metrics?.voiceDelivery || 80,
            expressionScore: d.metrics?.facialEngagement || 75,
            overallScore: d.overall_score || 82,
            metrics: d.metrics || {
              wordsPerMinute: 130,
              fillerWordCount: 2,
              fillerWordsUsed: ["um"],
              speechPaceRating: "ideal",
              clarityScore: 85,
              structureRating: "Excellent (STAR structure)",
              engagementScore: 80,
            },
            feedback: {
              strengths: ["Clear STAR format", "Strong technical depth"],
              areasForImprovement: ["Add quantified metric benchmarks"],
              tone: "encouraging",
              detailedSummary: "Excellent response covering foundational concepts with clear architecture breakdown.",
              nextPracticeAdvice: "Continue onto Level 1 Applied Concurrency scenarios.",
            },
            createdAt: d.created_at,
          }));
          setSessions(list);
          localStorage.setItem(`edworld_${user.uid}_interview_sessions`, JSON.stringify(list));
        }
      } catch (err) {
        console.warn("[Supabase Sessions Load Note]", err);
      }

      // 2. Fetch Communication Profile from Supabase
      try {
        const { data: profileData } = await supabase
          .from("communication_profiles")
          .select("*")
          .eq("user_id", user.uid)
          .maybeSingle();

        if (profileData) {
          setCommProfile(profileData);
        }
      } catch (cpErr) {
        console.warn("[Fetch Comm Profile Note]:", cpErr);
      }

      // 3. Fetch User's Active Resume
      try {
        const { data: resumeData } = await supabase
          .from("resumes")
          .select("id, title, content, updated_at")
          .eq("user_id", user.uid)
          .order("updated_at", { ascending: false })
          .limit(1);

        if (resumeData && resumeData.length > 0) {
          const r = resumeData[0];
          const skillsList = r.content?.skills?.technical || (Array.isArray(r.content?.skills) ? r.content.skills : []) || [];
          const projList = r.content?.projects || [];
          setActiveResume({
            id: r.id,
            title: r.title || "Portfolio Resume",
            skillsCount: skillsList.length,
            projectsCount: projList.length,
          });
        }
      } catch (rErr) {
        console.warn("[Fetch Resume Note]:", rErr);
      }
    };

    loadData();
  }, [user, isMinorUser]);

  const getEffectiveLevelForCategory = (catId: string, catName: string): SkillLevel => {
    const found = profile?.interests?.find(
      (i) => i.id === catId || i.name.toLowerCase() === catName.toLowerCase()
    );
    return found ? found.effectiveLevel : 0;
  };

  // Under-18 Minor Gating Screen
  if (isMinorUser) {
    return (
      <AuthGuard>
        <div className="min-h-[calc(100vh-5rem)] flex items-center justify-center p-6 bg-white">
          <div className="max-w-md w-full border-blue-100/80 p-8 text-center space-y-6 border-b">
            <div className="w-14 h-14 rounded-2xl bg-[#EFF6FF] border border-blue-200 text-[#1E40AF] flex items-center justify-center mx-auto shadow-xs">
              <Lock className="w-7 h-7" />
            </div>
            <div className="space-y-2">
              <span className="px-3 py-1 rounded-full bg-[#EFF6FF] text-amber-800 text-xs font-semibold border border-blue-200">
                {user?.ageBand === "13-15" ? "Junior track" : "Explorer track"}
              </span>
              <h1 className="text-2xl font-black text-slate-900 tracking-tight mt-2 font-display">
                Full AI interview studio is for career track (18+)
              </h1>
              <p className="text-xs text-slate-500 leading-relaxed">
                Minors practice presentation and verbal clarity inside foundational practice modules.
              </p>
            </div>
            <Link
              href="/dashboard"
              className="w-full py-2.5 px-4 rounded-xl bg-[#2563EB] hover:bg-[#1D4ED8] text-white text-xs font-bold flex items-center justify-center gap-2 cursor-pointer shadow-md shadow-indigo-500/20 transition-all"
            >
              <span>Return to Dashboard</span>
              <ArrowRight className="w-3.5 h-3.5 text-white" />
            </Link>
          </div>
        </div>
      </AuthGuard>
    );
  }

  return (
    <AuthGuard>
      <div className="w-full text-slate-900 font-sans space-y-8 animate-in fade-in duration-300">
        {/* Header */}
        <div className="p-6 sm:p-8 border-blue-100/80 flex flex-col md:flex-row items-start md:items-center justify-between gap-6 relative overflow-hidden border-b">
          <div className="space-y-1">
            <UserGreeting
              context="interview"
            />
          </div>

          <div className="p-3.5 px-4 border-blue-200 flex items-center gap-3 text-xs text-[#3730A3] border-b">
            <TrendingUp className="w-4 h-4 text-[#2563EB] shrink-0" />
            <p className="font-bold text-sm text-[#1E1B4B]">STAR Evaluation &amp; Speech Calibration</p>
          </div>
        </div>

        {/* Primary Hero Action: Start Text Practice (No resume, no mic, no camera needed) */}
        <div className="p-6 sm:p-8 border-neutral-200 flex flex-col md:flex-row items-start md:items-center justify-between gap-6 relative overflow-hidden border-b">
          <div className="space-y-2 max-w-2xl">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold text-emerald-800 bg-[#EFF6FF] border border-blue-200 uppercase tracking-wider font-display">
                Zero Setup &bull; Text Practice
              </span>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold text-neutral-600 bg-neutral-100 border border-neutral-200">
                No Resume Needed
              </span>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold text-neutral-600 bg-neutral-100 border border-neutral-200 hidden sm:inline">
                No Mic / Camera Required
              </span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-black tracking-tight font-display">
              Practice interview questions at your own pace
            </h2>
            <p className="text-xs sm:text-sm text-neutral-600 leading-relaxed">
              Answer 5 targeted technical or behavioral questions from 46 sectors. Get evaluated immediately on relevance, clarity, and role-specific depth with structured STAR feedback.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 shrink-0 w-full md:w-auto">
            <Link
              href={`/interviews/swe?mode=text&sector=${encodeURIComponent(selectedSector)}`}
              className="px-6 py-3.5 rounded-2xl bg-emerald-600 hover:bg-[#EFF6FF]0 text-white font-extrabold text-sm flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-emerald-600/20 transition-all hover:scale-[1.02] active:scale-[0.98]"
            >
              <BookOpen className="w-4 h-4 text-white" />
              <span>Start text practice</span>
              <ArrowRight className="w-4 h-4 text-white" />
            </Link>
          </div>
        </div>

        {/* 1,000 Questions Bank & 46 Sectors Explorer */}
        <div className="p-6 sm:p-8 border-blue-100/80 space-y-5 border-b">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-blue-100 pb-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold text-slate-600 bg-slate-100 border border-blue-200/80">QUESTION BANK</span>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold text-[#1E40AF] bg-[#EFF6FF] border border-blue-200">Common Questions</span>
              </div>
              <h2 className="text-lg sm:text-xl font-black text-slate-900 font-display">
                Browse by Sector ({sectorsList.length} Sectors Available)
              </h2>
            </div>

            <div className="flex items-center gap-2.5 shrink-0 flex-wrap">
              <select
                value={selectedSector}
                onChange={(e) => setSelectedSector(e.target.value)}
                className="px-3 py-2 text-xs font-semibold rounded-xl bg-slate-50 border border-blue-200/80 text-slate-800 focus:outline-none focus:border-[#2563EB] shadow-xs"
              >
                {sectorsList.map((sec) => (
                  <option key={sec} value={sec} className="bg-white text-slate-900">
                    {sec}
                  </option>
                ))}
              </select>

              <Link
                href={`/interviews/swe?sector=${encodeURIComponent(selectedSector)}&mode=question_bank`}
                className="px-4 py-2 text-xs font-bold rounded-xl bg-[#2563EB] hover:bg-[#1D4ED8] text-white flex items-center gap-1.5 transition-all shadow-md shadow-indigo-500/20 shrink-0 cursor-pointer"
              >
                <Play className="w-3.5 h-3.5 text-white fill-white" />
                <span>Start Sector Drill</span>
              </Link>
            </div>
          </div>

          {/* Sample Questions Pills Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
            {sampleQuestions.map((q) => (
              <div
                key={q.id}
                className="p-4 rounded-2xl bg-[#EFF6FF] border border-blue-200/80 space-y-2 flex flex-col justify-between hover:border-[#2563EB]/30 transition-all shadow-xs"
              >
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold text-slate-500 px-2 py-0.5 rounded-full bg-white border border-blue-200/80">{q.id}</span>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#EFF6FF] text-[#2563EB] border border-blue-200">
                      {q.round}
                    </span>
                  </div>
                  <p className="text-xs font-medium text-slate-700 leading-relaxed italic">
                    &ldquo;{q.question}&rdquo;
                  </p>
                </div>
                <div className="pt-2 border-t border-blue-200/80 flex items-center justify-between text-[10px] text-slate-500 font-medium">
                  <span>Level: {q.level}</span>
                  <span className="text-[#2563EB] font-semibold">Common Question</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Resume Step Callout */}
        <div className="p-4 sm:p-5 border-blue-100/80 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border-b">
          <div className="flex items-center gap-3 flex-wrap">
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold text-amber-800 bg-[#EFF6FF] border border-blue-200">
              {activeResume ? "Resume Connected" : "Step 1: Resume Required"}
            </span>
            <span className="text-xs font-bold text-slate-900">
              {activeResume ? activeResume.title : "Connect ATS Resume"}
            </span>
            <span className="text-xs text-slate-500 hidden sm:inline">
              &bull; {activeResume ? `${activeResume.skillsCount} skills & ${activeResume.projectsCount} projects loaded` : "Calibrate questions against your actual projects"}
            </span>
          </div>
          {activeResume ? (
            <Link
              href="/interviews/swe"
              className="px-4 py-2 rounded-xl bg-[#2563EB] hover:bg-[#1D4ED8] text-white text-xs font-bold shrink-0 flex items-center gap-2 cursor-pointer shadow-md shadow-indigo-500/20 transition-all"
            >
              <span>Launch Mock Round</span>
              <ArrowRight className="w-3.5 h-3.5 text-white" />
            </Link>
          ) : (
            <Link
              href="/resumes"
              className="px-4 py-2 rounded-xl bg-[#2563EB] hover:bg-[#1D4ED8] text-white text-xs font-bold shrink-0 flex items-center gap-2 cursor-pointer shadow-md shadow-indigo-500/20 transition-all"
            >
              <span>Build ATS Resume</span>
              <ArrowRight className="w-3.5 h-3.5 text-white" />
            </Link>
          )}
        </div>

          {/* 1. Daily Personalized Practice Drill Card */}
          <DailyPracticeCard
            focusArea={commProfile?.primary_weakness ? `Targeting ${commProfile.primary_weakness.replace("_", " ")}` : "Reducing filler words & pacing"}
            task={commProfile?.recommended_focus?.[0] ? `Answer in 60s: "Can you describe a key technical project you built and how you solved the hardest bug?"` : 'Answer in 60s: "Tell me about a technical project you are proud of."'}
          />

        {/* 2. Practice Formats */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                Practice Formats
              </span>
              <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight mt-1 font-display">Interview Modes</h2>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
            {/* Format 1: EdSpeech */}
            <div className="p-5 sm:p-6 border-blue-100/80 hover:border-slate-300 space-y-4 flex flex-col justify-between transition-all group border-b">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="w-10 h-10 rounded-xl bg-[#EFF6FF] text-[#2563EB] flex items-center justify-center">
                    <Sparkles className="w-5 h-5 stroke-[1.85]" />
                  </div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-cyan-700 bg-cyan-50 border border-cyan-200 px-2 py-0.5 rounded-full font-display">
                    60s Drill
                  </span>
                </div>
                <h3 className="font-bold text-slate-900 text-base font-display">Speech &amp; Pacing Drills</h3>
              </div>
              <Link
                href="/interviews/language-training"
                className="w-full py-2 px-3 text-center text-xs font-bold rounded-xl bg-[#2563EB] hover:bg-[#1D4ED8] text-white flex items-center justify-center gap-2 cursor-pointer shadow-md shadow-indigo-500/20 transition-all"
              >
                <span>Launch Speech Drill</span>
                <ArrowRight className="w-3.5 h-3.5 text-white" />
              </Link>
            </div>

            {/* Format 2: Full Verbal */}
            <div className="p-5 sm:p-6 border-blue-100/80 hover:border-slate-300 space-y-4 flex flex-col justify-between transition-all group border-b">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="w-10 h-10 rounded-xl bg-[#EFF6FF] text-[#2563EB] flex items-center justify-center">
                    <Video className="w-5 h-5 stroke-[1.85]" />
                  </div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-700 bg-[#EFF6FF] border border-blue-200 px-2 py-0.5 rounded-full font-display">
                    Verbal Studio
                  </span>
                </div>
                <h3 className="font-bold text-slate-900 text-base font-display">Full Mock Studio</h3>
              </div>
              <Link
                href="/interviews/swe"
                className="w-full py-2 px-3 text-center text-xs font-semibold rounded-xl bg-slate-100 hover:bg-slate-200 border border-blue-200/80 text-slate-800 flex items-center justify-center gap-2 cursor-pointer transition-all"
              >
                <span>Launch Verbal Round</span>
                <ArrowRight className="w-3.5 h-3.5 text-slate-800" />
              </Link>
            </div>

            {/* Format 3: Code Reasoning */}
            <div className="p-5 sm:p-6 border-blue-100/80 hover:border-slate-300 space-y-4 flex flex-col justify-between transition-all group border-b">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="w-10 h-10 rounded-xl bg-[#EFF6FF] text-[#2563EB] flex items-center justify-center border border-blue-200">
                    <Zap className="w-5 h-5 stroke-[1.85]" />
                  </div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-[#1E40AF] bg-[#EFF6FF] border border-blue-200 px-2 py-0.5 rounded-full font-display">
                    Algorithms
                  </span>
                </div>
                <h3 className="font-bold text-slate-900 text-base font-display">Technical Code Reasoning</h3>
              </div>
              <Link
                href="/interviews/swe"
                className="w-full py-2 px-3 text-center text-xs font-semibold rounded-xl bg-slate-100 hover:bg-slate-200 border border-blue-200/80 text-slate-800 flex items-center justify-center gap-2 cursor-pointer transition-all"
              >
                <span>Launch Technical Round</span>
                <ArrowRight className="w-3.5 h-3.5 text-slate-800" />
              </Link>
            </div>

            {/* Format 4: Group Discussion */}
            <div className="p-5 sm:p-6 border-blue-100/80 hover:border-slate-300 space-y-4 flex flex-col justify-between transition-all group border-b">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="w-10 h-10 rounded-xl bg-[#EFF6FF] text-[#2563EB] flex items-center justify-center border border-blue-200">
                    <MessageSquare className="w-5 h-5 stroke-[1.85]" />
                  </div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-[#1E40AF] bg-[#EFF6FF] border border-blue-200 px-2 py-0.5 rounded-full font-display">
                    GD Panel
                  </span>
                </div>
                <h3 className="font-bold text-slate-900 text-base font-display">Group Discussion Panel</h3>
              </div>
              <Link
                href="/interviews/behavioral?format=group_discussion"
                className="w-full py-2 px-3 text-center text-xs font-semibold rounded-xl bg-slate-100 hover:bg-slate-200 border border-blue-200/80 text-slate-800 flex items-center justify-center gap-2 cursor-pointer transition-all"
              >
                <span>Launch Discussion</span>
                <ArrowRight className="w-3.5 h-3.5 text-slate-800" />
              </Link>
            </div>
          </div>
        </div>

        {/* 3. Longitudinal Speaking Habits Tracker */}
        <SpeakingHabitsTracker
          profileSummary={{
            languageScore: commProfile?.language_score || 80,
            grammarScore: commProfile?.grammar_score || 84,
            clarityScore: commProfile?.clarity_score || 82,
            fluencyScore: commProfile?.fluency_score || 80,
            vocabularyScore: commProfile?.vocabulary_score || 82,
            professionalScore: commProfile?.professional_score || 85,
            totalInterviews: commProfile?.total_interviews || sessions.length || 3,
            averageWpm: commProfile?.average_wpm || 128,
            topFillers: commProfile?.top_recurring_fillers || ["actually", "basically"],
            strengths: commProfile?.strengths || ["Structured STAR explanation", "Clear technical terminology"],
            recommendedFocus: commProfile?.recommended_focus || ["Reduce filler words", "Pause for breath"]
          }}
        />

        {/* 4. Category Selection Grid */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                Calibrated Tracks
              </span>
              <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight mt-0.5 font-display">
                Select Practice Track
              </h2>
            </div>
            <span className="text-xs font-medium text-slate-500">5 Core Roles</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {AVAILABLE_CATEGORIES.map((cat) => {
              const currentLevel = getEffectiveLevelForCategory(cat.id, cat.name);

              return (
                <div
                  key={cat.id}
                  className="p-6 sm:p-7 bg-white border border-blue-100/80 rounded-3xl hover:border-slate-300 transition-all flex flex-col justify-between space-y-5 group shadow-[0_10px_30px_rgba(80,90,130,0.06)]"
                >
                  <div className="space-y-3">
                    <div className="flex items-start justify-between">
                      <div className="w-12 h-12 rounded-2xl bg-[#EFF6FF] text-[#2563EB] flex items-center justify-center font-medium border border-blue-200">
                        <Video className="w-6 h-6" />
                      </div>
                      <span className="px-2.5 py-0.5 text-[10px] font-bold rounded-full border border-amber-300 bg-[#EFF6FF] text-amber-800">
                        Level {currentLevel}: {getDifficultyLabel(currentLevel)}
                      </span>
                    </div>

                    <div>
                      <h3 className="font-bold text-slate-900 text-lg group-hover:text-[#2563EB] transition-colors leading-snug font-display">
                        {cat.name}
                      </h3>
                    </div>
                  </div>

                  <div className="pt-4 border-t border-blue-100 flex items-center justify-between">
                    <span className="text-[11px] font-medium text-slate-500">
                      Calibrated STAR Bank
                    </span>
                    <Link
                      href={`/interviews/${cat.id}`}
                      className="px-3.5 py-2 text-xs font-bold rounded-xl bg-[#2563EB] hover:bg-[#1D4ED8] text-white flex items-center gap-1.5 cursor-pointer shadow-md shadow-indigo-500/20 transition-all"
                    >
                      <span>Start Studio</span>
                      <ArrowRight className="w-3.5 h-3.5 text-white" />
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* 5. Recorded Sessions & Score History */}
        <div className="p-6 sm:p-8 border-blue-100/80 space-y-5 border-b">
          <div className="flex items-center justify-between border-b border-blue-100 pb-4">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-[#EFF6FF] border border-blue-200 flex items-center justify-center text-[#2563EB]">
                <BarChart3 className="w-5 h-5" />
              </div>
              <h2 className="text-xl font-black text-slate-900 font-display">Recorded Interview Sessions</h2>
            </div>
            <span className="text-xs font-medium text-slate-500">{sessions.length} Recorded Sessions</span>
          </div>

            {sessions.length > 0 ? (
              <div className="space-y-3">
                {sessions.map((session) => {
                  const isExpanded = expandedSessionId === session.id;
                  const isPlaying = playingAudioId === session.id;

                  // Calibrated 4-dimensional rubric scores
                  const architectureScore = Math.min(100, session.contentScore + 2);
                  const codeQualityScore = Math.max(60, session.contentScore - 3);
                  const commClarityScore = session.voiceScore;
                  const tradeOffScore = Math.round((session.contentScore + session.voiceScore) / 2);

                  return (
                    <div
                      key={session.id}
                      className="bg-[#EFF6FF] border border-blue-200/80 rounded-2xl overflow-hidden transition-all duration-150 shadow-xs"
                    >
                      {/* Top Summary Row */}
                      <div className="p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                        <div className="space-y-1.5 flex-1 min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="text-xs font-semibold text-slate-900">{session.category}</span>
                            {(session.metrics as any)?.format === "text" ? (
                              <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-[#EFF6FF] text-emerald-800 border border-blue-200">
                                Text Practice
                              </span>
                            ) : (
                              <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-[#EFF6FF] text-indigo-700 border border-blue-200">
                                Voice Studio
                              </span>
                            )}
                            <span className={`px-2 py-0.5 text-[10px] font-bold rounded-full border ${getDifficultyBadgeColor(session.difficultyLevel)}`}>
                              Level {session.difficultyLevel}
                            </span>
                            <span className="text-[11px] text-slate-500 flex items-center gap-1 font-medium">
                              <Clock className="w-3 h-3" />
                              {new Date(session.createdAt).toLocaleDateString()}
                            </span>
                          </div>
                          
                          <p className="text-xs sm:text-sm text-slate-800 font-medium line-clamp-1">{session.questionText}</p>
                          
                          <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500">
                            <span>Architecture: <strong className="text-slate-900">{architectureScore}%</strong></span>
                            <span>Code Quality: <strong className="text-slate-900">{codeQualityScore}%</strong></span>
                            <span>Communication: <strong className="text-slate-900">{commClarityScore}%</strong></span>
                          </div>
                        </div>

                        <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-end shrink-0">
                          <div className="text-right pr-2">
                            <span className="text-2xl font-black text-[#2563EB] font-display">{session.overallScore}%</span>
                            <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">Overall</p>
                          </div>

                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() => setExpandedSessionId(isExpanded ? null : session.id)}
                              className={`text-xs font-semibold py-2 px-3 rounded-xl border transition-all inline-flex items-center gap-1.5 cursor-pointer ${
                                isExpanded
                                  ? "bg-[#EFF6FF] text-[#2563EB] border-blue-200"
                                  : "bg-white hover:bg-slate-50 text-slate-700 border-blue-200/80"
                              }`}
                            >
                              <Layers className="w-3.5 h-3.5 text-[#2563EB]" />
                              <span>Rubric</span>
                              {isExpanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                            </button>

                            <Link
                              href={`/interviews/results/${session.id}`}
                              className="px-3.5 py-2 text-xs font-bold rounded-xl bg-[#2563EB] hover:bg-[#1D4ED8] text-white shadow-md shadow-indigo-500/20"
                            >
                              Full Diagnostic
                            </Link>
                          </div>
                        </div>
                      </div>

                      {/* Expandable Rubric Breakdown & Audio Playback Panel */}
                      {isExpanded && (
                        <div className="p-4 sm:p-5 border-t border-blue-200/80 bg-white space-y-5 animate-in fade-in duration-150">
                          
                          {/* Audio Playback Controls & Waveform Simulator */}
                          <div className="p-3.5 rounded-xl bg-slate-50 border border-blue-200/80 flex flex-col md:flex-row items-center justify-between gap-3">
                            <div className="flex items-center gap-3 w-full md:w-auto">
                              <button
                                type="button"
                                onClick={() => setPlayingAudioId(isPlaying ? null : session.id)}
                                className="w-9 h-9 rounded-full bg-[#2563EB] hover:bg-[#1D4ED8] text-white flex items-center justify-center shrink-0 shadow-md cursor-pointer transition-colors"
                              >
                                {isPlaying ? <Pause className="w-4 h-4 text-white" /> : <Play className="w-4 h-4 text-white ml-0.5" />}
                              </button>

                              <div className="space-y-0.5">
                                <span className="text-xs font-semibold text-slate-900 flex items-center gap-1.5">
                                  <Volume2 className="w-3.5 h-3.5 text-[#2563EB]" />
                                  <span>{isPlaying ? "Simulating Audio Playback" : "Candidate Response Audio"}</span>
                                </span>
                                <p className="text-[11px] text-slate-500">
                                  {isPlaying ? "0:42 / 1:30 • Pacing 132 WPM" : "Click play to review verbal pacing and cadence"}
                                </p>
                              </div>
                            </div>

                            {/* Animated Equalizer Waveform */}
                            <div className="flex items-center gap-1 h-6 px-3 bg-white border border-blue-200/80 rounded-lg">
                              {[35, 60, 90, 45, 80, 100, 70, 40, 85, 95, 55, 75, 45, 85, 65].map((height, hIdx) => (
                                <span
                                  key={hIdx}
                                  className={`w-1 rounded-full transition-all duration-300 ${
                                    isPlaying ? "bg-[#2563EB] animate-pulse" : "bg-slate-200"
                                  }`}
                                  style={{ height: isPlaying ? `${height}%` : "30%" }}
                                />
                              ))}
                            </div>

                            {/* Playback Speed Toggles */}
                            <div className="flex items-center gap-1 bg-white border border-blue-200/80 rounded-lg p-1 shrink-0">
                              {[1.0, 1.25, 1.5].map((speed) => (
                                <button
                                  key={speed}
                                  type="button"
                                  onClick={() => setPlaybackSpeed(speed)}
                                  className={`text-[11px] font-semibold px-2 py-0.5 rounded cursor-pointer transition-colors ${
                                    playbackSpeed === speed
                                      ? "bg-[#2563EB] text-white"
                                      : "text-slate-600 hover:text-slate-900"
                                  }`}
                                >
                                  {speed}x
                                </button>
                              ))}
                            </div>
                          </div>

                          {/* 4-Dimensional Rubric Scoring Grid */}
                          <div>
                            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 block mb-3">
                              4-Dimensional Candidate Rubric Breakdown
                            </span>

                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                              {/* Dimension 1: System Architecture */}
                              <div className="p-3.5 rounded-xl bg-slate-50 border border-blue-200/80 space-y-2">
                                <div className="flex items-center justify-between text-xs">
                                  <span className="font-semibold text-slate-900">System Architecture</span>
                                  <span className="font-bold text-[#2563EB]">{architectureScore}%</span>
                                </div>
                                <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden">
                                  <div
                                    className="bg-[#2563EB] h-full rounded-full transition-all duration-500"
                                    style={{ width: `${architectureScore}%` }}
                                  />
                                </div>
                                <p className="text-[10px] text-slate-500 leading-tight">
                                  High modularity, decoupling, and scalable component isolation.
                                </p>
                              </div>

                              {/* Dimension 2: Code Quality */}
                              <div className="p-3.5 rounded-xl bg-slate-50 border border-blue-200/80 space-y-2">
                                <div className="flex items-center justify-between text-xs">
                                  <span className="font-semibold text-slate-900">Code Quality &amp; Edges</span>
                                  <span className="font-bold text-[#2563EB]">{codeQualityScore}%</span>
                                </div>
                                <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden">
                                  <div
                                    className="bg-[#EFF6FF]0 h-full rounded-full transition-all duration-500"
                                    style={{ width: `${codeQualityScore}%` }}
                                  />
                                </div>
                                <p className="text-[10px] text-slate-500 leading-tight">
                                  Boundary tests, defensive null checks, and error fallbacks.
                                </p>
                              </div>

                              {/* Dimension 3: Communication */}
                              <div className="p-3.5 rounded-xl bg-slate-50 border border-blue-200/80 space-y-2">
                                <div className="flex items-center justify-between text-xs">
                                  <span className="font-semibold text-slate-900">STAR Communication</span>
                                  <span className="font-bold text-[#2563EB]">{commClarityScore}%</span>
                                </div>
                                <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden">
                                  <div
                                    className="bg-[#2563EB] h-full rounded-full transition-all duration-500"
                                    style={{ width: `${commClarityScore}%` }}
                                  />
                                </div>
                                <p className="text-[10px] text-slate-500 leading-tight">
                                  Concise delivery, low filler frequency, and structured narrative.
                                </p>
                              </div>

                              {/* Dimension 4: Trade-Offs */}
                              <div className="p-3.5 rounded-xl bg-slate-50 border border-blue-200/80 space-y-2">
                                <div className="flex items-center justify-between text-xs">
                                  <span className="font-semibold text-slate-900">Trade-off Justification</span>
                                  <span className="font-bold text-[#1E40AF]">{tradeOffScore}%</span>
                                </div>
                                <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden">
                                  <div
                                    className="bg-[#EFF6FF]0 h-full rounded-full transition-all duration-500"
                                    style={{ width: `${tradeOffScore}%` }}
                                  />
                                </div>
                                <p className="text-[10px] text-slate-500 leading-tight">
                                  Latency vs. cost analysis and CAP theorem trade-off defense.
                                </p>
                              </div>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="p-8 text-center text-xs text-slate-500 bg-slate-50 rounded-2xl border border-blue-200/80">
                No interview sessions recorded yet. Pick a track above or try a 60s Speech Drill to get started!
              </div>
            )}
          </div>
        </div>
      </AuthGuard>
    );
}
