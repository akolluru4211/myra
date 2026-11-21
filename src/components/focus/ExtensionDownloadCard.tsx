"use client";

import React, { useState, useEffect } from "react";
import { 
  Download, 
  ExternalLink, 
  CheckCircle2, 
  Layers, 
  Laptop, 
  Smartphone, 
  ShieldCheck,
  ChevronDown,
  ChevronUp
} from "lucide-react";

export default function ExtensionDownloadCard() {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isExtensionDetected, setIsExtensionDetected] = useState(false);

  useEffect(() => {
    // Check if extension is installed by sending a ping event
    if (typeof window !== "undefined") {
      const handleMessage = (e: MessageEvent) => {
        if (e.data && e.data.type === "EDWORLD_FOCUS_GUARD_PONG") {
          setIsExtensionDetected(true);
        }
      };
      window.addEventListener("message", handleMessage);
      window.postMessage({ type: "EDWORLD_FOCUS_GUARD_PING" }, "*");

      return () => window.removeEventListener("message", handleMessage);
    }
  }, []);

  return (
    <div className="liquid-glass-card overflow-hidden text-slate-900 font-sans">
      
      {/* Header Strip */}
      <div className="p-6 sm:p-7 flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200/60">
        <div className="space-y-1.5 max-w-xl">
          <div className="flex items-center gap-2">
            <span className="liquid-pill px-2.5 py-0.5 bg-blue-500/10 border-blue-500/20 text-blue-700 text-xs font-semibold">
              Browser Extension
            </span>
            <span className="text-[11px] font-mono font-medium text-slate-500">Manifest V3</span>
            {isExtensionDetected ? (
              <span className="liquid-pill px-2 py-0.5 bg-emerald-500/15 border-emerald-500/30 text-[10px] font-semibold text-emerald-800 flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3 text-emerald-600" /> Active &amp; Connected
              </span>
            ) : (
              <span className="liquid-pill px-2 py-0.5 bg-white/70 border-white/80 text-[10px] font-medium text-slate-600">
                Optional URL Blocker
              </span>
            )}
          </div>

          <h3 className="text-xl font-bold text-slate-900 tracking-tight">
            EdWorld Focus Guard Companion
          </h3>

          <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
            Want browser-level URL blocking? When active, this lightweight companion stops you from opening 
            <strong className="text-slate-900"> instagram.com</strong>, <strong className="text-slate-900">snapchat.com</strong>, <strong className="text-slate-900">discord.com</strong>, or <strong className="text-slate-900">youtube.com</strong> across all Chrome/Edge tabs and brings you back to study.
          </p>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <button
            type="button"
            onClick={() => setIsExpanded(!isExpanded)}
            className="liquid-btn-secondary px-4 py-2 text-xs font-semibold inline-flex items-center gap-1.5 cursor-pointer"
          >
            <span>{isExpanded ? "Hide Setup Guide" : "Install Instructions"}</span>
            {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Expanded Installation Steps & Mobile Guidance */}
      {isExpanded && (
        <div className="p-6 sm:p-7 bg-white/40 space-y-6 animate-in fade-in duration-150 border-t border-slate-200/60">
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            
            {/* Desktop Chrome/Edge Guide */}
            <div className="p-5 rounded-xl liquid-glass-card bg-white/70 border-white/80 space-y-3 shadow-xs">
              <div className="flex items-center gap-2 text-xs font-bold text-slate-900">
                <Laptop className="w-4 h-4 text-blue-600" />
                <span>Desktop Setup (Chrome, Edge, Brave):</span>
              </div>

              <ol className="space-y-2 text-xs text-slate-600">
                <li className="flex items-start gap-2">
                  <span className="w-5 h-5 rounded-md bg-slate-900 text-white text-[10px] font-mono font-bold flex items-center justify-center shrink-0 mt-0.5">
                    1
                  </span>
                  <span>
                    Open a new tab and go to <code className="px-1.5 py-0.5 rounded bg-white/80 border border-slate-200 font-mono text-[11px] text-slate-900">chrome://extensions</code>
                  </span>
                </li>

                <li className="flex items-start gap-2">
                  <span className="w-5 h-5 rounded-md bg-slate-900 text-white text-[10px] font-mono font-bold flex items-center justify-center shrink-0 mt-0.5">
                    2
                  </span>
                  <span>
                    Toggle on <strong>Developer Mode</strong> in the top-right corner.
                  </span>
                </li>

                <li className="flex items-start gap-2">
                  <span className="w-5 h-5 rounded-md bg-slate-900 text-white text-[10px] font-mono font-bold flex items-center justify-center shrink-0 mt-0.5">
                    3
                  </span>
                  <span>
                    Click <strong>Load Unpacked</strong> and select the directory:
                    <br />
                    <code className="text-[10px] font-mono bg-white/90 text-slate-900 p-1.5 rounded-lg border border-slate-200 block mt-1 select-all break-all shadow-xs">
                      public/extensions/edworld-focus-guard
                    </code>
                  </span>
                </li>
              </ol>

              <div className="pt-2">
                <a
                  href="/extensions/edworld-focus-guard/manifest.json"
                  download="manifest.json"
                  className="inline-flex items-center gap-1.5 text-xs font-semibold text-blue-600 hover:underline"
                >
                  <Download className="w-3.5 h-3.5 text-blue-600" />
                  <span>Inspect Extension Bundle Files</span>
                </a>
              </div>
            </div>

            {/* Mobile / Native App Guidance */}
            <div className="p-5 rounded-xl liquid-glass-card bg-white/70 border-white/80 space-y-3 shadow-xs">
              <div className="flex items-center gap-2 text-xs font-bold text-slate-900">
                <Smartphone className="w-4 h-4 text-amber-600" />
                <span>Mobile Setup (Android &amp; iOS App Limits):</span>
              </div>

              <div className="space-y-2 text-xs text-slate-600">
                <div className="p-2.5 rounded-lg liquid-glass-card bg-white/60 border-white/70">
                  <strong className="text-slate-900 block text-xs">Android Digital Wellbeing:</strong>
                  <span>Go to Settings &rarr; Digital Wellbeing &rarr; Focus Mode. Select Instagram &amp; Snapchat to pause them automatically during study sessions.</span>
                </div>

                <div className="p-2.5 rounded-lg liquid-glass-card bg-white/60 border-white/70">
                  <strong className="text-slate-900 block text-xs">iOS Screen Time:</strong>
                  <span>Go to Settings &rarr; Screen Time &rarr; App Limits. Add limit for Social &amp; Games with "Block at End of Limit" enabled.</span>
                </div>
              </div>
            </div>

          </div>

        </div>
      )}

    </div>
  );
}
