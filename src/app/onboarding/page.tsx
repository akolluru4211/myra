"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { SkillLevel, UserInterest, CareerStage, UserDomainPriority, Resume, ResumeContent } from "@/lib/types";
import { DOMAIN_CATALOG } from "@/lib/services/career-learning-os";
import { 
  Check, 
  ArrowRight, 
  ArrowLeft, 
  ShieldCheck, 
  Target, 
  Sparkles, 
  Loader2, 
  AlertCircle, 
  User, 
  GraduationCap, 
  Briefcase, 
  Code2, 
  Github, 
  Linkedin, 
  Globe, 
  Building2, 
  Award, 
  CheckCircle2,
  Clock,
  Layers,
  Star,
  FileText
} from "lucide-react";
import EdworldLogo from "@/components/ui/EdworldLogo";
import { supabase } from "@/lib/supabase";
import CareerPathPicker from "@/components/career/CareerPathPicker";
import MyraOnboardingAssistantCard from "@/components/onboarding/MyraOnboardingAssistantCard";

interface DomainSelectionState {
  domainId: string;
  domainName: string;
  priority: UserDomainPriority;
  selfLevel: SkillLevel;
}

export default function OnboardingPage() {
  const router = useRouter();
  const { user, profile, updateUserProfile } = useAuth();

  const [currentStep, setCurrentStep] = useState(1);
  const totalSteps = 4;

  // Step 1: Basic Profile
  const [displayName, setDisplayName] = useState(profile?.name || user?.name || "");
  const [username, setUsername] = useState(profile?.username || "");
  const [usernameStatus, setUsernameStatus] = useState<"idle" | "checking" | "available" | "unavailable">("idle");
  const [usernameMessage, setUsernameMessage] = useState<string>("");
  const [headline, setHeadline] = useState(profile?.headline || "");
  const [bio, setBio] = useState(profile?.bio || "");
  const [phone, setPhone] = useState(profile?.phone || user?.phone || "");

  // Step 2: Education & Academic Specialization (Class 12th & Higher Education)
  const [institution, setInstitution] = useState(profile?.institution || "");
  const [degree, setDegree] = useState(profile?.degree || "B.Tech / B.E.");
  const [fieldOfStudy, setFieldOfStudy] = useState(profile?.field_of_study || "Computer Science & Engineering");
  const [graduationYear, setGraduationYear] = useState(profile?.graduation_year || "2026");
  const [cgpa, setCgpa] = useState((profile as any)?.cgpa ? String((profile as any).cgpa) : "8.5");
  const [targetRole, setTargetRole] = useState(profile?.targetRole || "Full Stack Developer");

  // Step 3: Multi-Domain & Career Path Selection
  const [careerPathIds, setCareerPathIds] = useState<string[]>(["swe_fullstack"]);
  const [primaryCareerPathId, setPrimaryCareerPathId] = useState<string>("swe_fullstack");

  const [selectedDomains, setSelectedDomains] = useState<Record<string, DomainSelectionState>>({
    swe: { domainId: "swe", domainName: "Software Engineering & Full Stack", priority: "primary", selfLevel: 1 },
    ai_ml: { domainId: "ai_ml", domainName: "Artificial Intelligence & Machine Learning", priority: "secondary", selfLevel: 1 },
    behavioral: { domainId: "behavioral", domainName: "Leadership & Behavioral Mastery", priority: "supporting", selfLevel: 0 },
  });

  const [targetTimeframe, setTargetTimeframe] = useState<number>(6);
  const [dailyHours, setDailyHours] = useState<number>(2);

  // Step 4: Goals & Links
  const [primaryGoal, setPrimaryGoal] = useState(
    profile?.primaryGoal || "Prepare for technical interviews and build a high-signal ATS resume."
  );
  const [githubUrl, setGithubUrl] = useState("");
  const [linkedinUrl, setLinkedinUrl] = useState("");
  const [portfolioUrl, setPortfolioUrl] = useState("");

  // Submission state
  const [saving, setSaving] = useState(false);
  const [isCompleted, setIsCompleted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [showMyraCopilot, setShowMyraCopilot] = useState(false);

  // Instant escape hatch to dashboard (marks onboarding done so AuthGuard won't intercept)
  const handleSkipToDashboard = async () => {
    try {
      if (typeof window !== "undefined") {
        const stored = JSON.parse(localStorage.getItem("edworld_user_profile") || "{}");
        localStorage.setItem(
          "edworld_user_profile",
          JSON.stringify({ 
            ...stored, 
            onboarding_completed: true,
            name: displayName || stored.name || "Student",
            targetRole: targetRole.trim() || stored.targetRole || "Software Engineer",
            degree: degree || stored.degree || "B.Tech / B.E."
          })
        );
        localStorage.setItem("edworld_study_hours", dailyHours.toString());
        localStorage.setItem("edworld_target_role", targetRole.trim() || "Software Engineer");
      }
      await updateUserProfile({ onboarding_completed: true });
    } catch (e) {
      console.warn("[Onboarding skip note]:", e);
    }
    router.push("/dashboard");
  };

  // Sync initial values from profile/user once loaded
  useEffect(() => {
    if (user?.name && !displayName) {
      setDisplayName(user.name);
    }
    if (user?.name && !username) {
      const suggested = user.name
        .toLowerCase()
        .replace(/[^a-z0-9]/g, "_")
        .slice(0, 18);
      setUsername(suggested || "student");
    }
    if (user?.phone && !phone) {
      setPhone(user.phone);
    }
  }, [user, profile]);

  // Debounced check for username availability
  useEffect(() => {
    const clean = username.trim().toLowerCase();
    if (!clean) {
      setUsernameStatus("idle");
      setUsernameMessage("");
      return;
    }

    if (clean.length < 3) {
      setUsernameStatus("unavailable");
      setUsernameMessage("Username must be at least 3 characters.");
      return;
    }

    const timer = setTimeout(async () => {
      setUsernameStatus("checking");
      try {
        const res = await fetch(
          `/api/profile/check-username?username=${encodeURIComponent(clean)}&userId=${user?.uid || ""}`
        );
        const data = await res.json();
        if (data.available) {
          setUsernameStatus("available");
          setUsernameMessage("✓ Username is available!");
        } else {
          setUsernameStatus("unavailable");
          setUsernameMessage(data.reason || "Username is not available.");
        }
      } catch (e) {
        setUsernameStatus("idle");
      }
    }, 400);

    return () => clearTimeout(timer);
  }, [username, user?.uid]);

  const toggleDomain = (domainId: string, domainName: string) => {
    setSelectedDomains((prev) => {
      const next = { ...prev };
      if (next[domainId]) {
        // Prevent deleting if it's the only one left
        if (Object.keys(next).length > 1) {
          delete next[domainId];
        }
      } else {
        const count = Object.keys(next).length;
        const priority: UserDomainPriority = count === 0 ? "primary" : count === 1 ? "secondary" : "supporting";
        next[domainId] = {
          domainId,
          domainName,
          priority,
          selfLevel: 1
        };
      }
      return next;
    });
  };

  const setDomainPriority = (domainId: string, priority: UserDomainPriority) => {
    setSelectedDomains((prev) => {
      if (!prev[domainId]) return prev;
      return {
        ...prev,
        [domainId]: { ...prev[domainId], priority }
      };
    });
  };

  const setDomainLevel = (domainId: string, selfLevel: SkillLevel) => {
    setSelectedDomains((prev) => {
      if (!prev[domainId]) return prev;
      return {
        ...prev,
        [domainId]: { ...prev[domainId], selfLevel }
      };
    });
  };

  const handleNext = () => {
    setError(null);
    const newErrors: Record<string, string> = {};

    if (currentStep === 1) {
      if (!displayName.trim()) {
        newErrors.displayName = "Please enter your full name to proceed.";
      }
      const cleanUsername = username.trim().toLowerCase();
      if (!cleanUsername) {
        newErrors.username = "Please choose a username for your public portfolio.";
      } else if (cleanUsername.length < 3 || cleanUsername.length > 24) {
        newErrors.username = "Username must be between 3 and 24 characters.";
      } else if (!/^[a-z0-9][a-z0-9_-]*[a-z0-9]$/.test(cleanUsername) && cleanUsername.length > 1) {
        newErrors.username = "Only lowercase letters, numbers, hyphens, and underscores are allowed.";
      } else if (usernameStatus === "unavailable") {
        newErrors.username = usernameMessage || "This username is not available. Please choose another.";
      }

      if (Object.keys(newErrors).length > 0) {
        setFieldErrors(newErrors);
        setError("Please correct the errors in Step 1 before continuing.");
        return;
      }
    } else if (currentStep === 2) {
      if (!institution.trim()) {
        newErrors.institution = "Please enter your school, college, or university name.";
      }
      if (!fieldOfStudy.trim()) {
        newErrors.fieldOfStudy = "Please enter your branch or stream of study.";
      }
      if (Object.keys(newErrors).length > 0) {
        setFieldErrors(newErrors);
        setError("Please complete the required education fields highlighted below.");
        return;
      }
    } else if (currentStep === 3) {
      if (careerPathIds.length === 0) {
        setError("Please select at least 1 career path or click 'Exploring / Not Sure Yet'.");
        return;
      }
      if (!primaryCareerPathId || !careerPathIds.includes(primaryCareerPathId)) {
        setError("Please designate your primary career focus before continuing.");
        return;
      }
    }
    
    setFieldErrors({});
    if (currentStep < totalSteps) {
      setCurrentStep((prev) => prev + 1);
    } else {
      handleFinalSubmit();
    }
  };

  const handleBack = () => {
    setError(null);
    if (currentStep > 1) {
      setCurrentStep((prev) => prev - 1);
    }
  };

  const handleFinalSubmit = async () => {
    setSaving(true);
    setError(null);
    try {
      const careerStage: CareerStage = "STUDENT";

      const interestsArray: UserInterest[] = Object.values(selectedDomains).map((d) => ({
        id: d.domainId,
        name: d.domainName,
        category: d.domainName,
        selfLevel: d.selfLevel,
        effectiveLevel: d.selfLevel,
      }));

      const profilePayload = {
        name: displayName.trim(),
        username: username.trim() || undefined,
        headline: headline.trim() || `${degree} in ${fieldOfStudy} | Aspiring ${targetRole}`,
        bio: bio.trim() || undefined,
        phone: phone.trim() || undefined,
        careerStage,
        institution: institution.trim(),
        degree,
        field_of_study: fieldOfStudy.trim(),
        graduation_year: graduationYear,
        cgpa: cgpa.trim() || undefined,
        targetRole: targetRole.trim() || "Full Stack Software Engineer",
        primaryGoal: primaryGoal.trim(),
        interests: interestsArray,
        onboarding_completed: true,
        github_url: githubUrl.trim() || undefined,
        linkedin_url: linkedinUrl.trim() || undefined,
      };

      try {
        await updateUserProfile(profilePayload);
      } catch (profileErr: any) {
        console.warn("[Onboarding profile update note]:", profileErr);
      }

      // Always save to localStorage immediately to unblock client-side AuthGuard and hydrate dashboard
      if (typeof window !== "undefined") {
        const stored = JSON.parse(localStorage.getItem("edworld_user_profile") || "{}");
        localStorage.setItem(
          "edworld_user_profile",
          JSON.stringify({ ...stored, ...profilePayload, onboarding_completed: true })
        );
        localStorage.setItem("edworld_study_hours", dailyHours.toString());
        localStorage.setItem("edworld_target_role", targetRole.trim() || "Software Engineer");
        if (primaryCareerPathId) {
          localStorage.setItem("edworld_primary_career_path", primaryCareerPathId);
        }
      }

      // Save to Career Learning OS API & Career Paths API
      if (user?.uid) {
        try {
          await fetch("/api/user/career-paths", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              userId: user.uid,
              selectedPathIds: careerPathIds,
              primaryPathId: primaryCareerPathId,
            }),
          });
        } catch (cpErr) {
          console.warn("Failed to save career paths:", cpErr);
        }

        const domainItems = Object.values(selectedDomains).map(d => ({
          domain_id: d.domainId,
          domain_name: d.domainName,
          priority: d.priority,
          self_level: d.selfLevel,
          effective_level: d.selfLevel
        }));

        try {
          await fetch("/api/career-os", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              userId: user.uid,
              targetRole: targetRole.trim() || "Full Stack Software Engineer",
              targetIndustry: "Technology & High Growth Startups",
              timeframeMonths: targetTimeframe,
              availableHoursPerDay: dailyHours,
              preferredScheduleBlocks: ["morning", "evening"],
              domains: domainItems,
              regenerateRoadmap: true
            })
          });
        } catch (cosErr) {
          console.warn("Failed to generate career OS roadmap:", cosErr);
        }

        // Auto-generate student's Harvard ATS master resume directly from onboarding
        const skillsList = Object.values(selectedDomains).map((d) => d.domainName);
        const technicalSkills = Array.from(
          new Set([
            ...skillsList,
            fieldOfStudy.includes("Computer") ? "Data Structures & Algorithms" : fieldOfStudy,
            "Git & GitHub",
            "System Architecture"
          ])
        );

        const initialResumeContent: ResumeContent = {
          contact: {
            fullName: displayName.trim(),
            email: user?.email || "",
            phone: phone.trim() || "+91 98765 43210",
            location: "India",
            linkedin: linkedinUrl.trim() || undefined,
            github: githubUrl.trim() || undefined,
            portfolio: portfolioUrl.trim() || undefined,
          },
          summary: `Motivated and analytical ${targetRole.trim()} with strong competencies in ${technicalSkills.slice(0, 3).join(", ")}. Pursuing ${degree} in ${fieldOfStudy.trim()} at ${institution.trim()} (CGPA: ${cgpa || "8.5"}, Class of ${graduationYear}). Focused on building robust, high-performance software systems and mastering technical interviews.`,
          experience: [],
          education: [
            {
              id: "edu-1",
              school: institution.trim() || "University Institute of Technology",
              degree: degree || "B.Tech / B.E.",
              fieldOfStudy: fieldOfStudy.trim() || "Computer Science",
              graduationDate: graduationYear || "2026",
              gpa: cgpa.trim() || "8.5",
              coursework: [
                "Data Structures & Algorithms",
                "Database Management Systems",
                "Operating Systems",
                "Computer Networks"
              ]
            }
          ],
          skills: {
            technical: technicalSkills,
            soft: ["STAR Communication", "Structured Problem Solving", "Peer Collaboration", "Analytical Thinking"],
            tools: ["VS Code", "Git", "GitHub", "Postman", "Linux"]
          },
          projects: [
            {
              id: "proj-1",
              title: `${targetRole.trim()} Verified Capstone`,
              description: `Engineered an end-to-end full-stack application implementing modular API routing, database schema modeling, and responsive interface workflows.`,
              technologies: technicalSkills.slice(0, 4),
              bullets: [
                `Architected clean, decoupled application services using ${technicalSkills[0] || "TypeScript"} and industry-standard design principles.`,
                `Optimized client-side rendering latency and state persistence across active session modules.`,
                `Implemented robust error boundary handling and automated integration verification.`
              ]
            }
          ],
          certifications: []
        };

        const initialResume: Resume = {
          id: `resume-${user.uid}-master`,
          userId: user.uid,
          title: "ATS Master Resume",
          templateId: "classic",
          content: initialResumeContent,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };

        if (typeof window !== "undefined") {
          try {
            localStorage.setItem(`edworld_${user.uid}_resumes`, JSON.stringify([initialResume]));
            localStorage.setItem("edworld_resumes", JSON.stringify([initialResume]));
          } catch (storageErr) {
            console.warn("[Local storage resume cache note]:", storageErr);
          }
        }

        try {
          await supabase.from("resumes").upsert({
            id: initialResume.id,
            user_id: user.uid,
            title: initialResume.title,
            template_id: initialResume.templateId,
            content: initialResume.content,
            updated_at: new Date().toISOString(),
          });
        } catch (supabaseResumeErr) {
          console.warn("[Supabase resume upsert note]:", supabaseResumeErr);
        }
      }

      setIsCompleted(true);
      setTimeout(() => {
        router.push("/dashboard");
      }, 1200);
    } catch (err: any) {
      console.error("[Onboarding submission error]:", err);
      setError(
        err?.message || 
        "A connection issue occurred while syncing with the server. Your information has been cached locally so you won't lose progress. You can retry or skip to your dashboard."
      );
    } finally {
      setSaving(false);
    }
  };

  const progressPercentage = Math.round((currentStep / totalSteps) * 100);

  return (
    <div className="min-h-screen py-8 sm:py-12 px-4 sm:px-6 lg:px-8 font-sans selection:bg-white selection:text-slate-950 flex flex-col justify-center bg-white text-black">
      <div className={`${currentStep === 3 ? "max-w-4xl" : "max-w-2xl"} mx-auto w-full space-y-6 transition-all duration-200`}>
        
        {/* Top Branding & Progress Tracker */}
        <div className="text-center space-y-3">
          <div className="inline-block transition-transform hover:scale-105 active:scale-95">
            <EdworldLogo />
          </div>

          <div className="flex items-center justify-between gap-3">
            <div className="flex-1" />
            <h1 className="text-2xl sm:text-3xl font-black text-black font-display tracking-tight text-center">
              Welcome to EdWorld Student Setup
            </h1>
            <div className="flex-1 text-right">
              <button
                type="button"
                onClick={handleSkipToDashboard}
                className="text-xs font-semibold text-slate-600 hover:text-black underline transition-colors cursor-pointer"
                title="Skip onboarding and go directly to your student dashboard"
              >
                Skip to Dashboard →
              </button>
            </div>
          </div>

          <p className="text-xs sm:text-sm text-slate-700 max-w-lg mx-auto">
            Configure your personalized Career Learning OS &amp; auto-generate your Harvard ATS resume in 4 quick steps.
          </p>

          <div className="pt-1 flex items-center justify-center">
            <button
              type="button"
              onClick={() => setShowMyraCopilot(!showMyraCopilot)}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#0F1422] border border-blue-200 text-black text-xs font-bold hover:bg-[#DBEAFE] transition-all shadow-md cursor-pointer hover:scale-105 active:scale-95"
            >
              <Sparkles className="w-3.5 h-3.5 text-black animate-pulse" />
              <span>{showMyraCopilot ? "Hide Myra Onboarding Copilot" : "Need guidance? Ask Myra Copilot 🐻"}</span>
            </button>
          </div>
        </div>

        {/* Myra Onboarding Assistant Card */}
        {showMyraCopilot && (
          <div className="animate-in fade-in slide-in-from-top-3 duration-200">
            <MyraOnboardingAssistantCard studentName={displayName} />
          </div>
        )}

        {/* Progress Bar Card */}
        <div className="tactile-chassis bg-[#0C101A] border border-blue-200 rounded-2xl p-4 sm:p-5 shadow-sm space-y-3 text-black">
          <div className="flex items-center justify-between text-xs font-bold">
            <span className="text-black font-display">
              {currentStep === 1 && "Step 1: Personal Identity & Contact"}
              {currentStep === 2 && "Step 2: Academic Specialization & College"}
              {currentStep === 3 && "Step 3: Target Role & Skill Calibration"}
              {currentStep === 4 && "Step 4: Profiles, Links & Resume Seeding"}
            </span>
            <span className="text-slate-600 font-mono">Step {currentStep} of {totalSteps} ({progressPercentage}%)</span>
          </div>
          <div className="w-full bg-[#DBEAFE] h-2 rounded-full overflow-hidden p-0.5 border border-blue-200">
            <div 
              className="h-full bg-white rounded-full transition-all duration-500 ease-out" 
              style={{ width: `${progressPercentage}%` }}
            />
          </div>

          {/* Segmented Step Pills */}
          <div className="grid grid-cols-4 gap-2 pt-1 text-[11px] font-semibold text-center">
            {[
              { num: 1, label: "Profile" },
              { num: 2, label: "Academics" },
              { num: 3, label: "Skills & Role" },
              { num: 4, label: "Resume Seed" },
            ].map((s) => (
              <div
                key={s.num}
                className={`py-1.5 rounded-lg transition-all ${
                  currentStep === s.num
                    ? "bg-white text-slate-950 font-bold shadow-xs"
                    : currentStep > s.num
                    ? "bg-[#DBEAFE] text-black border border-blue-300"
                    : "bg-[#EFF6FF] text-slate-600 border border-white/5"
                }`}
              >
                <span>{s.num}. {s.label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Completed Splash Card */}
        {isCompleted ? (
          <div className="tactile-chassis bg-[#0C101A] border border-blue-200 rounded-3xl p-8 shadow-2xl text-center space-y-5 animate-in fade-in zoom-in-95 text-black">
            <div className="w-16 h-16 rounded-2xl bg-[#DBEAFE] border border-blue-300 text-black mx-auto flex items-center justify-center shadow-md animate-bounce">
              <CheckCircle2 className="w-8 h-8 text-black" />
            </div>
            <div className="space-y-2">
              <h2 className="text-2xl font-black text-black font-display">Career Learning OS &amp; ATS Resume Ready!</h2>
              <p className="text-xs sm:text-sm text-slate-700 max-w-md mx-auto leading-relaxed">
                We&apos;ve synthesized your personalized multi-domain track, generated your timetable, and <strong>pre-seeded your single-column Harvard ATS Resume</strong>.
              </p>
            </div>
            <div className="p-3.5 rounded-xl bg-[#0F1422] border border-blue-200 max-w-sm mx-auto text-xs text-black font-semibold flex items-center justify-center gap-2">
              <Check className="w-4 h-4 text-black shrink-0" />
              <span>Harvard ATS Resume auto-created and saved</span>
            </div>
            <div className="flex items-center justify-center gap-2 text-xs font-bold text-black pt-2">
              <Loader2 className="w-4 h-4 animate-spin text-black" />
              <span>Redirecting to your dashboard...</span>
            </div>
          </div>
        ) : (
          /* Form Step Container */
          <div className="tactile-chassis bg-[#0C101A] border border-blue-200 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6 text-black">
            
            {/* Top Global Alert Banner if errors exist */}
            {error && (
              <div className="p-4 rounded-xl bg-rose-950/60 border border-rose-500/40 flex items-start gap-3 text-xs text-rose-200 font-medium animate-in fade-in">
                <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            {/* ================= STEP 1: BASIC PROFILE ================= */}
            {currentStep === 1 && (
              <div className="space-y-4 animate-in fade-in">
                <div className="space-y-1">
                  <h2 className="text-lg font-bold text-black font-display flex items-center gap-2">
                    <User className="w-5 h-5 text-black" />
                    <span>Personal Profile Details</span>
                  </h2>
                  <p className="text-xs text-slate-700">
                    Your display identity on the EdWorld student networking feed, resume header, and career leaderboards.
                  </p>
                </div>

                <div className="space-y-4 pt-2">
                  <div>
                    <label className="block text-xs font-medium text-slate-200 uppercase tracking-wider mb-1.5">
                      Full Name *
                    </label>
                    <input
                      type="text"
                      value={displayName}
                      onChange={(e) => {
                        setDisplayName(e.target.value);
                        if (fieldErrors.displayName) {
                          setFieldErrors((prev) => {
                            const next = { ...prev };
                            delete next.displayName;
                            return next;
                          });
                        }
                      }}
                      placeholder="e.g. Adarsh Sharma"
                      className={`w-full px-4 py-2.5 sm:py-3 rounded-xl bg-[#0F1422] border text-xs sm:text-sm text-black placeholder:text-slate-500 focus:outline-none transition-all ${
                        fieldErrors.displayName
                          ? "border-rose-500 ring-1 ring-rose-500/30"
                          : "border-blue-200 focus:border-white/40 focus:ring-1 focus:ring-white/20"
                      }`}
                    />
                    {fieldErrors.displayName && (
                      <p className="text-xs text-rose-400 mt-1.5 flex items-center gap-1.5 font-medium">
                        <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                        <span>{fieldErrors.displayName}</span>
                      </p>
                    )}
                  </div>

                  {/* Portfolio Username Input */}
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <label className="block text-xs font-medium text-slate-200 uppercase tracking-wider">
                        Choose Your Portfolio Username *
                      </label>
                      <span className="text-[10px] text-slate-600 font-mono">
                        lowercase &bull; letters &amp; numbers
                      </span>
                    </div>

                    <div className="relative flex items-center">
                      <span className="absolute left-3.5 text-xs text-slate-600 font-mono select-none pointer-events-none">
                        edworld.co.in/
                      </span>
                      <input
                        type="text"
                        value={username}
                        onChange={(e) => {
                          const val = e.target.value.toLowerCase().replace(/[^a-z0-9_-]/g, "");
                          setUsername(val);
                          if (fieldErrors.username) {
                            setFieldErrors((prev) => {
                              const next = { ...prev };
                              delete next.username;
                              return next;
                            });
                          }
                        }}
                        placeholder="yourname"
                        maxLength={24}
                        className={`w-full pl-[106px] pr-10 py-2.5 sm:py-3 rounded-xl bg-[#0F1422] border text-xs sm:text-sm text-black font-mono placeholder:text-slate-600 focus:outline-none transition-all ${
                          fieldErrors.username || usernameStatus === "unavailable"
                            ? "border-rose-500 ring-1 ring-rose-500/30"
                            : usernameStatus === "available"
                            ? "border-emerald-500/50 ring-1 ring-emerald-500/20"
                            : "border-blue-200 focus:border-white/40 focus:ring-1 focus:ring-white/20"
                        }`}
                      />
                      <div className="absolute right-3 flex items-center">
                        {usernameStatus === "checking" && (
                          <Loader2 className="w-4 h-4 text-slate-600 animate-spin" />
                        )}
                        {usernameStatus === "available" && (
                          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                        )}
                        {(fieldErrors.username || usernameStatus === "unavailable") && (
                          <AlertCircle className="w-4 h-4 text-rose-400" />
                        )}
                      </div>
                    </div>

                    {/* Status Feedback / Helper */}
                    {fieldErrors.username ? (
                      <p className="text-xs text-rose-400 mt-1.5 flex items-center gap-1.5 font-medium">
                        <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                        <span>{fieldErrors.username}</span>
                      </p>
                    ) : usernameMessage ? (
                      <p
                        className={`text-[11px] mt-1.5 flex items-center gap-1.5 font-medium ${
                          usernameStatus === "available"
                            ? "text-emerald-400"
                            : usernameStatus === "unavailable"
                            ? "text-rose-400"
                            : "text-slate-600"
                        }`}
                      >
                        {usernameMessage}
                      </p>
                    ) : null}

                    {/* Live Portfolio Link Preview Card */}
                    {username && usernameStatus !== "unavailable" && (
                      <div className="mt-2.5 p-2.5 rounded-xl bg-gradient-to-r from-indigo-500/10 via-purple-500/10 to-cyan-500/10 border border-indigo-500/20 flex items-center justify-between text-xs">
                        <span className="text-[11px] text-slate-700 flex items-center gap-1.5">
                          <Sparkles className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                          <span>Public Portfolio URL:</span>
                        </span>
                        <span className="font-mono text-[11px] font-bold text-cyan-300">
                          edworld.co.in/{username}
                        </span>
                      </div>
                    )}
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-200 uppercase tracking-wider mb-1.5">
                      Phone Number (For Recruiter Verification &amp; Resume)
                    </label>
                    <input
                      type="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="+91 9876543210"
                      className="w-full px-4 py-2.5 sm:py-3 rounded-xl bg-[#0F1422] border border-blue-200 text-xs sm:text-sm text-black placeholder:text-slate-500 focus:outline-none focus:border-white/40 focus:ring-1 focus:ring-white/20 transition-all"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-200 uppercase tracking-wider mb-1.5">
                      Professional Headline
                    </label>
                    <input
                      type="text"
                      value={headline}
                      onChange={(e) => setHeadline(e.target.value)}
                      placeholder="e.g. Aspiring Full Stack Developer | Class of 2026"
                      className="w-full px-4 py-2.5 sm:py-3 rounded-xl bg-[#0F1422] border border-blue-200 text-xs sm:text-sm text-black placeholder:text-slate-500 focus:outline-none focus:border-white/40 focus:ring-1 focus:ring-white/20 transition-all"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-200 uppercase tracking-wider mb-1.5">
                      Brief Bio
                    </label>
                    <textarea
                      rows={3}
                      value={bio}
                      onChange={(e) => setBio(e.target.value)}
                      placeholder="Share a short summary of your background, passions, and career interests..."
                      className="w-full px-4 py-2.5 sm:py-3 rounded-xl bg-[#0F1422] border border-blue-200 text-xs sm:text-sm text-black placeholder:text-slate-500 focus:outline-none focus:border-white/40 focus:ring-1 focus:ring-white/20 transition-all"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* ================= STEP 2: EDUCATION & ACADEMIC SPECIALIZATION ================= */}
            {currentStep === 2 && (
              <div className="space-y-4 animate-in fade-in">
                <div className="space-y-1">
                  <h2 className="text-lg font-bold text-black font-display flex items-center gap-2">
                    <GraduationCap className="w-5 h-5 text-black" />
                    <span>Education &amp; Academic Specialization</span>
                  </h2>
                  <p className="text-xs text-slate-700">
                    Your college, branch, and CGPA will be automatically formatted into the Education section of your Harvard ATS Resume.
                  </p>
                </div>

                <div className="space-y-4 pt-2">
                  <div>
                    <label className="block text-xs font-medium text-slate-200 uppercase tracking-wider mb-1.5">
                      School / College / University Name *
                    </label>
                    <input
                      type="text"
                      value={institution}
                      onChange={(e) => {
                        setInstitution(e.target.value);
                        if (fieldErrors.institution) {
                          setFieldErrors((prev) => {
                            const next = { ...prev };
                            delete next.institution;
                            return next;
                          });
                        }
                      }}
                      placeholder="e.g. National Institute of Technology / Delhi Technological University"
                      className={`w-full px-4 py-2.5 sm:py-3 rounded-xl bg-[#0F1422] border text-xs sm:text-sm text-black placeholder:text-slate-500 focus:outline-none transition-all ${
                        fieldErrors.institution
                          ? "border-rose-500 ring-1 ring-rose-500/30"
                          : "border-blue-200 focus:border-white/40 focus:ring-1 focus:ring-white/20"
                      }`}
                    />
                    {fieldErrors.institution && (
                      <p className="text-xs text-rose-400 mt-1.5 flex items-center gap-1.5 font-medium">
                        <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                        <span>{fieldErrors.institution}</span>
                      </p>
                    )}
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                    <div>
                      <label className="block text-xs font-medium text-slate-200 uppercase tracking-wider mb-1.5">
                        Degree Program
                      </label>
                      <select
                        value={degree}
                        onChange={(e) => setDegree(e.target.value)}
                        className="w-full px-4 py-2.5 sm:py-3 rounded-xl bg-[#0F1422] border border-blue-200 text-xs sm:text-sm text-black focus:outline-none focus:border-white/40 focus:ring-1 focus:ring-white/20 transition-all [&>option]:bg-[#0C101A] [&>option]:text-black cursor-pointer"
                      >
                        <option value="B.Tech / B.E.">B.Tech / B.E.</option>
                        <option value="B.Sc / BCA">B.Sc / BCA</option>
                        <option value="M.Tech / M.E.">M.Tech / M.E.</option>
                        <option value="MCA / M.Sc">MCA / M.Sc</option>
                        <option value="MBA / Business">MBA / Business</option>
                        <option value="High School (11th/12th)">High School (11th/12th)</option>
                        <option value="Other">Other Degree</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-slate-200 uppercase tracking-wider mb-1.5">
                        Graduation Year
                      </label>
                      <select
                        value={graduationYear}
                        onChange={(e) => setGraduationYear(e.target.value)}
                        className="w-full px-4 py-2.5 sm:py-3 rounded-xl bg-[#0F1422] border border-blue-200 text-xs sm:text-sm text-black focus:outline-none focus:border-white/40 focus:ring-1 focus:ring-white/20 transition-all [&>option]:bg-[#0C101A] [&>option]:text-black cursor-pointer"
                      >
                        <option value="2025">2025 (Final Year / Graduating)</option>
                        <option value="2026">2026</option>
                        <option value="2027">2027</option>
                        <option value="2028">2028</option>
                        <option value="Graduated">Graduated (Alumni / Working)</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                    <div>
                      <label className="block text-xs font-medium text-slate-200 uppercase tracking-wider mb-1.5">
                        Field of Study / Branch *
                      </label>
                      <input
                        type="text"
                        value={fieldOfStudy}
                        onChange={(e) => {
                          setFieldOfStudy(e.target.value);
                          if (fieldErrors.fieldOfStudy) {
                            setFieldErrors((prev) => {
                              const next = { ...prev };
                              delete next.fieldOfStudy;
                              return next;
                            });
                          }
                        }}
                        placeholder="e.g. Computer Science, AI & ML, Electronics, IT"
                        className={`w-full px-4 py-2.5 sm:py-3 rounded-xl bg-[#0F1422] border text-xs sm:text-sm text-black placeholder:text-slate-500 focus:outline-none transition-all ${
                          fieldErrors.fieldOfStudy
                            ? "border-rose-500 ring-1 ring-rose-500/30"
                            : "border-blue-200 focus:border-white/40 focus:ring-1 focus:ring-white/20"
                        }`}
                      />
                      {fieldErrors.fieldOfStudy && (
                        <p className="text-xs text-rose-400 mt-1.5 flex items-center gap-1.5 font-medium">
                          <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                          <span>{fieldErrors.fieldOfStudy}</span>
                        </p>
                      )}
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-slate-200 uppercase tracking-wider mb-1.5">
                        Target Tech Role / Dream Job
                      </label>
                      <input
                        type="text"
                        value={targetRole}
                        onChange={(e) => setTargetRole(e.target.value)}
                        placeholder="e.g. Full Stack Developer, SDE-1, AI Engineer"
                        className="w-full px-4 py-2.5 sm:py-3 rounded-xl bg-[#0F1422] border border-blue-200 text-xs sm:text-sm text-black placeholder:text-slate-500 focus:outline-none focus:border-white/40 focus:ring-1 focus:ring-white/20 transition-all"
                      />
                    </div>
                  </div>

                  <div className="p-4 rounded-2xl bg-[#0F1422] border border-blue-200 space-y-2">
                    <div className="flex items-center justify-between">
                      <label className="block text-xs font-medium text-slate-200 uppercase tracking-wider">
                        Current CGPA / Percentage
                      </label>
                      <span className="text-[10.5px] font-bold text-black bg-[#DBEAFE] px-2.5 py-0.5 rounded-full border border-blue-200">
                        Placement Benchmark Grounding
                      </span>
                    </div>
                    <input
                      type="text"
                      value={cgpa}
                      onChange={(e) => setCgpa(e.target.value)}
                      placeholder="e.g. 8.4 CGPA or 85%"
                      className="w-full px-4 py-2.5 sm:py-3 rounded-xl bg-[#0C101A] border border-blue-200 text-xs sm:text-sm font-bold text-black focus:outline-none focus:border-white/40 focus:ring-1 focus:ring-white/20 transition-all"
                    />
                    <p className="text-[11px] text-slate-600 leading-relaxed">
                      Myra AI benchmarks your academic metrics against placement cutoffs (Tier-1 product companies vs high-growth startups) and structures your resume education bullets.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* ================= STEP 3: CAREER PATH SELECTION ================= */}
            {currentStep === 3 && (
              <div className="space-y-6 animate-in fade-in">
                <CareerPathPicker
                  mode="onboarding"
                  userId={user?.uid}
                  initialSelectedIds={careerPathIds}
                  initialPrimaryId={primaryCareerPathId}
                  onChange={(selected, primary) => {
                    setCareerPathIds(selected);
                    setPrimaryCareerPathId(primary);
                  }}
                />

                {/* Target Timeframe & Daily Hours */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-5 border-t border-blue-200">
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                      <Target className="w-3.5 h-3.5 text-black" />
                      <span>Target Timeframe</span>
                    </label>
                    <select
                      value={targetTimeframe}
                      onChange={(e) => setTargetTimeframe(Number(e.target.value))}
                      className="w-full px-4 py-2.5 sm:py-3 rounded-xl bg-[#0F1422] border border-blue-200 text-xs sm:text-sm font-bold text-black focus:outline-none focus:border-white/40 focus:ring-1 focus:ring-white/20 transition-all [&>option]:bg-[#0C101A] [&>option]:text-black cursor-pointer"
                    >
                      <option value={3}>3 Months (Fast-Track Placement)</option>
                      <option value={6}>6 Months (Standard Comprehensive)</option>
                      <option value={12}>12 Months (Deep Mastery Track)</option>
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[11px] font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5 text-black" />
                      <span>Daily Available Hours</span>
                    </label>
                    <select
                      value={dailyHours}
                      onChange={(e) => setDailyHours(Number(e.target.value))}
                      className="w-full px-4 py-2.5 sm:py-3 rounded-xl bg-[#0F1422] border border-blue-200 text-xs sm:text-sm font-bold text-black focus:outline-none focus:border-white/40 focus:ring-1 focus:ring-white/20 transition-all [&>option]:bg-[#0C101A] [&>option]:text-black cursor-pointer"
                    >
                      <option value={1}>1 Hour / day (Light Pace)</option>
                      <option value={2}>2 Hours / day (Recommended)</option>
                      <option value={3}>3 Hours / day (Accelerated)</option>
                      <option value={4}>4+ Hours / day (Intensive Boot Camp)</option>
                    </select>
                  </div>
                </div>
              </div>
            )}

            {/* ================= STEP 4: GOALS, LINKS & RESUME PREVIEW ================= */}
            {currentStep === 4 && (
              <div className="space-y-6 animate-in fade-in">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-lg bg-[#DBEAFE] text-black flex items-center justify-center font-bold text-xs">
                      <FileText className="w-4 h-4" />
                    </div>
                    <h2 className="text-base sm:text-lg font-bold text-black font-display tracking-tight">
                      Zero-Waste Resume &amp; Social Links
                    </h2>
                  </div>
                  <p className="text-xs sm:text-sm text-slate-700">
                    Your details will instantly generate a ready-to-use ATS Harvard Resume in your Studio.
                  </p>
                </div>

                {/* ATS Resume Instant Seeding Feature Highlight */}
                <div className="p-4 sm:p-5 rounded-2xl bg-[#0F1422] border border-blue-200 space-y-2 text-black">
                  <div className="flex items-center gap-2 text-black font-bold text-xs uppercase tracking-wider">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    <span>Instant ATS Resume Seeding Active</span>
                  </div>
                  <p className="text-xs text-slate-700 leading-relaxed font-normal">
                    EdWorld values your time. Instead of making you fill in forms twice, completing this step automatically generates your single-column Harvard ATS resume seeded with:
                  </p>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1 text-[11px] font-medium text-slate-200">
                    <div className="p-2 rounded-xl bg-[#0C101A] border border-blue-200 text-center">✓ {displayName || "Name"}</div>
                    <div className="p-2 rounded-xl bg-[#0C101A] border border-blue-200 text-center truncate">✓ {degree || "Degree"}</div>
                    <div className="p-2 rounded-xl bg-[#0C101A] border border-blue-200 text-center truncate">✓ {targetRole || "Role Focus"}</div>
                    <div className="p-2 rounded-xl bg-[#0C101A] border border-blue-200 text-center">✓ Verified Links</div>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-bold text-slate-700 uppercase tracking-wider">
                      Primary Placement Goal
                    </label>
                    <textarea
                      rows={2}
                      value={primaryGoal}
                      onChange={(e) => setPrimaryGoal(e.target.value)}
                      placeholder="e.g. Crack a Product Software Engineering or Data Science role with 90%+ ATS resume score."
                      className="w-full px-4 py-2.5 sm:py-3 rounded-xl bg-[#0F1422] border border-blue-200 text-xs sm:text-sm font-medium text-black placeholder:text-slate-500 focus:outline-none focus:border-white/40 focus:ring-1 focus:ring-white/20 transition-all"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-[11px] font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                        <Github className="w-3.5 h-3.5 text-black" />
                        <span>GitHub Profile URL (Optional)</span>
                      </label>
                      <input
                        type="url"
                        value={githubUrl}
                        onChange={(e) => setGithubUrl(e.target.value)}
                        placeholder="https://github.com/username"
                        className="w-full px-4 py-2.5 sm:py-3 rounded-xl bg-[#0F1422] border border-blue-200 text-xs sm:text-sm text-black placeholder:text-slate-500 focus:outline-none focus:border-white/40 focus:ring-1 focus:ring-white/20 transition-all"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-[11px] font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                        <Linkedin className="w-3.5 h-3.5 text-black" />
                        <span>LinkedIn Profile URL (Optional)</span>
                      </label>
                      <input
                        type="url"
                        value={linkedinUrl}
                        onChange={(e) => setLinkedinUrl(e.target.value)}
                        placeholder="https://linkedin.com/in/username"
                        className="w-full px-4 py-2.5 sm:py-3 rounded-xl bg-[#0F1422] border border-blue-200 text-xs sm:text-sm text-black placeholder:text-slate-500 focus:outline-none focus:border-white/40 focus:ring-1 focus:ring-white/20 transition-all"
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[11px] font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                      <Globe className="w-3.5 h-3.5 text-black" />
                      <span>Portfolio or LeetCode URL (Optional)</span>
                    </label>
                    <input
                      type="url"
                      value={portfolioUrl}
                      onChange={(e) => setPortfolioUrl(e.target.value)}
                      placeholder="https://myportfolio.dev or https://leetcode.com/u/username"
                      className="w-full px-4 py-2.5 sm:py-3 rounded-xl bg-[#0F1422] border border-blue-200 text-xs sm:text-sm text-black placeholder:text-slate-500 focus:outline-none focus:border-white/40 focus:ring-1 focus:ring-white/20 transition-all"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Bottom Error Notification & Escape Hatch */}
            {error && (
              <div className="p-4 rounded-xl bg-rose-950/60 border border-rose-500/40 flex items-start justify-between gap-3 text-xs text-rose-200 font-medium">
                <div className="flex items-start gap-2.5">
                  <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                  <span>{error}</span>
                </div>
                <button
                  type="button"
                  onClick={handleSkipToDashboard}
                  className="text-xs font-bold text-black underline hover:text-slate-200 shrink-0 cursor-pointer"
                >
                  Skip to Dashboard
                </button>
              </div>
            )}

            {/* Navigation Action Buttons */}
            <div className="pt-4 border-t border-blue-200 flex items-center justify-between gap-3">
              {currentStep > 1 ? (
                <button
                  type="button"
                  onClick={handleBack}
                  disabled={saving}
                  className="px-4 sm:px-5 py-2.5 sm:py-3 rounded-xl bg-[#0F1422] hover:bg-[#DBEAFE] text-xs font-bold text-slate-200 border border-blue-200 transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  <ArrowLeft className="w-4 h-4" />
                  <span>Back</span>
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleSkipToDashboard}
                  className="text-xs text-slate-600 hover:text-black underline cursor-pointer font-medium"
                >
                  Skip setup for now
                </button>
              )}

              <div className="flex items-center gap-3 ml-auto">
                {currentStep > 1 && (
                  <button
                    type="button"
                    onClick={handleSkipToDashboard}
                    className="text-xs text-slate-600 hover:text-black underline cursor-pointer hidden sm:inline-block font-medium"
                  >
                    Skip to dashboard
                  </button>
                )}

                <button
                  type="button"
                  onClick={handleNext}
                  disabled={saving}
                  className="px-5 sm:px-6 py-2.5 sm:py-3 rounded-xl bg-white hover:bg-slate-200 text-slate-950 font-bold text-xs sm:text-sm transition-all flex items-center gap-2 shadow-sm cursor-pointer disabled:opacity-50"
                >
                  {saving ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin text-slate-950" />
                      <span>Auto-Seeding Resume &amp; Profile...</span>
                    </>
                  ) : currentStep === totalSteps ? (
                    <>
                      <span>Complete &amp; Open Dashboard</span>
                      <Check className="w-4 h-4 text-slate-950" />
                    </>
                  ) : (
                    <>
                      <span>Continue</span>
                      <ArrowRight className="w-4 h-4 text-slate-950" />
                    </>
                  )}
                </button>
              </div>
            </div>

          </div>
        )}

        <div className="text-center text-xs text-slate-600 flex items-center justify-center gap-2">
          <ShieldCheck className="w-4 h-4 text-emerald-400" />
          <span>Your roadmap &amp; daily timetable adapt automatically based on your real performance</span>
        </div>

      </div>
    </div>
  );
}
