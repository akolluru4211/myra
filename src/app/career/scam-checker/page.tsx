"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useAuth } from "@/lib/auth-context";
import AuthGuard from "@/components/auth/AuthGuard";
import { 
  ShieldAlert, 
  ShieldCheck, 
  AlertTriangle, 
  FileSearch, 
  ArrowLeft, 
  Sparkles, 
  ExternalLink, 
  CheckCircle2, 
  XCircle, 
  HelpCircle,
  Copy,
  Check,
  Building,
  Mail,
  RefreshCw,
  Info
} from "lucide-react";
import { ScamCheckResult, SAMPLE_SCAM_PRESETS } from "@/lib/scam-checker/scam-detector";

export const dynamic = "force-dynamic";

export default function ScamOfferCheckerPage() {
  const { user } = useAuth();
  
  const [companyName, setCompanyName] = useState("");
  const [contactEmail, setContactEmail] = useState("");
  const [offerText, setOfferText] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<ScamCheckResult | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [copiedLink, setCopiedLink] = useState(false);

  const handleRunAnalysis = async (customText?: string, customComp?: string, customEmail?: string) => {
    const textToAnalyze = customText !== undefined ? customText : offerText;
    const compToAnalyze = customComp !== undefined ? customComp : companyName;
    const emailToAnalyze = customEmail !== undefined ? customEmail : contactEmail;

    if (!textToAnalyze.trim()) {
      setErrorMsg("Please paste the job description, offer letter, or recruiter message to analyze.");
      return;
    }

    setIsLoading(true);
    setErrorMsg(null);

    try {
      const res = await fetch("/api/scam-checker", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          text: textToAnalyze,
          companyName: compToAnalyze,
          contactEmail: emailToAnalyze,
          userId: user?.uid
        })
      });

      const data = await res.json();
      if (data.success && data.data) {
        setResult(data.data);
      } else {
        setErrorMsg(data.error || "Unable to complete scam analysis.");
      }
    } catch (err: any) {
      console.error("Scam analysis failed:", err);
      setErrorMsg("Network error occurred while analyzing offer. Please retry.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleLoadPreset = (preset: typeof SAMPLE_SCAM_PRESETS[0]) => {
    setCompanyName(preset.companyName);
    setContactEmail(preset.contactEmail);
    setOfferText(preset.text);
    handleRunAnalysis(preset.text, preset.companyName, preset.contactEmail);
  };

  const handleReset = () => {
    setCompanyName("");
    setContactEmail("");
    setOfferText("");
    setResult(null);
    setErrorMsg(null);
  };

  return (
    <AuthGuard>
      <div className="min-h-screen text-slate-900 font-sans pb-24">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 space-y-6 animate-in fade-in">
          
          {/* Top Breadcrumb */}
          <div className="flex items-center justify-between">
            <Link
              href="/career"
              className="text-xs font-semibold text-slate-500 hover:text-slate-900 flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back to Career OS</span>
            </Link>

            <div className="flex items-center gap-2">
              <span className="liquid-pill px-2.5 py-0.5 text-[10px] font-semibold bg-white/70 text-slate-600 border-white/80">
                Student Protection Sentinel
              </span>
              <span className="liquid-pill px-2.5 py-0.5 text-[10px] font-semibold bg-blue-500/10 text-blue-700 border-blue-500/20">
                AI + Heuristics
              </span>
            </div>
          </div>

          {/* Hero Header */}
          <div className="p-6 sm:p-8 liquid-glass-card space-y-3">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="liquid-pill text-xs font-semibold px-2.5 py-0.5 bg-blue-500/10 text-blue-700 border-blue-500/20 flex items-center gap-1.5">
                <ShieldAlert className="w-3.5 h-3.5 text-blue-600" />
                Scam Sentinel AI
              </span>
              <span className="text-xs text-slate-500 font-medium">
                Offer Letter &amp; Recruiter Audit
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
              Scam Offer Checker
            </h1>
            <p className="text-xs sm:text-sm text-slate-600 max-w-2xl leading-relaxed">
              Verify campus placement offers, internships, and remote opportunities. Our engine scans for upfront fee extortion, free webmail impersonation, fake direct selection, and unregistered shadow recruiters.
            </p>
          </div>

          {/* Quick Presets for Instant Testing */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Test with Real-World Campus Presets
              </span>
              <span className="text-[11px] font-medium text-slate-500">1-Click Simulation</span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {SAMPLE_SCAM_PRESETS.map((preset) => (
                <button
                  key={preset.id}
                  type="button"
                  onClick={() => handleLoadPreset(preset)}
                  className="p-4 liquid-glass-card hover:bg-white/90 text-left transition-all space-y-1.5 group cursor-pointer shadow-xs"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-900 group-hover:text-blue-600 transition-colors">
                      {preset.title}
                    </span>
                    <Sparkles className="w-3.5 h-3.5 text-slate-400 group-hover:text-blue-600" />
                  </div>
                  <p className="text-[11px] text-slate-600 line-clamp-2">
                    {preset.text}
                  </p>
                </button>
              ))}
            </div>
          </div>

          {/* Main Inspection Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            
            {/* Input Form Column */}
            <div className="lg:col-span-6 space-y-5">
              <div className="p-6 sm:p-7 liquid-glass-card shadow-xs space-y-4">
                <div className="space-y-1">
                  <h3 className="text-sm font-bold text-slate-900">
                    Paste Offer Details or Recruiter Message
                  </h3>
                  <p className="text-xs text-slate-500">
                    Include full email text, WhatsApp transcript, or compensation breakdown.
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-[11px] font-semibold text-slate-900 flex items-center gap-1">
                      <Building className="w-3 h-3 text-slate-500" />
                      Company Name
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Infosys, Tech Mahindra"
                      value={companyName}
                      onChange={(e) => setCompanyName(e.target.value)}
                      className="liquid-input w-full px-3.5 py-2 text-xs"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[11px] font-semibold text-slate-900 flex items-center gap-1">
                      <Mail className="w-3 h-3 text-slate-500" />
                      Recruiter Email / Contact
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. hr@tcs.com or gmail ID"
                      value={contactEmail}
                      onChange={(e) => setContactEmail(e.target.value)}
                      className="liquid-input w-full px-3.5 py-2 text-xs"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-semibold text-slate-900">
                    Offer Letter / Email Transcript / JD Content *
                  </label>
                  <textarea
                    rows={8}
                    placeholder="Paste the offer letter body, stipend terms, deposit requirements, or WhatsApp message here..."
                    value={offerText}
                    onChange={(e) => setOfferText(e.target.value)}
                    className="liquid-input w-full p-3.5 text-xs font-mono leading-relaxed"
                  />
                </div>

                {errorMsg && (
                  <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-800 text-xs font-medium flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 shrink-0 text-rose-600" />
                    <span>{errorMsg}</span>
                  </div>
                )}

                <div className="flex items-center gap-2.5 pt-2">
                  <button
                    type="button"
                    onClick={() => handleRunAnalysis()}
                    disabled={isLoading || !offerText.trim()}
                    className="flex-1 py-2.5 px-4 liquid-btn-primary text-xs font-semibold disabled:opacity-50 cursor-pointer flex items-center justify-center gap-2 shadow-sm"
                  >
                    {isLoading ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin text-white" />
                        <span>Analyzing Offer Safety...</span>
                      </>
                    ) : (
                      <>
                        <FileSearch className="w-4 h-4 text-white" />
                        <span>Run Threat Inspection</span>
                      </>
                    )}
                  </button>

                  {(offerText || result) && (
                    <button
                      type="button"
                      onClick={handleReset}
                      className="liquid-btn-secondary px-4 py-2.5 text-xs font-semibold cursor-pointer"
                    >
                      Clear
                    </button>
                  )}
                </div>
              </div>

              {/* Verified Safeguards Banner */}
              <div className="p-4 rounded-xl liquid-glass-card bg-blue-500/10 border-blue-500/20 text-xs text-slate-900 space-y-2">
                <div className="flex items-center gap-1.5 font-bold text-blue-700">
                  <Info className="w-4 h-4" />
                  <span>Golden Rule for Campus Placement Safety</span>
                </div>
                <p className="text-[11px] text-slate-600 leading-relaxed">
                  Legitimate Indian &amp; Global IT companies <strong>NEVER</strong> demand security deposits for laptops, testing software, ID cards, or training. Any demand for UPI transfers is an immediate sign of fraud.
                </p>
              </div>
            </div>

            {/* Results Output Column */}
            <div className="lg:col-span-6 space-y-5">
              {!result && !isLoading && (
                <div className="p-10 liquid-glass-card text-center space-y-3">
                  <div className="w-12 h-12 rounded-xl bg-slate-500/10 flex items-center justify-center mx-auto text-slate-500 border border-slate-200">
                    <ShieldCheck className="w-6 h-6" />
                  </div>
                  <h4 className="text-sm font-bold text-slate-900">
                    No Active Inspection
                  </h4>
                  <p className="text-xs text-slate-600 max-w-sm mx-auto">
                    Paste offer text on the left or click one of the pre-loaded campus scenario cards above to run an instant safety audit.
                  </p>
                </div>
              )}

              {isLoading && (
                <div className="p-12 liquid-glass-card text-center space-y-4 shadow-sm">
                  <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto" />
                  <div className="space-y-1">
                    <h4 className="text-sm font-bold text-slate-900">Evaluating Against Threat Vectors...</h4>
                    <p className="text-xs text-slate-600">
                      Scanning free domains, payment demands, MCA registration, and high-pressure phrasing.
                    </p>
                  </div>
                </div>
              )}

              {result && !isLoading && (
                <div className="space-y-5 animate-in fade-in">
                  
                  {/* Score Card Header */}
                  <div className={`p-6 sm:p-7 rounded-2xl border ${
                    result.verdict === "HIGH_RISK_SCAM" 
                      ? "bg-rose-500/15 border-rose-500/30" 
                      : result.verdict === "MODERATE_RISK"
                      ? "bg-amber-500/15 border-amber-500/30"
                      : "bg-emerald-500/15 border-emerald-500/30"
                  } space-y-4 liquid-glass-card`}>
                    
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">
                        Security Audit Verdict
                      </span>
                      <span className="text-[10px] text-slate-500 font-mono">
                        {new Date(result.checkedAt).toLocaleTimeString()}
                      </span>
                    </div>

                    <div className="flex items-center justify-between gap-4">
                      <div>
                        <div className="flex items-center gap-2">
                          {result.verdict === "HIGH_RISK_SCAM" ? (
                            <XCircle className="w-6 h-6 text-rose-600" />
                          ) : result.verdict === "MODERATE_RISK" ? (
                            <AlertTriangle className="w-6 h-6 text-amber-600" />
                          ) : (
                            <CheckCircle2 className="w-6 h-6 text-emerald-600" />
                          )}
                          <h2 className="text-lg sm:text-xl font-bold text-slate-900">
                            {result.verdict === "HIGH_RISK_SCAM" 
                              ? "Critical Threat: Probable Scam" 
                              : result.verdict === "MODERATE_RISK" 
                              ? "Moderate Risk: Caution Advised" 
                              : "Verified: Low Risk Profile"}
                          </h2>
                        </div>
                        <p className="text-xs text-slate-600 mt-1">
                          Audited Entity: <strong>{result.companyName}</strong>
                        </p>
                      </div>

                      {/* Visual Circular/Gauge Meter */}
                      <div className="text-center shrink-0">
                        <div className={`w-14 h-14 rounded-2xl flex flex-col items-center justify-center font-mono shadow-sm ${
                          result.verdict === "HIGH_RISK_SCAM"
                            ? "bg-rose-600 text-white"
                            : result.verdict === "MODERATE_RISK"
                            ? "bg-amber-500 text-white"
                            : "bg-emerald-600 text-white"
                        }`}>
                          <span className="text-lg font-bold leading-none">{result.riskScore}</span>
                          <span className="text-[9px] font-semibold uppercase mt-0.5">/ 100 Risk</span>
                        </div>
                      </div>
                    </div>

                    {/* Summary text */}
                    <div className="p-4 rounded-xl liquid-glass-card bg-white/70 border-white/80 text-xs text-slate-700 leading-relaxed shadow-xs">
                      {result.summary}
                    </div>
                  </div>

                  {/* Red Flags Pill List */}
                  {result.redFlags.length > 0 && (
                    <div className="p-6 rounded-2xl liquid-glass-card space-y-4 shadow-xs">
                      <h4 className="text-xs font-bold uppercase tracking-wider text-slate-900 flex items-center justify-between">
                        <span>Detected Red Flags ({result.redFlags.length})</span>
                        <span className="text-[10px] text-rose-600 font-semibold">Immediate Inspection</span>
                      </h4>

                      <div className="space-y-3">
                        {result.redFlags.map((flag, idx) => (
                          <div 
                            key={idx}
                            className="p-3.5 rounded-xl border border-rose-500/20 bg-rose-500/10 space-y-1"
                          >
                            <div className="flex items-center justify-between">
                              <span className="text-xs font-bold text-slate-900">
                                {flag.title}
                              </span>
                              <span className="liquid-pill px-2 py-0.5 text-[9px] font-semibold uppercase bg-rose-500/20 text-rose-800 border-rose-500/30">
                                {flag.severity}
                              </span>
                            </div>
                            <p className="text-[11px] text-slate-600 leading-relaxed">
                              {flag.description}
                            </p>
                            {flag.matchedSnippet && (
                              <div className="text-[10px] font-mono text-slate-900 bg-white/80 px-2 py-0.5 rounded border border-rose-200 w-fit">
                                Matched: &ldquo;{flag.matchedSnippet}&rdquo;
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Action Checklist & External Verifications */}
                  <div className="p-6 rounded-2xl liquid-glass-card space-y-4 shadow-xs">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-900">
                      Student Due Diligence Checklist
                    </h4>
                    
                    <ul className="space-y-2.5">
                      {result.safetyChecklist.map((step, idx) => (
                        <li key={idx} className="flex items-start gap-2.5 text-xs text-slate-700">
                          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                          <span>{step}</span>
                        </li>
                      ))}
                    </ul>

                    <div className="pt-3 flex flex-wrap items-center gap-2.5 border-t border-slate-200/60">
                      <a
                        href={result.mcaVerificationUrl || "https://www.mca.gov.in"}
                        target="_blank"
                        rel="noreferrer"
                        className="liquid-btn-secondary px-3.5 py-2 text-xs font-semibold flex items-center gap-1.5 cursor-pointer"
                      >
                        <span>Check MCA Company Database</span>
                        <ExternalLink className="w-3.5 h-3.5 text-slate-500" />
                      </a>

                      <a
                        href="https://cybercrime.gov.in"
                        target="_blank"
                        rel="noreferrer"
                        className="liquid-pill px-3.5 py-2 bg-rose-500/10 border-rose-500/20 hover:bg-rose-500/20 text-xs font-semibold text-rose-800 flex items-center gap-1.5 transition-colors cursor-pointer"
                      >
                        <span>Report to National Cyber Crime Portal</span>
                        <ExternalLink className="w-3.5 h-3.5 text-rose-600" />
                      </a>
                    </div>
                  </div>

                </div>
              )}
            </div>

          </div>

        </div>
      </div>
    </AuthGuard>
  );
}
