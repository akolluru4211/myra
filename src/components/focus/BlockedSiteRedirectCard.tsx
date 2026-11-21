"use client";

import React from "react";
import Link from "next/link";
import { 
  ShieldAlert, 
  Lock, 
  Clock, 
  ArrowRight, 
  Sparkles, 
  CheckCircle2, 
  BookOpen 
} from "lucide-react";

interface BlockedSiteRedirectCardProps {
  blockedDomain: string;
  remainingSeconds: number;
  subjectName?: string;
  subjectHref?: string;
  onClearQuery: () => void;
}

export default function BlockedSiteRedirectCard({
  blockedDomain,
  remainingSeconds,
  subjectName = "Active Learning Block",
  subjectHref = "/dsa",
  onClearQuery,
}: BlockedSiteRedirectCardProps) {
  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m}:${s < 10 ? "0" : ""}${s}`;
  };

  return (
    <div className="liquid-glass-card p-6 sm:p-10 text-center max-w-xl mx-auto space-y-6">
      
      {/* Icon Capsule */}
      <div className="w-14 h-14 rounded-2xl bg-rose-500/15 border border-rose-500/30 text-rose-600 flex items-center justify-center mx-auto shadow-xs">
        <Lock className="w-7 h-7" />
      </div>

      <div className="space-y-2">
        <div className="flex justify-center">
          <span className="liquid-pill px-3 py-1 text-xs font-semibold bg-rose-500/15 border-rose-500/30 text-rose-800">
            Access Restricted
          </span>
        </div>

        <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
          {blockedDomain} is Locked!
        </h2>

        <p className="text-xs sm:text-sm text-slate-600 leading-relaxed max-w-md mx-auto">
          You set an active study timer on EdWorld. Social media and entertainment apps are blocked until your learning session is complete.
        </p>
      </div>

      {/* Countdown Card */}
      <div className="p-4 rounded-xl liquid-glass-card bg-white/70 border-white/80 inline-flex items-center gap-4 text-xs font-mono text-slate-900">
        <div className="flex items-center gap-2">
          <Clock className="w-4 h-4 text-rose-600 animate-pulse" />
          <span className="text-slate-500">Timer Remaining:</span>
        </div>
        <span className="liquid-pill text-base font-bold px-3 py-1 bg-white/80 border-slate-200/60 shadow-xs">
          {remainingSeconds > 0 ? formatTime(remainingSeconds) : "Session Finishing..."}
        </span>
      </div>

      {/* Action Buttons */}
      <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
        <Link
          href={subjectHref}
          onClick={onClearQuery}
          className="liquid-btn-primary w-full sm:w-auto px-6 py-3 text-xs sm:text-sm font-bold inline-flex items-center justify-center gap-2 cursor-pointer shadow-md"
        >
          <BookOpen className="w-4 h-4 text-amber-300" />
          <span>Resume Study Target ({subjectName})</span>
          <ArrowRight className="w-4 h-4 text-white" />
        </Link>

        <button
          onClick={onClearQuery}
          className="liquid-btn-secondary px-4 py-2 text-xs font-semibold cursor-pointer"
        >
          Dismiss Alert
        </button>
      </div>

    </div>
  );
}
