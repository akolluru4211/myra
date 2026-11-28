"use client";

export const dynamic = "force-dynamic";

import React, { useState, useMemo } from "react";
import Link from "next/link";
import { 
  Search, 
  Filter, 
  X, 
  Sparkles, 
  Clock, 
  Layers, 
  ShieldCheck, 
  ArrowRight, 
  Check, 
  RotateCcw,
  Code2,
  ExternalLink,
  ChevronRight,
  Users,
  Award,
  Building2
} from "lucide-react";
import AuthGuard from "@/components/auth/AuthGuard";
import { useAuth } from "@/lib/auth-context";
import { 
  PROBLEM_STATEMENTS_DATA, 
  ProblemStatement, 
  ProblemDomain, 
  ProblemDifficulty 
} from "@/lib/projects/problem-statements-data";
import ProblemStatementDetailModal from "@/components/project/ProblemStatementDetailModal";

const ALL_DOMAINS: ("All" | ProblemDomain)[] = [
  "All",
  "Distributed Systems",
  "AI & Machine Learning",
  "Full-Stack Web",
  "DevOps & Cloud",
  "FinTech & Data",
];

const ALL_DIFFICULTIES: ("All" | ProblemDifficulty)[] = [
  "All",
  "Beginner",
  "Intermediate",
  "Advanced",
  "Industry Grade",
];

export default function ProjectStudioPage() {
  const { user, profile } = useAuth();

  // Search & Filter state
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedDomain, setSelectedDomain] = useState<"All" | ProblemDomain>("All");
  const [selectedDifficulty, setSelectedDifficulty] = useState<"All" | ProblemDifficulty>("All");
  const [selectedTech, setSelectedTech] = useState<string>("All");
  const [sponsorOnly, setSponsorOnly] = useState<boolean>(false);

  // Modal inspection state
  const [activeProblem, setActiveProblem] = useState<ProblemStatement | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Extract all unique tech stack tools across problems
  const availableTechStacks = useMemo(() => {
    const set = new Set<string>();
    PROBLEM_STATEMENTS_DATA.forEach((p) => p.techStack.forEach((t) => set.add(t)));
    return ["All", ...Array.from(set).sort()];
  }, []);

  // Filtered problems list
  const filteredProblems = useMemo(() => {
    return PROBLEM_STATEMENTS_DATA.filter((problem) => {
      // 1. Search query match
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase().trim();
        const matchesTitle = problem.title.toLowerCase().includes(query);
        const matchesSummary = problem.summary.toLowerCase().includes(query);
        const matchesStatement = problem.problemStatement.toLowerCase().includes(query);
        const matchesTech = problem.techStack.some((t) => t.toLowerCase().includes(query));
        const matchesIndustry = problem.industryRelevance.toLowerCase().includes(query);
        const matchesSponsor = problem.companySponsor?.name.toLowerCase().includes(query) || problem.companySponsor?.hiringTrack.toLowerCase().includes(query);

        if (!matchesTitle && !matchesSummary && !matchesStatement && !matchesTech && !matchesIndustry && !matchesSponsor) {
          return false;
        }
      }

      // 2. Domain filter
      if (selectedDomain !== "All" && problem.domain !== selectedDomain) {
        return false;
      }

      // 3. Difficulty filter
      if (selectedDifficulty !== "All" && problem.difficulty !== selectedDifficulty) {
        return false;
      }

      // 4. Tech stack filter
      if (selectedTech !== "All" && !problem.techStack.includes(selectedTech)) {
        return false;
      }

      // 5. Sponsored filter
      if (sponsorOnly && !problem.companySponsor) {
        return false;
      }

      return true;
    });
  }, [searchQuery, selectedDomain, selectedDifficulty, selectedTech, sponsorOnly]);

  const hasActiveFilters = searchQuery.trim() !== "" || selectedDomain !== "All" || selectedDifficulty !== "All" || selectedTech !== "All" || sponsorOnly;

  const handleResetFilters = () => {
    setSearchQuery("");
    setSelectedDomain("All");
    setSelectedDifficulty("All");
    setSelectedTech("All");
    setSponsorOnly(false);
  };

  const handleOpenProblem = (problem: ProblemStatement) => {
    setActiveProblem(problem);
    setIsModalOpen(true);
  };

  const handleOpenMyra = (customPrompt?: string) => {
    if (typeof window !== "undefined") {
      const prompt = customPrompt || "Can you recommend the highest-yield real-world engineering problem statement for my current academic level and target career role?";
      window.dispatchEvent(new CustomEvent("open-myra-copilot", { detail: { prompt } }));
    }
  };

  return (
    <AuthGuard>
      <div className="min-h-screen text-slate-100 font-sans pb-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 sm:pt-8 space-y-6 animate-in fade-in duration-200">
          
          {/* 1. HEADER */}
          <section className="edworld-blue-card tactile-chassis  border border-white/10 p-6 sm:p-8 flex flex-col md:flex-row md:items-center justify-between gap-5 shadow-xl rounded-2xl">
            <div className="space-y-1.5 max-w-3xl">
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-blue-500/15 text-blue-300 border border-blue-500/30">
                  Project Studio &bull; Capstone Track
                </span>
                <span className="text-xs text-slate-300 font-medium">Real-World Engineering Challenges</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-white font-display tracking-tight">
                Industry Problem Statements
              </h1>
              <p className="text-xs sm:text-sm text-slate-300 leading-relaxed font-normal">
                Filter and inspect real-world production engineering briefs. Build verifiable proof-of-work capstones tailored to high-tier software engineering, AI, and distributed systems roles.
              </p>
            </div>

            <div className="flex items-center gap-2.5 shrink-0">
              <button
                type="button"
                onClick={() => handleOpenMyra()}
                className="liquid-btn-primary text-xs font-semibold py-2.5 px-4 shadow-sm inline-flex items-center gap-2 cursor-pointer"
              >
                <Sparkles className="w-4 h-4 text-amber-300" />
                <span>Recommend with Myra</span>
              </button>
            </div>
          </section>

          {/* 2. TOP SEARCH & FILTER BAR */}
          <section className="edworld-blue-card tactile-chassis  border border-white/10 p-5 sm:p-6 space-y-4 shadow-lg rounded-2xl">
            
            {/* Primary Search Input */}
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search problem statements by keyword, technology, or scenario (e.g. Redis, RAG, Kafka, Rate Limiter)..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-9 py-2.5 text-xs sm:text-sm bg-[#0F1422] border border-white/15 text-white placeholder-slate-500 rounded-xl focus:outline-hidden focus:border-cyan-400 transition-colors"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery("")}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white p-1 cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            {/* Quick Domain Pills & Sponsored Filter Toggle */}
            <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-white/10">
              <div className="flex flex-wrap items-center gap-1.5 overflow-x-auto py-1">
                {ALL_DOMAINS.map((domain) => {
                  const isActive = selectedDomain === domain;
                  return (
                    <button
                      key={domain}
                      type="button"
                      onClick={() => setSelectedDomain(domain)}
                      className={`text-xs font-medium px-3 py-1.5 rounded-xl border transition-all cursor-pointer ${
                        isActive
                          ? "bg-indigo-600 text-white border-indigo-500 shadow-md shadow-indigo-500/25"
                          : "bg-[#0F1422] text-slate-300 hover:text-white hover:bg-white/10 border-white/10"
                      }`}
                    >
                      {domain}
                    </button>
                  );
                })}
              </div>

              <button
                type="button"
                onClick={() => setSponsorOnly(!sponsorOnly)}
                className={`text-xs font-semibold px-3 py-1.5 rounded-xl border transition-all inline-flex items-center gap-1.5 cursor-pointer shrink-0 ${
                  sponsorOnly
                    ? "bg-amber-500/20 text-amber-300 border-amber-500/40 shadow-xs"
                    : "bg-[#0F1422] text-slate-300 hover:text-white hover:bg-white/10 border-white/10"
                }`}
              >
                <Award className={`w-3.5 h-3.5 ${sponsorOnly ? "text-amber-400" : "text-slate-400"}`} />
                <span>Sponsored Challenges Only</span>
                {sponsorOnly && <Check className="w-3.5 h-3.5 text-amber-400" />}
              </button>
            </div>

            {/* Filter Dropdowns and Buttons Row */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-1">
              
              {/* Domain Filter */}
              <div>
                <label className="text-[11px] font-semibold text-slate-300 uppercase tracking-wider block mb-1">
                  Domain / Category
                </label>
                <select
                  value={selectedDomain}
                  onChange={(e) => setSelectedDomain(e.target.value as any)}
                  className="w-full px-3 py-2 text-xs cursor-pointer bg-[#0F1422] border border-white/15 text-white rounded-xl focus:outline-hidden focus:border-cyan-400 transition-colors"
                >
                  {ALL_DOMAINS.map((domain) => (
                    <option key={domain} value={domain} className="bg-[#0C101A] text-white">
                      {domain === "All" ? "All Domains" : domain}
                    </option>
                  ))}
                </select>
              </div>

              {/* Difficulty Filter */}
              <div>
                <label className="text-[11px] font-semibold text-slate-300 uppercase tracking-wider block mb-1">
                  Difficulty Level
                </label>
                <select
                  value={selectedDifficulty}
                  onChange={(e) => setSelectedDifficulty(e.target.value as any)}
                  className="w-full px-3 py-2 text-xs cursor-pointer bg-[#0F1422] border border-white/15 text-white rounded-xl focus:outline-hidden focus:border-cyan-400 transition-colors"
                >
                  {ALL_DIFFICULTIES.map((diff) => (
                    <option key={diff} value={diff} className="bg-[#0C101A] text-white">
                      {diff === "All" ? "All Difficulties" : diff}
                    </option>
                  ))}
                </select>
              </div>

              {/* Tech Stack Filter */}
              <div>
                <label className="text-[11px] font-semibold text-slate-300 uppercase tracking-wider block mb-1">
                  Specific Technology
                </label>
                <select
                  value={selectedTech}
                  onChange={(e) => setSelectedTech(e.target.value)}
                  className="w-full px-3 py-2 text-xs cursor-pointer bg-[#0F1422] border border-white/15 text-white rounded-xl focus:outline-hidden focus:border-cyan-400 transition-colors"
                >
                  {availableTechStacks.map((tech) => (
                    <option key={tech} value={tech} className="bg-[#0C101A] text-white">
                      {tech === "All" ? "All Technologies" : tech}
                    </option>
                  ))}
                </select>
              </div>

              {/* Reset Action */}
              <div className="flex items-end">
                <button
                  disabled={!hasActiveFilters}
                  onClick={handleResetFilters}
                  className={`w-full py-2 px-3 text-xs font-semibold rounded-xl border transition-colors inline-flex items-center justify-center gap-1.5 ${
                    hasActiveFilters
                      ? "liquid-btn-secondary cursor-pointer"
                      : "bg-[#0F1422] text-slate-500 border-white/5 cursor-not-allowed"
                  }`}
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Reset All Filters</span>
                </button>
              </div>
            </div>

            {/* Results Count and Active Filter Pills */}
            <div className="pt-3 border-t border-white/10 flex flex-wrap items-center justify-between gap-2.5 text-xs">
              <div className="text-slate-300">
                Showing <strong className="text-white font-bold">{filteredProblems.length}</strong> of{" "}
                {PROBLEM_STATEMENTS_DATA.length} problem statements
              </div>

              {hasActiveFilters && (
                <div className="flex flex-wrap items-center gap-1.5">
                  {selectedDomain !== "All" && (
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-[#0F1422] border border-white/10 text-slate-200 text-xs font-medium">
                      Domain: {selectedDomain}
                      <button onClick={() => setSelectedDomain("All")} className="hover:text-red-400 cursor-pointer">
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  )}
                  {selectedDifficulty !== "All" && (
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-[#0F1422] border border-white/10 text-slate-200 text-xs font-medium">
                      Level: {selectedDifficulty}
                      <button onClick={() => setSelectedDifficulty("All")} className="hover:text-red-400 cursor-pointer">
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  )}
                  {selectedTech !== "All" && (
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-[#0F1422] border border-white/10 text-slate-200 text-xs font-medium">
                      Tech: {selectedTech}
                      <button onClick={() => setSelectedTech("All")} className="hover:text-red-400 cursor-pointer">
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  )}
                  {sponsorOnly && (
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-amber-500/20 border border-amber-500/30 text-amber-300 text-xs font-semibold">
                      Sponsored Only
                      <button onClick={() => setSponsorOnly(false)} className="hover:text-red-400 cursor-pointer">
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  )}
                </div>
              )}
            </div>
          </section>

          {/* 3. PROBLEM STATEMENTS GRID */}
          <section className="space-y-4">
            {filteredProblems.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-5">
                {filteredProblems.map((problem) => {
                  const difficultyBadge = {
                    Beginner: "bg-emerald-500/20 text-emerald-300 border-emerald-500/30",
                    Intermediate: "bg-amber-500/20 text-amber-300 border-amber-500/30",
                    Advanced: "bg-blue-500/20 text-blue-300 border-blue-500/30",
                    "Industry Grade": "bg-indigo-500/20 text-indigo-300 border-indigo-500/30",
                  }[problem.difficulty] || "bg-white/10 text-slate-200 border-white/10";

                  return (
                    <div
                      key={problem.id}
                      className="tactile-chassis bg-[#0C101A] hover:bg-[#0F1424] border border-white/10 hover:border-white/20 p-6 transition-all flex flex-col justify-between space-y-4 group rounded-2xl shadow-md"
                    >
                      {/* Card Header Tags */}
                      <div className="space-y-3">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <div className="flex items-center gap-2">
                            <span className="text-[11px] font-semibold px-2 py-0.5 rounded-md bg-[#0F1422] border border-white/10 text-slate-300">
                              {problem.domain}
                            </span>
                            <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-md border ${difficultyBadge}`}>
                              {problem.difficulty}
                            </span>
                          </div>

                          <span className="text-xs text-slate-300 flex items-center gap-1 font-medium">
                            <Clock className="w-3.5 h-3.5 text-slate-400" />
                            {problem.timeEstimate}
                          </span>
                        </div>

                        {/* Company Sponsor Callout */}
                        {problem.companySponsor && (
                          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-500/10 border border-blue-500/20 text-xs text-slate-200">
                            <Award className="w-4 h-4 text-blue-400 shrink-0" />
                            <span className="font-bold text-white">{problem.companySponsor.name}</span>
                            <span className="text-slate-400">&bull;</span>
                            <span className="text-slate-300 truncate">{problem.companySponsor.hiringTrack}</span>
                          </div>
                        )}

                        {/* Title */}
                        <h2 className="text-base sm:text-lg font-bold text-white font-display leading-snug tracking-tight group-hover:text-cyan-300 transition-colors">
                          {problem.title}
                        </h2>

                        {/* Summary */}
                        <p className="text-xs text-slate-300 leading-relaxed line-clamp-3">
                          {problem.summary}
                        </p>
                      </div>

                      {/* Functional Snippets */}
                      <div className="pt-3 border-t border-white/10 space-y-2">
                        <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 block">
                          Key Deliverable Highlights:
                        </span>
                        <ul className="space-y-1">
                          {problem.functionalRequirements.slice(0, 2).map((req, rIdx) => (
                            <li key={rIdx} className="text-xs text-slate-300 flex items-start gap-1.5 line-clamp-1">
                              <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                              <span className="truncate">{req}</span>
                            </li>
                          ))}
                        </ul>
                      </div>

                      {/* Tech Stack Pills */}
                      <div className="flex flex-wrap gap-1.5 pt-1">
                        {problem.techStack.map((tech, tIdx) => (
                          <span
                            key={tIdx}
                            className="text-[10px] font-medium px-2 py-0.5 rounded-md bg-[#0F1422] border border-white/10 text-slate-300"
                          >
                            {tech}
                          </span>
                        ))}
                      </div>

                      {/* Action Buttons */}
                      <div className="pt-3 border-t border-white/10 flex flex-wrap items-center justify-between gap-2">
                        <Link
                          href={`/edbuild?problemId=${problem.id}&create=true`}
                          className="liquid-btn-secondary inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold cursor-pointer"
                        >
                          <Users className="w-3.5 h-3.5 text-blue-400" />
                          <span>Build in EdBuild</span>
                        </Link>

                        <button
                          onClick={() => handleOpenProblem(problem)}
                          className="liquid-btn-primary text-xs font-semibold py-2 px-4 inline-flex items-center gap-1.5 cursor-pointer shadow-sm"
                        >
                          <span>View Problem</span>
                          <ArrowRight className="w-3.5 h-3.5 text-white" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              /* Empty Search State */
              <div className="tactile-chassis bg-[#0C101A] border border-white/10 rounded-2xl p-10 text-center space-y-4">
                <div className="w-12 h-12 rounded-xl bg-white/5 border border-white/10 text-slate-400 flex items-center justify-center mx-auto">
                  <Search className="w-5 h-5" />
                </div>
                <h3 className="text-base font-bold text-white font-display">
                  No problem statements matched your search
                </h3>
                <p className="text-xs text-slate-300 max-w-md mx-auto leading-relaxed">
                  We could not find any problem statements matching &quot;{searchQuery}&quot; with the selected domain and difficulty filters.
                </p>
                <button
                  onClick={handleResetFilters}
                  className="mt-2 liquid-btn-primary inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold cursor-pointer"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Clear All Filters</span>
                </button>
              </div>
            )}
          </section>

          {/* 4. FOOTER GUIDANCE BANNER */}
          <section className="edworld-blue-card p-5 sm:p-6 tactile-chassis  border border-white/10 rounded-2xl text-xs text-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="flex items-center gap-2 text-slate-300">
              <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>All problem statements are calibrated to real-world production engineering architectures.</span>
            </div>
            <Link
              href="/dashboard"
              className="text-cyan-400 hover:text-cyan-300 font-semibold inline-flex items-center gap-1 shrink-0 transition-colors"
            >
              <span>Back to Dashboard</span>
              <ChevronRight className="w-4 h-4" />
            </Link>
          </section>

        </div>

        {/* 5. INTERACTIVE PROBLEM STATEMENT DETAIL MODAL */}
        <ProblemStatementDetailModal
          problem={activeProblem}
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          onOpenMyraWithPrompt={(prompt) => handleOpenMyra(prompt)}
        />
      </div>
    </AuthGuard>
  );
}
