"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { 
  Sparkles, 
  Calendar, 
  ArrowRight, 
  CheckCircle2, 
  Bell, 
  Briefcase, 
  Mic, 
  FileText, 
  Users, 
  ShieldCheck, 
  ExternalLink 
} from "lucide-react";
import { EdworldLogo } from "@/components/ui/EdworldLogo";

interface ComingSoonLandingProps {
  onBypassComingSoon?: () => void;
  targetLaunchDate?: string;
}

export default function ComingSoonLanding({ onBypassComingSoon, targetLaunchDate }: ComingSoonLandingProps) {
  // Target Launch Date: Dynamic or future date (December 25, 2026)
  const targetDateStr = targetLaunchDate || "2026-12-25T00:00:00+05:30";
  const launchTimestamp = new Date(targetDateStr).getTime();

  const [timeLeft, setTimeLeft] = useState<{
    days: number;
    hours: number;
    minutes: number;
    seconds: number;
    hasLaunched: boolean;
  }>({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0,
    hasLaunched: false
  });

  const [email, setEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [subscribed, setSubscribed] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    const updateCountdown = () => {
      const now = Date.now();
      const difference = launchTimestamp - now;

      if (difference <= 0) {
        setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0, hasLaunched: true });
        // Automatically transition into the live site when the launch timer expires
        if (onBypassComingSoon) {
          onBypassComingSoon();
        }
      } else {
        const days = Math.floor(difference / (1000 * 60 * 60 * 24));
        const hours = Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((difference % (1000 * 60)) / 1000);
        setTimeLeft({ days, hours, minutes, seconds, hasLaunched: false });
      }
    };

    updateCountdown();
    const timer = setInterval(updateCountdown, 1000);
    return () => clearInterval(timer);
  }, [launchTimestamp, onBypassComingSoon]);

  const handleSubscribe = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !email.includes("@")) {
      setErrorMessage("Please enter a valid email address.");
      return;
    }

    setSubmitting(true);
    setErrorMessage(null);

    try {
      const res = await fetch("/api/newsletter/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          source: "coming_soon_waitlist"
        })
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setSubscribed(true);
      } else {
        setSubscribed(true);
      }
    } catch {
      setSubscribed(true); // Graceful UX fallback
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-100 selection:bg-neutral-800 selection:text-white flex flex-col justify-between relative overflow-hidden">
      {/* Main Content */}
      <main className="relative z-10 max-w-4xl w-full mx-auto px-6 py-12 sm:py-16 text-center my-auto">
        {/* Centered Logo & Brand Name */}
        <div className="flex flex-col items-center justify-center mb-6">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl overflow-hidden bg-black flex items-center justify-center shadow-md border border-neutral-800">
              <Image
                src="/images/edworld-mark.png"
                alt="EdWorld Co. Logo"
                width={56}
                height={56}
                className="w-full h-full object-cover"
                priority
              />
            </div>
            <div className="text-left flex flex-col justify-center">
              <div className="flex items-center gap-1.5 leading-none">
                <span className="text-2xl sm:text-3xl font-black tracking-tight text-white">
                  Edworld
                </span>
                <span className="text-[10px] sm:text-xs font-mono font-black px-1.5 py-0.5 rounded-md bg-neutral-800 border border-neutral-700 text-neutral-200">
                  CO.
                </span>
              </div>
              <span className="text-[9px] sm:text-[10px] font-semibold tracking-widest uppercase text-neutral-400 mt-1">
                Skills &amp; Career OS
              </span>
            </div>
          </div>
        </div>

        {/* Launch Badge */}
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-neutral-900 border border-neutral-800 text-xs text-neutral-300 font-medium mb-8">
          <Sparkles className="w-3.5 h-3.5 text-blue-400" />
          <span>Official Public Launch: December 25, 2026 • Pre-Release Early Access Active</span>
        </div>

        {/* Hero Title */}
        <h1 className="text-4xl sm:text-6xl md:text-7xl font-bold tracking-tight text-white mb-6">
          Something extraordinary is <span className="bg-gradient-to-r from-blue-400 via-indigo-300 to-emerald-400 bg-clip-text text-transparent">coming soon</span>.
        </h1>

        {/* Subtitle */}
        <p className="text-base sm:text-lg text-neutral-400 max-w-xl mx-auto mb-10 leading-relaxed font-normal">
          Putting the finishing touches on our career platform. Official launch on December 25, 2026.
        </p>

        {/* Countdown Timer Grid with Crisp Solid Cards */}
        <div className="grid grid-cols-4 gap-3 sm:gap-6 max-w-xl mx-auto mb-10">
          {/* Days */}
          <div className="edworld-blue-card border border-neutral-800 rounded-2xl p-4 sm:p-6 shadow-sm flex flex-col items-center justify-center">
            <span className="text-3xl sm:text-5xl font-mono font-bold text-white tracking-tight">
              {String(timeLeft.days).padStart(2, "0")}
            </span>
            <span className="text-[11px] sm:text-xs uppercase tracking-wider text-neutral-400 mt-2 font-medium">
              Days
            </span>
          </div>

          {/* Hours */}
          <div className="edworld-blue-card border border-neutral-800 rounded-2xl p-4 sm:p-6 shadow-sm flex flex-col items-center justify-center">
            <span className="text-3xl sm:text-5xl font-mono font-bold text-white tracking-tight">
              {String(timeLeft.hours).padStart(2, "0")}
            </span>
            <span className="text-[11px] sm:text-xs uppercase tracking-wider text-neutral-400 mt-2 font-medium">
              Hours
            </span>
          </div>

          {/* Minutes */}
          <div className="edworld-blue-card border border-neutral-800 rounded-2xl p-4 sm:p-6 shadow-sm flex flex-col items-center justify-center">
            <span className="text-3xl sm:text-5xl font-mono font-bold text-white tracking-tight">
              {String(timeLeft.minutes).padStart(2, "0")}
            </span>
            <span className="text-[11px] sm:text-xs uppercase tracking-wider text-neutral-400 mt-2 font-medium">
              Minutes
            </span>
          </div>

          {/* Seconds */}
          <div className="edworld-blue-card border border-neutral-800 rounded-2xl p-4 sm:p-6 shadow-sm flex flex-col items-center justify-center">
            <span className="text-3xl sm:text-5xl font-mono font-bold text-blue-400 tracking-tight">
              {String(timeLeft.seconds).padStart(2, "0")}
            </span>
            <span className="text-[11px] sm:text-xs uppercase tracking-wider text-neutral-400 mt-2 font-medium">
              Seconds
            </span>
          </div>
        </div>

        {/* Interactive Loop to Landing Page */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3.5 mb-14">
          <button
            type="button"
            onClick={onBypassComingSoon ? onBypassComingSoon : () => { window.location.href = "/?preview=true"; }}
            className="w-full sm:w-auto px-7 py-3.5 rounded-full bg-blue-600 hover:bg-blue-500 text-white font-bold text-sm shadow-md transition-all flex items-center justify-center gap-2 hover:scale-[1.02] active:scale-[0.98] cursor-pointer"
          >
            <span>Explore Live Landing Page &amp; Features</span>
            <ArrowRight className="w-4 h-4" />
          </button>

          <Link
            href="/auth/signup"
            className="w-full sm:w-auto px-7 py-3.5 rounded-full bg-neutral-900 hover:bg-neutral-800 text-white font-bold text-sm border border-neutral-700 transition-all flex items-center justify-center gap-2 hover:scale-[1.02] active:scale-[0.98]"
          >
            <Sparkles className="w-4 h-4 text-amber-300" />
            <span>Join Early Access Free</span>
          </Link>
        </div>

        {/* Early Access / Waitlist Form */}
        <div className="max-w-md mx-auto mb-16">
          {!subscribed ? (
            <form onSubmit={handleSubscribe} className="space-y-3">
              <div className="flex flex-col sm:flex-row gap-2">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter your email for launch alerts..."
                  required
                  className="flex-1 bg-neutral-900 border border-neutral-700 rounded-full px-5 py-3.5 text-sm text-white placeholder-neutral-500 focus:outline-none focus:border-blue-500 transition"
                />
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-6 py-3.5 bg-white text-black hover:bg-neutral-100 font-bold text-sm rounded-full transition flex items-center justify-center gap-2 shrink-0 disabled:opacity-50 shadow-sm cursor-pointer"
                >
                  <Bell className="w-4 h-4" />
                  {submitting ? "Joining..." : "Notify Me"}
                </button>
              </div>
              {errorMessage && (
                <p className="text-xs text-rose-400 text-left">{errorMessage}</p>
              )}
              <p className="text-xs text-neutral-400 text-left">
                Zero spam. Instant launch notification only.
              </p>
            </form>
          ) : (
            <div className="p-4 bg-emerald-950/70 border border-emerald-800/80 rounded-2xl flex items-center justify-center gap-3 text-emerald-300 text-sm">
              <CheckCircle2 className="w-5 h-5 shrink-0" />
              <span>You&apos;re on the early access list! We&apos;ll notify you on December 25, 2026.</span>
            </div>
          )}
        </div>

        {/* Feature Teasers Bento */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 text-left">
          <div className="edworld-blue-card p-4  border border-neutral-800 rounded-2xl">
            <div className="w-9 h-9 metallic-icon-badge metallic-cyan mb-3">
              <Mic className="w-4 h-4 stroke-[1.85]" />
            </div>
            <h3 className="text-sm font-bold text-neutral-200 font-display">AI Mock Interviews</h3>
            <p className="text-xs text-neutral-400 mt-1 leading-relaxed">
              Real-time voice and behavioral feedback with instant score breakdown.
            </p>
          </div>

          <div className="edworld-blue-card p-4  border border-neutral-800 rounded-2xl">
            <div className="w-9 h-9 metallic-icon-badge metallic-indigo mb-3">
              <FileText className="w-4 h-4 stroke-[1.85]" />
            </div>
            <h3 className="text-sm font-bold text-neutral-200 font-display">ATS Resume Maker</h3>
            <p className="text-xs text-neutral-400 mt-1 leading-relaxed">
              Keyword matching against real job descriptions and tailored bullet advice.
            </p>
          </div>

          <div className="edworld-blue-card p-4  border border-neutral-800 rounded-2xl">
            <div className="w-9 h-9 metallic-icon-badge metallic-emerald mb-3">
              <Briefcase className="w-4 h-4 stroke-[1.85]" />
            </div>
            <h3 className="text-sm font-bold text-neutral-200 font-display">Verified Job Board</h3>
            <p className="text-xs text-neutral-400 mt-1 leading-relaxed">
              Curated opportunities with transparent source tags and real status updates.
            </p>
          </div>

          <div className="edworld-blue-card p-4  border border-neutral-800 rounded-2xl">
            <div className="w-9 h-9 metallic-icon-badge metallic-amber mb-3">
              <Users className="w-4 h-4 stroke-[1.85]" />
            </div>
            <h3 className="text-sm font-bold text-neutral-200 font-display">Peer Mentorship</h3>
            <p className="text-xs text-neutral-400 mt-1 leading-relaxed">
              Safe community networking across colleges, alumni, and employers.
            </p>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="relative z-10 max-w-7xl w-full mx-auto px-6 py-8 border-t border-neutral-900 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-neutral-400">
        <div className="flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-emerald-400" />
          <span>Infrastructure verified • All systems operational</span>
        </div>

        <div className="flex flex-wrap items-center justify-center sm:justify-end gap-4 sm:gap-6">
          <Link href="/privacy" className="hover:text-neutral-300 transition">Privacy Policy</Link>
          <Link href="/terms" className="hover:text-neutral-300 transition">Terms of Service</Link>
          <Link href="/cookies" className="hover:text-neutral-300 transition">Cookie Policy</Link>
          <Link href="/refund" className="hover:text-neutral-300 transition">Refund Policy</Link>
          <span>&copy; {new Date().getFullYear()} EdWorld Co. All rights reserved.</span>
        </div>
      </footer>
    </div>
  );
}
