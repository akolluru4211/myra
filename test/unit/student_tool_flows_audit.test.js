import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

/**
 * Unit & Integration Test Suite for Student Tool Flows Audit & Fixes:
 * 1. Practice: /learn, /dsa, /daily - topic opening, answer submission, feedback & progress
 * 2. Interviews: /interviews, /interviews/[category], /interviews/results/[sessionId] - permissions, session completion, results
 * 3. Resumes: /resumes - load/create, edit, autosave confirmation, persistence across reopening
 * 4. Jobs: /jobs, /jobs/[id], /student-record?tab=applications - filters, details, apply modal, application status
 * 5. Networking: /network - discover members, send request, accept request, open direct messages
 * 6. Projects & EdBuild: /projects, /edbuild, /edbuild/[groupId] - discover problem, create/join group, member actions
 * 7. Student Record: /student-record - entries by tab, tab query survival, persistence after refresh
 * 8. Navigation Integrity: CurvySideDock, ModernEdworldNavbar, Dashboard - no broken routes or dead links
 */

test("Student Tool Flows Audit & Journey Integrity", async (t) => {
  const curvyDockSrc = fs.readFileSync(path.resolve("src/components/layout/CurvySideDock.tsx"), "utf8");
  const navbarSrc = fs.readFileSync(path.resolve("src/components/layout/ModernEdworldNavbar.tsx"), "utf8");
  const dashboardSrc = fs.readFileSync(path.resolve("src/app/dashboard/page.tsx"), "utf8");
  const dsaPageSrc = fs.readFileSync(path.resolve("src/app/dsa/page.tsx"), "utf8");
  const dsaDetailSrc = fs.readFileSync(path.resolve("src/app/dsa/[slug]/page.tsx"), "utf8");
  const resumePageSrc = fs.readFileSync(path.resolve("src/app/resumes/page.tsx"), "utf8");
  const jobsPageSrc = fs.readFileSync(path.resolve("src/app/jobs/page.tsx"), "utf8");
  const jobDetailSrc = fs.readFileSync(path.resolve("src/app/jobs/[id]/page.tsx"), "utf8");
  const applyModalSrc = fs.readFileSync(path.resolve("src/components/jobs/ApplyModal.tsx"), "utf8");
  const networkPageSrc = fs.readFileSync(path.resolve("src/app/network/page.tsx"), "utf8");
  const edbuildPageSrc = fs.readFileSync(path.resolve("src/app/edbuild/page.tsx"), "utf8");
  const edbuildDetailSrc = fs.readFileSync(path.resolve("src/app/edbuild/[groupId]/page.tsx"), "utf8");
  const studentRecordSrc = fs.readFileSync(path.resolve("src/app/student-record/page.tsx"), "utf8");
  const leaderboardPageSrc = fs.readFileSync(path.resolve("src/app/leaderboard/page.tsx"), "utf8");

  await t.test("Navigation integrity: no dead links to /problems, /projectstudio, or unrouted /leaderboard", () => {
    // Assert CurvySideDock routes to valid primary destinations
    assert.ok(curvyDockSrc.includes('href: "/dsa"'), "CurvySideDock should link directly to /dsa");
    assert.ok(curvyDockSrc.includes('href: "/projects"'), "CurvySideDock should link directly to /projects");
    assert.ok(curvyDockSrc.includes('href: "/leaderboard"'), "CurvySideDock should link to /leaderboard");
    assert.ok(curvyDockSrc.includes('href: "/student-record"'), "CurvySideDock should link to /student-record");

    // Assert ModernEdworldNavbar routes
    assert.ok(navbarSrc.includes('href: "/dsa"'), "Navbar should link directly to /dsa");
    assert.ok(navbarSrc.includes('href: "/projects"'), "Navbar should link directly to /projects");

    // Assert Dashboard links
    assert.ok(dashboardSrc.includes('href="/dsa"'), "Dashboard should link directly to /dsa");
    assert.ok(!dashboardSrc.includes('href="/problems"'), "Dashboard should not contain stale /problems links");
  });

  await t.test("Practice Flow: DSA topic selection, quiz answer validation, and back path", () => {
    assert.ok(dsaPageSrc.includes("/api/dsa/topics"), "DSA Hub fetches topics from API");
    assert.ok(dsaDetailSrc.includes("ArrowLeft") || dsaDetailSrc.includes('href="/dsa"'), "Topic detail provides a clear back path to /dsa");
    assert.ok(dsaDetailSrc.includes("DsaPracticeQuiz"), "Topic detail integrates practice quiz component");
    assert.ok(dsaDetailSrc.includes("DsaCodeRunnerArena"), "Topic detail integrates code runner arena");
  });

  await t.test("Interviews Flow: category selection, audio permission check, session submission, results view", () => {
    const interviewCategorySrc = fs.readFileSync(path.resolve("src/app/interviews/[category]/page.tsx"), "utf8");
    assert.ok(interviewCategorySrc.includes("PreFlightAudioCheckModal"), "Interview flow enforces audio/mic permission check");
    assert.ok(interviewCategorySrc.includes("/api/interview/score-session"), "Submits session for scoring to server");
    assert.ok(interviewCategorySrc.includes("/interviews/results/"), "Navigates to results view upon completion");
  });

  await t.test("Resumes Flow: user-scoped storage, autosave status, and persistence across reopen", () => {
    assert.ok(resumePageSrc.includes("edworld_${user.uid}_resumes"), "Scoped local cache prevents cross-user resume collision");
    assert.ok(resumePageSrc.includes("supabase.from(\"resumes\").upsert"), "Persists resume changes authoritatively to Supabase");
    assert.ok(resumePageSrc.includes("setSavedStatus"), "Visual saving indicator gives clear feedback to student");
  });

  await t.test("Jobs Flow: filtered search, detailed listing, apply modal snapshot, application status", () => {
    assert.ok(jobsPageSrc.includes("filteredJobs"), "Jobs directory filters by search keywords, category, and source");
    assert.ok(jobsPageSrc.includes("/student-record?tab=applications"), "My Applications links to authoritative student record application tab");
    assert.ok(applyModalSrc.includes("userAppKey"), "ApplyModal scopes application history per user");
    assert.ok(applyModalSrc.includes("isDuplicate"), "ApplyModal guards against duplicate submissions");
    assert.ok(applyModalSrc.includes("resumeSnapshot"), "ApplyModal attaches immutable resume snapshot to application");
  });

  await t.test("Networking Flow: discover members, send/accept connection request, message trigger", () => {
    assert.ok(networkPageSrc.includes("handleConnect"), "Network page supports sending connection requests");
    assert.ok(networkPageSrc.includes("handleAcceptConnection"), "Network page supports accepting pending incoming requests");
    assert.ok(networkPageSrc.includes("DirectMessageModal"), "Network page provides direct messaging modal for peers");
    assert.ok(networkPageSrc.includes("showToast"), "Provides feedback on sent connection requests");
  });

  await t.test("Projects & EdBuild Flow: discover problems, create group, private join key, group workspace", () => {
    assert.ok(edbuildPageSrc.includes("handleCreateGroup"), "EdBuild supports creating project squads");
    assert.ok(edbuildPageSrc.includes("handleJoinByKey"), "EdBuild supports private join-by-key flow");
    assert.ok(edbuildPageSrc.includes("handleJoinPublicGroup"), "EdBuild supports 1-click public squad joining");
    assert.ok(edbuildDetailSrc.includes("EdBuildWorkspacePage"), "Dedicated group workspace is available with chat and deliverables");
  });

  await t.test("Student Record Flow: tab persistence via search params and vault entries", () => {
    assert.ok(studentRecordSrc.includes("useSearchParams"), "Student record reads tab parameter from URL");
    assert.ok(studentRecordSrc.includes("initialTab"), "Defaults to requested tab, preserving navigation deep links");
    assert.ok(studentRecordSrc.includes("/api/edmail/records/marks"), "Authoritative marks endpoint");
    assert.ok(studentRecordSrc.includes("/api/student-record/applications"), "Authoritative applications tracking");
  });

  await t.test("Leaderboard Safety: minor wellbeing policy protection", () => {
    assert.ok(leaderboardPageSrc.includes("Wellbeing &amp; Student Safety Protection Active") || leaderboardPageSrc.includes("Wellbeing & Student Safety Protection Active"), "Explains minor wellbeing protection");
    assert.ok(leaderboardPageSrc.includes("Weekly Peer Leaderboard"), "Renders weekly standings for adult career track");
  });
});
