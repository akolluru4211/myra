"use client";

import React, { useState, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowRight, AlertCircle, CheckCircle2, Lock, Check, Eye, EyeOff, Loader2, KeyRound } from "lucide-react";
import { useAuth, translateAuthError } from "@/lib/auth-context";
import FigmaAuthLayout from "@/components/auth/figma/FigmaAuthLayout";

function ResetPasswordContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams?.get("token") || "";
  const email = searchParams?.get("email") || "";

  const { updateUserPassword } = useAuth();

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Live password validation checklist
  const hasMinLen = password.length >= 8;
  const hasUppercase = /[A-Z]/.test(password);
  const hasLowercase = /[a-z]/.test(password);
  const hasNumber = /\d/.test(password);
  const passwordsMatch = password.length > 0 && password === confirmPassword;
  const isPasswordValid = hasMinLen && hasUppercase && hasLowercase && hasNumber;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isPasswordValid) {
      setError("Please ensure your new password satisfies all requirements below.");
      return;
    }
    if (!passwordsMatch) {
      setError("Passwords do not match. Please verify both fields.");
      return;
    }
    setLoading(true);
    setError(null);

    try {
      if (token && email) {
        // Resend-verified token recovery flow
        const res = await fetch("/api/auth/reset-password", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            token,
            email,
            newPassword: password,
          }),
        });

        const data = await res.json();
        if (!res.ok || !data.success) {
          throw new Error(data.error || "Unable to reset password.");
        }
      } else {
        // Fallback for native Supabase recovery session
        await updateUserPassword(password);
      }

      setSuccess(true);
      setTimeout(() => {
        router.push("/auth/login");
      }, 2000);
    } catch (err: any) {
      setError(translateAuthError(err) || err.message || "Failed to reset password.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <FigmaAuthLayout
      title="Create New Password"
      subtitle="Choose a secure new password for your EdWorld account."
      activeTab="login"
    >
      <div className="space-y-5">
        {success ? (
          <div className="p-6 rounded-2xl bg-[#0F1422] border border-emerald-500/30 text-center space-y-4 animate-in zoom-in-95">
            <div className="w-12 h-12 rounded-full bg-emerald-500/15 text-emerald-400 flex items-center justify-center mx-auto border border-emerald-500/30">
              <CheckCircle2 className="w-6 h-6 text-emerald-400" />
            </div>
            <div className="space-y-1">
              <h3 className="text-base font-bold text-white font-display">Password Updated!</h3>
              <p className="text-xs text-slate-300">
                Your password has been successfully reset. A confirmation was sent to your email. Redirecting you to sign in...
              </p>
            </div>
            <div className="pt-2">
              <Link
                href="/auth/login"
                className="w-full py-2.5 rounded-xl font-bold text-xs text-white bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 transition-colors flex items-center justify-center gap-2 shadow-md cursor-pointer"
              >
                <span>Continue to Sign In</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="p-3.5 rounded-2xl bg-rose-950/70 border border-rose-500/40 text-rose-200 text-xs font-semibold flex items-start gap-2.5 animate-in fade-in">
                <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                <div className="flex-1">{error}</div>
              </div>
            )}

            {email && (
              <div className="p-3 rounded-xl bg-[#0F1422] border border-white/10 text-xs text-slate-300 flex items-center justify-between">
                <span>Account:</span>
                <span className="font-mono font-bold text-white">{email}</span>
              </div>
            )}

            {/* New Password */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-200 uppercase tracking-wider">
                New Password
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  placeholder="Enter new password"
                  className="w-full pl-10 pr-11 py-3 text-sm bg-[#0F1422] border border-white/15 rounded-xl text-white placeholder:text-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/30 transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200 transition-colors cursor-pointer"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Confirm Password */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-200 uppercase tracking-wider">
                Confirm New Password
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type={showPassword ? "text" : "password"}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  placeholder="Re-enter new password"
                  className="w-full pl-10 pr-4 py-3 text-sm bg-[#0F1422] border border-white/15 rounded-xl text-white placeholder:text-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/30 transition-all"
                />
              </div>
            </div>

            {/* Password Requirements Checklist */}
            <div className="p-3.5 rounded-xl bg-[#0F1422] border border-white/10 space-y-2 text-xs">
              <span className="font-bold text-slate-200 block text-[11px] uppercase tracking-wider">
                Password Requirements:
              </span>
              <div className="grid grid-cols-2 gap-2 text-slate-300">
                <div className={`flex items-center gap-1.5 ${hasMinLen ? "text-emerald-400 font-semibold" : ""}`}>
                  <Check className={`w-3.5 h-3.5 ${hasMinLen ? "text-emerald-400" : "text-slate-600"}`} />
                  <span>8+ characters</span>
                </div>
                <div className={`flex items-center gap-1.5 ${hasUppercase ? "text-emerald-400 font-semibold" : ""}`}>
                  <Check className={`w-3.5 h-3.5 ${hasUppercase ? "text-emerald-400" : "text-slate-600"}`} />
                  <span>Uppercase letter</span>
                </div>
                <div className={`flex items-center gap-1.5 ${hasLowercase ? "text-emerald-400 font-semibold" : ""}`}>
                  <Check className={`w-3.5 h-3.5 ${hasLowercase ? "text-emerald-400" : "text-slate-600"}`} />
                  <span>Lowercase letter</span>
                </div>
                <div className={`flex items-center gap-1.5 ${hasNumber ? "text-emerald-400 font-semibold" : ""}`}>
                  <Check className={`w-3.5 h-3.5 ${hasNumber ? "text-emerald-400" : "text-slate-600"}`} />
                  <span>One number</span>
                </div>
              </div>
              {confirmPassword.length > 0 && (
                <div className={`flex items-center gap-1.5 pt-1 text-[11px] ${passwordsMatch ? "text-emerald-400 font-bold" : "text-rose-400"}`}>
                  <Check className={`w-3.5 h-3.5 ${passwordsMatch ? "text-emerald-400" : "text-rose-400"}`} />
                  <span>{passwordsMatch ? "Passwords match" : "Passwords do not match"}</span>
                </div>
              )}
            </div>

            <button
              type="submit"
              disabled={loading || !isPasswordValid || !passwordsMatch}
              className="w-full py-3.5 px-6 rounded-xl font-bold text-sm text-white bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 transition-all flex items-center justify-center gap-2 shadow-lg shadow-indigo-500/25 disabled:opacity-60 cursor-pointer"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-white" />
                  <span>Updating Password...</span>
                </>
              ) : (
                <>
                  <span>Save New Password</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>
        )}
      </div>
    </FigmaAuthLayout>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center">
          <div className="p-6 rounded-2xl liquid-glass-card bg-white/80 border-white/90 shadow-lg flex items-center gap-3">
            <Loader2 className="w-6 h-6 animate-spin text-slate-900" />
            <span className="text-sm font-semibold text-slate-800">Loading password reset...</span>
          </div>
        </div>
      }
    >
      <ResetPasswordContent />
    </Suspense>
  );
}
