"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { Resume, ResumeContent, ResumeTemplateId } from "@/lib/types";
import { DEFAULT_RESUME_CONTENT } from "@/lib/mock-data";
import { supabase } from "@/lib/supabase";
import { db } from "@/lib/firebase";
import { doc, setDoc } from "firebase/firestore";
import ResumeBuilderForm from "@/components/resume/ResumeBuilderForm";
import ResumePreview from "@/components/resume/ResumePreview";
import JDMatchModal from "@/components/resume/JDMatchModal";
import MyraJobMatcherModal from "@/components/resume/MyraJobMatcherModal";
import PdfExportButton from "@/components/resume/PdfExportButton";
import { 
  ArrowLeft, 
  Sparkles, 
  Check, 
  Eye, 
  FileEdit,
  Lock,
  ArrowRight,
  Info,
  X,
  Briefcase
} from "lucide-react";
import AuthGuard from "@/components/auth/AuthGuard";
import { getResumeProfileDefaults } from "@/lib/services/user-profile";
import UserGreeting from "@/components/ui/UserGreeting";

export const dynamic = "force-dynamic";

export default function ResumesDirectEditorPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { user, profile, loading } = useAuth();
  const isNewQuery = searchParams.get("isNew") === "true";

  // Junior Track Gating (13-15 years)
  const isJuniorTrack = user?.ageBand === "13-15";

  const [resume, setResume] = useState<Resume | null>(null);
  const [activeTemplate, setActiveTemplate] = useState<ResumeTemplateId>("classic");
  const [isJDModalOpen, setIsJDModalOpen] = useState(false);
  const [isMyraJobModalOpen, setIsMyraJobModalOpen] = useState(false);
  const [mobileTab, setMobileTab] = useState<"edit" | "preview">("edit");
  const [savedStatus, setSavedStatus] = useState<string>("Saved");
  const [showPreFillBanner, setShowPreFillBanner] = useState(isNewQuery);

  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (!user || isJuniorTrack) {
      setResume(null);
      return;
    }

    const loadPrimaryResume = async () => {
      // 1. Fetch primary/most recent resume from Supabase
      try {
        const { data, error } = await supabase
          .from("resumes")
          .select("*")
          .eq("user_id", user.uid)
          .order("updated_at", { ascending: false })
          .limit(1);

        if (data && data.length > 0) {
          const item = data[0];
          const loaded: Resume = {
            id: item.id,
            userId: item.user_id,
            title: item.title || "ATS Master Resume",
            templateId: (item.template_id as ResumeTemplateId) || "classic",
            content: item.content || DEFAULT_RESUME_CONTENT,
            createdAt: item.created_at,
            updatedAt: item.updated_at,
          };
          setResume(loaded);
          setActiveTemplate(loaded.templateId || "classic");
          localStorage.setItem(`edworld_${user.uid}_resumes`, JSON.stringify([loaded]));
          return;
        }
      } catch (err) {
        console.warn("[Supabase Resume Fetch Note]:", err);
      }

      // 2. Local storage cache fallback
      const cached = localStorage.getItem(`edworld_${user.uid}_resumes`);
      if (cached) {
        try {
          const parsed = JSON.parse(cached);
          if (Array.isArray(parsed) && parsed.length > 0) {
            setResume(parsed[0]);
            setActiveTemplate(parsed[0].templateId || "classic");
            return;
          }
        } catch {}
      }

      // 3. Fallback: Initialize master ATS resume prefilled with real user profile defaults
      const interestSkills = profile?.interests?.map((i) => i.name) || ["TypeScript", "React", "Node.js", "REST APIs"];
      const contactDefaults = getResumeProfileDefaults(user, profile);
      const initialResume: Resume = {
        id: `resume-${user.uid}-master`,
        userId: user.uid,
        title: "ATS Master Resume",
        templateId: "classic",
        content: {
          ...DEFAULT_RESUME_CONTENT,
          contact: contactDefaults,
          skills: {
            ...DEFAULT_RESUME_CONTENT.skills,
            technical: interestSkills,
          },
        },
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      try {
        await supabase
          .from("resumes")
          .upsert({
            id: initialResume.id,
            user_id: user.uid,
            title: initialResume.title,
            template_id: initialResume.templateId,
            content: initialResume.content,
            created_at: initialResume.createdAt,
            updated_at: initialResume.updatedAt,
          });
      } catch (e) {
        console.warn("[Supabase Resume Init Note]:", e);
      }

      setResume(initialResume);
      setActiveTemplate("classic");
      localStorage.setItem(`edworld_${user.uid}_resumes`, JSON.stringify([initialResume]));
    };

    loadPrimaryResume();
  }, [user, profile, isJuniorTrack]);

  const handleContentChange = (updatedContent: ResumeContent) => {
    if (!resume || !user) return;
    const updated: Resume = {
      ...resume,
      content: updatedContent,
      templateId: activeTemplate,
      updatedAt: new Date().toISOString(),
    };
    setResume(updated);
    setSavedStatus("Saving...");

    // Debounced autosave (1000ms) to Supabase + local storage
    if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    saveTimeoutRef.current = setTimeout(async () => {
      // 1. Update local storage
      const cached = localStorage.getItem(`edworld_${user.uid}_resumes`);
      let list: Resume[] = cached ? JSON.parse(cached) : [];
      const index = list.findIndex((r) => r.id === resume.id);
      if (index >= 0) {
        list[index] = updated;
      } else {
        list = [updated, ...list];
      }
      localStorage.setItem(`edworld_${user.uid}_resumes`, JSON.stringify(list));

      // 2. Persist to Supabase Relational Database
      try {
        await supabase.from("resumes").upsert({
          id: resume.id,
          user_id: user.uid,
          title: updated.title,
          template_id: updated.templateId,
          content: updated.content,
          updated_at: new Date().toISOString(),
        });
      } catch (e) {
        console.warn("[Supabase Resume Save Note]:", e);
      }

      // 3. Persist to Firestore if available
      if (db) {
        try {
          await setDoc(doc(db, "resumes", resume.id), updated, { merge: true });
        } catch (err) {
          console.warn("[Firestore Resume Autosave Note]:", err);
        }
      }

      setSavedStatus("Saved");
    }, 1000);
  };

  const handleTemplateChange = (tmpl: ResumeTemplateId) => {
    setActiveTemplate(tmpl);
    if (resume) {
      const updated = { ...resume, templateId: tmpl };
      setResume(updated);
      handleContentChange(resume.content);
    }
  };

  const handleTitleChange = (newTitle: string) => {
    if (!resume) return;
    const updated = { ...resume, title: newTitle };
    setResume(updated);
    handleContentChange(resume.content);
  };

  const handleAddKeyword = (kw: string) => {
    if (!resume) return;
    const currentTech = resume.content.skills?.technical || [];
    if (currentTech.some((s) => s.toLowerCase() === kw.toLowerCase())) return;
    const updatedContent: ResumeContent = {
      ...resume.content,
      skills: {
        ...resume.content.skills,
        technical: [...currentTech, kw],
      },
    };
    handleContentChange(updatedContent);
  };

  // Junior Track Gating (13-15 years)
  if (isJuniorTrack) {
    return (
      <AuthGuard>
        <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center p-6">
          <div className="max-w-md w-full liquid-glass-card p-8 text-center space-y-6">
            <div className="w-16 h-16 rounded-2xl bg-slate-500/15 border border-slate-300 text-slate-800 flex items-center justify-center mx-auto shadow-xs">
              <Lock className="w-8 h-8 text-slate-800" />
            </div>
            <div className="space-y-2">
              <span className="liquid-pill px-3 py-1 bg-white/70 text-slate-600 text-xs font-medium border-blue-200">
                Junior track (13–15)
              </span>
              <h1 className="text-2xl font-bold text-slate-900 tracking-tight font-display">Resume maker is for explorer &amp; career tracks</h1>
              <p className="text-xs text-slate-600 leading-relaxed">
                As a Class 9-10 learner, your focus is on curious exploration, building hands-on creative projects, and learning core concepts. Resume building unlocks in the 16-18 Explorer Track.
              </p>
            </div>
            <Link
              href="/dashboard"
              className="liquid-btn-primary w-full py-3 px-4 text-xs flex items-center justify-center gap-2 cursor-pointer"
            >
              <span>Return to dashboard</span>
              <ArrowRight className="w-3.5 h-3.5 text-white" />
            </Link>
          </div>
        </div>
      </AuthGuard>
    );
  }

  if (loading || !resume) {
    return (
      <AuthGuard>
        <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center">
          <div className="text-center space-y-3 text-xs text-slate-500">
            <div className="w-6 h-6 border-2 border-slate-900 border-t-transparent rounded-full animate-spin mx-auto" />
            <p>Loading resume workspace...</p>
          </div>
        </div>
      </AuthGuard>
    );
  }

  return (
    <AuthGuard>
      <div className="w-full flex flex-col text-slate-900 font-sans space-y-6">
        {/* Top Action Bar */}
        <header className="bg-white/95 backdrop-blur-md border border-blue-200/80 sticky top-0 z-20 rounded-3xl px-4 sm:px-6 py-3.5 shadow-[0_10px_30px_rgba(80,90,130,0.06)]">
          <div className="max-w-[1536px] mx-auto flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <Link
                href="/dashboard"
                title="Back to Dashboard"
                className="p-2.5 rounded-2xl bg-white hover:bg-[#EFF6FF] border border-blue-200/80 text-slate-700 transition-colors shadow-2xs cursor-pointer"
              >
                <ArrowLeft className="w-4 h-4 sm:w-5 sm:h-5 text-slate-700" />
              </Link>
              <div>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={resume.title}
                    onChange={(e) => handleTitleChange(e.target.value)}
                    className="font-bold text-slate-900 text-base sm:text-lg border-b border-transparent hover:border-slate-300 focus:border-[#2563EB] focus:outline-none bg-transparent px-1 py-0.5 transition-colors font-display"
                    aria-label="Resume Title"
                  />
                </div>
                <div className="flex items-center gap-2 text-xs font-medium text-slate-500 pl-1">
                  <span className="flex items-center gap-1">
                    <Check className="w-3.5 h-3.5 text-[#2563EB]" />
                    {savedStatus}
                  </span>
                </div>
              </div>
            </div>

            <div className="flex items-center flex-wrap gap-2.5 sm:gap-3">
              {/* Template Selector */}
              <div className="flex items-center bg-slate-100 border border-blue-200/80 p-1 rounded-2xl text-xs font-semibold shadow-2xs">
                {(["classic", "modern", "tech"] as ResumeTemplateId[]).map((tmpl) => (
                  <button
                    key={tmpl}
                    type="button"
                    onClick={() => handleTemplateChange(tmpl)}
                    className={`px-3 py-1.5 rounded-xl text-xs capitalize transition-all cursor-pointer ${
                      activeTemplate === tmpl
                        ? "bg-[#2563EB] text-white shadow-sm font-bold"
                        : "bg-transparent text-slate-600 hover:text-slate-900"
                    }`}
                  >
                    {tmpl}
                  </button>
                ))}
              </div>

              {/* Myra Smart Job Matcher Button */}
              <button
                type="button"
                onClick={() => setIsMyraJobModalOpen(true)}
                className="px-3.5 py-2 rounded-2xl bg-[#EFF6FF] hover:bg-[#E0E3FA] text-[#4338CA] border border-blue-200 font-bold text-xs shadow-2xs flex items-center gap-1.5 cursor-pointer transition-all"
              >
                <Briefcase className="w-3.5 h-3.5 text-[#2563EB]" />
                <span>Match Jobs</span>
              </button>

              {/* AI JD-Match Button */}
              <button
                type="button"
                onClick={() => setIsJDModalOpen(true)}
                className="px-3.5 py-2 rounded-2xl bg-white hover:bg-slate-50 border border-blue-200/80 text-slate-700 font-semibold text-xs flex items-center gap-1.5 cursor-pointer transition-all shadow-2xs"
              >
                <Sparkles className="w-3.5 h-3.5 text-[#2563EB]" />
                <span>JD Match</span>
              </button>

              {/* PDF Export Button */}
              <PdfExportButton
                resumeContent={resume.content}
                templateId={activeTemplate}
                fileName={`${(resume.content.contact.fullName || "Resume").replace(/\s+/g, "_")}_ATS_Resume`}
              />
            </div>
          </div>
        </header>

        {/* User Identity Greeting Context Sub-Bar */}
        <div className="border border-blue-100/80 bg-white rounded-3xl px-4 sm:px-6 lg:px-8 py-3.5 shadow-[0_10px_30px_rgba(80,90,130,0.06)]">
          <div className="max-w-[1536px] mx-auto flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="px-3 py-1 rounded-full text-xs font-semibold text-[#1E40AF] bg-[#EFF6FF] border border-blue-200/60 flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-600" />
                Single-Column ATS Template
              </span>
              <span className="px-3 py-1 rounded-full text-xs font-semibold text-slate-600 bg-slate-50 border border-blue-200/80">
                Synced with Profile
              </span>
              <UserGreeting
                context="resume"
                subtitle="Your contact details and projects sync with your profile."
                className="text-xs"
              />
            </div>
            <div className="flex items-center gap-2 text-xs font-semibold text-slate-500 shrink-0">
              <span className="w-2 h-2 rounded-full bg-[#EFF6FF]0" />
              <span>Resume Builder</span>
            </div>
          </div>
        </div>

        {/* Pre-fill Alert Banner for New Resumes */}
        {showPreFillBanner && (
          <div className="bg-[#EFF6FF] border border-blue-200 text-slate-800 rounded-3xl px-4 sm:px-6 lg:px-8 py-3.5 text-xs sm:text-sm flex items-center justify-between shadow-sm">
            <div className="flex items-center gap-2.5 max-w-5xl mx-auto flex-1">
              <Info className="w-4 h-4 sm:w-5 sm:h-5 text-[#2563EB] shrink-0" />
              <span className="text-slate-700">
                We&apos;ve pre-filled your contact info and starting skills from your profile — feel free to edit or add more.
              </span>
            </div>
            <button
              onClick={() => setShowPreFillBanner(false)}
              className="p-1 text-slate-400 hover:text-slate-700 cursor-pointer"
            >
              <X className="w-4 h-4 sm:w-5 sm:h-5" />
            </button>
          </div>
        )}

        {/* Mobile & Portrait Tablet Tab Toggle (< 1024px) */}
        <div className="lg:hidden sticky top-[61px] z-10 flex border-b border-blue-200/80 bg-white rounded-2xl overflow-hidden shadow-xs">
          <button
            onClick={() => setMobileTab("edit")}
            className={`flex-1 py-3 min-h-[44px] text-xs font-medium flex items-center justify-center gap-1.5 cursor-pointer transition-colors ${
              mobileTab === "edit"
                ? "border-b-2 border-[#2563EB] text-[#2563EB] bg-[#EFF6FF]/40 font-bold"
                : "text-slate-500 hover:text-slate-900"
            }`}
          >
            <FileEdit className="w-4 h-4" />
            <span>Edit sections</span>
          </button>
          <button
            onClick={() => setMobileTab("preview")}
            className={`flex-1 py-3 min-h-[44px] text-xs font-medium flex items-center justify-center gap-1.5 cursor-pointer transition-colors ${
              mobileTab === "preview"
                ? "border-b-2 border-[#2563EB] text-[#2563EB] bg-[#EFF6FF]/40 font-bold"
                : "text-slate-500 hover:text-slate-900"
            }`}
          >
            <Eye className="w-4 h-4" />
            <span>Live A4 preview</span>
          </button>
        </div>

        {/* Main Studio Grid */}
        <div className="max-w-[1536px] mx-auto w-full flex-1 p-2 sm:p-4 lg:p-6 grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-start">
          {/* Form Column */}
          <div className={`lg:col-span-6 w-full ${mobileTab === "preview" ? "hidden lg:block" : "block"}`}>
            <ResumeBuilderForm
              content={resume.content}
              onChange={handleContentChange}
            />
          </div>

          {/* Live Preview Column */}
          <div className={`lg:col-span-6 w-full lg:sticky lg:top-24 ${mobileTab === "edit" ? "hidden lg:block" : "block"}`}>
            <div className="bg-white p-4 sm:p-6 lg:p-8 rounded-3xl border border-blue-100/80 shadow-[0_10px_30px_rgba(80,90,130,0.06)] relative overflow-hidden">
              <div className="flex items-center justify-between mb-3 text-xs text-slate-500 px-1 font-medium">
                <span className="font-semibold text-slate-900">ATS Preview • {activeTemplate.charAt(0).toUpperCase() + activeTemplate.slice(1)}</span>
                <span className="px-2 py-0.5 rounded-full bg-slate-100 text-[10px] text-slate-600 border border-blue-200/80">Text Selectable</span>
              </div>
              <div className="shadow-2xl rounded-2xl overflow-hidden bg-white text-slate-900 border border-blue-100">
                <ResumePreview
                  content={resume.content}
                  templateId={activeTemplate}
                />
              </div>
            </div>
          </div>
        </div>

        {/* JD Match Modal */}
        <JDMatchModal
          isOpen={isJDModalOpen}
          onClose={() => setIsJDModalOpen(false)}
          resumeContent={resume.content}
          resumeId={resume.id}
          onAddKeyword={handleAddKeyword}
        />

        {/* Myra Smart Job Matcher Modal */}
        <MyraJobMatcherModal
          isOpen={isMyraJobModalOpen}
          onClose={() => setIsMyraJobModalOpen(false)}
          resumeSkills={[
            ...(resume.content.skills?.technical || []),
            ...(resume.content.skills?.tools || []),
            ...(resume.content.skills?.soft || [])
          ]}
          targetRole={resume.title || "Software Engineer"}
          targetSector={(user as any)?.targetSector || "AI & Software Engineering"}
        />
      </div>
    </AuthGuard>
  );
}
