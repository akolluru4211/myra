"use client";

import React, { useState, useEffect } from "react";
import { Clock } from "lucide-react";

interface StudentProgressWidgetProps {
  onOpenMyra?: () => void;
}

export default function StudentProgressWidget({ onOpenMyra }: StudentProgressWidgetProps) {
  const [dailyHours, setDailyHours] = useState<number>(3);
  const [completedCount, setCompletedCount] = useState<number>(0);
  const [totalSlots, setTotalSlots] = useState<number>(3);

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

  // Circular gauge calculations
  const ringRadius = 32;
  const ringCircumference = 2 * Math.PI * ringRadius;
  const dailyOffset = ringCircumference - (progressPercent / 100) * ringCircumference;
  return (
    <div className="space-y-6 border-t border-blue-100 py-6 text-slate-900">
      {/* Header with Title and Streak Badge */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#1E40AF] bg-[#EFF6FF] px-3 py-0.5 rounded-full font-display">
              Learning Progress
            </span>
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-slate-900 mt-1 font-display tracking-tight">
            Study Progress
          </h2>
        </div>

      </div>

      {/* 3 Metric Cards Grid with Circular Progress Gauges */}
      <div className="grid grid-cols-1 gap-4">
        {/* Metric 1: Daily Study Hours */}
        <div className="flex flex-col justify-between border-b border-blue-100 pb-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-600">Daily Study Goal</span>
            <div className="w-7 h-7 rounded-lg bg-[#EFF6FF] flex items-center justify-center text-[#2563EB]">
              <Clock className="w-3.5 h-3.5 stroke-[2]" />
            </div>
          </div>
          <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
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

      </div>
    </div>
  );
}
