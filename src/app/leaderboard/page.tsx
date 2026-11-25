"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useAuth } from "@/lib/auth-context";
import AuthGuard from "@/components/auth/AuthGuard";
import { 
  Trophy, 
  Flame, 
  ArrowLeft, 
  Sparkles, 
  Users, 
  ShieldCheck, 
  Medal, 
  Zap, 
  RefreshCw,
  Lock,
  ArrowRight
} from "lucide-react";

interface LeaderboardEntry {
  userId: string;
  name: string;
  points: number;
  currentStreak: number;
  rank: number;
  isCurrentUser: boolean;
}

export default function LeaderboardPage() {
  const { user } = useAuth();
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [currentUserRank, setCurrentUserRank] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Check track eligibility (18+ Adult Career Track)
  const isMinor = user?.ageBand && user.ageBand !== "18+";

  const fetchLeaderboard = async () => {
    if (!user?.uid) return;
    setLoading(true);
    setError(null);

    try {
      const res = await fetch(`/api/gamification/leaderboard?userId=${user.uid}`);
      const data = await res.json();

      if (res.status === 403) {
        setError(data.error || "Leaderboard is disabled for student safety tracks per EdWorld Co. wellbeing policies.");
        return;
      }

      if (!res.ok) {
        throw new Error(data.error || "Failed to load leaderboard");
      }

      setEntries(data.leaderboard || []);
      setCurrentUserRank(data.currentUserRank || null);
    } catch (err: any) {
      setError(err?.message || "Failed to load peer standings.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user?.uid) {
      fetchLeaderboard();
    } else {
      setLoading(false);
    }
  }, [user?.uid]);

  return (
    <AuthGuard>
      <div className="min-h-screen bg-[#F8FAFC] py-8 sm:py-12 px-4 sm:px-6 lg:px-8 font-sans">
        <div className="max-w-4xl mx-auto space-y-6">
          
          {/* Header & Back Navigation */}
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
                href="/daily"
                className="text-xs text-slate-500 hover:text-slate-800 font-medium px-2.5 py-1 rounded-lg hover:bg-slate-200/60 transition-colors"
              >
                Daily Challenge
              </Link>
              <Link
                href="/squads"
                className="text-xs text-slate-500 hover:text-slate-800 font-medium px-2.5 py-1 rounded-lg hover:bg-slate-200/60 transition-colors"
              >
                Study Squads
              </Link>
              <span className="text-xs text-blue-700 bg-blue-50 border border-blue-200 font-bold px-2.5 py-1 rounded-lg">
                Weekly Standings
              </span>
            </div>
          </div>

          {/* Banner Card */}
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-xs relative overflow-hidden">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="space-y-1.5">
                <div className="flex items-center gap-2">
                  <div className="w-10 h-10 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center font-bold border border-amber-200/60">
                    <Trophy className="w-5 h-5 text-amber-600" />
                  </div>
                  <div>
                    <h1 className="text-xl sm:text-2xl font-black text-slate-900 font-display tracking-tight">
                      Weekly Peer Leaderboard
                    </h1>
                    <p className="text-xs text-slate-500">
                      Earn XP through Daily Challenges, DSA Practice, and Mock Interviews to climb weekly standings
                    </p>
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={fetchLeaderboard}
                disabled={loading}
                className="p-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-600 hover:text-slate-900 transition-colors cursor-pointer self-start sm:self-auto"
                title="Refresh rankings"
                aria-label="Refresh rankings"
              >
                <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin text-blue-600" : ""}`} />
              </button>
            </div>
          </div>

          {/* Minor Wellbeing Protection Policy Notice */}
          {isMinor && (
            <div className="bg-blue-50 border border-blue-200 rounded-3xl p-6 text-center space-y-3">
              <div className="w-10 h-10 rounded-2xl bg-blue-100 text-blue-700 flex items-center justify-center mx-auto">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <h2 className="text-base font-bold text-blue-900 font-display">
                Wellbeing &amp; Student Safety Protection Active
              </h2>
              <p className="text-xs text-blue-700 max-w-lg mx-auto leading-relaxed">
                In compliance with student wellbeing guidelines, public rank competition is disabled on youth explorer tracks. You can continue earning XP, protecting your habit streaks, and reviewing personal progress on your Daily Challenge dashboard.
              </p>
              <Link
                href="/daily"
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-xs transition-colors"
              >
                <span>Go to Daily Challenges</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          )}

          {/* Standings Table */}
          {!isMinor && (
            <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs overflow-hidden">
              <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Medal className="w-4 h-4 text-slate-400" />
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                    Connected Peers &bull; Current Week
                  </span>
                </div>
                {currentUserRank && (
                  <span className="text-xs font-bold text-blue-700 bg-blue-50 px-3 py-1 rounded-full border border-blue-200">
                    Your Rank: #{currentUserRank}
                  </span>
                )}
              </div>

              {loading ? (
                <div className="p-12 text-center space-y-3">
                  <RefreshCw className="w-6 h-6 animate-spin text-blue-600 mx-auto" />
                  <p className="text-xs text-slate-500 font-medium">Loading peer standings...</p>
                </div>
              ) : error ? (
                <div className="p-8 text-center text-xs text-slate-600 space-y-3">
                  <p>{error}</p>
                  <button
                    type="button"
                    onClick={fetchLeaderboard}
                    className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs cursor-pointer"
                  >
                    Try Again
                  </button>
                </div>
              ) : entries.length === 0 ? (
                <div className="p-12 text-center space-y-4">
                  <div className="w-12 h-12 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
                    <Users className="w-6 h-6" />
                  </div>
                  <div className="space-y-1">
                    <h3 className="text-sm font-bold text-slate-900">No Standings Yet</h3>
                    <p className="text-xs text-slate-500 max-w-sm mx-auto">
                      Connect with peers in your university or network to compare weekly challenge progress and celebrate achievements together.
                    </p>
                  </div>
                  <Link
                    href="/network"
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-xs transition-colors"
                  >
                    <span>Find Peer Connections</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              ) : (
                <div className="divide-y divide-slate-100">
                  {entries.map((entry) => (
                    <div
                      key={entry.userId}
                      className={`px-6 py-4 flex items-center justify-between text-xs transition-colors ${
                        entry.isCurrentUser ? "bg-blue-50/60 font-semibold" : "hover:bg-slate-50/60"
                      }`}
                    >
                      <div className="flex items-center gap-3.5 min-w-0">
                        <span
                          className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${
                            entry.rank === 1
                              ? "bg-amber-100 text-amber-800 border border-amber-300"
                              : entry.rank === 2
                              ? "bg-slate-200 text-slate-700 border border-slate-300"
                              : entry.rank === 3
                              ? "bg-amber-50 text-amber-700 border border-amber-200"
                              : "bg-slate-100 text-slate-600"
                          }`}
                        >
                          {entry.rank}
                        </span>
                        <div className="min-w-0">
                          <span className="font-bold text-slate-900 block truncate">
                            {entry.name} {entry.isCurrentUser && <span className="text-blue-600 font-normal">(You)</span>}
                          </span>
                          <span className="text-[10px] text-slate-500 flex items-center gap-1">
                            <Flame className="w-3 h-3 text-orange-500 shrink-0" />
                            <span>{entry.currentStreak}-day habit streak</span>
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5 font-mono font-bold text-slate-900 shrink-0">
                        <Zap className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
                        <span>{entry.points} XP</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

        </div>
      </div>
    </AuthGuard>
  );
}