"use client";

export const dynamic = "force-dynamic";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  Sparkles,
  Mail,
  GraduationCap,
  ArrowRight,
  Flame,
  Target,
  Calendar,
  Compass,
  Lock,
  ShieldCheck,
  Clock,
  Plus,
  Users,
  GitBranch,
  Trophy,
  CheckCircle2,
} from "lucide-react";
import AuthGuard from "@/components/auth/AuthGuard";
import { useAuth } from "@/lib/auth-context";

// Core Dashboard Components
import StudentProgressWidget from "@/components/dashboard/StudentProgressWidget";
import PersonalizedTimetableWidget from "@/components/dashboard/PersonalizedTimetableWidget";
import CareerPathSelectorWidget from "@/components/dashboard/CareerPathSelectorWidget";
import ContinueDsaWidget from "@/components/dashboard/ContinueDsaWidget";
import DailyHabitHeroCard from "@/components/dashboard/DailyHabitHeroCard";
import PromotionalMotivationCard from "@/components/dashboard/PromotionalMotivationCard";
import FeaturedEventsCarousel from "@/components/dashboard/FeaturedEventsCarousel";

export default function DashboardPage() {
  const { user, profile } = useAuth();

  // Instant hydration fallback from localStorage for immediate responsiveness after onboarding
  const [localData, setLocalData] = useState<{
    name?: string;
    targetRole?: string;
    degree?: string;
    cgpa?: string;
    completed?: boolean;
  }>({});

  // Next task resolution & data state handling
  const [nextTask, setNextTask] = useState<{
    title: string;
    description: string;
    actionLabel: string;
    actionHref: string;
    category: string;
    source: "dsa" | "habit" | "timetable" | "empty";
  } | null>(null);

  const [loadingTask, setLoadingTask] = useState<boolean>(true);
  const [taskError, setTaskError] = useState<string | null>(null);

  const resolveNextActivity = async () => {
    setLoadingTask(true);
    setTaskError(null);
    try {
      const todayKey = new Date().toISOString().split("T")[0];
      
      // 1. Check daily habit checklist for uncompleted tasks first
      if (typeof window !== "undefined") {
        const savedHabit = localStorage.getItem(`edworld_habit_checklist_${todayKey}`);
        if (savedHabit) {
          try {
            const habitMap = JSON.parse(savedHabit);
            const pendingTasks = [
              { id: "habit-dsa-1", title: "Array Two-Pointers Reversal Drill", category: "DSA Practice", href: "/dsa", label: "Solve Problem" },
              { id: "habit-apt-1", title: "Quantitative: Time, Speed & Distance", category: "Daily Aptitude", href: "/daily", label: "Start Aptitude" },
              { id: "habit-apt-2", title: "Logical Reasoning: Syllogisms & Deductions", category: "Daily Aptitude", href: "/daily", label: "Start Aptitude" },
              { id: "habit-apt-3", title: "Verbal: Reading Comprehension Patterns", category: "Daily Aptitude", href: "/daily", label: "Start Aptitude" },
              { id: "habit-interview-1", title: "STAR Response: Technical Disagreements", category: "Mock Interview", href: "/interviews", label: "Launch Interview" },
            ].filter((t) => !habitMap[t.id]);

            if (pendingTasks.length > 0) {
              setNextTask({
                title: pendingTasks[0].title,
                description: `Pending daily habit activity in ${pendingTasks[0].category}. Complete to extend your study streak.`,
                actionLabel: pendingTasks[0].label,
                actionHref: pendingTasks[0].href,
                category: pendingTasks[0].category,
                source: "habit",
              });
              setLoadingTask(false);
              return;
            }
          } catch (e) {}
        }
      }

      // 2. Query DSA progress API if student has active session
      if (user?.uid) {
        try {
          const res = await fetch(`/api/dsa/topics?userId=${user.uid}`);
          if (res.ok) {
            const data = await res.json();
            if (data.success && Array.isArray(data.topics)) {
              const inProgress = data.topics.find((t: any) => t.status === "in_progress");
              const firstUnstarted = data.topics.find((t: any) => t.status === "not_started");
              const target = inProgress || firstUnstarted;
              if (target) {
                setNextTask({
                  title: target.name,
                  description: target.explainer_concept || "Master algorithmic data structures & solve curated interview challenges.",
                  actionLabel: "Resume Topic Drills",
                  actionHref: target.slug ? `/dsa/${target.slug}` : "/dsa",
                  category: "DSA Mastery",
                  source: "dsa",
                });
                setLoadingTask(false);
                return;
              }
            }
          }
        } catch (apiErr) {
          console.warn("[Dashboard Next Task API note]:", apiErr);
        }
      }

      // 3. Fallback to Timetable saved state
      if (typeof window !== "undefined") {
        const savedTimetable = localStorage.getItem(`edworld_timetable_${todayKey}`);
        if (savedTimetable) {
          try {
            const timetableMap = JSON.parse(savedTimetable);
            if (!timetableMap["slot-1"]) {
              setNextTask({
                title: "Core Algorithmic Practice & Coding",
                description: "Morning focus block for Data Structures & Algorithms problem solving.",
                actionLabel: "Launch IDE Drill",
                actionHref: "/dsa",
                category: "Coding & DSA",
                source: "timetable",
              });
              setLoadingTask(false);
              return;
            } else if (!timetableMap["slot-2"]) {
              setNextTask({
                title: "Quantitative & Logical Aptitude",
                description: "Timed multiple-choice problems to build speed and accuracy.",
                actionLabel: "Start Daily Drill",
                actionHref: "/daily",
                category: "Aptitude",
                source: "timetable",
              });
              setLoadingTask(false);
              return;
            }
          } catch (e) {}
        }
      }

      // 4. Default clean state when all current activities are complete or empty
      setNextTask(null);
    } catch (err: any) {
      console.error("[Dashboard Next Task Resolution Error]:", err);
      setTaskError("Could not refresh your next task. Check connection.");
    } finally {
      setLoadingTask(false);
    }
  };

  useEffect(() => {
    try {
      if (typeof window !== "undefined") {
        const stored = localStorage.getItem("edworld_user_profile");
        if (stored) {
          const parsed = JSON.parse(stored);
          setLocalData({
            name: parsed.name || parsed.displayName,
            targetRole: parsed.targetRole,
            degree: parsed.degree || parsed.field_of_study,
            cgpa: parsed.cgpa,
            completed: parsed.onboarding_completed,
          });
        }
      }
    } catch (e) {}
    resolveNextActivity();
  }, [user?.uid]);

  const handleOpenMyra = () => {
    if (typeof window !== "undefined") {
      window.dispatchEvent(new CustomEvent("open-myra-copilot"));
    }
  };

  const studentName = localData.name || profile?.name || user?.name || "Student";
  const targetRole = localData.targetRole || profile?.targetRole || "Software Engineer";
  const academicStage = localData.degree || profile?.degree || profile?.careerStage || "Undergraduate";
  const rawCgpa = localData.cgpa || profile?.cgpa;
  const cgpaBadge = rawCgpa ? `${rawCgpa} CGPA` : null;
  const isOnboardingDone = localData.completed === true || profile?.onboarding_completed === true;

  return (
    <AuthGuard>
      <div className="min-h-screen bg-white text-slate-900 font-sans pb-12 space-y-6 sm:space-y-8 animate-in fade-in duration-200">
        
        {/* Onboarding Incomplete Alert Banner */}
        {!isOnboardingDone && profile?.onboarding_completed === false && (
          <div className="p-4 sm:p-5 rounded-2xl bg-white border border-blue-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-[#DBEAFE] flex items-center justify-center shrink-0 font-bold text-[#2563EB]">
                <Sparkles className="w-5 h-5 stroke-[2]" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-slate-900 font-display">
                  Complete Your Student Profile
                </h4>
                <p className="text-xs text-slate-500">
                  Provide your degree, GPA, and target role so your roadmap and timetable match your goals.
                </p>
              </div>
            </div>
            <Link
              href="/onboarding"
              className="px-4 py-2 text-xs font-bold rounded-xl bg-[#2563EB] hover:bg-[#1D4ED8] text-white shrink-0 flex items-center gap-1.5 transition-all shadow-sm"
            >
              <span>Complete Setup</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        )}

        {/* 1. TOP FRIENDLY HERO HEADLINE & PRIMARY ACTION */}
        <section className="space-y-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="space-y-1.5">
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black font-display text-slate-900 tracking-tight break-words">
                Hi, {studentName}! 👋
              </h1>
              <p className="text-sm sm:text-base text-slate-600 leading-relaxed font-normal max-w-2xl">
                Ready to advance today&apos;s goals? Tapping Ask Myra opens your personal AI study copilot.
              </p>
            </div>

            {/* Primary Action Button: Ask Myra */}
            <div className="flex items-center gap-3 shrink-0">
              <button
                type="button"
                onClick={handleOpenMyra}
                aria-label="Ask Myra Copilot"
                title="Ask Myra Copilot"
                className="w-full sm:w-auto px-5 py-3 text-sm font-bold rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white flex items-center justify-center gap-2.5 cursor-pointer shadow-lg shadow-emerald-600/20 transition-all hover:scale-[1.02] active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2"
              >
                <Sparkles className="w-4 h-4 text-white animate-pulse" />
                <span>Ask Myra</span>
                <span className="sr-only">Ask Myra Copilot</span>
              </button>
            </div>
          </div>

          {/* NEXT TASK / UP NEXT HIGHLIGHT CARD */}
          <div className="rounded-3xl border border-blue-100 bg-[#EFF6FF] p-5 sm:p-6 transition-all shadow-xs">
            {loadingTask ? (
              <div className="flex items-center gap-3 py-2 text-slate-500 text-xs font-medium">
                <div className="w-4 h-4 border-2 border-[#2563EB] border-t-transparent rounded-full animate-spin shrink-0" />
                <span>Checking your next recommended task...</span>
              </div>
            ) : taskError ? (
              <div className="flex items-center justify-between gap-3 text-xs">
                <span className="text-rose-600 font-medium">{taskError}</span>
                <button
                  type="button"
                  onClick={resolveNextActivity}
                  className="px-3 py-1 bg-white hover:bg-slate-100 border border-rose-200 text-rose-700 rounded-lg font-bold cursor-pointer transition-colors"
                >
                  Retry
                </button>
              </div>
            ) : nextTask ? (
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider bg-white border border-blue-200 text-[#2563EB]">
                      Up Next &bull; {nextTask.category}
                    </span>
                    <span className="text-xs font-semibold text-slate-500">Recommended Activity</span>
                  </div>
                  <h3 className="text-base sm:text-lg font-bold text-slate-900 font-display">
                    {nextTask.title}
                  </h3>
                  <p className="text-xs sm:text-sm text-slate-600 max-w-2xl leading-relaxed">
                    {nextTask.description}
                  </p>
                </div>

                <Link
                  href={nextTask.actionHref}
                  className="self-start sm:self-auto px-4 py-2.5 rounded-xl bg-[#2563EB] hover:bg-[#1D4ED8] text-white text-xs font-bold flex items-center gap-1.5 transition-all shadow-xs shrink-0"
                >
                  <span>{nextTask.actionLabel}</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            ) : (
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-xl bg-white border border-blue-200 text-emerald-600 flex items-center justify-center shrink-0">
                    <CheckCircle2 className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-900 font-display">You&apos;re All Caught Up!</h4>
                    <p className="text-slate-500 text-[11px]">No pending activities. Start a new topic or practice interview below.</p>
                  </div>
                </div>
                <Link
                  href="/dsa"
                  className="px-3.5 py-1.5 rounded-xl bg-white hover:bg-slate-100 border border-blue-200 text-slate-800 font-bold shrink-0 self-start sm:self-auto transition-colors"
                >
                  Browse Problem Arena →
                </Link>
              </div>
            )}
          </div>

          {/* COMPACT TOOL SHORTCUTS (Clear, Non-Duplicative Navigation) */}
          <div className="flex flex-wrap items-center gap-2 pt-1">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400 mr-1 select-none">
              Shortcuts:
            </span>
            <Link
              href="/dsa"
              className="px-3.5 py-1.5 text-xs font-semibold rounded-xl bg-white hover:bg-slate-100 border border-blue-200 text-slate-700 transition-all cursor-pointer shadow-2xs flex items-center gap-1.5"
            >
              <span>DSA Practice</span>
            </Link>
            <Link
              href="/interviews"
              className="px-3.5 py-1.5 text-xs font-semibold rounded-xl bg-white hover:bg-slate-100 border border-blue-200 text-slate-700 transition-all cursor-pointer shadow-2xs flex items-center gap-1.5"
            >
              <span>Mock Interviews</span>
            </Link>
            <Link
              href="/daily"
              className="px-3.5 py-1.5 text-xs font-semibold rounded-xl bg-white hover:bg-slate-100 border border-blue-200 text-slate-700 transition-all cursor-pointer shadow-2xs flex items-center gap-1.5"
            >
              <span>Daily Challenge</span>
            </Link>
            <Link
              href="/edmail"
              className="px-3.5 py-1.5 text-xs font-semibold rounded-xl bg-white hover:bg-slate-100 border border-blue-200 text-slate-700 transition-all cursor-pointer shadow-2xs flex items-center gap-1.5"
            >
              <Mail className="w-3.5 h-3.5 text-[#2563EB]" />
              <span>EdMail</span>
            </Link>
            <Link
              href="/student-record"
              className="px-3.5 py-1.5 text-xs font-semibold rounded-xl bg-white hover:bg-slate-100 border border-blue-200 text-slate-700 transition-all cursor-pointer shadow-2xs flex items-center gap-1.5"
            >
              <GraduationCap className="w-3.5 h-3.5 text-[#2563EB]" />
              <span>Student Record</span>
            </Link>
          </div>

          {/* SLIDING UPCOMING EVENTS BANNER STRIP (16:9 ratio, responsive) */}
          <div className="pt-2">
            <FeaturedEventsCarousel userId={user?.uid} />
          </div>

          {/* TOP ROW OF 4 SQUIRCLE FEATURE CARDS (Equalized Height & Cohesive Cards) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-2">
            {/* Card 1: Practice Problems / DSA Arena */}
            <Link
              href="/dsa"
              className="bg-white hover:border-indigo-100/80 border border-blue-100 rounded-3xl p-5 transition-all flex flex-col justify-between min-h-[168px] group shadow-xs cursor-pointer"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                  Practice
                </span>
                <div className="w-8 h-8 rounded-2xl bg-[#DBEAFE] text-[#2563EB] flex items-center justify-center transition-transform group-hover:scale-110">
                  <Target className="w-4 h-4" />
                </div>
              </div>
              <div className="space-y-1">
                <h3 className="text-base font-black font-display text-slate-900 group-hover:text-[#2563EB] transition-colors">
                  Problem Arena
                </h3>
                <p className="text-xs text-slate-500 line-clamp-2">
                  1,000+ curated algorithmic problems calibrated for top tech placements.
                </p>
              </div>
            </Link>

            {/* Card 2: Daily Habit Loop */}
            <Link
              href="/daily"
              className="bg-white hover:border-indigo-100/80 border border-blue-100 rounded-3xl p-5 transition-all flex flex-col justify-between min-h-[168px] group shadow-xs cursor-pointer"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                  Habit Loop
                </span>
                <div className="w-8 h-8 rounded-2xl bg-[#EFF6FF] text-[#2563EB] flex items-center justify-center transition-transform group-hover:scale-110">
                  <Flame className="w-4 h-4 fill-[#2563EB]" />
                </div>
              </div>
              <div className="space-y-1">
                <h3 className="text-base font-black font-display text-slate-900 group-hover:text-[#2563EB] transition-colors">
                  Daily Habit Loop
                </h3>
                <p className="text-xs text-slate-500 line-clamp-2">
                  1 DSA + 3 Aptitude + 1 Interview. 4-day streak active (+250 XP bonus pool).
                </p>
              </div>
            </Link>

            {/* Card 3: Synced Profiles */}
            <Link
              href="/profile"
              className="bg-white hover:border-indigo-100/80 border border-blue-100 rounded-3xl p-5 transition-all flex flex-col justify-between min-h-[168px] group shadow-xs cursor-pointer"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                  Sync &amp; Proof
                </span>
                <div className="w-8 h-8 rounded-2xl bg-[#EFF6FF] text-[#2563EB] flex items-center justify-center border border-emerald-200/60 transition-transform group-hover:scale-110">
                  <GitBranch className="w-4 h-4" />
                </div>
              </div>
              <div className="space-y-1">
                <h3 className="text-base font-black font-display text-slate-900 group-hover:text-[#2563EB] transition-colors">
                  Synced Profiles
                </h3>
                <p className="text-xs text-slate-500 line-clamp-2">
                  GitHub repos &amp; LeetCode solved problems automatically verified on your digital student card.
                </p>
              </div>
            </Link>

            {/* Card 4: Study Squads */}
            <Link
              href="/squads"
              className="bg-white hover:border-indigo-100/80 border border-blue-100 rounded-3xl p-5 transition-all flex flex-col justify-between min-h-[168px] group shadow-xs cursor-pointer"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                  Peer Velocity
                </span>
                <div className="w-8 h-8 rounded-2xl bg-[#DBEAFE] text-[#2563EB] flex items-center justify-center transition-transform group-hover:scale-110">
                  <Users className="w-4 h-4" />
                </div>
              </div>
              <div className="space-y-1">
                <h3 className="text-base font-black font-display text-slate-900 group-hover:text-[#2563EB] transition-colors">
                  Study Squads
                </h3>
                <p className="text-xs text-slate-500 line-clamp-2">
                  Collaborate in 6-student study groups. Group streaks and shared weekly leaderboard ranking.
                </p>
              </div>
            </Link>
          </div>
        </section>

        {/* 1.5 DEEP WORK FOCUS LOCK STRIP */}
        <section className="p-6 rounded-3xl bg-white border border-blue-100 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-5 text-slate-900">
          <div className="space-y-1.5 max-w-xl">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-[#DBEAFE] text-[#4338CA]">
                Focus Mode
              </span>
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-mono font-semibold text-slate-400 bg-slate-100">
                ZERO DISTRACTION
              </span>
            </div>
            <h3 className="text-lg font-bold text-slate-900 font-display">
              Lock In for a Distraction-Free Study Session
            </h3>
            <p className="text-xs text-slate-500 font-normal leading-relaxed">
              Restrict distracting websites and apps until your study timer completes to build deep algorithmic practice.
            </p>
          </div>

          <div className="flex flex-wrap sm:flex-nowrap items-center gap-2.5 shrink-0">
            <Link
              href="/focus"
              className="px-5 py-2.5 text-xs sm:text-sm font-bold rounded-2xl bg-[#2563EB] hover:bg-[#1D4ED8] text-white flex items-center gap-2 cursor-pointer shadow-md shadow-indigo-500/20 transition-all active:scale-95"
            >
              <Lock className="w-4 h-4 text-white" />
              <span>Launch Focus Studio</span>
              <ArrowRight className="w-3.5 h-3.5 text-white" />
            </Link>
          </div>
        </section>

        {/* CHUNKED MODULAR 3-COLUMN GRID HOUSING THE WIDGETS */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 sm:gap-8 items-start">
          
          {/* LEFT 2-COLUMNS: Daily Habit, Student Progress, and Personalized Timetable */}
          <div className="lg:col-span-2 space-y-6 sm:space-y-8">
            {/* 2. DAILY HABIT LOOP HERO CARD */}
            <section aria-label="Daily Habit Loop">
              <DailyHabitHeroCard userId={user?.uid} />
            </section>

            {/* 3. SECTION 1: LEARNING PROGRESS WIDGET */}
            <section aria-label="Student Learning Progress">
              <StudentProgressWidget onOpenMyra={handleOpenMyra} />
            </section>

            {/* 4. SECTION 2: TIMETABLE & HORIZONTAL DATE SCROLLER */}
            <section aria-label="Personalized Daily and Weekly Timetable">
              <PersonalizedTimetableWidget />
            </section>
          </div>

          {/* RIGHT 1-COLUMN: Continue DSA, Promotional Motivation Card, Career Path Selector */}
          <div className="lg:col-span-1 space-y-6 sm:space-y-8">
            {/* 5. CONTINUE DSA WIDGET */}
            <section aria-label="Continue DSA Practice" data-section="continue_dsa">
              <ContinueDsaWidget userId={user?.uid} />
            </section>

            {/* 6. PROMOTIONAL MOTIVATION CARD */}
            <section aria-label="Community Placement Motivation">
              <PromotionalMotivationCard />
            </section>

            {/* 7. CAREER PATH SELECTION WIDGET */}
            <section aria-label="Career Path Selection">
              <CareerPathSelectorWidget />
            </section>
          </div>

        </div>

      </div>
    </AuthGuard>
  );
}
