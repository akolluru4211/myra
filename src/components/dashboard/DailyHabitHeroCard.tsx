"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  Flame,
  CheckCircle2,
  Circle,
  ArrowRight,
  Sparkles,
  Code2,
  Brain,
  MessageSquare,
  Trophy,
} from "lucide-react";

interface DailyHabitHeroCardProps {
  userId?: string;
  className?: string;
}

interface HabitTask {
  id: string;
  category: "DSA" | "Aptitude" | "Interview";
  title: string;
  xp: number;
  duration: string;
}

const DEFAULT_TASKS: HabitTask[] = [
  {
    id: "habit-dsa-1",
    category: "DSA",
    title: "Array Two-Pointers Reversal Drill",
    xp: 50,
    duration: "15 min",
  },
  {
    id: "habit-apt-1",
    category: "Aptitude",
    title: "Quantitative: Time, Speed & Distance",
    xp: 35,
    duration: "8 min",
  },
  {
    id: "habit-apt-2",
    category: "Aptitude",
    title: "Logical Reasoning: Syllogisms & Deductions",
    xp: 35,
    duration: "8 min",
  },
  {
    id: "habit-apt-3",
    category: "Aptitude",
    title: "Verbal: Reading Comprehension Patterns",
    xp: 30,
    duration: "7 min",
  },
  {
    id: "habit-interview-1",
    category: "Interview",
    title: "STAR Response: Handling Technical Disagreements",
    xp: 50,
    duration: "10 min",
  },
];

export default function DailyHabitHeroCard({ userId, className = "" }: DailyHabitHeroCardProps) {
  const [completedMap, setCompletedMap] = useState<Record<string, boolean>>({
    "habit-dsa-1": true,
    "habit-apt-1": true,
  });
  const [streakDays] = useState<number>(4);
  const [level] = useState<number>(2);
  const [currentXp] = useState<number>(340);
  const [targetXp] = useState<number>(500);

  const todayKey = new Date().toISOString().split("T")[0];

  useEffect(() => {
    try {
      if (typeof window !== "undefined") {
        const saved = localStorage.getItem(`edworld_habit_checklist_${todayKey}`);
        if (saved) {
          setCompletedMap(JSON.parse(saved));
        }
      }
    } catch (e) {}
  }, [todayKey]);

  const toggleTask = (taskId: string) => {
    setCompletedMap((prev) => {
      const next = { ...prev, [taskId]: !prev[taskId] };
      try {
        if (typeof window !== "undefined") {
          localStorage.setItem(`edworld_habit_checklist_${todayKey}`, JSON.stringify(next));
        }
      } catch (e) {}
      return next;
    });
  };

  const completedCount = DEFAULT_TASKS.filter((t) => completedMap[t.id]).length;
  const totalTasks = DEFAULT_TASKS.length;
  const progressPercent = Math.round((completedCount / totalTasks) * 100);

  // SVG Circular Gauge Dimensions
  const circleRadius = 38;
  const circleCircumference = 2 * Math.PI * circleRadius;
  const strokeDashoffset = circleCircumference - (progressPercent / 100) * circleCircumference;

  return (
    <div
      className={`bg-white rounded-3xl border border-slate-100/80 shadow-[0_10px_30px_rgba(80,90,130,0.06)] p-6 sm:p-7 space-y-6 text-slate-900 ${className}`}
    >
      {/* Top Header Row: Title, Coral Streak Pill & Circular Gauge */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-5">
        <div className="space-y-2">
          <div className="flex items-center gap-2 flex-wrap">
            {/* Coral Streak Pill */}
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-[#FFE4E6] text-[#F43F5E] shadow-2xs">
              <Flame className="w-3.5 h-3.5 fill-[#F43F5E]" />
              <span>{streakDays}-Day Habit Streak</span>
            </span>

            {/* Soft Lavender Level Pill */}
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-[#EEF0FD] text-[#4338CA]">
              <Trophy className="w-3 h-3 text-[#5C59E8]" />
              <span>Level {level} Explorer</span>
            </span>
          </div>

          <h2 className="text-xl sm:text-2xl font-black font-display tracking-tight text-slate-900">
            Daily Habit Loop
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 max-w-md">
            Complete your 5 daily placement drills (1 DSA + 3 Aptitude + 1 Interview) to lock in your daily consistency score.
          </p>
        </div>

        {/* Circular Progress Gauge */}
        <div className="flex items-center gap-3 shrink-0 self-start sm:self-center bg-[#F8F9FD] p-3 rounded-2xl border border-slate-100">
          <div className="relative w-20 h-20 flex items-center justify-center">
            <svg className="w-20 h-20 -rotate-90 transform" viewBox="0 0 96 96">
              {/* Background ring */}
              <circle
                cx="48"
                cy="48"
                r={circleRadius}
                stroke="#E2E8F0"
                strokeWidth="7"
                fill="none"
              />
              {/* Progress ring */}
              <circle
                cx="48"
                cy="48"
                r={circleRadius}
                stroke="#5C59E8"
                strokeWidth="7"
                strokeDasharray={circleCircumference}
                strokeDashoffset={strokeDashoffset}
                strokeLinecap="round"
                fill="none"
                className="transition-all duration-500 ease-out"
              />
            </svg>
            <div className="absolute flex flex-col items-center justify-center text-center">
              <span className="text-base font-black font-display text-slate-900 leading-none">
                {progressPercent}%
              </span>
              <span className="text-[10px] font-bold text-slate-400 mt-0.5">
                {completedCount}/{totalTasks}
              </span>
            </div>
          </div>

          <div className="space-y-1">
            <div className="text-xs font-bold text-slate-900">
              {completedCount === totalTasks ? "Challenge Done!" : "Tasks in Flight"}
            </div>
            <div className="text-[11px] text-slate-500 font-medium">
              +{completedCount * 40} XP Earned
            </div>
          </div>
        </div>
      </div>

      {/* Level XP Progress Bar */}
      <div className="p-3.5 rounded-2xl bg-[#F8F9FD] border border-slate-100/90 space-y-2">
        <div className="flex items-center justify-between text-xs font-semibold">
          <span className="text-slate-600 flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-[#5C59E8]" />
            <span>XP to Level {level + 1}</span>
          </span>
          <span className="text-slate-900 font-bold font-mono">
            {currentXp} <span className="text-slate-400 font-normal">/ {targetXp} XP</span>
          </span>
        </div>
        <div className="w-full bg-slate-200/80 h-2 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-[#5C59E8] to-[#4338CA] rounded-full transition-all duration-500"
            style={{ width: `${Math.round((currentXp / targetXp) * 100)}%` }}
          />
        </div>
      </div>

      {/* 5-Item Interactive Checklist */}
      <div className="space-y-2.5">
        <div className="text-xs font-bold uppercase tracking-wider text-slate-400">
          Today's 5 Core Drills
        </div>

        <div className="space-y-2">
          {DEFAULT_TASKS.map((task) => {
            const isDone = Boolean(completedMap[task.id]);

            return (
              <div
                key={task.id}
                onClick={() => toggleTask(task.id)}
                className={`p-3.5 rounded-2xl border transition-all cursor-pointer flex items-center justify-between gap-3 ${
                  isDone
                    ? "bg-emerald-50/60 border-emerald-200/60 text-slate-900"
                    : "bg-[#F8F9FD] border-slate-100 hover:border-indigo-200/60 hover:bg-[#EEF0FD]/40 text-slate-800"
                }`}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <button
                    type="button"
                    aria-label={`Toggle task ${task.title}`}
                    className="shrink-0 transition-transform active:scale-90"
                  >
                    {isDone ? (
                      <CheckCircle2 className="w-5 h-5 text-emerald-600 fill-emerald-100" />
                    ) : (
                      <Circle className="w-5 h-5 text-slate-300 hover:text-[#5C59E8]" />
                    )}
                  </button>

                  <div className="min-w-0 space-y-0.5">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span
                        className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${
                          task.category === "DSA"
                            ? "bg-[#EEF0FD] text-[#4338CA]"
                            : task.category === "Aptitude"
                            ? "bg-amber-50 text-amber-700 border border-amber-200/60"
                            : "bg-rose-50 text-rose-700 border border-rose-200/60"
                        }`}
                      >
                        {task.category}
                      </span>
                      <span className="text-[11px] text-slate-400 font-mono">
                        {task.duration}
                      </span>
                    </div>

                    <h4
                      className={`text-xs sm:text-sm font-semibold truncate ${
                        isDone ? "line-through text-slate-500" : "text-slate-900"
                      }`}
                    >
                      {task.title}
                    </h4>
                  </div>
                </div>

                <span
                  className={`text-xs font-bold shrink-0 px-2.5 py-1 rounded-xl ${
                    isDone
                      ? "bg-emerald-100 text-emerald-800"
                      : "bg-[#EEF0FD] text-[#4338CA]"
                  }`}
                >
                  +{task.xp} XP
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Bottom CTA Row */}
      <div className="pt-2 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <span className="text-xs text-slate-500">
          Streak protected with <strong>1 active freeze</strong>
        </span>
        <Link
          href="/daily"
          className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-2xl bg-[#5C59E8] hover:bg-[#4E4BC6] text-white text-xs sm:text-sm font-bold transition-all shadow-md shadow-indigo-500/20 active:scale-95 cursor-pointer"
        >
          <span>Launch Full Daily Challenge</span>
          <ArrowRight className="w-4 h-4 text-white" />
        </Link>
      </div>
    </div>
  );
}
