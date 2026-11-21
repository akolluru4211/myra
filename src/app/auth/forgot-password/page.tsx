"use client";

import React, { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { ArrowRight, AlertCircle, CheckCircle2, Mail, Loader2, ArrowLeft, RotateCw, ShieldCheck } from "lucide-react";
import FigmaAuthLayout from "@/components/auth/figma/FigmaAuthLayout";

function ForgotPasswordContent() {
  const searchParams = useSearchParams();
  const initialEmail = searchParams?.get("email") || "";

  const [email, setEmail] = useState(initialEmail);
  const [submittedEmail, setSubmittedEmail] = useState("");
  const [accountExists, setAccountExists] = useState<boolean | null>(null);
  const [devResetUrl, setDevResetUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [countdown, setCountdown] = useState(45);
  const [canResend, setCanResend] = useState(false);

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (sent && countdown > 0) {
      timer = setTimeout(() => setCountdown((c) => c - 1), 1000);
    } else if (sent && countdown === 0) {
      setCanResend(true);
    }
    return () => clearTimeout(timer);
  }, [sent, countdown]);

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const cleanEmail = email.trim();
    if (!cleanEmail) {
      setError("Please enter your email address.");
      return;
    }
    setSubmittedEmail(cleanEmail);
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: cleanEmail }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Unable to send reset instructions.");
      }
      setAccountExists(data.accountExists !== false);
      if (data.devResetUrl) {
        setDevResetUrl(data.devResetUrl);
      }
      setSent(true);
      setCountdown(45);
      setCanResend(false);
    } catch (err: any) {
      setError(err.message || "Failed to request password reset.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <FigmaAuthLayout
      title="Reset Password"
      subtitle="Enter your email to receive a secure recovery link via Resend."
      activeTab="login"
    >
      <div className="space-y-5">
        
        {sent ? (
          accountExists === false ? (
            <div className="p-6 rounded-2xl bg-[#0F1422] border border-amber-500/30 text-center space-y-4 animate-in zoom-in-95">
              <div className="w-12 h-12 rounded-full bg-amber-500/15 text-amber-400 flex items-center justify-center mx-auto border border-amber-500/30">
                <AlertCircle className="w-6 h-6 text-amber-400" />
              </div>
              <div className="space-y-1">
                <h3 className="text-base font-bold text-white font-display">No Account Found</h3>
                <p className="text-xs text-slate-300 leading-relaxed max-w-sm mx-auto">
                  We could not find an account registered under <strong className="text-white">{submittedEmail || email}</strong>. Please check for typos or create a new student account.
                </p>
              </div>
              <div className="space-y-2 pt-2">
                <Link
                  href={`/auth/signup?email=${encodeURIComponent(submittedEmail || email)}`}
                  className="w-full py-2.5 rounded-xl font-bold text-xs text-white bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 transition-colors flex items-center justify-center gap-2 shadow-md cursor-pointer"
                >
                  <span>Create Free Account</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>
                <button
                  type="button"
                  onClick={() => {
                    setSent(false);
                    setAccountExists(null);
                  }}
                  className="text-xs text-slate-400 hover:text-white font-bold transition-colors cursor-pointer"
                >
                  Try a different email address
                </button>
              </div>
            </div>
          ) : (
            <div className="p-6 rounded-2xl bg-[#0F1422] border border-emerald-500/30 text-center space-y-4 animate-in zoom-in-95">
              <div className="w-12 h-12 rounded-full bg-emerald-500/15 text-emerald-400 flex items-center justify-center mx-auto border border-emerald-500/30">
                <CheckCircle2 className="w-6 h-6 text-emerald-400" />
              </div>
              <div className="space-y-1">
                <h3 className="text-base font-bold text-white font-display">Recovery Email Dispatched</h3>
                <p className="text-xs text-slate-300 leading-relaxed max-w-sm mx-auto">
                  A password reset link was dispatched via Resend to <strong className="text-white">{submittedEmail || email}</strong>. It will expire in <strong>1 hour</strong>.
                </p>
              </div>

              {/* Developer Helper Banner */}
              {devResetUrl && (
                <div className="p-3 rounded-xl bg-slate-900 border border-emerald-500/30 text-left space-y-2 text-xs">
                  <div className="flex items-center gap-1.5 font-bold text-emerald-400">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                    <span>[Local Mode: Instant Recovery URL]</span>
                  </div>
                  <Link
                    href={devResetUrl}
                    className="inline-flex items-center gap-1.5 py-1.5 px-3 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-xs"
                  >
                    <span>Click Here to Reset Password</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              )}

              {/* Resend Cooldown Controls */}
              <div className="pt-2 flex flex-col items-center gap-2">
                {canResend ? (
                  <button
                    type="button"
                    onClick={() => handleSubmit()}
                    disabled={loading}
                    className="text-xs font-semibold text-cyan-400 hover:text-cyan-300 transition flex items-center gap-1 cursor-pointer"
                  >
                    <RotateCw className="w-3.5 h-3.5" />
                    Didn&apos;t receive it? Resend link
                  </button>
                ) : (
                  <span className="text-xs text-slate-400 font-mono">
                    Resend link available in <strong className="text-slate-200 font-bold">{countdown}s</strong>
                  </span>
                )}

                <Link
                  href="/auth/login"
                  className="text-xs font-bold text-slate-400 hover:text-white hover:underline pt-2 inline-flex items-center gap-1"
                >
                  <ArrowLeft className="w-3.5 h-3.5" /> Return to Sign In
                </Link>
              </div>
            </div>
          )
        ) : (
          <>
            {error && (
              <div className="p-3.5 rounded-2xl bg-rose-950/70 border border-rose-500/40 text-rose-200 text-xs font-semibold flex items-start gap-2.5 animate-in fade-in">
                <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                <div className="flex-1">{error}</div>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-200 uppercase tracking-wider">
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="student@university.edu"
                    className="w-full pl-10 pr-4 py-3 text-sm bg-[#0F1422] border border-white/15 rounded-xl text-white placeholder:text-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/30 transition-all"
                  />
                </div>
                <p className="text-[11px] text-slate-400">
                  We will send a single-use secure reset link to this address via Resend.
                </p>
              </div>

              <button
                type="submit"
                disabled={loading || !email.trim()}
                className="w-full py-3.5 px-6 rounded-xl font-bold text-sm text-white bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 transition-all flex items-center justify-center gap-2 shadow-lg shadow-indigo-500/25 disabled:opacity-60 cursor-pointer"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin text-white" />
                    <span>Sending Reset Link...</span>
                  </>
                ) : (
                  <>
                    <span>Send Password Recovery Link</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>

            <div className="pt-4 border-t border-slate-200/60 text-center">
              <Link
                href="/auth/login"
                className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-600 hover:text-slate-900 transition-colors"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Back to Sign In</span>
              </Link>
            </div>
          </>
        )}

      </div>
    </FigmaAuthLayout>
  );
}

export default function ForgotPasswordPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center">
          <div className="p-6 rounded-2xl liquid-glass-card bg-white/80 border-white/90 shadow-lg flex items-center gap-3">
            <Loader2 className="w-6 h-6 animate-spin text-slate-900" />
            <span className="text-sm font-semibold text-slate-800">Loading password recovery...</span>
          </div>
        </div>
      }
    >
      <ForgotPasswordContent />
    </Suspense>
  );
}
