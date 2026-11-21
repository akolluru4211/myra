"use client";

export const dynamic = "force-dynamic";

import React, { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Users,
  Plus,
  Key,
  Lock,
  Globe,
  ArrowRight,
  Sparkles,
  ExternalLink,
  ShieldCheck,
  CheckCircle2,
  Clock,
  Layers,
  Copy,
  Check,
  Search,
  User,
  AlertCircle,
  X,
  Share2
} from "lucide-react";
import AuthGuard from "@/components/auth/AuthGuard";
import { useAuth } from "@/lib/auth-context";
import { PROBLEM_STATEMENTS_DATA } from "@/lib/projects/problem-statements-data";

interface GroupMember {
  user_id: string;
  name: string;
  avatar_url?: string;
  role: "LEADER" | "MEMBER";
  username?: string;
}

interface EdBuildGroup {
  id: string;
  name: string;
  access_type: "public" | "private";
  join_key?: string;
  team_size: number;
  current_members_count: number;
  leader_name: string;
  leader_email: string;
  leader_phone?: string;
  problem_statement: string;
  status: "OPEN" | "FULL" | "IN_PROGRESS" | "PENDING_REVIEW" | "APPROVED" | "REJECTED";
  created_at: string;
  members?: GroupMember[];
}

function EdBuildContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, profile } = useAuth();

  const [publicGroups, setPublicGroups] = useState<EdBuildGroup[]>([]);
  const [myGroups, setMyGroups] = useState<EdBuildGroup[]>([]);
  const [loading, setLoading] = useState(true);

  // Modals state
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isJoinKeyModalOpen, setIsJoinKeyModalOpen] = useState(false);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  // Group creation form state
  const [accessType, setAccessType] = useState<"public" | "private">("public");
  const [projectName, setProjectName] = useState("");
  const [teamSize, setTeamSize] = useState<number>(4);
  const [leaderName, setLeaderName] = useState(profile?.name || user?.name || "");
  const [leaderEmail, setLeaderEmail] = useState(profile?.email || user?.email || "");
  const [leaderPhone, setLeaderPhone] = useState(profile?.phone || "");
  const [selectedProblemPreset, setSelectedProblemPreset] = useState<string>("");
  const [problemStatement, setProblemStatement] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [createSuccessData, setCreateSuccessData] = useState<{ groupId: string; joinKey?: string; accessType: string } | null>(null);

  // Private key input state
  const [enteredKey, setEnteredKey] = useState("");
  const [keyError, setKeyError] = useState<string | null>(null);
  const [isJoiningKey, setIsJoiningKey] = useState(false);

  // Filter state for public groups
  const [searchFilter, setSearchFilter] = useState("");

  // Sync profile details
  useEffect(() => {
    if (profile?.name && !leaderName) setLeaderName(profile.name);
    if (profile?.email && !leaderEmail) setLeaderEmail(profile.email);
    if (profile?.phone && !leaderPhone) setLeaderPhone(profile.phone);
  }, [profile]);

  // Handle auto-population from query params (e.g. redirected from Project Studio)
  useEffect(() => {
    const problemIdParam = searchParams.get("problemId");
    const createParam = searchParams.get("create");

    if (problemIdParam) {
      const found = PROBLEM_STATEMENTS_DATA.find((p) => p.id === problemIdParam);
      if (found) {
        setSelectedProblemPreset(found.id);
        setProjectName((prev) => prev || found.title);
        setProblemStatement(found.problemStatement);
        if (createParam === "true") {
          setIsCreateModalOpen(true);
        }
      }
    }
  }, [searchParams]);

  // Load groups data
  const loadGroups = async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/edbuild/groups?userId=${user?.uid || ""}`);
      const data = await res.json();
      if (data.publicGroups) setPublicGroups(data.publicGroups);
      if (data.myGroups) setMyGroups(data.myGroups);
    } catch (err) {
      console.error("Failed to load EdBuild groups:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadGroups();
  }, [user]);

  const handleSelectPreset = (presetId: string) => {
    setSelectedProblemPreset(presetId);
    if (!presetId) return;
    const found = PROBLEM_STATEMENTS_DATA.find((p) => p.id === presetId);
    if (found) {
      setProjectName(found.title);
      setProblemStatement(found.problemStatement);
    }
  };

  const handleCreateGroup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!projectName.trim() || !problemStatement.trim()) return;

    try {
      setIsSubmitting(true);
      const res = await fetch("/api/edbuild/groups", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: projectName,
          access_type: accessType,
          team_size: teamSize,
          leader_id: user?.uid,
          leader_name: leaderName,
          leader_email: leaderEmail,
          leader_phone: leaderPhone,
          problem_statement: problemStatement,
          preset_id: selectedProblemPreset || null,
        }),
      });

      const data = await res.json();
      if (data.success && data.group) {
        setCreateSuccessData({
          groupId: data.group.id,
          joinKey: data.group.join_key,
          accessType: data.group.access_type,
        });
        loadGroups();
      } else {
        alert(data.error || "Failed to create group");
      }
    } catch (err: any) {
      alert(err.message || "Failed to create group");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleJoinByKey = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!enteredKey.trim()) return;

    try {
      setIsJoiningKey(true);
      setKeyError(null);
      const res = await fetch("/api/edbuild/join-by-key", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          join_key: enteredKey.trim(),
          userId: user?.uid,
          name: profile?.name || user?.name || "Student",
          email: profile?.email || user?.email,
          phone: profile?.phone,
          avatar_url: (profile as any)?.avatar_url || (profile as any)?.photo_url,
        }),
      });

      const data = await res.json();
      if (data.success && data.groupId) {
        setIsJoinKeyModalOpen(false);
        router.push(`/edbuild/${data.groupId}`);
      } else {
        setKeyError(data.error || "Invalid join key or room is full.");
      }
    } catch (err: any) {
      setKeyError(err.message || "Failed to verify key.");
    } finally {
      setIsJoiningKey(false);
    }
  };

  const handleJoinPublicGroup = async (group: EdBuildGroup) => {
    try {
      const res = await fetch(`/api/edbuild/groups/${group.id}/join`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: user?.uid,
          name: profile?.name || user?.name || "Student",
          email: profile?.email || user?.email,
          phone: profile?.phone,
          avatar_url: (profile as any)?.avatar_url || (profile as any)?.photo_url,
        }),
      });

      const data = await res.json();
      if (data.success && data.groupId) {
        router.push(`/edbuild/${data.groupId}`);
      } else {
        alert(data.error || "Unable to join room");
      }
    } catch (err: any) {
      alert(err.message || "Failed to join group");
    }
  };

  const handleCopyKey = (key: string) => {
    if (typeof navigator !== "undefined" && navigator.clipboard) {
      navigator.clipboard.writeText(key);
      setCopiedKey(key);
      setTimeout(() => setCopiedKey(null), 2500);
    }
  };

  const filteredPublicGroups = publicGroups.filter((g) => {
    const q = searchFilter.toLowerCase().trim();
    if (!q) return true;
    return (
      g.name.toLowerCase().includes(q) ||
      g.problem_statement.toLowerCase().includes(q) ||
      g.leader_name.toLowerCase().includes(q)
    );
  });

  return (
    <AuthGuard>
      <div className="w-full text-white font-sans space-y-6 sm:space-y-8 animate-in fade-in duration-200">
        {/* 1. HERO & ACTION BAR */}
          <section className="tactile-chassis bg-[#0C101A] border border-white/10 p-6 sm:p-8 rounded-3xl flex flex-col md:flex-row md:items-center justify-between gap-5 relative overflow-hidden shadow-xl text-white">
            <div className="space-y-2.5 max-w-2xl relative z-10">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-blue-500/10 text-blue-300 border border-blue-500/20 font-display">
                  ✦ EdBuild Squads
                </span>
                <span className="text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-white/5 text-slate-300 border border-white/10 font-mono">
                  GitHub Proof Verified
                </span>
                <span className="text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-300 border border-emerald-500/20 font-mono">
                  Certificates Enabled
                </span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-black text-white font-display tracking-tight">
                Team Up, Build Real Projects &amp; Earn Verified Certificates
              </h1>
              <p className="text-xs sm:text-sm text-slate-300 leading-relaxed font-normal">
                Collaborate in live chat rooms, submit code repositories for review, and receive verified certificates of completion.
              </p>
            </div>

            <div className="flex flex-wrap sm:flex-nowrap items-center gap-3 shrink-0">
              <button
                type="button"
                onClick={() => {
                  setCreateSuccessData(null);
                  setIsCreateModalOpen(true);
                }}
                className="px-5 py-2.5 rounded-xl font-bold text-xs bg-white hover:bg-slate-200 text-slate-950 inline-flex items-center gap-2 cursor-pointer shadow-md transition-all"
              >
                <Plus className="w-4 h-4 text-slate-950" />
                <span>Create a Group</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setKeyError(null);
                  setEnteredKey("");
                  setIsJoinKeyModalOpen(true);
                }}
                className="px-4 py-2.5 rounded-xl font-bold text-xs bg-[#0F1422] hover:bg-white/10 border border-white/10 text-white inline-flex items-center gap-2 cursor-pointer transition-all"
              >
                <Key className="w-4 h-4 text-white" />
                <span>Join with Private Key</span>
              </button>
            </div>
          </section>

          {/* 2. MY ACTIVE GROUPS (If User has groups) */}
          {myGroups.length > 0 && (
            <section className="space-y-3">
              <div className="flex items-center justify-between">
                <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-400 flex items-center gap-2">
                  <Layers className="w-4 h-4 text-white" />
                  <span>My Active EdBuild Workspaces ({myGroups.length})</span>
                </h2>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {myGroups.map((group) => (
                  <div
                    key={group.id}
                    className="tactile-chassis bg-[#0C101A] border border-white/10 hover:border-white/20 p-5 rounded-2xl transition-all flex flex-col justify-between space-y-3 group shadow-xl text-white"
                  >
                    <div className="space-y-2">
                      <div className="flex items-center justify-between gap-2">
                        <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-semibold border ${
                          group.access_type === "private" ? "bg-amber-500/10 text-amber-300 border-amber-500/20" : "bg-blue-500/10 text-blue-300 border-blue-500/20"
                        }`}>
                          {group.access_type === "private" ? "Private Room" : "Public Room"}
                        </span>
                        <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-semibold border ${
                          group.status === "APPROVED"
                            ? "bg-emerald-500/10 text-emerald-300 border-emerald-500/20"
                            : group.status === "PENDING_REVIEW"
                            ? "bg-amber-500/10 text-amber-300 border-amber-500/20"
                            : "bg-white/5 text-slate-400 border-white/10"
                        }`}>
                          {group.status}
                        </span>
                      </div>
                      <h3 className="text-base font-bold text-white mt-1 line-clamp-1 group-hover:text-cyan-400 transition-colors font-display">{group.name}</h3>
                      <p className="text-xs text-slate-300 line-clamp-2 font-normal leading-relaxed">{group.problem_statement}</p>
                    </div>

                    <div className="pt-3 border-t border-white/10 flex items-center justify-between">
                      <span className="text-xs text-slate-400 font-mono">
                        {group.current_members_count} / {group.team_size} Members
                      </span>
                      <Link
                        href={`/edbuild/${group.id}`}
                        className="px-3.5 py-1.5 rounded-xl font-bold text-xs bg-white hover:bg-slate-200 text-slate-950 inline-flex items-center gap-1.5 cursor-pointer shadow-md transition-all"
                      >
                        <span>Open Studio</span>
                        <ArrowRight className="w-3.5 h-3.5 text-slate-950" />
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* 3. PUBLIC DIRECTORY & DISCOVERY */}
          <section className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h2 className="text-xl font-bold text-white font-display">
                  Public Project Teams Directory
                </h2>
                <p className="text-xs text-slate-400 font-normal">
                  Find an open squad or join an existing build team before capacity fills up.
                </p>
              </div>

              {/* Search Bar */}
              <div className="relative w-full sm:w-72">
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search public groups..."
                  value={searchFilter}
                  onChange={(e) => setSearchFilter(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 text-xs bg-[#0F1422] border border-white/15 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-white/30"
                />
              </div>
            </div>

            {/* Groups Grid */}
            {filteredPublicGroups.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {filteredPublicGroups.map((group) => {
                  const isFull = Number(group.current_members_count) >= Number(group.team_size);
                  const isMember = myGroups.some((mg) => mg.id === group.id);

                  return (
                    <div
                      key={group.id}
                      className="tactile-chassis bg-[#0C101A] border border-white/10 hover:border-white/20 p-6 rounded-3xl transition-all flex flex-col justify-between space-y-4 group text-white shadow-xl"
                    >
                      <div className="space-y-2">
                        {/* Status / Capacity Header */}
                        <div className="flex items-center justify-between gap-2">
                          <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-blue-500/10 text-blue-300 border border-blue-500/20">
                            Public Group
                          </span>

                          {isFull ? (
                            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-rose-500/10 text-rose-300 border border-rose-500/20">
                              Room Full
                            </span>
                          ) : (
                            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-500/10 text-emerald-300 border border-emerald-500/20">
                              {Number(group.team_size) - Number(group.current_members_count)} Slots Open
                            </span>
                          )}
                        </div>

                        {/* Title */}
                        <h3 className="text-base font-bold text-white leading-snug line-clamp-1 group-hover:text-cyan-400 transition-colors font-display">
                          {group.name}
                        </h3>

                        {/* Problem Statement */}
                        <p className="text-xs text-slate-300 leading-relaxed line-clamp-3 font-normal">
                          {group.problem_statement}
                        </p>
                      </div>

                      {/* Team Members with Portfolios */}
                      <div className="pt-3 border-t border-white/10 space-y-2">
                        <div className="flex items-center justify-between text-[11px] text-slate-400">
                          <span>Team Roster ({group.current_members_count}/{group.team_size}):</span>
                          <span className="font-semibold text-white">Lead: {group.leader_name}</span>
                        </div>

                        <div className="flex flex-wrap items-center gap-1.5">
                          {group.members && group.members.length > 0 ? (
                            group.members.map((m, mIdx) => (
                              <Link
                                key={mIdx}
                                href={`/u/${m.user_id}/portfolio`}
                                title={`View ${m.name}'s Portfolio`}
                                className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-[#0F1422] hover:bg-white/10 text-[11px] text-slate-300 font-medium transition-all rounded-lg border border-white/10"
                              >
                                {m.avatar_url ? (
                                  <img src={m.avatar_url} alt="" className="w-4 h-4 rounded-full object-cover border border-white/15" />
                                ) : (
                                  <User className="w-3.5 h-3.5 text-slate-400" />
                                )}
                                <span className="truncate max-w-[90px]">{m.name.split(" ")[0]}</span>
                              </Link>
                            ))
                          ) : (
                            <span className="text-xs font-semibold text-white">{group.leader_name}</span>
                          )}
                        </div>
                      </div>

                      {/* Action Button */}
                      <div className="pt-3 border-t border-white/10">
                        {isMember ? (
                          <Link
                            href={`/edbuild/${group.id}`}
                            className="w-full py-2.5 px-3.5 text-xs font-bold rounded-xl bg-white hover:bg-slate-200 text-slate-950 inline-flex items-center justify-center gap-1.5 shadow-md cursor-pointer transition-all"
                          >
                            <span>Open Workspace</span>
                            <ArrowRight className="w-3.5 h-3.5 text-slate-950" />
                          </Link>
                        ) : isFull ? (
                          <button
                            disabled
                            className="w-full py-2.5 px-3.5 rounded-xl bg-white/5 text-slate-500 border border-white/10 text-xs font-medium cursor-not-allowed text-center"
                          >
                            Room Full (Max {group.team_size})
                          </button>
                        ) : (
                          <button
                            onClick={() => handleJoinPublicGroup(group)}
                            className="w-full py-2.5 px-3.5 text-xs font-bold rounded-xl bg-white hover:bg-slate-200 text-slate-950 inline-flex items-center justify-center gap-1.5 shadow-md cursor-pointer transition-all"
                          >
                            <span>Join Squad</span>
                            <ArrowRight className="w-3.5 h-3.5 text-slate-950" />
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="tactile-chassis bg-[#0C101A] border border-white/10 p-10 text-center space-y-3 rounded-3xl shadow-xl text-white">
                <div className="w-12 h-12 rounded-2xl bg-[#0F1422] text-slate-400 flex items-center justify-center mx-auto border border-white/10 shadow-md">
                  <Users className="w-6 h-6 text-slate-400" />
                </div>
                <h3 className="text-base font-bold text-white font-display">No public groups found</h3>
                <p className="text-xs text-slate-300 font-normal">
                  Be the first to launch a public team for your engineering project.
                </p>
                <button
                  onClick={() => setIsCreateModalOpen(true)}
                  className="mt-2 px-5 py-2.5 text-xs font-bold rounded-xl bg-white hover:bg-slate-200 text-slate-950 shadow-md cursor-pointer transition-all inline-flex items-center"
                >
                  Create Group
                </button>
              </div>
            )}
          </section>

          {/* 4. CREATE GROUP MODAL */}
          {isCreateModalOpen && (
            <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-md flex items-center justify-center p-3 sm:p-5 animate-in fade-in duration-150">
              <div className="tactile-chassis bg-[#0C101A] border border-white/10 shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden text-white font-sans rounded-3xl">
                
                {/* Modal Header */}
                <div className="p-5 sm:p-6 border-b border-white/10 flex items-center justify-between bg-[#0F1422] shrink-0">
                  <div>
                    <h3 className="text-lg font-bold text-white font-display">
                      Create an EdBuild Project Group
                    </h3>
                    <p className="text-xs text-slate-400 mt-0.5 font-normal">
                      Configure your team size, access type, and engineering problem statement.
                    </p>
                  </div>
                  <button
                    onClick={() => {
                      setIsCreateModalOpen(false);
                      setCreateSuccessData(null);
                    }}
                    className="text-slate-400 hover:text-white p-1.5 rounded-lg hover:bg-white/10 transition-colors cursor-pointer"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                {/* Success View */}
                {createSuccessData ? (
                  <div className="p-8 text-center space-y-5 my-auto">
                    <div className="w-14 h-14 rounded-2xl bg-emerald-500/10 text-emerald-300 border border-emerald-500/20 flex items-center justify-center mx-auto shadow-md">
                      <Check className="w-7 h-7" />
                    </div>
                    <h3 className="text-xl font-bold text-white font-display">
                      EdBuild Group Created Successfully!
                    </h3>

                    {createSuccessData.accessType === "private" && createSuccessData.joinKey && (
                      <div className="p-5 rounded-2xl bg-[#0F1422] border border-white/10 max-w-sm mx-auto space-y-2.5">
                        <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
                          Your Private Room Join Key
                        </span>
                        <div className="text-2xl font-mono font-bold text-white tracking-wider select-all">
                          {createSuccessData.joinKey}
                        </div>
                        <button
                          onClick={() => handleCopyKey(createSuccessData.joinKey!)}
                          className="px-4 py-1.5 rounded-xl text-xs font-bold bg-white hover:bg-slate-200 text-slate-950 inline-flex items-center gap-1.5 cursor-pointer shadow-md transition-all"
                        >
                          {copiedKey === createSuccessData.joinKey ? (
                            <>
                              <Check className="w-3.5 h-3.5 text-emerald-600" />
                              <span>Key Copied</span>
                            </>
                          ) : (
                            <>
                              <Copy className="w-3.5 h-3.5 text-slate-950" />
                              <span>Copy Key</span>
                            </>
                          )}
                        </button>
                        <p className="text-[11px] text-slate-400 mt-1 font-normal">
                          Share this key with your teammates so they can join your workspace.
                        </p>
                      </div>
                    )}

                    <div className="pt-3 flex justify-center gap-2">
                      <button
                        onClick={() => {
                          setIsCreateModalOpen(false);
                          router.push(`/edbuild/${createSuccessData.groupId}`);
                        }}
                        className="px-6 py-2.5 rounded-xl font-bold text-xs bg-white hover:bg-slate-200 text-slate-950 cursor-pointer shadow-md transition-all"
                      >
                        Enter Workspace Now
                      </button>
                    </div>
                  </div>
                ) : (
                  /* Form View */
                  <form onSubmit={handleCreateGroup} className="p-5 sm:p-6 overflow-y-auto space-y-4">
                    
                    {/* Access Type Toggle */}
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold uppercase tracking-wider text-slate-400">
                        Workspace Access Type
                      </label>
                      <div className="grid grid-cols-2 gap-3">
                        <button
                          type="button"
                          onClick={() => setAccessType("public")}
                          className={`p-3.5 rounded-xl border text-left transition-all cursor-pointer ${
                            accessType === "public"
                              ? "bg-white text-slate-950 border-white shadow-md font-bold"
                              : "bg-[#0F1422] border-white/10 text-white hover:border-white/20"
                          }`}
                        >
                          <div className="flex items-center gap-2 font-bold text-xs">
                            <Globe className="w-4 h-4" />
                            <span>Public Group</span>
                          </div>
                          <p className={`text-[11px] mt-1 font-normal ${accessType === "public" ? "text-slate-800" : "text-slate-400"}`}>
                            Listed in the directory. Any student can discover and join.
                          </p>
                        </button>

                        <button
                          type="button"
                          onClick={() => setAccessType("private")}
                          className={`p-3.5 rounded-xl border text-left transition-all cursor-pointer ${
                            accessType === "private"
                              ? "bg-white text-slate-950 border-white shadow-md font-bold"
                              : "bg-[#0F1422] border-white/10 text-white hover:border-white/20"
                          }`}
                        >
                          <div className="flex items-center gap-2 font-bold text-xs">
                            <Lock className="w-4 h-4" />
                            <span>Private Group</span>
                          </div>
                          <p className={`text-[11px] mt-1 font-normal ${accessType === "private" ? "text-slate-800" : "text-slate-400"}`}>
                            Generates a private key. Only teammates with the key can join.
                          </p>
                        </button>
                      </div>
                    </div>

                    {/* Team Size Selector */}
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center justify-between">
                        <span>Max Team Size (Members)</span>
                        <span className="text-white font-bold">{teamSize} Members</span>
                      </label>
                      <div className="flex items-center gap-2">
                        {[2, 3, 4, 5, 6].map((size) => (
                          <button
                            key={size}
                            type="button"
                            onClick={() => setTeamSize(size)}
                            className={`flex-1 py-2 text-xs font-bold rounded-xl border transition-all cursor-pointer ${
                              teamSize === size
                                ? "bg-white text-slate-950 border-white shadow-sm"
                                : "bg-[#0F1422] border-white/10 text-slate-300 hover:text-white"
                            }`}
                          >
                            {size}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Project Name */}
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-white uppercase tracking-wider">
                        Project Name *
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. Distributed Rate Limiting Proxy, RAG Copilot..."
                        value={projectName}
                        onChange={(e) => setProjectName(e.target.value)}
                        className="w-full px-3.5 py-2.5 text-xs bg-[#0F1422] border border-white/15 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-white/30"
                      />
                    </div>

                    {/* Leader Information (for public verification) */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div className="space-y-1">
                        <label className="text-xs font-bold text-white uppercase tracking-wider">Team Leader *</label>
                        <input
                          type="text"
                          required
                          value={leaderName}
                          onChange={(e) => setLeaderName(e.target.value)}
                          className="w-full px-3.5 py-2 text-xs bg-[#0F1422] border border-white/15 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-white/30"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-xs font-bold text-white uppercase tracking-wider">Email ID *</label>
                        <input
                          type="email"
                          required
                          value={leaderEmail}
                          onChange={(e) => setLeaderEmail(e.target.value)}
                          className="w-full px-3.5 py-2 text-xs bg-[#0F1422] border border-white/15 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-white/30"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-xs font-bold text-white uppercase tracking-wider">Phone</label>
                        <input
                          type="tel"
                          placeholder="+91..."
                          value={leaderPhone}
                          onChange={(e) => setLeaderPhone(e.target.value)}
                          className="w-full px-3.5 py-2 text-xs bg-[#0F1422] border border-white/15 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-white/30"
                        />
                      </div>
                    </div>

                    {/* Problem Statement Preset Picker */}
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-white uppercase tracking-wider flex items-center justify-between">
                        <span>Select Curated Problem Statement (Optional)</span>
                        <span className="text-[11px] text-cyan-400 font-medium">Auto-fills</span>
                      </label>
                      <select
                        value={selectedProblemPreset}
                        onChange={(e) => handleSelectPreset(e.target.value)}
                        className="w-full px-3.5 py-2 text-xs bg-[#0F1422] border border-white/15 rounded-xl text-white focus:outline-none focus:border-white/30 cursor-pointer"
                      >
                        <option value="">-- Choose a standard industry problem --</option>
                        {PROBLEM_STATEMENTS_DATA.map((p) => (
                          <option key={p.id} value={p.id}>
                            [{p.domain}] {p.title} ({p.difficulty})
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Problem Statement Text Area */}
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-white uppercase tracking-wider">
                        Problem Statement &amp; Scope *
                      </label>
                      <textarea
                        required
                        rows={4}
                        placeholder="Describe the real-world technical problem your team will solve..."
                        value={problemStatement}
                        onChange={(e) => setProblemStatement(e.target.value)}
                        className="w-full px-3.5 py-2.5 text-xs bg-[#0F1422] border border-white/15 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-white/30 leading-relaxed"
                      />
                    </div>

                    {/* Submit Button */}
                    <div className="pt-3 border-t border-white/10 flex items-center justify-end gap-2">
                      <button
                        type="button"
                        onClick={() => setIsCreateModalOpen(false)}
                        className="px-4 py-2 rounded-xl text-xs font-medium text-slate-400 hover:text-white cursor-pointer"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        disabled={isSubmitting}
                        className="px-5 py-2.5 rounded-xl text-xs font-bold bg-white hover:bg-slate-200 text-slate-950 cursor-pointer shadow-md transition-all"
                      >
                        {isSubmitting ? "Creating Group..." : accessType === "private" ? "Create Private Group & Key" : "Publish Public Group"}
                      </button>
                    </div>
                  </form>
                )}
              </div>
            </div>
          )}

          {/* 5. JOIN WITH PRIVATE KEY MODAL */}
          {isJoinKeyModalOpen && (
            <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-150">
              <div className="tactile-chassis bg-[#0C101A] border border-white/10 shadow-2xl w-full max-w-md overflow-hidden text-white font-sans rounded-3xl">
                <div className="p-5 border-b border-white/10 flex items-center justify-between bg-[#0F1422]">
                  <div className="flex items-center gap-2">
                    <Key className="w-5 h-5 text-white" />
                    <h3 className="text-base font-bold text-white font-display">
                      Join Private EdBuild Workspace
                    </h3>
                  </div>
                  <button onClick={() => setIsJoinKeyModalOpen(false)} className="text-slate-400 hover:text-white p-1.5 rounded-lg hover:bg-white/10 transition-colors cursor-pointer">
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <form onSubmit={handleJoinByKey} className="p-6 space-y-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-white uppercase tracking-wider">
                      Enter Private Join Key
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. EDBUILD-7X9KP"
                      value={enteredKey}
                      onChange={(e) => setEnteredKey(e.target.value.toUpperCase())}
                      className="w-full px-3.5 py-3 text-center text-sm font-mono font-bold tracking-wider uppercase bg-[#0F1422] border border-white/15 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-white/30"
                    />
                  </div>

                  {keyError && (
                    <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-xs font-medium text-rose-300 flex items-center gap-2">
                      <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
                      <span>{keyError}</span>
                    </div>
                  )}

                  <div className="flex items-center justify-end gap-2 pt-2">
                    <button
                      type="button"
                      onClick={() => setIsJoinKeyModalOpen(false)}
                      className="px-4 py-2 rounded-xl text-xs font-medium text-slate-400 hover:text-white cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={isJoiningKey}
                      className="px-5 py-2.5 rounded-xl text-xs font-bold bg-white hover:bg-slate-200 text-slate-950 cursor-pointer shadow-md transition-all"
                    >
                      {isJoiningKey ? "Verifying..." : "Join Workspace"}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

        </div>
      </AuthGuard>
    );
}

export default function EdBuildPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center">
          <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
        </div>
      }
    >
      <EdBuildContent />
    </Suspense>
  );
}
