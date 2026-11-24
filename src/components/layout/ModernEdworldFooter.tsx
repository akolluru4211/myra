"use client";

import React, { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import {
  Mail,
  MapPin,
  CheckCircle2,
  Send,
  ArrowRight,
  Sliders,
  ShieldCheck
} from "lucide-react";

export default function ModernEdworldFooter() {
  const pathname = usePathname();
  const isLandingPage = pathname === "/";

  const [dispatchEmail, setDispatchEmail] = useState("");
  const [dispatchStatus, setDispatchStatus] = useState<"idle" | "loading" | "success">("idle");

  const handleOpenCookies = () => {
    if (typeof window !== "undefined") {
      window.dispatchEvent(new CustomEvent("edworld-open-cookie-preferences"));
    }
  };

  const handleDispatchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!dispatchEmail || !dispatchEmail.includes("@")) return;

    setDispatchStatus("loading");
    setTimeout(() => {
      setDispatchStatus("success");
      setDispatchEmail("");
    }, 600);
  };

  const linkClass = "text-slate-500 hover:text-[#2563EB] transition-colors flex items-center justify-between group";
  const headerClass = "font-extrabold font-display text-xs uppercase tracking-wider text-black";

  return (
    <footer className="bg-white border-t border-blue-200/80 text-slate-500 rounded-t-3xl shadow-ambient-card relative font-sans mt-auto overflow-hidden select-none">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-7 pb-20 sm:pt-8 sm:pb-6 relative z-10">
        
        {/* 1. Clean Newsletter Subscribe Strip */}
        <div className="mb-7 p-3.5 sm:p-4 rounded-2xl border border-blue-200/80 bg-[#EFF6FF] shadow-xs flex flex-col md:flex-row items-center justify-between gap-3.5">
          <div className="flex items-center gap-2.5 text-center md:text-left flex-wrap justify-center md:justify-start">
            <span className="text-xs font-bold text-black font-display">
              Weekly Technical Dispatch
            </span>
            <span className="hidden sm:inline text-slate-400">•</span>
            <span className="text-xs text-slate-500">
              Curated interview questions, system design briefs, and placement roadmaps.
            </span>
          </div>

          <div className="w-full md:w-auto shrink-0">
            {dispatchStatus === "success" ? (
              <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold shadow-xs">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                <span>You&apos;re subscribed to the weekly dispatch!</span>
              </div>
            ) : (
              <form onSubmit={handleDispatchSubmit} className="flex items-center gap-2 w-full md:w-auto">
                <div className="relative flex-1 md:w-64">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
                  <input
                    type="email"
                    required
                    placeholder="Enter your email"
                    value={dispatchEmail}
                    onChange={(e) => setDispatchEmail(e.target.value)}
                    className="w-full pl-9 pr-3 py-1.5 text-xs rounded-full placeholder:text-slate-400 focus:outline-hidden transition-all shadow-2xs border bg-white border-blue-200 text-black focus:border-[#2563EB]"
                  />
                </div>
                <button
                  type="submit"
                  disabled={dispatchStatus === "loading"}
                  className="px-4 py-1.5 rounded-full text-xs font-bold transition-all shadow-xs flex items-center justify-center gap-1.5 shrink-0 cursor-pointer disabled:opacity-50 bg-[#2563EB] hover:bg-[#1D4ED8] text-white"
                >
                  <span>Subscribe</span>
                  <Send className="w-3 h-3" />
                </button>
              </form>
            )}
          </div>
        </div>

        {/* 2. Structured Clean Navigation Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-6 sm:gap-7 pb-7 border-b border-blue-200/80">
          
          {/* Column 1: Brand Anchor */}
          <div className="space-y-3 col-span-2 md:col-span-4 lg:col-span-1">
            <Link href="/" className="inline-flex items-center gap-2.5 group">
              <div className="relative w-8 h-8 rounded-xl overflow-hidden bg-[#2563EB] shadow-xs !p-0.5 shrink-0 transition-transform group-hover:scale-105 duration-200">
                <Image
                  src="/images/edworld-mark.png"
                  alt="EdWorld Co. Official Monogram Logo"
                  width={32}
                  height={32}
                  className="w-full h-full object-cover rounded-[7px] brightness-110"
                />
              </div>
              <div className="flex flex-col">
                <div className="flex items-center gap-1 leading-none">
                  <span className="font-black text-base tracking-tight font-display text-black">
                    EdWorld
                  </span>
                  <span className="text-[9px] font-black px-1.5 py-0.5 rounded-full bg-[#2563EB] text-white shadow-xs font-display">
                    Co.
                  </span>
                </div>
                <span className="text-[9.5px] font-mono font-bold uppercase tracking-wider text-slate-500 mt-0.5">
                  Learn • Grow • Build
                </span>
              </div>
            </Link>

            {/* Contact details */}
            <div className="space-y-1 pt-1 text-[11px] text-slate-500">
              <div className="flex items-center gap-1.5">
                <MapPin className="w-3 h-3 text-[#2563EB] shrink-0" />
                <span>Hyderabad, Telangana, India</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Mail className="w-3 h-3 text-[#2563EB] shrink-0" />
                <a
                  href="mailto:edworld.eden@gmail.com"
                  className="transition-colors font-medium hover:text-[#2563EB] text-slate-700"
                >
                  edworld.eden@gmail.com
                </a>
              </div>
            </div>

            {/* Status indicator */}
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-[10.5px] font-bold text-emerald-800">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              <span>99.98% Uptime &bull; DPDP 2023</span>
            </div>
          </div>

          {/* Column 2: Learning */}
          <div className="space-y-2.5">
            <h4 className={headerClass}>Learning</h4>
            <ul className="space-y-2 text-[11.5px]">
              <li>
                <Link href="/learn" className={linkClass}>
                  <span className="group-hover:translate-x-0.5 transition-transform">Interactive Courses</span>
                  <ArrowRight className="w-2.5 h-2.5 opacity-0 -translate-x-1 group-hover:opacity-100 group-hover:translate-x-0 transition-all text-[#2563EB]" />
                </Link>
              </li>
              <li>
                <Link href="/problems" className={linkClass}>
                  <span className="group-hover:translate-x-0.5 transition-transform">Practice Problems &amp; DSA</span>
                </Link>
              </li>
              <li>
                <Link href="/focus" className={linkClass}>
                  <span className="group-hover:translate-x-0.5 transition-transform">Focus Study Studio</span>
                </Link>
              </li>
              <li>
                <Link href="/projectstudio" className={linkClass}>
                  <span className="group-hover:translate-x-0.5 transition-transform">Project Studio</span>
                </Link>
              </li>
            </ul>
          </div>

          {/* Column 3: Career */}
          <div className="space-y-2.5">
            <h4 className={headerClass}>Career</h4>
            <ul className="space-y-2 text-[11.5px]">
              <li>
                <Link href="/interviews" className={linkClass}>
                  <span className="group-hover:translate-x-0.5 transition-transform">Mock Interviews</span>
                </Link>
              </li>
              <li>
                <Link href="/resumes" className={linkClass}>
                  <span className="group-hover:translate-x-0.5 transition-transform">ATS Resume Studio</span>
                </Link>
              </li>
              <li>
                <Link href="/career/roadmap" className={linkClass}>
                  <span className="group-hover:translate-x-0.5 transition-transform">Career Roadmaps</span>
                </Link>
              </li>
              <li>
                <Link href="/jobs" className={linkClass}>
                  <span className="group-hover:translate-x-0.5 transition-transform">Job Opportunities</span>
                </Link>
              </li>
            </ul>
          </div>

          {/* Column 4: Platform & Squads */}
          <div className="space-y-2.5">
            <h4 className={headerClass}>Platform</h4>
            <ul className="space-y-2 text-[11.5px]">
              <li>
                <Link href="/edbuild" className={linkClass}>
                  <span className="group-hover:translate-x-0.5 transition-transform">EdBuild Squads</span>
                </Link>
              </li>
              <li>
                <Link href="/network" className={linkClass}>
                  <span className="group-hover:translate-x-0.5 transition-transform">Member Directory</span>
                </Link>
              </li>
              <li>
                <Link href="/for/colleges" className={linkClass}>
                  <span className="group-hover:translate-x-0.5 transition-transform">College Partners</span>
                </Link>
              </li>
              <li>
                <Link href="/pricing" className={linkClass}>
                  <span className="group-hover:translate-x-0.5 transition-transform">Plans &amp; Pricing</span>
                </Link>
              </li>
            </ul>
          </div>

          {/* Column 5: Legal & Privacy */}
          <div className="space-y-2.5">
            <h4 className={headerClass}>Legal &amp; Trust</h4>
            <ul className="space-y-2 text-[11.5px]">
              <li>
                <Link href="/contact" className={linkClass}>
                  <span className="group-hover:translate-x-0.5 transition-transform">Contact &amp; Support</span>
                </Link>
              </li>
              <li>
                <Link href="/terms" className={linkClass}>
                  <span className="group-hover:translate-x-0.5 transition-transform">Terms of Service</span>
                </Link>
              </li>
              <li>
                <Link href="/privacy" className={linkClass}>
                  <span className="group-hover:translate-x-0.5 transition-transform">Privacy Policy</span>
                </Link>
              </li>
              <li>
                <button
                  type="button"
                  onClick={handleOpenCookies}
                  className="transition-colors text-left flex items-center gap-1 cursor-pointer text-[11.5px] group w-full text-slate-500 hover:text-[#2563EB]"
                >
                  <Sliders className="w-3 h-3 text-slate-400 group-hover:text-[#2563EB]" />
                  <span className="group-hover:translate-x-0.5 transition-transform">Cookie Preferences</span>
                </button>
              </li>
              <li>
                <Link href="/about" className={linkClass}>
                  <span className="group-hover:translate-x-0.5 transition-transform">About Us</span>
                </Link>
              </li>
            </ul>
          </div>

        </div>

        {/* 3. Bottom Bar: Clean Copyright */}
        <div className="pt-4 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500">
          <p>
            &copy; {new Date().getFullYear()} EdWorld Co. All rights reserved.
          </p>
          <div className="flex items-center gap-4 text-xs text-slate-500">
            <Link href="/privacy" className="hover:text-[#2563EB] transition-colors">Privacy</Link>
            <span>•</span>
            <Link href="/terms" className="hover:text-[#2563EB] transition-colors">Terms</Link>
            <span>•</span>
            <Link href="/contact" className="hover:text-[#2563EB] transition-colors">Contact</Link>
          </div>
        </div>

      </div>
    </footer>
  );
}
