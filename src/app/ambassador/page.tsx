"use client";

export const dynamic = "force-dynamic";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { 
  Award, 
  ArrowLeft, 
  CheckCircle2, 
  Clock, 
  AlertCircle, 
  Send, 
  Users, 
  ArrowRight,
  ShieldCheck,
  Briefcase,
  Gift,
  Copy,
  Check,
  Calendar,
  ListTodo,
  ExternalLink,
  Flame,
  Sparkles
} from "lucide-react";

export default function CampusAmbassadorPage() {
  const { user, profile, loading: authLoading } = useAuth();
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [application, setApplication] = useState<any>(null);
  const [ambassador, setAmbassador] = useState<any>(null);

  // Form fields
  const [collegeName, setCollegeName] = useState("");
  const [degreeYear, setDegreeYear] = useState("");
  const [whyAmbassador, setWhyAmbassador] = useState("");
  const [relevantExperience, setRelevantExperience] = useState("");
  const [linkedin, setLinkedin] = useState("");
  const [instagram, setInstagram] = useState("");

  const [submitting, setSubmitting] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);
  const [formMsg, setFormMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const fetchStatus = async () => {
    if (!user) return;
    try {
      setLoading(true);
      const res = await fetch(`/api/ambassador/apply?userId=${user.uid}`);
      const data = await res.json();
      if (data.success) {
        setApplication(data.application);
        setAmbassador(data.ambassador);

        // Pre-fill fields from profile if available
        if (data.application) {
          setCollegeName(data.application.college_name || "");
          setDegreeYear(data.application.degree_year || "");
          setWhyAmbassador(data.application.why_ambassador || "");
          setRelevantExperience(data.application.relevant_experience || "");
        } else if (profile) {
          setCollegeName(profile.institution || "");
          setDegreeYear((profile as any).grade_level || profile.gradeLevel || "Pre-final Year");
        }
      }
    } catch (err) {
      console.warn("Could not load ambassador status:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      fetchStatus();
    } else if (!authLoading) {
      setLoading(false);
    }
  }, [user, authLoading]);

  const handleSubmitApplication = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!collegeName.trim() || !whyAmbassador.trim()) {
      setFormMsg({ type: "error", text: "Please enter your college name and statement of purpose." });
      return;
    }

    try {
      setSubmitting(true);
      setFormMsg(null);

      const res = await fetch("/api/ambassador/apply", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: user?.uid,
          studentName: profile?.name || (user as any)?.displayName || "Learner",
          email: user?.email,
          collegeName,
          degreeYear,
          whyAmbassador,
          relevantExperience,
          socialLinks: { linkedin, instagram },
          isResubmission: application?.status === "changes_requested",
        }),
      });

      const data = await res.json();
      if (data.success) {
        setFormMsg({ type: "success", text: data.message || "Application submitted successfully!" });
        fetchStatus();
      } else {
        setFormMsg({ type: "error", text: data.error || "Submission failed." });
      }
    } catch (err: any) {
      setFormMsg({ type: "error", text: err.message || "Failed to submit application." });
    } finally {
      setSubmitting(false);
    }
  };

  const handleCopyReferral = () => {
    if (!ambassador?.referral_code) return;
    navigator.clipboard.writeText(ambassador.referral_code);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  const isApproved = ambassador && ambassador.is_active;

  return (
    <div className="min-h-screen bg-[#F4F5FA] font-sans text-slate-800 pb-20">
      {/* Top Header */}
      <header className="bg-white border-b border-slate-200/80 sticky top-0 z-30 shadow-2xs">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-3.5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/dashboard" className="p-1.5 rounded-xl hover:bg-slate-100 text-slate-600 transition-colors">
              <ArrowLeft className="w-4 h-4" />
            </Link>
            <div className="flex items-center gap-2">
              <span className="text-base font-black font-display text-slate-900">
                Campus Ambassador Program
              </span>
            </div>
          </div>

          <Link
            href="/dashboard"
            className="px-3.5 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-xs font-bold text-slate-700"
          >
            Dashboard
          </Link>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 pt-6 space-y-6">
        {/* Hero Card */}
        <div className="bg-gradient-to-br from-indigo-950 via-slate-900 to-indigo-950 rounded-3xl p-6 sm:p-8 text-white shadow-lg space-y-3 relative overflow-hidden">
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-1 rounded-md text-[10px] font-mono font-bold uppercase tracking-wider bg-white/20 text-white backdrop-blur-xs flex items-center gap-1.5">
              <Award className="w-3.5 h-3.5 text-amber-300" />
              <span>Campus Leadership Network</span>
            </span>
          </div>

          <h1 className="text-2xl sm:text-3xl font-black font-display tracking-tight text-white leading-tight">
            Represent EdWorld at Your College &amp; Accelerate Your Career
          </h1>
          <p className="text-xs sm:text-sm text-slate-300 leading-relaxed max-w-2xl">
            Lead campus hackathons, host technical workshops, mentor student squads, and earn verified leadership credentials, stipends, and executive mentorship.
          </p>
        </div>

        {/* Dynamic State Card: If Approved, Show Ambassador Portal */}
        {isApproved ? (
          <div className="space-y-6">
            {/* Ambassador Verified Details */}
            <div className="border-slate-200/80 p-6 space-y-4 border-b">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <span className="text-[10px] font-mono font-bold uppercase tracking-wider px-2.5 py-1 rounded bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Official Campus Ambassador</span>
                </span>
                <span className="text-xs font-mono text-slate-400">
                  Appointed: {new Date(ambassador.joined_at).toLocaleDateString("en-IN", { month: "short", year: "numeric" })}
                </span>
              </div>

              <div className="space-y-1">
                <h2 className="text-lg font-black font-display text-slate-900">
                  {ambassador.college_name} Ambassador Dashboard
                </h2>
                <p className="text-xs text-slate-500">
                  Share your verified referral code to grant peers access and earn verified campus leadership credentials.
                </p>
              </div>

              {/* Referral Code Box */}
              <div className="p-4 rounded-2xl bg-indigo-50/60 border border-indigo-100 flex items-center justify-between gap-3 flex-wrap">
                <div>
                  <div className="text-[10px] font-bold text-[#5C59E8] font-mono uppercase">
                    Your Campus Referral Code
                  </div>
                  <div className="text-xl sm:text-2xl font-black font-mono text-slate-900 tracking-wider mt-0.5">
                    {ambassador.referral_code}
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleCopyReferral}
                  className="px-4 py-2 rounded-xl bg-[#5C59E8] hover:bg-[#4E4BC6] text-white text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer shadow-xs"
                >
                  {copiedCode ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedCode ? "Copied!" : "Copy Code"}</span>
                </button>
              </div>

              {/* Verified Rewards Metric */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pt-2">
                <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80">
                  <div className="text-[10px] font-bold text-slate-500 uppercase font-mono">Verified Referrals</div>
                  <div className="text-xl font-black font-display text-slate-900 mt-1">
                    {ambassador.referralCount || 0}
                  </div>
                  <div className="text-[10px] text-slate-400 mt-0.5">Students enrolled</div>
                </div>

                <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80">
                  <div className="text-[10px] font-bold text-slate-500 uppercase font-mono">Leadership Tier</div>
                  <div className="text-xl font-black font-display text-indigo-600 mt-1">
                    {ambassador.verified_rewards?.tier || "Bronze"}
                  </div>
                  <div className="text-[10px] text-slate-400 mt-0.5">Verified standing</div>
                </div>

                <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80 col-span-2 sm:col-span-1">
                  <div className="text-[10px] font-bold text-slate-500 uppercase font-mono">Status</div>
                  <div className="text-xl font-black font-display text-emerald-600 mt-1">
                    Active
                  </div>
                  <div className="text-[10px] text-slate-400 mt-0.5">In good standing</div>
                </div>
              </div>
            </div>

            {/* Assigned Tasks & Campus Events */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Tasks */}
              <div className="border-slate-200/80 p-5 space-y-3 border-b">
                <div className="flex items-center gap-2 text-xs font-bold text-slate-900 font-display">
                  <ListTodo className="w-4 h-4 text-[#5C59E8]" />
                  <span>Assigned Campus Tasks</span>
                </div>
                {ambassador.assigned_tasks && ambassador.assigned_tasks.length > 0 ? (
                  <div className="space-y-2">
                    {ambassador.assigned_tasks.map((t: any) => (
                      <div key={t.id} className="p-2.5 rounded-xl bg-slate-50 border border-slate-200/80 text-xs space-y-0.5">
                        <div className="font-bold text-slate-800">{t.title}</div>
                        <div className="text-slate-500 text-[11px]">{t.description}</div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-slate-400 py-4 text-center">
                    No active pending tasks. Keep spreading the word on campus!
                  </p>
                )}
              </div>

              {/* Campus Events */}
              <div className="border-slate-200/80 p-5 space-y-3 border-b">
                <div className="flex items-center gap-2 text-xs font-bold text-slate-900 font-display">
                  <Calendar className="w-4 h-4 text-amber-500" />
                  <span>Approved Campus Events</span>
                </div>
                {ambassador.campus_events && ambassador.campus_events.length > 0 ? (
                  <div className="space-y-2">
                    {ambassador.campus_events.map((ev: any) => (
                      <div key={ev.id} className="p-2.5 rounded-xl bg-slate-50 border border-slate-200/80 text-xs space-y-0.5">
                        <div className="font-bold text-slate-800">{ev.title}</div>
                        <div className="text-slate-500 text-[11px]">Venue: {ev.venue}</div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-slate-400 py-4 text-center">
                    No scheduled events. Contact your staff coordinator to propose an event.
                  </p>
                )}
              </div>
            </div>
          </div>
        ) : (
          /* Application Flow / Status Tracking */
          <div className="border-slate-200/80 p-6 sm:p-8 space-y-5 border-b">
            {/* Status Display if Application Exists */}
            {application && (
              <div
                className={`p-4 rounded-2xl border text-xs space-y-2 ${
                  application.status === "changes_requested"
                    ? "bg-purple-50 border-purple-200 text-purple-900"
                    : application.status === "declined"
                    ? "bg-rose-50 border-rose-200 text-rose-900"
                    : "bg-indigo-50 border-indigo-200 text-indigo-900"
                }`}
              >
                <div className="font-bold flex items-center justify-between">
                  <span>Application Status: {application.status.toUpperCase()}</span>
                  <span>Submitted: {new Date(application.created_at).toLocaleDateString()}</span>
                </div>

                {application.decision_message && (
                  <div className="p-2.5 rounded-xl bg-white/80 border border-current font-medium">
                    Reviewer Note: {application.decision_message}
                  </div>
                )}

                {application.status === "changes_requested" && (
                  <p className="font-bold text-purple-800">
                    Staff requested updates. Please review the feedback above, revise your statement or details below, and resubmit.
                  </p>
                )}
              </div>
            )}

            {/* Application Form */}
            {(!application || application.status === "changes_requested" || application.status === "declined") && (
              <form onSubmit={handleSubmitApplication} className="space-y-4 font-sans">
                <div className="space-y-1">
                  <h3 className="text-base font-black font-display text-slate-900">
                    {application?.status === "changes_requested" ? "Revise & Resubmit Application" : "Apply to Become an Ambassador"}
                  </h3>
                  <p className="text-xs text-slate-500">
                    Tell us about your campus involvement and why you want to represent EdWorld.
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1 text-xs">
                    <label className="font-bold text-slate-700">College / University Name *</label>
                    <input
                      type="text"
                      value={collegeName}
                      onChange={(e) => setCollegeName(e.target.value)}
                      required
                      placeholder="e.g. Osmania University"
                      className="w-full p-2.5 rounded-xl bg-slate-50 border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                    />
                  </div>

                  <div className="space-y-1 text-xs">
                    <label className="font-bold text-slate-700">Degree &amp; Current Academic Year</label>
                    <input
                      type="text"
                      value={degreeYear}
                      onChange={(e) => setDegreeYear(e.target.value)}
                      placeholder="e.g. B.Tech Computer Science, 3rd Year"
                      className="w-full p-2.5 rounded-xl bg-slate-50 border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                    />
                  </div>
                </div>

                <div className="space-y-1 text-xs">
                  <label className="font-bold text-slate-700">Why do you want to be an Ambassador? *</label>
                  <textarea
                    value={whyAmbassador}
                    onChange={(e) => setWhyAmbassador(e.target.value)}
                    required
                    rows={3}
                    placeholder="Describe your student leadership experience or passion for peer learning..."
                    className="w-full p-2.5 rounded-xl bg-slate-50 border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                  />
                </div>

                <div className="space-y-1 text-xs">
                  <label className="font-bold text-slate-700">Relevant Experience (Clubs, Events, Hackathons)</label>
                  <input
                    type="text"
                    value={relevantExperience}
                    onChange={(e) => setRelevantExperience(e.target.value)}
                    placeholder="e.g. Technical Club Secretary, GDSC Lead member"
                    className="w-full p-2.5 rounded-xl bg-slate-50 border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                  />
                </div>

                {formMsg && (
                  <div
                    className={`p-3 rounded-xl text-xs ${
                      formMsg.type === "success"
                        ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
                        : "bg-rose-50 text-rose-800 border border-rose-200"
                    }`}
                  >
                    {formMsg.text}
                  </div>
                )}

                <div className="pt-2 flex items-center justify-end">
                  <button
                    type="submit"
                    disabled={submitting}
                    className="px-6 py-2.5 rounded-xl bg-[#5C59E8] hover:bg-[#4E4BC6] text-white text-xs font-bold transition-all shadow-md active:scale-95 cursor-pointer disabled:opacity-50"
                  >
                    {submitting ? "Submitting..." : application?.status === "changes_requested" ? "Resubmit Application" : "Submit Ambassador Application"}
                  </button>
                </div>
              </form>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
