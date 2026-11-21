import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

import { pathToFileURL } from "node:url";

const rootDir = process.cwd();

test("Challenger M3 Iteration 2: Empirical Verification & Adversarial Stress", async (t) => {
  await t.test("1. next.config.mjs runtime redirects execution", async () => {
    const configPath = path.join(rootDir, "next.config.mjs");
    const configModule = await import(pathToFileURL(configPath).href);
    const config = configModule.default;

    assert.ok(config, "nextConfig default export must exist");
    assert.equal(typeof config.redirects, "function", "redirects must be an async function");

    const redirects = await config.redirects();
    assert.ok(Array.isArray(redirects), "redirects() must resolve to an array");

    // Adversarial search for /showcase
    const showcaseRedirects = redirects.filter((r) => r.source === "/showcase");
    assert.equal(showcaseRedirects.length, 1, "Exactly one redirect rule must exist for /showcase");

    const rule = showcaseRedirects[0];
    assert.equal(rule.source, "/showcase", "Redirect source must be /showcase");
    assert.equal(rule.destination, "/dsa", "Redirect destination must be /dsa");
    assert.equal(rule.permanent, true, "Redirect must be permanent (308)");

    // Ensure no conditional filters or bypasses
    assert.equal(rule.has, undefined, "Rule must not have conditional 'has' clauses");
    assert.equal(rule.missing, undefined, "Rule must not have conditional 'missing' clauses");

    // Also verify /practice and /problems route to /dsa permanently
    const practiceRule = redirects.find((r) => r.source === "/practice");
    assert.ok(practiceRule, "Redirect for /practice must exist");
    assert.equal(practiceRule.destination, "/dsa");
    assert.equal(practiceRule.permanent, true);

    const problemsRule = redirects.find((r) => r.source === "/problems");
    assert.ok(problemsRule, "Redirect for /problems must exist");
    assert.equal(problemsRule.destination, "/dsa");
    assert.equal(problemsRule.permanent, true);
  });

  await t.test("2. test/integration/edworld_website_redesign.test.js strictly checks /showcase without fallback OR clauses", () => {
    const testFilePath = path.join(rootDir, "test/integration/edworld_website_redesign.test.js");
    const content = fs.readFileSync(testFilePath, "utf8");

    // Locate Test 9 specifically
    const test9Regex = /it\(\s*["']9\.\s*Multi-Breakpoint Showcase.*?\n\s*\}\);/s;
    const match = content.match(test9Regex);
    assert.ok(match, "Test 9 for Multi-Breakpoint Showcase must exist in the integration test file");

    const test9Body = match[0];

    // Assert that NO logical OR operator (||) exists in Test 9
    assert.ok(
      !test9Body.includes("||"),
      "Test 9 must NOT contain any fallback OR ('||') clauses. Found fallback clause in test body."
    );

    // Assert strict presence of necessary assertions
    assert.ok(
      test9Body.includes('nextConfigFile.includes(\'source: "/showcase"\')'),
      "Test 9 must strictly assert nextConfigFile.includes('source: \"/showcase\"')"
    );
    assert.ok(
      test9Body.includes('nextConfigFile.includes(\'destination: "/dsa"\')'),
      "Test 9 must strictly assert nextConfigFile.includes('destination: \"/dsa\"')"
    );
    assert.ok(
      test9Body.includes('nextConfigFile.includes("permanent: true")'),
      "Test 9 must strictly assert nextConfigFile.includes(\"permanent: true\")"
    );
  });

  await t.test("3. MyraChatbot.tsx opening greeting matches canonical regex and goal prompt substring", () => {
    const chatbotFilePath = path.join(rootDir, "src/components/ai/MyraChatbot.tsx");
    const content = fs.readFileSync(chatbotFilePath, "utf8");

    const canonicalRegex = /Hello! I am Myra, your AI study companion on EdWorld/;
    const goalSubstring = "Tell me your goal (for example JEE, NEET, CUET, boards, semester exams, GATE, CAT, placements)";

    // Regex check
    assert.match(
      content,
      canonicalRegex,
      "MyraChatbot.tsx must match canonical opening greeting regex /Hello! I am Myra, your AI study companion on EdWorld/"
    );

    // Substring check
    assert.ok(
      content.includes(goalSubstring),
      `MyraChatbot.tsx must include goal roadmap substring '${goalSubstring}'`
    );

    // Verify both initial mount (useEffect) and reset (handleClearChat) contain the canonical greeting
    const mountMatches = content.match(/Hello! I am Myra, your AI study companion on EdWorld/g);
    assert.ok(
      mountMatches && mountMatches.length >= 2,
      "Canonical greeting must be defined in both useEffect mount and handleClearChat reset handlers"
    );

    // Verify personalized greeting branch with profile.name
    const personalizedMatches = content.match(/Hello \$\{profile\.name\}! I am Myra, your AI study companion on EdWorld/g);
    assert.ok(
      personalizedMatches && personalizedMatches.length >= 2,
      "Personalized greeting with profile.name must be defined in both useEffect mount and handleClearChat"
    );
  });

  await t.test("4. Client navigation hygiene: internal staff routes purged", () => {
    const navFiles = [
      "src/components/layout/FloatingNav.tsx",
      "src/components/layout/AppSidebar.tsx",
      "src/components/navbar.tsx",
      "src/components/layout/ModernEdworldNavbar.tsx",
    ];

    for (const relPath of navFiles) {
      const fullPath = path.join(rootDir, relPath);
      if (fs.existsSync(fullPath)) {
        const fileContent = fs.readFileSync(fullPath, "utf8");
        assert.ok(!fileContent.includes('href: "/founder"'), `${relPath} must not contain href: "/founder"`);
        assert.ok(!fileContent.includes('href="/founder"'), `${relPath} must not contain href="/founder"`);
        assert.ok(!fileContent.includes('href: "/employee"'), `${relPath} must not contain href: "/employee"`);
        assert.ok(!fileContent.includes('href="/employee"'), `${relPath} must not contain href="/employee"`);
        assert.ok(!fileContent.includes('href: "/hr"'), `${relPath} must not contain href: "/hr"`);
        assert.ok(!fileContent.includes('href="/hr"'), `${relPath} must not contain href="/hr"`);
      }
    }
  });

  await t.test("5. Dashboard ContinueDsaWidget integration and null resilience", () => {
    const dashPath = path.join(rootDir, "src/app/dashboard/page.tsx");
    const dashContent = fs.readFileSync(dashPath, "utf8");

    assert.ok(
      dashContent.includes('import ContinueDsaWidget from "@/components/dashboard/ContinueDsaWidget"'),
      "Dashboard must import ContinueDsaWidget"
    );
    assert.ok(
      dashContent.includes('data-section="continue_dsa"'),
      "Dashboard must contain data-section='continue_dsa'"
    );
    assert.ok(
      dashContent.includes("<ContinueDsaWidget userId={user?.uid}"),
      "Dashboard must pass user?.uid to ContinueDsaWidget"
    );
  });
});
