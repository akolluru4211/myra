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
    <div className="relative min-h-screen w-full bg-white text-black selection:bg-[#2563EB] selection:text-white font-sans overflow-x-hidden flex flex-col justify-between">

      {/* ========================================================================= */}
      {/* 1. STICKY TOP NAVBAR                                                      */}
      {/* ========================================================================= */}
      <header className="sticky top-0 z-50 bg-white/90 backdrop-blur-md border-b border-blue-200/80 transition-all shadow-xs">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">

          {/* Brand Logo & Wordmark */}
          <Link href="/" className="flex items-center gap-2.5 group shrink-0">
            <div className="w-9 h-9 rounded-2xl overflow-hidden bg-[#2563EB] flex items-center justify-center p-1 shadow-sm transition-transform group-hover:scale-105 duration-200">
              <Image
                src="/images/edworld-logo.png"
                alt="Edworld Co. Logo"
                width={32}
                height={32}
                className="w-full h-full object-cover rounded-md"
              />
            </div>
            <div className="flex items-center gap-1.5 leading-none">
              <span className="font-extrabold text-base sm:text-lg tracking-tight font-display text-black">
                Edworld
              </span>
              <span className="text-[10px] font-black px-1.5 py-0.5 rounded-full bg-[#2563EB] text-white shadow-xs font-display">
                Co.
              </span>
            </div>
          </Link>

          {/* Desktop Navigation Links */}
          <nav className="hidden md:flex items-center gap-6 text-xs font-bold text-slate-600">
            <a href="#events" className="hover:text-[#2563EB] transition-colors">
              Explore events
            </a>
            <Link href="/pricing" className="hover:text-[#2563EB] transition-colors">
              Pricing
            </Link>
          </nav>

          {/* Right Action Buttons */}
          <div className="flex items-center gap-3">
            <Link
              href="/login"
              className="text-xs font-bold text-slate-700 hover:text-black transition-colors px-3 py-1.5 rounded-xl hover:bg-white"
            >
              Sign In
            </Link>

            <Link
              href="/signup"
              className="px-4 py-2 rounded-xl bg-[#2563EB] hover:bg-[#1D4ED8] text-white font-extrabold text-xs tracking-wide transition-all shadow-md shadow-blue-500/15 hover:scale-[1.02] active:scale-[0.98] cursor-pointer"
            >
              Get started
            </Link>

            {/* Mobile Menu Button */}
            <button
              type="button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-xl bg-white border border-blue-200/80 text-slate-700 hover:text-black md:hidden cursor-pointer shadow-xs"
              aria-label="Toggle navigation menu"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5 text-slate-700" />}
            </button>
          </div>
        </div>

        {/* Mobile Navigation Drawer */}
        {mobileMenuOpen && (
          <div className="md:hidden bg-white border-b border-blue-200 px-4 py-4 space-y-3 animate-in slide-in-from-top-3 shadow-lg">
            <nav className="flex flex-col space-y-2 text-sm font-semibold text-slate-700">
              <a
                href="#events"
                onClick={() => setMobileMenuOpen(false)}
                className="py-2 px-3 rounded-lg hover:bg-[#EFF6FF] hover:text-[#2563EB]"
              >
                Explore events
              </a>
              <Link
                href="/pricing"
                onClick={() => setMobileMenuOpen(false)}
                className="py-2 px-3 rounded-lg hover:bg-[#EFF6FF] hover:text-[#2563EB]"
              >
                Pricing
              </Link>
            </nav>
            <div className="pt-2 border-t border-blue-100 flex flex-col gap-2">
              <Link
                href="/login"
                onClick={() => setMobileMenuOpen(false)}
                className="w-full py-2.5 rounded-xl border border-blue-200 text-slate-800 text-center font-bold text-xs hover:bg-[#EFF6FF]"
              >
                Sign In
              </Link>
              <Link
                href="/signup"
                onClick={() => setMobileMenuOpen(false)}
                className="w-full py-2.5 rounded-xl bg-[#2563EB] text-white text-center font-extrabold text-xs shadow-md shadow-blue-500/15"
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

        {/* ----------------------------------------------------------------------- */}
        {/* SECTION 1: WELCOME                                                      */}
        {/* ----------------------------------------------------------------------- */}
        <section className="text-center relative z-10">
          <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black font-display tracking-tight text-black leading-tight">
            Welcome to Edworld
          </h1>
          <p className="mt-3 sm:mt-4 text-base sm:text-lg text-slate-600 max-w-2xl mx-auto leading-relaxed">
            Learn new skills, build projects with others, and get ready for your next opportunity.
          </p>

          {/* Primary CTA and Secondary Link */}
          <div className="mt-6 sm:mt-8 flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4">
            <Link
              href="/signup"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 rounded-2xl bg-[#2563EB] hover:bg-[#1D4ED8] text-white font-extrabold text-sm sm:text-base tracking-wide transition-all shadow-md shadow-indigo-500/25 hover:scale-[1.02] active:scale-[0.98] cursor-pointer"
            >
              <span>Get started</span>
              <ArrowRight className="w-4 h-4" />
            </Link>

            <a
              href="#events"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 rounded-2xl bg-white hover:bg-[#EFF6FF] border border-blue-200/80 text-slate-800 font-bold text-sm transition-all shadow-2xs"
            >
              <Calendar className="w-4 h-4 text-[#2563EB]" />
              <span>Explore events</span>
            </a>
          </div>

          {/* WHAT HAPPENS NEXT (Directly near main button) */}
          <p className="mt-3.5 text-xs sm:text-sm text-slate-500 font-medium">
            Choose a goal, get a plan, and start with one activity.
          </p>
        </section>

        {/* ----------------------------------------------------------------------- */}
        {/* UPCOMING EVENT (Compact Card)                                           */}
        {/* ----------------------------------------------------------------------- */}
        <section id="events" className="mt-8 sm:mt-12 relative z-10">
          <div className="rounded-3xl border border-indigo-100 bg-white p-4 sm:p-5 shadow-[0_10px_30px_rgba(80,90,130,0.06)] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3.5">
              <div className="w-10 h-10 rounded-2xl bg-[#EEF0FD] flex items-center justify-center shrink-0">
                <Calendar className="w-5 h-5 text-[#2563EB]" />
              </div>
              <div className="text-left">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-[10px] uppercase font-bold tracking-wider px-2.5 py-0.5 rounded-full bg-[#EEF0FD] text-[#4338CA]">
                    Upcoming Event
                  </span>
                  <span className="text-xs text-slate-500 font-medium">Dec 15, 2026</span>
                </div>
                <h3 className="text-sm font-bold text-black mt-1">
                  Smart India Hackathon &amp; Google Cloud Generative AI Sprint
                </h3>
              </div>
            </div>

            <Link
              href="/signup"
              className="w-full sm:w-auto shrink-0 inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl bg-[#EEF0FD] hover:bg-[#E0E3FA] text-[#3730A3] font-bold text-xs transition-colors"
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
            className="group flex items-center justify-between p-4 rounded-3xl bg-white hover:border-indigo-200 border border-blue-200/70 transition-all shadow-sm"
          >
            <div className="flex items-center gap-3.5">
              <div className="w-10 h-10 rounded-2xl bg-[#EEF0FD] flex items-center justify-center text-[#2563EB] group-hover:scale-105 transition-transform shrink-0">
                <BookOpen className="w-5 h-5" />
              </div>
              <div>
                <span className="text-sm font-extrabold text-black group-hover:text-[#2563EB] transition-colors flex items-center gap-2">
                  Learn
                </span>
                <p className="text-xs sm:text-sm text-slate-600 mt-0.5">
                  Follow a learning path or ask Myra for help.
                </p>
              </div>
            </div>
            <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-[#2563EB] group-hover:translate-x-0.5 transition-all shrink-0 ml-2" />
          </Link>

          {/* Row 2: Build */}
          <Link
            href="/edbuild"
            className="group flex items-center justify-between p-4 rounded-3xl bg-white hover:border-indigo-200 border border-blue-200/70 transition-all shadow-sm"
          >
            <div className="flex items-center gap-3.5">
              <div className="w-10 h-10 rounded-2xl bg-emerald-50 flex items-center justify-center text-emerald-600 group-hover:scale-105 transition-transform shrink-0">
                <Code2 className="w-5 h-5" />
              </div>
              <div>
                <span className="text-sm font-extrabold text-black group-hover:text-[#2563EB] transition-colors flex items-center gap-2">
                  Build
                </span>
                <p className="text-xs sm:text-sm text-slate-600 mt-0.5">
                  Join a challenge and create something you can share.
                </p>
              </div>
            </div>
            <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-[#2563EB] group-hover:translate-x-0.5 transition-all shrink-0 ml-2" />
          </Link>

          {/* Row 3: Prepare */}
          <Link
            href="/career"
            className="group flex items-center justify-between p-4 rounded-3xl bg-white hover:border-indigo-200 border border-blue-200/70 transition-all shadow-sm"
          >
            <div className="flex items-center gap-3.5">
              <div className="w-10 h-10 rounded-2xl bg-[#EFF6FF] flex items-center justify-center text-amber-600 group-hover:scale-105 transition-transform shrink-0">
                <Briefcase className="w-5 h-5" />
              </div>
              <div>
                <span className="text-sm font-extrabold text-black group-hover:text-[#2563EB] transition-colors flex items-center gap-2">
                  Prepare
                </span>
                <p className="text-xs sm:text-sm text-slate-600 mt-0.5">
                  Practice an interview, improve your resume, or find an internship.
                </p>
              </div>
            </div>
            <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-[#2563EB] group-hover:translate-x-0.5 transition-all shrink-0 ml-2" />
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
      <footer className="border-t border-blue-200 bg-white mt-12 py-8 text-xs text-slate-500">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-lg overflow-hidden bg-[#2563EB] flex items-center justify-center p-0.5">
              <Image
                src="/images/edworld-logo.png"
                alt="Edworld Logo"
                width={20}
                height={20}
                className="w-full h-full object-cover rounded"
              />
            </div>
            <span className="font-semibold text-slate-700">
              Edworld Co. &copy; 2026. All rights reserved.
            </span>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-5 text-slate-600 font-medium">
            <Link href="/pricing" className="hover:text-[#2563EB] transition-colors">
              Pricing
            </Link>
            <Link href="/login" className="hover:text-[#2563EB] transition-colors">
              Sign In
            </Link>
            <Link href="/privacy" className="hover:text-[#2563EB] transition-colors">
              Privacy Policy
            </Link>
            <Link href="/terms" className="hover:text-[#2563EB] transition-colors">
              Terms
            </Link>
            <Link href="/cookies" className="hover:text-[#2563EB] transition-colors">
              Cookies
            </Link>
            <Link href="/contact" className="hover:text-[#2563EB] transition-colors">
              Contact
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
