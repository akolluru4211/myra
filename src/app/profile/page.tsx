"use client";

export const dynamic = "force-dynamic";

import React, { useState, useEffect, useMemo } from "react";
import { useAuth } from "@/lib/auth-context";
import { 
  Plus,
  Trash2,
  Award,
  ExternalLink,
  User, 
  ShieldCheck, 
  Lock, 
  TrendingUp, 
  Save, 
  Sparkles, 
  Check, 
  AlertCircle, 
  KeyRound, 
  Bell,
  Building2,
  Mail,
  Phone,
  GraduationCap,
  MapPin,
  CheckCircle2,
  Target,
  Layers,
  Globe,
  Camera,
  Upload,
  Calendar
} from "lucide-react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { recordAuditLog } from "@/lib/audit-logger";
import AuthGuard from "@/components/auth/AuthGuard";
import SyncedAccountsCard from "@/components/dashboard/SyncedAccountsCard";
import EdworldDigitalIdCard from "@/components/profile/EdworldDigitalIdCard";
import ActivityHeatmap from "@/components/profile/ActivityHeatmap";
import { SyncedAccounts, UserDomainItem, UserDomainPriority, SkillLevel } from "@/lib/types";
import { DOMAIN_CATALOG } from "@/lib/services/career-learning-os";
import CareerPathPicker from "@/components/career/CareerPathPicker";

export default function ProfilePage() {
  const { user, profile, role, updateUserProfile } = useAuth();

  // Basic Profile State
  const [name, setName] = useState(profile?.name || user?.name || "");
  const [username, setUsername] = useState((profile as any)?.username || "");
  const [usernameStatus, setUsernameStatus] = useState<"idle" | "checking" | "available" | "unavailable">("idle");
  const [usernameError, setUsernameError] = useState<string | null>(null);
  const [headline, setHeadline] = useState(profile?.headline || "");
  const [bio, setBio] = useState(profile?.bio || "");
  const [phone, setPhone] = useState(profile?.phone || "");
  const [location, setLocation] = useState((profile as any)?.location || "");
  const [college, setCollege] = useState(profile?.institution || (profile as any)?.college || "");
  const [company, setCompany] = useState(profile?.current_company || (profile as any)?.company || "");
  const [isPublic, setIsPublic] = useState<boolean>(profile?.isPublic !== false);
  const [showBirthdayToConnections, setShowBirthdayToConnections] = useState<boolean>(Boolean((profile as any)?.show_birthday_to_connections));
  const [avatarUrl, setAvatarUrl] = useState<string>((profile as any)?.avatar_url || (profile as any)?.photo_url || "");
  const [isUploadingPhoto, setIsUploadingPhoto] = useState<boolean>(false);
  const [saveState, setSaveState] = useState<"idle" | "saving" | "success" | "error">("idle");
  const [saveErrorMessage, setSaveErrorMessage] = useState<string | null>(null);

  // Sync state with auth context on initial load
  useEffect(() => {
    if (profile) {
      if (profile.name) setName(profile.name);
      if ((profile as any).username) setUsername((profile as any).username);
      if (profile.headline) setHeadline(profile.headline);
      if (profile.bio) setBio(profile.bio);
      if (profile.phone) setPhone(profile.phone);
      if ((profile as any).avatar_url || (profile as any).photo_url) {
        setAvatarUrl((profile as any).avatar_url || (profile as any).photo_url);
      }
      if ((profile as any).location) setLocation((profile as any).location);
      if (profile.institution || (profile as any).college) setCollege(profile.institution || (profile as any).college);
      if (profile.current_company || (profile as any).company) setCompany(profile.current_company || (profile as any).company);
      if (profile.isPublic !== undefined) setIsPublic(profile.isPublic);
      if ((profile as any).show_birthday_to_connections !== undefined) setShowBirthdayToConnections(Boolean((profile as any).show_birthday_to_connections));
    } else if (user) {
      if (user.name) setName(user.name);
    }
  }, [profile, user]);

  // Debounced Username Availability Check
  useEffect(() => {
    const currentHandle = (profile as any)?.username || "";
    if (!username || username.trim().toLowerCase() === currentHandle.toLowerCase()) {
      setUsernameStatus("idle");
      setUsernameError(null);
      return;
    }

    const clean = username.trim().toLowerCase();
    if (clean.length < 3) {
      setUsernameStatus("unavailable");
      setUsernameError("Username must be at least 3 characters.");
      return;
    }

    setUsernameStatus("checking");
    const timer = setTimeout(async () => {
      try {
        const res = await fetch(`/api/profile/check-username?username=${encodeURIComponent(clean)}&userId=${user?.uid || ""}`);
        const data = await res.json();
        if (data.available) {
          setUsernameStatus("available");
          setUsernameError(null);
        } else {
          setUsernameStatus("unavailable");
          setUsernameError(data.reason || "Username is not available.");
        }
      } catch {
        setUsernameStatus("idle");
      }
    }, 400);

    return () => clearTimeout(timer);
  }, [username, profile, user?.uid]);

  // Career Goals State
  const [careerDomains, setCareerDomains] = useState<UserDomainItem[]>([]);
  const [careerTargetRole, setCareerTargetRole] = useState(profile?.targetRole || "Full Stack Software Engineer");
  const [careerDailyHours, setCareerDailyHours] = useState<number>(2);
  const [careerTimeframe, setCareerTimeframe] = useState<number>(6);
  const [loadingCareerOS, setLoadingCareerOS] = useState(false);
  const [careerOSStatus, setCareerOSStatus] = useState<string | null>(null);

  // Certifications State
  const [certs, setCerts] = useState<any[]>([]);
  const [showAddCert, setShowAddCert] = useState(false);
  const [newCertName, setNewCertName] = useState("");
  const [newCertIssuer, setNewCertIssuer] = useState("");
  const [newCertDate, setNewCertDate] = useState("");
  const [newCertUrl, setNewCertUrl] = useState("");

  // Synced Accounts State
  const [syncedAccounts, setSyncedAccounts] = useState<SyncedAccounts>({});

  // Notifications State
  const [notifyTasks, setNotifyTasks] = useState(true);
  const [notifyLeaves, setNotifyLeaves] = useState(true);
  const [notifyPayroll, setNotifyPayroll] = useState(true);

  // 1. Fetch Career OS Data
  useEffect(() => {
    if (!user?.uid) return;
    const fetchCareerOSData = async () => {
      try {
        const res = await fetch(`/api/career-os?userId=${user.uid}`);
        const data = await res.json();
        if (data.success && data.plan) {
          if (data.plan.domains) setCareerDomains(data.plan.domains);
          if (data.plan.goal) {
            setCareerTargetRole(data.plan.goal.target_role || "Full Stack Software Engineer");
            setCareerDailyHours(data.plan.goal.available_hours_per_day || 2);
            setCareerTimeframe(data.plan.goal.target_timeframe_months || 6);
          }
        }
      } catch (err) {
        console.warn("Career OS Profile fetch note:", err);
      }
    };
    fetchCareerOSData();
  }, [user]);

  // 2. Fetch Certifications
  useEffect(() => {
    if (!user?.uid) return;
    const fetchCerts = async () => {
      try {
        const { data } = await supabase
          .from("certifications")
          .select("*")
          .eq("user_id", user.uid)
          .order("created_at", { ascending: false });
        if (data) setCerts(data);
      } catch (e) {
        console.warn("Certs fetch note:", e);
      }
    };
    fetchCerts();
  }, [user?.uid]);

  // 3. Fetch Synced Accounts
  useEffect(() => {
    if (!user?.uid) return;
    const loadSyncedAccounts = async () => {
      try {
        const cached = localStorage.getItem(`edworld_${user.uid}_synced_accounts`);
        if (cached) {
          setSyncedAccounts(JSON.parse(cached));
        }

        const res = await fetch(`/api/integrations/connected-accounts?userId=${user.uid}`);
        if (res.ok) {
          const json = await res.json();
          if (json.success && Array.isArray(json.data)) {
            const mapped: SyncedAccounts = {};
            json.data.forEach((acc: any) => {
              const prov = (acc.provider || "").toUpperCase();
              if (prov === "GITHUB") {
                const ghData = acc.data?.github || acc.data || {};
                mapped.github = {
                  connected: true,
                  username: acc.username || ghData.username || "",
                  contributionsThisYear: ghData.totalStars || 0,
                  recentRepos: (ghData.repositories || []).slice(0, 3).map((r: any) => ({
                    name: r.name,
                    stars: r.stars,
                    language: r.language || "Code"
                  })),
                  lastSyncedAt: acc.lastSyncedAt || new Date().toISOString()
                };
              } else if (prov === "LINKEDIN") {
                mapped.linkedin = {
                  connected: true,
                  profileUrl: acc.profileUrl || `https://linkedin.com/in/${acc.username}`,
                  verified: true
                };
              } else if (prov === "LEETCODE") {
                const lcData = acc.data?.leetcode || acc.data || {};
                mapped.leetcode = {
                  connected: true,
                  username: acc.username || lcData.username || "",
                  problemsSolved: {
                    easy: lcData.easySolved || 0,
                    medium: lcData.mediumSolved || 0,
                    hard: lcData.hardSolved || 0,
                    total: lcData.totalSolved || 0
                  },
                  isSelfReported: false,
                  lastUpdatedAt: acc.lastSyncedAt || new Date().toISOString()
                };
              }
            });

            setSyncedAccounts(mapped);
            localStorage.setItem(`edworld_${user.uid}_synced_accounts`, JSON.stringify(mapped));
          }
        }
      } catch (err) {
        console.warn("[loadSyncedAccounts note]:", err);
      }
    };
    loadSyncedAccounts();
  }, [user?.uid]);

  // Deterministic Profile Strength Calculation
  const profileStrength = useMemo(() => {
    let score = 20; // base for authenticated account
    if (name && name.trim().length > 2) score += 20;
    if (headline && headline.trim().length > 3) score += 15;
    if (bio && bio.trim().length > 10) score += 15;
    if (careerTargetRole) score += 10;
    if (phone) score += 10;
    if (certs.length > 0) score += 10;
    return Math.min(score, 100);
  }, [name, headline, bio, careerTargetRole, phone, certs]);

  const handlePhotoFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      alert("Image file size must be under 5MB.");
      return;
    }
    setIsUploadingPhoto(true);
    const reader = new FileReader();
    reader.onload = (event) => {
      const result = event.target?.result as string;
      if (result) {
        setAvatarUrl(result);
      }
      setIsUploadingPhoto(false);
    };
    reader.onerror = () => {
      setIsUploadingPhoto(false);
      alert("Failed to read image file.");
    };
    reader.readAsDataURL(file);
  };

  // Handle Save Profile
  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaveState("saving");
    setSaveErrorMessage(null);

    try {
      const cleanUsername = username.trim().toLowerCase();
      await updateUserProfile({
        name,
        phone,
        headline,
        bio,
        avatar_url: avatarUrl,
        username: cleanUsername || undefined,
      });

      // Also persist additional fields via authoritative API
      await fetch("/api/profile/update", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          phone,
          headline,
          bio,
          username: cleanUsername || undefined,
          avatar_url: avatarUrl,
          isPublic,
          showBirthdayToConnections
        })
      });

      await recordAuditLog({
        actorId: user?.uid || "usr_profile",
        actorName: name || "Member",
        actorRole: role || "MEMBER",
        action: "profile.updated",
        resource: "user_profile",
        result: "SUCCESS",
      });

      setSaveState("success");
      setTimeout(() => setSaveState("idle"), 4000);
    } catch (err: any) {
      setSaveState("error");
      setSaveErrorMessage(err.message || "Failed to update profile. Please try again.");
    }
  };

  // Add Certification Handler
  const handleAddCert = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCertName.trim() || !newCertIssuer.trim() || !user?.uid) return;

    try {
      const newCert = {
        user_id: user.uid,
        name: newCertName.trim(),
        issuer: newCertIssuer.trim(),
        issue_date: newCertDate.trim(),
        url: newCertUrl.trim()
      };

      const { data, error } = await supabase
        .from("certifications")
        .insert(newCert)
        .select()
        .single();

      if (!error && data) {
        setCerts([data, ...certs]);
        setNewCertName("");
        setNewCertIssuer("");
        setNewCertDate("");
        setNewCertUrl("");
        setShowAddCert(false);
      }
    } catch (err) {
      console.error("Add cert error:", err);
    }
  };

  const handleDeleteCert = async (certId: string) => {
    try {
      await supabase.from("certifications").delete().eq("id", certId);
      setCerts(certs.filter(c => c.id !== certId));
    } catch (e) {
      console.error("Delete cert error:", e);
    }
  };

  const handleUpdateAccounts = async (updated: SyncedAccounts) => {
    setSyncedAccounts(updated);
    if (user?.uid) {
      localStorage.setItem(`edworld_${user.uid}_synced_accounts`, JSON.stringify(updated));
    }
  };

  const displayName = name.trim() || profile?.name || user?.name || "Edworld Member";
  const userInitial = displayName.charAt(0).toUpperCase();

  // SVG Gauge Calculations
  const radius = 24;
  const circumference = 2 * Math.PI * radius;
  const strokeOffset = circumference - (profileStrength / 100) * circumference;

  return (
    <AuthGuard>
      <div className="w-full text-slate-900 font-sans space-y-6 animate-in fade-in duration-200">
        {/* ========================================================================= */}
        {/* 1. PAGE HEADER: Pure White Elevated Overview Card                         */}
        {/* ========================================================================= */}
        <div className="p-6 sm:p-8 bg-white rounded-3xl border border-slate-100/80 shadow-[0_10px_30px_rgba(80,90,130,0.06)] flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-start gap-4 sm:gap-5">
            <div className="relative w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-gradient-to-br from-[#EEF0FD] to-[#E0E3FA] text-[#5C59E8] font-bold text-2xl flex items-center justify-center shrink-0 shadow-xs overflow-hidden border-2 border-indigo-100">
              {avatarUrl ? (
                <img src={avatarUrl} alt={displayName} className="w-full h-full object-cover" />
              ) : (
                <span>{userInitial}</span>
              )}
            </div>

            <div className="space-y-1.5 min-w-0">
              <div className="flex items-center gap-2.5 flex-wrap">
                <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
                  {displayName}
                </h1>
                <span className="px-3 py-1 rounded-full bg-[#EEF0FD] text-[#5C59E8] font-bold text-xs border border-indigo-100/80 flex items-center gap-1.5 shadow-2xs">
                  <ShieldCheck className="w-3.5 h-3.5 text-[#5C59E8]" />
                  <span>Verified Member</span>
                </span>
                <Link href="/profile/applied" className="text-sm font-semibold text-blue-800 hover:underline">Applied</Link>
              </div>

              <p className="text-xs sm:text-sm text-slate-600 font-medium">
                {headline || "Software Engineer & Platform Builder"}
              </p>

              <div className="flex items-center gap-2.5 text-xs text-slate-500 pt-0.5 flex-wrap">
                <span>{user?.email}</span>
                <span>&bull;</span>
                <span className="text-[#5C59E8] font-bold">{profile?.careerStage || "Career Track"}</span>
              </div>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4 self-start md:self-auto shrink-0">
            {/* Circular Profile Strength Gauge */}
            <div className="px-4 py-2.5 rounded-2xl bg-[#F8F9FD] border border-indigo-50/80 flex items-center gap-3">
              <div className="relative w-14 h-14 shrink-0 flex items-center justify-center">
                <svg className="w-14 h-14 -rotate-90 transform" viewBox="0 0 60 60">
                  <circle
                    cx="30"
                    cy="30"
                    r={radius}
                    stroke="#EEF0FD"
                    strokeWidth="5"
                    fill="transparent"
                  />
                  <circle
                    cx="30"
                    cy="30"
                    r={radius}
                    stroke="#5C59E8"
                    strokeWidth="5"
                    strokeDasharray={circumference}
                    strokeDashoffset={strokeOffset}
                    strokeLinecap="round"
                    fill="transparent"
                    className="transition-all duration-700 ease-out"
                  />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center text-xs font-black text-slate-900">
                  {profileStrength}%
                </div>
              </div>

              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                  Profile Strength
                </span>
                <span className="text-xs font-bold text-slate-800">
                  {profileStrength >= 80 ? "All-Star Profile" : profileStrength >= 50 ? "Solid Progress" : "Getting Started"}
                </span>
              </div>
            </div>

            <Link
              href={`/${profile?.username || user?.uid}`}
              target="_blank"
              className="px-4 py-2.5 rounded-2xl bg-[#EEF0FD] hover:bg-[#E0E3FA] text-[#3730A3] border border-indigo-100/60 text-xs font-bold flex items-center justify-center gap-1.5 transition-all shadow-xs"
            >
              <ExternalLink className="w-3.5 h-3.5 text-[#5C59E8]" />
              <span>Public Portfolio</span>
            </Link>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* 2. EDWORLD DIGITAL IDENTITY CARD                                          */}
        {/* ========================================================================= */}
        <section className="space-y-3">
          <div className="flex items-center justify-between px-1">
            <h2 className="text-base font-bold text-slate-900">
              EdWorld Digital Student ID
            </h2>
          </div>

          <EdworldDigitalIdCard
            userId={user?.uid}
            name={displayName}
            headline={headline || "Software Engineer & Builder"}
            email={user?.email}
            username={profile?.username || user?.uid}
            college={college || (profile as any)?.institution}
            degree={(profile as any)?.degree}
            branch={(profile as any)?.field_of_study || (profile as any)?.branch}
            graduationYear={(profile as any)?.graduation_year}
            organization={company}
            location={location}
            role={role}
            careerStage={profile?.careerStage}
            isPublic={isPublic}
          />
        </section>

        {/* ========================================================================= */}
        {/* 3. ACTIVITY & CONSISTENCY HEATMAP                                         */}
        {/* ========================================================================= */}
        <section className="space-y-3">
          <ActivityHeatmap
            syncedAccounts={syncedAccounts}
            userStats={(profile as any)?.user_stats}
          />
        </section>

        {/* ========================================================================= */}
        {/* 4. MAIN FORM & INTEGRATIONS GRID                                          */}
        {/* ========================================================================= */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left 2 Columns: Identity, Career Goals, Certs & Accounts */}
          <div className="lg:col-span-2 space-y-6">
            {/* 4A. PERSONAL & PROFESSIONAL IDENTITY FORM */}
            <div className="p-6 sm:p-8 bg-white rounded-3xl border border-slate-100/80 shadow-[0_10px_30px_rgba(80,90,130,0.06)] space-y-6">
              <div className="border-b border-slate-100 pb-4">
                <h2 className="text-base sm:text-lg font-bold text-slate-900 flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-[#EEF0FD] text-[#5C59E8] flex items-center justify-center font-bold">
                    <User className="w-4 h-4" />
                  </div>
                  <span>Personal &amp; Professional Identity</span>
                </h2>
                <p className="text-xs text-slate-500 mt-1">
                  Manage your personal details, portfolio vanity handle, and public visibility.
                </p>
              </div>

              {saveState === "success" && (
                <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold flex items-center gap-2 animate-in fade-in">
                  <Check className="w-4 h-4 text-emerald-600" />
                  <span>Profile information saved successfully.</span>
                </div>
              )}

              {saveState === "error" && (
                <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-bold flex items-center gap-2 animate-in fade-in">
                  <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                  <span>{saveErrorMessage || "Failed to update profile. Please try again."}</span>
                </div>
              )}

              <form onSubmit={handleSave} className="space-y-5">
                {/* Profile Photo Uploader */}
                <div className="p-4 sm:p-5 rounded-2xl bg-[#F8F9FD] border border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex items-center gap-4">
                    <div className="w-16 h-16 rounded-2xl bg-white text-[#5C59E8] font-bold text-xl flex items-center justify-center shrink-0 overflow-hidden border border-slate-200/80 shadow-xs">
                      {avatarUrl ? (
                        <img src={avatarUrl} alt="Profile Photo" className="w-full h-full object-cover" />
                      ) : (
                        <span>{userInitial}</span>
                      )}
                    </div>
                    <div>
                      <span className="text-sm font-bold text-slate-900 block">Profile Photo</span>
                      <p className="text-xs text-slate-500 mt-0.5">
                        Upload an avatar or professional headshot for your portfolio.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 self-start sm:self-auto">
                    <label className="px-4 py-2 rounded-2xl bg-[#EEF0FD] hover:bg-[#E0E3FA] text-[#3730A3] border border-indigo-100/60 text-xs font-bold cursor-pointer flex items-center gap-1.5 transition-all shadow-xs">
                      <Upload className="w-3.5 h-3.5 text-[#5C59E8]" />
                      <span>{isUploadingPhoto ? "Processing..." : avatarUrl ? "Change Photo" : "Upload Photo"}</span>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handlePhotoFileChange}
                        className="hidden"
                        disabled={isUploadingPhoto}
                      />
                    </label>
                    {avatarUrl && (
                      <button
                        type="button"
                        onClick={() => setAvatarUrl("")}
                        className="p-2 rounded-2xl border border-slate-200 bg-white hover:bg-rose-50 hover:border-rose-200 text-slate-500 hover:text-rose-600 transition-colors cursor-pointer shadow-2xs"
                        title="Remove Photo"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-700">Full name</label>
                    <input
                      type="text"
                      required
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="e.g. Adarsh Kolluru"
                      className="w-full px-3.5 py-2.5 rounded-2xl border border-slate-200 bg-slate-50 text-sm text-slate-900 placeholder-slate-400 focus:bg-white focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-700">Phone number</label>
                    <input
                      type="text"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="e.g. +91 98765 43210"
                      className="w-full px-3.5 py-2.5 rounded-2xl border border-slate-200 bg-slate-50 text-sm text-slate-900 placeholder-slate-400 focus:bg-white focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all"
                    />
                  </div>
                </div>

                {/* Portfolio Username & Custom Link */}
                <div className="space-y-2 p-4 rounded-2xl bg-[#F8F9FD] border border-slate-100">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-[#5C59E8]" />
                      <span>Portfolio Username</span>
                    </label>
                    <span className="text-[11px] font-mono text-slate-500">
                      edworld.co.in/{username || "username"}
                    </span>
                  </div>

                  <div className="relative flex items-center">
                    <span className="absolute left-3.5 text-xs text-slate-400 font-mono select-none pointer-events-none">
                      edworld.co.in/
                    </span>
                    <input
                      type="text"
                      value={username}
                      onChange={(e) => {
                        const val = e.target.value.toLowerCase().replace(/[^a-z0-9_-]/g, "");
                        setUsername(val);
                      }}
                      placeholder="yourname"
                      maxLength={24}
                      className="w-full pl-[98px] pr-24 py-2.5 rounded-2xl border border-slate-200 bg-white text-sm text-slate-900 font-mono placeholder-slate-400 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all"
                    />
                    <div className="absolute right-3 flex items-center gap-1.5">
                      {usernameStatus === "checking" && (
                        <span className="text-[10px] text-slate-400 font-mono">checking...</span>
                      )}
                      {usernameStatus === "available" && (
                        <span className="text-[10px] text-emerald-600 font-bold flex items-center gap-0.5">
                          <Check className="w-3 h-3" /> available
                        </span>
                      )}
                      {usernameStatus === "unavailable" && (
                        <span className="text-[10px] text-rose-500 font-bold">taken</span>
                      )}
                      {username && (
                        <Link
                          href={`/${username}`}
                          target="_blank"
                          className="p-1 rounded-lg text-slate-400 hover:text-slate-800 transition-colors"
                          title="Preview portfolio"
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                        </Link>
                      )}
                    </div>
                  </div>
                  {usernameError && (
                    <p className="text-[11px] text-rose-500 mt-1 font-medium">{usernameError}</p>
                  )}
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700">Professional headline</label>
                  <input
                    type="text"
                    value={headline}
                    onChange={(e) => setHeadline(e.target.value)}
                    placeholder="e.g. Full Stack Software Engineer & Distributed Systems Builder"
                    className="w-full px-3.5 py-2.5 rounded-2xl border border-slate-200 bg-slate-50 text-sm text-slate-900 placeholder-slate-400 focus:bg-white focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700">Professional bio</label>
                  <textarea
                    rows={3}
                    value={bio}
                    onChange={(e) => setBio(e.target.value)}
                    placeholder="Briefly describe your career focus, engineering background, and key accomplishments..."
                    className="w-full px-3.5 py-2.5 rounded-2xl border border-slate-200 bg-slate-50 text-sm text-slate-900 placeholder-slate-400 focus:bg-white focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all leading-relaxed"
                  />
                </div>

                {/* Public Portfolio Visibility Toggle */}
                <div className="p-4 rounded-2xl bg-[#F8F9FD] border border-slate-100 flex items-center justify-between">
                  <div>
                    <span className="text-xs font-bold text-slate-900 block">Public portfolio visibility</span>
                    <span className="text-[11px] text-slate-500">Allow your portfolio to be viewed publicly at edworld.co.in/{username || profile?.username || "username"}</span>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={isPublic}
                      onChange={(e) => setIsPublic(e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-10 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#5C59E8]" />
                  </label>
                </div>

                {/* Connection Birthday Visibility Toggle */}
                <div className="p-4 rounded-2xl bg-[#F8F9FD] border border-slate-100 flex items-center justify-between">
                  <div>
                    <span className="text-xs font-bold text-slate-900 block">Show birthday to connections</span>
                    <span className="text-[11px] text-slate-500">
                      Upcoming celebration date only; birth year and age are never shared.
                    </span>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={showBirthdayToConnections}
                      onChange={(e) => setShowBirthdayToConnections(e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-10 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#5C59E8]" />
                  </label>
                </div>

                <div className="pt-2 flex justify-end">
                  <button
                    type="submit"
                    disabled={saveState === "saving"}
                    className="px-6 py-2.5 rounded-2xl bg-[#5C59E8] hover:bg-[#4F46E5] text-white text-xs font-bold transition-all shadow-md shadow-indigo-500/20 disabled:opacity-50 flex items-center gap-2 cursor-pointer"
                  >
                    <Save className="w-4 h-4" />
                    <span>{saveState === "saving" ? "Saving..." : "Save Changes"}</span>
                  </button>
                </div>
              </form>
            </div>

            {/* 4B. CAREER DIRECTION & GOALS */}
            <div className="p-6 sm:p-8 bg-white rounded-3xl border border-slate-100/80 shadow-[0_10px_30px_rgba(80,90,130,0.06)] space-y-6">
              <div className="border-b border-slate-100 pb-4">
                <h2 className="text-base sm:text-lg font-bold text-slate-900 flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-[#EEF0FD] text-[#5C59E8] flex items-center justify-center font-bold">
                    <Target className="w-4 h-4" />
                  </div>
                  <span>Career Direction &amp; Goals</span>
                </h2>
                <p className="text-xs text-slate-500 mt-1">
                  Calibrate your target role, mastery focus, and daily study cadence.
                </p>
              </div>

              {careerOSStatus && (
                <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold flex items-center gap-2 animate-in fade-in">
                  <Check className="w-4 h-4 text-emerald-600" />
                  <span>{careerOSStatus}</span>
                </div>
              )}

              <CareerPathPicker
                mode="settings"
                userId={user?.uid}
                showSubmitButton={true}
                submitButtonText="Save Career Focus"
                onSaveSuccess={(ids, primary) => {
                  setCareerOSStatus("Your career focus preferences have been saved successfully.");
                  setTimeout(() => setCareerOSStatus(null), 4000);
                }}
              />

              <div className="pt-5 border-t border-slate-100">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">
                  Learning Cadence &amp; Timeline
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-700">Target Timeframe</label>
                    <select
                      value={careerTimeframe}
                      onChange={(e) => setCareerTimeframe(Number(e.target.value))}
                      className="w-full px-3.5 py-2.5 rounded-2xl border border-slate-200 bg-slate-50 text-xs text-slate-900 focus:bg-white focus:outline-none focus:border-indigo-500 transition-all font-medium"
                    >
                      <option value={3}>3 Months (Fast-Track Placement)</option>
                      <option value={6}>6 Months (Standard Comprehensive)</option>
                      <option value={12}>12 Months (Deep Mastery)</option>
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-700">Daily Practice Allocation</label>
                    <select
                      value={careerDailyHours}
                      onChange={(e) => setCareerDailyHours(Number(e.target.value))}
                      className="w-full px-3.5 py-2.5 rounded-2xl border border-slate-200 bg-slate-50 text-xs text-slate-900 focus:bg-white focus:outline-none focus:border-indigo-500 transition-all font-medium"
                    >
                      <option value={1}>1 Hour / day (Light Pace)</option>
                      <option value={2}>2 Hours / day (Recommended)</option>
                      <option value={3}>3 Hours / day (Accelerated)</option>
                      <option value={4}>4+ Hours / day (Intensive)</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>

            {/* 4C. CERTIFICATIONS & LICENSES */}
            <div className="p-6 sm:p-8 bg-white rounded-3xl border border-slate-100/80 shadow-[0_10px_30px_rgba(80,90,130,0.06)] space-y-5">
              <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                <div>
                  <h2 className="text-base sm:text-lg font-bold text-slate-900 flex items-center gap-2">
                    <div className="w-8 h-8 rounded-xl bg-[#EEF0FD] text-[#5C59E8] flex items-center justify-center font-bold">
                      <Award className="w-4 h-4" />
                    </div>
                    <span>Certifications &amp; Credentials</span>
                  </h2>
                  <p className="text-xs text-slate-500 mt-1">Verified certificates and industry engineering achievements.</p>
                </div>
                <button
                  type="button"
                  onClick={() => setShowAddCert(!showAddCert)}
                  className="px-4 py-2 rounded-2xl bg-[#5C59E8] hover:bg-[#4F46E5] text-white text-xs font-bold flex items-center gap-1.5 transition-all shadow-md shadow-indigo-500/20 cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add Certificate</span>
                </button>
              </div>

              {showAddCert && (
                <form onSubmit={handleAddCert} className="p-5 rounded-2xl bg-[#F8F9FD] border border-slate-100 space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">Certificate Title *</label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. AWS Solutions Architect"
                        value={newCertName}
                        onChange={(e) => setNewCertName(e.target.value)}
                        className="w-full px-3.5 py-2 rounded-2xl border border-slate-200 bg-white text-xs text-slate-900 focus:outline-none focus:border-indigo-500"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">Issuing Organization *</label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. Amazon Web Services"
                        value={newCertIssuer}
                        onChange={(e) => setNewCertIssuer(e.target.value)}
                        className="w-full px-3.5 py-2 rounded-2xl border border-slate-200 bg-white text-xs text-slate-900 focus:outline-none focus:border-indigo-500"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">Issue Date</label>
                      <input
                        type="text"
                        placeholder="e.g. May 2026"
                        value={newCertDate}
                        onChange={(e) => setNewCertDate(e.target.value)}
                        className="w-full px-3.5 py-2 rounded-2xl border border-slate-200 bg-white text-xs text-slate-900 focus:outline-none focus:border-indigo-500"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">Verification URL</label>
                      <input
                        type="url"
                        placeholder="https://credly.com/..."
                        value={newCertUrl}
                        onChange={(e) => setNewCertUrl(e.target.value)}
                        className="w-full px-3.5 py-2 rounded-2xl border border-slate-200 bg-white text-xs text-slate-900 focus:outline-none focus:border-indigo-500"
                      />
                    </div>
                  </div>
                  <div className="flex justify-end gap-2.5 pt-2">
                    <button
                      type="button"
                      onClick={() => setShowAddCert(false)}
                      className="px-4 py-2 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-all cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-5 py-2 rounded-2xl bg-[#5C59E8] hover:bg-[#4F46E5] text-white text-xs font-bold shadow-md shadow-indigo-500/20 cursor-pointer"
                    >
                      Save Credential
                    </button>
                  </div>
                </form>
              )}

              {certs.length === 0 ? (
                <div className="p-6 text-center rounded-2xl bg-[#F8F9FD] border border-dashed border-slate-200">
                  <p className="text-xs text-slate-400 italic">No certifications added yet. Click &apos;Add Certificate&apos; to showcase credentials.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  {certs.map((c) => (
                    <div key={c.id} className="p-4 rounded-2xl border border-slate-100 bg-[#F8F9FD] flex items-center justify-between gap-3 hover:border-indigo-100 transition-all">
                      <div>
                        <h4 className="font-bold text-xs text-slate-900">{c.name}</h4>
                        <p className="text-[11px] text-slate-500 mt-0.5">{c.issuer} {c.issue_date ? `• ${c.issue_date}` : ""}</p>
                      </div>
                      <div className="flex items-center gap-1.5">
                        {c.url && (
                          <a href={c.url} target="_blank" rel="noreferrer" className="p-1.5 rounded-lg text-slate-400 hover:text-[#5C59E8] transition-colors" title="View credential">
                            <ExternalLink className="w-3.5 h-3.5" />
                          </a>
                        )}
                        <button type="button" onClick={() => handleDeleteCert(c.id)} className="p-1.5 rounded-lg text-rose-400 hover:text-rose-600 transition-colors" title="Delete">
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* 4D. CONNECTED ACCOUNTS */}
            <SyncedAccountsCard
              syncedAccounts={syncedAccounts}
              onUpdateAccounts={handleUpdateAccounts}
              userId={user?.uid}
            />
          </div>

          {/* Right 1 Column: Security & Preferences */}
          <div className="space-y-6">
            {/* 4E. ACCOUNT & SECURITY SETTINGS */}
            <div className="p-6 sm:p-8 bg-white rounded-3xl border border-slate-100/80 shadow-[0_10px_30px_rgba(80,90,130,0.06)] space-y-5">
              <div className="border-b border-slate-100 pb-4">
                <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-[#EEF0FD] text-[#5C59E8] flex items-center justify-center font-bold">
                    <KeyRound className="w-4 h-4" />
                  </div>
                  <span>Account &amp; Security</span>
                </h3>
              </div>

              {/* Email Verification Status */}
              <div className="p-4 rounded-2xl bg-[#F8F9FD] border border-slate-100 flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <span className="text-[10px] font-bold uppercase text-slate-400 block tracking-wider">Primary Email</span>
                  <span className="text-xs font-mono font-bold text-slate-800 truncate block mt-0.5">{user?.email}</span>
                </div>
                <span className="px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 text-[10px] font-bold border border-emerald-200/60 flex items-center gap-1.5 shrink-0 shadow-2xs">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Verified</span>
                </span>
              </div>

              {/* Session Security Status */}
              <div className="p-4 rounded-2xl bg-[#F8F9FD] border border-slate-100 flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <span className="text-[10px] font-bold uppercase text-slate-400 block tracking-wider">Authentication</span>
                  <span className="text-xs font-medium text-slate-700 block mt-0.5">Secure Cloud Session</span>
                </div>
                <span className="px-3 py-1 rounded-full bg-[#EEF0FD] text-[#5C59E8] text-[10px] font-bold border border-indigo-100 flex items-center gap-1.5 shrink-0 shadow-2xs">
                  <ShieldCheck className="w-3.5 h-3.5 text-[#5C59E8]" />
                  <span>Active</span>
                </span>
              </div>
            </div>

            {/* 4F. WORKSPACE NOTIFICATIONS */}
            <div className="p-6 sm:p-8 bg-white rounded-3xl border border-slate-100/80 shadow-[0_10px_30px_rgba(80,90,130,0.06)] space-y-4">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2 border-b border-slate-100 pb-4">
                <div className="w-8 h-8 rounded-xl bg-[#EEF0FD] text-[#5C59E8] flex items-center justify-center font-bold">
                  <Bell className="w-4 h-4" />
                </div>
                <span>Notification Preferences</span>
              </h3>

              <div className="space-y-2.5">
                <label className="flex items-center justify-between p-3.5 rounded-2xl bg-[#F8F9FD] border border-slate-100 cursor-pointer text-xs transition-all hover:border-indigo-100">
                  <span className="font-semibold text-slate-800">Interview &amp; Feedback Alerts</span>
                  <input
                    type="checkbox"
                    checked={notifyTasks}
                    onChange={(e) => setNotifyTasks(e.target.checked)}
                    className="accent-[#5C59E8] w-4 h-4 rounded-md cursor-pointer"
                  />
                </label>

                <label className="flex items-center justify-between p-3.5 rounded-2xl bg-[#F8F9FD] border border-slate-100 cursor-pointer text-xs transition-all hover:border-indigo-100">
                  <span className="font-semibold text-slate-800">Mentor &amp; Peer Messages</span>
                  <input
                    type="checkbox"
                    checked={notifyLeaves}
                    onChange={(e) => setNotifyLeaves(e.target.checked)}
                    className="accent-[#5C59E8] w-4 h-4 rounded-md cursor-pointer"
                  />
                </label>

                <label className="flex items-center justify-between p-3.5 rounded-2xl bg-[#F8F9FD] border border-slate-100 cursor-pointer text-xs transition-all hover:border-indigo-100">
                  <span className="font-semibold text-slate-800">Job Match &amp; Application Updates</span>
                  <input
                    type="checkbox"
                    checked={notifyPayroll}
                    onChange={(e) => setNotifyPayroll(e.target.checked)}
                    className="accent-[#5C59E8] w-4 h-4 rounded-md cursor-pointer"
                  />
                </label>
              </div>
            </div>
          </div>
        </div>
      </div>
    </AuthGuard>
  );
}
