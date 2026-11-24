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
      className={`relative overflow-hidden bg-[#EFF6FF] border border-[#BFDBFE] rounded-3xl p-6 text-black shadow-sm flex flex-col justify-between gap-6 ${className}`}
    >
      {/* Top Header & Trophy Illustration */}
      <div className="relative z-10 flex items-start justify-between gap-4">
        <div className="space-y-2">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-100 border border-blue-200 text-xs font-semibold text-[#2563EB]">
            <Sparkles className="w-3.5 h-3.5 text-[#2563EB]" />
            <span>Placement Sprint 2026</span>
          </div>
          <h3 className="text-xl sm:text-2xl font-black font-display tracking-tight text-black leading-tight">
            Level Up Your Placement Readiness!
          </h3>
          <p className="text-xs sm:text-sm text-slate-700 leading-relaxed max-w-sm">
            Study alongside high-performing squads, maintain your 5-task daily streak, and unlock verified placement credentials.
          </p>
        </div>

        {/* Celebratory Trophy Icon Badge */}
        <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-blue-100 border border-blue-200 flex items-center justify-center shrink-0 shadow-sm group">
          <Trophy className="w-7 h-7 sm:w-8 sm:h-8 text-[#2563EB] transition-transform duration-300 group-hover:scale-110" />
        </div>
      </div>

      {/* Motivation Stats / Badges */}
      <div className="relative z-10 grid grid-cols-2 gap-3 pt-1">
        <div className="p-3 rounded-2xl bg-white border border-[#BFDBFE] flex items-center gap-2.5 shadow-2xs">
          <div className="w-8 h-8 rounded-xl bg-blue-50 flex items-center justify-center shrink-0">
            <Flame className="w-4 h-4 text-[#2563EB]" />
          </div>
          <div>
            <div className="text-xs font-black text-black">+250 XP</div>
            <div className="text-[10px] text-slate-600">Daily Bonus Pool</div>
          </div>
        </div>

        <div className="p-3 rounded-2xl bg-white border border-[#BFDBFE] flex items-center gap-2.5 shadow-2xs">
          <div className="w-8 h-8 rounded-xl bg-blue-50 flex items-center justify-center shrink-0">
            <Users className="w-4 h-4 text-[#2563EB]" />
          </div>
          <div>
            <div className="text-xs font-black text-black">Top 5%</div>
            <div className="text-[10px] text-slate-600">Squad Velocity</div>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="relative z-10 flex flex-wrap items-center gap-3 pt-1">
        <Link
          href="/squads"
          className="px-4 py-2.5 rounded-2xl bg-[#2563EB] hover:bg-blue-700 text-white text-xs font-bold flex items-center gap-1.5 transition-all shadow-sm active:scale-95 cursor-pointer"
        >
          <Users className="w-3.5 h-3.5 text-white" />
          <span>Join Study Squads</span>
          <ArrowRight className="w-3.5 h-3.5 text-white" />
        </Link>
        <Link
          href="/daily"
          className="px-4 py-2.5 rounded-2xl bg-[#DBEAFE] hover:bg-blue-200 border border-blue-200 text-[#1E40AF] text-xs font-bold flex items-center gap-1.5 transition-all active:scale-95 cursor-pointer"
        >
          <Flame className="w-3.5 h-3.5 text-[#2563EB]" />
          <span>Daily Challenge</span>
        </Link>
      </div>
    </div>
  );
}
