"use client";

import React, { useState, useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import { 
  ShieldCheck, 
  Copy, 
  Check, 
  ExternalLink, 
  Share2, 
  Download,
  Sparkles,
  MapPin,
  Building2,
  GraduationCap,
  Cpu
} from "lucide-react";
import { formatEdworldId } from "@/lib/utils";
import { QrCodeView } from "@/components/ui/QrCodeView";

export interface EdworldDigitalIdCardProps {
  userId?: string;
  name?: string;
  headline?: string;
  email?: string;
  username?: string;
  avatarUrl?: string | null;
  organization?: string;
  college?: string;
  degree?: string;
  branch?: string;
  graduationYear?: string;
  targetRole?: string;
  location?: string;
  role?: string;
  careerStage?: string;
  isPublic?: boolean;
  className?: string;
  showActions?: boolean;
}

export default function EdworldDigitalIdCard({
  userId,
  name = "EdWorld Student",
  headline = "Software Engineer & Builder",
  email,
  username,
  avatarUrl,
  organization,
  college,
  degree,
  branch,
  graduationYear,
  targetRole,
  location,
  role,
  careerStage = "STUDENT",
  isPublic = true,
  className = "",
  showActions = true,
}: EdworldDigitalIdCardProps) {
  const cardRef = useRef<HTMLDivElement>(null);
  const [copiedId, setCopiedId] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);

  // Generate standardized student ID format: EDW-STU-XXXXX
  const rawId = userId ? userId.replace(/-/g, "").toUpperCase() : "88294";
  const studentIdCode = `EDW-STU-${rawId.slice(0, 5)}`;
  // edworldId alias for full test & format compatibility
  const edworldId = studentIdCode;
  const publicSlug = username || (userId ? userId.slice(0, 8) : "student");
  
  const publicProfileUrl = typeof window !== "undefined" 
    ? `${window.location.origin}/${publicSlug}` 
    : `https://edworld.co.in/${publicSlug}`;

  const displayName = name.trim() || "EdWorld Student";
  const userInitial = displayName.charAt(0).toUpperCase();
  const academicInstitute = college || organization || "Engineering Institute";
  const academicProgram = degree && branch ? `${degree} in ${branch}` : degree || branch || "Computer Science & Engineering";
  const batchYear = graduationYear ? `Class of ${graduationYear}` : "Class of 2026";

  const handleCopyId = () => {
    if (typeof window !== "undefined") {
      navigator.clipboard.writeText(edworldId);
      setCopiedId(true);
      setTimeout(() => setCopiedId(false), 2500);
    }
  };

  const handleCopyProfileLink = () => {
    if (typeof window !== "undefined") {
      navigator.clipboard.writeText(publicProfileUrl);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2500);
    }
  };

  const handleDownloadCard = () => {
    setIsDownloading(true);
    try {
      if (typeof window !== "undefined") {
        window.print();
      }
    } catch (e) {
      console.error("Card print error:", e);
    } finally {
      setTimeout(() => setIsDownloading(false), 1200);
    }
  };

  return (
    <div className={`space-y-4 ${className}`}>
      {/* ========================================================================= */}
      {/* PURE WHITE ELEVATED EDWORLD DIGITAL STUDENT ID CARD                       */}
      {/* ========================================================================= */}
      <div
        id="edworld-digital-id-card"
        ref={cardRef}
        className="relative overflow-hidden rounded-3xl bg-white text-slate-900 p-6 sm:p-8 border border-slate-100/80 shadow-[0_10px_30px_rgba(80,90,130,0.06)] transition-all hover:border-indigo-100/80"
      >
        {/* Subtle Ambient Mesh Tint Gradients */}
        <div className="absolute -top-24 -right-24 w-72 h-72 bg-gradient-to-br from-indigo-50/70 via-purple-50/40 to-transparent rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -left-24 w-72 h-72 bg-gradient-to-tr from-blue-50/50 via-slate-50/30 to-transparent rounded-full blur-3xl pointer-events-none" />

        {/* 1. CARD HEADER: Official EdWorld Logo & Verified Member Badge */}
        <div className="relative z-10 flex items-center justify-between gap-3 border-b border-slate-100 pb-4">
          <div className="flex items-center gap-3">
            {/* EdWorld Official Logo Mark */}
            <div className="w-11 h-11 rounded-2xl bg-white border border-slate-200/80 p-1.5 flex items-center justify-center shrink-0 shadow-xs">
              <Image
                src="/images/edworld-logo.png"
                alt="EdWorld Logo"
                width={30}
                height={30}
                className="object-contain"
                priority
              />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-sm font-black tracking-tight text-slate-900 font-display">
                  EdWorld <span className="text-[#5C59E8] font-extrabold">Co.</span>
                </span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-[#EEF0FD] text-[#5C59E8] border border-indigo-100 font-bold">
                  STUDENT ID
                </span>
              </div>
              <span className="text-[9px] font-semibold text-slate-400 uppercase tracking-widest block mt-0.5">
                Official Digital Identity &bull; {batchYear}
              </span>
            </div>
          </div>

          {/* Mint Emerald Verified Member Badge */}
          <div className="flex items-center gap-1.5 shrink-0">
            <span className="px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 text-[10px] font-bold border border-emerald-200/60 flex items-center gap-1 shadow-xs">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
              <span>Verified Member</span>
            </span>
          </div>
        </div>

        {/* 2. CARD BODY: Student Avatar, Identity, Academic Details & NFC Tag */}
        <div className="relative z-10 py-5 flex flex-col md:flex-row md:items-center justify-between gap-5">
          {/* Left Column: Avatar & Core Names */}
          <div className="flex items-center gap-4 sm:gap-5 min-w-0">
            {/* Avatar with Crisp Border */}
            <div className="relative shrink-0">
              {avatarUrl ? (
                <img
                  src={avatarUrl}
                  alt={displayName}
                  className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl object-cover border-2 border-indigo-100 shadow-sm"
                />
              ) : (
                <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-gradient-to-br from-[#EEF0FD] to-[#E0E3FA] text-[#5C59E8] font-display font-extrabold text-2xl sm:text-3xl flex items-center justify-center shadow-xs border-2 border-indigo-100">
                  {userInitial}
                </div>
              )}
              {/* Active Verified Beacon */}
              <span className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-emerald-500 border-2 border-white flex items-center justify-center shadow-xs" title="Active Verified Member">
                <span className="w-1.5 h-1.5 rounded-full bg-white" />
              </span>
            </div>

            <div className="space-y-1 min-w-0">
              <h2 className="text-lg sm:text-2xl font-black font-display text-slate-900 tracking-tight leading-snug truncate">
                {displayName}
              </h2>
              <p className="text-xs sm:text-sm font-semibold text-[#5C59E8] font-mono flex items-center gap-1">
                <span>@{publicSlug}</span>
              </p>
              <p className="text-[11px] sm:text-xs text-slate-600 font-normal line-clamp-1 max-w-sm">
                {headline}
              </p>
            </div>
          </div>

          {/* Right Column: Academic Details & Smart Chip */}
          <div className="flex flex-col md:items-end text-xs space-y-1.5 font-medium shrink-0 pt-2 md:pt-0 border-t md:border-t-0 border-slate-100">
            {/* Microchip / Smart NFC Tag */}
            <div className="hidden sm:flex items-center gap-2 mb-1 px-2.5 py-1 rounded-xl bg-[#EEF0FD] border border-indigo-100/80 text-[#5C59E8] text-[10px] font-mono font-bold">
              <Cpu className="w-3.5 h-3.5 text-[#5C59E8]" />
              <span>NFC / QR VERIFIED</span>
            </div>

            <div className="flex items-center gap-1.5 text-slate-700">
              <GraduationCap className="w-3.5 h-3.5 text-[#5C59E8] shrink-0" />
              <span className="truncate max-w-[240px] font-semibold">{academicInstitute}</span>
            </div>

            <div className="flex items-center gap-1.5 text-slate-600 text-[11px]">
              <span className="text-slate-400">Program:</span>
              <span className="truncate max-w-[220px] text-slate-800 font-medium">{academicProgram}</span>
            </div>

            {location && (
              <div className="flex items-center gap-1.5 text-slate-500 text-[11px]">
                <MapPin className="w-3 h-3 text-slate-400" />
                <span>{location}</span>
              </div>
            )}
          </div>
        </div>

        {/* 3. CARD FOOTER: Unique ID Code + Interactive QR Matrix Pattern */}
        <div className="relative z-10 pt-4 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          {/* Student ID Display & Copy Button */}
          <div className="flex items-center gap-2.5 flex-wrap">
            <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
              Student ID:
            </span>
            <div className="flex items-center gap-1.5 bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-200/80">
              <span className="font-mono text-xs sm:text-sm font-extrabold text-[#5C59E8] tracking-wider">
                {studentIdCode}
              </span>
              <button
                type="button"
                onClick={handleCopyId}
                title="Copy ID"
                aria-label="Copy ID"
                className="p-1 text-slate-400 hover:text-slate-700 transition-colors cursor-pointer"
              >
                {copiedId ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
              </button>
            </div>
            {copiedId && (
              <span className="text-[10px] text-emerald-600 font-semibold animate-in fade-in">
                Copied to clipboard!
              </span>
            )}
          </div>

          {/* Scannable Portfolio Deep-Link & Real Scannable QR Badge */}
          <div className="flex items-center gap-3">
            <Link
              href={`/${publicSlug}`}
              className="text-[11px] font-mono text-[#5C59E8] hover:text-[#4F46E5] transition-colors flex items-center gap-1 underline underline-offset-2 font-medium"
            >
              <span>edworld.co.in/{publicSlug}</span>
              <ExternalLink className="w-3 h-3" />
            </Link>

            {/* Real Scannable QR Matrix Badge */}
            <div className="p-1 rounded-xl bg-slate-50 border border-slate-200/80 shrink-0 shadow-2xs flex items-center justify-center overflow-hidden" title="Scan with phone camera to open portfolio">
              <QrCodeView value={publicProfileUrl} size={32} fgColor="#1E293B" bgColor="#F8FAFC" includeMargin={false} />
            </div>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* CARD ACTION CONTROLS                                                      */}
      {/* ========================================================================= */}
      {showActions && (
        <div className="flex flex-wrap items-center gap-2.5 pt-1">
          {/* Download Student ID Button */}
          <button
            type="button"
            onClick={handleDownloadCard}
            disabled={isDownloading}
            className="px-4 py-2 rounded-2xl bg-white hover:bg-slate-50 border border-slate-200/80 text-slate-800 text-xs font-bold flex items-center gap-1.5 transition-all shadow-xs cursor-pointer disabled:opacity-60"
          >
            <Download className="w-3.5 h-3.5 text-slate-600" />
            <span>{isDownloading ? "Preparing ID..." : "Download Student ID"}</span>
          </button>

          {/* Share Profile Button */}
          <button
            type="button"
            onClick={handleCopyProfileLink}
            aria-label="Share Profile"
            className="px-4 py-2 rounded-2xl bg-[#EEF0FD] hover:bg-[#E0E3FA] text-[#3730A3] border border-indigo-100/60 text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer"
          >
            {copiedLink ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Share2 className="w-3.5 h-3.5 text-[#5C59E8]" />}
            <span>{copiedLink ? "Link Copied" : "Share Profile"}</span>
          </button>

          {/* View Public Profile Button */}
          <Link
            href={`/${publicSlug}`}
            aria-label="View Public Profile"
            className="px-4 py-2 rounded-2xl bg-[#5C59E8] hover:bg-[#4F46E5] text-white text-xs font-bold flex items-center gap-1.5 transition-all shadow-md shadow-indigo-500/20"
          >
            <span>View Public Profile</span>
            <ExternalLink className="w-3.5 h-3.5 text-white" />
          </Link>
        </div>
      )}
    </div>
  );
}
