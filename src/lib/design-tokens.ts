/**
 * EdWorld Co. Studio Design Tokens
 * Hand-crafted human-design-studio token architecture.
 * Multi-colour subject palette, physical tactile drop-shadows, and typography tokens.
 */

export interface PlatformPillarTheme {
  id: string;
  name: string;
  tagline: string;
  color: string;
  bgColor: string;
  textColor: string;
  badgeBg: string;
  badgeText: string;
  borderColor: string;
  lightShade: string;
  accentShadow: string;
  iconName: string;
  href: string;
}

export type SubjectTheme = PlatformPillarTheme;

export const SUBJECT_THEMES: Record<string, PlatformPillarTheme> = {
  interviews: {
    id: "interviews",
    name: "3D Mock Interviews",
    tagline: "Lockdown anti-cheat mode, neural voice speech questions, and STAR answer analytics",
    color: "#FF6B6B", // Coral
    bgColor: "#FFF0F0",
    textColor: "#FFFFFF",
    badgeBg: "#FF6B6B",
    badgeText: "#FFFFFF",
    borderColor: "#1B1B2F",
    lightShade: "#FEE2E2",
    accentShadow: "4px 4px 0px #1B1B2F",
    iconName: "Video",
    href: "/interviews",
  },
  resumes: {
    id: "resumes",
    name: "ATS Resume & Job Matcher",
    tagline: "Google X-Y-Z formula optimizer with strict 98% enterprise ATS compliance",
    color: "#FFC93C", // Sunshine Yellow
    bgColor: "#FFF8E6",
    textColor: "#1B1B2F",
    badgeBg: "#FFC93C",
    badgeText: "#1B1B2F",
    borderColor: "#1B1B2F",
    lightShade: "#FEF3C7",
    accentShadow: "4px 4px 0px #1B1B2F",
    iconName: "FileText",
    href: "/resumes",
  },
  myra: {
    id: "myra",
    name: "Myra AI Career Copilot",
    tagline: "Grounded career mentor, study timetables, and personalized doubt resolution",
    color: "#2EC4B6", // Teal
    bgColor: "#EBFBFA",
    textColor: "#1B1B2F",
    badgeBg: "#2EC4B6",
    badgeText: "#1B1B2F",
    borderColor: "#1B1B2F",
    lightShade: "#CCFBF1",
    accentShadow: "4px 4px 0px #1B1B2F",
    iconName: "Brain",
    href: "/dashboard",
  },
  career_os: {
    id: "career_os",
    name: "Scam Checker & Career OS",
    tagline: "0-100 risk score fraud detection and 1/3/5-year multi-horizon roadmaps",
    color: "#4D96FF", // Sky Blue
    bgColor: "#EEF5FF",
    textColor: "#FFFFFF",
    badgeBg: "#4D96FF",
    badgeText: "#FFFFFF",
    borderColor: "#1B1B2F",
    lightShade: "#DBEAFE",
    accentShadow: "4px 4px 0px #1B1B2F",
    iconName: "ShieldCheck",
    href: "/career/scam-checker",
  },
  network: {
    id: "network",
    name: "Verified Student Network",
    tagline: "Digital portfolio ID card, verified projects, and safe peer networking",
    color: "#6BCB77", // Leaf Green
    bgColor: "#F0FAF2",
    textColor: "#1B1B2F",
    badgeBg: "#6BCB77",
    badgeText: "#1B1B2F",
    borderColor: "#1B1B2F",
    lightShade: "#DCFCE7",
    accentShadow: "4px 4px 0px #1B1B2F",
    iconName: "Users",
    href: "/network",
  },
};

// Aliases for backwards compatibility
export const PLATFORM_PILLARS = SUBJECT_THEMES;

export const STUDIO_PALETTE = {
  // Base Foundations
  canvasWarm: "#FFF8EE",
  canvasParchment: "#F7EEDB",
  canvasWhite: "#FFFFFF",
  inkDeep: "#1B1B2F",
  inkMuted: "#4A4A68",
  inkSubtle: "#7E7E9A",
  inkBorder: "#1B1B2F",
  
  // Dark Mode Foundations
  darkCanvas: "#121224",
  darkSurface: "#1B1B34",
  darkBorder: "#2E2E52",
  darkText: "#F4F3FF",
  darkMuted: "#9E9EBF",

  // Subject Accents
  accents: {
    yellow: "#FFC93C",
    coral: "#FF6B6B",
    teal: "#2EC4B6",
    blue: "#4D96FF",
    grape: "#8E6CEF",
    green: "#6BCB77",
  },

  // Physical Studio Shadows
  shadows: {
    sm: "2px 2px 0px #1B1B2F",
    md: "4px 4px 0px #1B1B2F",
    lg: "6px 6px 0px #1B1B2F",
    xl: "8px 8px 0px #1B1B2F",
    hover: "6px 6px 0px #1B1B2F",
  },
};

/**
 * Human Figma Studio v5.0 Design System Tokens
 * Maximalist precision, layered tactile depth, and jewel-tone accents.
 */
export const FIGMA_STUDIO_TOKENS = {
  surfaces: {
    glassWhite: "bg-white/90 backdrop-blur-2xl border border-white/90 shadow-[0_12px_40px_rgba(15,23,42,0.06)]",
    glassFrosted: "bg-white/75 backdrop-blur-xl border border-white/80 shadow-[0_8px_30px_rgba(15,23,42,0.04)]",
    glassRaised: "bg-white/95 backdrop-blur-2xl border border-white shadow-[0_20px_50px_rgba(15,23,42,0.08),inset_0_1px_0_rgba(255,255,255,0.9)]",
    darkGlass: "bg-slate-900/90 backdrop-blur-2xl border border-slate-800 text-white shadow-2xl",
    insetWell: "bg-slate-50/80 border border-slate-200/70 shadow-inner rounded-2xl",
  },
  jewels: {
    emerald: {
      dot: "bg-emerald-500",
      text: "text-emerald-700",
      badge: "bg-emerald-50 text-emerald-800 border-emerald-200",
      glow: "shadow-[0_0_20px_rgba(16,185,129,0.25)]",
    },
    amber: {
      dot: "bg-amber-500",
      text: "text-amber-700",
      badge: "bg-amber-50 text-amber-800 border-amber-200",
      glow: "shadow-[0_0_20px_rgba(245,158,11,0.25)]",
    },
    blue: {
      dot: "bg-blue-500",
      text: "text-blue-700",
      badge: "bg-blue-50 text-blue-800 border-blue-200",
      glow: "shadow-[0_0_20px_rgba(59,130,246,0.25)]",
    },
    coral: {
      dot: "bg-rose-500",
      text: "text-rose-700",
      badge: "bg-rose-50 text-rose-800 border-rose-200",
      glow: "shadow-[0_0_20px_rgba(244,63,94,0.25)]",
    },
    violet: {
      dot: "bg-indigo-500",
      text: "text-indigo-700",
      badge: "bg-indigo-50 text-indigo-800 border-indigo-200",
      glow: "shadow-[0_0_20px_rgba(99,102,241,0.25)]",
    },
  },
  stamps: [
    "4D STAR VERIFIED",
    "HARVARD ATS 98%",
    "DPDP 2023 COMPLIANT",
    "1,000 Q / 46 SECTORS",
    "GITHUB PROOF VERIFIED",
    "LOCKDOWN ANTI-CHEAT",
  ],
};
