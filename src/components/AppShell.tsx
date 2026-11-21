"use client";

import React, { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { CURRENT_TOS_VERSION, CURRENT_PRIVACY_VERSION } from "@/lib/types";
import ReconsentModal from "@/components/legal/ReconsentModal";
import ModernEdworldNavbar from "@/components/layout/ModernEdworldNavbar";
import ModernEdworldFooter from "@/components/layout/ModernEdworldFooter";
import CurvySideDock from "@/components/layout/CurvySideDock";
import MyraChatbot from "@/components/ai/MyraChatbot";
import FloatingMyraSignupBuddy from "@/components/auth/FloatingMyraSignupBuddy";
import CookieConsentBanner from "@/components/ui/CookieConsentBanner";
import AegisClientShield from "@/components/security/AegisClientShield";
import MobileBottomNav from "@/components/mobile/ui/MobileBottomNav";
import { cn } from "@/lib/utils";

export default function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { user } = useAuth();
  const [showReconsent, setShowReconsent] = useState(false);

  const isLandingPage = pathname === "/";
  const isAuthPage =
    pathname === "/login" ||
    pathname === "/signup" ||
    pathname === "/auth/login" ||
    pathname === "/auth/signup" ||
    pathname?.startsWith("/auth/");

  const isSignupPage = pathname === "/signup" || pathname === "/auth/signup";
  const isMobilePrototype = pathname === "/mobile" || pathname?.startsWith("/mobile/");
  const isAdminPage = pathname === "/admin" || pathname?.startsWith("/admin/");

  const [isSiteLaunched, setIsSiteLaunched] = useState<boolean | null>(null);
  const [isPreview, setIsPreview] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      if (params.get("preview") === "true") {
        setIsPreview(true);
      }
    }

    if (isLandingPage) {
      fetch("/api/feature-flags")
        .then((res) => (res.ok ? res.json() : null))
        .then((data) => {
          setIsSiteLaunched(Boolean(data?.isSiteLaunched));
        })
        .catch(() => setIsSiteLaunched(false));
    }
  }, [isLandingPage]);

  useEffect(() => {
    if (user) {
      const isOutdated =
        (user.tosVersion && user.tosVersion !== CURRENT_TOS_VERSION) ||
        (user.privacyVersion && user.privacyVersion !== CURRENT_PRIVACY_VERSION);
      if (isOutdated) {
        setShowReconsent(true);
      }
    }
  }, [user]);

  const handleReconsentAccept = async () => {
    setShowReconsent(false);
  };

  // Dedicated standalone rendering for Mobile Prototype canvas
  if (isMobilePrototype) {
    return (
      <div className="min-h-screen bg-slate-900 text-slate-100 font-sans antialiased">
        {children}
        <AegisClientShield />
      </div>
    );
  }

  // Standalone 3D Spatial rendering for Authentication Pages
  if (isAuthPage) {
    return (
      <div className="min-h-screen w-full bg-[#080B11] text-white font-sans antialiased relative overflow-hidden selection:bg-white selection:text-slate-950">
        <div className="relative z-10 w-full min-h-screen flex flex-col justify-center">
          {children}
        </div>
        <CookieConsentBanner />
        <AegisClientShield />
      </div>
    );
  }

  // Dedicated standalone rendering for Admin Operations Portal (No student navbar, footer, or chatbot)
  if (isAdminPage) {
    return (
      <div className="min-h-screen w-full bg-[#080B11] text-white font-sans antialiased selection:bg-[#2563EB] selection:text-white relative">
        {children}
        <AegisClientShield />
      </div>
    );
  }

  // Dedicated standalone rendering for Landing Page (Navbar & Footer self-contained on landing)
  if (isLandingPage) {
    return (
      <div className="min-h-screen w-full bg-[#080B11] text-white font-sans antialiased relative selection:bg-emerald-500 selection:text-slate-950">
        {children}
        <CookieConsentBanner />
        <AegisClientShield />
        <ReconsentModal
          isOpen={showReconsent}
          onAccept={handleReconsentAccept}
        />
        <MyraChatbot />
      </div>
    );
  }

  // Modern Full-Width Layout with Curvy Side Dock
  return (
    <div
      className={cn(
        "min-h-screen flex flex-col font-sans antialiased selection:bg-[#5C59E8] selection:text-white relative overflow-x-hidden",
        "bg-[#F4F5FA] text-slate-900"
      )}
    >
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2.5 focus:bg-[#5C59E8] focus:text-white focus:rounded-xl focus:shadow-xl focus:font-bold focus:text-xs"
      >
        Skip to main content
      </a>

      {/* Curvy Floating Side Navigation Dock for Desktop */}
      {!isLandingPage && <CurvySideDock />}

      {/* Modern Sticky Glassmorphic Navbar */}
      <div className={cn("relative z-40", !isLandingPage && "lg:pl-28")}>
        <ModernEdworldNavbar />
      </div>

      {/* Main Workspace Container */}
      <main
        id="main-content"
        tabIndex={-1}
        className={cn(
          "flex-1 outline-none relative z-10",
          isLandingPage
            ? "w-full"
            : "max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-5 sm:py-6 lg:pl-28"
        )}
      >
        {children}
      </main>

      {/* Modern Light Footer */}
      <div className={cn("relative z-20", !isLandingPage && "lg:pl-28")}>
        <ModernEdworldFooter />
      </div>

      {/* Mobile Bottom Navigation for Authenticated Users */}
      {user && !isLandingPage && <MobileBottomNav />}

      <ReconsentModal
        isOpen={showReconsent}
        onAccept={handleReconsentAccept}
      />

      {/* Floating Smart Career & Study Mentor */}
      <MyraChatbot />

      {/* Global Privacy & Cookie Consent */}
      <CookieConsentBanner />

      {/* Autonomous Client Cyber-Defense & Anti-Bot Telemetry Shield */}
      <AegisClientShield />
    </div>
  );
}
