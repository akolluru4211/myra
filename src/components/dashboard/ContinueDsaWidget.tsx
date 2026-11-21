"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { Layers, ArrowRight, Sparkles, CheckCircle2, Code2 } from "lucide-react";
import { DsaTopic, getAllDsaTopics } from "@/lib/dsa/dsa-bank";

interface ContinueDsaWidgetProps {
  userId?: string;
  className?: string;
}

export default function ContinueDsaWidget({ userId, className = "" }: ContinueDsaWidgetProps) {
  const [nextTopic, setNextTopic] = useState<DsaTopic | null>(null);
  const [completedCount, setCompletedCount] = useState(0);
  const [totalCount, setTotalCount] = useState(20);

  useEffect(() => {
    const fetchProgress = async () => {
      try {
        const res = await fetch(`/api/dsa/topics?userId=${userId || ""}`);
        const data = await res.json();
        if (data.success && data.topics) {
          const list = data.topics;
          setTotalCount(list.length);
          const completed = list.filter((t: any) => t.status === "completed").length;
          setCompletedCount(completed);

          // Find first uncompleted or in-progress topic
          const inProgress = list.find((t: any) => t.status === "in_progress");
          const firstUnstarted = list.find((t: any) => t.status === "not_started");
          setNextTopic(inProgress || firstUnstarted || list[0]);
        } else {
          const fallback = getAllDsaTopics();
          setNextTopic(fallback[0]);
        }
      } catch (err) {
        const fallback = getAllDsaTopics();
        setNextTopic(fallback[0]);
      }
    };

    fetchProgress();
  }, [userId]);

  if (!nextTopic) return null;

  const percent = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  return (
    <div className={`bg-white rounded-3xl border border-slate-100/80 shadow-[0_10px_30px_rgba(80,90,130,0.06)] p-6 space-y-4 font-sans ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-100 pb-3">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-[#EEF0FD] flex items-center justify-center text-[#5C59E8]">
            <Layers className="w-4 h-4 stroke-[2]" />
          </div>
          <div>
            <h3 className="text-xs font-black uppercase tracking-wider text-slate-900 font-display">
              Continue DSA Practice
            </h3>
            <span className="text-[10px] text-slate-400 font-medium">Algorithmic Mastery</span>
          </div>
        </div>
        <span className="text-[11px] font-mono font-bold text-[#5C59E8] bg-[#EEF0FD] px-2.5 py-1 rounded-full">
          {completedCount}/{totalCount} Mastered ({percent}%)
        </span>
      </div>

      {/* Next Topic Box */}
      <div className="p-4 rounded-2xl bg-[#F8F9FD] border border-slate-100/90 space-y-3">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase bg-[#EEF0FD] text-[#4338CA]">
                {nextTopic.tier}
              </span>
              {nextTopic.interview_frequency === "High" && (
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase bg-[#FFE4E6] text-[#F43F5E]">
                  High Freq
                </span>
              )}
            </div>
            <h4 className="text-sm font-bold text-slate-900 mt-1 font-display">
              {nextTopic.name}
            </h4>
          </div>
        </div>

        <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed">
          {nextTopic.explainer_concept}
        </p>

        {/* Progress Bar */}
        <div className="w-full bg-slate-200/80 h-1.5 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-[#5C59E8] to-[#4338CA] rounded-full transition-all duration-300"
            style={{ width: `${percent}%` }}
          />
        </div>

        <Link
          href={`/dsa/${nextTopic.slug}`}
          className="w-full py-2.5 px-4 rounded-xl bg-[#5C59E8] hover:bg-[#4E4BC6] text-white text-xs font-bold flex items-center justify-center gap-2 transition-all shadow-md shadow-indigo-500/20 active:scale-95 cursor-pointer"
        >
          <span>Resume Topic Drills</span>
          <ArrowRight className="w-3.5 h-3.5 text-white" />
        </Link>
      </div>
    </div>
  );
}
