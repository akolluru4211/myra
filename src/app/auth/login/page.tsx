"use client";

import React, { useState, useEffect, useRef, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth, translateAuthError } from "@/lib/auth-context";
import { 
  ArrowRight, 
  AlertCircle, 
  Lock,
  Eye,
  EyeOff,
  Mail,
  Loader2,
  Smartphone,
  RotateCw
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
  const [error, setError] = useState<string | null>(null);

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

  // Handle send OTP
  const handleSendOtp = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const cleanId = identifier.trim();
    if (!cleanId) {
      setError("Please enter your Email or Mobile Number.");
      return;
    }

    setLoading(true);
    setError(null);
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
    const fullOtp = otpDigits.join("");
    if (fullOtp.length !== 6) {
      setError("Please enter the complete 6-digit verification code.");
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const res = await verifyOtp(identifier.trim(), fullOtp, "login");
      const explicitRedirect = searchParams?.get("redirectUrl");
      if (explicitRedirect && !explicitRedirect.startsWith("/auth") && !explicitRedirect.startsWith("/login")) {
        router.push(explicitRedirect);
        return;
      }
      router.push(res.redirectUrl || "/dashboard");
    } catch (err: any) {
      setError(err?.message || "Invalid or expired verification code.");
    } finally {
      setLoading(false);
    }
  };

  // Handle Resend OTP
  const handleResendOtp = async () => {
    if (!canResend || loading) return;
    await handleSendOtp();
  };

  // Handle password login
  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setError("Please enter both your email address and password.");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const { role, redirectUrl, onboardingCompleted } = await loginWithEmail(email, password);
      
      const explicitRedirect = searchParams?.get("redirectUrl");
      if (explicitRedirect && !explicitRedirect.startsWith("/auth") && !explicitRedirect.startsWith("/login")) {
        router.push(explicitRedirect);
        return;
      }

      if (role && role !== "CLIENT") {
        router.push(redirectUrl);
      } else if (onboardingCompleted === false) {
        router.push("/onboarding");
      } else {
        router.push(redirectUrl || "/dashboard");
      }
    } catch (err: any) {
      const friendlyMsg = translateAuthError(err);
      setError(friendlyMsg);
      if (friendlyMsg.includes("verify your email")) {
        setTimeout(() => {
          router.push(`/auth/verify-email?email=${encodeURIComponent(email)}`);
        }, 1800);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <FigmaAuthLayout
      title="Sign in to Edworld"
      subtitle="Sign in to access your student dashboard, mock interviews, and ATS resume studio."
      activeTab="login"
    >
      <div className="space-y-5">
        
        {/* Method Switcher Tabs: Email OTP (Student default) vs Password */}
        <div className="grid grid-cols-2 p-1 rounded-2xl bg-black/40 border border-white/10 text-xs font-semibold">
          <button
            type="button"
            onClick={() => { setAuthMethod("otp"); setError(null); }}
            className={`py-2 rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer ${
              authMethod === "otp"
                ? "bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-bold shadow-md shadow-indigo-500/25"
                : "text-slate-400 hover:text-white"
            }`}
          >
            <Smartphone className="w-3.5 h-3.5" />
            <span>Email OTP</span>
          </button>
          <button
            type="button"
            onClick={() => { setAuthMethod("password"); setError(null); }}
            className={`py-2 rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer ${
              authMethod === "password"
                ? "bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-bold shadow-md shadow-indigo-500/25"
                : "text-slate-400 hover:text-white"
            }`}
          >
            <Lock className="w-3.5 h-3.5" />
            <span>Password</span>
          </button>
        </div>

        {/* Error Alert Box */}
        {error && (
          <div className="p-3.5 rounded-2xl bg-rose-950/70 border border-rose-500/40 text-rose-200 text-xs font-medium flex items-start gap-2.5 animate-in fade-in shadow-xs">
            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
            <div className="space-y-1.5 flex-1">
              <div>{error}</div>
              {error.includes("No account found") && (
                <div className="pt-0.5">
                  <Link
                    href={`/auth/signup?email=${encodeURIComponent(identifier || email)}`}
                    className="inline-flex items-center gap-1 font-bold text-rose-400 hover:text-rose-300 hover:underline"
                  >
                    Create an account now <ArrowRight className="w-3 h-3" />
                  </Link>
                </div>
              )}
              {error.includes("Incorrect password") && (
                <div className="pt-0.5">
                  <Link
                    href={`/auth/forgot-password?email=${encodeURIComponent(email)}`}
                    className="inline-flex items-center gap-1 font-bold text-cyan-400 hover:text-cyan-300 hover:underline"
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
                  <label className="block text-xs font-bold text-slate-200 uppercase tracking-wider">
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
                      className="w-full pl-10 pr-4 py-3 text-sm bg-[#0F1422] border border-white/15 rounded-xl text-white placeholder:text-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/30 transition-all"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3.5 px-6 rounded-xl font-bold text-sm text-white bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 transition-all flex items-center justify-center gap-2 shadow-lg shadow-indigo-500/25 disabled:opacity-60 cursor-pointer"
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
                  <h3 className="text-sm font-bold text-white">
                    Enter the 6-digit OTP
                  </h3>
                  <p className="text-xs text-slate-400">
                    Code sent to <span className="font-semibold text-emerald-400">{maskedIdentifier}</span>
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
                      disabled={loading}
                      aria-label={`Digit ${idx + 1} of 6`}
                      className="w-11 h-13 sm:w-12 sm:h-14 text-center text-xl font-bold font-mono rounded-xl bg-[#0F1422] border border-white/20 text-white focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/30 transition-all"
                    />
                  ))}
                </div>

                <div className="flex items-center justify-between text-xs pt-1">
                  <button
                    type="button"
                    onClick={() => {
                      setOtpStep("request");
                      setError(null);
                    }}
                    className="font-medium text-slate-400 hover:text-white transition-colors cursor-pointer"
                  >
                    Change email/number
                  </button>

                  {countdown > 0 ? (
                    <span className="text-slate-400">
                      Resend in <span className="font-semibold text-cyan-400">{countdown}s</span>
                    </span>
                  ) : (
                    <button
                      type="button"
                      onClick={handleResendOtp}
                      disabled={loading}
                      className="font-bold text-emerald-400 hover:text-emerald-300 transition-colors flex items-center gap-1 cursor-pointer"
                    >
                      <RotateCw className="w-3 h-3" />
                      <span>Resend OTP</span>
                    </button>
                  )}
                </div>

                <button
                  type="submit"
                  disabled={loading || otpDigits.join("").length !== 6}
                  className="w-full py-3.5 px-6 rounded-xl font-bold text-sm text-white bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 transition-all flex items-center justify-center gap-2 shadow-lg shadow-indigo-500/25 disabled:opacity-60 cursor-pointer"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin text-white" />
                      <span>Verifying...</span>
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
            </div>

            {/* Password with Show/Hide Toggle */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="block text-xs font-bold text-slate-200 uppercase tracking-wider">
                  Password
                </label>
                <Link
                  href={`/auth/forgot-password?email=${encodeURIComponent(email)}`}
                  className="text-xs font-semibold text-cyan-400 hover:text-cyan-300 transition-colors"
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
                  className="w-full pl-10 pr-11 py-3 text-sm bg-[#0F1422] border border-white/15 rounded-xl text-white placeholder:text-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/30 transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200 transition-colors cursor-pointer"
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
                  className="w-4 h-4 rounded border-white/20 bg-[#0F1422] text-indigo-500 focus:ring-indigo-500 cursor-pointer"
                />
                <span className="text-xs text-slate-300 font-medium">Keep me signed in for 30 days</span>
              </label>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 px-6 rounded-xl font-bold text-sm text-white bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 transition-all flex items-center justify-center gap-2 shadow-lg shadow-indigo-500/25 disabled:opacity-60 cursor-pointer"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-white" />
                  <span>Authenticating Workspace...</span>
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
        <div className="pt-4 border-t border-white/10 text-center">
          <p className="text-xs text-slate-400">
            Don&apos;t have an account yet?{" "}
            <Link
              href="/auth/signup"
              className="font-bold text-emerald-400 hover:text-emerald-300 underline underline-offset-3"
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
        <div className="min-h-screen flex items-center justify-center">
          <div className="p-6 rounded-2xl liquid-glass-card bg-white/80 border-white/90 shadow-lg flex items-center gap-3">
            <Loader2 className="w-6 h-6 animate-spin text-slate-900" />
            <span className="text-sm font-semibold text-slate-800">Loading sign in...</span>
          </div>
        </div>
      }
    >
      <LoginForm />
    </Suspense>
  );
}
