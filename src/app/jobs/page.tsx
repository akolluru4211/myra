"use client";

export const dynamic = "force-dynamic";

import React, { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { useAuth } from "@/lib/auth-context";
import { JobListing, JobType, JobSourceType, ResumeContent } from "@/lib/types";
import { supabase } from "@/lib/supabase";
import { CURATED_JOB_LISTINGS } from "@/lib/data/curated-jobs";
import { calculateJobMatch, JobMatchAnalysis } from "@/lib/services/job-match-scorer";
import { 
  Briefcase, 
  Search, 
  MapPin, 
  Sparkles, 
  ArrowRight, 
  Building2, 
  FileCheck,
  ExternalLink,
  ShieldCheck,
  CheckCircle2,
  Clock,
  Filter,
  AlertTriangle,
  SlidersHorizontal,
  ChevronDown
} from "lucide-react";
import Input from "@/components/ui/Input";
import AuthGuard from "@/components/auth/AuthGuard";

export default function JobBoardPage() {
  const { user, profile, isEmployer } = useAuth();
  const [jobs, setJobs] = useState<JobListing[]>([]);
  const [activeResume, setActiveResume] = useState<ResumeContent | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedType, setSelectedType] = useState<string>("all");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [selectedSource, setSelectedSource] = useState<string>("all");
  const [minMatchThreshold, setMinMatchThreshold] = useState<number>(0);
  const [sortByMatch, setSortByMatch] = useState(true);
  const [isLoading, setIsLoading] = useState(true);
  const [filtersOpen, setFiltersOpen] = useState(false);

  // 1. Load active resume content for match calibration
  useEffect(() => {
    try {
      const savedResumes = localStorage.getItem("edworld_resumes");
      if (savedResumes) {
        const parsed = JSON.parse(savedResumes);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setActiveResume(parsed[0].content || null);
        }
      }
    } catch (e) {
      console.warn("Failed to load resume for job match:", e);
    }
  }, [user]);

  // 2. Load jobs from Supabase or verified fallback
  useEffect(() => {
    const loadJobs = async () => {
      setIsLoading(true);
      try {
        const { data, error } = await supabase
          .from("jobs")
          .select("*")
          .eq("is_active", true)
          .eq("moderation_status", "approved");

        if (data && data.length > 0) {
          const mapped: JobListing[] = data.map((j) => ({
            id: j.id,
            title: j.title,
            company: j.company,
            description: j.description,
            location: j.location,
            type: j.type === "full_time" ? "full-time" : (j.type as JobType),
            skillsRequired: j.skills_required || [],
            postedBy: j.posted_by || "admin",
            applicationDeadline: j.application_deadline,
            createdAt: j.created_at,
            isActive: j.is_active,
            moderationStatus: j.moderation_status,
            salaryRange: j.salary_range,
            category: j.category,
            externalUrl: j.external_url,
            sourceNotes: j.source_notes,
            experienceLevel: j.experience_level,
            sourceType: (j.source_type || "admin_curated") as JobSourceType,
            sourceName: j.source_name || "Curated by Edworld",
            postedAt: j.posted_at || j.created_at,
            lastVerifiedAt: j.last_verified_at || j.created_at,
            isStale: j.is_stale ?? false,
            expiresAt: j.expires_at,
          }));
          setJobs(mapped);
          setIsLoading(false);
          return;
        }
      } catch (err) {
        console.warn("Failed to load jobs from Supabase:", err);
      }

      // Fallback to verified curated listings
      setJobs(CURATED_JOB_LISTINGS);
      setIsLoading(false);
    };

    loadJobs();
  }, []);

  const isAdult = user ? user.ageBand === "18+" : true;

  // 3. Compute authoritative match scores using shared JobMatchScorer
  const scoredJobs = useMemo(() => {
    return jobs.map((job) => {
      const match = calculateJobMatch(
        {
          id: job.id,
          title: job.title,
          description: job.description,
          skillsRequired: job.skillsRequired,
          experienceLevel: job.experienceLevel,
          category: job.category,
        },
        activeResume,
        profile
      );

      return {
        ...job,
        matchScore: match.score,
        matchAnalysis: match,
      };
    });
  }, [jobs, activeResume, profile]);

  // 4. Filter and sort
  const filteredJobs = useMemo(() => {
    return scoredJobs
      .filter((job) => {
        const isVisible = isAdult ? true : job.type === "internship";
        const matchesSearch =
          job.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
          job.company.toLowerCase().includes(searchTerm.toLowerCase()) ||
          (job.category && job.category.toLowerCase().includes(searchTerm.toLowerCase())) ||
          job.skillsRequired.some((s) => s.toLowerCase().includes(searchTerm.toLowerCase()));
        
        const matchesType = selectedType === "all" || job.type === selectedType;
        const matchesCategory = selectedCategory === "all" || (job.category && job.category.toLowerCase() === selectedCategory.toLowerCase());
        const matchesSource = selectedSource === "all" || job.sourceType === selectedSource;
        const matchesThreshold = (job.matchScore || 0) >= minMatchThreshold;
        
        return isVisible && matchesSearch && matchesType && matchesCategory && matchesSource && matchesThreshold;
      })
      .sort((a, b) => {
        if (sortByMatch) return (b.matchScore || 0) - (a.matchScore || 0);
        const dateA = new Date(a.postedAt || a.createdAt).getTime();
        const dateB = new Date(b.postedAt || b.createdAt).getTime();
        return dateB - dateA;
      });
  }, [scoredJobs, searchTerm, selectedType, selectedCategory, selectedSource, minMatchThreshold, sortByMatch, isAdult]);

  // Helper for source badge UI
  const renderSourceBadge = (job: JobListing) => {
    if (job.isStale) {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-rose-500/10 text-rose-300 border border-rose-500/20">
          <AlertTriangle className="w-3 h-3 text-rose-400" />
          <span>Verification pending</span>
        </span>
      );
    }

    switch (job.sourceType) {
      case "employer_posted":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-500/10 text-emerald-300 border border-emerald-500/20">
            <ShieldCheck className="w-3 h-3 text-emerald-400" />
            <span>Verified employer</span>
          </span>
        );
      case "aggregated_api":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-cyan-500/10 text-cyan-300 border border-cyan-500/20">
            <Building2 className="w-3 h-3 text-cyan-400" />
            <span>{job.sourceName || "Partner feed"}</span>
          </span>
        );
      case "admin_curated":
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-500/10 text-amber-300 border border-amber-500/20">
            <CheckCircle2 className="w-3 h-3 text-amber-400" />
            <span>Curated role</span>
          </span>
        );
    }
  };

  // Adult gate
  if (!isAdult && user) {
    return (
      <AuthGuard>
        <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center p-6 bg-transparent font-sans text-slate-900">
          <div className="max-w-md w-full bg-white rounded-3xl border border-slate-100/80 shadow-[0_10px_30px_rgba(80,90,130,0.06)] p-8 text-center space-y-6">
            <div className="w-14 h-14 rounded-2xl bg-[#EEF0FD] border border-indigo-100 text-[#5C59E8] flex items-center justify-center mx-auto shadow-xs">
              <Briefcase className="w-7 h-7 text-[#5C59E8]" />
            </div>
            <div className="space-y-2">
              <span className="px-3 py-1 rounded-full bg-slate-100 text-slate-600 text-xs font-medium border border-slate-200/80">
                {user.ageBand === "13-15" ? "Junior Track" : "Explorer Track"}
              </span>
              <h1 className="text-2xl font-bold tracking-tight text-slate-900 font-display">
                Job placement board is for verified adults (18+)
              </h1>
              <p className="text-xs text-slate-500 leading-relaxed font-normal">
                In compliance with labor safety regulations and child protection laws, minors are not permitted to view or apply for full-time jobs.
              </p>
            </div>
            <Link
              href="/dashboard"
              className="w-full py-3 px-4 rounded-xl font-bold text-xs bg-[#5C59E8] hover:bg-[#4E4AC8] text-white flex items-center justify-center gap-2 transition-all shadow-md shadow-indigo-500/20 cursor-pointer"
            >
              <span>Return to dashboard</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </AuthGuard>
    );
  }

  return (
    <AuthGuard>
      <div className="w-full text-slate-900 font-sans space-y-8 animate-in fade-in duration-300">
        {/* Header Bar */}
        <div className="p-6 sm:p-8 rounded-3xl bg-white border border-slate-100/80 shadow-[0_10px_30px_rgba(80,90,130,0.06)] flex flex-col md:flex-row items-start md:items-center justify-between gap-6 text-slate-900">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold bg-[#EEF0FD] text-[#5C59E8] border border-indigo-100 px-2.5 py-0.5 rounded-full font-display">
                  Career track (18+)
                </span>
                <span className="text-xs text-slate-500">Verified employer &amp; career opportunities</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-black font-display tracking-tight text-slate-900">
                Job &amp; internship board
              </h1>
              <p className="text-xs sm:text-sm text-slate-600 max-w-2xl leading-relaxed font-normal">
                Explore hand-curated engineering roles and verified tech opportunities.
              </p>
            </div>

            <div className="flex items-center flex-wrap gap-2.5 sm:gap-3">
              <Link
                href="/jobs/applications"
                className="px-4 py-2.5 rounded-xl bg-[#EEF0FD] hover:bg-[#E0E3FA] border border-indigo-100 text-[#4338CA] text-xs font-bold flex items-center gap-2 transition-all cursor-pointer shadow-xs"
              >
                <FileCheck className="w-4 h-4 text-[#5C59E8]" />
                <span>My Applications</span>
              </Link>

              {isEmployer && (
                <Link
                  href="/employer/dashboard"
                  className="px-4 py-2.5 rounded-xl bg-[#5C59E8] hover:bg-[#4E4AC8] text-white text-xs font-bold flex items-center gap-2 shadow-md shadow-indigo-500/20 transition-all cursor-pointer"
                >
                  <Building2 className="w-4 h-4 text-white" />
                  <span>Employer Studio</span>
                </Link>
              )}
            </div>
          </div>

          {/* Search & Filter Bar */}
          <div className="p-5 rounded-3xl bg-white border border-slate-100/80 shadow-[0_10px_30px_rgba(80,90,130,0.06)] space-y-4 text-slate-900">
            <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
              {/* Search Input */}
              <div className="flex-1">
                <Input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search by role title, company, category, or skill..."
                  icon={<Search className="w-4 h-4 text-slate-400" />}
                  className="py-2.5 text-xs sm:text-sm bg-slate-50 border-slate-200/80 text-slate-900 placeholder-slate-400 rounded-xl focus:ring-[#5C59E8]/20 focus:border-[#5C59E8]"
                />
              </div>

              {/* Sort Toggle & Filter Toggle Button */}
              <div className="flex items-center gap-2.5">
                <button
                  type="button"
                  onClick={() => setSortByMatch(!sortByMatch)}
                  className={`px-3.5 py-2.5 rounded-xl text-xs font-bold border transition-colors flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
                    sortByMatch
                      ? "bg-[#5C59E8] text-white border-transparent shadow-md shadow-indigo-500/20"
                      : "bg-slate-100 text-slate-600 border-slate-200/80 hover:text-slate-900 hover:border-slate-300"
                  }`}
                >
                  <Sparkles className="w-3.5 h-3.5 text-white" />
                  <span>Sort: {sortByMatch ? "Best Match" : "Most Recent"}</span>
                </button>

                <button
                  type="button"
                  onClick={() => setFiltersOpen(!filtersOpen)}
                  className="px-3.5 py-2.5 rounded-xl text-xs font-bold bg-slate-100 hover:bg-slate-200 border border-slate-200/80 text-slate-700 flex items-center gap-1.5 cursor-pointer transition-all"
                >
                  <SlidersHorizontal className="w-3.5 h-3.5 text-slate-500" />
                  <span>Filters {filtersOpen ? "▲" : "▼"}</span>
                </button>
              </div>
            </div>

            {/* Quick Filter Pills (Sector & Source) */}
            <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-slate-100">
              {/* Source Filters */}
              <div className="flex items-center gap-1.5 overflow-x-auto touch-scroll-x pb-1 sm:pb-0">
                <span className="text-xs font-medium text-slate-500 mr-1 hidden sm:inline">Source:</span>
                {[
                  { id: "all", label: "All Sourced" },
                  { id: "admin_curated", label: "Curated" },
                  { id: "employer_posted", label: "Verified Employers" },
                  { id: "aggregated_api", label: "Partner Feeds" },
                ].map((s) => (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => setSelectedSource(s.id)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors whitespace-nowrap cursor-pointer border ${
                      selectedSource === s.id
                        ? "bg-[#5C59E8] text-white font-bold border-[#5C59E8]"
                        : "bg-slate-50 text-slate-600 border-slate-200/80 hover:text-slate-900 hover:border-slate-300"
                    }`}
                  >
                    {s.label}
                  </button>
                ))}
              </div>

              {/* Match Threshold Filter */}
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-medium text-slate-500 hidden sm:inline">Min match:</span>
                {[0, 60, 75, 85].map((threshold) => (
                  <button
                    key={threshold}
                    type="button"
                    onClick={() => setMinMatchThreshold(threshold)}
                    className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-colors cursor-pointer border ${
                      minMatchThreshold === threshold
                        ? "bg-[#5C59E8] text-white font-bold border-[#5C59E8]"
                        : "bg-slate-50 text-slate-600 border-slate-200/80 hover:text-slate-900"
                    }`}
                  >
                    {threshold === 0 ? "All" : `${threshold}%+`}
                  </button>
                ))}
              </div>
            </div>

            {/* Collapsible Advanced Filters */}
            {filtersOpen && (
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 grid grid-cols-1 sm:grid-cols-2 gap-4 animate-in slide-in-from-top-2 duration-200">
                <div>
                  <label className="block text-xs font-bold text-slate-800 uppercase tracking-wider mb-1.5">
                    Job / Work Type
                  </label>
                  <div className="flex flex-wrap gap-1.5">
                    {[
                      { id: "all", label: "All Types" },
                      { id: "full-time", label: "Full-Time" },
                      { id: "internship", label: "Internships" },
                      { id: "contract", label: "Contract" },
                    ].map((t) => (
                      <button
                        key={t.id}
                        type="button"
                        onClick={() => setSelectedType(t.id)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-medium cursor-pointer border ${
                          selectedType === t.id
                            ? "bg-[#5C59E8] text-white font-bold border-[#5C59E8]"
                            : "bg-white text-slate-600 border-slate-200/80 hover:text-slate-900"
                        }`}
                      >
                        {t.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-800 uppercase tracking-wider mb-1.5">
                    Sector &amp; Industry
                  </label>
                  <div className="flex flex-wrap gap-1.5">
                    {[
                      { id: "all", label: "All Sectors" },
                      { id: "MNC", label: "Enterprise & MNCs" },
                      { id: "Startup", label: "High-Growth Startups" },
                      { id: "Education", label: "EdTech & Research" },
                    ].map((c) => (
                      <button
                        key={c.id}
                        type="button"
                        onClick={() => setSelectedCategory(c.id)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-medium cursor-pointer border ${
                          selectedCategory === c.id
                            ? "bg-[#5C59E8] text-white font-bold border-[#5C59E8]"
                            : "bg-white text-slate-600 border-slate-200/80 hover:text-slate-900"
                        }`}
                      >
                        {c.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Job Listings Grid */}
          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div key={i} className="p-7 rounded-3xl bg-white border border-slate-100/80 shadow-[0_10px_30px_rgba(80,90,130,0.06)] space-y-4 animate-pulse">
                  <div className="flex items-start justify-between">
                    <div className="w-12 h-12 rounded-xl bg-slate-100" />
                    <div className="w-20 h-6 rounded-md bg-slate-100" />
                  </div>
                  <div className="h-5 bg-slate-100 rounded w-3/4" />
                  <div className="h-3 bg-slate-100 rounded w-1/2" />
                  <div className="h-12 bg-slate-100 rounded w-full" />
                </div>
              ))}
            </div>
          ) : filteredJobs.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredJobs.map((job) => {
                const score = job.matchScore || 70;
                const matchAnalysis = job.matchAnalysis;

                return (
                  <div
                    key={job.id}
                    className="p-6 sm:p-7 rounded-3xl bg-white border border-slate-100/80 hover:border-slate-300 shadow-[0_10px_30px_rgba(80,90,130,0.06)] transition-all flex flex-col justify-between space-y-4 group text-slate-900"
                  >
                    <div className="space-y-3.5">
                      {/* Top Row: Avatar + Title + Match Badge */}
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-start gap-3">
                          <div className="w-11 h-11 rounded-xl bg-[#EEF0FD] text-[#5C59E8] font-bold text-lg flex items-center justify-center shrink-0 font-display">
                            {job.company.charAt(0)}
                          </div>
                          <div>
                            <h3 className="font-bold text-base text-slate-900 line-clamp-1 group-hover:text-[#5C59E8] transition-colors leading-snug font-display">
                              {job.title}
                            </h3>
                            <p className="text-xs text-slate-500 font-medium">{job.company}</p>
                          </div>
                        </div>

                        {/* Match Score Badge */}
                        <div className="text-right shrink-0">
                          <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold border ${
                            score >= 80
                              ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                              : score >= 60
                              ? "bg-amber-50 text-amber-700 border-amber-200"
                              : "bg-slate-50 text-slate-600 border-slate-200"
                          }`}>
                            <Sparkles className="w-3 h-3 text-[#5C59E8]" />
                            <span className="tabular-nums font-mono">{score}%</span>
                            <span>match</span>
                          </span>
                        </div>
                      </div>

                      {/* Source Provenance Badge */}
                      <div className="flex items-center gap-1.5 flex-wrap">
                        {renderSourceBadge(job)}
                        <span className="px-2.5 py-0.5 rounded-full text-xs font-medium capitalize bg-slate-50 text-slate-600 border border-slate-200/80">
                          {job.type}
                        </span>
                        {job.category && (
                          <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-50 text-slate-600 border border-slate-200/80">
                            {job.category}
                          </span>
                        )}
                      </div>

                      {/* Description */}
                      <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed">
                        {job.description}
                      </p>

                      {/* Match Analysis Breakdown Pill */}
                      {matchAnalysis && matchAnalysis.matchedSkills.length > 0 && (
                        <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200/80 text-xs space-y-1">
                          <div className="flex items-center justify-between text-slate-800 font-medium">
                            <span>Matched skills:</span>
                            <span className="text-[#5C59E8] font-bold text-xs tabular-nums font-mono">{matchAnalysis.matchedSkills.length} of {job.skillsRequired.length}</span>
                          </div>
                          <p className="text-xs text-slate-500 truncate">
                            {matchAnalysis.matchedSkills.slice(0, 3).join(", ")}
                            {matchAnalysis.missingSkills.length > 0 && ` (Need: ${matchAnalysis.missingSkills[0]})`}
                          </p>
                        </div>
                      )}

                      {/* Skills Tags */}
                      <div className="flex flex-wrap gap-1.5 pt-1">
                        {job.skillsRequired.slice(0, 3).map((skill, i) => (
                          <span
                            key={i}
                            className="px-2.5 py-0.5 rounded-full bg-slate-100 border border-slate-200/80 text-slate-700 text-xs"
                          >
                            {skill}
                          </span>
                        ))}
                        {job.skillsRequired.length > 3 && (
                          <span className="px-2 py-0.5 rounded-full bg-slate-100 border border-slate-200/80 text-slate-500 text-xs font-mono">
                            +{job.skillsRequired.length - 3}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Bottom Metadata & Actions */}
                    <div className="pt-4 border-t border-slate-100 flex items-center justify-between text-xs">
                      <div className="flex flex-col text-slate-500 gap-0.5">
                        <span className="flex items-center gap-1">
                          <MapPin className="w-3.5 h-3.5 text-slate-400" />
                          <span className="truncate max-w-[110px] font-medium text-slate-800">{job.location}</span>
                        </span>
                        {job.salaryRange && (
                          <span className="text-xs text-slate-500 truncate max-w-[140px] tabular-nums font-mono">
                            {job.salaryRange}
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-2">
                        {job.externalUrl && (
                          <a
                            href={job.externalUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            title="Apply on Official Portal"
                            className="p-2 rounded-xl border border-slate-200/80 hover:border-slate-400 text-slate-500 hover:text-slate-900 transition-colors bg-white shadow-2xs"
                          >
                            <ExternalLink className="w-4 h-4" />
                          </a>
                        )}
                        <Link
                          href={`/jobs/${job.id}`}
                          className="px-3.5 py-2 rounded-xl bg-[#5C59E8] hover:bg-[#4E4AC8] text-white font-bold text-xs flex items-center gap-1.5 transition-all shadow-md shadow-indigo-500/20 cursor-pointer"
                        >
                          <span>View Role</span>
                          <ArrowRight className="w-3.5 h-3.5" />
                        </Link>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="p-12 bg-white rounded-3xl border border-slate-100/80 text-center space-y-3 shadow-[0_10px_30px_rgba(80,90,130,0.06)]">
              <Briefcase className="w-10 h-10 text-slate-400 mx-auto" />
              <h3 className="text-base font-bold text-slate-900 font-display">No matching opportunities found</h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto font-normal">
                Try lowering your match threshold, adjusting your source filters, or clearing search keywords.
              </p>
              <button
                type="button"
                onClick={() => {
                  setSearchTerm("");
                  setSelectedType("all");
                  setSelectedCategory("all");
                  setSelectedSource("all");
                  setMinMatchThreshold(0);
                }}
                className="px-4 py-2 rounded-xl bg-[#5C59E8] hover:bg-[#4E4AC8] text-white font-bold text-xs mt-2 transition-all cursor-pointer shadow-md shadow-indigo-500/20 inline-flex items-center"
              >
                Reset All Filters
              </button>
            </div>
          )}
        </div>
      </AuthGuard>
    );
}
