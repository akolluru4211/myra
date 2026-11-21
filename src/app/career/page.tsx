"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  Compass,
  Award,
  Zap,
  Flame,
  CheckCircle2,
  Clock,
  ArrowRight,
  Sparkles,
  TrendingUp,
  Cpu,
  Layers,
  Terminal,
  ExternalLink,
  ShieldCheck,
  ChevronRight,
  ShieldAlert,
  Bell
} from "lucide-react";

export default function CareerOsPage() {
  const [activeQuarter, setActiveQuarter] = useState<number>(2);

  const radarMetrics = [
    { label: "Algorithms & DSA", candidate: 92, target: 85 },
    { label: "System Design", candidate: 78, target: 80 },
    { label: "STAR Communication", candidate: 88, target: 80 },
    { label: "Databases & Storage", candidate: 82, target: 75 },
    { label: "DevOps & CI/CD", candidate: 70, target: 75 },
  ];

  const milestones = [
    {
      q: 1,
      title: "Foundations & Algorithmic Patterns",
      status: "completed",
      badge: "Completed",
      description: "Mastered essential patterns: Sliding Window, Two Pointers, Dynamic Programming, and Graph Traversals.",
      tasks: ["45 Practice Drills Cleared", "Time/Space Complexity Profiling", "Zero-Code Visualizer Exercises"],
    },
    {
      q: 2,
      title: "High-Concurrency Distributed Systems",
      status: "active",
      badge: "Current Milestone • 85%",
      description: "Architecting resilient distributed primitives: Redis Sliding Windows, Idempotent Kafka Consumers, and Partition Pruning.",
      tasks: ["System Design & Distributed Labs", "Cache Stampede Prevention Drill", "Simulated Technical System Rounds"],
    },
    {
      q: 3,
      title: "Production Chaos & Security Drills",
      status: "upcoming",
      badge: "Upcoming Q3",
      description: "Mitigating race conditions, thread starvation, SQL deadlock resolution, and proactive client security.",
      tasks: ["Security Sentinel Labs", "Load Balancing Under P0 Latency Spike", "Microservice Failover Simulation"],
    },
    {
      q: 4,
      title: "Executive STAR & Staff Calibration",
      status: "upcoming",
      badge: "Upcoming Q4",
      description: "Calibrated engineering metrics: System Trade-Off Negotiations, STAR Incident Debriefs, and Architecture RFCs.",
      tasks: ["Executive Panel Simulation", "Live Whiteboard Defense", "Full-Scope Placement Verification"],
    },
  ];

  const studioProjects = [
    {
      id: "proj-1",
      title: "Distributed Rate Limiter with Sliding Window Counter",
      tags: ["Go", "Redis", "Docker", "gRPC"],
      xp: "+350 XP",
      difficulty: "Advanced",
      summary: "Engineer an in-memory token bucket rate limiter sustaining 50,000 req/sec with atomicity under split-brain network scenarios.",
      status: "Verified",
    },
    {
      id: "proj-2",
      title: "Real-Time Collaborative Code Editor with CRDTs",
      tags: ["TypeScript", "WebSockets", "CRDT (Yjs)", "React"],
      xp: "+400 XP",
      difficulty: "Intermediate",
      summary: "Build an operational conflict-free document editor supporting multi-cursor live synchronization and offline reconciliation.",
      status: "In Progress",
    },
    {
      id: "proj-3",
      title: "High-Throughput Kafka Event Bus with Idempotent Consumer",
      tags: ["Java / Spring", "Apache Kafka", "PostgreSQL"],
      xp: "+500 XP",
      difficulty: "Hard",
      summary: "Prevent duplicate financial transactions during network partitions using distributed deduplication tables and outbox patterns.",
      status: "Ready to Start",
    },
  ];

  return (
    <div className="space-y-8 animate-in fade-in duration-200 text-white font-sans pb-12">
      {/* Header Banner */}
      <div className="space-y-2.5 text-center max-w-3xl mx-auto pt-2">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-xs font-semibold">
          <Compass className="w-3.5 h-3.5 text-indigo-400" />
          <span>Career Operating System • Competency &amp; Milestones</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-black text-white tracking-tight font-display">
          Competency Roadmaps &amp; Career Calibration
        </h1>
        <p className="text-sm text-slate-400">
          Continuous skills tracking, milestone assessments, and verifiable engineering studios.
        </p>
      </div>

      {/* Level, XP & Streak Bento Banner */}
      <div className="tactile-chassis bg-[#0C101A] border border-white/10 p-6 rounded-3xl shadow-xl">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-center">
          {/* Level Card */}
          <div className="flex items-center gap-4 border-b md:border-b-0 md:border-r border-white/10 pb-4 md:pb-0 md:pr-6">
            <div className="w-12 h-12 rounded-2xl bg-indigo-500/15 border border-indigo-500/30 text-indigo-400 flex items-center justify-center shrink-0 shadow-md">
              <Award className="w-6 h-6 text-indigo-400" />
            </div>
            <div className="space-y-0.5">
              <div className="text-xs font-medium text-slate-400">Current Tier</div>
              <div className="text-lg font-bold text-white">Level 4 Scholar</div>
              <span className="inline-block text-xs font-semibold px-2 py-0.5 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400">
                Top 8th Percentile
              </span>
            </div>
          </div>

          {/* XP Progress */}
          <div className="space-y-1.5 border-b md:border-b-0 md:border-r border-white/10 pb-4 md:pb-0 md:pr-6">
            <div className="flex justify-between text-xs">
              <span className="font-medium text-slate-400">Experience Progress</span>
              <span className="font-semibold text-white tabular-nums">3,450 / 5,000 XP</span>
            </div>
            <div className="w-full h-2 bg-white/10 rounded-full overflow-hidden p-0.5 border border-white/10">
              <div className="h-full bg-gradient-to-r from-blue-600 to-indigo-600 rounded-full" style={{ width: "69%" }} />
            </div>
            <div className="text-xs text-slate-400 flex items-center justify-between">
              <span>+350 XP this week</span>
              <span className="text-indigo-400 font-medium">1,550 XP to Level 5</span>
            </div>
          </div>

          {/* Quick Shortcuts */}
          <div className="flex items-center justify-start md:justify-end gap-3">
            <Link
              href="/interviews"
              className="text-xs font-bold py-2 px-4 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white shadow-md shadow-indigo-500/20 inline-flex items-center gap-1.5 cursor-pointer transition-all"
            >
              <span>Mock Interview</span>
              <ArrowRight className="w-3.5 h-3.5 text-white" />
            </Link>
            <Link
              href="/resumes"
              className="text-xs font-semibold py-2 px-4 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-white cursor-pointer transition-all"
            >
              <span>ATS Resume</span>
            </Link>
          </div>
        </div>
      </div>

      {/* High-Impact Career Tools Banner */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Link
          href="/career/roadmap"
          className="p-5 tactile-chassis bg-[#0C101A] border border-white/10 hover:border-white/20 rounded-2xl transition-all group shadow-md space-y-2 block"
        >
          <div className="flex items-center justify-between">
            <div className="w-8 h-8 metallic-icon-badge metallic-indigo">
              <Compass className="w-4 h-4 stroke-[1.85]" />
            </div>
            <span className="text-[10px] font-mono font-bold uppercase px-2 py-0.5 rounded-full bg-white/5 border border-white/10 text-slate-400">
              1 / 3 / 5 Yr
            </span>
          </div>
          <h3 className="text-sm font-bold text-white group-hover:text-blue-400 transition-colors flex items-center gap-1 font-display">
            <span>AI Career Roadmap</span>
            <ChevronRight className="w-3.5 h-3.5 text-slate-400 group-hover:translate-x-0.5 transition-transform" />
          </h3>
          <p className="text-xs text-slate-400 leading-relaxed">
            Generate customized multi-horizon milestones, month-by-month checklists, and skill progression.
          </p>
        </Link>

        <Link
          href="/career/scam-checker"
          className="p-5 tactile-chassis bg-[#0C101A] border border-white/10 hover:border-white/20 rounded-2xl transition-all group shadow-md space-y-2 block"
        >
          <div className="flex items-center justify-between">
            <div className="w-8 h-8 metallic-icon-badge metallic-rose">
              <ShieldAlert className="w-4 h-4 stroke-[1.85]" />
            </div>
            <span className="text-[10px] font-mono font-bold uppercase px-2 py-0.5 rounded-full bg-rose-500/15 text-rose-400 border border-rose-500/25">
              Fraud Shield
            </span>
          </div>
          <h3 className="text-sm font-bold text-white group-hover:text-rose-400 transition-colors flex items-center gap-1 font-display">
            <span>Scam Offer Checker</span>
            <ChevronRight className="w-3.5 h-3.5 text-slate-400 group-hover:translate-x-0.5 transition-transform" />
          </h3>
          <p className="text-xs text-slate-400 leading-relaxed">
            Scan job offers or recruiter emails for fee extortion, fake domains, and unofficial communications.
          </p>
        </Link>

        <Link
          href="/settings/alerts"
          className="p-5 tactile-chassis bg-[#0C101A] border border-white/10 hover:border-white/20 rounded-2xl transition-all group shadow-md space-y-2 block"
        >
          <div className="flex items-center justify-between">
            <div className="w-8 h-8 metallic-icon-badge metallic-emerald">
              <Bell className="w-4 h-4 stroke-[1.85]" />
            </div>
            <span className="text-[10px] font-mono font-bold uppercase px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/25">
              Push Pings
            </span>
          </div>
          <h3 className="text-sm font-bold text-white group-hover:text-emerald-400 transition-colors flex items-center gap-1 font-display">
            <span>WhatsApp &amp; Telegram Alerts</span>
            <ChevronRight className="w-3.5 h-3.5 text-slate-400 group-hover:translate-x-0.5 transition-transform" />
          </h3>
          <p className="text-xs text-slate-400 leading-relaxed">
            Get instant opportunity pings, hackathons, and application deadlines filtered by your roles and cities.
          </p>
        </Link>
      </div>

      {/* Main Grid: Competency Radar vs Milestone Progression */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Radar & Competencies */}
        <div className="lg:col-span-5 tactile-chassis bg-[#0C101A] border border-white/10 p-6 rounded-3xl shadow-xl space-y-5">
          <div>
            <h2 className="text-base font-bold text-white font-display">
              Competency Radar &amp; Calibration
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Benchmarked against campus placement standards
            </p>
          </div>

          {/* Metric Bars */}
          <div className="space-y-3.5 pt-2">
            {radarMetrics.map((m) => (
              <div key={m.label} className="space-y-1 text-xs">
                <div className="flex justify-between">
                  <span className="font-medium text-white">{m.label}</span>
                  <span className="font-semibold text-white">
                    {m.candidate}% <span className="text-slate-400 font-normal">/ target {m.target}%</span>
                  </span>
                </div>
                <div className="w-full h-2 bg-white/10 rounded-full overflow-hidden p-0.5 border border-white/10">
                  <div
                    className={`h-full rounded-full transition-all duration-300 ${
                      m.candidate >= m.target ? "bg-indigo-500 shadow-sm" : "bg-amber-500"
                    }`}
                    style={{ width: `${m.candidate}%` }}
                  />
                </div>
              </div>
            ))}
          </div>

          <div className="p-4 rounded-2xl bg-[#0F1422] border border-white/10 text-xs text-slate-300 space-y-1">
            <div className="font-semibold text-white flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
              <span>Myra AI Calibration Insight</span>
            </div>
            <p className="leading-relaxed text-slate-400">
              Your algorithmic problem solving exceeds the benchmark. Focus on distributed systems and incident mitigations to optimize your placement readiness.
            </p>
          </div>
        </div>

        {/* Milestone Quarter Tabs & Roadmaps */}
        <div className="lg:col-span-7 tactile-chassis bg-[#0C101A] border border-white/10 p-6 rounded-3xl shadow-xl space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h2 className="text-base font-bold text-white font-display">
                Milestone Roadmap
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Structured path toward engineering placement readiness
              </p>
            </div>

            {/* Quarter Pill Selector */}
            <div className="flex items-center gap-1 bg-[#0F1422] p-1 rounded-xl border border-white/10">
              {[1, 2, 3, 4].map((q) => (
                <button
                  key={q}
                  type="button"
                  onClick={() => setActiveQuarter(q)}
                  className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                    activeQuarter === q
                      ? "bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-sm"
                      : "text-slate-400 hover:text-white"
                  }`}
                >
                  Q{q}
                </button>
              ))}
            </div>
          </div>

          {/* Active Milestone Card */}
          {milestones
            .filter((m) => m.q === activeQuarter)
            .map((m) => (
              <div key={m.q} className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-base font-bold text-white">{m.title}</h3>
                  <span
                    className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full border ${
                      m.status === "completed"
                        ? "bg-emerald-500/15 text-emerald-400 border-emerald-500/25"
                        : m.status === "active"
                        ? "bg-indigo-500/15 text-indigo-400 border-indigo-500/25"
                        : "bg-white/5 text-slate-400 border-white/10"
                    }`}
                  >
                    {m.badge}
                  </span>
                </div>

                <p className="text-xs text-slate-400 leading-relaxed">
                  {m.description}
                </p>

                <div className="space-y-2 pt-2 border-t border-white/10">
                  <div className="text-xs font-semibold text-white">Verification Checkpoints:</div>
                  <div className="space-y-1.5">
                    {m.tasks.map((task, idx) => (
                      <div key={idx} className="flex items-center gap-2 text-xs text-slate-300">
                        <CheckCircle2
                          className={`w-3.5 h-3.5 shrink-0 ${
                            m.status === "completed" || (m.status === "active" && idx === 0)
                              ? "text-emerald-400"
                              : "text-slate-600"
                          }`}
                        />
                        <span>{task}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ))}
        </div>
      </div>

      {/* Proof-of-Work Projects Studio */}
      <div className="space-y-4">
        <div>
          <h2 className="text-xl font-black text-white">Proof-of-Work Project Studios</h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Production-grade systems projects designed to demonstrate engineering rigor.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {studioProjects.map((proj) => (
            <div
              key={proj.id}
              className="tactile-chassis bg-[#0C101A] border border-white/10 hover:border-white/20 p-6 rounded-3xl flex flex-col justify-between transition-all group shadow-xl"
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-white/5 border border-white/10 text-slate-400">
                    {proj.difficulty}
                  </span>
                  <span className="text-xs font-bold text-indigo-400">{proj.xp}</span>
                </div>
                <h3 className="font-bold text-sm text-white leading-snug group-hover:text-blue-400 transition-colors">{proj.title}</h3>
                <p className="text-xs text-slate-400 leading-relaxed">{proj.summary}</p>
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {proj.tags.map((t) => (
                    <span key={t} className="px-2 py-0.5 rounded-full text-slate-300 text-[10px] bg-white/5 border border-white/10">
                      {t}
                    </span>
                  ))}
                </div>
              </div>

              <div className="pt-4 mt-4 border-t border-white/10 flex items-center justify-between">
                <span className="text-[11px] font-medium text-white">{proj.status}</span>
                <Link
                  href="/projects"
                  className="inline-flex items-center gap-1 text-xs font-semibold text-indigo-400 hover:text-indigo-300"
                >
                  <span>Open Lab</span>
                  <ArrowRight className="w-3.5 h-3.5 text-indigo-400" />
                </Link>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
