"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import {
  Menu,
  X,
  BookOpen,
  Code2,
  Compass,
  Briefcase,
  FileText,
  Video,
  User as UserIcon,
  LogOut,
  ChevronDown,
  LayoutDashboard,
  Sparkles,
  Users,
  Layers,
  Lock,
  ArrowRight,
  Search,
  Plus
} from "lucide-react";
import { cn } from "@/lib/utils";
import RoleScopedNotifications from "@/components/notifications/RoleScopedNotifications";
import { useFocusLock } from "@/hooks/useFocusLock";

export default function ModernEdworldNavbar() {
  const pathname = usePathname();
  const { user, profile, logout } = useAuth();
  const { isSessionActive, formattedTimeLeft } = useFocusLock();
  const [isRightDrawerOpen, setIsRightDrawerOpen] = useState(false);
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const drawerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 8);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Close menus on route navigation
  useEffect(() => {
    setIsRightDrawerOpen(false);
    setIsProfileMenuOpen(false);
  }, [pathname]);

  // Handle ESC key to close right drawer
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setIsRightDrawerOpen(false);
        setIsProfileMenuOpen(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  // Handle clicking outside drawer
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        isRightDrawerOpen &&
        drawerRef.current &&
        !drawerRef.current.contains(e.target as Node)
      ) {
        setIsRightDrawerOpen(false);
      }
    };
    if (isRightDrawerOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isRightDrawerOpen]);

  const handleOpenMyra = () => {
    setIsRightDrawerOpen(false);
    if (typeof window !== "undefined") {
      window.dispatchEvent(new CustomEvent("open-myra-copilot"));
    }
  };

  const studentName = profile?.name || user?.name || "Student";
  const initials = studentName
    .split(" ")
    .map((n: string) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  const isLandingPage = pathname === "/";

  const primaryTabs = [
    { href: "/dashboard", label: "Dashboard" },
    { href: "/daily", label: "Daily Challenge" },
    { href: "/leaderboard", label: "Leaderboard" },
    { href: "/squads", label: "Study Squads" },
  ];

  const isTabActive = (href: string) => {
    if (!pathname) return false;
    if (href === "/dashboard") {
      return pathname === "/dashboard" || pathname === "/";
    }
    return pathname === href || pathname.startsWith(href + "/");
  };

  // Navigation catalog for the right-side slide-over drawer
  const learningItems = [
    { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard, desc: "Overview, streaks & progress" },
    { href: "/learn", label: "Interactive Courses", icon: BookOpen, desc: "CS tracks & verified certs" },
    { href: "/problems", label: "Practice & DSA Arena", icon: Code2, desc: "1,000+ algorithmic challenges" },
    { href: "/focus", label: "Focus Lock Studio", icon: Lock, desc: "Distraction blocker & timer" },
    { href: "/projectstudio", label: "Project Studio", icon: Layers, desc: "Engineering problem briefs" },
  ];

  const careerItems = [
    { href: "/career", label: "Career OS Overview", icon: Compass, desc: "Role readiness & milestones" },
    { href: "/career/roadmap", label: "Smart Career Roadmap", icon: Compass, desc: "1, 3, & 5-year trajectories" },
    { href: "/interviews", label: "Interactive Mock Interviews", icon: Video, desc: "46-sector simulated rounds" },
    { href: "/resumes", label: "ATS Resume Architect", icon: FileText, desc: "Single-column Harvard format" },
    { href: "/jobs", label: "Opportunities & Jobs", icon: Briefcase, desc: "Curated internships & roles" },
  ];

  const communityItems = [
    { href: "/edbuild", label: "EdBuild Squads", icon: Users, desc: "Collaborate on projects & get verified" },
    { href: "/network", label: "Member Directory", icon: Users, desc: "Connect with peers & mentors" },
  ];

  return (
    <>
      <header
        className={cn(
          "sticky top-0 z-30 w-full transition-all duration-200 select-none",
          "bg-[#F4F5FA]/90 backdrop-blur-md px-4 sm:px-8 py-3.5 flex items-center justify-between gap-4 border-b border-slate-200/80 shadow-xs"
        )}
      >
        <div className="w-full flex items-center justify-between gap-4">
          {/* Left: Brand Monogram & Pill Navigation Switchers */}
          <div className="flex items-center gap-4 sm:gap-6 shrink-0">
            <Link href={user ? "/dashboard" : "/"} className="flex items-center gap-2.5 group">
              <div className="relative w-9 h-9 rounded-2xl overflow-hidden flex items-center justify-center bg-[#5C59E8] shadow-sm transition-transform group-hover:scale-105 duration-200 shrink-0 p-1">
                <Image
                  src="/images/edworld-mark.png"
                  alt="EdWorld Co. Logo"
                  width={28}
                  height={28}
                  className="w-full h-full object-cover rounded-md brightness-110"
                  priority
                />
              </div>
              <div className="flex items-center gap-1.5 leading-none">
                <span className="font-extrabold text-base tracking-tight font-display text-slate-900">
                  EdWorld
                </span>
                <span className="text-[10px] font-black px-1.5 py-0.5 rounded-full bg-[#5C59E8] text-white shadow-xs font-display">
                  Co.
                </span>
              </div>
            </Link>

            {/* Pill Tab Switchers (Desktop Navigation) */}
            <nav
              aria-label="Primary sections"
              className="hidden lg:flex items-center p-1 bg-slate-200/60 rounded-full border border-slate-200/80 gap-1"
            >
              {primaryTabs.map((tab) => {
                const active = isTabActive(tab.href);
                return (
                  <Link
                    key={tab.href}
                    href={tab.href}
                    className={cn(
                      "px-3.5 py-1.5 min-h-[44px] inline-flex items-center rounded-full text-xs font-bold transition-all whitespace-nowrap touch-target",
                      active
                        ? "bg-white text-[#5C59E8] shadow-xs"
                        : "text-slate-600 hover:text-slate-900 hover:bg-white/50"
                    )}
                  >
                    {tab.label}
                  </Link>
                );
              })}
            </nav>
          </div>

          {/* Center: Pill Search Input with ⌘K Badge */}
          <div className="hidden md:flex flex-1 max-w-xs lg:max-w-sm justify-center">
            <div
              onClick={() => setIsRightDrawerOpen(true)}
              className="w-full flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white border border-slate-200/80 text-xs text-slate-500 shadow-xs hover:border-[#5C59E8]/40 hover:shadow-sm transition-all cursor-pointer"
            >
              <Search className="w-3.5 h-3.5 text-slate-400 shrink-0" />
              <span className="truncate flex-1">Search or type command</span>
              <kbd className="text-[10px] font-mono font-bold bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded border border-slate-200/80">
                ⌘K
              </kbd>
            </div>
          </div>

          {/* Right: Floating Action Buttons, Myra, Notifications & Auth/Menu */}
          <div className="flex items-center gap-2 sm:gap-2.5 shrink-0">
            {/* Live Focus Lock Session Pill */}
            {isSessionActive && (
              <Link
                href="/focus"
                className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-50 border border-amber-200 text-amber-800 text-xs font-mono font-bold transition-all shadow-xs animate-pulse"
                title="Focus Lock Active - Return to Study Room"
              >
                <Lock className="w-3.5 h-3.5 text-amber-600" />
                <span>{formattedTimeLeft}</span>
              </Link>
            )}

            {/* Soft Lavender Secondary Pill Button */}
            <Link
              href="/focus"
              className="hidden sm:inline-flex items-center gap-1.5 px-3.5 py-1.5 min-h-[44px] rounded-full text-xs font-bold bg-[#EEF0FD] hover:bg-[#E0E3FA] text-[#3730A3] border border-indigo-100/60 shadow-xs transition-all cursor-pointer touch-target"
            >
              <Compass className="w-3.5 h-3.5 text-[#5C59E8]" />
              <span className="hidden xl:inline">Focus Studio</span>
            </Link>

            {/* Solid Periwinkle Primary Action Button (+ Add New / Ask Myra) */}
            <button
              type="button"
              onClick={handleOpenMyra}
              className="px-4 py-1.5 min-h-[44px] rounded-full text-xs font-bold text-white bg-[#5C59E8] hover:bg-[#4E4AC8] shadow-md shadow-indigo-500/20 flex items-center gap-1.5 transition-all cursor-pointer touch-target"
              aria-label="Ask Myra AI Companion"
            >
              <Sparkles className="w-3.5 h-3.5 text-white" />
              <span>Ask Myra</span>
            </button>

            {/* Real-time Role-Scoped Notifications Bell */}
            {user && <RoleScopedNotifications />}

            {/* User Auth States */}
            {user ? (
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setIsProfileMenuOpen(!isProfileMenuOpen)}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1.5 min-h-[44px] rounded-full text-xs font-semibold text-slate-700 bg-white border border-slate-200/80 shadow-xs cursor-pointer hover:bg-slate-50 transition-all touch-target"
                >
                  <div className="w-6 h-6 rounded-full bg-[#5C59E8] text-white flex items-center justify-center font-bold text-[10px]">
                    {initials || "U"}
                  </div>
                  <span className="hidden md:inline max-w-[100px] truncate text-slate-800 font-bold">{studentName}</span>
                  <ChevronDown className="w-3 h-3 text-slate-400" />
                </button>

                {isProfileMenuOpen && (
                  <div className="absolute right-0 mt-2 w-56 bg-white p-1.5 animate-in fade-in zoom-in-95 duration-150 z-50 shadow-ambient-card border border-slate-200/80 rounded-2xl">
                    <div className="px-4 py-2 border-b border-slate-100">
                      <p className="text-xs font-bold text-slate-900 truncate">{studentName}</p>
                      <p className="text-[11px] text-slate-500 truncate">{user.email}</p>
                    </div>

                    <Link
                      href="/dashboard"
                      onClick={() => setIsProfileMenuOpen(false)}
                      className="flex items-center gap-2.5 px-3 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 hover:text-slate-900 rounded-xl transition-colors"
                    >
                      <LayoutDashboard className="w-3.5 h-3.5 text-[#5C59E8]" />
                      <span>Dashboard</span>
                    </Link>

                    <Link
                      href="/profile"
                      onClick={() => setIsProfileMenuOpen(false)}
                      className="flex items-center gap-2.5 px-3 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 hover:text-slate-900 rounded-xl transition-colors"
                    >
                      <UserIcon className="w-3.5 h-3.5 text-[#5C59E8]" />
                      <span>Profile &amp; Settings</span>
                    </Link>

                    <div className="my-1 border-t border-slate-100" />

                    <button
                      type="button"
                      onClick={async () => {
                        setIsProfileMenuOpen(false);
                        await logout();
                      }}
                      className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-medium text-rose-600 hover:bg-rose-50 rounded-xl transition-colors text-left cursor-pointer"
                    >
                      <LogOut className="w-3.5 h-3.5" />
                      <span>Sign Out</span>
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex items-center gap-1.5">
                <Link
                  href="/login"
                  className="hidden sm:inline-flex items-center justify-center px-3.5 py-1.5 min-h-[44px] rounded-full text-xs font-semibold text-slate-700 hover:text-slate-900 hover:bg-slate-100 transition-all border border-slate-200/80 touch-target"
                >
                  Log in
                </Link>
                <Link
                  href="/signup"
                  className="inline-flex items-center justify-center gap-1 px-3.5 py-1.5 min-h-[44px] rounded-full text-xs font-bold transition-all shadow-sm bg-[#5C59E8] hover:bg-[#4E4AC8] text-white touch-target"
                >
                  <span>Join</span>
                  <ArrowRight className="w-3 h-3" />
                </Link>
              </div>
            )}

            {/* Right Three-Line Menu Button */}
            <button
              type="button"
              onClick={() => setIsRightDrawerOpen(!isRightDrawerOpen)}
              className={cn(
                "p-2 sm:px-3 sm:py-1.5 min-h-[44px] min-w-[44px] rounded-full border text-slate-700 bg-white transition-all cursor-pointer shadow-xs flex items-center justify-center gap-1.5 touch-target",
                isRightDrawerOpen
                  ? "border-[#5C59E8] text-[#5C59E8] ring-2 ring-[#5C59E8]/20"
                  : "border-slate-200 hover:bg-slate-50 hover:border-slate-300"
              )}
              aria-label="Open Right Side Navigation Menu"
              aria-expanded={isRightDrawerOpen}
            >
              <Menu className="w-4 h-4 text-slate-700" />
              <span className="hidden sm:inline text-xs font-bold text-slate-700">Menu</span>
            </button>
          </div>
        </div>
      </header>

      {/* Right-Side Slide-Over Menu Drawer & Backdrop Overlay */}
      {isRightDrawerOpen && (
        <div
          className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-50 transition-opacity duration-300 animate-in fade-in"
          aria-hidden="true"
        />
      )}

      <aside
        ref={drawerRef}
        aria-label="Right Side Navigation Menu"
        className={cn(
          "fixed inset-y-0 right-0 z-50 w-80 sm:w-96 bg-white border-l border-slate-200 shadow-2xl flex flex-col transition-transform duration-300 ease-out select-none",
          isRightDrawerOpen ? "translate-x-0" : "translate-x-full pointer-events-none"
        )}
      >
        {/* Drawer Header */}
        <div className="p-4 sm:p-5 border-b border-slate-200/80 flex items-center justify-between shrink-0 bg-[#F8F9FD]">
          <div className="flex items-center gap-2.5">
            <div className="relative w-8 h-8 rounded-xl overflow-hidden flex items-center justify-center bg-[#5C59E8] shadow-sm !p-1 shrink-0">
              <Image
                src="/images/edworld-mark.png"
                alt="EdWorld Co. Logo"
                width={24}
                height={24}
                className="w-full h-full object-cover rounded brightness-110"
              />
            </div>
            <div>
              <div className="flex items-center gap-1.5 leading-none">
                <span className="font-extrabold text-sm tracking-tight text-slate-900 font-display">
                  EdWorld Menu
                </span>
              </div>
              <p className="text-[11px] text-slate-500 mt-0.5">Campus Learning &amp; Placement OS</p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setIsRightDrawerOpen(false)}
            className="p-2 min-h-[44px] min-w-[44px] flex items-center justify-center rounded-xl text-slate-500 hover:text-slate-900 hover:bg-slate-100 border border-slate-200/80 transition-colors cursor-pointer touch-target"
            aria-label="Close navigation menu"
          >
            <X className="w-4 h-4 text-slate-600" />
          </button>
        </div>

        {/* User Card inside Drawer */}
        {user ? (
          <div className="px-5 py-3.5 bg-slate-50 border-b border-slate-200/80 flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[#5C59E8] text-white flex items-center justify-center font-bold text-sm shrink-0 shadow-xs">
              {initials || "U"}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-bold text-slate-900 truncate">{studentName}</p>
              <p className="text-xs text-slate-500 truncate">{user.email}</p>
            </div>
            <div className="w-2.5 h-2.5 rounded-full bg-status-mint animate-pulse shrink-0" title="Online" />
          </div>
        ) : (
          <div className="px-5 py-3.5 bg-slate-50 border-b border-slate-200/80 flex items-center justify-between">
            <div>
              <p className="text-xs font-bold text-slate-900">Join 15,000+ Students</p>
              <p className="text-[11px] text-slate-500">Unlock courses, DSA &amp; mock interviews</p>
            </div>
            <Link
              href="/signup"
              onClick={() => setIsRightDrawerOpen(false)}
              className="px-3 py-1.5 rounded-xl bg-[#5C59E8] text-white font-bold text-xs hover:bg-[#4E4AC8] shadow-xs transition-colors shrink-0"
            >
              Sign Up
            </Link>
          </div>
        )}

        {/* Scrollable Navigation Body */}
        <div className="flex-1 overflow-y-auto px-4 py-4 space-y-6">
          {/* Quick Myra Trigger Card */}
          <div>
            <button
              type="button"
              onClick={handleOpenMyra}
              className="w-full text-left p-3.5 rounded-2xl bg-gradient-to-r from-[#EEF0FD] to-[#F4F5FA] border border-indigo-100 hover:border-[#5C59E8]/40 transition-all flex items-center gap-3 cursor-pointer group shadow-xs"
            >
              <div className="w-9 h-9 rounded-xl bg-[#5C59E8] flex items-center justify-center text-white shrink-0 group-hover:scale-105 transition-transform shadow-xs">
                <Sparkles className="w-5 h-5 text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                  <span>Ask Myra Companion</span>
                  <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-[#5C59E8]/10 text-[#5C59E8]">Live</span>
                </div>
                <div className="text-[11px] text-slate-500">Instant doubts, interview drill &amp; guidance</div>
              </div>
              <ArrowRight className="w-4 h-4 text-[#5C59E8] group-hover:translate-x-0.5 transition-transform" />
            </button>
          </div>

          {/* Mobile Primary Section Switchers (< lg viewports) */}
          <div className="lg:hidden space-y-1.5">
            <h4 className="text-[11px] font-bold uppercase tracking-wider text-slate-500 px-2">
              Primary Sections
            </h4>
            <div className="grid grid-cols-2 gap-2">
              {primaryTabs.map((tab) => {
                const active = isTabActive(tab.href);
                return (
                  <Link
                    key={tab.href}
                    href={tab.href}
                    onClick={() => setIsRightDrawerOpen(false)}
                    className={cn(
                      "flex items-center justify-center px-3 py-2.5 rounded-xl text-xs font-bold transition-all min-h-[44px] touch-target",
                      active
                        ? "bg-[#5C59E8] text-white shadow-xs"
                        : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                    )}
                  >
                    {tab.label}
                  </Link>
                );
              })}
            </div>
          </div>

          {/* Group 1: Core Learning & Practice */}
          <div className="space-y-1.5">
            <h4 className="text-[11px] font-bold uppercase tracking-wider text-slate-500 px-2">
              Core Learning &amp; Practice
            </h4>
            <div className="space-y-1">
              {learningItems.map((item) => {
                const Icon = item.icon;
                const isActive = pathname === item.href;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setIsRightDrawerOpen(false)}
                    className={cn(
                      "flex items-center gap-3 px-3 py-2.5 rounded-2xl transition-all group",
                      isActive
                        ? "bg-[#EEF0FD] text-[#5C59E8] font-bold border border-indigo-100"
                        : "text-slate-700 hover:bg-slate-100 hover:text-slate-900"
                    )}
                  >
                    <div className="w-8 h-8 rounded-xl bg-white border border-slate-200/80 shadow-2xs flex items-center justify-center text-[#5C59E8] group-hover:scale-105 transition-all shrink-0">
                      <Icon className="w-4 h-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-xs font-semibold truncate">{item.label}</div>
                      <div className="text-[11px] text-slate-500 truncate">{item.desc}</div>
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>

          {/* Group 2: Career OS & Opportunities */}
          <div className="space-y-1.5">
            <h4 className="text-[11px] font-bold uppercase tracking-wider text-slate-500 px-2">
              Career OS &amp; Opportunities
            </h4>
            <div className="space-y-1">
              {careerItems.map((item) => {
                const Icon = item.icon;
                const isActive = pathname === item.href;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setIsRightDrawerOpen(false)}
                    className={cn(
                      "flex items-center gap-3 px-3 py-2.5 rounded-2xl transition-all group",
                      isActive
                        ? "bg-[#EEF0FD] text-[#5C59E8] font-bold border border-indigo-100"
                        : "text-slate-700 hover:bg-slate-100 hover:text-slate-900"
                    )}
                  >
                    <div className="w-8 h-8 rounded-xl bg-white border border-slate-200/80 shadow-2xs flex items-center justify-center text-[#5C59E8] group-hover:scale-105 transition-all shrink-0">
                      <Icon className="w-4 h-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-xs font-semibold truncate">{item.label}</div>
                      <div className="text-[11px] text-slate-500 truncate">{item.desc}</div>
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>

          {/* Group 3: Community & Collaboration */}
          <div className="space-y-1.5">
            <h4 className="text-[11px] font-bold uppercase tracking-wider text-slate-500 px-2">
              Community &amp; Projects
            </h4>
            <div className="space-y-1">
              {communityItems.map((item) => {
                const Icon = item.icon;
                const isActive = pathname === item.href;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setIsRightDrawerOpen(false)}
                    className={cn(
                      "flex items-center gap-3 px-3 py-2.5 rounded-2xl transition-all group",
                      isActive
                        ? "bg-[#EEF0FD] text-[#5C59E8] font-bold border border-indigo-100"
                        : "text-slate-700 hover:bg-slate-100 hover:text-slate-900"
                    )}
                  >
                    <div className="w-8 h-8 rounded-xl bg-white border border-slate-200/80 shadow-2xs flex items-center justify-center text-status-mint group-hover:scale-105 transition-all shrink-0">
                      <Icon className="w-4 h-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-xs font-semibold truncate">{item.label}</div>
                      <div className="text-[11px] text-slate-500 truncate">{item.desc}</div>
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>

          {/* Group 4: Account & Preferences */}
          <div className="space-y-1.5">
            <h4 className="text-[11px] font-bold uppercase tracking-wider text-slate-500 px-2">
              Account &amp; Preferences
            </h4>
            <div className="space-y-1">
              <Link
                href="/profile"
                onClick={() => setIsRightDrawerOpen(false)}
                className="flex items-center gap-3 px-3 py-2.5 rounded-2xl text-slate-700 hover:bg-slate-100 transition-all group"
              >
                <div className="w-8 h-8 rounded-xl bg-white border border-slate-200/80 shadow-2xs flex items-center justify-center text-slate-600 group-hover:scale-105 transition-all shrink-0">
                  <UserIcon className="w-4 h-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-xs font-semibold">Profile &amp; Settings</div>
                  <div className="text-[11px] text-slate-500">Target role, education &amp; preferences</div>
                </div>
              </Link>
            </div>
          </div>
        </div>

        {/* Drawer Footer */}
        <div className="p-4 border-t border-slate-200/80 bg-[#F8F9FD] shrink-0 space-y-3">
          {user ? (
            <button
              type="button"
              onClick={async () => {
                setIsRightDrawerOpen(false);
                await logout();
              }}
              className="w-full flex items-center justify-center gap-2 px-4 py-2.5 min-h-[44px] rounded-2xl text-xs font-semibold text-rose-600 bg-rose-50 border border-rose-200 hover:bg-rose-100 transition-colors cursor-pointer touch-target"
            >
              <LogOut className="w-4 h-4" />
              <span>Sign Out of EdWorld</span>
            </button>
          ) : (
            <div className="grid grid-cols-2 gap-2">
              <Link
                href="/login"
                onClick={() => setIsRightDrawerOpen(false)}
                className="flex items-center justify-center px-3 py-2 min-h-[44px] rounded-2xl text-xs font-semibold text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 transition-colors touch-target"
              >
                Log In
              </Link>
              <Link
                href="/signup"
                onClick={() => setIsRightDrawerOpen(false)}
                className="flex items-center justify-center px-3 py-2 min-h-[44px] rounded-2xl text-xs font-bold text-white bg-[#5C59E8] hover:bg-[#4E4AC8] shadow-xs transition-colors touch-target"
              >
                Join Now
              </Link>
            </div>
          )}

          <div className="flex items-center justify-between text-[10px] text-slate-500 pt-1">
            <span>EdWorld Co. • DPDP 2023 Compliant</span>
          </div>
        </div>
      </aside>
    </>
  );
}
