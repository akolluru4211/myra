"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useAuth } from "@/lib/auth-context";
import { 
  Layers, 
  Sparkles, 
  ArrowRight, 
  ShieldCheck, 
  Lock, 
  CheckCircle2, 
  Flame, 
  TrendingUp, 
  BookOpen, 
  Filter, 
  ChevronRight,
  ExternalLink,
  Target
} from "lucide-react";
import AuthGuard from "@/components/auth/AuthGuard";
import UserGreeting from "@/components/ui/UserGreeting";
import { DsaTier, InterviewFrequency, DsaTopic, getAllDsaTopics } from "@/lib/dsa/dsa-bank";

export const dynamic = "force-dynamic";

interface TopicWithProgress extends DsaTopic {
  status: "not_started" | "in_progress" | "completed";
  mastery_score: number;
  user_effective_level: number;
}

export default function DsaCurriculumHubPage() {
  const { user } = useAuth();
  const [topics, setTopics] = useState<TopicWithProgress[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTier, setSelectedTier] = useState<string>("All");
  const [selectedFrequency, setSelectedFrequency] = useState<string>("All");

  // Track Gating: Career Track (18+) & Explorer Track (16-17) have access. Junior Track (13-15) is gated.
  const isJuniorTrack = user?.ageBand === "13-15";

  useEffect(() => {
    if (isJuniorTrack) {
      setLoading(false);
      return;
    }

    const fetchTopics = async () => {
      try {
        const userId = user?.uid || "";
        const res = await fetch(`/api/dsa/topics?userId=${userId}`);
        const data = await res.json();
        if (data.success && data.topics) {
          setTopics(data.topics);
        } else {
          // Fallback to static bank
          const staticTopics = getAllDsaTopics().map((t) => ({
            ...t,
            status: "not_started" as const,
            mastery_score: 0,
            user_effective_level: t.difficulty_level,
          }));
          setTopics(staticTopics);
        }
      } catch (err) {
        console.error("Failed to fetch DSA topics:", err);
        const staticTopics = getAllDsaTopics().map((t) => ({
          ...t,
          status: "not_started" as const,
          mastery_score: 0,
          user_effective_level: t.difficulty_level,
        }));
        setTopics(staticTopics);
      } finally {
        setLoading(false);
      }
    };

    fetchTopics();
  }, [user, isJuniorTrack]);

  // Minor / Junior Track Gating Screen
  if (isJuniorTrack) {
    return (
      <AuthGuard>
        <div className="min-h-[calc(100vh-5rem)] flex items-center justify-center p-6 font-sans">
          <div className="max-w-md w-full bg-[#EFF6FF] border border-[#BFDBFE] text-black p-8 text-center space-y-6 rounded-3xl shadow-sm">
            <div className="w-14 h-14 rounded-2xl bg-blue-100 text-[#2563EB] flex items-center justify-center mx-auto shadow-2xs border border-blue-200">
              <Lock className="w-7 h-7" />
            </div>
            <div className="space-y-2">
              <span className="px-2.5 py-1 bg-blue-50 text-[#1E40AF] text-xs font-mono font-bold uppercase border border-blue-200 rounded-full">
                Junior Track &bull; COPPA Protected
              </span>
              <h1 className="text-2xl font-bold text-black tracking-tight">
                Advanced DSA is on Explorer &amp; Career Tracks
              </h1>
              <p className="text-xs text-slate-700 leading-relaxed">
                Data Structures &amp; Algorithms technical rounds are designed for high school competitive entrance (Explorer 16+) and university placement prep (Career 18+). Junior members build foundational problem-solving in the Curiosity Quests.
              </p>
            </div>
            <Link
              href="/dashboard"
              className="w-full py-3 px-4 text-xs font-bold rounded-xl bg-[#2563EB] hover:bg-blue-700 text-white flex items-center justify-center gap-2 cursor-pointer shadow-sm"
            >
              <span>Return to Dashboard</span>
              <ArrowRight className="w-3.5 h-3.5 text-white" />
            </Link>
          </div>
        </div>
      </AuthGuard>
    );
  }

  // Filter topics
  const filteredTopics = topics.filter((t) => {
    const tierMatch = selectedTier === "All" || t.tier === selectedTier;
    const freqMatch = selectedFrequency === "All" || t.interview_frequency === selectedFrequency;
    return tierMatch && freqMatch;
  });

  const completedCount = topics.filter((t) => t.status === "completed").length;
  const inProgressCount = topics.filter((t) => t.status === "in_progress").length;
  const highFreqCount = topics.filter((t) => t.interview_frequency === "High").length;

  return (
    <AuthGuard>
      <div className="w-full text-black font-sans space-y-6 animate-in fade-in duration-200">
        {/* Header Banner */}
        <div className="p-6 sm:p-8 bg-[#EFF6FF] border border-[#BFDBFE] text-black flex flex-col md:flex-row items-start md:items-center justify-between gap-6 rounded-3xl shadow-sm">
          <div className="space-y-1.5">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-black tracking-tight font-display">
              Data Structures &amp; Algorithms Studio
            </h1>
            <p className="text-xs sm:text-sm text-slate-700 font-normal">
              Essential DSA topics with interactive step-through visualizers and prediction drills.
            </p>
          </div>

          {/* Quick Metrics Capsule */}
          <div className="w-full md:w-auto grid grid-cols-3 md:flex items-center gap-2 sm:gap-4 bg-white border border-[#BFDBFE] p-3.5 rounded-2xl shadow-2xs">
            <div className="text-center px-2 sm:px-3 border-r border-blue-100">
              <span className="text-lg sm:text-2xl font-bold text-black tabular-nums">
                {completedCount}/{topics.length || 20}
              </span>
              <span className="text-xs text-slate-600 block font-medium">Mastered</span>
            </div>
            <div className="text-center px-2 sm:px-3 border-r border-blue-100">
              <span className="text-lg sm:text-2xl font-bold text-[#2563EB] tabular-nums">
                {highFreqCount}
              </span>
              <span className="text-xs text-slate-600 block font-medium">High freq</span>
            </div>
            <div className="text-center px-2 sm:px-3">
              <span className="text-lg sm:text-2xl font-bold text-blue-700 tabular-nums">
                {inProgressCount}
              </span>
              <span className="text-xs text-slate-600 block font-medium">In flight</span>
            </div>
          </div>
        </div>

        {/* Filtering and Tier Tabs */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3.5 border-b border-blue-200 pb-4">
          
          {/* Tier Tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-1 sm:pb-0">
            {["All", "Beginner", "Intermediate", "Advanced"].map((tier) => (
              <button
                key={tier}
                type="button"
                onClick={() => setSelectedTier(tier)}
                className={`px-3.5 py-1.5 text-xs font-semibold rounded-full border transition-all cursor-pointer whitespace-nowrap ${
                  selectedTier === tier
                    ? "bg-[#2563EB] text-white border-[#2563EB] shadow-2xs"
                    : "bg-[#EFF6FF] text-slate-700 hover:text-black border-blue-200"
                }`}
              >
                {tier === "All" ? "All Tiers (20)" : `${tier}`}
              </button>
            ))}
          </div>

          {/* Interview Frequency Filter */}
          <div className="flex items-center gap-2 overflow-x-auto no-scrollbar">
            <span className="text-xs font-semibold text-slate-700 flex items-center gap-1 shrink-0">
              <Filter className="w-3.5 h-3.5 text-[#2563EB]" />
              <span>Priority:</span>
            </span>
            <div className="flex items-center gap-1.5 shrink-0">
              {["All", "High", "Medium", "Low"].map((freq) => (
                <button
                  key={freq}
                  type="button"
                  onClick={() => setSelectedFrequency(freq)}
                  className={`px-3 py-1.5 text-xs font-medium rounded-full border transition-all cursor-pointer whitespace-nowrap ${
                    selectedFrequency === freq
                      ? "bg-[#2563EB] text-white border-[#2563EB] shadow-2xs"
                      : "bg-[#EFF6FF] text-slate-700 hover:text-black border-blue-200"
                  }`}
                >
                  {freq === "All" ? "All" : `${freq} Freq`}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Topics Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredTopics.map((topic) => {
            const hasVisualizer = !!topic.visualizer_type;
            const isHighFreq = topic.interview_frequency === "High";

            return (
              <Link
                key={topic.id}
                href={`/dsa/${topic.slug}`}
                className="p-6 bg-[#EFF6FF] border border-[#BFDBFE] text-black hover:border-blue-300 hover:bg-blue-50/80 transition-all flex flex-col justify-between group space-y-4 rounded-3xl shadow-sm"
              >
                <div className="space-y-3">
                  {/* Header Badges */}
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="px-2.5 py-0.5 text-[10px] font-semibold uppercase rounded-full bg-white text-slate-700 border border-blue-200">
                        {topic.tier}
                      </span>
                      {isHighFreq && (
                        <span className="px-2.5 py-0.5 text-[10px] font-semibold uppercase rounded-full bg-blue-100 text-[#1E40AF] border border-blue-200">
                          High Freq
                        </span>
                      )}
                      {hasVisualizer && (
                        <span className="px-2 py-0.5 text-[9px] font-medium uppercase rounded-full bg-blue-50 text-[#2563EB] border border-blue-200">
                          Visualizer
                        </span>
                      )}
                    </div>

                    {/* Status Pip */}
                    {topic.status === "completed" ? (
                      <CheckCircle2 className="w-5 h-5 text-[#2563EB] shrink-0" />
                    ) : topic.status === "in_progress" ? (
                      <span className="w-2.5 h-2.5 rounded-full bg-blue-500 animate-pulse" />
                    ) : null}
                  </div>

                  <div>
                    <h3 className="text-base font-bold text-black group-hover:text-[#2563EB] transition-colors leading-snug">
                      {topic.name}
                    </h3>
                  </div>

                  {/* Prerequisite Tag */}
                  {topic.prerequisite_topic_ids && topic.prerequisite_topic_ids.length > 0 && (
                    <div className="pt-1 flex items-center gap-1.5 flex-wrap text-[10px] text-slate-600">
                      <span>Prereq:</span>
                      {topic.prerequisite_topic_ids.map((preId) => (
                        <span key={preId} className="px-2 py-0.5 rounded-full bg-white text-slate-700 border border-blue-200">
                          {preId}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                {/* Card Footer */}
                <div className="pt-3 border-t border-blue-200 flex items-center justify-between text-xs text-black">
                  <span className="text-[11px] text-slate-600">
                    Mastery: {topic.mastery_score || 0}%
                  </span>
                  <span className="inline-flex items-center gap-1 text-[#2563EB] font-semibold group-hover:translate-x-0.5 transition-transform">
                    <span>Solve Drill</span>
                    <ChevronRight className="w-4 h-4 text-[#2563EB]" />
                  </span>
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </AuthGuard>
  );
}
