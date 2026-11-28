"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useAuth } from "@/lib/auth-context";
import AuthGuard from "@/components/auth/AuthGuard";
import { 
  Sparkles, 
  Trash2, 
  ArrowLeft, 
  RefreshCw, 
  ShieldCheck, 
  AlertTriangle, 
  CheckCircle2, 
  HelpCircle,
  Brain,
  Code2,
  BookOpen,
  History,
  XCircle,
  Compass
} from "lucide-react";

interface LearnedTopicItem {
  topic: string;
  queryCount: number;
  lastAsked: string;
  estimatedMastery: "beginner" | "intermediate" | "advanced";
}

interface SearchedTechItem {
  tech: string;
  searchCount: number;
  lastSearched: string;
}

interface StrugglePointItem {
  concept: string;
  severity: "low" | "moderate" | "high";
  source: "doubt" | "interview" | "search";
  advice: string;
  timestamp: string;
}

interface MyraMemoryData {
  userId: string;
  totalInteractions: number;
  frequentTopics: LearnedTopicItem[];
  searchedTechnologies: SearchedTechItem[];
  strugglePoints: StrugglePointItem[];
  learningStylePreference: string;
  lastInteractionAt: string;
}

export default function MyraMemorySettingsPage() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [memory, setMemory] = useState<MyraMemoryData | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Reset confirmation modal state
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [isResetting, setIsResetting] = useState(false);
  const [resetSuccessMessage, setResetSuccessMessage] = useState<string | null>(null);

  const fetchMemory = async () => {
    if (!user?.uid) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/ai/myra?userId=${user.uid}`, {
        cache: "no-store",
      });
      if (res.status === 401) {
        setError("Please sign in to view your learning memory.");
        return;
      }
      if (!res.ok) {
        throw new Error("Failed to retrieve Myra memory.");
      }
      const data = await res.json();
      setMemory(data.memory || null);
    } catch (err: any) {
      setError(err?.message || "Failed to load Myra learning memory.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user?.uid) {
      fetchMemory();
    }
  }, [user?.uid]);

  const handleResetMemory = async () => {
    if (!user?.uid) return;
    setIsResetting(true);
    setError(null);
    setResetSuccessMessage(null);

    try {
      const res = await fetch(`/api/ai/myra?userId=${user.uid}`, {
        method: "DELETE",
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Failed to reset memory.");
      }

      setMemory(null);
      setShowConfirmModal(false);
      setResetSuccessMessage("Your Myra learning memory was successfully reset.");
      setTimeout(() => setResetSuccessMessage(null), 6000);
    } catch (err: any) {
      setError(err?.message || "Could not reset memory. Please try again.");
    } finally {
      setIsResetting(false);
    }
  };

  const getStyleDisplayName = (style?: string) => {
    switch (style) {
      case "concise_bulleted":
        return "Concise & Bulleted (Fast executive summaries)";
      case "deep_architectural":
        return "Deep & Architectural (End-to-end distributed system blueprints)";
      case "analogy_driven":
        return "Analogy-Driven (Intuitive real-world comparisons)";
      case "code_heavy":
        return "Code-Heavy (Step-by-step algorithms & implementations)";
      default:
        return "Adaptive (Balances conceptual depth with clear code)";
    }
  };

  return (
    <AuthGuard>
      <div className="min-h-screen bg-[#F8FAFC] py-8 sm:py-12 px-4 sm:px-6 lg:px-8 font-sans">
        <div className="max-w-4xl mx-auto space-y-6">
          {/* Breadcrumb / Top Bar */}
          <div className="flex items-center justify-between">
            <Link
              href="/dashboard"
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back to Dashboard</span>
            </Link>
            <div className="flex items-center gap-2">
              <Link
                href="/settings/alerts"
                className="text-xs text-slate-500 hover:text-slate-800 font-medium px-2.5 py-1 rounded-lg hover:bg-slate-200/60 transition-colors"
              >
                Alerts
              </Link>
              <Link
                href="/settings/billing"
                className="text-xs text-slate-500 hover:text-slate-800 font-medium px-2.5 py-1 rounded-lg hover:bg-slate-200/60 transition-colors"
              >
                Billing
              </Link>
              <span className="text-xs text-blue-700 bg-blue-50 border border-blue-200 font-bold px-2.5 py-1 rounded-lg">
                Myra Memory
              </span>
            </div>
          </div>

          {/* Header Card */}
          <div className="p-6 sm:p-8 border-slate-200/80 relative overflow-hidden border-b">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="space-y-1.5">
                <div className="flex items-center gap-2">
                  <div className="w-10 h-10 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold border border-indigo-100">
                    <Brain className="w-5 h-5 text-[#4F46E5]" />
                  </div>
                  <div>
                    <h1 className="text-xl sm:text-2xl font-black text-slate-900 font-display tracking-tight">
                      Myra Memory &amp; Learning Preferences
                    </h1>
                    <p className="text-xs text-slate-500">
                      Transparency and controls over what Myra remembers about your study journey
                    </p>
                  </div>
                </div>
              </div>

              {/* Refresh / Reset Actions */}
              <div className="flex items-center gap-2.5">
                <button
                  type="button"
                  onClick={fetchMemory}
                  disabled={loading || isResetting}
                  className="p-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-600 hover:text-slate-900 transition-colors cursor-pointer"
                  title="Refresh memory"
                  aria-label="Refresh memory"
                >
                  <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin text-blue-600" : ""}`} />
                </button>
                <button
                  type="button"
                  onClick={() => setShowConfirmModal(true)}
                  disabled={loading || isResetting || !memory}
                  className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 text-xs font-bold transition-all cursor-pointer shadow-xs disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Reset memory</span>
                </button>
              </div>
            </div>

            {/* Notification Banner */}
            {resetSuccessMessage && (
              <div className="mt-4 p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>{resetSuccessMessage}</span>
              </div>
            )}
            {error && (
              <div className="mt-4 p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2">
                <XCircle className="w-4 h-4 text-rose-600 shrink-0" />
                <span>{error}</span>
              </div>
            )}
          </div>

          {/* Privacy & Scope Explanation Box */}
          <div className="bg-blue-50/70 border border-blue-200/80 rounded-2xl p-4 sm:p-5 text-xs text-slate-700 space-y-2">
            <div className="flex items-center gap-2 font-bold text-blue-900">
              <ShieldCheck className="w-4 h-4 text-blue-600" />
              <span>How Myra Memory Works</span>
            </div>
            <p className="leading-relaxed text-slate-600">
              Myra learns dynamically from your questions, doubts, and mock interviews to provide tailored explanations and track areas where you need practice. 
              <strong> Live chat transcripts clear whenever you refresh your browser</strong>, but your cognitive profile (such as topics studied and struggle areas) is kept here so Myra doesn&apos;t ask you to repeat yourself.
            </p>
          </div>

          {/* Memory Content */}
          {loading ? (
            <div className="p-12 text-center border-slate-200/80 space-y-3 border-b">
              <RefreshCw className="w-6 h-6 animate-spin text-blue-600 mx-auto" />
              <p className="text-xs text-slate-500 font-medium">Loading your Myra memory profile...</p>
            </div>
          ) : !memory || (
            (!memory.frequentTopics || memory.frequentTopics.length === 0) &&
            (!memory.searchedTechnologies || memory.searchedTechnologies.length === 0) &&
            (!memory.strugglePoints || memory.strugglePoints.length === 0)
          ) ? (
            <div className="p-12 text-center border-slate-200/80 space-y-4 border-b">
              <div className="w-12 h-12 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
                <Brain className="w-6 h-6" />
              </div>
              <div className="space-y-1">
                <h3 className="text-base font-bold text-slate-900">No Saved Learning Memory</h3>
                <p className="text-xs text-slate-500 max-w-md mx-auto">
                  Myra hasn&apos;t recorded any topic preferences or struggle points yet. As you ask questions and practice with Myra, key learning patterns will appear here.
                </p>
              </div>
              <Link
                href="/dashboard"
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs shadow-sm transition-colors"
              >
                <span>Ask Myra on Dashboard</span>
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Card 1: Frequent Study Topics */}
              <div className="p-6 border-slate-200/80 space-y-4 border-b">
                <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
                  <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
                    <BookOpen className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-900">Frequently Studied Topics</h3>
                    <p className="text-[11px] text-slate-500">Concepts you have explored or drilled with Myra</p>
                  </div>
                </div>

                {memory.frequentTopics && memory.frequentTopics.length > 0 ? (
                  <div className="space-y-2.5">
                    {memory.frequentTopics.map((item, idx) => (
                      <div
                        key={idx}
                        className="p-3 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-between gap-3 text-xs"
                      >
                        <div className="min-w-0">
                          <span className="font-bold text-slate-800 block truncate">{item.topic}</span>
                          <span className="text-[10px] text-slate-500 block">
                            Asked {item.queryCount} {item.queryCount === 1 ? "time" : "times"}
                          </span>
                        </div>
                        <span className="px-2.5 py-1 rounded-full bg-white text-slate-700 text-[10px] font-semibold border border-slate-200/60 shrink-0 capitalize">
                          {item.estimatedMastery || "in progress"}
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-slate-400 italic py-4 text-center">No topic patterns recorded yet.</p>
                )}
              </div>

              {/* Card 2: Searched Technologies */}
              <div className="p-6 border-slate-200/80 space-y-4 border-b">
                <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
                  <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
                    <Code2 className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-900">Technologies &amp; Frameworks</h3>
                    <p className="text-[11px] text-slate-500">Stacks and tools queried during chats</p>
                  </div>
                </div>

                {memory.searchedTechnologies && memory.searchedTechnologies.length > 0 ? (
                  <div className="flex flex-wrap gap-2 pt-1">
                    {memory.searchedTechnologies.map((item, idx) => (
                      <div
                        key={idx}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-semibold text-slate-800"
                      >
                        <span>{item.tech}</span>
                        <span className="text-[10px] bg-slate-200/70 text-slate-600 px-1.5 py-0.2 rounded-full">
                          {item.searchCount}
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-slate-400 italic py-4 text-center">No technology stack queries recorded yet.</p>
                )}
              </div>

              {/* Card 3: Identified Struggle Points */}
              <div className="p-6 border-slate-200/80 space-y-4 md:col-span-2 border-b">
                <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
                  <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center font-bold">
                    <AlertTriangle className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-900">Identified Review &amp; Struggle Points</h3>
                    <p className="text-[11px] text-slate-500">Areas where doubts or test confusion were flagged for targeted coaching</p>
                  </div>
                </div>

                {memory.strugglePoints && memory.strugglePoints.length > 0 ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {memory.strugglePoints.map((item, idx) => (
                      <div
                        key={idx}
                        className="p-3.5 rounded-2xl bg-amber-50/40 border border-amber-200/60 text-xs space-y-1.5"
                      >
                        <div className="flex items-center justify-between gap-2">
                          <span className="font-bold text-amber-950 truncate">{item.concept}</span>
                          <span className="px-2 py-0.5 rounded-md bg-amber-100 text-amber-800 text-[10px] font-semibold shrink-0 uppercase tracking-wider">
                            {item.severity}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-600 leading-normal">{item.advice}</p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-slate-400 italic py-4 text-center">No active struggle points flagged. You&apos;re in good shape!</p>
                )}
              </div>

              {/* Card 4: Learning Style Preference */}
              <div className="p-6 border-slate-200/80 space-y-3 md:col-span-2 border-b">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center font-bold">
                      <Compass className="w-4 h-4" />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-slate-900">Current Tutoring Style</h3>
                      <p className="text-[11px] text-slate-500">How Myra formats code, formulas, and explanations</p>
                    </div>
                  </div>
                  <span className="text-xs font-semibold text-purple-700 bg-purple-50 border border-purple-200 px-3 py-1 rounded-xl">
                    {getStyleDisplayName(memory.learningStylePreference)}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Reset Confirmation Modal */}
          {showConfirmModal && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
              <div className="max-w-md w-full p-6 sm:p-7 border-slate-200 space-y-4 border-b">
                <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center mx-auto border border-rose-100">
                  <Trash2 className="w-6 h-6" />
                </div>

                <div className="text-center space-y-2">
                  <h3 className="text-lg font-bold text-slate-900 font-display">
                    Reset Myra Learning Memory?
                  </h3>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    This permanently deletes all saved topic history, search frequency counters, identified struggle flags, and personalized response styles.
                  </p>
                  <p className="text-[11px] text-slate-500 bg-slate-50 p-2.5 rounded-xl border border-slate-200/70 text-left">
                    <strong>What stays safe:</strong> Your EdWorld account profile, enrolled study squad, resume, mock test scores, and alert subscriptions are completely unaffected.
                  </p>
                </div>

                <div className="flex items-center gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowConfirmModal(false)}
                    disabled={isResetting}
                    className="flex-1 py-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 font-semibold text-xs transition-colors cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleResetMemory}
                    disabled={isResetting}
                    className="flex-1 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs shadow-sm transition-colors cursor-pointer flex items-center justify-center gap-1.5 disabled:opacity-50"
                  >
                    {isResetting ? (
                      <>
                        <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                        <span>Resetting...</span>
                      </>
                    ) : (
                      <>
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>Confirm Reset</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </AuthGuard>
  );
}
