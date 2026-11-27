"use client";

import React, { useState, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowRight, AlertCircle, CheckCircle2, Lock, Check, Eye, EyeOff, Loader2 } from "lucide-react";
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
        // Token recovery flow
        const res = await fetch("/api/auth/reset-password", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ token, email, password }),
        });
        const data = await res.json();
        if (!res.ok || !data.success) {
          throw new Error(data.error || "Unable to update password.");
        }
      } else {
        // Authenticated session update
        await updateUserPassword(password);
      }

      setSuccess(true);
      setTimeout(() => {
        router.push("/auth/login?password_reset=true");
      }, 2000);
    } catch (err: any) {
      setError(translateAuthError(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <FigmaAuthLayout
      title="Create New Password"
      subtitle="Enter a new secure password for your EdWorld Co. account."
      activeTab="login"
    >
      <div className="space-y-5">
        {success ? (
          <div className="p-6 rounded-2xl bg-emerald-50 border border-emerald-200 text-center space-y-3 animate-in zoom-in-95">
            <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center mx-auto border border-emerald-200">
              <CheckCircle2 className="w-6 h-6 text-emerald-700" />
            </div>
            <h3 className="text-base font-bold text-slate-900 font-display">Password Updated</h3>
            <p className="text-xs text-slate-600 leading-relaxed max-w-sm mx-auto">
              Your password has been changed successfully. Redirecting to sign in...
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-medium flex items-start gap-2.5 animate-in fade-in">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                <div className="flex-1">{error}</div>
              </div>
            )}

            {/* New Password */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                New Password
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="w-full pl-10 pr-11 py-2.5 sm:py-3 text-sm bg-white border border-slate-300 rounded-xl text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-[#57534e] focus:ring-2 focus:ring-[#57534e]/20 transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
                  title={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Confirm Password */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                Confirm New Password
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="w-full pl-10 pr-4 py-2.5 sm:py-3 text-sm bg-white border border-slate-300 rounded-xl text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-[#57534e] focus:ring-2 focus:ring-[#57534e]/20 transition-all"
                />
              </div>
            </div>

            {/* Checklist */}
            <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/90 space-y-2">
              <span className="text-slate-600 font-medium text-[11px] block">Password Checklist:</span>
              <div className="grid grid-cols-2 gap-x-2 gap-y-1 text-[11px]">
                <div className="flex items-center gap-1.5">
                  <Check className={`w-3.5 h-3.5 ${hasMinLen ? "text-emerald-600" : "text-slate-300"}`} />
                  <span className={hasMinLen ? "text-slate-800 font-medium" : "text-slate-500"}>8+ characters</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Check className={`w-3.5 h-3.5 ${hasUppercase ? "text-emerald-600" : "text-slate-300"}`} />
                  <span className={hasUppercase ? "text-slate-800 font-medium" : "text-slate-500"}>Uppercase letter</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Check className={`w-3.5 h-3.5 ${hasNumber ? "text-emerald-600" : "text-slate-300"}`} />
                  <span className={hasNumber ? "text-slate-800 font-medium" : "text-slate-500"}>Number included</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Check className={`w-3.5 h-3.5 ${passwordsMatch ? "text-emerald-600" : "text-slate-300"}`} />
                  <span className={passwordsMatch ? "text-slate-800 font-medium" : "text-slate-500"}>Passwords match</span>
                </div>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading || !isPasswordValid || !passwordsMatch}
              className="w-full py-3 px-6 rounded-xl font-bold text-sm text-white bg-[#57534e] hover:bg-[#44403c] transition-all flex items-center justify-center gap-2 shadow-sm disabled:opacity-50 cursor-pointer"
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

export default function ResetPasswordPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#F4F5FA] flex items-center justify-center">
          <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-sm flex items-center gap-3">
            <Loader2 className="w-5 h-5 animate-spin text-[#57534e]" />
            <span className="text-sm font-semibold text-slate-800">Loading reset...</span>
          </div>
        </div>
      }
    >
      <ResetPasswordContent />
    </Suspense>
  );
}
