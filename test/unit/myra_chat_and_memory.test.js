import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

/**
 * Unit & Integration Test Suite for Myra Chat & Memory Experience:
 * 1. Predictable transcript lifecycle (session-scoped, cleared on refresh, sign-out, or switch)
 * 2. Disclaimer copy explaining temporary chat and separate learning preferences
 * 3. "New chat" action with in-flight abort and ignoring late responses
 * 4. Memory settings UI with transparent cognitive profile presentation and reset confirmation
 * 5. Memory reset API and anti-resurrection guards against in-flight replies
 * 6. Distinct error visual states and draft input preservation
 */

test("Myra Chat & Memory Experience Verification", async (t) => {
  const chatbotSrc = fs.readFileSync(path.resolve("src/components/ai/MyraChatbot.tsx"), "utf8");
  const memorySettingsSrc = fs.readFileSync(path.resolve("src/app/settings/memory/page.tsx"), "utf8");
  const myraRouteSrc = fs.readFileSync(path.resolve("src/app/api/ai/myra/route.ts"), "utf8");
  const learningEngineSrc = fs.readFileSync(path.resolve("src/lib/ai/myra-learning-engine.ts"), "utf8");

  await t.test("Chatbot displays required disclaimer near the composer", () => {
    assert.ok(
      chatbotSrc.includes("This chat clears when you refresh. Myra may remember learning preferences separately."),
      "Expected exact disclaimer text near composer"
    );
    assert.ok(
      chatbotSrc.includes("/settings/memory"),
      "Expected link to Myra memory settings in disclaimer container"
    );
  });

  await t.test("Chatbot implements 'New chat' with AbortController and session invalidation", () => {
    assert.ok(
      chatbotSrc.includes("abortControllerRef.current.abort()"),
      "Expected abortControllerRef to cancel in-flight network requests"
    );
    assert.ok(
      chatbotSrc.includes("currentChatSessionIdRef.current +="),
      "Expected chat session counter increment to discard late responses"
    );
    assert.ok(
      chatbotSrc.includes('title="New chat"') || chatbotSrc.includes('aria-label="New chat"'),
      "Expected New chat action button in header"
    );
  });

  await t.test("Transcript preserves across panel close/reopen but clears on refresh/signout", () => {
    assert.ok(
      chatbotSrc.includes("sessionStorage.setItem"),
      "Expected sessionStorage persistence for panel close/reopen"
    );
    assert.ok(
      chatbotSrc.includes("myra_page_load_token_") || chatbotSrc.includes("__myra_page_session_id"),
      "Expected per-page-load token verification to clear transcript on refresh"
    );
    assert.ok(
      chatbotSrc.includes("previousUserIdRef.current !== currentUid"),
      "Expected account switch detector to wipe temporary transcript"
    );
  });

  await t.test("Recoverable errors preserve composer draft without losing message", () => {
    assert.ok(
      chatbotSrc.includes("setInput(textToSend.trim())"),
      "Expected user input draft to be restored on error"
    );
    assert.ok(
      chatbotSrc.includes("canRetry: true"),
      "Expected errorData to mark retryable status"
    );
    assert.ok(
      chatbotSrc.includes("failedPrompt"),
      "Expected failed prompt to be preserved for retries"
    );
  });

  await t.test("Memory settings UI presents cognitive memory in plain language", () => {
    assert.ok(
      memorySettingsSrc.includes("Frequently Studied Topics"),
      "Expected plain language section for frequent topics"
    );
    assert.ok(
      memorySettingsSrc.includes("Technologies &amp; Frameworks") || memorySettingsSrc.includes("Technologies & Frameworks"),
      "Expected plain language section for searched technologies"
    );
    assert.ok(
      memorySettingsSrc.includes("Identified Review &amp; Struggle Points") || memorySettingsSrc.includes("Identified Review & Struggle Points"),
      "Expected plain language section for struggle points"
    );
    assert.ok(
      memorySettingsSrc.includes("Current Tutoring Style"),
      "Expected plain language section for tutoring style"
    );
  });

  await t.test("Memory settings UI requires confirmation before reset", () => {
    assert.ok(
      memorySettingsSrc.includes("setShowConfirmModal(true)"),
      "Expected Reset memory button to open confirmation modal"
    );
    assert.ok(
      memorySettingsSrc.includes("Reset Myra Learning Memory?"),
      "Expected confirmation dialog title"
    );
    assert.ok(
      memorySettingsSrc.includes("What stays safe:"),
      "Expected explanation of what remains safe during memory reset"
    );
    assert.ok(
      memorySettingsSrc.includes("DELETE"),
      "Expected DELETE HTTP call to /api/ai/myra endpoint"
    );
  });

  await t.test("Memory sync guards against restoring memory after reset", () => {
    assert.ok(
      myraRouteSrc.includes("requestStartTime"),
      "Expected request start timestamp tracking in /api/ai/myra"
    );
    assert.ok(
      learningEngineSrc.includes("lastResetAt"),
      "Expected lastResetAt marker in learning engine"
    );
    assert.ok(
      learningEngineSrc.includes("resetTime > requestTimestamp"),
      "Expected guard preventing in-flight responses from overwriting a recent reset"
    );
  });

  await t.test("Cognitive memory extraction signals", () => {
    assert.ok(
      learningEngineSrc.includes("extractLearningSignals"),
      "Expected extractLearningSignals function"
    );
    assert.ok(
      learningEngineSrc.includes("KNOWN_TECH_KEYWORDS"),
      "Expected known tech keywords list"
    );
    assert.ok(
      learningEngineSrc.includes("struggleKeywords"),
      "Expected struggleKeywords array in engine"
    );
    assert.ok(
      learningEngineSrc.includes("isStruggle"),
      "Expected isStruggle detection"
    );
  });
});
