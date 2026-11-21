"use client";

export const dynamic = "force-dynamic";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { 
  FolderGit2, 
  ExternalLink, 
  ShieldCheck, 
  Check, 
  Copy, 
  ArrowLeft, 
  User, 
  Layers,
  Sparkles,
  QrCode,
  Github,
  Globe,
  Share2
} from "lucide-react";
import { QrCodeView } from "@/components/ui/QrCodeView";

export default function StudentPortfolioViewPage() {
  const params = useParams();
  const { user, profile: authProfile } = useAuth();
  const usernameParam = decodeURIComponent((params?.username as string) || "").trim();

  const [profile, setProfile] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!usernameParam) return;

    const fetchProfile = async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/profile/public/${encodeURIComponent(usernameParam)}`);
        const json = await res.json();
        if (res.ok && json.success && json.data) {
          setProfile(json.data);
        } else if (user) {
          // Self-healing fallback for logged-in user
          setProfile({
            id: user.uid,
            name: user.name || "Student",
            username: (authProfile as any)?.username || usernameParam,
            headline: (authProfile as any)?.headline || "Software Engineer & Builder",
            githubUrl: (authProfile as any)?.github_url || null,
            portfolioUrl: (authProfile as any)?.portfolio_url || null,
            skills: (authProfile as any)?.skills || [],
            projects: []
          });
        }
      } catch (err) {
        console.error("Portfolio fetch error:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [usernameParam, user, authProfile]);

  const handleCopyLink = () => {
    if (typeof window !== "undefined") {
      navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const projects = profile?.projects || [];
  const portfolioUrl = typeof window !== "undefined" ? window.location.href : `https://edworld.co.in/u/${usernameParam}/portfolio`;

  if (loading) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center space-y-3 font-sans">
        <div className="w-8 h-8 rounded-full border-2 border-emerald-500 border-t-transparent animate-spin" />
        <p className="text-xs text-slate-400 font-mono">Loading verifiable student portfolio...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen py-10 px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto font-sans space-y-8">
      {/* Top Breadcrumb & Navigation */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link
            href={`/u/${usernameParam}`}
            className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Profile Overview</span>
          </Link>
          <span className="text-slate-600">/</span>
          <span className="text-xs font-bold text-emerald-400 font-mono">Portfolio</span>
        </div>

        <div className="flex items-center gap-2">
          <Link
            href={`/u/${usernameParam}`}
            className="px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-semibold text-slate-300 flex items-center gap-1.5 transition-colors"
          >
            <User className="w-3.5 h-3.5" />
            <span>Public Profile</span>
          </Link>
          <button
            onClick={handleCopyLink}
            className="px-3 py-1.5 rounded-xl bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/30 text-emerald-400 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            {copied ? <Check className="w-3.5 h-3.5" /> : <Share2 className="w-3.5 h-3.5" />}
            <span>{copied ? "Copied" : "Share Portfolio"}</span>
          </button>
        </div>
      </div>

      {/* Hero Header Card */}
      <div className="p-6 sm:p-8 rounded-3xl bg-[#0C101A] border border-white/10 shadow-2xl flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono font-bold uppercase tracking-wider text-emerald-400">
              Verified Proof-of-Work
            </span>
            <span className="px-2 py-0.5 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-[10px] font-bold flex items-center gap-1">
              <ShieldCheck className="w-3 h-3" />
              <span>EdWorld Verified</span>
            </span>
          </div>

          <h1 className="text-2xl sm:text-4xl font-black font-display text-white tracking-tight">
            {profile?.name || usernameParam}
          </h1>
          <p className="text-sm text-slate-300 max-w-xl font-normal leading-relaxed">
            {profile?.headline || "Engineering Student & Technology Builder"}
          </p>

          <div className="flex flex-wrap items-center gap-2 pt-1">
            {profile?.githubUrl && (
              <a
                href={profile.githubUrl.startsWith("http") ? profile.githubUrl : `https://${profile.githubUrl}`}
                target="_blank"
                rel="noreferrer"
                className="px-3 py-1.5 rounded-xl bg-[#080B11] border border-white/10 text-xs text-slate-300 hover:text-white flex items-center gap-1.5 transition-colors"
              >
                <Github className="w-3.5 h-3.5" />
                <span>GitHub</span>
                <ExternalLink className="w-3 h-3 text-slate-500" />
              </a>
            )}
            {profile?.portfolioUrl && (
              <a
                href={profile.portfolioUrl.startsWith("http") ? profile.portfolioUrl : `https://${profile.portfolioUrl}`}
                target="_blank"
                rel="noreferrer"
                className="px-3 py-1.5 rounded-xl bg-[#080B11] border border-white/10 text-xs text-slate-300 hover:text-white flex items-center gap-1.5 transition-colors"
              >
                <Globe className="w-3.5 h-3.5" />
                <span>Website</span>
                <ExternalLink className="w-3 h-3 text-slate-500" />
              </a>
            )}
          </div>
        </div>

        {/* QR Code Card */}
        <div className="p-4 rounded-2xl bg-[#080B11] border border-white/10 flex flex-col items-center justify-center gap-2 shrink-0 self-start md:self-auto">
          <div className="p-2 rounded-xl bg-white shadow-sm">
            <QrCodeView value={portfolioUrl} size={84} fgColor="#0A0A0A" bgColor="#FFFFFF" includeMargin={false} />
          </div>
          <span className="text-[10px] font-mono text-slate-400 font-semibold tracking-wider uppercase">
            Scan to Verify
          </span>
        </div>
      </div>

      {/* Featured Projects Grid */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold font-display text-white flex items-center gap-2">
            <FolderGit2 className="w-5 h-5 text-emerald-400" />
            <span>Proof-of-Work Projects ({projects.length})</span>
          </h2>
          <span className="text-xs text-slate-400 font-mono">Verifiable Code &amp; Deployments</span>
        </div>

        {projects.length === 0 ? (
          <div className="p-8 sm:p-12 rounded-3xl bg-[#0C101A] border border-white/10 text-center space-y-3">
            <FolderGit2 className="w-8 h-8 text-slate-500 mx-auto" />
            <h3 className="text-sm font-bold text-white">No projects published yet</h3>
            <p className="text-xs text-slate-400 max-w-sm mx-auto font-normal">
              Projects and repositories verified through EdBuild and Student Record will appear here automatically.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {projects.map((proj: any) => (
              <div
                key={proj.id}
                className="p-6 rounded-3xl bg-[#0C101A] border border-white/10 hover:border-emerald-500/40 transition-all flex flex-col justify-between space-y-4 group"
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between gap-2">
                    <h3 className="font-bold text-white text-base font-display group-hover:text-emerald-400 transition-colors">
                      {proj.title}
                    </h3>
                    <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-[10px] font-mono">
                      {proj.isStudentRecord ? "Portfolio Evidence" : "Verified"}
                    </span>
                  </div>
                  {proj.description && (
                    <p className="text-xs text-slate-400 line-clamp-3 leading-relaxed font-normal">
                      {proj.description}
                    </p>
                  )}
                  {proj.tags && proj.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1 pt-1">
                      {proj.tags.map((t: string, i: number) => (
                        <span key={i} className="text-[10px] px-2 py-0.5 rounded-md bg-white/5 text-slate-400 border border-white/5 font-mono">
                          {t}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-2.5 pt-2 border-t border-white/10">
                  {proj.live_url || proj.liveUrl ? (
                    <a
                      href={proj.live_url || proj.liveUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="px-3 py-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs flex items-center gap-1 transition-all"
                    >
                      <span>Live Demo</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  ) : null}
                  {proj.github_url || proj.githubUrl ? (
                    <a
                      href={proj.github_url || proj.githubUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white font-semibold text-xs flex items-center gap-1 transition-colors border border-white/10"
                    >
                      <Github className="w-3.5 h-3.5" />
                      <span>Source Code</span>
                    </a>
                  ) : null}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Certifications Section */}
      {profile?.certifications && profile.certifications.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold font-display text-white flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-emerald-400" />
              <span>Verified Credentials &amp; Certifications ({profile.certifications.length})</span>
            </h2>
            <span className="text-xs text-slate-400 font-mono">Academic &amp; Professional Proof</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {profile.certifications.map((cert: any) => (
              <div
                key={cert.id}
                className="p-5 rounded-3xl bg-[#0C101A] border border-white/10 hover:border-emerald-500/40 transition-all flex items-center justify-between gap-4"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <h3 className="font-bold text-white text-sm font-display">{cert.title}</h3>
                    <span
                      className={`text-[9px] font-bold px-2 py-0.5 rounded-full border ${
                        cert.isVerified
                          ? "bg-emerald-500/15 text-emerald-400 border-emerald-500/30"
                          : "bg-white/5 text-slate-400 border-white/10"
                      }`}
                    >
                      {cert.isVerified ? "Institution Verified" : "Student-Entered"}
                    </span>
                  </div>
                  <div className="text-xs text-slate-400">
                    Issued by {cert.issuer} {cert.issueDate ? `• ${cert.issueDate}` : ""}
                  </div>
                </div>

                {cert.verificationUrl && (
                  <a
                    href={cert.verificationUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-emerald-400 border border-white/10 text-xs font-semibold shrink-0"
                    title="View Credential"
                  >
                    <ExternalLink className="w-4 h-4" />
                  </a>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Skills Matrix */}
      {profile?.skills && profile.skills.length > 0 && (
        <div className="p-6 sm:p-8 rounded-3xl bg-[#0C101A] border border-white/10 space-y-4">
          <h2 className="text-sm font-bold font-display text-white uppercase tracking-wider flex items-center gap-2">
            <Layers className="w-4 h-4 text-emerald-400" />
            <span>Validated Technical Competencies</span>
          </h2>
          <div className="flex flex-wrap gap-2">
            {profile.skills.map((s: any, idx: number) => {
              const name = typeof s === "string" ? s : s.name || s.id;
              return (
                <span
                  key={idx}
                  className="px-3 py-1 rounded-xl bg-[#080B11] border border-white/10 text-xs font-semibold text-slate-300"
                >
                  {name}
                </span>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
