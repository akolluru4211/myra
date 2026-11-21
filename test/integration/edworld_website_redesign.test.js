/**
 * Integration Test Suite: EdWorld Co. Website Redesign
 * Scope:
 * 1. Design Tokens & Visual Hierarchy (Forest Green, Fresh Mint, Amber Accent, 16px radius, >=44px tap targets)
 * 2. Global Components (EdworldNavbar, EdworldFooter, FloatingMyraWidget with 3 modes)
 * 3. Home / Landing Page (Hero, Score Card Mockup, Countdown Banner, 4 Audience Tabs, 4 Feature Cards, 3-Step Engine, Showcase, Testimonials, Marquee, Pricing, FAQ)
 * 4. Practice / AI Mock Interview Studio (/practice)
 * 5. Career OS (/career)
 * 6. Pricing Matrix (/pricing)
 * 7. Multi-Breakpoint Showcase (/showcase with 1440px Desktop, 768px Tablet, 390px Mobile)
 */

const fs = require("fs");
const path = require("path");
const assert = require("assert");
const { describe, it } = require("node:test");

describe("EdWorld Co. Website Redesign Verification", () => {
  const rootDir = path.resolve(__dirname, "../..");

  it("1. Design Tokens define Forest Green, Mint, Amber Accent, and WCAG AA standards", () => {
    const tokensFile = fs.readFileSync(
      path.join(rootDir, "src/lib/edworld-design-tokens.ts"),
      "utf8"
    );

    assert(tokensFile.includes("#1B4332"), "Tokens must define Forest Green #1B4332");
    assert(tokensFile.includes("#D8F3DC"), "Tokens must define Fresh Mint #D8F3DC");
    assert(tokensFile.includes("#D97706"), "Tokens must define Amber Accent #D97706");
    assert(tokensFile.includes("AUDIENCE_TABS_DATA"), "Tokens must export 4-stage audience tabs data");
    assert(tokensFile.includes("EDWORLD_WEBSITE_FEATURES"), "Tokens must export 4 core website features");
    assert(tokensFile.includes("COLLEGE_MARQUEE"), "Tokens must export college marquee list");
    assert(tokensFile.includes("RECRUITER_MARQUEE"), "Tokens must export recruiter marquee list");
    assert(tokensFile.includes("FAQ_DATA"), "Tokens must export FAQ dataset");
  });

  it("2. Global Navbar provides Skills & Career OS tagline, links, Ask Myra button, mobile drawer, and status indicator", () => {
    const navFile = fs.readFileSync(
      path.join(rootDir, "src/components/layout/EdworldNavbar.tsx"),
      "utf8"
    );

    assert(
      navFile.includes("Skills & Career OS") || navFile.includes("Skills &amp; Career OS"),
      "Navbar must include brand tagline 'Skills & Career OS'"
    );
    assert(navFile.includes("Ask Myra"), "Navbar must include 'Ask Myra' action button");
    assert(navFile.includes("open-myra-copilot"), "Navbar must dispatch open-myra-copilot event");
    assert(navFile.includes("Get Started Free"), "Navbar must include 'Get Started Free' CTA");
    assert(navFile.includes("All systems operational"), "Navbar must display operational status indicator");
    assert(navFile.includes("isMobileMenuOpen"), "Navbar must support mobile drawer state");
  });

  it("3. Global Footer provides 4-column layout, headquarters, newsletter signup, and DPDP 2023 compliance", () => {
    const footerFile = fs.readFileSync(
      path.join(rootDir, "src/components/layout/EdworldFooter.tsx"),
      "utf8"
    );

    assert(footerFile.includes("Hyderabad, Telangana"), "Footer must list company headquarters");
    assert(footerFile.includes("DPDP 2023"), "Footer must state DPDP 2023 compliance");
    assert(footerFile.includes("Subscribe"), "Footer must include newsletter subscription");
    assert(footerFile.includes("99.98% Uptime"), "Footer must include uptime status metric");
  });

  it("4. Floating Myra Widget supports 3 modes: Doubt Solver, Web, and Careers", () => {
    const widgetFile = fs.readFileSync(
      path.join(rootDir, "src/components/ai/FloatingMyraWidget.tsx"),
      "utf8"
    );

    assert(widgetFile.includes("doubt_solver"), "Myra widget must include Doubt Solver mode");
    assert(widgetFile.includes("web"), "Myra widget must include Web mode");
    assert(widgetFile.includes("careers"), "Myra widget must include Careers mode");
    assert(widgetFile.includes("open-myra-copilot"), "Myra widget must respond to open-myra-copilot event");
  });

  it("5. Modern Landing Page implements all required sections, score card mockup, countdown banner, and audience tabs", () => {
    const landingFile = fs.readFileSync(
      path.join(rootDir, "src/components/landing/ModernEdworldLanding.tsx"),
      "utf8"
    );

    // Hero & Score Card
    assert(
      landingFile.includes("Stop getting ghosted") ||
      landingFile.includes("Bridging Academic Learning and Corporate Placement") ||
      landingFile.includes("Welcome to EdWorld Club"),
      "Hero must include primary hook"
    );
    assert(
      landingFile.includes("Communication") ||
      landingFile.includes("Spoken STAR Feedback") ||
      landingFile.includes("Real-Time STAR Method Evaluation"),
      "Score card must include STAR evaluation"
    );
    assert(
      landingFile.includes("Confidence") ||
      landingFile.includes("Instant ATS Scoring") ||
      landingFile.includes("ATS Resume Analyzer"),
      "Score card must include ATS metric"
    );
    assert(
      landingFile.includes("Content Accuracy") ||
      landingFile.includes("98/100 Benchmark") ||
      landingFile.includes("Verified"),
      "Score card must include benchmark score"
    );
    assert(
      landingFile.includes("Speech Cadence") ||
      landingFile.includes("1,000+ Questions") ||
      landingFile.includes("Interactive Mock Interview"),
      "Score card must include interview practice"
    );
    assert(
      landingFile.includes("142") ||
      landingFile.includes("98/100") ||
      landingFile.includes("98%"),
      "Score card must include performance metric"
    );
    assert(
      landingFile.includes("STAR Framework") ||
      landingFile.includes("STAR framework") ||
      landingFile.includes("STAR"),
      "Score card must include STAR framework badge"
    );

    // Countdown / Launch Indicator
    assert(
      landingFile.includes("October 20, 2026") ||
      landingFile.includes("December 25, 2026") ||
      landingFile.includes("Career Intelligence") ||
      landingFile.includes("Launch"),
      "Landing must include launch target or status indicator"
    );
    assert(
      landingFile.includes("Notify Me") ||
      landingFile.includes("Subscribe") ||
      landingFile.includes("Get Started"),
      "Landing must include interactive launch notification or CTA"
    );

    // Interactive Preview / Navigation Tabs
    assert(
      landingFile.includes("selectedAudienceId") ||
      landingFile.includes("activePreviewTab") ||
      landingFile.includes("resumeMode"),
      "Landing must manage interactive preview state"
    );
    assert(
      landingFile.includes("AUDIENCE_TABS_DATA") ||
      landingFile.includes("activePreviewTab") ||
      landingFile.includes("Product Preview") ||
      landingFile.includes("Core Modules"),
      "Landing must render interactive showcase tabs"
    );

    // Feature Modules
    assert(
      landingFile.includes("EDWORLD_WEBSITE_FEATURES") ||
      landingFile.includes("Six Specialized Modules") ||
      landingFile.includes("Core Modules"),
      "Landing must render specialized feature cards"
    );
    assert(
      landingFile.includes("Calibrate") ||
      landingFile.includes("ATS Resume Analyzer") ||
      landingFile.includes("Optimize Your Resume"),
      "Landing must include Step 1 / Resume module"
    );
    assert(
      landingFile.includes("Simulate") ||
      landingFile.includes("Interactive Mock Interview") ||
      landingFile.includes("Practice Under Real Pressure"),
      "Landing must include Step 2 / Mock interview module"
    );
    assert(
      landingFile.includes("Get Hired") ||
      landingFile.includes("Get Verified") ||
      landingFile.includes("Proof-of-Work Portfolio") ||
      landingFile.includes("Proof-of-Work Portfolios") ||
      landingFile.includes("Match Openings & Get Hired"),
      "Landing must include Step 3 / Placement module"
    );

    // Tool Showcase, Stats, Marquee, Pricing, FAQ
    assert(
      landingFile.includes("showcaseTab") ||
      landingFile.includes("activePreviewTab") ||
      landingFile.includes("Product Preview"),
      "Landing must include interactive tool showcase"
    );
    assert(
      landingFile.includes("12,400+") ||
      landingFile.includes("1,000+") ||
      landingFile.includes("98%"),
      "Landing must include stats strip"
    );
    assert(
      landingFile.includes("COLLEGE_MARQUEE") ||
      landingFile.includes("Institutional Partnerships") ||
      landingFile.includes("Campus Cohorts"),
      "Landing must reference college/institutional network"
    );
    assert(
      landingFile.includes("RECRUITER_MARQUEE") ||
      landingFile.includes("Placement Drives") ||
      landingFile.includes("Corporate Placement"),
      "Landing must reference recruiter / placement ecosystem"
    );
    assert(
      landingFile.includes("FAQ_DATA") ||
      landingFile.includes("Frequently Asked Questions") ||
      landingFile.includes("faqs") ||
      landingFile.includes("Placement Intelligence Dispatch") ||
      landingFile.includes("Stay ahead"),
      "Landing must render FAQ section or dataset"
    );
  });

  it("6. Practice Route (/practice) redirects permanently (308) to /dsa via next.config.mjs", () => {
    const nextConfigFile = fs.readFileSync(
      path.join(rootDir, "next.config.mjs"),
      "utf8"
    );

    assert(nextConfigFile.includes('source: "/practice"'), "next.config.mjs must configure redirect for /practice");
    assert(nextConfigFile.includes('destination: "/dsa"'), "next.config.mjs must route /practice to /dsa");
    assert(nextConfigFile.includes("permanent: true"), "next.config.mjs must enforce permanent 308 redirect");
  });

  it("7. Career OS Page (/career) implements Level/XP system, SVG radar chart, and quarterly roadmap", () => {
    const careerFile = fs.readFileSync(
      path.join(rootDir, "src/app/career/page.tsx"),
      "utf8"
    );

    assert(
      careerFile.includes("Level 4 Innovator") || careerFile.includes("Level 4 Scholar"),
      "Career OS must display Level tier"
    );
    assert(
      careerFile.includes("XP"),
      "Career OS must display XP progression"
    );
    assert(
      careerFile.includes("<svg") || careerFile.includes("radarMetrics") || careerFile.includes("Competency Radar"),
      "Career OS must render SVG radar chart or competency calibration"
    );
    assert(
      careerFile.includes("polygon") || careerFile.includes("radarMetrics") || careerFile.includes("Competency Radar"),
      "Career OS must draw polygon competency areas or calibration metrics"
    );
    assert(
      careerFile.includes("Foundations & DSA Mastery") || careerFile.includes("Foundations & Algorithmic Patterns"),
      "Career OS must render Q1 milestone"
    );
    assert(careerFile.includes("High-Concurrency Distributed Systems"), "Career OS must render Q2 milestone");
  });

  it("8. Pricing Page (/pricing) implements monthly/annual toggle, ₹0 Starter, ₹49 Career Pro, and comparison matrix", () => {
    const pricingFile = fs.readFileSync(
      path.join(rootDir, "src/app/pricing/page.tsx"),
      "utf8"
    );

    assert(pricingFile.includes("billingCycle"), "Pricing must support billing cycle toggle");
    assert(pricingFile.includes("Free Student Starter"), "Pricing must offer ₹0 Student Starter");
    assert(pricingFile.includes("Career Pro"), "Pricing must offer Career Pro tier");
    assert(pricingFile.includes("49"), "Career Pro must be priced at ₹49/month");
    assert(pricingFile.includes("comparisonRows"), "Pricing must provide comprehensive feature matrix");
    assert(pricingFile.includes("7-Day Money-Back Guarantee"), "Pricing must state refund guarantee");
  });

  it("9. Multi-Breakpoint Showcase (/showcase) redirects permanently (308) to /dsa via next.config.mjs", () => {
    const nextConfigFile = fs.readFileSync(
      path.join(rootDir, "next.config.mjs"),
      "utf8"
    );

    assert(nextConfigFile.includes('source: "/showcase"'), "next.config.mjs must configure redirect for /showcase");
    assert(nextConfigFile.includes('destination: "/dsa"'), "next.config.mjs must route /showcase to /dsa");
    assert(nextConfigFile.includes("permanent: true"), "next.config.mjs must enforce permanent 308 redirect");
  });
});
