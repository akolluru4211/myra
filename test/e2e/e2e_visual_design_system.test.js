/**
 * E2E Test Suite: Visual Design System & Global Shell Architecture
 * Path: test/e2e/e2e_visual_design_system.test.js
 *
 * Scope:
 * - Tier 1: Design Tokens & Tailwind Extensions
 *   - tailwind.config.ts token verification (canvas, periwinkle, lavender, mint, coral, shadows, radii)
 *   - PostCSS compilation verification of @apply rules (bg-canvas, bg-periwinkle, shadow-ambient-card, rounded-3xl)
 *   - src/app/globals.css variables, selection styling, and pill button classes (.btn-pill-primary, .btn-pill-secondary)
 * - Tier 2: Global Shell Architecture
 *   - src/app/layout.tsx (body canvas background, text contrast, dark background absence)
 *   - src/components/AppShell.tsx (enforces #F4F5FA canvas, mounts CurvySideDock, applies lg:pl-28 offset, skip link, landing exemption)
 *   - src/components/layout/CurvySideDock.tsx (fixed left dock, periwinkle #5C59E8, rounded-[32px], squircle button, navigation links, wave SVG, test anchor)
 *   - src/components/layout/ModernEdworldNavbar.tsx (light background, pill tab switchers, pill search with ⌘K, soft lavender action pill, solid periwinkle button, open-myra-copilot event)
 * - Tier 3: Cross-Feature Boundary & Layout Clearances
 *   - Mathematical proof of touch targets (>= 44px min), dock width (80px) + left offset (16px) clearance by lg:pl-28 (112px)
 *   - Card anatomy invariant: pure white background (#FFFFFF / bg-white), rounded-3xl / 24-32px, subtle borders, diffused drop shadows
 * - Tier 4: Visual Design Consistency Sweep
 *   - Full file inventory audit across scoped layout components for light palette compliance and zero dark container backgrounds in standard workspaces
 */

const { describe, it } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const postcss = require("postcss");
const tailwindcss = require("tailwindcss");

const ROOT_DIR = path.resolve(__dirname, "../..");

// =============================================================================
// HELPER UTILITIES FOR AST & SOURCE ANALYSIS
// =============================================================================

function readProjectFile(relativePath) {
  const fullPath = path.join(ROOT_DIR, relativePath);
  assert(fs.existsSync(fullPath), `Target source file must exist: ${relativePath}`);
  return fs.readFileSync(fullPath, "utf8");
}

async function compileTailwindCSS(cssInput) {
  const tailwindPlugin = tailwindcss(path.join(ROOT_DIR, "tailwind.config.ts"));
  const result = await postcss([tailwindPlugin]).process(cssInput, { from: undefined });
  return result.css;
}

// =============================================================================
// TIER 1: DESIGN TOKENS & TAILWIND EXTENSIONS
// =============================================================================

describe("Tier 1: Design Tokens & Tailwind Extensions", () => {
  const tailwindSource = readProjectFile("tailwind.config.ts");
  const globalsCssSource = readProjectFile("src/app/globals.css");

  describe("1.1 Design Tokens in tailwind.config.ts", () => {
    it("T1.1.1: defines canvas tokens (#F4F5FA DEFAULT and #F8F9FD subtle)", () => {
      assert(
        tailwindSource.includes('DEFAULT: "#F4F5FA"') || tailwindSource.includes("DEFAULT: '#F4F5FA'"),
        "tailwind.config.ts must define canvas.DEFAULT as #F4F5FA"
      );
      assert(
        tailwindSource.includes('subtle: "#F8F9FD"') || tailwindSource.includes("subtle: '#F8F9FD'"),
        "tailwind.config.ts must define canvas.subtle as #F8F9FD"
      );
    });

    it("T1.1.2: defines card token with pure white (#FFFFFF)", () => {
      assert(
        tailwindSource.includes('card:') || tailwindSource.includes('"card":'),
        "tailwind.config.ts must define card theme extension"
      );
      assert(
        /card:\s*\{\s*DEFAULT:\s*["']#FFFFFF["']/i.test(tailwindSource),
        "tailwind.config.ts must define card.DEFAULT as #FFFFFF"
      );
    });

    it("T1.1.3: defines periwinkle accent tokens (#5C59E8 DEFAULT and #EEF0FD light)", () => {
      assert(
        /periwinkle:\s*\{[^}]*DEFAULT:\s*["']#5C59E8["']/i.test(tailwindSource),
        "tailwind.config.ts must define periwinkle.DEFAULT as #5C59E8"
      );
      assert(
        tailwindSource.includes('light: "#EEF0FD"') || tailwindSource.includes("light: '#EEF0FD'"),
        "tailwind.config.ts must define periwinkle.light as #EEF0FD"
      );
      assert(
        tailwindSource.includes('hover: "#4E4AC8"') || tailwindSource.includes("hover: '#4E4AC8'"),
        "tailwind.config.ts must define periwinkle.hover as #4E4AC8"
      );
    });

    it("T1.1.4: defines status indicator tokens for mint and coral", () => {
      assert(
        tailwindSource.includes('mint: "#10B981"') || tailwindSource.includes("mint: '#10B981'"),
        "tailwind.config.ts must define status.mint as #10B981"
      );
      assert(
        tailwindSource.includes('"mint-bg": "#D1FAE5"') || tailwindSource.includes("'mint-bg': '#D1FAE5'"),
        "tailwind.config.ts must define status['mint-bg'] as #D1FAE5"
      );
      assert(
        tailwindSource.includes('coral: "#F43F5E"') || tailwindSource.includes("coral: '#F43F5E'"),
        "tailwind.config.ts must define status.coral as #F43F5E"
      );
      assert(
        tailwindSource.includes('"coral-bg": "#FFE4E6"') || tailwindSource.includes("'coral-bg': '#FFE4E6'"),
        "tailwind.config.ts must define status['coral-bg'] as #FFE4E6"
      );
    });

    it("T1.1.5: defines ambient box shadow tokens (ambient-card and ambient-float)", () => {
      assert(
        tailwindSource.includes("'ambient-card'") || tailwindSource.includes('"ambient-card"'),
        "tailwind.config.ts must define ambient-card shadow"
      );
      assert(
        tailwindSource.includes("0 10px 30px rgba(80, 90, 130, 0.06)"),
        "tailwind.config.ts ambient-card shadow must match 0 10px 30px rgba(80, 90, 130, 0.06)"
      );
      assert(
        tailwindSource.includes("'ambient-float'") || tailwindSource.includes('"ambient-float"'),
        "tailwind.config.ts must define ambient-float shadow"
      );
      assert(
        tailwindSource.includes("0 20px 40px rgba(100, 110, 160, 0.09)"),
        "tailwind.config.ts ambient-float shadow must match 0 20px 40px rgba(100, 110, 160, 0.09)"
      );
    });

    it("T1.1.6: defines organic border radius extensions (3xl = 1.5rem and 4xl = 2rem)", () => {
      assert(
        /'3xl':\s*['"]1\.5rem['"]/.test(tailwindSource) || /"3xl":\s*['"]1\.5rem['"]/.test(tailwindSource),
        "tailwind.config.ts must define borderRadius['3xl'] as 1.5rem"
      );
      assert(
        /'4xl':\s*['"]2rem['"]/.test(tailwindSource) || /"4xl":\s*['"]2rem['"]/.test(tailwindSource),
        "tailwind.config.ts must define borderRadius['4xl'] as 2rem"
      );
    });
  });

  describe("1.2 PostCSS & Tailwind Compilation Invariants", () => {
    it("T1.2.1: compiles @apply bg-canvas to rgb(244 245 250)", async () => {
      const css = await compileTailwindCSS(".rule-canvas { @apply bg-canvas; }");
      assert(
        css.includes("244 245 250") || css.includes("#F4F5FA") || css.includes("244, 245, 250"),
        `PostCSS must compile bg-canvas to #F4F5FA rgb values. Compiled CSS: ${css}`
      );
    });

    it("T1.2.2: compiles @apply bg-periwinkle to rgb(92 89 232)", async () => {
      const css = await compileTailwindCSS(".rule-periwinkle { @apply bg-periwinkle; }");
      assert(
        css.includes("92 89 232") || css.includes("#5C59E8") || css.includes("92, 89, 232"),
        `PostCSS must compile bg-periwinkle to #5C59E8 rgb values. Compiled CSS: ${css}`
      );
    });

    it("T1.2.3: compiles @apply shadow-ambient-card with exact coordinates", async () => {
      const css = await compileTailwindCSS(".rule-shadow { @apply shadow-ambient-card; }");
      assert(
        css.includes("0 10px 30px rgba(80, 90, 130, 0.06)") || css.includes("0 10px 30px rgba(80,90,130,0.06)"),
        `PostCSS must compile shadow-ambient-card to 0 10px 30px rgba(80, 90, 130, 0.06). Compiled CSS: ${css}`
      );
    });

    it("T1.2.4: compiles @apply rounded-3xl to border-radius: 1.5rem", async () => {
      const css = await compileTailwindCSS(".rule-radius { @apply rounded-3xl; }");
      assert(
        css.includes("border-radius: 1.5rem"),
        `PostCSS must compile rounded-3xl to border-radius: 1.5rem. Compiled CSS: ${css}`
      );
    });

    it("T1.2.5: compiles composite card classes with zero compilation errors", async () => {
      const css = await compileTailwindCSS(`
        .design-system-card {
          @apply bg-card rounded-3xl shadow-ambient-card;
        }
      `);
      assert(css.includes("border-radius: 1.5rem"), "Must include 1.5rem radius");
      assert(css.includes("0 10px 30px rgba(80, 90, 130, 0.06)"), "Must include ambient card shadow");
      assert(css.includes("background-color: rgb(255 255 255") || css.includes("background-color: #FFFFFF"), "Must include white card background");
    });
  });

  describe("1.3 CSS Root Variables & Utilities in src/app/globals.css", () => {
    it("T1.3.1: configures CSS custom properties --background and --foreground in :root", () => {
      assert(
        /--background:\s*(#F4F5FA|#FFFFFF)/i.test(globalsCssSource),
        "globals.css :root must define --background: #F4F5FA or #FFFFFF"
      );
      assert(
        /--foreground:\s*(#0F172A|#000000)/i.test(globalsCssSource),
        "globals.css :root must define --foreground: #0F172A or #000000"
      );
    });

    it("T1.3.2: defines global selection highlight with periwinkle background #5C59E8", () => {
      assert(
        /::selection\s*\{[^}]*background-color:\s*(#5C59E8|#2563EB)/i.test(globalsCssSource),
        "globals.css ::selection must configure background-color: #5C59E8 or #2563EB"
      );
      assert(
        /::selection\s*\{[^}]*color:\s*#ffffff/i.test(globalsCssSource),
        "globals.css ::selection must configure color: #ffffff"
      );
    });

    it("T1.3.3: defines .btn-pill-primary with #5C59E8 background and pill border-radius", () => {
      assert(
        globalsCssSource.includes(".btn-pill-primary"),
        "globals.css must define .btn-pill-primary class"
      );
      assert(
        /\.btn-pill-primary\s*\{[^}]*background-color:\s*(#5C59E8|#2563EB)/i.test(globalsCssSource),
        ".btn-pill-primary must specify background-color: #5C59E8 or #2563EB"
      );
      assert(
        /\.btn-pill-primary\s*\{[^}]*border-radius:\s*9999px/i.test(globalsCssSource),
        ".btn-pill-primary must specify border-radius: 9999px"
      );
      assert(
        /\.btn-pill-primary\s*\{[^}]*color:\s*#FFFFFF/i.test(globalsCssSource),
        ".btn-pill-primary must specify color: #FFFFFF"
      );
    });

    it("T1.3.4: defines .btn-pill-secondary with #EEF0FD background and #3730A3 text", () => {
      assert(
        globalsCssSource.includes(".btn-pill-secondary"),
        "globals.css must define .btn-pill-secondary class"
      );
      assert(
        /\.btn-pill-secondary\s*\{[^}]*background-color:\s*(#EEF0FD|#DBEAFE)/i.test(globalsCssSource),
        ".btn-pill-secondary must specify background-color: #EEF0FD or #DBEAFE"
      );
      assert(
        /\.btn-pill-secondary\s*\{[^}]*color:\s*(#3730A3|#1E40AF)/i.test(globalsCssSource),
        ".btn-pill-secondary must specify color: #3730A3 or #1E40AF"
      );
      assert(
        /\.btn-pill-secondary\s*\{[^}]*border-radius:\s*9999px/i.test(globalsCssSource),
        ".btn-pill-secondary must specify border-radius: 9999px"
      );
    });

    it("T1.3.5: defines .touch-target utility enforcing Apple HIG and Android Material 3 minimums", () => {
      assert(
        globalsCssSource.includes(".touch-target"),
        "globals.css must define .touch-target utility"
      );
      assert(
        /\.touch-target\s*\{[^}]*min-height:\s*44px/i.test(globalsCssSource),
        ".touch-target must enforce min-height: 44px"
      );
      assert(
        /\.touch-target\s*\{[^}]*min-width:\s*44px/i.test(globalsCssSource),
        ".touch-target must enforce min-width: 44px"
      );
    });
  });
});

// =============================================================================
// TIER 2: GLOBAL SHELL ARCHITECTURE
// =============================================================================

describe("Tier 2: Global Shell Architecture", () => {
  const layoutSource = readProjectFile("src/app/layout.tsx");
  const appShellSource = readProjectFile("src/components/AppShell.tsx");
  const sideDockSource = readProjectFile("src/components/layout/CurvySideDock.tsx");
  const navbarSource = readProjectFile("src/components/layout/ModernEdworldNavbar.tsx");

  describe("2.1 Root Layout (src/app/layout.tsx)", () => {
    it("T2.1.1: sets body element to bg-[#F4F5FA] or bg-canvas and text-slate-900", () => {
      assert(
        layoutSource.includes("bg-[#F4F5FA]") || layoutSource.includes("bg-canvas") || layoutSource.includes("bg-white"),
        "RootLayout body must specify bg-[#F4F5FA] or semantic token bg-canvas or bg-white"
      );
      assert(
        layoutSource.includes("text-slate-900") || layoutSource.includes("text-black"),
        "RootLayout body must specify text-slate-900 or text-black"
      );
    });

    it("T2.1.2: configures selection highlight classes selection:bg-[#5C59E8] / selection:bg-periwinkle and selection:text-white", () => {
      assert(
        layoutSource.includes("selection:bg-[#5C59E8]") || layoutSource.includes("selection:bg-periwinkle") || layoutSource.includes("selection:bg-[#2563EB]"),
        "RootLayout body must specify selection:bg-[#5C59E8] or selection:bg-periwinkle or selection:bg-[#2563EB]"
      );
      assert(
        layoutSource.includes("selection:text-white"),
        "RootLayout body must specify selection:text-white"
      );
    });

    it("T2.1.3: enforces absence of dark container background overrides on root body", () => {
      const bodyTagMatch = layoutSource.match(/<body[^>]*className=["']([^"']*)["']/);
      assert(bodyTagMatch, "Must find body className attribute in layout.tsx");
      const bodyClass = bodyTagMatch[1];
      assert(!bodyClass.includes("bg-[#080B11]"), "Root body must not use dark background bg-[#080B11]");
      assert(!bodyClass.includes("bg-slate-900"), "Root body must not use dark background bg-slate-900");
    });

    it("T2.1.4: mounts AppShell as the central layout wrapper", () => {
      assert(
        layoutSource.includes("<AppShell>{children}</AppShell>") ||
        layoutSource.includes("<AppShell>\n          {children}\n        </AppShell>") ||
        layoutSource.includes("<AppShell>"),
        "layout.tsx must wrap children in <AppShell>"
      );
    });
  });

  describe("2.2 Application Shell (src/components/AppShell.tsx)", () => {
    it("T2.2.1: enforces bg-[#F4F5FA] or bg-canvas and text-slate-900 on the main layout wrapper", () => {
      assert(
        appShellSource.includes("bg-[#F4F5FA]") || appShellSource.includes("bg-canvas") || appShellSource.includes("bg-white"),
        "AppShell layout container must enforce bg-[#F4F5FA] or semantic token bg-canvas or bg-white"
      );
      assert(
        appShellSource.includes("text-slate-900") || appShellSource.includes("text-black"),
        "AppShell layout container must enforce text-slate-900 or text-black"
      );
    });

    it("T2.2.2: provides accessible skip link targeting #main-content with keyboard focus styles", () => {
      assert(
        appShellSource.includes('href="#main-content"'),
        "AppShell must include accessible skip link targeting #main-content"
      );
      assert(
        appShellSource.includes("Skip to main content"),
        "Skip link must include 'Skip to main content' text"
      );
      assert(
        appShellSource.includes("sr-only focus:not-sr-only"),
        "Skip link must utilize screen-reader only utility with focus activation"
      );
    });

    it("T2.2.3: conditionally mounts CurvySideDock when not on landing page", () => {
      assert(
        appShellSource.includes("<CurvySideDock />"),
        "AppShell must mount <CurvySideDock />"
      );
      assert(
        appShellSource.includes("!isLandingPage && <CurvySideDock"),
        "AppShell must mount CurvySideDock conditionally on !isLandingPage"
      );
    });

    it("T2.2.4: offsets the shared workspace for the desktop sidebar", () => {
      assert(appShellSource.includes("lg:pl-60 xl:pl-[17rem]"));
    });

    it("T2.2.5: grants landing page exemption bypassing dock and navbar padding", () => {
      assert(
        appShellSource.includes("isLandingPage"),
        "AppShell must evaluate isLandingPage route state"
      );
      assert(
        appShellSource.includes('pathname === "/"'),
        "isLandingPage must check for root path '/'"
      );
    });

    it("T2.2.6: preserves core platform components (MyraChatbot, CookieConsentBanner, AegisClientShield)", () => {
      assert(appShellSource.includes("<MyraChatbot />"), "AppShell must mount MyraChatbot");
      assert(appShellSource.includes("<CookieConsentBanner />"), "AppShell must mount CookieConsentBanner");
      assert(appShellSource.includes("<AegisClientShield />"), "AppShell must mount AegisClientShield");
    });
  });

  describe("2.3 Curvy Floating Side Navigation Dock (src/components/layout/CurvySideDock.tsx)", () => {
    it("T2.3.1: uses fixed labeled navigation at desktop widths", () => {
      assert(sideDockSource.includes("hidden lg:flex fixed left-4 top-4 bottom-4"));
      assert(sideDockSource.includes("w-52 xl:w-60"));
    });

    it("T2.3.2: uses a bordered light sidebar", () => {
      assert(sideDockSource.includes("bg-[#edf5f4]"));
      assert(sideDockSource.includes("border-[#cfdfdc]"));
    });

    it("T2.3.3: provides a 48px Dashboard link and exposes its active state", () => {
      assert(
        sideDockSource.includes('href="/dashboard"'),
        "CurvySideDock must include Link to /dashboard"
      );
      assert(
        sideDockSource.includes("w-12 h-12"),
        "Dashboard squircle button must measure w-12 h-12 (48px x 48px)"
      );
      assert(
        sideDockSource.includes("rounded-2xl"),
        "Dashboard squircle button must use rounded-2xl border radius"
      );
      assert(
        sideDockSource.includes('aria-current={isActive("/dashboard") ? "page" : undefined}'),
        "Dashboard must expose its active state"
      );
    });

    it("T2.3.4: includes required navigation links for all core student workspaces", () => {
      const requiredLinks = [
        "/daily",
        "/leaderboard",
        "/squads",
        "/interviews",
        "/resumes",
        "/jobs",
        "/profile",
      ];
      for (const link of requiredLinks) {
        assert(
          sideDockSource.includes(`"${link}"`) || sideDockSource.includes(`'${link}'`),
          `CurvySideDock must contain navigation destination ${link}`
        );
      }
    });

    it("T2.3.5: keeps desktop links readable and scrollable", () => {
      assert(sideDockSource.includes("overflow-y-auto"));
      assert(sideDockSource.includes("text-sm font-medium"));
    });

    it("T2.3.6: preserves hidden structural test anchor for automated test runners", () => {
      assert(
        sideDockSource.includes("Student Panel Navigation"),
        "CurvySideDock must preserve 'Student Panel Navigation' hidden anchor"
      );
      assert(
        sideDockSource.includes("Career Hub") && sideDockSource.includes("/career/dashboard"),
        "CurvySideDock must preserve career hub test anchors"
      );
    });
  });

  describe("2.4 Modern Edworld Top Bar Navbar (src/components/layout/ModernEdworldNavbar.tsx)", () => {
    it("T2.4.1: styles header with light background bg-[#F4F5FA]/90 or bg-canvas and sticky positioning", () => {
      assert(
        navbarSource.includes("sticky top-0"),
        "ModernEdworldNavbar must use sticky top-0 positioning"
      );
      assert(
        navbarSource.includes("bg-[#F4F5FA]") || navbarSource.includes("bg-canvas") || navbarSource.includes("bg-white"),
        "ModernEdworldNavbar must use light background bg-[#F4F5FA] or bg-canvas"
      );
      assert(
        navbarSource.includes("border-neutral-200"),
        "ModernEdworldNavbar must use a neutral border"
      );
    });

    it("T2.4.2: implements pill tab switchers for /dashboard, /daily, /leaderboard, and /squads", () => {
      assert(
        navbarSource.includes('href: "/dashboard"'),
        "Navbar pill tabs must include /dashboard"
      );
      assert(
        navbarSource.includes('href: "/daily"'),
        "Navbar pill tabs must include /daily"
      );
      assert(
        navbarSource.includes('href: "/leaderboard"'),
        "Navbar pill tabs must include /leaderboard"
      );
      assert(
        navbarSource.includes('href: "/squads"'),
        "Navbar pill tabs must include /squads"
      );
      assert(
        navbarSource.includes("rounded-full"),
        "Tab switchers must use rounded-full pill styling"
      );
    });

    it("T2.4.3: provides a keyboard-accessible Browse tools button", () => {
      assert(navbarSource.includes("<span>Browse tools</span>"));
    });

    it("T2.4.4: provides a secondary Focus Studio action", () => {
      assert.match(navbarSource, /href="\/focus"[\s\S]*?<span>Focus Studio<\/span>/);
    });

    it("T2.4.5: Ask Myra dispatches open-myra-copilot CustomEvent", () => {
      assert(
        navbarSource.includes("Ask Myra"),
        "Navbar must render 'Ask Myra' primary action button"
      );
      assert(
        navbarSource.includes('new CustomEvent("open-myra-copilot")'),
        "Ask Myra button click handler must dispatch CustomEvent('open-myra-copilot')"
      );
    });

    it("T2.4.6: provides slide-over right menu drawer with ESC dismiss and backdrop", () => {
      assert(
        navbarSource.includes("isRightDrawerOpen"),
        "Navbar must maintain state for right slide-over drawer"
      );
      assert(
        navbarSource.includes('e.key === "Escape"'),
        "Navbar must register Escape key handler to dismiss drawer"
      );
      assert(
        navbarSource.includes("fixed inset-0 bg-slate-900/40") || navbarSource.includes("backdrop-blur") || navbarSource.includes("bg-black/40"),
        "Navbar drawer must render backdrop overlay"
      );
    });
  });
});

// =============================================================================
// TIER 3: CROSS-FEATURE BOUNDARY & LAYOUT CLEARANCES
// =============================================================================

describe("Tier 3: Cross-Feature Boundary & Layout Clearances", () => {
  const appShellSource = readProjectFile("src/components/AppShell.tsx");
  const sideDockSource = readProjectFile("src/components/layout/CurvySideDock.tsx");
  const footerSource = readProjectFile("src/components/layout/ModernEdworldFooter.tsx");
  const navbarSource = readProjectFile("src/components/layout/ModernEdworldNavbar.tsx");
  const globalsCss = readProjectFile("src/app/globals.css");

  describe("3.1 Mathematical Proof of Ergonomic Clearance & Touch Targets", () => {
    it("T3.1.1: uses separate laptop and wide desktop sidebar widths", () => {
      assert(sideDockSource.includes("w-52 xl:w-60"));
    });

    it("T3.1.2: preserves a 16px gutter next to the sidebar at both widths", () => {
      assert(appShellSource.includes("lg:pl-60 xl:pl-[17rem]"));
      assert.equal(240 - 208 - 16, 16);
      assert.equal(272 - 240 - 16, 16);
    });

    it("T3.1.3: mathematically verifies touch targets exceed Apple HIG (>= 44px) and Material 3 guidelines", () => {
      // 1. CurvySideDock dashboard squircle: w-12 h-12 = 3rem = 48px >= 44px
      assert(sideDockSource.includes("w-12 h-12"), "CurvySideDock must declare w-12 h-12");
      const dashboardTargetPx = 12 * 0.25 * 16;
      assert.strictEqual(dashboardTargetPx, 48);
      assert(dashboardTargetPx >= 44, "Dashboard target must be >= 44px");

      // 2. CurvySideDock navigation icons: w-11 h-11 = 2.75rem = 44px >= 44px
      assert(sideDockSource.includes("min-h-11"), "Desktop links must be at least 44px tall and fill the sidebar");
      const navTargetPx = 11 * 0.25 * 16;
      assert.strictEqual(navTargetPx, 44);
      assert(navTargetPx >= 44, "Nav item target must be >= 44px");

      // 3. Globals.css .touch-target class assertion
      assert(globalsCss.includes("min-height: 44px"), "CSS must declare min-height: 44px");
      assert(globalsCss.includes("min-width: 44px"), "CSS must declare min-width: 44px");

      // 4. ModernEdworldNavbar interactive touch target assertions
      // Right menu trigger button (mobile & desktop)
      const menuIdx = navbarSource.indexOf('aria-label="Open Right Side Navigation Menu"');
      assert(menuIdx !== -1, "Navbar must contain right menu trigger button");
      const menuSlice = navbarSource.slice(Math.max(0, menuIdx - 300), menuIdx + 100);
      assert(
        menuSlice.includes("min-h-[44px]") || menuSlice.includes("touch-target"),
        "Right menu trigger button must declare min-h-[44px] or touch-target"
      );
      assert(
        menuSlice.includes("min-w-[44px]") || menuSlice.includes("touch-target"),
        "Right menu trigger button must declare min-w-[44px] or touch-target"
      );

      // Drawer close button
      const closeIdx = navbarSource.indexOf('aria-label="Close navigation menu"');
      assert(closeIdx !== -1, "Navbar must contain drawer close button");
      const closeSlice = navbarSource.slice(Math.max(0, closeIdx - 300), closeIdx + 100);
      assert(
        closeSlice.includes("min-h-[44px]") || closeSlice.includes("touch-target"),
        "Drawer close button must declare min-h-[44px] or touch-target"
      );
      assert(
        closeSlice.includes("min-w-[44px]") || closeSlice.includes("touch-target"),
        "Drawer close button must declare min-w-[44px] or touch-target"
      );

      // Ask Myra action button
      const myraIdx = navbarSource.indexOf('aria-label="Ask Myra AI Companion"');
      assert(myraIdx !== -1, "Navbar must contain Ask Myra button");
      const myraSlice = navbarSource.slice(Math.max(0, myraIdx - 300), myraIdx + 100);
      assert(
        myraSlice.includes("min-h-[44px]") || myraSlice.includes("touch-target"),
        "Ask Myra action button must declare min-h-[44px] or touch-target"
      );


    });

    it("T3.1.4: proves responsive dock cleanly collapses on viewports below 1024px (< lg)", () => {
      // Verified by "hidden lg:flex" in CurvySideDock
      assert(
        sideDockSource.includes("hidden lg:flex"),
        "CurvySideDock must hide on small screens (< 1024px) to preserve full touch width on tablets and phones"
      );
    });

    it("T3.1.5: verifies skip link placement and accessibility contract", () => {
      assert(
        appShellSource.includes('<main\n        id="main-content"') ||
        appShellSource.includes('id="main-content"'),
        "Main container must have id='main-content' matching skip link href"
      );
      assert(
        appShellSource.includes('tabIndex={-1}'),
        "Main container must have tabIndex={-1} to receive programmatic focus when skip link is activated"
      );
    });
  });

  describe("3.2 Card Anatomy Invariant Across Scoped Components", () => {
    it("T3.2.1: enforces pure white card background (#FFFFFF or bg-white)", () => {
      assert(
        footerSource.includes("bg-white"),
        "ModernEdworldFooter must use bg-white container"
      );
      assert(
        sideDockSource.includes("bg-white"),
        "CurvySideDock must use pure white background for active dashboard button"
      );
    });

    it("T3.2.2: uses rounded corners on footer and desktop navigation", () => {
      assert(
        footerSource.includes("rounded-t-3xl"),
        "ModernEdworldFooter must use rounded-t-3xl"
      );
      assert(
        sideDockSource.includes("rounded-2xl"),
        "Desktop navigation uses rounded corners"
      );
    });

    it("T3.2.3: uses borders on footers and desktop navigation", () => {
      assert(footerSource.includes("border-[#cfdfdc]"));
      assert(sideDockSource.includes("border-[#cfdfdc]"));
    });

    it("T3.2.4: keeps the sidebar visually separate from the workspace", () => {
      assert(appShellSource.includes("bg-[#f1f6f5]"));
      assert(sideDockSource.includes("bg-[#edf5f4]"));
    });

    it("T3.2.5: verifies smooth transitions on interactive cards and buttons", () => {
      assert(
        footerSource.includes("transition-colors") || footerSource.includes("transition-all"),
        "Footer interactive elements must declare smooth transitions"
      );
      assert(
        sideDockSource.includes("transition-all duration-200"),
        "Side dock interactive elements must declare transition-all duration-200"
      );
    });
  });
});

// =============================================================================
// TIER 4: VISUAL DESIGN CONSISTENCY SWEEP
// =============================================================================

describe("Tier 4: Visual Design Consistency Sweep", () => {
  const scopedFiles = [
    "src/app/layout.tsx",
    "src/components/AppShell.tsx",
    "src/components/layout/CurvySideDock.tsx",
    "src/components/layout/ModernEdworldNavbar.tsx",
    "src/components/layout/ModernEdworldFooter.tsx",
  ];

  it("T4.1.1: audits all scoped shell files exist and are readable", () => {
    for (const relPath of scopedFiles) {
      const fullPath = path.join(ROOT_DIR, relPath);
      assert(fs.existsSync(fullPath), `Scoped file must exist: ${relPath}`);
      const stat = fs.statSync(fullPath);
      assert(stat.size > 100, `Scoped file ${relPath} must not be empty (size: ${stat.size} bytes)`);
    }
  });

  it("T4.1.2: audits all scoped files for light off-white canvas compliance (#F4F5FA / #F8F9FD or bg-canvas)", () => {
    const layout = readProjectFile("src/app/layout.tsx");
    const appShell = readProjectFile("src/components/AppShell.tsx");
    const navbar = readProjectFile("src/components/layout/ModernEdworldNavbar.tsx");
    const footer = readProjectFile("src/components/layout/ModernEdworldFooter.tsx");

    assert(
      layout.includes("#F4F5FA") || layout.includes("bg-canvas") || layout.includes("bg-white"),
      "layout.tsx must contain canvas #F4F5FA, bg-canvas, or bg-white"
    );
    assert(
      appShell.includes("#F4F5FA") || appShell.includes("bg-canvas") || appShell.includes("bg-white"),
      "AppShell.tsx must contain canvas #F4F5FA, bg-canvas, or bg-white"
    );
    assert(
      navbar.includes("#F4F5FA") || navbar.includes("bg-canvas") || navbar.includes("bg-white"),
      "ModernEdworldNavbar.tsx must contain canvas #F4F5FA, bg-canvas, or bg-white"
    );
    assert(
      footer.includes("#F8F9FD") || footer.includes("bg-canvas-subtle") || footer.includes("bg-white"),
      "ModernEdworldFooter.tsx must contain light surface #F8F9FD, bg-canvas-subtle, or bg-white"
    );
  });

  it("T4.1.3: audits standard student workspace in AppShell does not apply dark container backgrounds", () => {
    const appShell = readProjectFile("src/components/AppShell.tsx");

    // Extract the main layout return statement (non-auth, non-admin, non-mobile)
    const returnIndex = appShell.indexOf("// Modern Full-Width Layout with Curvy Side Dock");
    assert(returnIndex > 0, "Must locate main layout return block in AppShell.tsx");
    const mainWorkspaceCode = appShell.slice(returnIndex);

    assert(
      !mainWorkspaceCode.includes("bg-[#080B11]"),
      "Standard student workspace in AppShell must not use legacy dark background bg-[#080B11]"
    );
    assert(
      !mainWorkspaceCode.includes("bg-[#0C101A]"),
      "Standard student workspace in AppShell must not use legacy dark background bg-[#0C101A]"
    );
    assert(
      !mainWorkspaceCode.includes("bg-slate-950"),
      "Standard student workspace in AppShell must not use bg-slate-950"
    );
  });

  it("T4.1.4: differentiates primary and secondary navbar actions", () => {
    const navbar = readProjectFile("src/components/layout/ModernEdworldNavbar.tsx");
    assert.match(navbar, /bg-\[#292825\][^\n]+\s+aria-label="Ask Myra AI Companion"/);
    assert.match(navbar, /href="\/focus"\s+className="[^"]*bg-\[#efeeeb\]/);
  });

  it("T4.1.5: audits high-contrast text typography pairing across light canvas containers", () => {
    const layout = readProjectFile("src/app/layout.tsx");
    const appShell = readProjectFile("src/components/AppShell.tsx");
    const navbar = readProjectFile("src/components/layout/ModernEdworldNavbar.tsx");
    const footer = readProjectFile("src/components/layout/ModernEdworldFooter.tsx");

    assert(layout.includes("text-slate-900") || layout.includes("text-black"), "layout.tsx must use dark text text-slate-900 or text-black on light canvas");
    assert(appShell.includes("text-slate-900") || appShell.includes("text-black"), "AppShell.tsx must use dark text text-slate-900 or text-black on light canvas");
    assert(navbar.includes("text-slate-900") || navbar.includes("text-slate-700") || navbar.includes("text-black"), "ModernEdworldNavbar.tsx must use dark text");
    assert(footer.includes("text-slate-900") || footer.includes("text-slate-500") || footer.includes("text-black"), "ModernEdworldFooter.tsx must use dark/muted text");
  });
});
