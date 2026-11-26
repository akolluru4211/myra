"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import ComingSoonLanding from "@/components/landing/ComingSoonLanding";
import ModernEdworldLanding from "@/components/landing/ModernEdworldLanding";

export default function HomeContent() {
  const searchParams = useSearchParams();
  const previewParam = searchParams ? searchParams.get("preview") === "true" : false;
  const comingSoonParam = searchParams ? searchParams.get("coming_soon") === "true" : false;

  const { user, profile } = useAuth();
  const [isSiteLaunched, setIsSiteLaunched] = useState<boolean | null>(null);
  const [previewMode, setPreviewMode] = useState<boolean>(previewParam);
  const [forceComingSoon, setForceComingSoon] = useState<boolean>(comingSoonParam);

  const isAdmin = Boolean(
    (profile as any)?.is_admin ||
    (profile as any)?.role === "ADMIN" ||
    (profile as any)?.role === "SUPER_ADMIN" ||
    (profile as any)?.role === "FOUNDER" ||
    user?.email === "edworld.eden@gmail.com"
  );

  useEffect(() => {
    if (previewParam) {
      setPreviewMode(true);
      setForceComingSoon(false);
    } else if (comingSoonParam) {
      setForceComingSoon(true);
      setPreviewMode(false);
    }
  }, [previewParam, comingSoonParam]);

  useEffect(() => {
    // Query platform launch feature flag
    async function checkLaunchStatus() {
      try {
        const res = await fetch("/api/feature-flags");
        if (res.ok) {
          const data = await res.json();
          setIsSiteLaunched(Boolean(data.isSiteLaunched));
        } else {
          setIsSiteLaunched(false);
        }
      } catch {
        setIsSiteLaunched(false);
      }
    }

    checkLaunchStatus();
  }, []);

  // Coming Soon is only displayed if explicitly requested with ?coming_soon=true
  if (forceComingSoon) {
    return (
      <ComingSoonLanding
        onBypassComingSoon={() => {
          document.cookie = "edw_preview=true; path=/; max-age=86400; SameSite=Lax";
          setPreviewMode(true);
          setForceComingSoon(false);
        }}
        targetLaunchDate="2026-12-25T00:00:00+05:30"
      />
    );
  }

  return (
    <div className="w-full">
      {/* Platform Launch Bar / Admin Banner */}
      {previewMode && (
        <div className="bg-slate-900 border-b border-slate-800 text-white px-4 py-2.5 text-xs font-semibold flex flex-col sm:flex-row items-center justify-between gap-2 sticky top-0 z-50 shadow-md">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping shrink-0" />
            <span>
              <strong>Platform Launch: December 25, 2026</strong> — You are viewing the live landing page and features preview.
            </span>
          </div>
          <div className="flex items-center gap-3 shrink-0">
            {isAdmin && (
              <Link
                href="/admin"
                className="px-3 py-1 bg-white text-slate-900 rounded-lg text-xs font-bold hover:bg-slate-100 transition"
              >
                Admin Console &rarr;
              </Link>
            )}
            <button
              onClick={() => {
                setForceComingSoon(true);
                setPreviewMode(false);
              }}
              className="px-3 py-1 bg-slate-800 hover:bg-slate-700 text-amber-300 rounded-lg text-xs font-bold transition cursor-pointer flex items-center gap-1.5"
            >
              <span>Back to Launch Timer</span>
            </button>
          </div>
        </div>
      )}

      {/* Modern, High-Performance EdWorld Landing Page with Launch Countdown Loop */}
      <ModernEdworldLanding 
        onViewComingSoon={() => {
          setForceComingSoon(true);
          setPreviewMode(false);
        }}
      />
    </div>
  );
}
