"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { LayoutDashboard, BookOpen, Users, Menu, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

export type MobileTab =
  | "home"
  | "explore"
  | "applications"
  | "community"
  | "profile"
  | "dashboard"
  | "learn"
  | "network"
  | "menu";

interface MobileBottomNavProps {
  className?: string;
  activeTab?: MobileTab;
  onTabChange?: (tab: MobileTab) => void;
  applicationsBadge?: number;
  triggerRef?: React.Ref<HTMLButtonElement>;
}

export function MobileBottomNav({
  className,
  activeTab,
  onTabChange,
  applicationsBadge,
  triggerRef,
}: MobileBottomNavProps) {
  const pathname = usePathname();
  const [isKeyboardVisible, setIsKeyboardVisible] = useState(false);

  // If onTabChange is provided, we are in prototype / simulator mode
  if (onTabChange) {
    const protoTabs: { id: MobileTab; label: string; icon: any; badge?: number }[] = [
      { id: "home", label: "Home", icon: LayoutDashboard },
      { id: "explore", label: "Explore", icon: BookOpen },
      { id: "applications", label: "Applications", icon: Users, badge: applicationsBadge },
      { id: "community", label: "Community", icon: Users },
      { id: "profile", label: "Profile", icon: Menu },
    ];

    return (
      <nav
        aria-label="Mobile Bottom Navigation Prototype"
        className={cn(
          "bg-white border-t border-[#E5E7EB] px-2 py-1 flex items-center justify-around shadow-sm select-none",
          className
        )}
      >
        {protoTabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;

          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => onTabChange(tab.id)}
              className={cn(
                "relative flex flex-col items-center justify-center flex-1 min-h-[48px] py-1 px-1 rounded-lg transition-colors duration-150 outline-none",
                isActive ? "text-[#2563EB]" : "text-[#6B7280] hover:text-[#111827]"
              )}
              aria-label={tab.label}
            >
              <div className="relative">
                <Icon
                  className={cn(
                    "w-5 h-5 transition-transform duration-150",
                    isActive ? "stroke-[2.2]" : "stroke-[1.7]"
                  )}
                />
                {Boolean(tab.badge && tab.badge > 0) && (
                  <span className="absolute -top-1 -right-2 min-w-[16px] h-4 px-1 rounded-full bg-[#2563EB] text-white text-[9px] font-bold flex items-center justify-center">
                    {tab.badge}
                  </span>
                )}
              </div>
              <span
                className={cn(
                  "text-[10px] mt-1 font-medium",
                  isActive ? "font-bold text-[#2563EB]" : "text-[#6B7280]"
                )}
              >
                {tab.label}
              </span>
            </button>
          );
        })}
      </nav>
    );
  }

  // Detect virtual keyboard on mobile to avoid covering input elements
  useEffect(() => {
    if (typeof window === "undefined" || !window.visualViewport) return;

    const handleViewportResize = () => {
      const vv = window.visualViewport;
      if (!vv) return;
      // If visual viewport height is substantially smaller than window.innerHeight, keyboard is active
      const keyboardOpen = window.innerHeight - vv.height > 150;
      setIsKeyboardVisible(keyboardOpen);
    };

    window.visualViewport.addEventListener("resize", handleViewportResize);
    return () => {
      window.visualViewport?.removeEventListener("resize", handleViewportResize);
    };
  }, []);

  const handleOpenMyra = (e: React.MouseEvent) => {
    e.preventDefault();
    if (typeof window !== "undefined") {
      window.dispatchEvent(new CustomEvent("open-myra-copilot"));
    }
  };

  const handleOpenMenu = (e: React.MouseEvent) => {
    e.preventDefault();
    if (typeof window !== "undefined") {
      window.dispatchEvent(new CustomEvent("open-nav-drawer"));
    }
  };

  // 4 labeled tabs: Home -> /dashboard, Learn -> /learn, Network -> /network, Menu -> drawer
  const tabs = [
    {
      id: "home",
      href: "/dashboard",
      label: "Home",
      icon: LayoutDashboard,
      isActive: (p: string) => p === "/dashboard" || p === "/",
    },
    {
      id: "learn",
      href: "/learn",
      label: "Learn",
      icon: BookOpen,
      isActive: (p: string) => p === "/learn" || p.startsWith("/learn/") || p === "/dsa" || p.startsWith("/dsa/"),
    },
    {
      id: "network",
      href: "/network",
      label: "Network",
      icon: Users,
      isActive: (p: string) => p === "/network" || p.startsWith("/network/") || p === "/squads" || p.startsWith("/squads/"),
    },
    {
      id: "menu",
      href: "#menu",
      label: "Menu",
      icon: Menu,
      isAction: true,
      onClick: handleOpenMenu,
      isActive: () => false,
    },
  ];

  if (isKeyboardVisible) {
    return null; // hide dock cleanly when virtual keyboard is raised
  }

  return (
    <div
      className={cn(
        "lg:hidden fixed bottom-0 left-0 right-0 z-40 px-3 pb-[env(safe-area-inset-bottom,12px)] pt-1 select-none pointer-events-none flex justify-center",
        className
      )}
    >
      {/* Container holding Floating Mascot & Purple Dock */}
      <div className="relative w-full max-w-md pointer-events-auto">
        
        {/* Floating Myra Mascot placed above the Menu tab end */}
        <div className="absolute -top-14 right-3 z-50 flex flex-col items-center group">
          <button
            type="button"
            onClick={handleOpenMyra}
            aria-label="Ask Myra AI Copilot"
            className="relative flex items-center justify-center cursor-pointer transition-transform duration-200 active:scale-95 hover:scale-105"
          >
            {/* Mascot Avatar Container */}
            <div className="relative w-11 h-11 rounded-full p-0.5 bg-gradient-to-tr from-[#2563EB] to-blue-400 shadow-lg border-2 border-white flex items-center justify-center">
              <div className="relative w-full h-full rounded-full overflow-hidden bg-white">
                <Image
                  src="/images/myra-avatar.png"
                  alt="Myra Mascot"
                  fill
                  className="object-cover"
                  priority
                />
              </div>
              {/* Online Pulse Indicator */}
              <span className="absolute -top-0.5 -right-0.5 w-3 h-3 rounded-full bg-emerald-400 border-2 border-white shadow-xs" />
            </div>

            {/* Pill Label "Myra" */}
            <span className="absolute -bottom-2 px-2 py-0.5 rounded-full bg-[#2563EB] text-white text-[10px] font-extrabold tracking-tight shadow-md border border-white/60 flex items-center gap-0.5">
              <Sparkles className="w-2.5 h-2.5 text-white stroke-[2.5]" />
              <span>Myra</span>
            </span>
          </button>
        </div>

        {/* The Four-Tab Purple Dock */}
        <nav
          aria-label="Edworld Mobile Bottom Dock"
          className="bg-[#2563EB] text-white rounded-2xl shadow-xl shadow-blue-900/15 border border-blue-300 px-2 py-1.5 flex items-center justify-between backdrop-blur-md"
        >
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const active = tab.isActive(pathname || "");

            if (tab.isAction) {
              return (
                <button
                  key={tab.id}
                  ref={triggerRef}
                  type="button"
                  onClick={tab.onClick}
                  aria-label={tab.label}
                  className="relative flex flex-col items-center justify-center flex-1 min-h-[48px] min-w-[48px] py-1 px-1 rounded-xl transition-all duration-150 outline-none text-white/80 hover:text-white hover:bg-white/10 active:scale-95 cursor-pointer touch-target focus-visible:ring-2 focus-visible:ring-white"
                >
                  <Icon className="w-5 h-5 stroke-[2] transition-transform" />
                  <span className="text-[11px] mt-0.5 font-bold tracking-tight text-white/90">
                    {tab.label}
                  </span>
                </button>
              );
            }

            return (
              <Link
                key={tab.id}
                href={tab.href}
                aria-label={tab.label}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "relative flex flex-col items-center justify-center flex-1 min-h-[48px] min-w-[48px] py-1 px-1 rounded-xl transition-all duration-150 outline-none touch-target focus-visible:ring-2 focus-visible:ring-white",
                  active
                    ? "bg-white text-[#2563EB] shadow-sm font-extrabold"
                    : "text-white/80 hover:text-white hover:bg-white/10 active:scale-95"
                )}
              >
                <Icon className={cn("w-5 h-5 transition-transform", active ? "stroke-[2.4]" : "stroke-[2]")} />
                <span
                  className={cn(
                    "text-[11px] mt-0.5 tracking-tight",
                    active ? "font-extrabold text-[#2563EB]" : "font-bold text-white/90"
                  )}
                >
                  {tab.label}
                </span>
              </Link>
            );
          })}
        </nav>
      </div>
    </div>
  );
}

export default MobileBottomNav;
