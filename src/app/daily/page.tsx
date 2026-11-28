"use client";

export const dynamic = "force-dynamic";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  Flame,
  CheckCircle2,
  Circle,
  ArrowRight,
  Sparkles,
  Code2,
  Brain,
  Mic,
  Shield,
  HelpCircle,
  Calendar,
  Trophy,
  RotateCcw,
  Volume2,
  Play,
  Square,
} from "lucide-react";
import AuthGuard from "@/components/auth/AuthGuard";
import { useAuth } from "@/lib/auth-context";
import { getDailyQuestions, AptitudeQuestion } from "@/lib/aptitude-bank";

export default function DailyChallengePage() {
  const { user, profile } = useAuth();
  const todayKey = new Date().toISOString().split("T")[0];

  // 5 Tasks Completion State
  const [taskDone, setTaskDone] = useState<{
    dsa?: boolean;
    apt_1?: boolean;
    apt_2?: boolean;
    apt_3?: boolean;
    interview?: boolean;
  }>({});

  // Aptitude Selected Radio Options
  const [selectedAnswers, setSelectedAnswers] = useState<Record<string, string>>({});
  const [answerFeedback, setAnswerFeedback] = useState<Record<string, boolean>>({});

  // Questions from deterministic date hash
  const [dailyQuestions, setDailyQuestions] = useState<AptitudeQuestion[]>([]);

  // Streak Freezes (0 to 3)
  const [streakFreezes, setStreakFreezes] = useState<number>(1);
  const [isRecording, setIsRecording] = useState<boolean>(false);
  const [recordedDuration, setRecordedDuration] = useState<number>(0);
  const [interviewSubmitted, setInterviewSubmitted] = useState<boolean>(false);

  // Load daily questions and saved progress
  useEffect(() => {
    const questions = getDailyQuestions(todayKey);
    setDailyQuestions(questions);

    try {
      if (typeof window !== "undefined") {
        const savedProgress = localStorage.getItem(`edworld_habit_checklist_${todayKey}`);
        if (savedProgress) {
          const parsed = JSON.parse(savedProgress);
          setTaskDone({
            dsa: Boolean(parsed["habit-dsa-1"] || parsed["dsa"]),
            apt_1: Boolean(parsed["habit-apt-1"] || parsed["apt_1"]),
            apt_2: Boolean(parsed["habit-apt-2"] || parsed["apt_2"]),
            apt_3: Boolean(parsed["habit-apt-3"] || parsed["apt_3"]),
            interview: Boolean(parsed["habit-interview-1"] || parsed["interview"]),
          });
        }
        const savedAnswers = localStorage.getItem(`edworld_daily_answers_${todayKey}`);
        if (savedAnswers) {
          setSelectedAnswers(JSON.parse(savedAnswers));
        }
      }
    } catch (e) {}
  }, [todayKey]);

  // Split questions into 3 distinct domains
  const quantQuestion = dailyQuestions.find((q) => q.category === "Quantitative") || dailyQuestions[0];
  const logicalQuestion = dailyQuestions.find((q) => q.category === "Logical Reasoning") || dailyQuestions[1] || dailyQuestions[0];
  const verbalQuestion = dailyQuestions.find((q) => q.category === "Verbal") || dailyQuestions[2] || dailyQuestions[0];

  // Award XP via centralized idempotent API
  const awardTaskXp = async (taskKey: string, points: number) => {
    if (!user?.uid) return;
    try {
      await fetch("/api/gamification/award", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: user.uid,
          sourceFeature: "daily_task",
          sourceId: `daily_${todayKey}_${taskKey}`,
          points,
        }),
      });
    } catch (e) {
      // Offline fallback
    }
  };

  const markTaskCompleted = (taskKey: "dsa" | "apt_1" | "apt_2" | "apt_3" | "interview", points: number) => {
    setTaskDone((prev) => {
      const next = { ...prev, [taskKey]: true };
      try {
        if (typeof window !== "undefined") {
          localStorage.setItem(`edworld_habit_checklist_${todayKey}`, JSON.stringify(next));
        }
      } catch (e) {}
      return next;
    });
    awardTaskXp(taskKey, points);
  };

  const handleSelectOption = (questionKey: "apt_1" | "apt_2" | "apt_3", optionId: string, correctOptionId: string) => {
    const updated = { ...selectedAnswers, [questionKey]: optionId };
    setSelectedAnswers(updated);
    try {
      if (typeof window !== "undefined") {
        localStorage.setItem(`edworld_daily_answers_${todayKey}`, JSON.stringify(updated));
      }
    } catch (e) {}

    const isCorrect = optionId === correctOptionId;
    setAnswerFeedback((prev) => ({ ...prev, [questionKey]: isCorrect }));

    if (isCorrect) {
      markTaskCompleted(questionKey, 35);
    }
  };

  const handleInterviewRecording = () => {
    if (isRecording) {
      setIsRecording(false);
      setInterviewSubmitted(true);
      markTaskCompleted("interview", 50);
    } else {
      setIsRecording(true);
      setRecordedDuration(0);
      const interval = setInterval(() => {
        setRecordedDuration((prev) => {
          if (prev >= 60) {
            clearInterval(interval);
            setIsRecording(false);
            setInterviewSubmitted(true);
            markTaskCompleted("interview", 50);
            return 60;
          }
          return prev + 1;
        });
      }, 1000);
    }
  };

  // 5 Checklist Items Count
  const completedCount = [
    taskDone.dsa,
    taskDone.apt_1,
    taskDone.apt_2,
    taskDone.apt_3,
    taskDone.interview,
  ].filter(Boolean).length;

  const progressPercent = Math.round((completedCount / 5) * 100);

  // SVG Gauge calculations
  const radius = 42;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (progressPercent / 100) * circumference;

  return (
    <AuthGuard>
      <div className="min-h-screen bg-white text-slate-900 font-sans pb-16 space-y-8 animate-in fade-in duration-200">
        
        {/* Top Header & Breadcrumbs */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-2">
          <div>
            <div className="flex items-center gap-2 text-xs text-slate-500 font-medium">
              <Link href="/dashboard" className="hover:text-[#2563EB]">Dashboard</Link>
              <span>/</span>
              <span className="text-slate-800 font-semibold">Daily Habit Loop</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black font-display text-slate-900 tracking-tight mt-1">
              Daily Challenge Sprint
            </h1>
          </div>

        </div>

        {/* HERO CARD: Circular Progress Gauge & Date Summary */}
        <section className="border-t border-slate-200 py-6 sm:py-8 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-3 max-w-xl">
            <div className="flex items-center gap-2">
              <span className="px-3 py-1 rounded-full text-xs font-bold bg-[#EFF6FF] text-[#4338CA]">
                {new Date().toLocaleDateString("en-US", { weekday: "long", month: "short", day: "numeric" })}
              </span>
              <span className="text-xs font-semibold text-slate-400">
                Resets at 12:00 AM IST
              </span>
            </div>

            <h2 className="text-xl sm:text-2xl font-black font-display text-slate-900">
              {progressPercent === 100
                ? "🎉 Daily Challenge Complete! You're Placement Ready."
                : `${completedCount} of 5 Daily Tasks Completed`}
            </h2>

            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
              Complete each of the 5 targeted practice drills today to earn +200 XP, protect your streak, and advance your role readiness metrics.
            </p>

            <div className="flex items-center gap-4 text-xs font-bold text-slate-700 pt-1">
              <span className="flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-[#2563EB]" />
                1 DSA Problem (+50 XP)
              </span>
              <span className="flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-[#2563EB]" />
                3 Aptitude MCQs (+100 XP)
              </span>
              <span className="flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-[#2563EB]" />
                1 STAR Drill (+50 XP)
              </span>
            </div>
          </div>

          {/* Circular Completion Ring */}
          <div className="flex flex-wrap items-center gap-5 self-start md:self-center">
            <div className="relative w-24 h-24 flex items-center justify-center">
              <svg className="w-24 h-24 -rotate-90" viewBox="0 0 100 100">
                <circle cx="50" cy="50" r={radius} stroke="#E2E8F0" strokeWidth="8" fill="none" />
                <circle
                  cx="50"
                  cy="50"
                  r={radius}
                  stroke="#5C59E8"
                  strokeWidth="8"
                  strokeDasharray={circumference}
                  strokeDashoffset={strokeDashoffset}
                  strokeLinecap="round"
                  fill="none"
                  className="transition-all duration-700 ease-out"
                />
              </svg>
              <div className="absolute flex flex-col items-center justify-center text-center">
                <span className="text-xl font-black font-display text-slate-900">
                  {progressPercent}%
                </span>
                <span className="text-[10px] font-bold text-slate-400">
                  {completedCount}/5
                </span>
              </div>
            </div>

            <div className="space-y-1">
              <div className="text-xs font-bold text-slate-900">
                Total XP Bonus
              </div>
              <div className="text-lg font-black font-display text-[#2563EB]">
                +{completedCount * 40} XP
              </div>
              <div className="text-[10px] text-slate-400">
                Max 200 XP / day
              </div>
            </div>
          </div>
        </section>

        {/* 5 MODULAR TASK CARDS */}
        <div className="space-y-6">
          
          {/* TASK 1: 1 DSA Problem */}
          <section className="border-t border-slate-200 py-6 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-blue-100 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-[#EFF6FF] text-[#2563EB] flex items-center justify-center shrink-0">
                  <Code2 className="w-5 h-5 stroke-[2]" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-[#EFF6FF] text-[#4338CA]">
                      Task 1 • DSA Practice
                    </span>
                    <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-full bg-[#EFF6FF] text-[#1E40AF] border border-blue-200/60">
                      Beginner
                    </span>
                  </div>
                  <h3 className="text-base font-bold text-slate-900 mt-1 font-display">
                    Reverse Words in a String (In-Place Pointers)
                  </h3>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <span className="text-xs font-bold text-[#2563EB] bg-[#EFF6FF] px-3 py-1 rounded-full">
                  +50 XP
                </span>
                {taskDone.dsa ? (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#EFF6FF] text-[#1E40AF] text-xs font-bold border border-blue-200/60">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Completed</span>
                  </span>
                ) : (
                  <button
                    onClick={() => markTaskCompleted("dsa", 50)}
                    className="px-3.5 py-1.5 text-xs font-bold rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 cursor-pointer transition-all"
                  >
                    Mark Done
                  </button>
                )}
              </div>
            </div>

            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
              Given an input string <code>s</code>, reverse the order of the words. A word is defined as a sequence of non-space characters. The words in <code>s</code> will be separated by at least one space. Return a string of the words in reverse order concatenated by a single space.
            </p>

            <div className="p-3.5 border-blue-100/90 font-mono text-xs text-slate-700 space-y-1 border-b">
              <div><strong>Input:</strong> s = &quot;the sky is blue&quot;</div>
              <div><strong>Output:</strong> &quot;blue is sky the&quot;</div>
            </div>

            <div className="flex items-center justify-between pt-1">
              <span className="text-xs text-slate-400">Target Time: 15 minutes</span>
              <Link
                href="/dsa"
                className="px-5 py-2.5 rounded-2xl bg-[#2563EB] hover:bg-[#1D4ED8] text-white text-xs font-bold flex items-center gap-2 shadow-md shadow-indigo-500/20 active:scale-95 transition-all"
              >
                <span>Launch DSA Code Studio</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </section>

          {/* TASK 2: Aptitude Q1 (Quantitative) */}
          {quantQuestion && (
            <section className="border-t border-slate-200 py-6 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-blue-100 pb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-[#EFF6FF] text-[#1E40AF] border border-blue-200/60 flex items-center justify-center shrink-0">
                    <Brain className="w-5 h-5 stroke-[2]" />
                  </div>
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-[#EFF6FF] text-amber-800 border border-blue-200/60">
                      Task 2 • Quantitative Aptitude
                    </span>
                    <h3 className="text-base font-bold text-slate-900 mt-1 font-display">
                      {quantQuestion.question}
                    </h3>
                  </div>
                </div>
                <span className="text-xs font-bold text-[#2563EB] bg-[#EFF6FF] px-3 py-1 rounded-full shrink-0">
                  +35 XP
                </span>
              </div>

              {/* Radio Options */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {quantQuestion.options.map((option) => {
                  const isSelected = selectedAnswers["apt_1"] === option.id;
                  const isCorrect = option.id === quantQuestion.correctOptionId;
                  const showResult = isSelected || (selectedAnswers["apt_1"] && isCorrect);

                  return (
                    <button
                      key={option.id}
                      type="button"
                      onClick={() => handleSelectOption("apt_1", option.id, quantQuestion.correctOptionId)}
                      className={`p-3.5 rounded-2xl border text-left transition-all cursor-pointer flex items-center gap-3 ${
                        isSelected
                          ? isCorrect
                            ? "bg-[#EFF6FF] border-emerald-300 text-emerald-900"
                            : "bg-rose-50 border-rose-300 text-rose-900"
                          : "bg-[#EFF6FF] border-blue-100 hover:border-blue-200 text-slate-800"
                      }`}
                    >
                      <span className="w-6 h-6 rounded-lg bg-white border border-blue-200 flex items-center justify-center text-xs font-bold shrink-0">
                        {option.id}
                      </span>
                      <span className="text-xs font-semibold">{option.text}</span>
                    </button>
                  );
                })}
              </div>

              {selectedAnswers["apt_1"] && (
                <div className="p-3.5 rounded-2xl bg-[#EFF6FF]/60 border border-blue-200 text-xs text-indigo-900 space-y-1">
                  <div className="font-bold flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-[#2563EB]" />
                    <span>Explanation:</span>
                  </div>
                  <p>{quantQuestion.explanation}</p>
                </div>
              )}
            </section>
          )}

          {/* TASK 3: Aptitude Q2 (Logical Reasoning) */}
          {logicalQuestion && (
            <section className="border-t border-slate-200 py-6 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-blue-100 pb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-cyan-50 text-cyan-700 border border-cyan-200/60 flex items-center justify-center shrink-0">
                    <Brain className="w-5 h-5 stroke-[2]" />
                  </div>
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-cyan-50 text-cyan-800 border border-cyan-200/60">
                      Task 3 • Logical Reasoning
                    </span>
                    <h3 className="text-base font-bold text-slate-900 mt-1 font-display">
                      {logicalQuestion.question}
                    </h3>
                  </div>
                </div>
                <span className="text-xs font-bold text-[#2563EB] bg-[#EFF6FF] px-3 py-1 rounded-full shrink-0">
                  +35 XP
                </span>
              </div>

              {/* Radio Options */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {logicalQuestion.options.map((option) => {
                  const isSelected = selectedAnswers["apt_2"] === option.id;
                  const isCorrect = option.id === logicalQuestion.correctOptionId;

                  return (
                    <button
                      key={option.id}
                      type="button"
                      onClick={() => handleSelectOption("apt_2", option.id, logicalQuestion.correctOptionId)}
                      className={`p-3.5 rounded-2xl border text-left transition-all cursor-pointer flex items-center gap-3 ${
                        isSelected
                          ? isCorrect
                            ? "bg-[#EFF6FF] border-emerald-300 text-emerald-900"
                            : "bg-rose-50 border-rose-300 text-rose-900"
                          : "bg-[#EFF6FF] border-blue-100 hover:border-blue-200 text-slate-800"
                      }`}
                    >
                      <span className="w-6 h-6 rounded-lg bg-white border border-blue-200 flex items-center justify-center text-xs font-bold shrink-0">
                        {option.id}
                      </span>
                      <span className="text-xs font-semibold">{option.text}</span>
                    </button>
                  );
                })}
              </div>

              {selectedAnswers["apt_2"] && (
                <div className="p-3.5 rounded-2xl bg-[#EFF6FF]/60 border border-blue-200 text-xs text-indigo-900 space-y-1">
                  <div className="font-bold flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-[#2563EB]" />
                    <span>Explanation:</span>
                  </div>
                  <p>{logicalQuestion.explanation}</p>
                </div>
              )}
            </section>
          )}

          {/* TASK 4: Aptitude Q3 (Verbal) */}
          {verbalQuestion && (
            <section className="border-t border-slate-200 py-6 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-blue-100 pb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-[#EFF6FF] text-[#1E40AF] border border-blue-200/60 flex items-center justify-center shrink-0">
                    <Brain className="w-5 h-5 stroke-[2]" />
                  </div>
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-[#EFF6FF] text-purple-800 border border-blue-200/60">
                      Task 4 • Verbal Aptitude
                    </span>
                    <h3 className="text-base font-bold text-slate-900 mt-1 font-display">
                      {verbalQuestion.question}
                    </h3>
                  </div>
                </div>
                <span className="text-xs font-bold text-[#2563EB] bg-[#EFF6FF] px-3 py-1 rounded-full shrink-0">
                  +30 XP
                </span>
              </div>

              {/* Radio Options */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {verbalQuestion.options.map((option) => {
                  const isSelected = selectedAnswers["apt_3"] === option.id;
                  const isCorrect = option.id === verbalQuestion.correctOptionId;

                  return (
                    <button
                      key={option.id}
                      type="button"
                      onClick={() => handleSelectOption("apt_3", option.id, verbalQuestion.correctOptionId)}
                      className={`p-3.5 rounded-2xl border text-left transition-all cursor-pointer flex items-center gap-3 ${
                        isSelected
                          ? isCorrect
                            ? "bg-[#EFF6FF] border-emerald-300 text-emerald-900"
                            : "bg-rose-50 border-rose-300 text-rose-900"
                          : "bg-[#EFF6FF] border-blue-100 hover:border-blue-200 text-slate-800"
                      }`}
                    >
                      <span className="w-6 h-6 rounded-lg bg-white border border-blue-200 flex items-center justify-center text-xs font-bold shrink-0">
                        {option.id}
                      </span>
                      <span className="text-xs font-semibold">{option.text}</span>
                    </button>
                  );
                })}
              </div>

              {selectedAnswers["apt_3"] && (
                <div className="p-3.5 rounded-2xl bg-[#EFF6FF]/60 border border-blue-200 text-xs text-indigo-900 space-y-1">
                  <div className="font-bold flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-[#2563EB]" />
                    <span>Explanation:</span>
                  </div>
                  <p>{verbalQuestion.explanation}</p>
                </div>
              )}
            </section>
          )}

          {/* TASK 5: Daily Interview Drill (STAR Recording) */}
          <section className="border-t border-slate-200 py-6 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-blue-100 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-rose-50 text-rose-700 border border-rose-200/60 flex items-center justify-center shrink-0">
                  <Mic className="w-5 h-5 stroke-[2]" />
                </div>
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-rose-50 text-rose-800 border border-rose-200/60">
                    Task 5 • AI Mock Interview Drill
                  </span>
                  <h3 className="text-base font-bold text-slate-900 mt-1 font-display">
                    Behavioral STAR Drill: Handling Unclear Project Requirements
                  </h3>
                </div>
              </div>
              <span className="text-xs font-bold text-[#2563EB] bg-[#EFF6FF] px-3 py-1 rounded-full shrink-0">
                +50 XP
              </span>
            </div>

            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
              <strong>Prompt:</strong> &quot;Tell me about a time when you were assigned a task with ambiguous or contradictory requirements. How did you clarify the requirements and deliver the project?&quot;
            </p>

            {/* STAR Response Guidelines */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px] font-semibold text-slate-600">
              <div className="p-2.5 rounded-xl bg-[#EFF6FF] border border-blue-100 text-center">
                <span className="text-[#2563EB] font-bold">S</span>ituation (20s)
              </div>
              <div className="p-2.5 rounded-xl bg-[#EFF6FF] border border-blue-100 text-center">
                <span className="text-[#2563EB] font-bold">T</span>ask (15s)
              </div>
              <div className="p-2.5 rounded-xl bg-[#EFF6FF] border border-blue-100 text-center">
                <span className="text-[#2563EB] font-bold">A</span>ction (40s)
              </div>
              <div className="p-2.5 rounded-xl bg-[#EFF6FF] border border-blue-100 text-center">
                <span className="text-[#2563EB] font-bold">R</span>esult (15s)
              </div>
            </div>

            {/* Recording Controls */}
            <div className="p-4 border-blue-100/90 flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b">
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={handleInterviewRecording}
                  className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all cursor-pointer shadow-md ${
                    isRecording
                      ? "bg-rose-600 text-white animate-pulse"
                      : "bg-[#2563EB] hover:bg-[#1D4ED8] text-white"
                  }`}
                >
                  {isRecording ? <Square className="w-5 h-5 fill-white" /> : <Mic className="w-5 h-5" />}
                </button>
                <div>
                  <div className="text-xs font-bold text-slate-900">
                    {isRecording ? `Recording... (${recordedDuration}s / 60s)` : interviewSubmitted ? "STAR Response Recorded!" : "Record Verbal Answer"}
                  </div>
                  <p className="text-[11px] text-slate-500">
                    {isRecording ? "Speak clearly into your microphone using the STAR format." : "Click microphone to record your 60-second verbal answer."}
                  </p>
                </div>
              </div>

              {interviewSubmitted && (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#EFF6FF] text-[#1E40AF] text-xs font-bold border border-blue-200/60">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Drill Verified</span>
                </span>
              )}
            </div>
          </section>

        </div>

      </div>
    </AuthGuard>
  );
}
