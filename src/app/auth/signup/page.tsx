"use client";

import React, { useState, useEffect, useRef, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth, translateAuthError } from "@/lib/auth-context";
import { 
  ArrowRight, 
  AlertCircle, 
  Lock, 
  Check, 
  X, 
  Eye, 
  EyeOff, 
  Mail, 
  User, 
  Phone,
  Loader2,
  Gift,
  CheckCircle2,
  ShieldCheck,
  Sparkles,
  RotateCw
} from "lucide-react";
import { supabase } from "@/lib/supabase";
import FigmaAuthLayout from "@/components/auth/figma/FigmaAuthLayout";
import FloatingMyraSignupBuddy from "@/components/auth/FloatingMyraSignupBuddy";
import { CareerStage } from "@/lib/types";

function SignupForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { signupWithEmail, sendOtp, verifyOtp } = useAuth();

  const [careerStage, setCareerStage] = useState<CareerStage>("STUDENT");
  const [name, setName] = useState("");
  const [email, setEmail] = useState(searchParams?.get("email") || "");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showReferral, setShowReferral] = useState(Boolean(searchParams?.get("ref")));
  const [referralCode, setReferralCode] = useState(searchParams?.get("ref") || "");
  const [termsAgreed, setTermsAgreed] = useState(false);
  const [ageConsent, setAgeConsent] = useState(false);

  // Email OTP state for student verification
  const [signupStep, setSignupStep] = useState<"details" | "verify_otp">("details");
  const [otpDigits, setOtpDigits] = useState<string[]>(Array(6).fill(""));
  const [countdown, setCountdown] = useState(45);
  const [canResend, setCanResend] = useState(false);
  const [maskedEmail, setMaskedEmail] = useState("");
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  const [loading, setLoading] = useState(false);
  const [accountCreated, setAccountCreated] = useState(false);
  const [loadingStep, setLoadingStep] = useState("Creating your workspace...");
  const [error, setError] = useState<string | null>(null);

  // Countdown timer effect
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (signupStep === "verify_otp" && countdown > 0) {
      timer = setTimeout(() => setCountdown((c) => c - 1), 1000);
    } else if (countdown === 0) {
      setCanResend(true);
    }
    return () => clearTimeout(timer);
  }, [signupStep, countdown]);

  // Focus first OTP input when moving to verify step
  useEffect(() => {
    if (signupStep === "verify_otp") {
      const timer = setTimeout(() => {
        inputRefs.current[0]?.focus();
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [signupStep]);

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

  // Password validation & strength calculations
  const hasMinLen = password.length >= 8;
  const hasLetter = /[a-zA-Z]/.test(password);
  const hasNumber = /[0-9]/.test(password);
  const hasSpecial = /[^a-zA-Z0-9]/.test(password);
  const isPasswordValid = hasMinLen && hasLetter && hasNumber;
  const passwordsMatch = password === confirmPassword && confirmPassword.length > 0;

  // Strength Score 0 to 4
  const strengthScore = [
    hasMinLen,
    hasLetter && hasNumber,
    hasSpecial || password.length >= 12,
    passwordsMatch,
  ].filter(Boolean).length;

  const strengthLabels = ["Enter Password", "Weak", "Fair", "Good", "Strong"];
  const strengthColors = [
    "bg-slate-200",
    "bg-rose-500",
    "bg-amber-500",
    "bg-blue-500",
    "bg-emerald-500",
  ];

  // Step 1: Submit details and dispatch Resend OTP
  const handleDetailsSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!termsAgreed) {
      setError("Please agree to the Terms of Service, Privacy Policy, and Refund Policy.");
      return;
    }
    if (!ageConsent) {
      setError("Please confirm your age eligibility / guardian consent to proceed.");
      return;
    }
    if (!isPasswordValid) {
      setError("Password must be at least 8 characters long and contain both letters and numbers.");
      return;
    }
    if (!passwordsMatch) {
      setError("Passwords do not match.");
      return;
    }

    try {
      setLoading(true);
      setError(null);
      setLoadingStep("Sending verification code via Resend...");
      const res = await sendOtp(email.trim().toLowerCase(), "signup");
      setMaskedEmail(res.maskedIdentifier || email.trim().toLowerCase());
      setCountdown(res.cooldownSeconds || 45);
      setCanResend(false);
      setOtpDigits(Array(6).fill(""));
      setSignupStep("verify_otp");
    } catch (err: any) {
      const friendlyMsg = translateAuthError(err);
      setError(friendlyMsg);
    } finally {
      setLoading(false);
    }
  };

  // Resend OTP
  const handleResendOtp = async () => {
    if (!canResend || loading) return;
    try {
      setLoading(true);
      setError(null);
      const res = await sendOtp(email.trim().toLowerCase(), "signup");
      setCountdown(res.cooldownSeconds || 45);
      setCanResend(false);
    } catch (err: any) {
      setError(err?.message || "Failed to resend verification code.");
    } finally {
      setLoading(false);
    }
  };

  // Step 2: Verify OTP and create student profile
  const handleVerifyAndCreateAccount = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const fullOtp = otpDigits.join("");
    if (fullOtp.length !== 6) {
      setError("Please enter the complete 6-digit verification code.");
      return;
    }

    try {
      setLoading(true);
      setError(null);
      setLoadingStep("Verifying code...");

      // 1. Verify OTP with backend
      await verifyOtp(email.trim().toLowerCase(), fullOtp, "signup", {
        name: name.trim(),
        careerStage,
        phone: phone.trim() || undefined,
      });

      // 2. Finalize account creation & GoTrue session
      setLoadingStep("Creating your student workspace...");
      try {
        await signupWithEmail(
          name.trim(),
          email.trim().toLowerCase(),
          password,
          undefined,
          undefined,
          phone.trim() || undefined,
          careerStage
        );
      } catch (signupErr: any) {
        console.warn("[Signup sync notice]:", signupErr?.message);
      }

      // 3. Record referral if present
      if (referralCode.trim()) {
        setLoadingStep("Applying campus ambassador perks...");
        try {
          const { data: authData } = await supabase.auth.getUser();
          const userId = authData?.user?.id;
          if (userId) {
            await fetch("/api/ambassador/record-referral", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                referralCode: referralCode.trim(),
                newUserId: userId,
              }),
            });
          }
        } catch (refErr) {
          console.error("Failed to record referral:", refErr);
        }
      }

      setAccountCreated(true);
      setTimeout(() => {
        router.push("/onboarding");
      }, 1800);
    } catch (err: any) {
      const friendlyMsg = translateAuthError(err);
      setError(friendlyMsg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <FigmaAuthLayout
        title="Join EdWorld Co."
        subtitle="Built for learners, students, and engineers. Set up your profile, ATS resume, and AI interview practice."
        activeTab="signup"
      >
        <div className="space-y-4">
          
          {/* Success Message Banner */}
          {accountCreated ? (
            <div className="p-8 rounded-3xl liquid-glass-card bg-emerald-50/90 border border-emerald-300 text-center space-y-3 animate-in zoom-in-95 shadow-lg">
              <div className="w-14 h-14 rounded-2xl bg-emerald-600 text-white flex items-center justify-center mx-auto shadow-md">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <h3 className="font-extrabold text-xl text-emerald-950">
                Welcome to EdWorld, {name.split(" ")[0]}!
              </h3>
              <p className="text-xs sm:text-sm text-emerald-800 max-w-sm mx-auto">
                Your workspace is ready. Launching your personalized diagnostic questionnaire...
              </p>
              <div className="pt-2">
                <Loader2 className="w-5 h-5 animate-spin text-emerald-600 mx-auto" />
              </div>
            </div>
          ) : (
            <>
              {/* Error Banner */}
              {error && (
                <div className="p-3.5 rounded-2xl bg-rose-950/70 border border-rose-500/40 text-rose-200 text-xs font-medium flex items-start gap-2.5 animate-in fade-in shadow-xs">
                  <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                  <div className="flex-1">{error}</div>
                </div>
              )}

              {signupStep === "details" ? (
                <form onSubmit={handleDetailsSubmit} className="space-y-3.5">
                
                {/* Full Name */}
                <div className="space-y-1">
                  <label className="block text-xs font-bold text-slate-200 uppercase tracking-wider">
                    Full Name
                  </label>
                  <div className="relative">
                    <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <input
                      type="text"
                      required
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Jane Doe"
                      className="w-full pl-10 pr-4 py-2.5 sm:py-3 text-sm bg-[#0F1422] border border-white/15 rounded-xl text-white placeholder:text-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/30 transition-all"
                    />
                  </div>
                </div>

                {/* Email Address & Phone Row */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1">
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
                        placeholder="jane@university.edu"
                        className="w-full pl-10 pr-4 py-2.5 sm:py-3 text-sm bg-[#0F1422] border border-white/15 rounded-xl text-white placeholder:text-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/30 transition-all"
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="block text-xs font-bold text-slate-200 uppercase tracking-wider">
                      WhatsApp Mobile <span className="text-[10px] text-slate-400 font-normal">(Optional)</span>
                    </label>
                    <div className="relative">
                      <Phone className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                      <input
                        type="tel"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        placeholder="+91 98765 43210"
                        className="w-full pl-10 pr-4 py-2.5 sm:py-3 text-sm bg-[#0F1422] border border-white/15 rounded-xl text-white placeholder:text-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/30 transition-all"
                      />
                    </div>
                  </div>
                </div>

                {/* Password & Confirm Password Row */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="block text-xs font-bold text-slate-200 uppercase tracking-wider">
                      Create Password
                    </label>
                    <div className="relative">
                      <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                      <input
                        type={showPassword ? "text" : "password"}
                        required
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="8+ chars with numbers"
                        className="w-full pl-10 pr-10 py-2.5 sm:py-3 text-sm bg-[#0F1422] border border-white/15 rounded-xl text-white placeholder:text-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/30 transition-all"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200 transition-colors cursor-pointer"
                        title={showPassword ? "Hide password" : "Show password"}
                      >
                        {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="block text-xs font-bold text-slate-200 uppercase tracking-wider">
                      Confirm Password
                    </label>
                    <div className="relative">
                      <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                      <input
                        type={showPassword ? "text" : "password"}
                        required
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        placeholder="Re-type password"
                        className="w-full pl-10 pr-4 py-2.5 sm:py-3 text-sm bg-[#0F1422] border border-white/15 rounded-xl text-white placeholder:text-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/30 transition-all"
                      />
                    </div>
                  </div>
                </div>

                {/* Animated Password Strength Bar & Checks */}
                {password.length > 0 && (
                  <div className="p-3.5 rounded-2xl bg-[#0F1422] border border-white/10 space-y-2.5 animate-in fade-in">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-slate-300 font-medium text-[11px]">Password Security:</span>
                      <span className={`font-bold text-[11px] ${
                        strengthScore >= 3 ? "text-emerald-400" : strengthScore === 2 ? "text-cyan-400" : "text-amber-400"
                      }`}>
                        {strengthLabels[strengthScore] || "Moderate"}
                      </span>
                    </div>

                    {/* 4 Segment Progress Bar */}
                    <div className="grid grid-cols-4 gap-1.5 h-1.5">
                      {[1, 2, 3, 4].map((seg) => (
                        <div
                          key={seg}
                          className={`h-full rounded-full transition-all duration-300 ${
                            strengthScore >= seg ? strengthColors[strengthScore] : "bg-white/10"
                          }`}
                        />
                      ))}
                    </div>

                    {/* Criteria checklist */}
                    <div className="grid grid-cols-2 gap-x-2 gap-y-1 pt-1 text-[11px]">
                      <div className="flex items-center gap-1.5">
                        {hasMinLen ? <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" /> : <X className="w-3.5 h-3.5 text-slate-500 shrink-0" />}
                        <span className={hasMinLen ? "text-emerald-300 font-semibold" : "text-slate-400"}>At least 8 characters</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        {hasLetter && hasNumber ? <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" /> : <X className="w-3.5 h-3.5 text-slate-500 shrink-0" />}
                        <span className={hasLetter && hasNumber ? "text-emerald-300 font-semibold" : "text-slate-400"}>Letters and numbers</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        {passwordsMatch ? <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" /> : <X className="w-3.5 h-3.5 text-slate-500 shrink-0" />}
                        <span className={passwordsMatch ? "text-emerald-300 font-semibold" : "text-slate-400"}>Passwords match</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        {hasSpecial ? <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" /> : <div className="w-3.5 h-3.5 rounded-full border border-white/20 shrink-0" />}
                        <span className={hasSpecial ? "text-emerald-300 font-semibold" : "text-slate-400"}>Symbol (Bonus)</span>
                      </div>
                    </div>
                  </div>
                )}

                {/* Campus Ambassador Referral Code Drawer */}
                <div className="pt-0.5">
                  {!showReferral ? (
                    <button
                      type="button"
                      onClick={() => setShowReferral(true)}
                      className="inline-flex items-center gap-1.5 text-xs text-indigo-400 hover:text-indigo-300 font-semibold transition-colors cursor-pointer"
                    >
                      <Gift className="w-3.5 h-3.5 text-indigo-400" />
                      <span>Have a campus ambassador referral code?</span>
                    </button>
                  ) : (
                    <div className="space-y-1 animate-in fade-in">
                      <div className="flex items-center justify-between">
                        <label className="block text-xs font-bold text-slate-200 uppercase tracking-wider">
                          Ambassador Referral Code
                        </label>
                        <button
                          type="button"
                          onClick={() => {
                            setShowReferral(false);
                            setReferralCode("");
                          }}
                          className="text-[10px] text-slate-400 hover:text-slate-200 cursor-pointer"
                        >
                          Remove
                        </button>
                      </div>
                      <div className="relative">
                        <Gift className="w-4 h-4 text-indigo-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                        <input
                          type="text"
                          value={referralCode}
                          onChange={(e) => setReferralCode(e.target.value)}
                          placeholder="e.g. CAMPUS-2026-VIP"
                          className="w-full pl-10 pr-4 py-2 text-xs sm:text-sm bg-[#0F1422] border border-indigo-400/30 rounded-xl text-white uppercase placeholder:normal-case font-mono focus:border-indigo-400"
                        />
                      </div>
                    </div>
                  )}
                </div>

                {/* Terms & Age Eligibility Checkboxes */}
                <div className="space-y-2 pt-1 border-t border-white/10">
                  <label className="flex items-start gap-2.5 cursor-pointer text-xs text-slate-300">
                    <input
                      type="checkbox"
                      required
                      checked={termsAgreed}
                      onChange={(e) => setTermsAgreed(e.target.checked)}
                      className="mt-0.5 w-4 h-4 rounded border-white/20 bg-[#0F1422] text-indigo-500 focus:ring-indigo-500 cursor-pointer"
                    />
                    <span>
                      I agree to the{" "}
                      <Link href="/terms" target="_blank" className="font-bold text-cyan-400 hover:text-cyan-300 underline underline-offset-2">
                        Terms of Service
                      </Link>
                      {" "}and{" "}
                      <Link href="/privacy" target="_blank" className="font-bold text-cyan-400 hover:text-cyan-300 underline underline-offset-2">
                        Privacy Policy
                      </Link>.
                    </span>
                  </label>

                  <label className="flex items-start gap-2.5 cursor-pointer text-xs text-slate-300">
                    <input
                      type="checkbox"
                      required
                      checked={ageConsent}
                      onChange={(e) => setAgeConsent(e.target.checked)}
                      className="mt-0.5 w-4 h-4 rounded border-white/20 bg-[#0F1422] text-indigo-500 focus:ring-indigo-500 cursor-pointer"
                    />
                    <span>
                      I confirm I am 18+ or have parental / guardian consent to register on EdWorld Co.
                    </span>
                  </label>
                </div>

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3.5 px-6 rounded-xl font-bold text-sm text-white transition-all flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/25 disabled:opacity-60 cursor-pointer bg-gradient-to-r from-emerald-600 via-teal-600 to-indigo-600 hover:from-emerald-500 hover:to-indigo-500"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin text-white" />
                      <span>{loadingStep}</span>
                    </>
                  ) : (
                    <>
                      <span>Verify Email & Create Account</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>

              </form>
            ) : (
              <form onSubmit={handleVerifyAndCreateAccount} className="space-y-4">
                <div className="text-center space-y-1 pb-1">
                  <h3 className="text-base font-bold text-white">
                    Verify Your Email Address
                  </h3>
                  <p className="text-xs text-slate-300">
                    We&apos;ve sent a 6-digit verification code via Resend to{" "}
                    <span className="font-semibold text-emerald-400">{maskedEmail || email}</span>
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
                      className="w-11 h-13 sm:w-12 sm:h-14 text-center text-xl font-bold font-mono rounded-xl bg-[#0F1422] border border-white/20 text-white focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/30 transition-all"
                    />
                  ))}
                </div>

                <div className="flex items-center justify-between text-xs pt-1">
                  <button
                    type="button"
                    onClick={() => {
                      setSignupStep("details");
                      setError(null);
                    }}
                    className="font-medium text-slate-400 hover:text-white transition-colors cursor-pointer"
                  >
                    Edit registration details
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
                  className="w-full py-3.5 px-6 rounded-xl font-bold text-sm text-white transition-all flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/25 disabled:opacity-60 cursor-pointer bg-gradient-to-r from-emerald-600 via-teal-600 to-indigo-600 hover:from-emerald-500 hover:to-indigo-500"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin text-white" />
                      <span>{loadingStep}</span>
                    </>
                  ) : (
                    <>
                      <span>Confirm & Launch Workspace</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </form>
            )}

              {/* Bottom Switcher */}
              <div className="pt-3 border-t border-white/10 text-center">
                <p className="text-xs text-slate-400">
                  Already have an account?{" "}
                  <Link
                    href="/auth/login"
                    className="font-bold text-cyan-400 hover:text-cyan-300 underline underline-offset-3"
                  >
                    Sign in here
                  </Link>
                </p>
              </div>
            </>
          )}

        </div>
      </FigmaAuthLayout>
      <FloatingMyraSignupBuddy />
    </>
  );
}

export default function SignupPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center">
          <div className="p-6 rounded-2xl liquid-glass-card bg-white/80 border-white/90 shadow-lg flex items-center gap-3">
            <Loader2 className="w-6 h-6 animate-spin text-slate-900" />
            <span className="text-sm font-semibold text-slate-800">Loading sign up...</span>
          </div>
        </div>
      }
    >
      <SignupForm />
    </Suspense>
  );
}
