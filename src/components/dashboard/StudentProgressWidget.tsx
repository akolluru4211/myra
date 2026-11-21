"use client";

import React, { useState, useEffect } from "react";
import { Flame, Target, TrendingUp, CheckCircle2, Clock, Sparkles } from "lucide-react";
import { useAuth } from "@/lib/auth-context";

interface StudentProgressWidgetProps {
  onOpenMyra?: () => void;
}

export default function StudentProgressWidget({ onOpenMyra }: StudentProgressWidgetProps) {
  const { user, profile } = useAuth();
  const [dailyHours, setDailyHours] = useState<number>(3);
  const [completedCount, setCompletedCount] = useState<number>(0);
  const [totalSlots, setTotalSlots] = useState<number>(3);

  const studentName = profile?.name || user?.name || "Student";
  const targetRole = profile?.targetRole || "Software Engineer";
  const streakDays = 4; // active streak

  // Read saved timetable checklist state to synchronize progress accurately
  useEffect(() => {
    try {
      const todayKey = new Date().toISOString().split("T")[0];
      const saved = localStorage.getItem(`edworld_timetable_${todayKey}`);
      if (saved) {
        const parsed = JSON.parse(saved);
        const done = Object.values(parsed).filter(Boolean).length;
        setCompletedCount(done);
      }
      const savedHours = localStorage.getItem("edworld_study_hours");
      if (savedHours) {
        const hours = Number(savedHours);
        setDailyHours(hours);
        setTotalSlots(hours <= 2 ? 2 : hours <= 3.5 ? 3 : 3);
      }
    } catch (e) {
      // Local storage fallback
    }
  }, []);

  const loggedHours = totalSlots > 0 ? ((completedCount / totalSlots) * dailyHours).toFixed(1) : "0.0";
  const progressPercent = totalSlots > 0 ? Math.min(100, Math.round((completedCount / totalSlots) * 100)) : 0;

  // Days of week for streak tracking
  const daysOfWeek = ["M", "T", "W", "T", "F", "S", "S"];
  const activeDays = [true, true, true, true, false, false, false]; // Mon-Thu completed

  // Circular gauge calculations
  const ringRadius = 32;
  const ringCircumference = 2 * Math.PI * ringRadius;
  const dailyOffset = ringCircumference - (progressPercent / 100) * ringCircumference;
  const consistencyPercent = 71; // 5 of 7
  const consistencyOffset = ringCircumference - (consistencyPercent / 100) * ringCircumference;
  const readinessPercent = 86; // 86% ready
  const readinessOffset = ringCircumference - (readinessPercent / 100) * ringCircumference;

  return (
    <div className="bg-white rounded-3xl border border-slate-100/80 shadow-[0_10px_30px_rgba(80,90,130,0.06)] p-6 sm:p-7 space-y-6 text-slate-900">
      {/* Header with Title and Streak Badge */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#4338CA] bg-[#EEF0FD] px-3 py-0.5 rounded-full font-display">
              Learning Progress
            </span>
            <span className="text-xs font-medium text-slate-400">Real-time Academic Index</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-slate-900 mt-1 font-display tracking-tight">
            Student Performance &amp; Milestones
          </h2>
        </div>

        {/* Streak Pill */}
        <div className="flex items-center gap-3 bg-[#FFE4E6] border border-rose-200/60 px-4 py-2 rounded-2xl shrink-0">
          <div className="w-8 h-8 rounded-xl bg-white flex items-center justify-center shrink-0 shadow-xs">
            <Flame className="w-4 h-4 fill-[#F43F5E] text-[#F43F5E]" />
          </div>
          <div>
            <div className="text-xs font-bold text-[#F43F5E] flex items-center gap-1.5 font-display">
              <span>{streakDays} Day Study Streak</span>
            </div>
            <p className="text-[11px] font-medium text-rose-700/80">Top 10% consistency this week</p>
          </div>
        </div>
      </div>

      {/* 3 Metric Cards Grid with Circular Progress Gauges */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {/* Metric 1: Daily Study Hours */}
        <div className="p-5 rounded-2xl bg-[#F8F9FD] border border-slate-100/90 flex flex-col justify-between shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-600">Daily Study Goal</span>
            <div className="w-7 h-7 rounded-lg bg-[#EEF0FD] flex items-center justify-center text-[#5C59E8]">
              <Clock className="w-3.5 h-3.5 stroke-[2]" />
            </div>
          </div>
          <div className="mt-3 flex items-center justify-between gap-3">
            <div>
              <div className="text-2xl font-black font-display text-slate-900 tabular-nums">
                {loggedHours} <span className="text-xs font-normal text-slate-400">/ {dailyHours} hrs</span>
              </div>
              <span className="text-[11px] font-medium text-slate-500 mt-1 inline-block">
                {progressPercent}% of schedule finished
              </span>
            </div>

            {/* Circular Gauge */}
            <div className="relative w-14 h-14 shrink-0 flex items-center justify-center">
              <svg className="w-14 h-14 -rotate-90" viewBox="0 0 76 76">
                <circle cx="38" cy="38" r={ringRadius} stroke="#E2E8F0" strokeWidth="5.5" fill="none" />
                <circle
                  cx="38"
                  cy="38"
                  r={ringRadius}
                  stroke="#5C59E8"
                  strokeWidth="5.5"
                  strokeDasharray={ringCircumference}
                  strokeDashoffset={dailyOffset}
                  strokeLinecap="round"
                  fill="none"
                  className="transition-all duration-500"
                />
              </svg>
              <span className="absolute text-[11px] font-black font-display text-slate-800">
                {progressPercent}%
              </span>
            </div>
          </div>
        </div>

        {/* Metric 2: Weekly Consistency */}
        <div className="p-5 rounded-2xl bg-[#F8F9FD] border border-slate-100/90 flex flex-col justify-between shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-600">Weekly Consistency</span>
            <div className="w-7 h-7 rounded-lg bg-emerald-50 flex items-center justify-center text-emerald-600 border border-emerald-200/60">
              <TrendingUp className="w-3.5 h-3.5 stroke-[2]" />
            </div>
          </div>
          <div className="mt-3">
            <div className="flex items-center gap-1.5 pt-1">
              {daysOfWeek.map((day, idx) => (
                <div key={idx} className="flex-1 flex flex-col items-center gap-1">
                  <div
                    className={`w-full aspect-square rounded-xl flex items-center justify-center text-[10px] font-bold transition-all shadow-xs ${
                      activeDays[idx]
                        ? "bg-emerald-500 text-white font-bold"
                        : "bg-white text-slate-400 border border-slate-200"
                    }`}
                  >
                    {activeDays[idx] ? "✓" : ""}
                  </div>
                  <span className="text-[10px] text-slate-400 font-semibold">{day}</span>
                </div>
              ))}
            </div>
            <span className="text-[11px] text-slate-500 font-medium mt-2.5 inline-block">
              4 of 7 weekly targets logged
            </span>
          </div>
        </div>

        {/* Metric 3: Target Role Readiness */}
        <div className="p-5 rounded-2xl bg-[#F8F9FD] border border-slate-100/90 flex flex-col justify-between shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-600">Role Readiness</span>
            <div className="w-7 h-7 rounded-lg bg-[#EEF0FD] flex items-center justify-center text-[#5C59E8]">
              <Target className="w-3.5 h-3.5 stroke-[2]" />
            </div>
          </div>
          <div className="mt-3 flex items-center justify-between gap-3">
            <div>
              <div className="text-2xl font-black font-display text-slate-900">
                86% <span className="text-xs font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200/60">Ready</span>
              </div>
              <p className="text-[11px] text-slate-500 mt-1 truncate font-normal">
                Benchmarked for <strong className="text-slate-800">{targetRole}</strong>
              </p>
              <div className="mt-1 flex items-center gap-1.5 text-[11px] text-slate-600 font-medium">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                <span>14 of 18 milestones verified</span>
              </div>
            </div>

            {/* Circular Gauge */}
            <div className="relative w-14 h-14 shrink-0 flex items-center justify-center">
              <svg className="w-14 h-14 -rotate-90" viewBox="0 0 76 76">
                <circle cx="38" cy="38" r={ringRadius} stroke="#E2E8F0" strokeWidth="5.5" fill="none" />
                <circle
                  cx="38"
                  cy="38"
                  r={ringRadius}
                  stroke="#10B981"
                  strokeWidth="5.5"
                  strokeDasharray={ringCircumference}
                  strokeDashoffset={readinessOffset}
                  strokeLinecap="round"
                  fill="none"
                  className="transition-all duration-500"
                />
              </svg>
              <span className="absolute text-[11px] font-black font-display text-slate-800">
                86%
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
