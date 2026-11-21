"use client";

import React, { useState } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { 
  Sparkles, 
  Check, 
  Copy, 
  Palette, 
  Type, 
  Layers, 
  MousePointer, 
  ArrowRight,
  Shield,
  Clock,
  Compass,
  Code2,
  Droplet
} from "lucide-react";

export default function StyleGuidePage() {
  if (process.env.NODE_ENV === "production") {
    notFound();
  }
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedCode(text);
    setTimeout(() => setCopiedCode(null), 1800);
  };

  const colorTokens = [
    { name: "Liquid Canvas", hex: "#F8FAFC", tw: ".liquid-mesh-canvas", role: "Iridescent mesh background with ambient drifting orbs" },
    { name: "Frosted Glass Card", hex: "rgba(255, 255, 255, 0.68)", tw: ".liquid-glass-card", role: "Translucent backdrop-blur-xl card panels" },
    { name: "Glass Border Highlight", hex: "rgba(255, 255, 255, 0.8)", tw: "border-white/80", role: "Specular rim reflection lighting" },
    { name: "Text High Contrast", hex: "#0F172A", tw: "text-slate-900", role: "Headings, titles, high-contrast labels" },
    { name: "Text Secondary Slate", hex: "#475569", tw: "text-slate-600", role: "Subtitles, body copy, descriptions" },
    { name: "Liquid Primary Glow", hex: "#2563EB", tw: ".liquid-btn-primary", role: "Specular radial highlight call-to-actions" },
    { name: "Liquid Pill Capsule", hex: "rgba(255, 255, 255, 0.7)", tw: ".liquid-pill", role: "Filter pills, badges, interactive chips" },
    { name: "Frosted Input Surface", hex: "rgba(255, 255, 255, 0.65)", tw: ".liquid-input", role: "Frosted glass inputs with blue focus rings" },
  ];

  return (
    <div className="min-h-screen text-slate-900 font-sans pb-24">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-14 space-y-12 animate-in fade-in">
        
        {/* Header Hero */}
        <div className="liquid-glass-card p-8 sm:p-12 shadow-xl">
          <div className="max-w-3xl space-y-4">
            <div className="flex flex-wrap items-center gap-2">
              <span className="liquid-pill text-xs font-semibold px-3 py-1 bg-blue-500/10 text-blue-700 border-blue-500/20 flex items-center gap-1.5">
                <Droplet className="w-3.5 h-3.5 text-blue-600" />
                Design System v4.0
              </span>
              <span className="liquid-pill text-xs font-semibold px-3 py-1 bg-emerald-500/10 text-emerald-700 border-emerald-500/20">
                Liquid Glassmorphism
              </span>
            </div>

            <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-slate-900">
              EdWorld Liquid Glass Design System
            </h1>
            <p className="text-base sm:text-lg text-slate-600 leading-relaxed">
              Multi-layered frosted glass panels, GPU-accelerated fluid aurora mesh canvas, specular rim highlights, and high-contrast typography powering the entire EdWorld engineering platform.
            </p>
          </div>
        </div>

        {/* Color Palette Section */}
        <div className="space-y-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl liquid-glass-card flex items-center justify-center text-slate-900 shadow-xs">
              <Palette className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-900">Core Liquid Primitives &amp; Tokens</h2>
              <p className="text-sm text-slate-500">Accessible contrast ratios adhering to WCAG 2.1 AA standards with iridescent glass reflections.</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {colorTokens.map((c) => (
              <div 
                key={c.name}
                onClick={() => copyToClipboard(c.tw)}
                className="group cursor-pointer liquid-glass-card hover:bg-white/90 p-4 transition-all"
              >
                <div 
                  className="w-full h-20 rounded-xl mb-3 border border-white/90 shadow-inner flex items-center justify-center"
                  style={{ backgroundColor: c.hex.startsWith("#") ? c.hex : undefined, background: c.hex.startsWith("rgba") ? c.hex : undefined }}
                >
                  <span className="liquid-pill text-[10px] font-mono font-bold text-slate-700 bg-white/80 px-2 py-0.5 shadow-2xs">
                    {c.tw}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="font-bold text-sm text-slate-900">{c.name}</span>
                  <span className="text-xs font-mono text-slate-500 bg-white/70 px-2 py-0.5 rounded-lg border border-slate-200">
                    {copiedCode === c.tw ? "Copied!" : "Copy"}
                  </span>
                </div>
                <p className="text-xs text-slate-500 mt-1">{c.role}</p>
              </div>
            ))}
          </div>
        </div>

        {/* UI Primitives & Button Standards */}
        <div className="space-y-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl liquid-glass-card flex items-center justify-center text-slate-900 shadow-xs">
              <MousePointer className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-900">Interactive Liquid Primitives</h2>
              <p className="text-sm text-slate-500">Specular reflections, pill curvature, and tactile hover states.</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Button Variants */}
            <div className="liquid-glass-card p-6 shadow-xs space-y-4">
              <h3 className="font-bold text-base text-slate-900">Buttons &amp; Controls</h3>
              <div className="flex flex-wrap items-center gap-3">
                <button className="liquid-btn-primary px-5 py-2.5 text-xs font-semibold flex items-center gap-2 cursor-pointer shadow-md">
                  <span>Liquid Primary</span>
                  <ArrowRight className="w-3.5 h-3.5 text-white" />
                </button>
                <button className="liquid-btn-secondary px-5 py-2.5 text-xs font-semibold cursor-pointer">
                  Liquid Secondary
                </button>
                <button className="liquid-pill px-4 py-2 text-xs font-semibold bg-emerald-500/15 text-emerald-800 border-emerald-500/30 cursor-pointer">
                  Liquid Capsule
                </button>
              </div>

              <div className="pt-2">
                <input
                  type="text"
                  placeholder="Interactive .liquid-input preview..."
                  className="liquid-input w-full px-3.5 py-2.5 text-xs"
                />
              </div>
            </div>

            {/* Badge Variants */}
            <div className="liquid-glass-card p-6 shadow-xs space-y-4">
              <h3 className="font-bold text-base text-slate-900">Liquid Status Badges</h3>
              <div className="flex flex-wrap items-center gap-2">
                <span className="liquid-pill inline-flex items-center gap-1.5 px-3 py-1 text-xs font-semibold bg-emerald-500/15 text-emerald-800 border-emerald-500/25">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  Verified Safe
                </span>
                <span className="liquid-pill inline-flex items-center gap-1.5 px-3 py-1 text-xs font-semibold bg-blue-500/10 text-blue-700 border-blue-500/20">
                  <Clock className="w-3 h-3 text-blue-600" />
                  In Progress
                </span>
                <span className="liquid-pill inline-flex items-center gap-1.5 px-3 py-1 text-xs font-semibold bg-amber-500/15 text-amber-900 border-amber-500/25">
                  Needs Review
                </span>
                <span className="liquid-pill inline-flex items-center gap-1.5 px-3 py-1 text-xs font-semibold bg-rose-500/10 text-rose-800 border-rose-500/20">
                  High Risk Flag
                </span>
              </div>

              <div className="p-3.5 rounded-xl liquid-glass-card bg-white/70 border-white/80 text-xs text-slate-600">
                All badges utilize <code className="text-slate-900 font-mono font-semibold">.liquid-pill</code> with subtle inner highlights and semi-transparent alpha tints to maintain high visual contrast.
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
