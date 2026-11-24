"use client";

import React from "react";
import Link from "next/link";
import Image from "next/image";

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
    <div className="min-h-screen w-full bg-white text-black flex flex-col justify-center py-8 sm:py-12 px-4 sm:px-6 lg:px-8 font-sans selection:bg-[#2563EB] selection:text-white relative">
      
      {/* Centered Structured Student Dashboard-Themed Card */}
      <div className="w-full max-w-xl mx-auto bg-white border border-blue-200/90 rounded-3xl shadow-[0_10px_35px_rgba(80,90,130,0.08)] overflow-hidden animate-in fade-in duration-200">
        
        {/* Top Header / Branding & Toggle Bar */}
        <div className="px-6 sm:px-8 pt-6 pb-4 flex items-center justify-between border-b border-blue-100 bg-[#EFF6FF]">
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="relative w-8 h-8 rounded-xl overflow-hidden bg-black flex items-center justify-center shadow-xs border border-slate-300 group-hover:scale-105 transition-transform shrink-0">
              <Image
                src="/images/edworld-mark.png"
                alt="Edworld Logo"
                width={32}
                height={32}
                className="w-full h-full object-cover"
                priority
              />
            </div>
            <div className="flex flex-col">
              <div className="flex items-center gap-1.5 leading-none">
                <span className="font-extrabold text-base text-black font-display">
                  Edworld
                </span>
                <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded-md bg-white border border-blue-200 text-slate-700">
                  Co.
                </span>
              </div>
              <span className="font-semibold text-[10px] uppercase tracking-wider text-slate-500 mt-1">
                Student Career OS
              </span>
            </div>
          </Link>

          {/* Quick Switcher Pills */}
          <div className="flex items-center gap-1 p-1 rounded-2xl bg-slate-200/70 border border-blue-200 text-xs font-semibold">
            <Link
              href="/auth/login"
              className={`px-3.5 py-1.5 rounded-xl transition-all cursor-pointer ${
                activeTab === "login"
                  ? "bg-white text-black font-bold shadow-xs border border-blue-200/60"
                  : "bg-transparent text-slate-600 hover:text-black"
              }`}
            >
              Sign In
            </Link>
            <Link
              href="/auth/signup"
              className={`px-3.5 py-1.5 rounded-xl transition-all cursor-pointer ${
                activeTab === "signup"
                  ? "bg-[#2563EB] text-white font-bold shadow-xs"
                  : "bg-transparent text-slate-600 hover:text-black"
              }`}
            >
              Sign Up
            </Link>
          </div>
        </div>

        {/* Card Body: Form Canvas */}
        <div className="p-6 sm:p-8 space-y-6">
          
          {/* Form Header */}
          <div className="space-y-1.5 text-center sm:text-left">
            <h1 className="font-display font-black text-2xl sm:text-3xl text-black tracking-tight">
              {title}
            </h1>
            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed font-normal">
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
