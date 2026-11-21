"use client";

import React from "react";
import Link from "next/link";
import Image from "next/image";
import { Sparkles } from "lucide-react";

interface FigmaAuthLayoutProps {
  children: React.ReactNode;
  title: string;
  subtitle: string;
  activeTab: "login" | "signup" | "reset";
}

export default function FigmaAuthLayout({
  children,
  title,
  subtitle,
  activeTab,
}: FigmaAuthLayoutProps) {
  return (
    <div className="min-h-screen w-full text-slate-100 flex flex-col justify-center py-8 sm:py-14 px-4 sm:px-6 lg:px-8 font-sans selection:bg-[#4F46E5] selection:text-white relative">
      
      {/* Centered 3D Spatial Tactile Auth Card */}
      <div className="w-full max-w-xl mx-auto tactile-chassis bg-[#0C101A]/95 backdrop-blur-2xl border border-white/10 rounded-3xl shadow-[0_25px_60px_rgba(0,0,0,0.85)] overflow-hidden animate-in fade-in duration-300 text-white">
        
        {/* Top Mini Brand Navigation */}
        <div className="px-6 sm:px-8 pt-6 pb-4 flex items-center justify-between border-b border-white/10 bg-[#0F1422]/80 backdrop-blur-xl">
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="relative w-9 h-9 rounded-xl metallic-icon-badge metallic-indigo !p-1 group-hover:scale-105 transition-transform shrink-0">
              <Image
                src="/images/edworld-mark.png"
                alt="EdWorld Co. Mark"
                width={32}
                height={32}
                className="w-full h-full object-contain rounded-lg"
              />
            </div>
            <div className="flex flex-col">
              <span className="font-display font-black text-base sm:text-lg text-white leading-none">
                EdWorld <span className="text-emerald-400">Co.</span>
              </span>
              <span className="font-semibold text-[10.5px] uppercase tracking-wider text-slate-400 mt-1 flex items-center gap-1.5">
                <span className="text-slate-300">Learn</span>
                <span className="text-emerald-400 font-black">•</span>
                <span className="text-slate-300">Grow</span>
                <span className="text-cyan-400 font-black">•</span>
                <span className="text-slate-300">Build</span>
              </span>
            </div>
          </Link>

          {/* Quick Switcher Pills */}
          <div className="flex items-center gap-1.5 p-1 rounded-2xl bg-black/50 border border-white/10 text-xs font-semibold shadow-inner">
            <Link
              href="/auth/login"
              className={`px-4 py-1.5 rounded-xl transition-all cursor-pointer ${
                activeTab === "login"
                  ? "bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-bold shadow-md shadow-indigo-500/25"
                  : "bg-transparent text-slate-400 hover:text-white"
              }`}
            >
              Sign In
            </Link>
            <Link
              href="/auth/signup"
              className={`px-4 py-1.5 rounded-xl transition-all cursor-pointer ${
                activeTab === "signup"
                  ? "bg-gradient-to-r from-emerald-600 to-teal-600 text-white font-bold shadow-md shadow-emerald-500/25"
                  : "bg-transparent text-slate-400 hover:text-white"
              }`}
            >
              Start Free
            </Link>
          </div>
        </div>

        {/* Card Body: Form Canvas */}
        <div className="p-6 sm:p-10 space-y-6">
          
          {/* Form Header */}
          <div className="space-y-1.5 text-center sm:text-left">
            <h1 className="font-display font-black text-2xl sm:text-3xl text-white tracking-tight">
              {title}
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed font-normal">
              {subtitle}
            </p>
          </div>

          {/* Form Slot */}
          <div className="w-full">
            {children}
          </div>

        </div>

      </div>

    </div>
  );
}
