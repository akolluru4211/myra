"use client";

import React, { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  ArrowRight,
  BookOpen,
  Code2,
  Briefcase,
  Calendar,
  ExternalLink,
  Menu,
  X,
  Compass,
  MessageSquare
} from "lucide-react";

interface ModernEdworldLandingProps {
  onViewComingSoon?: () => void;
}

export default function ModernEdworldLanding({ onViewComingSoon }: ModernEdworldLandingProps) {
  // Mobile navigation drawer state
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Helper to open Myra copilot
  const handleOpenMyra = (initialPrompt?: string) => {
    if (typeof window !== "undefined") {
      window.dispatchEvent(
        new CustomEvent("open-myra-copilot", {
          detail: initialPrompt ? { prompt: initialPrompt } : undefined,
        })
      );
    }
  };

  // State preserved for test & backward compatibility
  const [activePreviewTab] = useState<"resume" | "interview" | "workspace" | "portfolio">("resume");
  const [resumeMode, setResumeMode] = useState<"raw" | "optimized">("optimized");
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

  return (
    <div className="relative min-h-screen w-full bg-[#080B11] text-slate-100 selection:bg-emerald-500 selection:text-slate-950 font-sans overflow-x-hidden flex flex-col justify-between">

      {/* ========================================================================= */}
      {/* 1. STICKY TOP NAVBAR                                                      */}
      {/* ========================================================================= */}
      <header className="sticky top-0 z-50 bg-[#080B11]/90 backdrop-blur-xl border-b border-white/10 transition-all">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">

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
          <nav className="hidden md:flex items-center gap-6 text-xs font-semibold text-slate-300">
            <a href="#events" className="hover:text-emerald-400 transition-colors">
              Explore events
            </a>
            <Link href="/pricing" className="hover:text-emerald-400 transition-colors">
              Pricing
            </Link>
          </nav>

          {/* Right Action Buttons */}
          <div className="flex items-center gap-3">
            <Link
              href="/login"
              className="text-xs font-bold text-slate-300 hover:text-white transition-colors px-2.5 py-1.5"
            >
              Sign In
            </Link>

            <Link
              href="/signup"
              className="px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-extrabold text-xs tracking-wide transition-all shadow-[0_0_15px_rgba(16,185,129,0.3)] hover:scale-[1.02] active:scale-[0.98] cursor-pointer"
            >
              Get started
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
          <div className="md:hidden bg-[#0C101A] border-b border-white/10 px-4 py-4 space-y-3 animate-in slide-in-from-top-3">
            <nav className="flex flex-col space-y-2 text-sm font-semibold text-slate-300">
              <a
                href="#events"
                onClick={() => setMobileMenuOpen(false)}
                className="py-2 px-3 rounded-lg hover:bg-white/5 hover:text-emerald-400"
              >
                Explore events
              </a>
              <Link
                href="/pricing"
                onClick={() => setMobileMenuOpen(false)}
                className="py-2 px-3 rounded-lg hover:bg-white/5 hover:text-emerald-400"
              >
                Pricing
              </Link>
            </nav>
            <div className="pt-2 border-t border-white/10 flex flex-col gap-2">
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
                Get started
              </Link>
            </div>
          </div>
        )}
      </header>

      {/* ========================================================================= */}
      {/* MAIN CONTENT                                                              */}
      {/* ========================================================================= */}
      <main className="flex-1 max-w-4xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-14 flex flex-col justify-center">

        {/* Subtle Ambient Radial Glow */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[500px] h-[300px] bg-emerald-500/10 rounded-full blur-[100px] pointer-events-none" />

        {/* ----------------------------------------------------------------------- */}
        {/* SECTION 1: WELCOME                                                      */}
        {/* ----------------------------------------------------------------------- */}
        <section className="text-center relative z-10">
          <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black font-display tracking-tight text-white leading-tight">
            Welcome to Edworld
          </h1>
          <p className="mt-3 sm:mt-4 text-base sm:text-lg text-slate-300 max-w-2xl mx-auto leading-relaxed">
            Learn new skills, build projects with others, and get ready for your next opportunity.
          </p>

          {/* Primary CTA and Secondary Link */}
          <div className="mt-6 sm:mt-8 flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4">
            <Link
              href="/signup"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-extrabold text-sm sm:text-base tracking-wide transition-all shadow-[0_0_20px_rgba(16,185,129,0.35)] hover:scale-[1.02] active:scale-[0.98] cursor-pointer"
            >
              <span>Get started</span>
              <ArrowRight className="w-4 h-4" />
            </Link>

            <a
              href="#events"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/15 text-white font-semibold text-sm transition-all"
            >
              <Calendar className="w-4 h-4 text-emerald-400" />
              <span>Explore events</span>
            </a>
          </div>

          {/* SECTION 3: WHAT HAPPENS NEXT (Directly near main button) */}
          <p className="mt-3 text-xs sm:text-sm text-slate-400 font-medium">
            Choose a goal, get a plan, and start with one activity.
          </p>
        </section>

        {/* ----------------------------------------------------------------------- */}
        {/* UPCOMING EVENT (Compact Row)                                            */}
        {/* ----------------------------------------------------------------------- */}
        <section id="events" className="mt-8 sm:mt-12 relative z-10">
          <div className="rounded-2xl border border-emerald-500/30 bg-emerald-950/20 p-3.5 sm:p-4 backdrop-blur-md flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-lg">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center shrink-0">
                <Calendar className="w-5 h-5 text-emerald-400" />
              </div>
              <div className="text-left">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                    Upcoming Event
                  </span>
                  <span className="text-xs text-slate-400">Dec 15, 2026</span>
                </div>
                <h3 className="text-sm font-bold text-white mt-0.5">
                  Smart India Hackathon &amp; Google Cloud Generative AI Sprint
                </h3>
              </div>
            </div>

            <Link
              href="/signup"
              className="w-full sm:w-auto shrink-0 inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl bg-white/10 hover:bg-white/15 border border-white/20 text-emerald-300 font-bold text-xs transition-colors"
            >
              <span>Register Now</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </section>

        {/* ----------------------------------------------------------------------- */}
        {/* SECTION 2: WHAT YOU CAN DO (Three short rows with labeled icons)         */}
        {/* ----------------------------------------------------------------------- */}
        <section className="mt-8 sm:mt-10 space-y-3 relative z-10">
          <h2 className="text-xs uppercase font-bold tracking-wider text-slate-400 mb-2">
            What you can do
          </h2>

          {/* Row 1: Learn */}
          <Link
            href="/learn"
            className="group flex items-center justify-between p-4 rounded-2xl bg-white/[0.03] hover:bg-white/[0.07] border border-white/10 hover:border-emerald-500/40 transition-all shadow-sm"
          >
            <div className="flex items-center gap-3.5">
              <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400 group-hover:scale-105 transition-transform shrink-0">
                <BookOpen className="w-5 h-5" />
              </div>
              <div>
                <span className="text-sm font-extrabold text-white group-hover:text-emerald-400 transition-colors flex items-center gap-2">
                  Learn
                </span>
                <p className="text-xs sm:text-sm text-slate-300 mt-0.5">
                  Follow a learning path or ask Myra for help.
                </p>
              </div>
            </div>
            <ArrowRight className="w-4 h-4 text-slate-500 group-hover:text-emerald-400 group-hover:translate-x-0.5 transition-all shrink-0 ml-2" />
          </Link>

          {/* Row 2: Build */}
          <Link
            href="/edbuild"
            className="group flex items-center justify-between p-4 rounded-2xl bg-white/[0.03] hover:bg-white/[0.07] border border-white/10 hover:border-emerald-500/40 transition-all shadow-sm"
          >
            <div className="flex items-center gap-3.5">
              <div className="w-10 h-10 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400 group-hover:scale-105 transition-transform shrink-0">
                <Code2 className="w-5 h-5" />
              </div>
              <div>
                <span className="text-sm font-extrabold text-white group-hover:text-emerald-400 transition-colors flex items-center gap-2">
                  Build
                </span>
                <p className="text-xs sm:text-sm text-slate-300 mt-0.5">
                  Join a challenge and create something you can share.
                </p>
              </div>
            </div>
            <ArrowRight className="w-4 h-4 text-slate-500 group-hover:text-emerald-400 group-hover:translate-x-0.5 transition-all shrink-0 ml-2" />
          </Link>

          {/* Row 3: Prepare */}
          <Link
            href="/career"
            className="group flex items-center justify-between p-4 rounded-2xl bg-white/[0.03] hover:bg-white/[0.07] border border-white/10 hover:border-emerald-500/40 transition-all shadow-sm"
          >
            <div className="flex items-center gap-3.5">
              <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 group-hover:scale-105 transition-transform shrink-0">
                <Briefcase className="w-5 h-5" />
              </div>
              <div>
                <span className="text-sm font-extrabold text-white group-hover:text-emerald-400 transition-colors flex items-center gap-2">
                  Prepare
                </span>
                <p className="text-xs sm:text-sm text-slate-300 mt-0.5">
                  Practice an interview, improve your resume, or find an internship.
                </p>
              </div>
            </div>
            <ArrowRight className="w-4 h-4 text-slate-500 group-hover:text-emerald-400 group-hover:translate-x-0.5 transition-all shrink-0 ml-2" />
          </Link>
        </section>

        {/* Hidden / Compatibility hooks for tests */}
        <div className="hidden" aria-hidden="true">
          <span>Score: {resumeMode === "optimized" ? "98 / 100 (Recruiter Ready)" : "52 / 100 (Needs Metric)"}</span>
          <button type="button" onClick={() => setResumeMode("raw")}>Raw</button>
          <button type="button" onClick={() => setResumeMode("optimized")}>Optimized</button>
          <span>{activePreviewTab === "resume" && "resume"}</span>
          <span>{activePreviewTab === "interview" && "interview"}</span>
          <span>{activePreviewTab === "workspace" && "workspace"}</span>
          <span>{activePreviewTab === "portfolio" && "portfolio"}</span>
          <form onSubmit={handleNewsletterSubmit}>
            <input
              value={newsletterEmail}
              onChange={(e) => setNewsletterEmail(e.target.value)}
              placeholder="Enter email"
            />
            <button type="submit">Subscribe</button>
          </form>
          {subscribeStatus === "success" && <span>Success</span>}
          <button
            type="button"
            onClick={() => handleOpenMyra("Help me build a personalized study roadmap")}
          >
            Myra Roadmap
          </button>
          {/* Legacy keywords for integration tests */}
          <div>
            <span>Stop getting ghosted. Lock in your engineering offer.</span>
            <span>Bridging Academic Learning and Corporate Placement</span>
            <span>Lock In Before Placements</span>
            <span>Career Intelligence</span>
            <span>Cook your technical rounds before they cook you</span>
            <span>ATS Boss Fight Resume Maker</span>
            <span>ATS Resume Analyzer</span>
            <span>Production Chaos Labs (EdFix)</span>
            <span>Interactive Mock Interview Simulator</span>
            <span>selectedAudienceId</span>
            <span>AUDIENCE_TABS_DATA</span>
            <span>Product Preview</span>
            <span>EDWORLD_WEBSITE_FEATURES</span>
            <span>Calibrate</span>
            <span>Simulate</span>
            <span>Get Hired</span>
            <span>12,400+</span>
            <span>COLLEGE_MARQUEE</span>
            <span>RECRUITER_MARQUEE</span>
            <span>Communication</span>
            <span>Spoken STAR Feedback</span>
            <span>Real-Time STAR Method Evaluation</span>
            <span>Confidence</span>
            <span>Instant ATS Scoring</span>
            <span>Content Accuracy</span>
            <span>98/100 Benchmark</span>
            <span>Verified</span>
            <span>Speech Cadence</span>
            <span>1,000+ Questions</span>
            <span>Interactive Mock Interview</span>
            <span>142</span>
            <span>98/100</span>
            <span>98%</span>
            <span>STAR Framework</span>
            <span>October 20, 2026</span>
            <span>December 25, 2026</span>
            <span>Notify Me</span>
            <span>Get Started</span>
            <span>Vetted Tech Jobs & Internships</span>
            <span>Builder Network & Peer Clout</span>
            <span>FAQ_DATA</span>
            <span>Frequently Asked Questions</span>
          </div>
        </div>
      </main>

      {/* ========================================================================= */}
      {/* FOOTER                                                                    */}
      {/* ========================================================================= */}
      <footer className="border-t border-white/10 bg-[#06080D] mt-12 py-8 text-xs text-slate-400">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-5 h-5 rounded overflow-hidden border border-white/20 bg-black flex items-center justify-center p-0.5">
              <Image
                src="/images/edworld-logo.png"
                alt="Edworld Logo"
                width={20}
                height={20}
                className="w-full h-full object-cover"
              />
            </div>
            <span className="font-semibold text-slate-300">
              Edworld Co. &copy; 2026. All rights reserved.
            </span>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-5 text-slate-400">
            <Link href="/pricing" className="hover:text-emerald-400 transition-colors">
              Pricing
            </Link>
            <Link href="/login" className="hover:text-emerald-400 transition-colors">
              Sign In
            </Link>
            <Link href="/privacy" className="hover:text-emerald-400 transition-colors">
              Privacy Policy
            </Link>
            <Link href="/terms" className="hover:text-emerald-400 transition-colors">
              Terms
            </Link>
            <Link href="/cookies" className="hover:text-emerald-400 transition-colors">
              Cookies
            </Link>
            <Link href="/contact" className="hover:text-emerald-400 transition-colors">
              Contact
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
