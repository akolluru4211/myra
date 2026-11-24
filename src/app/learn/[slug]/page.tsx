"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import {
  BookOpen,
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  Clock,
  Sparkles,
  Award,
  Layers,
  ChevronRight,
  Code2,
  Lock,
  ExternalLink,
  ShieldCheck,
  Check
} from "lucide-react";
import EdworldLogo from "@/components/ui/EdworldLogo";

interface CourseDetailData {
  slug: string;
  title: string;
  tagline: string;
  track: string;
  level: string;
  estimatedHours: number;
  prerequisites: string[];
  skills: string[];
  icon: string;
  color: string;
  modules: Array<{
    id: string;
    title: string;
    level: string;
    summary: string;
    lessons: Array<{
      id: string;
      title: string;
      level: string;
      estimatedMinutes: number;
      explanation: string;
    }>;
  }>;
  capstone: {
    id: string;
    title: string;
    scenario: string;
    deliverables: string[];
    rubric: Array<{ criterion: string; weight: number; description: string }>;
    passingScore: number;
  };
  userProgress?: {
    completed_lessons?: string[];
    current_lesson_id?: string;
    capstone_status?: string;
    capstone_grade?: any;
  };
}

export default function CourseOutlinePage() {
  const params = useParams();
  const slug = params?.slug as string;
  const router = useRouter();

  const [course, setCourse] = useState<CourseDetailData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchCourse() {
      if (!slug) return;
      try {
        setLoading(true);
        const res = await fetch(`/api/edlearn/courses/${slug}`);
        const data = await res.json();
        if (data.success && data.course) {
          setCourse(data.course);
        }
      } catch (err) {
        console.warn("Failed to load course detail:", err);
      } finally {
        setLoading(false);
      }
    }
    fetchCourse();
  }, [slug]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F4F5FA] flex items-center justify-center font-mono text-xs text-slate-400">
        Loading course curriculum and capstone requirements...
      </div>
    );
  }

  if (!course) {
    return (
      <div className="min-h-screen bg-[#F4F5FA] flex flex-col items-center justify-center p-6 text-center">
        <h2 className="text-xl font-bold text-slate-800">Course Not Found</h2>
        <Link href="/learn" className="mt-4 px-4 py-2 rounded-xl bg-[#5C59E8] text-white text-xs font-bold">
          Back to EdLearn Catalog
        </Link>
      </div>
    );
  }

  const completedSet = new Set(course.userProgress?.completed_lessons || []);
  const allLessons = course.modules.flatMap((m) => m.lessons);
  const totalLessons = allLessons.length;
  const completedCount = allLessons.filter((l) => completedSet.has(l.id)).length;
  const progressPercent = totalLessons > 0 ? Math.round((completedCount / totalLessons) * 100) : 0;
  const allLessonsCompleted = completedCount === totalLessons && totalLessons > 0;

  return (
    <div className="min-h-screen bg-[#F4F5FA] font-sans text-slate-800 pb-20">
      {/* Top Header */}
      <header className="bg-white border-b border-slate-200/80 sticky top-0 z-30 shadow-2xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/learn" className="p-1.5 rounded-xl hover:bg-slate-100 text-slate-600 transition-colors">
              <ArrowLeft className="w-4 h-4" />
            </Link>
            <div className="flex items-center gap-2">
              <span className="text-base font-black font-display text-slate-900">{course.title}</span>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 border border-slate-200">
                {course.track} Track
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Link
              href={`/learn/${course.slug}/${allLessons[0]?.id}`}
              className="px-4 py-2 rounded-xl bg-[#5C59E8] hover:bg-[#4E4BC6] text-white text-xs font-bold flex items-center gap-1.5 transition-all shadow-xs"
            >
              <span>{completedCount > 0 ? "Resume Workspace" : "Start First Lesson"}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-5xl mx-auto px-4 sm:px-6 pt-6 space-y-6">
        {/* Course Banner */}
        <div className="bg-white rounded-3xl border border-slate-200/80 p-6 sm:p-8 shadow-xs space-y-4">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <span className="text-[10px] font-mono font-bold uppercase tracking-wider px-2.5 py-1 rounded bg-indigo-50 text-[#5C59E8] border border-indigo-100">
              Interactive Practical Track
            </span>
            <div className="flex items-center gap-4 text-xs font-mono text-slate-500">
              <span className="flex items-center gap-1">
                <Clock className="w-3.5 h-3.5 text-[#5C59E8]" />
                {course.estimatedHours} hours
              </span>
              <span>•</span>
              <span>{totalLessons} Practical Lessons</span>
              <span>•</span>
              <span>1 Capstone Credential</span>
            </div>
          </div>

          <h1 className="text-2xl sm:text-3xl font-black font-display text-slate-900 tracking-tight">
            {course.title}
          </h1>
          <p className="text-sm text-slate-600 leading-relaxed max-w-3xl">
            {course.tagline}
          </p>

          {/* Progress Tracker */}
          <div className="pt-2 space-y-2">
            <div className="flex items-center justify-between text-xs font-mono">
              <span className="text-slate-500 font-bold">
                Overall Course Progress ({completedCount}/{totalLessons} Lessons)
              </span>
              <span className="font-bold text-[#5C59E8]">{progressPercent}% Completed</span>
            </div>
            <div className="w-full h-2 rounded-full bg-slate-100 overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-300"
                style={{ width: `${progressPercent}%`, backgroundColor: course.color }}
              />
            </div>
          </div>
        </div>

        {/* Module Outline & Lessons */}
        <div className="space-y-4">
          <h2 className="text-lg font-black font-display text-slate-900 flex items-center gap-2">
            <Layers className="w-5 h-5 text-[#5C59E8]" />
            <span>Course Modules &amp; Practice Tasks</span>
          </h2>

          <div className="space-y-4">
            {course.modules.map((mod, modIdx) => (
              <div
                key={mod.id}
                className="bg-white rounded-3xl border border-slate-200/80 p-5 sm:p-6 shadow-2xs space-y-4"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-mono font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-slate-100 text-slate-600">
                        Module {modIdx + 1} • {mod.level}
                      </span>
                    </div>
                    <h3 className="text-base font-bold text-slate-900 mt-1 font-display">
                      {mod.title}
                    </h3>
                    <p className="text-xs text-slate-500 mt-0.5">{mod.summary}</p>
                  </div>
                </div>

                {/* Lesson List */}
                <div className="divide-y divide-slate-100 border border-slate-100 rounded-2xl overflow-hidden">
                  {mod.lessons.map((lesson, lesIdx) => {
                    const isDone = completedSet.has(lesson.id);
                    return (
                      <Link
                        key={lesson.id}
                        href={`/learn/${course.slug}/${lesson.id}`}
                        className="p-3.5 sm:p-4 flex items-center justify-between gap-3 hover:bg-slate-50/80 transition-colors group cursor-pointer"
                      >
                        <div className="flex items-center gap-3">
                          <div
                            className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 text-xs font-bold font-mono transition-colors ${
                              isDone
                                ? "bg-emerald-500 text-white"
                                : "bg-slate-100 text-slate-500 group-hover:bg-indigo-50 group-hover:text-[#5C59E8]"
                            }`}
                          >
                            {isDone ? <Check className="w-3.5 h-3.5 stroke-[3]" /> : lesIdx + 1}
                          </div>
                          <div>
                            <div className="text-xs sm:text-sm font-bold text-slate-800 group-hover:text-[#5C59E8] transition-colors">
                              {lesson.title}
                            </div>
                            <div className="flex items-center gap-2 text-[10px] text-slate-400 font-mono mt-0.5">
                              <span>{lesson.estimatedMinutes} mins</span>
                              <span>•</span>
                              <span>Concept + Worked Example + Sandbox Practice</span>
                            </div>
                          </div>
                        </div>

                        <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-slate-600 transition-transform group-hover:translate-x-0.5" />
                      </Link>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Capstone Project Section */}
        <div className="bg-gradient-to-br from-indigo-950 via-slate-900 to-indigo-950 rounded-3xl p-6 sm:p-8 text-white shadow-lg space-y-4">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <span className="px-2.5 py-1 rounded-md text-[10px] font-mono font-bold uppercase tracking-wider bg-white/20 text-white backdrop-blur-xs flex items-center gap-1.5">
              <Award className="w-3.5 h-3.5 text-amber-300" />
              <span>Verifiable Credential Capstone</span>
            </span>
            <span className="text-xs font-mono text-indigo-200">
              Passing Threshold: {course.capstone.passingScore}%
            </span>
          </div>

          <h2 className="text-xl sm:text-2xl font-black font-display text-white">
            {course.capstone.title}
          </h2>
          <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
            {course.capstone.scenario}
          </p>

          {/* Deliverables List */}
          <div className="space-y-2 pt-2">
            <h4 className="text-xs font-bold text-white uppercase tracking-wider font-mono">
              Deliverables Required:
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-slate-300">
              {course.capstone.deliverables.map((del, idx) => (
                <div key={idx} className="p-2.5 rounded-xl bg-white/5 border border-white/10 flex items-start gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-indigo-400 shrink-0 mt-0.5" />
                  <span>{del}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Submission Gate & Action */}
          <div className="pt-4 border-t border-white/10 flex items-center justify-between flex-wrap gap-3">
            <div className="text-xs text-slate-300">
              {allLessonsCompleted ? (
                <span className="text-emerald-400 font-bold flex items-center gap-1">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  Prerequisites Complete: You are eligible to submit your capstone!
                </span>
              ) : (
                <span className="text-amber-300 flex items-center gap-1">
                  <Lock className="w-3.5 h-3.5 text-amber-300" />
                  Complete all {totalLessons} lessons to unlock capstone grading and certificate issuance.
                </span>
              )}
            </div>

            <Link
              href={`/learn/${course.slug}/${allLessons[0]?.id}`}
              className="px-5 py-2.5 rounded-2xl bg-white text-slate-900 hover:bg-slate-100 font-bold text-xs flex items-center gap-1.5 transition-all shadow-md active:scale-95 cursor-pointer"
            >
              <span>Go to Workspace</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}
