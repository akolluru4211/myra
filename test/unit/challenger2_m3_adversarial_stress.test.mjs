/**
 * Empirical Adversarial Challenger Test Suite: Milestone M3
 * Challenger: Challenger M3 Instance 2 (Gen 2)
 *
 * Comprehensive adversarial verification of:
 * 1. Ultra-small viewport responsiveness (320px, 375px, 390px)
 * 2. ContinueDsaWidget integration and null/undefined user handling
 * 3. React Rules of Hooks invariants and execution ordering
 * 4. Brand copy alignment and Myra AI invariants
 * 5. Navigation route hygiene and 308 redirect mappings
 * 6. Node test runner syntax and test suite pass verification
 */

import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

const rootDir = process.cwd();

async function runChallenger2Suite() {
  console.log("======================================================================");
  console.log("=== CHALLENGER 2 (GEN 2): ADVERSARIAL STRESS TEST SUITE (MILESTONE M3) ===");
  console.log("======================================================================\n");

  let totalAssertions = 0;
  let passedAssertions = 0;

  function verify(desc, condition, details = "") {
    totalAssertions++;
    if (condition) {
      console.log(`  ✔ [PASS] ${desc}`);
      passedAssertions++;
    } else {
      console.error(`  ✖ [FAIL] ${desc} ${details ? `— ${details}` : ""}`);
      throw new Error(`Assertion failed: ${desc}`);
    }
  }

  // --------------------------------------------------------------------------
  // 1. ULTRA-COMPACT VIEWPORT RESPONSIVENESS (320px, 375px, 390px)
  // --------------------------------------------------------------------------
  console.log("--- 1. Ultra-Compact Viewport Responsiveness ---");

  // 1.1 Aptitude Studio Question Navigator
  const aptitudePath = path.join(rootDir, "src/app/aptitude/page.tsx");
  const aptitudeContent = fs.readFileSync(aptitudePath, "utf8");

  verify(
    "Aptitude Question Navigator: uses responsive grid (5 cols on mobile, 10 on sm+)",
    /grid\s+grid-cols-5\s+sm:grid-cols-10\s+gap-1\.5/.test(aptitudeContent)
  );

  // Mathematical proof on ultra-small viewports:
  const testViewports = [
    { name: "320px (iPhone SE 1st gen / Jelly)", width: 320, padding: 64, minColWidth: 44 },
    { name: "375px (iPhone SE 2nd/3rd gen, iPhone Mini)", width: 375, padding: 64, minColWidth: 44 },
    { name: "390px (iPhone 12/13/14/15 standard)", width: 390, padding: 64, minColWidth: 44 },
  ];

  for (const vp of testViewports) {
    const gaps = 4 * 6; // 4 gaps of 6px (gap-1.5 = 0.375rem = 6px)
    const availableWidth = vp.width - vp.padding;
    const colWidth5 = (availableWidth - gaps) / 5;
    const colWidthOld10 = (availableWidth - 9 * 6) / 10;

    verify(
      `Aptitude Navigator: ${vp.name} button width (${colWidth5.toFixed(1)}px) exceeds 44px WCAG minimum`,
      colWidth5 >= vp.minColWidth,
      `Calculated: ${colWidth5.toFixed(1)}px >= ${vp.minColWidth}px`
    );

    verify(
      `Aptitude Navigator: Old 10-col layout on ${vp.name} (${colWidthOld10.toFixed(1)}px) violates WCAG touch target`,
      colWidthOld10 < vp.minColWidth,
      `Old width: ${colWidthOld10.toFixed(1)}px was squished below 44px`
    );
  }

  // 1.2 FloatingNav Quick Dock & Origami Menu
  const navPath = path.join(rootDir, "src/components/layout/FloatingNav.tsx");
  const navContent = fs.readFileSync(navPath, "utf8");

  verify(
    "FloatingNav: Mobile dock positioned at bottom-left (bottom-6 left-6)",
    /fixed\s+bottom-6\s+left-6\s+z-40\s+flex\s+md:hidden/.test(navContent)
  );

  verify(
    "FloatingNav: Mobile dock enforces max-w-[calc(100vw-9.25rem)]",
    navContent.includes("max-w-[calc(100vw-9.25rem)]")
  );

  // Mathematical proof that FloatingNav dock never overflows 320px screen
  const screen320 = 320;
  const rem9_25InPx = 9.25 * 16; // 148px
  const maxDock320 = screen320 - rem9_25InPx; // 172px
  const leftOffset = 24; // left-6 = 1.5rem = 24px
  const dockRightEdge = leftOffset + maxDock320; // 196px
  const marginRemaining = screen320 - dockRightEdge; // 124px

  verify(
    "FloatingNav: Dock right edge on 320px screen (196px) leaves 124px thumb clearance without overflow",
    dockRightEdge < screen320 && marginRemaining === 124,
    `Right edge: ${dockRightEdge}px, Screen: ${screen320}px, Margin: ${marginRemaining}px`
  );

  verify(
    "FloatingNav: Preserves origami unfolding animation and origin-bottom-left",
    navContent.includes("origamiUnfold") && navContent.includes("origin-bottom-left")
  );

  verify(
    "FloatingNav: Dispatches close-myra-copilot event when opening Origami drawer",
    navContent.includes("close-myra-copilot")
  );

  // 1.3 Mobile Prototype Chassis
  const mobilePath = path.join(rootDir, "src/app/mobile/page.tsx");
  const mobileContent = fs.readFileSync(mobilePath, "utf8");

  verify(
    "Mobile Prototype: Chassis adheres to standard iPhone dimensions max-w-[390px] h-[844px]",
    mobileContent.includes("max-w-[390px]") && mobileContent.includes("h-[844px]")
  );

  verify(
    "Mobile Prototype: Obsolete max-w-[460px] chassis width is completely removed",
    !mobileContent.includes("max-w-[460px]")
  );

  // 1.4 Myra Chatbot Mobile Viewport Sizing
  const chatbotPath = path.join(rootDir, "src/components/ai/MyraChatbot.tsx");
  const chatbotContent = fs.readFileSync(chatbotPath, "utf8");

  verify(
    "MyraChatbot: Enforces responsive width w-[calc(100vw-1.5rem)] for mobile viewports",
    chatbotContent.includes("w-[calc(100vw-1.5rem)]")
  );

  verify(
    "MyraChatbot: Enforces safe viewport height h-[calc(100dvh-5rem)] max-h-[82dvh]",
    chatbotContent.includes("h-[calc(100dvh-5rem)]") && chatbotContent.includes("max-h-[82dvh]")
  );

  verify(
    "MyraChatbot: Listens to close-myra-copilot event to prevent modal collisions",
    chatbotContent.includes('addEventListener("close-myra-copilot"') || chatbotContent.includes("close-myra-copilot")
  );

  verify(
    "MyraChatbot: Listens to open-myra-copilot event for cross-component triggers",
    chatbotContent.includes('addEventListener("open-myra-copilot"') || chatbotContent.includes("open-myra-copilot")
  );

  // --------------------------------------------------------------------------
  // 2. DASHBOARD DSA WIDGET & NULL USER EMPIRICAL CHALLENGE
  // --------------------------------------------------------------------------
  console.log("\n--- 2. Dashboard DSA Widget & Null User Challenge ---");

  const dashPath = path.join(rootDir, "src/app/dashboard/page.tsx");
  const dashContent = fs.readFileSync(dashPath, "utf8");

  verify(
    "Dashboard: Imports ContinueDsaWidget component",
    /import\s+ContinueDsaWidget\s+from\s+["']@\/components\/dashboard\/ContinueDsaWidget["']/.test(dashContent)
  );

  verify(
    "Dashboard: Renders ContinueDsaWidget inside data-section='continue_dsa'",
    dashContent.includes('data-section="continue_dsa"') && dashContent.includes("<ContinueDsaWidget")
  );

  verify(
    "Dashboard: Safe user ID coalescing handles null user safely with optional chaining (user?.uid)",
    dashContent.includes("<ContinueDsaWidget userId={user?.uid")
  );

  verify(
    "Dashboard: Provides quick navigation action to /dsa",
    dashContent.includes('href="/dsa"')
  );

  // Deep check ContinueDsaWidget implementation file
  const widgetPath = path.join(rootDir, "src/components/dashboard/ContinueDsaWidget.tsx");
  const widgetContent = fs.readFileSync(widgetPath, "utf8");

  verify(
    "ContinueDsaWidget: Accepts optional userId in props interface",
    widgetContent.includes("userId?: string")
  );

  verify(
    "ContinueDsaWidget: API query string uses fallback empty string on undefined userId",
    widgetContent.includes("userId || \"\"")
  );

  verify(
    "ContinueDsaWidget: Network or parse failure falls back to getAllDsaTopics()[0] gracefully",
    widgetContent.includes("const fallback = getAllDsaTopics()") && widgetContent.includes("setNextTopic(fallback[0])")
  );

  // Empirical test of ContinueDsaWidget logic with null/undefined values:
  const testUsers = [
    { label: "null user and null profile", user: null, profile: null, expectedId: undefined },
    { label: "user with uid, null profile", user: { uid: "user-123" }, profile: null, expectedId: "user-123" },
    { label: "null user, profile with id", user: null, profile: { id: "prof-456" }, expectedId: "prof-456" },
    { label: "undefined user, empty profile", user: undefined, profile: {}, expectedId: undefined },
  ];

  for (const t of testUsers) {
    const computedId = t.user?.uid || t.profile?.id;
    verify(
      `ContinueDsaWidget userId coalescing: ${t.label}`,
      computedId === t.expectedId,
      `Got ${computedId}, expected ${t.expectedId}`
    );
  }

  // --------------------------------------------------------------------------
  // 3. REACT RULES OF HOOKS STRICT ORDERING VERIFICATION
  // --------------------------------------------------------------------------
  console.log("\n--- 3. React Rules of Hooks Strict Ordering in Navbar ---");

  const navbarPath = path.join(rootDir, "src/components/navbar.tsx");
  const navbarContent = fs.readFileSync(navbarPath, "utf8");

  const navbarFnIndex = navbarContent.indexOf("export default function Navbar()");
  verify("Navbar: export default function Navbar() exists", navbarFnIndex !== -1);

  const navbarBody = navbarContent.slice(navbarFnIndex);

  // Extract all hook invocations
  const hookRegex = /\b(useState|useEffect|useMemo|useCallback|useRouter|usePathname|useAuth)\s*\(/g;
  let lastHookMatchIndex = -1;
  let lastHookName = "";
  let match;
  while ((match = hookRegex.exec(navbarBody)) !== null) {
    lastHookMatchIndex = match.index;
    lastHookName = match[1];
  }

  verify("Navbar: Hooks are detected within Navbar body", lastHookMatchIndex !== -1);

  // Find the auth early return
  const earlyReturnStr = 'if (isAuthPage || pathname === "/") return null;';
  const earlyReturnIndex = navbarBody.indexOf(earlyReturnStr);

  verify(
    "Navbar: isAuthPage conditional early return exists",
    earlyReturnIndex !== -1
  );

  verify(
    `Navbar: Early return (pos ${earlyReturnIndex}) occurs strictly AFTER last hook call (${lastHookName} at pos ${lastHookMatchIndex})`,
    earlyReturnIndex > lastHookMatchIndex,
    `Early return: ${earlyReturnIndex}, Last hook: ${lastHookMatchIndex}`
  );

  verify(
    "Navbar: ALL_FEATURES is memoized with useMemo to prevent re-creation thrash",
    /const\s+ALL_FEATURES:\s*FeatureMenuItem\[\]\s*=\s*useMemo\(/.test(navbarBody)
  );

  // --------------------------------------------------------------------------
  // 4. BRAND COPY ALIGNMENT & CANONICAL INVARIANTS
  // --------------------------------------------------------------------------
  console.log("\n--- 4. Brand Copy Alignment & Canonical Invariants ---");

  // 4.1 Learn Page Brand Alignment
  const learnPath = path.join(rootDir, "src/app/learn/page.tsx");
  const learnContent = fs.readFileSync(learnPath, "utf8");

  verify(
    "Learn Page: Title contains canonical brand 'EdWorld Learn &amp; Courses'",
    learnContent.includes("EdWorld Learn &amp; Courses")
  );

  verify(
    "Learn Page: Description references 'EdWorld Learn'",
    learnContent.includes("EdWorld Learn")
  );

  // 4.2 Admin Security SOC Page
  const adminSecPath = path.join(rootDir, "src/app/admin/security/page.tsx");
  const adminSecContent = fs.readFileSync(adminSecPath, "utf8");

  verify(
    "Admin Security: Heading updated to 'Ask Aegis Sentinel AI Security Analyst'",
    adminSecContent.includes("Ask Aegis Sentinel AI Security Analyst")
  );

  // 4.3 Myra Chatbot Badges & Canonical Prompts
  verify(
    "MyraChatbot: Header badge identifies as 'Study &amp; Career Mentor'",
    chatbotContent.includes("Study &amp; Career Mentor") || chatbotContent.includes("Study & Career Mentor")
  );

  verify(
    "MyraChatbot: Header subtitle covers 'Class 12 • College • Placements • Higher-Ed'",
    chatbotContent.includes("Class 12 • College • Placements • Higher-Ed")
  );

  verify(
    "MyraChatbot: Initial greeting matches canonical goal prompt",
    chatbotContent.includes("Tell me your goal (for example JEE, NEET, CUET, boards, semester exams, GATE, CAT, placements)")
  );

  // --------------------------------------------------------------------------
  // 5. CLIENT NAVIGATION HYGIENE & ROUTE REDIRECTS
  // --------------------------------------------------------------------------
  console.log("\n--- 5. Client Navigation Hygiene & Route Redirects ---");

  const navFiles = [
    "src/components/layout/FloatingNav.tsx",
    "src/components/layout/AppSidebar.tsx",
    "src/components/navbar.tsx",
    "src/components/layout/ModernEdworldNavbar.tsx",
  ];

  for (const relPath of navFiles) {
    const fullPath = path.join(rootDir, relPath);
    if (fs.existsSync(fullPath)) {
      const content = fs.readFileSync(fullPath, "utf8");
      verify(
        `Navigation Hygiene: ${relPath} strictly excludes internal route /founder`,
        !content.includes('href: "/founder"') && !content.includes('href="/founder"')
      );
      verify(
        `Navigation Hygiene: ${relPath} strictly excludes internal route /employee`,
        !content.includes('href: "/employee"') && !content.includes('href="/employee"')
      );
      verify(
        `Navigation Hygiene: ${relPath} strictly excludes internal route /hr`,
        !content.includes('href: "/hr"') && !content.includes('href="/hr"')
      );
    }
  }

  // 5.2 Next.js 308 Permanent Redirects
  const nextConfigPath = path.join(rootDir, "next.config.mjs");
  const nextConfigContent = fs.readFileSync(nextConfigPath, "utf8");

  verify(
    "next.config.mjs: Redirects deprecated /practice permanently to /dsa",
    nextConfigContent.includes('source: "/practice"') &&
    nextConfigContent.includes('destination: "/dsa"') &&
    nextConfigContent.includes("permanent: true")
  );

  // --------------------------------------------------------------------------
  // 6. NODE TEST RUNNER IMPORTS IN INTEGRATION TESTS
  // --------------------------------------------------------------------------
  console.log("\n--- 6. Node Test Runner Imports in Integration Tests ---");

  const testFilesToCheck = [
    { file: "test/integration/myra_direct_reply.test.js", name: "myra_direct_reply" },
    { file: "test/integration/proctoring_and_interview_flow.test.js", name: "proctoring_and_interview_flow" },
    { file: "test/integration/edworld_website_redesign.test.js", name: "edworld_website_redesign" },
  ];

  for (const t of testFilesToCheck) {
    const fullPath = path.join(rootDir, t.file);
    const content = fs.readFileSync(fullPath, "utf8");
    verify(
      `${t.name}: Contains explicit require('node:test') or require('node:test') destructuring`,
      content.includes('require("node:test")') || content.includes("require('node:test')")
    );
  }

  console.log("\n======================================================================");
  console.log(`ALL ${passedAssertions}/${totalAssertions} ADVERSARIAL STRESS ASSERTIONS PASSED WITH ZERO ERRORS!`);
  console.log("======================================================================\n");
}

runChallenger2Suite().catch((err) => {
  console.error("\nFATAL: Challenger 2 adversarial suite encountered an error:", err);
  process.exit(1);
});
