"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft,
  ArrowRight,
  Sparkles,
  Play,
  RotateCcw,
  CheckCircle2,
  XCircle,
  HelpCircle,
  BookOpen,
  Code2,
  ChevronRight,
  ExternalLink,
  Award,
  Lightbulb,
  FileText,
  MessageSquare
} from "lucide-react";
import EdworldLogo from "@/components/ui/EdworldLogo";
import { VerifiableCertificateModal, CertificateData } from "@/components/learn/VerifiableCertificateModal";

export default function LessonWorkspacePage() {
  const params = useParams();
  const slug = (params?.slug as string)?.toLowerCase();
  const lessonId = params?.lessonId as string;
  const router = useRouter();

  const [course, setCourse] = useState<any>(null);
  const [activeLesson, setActiveLesson] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Student editor & execution state
  const [codeAnswer, setCodeAnswer] = useState("");
  const [evaluating, setEvaluating] = useState(false);
  const [execResult, setExecResult] = useState<any>(null);
  const [completedLessons, setCompletedLessons] = useState<string[]>([]);

  // Myra Tutoring State
  const [hintLevel, setHintLevel] = useState(1);
  const [tutorReply, setTutorReply] = useState<string | null>(null);
  const [tutorLoading, setTutorLoading] = useState(false);

  // Mobile View Switcher Tab ("lesson" | "editor" | "feedback" | "hints")
  const [mobileTab, setMobileTab] = useState<"lesson" | "editor" | "feedback" | "hints">("editor");

  // Capstone Modal & Certificate State
  const [capstoneOpen, setCapstoneOpen] = useState(false);
  const [capstoneCode, setCapstoneCode] = useState("");
  const [complexityText, setComplexityText] = useState("");
  const [capstoneResult, setCapstoneResult] = useState<any>(null);
  const [certificateData, setCertificateData] = useState<CertificateData | null>(null);

  useEffect(() => {
    async function loadData() {
      if (!slug) return;
      try {
        setLoading(true);
        const res = await fetch(`/api/edlearn/courses/${slug}`);
        const data = await res.json();
        if (data.success && data.course) {
          setCourse(data.course);
          setCompletedLessons(data.course.userProgress?.completed_lessons || []);

          // Find current lesson
          let target = null;
          for (const m of data.course.modules) {
            for (const l of m.lessons) {
              if (l.id === lessonId) {
                target = l;
                break;
              }
            }
            if (target) break;
          }

          if (target) {
            setActiveLesson(target);
            setCodeAnswer(target.practiceTask.starterCode || "");
          }
        }
      } catch (err) {
        console.warn("Could not load lesson data:", err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [slug, lessonId]);

  // Handle Practice Run / Submission
  const handleRunPractice = async () => {
    if (!activeLesson) return;
    try {
      setEvaluating(true);
      setExecResult(null);

      const res = await fetch("/api/edlearn/practice/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          courseSlug: slug,
          lessonId: activeLesson.id,
          codeOrAnswer: codeAnswer,
        }),
      });

      const data = await res.json();
      setExecResult(data);
      if (data.passed) {
        setCompletedLessons((prev) => Array.from(new Set([...prev, activeLesson.id])));
      }
      setMobileTab("feedback");
    } catch (err) {
      console.warn("Practice run error:", err);
    } finally {
      setEvaluating(false);
    }
  };

  // Call Myra Tutor Actions
  const handleAskMyra = async (actionType: "give_hint" | "explain_mistake" | "suggest_next") => {
    try {
      setTutorLoading(true);
      setTutorReply(null);

      const res = await fetch("/api/edlearn/tutor", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          actionType,
          courseSlug: slug,
          lessonId: activeLesson?.id,
          currentAttempt: codeAnswer,
          hintLevel,
        }),
      });

      const data = await res.json();
      if (data.success) {
        setTutorReply(data.reply);
        if (actionType === "give_hint") {
          setHintLevel((prev) => prev + 1);
        }
        setMobileTab("hints");
      }
    } catch (err) {
      console.warn("Myra tutor error:", err);
    } finally {
      setTutorLoading(false);
    }
  };

  // Submit Capstone Project
  const handleSubmitCapstone = async () => {
    try {
      setEvaluating(true);
      setCapstoneResult(null);

      const res = await fetch("/api/edlearn/capstones/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          courseSlug: slug,
          submissionTextOrCode: capstoneCode,
          complexityExplanation: complexityText,
          studentName: "Adarsh",
        }),
      });

      const data = await res.json();
      setCapstoneResult(data);

      if (data.passed && data.certificateCode) {
        setCertificateData({
          id: data.certificate?.id || data.certificateCode,
          certificate_code: data.certificateCode,
          recipient_name: "Adarsh",
          course_title: course.title,
          course_category: course.track,
          score_percentage: data.score,
          verification_hash: "verified-hash-key",
          issued_at: new Date().toISOString(),
        });
      }
    } catch (err) {
      console.warn("Capstone submit error:", err);
    } finally {
      setEvaluating(false);
    }
  };

  if (loading || !activeLesson || !course) {
    return (
      <div className="min-h-screen bg-[#F4F5FA] flex items-center justify-center font-mono text-xs text-slate-400">
        Loading lesson workspace and sandbox environment...
      </div>
    );
  }

  // Next / Prev lesson navigation
  const allLessons = course.modules.flatMap((m: any) => m.lessons);
  const currentIdx = allLessons.findIndex((l: any) => l.id === activeLesson.id);
  const prevLesson = currentIdx > 0 ? allLessons[currentIdx - 1] : null;
  const nextLesson = currentIdx < allLessons.length - 1 ? allLessons[currentIdx + 1] : null;

  return (
    <div className="min-h-screen bg-[#F4F5FA] font-sans text-slate-800 flex flex-col">
      {/* Workspace Top Header */}
      <header className="bg-white border-b border-slate-200/80 px-4 sm:px-6 py-3 flex items-center justify-between shrink-0 shadow-2xs">
        <div className="flex items-center gap-3">
          <Link
            href={`/learn/${course.slug}`}
            className="p-1.5 rounded-xl hover:bg-slate-100 text-slate-600 transition-colors"
            title="Back to Course Outline"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div className="flex items-center gap-2">
            <span className="text-sm sm:text-base font-black font-display text-slate-900 line-clamp-1">
              {activeLesson.title}
            </span>
            <span className="text-[10px] font-mono font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-slate-100 text-slate-600 hidden sm:inline-block">
              {activeLesson.level}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Capstone Button Trigger */}
          <button
            type="button"
            onClick={() => setCapstoneOpen(true)}
            className="px-3 py-1.5 rounded-xl bg-amber-50 hover:bg-amber-100/80 border border-amber-200 text-amber-900 text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer shadow-2xs"
          >
            <Award className="w-3.5 h-3.5 text-amber-600" />
            <span className="hidden sm:inline">Capstone &amp; Certificate</span>
            <span className="sm:hidden">Capstone</span>
          </button>

          {/* Next Lesson Link */}
          {nextLesson && (
            <Link
              href={`/learn/${course.slug}/${nextLesson.id}`}
              className="px-3.5 py-1.5 rounded-xl bg-[#5C59E8] hover:bg-[#4E4BC6] text-white text-xs font-bold flex items-center gap-1 transition-all shadow-xs"
            >
              <span className="hidden sm:inline">Next Lesson</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          )}
        </div>
      </header>

      {/* Mobile Tab Switcher */}
      <div className="lg:hidden bg-white border-b border-slate-200 px-2 py-1.5 flex items-center justify-around text-xs font-bold select-none">
        {[
          { id: "lesson", label: "Explanation" },
          { id: "editor", label: "Editor" },
          { id: "feedback", label: "Feedback" },
          { id: "hints", label: "Myra Hints" },
        ].map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setMobileTab(tab.id as any)}
            className={`px-3 py-1 rounded-lg transition-colors ${
              mobileTab === tab.id
                ? "bg-[#5C59E8] text-white shadow-xs"
                : "text-slate-600 hover:bg-slate-100"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Workspace Grid Layout */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 overflow-hidden">
        {/* Left Column: Short Explanation & Worked Example */}
        <div
          className={`lg:col-span-5 border-r border-slate-200/80 bg-white p-5 sm:p-6 overflow-y-auto space-y-5 ${
            mobileTab !== "lesson" ? "hidden lg:block" : "block"
          }`}
        >
          {/* Concept Explanation */}
          <div className="space-y-2">
            <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-[#5C59E8] bg-indigo-50 px-2 py-0.5 rounded">
              Concept Breakdown
            </span>
            <h2 className="text-lg font-black font-display text-slate-900">
              {activeLesson.title}
            </h2>
            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
              {activeLesson.explanation}
            </p>
          </div>

          {/* Worked Example */}
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-2.5">
            <div className="flex items-center gap-1.5 text-xs font-bold text-slate-900 font-display">
              <Lightbulb className="w-4 h-4 text-amber-500" />
              <span>Worked Example: {activeLesson.workedExample.title}</span>
            </div>
            <p className="text-xs text-slate-600">
              {activeLesson.workedExample.description}
            </p>
            {activeLesson.workedExample.codeSnippet && (
              <pre className="p-3 rounded-xl bg-slate-900 text-slate-100 font-mono text-[11px] overflow-x-auto leading-relaxed border border-slate-800">
                <code>{activeLesson.workedExample.codeSnippet}</code>
              </pre>
            )}
            <p className="text-[11px] text-slate-500 italic">
              Key Note: {activeLesson.workedExample.explanation}
            </p>
          </div>

          {/* Practice Task Prompt */}
          <div className="p-4 rounded-2xl bg-indigo-50/50 border border-indigo-100 space-y-2">
            <div className="flex items-center gap-1.5 text-xs font-bold text-[#5C59E8] font-mono uppercase tracking-wider">
              <Code2 className="w-4 h-4" />
              <span>Practice Task</span>
            </div>
            <p className="text-xs sm:text-sm font-medium text-slate-800 leading-relaxed">
              {activeLesson.practiceTask.prompt}
            </p>
          </div>
        </div>

        {/* Right Column: Code/Query Editor, Sandboxed Output & Myra Tutor */}
        <div className="lg:col-span-7 flex flex-col bg-slate-900 text-slate-100 overflow-hidden">
          {/* Editor Header & Myra Actions Bar */}
          <div className="bg-slate-950 px-4 py-2.5 border-b border-slate-800 flex items-center justify-between flex-wrap gap-2">
            <div className="flex items-center gap-2 text-xs font-mono text-slate-400">
              <Code2 className="w-4 h-4 text-[#5C59E8]" />
              <span>Practice Workspace ({course.track})</span>
            </div>

            {/* Myra Quick Actions */}
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => handleAskMyra("give_hint")}
                disabled={tutorLoading}
                className="px-2.5 py-1 rounded-lg bg-indigo-900/60 hover:bg-indigo-800 text-indigo-300 border border-indigo-700/50 text-[11px] font-bold flex items-center gap-1 transition-all cursor-pointer"
              >
                <Sparkles className="w-3 h-3 text-cyan-400" />
                <span>Give Me a Hint</span>
              </button>
              <button
                type="button"
                onClick={() => handleAskMyra("explain_mistake")}
                disabled={tutorLoading}
                className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-[11px] font-bold flex items-center gap-1 transition-all cursor-pointer"
              >
                <span>Explain Mistake</span>
              </button>
            </div>
          </div>

          {/* Code Textarea Area */}
          <div className={`flex-1 p-4 ${mobileTab === "lesson" || mobileTab === "hints" ? "hidden lg:block" : "block"}`}>
            <textarea
              value={codeAnswer}
              onChange={(e) => setCodeAnswer(e.target.value)}
              placeholder="Write your solution here..."
              rows={12}
              className="w-full h-full bg-slate-950 font-mono text-xs sm:text-sm text-emerald-300 p-4 rounded-xl border border-slate-800 focus:outline-none focus:border-indigo-500 leading-relaxed resize-none"
              spellCheck={false}
            />
          </div>

          {/* Evaluation Bar & Run Button */}
          <div className="bg-slate-950 px-4 py-3 border-t border-slate-800 flex items-center justify-between shrink-0">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setCodeAnswer(activeLesson.practiceTask.starterCode || "")}
                className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs flex items-center gap-1"
                title="Reset Starter Code"
              >
                <RotateCcw className="w-3.5 h-3.5" />
              </button>
            </div>

            <button
              type="button"
              onClick={handleRunPractice}
              disabled={evaluating}
              className="px-5 py-2 rounded-xl bg-[#5C59E8] hover:bg-[#4E4BC6] text-white font-bold text-xs flex items-center gap-2 transition-all cursor-pointer shadow-md active:scale-95 disabled:opacity-50"
            >
              <Play className="w-3.5 h-3.5 fill-current" />
              <span>{evaluating ? "Evaluating..." : "Run Tests & Verify"}</span>
            </button>
          </div>

          {/* Sandboxed Test Output & Feedback Drawer */}
          {execResult && (
            <div
              className={`p-4 bg-slate-950 border-t border-slate-800 space-y-2 max-h-48 overflow-y-auto ${
                mobileTab === "feedback" ? "block" : "hidden lg:block"
              }`}
            >
              <div className="flex items-center justify-between text-xs font-mono">
                <span className={execResult.passed ? "text-emerald-400 font-bold" : "text-rose-400 font-bold"}>
                  {execResult.passed ? "✔ Tests Passed!" : "✖ Tests Failed"} ({execResult.testsPassed}/{execResult.totalTests})
                </span>
                <span className="text-slate-400 text-[10px]">{execResult.executionTimeMs}ms</span>
              </div>

              {execResult.mistakeFeedback && (
                <div className="p-2.5 rounded-lg bg-amber-950/40 border border-amber-800/60 text-amber-200 text-xs space-y-1">
                  <div className="font-bold flex items-center gap-1">
                    <Lightbulb className="w-3.5 h-3.5 text-amber-400" />
                    <span>Diagnostics:</span>
                  </div>
                  <div>{execResult.mistakeFeedback.explanation}</div>
                  <div className="text-[11px] text-amber-300">
                    Fix: {execResult.mistakeFeedback.suggestedFix}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Myra Tutor Response Box */}
          {tutorReply && (
            <div
              className={`p-4 bg-indigo-950/40 border-t border-indigo-800/60 space-y-2 text-xs text-indigo-100 max-h-56 overflow-y-auto ${
                mobileTab === "hints" ? "block" : "hidden lg:block"
              }`}
            >
              <div className="flex items-center justify-between text-cyan-300 font-bold font-mono">
                <span className="flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Myra Practical Guidance</span>
                </span>
                <button
                  type="button"
                  onClick={() => setTutorReply(null)}
                  className="text-slate-400 hover:text-white text-[11px]"
                >
                  Dismiss
                </button>
              </div>
              <div className="whitespace-pre-wrap leading-relaxed">{tutorReply}</div>
            </div>
          )}
        </div>
      </div>

      {/* Capstone Submission Modal */}
      {capstoneOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl border border-slate-200 max-w-2xl w-full p-6 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <Award className="w-5 h-5 text-amber-500" />
                <h3 className="text-base font-black font-display text-slate-900">
                  {course.capstone.title}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setCapstoneOpen(false)}
                className="text-slate-400 hover:text-slate-700 text-xs font-bold"
              >
                Close
              </button>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              {course.capstone.scenario}
            </p>

            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-800">
                Submit Your Implementation / Query / Code:
              </label>
              <textarea
                value={capstoneCode}
                onChange={(e) => setCapstoneCode(e.target.value)}
                placeholder="Paste code or queries..."
                rows={6}
                className="w-full p-3 font-mono text-xs bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-800">
                Short Complexity / Reasoning Explanation:
              </label>
              <textarea
                value={complexityText}
                onChange={(e) => setComplexityText(e.target.value)}
                placeholder="Explain time complexity, space overhead, or statistical reasoning..."
                rows={3}
                className="w-full p-3 font-mono text-xs bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
              />
            </div>

            {capstoneResult && (
              <div
                className={`p-3.5 rounded-xl text-xs space-y-2 ${
                  capstoneResult.passed ? "bg-emerald-50 text-emerald-900 border border-emerald-200" : "bg-rose-50 text-rose-900 border border-rose-200"
                }`}
              >
                <div className="font-bold flex items-center justify-between">
                  <span>Score: {capstoneResult.score}% (Passing Threshold: {capstoneResult.passingScore}%)</span>
                  <span>{capstoneResult.passed ? "✔ PASSED" : "✖ REVISION REQUIRED"}</span>
                </div>
                <p>{capstoneResult.feedback}</p>
                {capstoneResult.passed && capstoneResult.certificateCode && (
                  <div className="pt-2 border-t border-emerald-200/60 font-mono text-xs">
                    Issued Credential ID: <strong>{capstoneResult.certificateCode}</strong>
                  </div>
                )}
              </div>
            )}

            <div className="pt-2 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setCapstoneOpen(false)}
                className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold cursor-pointer"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={handleSubmitCapstone}
                disabled={evaluating}
                className="px-5 py-2 rounded-xl bg-[#5C59E8] hover:bg-[#4E4BC6] text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-xs"
              >
                <span>{evaluating ? "Evaluating..." : "Submit Capstone for Grading"}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Verifiable Certificate Modal View */}
      {certificateData && (
        <VerifiableCertificateModal
          certificate={certificateData}
          onClose={() => setCertificateData(null)}
        />
      )}
    </div>
  );
}
