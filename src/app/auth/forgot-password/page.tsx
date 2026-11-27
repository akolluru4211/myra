"use client";

import React, { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { ArrowRight, AlertCircle, CheckCircle2, Mail, Loader2, RotateCw } from "lucide-react";
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
      subtitle="Enter your email to receive a password reset link."
      activeTab="login"
    >
      <div className="space-y-5">
        
        {sent ? (
          accountExists === false ? (
            <div className="p-6 rounded-2xl bg-amber-50 border border-amber-200 text-center space-y-4 animate-in zoom-in-95">
              <div className="w-12 h-12 rounded-full bg-amber-100 text-amber-700 flex items-center justify-center mx-auto border border-amber-200">
                <AlertCircle className="w-6 h-6 text-amber-700" />
              </div>
              <div className="space-y-1">
                <h3 className="text-base font-bold text-slate-900 font-display">No Account Found</h3>
                <p className="text-xs text-slate-600 leading-relaxed max-w-sm mx-auto">
                  We could not find an account registered under <strong className="text-slate-900">{submittedEmail || email}</strong>. Please check for typos or create a new student account.
                </p>
              </div>
              <div className="space-y-2 pt-2">
                <Link
                  href={`/auth/signup?email=${encodeURIComponent(submittedEmail || email)}`}
                  className="w-full py-2.5 rounded-xl font-bold text-xs text-white bg-[#57534e] hover:bg-[#44403c] transition-colors flex items-center justify-center gap-2 shadow-xs cursor-pointer"
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
                  className="w-full py-2.5 rounded-xl font-semibold text-xs text-slate-600 hover:text-slate-900 transition-colors"
                >
                  Try another email
                </button>
              </div>
            </div>
          ) : (
            <div className="p-6 rounded-2xl bg-emerald-50 border border-emerald-200 text-center space-y-4 animate-in zoom-in-95">
              <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center mx-auto border border-emerald-200">
                <CheckCircle2 className="w-6 h-6 text-emerald-700" />
              </div>
              <div className="space-y-1">
                <h3 className="text-base font-bold text-slate-900 font-display">Check Your Email</h3>
                <p className="text-xs text-slate-600 leading-relaxed max-w-sm mx-auto">
                  We have dispatched password recovery instructions to <strong className="text-slate-900">{submittedEmail || email}</strong>.
                </p>
              </div>

              {devResetUrl && (
                <div className="p-3 bg-white rounded-xl border border-slate-200 text-left space-y-1">
                  <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                    Local Development Direct Link
                  </div>
                  <Link
                    href={devResetUrl}
                    className="text-xs font-mono text-[#57534e] hover:underline break-all block"
                  >
                    {devResetUrl}
                  </Link>
                </div>
              )}

              <div className="pt-2 flex items-center justify-center gap-4 text-xs">
                {countdown > 0 ? (
                  <span className="text-slate-500">
                    Resend in <span className="font-semibold text-slate-800">{countdown}s</span>
                  </span>
                ) : (
                  <button
                    type="button"
                    onClick={handleSubmit}
                    disabled={loading}
                    className="font-bold text-[#57534e] hover:text-[#44403c] flex items-center gap-1 cursor-pointer"
                  >
                    <RotateCw className="w-3.5 h-3.5" />
                    <span>Resend instructions</span>
                  </button>
                )}
              </div>
            </div>
          )
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-medium flex items-start gap-2.5 animate-in fade-in">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                <div className="flex-1">{error}</div>
              </div>
            )}

            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
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
                  className="w-full pl-10 pr-4 py-2.5 sm:py-3 text-sm bg-white border border-slate-300 rounded-xl text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-[#57534e] focus:ring-2 focus:ring-[#57534e]/20 transition-all"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 px-6 rounded-xl font-bold text-sm text-white bg-[#57534e] hover:bg-[#44403c] transition-all flex items-center justify-center gap-2 shadow-sm disabled:opacity-60 cursor-pointer"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-white" />
                  <span>Sending Instructions...</span>
                </>
              ) : (
                <>
                  <span>Send Recovery Instructions</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>
        )}

        {/* Back to sign in */}
        <div className="pt-3 border-t border-slate-200 text-center">
          <Link
            href="/auth/login"
            className="text-xs font-semibold text-slate-600 hover:text-slate-900 transition-colors"
          >
            &larr; Back to sign in
          </Link>
        </div>

      </div>
    </FigmaAuthLayout>
  );
}

export default function ForgotPasswordPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#F4F5FA] flex items-center justify-center">
          <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-sm flex items-center gap-3">
            <Loader2 className="w-5 h-5 animate-spin text-[#57534e]" />
            <span className="text-sm font-semibold text-slate-800">Loading recovery...</span>
          </div>
        </div>
      }
    >
      <ForgotPasswordContent />
    </Suspense>
  );
}
