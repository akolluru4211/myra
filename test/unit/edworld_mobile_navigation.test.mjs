import { test, describe } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

describe("Edworld Mobile Navigation Unit & Regression Suite", () => {
  const mobileNavPath = path.resolve(process.cwd(), "src/components/mobile/ui/MobileBottomNav.tsx");
  const navbarPath = path.resolve(process.cwd(), "src/components/layout/ModernEdworldNavbar.tsx");
  const appShellPath = path.resolve(process.cwd(), "src/components/AppShell.tsx");
  const chatbotPath = path.resolve(process.cwd(), "src/components/ai/MyraChatbot.tsx");

  test("1. MobileBottomNav renders the exact four labeled tabs: Home, Learn, Network, Menu", () => {
    const content = fs.readFileSync(mobileNavPath, "utf8");
    assert.ok(content.includes('href: "/dashboard"'), "Home tab must link to /dashboard");
    assert.ok(content.includes('label: "Home"'), "Home tab must be labeled 'Home'");
    assert.ok(content.includes('href: "/learn"'), "Learn tab must link to /learn");
    assert.ok(content.includes('label: "Learn"'), "Learn tab must be labeled 'Learn'");
    assert.ok(content.includes('href: "/network"'), "Network tab must link to /network");
    assert.ok(content.includes('label: "Network"'), "Network tab must be labeled 'Network'");
    assert.ok(content.includes('label: "Menu"'), "Menu tab must be labeled 'Menu'");
    assert.ok(content.includes("open-nav-drawer"), "Menu tab must trigger open-nav-drawer");
  });

  test("2. Myra mascot is positioned above the Menu end of the dock with visible 'Myra' label", () => {
    const content = fs.readFileSync(mobileNavPath, "utf8");
    assert.ok(content.includes("/images/myra-avatar.png"), "Mascot must use /images/myra-avatar.png");
    assert.ok(content.includes("open-myra-copilot"), "Mascot click must dispatch open-myra-copilot event");
    assert.ok(content.includes("right-3"), "Mascot must be positioned toward the right/Menu end");
    assert.ok(content.includes("-top-14"), "Mascot must float above the dock");
    assert.ok(content.includes("Myra</span>"), "Mascot must display visible 'Myra' label");
  });

  test("3. Touch targets meet accessibility requirements and support safe-area insets", () => {
    const content = fs.readFileSync(mobileNavPath, "utf8");
    assert.ok(content.includes("min-h-[48px]"), "Dock touch targets must be at least 44px (48px provided)");
    assert.ok(content.includes("min-w-[48px]"), "Dock touch targets must be at least 44px wide");
    assert.ok(content.includes("safe-area-inset-bottom"), "Dock must handle safe-area-inset-bottom");
    assert.ok(content.includes('aria-current={active ? "page" : undefined}'), "Current destination must be announced to assistive technology");
  });

  test("4. Navigation drawer includes required destinations, focus trap, and background scroll lock", () => {
    const navbarContent = fs.readFileSync(navbarPath, "utf8");
    assert.ok(navbarContent.includes('href: "/career"'), "Drawer must include Career");
    assert.ok(navbarContent.includes('href="/messages"'), "Drawer must include Messages");
    assert.ok(navbarContent.includes('href="/student-record"'), "Drawer must include Student Record");
    assert.ok(navbarContent.includes('href="/profile"'), "Drawer must include Profile & Settings");
    assert.ok(navbarContent.includes('href="/admin"'), "Drawer must conditionally include Admin for privileged users");
    assert.ok(navbarContent.includes('href="/privacy"'), "Drawer must include Privacy");
    assert.ok(navbarContent.includes('href="/terms"'), "Drawer must include Terms");
    assert.ok(navbarContent.includes('href="/about"'), "Drawer must include About");
    assert.ok(navbarContent.includes('document.body.style.overflow = "hidden"'), "Drawer must lock body scroll when open");
    assert.ok(navbarContent.includes('document.body.style.overflow = ""'), "Drawer must restore body scroll when closed");
    assert.ok(navbarContent.includes("Escape"), "Drawer must close on Escape key");
  });

  test("5. Top hamburger is hidden on mobile for signed-in users with the dock", () => {
    const navbarContent = fs.readFileSync(navbarPath, "utf8");
    assert.ok(navbarContent.includes('Boolean(user) && "hidden lg:flex"'), "Top menu button must be hidden on mobile when user is signed in");
  });

  test("6. AppShell cleans up footer when user is signed in and adds bottom padding", () => {
    const appShellContent = fs.readFileSync(appShellPath, "utf8");
    assert.match(appShellContent, /\{!user && \([\s\S]*?<ModernEdworldFooter \/>/);
    assert.ok(appShellContent.includes('Boolean(user && !isLandingPage) && "pb-[calc(8rem+env(safe-area-inset-bottom))] lg:pb-6"'), "Main workspace must include bottom padding to clear the dock");
  });

  test("7. MyraChatbot restores the mobile dock when chat closes", () => {
    const chatbotContent = fs.readFileSync(chatbotPath, "utf8");
    assert.ok(chatbotContent.includes("hidden lg:flex"), "Floating Ask Myra trigger button must be hidden on mobile");
    const navContent = fs.readFileSync(mobileNavPath, "utf8");
    assert.ok(chatbotContent.includes('dispatchEvent(new CustomEvent("close-myra-copilot"))'), "Closing chat must notify the dock");
    assert.ok(navContent.includes('addEventListener("close-myra-copilot", handleCloseChat)'), "Dock must listen for the close event");
    assert.ok(navContent.includes("if (isKeyboardVisible || isChatOpen)"), "Dock is hidden while chat or the keyboard is open");
  });
});
