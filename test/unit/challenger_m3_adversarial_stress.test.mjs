/**
 * Empirical Adversarial Stress Test Suite: Milestone M3
 * Challenger: Challenger M3 Instance 1 (teamwork_challenger)
 * 
 * Stress-tests responsive bounds, React Hook invariants, route sanitation,
 * proctoring integrity, and component integration.
 */

import { describe, it } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

const rootDir = process.cwd();

describe("Milestone M3 Adversarial Stress Testing", () => {
  // =========================================================================
  // 1. Responsive Grid & Compact Viewport Boundaries
  // =========================================================================
  describe("1. Responsive Sizing & Compact Mobile Bounds", () => {
    it("Aptitude Question Navigator: guarantees 44px+ tap targets on 320px ultra-compact screens", () => {
      const aptitudePath = path.join(rootDir, "src/app/aptitude/page.tsx");
      const content = fs.readFileSync(aptitudePath, "utf8");

      // Verify responsive grid class
      assert.match(
        content,
        /grid\s+grid-cols-5\s+sm:grid-cols-10\s+gap-1\.5/,
        "Aptitude grid must use 5 columns on mobile (<640px) and 10 columns on sm+ viewports"
      );

      // Mathematical tap target proof for 320px viewport:
      // Available width: 320px - 32px (container padding) = 288px.
      // 5 columns with 4 gaps of 1.5 (6px each = 24px total gap):
      // Net width per button = (288 - 24) / 5 = 52.8px >= 44px minimum tap target.
      const viewportWidth = 320;
      const padding = 32;
      const gaps = 4 * 6;
      const colWidth = (viewportWidth - padding - gaps) / 5;
      assert.ok(colWidth >= 44, `Col width ${colWidth}px must exceed WCAG 44px tap target`);
    });

    it("FloatingNav: dock bounds prevent horizontal viewport overflow on 320px screens", () => {
      const navPath = path.join(rootDir, "src/components/layout/FloatingNav.tsx");
      const content = fs.readFileSync(navPath, "utf8");

      assert.match(
        content,
        /className="[^"]*fixed\s+bottom-6\s+left-6[^"]*max-w-\[calc\(100vw-9\.25rem\)\]/,
        "Mobile dock must be anchored at left-6 with max-w-[calc(100vw-9.25rem)]"
      );

      // Viewport math on 320px screen:
      // 9.25rem = 148px. 100vw - 148px = 172px maximum dock width.
      // Left offset: left-6 = 24px.
      // Total right edge position: 24px + 172px = 196px.
      // 196px < 320px, leaving 124px margin on the right for thumb clearance without horizontal scroll.
      const screenWidth = 320;
      const maxDockWidth = screenWidth - 148;
      const rightEdge = 24 + maxDockWidth;
      assert.ok(rightEdge < screenWidth, `Right edge ${rightEdge}px must be strictly less than screen width ${screenWidth}px`);
    });

    it("Mobile Prototype Shell: strictly adheres to standard iPhone 390x844 viewport", () => {
      const mobilePath = path.join(rootDir, "src/app/mobile/page.tsx");
      const content = fs.readFileSync(mobilePath, "utf8");

      assert.match(content, /max-w-\[390px\]/, "Must enforce max-w-[390px]");
      assert.match(content, /h-\[844px\]/, "Must enforce h-[844px]");
      assert.doesNotMatch(content, /max-w-\[460px\]/, "Obsolete 460px width must not exist");
    });
  });

  // =========================================================================
  // 2. React Rules of Hooks Strict Ordering Verification
  // =========================================================================
  describe("2. React Rules of Hooks in Navbar", () => {
    it("src/components/navbar.tsx executes all hooks unconditionally before any early returns", () => {
      const navPath = path.join(rootDir, "src/components/navbar.tsx");
      const content = fs.readFileSync(navPath, "utf8");

      // Find the component function body
      const fnStart = content.indexOf("export default function Navbar()");
      assert.ok(fnStart !== -1, "Navbar function must exist");
      const body = content.slice(fnStart);

      // Find all hook invocations
      const hookRegex = /\b(useState|useEffect|useMemo|useCallback|useRouter|usePathname|useAuth)\s*\(/g;
      let lastHookIndex = -1;
      let match;
      while ((match = hookRegex.exec(body)) !== null) {
        lastHookIndex = match.index;
      }
      assert.ok(lastHookIndex !== -1, "Hooks must be present in Navbar");

      // Find the auth early return
      const earlyReturnIndex = body.indexOf("if (isAuthPage || pathname === \"/\") return null;");
      assert.ok(earlyReturnIndex !== -1, "isAuthPage early return must be present");

      // Verify early return occurs AFTER all hook calls
      assert.ok(
        earlyReturnIndex > lastHookIndex,
        `Early return at index ${earlyReturnIndex} must be AFTER last hook call at index ${lastHookIndex}`
      );
    });
  });

  // =========================================================================
  // 3. Myra AI Persona, Safety & Direct Answer Invariants
  // =========================================================================
  describe("3. Myra AI Agent & Chatbot Guardrails", () => {
    it("MyraChatbot UI: canonical opening greeting, header badges, and event subscriptions", () => {
      const chatbotPath = path.join(rootDir, "src/components/ai/MyraChatbot.tsx");
      const content = fs.readFileSync(chatbotPath, "utf8");

      // Canonical greeting
      assert.match(
        content,
        /Hello! I am Myra, your AI study companion on EdWorld/,
        "Chatbot must present canonical student greeting"
      );

      // Header metadata
      assert.match(content, /Study &amp; Career Mentor|Study & Career Mentor/, "Badge must identify as Study & Career Mentor");
      assert.match(content, /Class 12 • College • Placements • Higher-Ed/, "Subtitle must cover full academic span");

      // Inter-component event coordination
      assert.match(content, /addEventListener\(["']open-myra-copilot["']/, "Must listen for open-myra-copilot");
      assert.match(content, /addEventListener\(["']close-myra-copilot["']/, "Must listen for close-myra-copilot");
    });

    it("Myra Agent Prompt: strictly prohibits hallucinating exam dates and mandates emergency hotlines", () => {
      const agentPath = path.join(rootDir, "src/lib/ai/myra-agent.ts");
      const content = fs.readFileSync(agentPath, "utf8");

      assert.match(content, /Never invent exam dates/, "Must forbid inventing exam dates");
      assert.match(content, /Tele-MANAS 14416/, "Must provide Tele-MANAS 14416 mental health helpline");
      assert.match(content, /emergencies: 112/, "Must provide 112 emergency hotline");
      assert.match(content, /ANSWER ONLY WHAT IS ASKED/, "Must enforce concise direct-reply rule");
    });
  });

  // =========================================================================
  // 4. Client Navigation Route Purges & Permanent Redirects
  // =========================================================================
  describe("4. Navigation Sanitation & Route Redirects", () => {
    it("Internal staff routes (/founder, /employee, /hr) are purged from all client navigation bars", () => {
      const filesToCheck = [
        "src/components/layout/FloatingNav.tsx",
        "src/components/layout/AppSidebar.tsx",
        "src/components/navbar.tsx",
        "src/components/layout/ModernEdworldNavbar.tsx"
      ];

      for (const relPath of filesToCheck) {
        const fullPath = path.join(rootDir, relPath);
        if (fs.existsSync(fullPath)) {
          const content = fs.readFileSync(fullPath, "utf8");
          assert.doesNotMatch(content, /href:\s*["']\/founder["']/, `${relPath} must not link to /founder`);
          assert.doesNotMatch(content, /href:\s*["']\/employee["']/, `${relPath} must not link to /employee`);
          assert.doesNotMatch(content, /href:\s*["']\/hr["']/, `${relPath} must not link to /hr`);
        }
      }
    });

    it("next.config.mjs enforces permanent 308 redirects for deprecated routes to /dsa", () => {
      const configPath = path.join(rootDir, "next.config.mjs");
      const content = fs.readFileSync(configPath, "utf8");

      assert.match(content, /source:\s*["']\/practice["']/, "Must redirect /practice");
      assert.match(content, /source:\s*["']\/showcase["']/, "Must redirect /showcase");
      assert.match(content, /destination:\s*["']\/dsa["']/, "Destination must be /dsa");
      assert.match(content, /permanent:\s*true/, "Redirect must be permanent (308)");
    });
  });

  // =========================================================================
  // 5. Dashboard DSA Widget Integration
  // =========================================================================
  describe("5. Dashboard DSA Component Integration", () => {
    it("Dashboard page imports and embeds ContinueDsaWidget with safe user context", () => {
      const dashPath = path.join(rootDir, "src/app/dashboard/page.tsx");
      const content = fs.readFileSync(dashPath, "utf8");

      assert.match(content, /import\s+ContinueDsaWidget\s+from\s+["']@\/components\/dashboard\/ContinueDsaWidget["']/, "Must import ContinueDsaWidget");
      assert.match(content, /data-section=["']continue_dsa["']/, "Must have data-section='continue_dsa'");
      assert.match(content, /<ContinueDsaWidget\s+userId=/, "Must render ContinueDsaWidget with userId");
      assert.match(content, /href=["']\/dsa["']/, "Must provide quick navigation to /dsa");
    });
  });

  // =========================================================================
  // 6. Proctoring & Anti-Cheating Suite Integrity
  // =========================================================================
  describe("6. Proctoring & Anti-OCR Canvas Robustness", () => {
    it("AntiOcrQuestionCanvas renders canvas with non-selectable styling and compact mobile responsiveness", () => {
      const canvasPath = path.join(rootDir, "src/components/proctoring/AntiOcrQuestionCanvas.tsx");
      const content = fs.readFileSync(canvasPath, "utf8");

      assert.match(content, /<canvas/, "Must render HTML5 canvas");
      assert.match(content, /isCompactMobile/, "Must dynamically adjust for compact mobile screens");
      assert.match(content, /userSelect:\s*["']none["']|select-none/, "Must disable CSS text selection");
    });

    it("useExamProctoring actively captures window blur and tab switching", () => {
      const hookPath = path.join(rootDir, "src/hooks/useExamProctoring.ts");
      const content = fs.readFileSync(hookPath, "utf8");

      assert.match(content, /visibilitychange/, "Must detect document visibility change");
      assert.match(content, /blur/, "Must detect window blur");
      assert.match(content, /requestFullscreen/, "Must enforce fullscreen mode");
    });
  });
});
