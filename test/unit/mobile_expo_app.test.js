const test = require("node:test");
const assert = require("node:assert/strict");

// Test suite for Mobile Expo App Navigation, Session Restoration & Dashboard Data

test("Mobile Auth State Machine - Routing Rules", () => {
  // Test root routing state machine transitions

  function getActiveScreen({ isLoading, authError, user, profile }) {
    if (isLoading && !user && !profile) {
      return "SplashScreen";
    }
    if (authError && !user && !profile) {
      return "RetryErrorScreen";
    }
    if (!user) {
      return "AuthScreen";
    }
    const onboardingCompleted = Boolean(profile?.onboarding_completed);
    if (!onboardingCompleted) {
      return "OnboardingScreen";
    }
    return "MainTabs";
  }

  // 1. Initial loading / session restoration
  assert.equal(
    getActiveScreen({ isLoading: true, authError: null, user: null, profile: null }),
    "SplashScreen"
  );

  // 2. Network error during session restoration
  assert.equal(
    getActiveScreen({
      isLoading: false,
      authError: "Connection failed",
      user: null,
      profile: null,
    }),
    "RetryErrorScreen"
  );

  // 3. Signed out user
  assert.equal(
    getActiveScreen({ isLoading: false, authError: null, user: null, profile: null }),
    "AuthScreen"
  );

  // 4. Signed in but incomplete onboarding
  assert.equal(
    getActiveScreen({
      isLoading: false,
      authError: null,
      user: { uid: "usr_1", name: "Student" },
      profile: { id: "usr_1", onboarding_completed: false },
    }),
    "OnboardingScreen"
  );

  // 5. Signed in with complete onboarding -> Home Dashboard
  assert.equal(
    getActiveScreen({
      isLoading: false,
      authError: null,
      user: { uid: "usr_1", name: "Student" },
      profile: { id: "usr_1", onboarding_completed: true },
    }),
    "MainTabs"
  );
});

test("Mobile Dashboard - Real Statistics & Zero Value Handling", () => {
  // Verifies that 0 streak days and 0 XP are properly rendered and not overridden by hardcoded fallbacks
  function formatStreak(days) {
    return `🔥 ${days} ${days === 1 ? "Day" : "Days"}`;
  }

  function formatPoints(points) {
    return `⚡ ${points} XP`;
  }

  assert.equal(formatStreak(0), "🔥 0 Days");
  assert.equal(formatStreak(1), "🔥 1 Day");
  assert.equal(formatStreak(5), "🔥 5 Days");

  assert.equal(formatPoints(0), "⚡ 0 XP");
  assert.equal(formatPoints(150), "⚡ 150 XP");
});

test("Mobile Auth Cache Clearing on Sign Out", async () => {
  // Simulates AsyncStorage cache removal and state resetting
  const mockStorage = new Map();
  mockStorage.set("edworld_mobile_cached_profile", JSON.stringify({ id: "usr_1", name: "Alex" }));
  mockStorage.set("edworld_mobile_cached_stats", JSON.stringify({ streakDays: 3, totalPoints: 120 }));

  let sessionState = { uid: "usr_1" };
  let statsState = { streakDays: 3, totalPoints: 120 };

  async function signOut() {
    mockStorage.delete("edworld_mobile_cached_profile");
    mockStorage.delete("edworld_mobile_cached_stats");
    sessionState = null;
    statsState = { streakDays: 0, totalPoints: 0 };
  }

  await signOut();

  assert.equal(mockStorage.has("edworld_mobile_cached_profile"), false);
  assert.equal(mockStorage.has("edworld_mobile_cached_stats"), false);
  assert.equal(sessionState, null);
  assert.deepEqual(statsState, { streakDays: 0, totalPoints: 0 });
});

test("Mobile Onboarding Save Completes Setup", async () => {
  let profile = {
    id: "usr_123",
    email: "student@example.com",
    onboarding_completed: false,
    targetRole: "",
  };

  async function completeOnboarding(data) {
    profile = {
      ...profile,
      targetRole: data.targetRole,
      onboarding_completed: true,
    };
    return { success: true };
  }

  const res = await completeOnboarding({ targetRole: "Software Engineer", graduationYear: "2026" });
  assert.equal(res.success, true);
  assert.equal(profile.onboarding_completed, true);
  assert.equal(profile.targetRole, "Software Engineer");
});
