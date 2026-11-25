import { describe, it } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

describe("Student Dashboard & Mobile Myra Integration Suite", () => {
  const dashboardPath = path.join(process.cwd(), "src", "app", "dashboard", "page.tsx");
  const dashboardSrc = fs.readFileSync(dashboardPath, "utf8");

  const mobileNavPath = path.join(process.cwd(), "src", "components", "mobile", "ui", "MobileBottomNav.tsx");
  const mobileNavSrc = fs.readFileSync(mobileNavPath, "utf8");

  const chatbotPath = path.join(process.cwd(), "src", "components", "ai", "MyraChatbot.tsx");
  const chatbotSrc = fs.readFileSync(chatbotPath, "utf8");

  it("1. Dashboard primary action uses green Ask Myra button wired to open-myra-copilot", () => {
    // Assert Ask Myra primary green button styling and text
    assert(
      dashboardSrc.includes("bg-emerald-600") && dashboardSrc.includes("hover:bg-emerald-700"),
      "Dashboard primary button must be green (bg-emerald-600 hover:bg-emerald-700)"
    );
    assert(
      dashboardSrc.includes("<span>Ask Myra</span>"),
      "Dashboard primary action button must say 'Ask Myra'"
    );
    assert(
      dashboardSrc.includes("handleOpenMyra"),
      "Dashboard button must trigger handleOpenMyra"
    );
    assert(
      dashboardSrc.includes('window.dispatchEvent(new CustomEvent("open-myra-copilot"))'),
      "handleOpenMyra must dispatch open-myra-copilot"
    );
  });

  it("2. Dashboard displays Next Task / Up Next section with loading, empty, and retry states", () => {
    assert(
      dashboardSrc.includes("resolveNextActivity"),
      "Dashboard must resolve next activity from saved data"
    );
    assert(
      dashboardSrc.includes("Checking your next recommended task..."),
      "Dashboard must show distinct loading state"
    );
    assert(
      dashboardSrc.includes("You&apos;re All Caught Up!") || dashboardSrc.includes("You're All Caught Up!"),
      "Dashboard must show short empty state when there is no activity"
    );
    assert(
      dashboardSrc.includes("Retry"),
      "Dashboard must provide Retry button when task resolution fails"
    );
    assert(
      dashboardSrc.includes("Shortcuts:"),
      "Dashboard must provide compact shortcuts section"
    );
  });

  it("3. Mobile bottom navigation coordinates with chat panel and handles safe areas", () => {
    assert(
      mobileNavSrc.includes("pb-[env(safe-area-inset-bottom,12px)]"),
      "Mobile bottom navigation must support device safe area insets"
    );
    assert(
      mobileNavSrc.includes("isChatOpen"),
      "Mobile bottom navigation must track isChatOpen to avoid overlapping active chat"
    );
    assert(
      mobileNavSrc.includes("isKeyboardVisible"),
      "Mobile bottom navigation must track isKeyboardVisible to stay clear of virtual keyboard"
    );
    assert(
      mobileNavSrc.includes("aria-current={active ? \"page\" : undefined}"),
      "Mobile bottom navigation must maintain clear active state for current section"
    );
    assert(
      mobileNavSrc.includes("aria-label="),
      "Mobile bottom navigation buttons must have accessible labels"
    );
  });

  it("4. Chat panel aligns to safe area and keeps composer and send button visible", () => {
    assert(
      chatbotSrc.includes("pb-[env(safe-area-inset-bottom,0px)]"),
      "Chat panel container must honor safe area insets"
    );
    assert(
      chatbotSrc.includes('aria-label="Send message"'),
      "Chat composer send button must have accessible label"
    );
    assert(
      chatbotSrc.includes("Search the web"),
      "Chat composer must provide Search the Web toggle"
    );
  });

  it("5. Dashboard respects real student data and server onboarding state", () => {
    // Assert onboarding_completed gate
    assert(
      dashboardSrc.includes("profile?.onboarding_completed"),
      "Dashboard must inspect server profile onboarding_completed state"
    );
    // Assert no fallback default example CGPA like '9.2 CGPA'
    assert(
      !dashboardSrc.includes(': "9.2 CGPA"'),
      "Dashboard must not display fake 9.2 CGPA metric when CGPA is unavailable"
    );
  });
});
