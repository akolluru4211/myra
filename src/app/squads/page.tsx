"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import AuthGuard from "@/components/auth/AuthGuard";
import { useAuth } from "@/lib/auth-context";
import { supabase } from "@/lib/supabase";
import { 
  Users, 
  Target, 
  Clock, 
  ArrowRight, 
  Search, 
  UserPlus, 
  AlertCircle, 
  RefreshCw, 
  Compass, 
  Sparkles, 
  ShieldCheck,
  CheckCircle2
} from "lucide-react";

interface StudySquadItem {
  id: string;
  name: string;
  goal: string;
  description: string;
  category: string;
  current_members: number;
  max_members: number;
  meeting_cadence: string;
  created_at: string;
}

const CATEGORIES = [
  "All",
  "DSA & Problem Solving",
  "System Design",
  "Web Development",
  "Aptitude & Placement",
  "Interview Prep",
];

export default function StudySquadsDirectoryPage() {
  const { user } = useAuth();
  const [squads, setSquads] = useState<StudySquadItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");

  const fetchSquads = async () => {
    try {
      setLoading(true);
      setError(null);

      // Attempt fetch from authenticated API
      const params = new URLSearchParams();
      if (selectedCategory !== "All") params.append("category", selectedCategory);
      if (searchQuery.trim()) params.append("search", searchQuery.trim());

      const res = await fetch(`/api/squads?${params.toString()}`);
      
      if (res.ok) {
        const data = await res.json();
        if (data.success && Array.isArray(data.squads)) {
          setSquads(data.squads);
          return;
        }
      }

      // Supabase client fallback
      let query = supabase
        .from("study_squads")
        .select("*")
        .eq("is_active", true)
        .order("created_at", { ascending: false });

      if (selectedCategory !== "All") {
        query = query.eq("category", selectedCategory);
      }
      if (searchQuery.trim()) {
        query = query.ilike("name", `%${searchQuery.trim()}%`);
      }

      const { data: sbData, error: sbErr } = await query;
      if (sbErr) throw sbErr;
      setSquads(sbData || []);
    } catch (err: any) {
      console.error("[Study Squads Load Error]:", err);
      setError("Unable to load study squads. Please check your connection and try again.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSquads();
  }, [selectedCategory]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchSquads();
  };

  return (
    <AuthGuard allowedRoles={["CLIENT", "STUDENT", "ADMIN", "SUPER_ADMIN", "FOUNDER"]}>
      <div className="min-h-screen bg-white text-slate-900 pb-20">
        
        {/* Top Header & Breadcrumb */}
        <div className="bg-white border-b border-blue-200/80 sticky top-0 z-30 shadow-xs">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div>
                <div className="flex items-center gap-2 text-xs font-semibold text-indigo-600 mb-1 tracking-wide uppercase">
                  <Users className="w-4 h-4" />
                  <span>EdWorld Study Squads Directory</span>
                </div>
                <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
                  Collaborative Study Squads
                </h1>
                <p className="text-sm text-slate-500 mt-1 max-w-2xl">
                  Browse focused peer cohorts, commit to weekly interview & placement goals, and stay consistent together.
                </p>
              </div>

              {/* Action: Link to Network / Find Study Partners */}
              <div className="flex items-center gap-3 shrink-0">
                <Link
                  href="/network"
                  className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold shadow-xs hover:shadow-md transition-all active:scale-[0.98]"
                >
                  <UserPlus className="w-4 h-4" />
                  <span>Find Study Partners</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </div>

            {/* Filter Categories */}
            <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pt-5 pb-1">
              {CATEGORIES.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all whitespace-nowrap shrink-0 ${
                    selectedCategory === cat
                      ? "bg-slate-900 text-white shadow-2xs"
                      : "bg-slate-100 text-slate-600 hover:bg-slate-200/70 hover:text-slate-900"
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Search Bar Container */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-6">
          <form onSubmit={handleSearchSubmit} className="flex gap-3 max-w-xl">
            <div className="relative flex-1">
              <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search squads by goal or keyword..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-white border border-blue-200 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all shadow-2xs"
              />
            </div>
            <button
              type="submit"
              className="px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-sm font-semibold transition-all shrink-0 shadow-2xs"
            >
              Search
            </button>
          </form>
        </div>

        {/* Content Directory State Handling */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-6">
          
          {/* Loading State */}
          {loading && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div key={i} className="bg-white rounded-2xl p-6 border border-blue-200/80 shadow-2xs animate-pulse">
                  <div className="h-4 bg-slate-200 rounded w-1/3 mb-4"></div>
                  <div className="h-6 bg-slate-200 rounded w-3/4 mb-3"></div>
                  <div className="h-4 bg-slate-100 rounded w-full mb-2"></div>
                  <div className="h-4 bg-slate-100 rounded w-4/5 mb-6"></div>
                  <div className="flex justify-between items-center pt-4 border-t border-blue-100">
                    <div className="h-4 bg-slate-200 rounded w-1/4"></div>
                    <div className="h-8 bg-slate-200 rounded w-20"></div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Error & Retry State */}
          {!loading && error && (
            <div className="bg-white rounded-2xl p-8 border border-rose-200 shadow-2xs text-center max-w-lg mx-auto">
              <div className="w-12 h-12 rounded-full bg-rose-50 text-rose-600 flex items-center justify-center mx-auto mb-3">
                <AlertCircle className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-slate-900">Failed to load squads</h3>
              <p className="text-sm text-slate-500 mt-1 mb-5">{error}</p>
              <button
                onClick={fetchSquads}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-900 text-white text-xs font-semibold hover:bg-slate-800 transition-all"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Retry Connection</span>
              </button>
            </div>
          )}

          {/* Empty State */}
          {!loading && !error && squads.length === 0 && (
            <div className="bg-white rounded-2xl p-10 border border-blue-200/80 shadow-2xs text-center max-w-md mx-auto my-8">
              <div className="w-14 h-14 rounded-2xl bg-[#EFF6FF] text-indigo-600 flex items-center justify-center mx-auto mb-4">
                <Compass className="w-7 h-7" />
              </div>
              <h3 className="text-lg font-bold text-slate-900">No squads found</h3>
              <p className="text-sm text-slate-500 mt-1.5 mb-6">
                There are currently no active squads matching your filter criteria. Connect with peers to start a new squad.
              </p>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
                <button
                  onClick={() => { setSelectedCategory("All"); setSearchQuery(""); }}
                  className="w-full sm:w-auto px-4 py-2.5 rounded-xl border border-blue-200 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-all"
                >
                  Clear Filters
                </button>
                <Link
                  href="/network"
                  className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-indigo-600 text-white text-xs font-semibold hover:bg-indigo-700 transition-all inline-flex items-center justify-center gap-1.5"
                >
                  <UserPlus className="w-3.5 h-3.5" />
                  <span>Find Peers in Network</span>
                </Link>
              </div>
            </div>
          )}

          {/* Populated Directory Grid */}
          {!loading && !error && squads.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {squads.map((squad) => {
                const isFull = squad.current_members >= squad.max_members;

                return (
                  <div
                    key={squad.id}
                    className="bg-white rounded-2xl p-6 border border-blue-200/80 shadow-2xs hover:shadow-md hover:border-blue-200 transition-all flex flex-col justify-between group"
                  >
                    <div>
                      {/* Badge / Category */}
                      <div className="flex items-center justify-between gap-2 mb-3">
                        <span className="px-2.5 py-1 rounded-md text-[11px] font-semibold bg-[#EFF6FF] text-indigo-700 border border-blue-200">
                          {squad.category}
                        </span>
                        <div className="flex items-center gap-1 text-xs font-medium text-slate-500">
                          <Users className="w-3.5 h-3.5 text-slate-400" />
                          <span>{squad.current_members} / {squad.max_members}</span>
                        </div>
                      </div>

                      {/* Squad Name & Study Goal */}
                      <h3 className="text-lg font-bold text-slate-900 group-hover:text-indigo-600 transition-colors">
                        {squad.name}
                      </h3>
                      
                      <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-700 mt-2">
                        <Target className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
                        <span className="line-clamp-1">{squad.goal}</span>
                      </div>

                      <p className="text-xs text-slate-500 mt-2 leading-relaxed line-clamp-2">
                        {squad.description || "Consistent peer study sprints with daily accountability and review check-ins."}
                      </p>
                    </div>

                    {/* Cadence & Footer Info */}
                    <div className="mt-5 pt-4 border-t border-blue-100 flex items-center justify-between gap-2">
                      <div className="flex items-center gap-1.5 text-[11px] text-slate-500">
                        <Clock className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span className="truncate max-w-[150px]">{squad.meeting_cadence}</span>
                      </div>

                      <span className={`text-[11px] font-bold px-2 py-0.5 rounded ${
                        isFull 
                          ? "bg-[#EFF6FF] text-[#1E40AF] border border-blue-200" 
                          : "bg-[#EFF6FF] text-[#1E40AF] border border-blue-200"
                      }`}>
                        {isFull ? "Squad Full" : "Open Squad"}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

        </div>
      </div>
    </AuthGuard>
  );
}
