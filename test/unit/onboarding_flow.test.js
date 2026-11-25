import { describe, it } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

describe("Onboarding Save Flow & Security Hardening", () => {
  const onboardingFilePath = path.join(process.cwd(), "src", "app", "onboarding", "page.tsx");
  const onboardingSource = fs.readFileSync(onboardingFilePath, "utf8");

  const dashboardFilePath = path.join(process.cwd(), "src", "app", "dashboard", "page.tsx");
  const dashboardSource = fs.readFileSync(dashboardFilePath, "utf8");

  const authContextFilePath = path.join(process.cwd(), "src", "lib", "auth-context.tsx");
  const authContextSource = fs.readFileSync(authContextFilePath, "utf8");

  it("1. Does not pre-fill dummy/example values for CGPA or graduation year", () => {
    // Should NOT have hardcoded defaults like cgpa: "8.5" or graduationYear: "2026"
    assert(
      !onboardingSource.includes('useState((profile as any)?.cgpa ? String((profile as any).cgpa) : "8.5")'),
      "Should not pre-fill CGPA with '8.5'"
    );
    assert(
      !onboardingSource.includes('useState(profile?.graduation_year || "2026")'),
      "Should not pre-fill graduationYear with '2026'"
    );
    // Should initialize empty string if not present in profile
    assert(
      onboardingSource.includes('useState(profile?.graduation_year || "")'),
      "Should initialize graduationYear to profile or empty string"
    );
    assert(
      onboardingSource.includes('useState((profile as any)?.cgpa ? String((profile as any).cgpa) : "")'),
      "Should initialize cgpa to profile or empty string"
    );
  });

  it("2. Scopes local draft storage to the authenticated user ID and clears upon success or logout", () => {
    assert(
      onboardingSource.includes('`edworld_onboarding_draft_${user.uid}`'),
      "Draft storage key must be scoped to user.uid"
    );
    assert(
      onboardingSource.includes("localStorage.removeItem(draftKey)"),
      "Must clear draft storage upon successful submission"
    );
    assert(
      authContextSource.includes('localStorage.removeItem(`edworld_onboarding_draft_${user.uid}`)'),
      "Must clear draft storage upon logout"
    );
  });

  it("3. Makes profile save authoritative and does not mark onboarding complete on skip", () => {
    // handleSkipToDashboard must NOT mark onboarding_completed: true in localStorage or updateUserProfile
    const skipMatch = onboardingSource.match(/const handleSkipToDashboard = \(\) => {([\s\S]*?)};/);
    assert(skipMatch, "handleSkipToDashboard function must exist");
    const skipBody = skipMatch[1];

    assert(
      !skipBody.includes("onboarding_completed: true"),
      "handleSkipToDashboard must not mark onboarding_completed as true"
    );
    assert(
      !skipBody.includes("updateUserProfile"),
      "handleSkipToDashboard must not call updateUserProfile to complete onboarding"
    );
  });

  it("4. Prevents duplicate submissions and requires authoritative server save", () => {
    assert(
      onboardingSource.includes("if (saving) return;"),
      "Must guard against duplicate form submissions while saving"
    );
    assert(
      onboardingSource.includes("await updateUserProfile(profilePayload);"),
      "Must await authoritative profile update"
    );
  });

  it("5. Retains inputs on error, provides retry, and handles resume generation gracefully", () => {
    // Error notification has Retry button
    assert(
      onboardingSource.includes("Retry"),
      "UI must provide a Retry button on submission failure"
    );
    // Resume seed failure directs to /resumes without reversing profile completion
    assert(
      onboardingSource.includes("setResumeNotice"),
      "Must handle resume generation issues gracefully with resumeNotice"
    );
    assert(
      onboardingSource.includes("/resumes"),
      "Must provide link/path to /resumes when resume seeding encounters an issue"
    );
  });

  it("6. Integrates validated redirect destination after onboarding completion", () => {
    assert(
      onboardingSource.includes("validateRedirectDestination"),
      "Must use validateRedirectDestination from redirect-validator"
    );
    assert(
      onboardingSource.includes("getDestinationUrl"),
      "Must resolve target destination URL safely"
    );
  });
});
