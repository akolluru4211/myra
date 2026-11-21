"use client";

import React from "react";
import Link from "next/link";
import { Trophy, ArrowRight, Sparkles, Users, Flame } from "lucide-react";

interface PromotionalMotivationCardProps {
  className?: string;
}

export default function PromotionalMotivationCard({ className = "" }: PromotionalMotivationCardProps) {
  return (
    <div
      className={`relative overflow-hidden bg-gradient-to-br from-[#5C59E8] to-[#4338CA] rounded-3xl p-6 text-white shadow-xl flex flex-col justify-between gap-6 ${className}`}
    >
      {/* Background Decorative Circles */}
      <div className="absolute -top-12 -right-12 w-44 h-44 rounded-full bg-white/10 blur-xl pointer-events-none" />
      <div className="absolute -bottom-10 -left-10 w-36 h-36 rounded-full bg-indigo-400/20 blur-lg pointer-events-none" />

      {/* Top Header & Trophy Illustration */}
      <div className="relative z-10 flex items-start justify-between gap-4">
        <div className="space-y-2">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/15 border border-white/20 text-xs font-semibold backdrop-blur-xs">
            <Sparkles className="w-3.5 h-3.5 text-amber-300 fill-amber-300" />
            <span>Placement Sprint 2026</span>
          </div>
          <h3 className="text-xl sm:text-2xl font-black font-display tracking-tight text-white leading-tight">
            Level Up Your Placement Readiness!
          </h3>
          <p className="text-xs sm:text-sm text-indigo-100/90 leading-relaxed max-w-sm">
            Study alongside high-performing squads, maintain your 5-task daily streak, and unlock verified placement credentials.
          </p>
        </div>

        {/* Celebratory Trophy Icon Badge */}
        <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-white/15 border border-white/20 backdrop-blur-md flex items-center justify-center shrink-0 shadow-inner group">
          <Trophy className="w-7 h-7 sm:w-8 sm:h-8 text-amber-300 fill-amber-300 drop-shadow-md transition-transform duration-300 group-hover:scale-110" />
        </div>
      </div>

      {/* Motivation Stats / Badges */}
      <div className="relative z-10 grid grid-cols-2 gap-3 pt-1">
        <div className="p-3 rounded-2xl bg-white/10 border border-white/10 backdrop-blur-xs flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-white/20 flex items-center justify-center shrink-0">
            <Flame className="w-4 h-4 text-rose-300 fill-rose-300" />
          </div>
          <div>
            <div className="text-xs font-black text-white">+250 XP</div>
            <div className="text-[10px] text-indigo-200">Daily Bonus Pool</div>
          </div>
        </div>

        <div className="p-3 rounded-2xl bg-white/10 border border-white/10 backdrop-blur-xs flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-white/20 flex items-center justify-center shrink-0">
            <Users className="w-4 h-4 text-emerald-300" />
          </div>
          <div>
            <div className="text-xs font-black text-white">Top 5%</div>
            <div className="text-[10px] text-indigo-200">Squad Velocity</div>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="relative z-10 flex flex-wrap items-center gap-3 pt-1">
        <Link
          href="/squads"
          className="px-4 py-2.5 rounded-2xl bg-white hover:bg-slate-100 text-[#4338CA] text-xs font-bold flex items-center gap-1.5 transition-all shadow-md active:scale-95 cursor-pointer"
        >
          <Users className="w-3.5 h-3.5 text-[#4338CA]" />
          <span>Join Study Squads</span>
          <ArrowRight className="w-3.5 h-3.5 text-[#4338CA]" />
        </Link>
        <Link
          href="/daily"
          className="px-4 py-2.5 rounded-2xl bg-white/15 hover:bg-white/25 border border-white/20 text-white text-xs font-bold flex items-center gap-1.5 transition-all active:scale-95 cursor-pointer backdrop-blur-xs"
        >
          <Flame className="w-3.5 h-3.5 text-rose-300 fill-rose-300" />
          <span>Daily Challenge</span>
        </Link>
      </div>
    </div>
  );
}
