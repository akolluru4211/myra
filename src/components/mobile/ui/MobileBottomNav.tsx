"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { LayoutDashboard, BookOpen, Users, Menu } from "lucide-react";
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
  const [isChatOpen, setIsChatOpen] = useState(false);

  // Detect virtual keyboard and chat panel state on mobile
  const isPrototype = Boolean(onTabChange);
  useEffect(() => {
    if (isPrototype) return;
    const handleOpenChat = () => setIsChatOpen(true);
    const handleCloseChat = () => setIsChatOpen(false);

    if (typeof window !== "undefined") {
      window.addEventListener("open-myra-copilot", handleOpenChat);
      window.addEventListener("close-myra-copilot", handleCloseChat);

      const handleViewportResize = () => {
        const vv = window.visualViewport;
        if (!vv) return;
        const keyboardOpen = vv.scale === 1 && window.innerHeight - vv.height > 150;
        setIsKeyboardVisible(keyboardOpen);
      };

      window.visualViewport?.addEventListener("resize", handleViewportResize);

      return () => {
        window.removeEventListener("open-myra-copilot", handleOpenChat);
        window.removeEventListener("close-myra-copilot", handleCloseChat);
        window.visualViewport?.removeEventListener("resize", handleViewportResize);
      };
    }
  }, [isPrototype]);

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
                isActive ? "text-[#292825]" : "text-[#6B7280] hover:text-[#111827]"
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
                  <span className="absolute -top-1 -right-2 min-w-[16px] h-4 px-1 rounded-full bg-[#292825] text-white text-[9px] font-bold flex items-center justify-center">
                    {tab.badge}
                  </span>
                )}
              </div>
              <span
                className={cn(
                  "text-[10px] mt-1 font-medium",
                  isActive ? "font-bold text-[#292825]" : "text-[#6B7280]"
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

  if (isKeyboardVisible || isChatOpen) {
    return null; // hide dock cleanly when virtual keyboard is raised or chat is active
  }

  return (
    <div
      className={cn(
        "lg:hidden fixed bottom-0 left-0 right-0 z-40 px-3 pb-[max(0.5rem,env(safe-area-inset-bottom))] pt-1 select-none pointer-events-none flex justify-center",
        className
      )}
    >

      <div className="relative w-full max-w-md pointer-events-auto">


        <div className="absolute -top-14 right-3 z-50 flex flex-col items-center group">
          <button
            type="button"
            onClick={handleOpenMyra}
            aria-label="Ask Myra AI Copilot"
            className="relative inline-flex min-h-[48px] items-center gap-2 rounded-full border border-slate-200 bg-white py-1 pl-1 pr-3 text-sm font-semibold text-slate-800 shadow-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-neutral-700"
          >
            {/* Mascot Avatar Container */}
            <div className="relative size-9 rounded-full bg-slate-100">
              <div className="relative w-full h-full rounded-full overflow-hidden bg-white">
                <Image
                  src="/images/myra-avatar.png"
                  alt="Myra Mascot"
                  fill
                  className="object-cover"
                  priority
                />
              </div>
            </div>

            <span>Myra</span>
          </button>
        </div>


        <nav
          aria-label="Edworld Mobile Bottom Dock"
          className="grid grid-cols-4 gap-1 rounded-2xl border border-slate-200 bg-white p-1.5 text-slate-700 shadow-[0_8px_24px_#0f172a14]"
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
                  className="flex min-h-[48px] min-w-[48px] flex-col items-center justify-center gap-1 rounded-xl px-1 text-slate-600 transition-colors hover:bg-slate-100 hover:text-slate-900 focus-visible:ring-2 focus-visible:ring-neutral-700"
                >
                  <Icon className="w-5 h-5 stroke-[2] transition-transform" />
                  <span className="text-xs font-medium">
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
                  "flex min-h-[48px] min-w-[48px] flex-col items-center justify-center gap-1 rounded-xl px-1 transition-colors focus-visible:ring-2 focus-visible:ring-neutral-700",
                  active
                    ? "bg-[#edede9] text-neutral-950"
                    : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                )}
              >
                <Icon className={cn("w-5 h-5 transition-transform", active ? "stroke-[2.4]" : "stroke-[2]")} />
                <span
                  className={cn(
                    "text-xs",
                    active ? "font-semibold" : "font-medium"
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
