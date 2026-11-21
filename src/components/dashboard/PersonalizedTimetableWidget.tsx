"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { 
  Calendar, 
  Clock, 
  CheckCircle2, 
  Circle, 
  Sparkles, 
  TrendingUp, 
  BookOpen, 
  Zap, 
  ArrowRight, 
  Sliders, 
  RotateCcw,
  Target,
  Award,
  Layers
} from "lucide-react";
import { useAuth } from "@/lib/auth-context";

interface TimetableSlot {
  id: string;
  timeOfDay: "Morning" | "Afternoon" | "Evening" | "Night";
  duration: string;
  title: string;
  category: "Core Concept" | "Coding & DSA" | "Aptitude" | "Interview Drill" | "Project Work";
  description: string;
  actionLabel: string;
  actionHref: string;
  recommendedFocus: string;
}

export default function PersonalizedTimetableWidget() {
  const { user, profile } = useAuth();
  const [dailyHours, setDailyHours] = useState<number>(3);
  const [completedSlots, setCompletedSlots] = useState<Record<string, boolean>>({});
  const [isMounted, setIsMounted] = useState(false);
  const [selectedDayIndex, setSelectedDayIndex] = useState<number>(3); // Default to today (Thu)

  // Today's date string for local storage key
  const todayKey = new Date().toISOString().split("T")[0];

  useEffect(() => {
    setIsMounted(true);
    try {
      const saved = localStorage.getItem(`edworld_timetable_${todayKey}`);
      if (saved) {
        setCompletedSlots(JSON.parse(saved));
      }
      const savedHours = localStorage.getItem("edworld_study_hours");
      if (savedHours) {
        setDailyHours(Number(savedHours));
      }
    } catch (e) {
      // Ignore local storage error
    }
  }, [todayKey]);

  const toggleSlot = (id: string) => {
    setCompletedSlots((prev) => {
      const updated = { ...prev, [id]: !prev[id] };
      try {
        localStorage.setItem(`edworld_timetable_${todayKey}`, JSON.stringify(updated));
      } catch (e) {}
      return updated;
    });
  };

  const handleHoursChange = (hours: number) => {
    setDailyHours(hours);
    try {
      localStorage.setItem("edworld_study_hours", hours.toString());
    } catch (e) {}
  };

  const handleResetChecklist = () => {
    setCompletedSlots({});
    try {
      localStorage.removeItem(`edworld_timetable_${todayKey}`);
    } catch (e) {}
  };

  // Derive academic profile signals
  const cgpaRaw = (profile as any)?.cgpa || (user as any)?.cgpa;
  const numericCgpa = typeof cgpaRaw === "number" ? cgpaRaw : parseFloat(cgpaRaw) || 8.0;
  const targetRole = profile?.targetRole || "Software Development Engineer";
  const gradeLevel = profile?.gradeLevel || user?.gradeLevel || "College";

  // Generate slots tailored to CGPA & daily hours
  const generateSlots = (): TimetableSlot[] => {
    const isAdvanced = numericCgpa >= 8.5;
    const isIntermediate = numericCgpa >= 7.0 && numericCgpa < 8.5;

    if (dailyHours <= 2) {
      return [
        {
          id: "slot-1",
          timeOfDay: "Morning",
          duration: "45 mins",
          title: isAdvanced ? "Dynamic Programming Memoization" : "Binary Search & Array Pointers",
          category: "Coding & DSA",
          description: "High-frequency problem solving and asymptotic optimization.",
          actionLabel: "Launch IDE Drill",
          actionHref: "/dsa",
          recommendedFocus: "Pattern Recognition",
        },
        {
          id: "slot-2",
          timeOfDay: "Evening",
          duration: "45 mins",
          title: "Speed Quantitative & Probability Aptitude",
          category: "Aptitude",
          description: "Time & work, permutations, and quick mental math elimination.",
          actionLabel: "Start Daily Drill",
          actionHref: "/daily",
          recommendedFocus: "Accuracy & Speed",
        },
      ];
    }

    if (dailyHours <= 3.5) {
      return [
        {
          id: "slot-1",
          timeOfDay: "Morning",
          duration: "60 mins",
          title: isAdvanced ? "Tree Traversals & Graph BFS/DFS" : "Two-Pointer & Sliding Window Arrays",
          category: "Coding & DSA",
          description: "Practice algorithmic edge cases and state mutation patterns.",
          actionLabel: "Launch IDE Drill",
          actionHref: "/dsa",
          recommendedFocus: "Algorithmic Invariants",
        },
        {
          id: "slot-2",
          timeOfDay: "Afternoon",
          duration: "45 mins",
          title: "Quantitative Aptitude: Speed Distance & Work",
          category: "Aptitude",
          description: "Solve 10 targeted multiple-choice speed problems with timed feedback.",
          actionLabel: "Practice Questions",
          actionHref: "/daily",
          recommendedFocus: "Formula Retention",
        },
        {
          id: "slot-3",
          timeOfDay: "Evening",
          duration: "45 mins",
          title: "AI Voice Mock Interview: STAR Behavioral Drill",
          category: "Interview Drill",
          description: "Structure a 3-minute answer explaining technical trade-offs using STAR.",
          actionLabel: "Start Voice Studio",
          actionHref: "/interviews",
          recommendedFocus: "Clarity & Executive Presence",
        },
      ];
    }

    // > 3.5 hours (e.g. 4.5h)
    return [
      {
        id: "slot-1",
        timeOfDay: "Morning",
        duration: "75 mins",
        title: isAdvanced ? "Advanced Graph DP & Topological Sort" : "Binary Tree Depth & LCA",
        category: "Coding & DSA",
        description: "Deep algorithmic problem solving with full test case passes.",
        actionLabel: "Launch IDE Drill",
        actionHref: "/dsa",
        recommendedFocus: "Optimal Complexity",
      },
      {
        id: "slot-2",
        timeOfDay: "Afternoon",
        duration: "60 mins",
        title: "Relational DB Normalization & Indexing Internals",
        category: "Core Concept",
        description: "B-Tree lookups, ACID guarantees, and composite key optimization.",
        actionLabel: "Read System Guide",
        actionHref: "/learn",
        recommendedFocus: "System Foundations",
      },
      {
        id: "slot-3",
        timeOfDay: "Evening",
        duration: "60 mins",
        title: "Quantitative, Logical & Verbal Aptitude Sprint",
        category: "Aptitude",
        description: "Comprehensive multi-section exam prep matching campus screening rounds.",
        actionLabel: "Take Timed Test",
        actionHref: "/daily",
        recommendedFocus: "Exam Stamina",
      },
    ];
  };

  const slots = generateSlots();
  const completedCount = slots.filter((s) => isMounted && !!completedSlots[s.id]).length;
  const progressPct = slots.length > 0 ? Math.round((completedCount / slots.length) * 100) : 0;

  // Horizontal date scroller days (Mon - Sun)
  const weekDays = [
    { day: "Mon", date: "17", full: "2026-11-17" },
    { day: "Tue", date: "18", full: "2026-11-18" },
    { day: "Wed", date: "19", full: "2026-11-19" },
    { day: "Thu", date: "20", full: "2026-11-20", isToday: true },
    { day: "Fri", date: "21", full: "2026-11-21" },
    { day: "Sat", date: "22", full: "2026-11-22" },
    { day: "Sun", date: "23", full: "2026-11-23" },
  ];

  return (
    <div className="bg-white rounded-3xl border border-slate-100/80 shadow-[0_10px_30px_rgba(80,90,130,0.06)] p-6 sm:p-7 shadow-xl text-slate-900 space-y-6">
      
      {/* Widget Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-slate-100">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl bg-[#EEF0FD] flex items-center justify-center text-[#5C59E8] shrink-0">
              <Calendar className="w-4 h-4 stroke-[2]" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-black text-slate-900 tracking-tight flex items-center gap-2 flex-wrap font-display">
                Personalized Study Timetable
                <span className="text-[10px] font-semibold px-2.5 py-0.5 rounded-full bg-[#EEF0FD] text-[#4338CA] font-mono">
                  Calibrated for {numericCgpa ? `CGPA ${numericCgpa}` : "Target Role"}
                </span>
              </h2>
              <p className="text-xs text-slate-500 font-normal mt-0.5">
                Daily smart curriculum calibrated to your academic metrics, available study hours, and target role.
              </p>
            </div>
          </div>
        </div>

        {/* Study Hours Selector */}
        <div className="flex items-center gap-1.5 self-start sm:self-auto bg-[#F8F9FD] border border-slate-200/80 p-1.5 rounded-2xl shadow-2xs">
          <span className="text-[11px] font-medium text-slate-500 px-2 flex items-center gap-1">
            <Clock className="w-3.5 h-3.5 text-[#5C59E8]" />
            Study Time:
          </span>
          {[2, 3, 4.5].map((hrs) => (
            <button
              key={hrs}
              onClick={() => handleHoursChange(hrs)}
              className={`px-3 py-1 text-xs font-semibold rounded-xl border transition-all cursor-pointer ${
                dailyHours === hrs
                  ? "bg-[#5C59E8] text-white border-transparent shadow-xs font-bold"
                  : "bg-transparent text-slate-500 hover:text-slate-900 border-transparent"
              }`}
            >
              {hrs}h/day
            </button>
          ))}
        </div>
      </div>

      {/* Horizontal Date Scroller (Mon-Sun) matching Reference Design Card 3 */}
      <div className="p-4 rounded-2xl bg-[#F8F9FD] border border-slate-100/90 space-y-3">
        <div className="flex items-center justify-between">
          <div className="text-xs font-bold text-slate-800 flex items-center gap-2">
            <span>Schedule Scroller</span>
            <span className="text-slate-400 font-normal">• November 2026</span>
          </div>
          <span className="text-[11px] font-bold text-[#5C59E8] bg-[#EEF0FD] px-2.5 py-0.5 rounded-full">
            Today: Thursday 20th
          </span>
        </div>

        <div className="grid grid-cols-7 gap-2">
          {weekDays.map((wd, index) => {
            const isSelected = selectedDayIndex === index;
            return (
              <button
                key={wd.day}
                type="button"
                onClick={() => setSelectedDayIndex(index)}
                className={`flex flex-col items-center justify-center py-2.5 px-1 rounded-2xl transition-all cursor-pointer ${
                  isSelected
                    ? "bg-[#5C59E8] text-white shadow-md shadow-indigo-500/20 scale-102 font-bold"
                    : "bg-white hover:bg-slate-100 text-slate-700 border border-slate-200/70"
                }`}
              >
                <span className={`text-[10px] uppercase font-semibold ${isSelected ? "text-indigo-100" : "text-slate-400"}`}>
                  {wd.day}
                </span>
                <span className="text-sm font-black mt-0.5 font-display">
                  {wd.date}
                </span>
                {wd.isToday && !isSelected && (
                  <span className="w-1.5 h-1.5 rounded-full bg-[#5C59E8] mt-1" />
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Progress & Milestone Bar */}
      <div className="p-4 rounded-2xl bg-[#F8F9FD] border border-slate-100/90 shadow-2xs flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="w-full sm:w-auto flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-200/60 flex items-center justify-center font-bold text-xs shrink-0 font-display">
            {progressPct}%
          </div>
          <div>
            <div className="text-xs font-bold text-slate-900 flex items-center gap-2 font-display">
              <span>Today's Task Completion</span>
              <span className="text-[11px] text-slate-500 font-normal">
                ({completedCount} of {slots.length} tasks completed)
              </span>
            </div>
            <p className="text-[11px] text-slate-500 font-normal mt-0.5">
              {progressPct === 100 
                ? "Fantastic job! You have conquered all your scheduled milestones for today." 
                : "Check off each slot as you complete it to build your consistency streak."}
            </p>
          </div>
        </div>

        <div className="w-full sm:w-48 flex items-center gap-2">
          <div className="flex-1 h-2.5 bg-slate-200/80 rounded-full overflow-hidden">
            <div 
              className="h-full bg-gradient-to-r from-emerald-500 to-teal-400 rounded-full transition-all duration-500 ease-out shadow-xs"
              style={{ width: `${progressPct}%` }}
            />
          </div>
          {completedCount > 0 && (
            <button
              onClick={handleResetChecklist}
              title="Reset today's checklist"
              className="text-slate-400 hover:text-slate-700 p-1 cursor-pointer transition-colors"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Time Slots List with Dotted Timeline Guidelines */}
      <div className="space-y-3 relative">
        {slots.map((slot, index) => {
          const isDone = isMounted && !!completedSlots[slot.id];

          return (
            <div key={slot.id} className="relative">
              {/* Dotted guideline connecting slots */}
              {index < slots.length - 1 && (
                <div className="absolute left-6 top-14 bottom-0 w-px border-l-2 border-dotted border-slate-200 z-0 pointer-events-none" />
              )}

              <div
                className={`relative z-10 p-4 rounded-2xl border transition-all duration-150 flex flex-col sm:flex-row sm:items-center justify-between gap-3.5 ${
                  isDone
                    ? "bg-emerald-50/70 border-emerald-200/70 text-slate-900"
                    : "bg-[#F8F9FD] border-slate-100 hover:border-indigo-100 hover:bg-[#EEF0FD]/30 text-slate-900 shadow-2xs"
                }`}
              >
                {/* Checkbox and Details */}
                <div className="flex items-start gap-3.5 min-w-0">
                  <button
                    onClick={() => toggleSlot(slot.id)}
                    className="mt-0.5 text-slate-400 hover:text-[#5C59E8] transition-colors shrink-0 focus:outline-none cursor-pointer"
                    aria-label={`Mark ${slot.title} as ${isDone ? "incomplete" : "complete"}`}
                  >
                    {isDone ? (
                      <CheckCircle2 className="w-5 h-5 text-emerald-600 fill-emerald-100" />
                    ) : (
                      <Circle className="w-5 h-5 text-slate-300 hover:text-[#5C59E8]" />
                    )}
                  </button>

                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-white border border-slate-200/80 text-slate-600 font-mono">
                        {slot.timeOfDay} • {slot.duration}
                      </span>
                      <span className="text-[10px] font-semibold px-2.5 py-0.5 rounded-full bg-[#EEF0FD] text-[#4338CA]">
                        {slot.category}
                      </span>
                      <span className="text-[10px] text-slate-500">
                        Focus: <strong className="text-slate-800 font-semibold">{slot.recommendedFocus}</strong>
                      </span>
                    </div>

                    <h3
                      className={`text-sm font-bold mt-1.5 leading-snug font-display ${
                        isDone ? "line-through text-slate-400" : "text-slate-900"
                      }`}
                    >
                      {slot.title}
                    </h3>
                    <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                      {slot.description}
                    </p>
                  </div>
                </div>

                {/* Action Button */}
                <div className="flex items-center gap-2 shrink-0 self-end sm:self-center pl-8 sm:pl-0">
                  <Link
                    href={slot.actionHref}
                    className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold transition-all shadow-xs ${
                      isDone
                        ? "bg-slate-100 text-slate-600 border border-slate-200 hover:bg-slate-200"
                        : "bg-[#5C59E8] hover:bg-[#4E4BC6] text-white font-bold shadow-indigo-500/20"
                    }`}
                  >
                    <span>{slot.actionLabel}</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Footer Guidance */}
      <div className="pt-4 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500 font-normal gap-2">
        <div className="flex items-center gap-1.5">
          <Sparkles className="w-3.5 h-3.5 text-amber-500" />
          <span>Have questions about your schedule? Open <strong>Myra AI</strong> anytime for custom revisions.</span>
        </div>
        <Link
          href="/practice"
          className="text-[#5C59E8] font-bold hover:underline inline-flex items-center gap-1"
        >
          <span>Explore All Question Banks</span>
          <ArrowRight className="w-3 h-3" />
        </Link>
      </div>

    </div>
  );
}
