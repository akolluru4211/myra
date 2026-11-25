"use client";

import React, { useState, useEffect, useRef, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth, translateAuthError } from "@/lib/auth-context";
import { supabase } from "@/lib/supabase";
import { resolvePostSignInDestination, validateRedirectDestination } from "@/lib/auth/redirect-validator";
import { 
  ArrowRight, 
  AlertCircle, 
  Lock,
  Eye,
  EyeOff,
  Mail,
  Loader2,
  Smartphone,
  RotateCw,
  RefreshCw
} from "lucide-react";
import FigmaAuthLayout from "@/components/auth/figma/FigmaAuthLayout";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { loginWithEmail, sendOtp, verifyOtp } = useAuth();

  // Mode switcher: "otp" (Student default) vs "password"
  const [authMethod, setAuthMethod] = useState<"otp" | "password">("otp");

  // Email OTP state
  const [otpStep, setOtpStep] = useState<"request" | "verify">("request");
  const [identifier, setIdentifier] = useState(searchParams?.get("email") || "");
  const [otpDigits, setOtpDigits] = useState<string[]>(Array(6).fill(""));
  const [countdown, setCountdown] = useState(45);
  const [canResend, setCanResend] = useState(false);
  const [maskedIdentifier, setMaskedIdentifier] = useState("");
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Password state
  const [email, setEmail] = useState(searchParams?.get("email") || "");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(true);
  const [showPassword, setShowPassword] = useState(false);

  // Common state
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [profileLoading, setProfileLoading] = useState(false);
  const [error, setError] = useState<string | null>(searchParams?.get("error") || null);
  const [isProfileErrorRetryable, setIsProfileErrorRetryable] = useState(false);

  // Retrieve sanitized explicit redirect parameter (preserves query & fragment)
  const explicitRedirect = searchParams?.get("redirectUrl") || searchParams?.get("next");
  const validatedRedirect = validateRedirectDestination(explicitRedirect);

  // Countdown timer effect
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (otpStep === "verify" && countdown > 0) {
      timer = setTimeout(() => setCountdown((c) => c - 1), 1000);
    } else if (countdown === 0) {
      setCanResend(true);
    }
    return () => clearTimeout(timer);
  }, [otpStep, countdown]);

  // Focus first OTP input when moving to verify step
  useEffect(() => {
    if (otpStep === "verify") {
      const timer = setTimeout(() => {
        inputRefs.current[0]?.focus();
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [otpStep]);

  // Handle Google OAuth Sign-in
  const handleGoogleSignIn = async () => {
    if (loading || googleLoading) return;
    setGoogleLoading(true);
    setError(null);
    setIsProfileErrorRetryable(false);

    try {
      const origin = typeof window !== "undefined" ? window.location.origin : "http://localhost:3000";
      const callbackUrl = new URL("/auth/callback", origin);
      if (validatedRedirect) {
        callbackUrl.searchParams.set("next", validatedRedirect);
      }

      const { data, error: oauthError } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: callbackUrl.toString(),
        },
      });

      if (oauthError) {
        throw oauthError;
      }

      if (data?.url) {
        window.location.href = data.url;
      }
    } catch (err: any) {
      console.error("[Google OAuth Error]:", err);
      setError(translateAuthError(err));
      setGoogleLoading(false);
    }
  };

  // Handle send OTP
  const handleSendOtp = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (loading || googleLoading) return;

    const cleanId = identifier.trim();
    if (!cleanId) {
      setError("Please enter your Email or Mobile Number.");
      return;
    }

    setLoading(true);
    setError(null);
    setIsProfileErrorRetryable(false);

    try {
      const res = await sendOtp(cleanId, "login");
      setMaskedIdentifier(res.maskedIdentifier || cleanId);
      setCountdown(res.cooldownSeconds || 45);
      setCanResend(false);
      setOtpDigits(Array(6).fill(""));
      setOtpStep("verify");
    } catch (err: any) {
      setError(err?.message || "Failed to dispatch verification code.");
    } finally {
      setLoading(false);
    }
  };

  // Handle OTP digit changes
  const handleOtpChange = (index: number, e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value.slice(-1);
    if (!/^\d*$/.test(val)) return;

    const newDigits = [...otpDigits];
    newDigits[index] = val;
    setOtpDigits(newDigits);

    if (val && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  // Handle OTP backspace and arrow navigation
  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace") {
      if (!otpDigits[index] && index > 0) {
        const newDigits = [...otpDigits];
        newDigits[index - 1] = "";
        setOtpDigits(newDigits);
        inputRefs.current[index - 1]?.focus();
      } else {
        const newDigits = [...otpDigits];
        newDigits[index] = "";
        setOtpDigits(newDigits);
      }
    } else if (e.key === "ArrowLeft" && index > 0) {
      inputRefs.current[index - 1]?.focus();
    } else if (e.key === "ArrowRight" && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  // Handle OTP paste
  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData("text/plain").trim();
    if (!/^\d+$/.test(pasted)) return;

    const chars = pasted.slice(0, 6).split("");
    const newDigits = Array(6).fill("");
    chars.forEach((c, i) => {
      newDigits[i] = c;
    });
    setOtpDigits(newDigits);
    const targetIdx = Math.min(chars.length, 5);
    inputRefs.current[targetIdx]?.focus();
  };

  // Handle verify OTP
  const handleVerifyOtp = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (loading || googleLoading) return;

    const fullOtp = otpDigits.join("");
    if (fullOtp.length !== 6) {
      setError("Please enter the complete 6-digit verification code.");
      return;
    }

    setLoading(true);
    setProfileLoading(true);
    setError(null);
    setIsProfileErrorRetryable(false);

    try {
      const res = await verifyOtp(identifier.trim(), fullOtp, "login");
      
      // Centralized post-sign-in resolution
      const { destination } = resolvePostSignInDestination({
        role: res.role || "CLIENT",
        requestedDestination: validatedRedirect,
      });

      router.push(destination);
    } catch (err: any) {
      const msg = err?.message || "Invalid or expired verification code.";
      setError(msg);
      if (msg.toLowerCase().includes("profile") || msg.toLowerCase().includes("network") || msg.toLowerCase().includes("retry")) {
        setIsProfileErrorRetryable(true);
      }
    } finally {
      setLoading(false);
      setProfileLoading(false);
    }
  };

  // Handle Resend OTP
  const handleResendOtp = async () => {
    if (!canResend || loading || googleLoading) return;
    await handleSendOtp();
  };

  // Handle password login
  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loading || googleLoading) return;

    if (!email || !password) {
      setError("Please enter both your email address and password.");
      return;
    }

    setLoading(true);
    setProfileLoading(true);
    setError(null);
    setIsProfileErrorRetryable(false);

    try {
      const { role, careerStage, onboardingCompleted } = await loginWithEmail(email, password);

      // Centralized post-sign-in resolution
      const { destination } = resolvePostSignInDestination({
        role: role || "CLIENT",
        onboardingCompleted,
        requestedDestination: validatedRedirect,
        careerStage,
      });

      router.push(destination);
    } catch (err: any) {
      const friendlyMsg = translateAuthError(err);
      setError(friendlyMsg);

      if (friendlyMsg.toLowerCase().includes("profile") || friendlyMsg.toLowerCase().includes("connection") || friendlyMsg.toLowerCase().includes("status")) {
        setIsProfileErrorRetryable(true);
      }

      if (friendlyMsg.includes("verify your email")) {
        setTimeout(() => {
          router.push(`/auth/verify-email?email=${encodeURIComponent(email)}`);
        }, 1800);
      }
    } finally {
      setLoading(false);
      setProfileLoading(false);
    }
  };

  return (
    <FigmaAuthLayout
      title="Sign in to Edworld"
      subtitle="Access your student dashboard, daily study timetable, and career roadmap."
      activeTab="login"
    >
      <div className="space-y-5">
        
        {/* Google OAuth Button */}
        <button
          type="button"
          onClick={handleGoogleSignIn}
          disabled={loading || googleLoading}
          className="w-full py-2.5 px-4 rounded-xl font-semibold text-xs sm:text-sm text-slate-800 bg-white border border-blue-200 hover:bg-slate-50 active:bg-slate-100 transition-all flex items-center justify-center gap-3 shadow-xs disabled:opacity-60 cursor-pointer"
        >
          {googleLoading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin text-blue-600" />
              <span>Connecting to Google...</span>
            </>
          ) : (
            <>
              <svg className="w-4 h-4" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                />
              </svg>
              <span>Continue with Google</span>
            </>
          )}
        </button>

        <div className="relative flex py-1 items-center">
          <div className="flex-grow border-t border-blue-200"></div>
          <span className="flex-shrink mx-3 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">or sign in with</span>
          <div className="flex-grow border-t border-blue-200"></div>
        </div>

        {/* Method Switcher Tabs: Email OTP (Student default) vs Password */}
        <div className="grid grid-cols-2 p-1 rounded-2xl bg-[#DBEAFE] border border-blue-200/80 text-xs font-semibold">
          <button
            type="button"
            onClick={() => { setAuthMethod("otp"); setError(null); setIsProfileErrorRetryable(false); }}
            className={`py-2 rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer ${
              authMethod === "otp"
                ? "bg-white text-slate-900 font-bold shadow-xs border border-blue-200/70"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <Smartphone className="w-3.5 h-3.5" />
            <span>Email OTP</span>
          </button>
          <button
            type="button"
            onClick={() => { setAuthMethod("password"); setError(null); setIsProfileErrorRetryable(false); }}
            className={`py-2 rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer ${
              authMethod === "password"
                ? "bg-white text-slate-900 font-bold shadow-xs border border-blue-200/70"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <Lock className="w-3.5 h-3.5" />
            <span>Password</span>
          </button>
        </div>

        {/* Error Alert Box with Retry Action */}
        {error && (
          <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-medium flex items-start gap-2.5 animate-in fade-in shadow-2xs">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
            <div className="space-y-1.5 flex-1">
              <div>{error}</div>
              
              {isProfileErrorRetryable && (
                <div className="pt-1">
                  <button
                    type="button"
                    onClick={authMethod === "password" ? handlePasswordSubmit : handleVerifyOtp}
                    disabled={loading}
                    className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-rose-100 hover:bg-rose-200 text-rose-900 font-bold text-[11px] transition-colors cursor-pointer"
                  >
                    <RefreshCw className="w-3 h-3" />
                    <span>Retry Profile Loading</span>
                  </button>
                </div>
              )}

              {error.includes("No account found") && (
                <div className="pt-0.5">
                  <Link
                    href={`/auth/signup?email=${encodeURIComponent(identifier || email)}`}
                    className="inline-flex items-center gap-1 font-bold text-rose-700 hover:text-rose-900 hover:underline"
                  >
                    Create an account now <ArrowRight className="w-3 h-3" />
                  </Link>
                </div>
              )}
              {error.includes("Incorrect password") && (
                <div className="pt-0.5">
                  <Link
                    href={`/auth/forgot-password?email=${encodeURIComponent(email)}`}
                    className="inline-flex items-center gap-1 font-bold text-[#2563EB] hover:text-[#4E4BC6] hover:underline"
                  >
                    Forgot your password? Reset it here <ArrowRight className="w-3 h-3" />
                  </Link>
                </div>
              )}
            </div>
          </div>
        )}

        {/* EMAIL OTP FLOW */}
        {authMethod === "otp" && (
          <>
            {otpStep === "request" ? (
              <form onSubmit={handleSendOtp} className="space-y-4">
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                    Email or Mobile Number
                  </label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <input
                      type="text"
                      required
                      value={identifier}
                      onChange={(e) => setIdentifier(e.target.value)}
                      placeholder="student@university.edu or +91 9876543210"
                      disabled={loading || googleLoading}
                      className="w-full pl-10 pr-4 py-2.5 sm:py-3 text-sm bg-white border border-blue-300 rounded-xl text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-[#5C59E8] focus:ring-2 focus:ring-[#5C59E8]/20 transition-all disabled:opacity-60"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading || googleLoading}
                  className="w-full py-3 px-6 rounded-xl font-bold text-sm text-white bg-[#2563EB] hover:bg-[#1D4ED8] transition-all flex items-center justify-center gap-2 shadow-sm disabled:opacity-60 cursor-pointer"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin text-white" />
                      <span>Sending Code...</span>
                    </>
                  ) : (
                    <>
                      <span>Send OTP</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </form>
            ) : (
              <form onSubmit={handleVerifyOtp} className="space-y-4">
                <div className="text-center space-y-1 pb-1">
                  <h3 className="text-sm font-bold text-slate-900">
                    Enter the 6-digit OTP
                  </h3>
                  <p className="text-xs text-slate-600">
                    Code sent to <span className="font-semibold text-slate-900">{maskedIdentifier}</span>
                  </p>
                </div>

                {/* 6-box input array */}
                <div className="flex items-center justify-between gap-2 sm:gap-3 w-full max-w-sm mx-auto">
                  {Array.from({ length: 6 }).map((_, idx) => (
                    <input
                      key={idx}
                      ref={(el) => { inputRefs.current[idx] = el; }}
                      type="text"
                      inputMode="numeric"
                      pattern="[0-9]*"
                      maxLength={1}
                      value={otpDigits[idx]}
                      onChange={(e) => handleOtpChange(idx, e)}
                      onKeyDown={(e) => handleKeyDown(idx, e)}
                      onPaste={handlePaste}
                      disabled={loading || profileLoading}
                      aria-label={`Digit ${idx + 1} of 6`}
                      className="w-11 h-13 sm:w-12 sm:h-14 text-center text-xl font-bold font-mono rounded-xl bg-white border border-blue-300 text-slate-900 focus:outline-none focus:border-[#5C59E8] focus:ring-2 focus:ring-[#5C59E8]/20 transition-all shadow-2xs disabled:opacity-60"
                    />
                  ))}
                </div>

                <div className="flex items-center justify-between text-xs pt-1">
                  <button
                    type="button"
                    onClick={() => {
                      setOtpStep("request");
                      setError(null);
                      setIsProfileErrorRetryable(false);
                    }}
                    disabled={loading || profileLoading}
                    className="font-medium text-slate-600 hover:text-slate-900 transition-colors cursor-pointer disabled:opacity-60"
                  >
                    Change email/number
                  </button>

                  {countdown > 0 ? (
                    <span className="text-slate-500">
                      Resend in <span className="font-semibold text-slate-800">{countdown}s</span>
                    </span>
                  ) : (
                    <button
                      type="button"
                      onClick={handleResendOtp}
                      disabled={loading || profileLoading}
                      className="font-bold text-[#2563EB] hover:text-[#4E4BC6] transition-colors flex items-center gap-1 cursor-pointer disabled:opacity-60"
                    >
                      <RotateCw className="w-3 h-3" />
                      <span>Resend OTP</span>
                    </button>
                  )}
                </div>

                <button
                  type="submit"
                  disabled={loading || profileLoading || otpDigits.join("").length !== 6}
                  className="w-full py-3 px-6 rounded-xl font-bold text-sm text-white bg-[#2563EB] hover:bg-[#1D4ED8] transition-all flex items-center justify-center gap-2 shadow-sm disabled:opacity-60 cursor-pointer"
                >
                  {loading || profileLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin text-white" />
                      <span>{profileLoading ? "Loading Profile..." : "Verifying Code..."}</span>
                    </>
                  ) : (
                    <>
                      <span>Sign in to Edworld</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </form>
            )}
          </>
        )}

        {/* PASSWORD FLOW */}
        {authMethod === "password" && (
          <form onSubmit={handlePasswordSubmit} className="space-y-4">
            
            {/* Email Address */}
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
                  disabled={loading || profileLoading}
                  className="w-full pl-10 pr-4 py-2.5 sm:py-3 text-sm bg-white border border-blue-300 rounded-xl text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-[#5C59E8] focus:ring-2 focus:ring-[#5C59E8]/20 transition-all disabled:opacity-60"
                />
              </div>
            </div>

            {/* Password with Show/Hide Toggle */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Password
                </label>
                <Link
                  href={`/auth/forgot-password?email=${encodeURIComponent(email)}`}
                  className="text-xs font-bold text-[#2563EB] hover:text-[#4E4BC6] hover:underline"
                >
                  Forgot password?
                </Link>
              </div>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  disabled={loading || profileLoading}
                  className="w-full pl-10 pr-11 py-2.5 sm:py-3 text-sm bg-white border border-blue-300 rounded-xl text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-[#5C59E8] focus:ring-2 focus:ring-[#5C59E8]/20 transition-all disabled:opacity-60"
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

            {/* Remember Me Option */}
            <div className="flex items-center justify-between pt-0.5">
              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  disabled={loading || profileLoading}
                  className="w-4 h-4 rounded border-blue-300 text-[#2563EB] focus:ring-[#5C59E8] cursor-pointer"
                />
                <span className="text-xs text-slate-600 font-medium">Keep me signed in for 30 days</span>
              </label>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading || profileLoading}
              className="w-full py-3 px-6 rounded-xl font-bold text-sm text-white bg-[#2563EB] hover:bg-[#1D4ED8] transition-all flex items-center justify-center gap-2 shadow-sm disabled:opacity-60 cursor-pointer"
            >
              {loading || profileLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-white" />
                  <span>{profileLoading ? "Loading Profile..." : "Signing In..."}</span>
                </>
              ) : (
                <>
                  <span>Sign in to Edworld</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>
        )}

        {/* Bottom Switcher */}
        <div className="pt-4 border-t border-blue-200 text-center">
          <p className="text-xs text-slate-600">
            Don&apos;t have an account yet?{" "}
            <Link
              href={validatedRedirect ? `/auth/signup?redirectUrl=${encodeURIComponent(validatedRedirect)}` : "/auth/signup"}
              className="font-bold text-[#2563EB] hover:text-[#4E4BC6] underline underline-offset-3"
            >
              Create free student account
            </Link>
          </p>
        </div>

      </div>
    </FigmaAuthLayout>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#F4F5FA] flex items-center justify-center">
          <div className="p-6 rounded-2xl bg-white border border-blue-200 shadow-sm flex items-center gap-3">
            <Loader2 className="w-5 h-5 animate-spin text-[#2563EB]" />
            <span className="text-sm font-semibold text-slate-800">Loading sign in...</span>
          </div>
        </div>
      }
    >
      <LoginForm />
    </Suspense>
  );
}
