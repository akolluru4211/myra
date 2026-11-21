"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useAuth } from "@/lib/auth-context";
import AuthGuard from "@/components/auth/AuthGuard";
import { 
  Compass, 
  Target, 
  ArrowLeft, 
  CheckCircle2, 
  Circle, 
  Sparkles, 
  Calendar, 
  ChevronRight, 
  Check, 
  Layers, 
  Zap, 
  Award,
  RefreshCw,
  ExternalLink,
  BookOpen,
  Filter
} from "lucide-react";
import { 
  CareerRoadmapData, 
  RoadmapMilestone, 
  TARGET_ROLE_OPTIONS 
} from "@/lib/career/roadmap-generator";

export const dynamic = "force-dynamic";

export default function CareerRoadmapPage() {
  const { user, profile } = useAuth();

  const [roadmap, setRoadmap] = useState<CareerRoadmapData | null>(null);
  const [selectedRole, setSelectedRole] = useState<string>(TARGET_ROLE_OPTIONS[0]);
  const [activeHorizon, setActiveHorizon] = useState<"1_year" | "3_year" | "5_year">("1_year");
  const [filterMode, setFilterMode] = useState<"all" | "pending" | "completed">("all");
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [targetRolesList, setTargetRolesList] = useState<string[]>(TARGET_ROLE_OPTIONS);

  // Load existing roadmap on mount
  useEffect(() => {
    const fetchRoadmap = async () => {
      try {
        const userId = user?.uid || "guest";
        const res = await fetch(`/api/career/roadmap?userId=${userId}`);
        const data = await res.json();
        if (data.success) {
          if (data.roadmap) {
            setRoadmap(data.roadmap);
            setSelectedRole(data.roadmap.targetRole || TARGET_ROLE_OPTIONS[0]);
          }
          if (data.targetRoles) {
            setTargetRolesList(data.targetRoles);
          }
        }
      } catch (err) {
        console.error("Failed to fetch roadmap:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchRoadmap();
  }, [user]);

  const handleGenerate = async (roleToUse?: string) => {
    const targetRole = roleToUse || selectedRole;
    setGenerating(true);

    try {
      const res = await fetch("/api/career/roadmap", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: user?.uid || "guest",
          targetRole,
          currentLevel: profile?.interests?.[0]?.effectiveLevel || 1,
          academicYear: (profile as any)?.academicYear || "Pre-Final Year B.Tech",
        }),
      });

      const data = await res.json();
      if (data.success && data.roadmap) {
        setRoadmap(data.roadmap);
      }
    } catch (err) {
      console.error("Failed to synthesize roadmap:", err);
    } finally {
      setGenerating(false);
    }
  };

  const handleToggleMilestone = async (milestoneId: string, currentStatus: boolean) => {
    if (!roadmap) return;

    // Optimistically update
    const nextStatus = !currentStatus;
    const updatedMilestones = (roadmap.milestones || []).map((m: RoadmapMilestone) =>
      m.id === milestoneId ? { ...m, isCompleted: nextStatus } : m
    );

    setRoadmap({ ...roadmap, milestones: updatedMilestones });

    try {
      await fetch("/api/career/roadmap/progress", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: user?.uid || "guest",
          milestoneId,
          isCompleted: nextStatus,
        }),
      });
    } catch (err) {
      console.warn("Failed to persist milestone toggle:", err);
    }
  };

  // Filter milestones by active horizon & filter mode
  const allMilestones: RoadmapMilestone[] = roadmap?.milestones || [];
  const currentMilestones = allMilestones.filter((m: RoadmapMilestone) => m.horizon === activeHorizon);

  const filteredMilestones = currentMilestones.filter((m: RoadmapMilestone) => {
    if (filterMode === "pending") return !m.isCompleted;
    if (filterMode === "completed") return m.isCompleted;
    return true;
  });

  const completedCount = allMilestones.filter((m: RoadmapMilestone) => m.isCompleted).length;
  const progressPercent = allMilestones.length > 0 
    ? Math.round((completedCount / allMilestones.length) * 100) 
    : 0;

  return (
    <AuthGuard>
      <div className="min-h-screen text-slate-900 font-sans pb-24">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 space-y-6 animate-in fade-in">
          
          {/* Top Breadcrumb */}
          <div className="flex items-center justify-between">
            <Link
              href="/career"
              className="text-xs font-semibold text-slate-500 hover:text-slate-900 flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back to Career OS</span>
            </Link>

            <div className="flex items-center gap-2">
              <span className="liquid-pill px-2.5 py-0.5 text-[10px] font-semibold bg-white/70 text-slate-600 border-white/80">
                Multi-Horizon Timeline
              </span>
              <span className="liquid-pill px-2.5 py-0.5 text-[10px] font-semibold bg-blue-500/10 text-blue-700 border-blue-500/20">
                AI Structured
              </span>
            </div>
          </div>

          {/* Hero Header */}
          <div className="p-6 sm:p-8 liquid-glass-card space-y-4">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="liquid-pill text-xs font-semibold px-2.5 py-0.5 bg-blue-500/10 text-blue-700 border-blue-500/20 flex items-center gap-1.5">
                <Compass className="w-3.5 h-3.5 text-blue-600" />
                Strategic Engineering Trajectory
              </span>
              <span className="text-xs text-slate-500 font-medium">
                1Y • 3Y • 5Y Multi-Horizon Blueprint
              </span>
            </div>
            
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
                  AI Career Roadmap
                </h1>
                <p className="text-xs sm:text-sm text-slate-600 max-w-2xl mt-1 leading-relaxed">
                  Synthesize an actionable 1-year, 3-year, and 5-year technical blueprint from your academic standing and target company aspirations. Track milestones month-by-month.
                </p>
              </div>

              {/* Target Track Selector Form */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 shrink-0">
                <select
                  value={selectedRole}
                  onChange={(e) => setSelectedRole(e.target.value)}
                  className="liquid-input px-3.5 py-2 text-xs font-medium cursor-pointer"
                >
                  {targetRolesList.map((role) => (
                    <option key={role} value={role}>{role}</option>
                  ))}
                </select>

                <button
                  type="button"
                  onClick={() => handleGenerate()}
                  disabled={generating}
                  className="liquid-btn-primary px-4 py-2 text-xs font-semibold flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50 shadow-sm"
                >
                  {generating ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin text-white" />
                      <span>Synthesizing...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                      <span>Generate Roadmap</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Overall Progress Status Bar */}
            {roadmap && (
              <div className="pt-4 border-t border-slate-200/60 grid grid-cols-1 sm:grid-cols-12 gap-4 items-center">
                <div className="sm:col-span-8 space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-slate-900">
                      Overall Milestone Completion
                    </span>
                    <span className="font-semibold text-blue-600">
                      {completedCount} of {allMilestones.length} Done ({progressPercent}%)
                    </span>
                  </div>
                  <div className="w-full h-2 rounded-full bg-slate-200/70 overflow-hidden p-0.5 border border-white/60">
                    <div 
                      className="h-full bg-blue-600 transition-all duration-500 rounded-full"
                      style={{ width: `${progressPercent}%` }}
                    />
                  </div>
                </div>

                <div className="sm:col-span-4 flex items-center justify-end gap-2 text-xs text-slate-500">
                  <span className="font-semibold text-slate-900">Target:</span>
                  <span className="truncate">{roadmap.targetRole}</span>
                </div>
              </div>
            )}
          </div>

          {/* Loading State */}
          {loading && (
            <div className="p-16 text-center space-y-3">
              <div className="w-7 h-7 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto" />
              <p className="text-xs font-medium text-slate-500">Retrieving career milestones...</p>
            </div>
          )}

          {/* Empty State */}
          {!loading && !roadmap && (
            <div className="p-12 liquid-glass-card text-center space-y-4">
              <div className="w-12 h-12 rounded-xl bg-slate-500/10 flex items-center justify-center mx-auto text-slate-500 border border-slate-200">
                <Target className="w-6 h-6" />
              </div>
              <div className="space-y-1">
                <h3 className="text-sm font-bold text-slate-900">No Roadmap Generated Yet</h3>
                <p className="text-xs text-slate-600 max-w-sm mx-auto">
                  Select your target engineering specialty above and click &ldquo;Generate Roadmap&rdquo; to build your tailored 1, 3, and 5-year milestones.
                </p>
              </div>
              <button
                type="button"
                onClick={() => handleGenerate()}
                className="liquid-btn-primary px-4 py-2 text-xs font-semibold shadow-sm cursor-pointer"
              >
                Generate First Roadmap
              </button>
            </div>
          )}

          {/* Active Roadmap View */}
          {!loading && roadmap && (
            <div className="space-y-6">
              
              {/* Strategic Horizon Switcher (1 Year vs 3 Years vs 5 Years) */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 border-b border-slate-200/60 pb-4">
                <div className="flex items-center gap-2 overflow-x-auto no-scrollbar">
                  {[
                    { id: "1_year", label: "1-Year Horizon", sub: "Foundation & Proof-of-Work" },
                    { id: "3_year", label: "3-Year Horizon", sub: "Industry Placement & Scaling" },
                    { id: "5_year", label: "5-Year Horizon", sub: "Senior & Architectural Lead" },
                  ].map((tab) => (
                    <button
                      key={tab.id}
                      type="button"
                      onClick={() => setActiveHorizon(tab.id as any)}
                      className={`liquid-glass-card px-4 py-2.5 text-left transition-all cursor-pointer ${
                        activeHorizon === tab.id
                          ? "bg-slate-900 text-white border-slate-900 shadow-md ring-1 ring-slate-900"
                          : "hover:bg-white/90 text-slate-700"
                      }`}
                    >
                      <div className="text-xs font-bold">{tab.label}</div>
                      <div className={`text-[10px] ${activeHorizon === tab.id ? "text-slate-300" : "text-slate-500"}`}>
                        {tab.sub}
                      </div>
                    </button>
                  ))}
                </div>

                {/* Filter Pills (All vs Pending vs Completed) */}
                <div className="flex items-center gap-1 self-end sm:self-auto liquid-glass-card bg-white/70 p-1 rounded-xl shadow-xs">
                  {(["all", "pending", "completed"] as const).map((mode) => (
                    <button
                      key={mode}
                      type="button"
                      onClick={() => setFilterMode(mode)}
                      className={`liquid-pill px-3 py-1 text-[11px] font-semibold capitalize transition-all cursor-pointer ${
                        filterMode === mode
                          ? "bg-slate-900 text-white border-slate-900 shadow-xs"
                          : "bg-transparent text-slate-600 hover:text-slate-900 border-transparent shadow-none"
                      }`}
                    >
                      {mode}
                    </button>
                  ))}
                </div>
              </div>

              {/* Strategy Abstract Card */}
              <div className="p-4 rounded-xl liquid-glass-card bg-white/70 border-white/80 text-xs text-slate-900 leading-relaxed shadow-xs">
                <strong className="font-semibold text-blue-600">Horizon Focus:</strong> <span className="text-slate-600">{roadmap.summary}</span>
              </div>

              {/* Monthly Checklist Cards */}
              <div className="space-y-3">
                {filteredMilestones.length === 0 ? (
                  <div className="p-8 text-center text-xs text-slate-500 liquid-glass-card">
                    No milestones match the selected filter ({filterMode}).
                  </div>
                ) : (
                  filteredMilestones.map((m: RoadmapMilestone) => (
                    <div
                      key={m.id}
                      className={`p-5 liquid-glass-card transition-all ${
                        m.isCompleted
                          ? "bg-white/40 border-white/50 opacity-75"
                          : "hover:bg-white/90 shadow-xs"
                      }`}
                    >
                      <div className="flex items-start gap-3.5">
                        {/* Interactive Checkbox */}
                        <button
                          type="button"
                          onClick={() => handleToggleMilestone(m.id, m.isCompleted)}
                          className={`w-6 h-6 rounded-lg flex items-center justify-center border transition-all shrink-0 mt-0.5 cursor-pointer ${
                            m.isCompleted
                              ? "bg-emerald-600 border-emerald-600 text-white shadow-xs"
                              : "bg-white border-slate-300 hover:border-slate-500 text-transparent"
                          }`}
                        >
                          <Check className="w-3.5 h-3.5 stroke-[3]" />
                        </button>

                        <div className="flex-1 space-y-2">
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="liquid-pill px-2 py-0.5 text-[10px] font-semibold bg-white/70 text-slate-600 border-white/80">
                                {m.monthRangeLabel || `Month ${m.monthIndex}`}
                              </span>
                              <h3 className={`text-sm font-bold ${
                                m.isCompleted ? "line-through text-slate-400" : "text-slate-900"
                              }`}>
                                {m.title}
                              </h3>
                            </div>

                            {m.recommendedResource && (
                              <Link
                                href={m.recommendedResource.href}
                                className="text-[11px] font-semibold text-blue-600 hover:underline flex items-center gap-1 self-start sm:self-auto"
                              >
                                <span>{m.recommendedResource.title}</span>
                                <ExternalLink className="w-3 h-3" />
                              </Link>
                            )}
                          </div>

                          <p className={`text-xs leading-relaxed ${
                            m.isCompleted ? "text-slate-400" : "text-slate-600"
                          }`}>
                            {m.description}
                          </p>

                          {/* Skill Tags */}
                          {m.skillTags && m.skillTags.length > 0 && (
                            <div className="flex flex-wrap gap-1.5 pt-1">
                              {m.skillTags.map((tag: string) => (
                                <span
                                  key={tag}
                                  className="liquid-pill px-2 py-0.5 text-[10px] font-medium bg-white/70 text-slate-600 border-white/80"
                                >
                                  #{tag}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>

            </div>
          )}

        </div>
      </div>
    </AuthGuard>
  );
}
