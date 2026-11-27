"use client";

export const dynamic = "force-dynamic";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import styles from "./dashboard.module.css";
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
import OpportunityBoard from "@/components/dashboard/OpportunityBoard";

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
      <div className="text-slate-900 pb-8 space-y-8 sm:space-y-10">
        
        {/* Onboarding Incomplete Alert Banner */}
        {!isOnboardingDone && profile?.onboarding_completed === false && (
          <div className="p-4 sm:p-5 rounded-2xl bg-white border border-neutral-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-[#efeeeb] flex items-center justify-center shrink-0 font-bold text-[#292825]">
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
              className="px-4 py-2 text-xs font-bold rounded-xl bg-[#292825] hover:bg-[#45433f] text-white shrink-0 flex items-center gap-1.5 transition-all shadow-sm"
            >
              <span>Complete Setup</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        )}

        <section className="space-y-5" aria-label="Student workspace">
          <div className={styles.welcome}>
            <div>
              <h1 className={styles.welcomeTitle}>Hi, {studentName}!</h1>
              <p>Pick up where you left off or ask Myra to help you plan your next study session.</p>
            </div>

            {/* Primary Action Button: Ask Myra */}
            <div className={`hidden lg:block ${styles.welcomeAction}`}>
              <button
                type="button"
                onClick={handleOpenMyra}
                aria-label="Ask Myra Copilot"
                title="Ask Myra Copilot"
                className={styles.myraButton}
              >
                <Sparkles size={17} aria-hidden="true" />
                <span>Ask Myra</span>
              </button>
            </div>
          </div>

          {/* NEXT TASK / UP NEXT HIGHLIGHT CARD */}
          <div className={styles.nextActivity}>
            {loadingTask ? (
              <div className="flex items-center gap-3 py-2 text-slate-500 text-xs font-medium">
                <div className="w-4 h-4 border-2 border-[#292825] border-t-transparent rounded-full animate-spin shrink-0" />
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
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider bg-white border border-neutral-200 text-[#292825]">
                      Up Next &bull; {nextTask.category}
                    </span>
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
                  className="self-start sm:self-auto px-4 py-2.5 rounded-xl bg-[#292825] hover:bg-[#45433f] text-white text-xs font-bold flex items-center gap-1.5 transition-all shadow-xs shrink-0"
                >
                  <span>{nextTask.actionLabel}</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            ) : (
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-xl bg-white border border-neutral-200 text-emerald-600 flex items-center justify-center shrink-0">
                    <CheckCircle2 className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-900 font-display">You&apos;re All Caught Up!</h4>
                    <p className="text-slate-500 text-[11px]">No pending activities. Start a new topic or practice interview below.</p>
                  </div>
                </div>
                <Link
                  href="/dsa"
                  className="px-3.5 py-1.5 rounded-xl bg-white hover:bg-slate-100 border border-neutral-200 text-slate-800 font-bold shrink-0 self-start sm:self-auto transition-colors"
                >
                  Browse practice problems
                </Link>
              </div>
            )}
          </div>

          {/* COMPACT TOOL SHORTCUTS (Clear, Non-Duplicative Navigation) */}
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-sm font-semibold text-slate-600 mr-1">
              Shortcuts
            </span>
            <Link
              href="/dsa"
              className={styles.quickLink}
            >
              <span>DSA Practice</span>
            </Link>
            <Link
              href="/interviews"
              className={styles.quickLink}
            >
              <span>Mock Interviews</span>
            </Link>
            <Link
              href="/daily"
              className={styles.quickLink}
            >
              <span>Daily Challenge</span>
            </Link>
            <Link
              href="/edmail"
              className={styles.quickLink}
            >
              <Mail className="w-3.5 h-3.5 text-[#292825]" />
              <span>EdMail</span>
            </Link>
            <Link
              href="/student-record"
              className={styles.quickLink}
            >
              <GraduationCap className="w-3.5 h-3.5 text-[#292825]" />
              <span>Student Record</span>
            </Link>
          </div>

          {/* SLIDING UPCOMING EVENTS BANNER STRIP (16:9 ratio, responsive) */}
          <div className="pt-2">
            <FeaturedEventsCarousel userId={user?.uid} />
          </div>

          <OpportunityBoard />

          <div className="space-y-3">
            <h2 className="text-lg font-bold text-slate-900">Study tools</h2>
            <div className={styles.toolGrid}>
              {[
                { href: "/dsa", title: "Problem Arena", description: "Practice data structures and algorithms with curated problems.", icon: Target },
                { href: "/daily", title: "Daily Habit Loop", description: "Build a streak with short coding, aptitude, and interview drills.", icon: Flame },
                { href: "/profile", title: "Synced Profiles", description: "Show verified GitHub and LeetCode activity on your student card.", icon: GitBranch },
                { href: "/squads", title: "Study Squads", description: "Study with peers and work toward shared weekly goals.", icon: Users },
              ].map(({ href, title, description, icon: Icon }) => (
                <Link key={href} href={href} className={styles.toolCard}>
                  <div className={styles.toolCardTop}>
                    <span className={styles.toolIcon}><Icon size={18} aria-hidden="true" /></span>
                    <ArrowRight size={16} aria-hidden="true" className={styles.toolArrow} />
                  </div>
                  <div>
                    <h3>{title}</h3>
                    <p>{description}</p>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>

        {/* 1.5 DEEP WORK FOCUS LOCK STRIP */}
        <section className="p-6 rounded-3xl bg-white border border-blue-100 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-5 text-slate-900">
          <div className="space-y-1.5 max-w-xl">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-[#efeeeb] text-[#4338CA]">
                Focus Mode
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
              className="px-5 py-2.5 text-xs sm:text-sm font-bold rounded-2xl bg-[#292825] hover:bg-[#45433f] text-white flex items-center gap-2 cursor-pointer shadow-sm transition-all active:scale-95"
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
