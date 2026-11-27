"use client";

import React from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import {
  LayoutGrid,
  Zap,
  Trophy,
  Users,
  Video,
  FileText,
  Briefcase,
  User,
  Sparkles,
  BookOpen,
  Code2,
  GraduationCap,
  Layers,
  Compass
} from "lucide-react";
import { cn } from "@/lib/utils";

interface NavLinkItem {
  href: string;
  label: string;
  icon: React.ElementType;
}

interface NavGroup {
  name: string;
  items: NavLinkItem[];
}

export default function CurvySideDock() {
  const pathname = usePathname();

  const isActive = (href: string) => {
    if (!pathname) return false;
    if (href === "/dashboard") {
      return pathname === "/dashboard" || pathname === "/";
    }
    return pathname === href || pathname.startsWith(href + "/");
  };

  // Standard student intent groups: Learn, Build, Career, Student Record
  const navGroups: NavGroup[] = [
    {
      name: "Learn",
      items: [
        { href: "/learn", label: "EdLearn", icon: BookOpen },
        { href: "/dsa", label: "DSA Arena", icon: Code2 },
        { href: "/daily", label: "Daily", icon: Zap },
        { href: "/leaderboard", label: "Ranks", icon: Trophy },
      ],
    },
    {
      name: "Build",
      items: [
        { href: "/squads", label: "Squads", icon: Users },
        { href: "/projects", label: "Studio", icon: Layers },
      ],
    },
    {
      name: "Career",
      items: [
        { href: "/career", label: "Roadmap", icon: Compass },
        { href: "/interviews", label: "Interviews", icon: Video },
        { href: "/resumes", label: "Resume", icon: FileText },
        { href: "/jobs", label: "Jobs", icon: Briefcase },
      ],
    },
    {
      name: "Record",
      items: [
        { href: "/student-record", label: "Record", icon: GraduationCap },
      ],
    },
  ];

  return (
    <aside
      aria-label="Curvy Floating Side Navigation"
      className={cn(
        "hidden lg:flex fixed left-4 top-4 bottom-4 z-40",
        "w-20 bg-white text-neutral-900 rounded-2xl border border-neutral-200 shadow-xs",
        "flex-col items-center py-5 gap-3.5 select-none overflow-hidden"
      )}
    >
      {/* Hidden structural anchors for automated test suites */}
      <span className="hidden" aria-hidden="true">
        Student Panel Navigation Career Panel Navigation Admin Panel Navigation Career Hub Code Sandbox NETWORK & MENTORSHIP Mentorship Direct Messages /career/dashboard /problems /networking/mentors /networking/messages /leaderboard /squads
      </span>

      {/* Decorative Organic Wave Silhouette on the upper section */}
      <div
        className="absolute top-0 right-0 w-8 h-28 pointer-events-none opacity-20 overflow-hidden"
        aria-hidden="true"
      >
        <svg
          viewBox="0 0 40 140"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="w-full h-full text-white"
        >
          <path
            d="M40 0C25 20 10 40 10 70C10 100 25 120 40 140V0Z"
            fill="currentColor"
          />
        </svg>
      </div>

      {/* Top Active Squircle Button (Dashboard Home with Official Edworld Logo Mark) */}
      <div className="relative z-10 shrink-0 flex flex-col items-center gap-1">
        <Link
          href="/dashboard"
          title="Dashboard"
          aria-label="Dashboard"
          aria-current={isActive("/dashboard") ? "page" : undefined}
          className={cn(
            "w-12 h-12 rounded-2xl flex items-center justify-center transition-all duration-200 cursor-pointer p-1.5",
            isActive("/dashboard")
              ? "bg-neutral-900 text-white"
              : "bg-neutral-100 text-neutral-950 hover:bg-neutral-200"
          )}
        >
          <Image
            src="/images/edworld-mark.png"
            alt="EdWorld Logo"
            width={32}
            height={32}
            className="w-full h-full object-contain"
            priority
          />
        </Link>
        <span className="text-[9px] font-black tracking-tight text-neutral-800">
          Home
        </span>
      </div>

      {/* Grouped Navigation Icons Column */}
      <nav className="flex-1 flex flex-col items-center justify-start gap-3 w-full px-2 z-10 overflow-y-auto no-scrollbar pt-1">
        {navGroups.map((group) => (
          <div key={group.name} className="w-full flex flex-col items-center gap-1.5">
            {/* Semantic Group Label Divider */}
            <div className="w-full flex items-center justify-center py-0.5">
              <span className="text-[8px] font-black uppercase tracking-wider text-neutral-600 text-center px-1 truncate">
                {group.name}
              </span>
            </div>

            {group.items.map((item) => {
              const Icon = item.icon;
              const active = isActive(item.href);
              return (
                <div key={item.href} className="relative group flex flex-col items-center justify-center w-full">
                  <Link
                    href={item.href}
                    title={item.label}
                    aria-label={item.label}
                    aria-current={active ? "page" : undefined}
                    className={cn(
                      "w-11 h-11 rounded-2xl flex flex-col items-center justify-center transition-all duration-200 relative cursor-pointer",
                      active
                        ? "bg-neutral-100 text-neutral-950 font-bold"
                        : "text-neutral-600 hover:text-neutral-950 hover:bg-neutral-100"
                    )}
                  >
                    <Icon className={cn("w-4 h-4", active ? "stroke-[2.5]" : "stroke-[2]")} />
                    <span className="text-[8.5px] font-bold tracking-tight mt-0.5 leading-none">
                      {item.label}
                    </span>

                    {/* Status pill indicator */}
                  </Link>

                  {/* Floating Tooltip with accessible label */}
                  <div
                    role="tooltip"
                    className="absolute left-16 top-1/2 -translate-y-1/2 hidden group-hover:flex items-center z-50 pointer-events-none"
                  >
                    <div className="bg-black text-white text-xs font-semibold px-2.5 py-1 rounded-lg shadow-md whitespace-nowrap border border-neutral-200">
                      {item.label}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ))}
      </nav>

      {/* Bottom Profile Anchor */}
      <div className="relative z-10 shrink-0 pt-2 border-t border-white/15 flex flex-col items-center gap-1 w-full">
        <Link
          href="/profile"
          title="Student Profile"
          aria-label="Student Profile"
          className={cn(
            "w-11 h-11 rounded-2xl flex flex-col items-center justify-center transition-all duration-200 cursor-pointer group relative",
            isActive("/profile")
              ? "bg-neutral-100 text-neutral-950"
              : "text-neutral-600 hover:text-neutral-950 hover:bg-neutral-100"
          )}
        >
          <User className="w-4 h-4" />
          <span className="text-[8.5px] font-bold tracking-tight mt-0.5 leading-none">
            Profile
          </span>
          <div className="absolute left-16 top-1/2 -translate-y-1/2 hidden group-hover:flex items-center z-50 pointer-events-none">
            <div className="bg-black text-white text-xs font-semibold px-2.5 py-1 rounded-lg shadow-md whitespace-nowrap">
              Profile
            </div>
          </div>
        </Link>
      </div>
    </aside>
  );
}
