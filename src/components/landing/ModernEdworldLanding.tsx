"use client";

import React, { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { 
  ArrowRight, 
  Sparkles, 
  Users, 
  Briefcase, 
  FileText, 
  Video, 
  Code2, 
  CheckCircle2, 
  ShieldCheck, 
  Zap, 
  Terminal, 
  Globe, 
  Award, 
  ChevronRight, 
  ChevronDown, 
  Check, 
  ExternalLink, 
  Play, 
  FolderGit2, 
  GraduationCap, 
  Building2, 
  Clock, 
  Layers, 
  Share2, 
  Send, 
  Mail, 
  QrCode, 
  MessageSquare, 
  Menu, 
  X,
  Compass,
  TrendingUp,
  Cpu,
  BookmarkCheck,
  Github,
  Linkedin,
  Youtube,
  Instagram
} from "lucide-react";
import { QrCodeView } from "@/components/ui/QrCodeView";

interface ModernEdworldLandingProps {
  onViewComingSoon?: () => void;
}

export default function ModernEdworldLanding({ onViewComingSoon }: ModernEdworldLandingProps) {
  // Mobile navigation drawer state
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Interactive Product Preview Frame active tab
  const [activePreviewTab, setActivePreviewTab] = useState<"resume" | "interview" | "workspace" | "portfolio">("resume");

  // Interactive Resume Scanner Demo State
  const [resumeMode, setResumeMode] = useState<"raw" | "optimized">("optimized");

  // Newsletter Subscription state
  const [newsletterEmail, setNewsletterEmail] = useState("");
  const [subscribeStatus, setSubscribeStatus] = useState<"idle" | "loading" | "success">("idle");

  const handleNewsletterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newsletterEmail || !newsletterEmail.includes("@")) return;
    setSubscribeStatus("loading");
    setTimeout(() => {
      setSubscribeStatus("success");
      setNewsletterEmail("");
    }, 600);
  };

  const handleOpenMyra = (initialPrompt?: string) => {
    if (typeof window !== "undefined") {
      window.dispatchEvent(
        new CustomEvent("open-myra-copilot", {
          detail: initialPrompt ? { prompt: initialPrompt } : undefined,
        })
      );
    }
  };

  return (
    <div className="relative min-h-screen w-full bg-[#080B11] text-slate-100 selection:bg-emerald-500 selection:text-slate-950 font-sans overflow-x-hidden">
      
      {/* ========================================================================= */}
      {/* 1. STICKY TOP NAVBAR                                                      */}
      {/* ========================================================================= */}
      <header className="sticky top-0 z-50 bg-[#080B11]/90 backdrop-blur-xl border-b border-white/10 transition-all">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 sm:h-18 flex items-center justify-between gap-4">
          
          {/* Brand Logo & Wordmark */}
          <Link href="/" className="flex items-center gap-2.5 group shrink-0">
            <div className="w-8 h-8 rounded-xl overflow-hidden border border-white/20 bg-black flex items-center justify-center p-0.5 shadow-md group-hover:border-emerald-500/50 transition-colors">
              <Image
                src="/images/edworld-logo.png"
                alt="Edworld Co. Logo"
                width={32}
                height={32}
                className="w-full h-full object-cover rounded-lg"
              />
            </div>
            <div className="flex items-center gap-1.5 leading-none">
              <span className="font-extrabold text-base sm:text-lg tracking-tight font-display text-white">
                Edworld
              </span>
              <span className="text-[10px] font-black px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 font-display">
                Co.
              </span>
            </div>
          </Link>

          {/* Desktop Navigation Links */}
          <nav className="hidden md:flex items-center gap-8 text-xs font-semibold text-slate-300">
            <a href="#features" className="hover:text-emerald-400 transition-colors">
              Features
            </a>
            <a href="#workspace" className="hover:text-emerald-400 transition-colors">
              Workspace
            </a>
            <a href="#portfolios" className="hover:text-emerald-400 transition-colors">
              Portfolios
            </a>
            <a href="#ambassadors" className="hover:text-emerald-400 transition-colors">
              Ambassadors
            </a>
            <Link href="/pricing" className="hover:text-emerald-400 transition-colors">
              Pricing
            </Link>
          </nav>

          {/* Right Action Buttons */}
          <div className="flex items-center gap-3">
            <Link
              href="/login"
              className="hidden sm:inline-flex px-4 py-2 rounded-xl text-xs font-bold text-slate-300 hover:text-white transition-colors"
            >
              Sign In
            </Link>

            <Link
              href="/signup"
              className="px-4 sm:px-5 py-2 sm:py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-extrabold text-xs tracking-wide transition-all shadow-[0_0_20px_rgba(16,185,129,0.3)] hover:shadow-[0_0_25px_rgba(16,185,129,0.45)] hover:scale-[1.02] active:scale-[0.98] cursor-pointer"
            >
              Get Started
            </Link>

            {/* Mobile Menu Button */}
            <button
              type="button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-xl bg-white/5 border border-white/10 text-slate-300 hover:text-white md:hidden cursor-pointer"
              aria-label="Toggle navigation menu"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Mobile Navigation Drawer */}
        {mobileMenuOpen && (
          <div className="md:hidden bg-[#0C101A] border-b border-white/10 px-4 py-5 space-y-3 animate-in slide-in-from-top-3">
            <nav className="flex flex-col space-y-2.5 text-sm font-semibold text-slate-300">
              <a
                href="#features"
                onClick={() => setMobileMenuOpen(false)}
                className="py-2 px-3 rounded-lg hover:bg-white/5 hover:text-emerald-400"
              >
                Features
              </a>
              <a
                href="#workspace"
                onClick={() => setMobileMenuOpen(false)}
                className="py-2 px-3 rounded-lg hover:bg-white/5 hover:text-emerald-400"
              >
                Workspace
              </a>
              <a
                href="#portfolios"
                onClick={() => setMobileMenuOpen(false)}
                className="py-2 px-3 rounded-lg hover:bg-white/5 hover:text-emerald-400"
              >
                Portfolios
              </a>
              <a
                href="#ambassadors"
                onClick={() => setMobileMenuOpen(false)}
                className="py-2 px-3 rounded-lg hover:bg-white/5 hover:text-emerald-400"
              >
                Ambassadors
              </a>
              <Link
                href="/pricing"
                onClick={() => setMobileMenuOpen(false)}
                className="py-2 px-3 rounded-lg hover:bg-white/5 hover:text-emerald-400"
              >
                Pricing
              </Link>
            </nav>
            <div className="pt-3 border-t border-white/10 flex flex-col gap-2">
              <Link
                href="/login"
                onClick={() => setMobileMenuOpen(false)}
                className="w-full py-2.5 rounded-xl border border-white/15 text-white text-center font-bold text-xs"
              >
                Sign In
              </Link>
              <Link
                href="/signup"
                onClick={() => setMobileMenuOpen(false)}
                className="w-full py-2.5 rounded-xl bg-emerald-500 text-slate-950 text-center font-extrabold text-xs shadow-md"
              >
                Get Started Free
              </Link>
            </div>
          </div>
        )}
      </header>

      {/* ========================================================================= */}
      {/* 2. BOLD HERO SECTION                                                      */}
      {/* ========================================================================= */}
      <section className="relative pt-16 sm:pt-24 pb-16 sm:pb-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto flex flex-col items-center text-center">
        
        {/* Subtle Ambient Radial Glow */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[600px] h-[350px] bg-emerald-500/10 rounded-full blur-[120px] pointer-events-none" />

        {/* Status Pill Badge */}
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-950/60 border border-emerald-500/30 text-emerald-400 text-xs font-semibold mb-6 shadow-sm backdrop-blur-md">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span>Career Intelligence &amp; Corporate Placement Ecosystem</span>
        </div>

        {/* Hero Headline */}
        <h1 className="text-4xl sm:text-6xl lg:text-7xl font-black font-display tracking-tight text-white leading-[1.08] max-w-5xl text-balance">
          Bridging Academic Learning and Corporate Placement.
        </h1>

        {/* Subtitle with Emerald Gradient */}
        <p className="mt-5 sm:mt-6 text-base sm:text-xl text-slate-300 max-w-3xl leading-relaxed font-normal">
          The unified career intelligence suite for engineering students. Instant ATS resume scoring, real-time interactive mock interviews, and verifiable proof-of-work project portfolios.
        </p>

        {/* Action Buttons */}
        <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4 w-full sm:w-auto">
          <Link
            href="/signup"
            className="w-full sm:w-auto px-8 py-4 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-sm tracking-wide transition-all shadow-[0_0_30px_rgba(16,185,129,0.35)] hover:shadow-[0_0_40px_rgba(16,185,129,0.5)] hover:-translate-y-0.5 active:translate-y-0 flex items-center justify-center gap-2 group cursor-pointer"
          >
            <span>Launch Career Workspace</span>
            <ArrowRight className="w-4 h-4 text-slate-950 group-hover:translate-x-1 transition-transform" />
          </Link>

          <a
            href="#features"
            className="w-full sm:w-auto px-7 py-4 rounded-xl bg-[#0F1422] hover:bg-white/10 text-white font-bold text-sm border border-white/10 transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            <span>Explore Core Modules</span>
            <ChevronDown className="w-4 h-4 text-slate-400" />
          </a>
        </div>

        {/* Micro Trust Indicators */}
        <div className="mt-8 pt-6 border-t border-white/10 flex flex-wrap items-center justify-center gap-6 sm:gap-10 text-xs text-slate-400 font-medium">
          <div className="flex items-center gap-1.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span>Instant ATS Scoring</span>
          </div>
          <div className="flex items-center gap-1.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span>Spoken STAR Feedback</span>
          </div>
          <div className="flex items-center gap-1.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span>Verified Code Portfolios</span>
          </div>
          <div className="flex items-center gap-1.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span>100% Free for Students</span>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* INTERACTIVE PRODUCT PREVIEW FRAME                                         */}
        {/* ========================================================================= */}
        <div className="w-full max-w-5xl mt-12 sm:mt-16 rounded-3xl bg-[#0C101A] border border-white/15 shadow-[0_30px_90px_rgba(0,0,0,0.9)] overflow-hidden text-left relative">
          
          {/* macOS Browser Chrome Bar */}
          <div className="px-4 py-3 bg-[#080B11] border-b border-white/10 flex items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-[#EF4444]/80 inline-block" />
              <span className="w-3 h-3 rounded-full bg-[#F59E0B]/80 inline-block" />
              <span className="w-3 h-3 rounded-full bg-[#10B981]/80 inline-block" />
            </div>

            <div className="px-4 py-1 rounded-full bg-white/5 border border-white/10 font-mono text-[11px] text-slate-400 flex items-center gap-1.5">
              <span className="text-emerald-400">https://</span>
              <span>edworld.co.in/workspace</span>
            </div>

            <div className="flex items-center gap-1.5 text-[11px] font-mono text-emerald-400 font-bold">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>LIVE DEMO</span>
            </div>
          </div>

          {/* Interactive Tab Switcher */}
          <div className="flex items-center gap-1 px-4 py-2 bg-[#0A0D16] border-b border-white/10 overflow-x-auto no-scrollbar">
            {[
              { id: "resume", label: "ATS Resume Analyzer", icon: FileText },
              { id: "interview", label: "Interactive Mock Studio", icon: Video },
              { id: "workspace", label: "Coding IDE Workspace", icon: Terminal },
              { id: "portfolio", label: "Proof-of-Work Portfolio", icon: FolderGit2 },
            ].map((tab) => {
              const Icon = tab.icon;
              const isActive = activePreviewTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActivePreviewTab(tab.id as any)}
                  className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
                    isActive
                      ? "bg-emerald-500/15 text-emerald-300 border border-emerald-500/30"
                      : "text-slate-400 hover:text-white hover:bg-white/5"
                  }`}
                >
                  <Icon className={`w-3.5 h-3.5 ${isActive ? "text-emerald-400" : "text-slate-400"}`} />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>

          {/* Interactive Frame Body */}
          <div className="p-5 sm:p-7 min-h-[340px] flex flex-col justify-center bg-[#0C101A]">
            
            {/* TAB 1: ATS RESUME OPTIMIZER */}
            {activePreviewTab === "resume" && (
              <div className="space-y-5 animate-in fade-in duration-200">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <span className="text-[10px] font-mono uppercase tracking-wider text-emerald-400 font-bold">
                      Instant Recruiter Scoring
                    </span>
                    <h3 className="text-base sm:text-lg font-bold text-white font-display">
                      ATS Bullet &amp; Quantified Metric Analyzer
                    </h3>
                  </div>

                  {/* Toggle Raw vs Optimized */}
                  <div className="flex items-center gap-1.5 p-1 rounded-xl bg-[#080B11] border border-white/10 self-start sm:self-auto">
                    <button
                      type="button"
                      onClick={() => setResumeMode("raw")}
                      className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                        resumeMode === "raw"
                          ? "bg-rose-500/20 text-rose-300 border border-rose-500/30"
                          : "text-slate-400 hover:text-white"
                      }`}
                    >
                      Raw Bullet (52%)
                    </button>
                    <button
                      type="button"
                      onClick={() => setResumeMode("optimized")}
                      className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                        resumeMode === "optimized"
                          ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
                          : "text-slate-400 hover:text-white"
                      }`}
                    >
                      Optimized Bullet (98%)
                    </button>
                  </div>
                </div>

                {/* Score & Metric Comparison Box */}
                <div className="p-4 sm:p-5 rounded-2xl bg-[#080B11] border border-white/10 space-y-3">
                  <div className="flex items-center justify-between text-xs font-mono">
                    <span className="text-slate-400">Target Role: Software Engineer (Backend / Cloud)</span>
                    <span className={resumeMode === "optimized" ? "text-emerald-400 font-bold" : "text-rose-400 font-bold"}>
                      Score: {resumeMode === "optimized" ? "98 / 100 (Recruiter Ready)" : "52 / 100 (Needs Metric)"}
                    </span>
                  </div>

                  <div className="p-3.5 rounded-xl bg-[#0F1422] border border-white/10 font-sans text-xs sm:text-sm text-slate-200 leading-relaxed">
                    {resumeMode === "optimized" ? (
                      <span>
                        <strong className="text-emerald-300 font-bold">Engineered distributed payment pipeline</strong>, reducing checkout latency by <strong className="text-emerald-300 font-bold">42%</strong> across 25,000 TPS by implementing multi-tier Redis caching with exponential backoff.
                      </span>
                    ) : (
                      <span>
                        Worked on payment gateway APIs and reduced loading times with caching.
                      </span>
                    )}
                  </div>

                  <div className="flex flex-wrap items-center gap-2 pt-1 text-[11px]">
                    {resumeMode === "optimized" ? (
                      <>
                        <span className="px-2 py-0.5 rounded-md bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 font-mono">
                          ✓ Action Verb: Engineered
                        </span>
                        <span className="px-2 py-0.5 rounded-md bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 font-mono">
                          ✓ Metric: -42% Latency
                        </span>
                        <span className="px-2 py-0.5 rounded-md bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 font-mono">
                          ✓ Enterprise Scale: 25k TPS
                        </span>
                      </>
                    ) : (
                      <>
                        <span className="px-2 py-0.5 rounded-md bg-rose-500/10 border border-rose-500/30 text-rose-300 font-mono">
                          ✗ Passive verb ('worked')
                        </span>
                        <span className="px-2 py-0.5 rounded-md bg-rose-500/10 border border-rose-500/30 text-rose-300 font-mono">
                          ✗ Missing latency percentage
                        </span>
                      </>
                    )}
                  </div>
                </div>

                <div className="flex items-center justify-between text-xs text-slate-400 pt-1">
                  <span>Single-column Harvard / Stanford layout templates</span>
                  <Link href="/resumes" className="text-emerald-400 hover:text-emerald-300 font-bold flex items-center gap-1">
                    <span>Open Resume Studio</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
            )}

            {/* TAB 2: INTERACTIVE MOCK INTERVIEW HUD */}
            {activePreviewTab === "interview" && (
              <div className="space-y-4 animate-in fade-in duration-200">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <span className="text-[10px] font-mono uppercase tracking-wider text-emerald-400 font-bold">
                      Real-Time STAR Method Evaluation
                    </span>
                    <h3 className="text-base sm:text-lg font-bold text-white font-display">
                      Interactive Mock Interview Simulator
                    </h3>
                  </div>
                  <span className="px-3 py-1 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs font-mono font-bold self-start sm:self-auto">
                    Live Score: 94/100
                  </span>
                </div>

                <div className="p-4 rounded-2xl bg-[#080B11] border border-white/10 space-y-3">
                  <div className="text-xs text-slate-400">
                    <span className="font-bold text-white font-mono">Prompt:</span> &ldquo;How do you mitigate a Redis cache stampede under peak concurrent traffic spikes?&rdquo;
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2">
                    <div className="p-2.5 rounded-xl bg-[#0F1422] border border-emerald-500/30 text-left">
                      <span className="text-[10px] font-mono text-slate-400 uppercase block">Situation</span>
                      <span className="text-xs font-bold text-emerald-300">✓ Context Stated</span>
                    </div>
                    <div className="p-2.5 rounded-xl bg-[#0F1422] border border-emerald-500/30 text-left">
                      <span className="text-[10px] font-mono text-slate-400 uppercase block">Task</span>
                      <span className="text-xs font-bold text-emerald-300">✓ Bottleneck Isolated</span>
                    </div>
                    <div className="p-2.5 rounded-xl bg-[#0F1422] border border-emerald-500/30 text-left">
                      <span className="text-[10px] font-mono text-slate-400 uppercase block">Action</span>
                      <span className="text-xs font-bold text-emerald-300">✓ Mutex Lock Used</span>
                    </div>
                    <div className="p-2.5 rounded-xl bg-[#0F1422] border border-emerald-500/30 text-left">
                      <span className="text-[10px] font-mono text-slate-400 uppercase block">Result</span>
                      <span className="text-xs font-bold text-emerald-300">✓ SLA: Sub-2ms</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-xs pt-1 border-t border-white/10 font-mono">
                    <span className="text-slate-400">Cadence: 135 WPM (Optimal)</span>
                    <span className="text-emerald-400 font-bold">Filler Words: 0 Detected</span>
                  </div>
                </div>

                <div className="flex items-center justify-between text-xs text-slate-400 pt-1">
                  <span>1,000+ Curated common &amp; sector-specific questions</span>
                  <Link href="/interviews" className="text-emerald-400 hover:text-emerald-300 font-bold flex items-center gap-1">
                    <span>Start Mock Drill</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
            )}

            {/* TAB 3: CODING WORKSPACE IDE */}
            {activePreviewTab === "workspace" && (
              <div className="space-y-4 animate-in fade-in duration-200 font-mono text-xs">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-400">
                    Browser-Based Execution Sandbox
                  </span>
                  <span className="text-emerald-400 font-bold">Execution: 12ms</span>
                </div>

                <div className="p-4 rounded-2xl bg-[#080B11] border border-white/10 text-slate-300 space-y-2 overflow-x-auto leading-relaxed">
                  <div className="text-slate-500">// LRU Cache — High Concurrency Implementation</div>
                  <div><span className="text-purple-400">class</span> <span className="text-yellow-300">LRUCache</span> {'{'}</div>
                  <div className="pl-4"><span className="text-purple-400">private</span> map = <span className="text-blue-400">new</span> Map&lt;<span className="text-cyan-300">number</span>, <span className="text-cyan-300">number</span>&gt;();</div>
                  <div className="pl-4"><span className="text-purple-400">constructor</span>(<span className="text-purple-400">private</span> capacity: <span className="text-cyan-300">number</span>) {'{}'}</div>
                  <div className="pl-4"><span className="text-purple-400">get</span>(key: <span className="text-cyan-300">number</span>): <span className="text-cyan-300">number</span> {'{'} ... {'}'}</div>
                  <div>{'}'}</div>
                  <div className="pt-2 text-emerald-400 font-bold">
                    [PASS] 24/24 Test Cases Passed • Memory: 42.1 MB (Top 96.4%)
                  </div>
                </div>

                <div className="flex items-center justify-between text-xs text-slate-400 pt-1">
                  <span>Structured problem tracks &amp; step-through visualizers</span>
                  <Link href="/dsa" className="text-emerald-400 hover:text-emerald-300 font-bold flex items-center gap-1">
                    <span>Open DSA Studio</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
            )}

            {/* TAB 4: EVIDENCE PORTFOLIO CARD */}
            {activePreviewTab === "portfolio" && (
              <div className="space-y-4 animate-in fade-in duration-200">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-mono uppercase tracking-wider text-emerald-400 font-bold">
                    Verifiable Proof-Of-Work
                  </span>
                  <span className="font-mono text-xs text-cyan-300 font-bold">
                    edworld.co.in/adarsh_2026
                  </span>
                </div>

                <div className="p-4 rounded-2xl bg-[#080B11] border border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex items-center gap-3.5">
                    <div className="p-1 rounded-xl bg-white shrink-0">
                      <QrCodeView value="https://edworld.co.in/adarsh_2026" size={54} fgColor="#0A0A0A" bgColor="#FFFFFF" includeMargin={false} />
                    </div>
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-1.5">
                        <h4 className="font-bold text-white text-sm font-display">Adarsh Kolluru</h4>
                        <span className="px-2 py-0.5 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-[10px] font-bold">
                          Verified
                        </span>
                      </div>
                      <p className="text-xs text-slate-400">Full Stack Software Engineer &amp; Platform Builder</p>
                      <p className="text-[11px] font-mono text-slate-500">2 Verified Repos • 98/100 STAR Rating</p>
                    </div>
                  </div>

                  <Link
                    href="/adarsh_2026"
                    target="_blank"
                    className="px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs flex items-center justify-center gap-1.5 transition-all shadow-md self-start sm:self-auto"
                  >
                    <span>View Public Portfolio</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </Link>
                </div>

                <div className="flex items-center justify-between text-xs text-slate-400 pt-1">
                  <span>Every student gets a custom public URL with scannable QR card</span>
                  <Link href="/network" className="text-emerald-400 hover:text-emerald-300 font-bold flex items-center gap-1">
                    <span>Explore Network</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 3. BENTO GRID / 6 CORE MODULES SHOWCASE                                  */}
      {/* ========================================================================= */}
      <section id="features" className="py-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto scroll-mt-20">
        
        <div className="text-center space-y-3 mb-14">
          <span className="text-xs font-mono font-bold uppercase tracking-wider text-emerald-400">
            Unified Career Intelligence Architecture
          </span>
          <h2 className="text-3xl sm:text-5xl font-black font-display tracking-tight text-white">
            Six Specialized Modules for Career Success.
          </h2>
          <p className="text-sm sm:text-base text-slate-400 max-w-2xl mx-auto font-normal">
            Every module works together to turn raw technical curiosity into verifiable proof of competence for employers.
          </p>
        </div>

        {/* 6-Module Bento Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          
          {/* 1. ATS Resume Analyzer & Builder */}
          <div className="p-6 sm:p-7 rounded-3xl bg-[#0C101A] border border-white/10 hover:border-emerald-500/40 transition-all flex flex-col justify-between group shadow-xl relative overflow-hidden">
            <div className="space-y-4">
              <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center shadow-md">
                <FileText className="w-6 h-6" />
              </div>
              <div className="space-y-1.5">
                <h3 className="text-lg font-bold text-white font-display group-hover:text-emerald-400 transition-colors">
                  ATS Resume Analyzer &amp; Builder
                </h3>
                <p className="text-xs sm:text-sm text-slate-400 leading-relaxed font-normal">
                  Instant resume scoring, keyword optimization, and recruiter-ready template formatting that pass corporate ATS parsers.
                </p>
              </div>
            </div>

            <div className="mt-6 pt-4 border-t border-white/10 flex items-center justify-between text-xs">
              <span className="font-mono text-emerald-400 font-bold">98/100 Benchmark</span>
              <Link href="/resumes" className="font-bold text-white group-hover:text-emerald-400 flex items-center gap-1">
                <span>Build Resume</span>
                <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
              </Link>
            </div>
          </div>

          {/* 2. Interactive Mock Interview Simulator */}
          <div className="p-6 sm:p-7 rounded-3xl bg-[#0C101A] border border-white/10 hover:border-emerald-500/40 transition-all flex flex-col justify-between group shadow-xl relative overflow-hidden">
            <div className="space-y-4">
              <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center shadow-md">
                <Video className="w-6 h-6" />
              </div>
              <div className="space-y-1.5">
                <h3 className="text-lg font-bold text-white font-display group-hover:text-emerald-400 transition-colors">
                  Interactive Mock Interview Simulator
                </h3>
                <p className="text-xs sm:text-sm text-slate-400 leading-relaxed font-normal">
                  Real-time technical and behavioral interview practice with structured performance feedback scored on the STAR framework.
                </p>
              </div>
            </div>

            <div className="mt-6 pt-4 border-t border-white/10 flex items-center justify-between text-xs">
              <span className="font-mono text-emerald-400 font-bold">1,000+ Questions</span>
              <Link href="/interviews" className="font-bold text-white group-hover:text-emerald-400 flex items-center gap-1">
                <span>Start Practice</span>
                <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
              </Link>
            </div>
          </div>

          {/* 3. Integrated Coding Workspace */}
          <div id="workspace" className="p-6 sm:p-7 rounded-3xl bg-[#0C101A] border border-white/10 hover:border-emerald-500/40 transition-all flex flex-col justify-between group shadow-xl relative overflow-hidden scroll-mt-24">
            <div className="space-y-4">
              <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center shadow-md">
                <Terminal className="w-6 h-6" />
              </div>
              <div className="space-y-1.5">
                <h3 className="text-lg font-bold text-white font-display group-hover:text-emerald-400 transition-colors">
                  Integrated Coding Workspace
                </h3>
                <p className="text-xs sm:text-sm text-slate-400 leading-relaxed font-normal">
                  Browser-based IDE and execution environment for practicing algorithms, data structures, and full-stack development without setup.
                </p>
              </div>
            </div>

            <div className="mt-6 pt-4 border-t border-white/10 flex items-center justify-between text-xs">
              <span className="font-mono text-emerald-400 font-bold">20 DSA Tracks</span>
              <Link href="/dsa" className="font-bold text-white group-hover:text-emerald-400 flex items-center gap-1">
                <span>Open IDE</span>
                <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
              </Link>
            </div>
          </div>

          {/* 4. Project Studio & Evidence Portfolio */}
          <div id="portfolios" className="p-6 sm:p-7 rounded-3xl bg-[#0C101A] border border-white/10 hover:border-emerald-500/40 transition-all flex flex-col justify-between group shadow-xl relative overflow-hidden scroll-mt-24">
            <div className="space-y-4">
              <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center shadow-md">
                <FolderGit2 className="w-6 h-6" />
              </div>
              <div className="space-y-1.5">
                <h3 className="text-lg font-bold text-white font-display group-hover:text-emerald-400 transition-colors">
                  Project Studio &amp; Evidence Portfolio
                </h3>
                <p className="text-xs sm:text-sm text-slate-400 leading-relaxed font-normal">
                  A verifiable showcase where students turn academic and personal code projects into proof-of-work portfolios for recruiters.
                </p>
              </div>
            </div>

            <div className="mt-6 pt-4 border-t border-white/10 flex items-center justify-between text-xs">
              <span className="font-mono text-emerald-400 font-bold">Scannable QR &amp; Links</span>
              <Link href="/network" className="font-bold text-white group-hover:text-emerald-400 flex items-center gap-1">
                <span>View Portfolios</span>
                <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
              </Link>
            </div>
          </div>

          {/* 5. Myra — Personal Study & Career Mentor */}
          <div className="p-6 sm:p-7 rounded-3xl bg-[#0C101A] border border-white/10 hover:border-emerald-500/40 transition-all flex flex-col justify-between group shadow-xl relative overflow-hidden">
            <div className="space-y-4">
              <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center shadow-md">
                <Sparkles className="w-6 h-6" />
              </div>
              <div className="space-y-1.5">
                <h3 className="text-lg font-bold text-white font-display group-hover:text-emerald-400 transition-colors">
                  Myra — Personal Study &amp; Career Mentor
                </h3>
                <p className="text-xs sm:text-sm text-slate-400 leading-relaxed font-normal">
                  Personalized learning roadmaps, smart student timetables, and step-by-step guidance from school through university graduation.
                </p>
              </div>
            </div>

            <div className="mt-6 pt-4 border-t border-white/10 flex items-center justify-between text-xs">
              <span className="font-mono text-emerald-400 font-bold">24/7 Guided Companion</span>
              <button
                type="button"
                onClick={() => handleOpenMyra("Help me build a personalized study roadmap")}
                className="font-bold text-white group-hover:text-emerald-400 flex items-center gap-1 cursor-pointer"
              >
                <span>Ask Myra</span>
                <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
              </button>
            </div>
          </div>

          {/* 6. Campus Ambassador Hub */}
          <div id="ambassadors" className="p-6 sm:p-7 rounded-3xl bg-[#0C101A] border border-white/10 hover:border-emerald-500/40 transition-all flex flex-col justify-between group shadow-xl relative overflow-hidden scroll-mt-24">
            <div className="space-y-4">
              <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center shadow-md">
                <Users className="w-6 h-6" />
              </div>
              <div className="space-y-1.5">
                <h3 className="text-lg font-bold text-white font-display group-hover:text-emerald-400 transition-colors">
                  Campus Ambassador Hub
                </h3>
                <p className="text-xs sm:text-sm text-slate-400 leading-relaxed font-normal">
                  Dedicated portal for student leaders to manage campus chapters, track referrals, and organize tech cohorts for placements.
                </p>
              </div>
            </div>

            <div className="mt-6 pt-4 border-t border-white/10 flex items-center justify-between text-xs">
              <span className="font-mono text-emerald-400 font-bold">Student Leadership</span>
              <Link href="/ambassadors" className="font-bold text-white group-hover:text-emerald-400 flex items-center gap-1">
                <span>Join Chapter</span>
                <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 4. NEWSLETTER SUBSCRIBE SECTION (HIGH CONTRAST & EMERALD GLOW)             */}
      {/* ========================================================================= */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto">
        <div className="p-8 sm:p-12 rounded-3xl bg-zinc-950 border border-emerald-500/25 shadow-[0_0_60px_-15px_rgba(16,185,129,0.2)] text-center relative overflow-hidden">
          
          {/* Subtle Ambient Radial Highlight */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-80 h-32 bg-emerald-500/15 rounded-full blur-3xl pointer-events-none" />

          <div className="max-w-2xl mx-auto space-y-3 relative z-10">
            <span className="text-xs font-mono font-bold uppercase tracking-wider text-emerald-400">
              Placement Intelligence Dispatch
            </span>
            <h2 className="text-2xl sm:text-4xl font-extrabold text-white tracking-tight font-display">
              Stay ahead of campus placements &amp; tech hiring.
            </h2>
            <p className="text-xs sm:text-sm text-slate-300 font-normal leading-relaxed">
              Join thousands of students receiving weekly coding challenges, resume tips, and early feature releases from Edworld Co.
            </p>
          </div>

          <form onSubmit={handleNewsletterSubmit} className="mt-7 max-w-md mx-auto flex flex-col sm:flex-row items-center gap-2.5 relative z-10">
            <input
              type="email"
              required
              value={newsletterEmail}
              onChange={(e) => setNewsletterEmail(e.target.value)}
              placeholder="Enter your college or personal email..."
              className="w-full px-4 py-3 rounded-xl bg-[#080B11] border border-white/15 text-white placeholder-slate-500 text-xs sm:text-sm focus:outline-none focus:border-emerald-500/60 focus:ring-1 focus:ring-emerald-500/30 transition-all font-sans"
            />
            <button
              type="submit"
              disabled={subscribeStatus === "loading"}
              className="w-full sm:w-auto px-6 py-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-extrabold text-xs sm:text-sm shrink-0 transition-all shadow-md cursor-pointer disabled:opacity-50"
            >
              {subscribeStatus === "success" ? "Subscribed!" : "Subscribe Now"}
            </button>
          </form>

          {/* Micro-copy Reassurance */}
          <div className="mt-4 flex items-center justify-center gap-1.5 text-xs text-slate-400 font-normal relative z-10">
            <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
            <span>No spam. Unsubscribe anytime.</span>
          </div>

          {subscribeStatus === "success" && (
            <p className="mt-3 text-xs text-emerald-400 font-semibold animate-in fade-in">
              ✓ Thank you! You have been subscribed to our weekly technical dispatch.
            </p>
          )}
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 5. COMPREHENSIVE MULTI-COLUMN FOOTER                                      */}
      {/* ========================================================================= */}
      <footer className="bg-[#06080E] border-t border-white/10 text-slate-400 pt-16 pb-12 px-4 sm:px-6 lg:px-8 font-sans">
        <div className="max-w-7xl mx-auto space-y-12">
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8 sm:gap-10">
            
            {/* Column 1: Brand & Social */}
            <div className="space-y-4 lg:col-span-2">
              <Link href="/" className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl overflow-hidden border border-white/20 bg-black flex items-center justify-center p-0.5">
                  <Image
                    src="/images/edworld-logo.png"
                    alt="Edworld Co."
                    width={32}
                    height={32}
                    className="w-full h-full object-cover rounded-lg"
                  />
                </div>
                <div className="flex items-center gap-1.5 leading-none">
                  <span className="font-extrabold text-base tracking-tight font-display text-white">
                    Edworld
                  </span>
                  <span className="text-[10px] font-black px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                    Co.
                  </span>
                </div>
              </Link>

              <p className="text-xs sm:text-sm text-slate-400 max-w-sm leading-relaxed">
                Bridging academic learning and corporate placement.
              </p>

              {/* Direct Support & Community Social Links */}
              <div className="flex items-center gap-2.5 pt-2">
                <a
                  href="https://linkedin.com/company/edworldco"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-slate-400 hover:text-white transition-colors"
                  aria-label="LinkedIn"
                >
                  <Linkedin className="w-4 h-4" />
                </a>
                <a
                  href="https://instagram.com/edworldco"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-slate-400 hover:text-white transition-colors"
                  aria-label="Instagram"
                >
                  <Instagram className="w-4 h-4" />
                </a>
                <a
                  href="https://youtube.com/@edworldco"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-slate-400 hover:text-white transition-colors"
                  aria-label="YouTube"
                >
                  <Youtube className="w-4 h-4" />
                </a>
                <a
                  href="https://github.com/edworldco"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-slate-400 hover:text-white transition-colors"
                  aria-label="GitHub"
                >
                  <Github className="w-4 h-4" />
                </a>
                <a
                  href="https://chat.whatsapp.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-2.5 py-1.5 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 text-xs font-semibold flex items-center gap-1.5 transition-colors"
                  aria-label="WhatsApp Community"
                >
                  <MessageSquare className="w-3.5 h-3.5" />
                  <span>WhatsApp Community</span>
                </a>
              </div>
            </div>

            {/* Column 2: Platform Links */}
            <div className="space-y-3">
              <h4 className="font-extrabold text-xs uppercase tracking-wider text-white font-display">
                Platform
              </h4>
              <ul className="space-y-2 text-xs">
                <li>
                  <Link href="/resumes" className="hover:text-emerald-400 transition-colors">
                    ATS Resume Builder
                  </Link>
                </li>
                <li>
                  <Link href="/dsa" className="hover:text-emerald-400 transition-colors">
                    Coding Workspace &amp; DSA
                  </Link>
                </li>
                <li>
                  <Link href="/interviews" className="hover:text-emerald-400 transition-colors">
                    Mock Interviews
                  </Link>
                </li>
                <li>
                  <Link href="/edbuild" className="hover:text-emerald-400 transition-colors">
                    Project Studio &amp; Squads
                  </Link>
                </li>
                <li>
                  <button
                    type="button"
                    onClick={() => handleOpenMyra("Help me prepare for engineering placements")}
                    className="hover:text-emerald-400 transition-colors cursor-pointer text-left"
                  >
                    Myra Companion
                  </button>
                </li>
              </ul>
            </div>

            {/* Column 3: Programs & Community */}
            <div className="space-y-3">
              <h4 className="font-extrabold text-xs uppercase tracking-wider text-white font-display">
                Programs &amp; Community
              </h4>
              <ul className="space-y-2 text-xs">
                <li>
                  <Link href="/ambassadors" className="hover:text-emerald-400 transition-colors">
                    Student Ambassador Program
                  </Link>
                </li>
                <li>
                  <Link href="/learn" className="hover:text-emerald-400 transition-colors">
                    Sparkn Kids Learning
                  </Link>
                </li>
                <li>
                  <Link href="/for/colleges" className="hover:text-emerald-400 transition-colors">
                    Institutional Partnerships
                  </Link>
                </li>
                <li>
                  <Link href="/network" className="hover:text-emerald-400 transition-colors">
                    Campus Cohorts &amp; Directory
                  </Link>
                </li>
                <li>
                  <Link href="/jobs" className="hover:text-emerald-400 transition-colors">
                    Placement Drives &amp; Jobs
                  </Link>
                </li>
              </ul>
            </div>

            {/* Column 4: Contact & Office */}
            <div className="space-y-3">
              <h4 className="font-extrabold text-xs uppercase tracking-wider text-white font-display">
                Contact &amp; Trust
              </h4>
              <ul className="space-y-2 text-xs">
                <li>
                  <Link href="/contact" className="hover:text-emerald-400 transition-colors">
                    Contact Support
                  </Link>
                </li>
                <li>
                  <Link href="/about" className="hover:text-emerald-400 transition-colors">
                    About Edworld Co.
                  </Link>
                </li>
                <li>
                  <a href="mailto:edworld.eden@gmail.com" className="hover:text-emerald-400 transition-colors">
                    edworld.eden@gmail.com
                  </a>
                </li>
                <li className="text-slate-500 text-[11px] pt-1">
                  Hyderabad, India • Mon - Sat 9:00 AM - 6:00 PM IST
                </li>
              </ul>
            </div>
          </div>

          {/* Legal & Bottom Bar */}
          <div className="pt-8 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
            <p>
              Copyright &copy; 2026 Edworld Co. All rights reserved.
            </p>

            <div className="flex flex-wrap items-center gap-6">
              <Link href="/privacy" className="hover:text-slate-300 transition-colors">
                Privacy Policy
              </Link>
              <Link href="/terms" className="hover:text-slate-300 transition-colors">
                Terms of Service
              </Link>
              <Link href="/cookies" className="hover:text-slate-300 transition-colors">
                Cookie Preferences
              </Link>
              <Link href="/contact" className="hover:text-slate-300 transition-colors">
                Contact Support
              </Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
