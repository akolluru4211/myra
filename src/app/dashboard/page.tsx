"use client";

export const dynamic = "force-dynamic";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  Sparkles,
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
  }, []);

  const handleOpenMyra = () => {
    if (typeof window !== "undefined") {
      window.dispatchEvent(new CustomEvent("open-myra-copilot"));
    }
  };

  const studentName = localData.name || profile?.name || user?.name || "Student";
  const targetRole = localData.targetRole || profile?.targetRole || "Software Engineer";
  const academicStage = localData.degree || profile?.degree || profile?.careerStage || "Undergraduate";
  const cgpa = (localData.cgpa || profile?.cgpa) ? `${localData.cgpa || profile?.cgpa} CGPA` : academicStage;
  const isOnboardingDone = localData.completed === true || profile?.onboarding_completed === true;

  return (
    <AuthGuard>
      <div className="min-h-screen bg-[#F4F5FA] text-slate-900 font-sans pb-12 space-y-6 sm:space-y-8 animate-in fade-in duration-200">
        
        {/* Onboarding Incomplete Alert Banner */}
        {!isOnboardingDone && profile?.onboarding_completed === false && (
          <div className="p-4 sm:p-5 rounded-2xl bg-white border border-slate-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-[#EEF0FD] flex items-center justify-center shrink-0 font-bold text-[#5C59E8]">
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
              className="px-4 py-2 text-xs font-bold rounded-xl bg-[#5C59E8] hover:bg-[#4E4BC6] text-white shrink-0 flex items-center gap-1.5 transition-all shadow-sm"
            >
              <span>Complete Setup</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        )}

        {/* 1. TOP FRIENDLY HERO HEADLINE & QUICK ACTIONS */}
        <section className="space-y-4">
          <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4">
            <div className="space-y-2">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="px-3 py-1 rounded-full text-xs font-bold bg-[#FFE4E6] text-[#F43F5E] flex items-center gap-1.5">
                  <Flame className="w-3.5 h-3.5 fill-[#F43F5E]" />
                  <span>4-Day Study Streak</span>
                </span>
                <span className="px-3 py-1 rounded-full text-xs font-semibold bg-white border border-slate-200/80 text-slate-600 font-mono">
                  {academicStage}
                </span>
                <span className="px-3 py-1 rounded-full text-xs font-semibold bg-white border border-slate-200/80 text-slate-800 font-mono">
                  {cgpa}
                </span>
                <span className="px-3 py-1 rounded-full text-xs font-bold bg-[#EEF0FD] text-[#4338CA]">
                  {targetRole}
                </span>
              </div>

              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black font-display text-slate-900 tracking-tight">
                Hi, {studentName}! 👋 🎯
              </h1>
              <p className="text-sm sm:text-base text-slate-600 leading-relaxed font-normal max-w-2xl">
                What are your plans for today? Your personalized career dashboard tracks your daily habit loop, scheduled timetable blocks, and placement readiness.
              </p>
            </div>

            {/* Quick Action Navigation Buttons */}
            <div className="flex flex-wrap items-center gap-2.5 shrink-0">
              <button
                type="button"
                onClick={handleOpenMyra}
                className="px-5 py-2.5 text-xs sm:text-sm font-bold rounded-2xl bg-[#5C59E8] hover:bg-[#4E4BC6] text-white flex items-center gap-2 cursor-pointer shadow-md shadow-indigo-500/20 transition-all active:scale-95"
              >
                <Sparkles className="w-4 h-4 text-white" />
                <span>Ask Myra Copilot</span>
              </button>
              <Link
                href="/dsa"
                className="px-4 py-2.5 text-xs sm:text-sm font-bold rounded-2xl bg-white hover:bg-slate-100 border border-slate-200/80 text-slate-800 flex items-center gap-2 transition-all cursor-pointer shadow-2xs"
              >
                <span>DSA Practice</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
              <Link
                href="/interviews"
                className="px-4 py-2.5 text-xs sm:text-sm font-bold rounded-2xl bg-white hover:bg-slate-100 border border-slate-200/80 text-slate-800 flex items-center gap-2 transition-all cursor-pointer shadow-2xs"
              >
                <span>Mock Interviews</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>

          {/* TOP ROW OF 4 SQUIRCLE FEATURE CARDS (Matching Reference Design Top Row) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-2">
            {/* Card 1: + Ask Myra / New Goal Quick Card */}
            <div
              onClick={handleOpenMyra}
              className="bg-[#EEF0FD] hover:bg-[#E0E3FA] border border-indigo-100/90 rounded-3xl p-5 transition-all cursor-pointer flex flex-col justify-between gap-4 group shadow-[0_10px_30px_rgba(80,90,130,0.06)]"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-[#4338CA] uppercase tracking-wider">
                  Quick Action
                </span>
                <div className="w-8 h-8 rounded-2xl bg-[#5C59E8] text-white flex items-center justify-center transition-transform group-hover:scale-110 shadow-xs">
                  <Plus className="w-4 h-4 stroke-[3]" />
                </div>
              </div>
              <div className="space-y-1">
                <h3 className="text-base font-black font-display text-[#1E1B4B]">
                  + Ask Myra Copilot
                </h3>
                <p className="text-xs text-[#4338CA]/80">
                  Instant AI guidance on roadmap milestones, interview feedback, and timetable adjustments.
                </p>
              </div>
            </div>

            {/* Card 2: Daily Habit Loop */}
            <Link
              href="/daily"
              className="bg-white hover:border-indigo-100/80 border border-slate-100/80 rounded-3xl p-5 transition-all flex flex-col justify-between gap-4 group shadow-[0_10px_30px_rgba(80,90,130,0.06)] cursor-pointer"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                  Habit Loop
                </span>
                <div className="w-8 h-8 rounded-2xl bg-[#FFE4E6] text-[#F43F5E] flex items-center justify-center transition-transform group-hover:scale-110">
                  <Flame className="w-4 h-4 fill-[#F43F5E]" />
                </div>
              </div>
              <div className="space-y-1">
                <h3 className="text-base font-black font-display text-slate-900 group-hover:text-[#5C59E8] transition-colors">
                  Daily Habit Loop
                </h3>
                <p className="text-xs text-slate-500">
                  1 DSA + 3 Aptitude + 1 Interview. 4-day streak active (+250 XP bonus pool).
                </p>
              </div>
            </Link>

            {/* Card 3: Synced Profiles */}
            <Link
              href="/profile"
              className="bg-white hover:border-indigo-100/80 border border-slate-100/80 rounded-3xl p-5 transition-all flex flex-col justify-between gap-4 group shadow-[0_10px_30px_rgba(80,90,130,0.06)] cursor-pointer"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                  Sync &amp; Proof
                </span>
                <div className="w-8 h-8 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center border border-emerald-200/60 transition-transform group-hover:scale-110">
                  <GitBranch className="w-4 h-4" />
                </div>
              </div>
              <div className="space-y-1">
                <h3 className="text-base font-black font-display text-slate-900 group-hover:text-[#5C59E8] transition-colors">
                  Synced Profiles
                </h3>
                <p className="text-xs text-slate-500">
                  GitHub repos &amp; LeetCode solved problems automatically verified on your digital student card.
                </p>
              </div>
            </Link>

            {/* Card 4: Study Squads */}
            <Link
              href="/squads"
              className="bg-white hover:border-indigo-100/80 border border-slate-100/80 rounded-3xl p-5 transition-all flex flex-col justify-between gap-4 group shadow-[0_10px_30px_rgba(80,90,130,0.06)] cursor-pointer"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                  Peer Velocity
                </span>
                <div className="w-8 h-8 rounded-2xl bg-[#EEF0FD] text-[#5C59E8] flex items-center justify-center transition-transform group-hover:scale-110">
                  <Users className="w-4 h-4" />
                </div>
              </div>
              <div className="space-y-1">
                <h3 className="text-base font-black font-display text-slate-900 group-hover:text-[#5C59E8] transition-colors">
                  Study Squads
                </h3>
                <p className="text-xs text-slate-500">
                  Collaborate in 6-student study groups. Group streaks and shared weekly leaderboard ranking.
                </p>
              </div>
            </Link>
          </div>
        </section>

        {/* 1.5 DEEP WORK FOCUS LOCK STRIP */}
        <section className="p-6 rounded-3xl bg-white border border-slate-100/80 shadow-[0_10px_30px_rgba(80,90,130,0.06)] flex flex-col md:flex-row md:items-center justify-between gap-5 text-slate-900">
          <div className="space-y-1.5 max-w-xl">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-[#EEF0FD] text-[#4338CA]">
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
              className="px-5 py-2.5 text-xs sm:text-sm font-bold rounded-2xl bg-[#5C59E8] hover:bg-[#4E4BC6] text-white flex items-center gap-2 cursor-pointer shadow-md shadow-indigo-500/20 transition-all active:scale-95"
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
