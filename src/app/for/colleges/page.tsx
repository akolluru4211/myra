"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  GraduationCap,
  Building2,
  Users,
  Award,
  CheckCircle2,
  ArrowRight,
  Sparkles,
  BarChart3,
  ShieldCheck,
  Video,
  FileText,
  Terminal,
  Send,
} from "lucide-react";
import confetti from "canvas-confetti";

export default function ForCollegePage() {
  const [formData, setFormData] = useState({
    collegeName: "",
    contactName: "",
    role: "Placement Officer / TPO",
    email: "",
    phone: "",
    studentCount: "500-1000",
    message: "",
  });
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
    if (typeof window !== "undefined") {
      confetti({
        particleCount: 70,
        spread: 60,
        origin: { y: 0.8 },
        colors: ["#2563EB", "#10B981", "#F59E0B", "#6366F1"],
      });
    }
  };

  const institutionalPillars = [
    {
      icon: BarChart3,
      title: "TPO Placement Telemetry Dashboard",
      description:
        "Track cohort readiness in real time. Filter students by branch, CGPA, target tech stack, and STAR mock interview percentile before recruiters arrive on campus.",
      tag: "Live Analytics",
    },
    {
      icon: Video,
      title: "Campus-Wide Lockdown Mock Drives",
      description:
        "Run standardized mock assessment drives in true fullscreen lockdown mode. Spoken AI questions with tab-switch anti-cheat telemetry and instant scorecards.",
      tag: "Anti-Cheat Drives",
    },
    {
      icon: FileText,
      title: "Google X-Y-Z Resume Calibration",
      description:
        "Ensure zero resumes are discarded by corporate applicant tracking systems. Automated batch parsing, keyword scoring, and bullet point rewrites for all students.",
      tag: "ATS Standardizer",
    },
    {
      icon: Terminal,
      title: "Production Incident Engineering Labs",
      description:
        "Equip your computer science students with practical debugging experience. Hands-on labs simulate real PostgreSQL concurrency locks and memory leaks.",
      tag: "Applied Engineering",
    },
  ];

  const collegeSteps = [
    {
      step: "01",
      title: "Domain Whitelisting & Batch Onboarding",
      description:
        "Provide your college email domain (e.g. @college.edu.in). Students register with instant institutional SSO, immediately receiving full platform access.",
    },
    {
      step: "02",
      title: "Baseline Diagnostics & Skill Heatmaps",
      description:
        "Students complete baseline ATS resume reviews and technical mock interviews. TPO dashboard aggregates branch-wise strengths and knowledge gaps.",
    },
    {
      step: "03",
      title: "Corporate Matchmaking & Hiring Drives",
      description:
        "Share pre-screened, verified candidate shortlists with our corporate hiring partners, dramatically improving off-campus and on-campus conversion rates.",
    },
  ];

  return (
    <div className="w-full space-y-12 sm:space-y-16 font-sans text-slate-900 animate-in fade-in duration-200">
      
      {/* 1. HERO HEADER */}
      <section className="text-center max-w-3xl mx-auto space-y-4">
        <div className="flex flex-wrap items-center justify-center gap-2">
          <span className="liquid-pill text-xs font-semibold px-3 py-1 bg-blue-500/10 text-blue-700 border-blue-500/20">
            For Universities &amp; TPOs
          </span>
          <span className="liquid-pill text-xs font-medium px-3 py-1 bg-white/70 text-slate-600 border-white/80">
            Campus Placement Intelligence
          </span>
        </div>

        <h1 className="text-3xl sm:text-5xl font-extrabold text-slate-900 tracking-tight">
          Equip your campus cohorts with placement velocity.
        </h1>

        <p className="text-sm sm:text-base text-slate-600 leading-relaxed max-w-2xl mx-auto">
          EdWorld Co. partners with leading universities and training institutes to provide real-time cohort telemetry, automated lockdown mock drives, and Harvard-standard ATS resume verification.
        </p>

        {/* Trust Badges Strip */}
        <div className="pt-6 grid grid-cols-2 sm:grid-cols-4 gap-4 max-w-3xl mx-auto">
          <div className="p-4 liquid-glass-card shadow-xs">
            <div className="font-bold text-2xl text-slate-900">94.2%</div>
            <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Drive Shortlist Rate</div>
          </div>
          <div className="p-4 liquid-glass-card shadow-xs">
            <div className="font-bold text-2xl text-slate-900">100%</div>
            <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Lockdown Anti-Cheat</div>
          </div>
          <div className="p-4 liquid-glass-card shadow-xs">
            <div className="font-bold text-2xl text-slate-900">14,800+</div>
            <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Students Mentored</div>
          </div>
          <div className="p-4 liquid-glass-card shadow-xs">
            <div className="font-bold text-2xl text-slate-900">0-Friction</div>
            <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Domain Whitelisting</div>
          </div>
        </div>
      </section>

      {/* 2. INSTITUTIONAL PILLARS */}
      <section className="space-y-8">
        <div className="text-center space-y-2 max-w-2xl mx-auto">
          <span className="liquid-pill text-xs font-semibold px-3 py-1 bg-blue-500/10 text-blue-700 border-blue-500/20">
            Institutional Capabilities
          </span>
          <h2 className="text-2xl sm:text-3xl font-bold text-slate-900">
            Complete placement intelligence for TPOs.
          </h2>
          <p className="text-xs sm:text-sm text-slate-500">
            Move beyond messy spreadsheets. Track real engineering competencies across departments.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-5xl mx-auto">
          {institutionalPillars.map((pillar, idx) => {
            const Icon = pillar.icon;
            return (
              <div
                key={idx}
                className="liquid-glass-card hover:bg-white/90 p-6 sm:p-8 space-y-5 flex flex-col justify-between transition-all"
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="w-10 h-10 rounded-xl bg-blue-500/15 text-blue-600 flex items-center justify-center border border-blue-500/20">
                      <Icon className="w-5 h-5" />
                    </div>

                    <span className="liquid-pill text-[11px] font-semibold px-2.5 py-0.5 bg-white/70 text-slate-600 border-white/80">
                      {pillar.tag}
                    </span>
                  </div>

                  <h3 className="font-bold text-lg text-slate-900">
                    {pillar.title}
                  </h3>

                  <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                    {pillar.description}
                  </p>
                </div>

                <div className="pt-4 border-t border-slate-200/60 flex items-center gap-2 text-xs font-medium text-slate-900">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>Real-time TPO portal sync</span>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* 3. HOW CAMPUS PARTNERSHIP WORKS */}
      <section className="liquid-glass-card p-6 sm:p-10 shadow-xs max-w-5xl mx-auto space-y-8">
        <div className="text-center max-w-2xl mx-auto space-y-2">
          <span className="liquid-pill text-xs font-semibold px-3 py-1 bg-blue-500/10 text-blue-700 border-blue-500/20">
            Simple 3-Step Setup
          </span>
          <h2 className="text-2xl sm:text-3xl font-bold text-slate-900">
            How campus onboarding works.
          </h2>
          <p className="text-xs sm:text-sm text-slate-500">
            Zero hardware required. Full rollout across hundreds of students in under 48 hours.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {collegeSteps.map((s, idx) => (
            <div
              key={idx}
              className="rounded-xl liquid-glass-card bg-white/60 border-white/80 p-5 space-y-3"
            >
              <span className="w-8 h-8 rounded-lg bg-blue-500/15 text-blue-700 border border-blue-500/20 font-mono font-bold text-xs flex items-center justify-center">
                {s.step}
              </span>
              <h3 className="font-bold text-sm text-slate-900">
                {s.title}
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                {s.description}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* 4. CAMPUS DEMO REQUEST FORM */}
      <section className="max-w-2xl mx-auto">
        <div className="liquid-glass-card p-6 sm:p-8 shadow-xl space-y-6">
          <div className="text-center space-y-1">
            <span className="liquid-pill text-xs font-semibold px-3 py-1 bg-blue-500/10 text-blue-700 border-blue-500/20">
              Partner With EdWorld
            </span>
            <h2 className="text-2xl font-bold text-slate-900">
              Request an Institutional Campus Demo
            </h2>
            <p className="text-xs sm:text-sm text-slate-500">
              Speak directly with our university relations team to schedule a custom walkthrough for your faculty or placement cell.
            </p>
          </div>

          {submitted ? (
            <div className="p-6 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-center space-y-3">
              <CheckCircle2 className="w-8 h-8 text-emerald-600 mx-auto" />
              <h3 className="font-bold text-base text-emerald-950">
                Institutional Request Received!
              </h3>
              <p className="text-xs text-emerald-800 max-w-md mx-auto">
                Thank you, {formData.contactName}. Our University Placement Liaison will reach out to {formData.email} within 24 hours.
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-900">
                    College / University Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.collegeName}
                    onChange={(e) => setFormData({ ...formData, collegeName: e.target.value })}
                    placeholder="e.g. Osmania University College of Engg."
                    className="liquid-input w-full px-3.5 py-2.5 text-xs"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-900">
                    Contact Person Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.contactName}
                    onChange={(e) => setFormData({ ...formData, contactName: e.target.value })}
                    placeholder="e.g. Dr. Ramesh Kumar"
                    className="liquid-input w-full px-3.5 py-2.5 text-xs"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-900">
                    Official Institutional Email *
                  </label>
                  <input
                    type="email"
                    required
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="e.g. tpo@university.ac.in"
                    className="liquid-input w-full px-3.5 py-2.5 text-xs"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-900">
                    Contact Phone Number *
                  </label>
                  <input
                    type="tel"
                    required
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    placeholder="e.g. +91 98765 43210"
                    className="liquid-input w-full px-3.5 py-2.5 text-xs"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-900">
                    Your Designation
                  </label>
                  <select
                    value={formData.role}
                    onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                    className="liquid-input w-full px-3.5 py-2.5 text-xs cursor-pointer"
                  >
                    <option value="Placement Officer / TPO">Placement Officer / TPO</option>
                    <option value="Dean / Principal">Dean / Principal</option>
                    <option value="Department HOD">Department HOD</option>
                    <option value="Student Placement Coordinator">Student Placement Coordinator</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-900">
                    Expected Student Cohort Size
                  </label>
                  <select
                    value={formData.studentCount}
                    onChange={(e) => setFormData({ ...formData, studentCount: e.target.value })}
                    className="liquid-input w-full px-3.5 py-2.5 text-xs cursor-pointer"
                  >
                    <option value="100-500">100 – 500 Students</option>
                    <option value="500-1000">500 – 1,000 Students</option>
                    <option value="1000-3000">1,000 – 3,000 Students</option>
                    <option value="3000+">3,000+ Students</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-900">
                  Specific Requirements or Target Companies (Optional)
                </label>
                <textarea
                  rows={3}
                  value={formData.message}
                  onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                  placeholder="Tell us about your upcoming campus drives or specific focus areas (e.g. Fullstack, DSA, Core Engg)..."
                  className="liquid-input w-full px-3.5 py-2.5 text-xs"
                />
              </div>

              <button
                type="submit"
                className="liquid-btn-primary w-full py-3 text-xs font-semibold flex items-center justify-center gap-2 cursor-pointer shadow-md"
              >
                <Send className="w-4 h-4 text-white" />
                <span>Submit Campus Partnership Request</span>
              </button>
            </form>
          )}
        </div>
      </section>

    </div>
  );
}
