"use client";

import React, { useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { ShieldCheck, Lock, CheckCircle2, AlertTriangle, ArrowRight, Loader2, XCircle, Clock } from "lucide-react";

type ConsentState = "ready" | "verified" | "revoked" | "expired" | "used" | "error";

export default function GuardianConsentVerifyPage() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token");

  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<ConsentState>(token ? "ready" : "error");
  const [errorMessage, setErrorMessage] = useState(
    token ? "" : "Missing verification token. Please use the link sent in your verification email."
  );

  const handleAction = async (action: "approve" | "revoke") => {
    if (!token) return;
    setLoading(true);
    setErrorMessage("");

    try {
      const response = await fetch("/api/consent/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, action }),
      });

      const data = await response.json().catch(() => ({}));

      if (response.ok && data.success) {
        if (action === "approve") {
          setStatus("verified");
        } else {
          setStatus("revoked");
        }
      } else {
        // Distinguish specific failure states
        if (response.status === 410 || data.error === "TOKEN_EXPIRED") {
          setStatus("expired");
          setErrorMessage(data.message || "This verification link has expired. Verification links are valid for 7 days.");
        } else if (response.status === 409 || data.error === "TOKEN_ALREADY_USED") {
          setStatus("used");
          setErrorMessage(data.message || "This verification link has already been used. Each link can only be consumed once.");
        } else if (response.status === 404 || data.error === "TOKEN_NOT_FOUND") {
          setStatus("error");
          setErrorMessage("Invalid verification link. This token was not found in our records.");
        } else {
          // Temporary failure state (500, network error)
          setStatus("error");
          setErrorMessage(data.message || "A temporary verification failure occurred. Please check your connection and retry.");
        }
      }
    } catch (err: any) {
      console.error("[Consent Verify Client Error]:", err);
      setStatus("error");
      setErrorMessage("Unable to connect to the verification service. Please verify your internet connection and try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center p-4 sm:p-6 bg-slate-50">
      <div className="max-w-lg w-full border-slate-200 p-8 space-y-6 animate-in fade-in duration-200 border-b">
        {/* Brand Header */}
        <div className="text-center space-y-2 border-b border-slate-100 pb-6">
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Parent / Guardian Consent Portal</h1>
          <p className="text-xs text-slate-500">Under-18 Data Protection &amp; Safety Verification</p>
        </div>

        {/* Ready State: Review & Submit */}
        {status === "ready" && (
          <div className="space-y-6">
            <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-xs text-amber-900 space-y-2">
              <div className="flex items-center gap-2 font-bold text-amber-950">
                <Lock className="w-4 h-4 text-amber-700" />
                <span>Minors Privacy Protection Notice</span>
              </div>
              <p className="leading-relaxed opacity-95">
                Your child or ward has registered for career-readiness and skills growth on Edworld Co. In accordance with India&apos;s DPDP Act and international youth privacy standards, we require verified guardian acknowledgment.
              </p>
            </div>

            <div className="space-y-3 text-xs text-slate-700 bg-slate-50 p-4 rounded-2xl border border-slate-200">
              <p className="font-bold text-slate-900 uppercase tracking-wider text-[11px]">
                Our Strict Safety Commitments:
              </p>
              <div className="space-y-2">
                <div className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <span><strong>Date of Birth Isolation:</strong> Raw DOB is stored server-side only for age calibration and is never shared publicly.</span>
                </div>
                <div className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <span><strong>No Public Profiles:</strong> Under-18 accounts cannot be discovered or contacted by strangers.</span>
                </div>
                <div className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <span><strong>Educational Practice Only:</strong> Content is strictly focused on STEM projects, ATS resumes, and AI interview simulations.</span>
                </div>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row items-center gap-3 pt-2">
              <button
                type="button"
                disabled={loading}
                onClick={() => handleAction("approve")}
                className="w-full sm:w-2/3 py-3.5 px-4 rounded-xl bg-slate-900 hover:bg-slate-800 active:bg-black text-white text-xs font-bold uppercase tracking-wider shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 disabled:opacity-60"
              >
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <ShieldCheck className="w-4 h-4 text-emerald-400" />}
                <span>Confirm Guardian Consent</span>
              </button>

              <button
                type="button"
                disabled={loading}
                onClick={() => handleAction("revoke")}
                className="w-full sm:w-1/3 py-3.5 px-4 rounded-xl border border-rose-200 text-rose-700 hover:bg-rose-50 text-xs font-bold uppercase tracking-wider transition-all flex items-center justify-center gap-1.5 disabled:opacity-60"
              >
                <span>Decline</span>
              </button>
            </div>
          </div>
        )}

        {/* Verified State */}
        {status === "verified" && (
          <div className="text-center space-y-4 py-4">
            <div className="w-16 h-16 rounded-2xl bg-emerald-50 text-emerald-600 border border-emerald-200 flex items-center justify-center mx-auto shadow-md shadow-emerald-500/10">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <div className="space-y-1">
              <h2 className="text-xl font-black text-slate-900 tracking-tight">Guardian Consent Verified</h2>
              <p className="text-xs text-slate-600 max-w-sm mx-auto leading-relaxed">
                Thank you! Your consent has been recorded. Your student now has verified access to their personalized career readiness dashboard with full minor safety protections active.
              </p>
            </div>
            <div className="pt-4">
              <Link
                href="/"
                className="inline-flex items-center gap-2 text-xs font-bold text-slate-900 hover:text-brand-600 transition-colors"
              >
                <span>Return to Edworld Co Home</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>
        )}

        {/* Revoked State */}
        {status === "revoked" && (
          <div className="text-center space-y-4 py-4">
            <div className="w-16 h-16 rounded-2xl bg-slate-100 text-slate-700 border border-slate-200 flex items-center justify-center mx-auto">
              <XCircle className="w-8 h-8 text-rose-500" />
            </div>
            <div className="space-y-1">
              <h2 className="text-xl font-black text-slate-900 tracking-tight">Consent Declined</h2>
              <p className="text-xs text-slate-600 max-w-sm mx-auto leading-relaxed">
                You have chosen not to authorize this account. The student&apos;s profile access has been restricted. You can contact support at privacy@edworld.co if you have questions.
              </p>
            </div>
          </div>
        )}

        {/* Expired Token State */}
        {status === "expired" && (
          <div className="text-center space-y-4 py-4">
            <div className="w-16 h-16 rounded-2xl bg-amber-50 text-amber-600 border border-amber-200 flex items-center justify-center mx-auto">
              <Clock className="w-8 h-8" />
            </div>
            <div className="space-y-1">
              <h2 className="text-xl font-black text-slate-900 tracking-tight">Verification Link Expired</h2>
              <p className="text-xs text-slate-600 max-w-sm mx-auto leading-relaxed">
                {errorMessage}
              </p>
            </div>
          </div>
        )}

        {/* Already Used Token State */}
        {status === "used" && (
          <div className="text-center space-y-4 py-4">
            <div className="w-16 h-16 rounded-2xl bg-blue-50 text-blue-600 border border-blue-200 flex items-center justify-center mx-auto">
              <ShieldCheck className="w-8 h-8" />
            </div>
            <div className="space-y-1">
              <h2 className="text-xl font-black text-slate-900 tracking-tight">Link Already Consumed</h2>
              <p className="text-xs text-slate-600 max-w-sm mx-auto leading-relaxed">
                {errorMessage}
              </p>
            </div>
          </div>
        )}

        {/* Temporary Failure / Invalid Error State */}
        {status === "error" && (
          <div className="text-center space-y-4 py-4">
            <div className="w-16 h-16 rounded-2xl bg-rose-50 text-rose-600 border border-rose-200 flex items-center justify-center mx-auto">
              <AlertTriangle className="w-8 h-8" />
            </div>
            <div className="space-y-1">
              <h2 className="text-xl font-black text-slate-900 tracking-tight">Verification Issue</h2>
              <p className="text-xs text-slate-600 max-w-sm mx-auto leading-relaxed">
                {errorMessage}
              </p>
            </div>
            {token && (
              <div className="pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setStatus("ready");
                    setErrorMessage("");
                  }}
                  className="px-4 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-semibold transition-colors"
                >
                  Retry Action
                </button>
              </div>
            )}
          </div>
        )}

        {/* Footer info */}
        <div className="pt-4 border-t border-slate-100 text-center text-[10px] text-slate-400">
          Edworld Co &bull; DPDP Act &amp; Youth Privacy Shield Compliance
        </div>
      </div>
    </div>
  );
}
