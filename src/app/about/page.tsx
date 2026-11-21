"use client";

import React from "react";
import Link from "next/link";
import {
  Sparkles,
  Target,
  ShieldCheck,
  HeartHandshake,
  ArrowRight,
  CheckCircle2,
  MapPin,
  Mail,
} from "lucide-react";
import confetti from "canvas-confetti";

export default function AboutPage() {
  const triggerConfetti = () => {
    if (typeof window !== "undefined") {
      confetti({
        particleCount: 80,
        spread: 60,
        origin: { y: 0.8 },
        colors: ["#2563EB", "#10B981", "#F59E0B", "#6366F1"],
      });
    }
  };

  const corePillars = [
    {
      icon: Target,
      title: "Stage-Aware Progression",
      description:
        "Distinct calibrated tracks for pre-college explorers (Ages 16–18) and university/working engineers (Placement Track). Clear rubrics tailored to where you actually stand.",
      tag: "Calibrated Tracks",
    },
    {
      icon: ShieldCheck,
      title: "DPDP Privacy by Design",
      description:
        "Full DPDP Act 2023 and COPPA compliance. Minors under 18 have strict privacy boundaries with parental consent. Your audio recordings and telemetry remain strictly private to you.",
      tag: "Data Sovereign",
    },
    {
      icon: Sparkles,
      title: "Objective STAR Rubrics",
      description:
        "No arbitrary impressions. Myra evaluates Situation, Task, Action, and Result with neural voice transcription, filler word cadence analysis, and model answer rewrites.",
      tag: "STAR Methodology",
    },
    {
      icon: HeartHandshake,
      title: "Institutional Integrity",
      description:
        "Campus placement telemetry and cohort benchmarks without individual learner surveillance. Real-time readiness indices for university Training & Placement Officers.",
      tag: "Campus Standards",
    },
  ];

  const studioPrinciples = [
    {
      number: "01",
      title: "Proof of Work Over Paper",
      description:
        "We believe an engineer is proven through code that compiles, production incidents diagnosed under pressure, and live STAR communication — not multiple-choice certificates.",
    },
    {
      number: "02",
      title: "Pressure Without Panic",
      description:
        "High-stakes tech rounds are stressful. By practicing in browser fullscreen lockdown with neural speech questions, students turn interview anxiety into calm muscle memory.",
    },
    {
      number: "03",
      title: "Democratizing Tier-2/3 Off-Campus Placements",
      description:
        "Exceptional talent isn't restricted to top metros or elite institutes. We give tier-2 and tier-3 students the exact same ATS tooling, Google X-Y-Z resume engineering, and interview rigor used by engineers at FAANG.",
    },
  ];

  return (
    <div className="w-full space-y-12 sm:space-y-16 font-sans text-white animate-in fade-in duration-200">
      
      {/* 1. HERO HEADER */}
      <section className="text-center max-w-3xl mx-auto space-y-4">
        <div className="flex flex-wrap items-center justify-center gap-2">
          <span className="liquid-pill text-xs font-semibold px-3 py-1 bg-blue-500/10 text-blue-700 border-blue-500/20">
            The EdWorld Manifesto
          </span>
          <span className="liquid-pill text-xs font-medium px-3 py-1 bg-white/70 text-slate-300 border-white/80">
            Built by Engineers for Engineers
          </span>
          <span className="text-xs text-slate-400 font-medium">
            HITEC City &bull; Hyderabad
          </span>
        </div>

        <h1 className="text-3xl sm:text-5xl font-extrabold text-white tracking-tight">
          Career acceleration built with precision, not corporate clichés.
        </h1>

        <p className="text-sm sm:text-base text-slate-300 leading-relaxed max-w-2xl mx-auto">
          We grew tired of generic interview checklists, broken multiple-choice assessments, and disconnected chatbots. EdWorld Co. is an interconnected engineering intelligence platform designed to eliminate guesswork from your tech career journey.
        </p>

        {/* Metrics Strip */}
        <div className="pt-6 grid grid-cols-2 sm:grid-cols-4 gap-4 max-w-3xl mx-auto">
          <div className="p-4 tactile-chassis bg-[#0C101A] border border-white/10 text-white shadow-xs">
            <div className="font-bold text-2xl text-white">14,800+</div>
            <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Students Mentored</div>
          </div>
          <div className="p-4 tactile-chassis bg-[#0C101A] border border-white/10 text-white shadow-xs">
            <div className="font-bold text-2xl text-white">100%</div>
            <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Lockdown Anti-Cheat</div>
          </div>
          <div className="p-4 tactile-chassis bg-[#0C101A] border border-white/10 text-white shadow-xs">
            <div className="font-bold text-2xl text-white">98%</div>
            <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">ATS Parser Match</div>
          </div>
          <div className="p-4 tactile-chassis bg-[#0C101A] border border-white/10 text-white shadow-xs">
            <div className="font-bold text-2xl text-white">0-Cost</div>
            <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Student Starter</div>
          </div>
        </div>
      </section>

      {/* 2. THE 4 FOUNDATIONAL PILLARS */}
      <section className="space-y-8">
        <div className="text-center space-y-2 max-w-2xl mx-auto">
          <span className="liquid-pill text-xs font-semibold px-3 py-1 bg-blue-500/10 text-blue-700 border-blue-500/20">
            Our Core Architecture
          </span>
          <h2 className="text-2xl sm:text-3xl font-bold text-white">
            Four commitments to genuine mastery.
          </h2>
          <p className="text-xs sm:text-sm text-slate-400">
            Every line of code and feature we build adheres to these non-negotiable architectural principles.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-5xl mx-auto">
          {corePillars.map((pillar, idx) => {
            const Icon = pillar.icon;
            return (
              <div
                key={idx}
                className="tactile-chassis bg-[#0C101A] border border-white/10 text-white hover:bg-white/90 p-6 sm:p-8 space-y-5 flex flex-col justify-between transition-all"
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="w-10 h-10 rounded-xl bg-blue-500/15 text-blue-600 flex items-center justify-center border border-blue-500/20">
                      <Icon className="w-5 h-5" />
                    </div>

                    <span className="liquid-pill text-[11px] font-semibold px-2.5 py-0.5 bg-white/70 text-slate-300 border-white/80">
                      {pillar.tag}
                    </span>
                  </div>

                  <h3 className="font-bold text-lg text-white">
                    {pillar.title}
                  </h3>

                  <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                    {pillar.description}
                  </p>
                </div>

                <div className="pt-4 border-t border-slate-200/60 flex items-center gap-2 text-xs font-medium text-white">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>Production verified across all modules</span>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* 3. EDITORIAL PRINCIPLES */}
      <section className="tactile-chassis bg-[#0C101A] border border-white/10 text-white p-6 sm:p-10 shadow-xs max-w-5xl mx-auto space-y-8">
        <div className="max-w-2xl space-y-2">
          <span className="liquid-pill text-xs font-semibold px-2.5 py-0.5 bg-blue-500/10 text-blue-700 border-blue-500/20">
            Editorial Standards
          </span>
          <h2 className="text-2xl sm:text-3xl font-bold text-white">
            How we approach engineering education.
          </h2>
          <p className="text-xs sm:text-sm text-slate-400">
            We refuse to treat software engineering as memorization. Here is what drives our curriculum and tooling decisions:
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {studioPrinciples.map((principle, idx) => (
            <div
              key={idx}
              className="rounded-xl tactile-chassis bg-[#0C101A] border border-white/10 text-white bg-white/60 border-white/80 p-5 space-y-3"
            >
              <div className="w-8 h-8 rounded-lg bg-white/90 border border-slate-200 font-mono font-bold text-xs flex items-center justify-center text-white shadow-2xs">
                {principle.number}
              </div>
              <h3 className="font-bold text-sm text-white">
                {principle.title}
              </h3>
              <p className="text-xs text-slate-300 leading-relaxed">
                {principle.description}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* 4. LOCATION & CONTACT QUICK STRIP */}
      <section className="tactile-chassis bg-[#0C101A] border border-white/10 text-white p-6 sm:p-8 max-w-5xl mx-auto shadow-xs">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-center">
          <div className="space-y-1">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
              Physical Location
            </span>
            <div className="flex items-start gap-2 pt-1">
              <MapPin className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
              <p className="text-xs font-medium text-white">
                HITEC City, Madhapur, Hyderabad, Telangana 500081
              </p>
            </div>
          </div>

          <div className="space-y-1">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
              Direct Inquiries
            </span>
            <div className="flex items-center gap-2 pt-1">
              <Mail className="w-4 h-4 text-blue-600 shrink-0" />
              <a
                href="mailto:edworld.eden@gmail.com"
                className="text-xs font-semibold text-white hover:underline"
              >
                edworld.eden@gmail.com
              </a>
            </div>
          </div>

          <div className="text-left md:text-right">
            <Link
              href="/contact"
              className="liquid-btn-secondary inline-flex items-center gap-2 px-4 py-2.5 text-xs font-semibold cursor-pointer"
            >
              <span>Visit Contact Office</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* 5. CALL TO ACTION */}
      <section className="tactile-chassis bg-[#0C101A] border border-white/10 text-white bg-slate-900/90 text-white p-8 sm:p-12 text-center space-y-6 shadow-2xl max-w-4xl mx-auto">
        <div className="max-w-xl mx-auto space-y-2">
          <span className="liquid-pill text-xs font-semibold px-2.5 py-0.5 bg-blue-500/20 text-blue-300 border-blue-400/30">
            Start Free Today
          </span>
          <h2 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
            Ready to Accelerate Your Career?
          </h2>
          <p className="text-xs sm:text-sm text-slate-300">
            Create your account in seconds to build ATS resumes, take AI mock interviews, and access verified peer networking.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          <Link
            href="/auth/signup"
            onClick={triggerConfetti}
            className="liquid-btn-primary px-6 py-3 font-semibold text-xs flex items-center gap-2 shadow-md cursor-pointer"
          >
            <Sparkles className="w-4 h-4 text-amber-300" />
            <span>Create Free Account</span>
            <ArrowRight className="w-4 h-4 text-white" />
          </Link>

          <Link
            href="/pricing"
            className="liquid-pill px-6 py-3 bg-white/10 hover:bg-white/20 text-white font-semibold text-xs border-white/20 transition-all cursor-pointer"
          >
            View Student &amp; Pro Plans
          </Link>
        </div>
      </section>

    </div>
  );
}
