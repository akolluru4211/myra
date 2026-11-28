"use client";

import React, { useState } from "react";
import Link from "next/link";
import { PublicUserProfile } from "@/lib/types";
import EdIdBadge from "@/components/ui/EdIdBadge";
import { QrCodeView } from "@/components/ui/QrCodeView";
import {
  X,
  MapPin,
  Building2,
  GraduationCap,
  Briefcase,
  Github,
  Linkedin,
  Code2,
  Globe,
  Award,
  Clock,
  Send,
  UserPlus,
  Check,
  ShieldCheck,
  ExternalLink,
  FolderGit2,
  Copy,
  QrCode,
  Sparkles
} from "lucide-react";

interface UserProfileDetailModalProps {
  user: PublicUserProfile | null;
  isOpen: boolean;
  onClose: () => void;
  onConnect?: (userId: string) => void;
  onOpenMessage?: (user: PublicUserProfile) => void;
  isConnecting?: boolean;
}

export default function UserProfileDetailModal({
  user,
  isOpen,
  onClose,
  onConnect,
  onOpenMessage,
  isConnecting = false,
}: UserProfileDetailModalProps) {
  const [activeTab, setActiveTab] = useState<"overview" | "projects" | "certifications" | "education">("overview");
  const [copiedLink, setCopiedLink] = useState(false);

  if (!isOpen || !user) return null;

  const initials = (user.name || "U")
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  const isConnected = user.connectionStatus === "accepted";
  const isPending = user.connectionStatus === "pending_sent";
  const username = user.username || user.userId;
  const portfolioDisplayUrl = `edworld.co.in/${username}`;
  const portfolioFullUrl = typeof window !== "undefined"
    ? `${window.location.origin}/${username}`
    : `https://edworld.co.in/${username}`;

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(portfolioFullUrl);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2000);
    } catch {
      // Fallback
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto font-sans">
      {/* Dimmed Backdrop */}
      <div
        className="fixed inset-0 bg-black/75 backdrop-blur-sm transition-opacity animate-in fade-in"
        onClick={onClose}
      />

      <div className="flex min-h-full items-center justify-center p-3 sm:p-4 text-center">
        <div className="w-full max-w-2xl transform overflow-hidden rounded-3xl bg-[#0C101A] text-left align-middle shadow-2xl border border-white/10 transition-all flex flex-col max-h-[90vh] text-white">
          {/* Top Banner & Header */}
          <div className="relative bg-[#080B11] p-6 sm:p-7 text-white border-b border-white/10">
            <button
              onClick={onClose}
              className="absolute top-4 right-4 p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
              aria-label="Close profile modal"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="flex items-center gap-4 min-w-0">
                <div className="relative">
                  {user.avatarUrl ? (
                    <img
                      src={user.avatarUrl}
                      alt={user.name}
                      className="w-16 h-16 sm:w-18 sm:h-18 rounded-2xl object-cover border border-white/15"
                    />
                  ) : (
                    <div className="w-16 h-16 sm:w-18 sm:h-18 rounded-2xl bg-[#0F1422] text-white border border-white/15 flex items-center justify-center font-bold text-xl font-display">
                      {initials}
                    </div>
                  )}
                </div>

                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="text-lg sm:text-xl font-bold text-white truncate font-display">
                      {user.name}
                    </h2>
                    {user.edId && (
                      <EdIdBadge userId={user.userId} customId={user.edId} size="sm" variant="pill" />
                    )}
                  </div>
                  <p className="text-xs text-slate-300 font-medium mt-1 leading-snug">
                    {user.headline || (user.userType === "STUDENT" ? "Student" : "Technology Professional")}
                  </p>

                  <div className="flex flex-wrap items-center gap-3 mt-2 text-[11px] text-slate-400 font-medium">
                    {user.college && (
                      <span className="flex items-center gap-1">
                        <GraduationCap className="w-3.5 h-3.5 text-slate-400" />
                        {user.college}
                      </span>
                    )}
                    {user.company && (
                      <span className="flex items-center gap-1">
                        <Building2 className="w-3.5 h-3.5 text-slate-400" />
                        {user.company}
                      </span>
                    )}
                    {user.location && (
                      <span className="flex items-center gap-1">
                        <MapPin className="w-3.5 h-3.5 text-slate-400" />
                        {user.location}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-2 self-stretch sm:self-center shrink-0">
                {onOpenMessage && (
                  <button
                    onClick={() => {
                      onClose();
                      onOpenMessage(user);
                    }}
                    className="flex-1 sm:flex-initial px-3.5 py-2 rounded-xl bg-[#0F1422] hover:bg-white/10 text-white text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors border border-white/10 cursor-pointer"
                  >
                    <Send className="w-3.5 h-3.5 text-white" />
                    <span>Message</span>
                  </button>
                )}

                {onConnect && (
                  <button
                    onClick={() => onConnect(user.userId)}
                    disabled={isConnected || isPending || isConnecting}
                    className={`flex-1 sm:flex-initial px-3.5 py-2 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                      isConnected
                        ? "bg-white/5 text-slate-400 border border-white/10 cursor-default"
                        : isPending
                        ? "bg-white/5 text-slate-400 border border-white/10 cursor-default"
                        : "bg-white hover:bg-slate-200 text-slate-950 shadow-md font-bold"
                    }`}
                  >
                    {isConnected ? (
                      <>
                        <Check className="w-3.5 h-3.5" />
                        <span>Connected</span>
                      </>
                    ) : isPending ? (
                      <>
                        <Clock className="w-3.5 h-3.5" />
                        <span>Pending</span>
                      </>
                    ) : (
                      <>
                        <UserPlus className="w-3.5 h-3.5" />
                        <span>Connect</span>
                      </>
                    )}
                  </button>
                )}
              </div>
            </div>

            {/* Public Portfolio & QR Code Showcase Card */}
            <div className="mt-4 pt-4 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-4 bg-gradient-to-r from-indigo-950/40 via-purple-950/30 to-transparent p-4 rounded-2xl border border-indigo-500/20">
              <div className="flex items-center gap-3.5 min-w-0">
                <div className="p-1.5 rounded-xl bg-white shadow-md shrink-0">
                  <QrCodeView value={portfolioFullUrl} size={64} fgColor="#0C101A" bgColor="#FFFFFF" />
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5 text-indigo-300 text-[10px] uppercase font-bold tracking-wider">
                    <Sparkles className="w-3 h-3 text-indigo-400" />
                    <span>Public Student Portfolio</span>
                  </div>
                  <div className="font-mono text-xs font-bold text-white truncate mt-0.5">
                    {portfolioDisplayUrl}
                  </div>
                  <div className="text-[11px] text-slate-400">
                    Scan with any phone camera or open directly
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0 w-full sm:w-auto">
                <button
                  onClick={handleCopyLink}
                  className="flex-1 sm:flex-initial px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/15 text-white text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors border border-white/15 cursor-pointer"
                  title="Copy portfolio link"
                >
                  {copiedLink ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                      <span className="text-emerald-400 font-bold">Copied!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5 text-slate-300" />
                      <span>Copy</span>
                    </>
                  )}
                </button>

                <Link
                  href={`/${username}`}
                  target="_blank"
                  className="flex-1 sm:flex-initial px-3.5 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold flex items-center justify-center gap-1.5 transition-colors shadow-md"
                >
                  <span>Open</span>
                  <ExternalLink className="w-3.5 h-3.5 text-white" />
                </Link>
              </div>
            </div>

            {/* Social / External Links Bar */}
            <div className="flex flex-wrap items-center gap-2 mt-3 pt-3 border-t border-white/10 text-xs">
              {user.githubUrl && (
                <a
                  href={user.githubUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-2.5 py-1 rounded-lg bg-[#0F1422] hover:bg-white/10 text-slate-200 flex items-center gap-1.5 transition-colors border border-white/10"
                >
                  <Github className="w-3 h-3 text-white" />
                  <span>GitHub</span>
                </a>
              )}
              {user.linkedinUrl && (
                <a
                  href={user.linkedinUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-2.5 py-1 rounded-lg bg-[#0F1422] hover:bg-white/10 text-slate-200 flex items-center gap-1.5 transition-colors border border-white/10"
                >
                  <Linkedin className="w-3 h-3 text-white" />
                  <span>LinkedIn</span>
                </a>
              )}
              {user.leetcodeUrl && (
                <a
                  href={user.leetcodeUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-2.5 py-1 rounded-lg bg-[#0F1422] hover:bg-white/10 text-slate-200 flex items-center gap-1.5 transition-colors border border-white/10"
                >
                  <Code2 className="w-3 h-3 text-white" />
                  <span>LeetCode</span>
                </a>
              )}
              {user.portfolioUrl && (
                <a
                  href={user.portfolioUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-2.5 py-1 rounded-lg bg-[#0F1422] hover:bg-white/10 text-slate-200 flex items-center gap-1.5 transition-colors border border-white/10"
                >
                  <Globe className="w-3 h-3 text-white" />
                  <span>Website</span>
                </a>
              )}
            </div>
          </div>

          {/* Navigation Tab Bar */}
          <div className="flex items-center gap-1 px-6 border-b border-white/10 bg-[#0C101A] overflow-x-auto no-scrollbar">
            {[
              { id: "overview", label: "Overview", icon: Briefcase },
              { id: "projects", label: `Projects (${user.projects?.length || 0})`, icon: FolderGit2 },
              { id: "certifications", label: `Certifications (${user.certifications?.length || 0})`, icon: Award },
              { id: "education", label: "Education", icon: GraduationCap },
            ].map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`py-3.5 px-3 text-xs font-semibold border-b-2 flex items-center gap-1.5 whitespace-nowrap transition-colors cursor-pointer ${
                    isActive
                      ? "border-white text-white"
                      : "border-transparent text-slate-400 hover:text-white"
                  }`}
                >
                  <Icon className={`w-3.5 h-3.5 ${isActive ? "text-white" : "text-slate-400"}`} />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>

          {/* Modal Tab Content */}
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            {/* 1. OVERVIEW & BIO */}
            {activeTab === "overview" && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400">Bio</h3>
                  <p className="text-xs text-white leading-relaxed mt-2 bg-[#0F1422] p-4 rounded-2xl border border-white/10">
                    {user.bio || "No bio added yet."}
                  </p>
                </div>

                {user.skills && user.skills.length > 0 && (
                  <div>
                    <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2.5">
                      Skills
                    </h3>
                    <div className="flex flex-wrap gap-2">
                      {user.skills.map((skill, idx) => (
                        <span
                          key={idx}
                          className="px-3 py-1.5 rounded-xl text-xs font-medium bg-[#0F1422] border border-white/10 text-white"
                        >
                          {skill}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="edworld-blue-card p-4 rounded-2xl  border border-white/10">
                    <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Career Stage</span>
                    <p className="text-xs font-semibold text-white mt-1 flex items-center gap-1.5">
                      <Briefcase className="w-3.5 h-3.5 text-white" />
                      {user.userType === "STUDENT" ? "Student" : "Technology Professional"}
                    </p>
                  </div>

                  {user.cgpa && (
                    <div className="edworld-blue-card p-4 rounded-2xl  border border-white/10">
                      <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Academic Metric</span>
                      <p className="text-xs font-semibold text-white mt-1 flex items-center gap-1.5">
                        <GraduationCap className="w-3.5 h-3.5 text-white" />
                        CGPA: {user.cgpa} / 10
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* 2. PROJECTS */}
            {activeTab === "projects" && (
              <div className="space-y-4">
                {user.projects && user.projects.length > 0 ? (
                  user.projects.map((proj, idx) => (
                    <div key={idx} className="edworld-blue-card p-4 rounded-2xl  border border-white/10 space-y-2.5">
                      <div className="flex items-center justify-between">
                        <h4 className="text-sm font-semibold text-white">{proj.title}</h4>
                        <div className="flex items-center gap-2">
                          {proj.githubRepo && (
                            <a
                              href={proj.githubRepo}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-xs font-semibold text-slate-300 hover:text-white flex items-center gap-1"
                            >
                              <Github className="w-3.5 h-3.5" />
                              <span>Code</span>
                            </a>
                          )}
                          {proj.demoUrl && (
                            <a
                              href={proj.demoUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-xs font-semibold text-indigo-400 hover:underline flex items-center gap-1"
                            >
                              <ExternalLink className="w-3.5 h-3.5" />
                              <span>Demo</span>
                            </a>
                          )}
                        </div>
                      </div>
                      <p className="text-xs text-slate-300 leading-relaxed">{proj.description}</p>
                      {proj.technologies && (
                        <div className="flex flex-wrap gap-1.5 pt-1">
                          {proj.technologies.map((t, tIdx) => (
                            <span key={tIdx} className="text-[10px] px-2 py-0.5 rounded-md bg-white/5 text-slate-300 border border-white/10 font-medium">
                              {t}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  ))
                ) : (
                  <div className="edworld-blue-card text-center py-8  rounded-2xl border border-white/10 text-slate-400 text-xs">
                    <FolderGit2 className="w-8 h-8 mx-auto text-slate-500 mb-2" />
                    <p>No public portfolio projects listed yet.</p>
                  </div>
                )}
              </div>
            )}

            {/* 3. CERTIFICATIONS */}
            {activeTab === "certifications" && (
              <div className="space-y-3">
                {user.certifications && user.certifications.length > 0 ? (
                  user.certifications.map((cert, idx) => (
                    <div key={idx} className="edworld-blue-card p-4 rounded-2xl  border border-white/10 flex items-center justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-white/10 text-white border border-white/10 flex items-center justify-center shrink-0">
                          <Award className="w-5 h-5 text-indigo-400" />
                        </div>
                        <div>
                          <h4 className="text-xs font-semibold text-white">{cert.name}</h4>
                          <p className="text-[11px] text-slate-400 mt-0.5">{cert.issuer} • Issued {cert.issueDate}</p>
                        </div>
                      </div>
                      {cert.url && (
                        <a
                          href={cert.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="px-3 py-1 rounded-xl bg-white/10 hover:bg-white/15 border border-white/10 text-xs font-semibold text-white transition-colors flex items-center gap-1"
                        >
                          <span>Verify</span>
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      )}
                    </div>
                  ))
                ) : (
                  <div className="edworld-blue-card text-center py-8  rounded-2xl border border-white/10 text-slate-400 text-xs">
                    <Award className="w-8 h-8 mx-auto text-slate-500 mb-2" />
                    <p>No verified certifications listed yet.</p>
                  </div>
                )}
              </div>
            )}

            {/* 4. EDUCATION */}
            {activeTab === "education" && (
              <div className="space-y-4">
                <div className="edworld-blue-card p-4 rounded-2xl  border border-white/10 space-y-2">
                  <div className="flex items-center gap-2 text-xs font-semibold text-white">
                    <GraduationCap className="w-4 h-4 text-indigo-400" />
                    <span>Education</span>
                  </div>
                  <div className="pl-6 text-xs text-slate-300 space-y-1">
                    <p className="font-semibold text-white">{user.college || "University"}</p>
                    {user.degree && <p className="text-slate-400">{user.degree}</p>}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Modal Footer */}
          <div className="p-4 bg-[#080B11] border-t border-white/10 flex items-center justify-between text-xs text-slate-400">
            <span className="flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>Public Verified Student Portfolio</span>
            </span>
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-white text-slate-950 font-bold hover:bg-slate-200 transition-colors cursor-pointer"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
