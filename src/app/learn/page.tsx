"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { 
  BookOpen, 
  Binary, 
  TrendingUp, 
  Database, 
  Sparkles, 
  ArrowRight, 
  CheckCircle2, 
  Clock, 
  Award, 
  Search, 
  Filter, 
  GraduationCap, 
  FileText, 
  ExternalLink,
  Flame,
  Zap,
  Code2,
  ChevronRight,
  ShieldCheck
} from "lucide-react";

interface EdLearnCatalogCourse {
  slug: string;
  title: string;
  tagline: string;
  track: "DSA" | "Aptitude" | "SQL";
  level: string;
  estimatedHours: number;
  prerequisites: string[];
  skills: string[];
  icon: string;
  color: string;
  totalModules: number;
  totalLessons: number;
  capstoneTitle: string;
  progress: {
    completedLessons: number;
    totalLessons: number;
    percentage: number;
    currentLessonId?: string;
    capstoneStatus: string;
    passed: boolean;
  };
}

export default function EdLearnHubPage() {
  const [courses, setCourses] = useState<EdLearnCatalogCourse[]>([]);
  const [selectedTrack, setSelectedTrack] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    async function loadCatalog() {
      try {
        setLoading(true);
        const res = await fetch("/api/edlearn/catalog");
        const data = await res.json();
        if (data.success && Array.isArray(data.courses)) {
          setCourses(data.courses);
        }
      } catch (err) {
        console.warn("Failed to load EdLearn catalog:", err);
      } finally {
        setLoading(false);
      }
    }
    loadCatalog();
  }, []);

  const filteredCourses = courses.filter((c) => {
    const matchesTrack = selectedTrack === "all" || c.track.toLowerCase() === selectedTrack.toLowerCase();
    const q = searchQuery.trim().toLowerCase();
    const matchesQuery =
      !q ||
      c.title.toLowerCase().includes(q) ||
      c.tagline.toLowerCase().includes(q) ||
      c.skills.some((s) => s.toLowerCase().includes(q));
    return matchesTrack && matchesQuery;
  });

  // Identify returning student active course
  const activeCourse = courses.find((c) => c.progress.percentage > 0 && !c.progress.passed) || courses[0];

  const getTrackIcon = (iconName: string) => {
    switch (iconName) {
      case "Binary":
        return <Binary className="w-5 h-5" />;
      case "TrendingUp":
        return <TrendingUp className="w-5 h-5" />;
      case "Database":
        return <Database className="w-5 h-5" />;
      default:
        return <BookOpen className="w-5 h-5" />;
    }
  };

  return (
    <div className="min-h-screen font-sans text-slate-800 pb-16">
      <nav aria-label="EdLearn navigation" className="flex justify-end border-b border-blue-100 py-2">

          <div className="flex items-center gap-2.5">
            <Link
              href="/learn/papers"
              className="flex items-center gap-1.5 px-2 py-2 text-sm font-medium text-blue-800 hover:underline"
            >
              <FileText className="w-3.5 h-3.5 text-[#2563EB]" />
              <span className="hidden sm:inline">Research Library</span>
              <span className="sm:hidden">Papers</span>
            </Link>

            <Link
              href="/dashboard"
              className="flex items-center gap-1.5 px-2 py-2 text-sm font-medium text-blue-800 hover:underline"
            >
              <span>Dashboard</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
      </nav>

      {/* Main Container */}
      <div className="w-full pt-6 space-y-6">
        {/* Hero Section */}
        <div className="border-b border-blue-100 pb-6 text-black">
          <div className="relative z-10 max-w-3xl space-y-3">

            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black font-display tracking-tight text-black leading-tight">
              Master High-Yield Industry Skills Through Active Practice
            </h1>
            <p className="text-xs sm:text-sm text-slate-700 leading-relaxed max-w-2xl">
              Zero fluff, hands-on engineering tracks. Learn each core concept in minutes, practice in isolated sandboxes with instant test feedback, get staged Myra hints, and prove your ability with an accredited capstone.
            </p>

            {/* Prominent "Continue Learning" Action for Returning Students */}
            {activeCourse && (
              <div className="pt-2 flex items-center gap-3 flex-wrap">
                <Link
                  href={`/learn/${activeCourse.slug}`}
                  className="px-5 py-2.5 rounded-2xl bg-[#2563EB] hover:bg-blue-700 text-white font-bold text-xs sm:text-sm flex items-center gap-2 transition-all shadow-sm active:scale-95 cursor-pointer"
                >
                  <Sparkles className="w-4 h-4 text-white" />
                  <span>
                    Continue {activeCourse.title} ({activeCourse.progress.percentage}% completed)
                  </span>
                  <ArrowRight className="w-4 h-4" />
                </Link>

                <div className="text-[11px] text-slate-600 font-mono">
                  Next Step: {activeCourse.progress.completedLessons}/{activeCourse.progress.totalLessons} lessons done
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Filter & Search Bar */}
        <div className="pb-3 border-blue-100 flex flex-col sm:flex-row items-center justify-between gap-3 border-b">
          {/* Track Filter Buttons */}
          <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0 scrollbar-none">
            {[
              { id: "all", label: "All Tracks" },
              { id: "dsa", label: "DSA" },
              { id: "aptitude", label: "Aptitude" },
              { id: "sql", label: "SQL" }
            ].map((track) => (
              <button
                key={track.id}
                type="button"
                onClick={() => setSelectedTrack(track.id)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                  selectedTrack === track.id
                    ? "bg-[#2563EB] text-white shadow-xs"
                    : "bg-slate-50 hover:bg-slate-100 text-slate-600 border border-blue-200/60"
                }`}
              >
                {track.label}
              </button>
            ))}
          </div>

          {/* Search Input */}
          <div className="relative w-full sm:w-64">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search concepts or skills..."
              className="w-full pl-8 pr-3 py-1.5 rounded-xl bg-slate-50 border border-blue-200 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-[#2563EB]"
            />
          </div>
        </div>

        {/* Course Catalog Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {loading ? (
            <div className="col-span-full py-16 text-center text-slate-400 font-mono text-xs">
              Loading EdLearn practical tracks...
            </div>
          ) : filteredCourses.length === 0 ? (
            <div className="col-span-full py-16 text-center text-slate-400 text-sm">
              No matching courses found.
            </div>
          ) : (
            filteredCourses.map((course) => (
              <div
                key={course.slug}
                className="group flex flex-col justify-between border-b border-blue-100 py-5"
              >
                <div className="space-y-4">
                  {/* Top Track & Level Badge */}
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-mono font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-slate-100 text-slate-700 border border-blue-200">
                      {course.track} Track
                    </span>
                    <span className="flex items-center gap-1 text-[11px] font-mono text-slate-500">
                      <Clock className="w-3 h-3 text-[#2563EB]" />
                      <span>{course.estimatedHours} hrs</span>
                    </span>
                  </div>

                  {/* Icon & Title */}
                  <div className="flex items-start gap-3">
                    <div 
                      className="w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 transition-transform group-hover:scale-105"
                      style={{ backgroundColor: `${course.color}15`, color: course.color }}
                    >
                      {getTrackIcon(course.icon)}
                    </div>
                    <div>
                      <h2 className="text-base font-black font-display text-slate-900 group-hover:text-[#2563EB] transition-colors leading-snug">
                        {course.title}
                      </h2>
                      <p className="text-xs text-slate-500 line-clamp-2 mt-1">
                        {course.tagline}
                      </p>
                    </div>
                  </div>

                  {/* Skills Tags */}
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {course.skills.slice(0, 4).map((skill, idx) => (
                      <span
                        key={idx}
                        className="text-[10px] px-2 py-0.5 rounded-md bg-slate-50 text-slate-600 border border-blue-200/60 font-medium"
                      >
                        {skill}
                      </span>
                    ))}
                    {course.skills.length > 4 && (
                      <span className="text-[10px] px-1.5 py-0.5 text-slate-400">
                        +{course.skills.length - 4} more
                      </span>
                    )}
                  </div>

                  {/* Capstone Preview */}
                  <div className="space-y-1 border-l-2 border-blue-200 pl-3">
                    <div className="flex items-center gap-1.5 text-[10px] font-bold text-[#2563EB] uppercase tracking-wider font-mono">
                      <Award className="w-3.5 h-3.5" />
                      <span>Capstone Credential</span>
                    </div>
                    <div className="text-xs font-bold text-slate-800 line-clamp-1">
                      {course.capstoneTitle}
                    </div>
                  </div>
                </div>

                {/* Bottom Progress & CTA */}
                <div className="pt-5 border-t border-blue-100 mt-5 space-y-3">
                  {/* Progress Bar */}
                  <div className="space-y-1">
                    <div className="flex items-center justify-between text-[11px] font-mono">
                      <span className="text-slate-500">
                        {course.progress.completedLessons}/{course.progress.totalLessons} Lessons
                      </span>
                      <span className="font-bold text-slate-700">
                        {course.progress.percentage}%
                      </span>
                    </div>
                    <div className="w-full h-1.5 rounded-full bg-slate-100 overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-300"
                        style={{
                          width: `${course.progress.percentage}%`,
                          backgroundColor: course.color,
                        }}
                      />
                    </div>
                  </div>

                  {/* Action Link */}
                  <Link
                    href={`/learn/${course.slug}`}
                    className="w-full py-2.5 rounded-2xl bg-slate-900 hover:bg-[#2563EB] text-white text-xs font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer shadow-2xs"
                  >
                    <span>{course.progress.percentage > 0 ? "Continue Course" : "Start Course"}</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
