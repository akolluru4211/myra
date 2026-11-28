"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  CheckCircle2,
  X,
  CreditCard,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  Zap,
  HelpCircle,
  Building2,
  GraduationCap,
  ChevronDown,
} from "lucide-react";
import confetti from "canvas-confetti";

export default function PricingPage() {
  const [billingCycle, setBillingCycle] = useState<"monthly" | "annual">("monthly");
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(null);

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

  const plans = [
    {
      id: "free",
      name: "Free Student Starter",
      priceInr: 0,
      period: "forever",
      description: "Essential foundational tools for interview practice and resume parsing.",
      badge: "Zero Cost",
      features: [
        "1 Single-Column ATS Vector Resume",
        "2 AI Mock Interviews / month",
        "Browse jobs and apply directly on employer sites",
        "Community Discord & Pod Access",
        "Basic STAR Rubric Feedback",
      ],
      ctaLabel: "Start For Free",
      ctaHref: "/auth/signup",
      isPopular: false,
    },
    {
      id: "pro",
      name: "EdPro Placement",
      priceInr: billingCycle === "monthly" ? 49 : 490,
      period: billingCycle === "monthly" ? "month" : "year",
      description: "Prepare a job-specific résumé, rehearse interviews, and keep your applications organized.",
      badge: "✦ Most Popular",
      features: [
        "Unlimited ATS Resumes & Job Tailoring",
        "Unlimited AI Voice & Video Mock Interviews",
        "Real-Time Waveform & Speech Cadence",
        "Application tracking and EdMail in one workspace",
        "Focus Lock Distraction Blocker",
        "Priority Recruiter Visibility Badge",
      ],
      ctaLabel: "Choose EdPro",
      ctaHref: "/settings/billing?plan=pro",
      isPopular: true,
    },
    {
      id: "institutional",
      name: "Universities & Campus",
      priceInr: null,
      period: "Custom Cohort",
      description: "End-to-end placement telemetry and cohort training for universities.",
      badge: "Campus Partner",
      features: [
        "TPO Placement Readiness Dashboard",
        "Campus-wide Mock Assessment Drives",
        "Bulk Student Calibrated Profiles",
        "Direct Corporate Partner Matchmaking",
        "Dedicated Placement Account Manager",
        "Custom College Domain Whitelisting",
      ],
      ctaLabel: "Contact Campus Team",
      ctaHref: "/for/colleges",
      isPopular: false,
    },
  ];

  const comparisonRows = [
    { feature: "Single-Column Vector ATS Resumes", free: "1 Resume", pro: "Unlimited", campus: "Unlimited" },
    { feature: "Job Description Keyword Matcher", free: "Basic Match", pro: "Deep Parser & Chips", campus: "Deep Parser & Chips" },
    { feature: "AI Mock Interviews (Voice + Video)", free: "2 / month", pro: "Unlimited", campus: "Unlimited" },
    { feature: "Speech Cadence & Filler-Word Counter", free: "✗", pro: "✓ (130-160 WPM Target)", campus: "✓ (130-160 WPM Target)" },
    { feature: "Direct employer Apply links", free: "Included", pro: "Included", campus: "Included" },
    { feature: "Focus Lock Distraction Blocker", free: "Standard", pro: "✓ Full Access", campus: "✓ Institutional Control" },
    { feature: "TPO Placement Analytics Portal", free: "✗", pro: "✗", campus: "✓ Real-Time Telemetry" },
    { feature: "Support SLA", free: "Community", pro: "Priority Email", campus: "Dedicated Account Manager" },
  ];

  const pricingFaqs = [
    {
      q: "Can I use EdWorld completely for free?",
      a: "Yes! Our Free Student Starter is ₹0 forever. It includes 1 vector ATS resume, 2 AI mock interviews every month, and complete access to the curated job board and community.",
    },
    {
      q: "How does EdPro billing work?",
      a: "EdPro Placement is ₹49 per month or ₹490 per year.",
    },
    {
      q: "Are there any hidden platform charges or lock-ins?",
      a: "Zero hidden charges. All prices include 18% GST. You can cancel your subscription anytime with a single click from your billing settings without questions or penalties.",
    },
    {
      q: "How do university licenses and TPO plans work?",
      a: "Colleges and training institutes can partner with EdWorld to provision batches of students. TPOs receive a dedicated analytics portal to track student readiness and conduct campus-wide screening rounds.",
    },
  ];

  return (
    <div className="w-full space-y-12 sm:space-y-16 font-sans text-black animate-in fade-in duration-200">
      
      {/* 1. HERO HEADER */}
      <section className="text-center max-w-3xl mx-auto space-y-4 pt-4">
        <div className="flex flex-wrap items-center justify-center gap-2">
          <span className="text-xs font-semibold px-3 py-1 bg-blue-50 text-blue-700 border border-blue-200 rounded-full font-display">
            Honest Student Pricing
          </span>
          <span className="text-xs font-medium px-3 py-1 bg-blue-50/50 text-slate-700 border border-blue-200 rounded-full font-mono">
            No Hidden Fees &bull; GST Included
          </span>
        </div>

        <h1 className="text-3xl sm:text-5xl font-black font-display text-black tracking-tight">
          Fair, predictable plans for every student.
        </h1>

        <p className="text-sm sm:text-base text-slate-700 leading-relaxed max-w-2xl mx-auto font-normal">
          Start completely free with foundational resume optimization and AI mock interviews. Upgrade to Career Pro for unlimited interview reps and production labs.
        </p>

        {/* Monthly / Annual Billing Toggle */}
        <div className="pt-4 flex items-center justify-center gap-2">
          <div className="inline-flex items-center gap-1.5 p-1.5 border-[#BFDBFE] border-b">
            <button
              onClick={() => setBillingCycle("monthly")}
              className={`px-4 py-2 text-xs font-semibold rounded-xl transition-all cursor-pointer ${
                billingCycle === "monthly"
                  ? "bg-[#2563EB] text-white font-bold shadow-sm"
                  : "bg-transparent text-slate-700 hover:text-black"
              }`}
            >
              Monthly Billing
            </button>
            
            <button
              onClick={() => setBillingCycle("annual")}
              className={`px-4 py-2 text-xs font-semibold rounded-xl transition-all cursor-pointer flex items-center gap-2 ${
                billingCycle === "annual"
                  ? "bg-[#2563EB] text-white font-bold shadow-sm"
                  : "bg-transparent text-slate-700 hover:text-black"
              }`}
            >
              <span>Annual Billing</span>
              <span className="px-1.5 py-0.5 bg-blue-100 text-blue-800 text-[10px] font-bold rounded-md border border-blue-200">
                Save ₹98
              </span>
            </button>
          </div>
        </div>
      </section>

      {/* 2. THREE PRICING TIERS */}
      <section aria-label="Placement workflow" className="mx-auto grid max-w-6xl gap-4 border-y border-blue-200 py-5 sm:grid-cols-2 lg:grid-cols-4">
        {[
          ["Find a role", "/jobs"],
          ["Prepare your résumé", "/resumes"],
          ["Track applications", "/profile/applied"],
          ["Check EdMail replies", "/edmail"],
        ].map(([label, href]) => (
          <Link key={href} href={href} className="flex items-center justify-between gap-2 px-2 py-2 text-sm font-semibold text-blue-900 hover:underline">
            {label}<ArrowRight size={16} aria-hidden="true" />
          </Link>
        ))}
      </section>
      <section className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-6xl mx-auto">
        {plans.map((p) => (
          <div
            key={p.id}
            className={`bg-[#EFF6FF] rounded-3xl p-6 sm:p-8 flex flex-col justify-between space-y-6 transition-all relative border border-[#BFDBFE] shadow-sm text-black ${
              p.isPopular
                ? "border-2 border-[#2563EB] ring-2 ring-blue-100"
                : "hover:border-blue-300"
            }`}
          >
            {p.isPopular && (
              <div className="absolute -top-3 right-6">
                <span className="px-3 py-1 bg-[#2563EB] text-white text-[11px] font-bold rounded-full shadow-sm border border-blue-300 font-display">
                  {p.badge}
                </span>
              </div>
            )}

            <div className="space-y-6">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-600 font-display">
                    {p.name}
                  </span>
                  {!p.isPopular && (
                    <span className="text-[11px] font-semibold px-2 py-0.5 bg-white text-slate-700 border border-blue-200 rounded-full">
                      {p.badge}
                    </span>
                  )}
                </div>

                <div className="flex items-baseline gap-1.5 pt-1">
                  <span className="text-4xl sm:text-5xl font-black font-display text-black tracking-tight">
                    {p.priceInr === null ? "Custom" : `₹${p.priceInr}`}
                  </span>
                  <span className="text-xs text-slate-600 font-medium">
                    / {p.period}
                  </span>
                </div>

                <p className="text-xs sm:text-sm text-slate-700 leading-relaxed pt-1">
                  {p.description}
                </p>
              </div>

              {/* Included Features List */}
              <div className="space-y-3 pt-4 border-t border-blue-200">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-600 block font-display">
                  Included Capabilities:
                </span>
                <div className="space-y-2.5">
                  {p.features.map((feat, idx) => (
                    <div key={idx} className="flex items-start gap-2.5 text-xs text-slate-800">
                      <CheckCircle2
                        className="w-4 h-4 shrink-0 mt-0.5 text-[#2563EB]"
                      />
                      <span className="leading-tight">{feat}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="pt-4 border-t border-blue-200">
              <Link
                href={p.ctaHref}
                onClick={p.isPopular ? triggerConfetti : undefined}
                className={`w-full py-3 text-xs font-bold text-center flex items-center justify-center gap-2 cursor-pointer rounded-xl transition-all ${
                  p.isPopular
                    ? "bg-[#2563EB] hover:bg-blue-700 text-white shadow-sm"
                    : "bg-[#DBEAFE] hover:bg-blue-200 border border-blue-200 text-[#1E40AF]"
                }`}
              >
                <span>{p.ctaLabel}</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        ))}
      </section>

      {/* 3. FEATURE COMPARISON MATRIX TABLE */}
      <section className="border-[#BFDBFE] p-6 sm:p-8 max-w-5xl mx-auto space-y-6 text-black border-b">
        <div className="space-y-1">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 bg-blue-100 text-blue-800 border border-blue-200 text-xs font-semibold rounded-full font-display">
            <Sparkles className="w-3.5 h-3.5 text-blue-600" />
            <span>Side-by-Side Entitlements</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-black font-display">
            Plan Feature Matrix
          </h2>
          <p className="text-xs sm:text-sm text-slate-600">
            Detailed breakdown of limits and capabilities across tiers.
          </p>
        </div>

        <div className="overflow-x-auto border-[#BFDBFE] border-b">
          <table className="w-full text-xs text-left">
            <thead>
              <tr className="bg-[#EFF6FF] border-b border-blue-200 text-black font-bold uppercase tracking-wider font-display">
                <th className="py-3.5 px-4">Feature</th>
                <th className="py-3.5 px-4">Free Starter</th>
                <th className="py-3.5 px-4 bg-blue-100 text-[#2563EB] font-bold">
                  Career Pro (₹49)
                </th>
                <th className="py-3.5 px-4">Campus Plan</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-blue-100">
              {comparisonRows.map((row, i) => (
                <tr key={i} className="hover:bg-blue-50/50 transition-colors">
                  <td className="py-3.5 px-4 font-semibold text-black">{row.feature}</td>
                  <td className="py-3.5 px-4 text-slate-700">{row.free}</td>
                  <td className="py-3.5 px-4 font-semibold text-[#2563EB] bg-blue-50/80">
                    {row.pro}
                  </td>
                  <td className="py-3.5 px-4 text-slate-700">{row.campus}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* 4. 100% TRANSPARENT BILLING GUARANTEE */}
      <section className="border-[#BFDBFE] p-6 sm:p-8 text-center space-y-3 max-w-4xl mx-auto text-black border-b">
        <div className="flex flex-wrap items-center justify-center gap-3 text-xs sm:text-sm font-bold text-black font-display">
          <span>✦ All prices inclusive of applicable GST (18%)</span>
          <span className="text-slate-400">&bull;</span>
          <span>Zero hidden platform surcharges</span>
          <span className="text-slate-400">&bull;</span>
          <span>1-Click self-service cancellation</span>
        </div>
        <p className="text-xs text-slate-600 max-w-xl mx-auto leading-relaxed">
          All paid tiers are backed by our transparent 7-Day Money-Back Guarantee. Subscriptions may be cancelled anytime with zero penalty. View our full{" "}
          <Link href="/terms" className="font-semibold underline text-[#2563EB] hover:text-blue-800">
            Terms of Learning
          </Link>.
        </p>
      </section>

      {/* 5. PRICING FAQS ACCORDION */}
      <section className="max-w-4xl mx-auto space-y-6">
        <div className="text-center space-y-1">
          <h2 className="text-2xl sm:text-3xl font-black text-black font-display">
            Pricing Questions &amp; Answers
          </h2>
          <p className="text-xs sm:text-sm text-slate-600">
            Everything you need to know about plans, billing, and cancellations.
          </p>
        </div>

        <div className="space-y-3">
          {pricingFaqs.map((faq, idx) => {
            const isOpen = openFaqIndex === idx;
            return (
              <div
                key={idx}
                className="bg-[#EFF6FF] border border-[#BFDBFE] rounded-2xl p-5 transition-all shadow-sm text-black"
              >
                <button
                  onClick={() => setOpenFaqIndex(isOpen ? null : idx)}
                  className="w-full flex items-center justify-between text-left gap-4 font-bold text-sm sm:text-base text-black cursor-pointer font-display"
                >
                  <span>{faq.q}</span>
                  <ChevronDown
                    className={`w-4 h-4 text-[#2563EB] transition-transform duration-200 shrink-0 ${
                      isOpen ? "rotate-180" : ""
                    }`}
                  />
                </button>
                {isOpen && (
                  <p className="text-xs sm:text-sm text-slate-700 leading-relaxed mt-3 pt-3 border-t border-blue-200 animate-in fade-in">
                    {faq.a}
                  </p>
                )}
              </div>
            );
          })}
        </div>
      </section>

    </div>
  );
}
