"use client";

export const dynamic = "force-dynamic";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useAuth } from "@/lib/auth-context";
import { PublicUserProfile } from "@/lib/types";
import EdIdBadge from "@/components/ui/EdIdBadge";
import UserProfileDetailModal from "@/components/networking/UserProfileDetailModal";
import DirectMessageModal from "@/components/networking/DirectMessageModal";
import {
  Users,
  Search,
  UserPlus,
  Check,
  GraduationCap,
  Building2,
  MapPin,
  Clock,
  ArrowUpRight,
  Filter,
  CheckCircle2,
  MessageSquare,
  Globe,
  Sparkles
} from "lucide-react";

export default function NetworkPage() {
  const { user } = useAuth();

  const [activeTab, setActiveTab] = useState<"all" | "students" | "professionals" | "connections" | "pending">("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedSkillFilter, setSelectedSkillFilter] = useState<string>("All");
  const [loading, setLoading] = useState(true);

  const [students, setStudents] = useState<PublicUserProfile[]>([]);
  const [professionals, setProfessionals] = useState<PublicUserProfile[]>([]);
  const [activeConnections, setActiveConnections] = useState<any[]>([]);
  const [pendingReceived, setPendingReceived] = useState<any[]>([]);
  const [pendingSent, setPendingSent] = useState<any[]>([]);

  // Modals state
  const [selectedUserDetail, setSelectedUserDetail] = useState<PublicUserProfile | null>(null);
  const [selectedDmPeer, setSelectedDmPeer] = useState<PublicUserProfile | null>(null);
  const [actionInProgress, setActionInProgress] = useState<string | null>(null);
  const [notificationToast, setNotificationToast] = useState<{ message: string; type: "success" | "info" } | null>(null);

  // Fetch real network members from database
  const loadNetworkData = useCallback(async (query = "") => {
    setLoading(true);
    try {
      const url = `/api/network/members?query=${encodeURIComponent(query)}`;
      const headers: Record<string, string> = {};
      if (user?.uid) {
        headers["x-user-id"] = user.uid;
      }
      const res = await fetch(url, { headers });
      const data = await res.json();

      if (data.success) {
        setStudents(data.students || []);
        setProfessionals(data.professionals || []);
      }
    } catch (err) {
      console.warn("Failed to load network members:", err);
    } finally {
      setLoading(false);
    }
  }, [user]);

  // Fetch real connections
  const loadConnections = useCallback(async () => {
    if (!user) return;
    try {
      const res = await fetch("/api/network/connections", {
        headers: { "x-user-id": user.uid },
      });
      const data = await res.json();
      if (data.success) {
        setActiveConnections(data.connections || []);
        setPendingReceived(data.pendingReceived || []);
        setPendingSent(data.pendingSent || []);
      }
    } catch (err) {
      console.warn("Failed to load connections:", err);
    }
  }, [user]);

  useEffect(() => {
    loadNetworkData();
    if (user) {
      loadConnections();
    }
  }, [user, loadNetworkData, loadConnections]);

  // Handle Search Debounce
  useEffect(() => {
    const handler = setTimeout(() => {
      loadNetworkData(searchQuery);
    }, 250);
    return () => clearTimeout(handler);
  }, [searchQuery, loadNetworkData]);

  // Trigger Toast Notification
  const showToast = (message: string, type: "success" | "info" = "success") => {
    setNotificationToast({ message, type });
    setTimeout(() => {
      setNotificationToast(null);
    }, 4000);
  };

  // Handle Connect Request
  const handleConnect = async (targetUserId: string) => {
    if (!user) {
      showToast("Please sign in or create an account to connect with peers.", "info");
      return;
    }
    if (actionInProgress) return;
    setActionInProgress(targetUserId);

    try {
      const res = await fetch("/api/network/connections", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-user-id": user.uid,
        },
        body: JSON.stringify({
          receiverId: targetUserId,
          message: "Let's connect on Edworld Co. verified network!",
        }),
      });

      const data = await res.json();
      if (data.success) {
        showToast("Connection request sent.");
        await loadConnections();
        await loadNetworkData(searchQuery);
      } else {
        showToast(data.error || "Unable to send request.", "info");
      }
    } catch (err) {
      console.error("Connection error:", err);
    } finally {
      setActionInProgress(null);
    }
  };

  // Handle Accept Connection
  const handleAcceptConnection = async (connectionId: string, partnerName: string) => {
    if (!user || actionInProgress) return;
    setActionInProgress(connectionId);

    try {
      const res = await fetch("/api/network/connections", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "x-user-id": user.uid,
        },
        body: JSON.stringify({
          connectionId,
          action: "accept",
        }),
      });

      const data = await res.json();
      if (data.success) {
        showToast(`Connected with ${partnerName}.`);
        await loadConnections();
        await loadNetworkData(searchQuery);
      }
    } catch (err) {
      console.error("Accept connection error:", err);
    } finally {
      setActionInProgress(null);
    }
  };

  // Combine and filter list
  const allMembers = [...students, ...professionals];

  // Collect unique skills for filtering
  const allSkills = Array.from(
    new Set(allMembers.flatMap((m) => m.skills || []).filter(Boolean))
  ).slice(0, 10);

  const filterBySkill = (members: PublicUserProfile[]) => {
    if (selectedSkillFilter === "All") return members;
    return members.filter((m) => m.skills?.includes(selectedSkillFilter));
  };

  const getDisplayedMembers = () => {
    switch (activeTab) {
      case "students":
        return filterBySkill(students);
      case "professionals":
        return filterBySkill(professionals);
      case "connections": {
        const connIds = new Set(activeConnections.map((c) => c.partnerId));
        return filterBySkill(allMembers.filter((m) => connIds.has(m.userId)));
      }
      case "pending": {
        const pendingIds = new Set(pendingReceived.map((p) => p.partnerId));
        return filterBySkill(allMembers.filter((m) => pendingIds.has(m.userId)));
      }
      case "all":
      default:
        return filterBySkill(allMembers);
    }
  };

  const displayedList = getDisplayedMembers();

  return (
    <div className="w-full text-slate-900 font-sans space-y-6 animate-in fade-in duration-200">
      {/* Real-Time Toast Notification */}
      {notificationToast && (
        <div className="fixed top-20 right-6 z-50 bg-[#111827] text-white px-4 py-3 rounded-xl shadow-lg border border-[#374151] flex items-center gap-3">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <p className="text-xs font-semibold text-white">{notificationToast.message}</p>
        </div>
      )}

      {/* Header Station */}
      <div className="tactile-chassis bg-[#0C101A] border border-white/10 rounded-3xl p-6 sm:p-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-6 shadow-xl text-white">
          <div className="space-y-2 max-w-2xl">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-[#EFF6FF]0/10 text-emerald-300 border border-emerald-500/20 font-display">
                Verified Student Network
              </span>
              <span className="text-xs text-slate-400 font-medium">
                Institutional Directory
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-white font-display tracking-tight">
              Community &amp; Member Directory
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed font-normal">
              Connect with university students, researchers, and engineering peers.
            </p>
          </div>

          {/* Quick Metrics */}
          <div className="flex items-center gap-3 self-stretch sm:self-auto bg-[#0F1422] p-3 rounded-2xl border border-white/10">
            <div className="px-4 py-1.5 text-center border-r border-white/10">
              <div className="text-base sm:text-lg font-bold text-white tabular-nums font-mono">
                {allMembers.length}
              </div>
              <div className="text-[11px] font-medium text-slate-400">Members</div>
            </div>
            <div className="px-4 py-1.5 text-center border-r border-white/10">
              <div className="text-base sm:text-lg font-bold text-white tabular-nums font-mono">
                {activeConnections.length}
              </div>
              <div className="text-[11px] font-medium text-slate-400">Connected</div>
            </div>
            <div className="px-4 py-1.5 text-center">
              <div className="text-base sm:text-lg font-bold text-white tabular-nums font-mono">
                {pendingReceived.length}
              </div>
              <div className="text-[11px] font-medium text-slate-400">Pending</div>
            </div>
          </div>
        </div>

        {/* Search & Filter Bar */}
        <div className="tactile-chassis bg-[#0C101A] border border-white/10 rounded-3xl p-5 space-y-4 shadow-xl text-white">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
            {/* Search Input */}
            <div className="relative w-full sm:w-80">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by name, skills..."
                className="w-full pl-9 pr-3.5 py-2 text-xs bg-[#0F1422] border border-white/15 rounded-xl text-white placeholder:text-slate-500 focus:outline-none focus:border-white/30 focus:ring-1 focus:ring-white/20"
              />
            </div>

            {/* Navigation Tabs */}
            <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar w-full sm:w-auto pb-1 sm:pb-0">
              {[
                { id: "all", label: "All Members", count: allMembers.length },
                { id: "students", label: "Students", count: students.length },
                { id: "professionals", label: "Professionals", count: professionals.length },
                { id: "connections", label: "Connections", count: activeConnections.length },
                { id: "pending", label: "Requests", count: pendingReceived.length },
              ].map((tab) => {
                const isActive = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id as any)}
                    className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-colors flex items-center gap-1.5 cursor-pointer border ${
                      isActive
                        ? "bg-white text-slate-950 font-bold border-white"
                        : "bg-[#0F1422] text-slate-400 hover:text-white border-white/10"
                    }`}
                  >
                    <span>{tab.label}</span>
                    <span
                      className={`text-[10px] px-1.5 py-0.5 rounded-md font-semibold ${
                        isActive ? "bg-slate-200 text-slate-950" : "bg-white/10 text-slate-300"
                      }`}
                    >
                      {tab.count}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Skill Filter Chips */}
          {allSkills.length > 0 && (
            <div className="flex items-center gap-1.5 pt-3 border-t border-white/10 overflow-x-auto no-scrollbar">
              <span className="text-[11px] font-semibold text-slate-400 pr-1 flex items-center gap-1">
                <Filter className="w-3 h-3 text-slate-400" />
                Skills:
              </span>
              <button
                onClick={() => setSelectedSkillFilter("All")}
                className={`px-3 py-1 text-[11px] font-medium rounded-lg transition-colors cursor-pointer border ${
                  selectedSkillFilter === "All"
                    ? "bg-white text-slate-950 font-bold border-white"
                    : "bg-[#0F1422] text-slate-400 hover:text-white border-white/10"
                }`}
              >
                All
              </button>
              {allSkills.map((sk, idx) => (
                <button
                  key={idx}
                  onClick={() => setSelectedSkillFilter(sk)}
                  className={`px-3 py-1 text-[11px] font-medium rounded-lg whitespace-nowrap transition-colors cursor-pointer border ${
                    selectedSkillFilter === sk
                      ? "bg-white text-slate-950 font-bold border-white"
                      : "bg-[#0F1422] text-slate-400 hover:text-white border-white/10"
                  }`}
                >
                  {sk}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Member Cards Grid */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="tactile-chassis bg-[#0C101A] rounded-3xl p-6 border border-white/10 animate-pulse space-y-4 shadow-xl">
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-2xl bg-white/10"></div>
                  <div className="space-y-2 flex-1">
                    <div className="h-4 bg-white/10 rounded w-3/4"></div>
                    <div className="h-3 bg-white/10 rounded w-1/2"></div>
                  </div>
                </div>
                <div className="h-8 bg-white/5 rounded-xl"></div>
              </div>
            ))}
          </div>
        ) : displayedList.length === 0 ? (
          <div className="tactile-chassis bg-[#0C101A] rounded-3xl p-12 border border-white/10 text-center max-w-md mx-auto space-y-4 shadow-xl text-white">
            <div className="w-12 h-12 rounded-2xl bg-[#0F1422] border border-white/10 text-slate-400 flex items-center justify-center mx-auto shadow-md">
              <Users className="w-6 h-6" />
            </div>
            <div className="space-y-1">
              <h3 className="text-base font-bold text-white font-display">
                {searchQuery ? "No members found" : "No public profiles"}
              </h3>
              <p className="text-xs text-slate-300 leading-relaxed font-normal">
                {searchQuery
                  ? `No members matched "${searchQuery}". Try clearing your search.`
                  : "No members have shared a public profile yet — be the first."}
              </p>
            </div>
            <div>
              <Link
                href="/profile"
                className="inline-flex items-center gap-1.5 px-5 py-2.5 text-xs font-bold rounded-xl bg-white hover:bg-slate-200 text-slate-950 transition-all shadow-md cursor-pointer"
              >
                Update Profile Settings
              </Link>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {displayedList.map((member) => {
              const initials = (member.name || "U")
                .split(" ")
                .map((n) => n[0])
                .join("")
                .slice(0, 2)
                .toUpperCase();

              const isConnected = member.connectionStatus === "accepted";
              const isPendingSent = member.connectionStatus === "pending_sent";
              const isPendingReceived = member.connectionStatus === "pending_received";

              return (
                <div
                  key={member.userId}
                  className="tactile-chassis bg-[#0C101A] border border-white/10 hover:border-white/25 rounded-3xl p-5 sm:p-6 transition-all flex flex-col justify-between group shadow-xl text-white"
                >
                  <div className="space-y-3.5">
                    {/* Top Identity Header */}
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="relative">
                          {member.avatarUrl ? (
                            <img
                              src={member.avatarUrl}
                              alt={member.name}
                              className="w-11 h-11 rounded-2xl object-cover border border-white/15"
                            />
                          ) : (
                            <div className="w-11 h-11 rounded-2xl bg-white/10 border border-white/15 text-white flex items-center justify-center font-bold text-xs font-display">
                              {initials}
                            </div>
                          )}
                        </div>

                        <div className="min-w-0">
                          <h3 className="text-sm font-bold text-white truncate leading-tight font-display">
                            {member.name}
                          </h3>
                          <p className="text-[11px] text-slate-400 truncate mt-0.5 font-normal">
                            {member.headline || (member.userType === "STUDENT" ? "Student" : "Technology Professional")}
                          </p>
                          {member.edId && (
                            <div className="mt-1">
                              <EdIdBadge userId={member.userId} customId={member.edId} size="sm" variant="pill" />
                            </div>
                          )}
                        </div>
                      </div>

                      <span
                        className="text-[10px] font-semibold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-white/5 text-slate-300 border border-white/10 shrink-0 font-mono"
                      >
                        {member.userType === "STUDENT" ? "Student" : "Career"}
                      </span>
                    </div>

                    {/* Metadata tags */}
                    <div className="space-y-1 text-xs text-slate-400 pt-1">
                      {member.college && (
                        <div className="flex items-center gap-1.5 text-[11px] truncate">
                          <GraduationCap className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <span className="truncate">{member.college}</span>
                        </div>
                      )}
                      {member.company && (
                        <div className="flex items-center gap-1.5 text-[11px] truncate">
                          <Building2 className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <span className="truncate">{member.company}</span>
                        </div>
                      )}
                      {member.location && (
                        <div className="flex items-center gap-1.5 text-[11px] truncate">
                          <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <span className="truncate">{member.location}</span>
                        </div>
                      )}
                    </div>

                    {/* Skills preview */}
                    {member.skills && member.skills.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 pt-1">
                        {member.skills.slice(0, 3).map((sk, sIdx) => (
                          <span
                            key={sIdx}
                            className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-white/5 text-slate-300 border border-white/10"
                          >
                            {sk}
                          </span>
                        ))}
                        {member.skills.length > 3 && (
                          <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-white/5 border border-white/10 text-slate-400">
                            +{member.skills.length - 3}
                          </span>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Card Action Buttons */}
                  <div className="mt-5 pt-3.5 border-t border-white/10 flex items-center gap-2">
                    {/* View Full Profile & QR Modal */}
                    <button
                      onClick={() => setSelectedUserDetail(member)}
                      className="py-2 px-3 rounded-xl bg-white/10 hover:bg-white/15 text-white text-xs font-bold transition-all flex items-center justify-center gap-1 cursor-pointer border border-white/10"
                      title="View Profile & QR code"
                    >
                      <span>Profile</span>
                    </button>

                    {/* Direct Public Portfolio Link */}
                    <Link
                      href={`/${member.username || member.userId}`}
                      target="_blank"
                      className="flex-1 py-2 px-3 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white text-xs font-bold transition-all flex items-center justify-center gap-1.5 shadow-md"
                      title="View colorful public portfolio"
                    >
                      <Sparkles className="w-3.5 h-3.5 text-indigo-200" />
                      <span>Portfolio</span>
                      <ArrowUpRight className="w-3.5 h-3.5 text-white/80" />
                    </Link>

                    {/* Direct Message (E2E DM) */}
                    <Link
                      href={`/messages?peerId=${member.userId}`}
                      className="p-2 rounded-xl bg-[#0F1422] hover:bg-white/10 border border-white/10 text-slate-300 hover:text-white transition-all shadow-sm"
                      title="Send Direct Message"
                    >
                      <MessageSquare className="w-4 h-4 text-slate-300" />
                    </Link>

                    {/* Connect / Pending Action */}
                    {isPendingReceived ? (
                      <button
                        onClick={() => handleAcceptConnection(member.connectionId || "", member.name)}
                        disabled={actionInProgress === member.connectionId}
                        className="py-2 px-3.5 rounded-xl bg-emerald-600 hover:bg-[#EFF6FF]0 text-white text-xs font-bold transition-all flex items-center gap-1 cursor-pointer shadow-md"
                      >
                        <Check className="w-3.5 h-3.5" />
                        <span>Accept</span>
                      </button>
                    ) : (
                      <button
                        onClick={() => handleConnect(member.userId)}
                        disabled={isConnected || isPendingSent || actionInProgress === member.userId}
                        className={`py-2 px-3.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 border shadow-sm cursor-pointer ${
                          isConnected
                            ? "bg-white/5 text-slate-400 border-white/10 cursor-default"
                            : isPendingSent
                            ? "bg-white/5 text-slate-400 border-white/10 cursor-default"
                            : "bg-[#0F1422] hover:bg-white/10 text-white border-white/10 cursor-pointer"
                        }`}
                      >
                        {isConnected ? (
                          <>
                            <Check className="w-3.5 h-3.5 text-emerald-400" />
                            <span>Connected</span>
                          </>
                        ) : isPendingSent ? (
                          <>
                            <Clock className="w-3.5 h-3.5 text-slate-400" />
                            <span>Pending</span>
                          </>
                        ) : (
                          <>
                            <UserPlus className="w-3.5 h-3.5 text-white" />
                            <span>Connect</span>
                          </>
                        )}
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

      {/* Profile Detail Modal */}
      <UserProfileDetailModal
        user={selectedUserDetail}
        isOpen={Boolean(selectedUserDetail)}
        onClose={() => setSelectedUserDetail(null)}
        onConnect={(uid) => handleConnect(uid)}
        onOpenMessage={(u) => setSelectedDmPeer(u)}
        isConnecting={Boolean(actionInProgress)}
      />

      {/* Direct Messaging Modal */}
      <DirectMessageModal
        peer={selectedDmPeer}
        isOpen={Boolean(selectedDmPeer)}
        onClose={() => setSelectedDmPeer(null)}
        onMessageSent={() => showToast("Message sent.")}
      />
    </div>
  );
}
