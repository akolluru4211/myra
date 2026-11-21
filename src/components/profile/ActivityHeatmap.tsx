"use client";

import React, { useState, useMemo } from "react";
import { 
  Flame, 
  Trophy, 
  Calendar, 
  Sparkles, 
  TrendingUp, 
  Filter, 
  GitBranch, 
  Code2, 
  Layers,
  Info
} from "lucide-react";
import { SyncedAccounts, HabitUserStats } from "@/lib/types";

export type ActivityFilter = "all" | "edworld" | "github" | "leetcode";

export interface ActivityDay {
  date: string; // YYYY-MM-DD
  dateObj: Date;
  dayOfWeek: number; // 0 = Sun, 1 = Mon, ..., 6 = Sat
  weekIndex: number;
  monthName: string;
  isMonthStart: boolean;
  edworldCount: number;
  githubCount: number;
  leetcodeCount: number;
  totalCount: number;
}

export interface ActivityHeatmapProps {
  syncedAccounts?: SyncedAccounts;
  userStats?: HabitUserStats | any;
  className?: string;
}

// Periwinkle level color scale definitions
const PERIWINKLE_SCALE = {
  0: "bg-[#F1F3F9] hover:ring-2 hover:ring-slate-300",
  1: "bg-[#C7D2FE] hover:ring-2 hover:ring-indigo-300",
  2: "bg-[#818CF8] hover:ring-2 hover:ring-indigo-400",
  3: "bg-[#6366F1] hover:ring-2 hover:ring-indigo-500",
  4: "bg-[#5C59E8] hover:ring-2 hover:ring-indigo-600",
};

export default function ActivityHeatmap({
  syncedAccounts = {},
  userStats,
  className = ""
}: ActivityHeatmapProps) {
  const [activeFilter, setActiveFilter] = useState<ActivityFilter>("all");
  const [hoveredDay, setHoveredDay] = useState<ActivityDay | null>(null);
  const [selectedDay, setSelectedDay] = useState<ActivityDay | null>(null);

  // Generate 52 weeks (364 days) of deterministic activity ending today
  const { weeks, daysList, statsSummary, monthLabels } = useMemo(() => {
    const today = new Date();
    // Normalize today to midnight
    const end = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    
    // Find the end of current week (Saturday)
    const endDayOfWeek = end.getDay(); // 0 is Sun, 6 is Sat
    const daysUntilSaturday = 6 - endDayOfWeek;
    const gridEnd = new Date(end);
    gridEnd.setDate(end.getDate() + daysUntilSaturday);

    // 52 weeks = 52 * 7 = 364 days
    const totalDays = 52 * 7;
    const gridStart = new Date(gridEnd);
    gridStart.setDate(gridEnd.getDate() - totalDays + 1);

    const ghConnected = Boolean(syncedAccounts?.github?.connected);
    const ghContributions = syncedAccounts?.github?.contributionsThisYear || (ghConnected ? 120 : 0);

    const lcConnected = Boolean(syncedAccounts?.leetcode?.connected);
    const lcSolved = syncedAccounts?.leetcode?.problemsSolved?.total || (lcConnected ? 48 : 0);

    const streakCurrent = userStats?.current_streak || 7;
    const streakLongest = userStats?.longest_streak || Math.max(streakCurrent, 18);
    const totalXp = userStats?.total_xp || 1450;

    const list: ActivityDay[] = [];
    const weeksArr: ActivityDay[][] = [];
    let curWeek: ActivityDay[] = [];
    let lastMonth = -1;

    for (let i = 0; i < totalDays; i++) {
      const d = new Date(gridStart);
      d.setDate(gridStart.getDate() + i);
      
      const year = d.getFullYear();
      const month = String(d.getMonth() + 1).padStart(2, "0");
      const dateNum = String(d.getDate()).padStart(2, "0");
      const dateStr = `${year}-${month}-${dateNum}`;
      const dayOfWeek = d.getDay();
      const weekIndex = Math.floor(i / 7);

      const isMonthStart = d.getMonth() !== lastMonth && d.getDate() <= 7;
      if (d.getMonth() !== lastMonth) {
        lastMonth = d.getMonth();
      }

      const monthName = d.toLocaleDateString("en-US", { month: "short" });

      // Deterministic PRNG based on date string
      const dateHash = (dateStr.split("").reduce((acc, c) => acc + c.charCodeAt(0), 0) * 9301 + 49297) % 233280;
      const pseudoNorm = dateHash / 233280; // 0 to 1

      // Days from end (0 is today or near today)
      const diffTime = end.getTime() - d.getTime();
      const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
      const isFuture = diffDays < 0;

      // EdWorld activity calculation
      let edworld = 0;
      if (!isFuture) {
        // Guarantee current streak up to today has activity
        if (diffDays >= 0 && diffDays < streakCurrent) {
          edworld = 2 + (dateHash % 4); // 2 to 5 items
        } else {
          // Weekday bias for study habit
          const isWeekday = dayOfWeek >= 1 && dayOfWeek <= 5;
          const threshold = isWeekday ? 0.35 : 0.65;
          if (pseudoNorm > threshold) {
            edworld = 1 + (dateHash % 5);
          }
        }
      }

      // GitHub activity calculation
      let github = 0;
      if (ghConnected && !isFuture) {
        // Spread contributions across active coding days
        const ghThreshold = 0.45;
        if (pseudoNorm > ghThreshold) {
          const base = Math.floor((ghContributions / 120) * 2);
          github = Math.max(1, base + (dateHash % 4));
        }
      }

      // LeetCode activity calculation
      let leetcode = 0;
      if (lcConnected && !isFuture) {
        // DSA drills often done on Tuesdays, Thursdays, Saturdays
        const isDsaDay = dayOfWeek === 2 || dayOfWeek === 4 || dayOfWeek === 6;
        if (isDsaDay && pseudoNorm > 0.4) {
          leetcode = 1 + (dateHash % 3);
        } else if (pseudoNorm > 0.75) {
          leetcode = 1;
        }
      }

      const totalCount = edworld + github + leetcode;

      const dayObj: ActivityDay = {
        date: dateStr,
        dateObj: d,
        dayOfWeek,
        weekIndex,
        monthName,
        isMonthStart,
        edworldCount: isFuture ? 0 : edworld,
        githubCount: isFuture ? 0 : github,
        leetcodeCount: isFuture ? 0 : leetcode,
        totalCount: isFuture ? 0 : totalCount
      };

      list.push(dayObj);
      curWeek.push(dayObj);

      if (curWeek.length === 7) {
        weeksArr.push(curWeek);
        curWeek = [];
      }
    }

    if (curWeek.length > 0) {
      weeksArr.push(curWeek);
    }

    // Month labels for column headers
    const labels: { index: number; label: string }[] = [];
    weeksArr.forEach((w, wIdx) => {
      const monthStartDay = w.find(d => d.isMonthStart && d.dayOfWeek <= 3);
      if (monthStartDay) {
        labels.push({ index: wIdx, label: monthStartDay.monthName });
      }
    });

    // Summary calculations based on active filter
    let totalContribs = 0;
    let currentStreak = 0;
    let longestStreak = 0;
    let tempStreak = 0;

    // Iterate backwards from today to calculate streaks
    const pastDays = list.filter(d => {
      const dt = new Date(d.date + "T00:00:00");
      return dt <= end;
    });

    pastDays.forEach(day => {
      let count = day.totalCount;
      if (activeFilter === "edworld") count = day.edworldCount;
      if (activeFilter === "github") count = day.githubCount;
      if (activeFilter === "leetcode") count = day.leetcodeCount;

      totalContribs += count;

      if (count > 0) {
        tempStreak++;
        if (tempStreak > longestStreak) longestStreak = tempStreak;
      } else {
        tempStreak = 0;
      }
    });

    // Calculate current streak walking backward from today
    let walkingCurrent = 0;
    for (let j = pastDays.length - 1; j >= 0; j--) {
      const day = pastDays[j];
      let count = day.totalCount;
      if (activeFilter === "edworld") count = day.edworldCount;
      if (activeFilter === "github") count = day.githubCount;
      if (activeFilter === "leetcode") count = day.leetcodeCount;

      if (count > 0) {
        walkingCurrent++;
      } else {
        // If today has 0 yet, allow yesterday to continue streak
        if (j === pastDays.length - 1) {
          continue;
        }
        break;
      }
    }
    currentStreak = walkingCurrent;

    return {
      weeks: weeksArr,
      daysList: list,
      monthLabels: labels,
      statsSummary: {
        totalContributions: totalContribs,
        currentStreak: Math.max(currentStreak, activeFilter === "all" ? streakCurrent : 0),
        longestStreak: Math.max(longestStreak, activeFilter === "all" ? streakLongest : longestStreak),
      }
    };
  }, [syncedAccounts, userStats, activeFilter]);

  // Determine contribution level (0 to 4)
  const getLevel = (count: number): 0 | 1 | 2 | 3 | 4 => {
    if (count <= 0) return 0;
    if (count <= 2) return 1;
    if (count <= 5) return 2;
    if (count <= 9) return 3;
    return 4;
  };

  const getDayCount = (day: ActivityDay): number => {
    switch (activeFilter) {
      case "edworld":
        return day.edworldCount;
      case "github":
        return day.githubCount;
      case "leetcode":
        return day.leetcodeCount;
      case "all":
      default:
        return day.totalCount;
    }
  };

  // Formatted date string for tooltip/banner
  const formatFriendlyDate = (dateStr: string) => {
    try {
      const d = new Date(dateStr + "T00:00:00");
      return d.toLocaleDateString("en-US", {
        weekday: "short",
        month: "short",
        day: "numeric",
        year: "numeric"
      });
    } catch {
      return dateStr;
    }
  };

  return (
    <div className={`bg-white rounded-3xl border border-slate-100/80 shadow-[0_10px_30px_rgba(80,90,130,0.06)] p-6 sm:p-8 space-y-6 ${className}`}>
      {/* 1. Header & Source Filter Pills */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-[#EEF0FD] text-[#5C59E8] flex items-center justify-center font-bold">
              <Calendar className="w-4 h-4" />
            </div>
            <h2 className="text-base sm:text-lg font-bold text-slate-900 tracking-tight">
              Activity &amp; Consistency Heatmap
            </h2>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Aggregated daily drills, GitHub commits, and LeetCode algorithmic practice across the past 52 weeks.
          </p>
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-1.5 p-1 bg-slate-50 rounded-2xl border border-slate-200/60 self-start sm:self-auto overflow-x-auto max-w-full">
          <button
            type="button"
            onClick={() => setActiveFilter("all")}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
              activeFilter === "all"
                ? "bg-[#5C59E8] text-white shadow-xs"
                : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
            }`}
          >
            All Activity
          </button>
          <button
            type="button"
            onClick={() => setActiveFilter("edworld")}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer flex items-center gap-1 ${
              activeFilter === "edworld"
                ? "bg-[#5C59E8] text-white shadow-xs"
                : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
            }`}
          >
            <Sparkles className="w-3 h-3" />
            <span>EdWorld</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveFilter("github")}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer flex items-center gap-1 ${
              activeFilter === "github"
                ? "bg-[#5C59E8] text-white shadow-xs"
                : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
            }`}
          >
            <GitBranch className="w-3 h-3" />
            <span>GitHub</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveFilter("leetcode")}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer flex items-center gap-1 ${
              activeFilter === "leetcode"
                ? "bg-[#5C59E8] text-white shadow-xs"
                : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
            }`}
          >
            <Code2 className="w-3 h-3" />
            <span>LeetCode</span>
          </button>
        </div>
      </div>

      {/* 2. Metrics Summary Banner */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
        <div className="p-4 rounded-2xl bg-[#F8F9FD] border border-indigo-50/70 flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-white text-[#5C59E8] flex items-center justify-center shrink-0 shadow-xs border border-indigo-100/60">
            <TrendingUp className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">
              Past Year Activity
            </span>
            <span className="text-lg font-bold text-slate-900 tracking-tight">
              {statsSummary.totalContributions.toLocaleString()} <span className="text-xs font-normal text-slate-500">contributions</span>
            </span>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-[#F8F9FD] border border-indigo-50/70 flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-white text-[#F43F5E] flex items-center justify-center shrink-0 shadow-xs border border-rose-100/60">
            <Flame className="w-5 h-5 text-[#F43F5E]" />
          </div>
          <div>
            <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">
              Current Streak
            </span>
            <span className="text-lg font-bold text-slate-900 tracking-tight">
              {statsSummary.currentStreak} <span className="text-xs font-normal text-slate-500">days active</span>
            </span>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-[#F8F9FD] border border-indigo-50/70 flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-white text-amber-500 flex items-center justify-center shrink-0 shadow-xs border border-amber-100/60">
            <Trophy className="w-5 h-5 text-amber-500" />
          </div>
          <div>
            <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">
              Longest Streak
            </span>
            <span className="text-lg font-bold text-slate-900 tracking-tight">
              {statsSummary.longestStreak} <span className="text-xs font-normal text-slate-500">days record</span>
            </span>
          </div>
        </div>
      </div>

      {/* 3. 52-Week Contribution Grid Container */}
      <div className="space-y-2">
        <div className="overflow-x-auto pb-3 pt-1 scrollbar-thin">
          <div className="inline-block min-w-[760px] select-none">
            {/* Month Labels Bar */}
            <div className="flex text-[10px] text-slate-400 font-medium pl-8 mb-1.5 h-4">
              {weeks.map((_, idx) => {
                const labelObj = monthLabels.find(m => m.index === idx);
                return (
                  <div key={idx} className="w-[13px] text-left shrink-0">
                    {labelObj ? (
                      <span className="text-[10px] text-slate-500 font-semibold tracking-tight whitespace-nowrap">
                        {labelObj.label}
                      </span>
                    ) : null}
                  </div>
                );
              })}
            </div>

            {/* Grid Body: 7 Days rows x 52 Weeks columns */}
            <div className="flex gap-1.5">
              {/* Day of Week Labels (Mon, Wed, Fri) */}
              <div className="flex flex-col justify-between text-[9px] font-semibold text-slate-400 pr-1.5 py-0.5 w-6 shrink-0">
                <span className="h-[12px] leading-[12px]">Sun</span>
                <span className="h-[12px] leading-[12px]">Tue</span>
                <span className="h-[12px] leading-[12px]">Thu</span>
                <span className="h-[12px] leading-[12px]">Sat</span>
              </div>

              {/* 52 Columns */}
              <div className="flex gap-1">
                {weeks.map((week, wIdx) => (
                  <div key={wIdx} className="flex flex-col gap-1 shrink-0">
                    {week.map((day, dIdx) => {
                      const count = getDayCount(day);
                      const level = getLevel(count);
                      const colorClass = PERIWINKLE_SCALE[level];
                      const isHovered = hoveredDay?.date === day.date;
                      const isSelected = selectedDay?.date === day.date;

                      return (
                        <div
                          key={day.date}
                          role="button"
                          tabIndex={0}
                          aria-label={`${count} contributions on ${day.date}`}
                          onMouseEnter={() => setHoveredDay(day)}
                          onMouseLeave={() => setHoveredDay(null)}
                          onClick={() => setSelectedDay(day)}
                          onFocus={() => setHoveredDay(day)}
                          onBlur={() => setHoveredDay(null)}
                          className={`w-[11px] h-[11px] sm:w-[12px] sm:h-[12px] rounded-[3px] transition-all cursor-pointer ${colorClass} ${
                            isHovered || isSelected ? "scale-125 z-10 shadow-xs" : ""
                          }`}
                        />
                      );
                    })}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* 4. Legend & Interactive Day Inspector */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-3 border-t border-slate-100 text-xs">
          {/* Active Hover / Selection Feedback */}
          <div className="min-h-[22px] flex items-center gap-2 text-slate-700">
            {(hoveredDay || selectedDay) ? (
              <div className="flex items-center gap-2 flex-wrap animate-in fade-in duration-150">
                <span className="font-bold text-slate-900">
                  {formatFriendlyDate((hoveredDay || selectedDay)!.date)}:
                </span>
                <span className="px-2 py-0.5 rounded-full bg-[#EEF0FD] text-[#5C59E8] font-bold text-[11px]">
                  {getDayCount(hoveredDay || selectedDay!)} {activeFilter === "all" ? "contributions" : `${activeFilter} actions`}
                </span>
                {activeFilter === "all" && (
                  <span className="text-[11px] text-slate-500 font-medium">
                    ({(hoveredDay || selectedDay)!.edworldCount} EdWorld &bull; {(hoveredDay || selectedDay)!.githubCount} GitHub &bull; {(hoveredDay || selectedDay)!.leetcodeCount} LeetCode)
                  </span>
                )}
              </div>
            ) : (
              <span className="text-slate-400 text-xs italic">
                Hover over or tap any day on the grid to inspect details.
              </span>
            )}
          </div>

          {/* Scale Legend */}
          <div className="flex items-center gap-1.5 self-end sm:self-auto text-[11px] text-slate-500">
            <span>Less</span>
            <div className="flex items-center gap-1">
              <span className="w-3 h-3 rounded-[3px] bg-[#F1F3F9] border border-slate-200/40 inline-block" title="0 contributions" />
              <span className="w-3 h-3 rounded-[3px] bg-[#C7D2FE] inline-block" title="1-2 contributions" />
              <span className="w-3 h-3 rounded-[3px] bg-[#818CF8] inline-block" title="3-5 contributions" />
              <span className="w-3 h-3 rounded-[3px] bg-[#6366F1] inline-block" title="6-9 contributions" />
              <span className="w-3 h-3 rounded-[3px] bg-[#5C59E8] inline-block" title="10+ contributions" />
            </div>
            <span>More</span>
          </div>
        </div>
      </div>
    </div>
  );
}
