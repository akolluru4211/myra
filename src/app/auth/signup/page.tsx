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
  RotateCw
} from "lucide-react";
import { supabase } from "@/lib/supabase";
import FigmaAuthLayout from "@/components/auth/figma/FigmaAuthLayout";
import { CareerStage } from "@/lib/types";

function SignupForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { signupWithEmail, sendOtp, verifyOtp } = useAuth();

  const [careerStage] = useState<CareerStage>("STUDENT");
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
  const [birthDate, setBirthDate] = useState("");
  const [wantsEdMail, setWantsEdMail] = useState(false);
  const [edMailHandle, setEdMailHandle] = useState("");
  const [edMailAvailable, setEdMailAvailable] = useState<boolean | null>(null);
  const [checkingEdMail, setCheckingEdMail] = useState(false);

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

  // Check EdMail handle availability during signup
  useEffect(() => {
    if (!wantsEdMail || !edMailHandle || edMailHandle.length < 3) {
      setEdMailAvailable(null);
      return;
    }
    const timer = setTimeout(async () => {
      setCheckingEdMail(true);
      try {
        const res = await fetch(`/api/edmail/check-username?username=${encodeURIComponent(edMailHandle)}`);
        const data = await res.json();
        setEdMailAvailable(data.available);
      } catch {
        setEdMailAvailable(false);
      } finally {
        setCheckingEdMail(false);
      }
    }, 350);
    return () => clearTimeout(timer);
  }, [wantsEdMail, edMailHandle]);

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

  // Password requirements calculation
  const hasMinLen = password.length >= 8;
  const hasLetter = /[a-zA-Z]/.test(password);
  const hasNumber = /\d/.test(password);
  const hasSpecial = /[^a-zA-Z0-9]/.test(password);
  const passwordsMatch = password.length > 0 && password === confirmPassword;
  const isPasswordValid = hasMinLen && hasLetter && hasNumber;

  // Strength score: 0 to 4
  const strengthScore = [hasMinLen, hasLetter, hasNumber, hasSpecial].filter(Boolean).length;
  const strengthLabels = ["Weak", "Fair", "Good", "Strong", "Excellent"];
  const strengthColors = [
    "bg-slate-200",
    "bg-rose-500",
    "bg-amber-500",
    "bg-[#292825]",
    "bg-emerald-500",
  ];

  // Step 1: Submit details and dispatch Resend OTP
  const handleDetailsSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!termsAgreed) {
      setError("Please agree to the Terms of Service and Privacy Policy.");
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
      setLoadingStep("Sending verification code...");
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
          birthDate || undefined,
          undefined,
          phone.trim() || undefined,
          careerStage
        );
      } catch (signupErr: any) {
        console.warn("[Signup sync notice]:", signupErr?.message);
      }

      // Optional: Provision EdMail if selected by student
      if (wantsEdMail && edMailHandle.trim()) {
        setLoadingStep("Provisioning your EdMail student address...");
        try {
          await fetch("/api/edmail/mailbox", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              username: edMailHandle.trim().toLowerCase(),
              guardianConsent: ageConsent,
            }),
          });
        } catch (edMailErr) {
          console.warn("[EdMail signup provisioning notice]:", edMailErr);
        }
      }

      // 3. Record referral if present
      if (referralCode.trim()) {
        setLoadingStep("Applying ambassador referral...");
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
      }, 1500);
    } catch (err: any) {
      const friendlyMsg = translateAuthError(err);
      setError(friendlyMsg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <FigmaAuthLayout
      title="Create your account"
      subtitle="Use your email to set up your student account."
      activeTab="signup"
    >
      <div className="space-y-4">

        {/* Success Message Banner */}
        {accountCreated ? (
          <div className="p-8 rounded-3xl bg-emerald-50 border border-emerald-200 text-center space-y-3 animate-in zoom-in-95 shadow-xs">
            <div className="w-12 h-12 rounded-2xl bg-emerald-600 text-white flex items-center justify-center mx-auto shadow-sm">
              <CheckCircle2 className="w-7 h-7" />
            </div>
            <h3 className="font-extrabold text-xl text-emerald-950 font-display">
              Welcome to Edworld, {name.split(" ")[0]}!
            </h3>
            <p className="text-xs sm:text-sm text-emerald-800 max-w-sm mx-auto">
              Your account has been verified. Redirecting to onboarding...
            </p>
            <div className="pt-2">
              <Loader2 className="w-5 h-5 animate-spin text-emerald-600 mx-auto" />
            </div>
          </div>
        ) : (
          <>
            {/* Error Banner */}
            {error && (
              <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-medium flex items-start gap-2.5 animate-in fade-in shadow-2xs">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                <div className="flex-1">{error}</div>
              </div>
            )}

            {signupStep === "details" ? (
              <form onSubmit={handleDetailsSubmit} className="space-y-3.5">

                {/* Full Name */}
                <div className="space-y-1">
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
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
                      className="w-full pl-10 pr-4 py-2.5 sm:py-3 text-sm bg-white border border-neutral-300 rounded-xl text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-[#57534e] focus:ring-2 focus:ring-[#57534e]/20 transition-all"
                    />
                  </div>
                </div>

                {/* Email Address & Phone Row */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1">
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
                        placeholder="jane@university.edu"
                        className="w-full pl-10 pr-4 py-2.5 sm:py-3 text-sm bg-white border border-neutral-300 rounded-xl text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-[#57534e] focus:ring-2 focus:ring-[#57534e]/20 transition-all"
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                      Mobile Number <span className="text-[10px] text-slate-400 font-normal">(Optional)</span>
                    </label>
                    <div className="relative">
                      <Phone className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                      <input
                        type="tel"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        placeholder="+91 98765 43210"
                        className="w-full pl-10 pr-4 py-2.5 sm:py-3 text-sm bg-white border border-neutral-300 rounded-xl text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-[#57534e] focus:ring-2 focus:ring-[#57534e]/20 transition-all"
                      />
                    </div>
                  </div>
                </div>

                {/* Password & Confirm Password Row */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
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
                        className="w-full pl-10 pr-10 py-2.5 sm:py-3 text-sm bg-white border border-neutral-300 rounded-xl text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-[#57534e] focus:ring-2 focus:ring-[#57534e]/20 transition-all"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
                        title={showPassword ? "Hide password" : "Show password"}
                      >
                        {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
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
                        className="w-full pl-10 pr-4 py-2.5 sm:py-3 text-sm bg-white border border-neutral-300 rounded-xl text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-[#57534e] focus:ring-2 focus:ring-[#57534e]/20 transition-all"
                      />
                    </div>
                  </div>
                </div>

                {/* Password Strength Checklist */}
                {password.length > 0 && (
                  <div className="p-3.5 rounded-2xl bg-[#f7f6f4] border border-neutral-200/90 space-y-2 animate-in fade-in">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-slate-600 font-medium text-[11px]">Password Strength:</span>
                      <span className={`font-bold text-[11px] ${
                        strengthScore >= 3 ? "text-emerald-700" : strengthScore === 2 ? "text-[#292825]" : "text-amber-700"
                      }`}>
                        {strengthLabels[strengthScore] || "Moderate"}
                      </span>
                    </div>

                    {/* Progress Bar */}
                    <div className="grid grid-cols-4 gap-1.5 h-1.5">
                      {[1, 2, 3, 4].map((seg) => (
                        <div
                          key={seg}
                          className={`h-full rounded-full transition-all duration-300 ${
                            strengthScore >= seg ? strengthColors[strengthScore] : "bg-slate-200"
                          }`}
                        />
                      ))}
                    </div>

                    {/* Criteria checklist */}
                    <div className="grid grid-cols-2 gap-x-2 gap-y-1 pt-1 text-[11px]">
                      <div className="flex items-center gap-1.5">
                        {hasMinLen ? <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" /> : <X className="w-3.5 h-3.5 text-slate-400 shrink-0" />}
                        <span className={hasMinLen ? "text-emerald-800 font-semibold" : "text-slate-500"}>At least 8 characters</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        {hasLetter && hasNumber ? <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" /> : <X className="w-3.5 h-3.5 text-slate-400 shrink-0" />}
                        <span className={hasLetter && hasNumber ? "text-emerald-800 font-semibold" : "text-slate-500"}>Letters and numbers</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        {passwordsMatch ? <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" /> : <X className="w-3.5 h-3.5 text-slate-400 shrink-0" />}
                        <span className={passwordsMatch ? "text-emerald-800 font-semibold" : "text-slate-500"}>Passwords match</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        {hasSpecial ? <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" /> : <div className="w-3.5 h-3.5 rounded-full border border-neutral-300 shrink-0" />}
                        <span className={hasSpecial ? "text-emerald-800 font-semibold" : "text-slate-500"}>Symbol (Optional)</span>
                      </div>
                    </div>
                  </div>
                )}

                {/* Optional: Create my EdMail Step */}
                <div className="p-3.5 rounded-2xl bg-indigo-50/50 border border-indigo-100/90 space-y-2.5">
                  <label className="flex items-start gap-2.5 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={wantsEdMail}
                      onChange={(e) => {
                        setWantsEdMail(e.target.checked);
                        if (!edMailHandle && name) {
                          setEdMailHandle(name.toLowerCase().replace(/[^a-z0-9]/g, "").slice(0, 15));
                        }
                      }}
                      className="mt-0.5 w-4 h-4 rounded border-neutral-300 text-[#292825] focus:ring-[#57534e] cursor-pointer"
                    />
                    <div className="flex-1 text-xs text-slate-700">
                      <div className="font-bold flex items-center gap-1.5 text-slate-900">
                        <Mail className="w-3.5 h-3.5 text-[#292825]" />
                        <span>Create my EdMail address (Optional)</span>
                      </div>
                      <p className="text-[11px] text-slate-500 font-normal">
                        Claim an official <strong>@edworld.co.in</strong> address for student webmail, study documents, and verified perks. You can skip this and activate later.
                      </p>
                    </div>
                  </label>

                  {wantsEdMail && (
                    <div className="pt-1.5 space-y-1.5 animate-in fade-in">
                      <div className="flex items-center rounded-xl border border-neutral-300 bg-white focus-within:border-[#57534e] focus-within:ring-2 focus-within:ring-[#57534e]/20 overflow-hidden">
                        <input
                          type="text"
                          value={edMailHandle}
                          onChange={(e) => setEdMailHandle(e.target.value.toLowerCase())}
                          placeholder="e.g. adarsh.cs"
                          className="flex-1 px-3 py-2 text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none"
                        />
                        <span className="px-2.5 py-2 bg-[#f7f6f4] text-slate-500 font-semibold text-xs border-l border-neutral-200">
                          @edworld.co.in
                        </span>
                      </div>

                      {checkingEdMail && (
                        <div className="flex items-center gap-1.5 text-[11px] text-slate-500">
                          <Loader2 className="w-3 h-3 animate-spin" />
                          <span>Checking availability...</span>
                        </div>
                      )}

                      {edMailAvailable === true && (
                        <div className="flex items-center gap-1.5 text-[11px] text-emerald-700 font-semibold">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                          <span>{edMailHandle}@edworld.co.in is available!</span>
                        </div>
                      )}

                      {edMailAvailable === false && (
                        <div className="flex items-center gap-1.5 text-[11px] text-rose-700 font-semibold">
                          <AlertCircle className="w-3.5 h-3.5 text-rose-600" />
                          <span>Username is taken or reserved.</span>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Referral Code Drawer */}
                <div className="pt-0.5">
                  {!showReferral ? (
                    <button
                      type="button"
                      onClick={() => setShowReferral(true)}
                      className="inline-flex items-center gap-1.5 text-xs text-[#292825] hover:text-[#44403c] font-semibold transition-colors cursor-pointer"
                    >
                      <Gift className="w-3.5 h-3.5 text-[#292825]" />
                      <span>Have an ambassador referral code?</span>
                    </button>
                  ) : (
                    <div className="space-y-1 animate-in fade-in">
                      <div className="flex items-center justify-between">
                        <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                          Referral Code
                        </label>
                        <button
                          type="button"
                          onClick={() => {
                            setShowReferral(false);
                            setReferralCode("");
                          }}
                          className="text-[10px] text-slate-500 hover:text-slate-700 cursor-pointer"
                        >
                          Remove
                        </button>
                      </div>
                      <div className="relative">
                        <Gift className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                        <input
                          type="text"
                          value={referralCode}
                          onChange={(e) => setReferralCode(e.target.value)}
                          placeholder="e.g. CAMPUS-2026-VIP"
                          className="w-full pl-10 pr-4 py-2 text-xs sm:text-sm bg-white border border-neutral-300 rounded-xl text-slate-900 uppercase placeholder:normal-case font-mono focus:border-[#57534e] focus:ring-2 focus:ring-[#57534e]/20"
                        />
                      </div>
                    </div>
                  )}
                </div>

                {/* Terms & Age Eligibility Checkboxes */}
                <div className="space-y-2 pt-2 border-t border-neutral-200">
                  <p className="text-xs text-slate-600">
                    New profiles for members aged 18 and older are public by default. You can make your profile private in Profile Settings.
                  </p>
                  <label className="block space-y-1 text-sm font-medium text-slate-800">
                    <span>Date of birth <span className="text-xs font-normal text-slate-600">(optional)</span></span>
                    <input type="date" autoComplete="bday" value={birthDate} onChange={(event) => setBirthDate(event.target.value)} className="block w-full rounded-lg border border-blue-200 bg-white px-3 py-2" />
                    <span className="block text-xs font-normal text-slate-600">Leave blank to keep your profile private.</span>
                  </label>
                  <label className="flex items-start gap-2.5 cursor-pointer text-xs text-slate-600">
                    <input
                      type="checkbox"
                      required
                      checked={termsAgreed}
                      onChange={(e) => setTermsAgreed(e.target.checked)}
                      className="mt-0.5 w-4 h-4 rounded border-neutral-300 text-[#292825] focus:ring-[#57534e] cursor-pointer"
                    />
                    <span>
                      I agree to the{" "}
                      <Link href="/terms" target="_blank" className="font-bold text-[#292825] hover:text-[#44403c] underline underline-offset-2">
                        Terms of Service
                      </Link>
                      {" "}and{" "}
                      <Link href="/privacy" target="_blank" className="font-bold text-[#292825] hover:text-[#44403c] underline underline-offset-2">
                        Privacy Policy
                      </Link>.
                    </span>
                  </label>

                  <label className="flex items-start gap-2.5 cursor-pointer text-xs text-slate-600">
                    <input
                      type="checkbox"
                      required
                      checked={ageConsent}
                      onChange={(e) => setAgeConsent(e.target.checked)}
                      className="mt-0.5 w-4 h-4 rounded border-neutral-300 text-[#292825] focus:ring-[#57534e] cursor-pointer"
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
                  className="w-full py-3 px-6 rounded-xl font-bold text-sm text-white transition-all flex items-center justify-center gap-2 shadow-sm disabled:opacity-60 cursor-pointer bg-black hover:bg-neutral-800"
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
                  <h3 className="text-base font-bold text-slate-900 font-display">
                    Verify Your Email Address
                  </h3>
                  <p className="text-xs text-slate-600">
                    We&apos;ve sent a 6-digit verification code to{" "}
                    <span className="font-semibold text-slate-900">{maskedEmail || email}</span>
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
                      className="w-11 h-13 sm:w-12 sm:h-14 text-center text-xl font-bold font-mono rounded-xl bg-white border border-neutral-300 text-slate-900 focus:outline-none focus:border-[#57534e] focus:ring-2 focus:ring-[#57534e]/20 transition-all shadow-2xs"
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
                    className="font-medium text-slate-600 hover:text-slate-900 transition-colors cursor-pointer"
                  >
                    Edit registration details
                  </button>

                  {countdown > 0 ? (
                    <span className="text-slate-500">
                      Resend in <span className="font-semibold text-slate-800">{countdown}s</span>
                    </span>
                  ) : (
                    <button
                      type="button"
                      onClick={handleResendOtp}
                      disabled={loading}
                      className="font-bold text-[#292825] hover:text-[#44403c] transition-colors flex items-center gap-1 cursor-pointer"
                    >
                      <RotateCw className="w-3 h-3" />
                      <span>Resend OTP</span>
                    </button>
                  )}
                </div>

                <button
                  type="submit"
                  disabled={loading || otpDigits.join("").length !== 6}
                  className="w-full py-3 px-6 rounded-xl font-bold text-sm text-white transition-all flex items-center justify-center gap-2 shadow-sm disabled:opacity-60 cursor-pointer bg-black hover:bg-neutral-800"
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

          </>
        )}

      </div>
    </FigmaAuthLayout>
  );
}

export default function SignupPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#F4F5FA] flex items-center justify-center">
          <div className="p-6 border-neutral-200 flex items-center gap-3 border-b">
            <Loader2 className="w-5 h-5 animate-spin text-[#292825]" />
            <span className="text-sm font-semibold text-slate-800">Loading sign up...</span>
          </div>
        </div>
      }
    >
      <SignupForm />
    </Suspense>
  );
}
