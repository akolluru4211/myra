import { test, describe, it, before } from "node:test";
import assert from "node:assert";
import fs from "node:fs";
import path from "node:path";

describe("Database Migration Integrity & RLS Policy Verification", () => {
  const migrationsDir = path.join(process.cwd(), "supabase", "migrations");
  const migrationFiles = fs.readdirSync(migrationsDir).filter((f) => f.endsWith(".sql")).sort();

  it("should have globally unique timestamp versions for all migrations", () => {
    const versions = migrationFiles.map((f) => f.slice(0, 14));
    const uniqueVersions = new Set(versions);
    assert.strictEqual(
      versions.length,
      uniqueVersions.size,
      `Detected duplicate migration versions: ${versions.filter((v, i) => versions.indexOf(v) !== i).join(", ")}`
    );
  });

  it("should verify 20260831000000 has no stray column declarations (Postgres 42601 prevention)", () => {
    const file = path.join(migrationsDir, "20260831000000_relational_schema_and_rls.sql");
    const content = fs.readFileSync(file, "utf8");

    // Ensure user_interests closing parenthesis is not followed by stray self_level definitions
    const userInterestsBlock = content.match(/CREATE TABLE IF NOT EXISTS public\.user_interests\s*\([\s\S]*?\);/);
    assert.ok(userInterestsBlock, "user_interests table must be defined");

    // Check that there is no duplicate self_level outside a CREATE TABLE block
    const strayMatch = content.match(/\);\s*self_level INT/);
    assert.strictEqual(strayMatch, null, "Found stray column declaration after closing parenthesis in 20260831000000");
  });

  it("should verify profiles table transition handles both id and user_id gracefully", () => {
    const file = path.join(migrationsDir, "20260831000000_relational_schema_and_rls.sql");
    const content = fs.readFileSync(file, "utf8");

    assert.ok(
      content.includes("ALTER TABLE public.profiles ADD COLUMN user_id UUID") ||
      content.includes("ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS user_id UUID") ||
      content.includes("COALESCE(user_id, id)"),
      "Must ensure user_id column addition and COALESCE fallback"
    );
  });

  it("should verify Problem Solution Board does not reference non-existent mentor_connections table", () => {
    const file = path.join(migrationsDir, "20260904020000_feature15_problem_solution_board.sql");
    const content = fs.readFileSync(file, "utf8");

    assert.strictEqual(
      content.includes("mentor_connections"),
      false,
      "Must not reference non-existent public.mentor_connections table"
    );
    assert.ok(
      content.includes("public.connections"),
      "Must use the canonical public.connections table for mentorship relationships"
    );
  });

  it("should verify 20260912000000 adds is_active before creating policy (Postgres 42703 prevention)", () => {
    const file = path.join(migrationsDir, "20260912000000_live_data_and_mcp_schema.sql");
    const content = fs.readFileSync(file, "utf8");

    assert.ok(
      content.includes("ALTER TABLE public.interview_questions ADD COLUMN IF NOT EXISTS is_active"),
      "Must ensure is_active column is added to public.interview_questions before policy creation"
    );
    assert.ok(
      content.includes("ALTER TABLE public.interview_questions ADD COLUMN IF NOT EXISTS key_points"),
      "Must ensure key_points column is added to public.interview_questions"
    );
    assert.ok(
      content.includes("DROP POLICY IF EXISTS \"Allow public read on active interview questions\""),
      "Must drop policy if exists to avoid 42710 duplicate policy errors on replay"
    );
  });

  it("should verify 20260912000000 relaxes problem constraints and safely handles jobs seed data", () => {
    const file = path.join(migrationsDir, "20260912000000_live_data_and_mcp_schema.sql");
    const content = fs.readFileSync(file, "utf8");

    assert.ok(
      content.includes("DROP CONSTRAINT IF EXISTS problems_category_check"),
      "Must relax problems category check constraint for AI and engineering categories"
    );
    assert.ok(
      content.includes("ALTER TABLE public.jobs ALTER COLUMN posted_by DROP NOT NULL"),
      "Must drop NOT NULL on jobs.posted_by for platform curated jobs"
    );
  });

  describe("RLS Policy Access Rules Evaluation", () => {
    // Pure logic simulation of profiles_select_public_or_own RLS policy
    function canSelectProfile({ authUid, profileOwnerId, profileUserId, isPublic, ageBand, isAdmin }) {
      const resolvedUserId = profileUserId || profileOwnerId;
      if (resolvedUserId === authUid) return true;
      if (isPublic === true && ageBand === "18+") return true;
      if (isAdmin === true) return true;
      return false;
    }

    it("profiles: allows owner to view their own profile even if private or under 18", () => {
      assert.strictEqual(
        canSelectProfile({
          authUid: "user-1",
          profileOwnerId: "user-1",
          profileUserId: "user-1",
          isPublic: false,
          ageBand: "13-15",
          isAdmin: false,
        }),
        true
      );
    });

    it("profiles: allows viewing public profile of 18+ user by another user", () => {
      assert.strictEqual(
        canSelectProfile({
          authUid: "user-2",
          profileOwnerId: "user-1",
          profileUserId: "user-1",
          isPublic: true,
          ageBand: "18+",
          isAdmin: false,
        }),
        true
      );
    });

    it("profiles: DENIES viewing private profile of 18+ user by an unrelated user", () => {
      assert.strictEqual(
        canSelectProfile({
          authUid: "user-2",
          profileOwnerId: "user-1",
          profileUserId: "user-1",
          isPublic: false,
          ageBand: "18+",
          isAdmin: false,
        }),
        false
      );
    });

    it("profiles: DENIES viewing public profile of minor (<18) by an unrelated user (safety gate)", () => {
      assert.strictEqual(
        canSelectProfile({
          authUid: "user-2",
          profileOwnerId: "user-1",
          profileUserId: "user-1",
          isPublic: true,
          ageBand: "13-15",
          isAdmin: false,
        }),
        false
      );
    });

    it("profiles: allows platform admin to view any profile regardless of privacy or age", () => {
      assert.strictEqual(
        canSelectProfile({
          authUid: "admin-1",
          profileOwnerId: "user-1",
          profileUserId: "user-1",
          isPublic: false,
          ageBand: "13-15",
          isAdmin: true,
        }),
        true
      );
    });

    // Pure logic simulation of feedback_authorized_insert RLS policy on solution_feedback
    // Matches the policy in 20260904020000:
    // User must be admin/teacher OR have an accepted mentorship connection with the solution author
    function canInsertFeedback({
      authUid,
      solutionAuthorId,
      isAdmin = false,
      isTeacher = false,
      isMentor = false,
      connection = null, // { requester_id, recipient_id, type, status }
    }) {
      if (isAdmin || isTeacher) return true;
      if (connection) {
        const isParticipant =
          (connection.requester_id === authUid && connection.recipient_id === solutionAuthorId) ||
          (connection.recipient_id === authUid && connection.requester_id === solutionAuthorId);
        const isMentorship = connection.type === "mentorship" || isMentor;
        const isAccepted = connection.status === "accepted";
        if (isParticipant && isMentorship && isAccepted) {
          return true;
        }
      }
      return false;
    }

    it("solution_feedback: allows platform admin to submit feedback", () => {
      assert.strictEqual(
        canInsertFeedback({
          authUid: "admin-1",
          solutionAuthorId: "student-1",
          isAdmin: true,
        }),
        true
      );
    });

    it("solution_feedback: allows verified teacher to submit feedback", () => {
      assert.strictEqual(
        canInsertFeedback({
          authUid: "teacher-1",
          solutionAuthorId: "student-1",
          isTeacher: true,
        }),
        true
      );
    });

    it("solution_feedback: allows connected accepted mentor to submit feedback for mentee", () => {
      assert.strictEqual(
        canInsertFeedback({
          authUid: "mentor-1",
          solutionAuthorId: "student-1",
          connection: {
            requester_id: "student-1",
            recipient_id: "mentor-1",
            type: "mentorship",
            status: "accepted",
          },
        }),
        true
      );
    });

    it("solution_feedback: DENIES pending mentorship connection (not yet accepted)", () => {
      assert.strictEqual(
        canInsertFeedback({
          authUid: "mentor-1",
          solutionAuthorId: "student-1",
          connection: {
            requester_id: "student-1",
            recipient_id: "mentor-1",
            type: "mentorship",
            status: "pending",
          },
        }),
        false
      );
    });

    it("solution_feedback: DENIES accepted peer connection that is NOT a mentorship", () => {
      assert.strictEqual(
        canInsertFeedback({
          authUid: "peer-1",
          solutionAuthorId: "student-1",
          isMentor: false,
          connection: {
            requester_id: "student-1",
            recipient_id: "peer-1",
            type: "peer",
            status: "accepted",
          },
        }),
        false
      );
    });

    it("solution_feedback: DENIES unrelated user with no connection", () => {
      assert.strictEqual(
        canInsertFeedback({
          authUid: "stranger-1",
          solutionAuthorId: "student-1",
          connection: null,
        }),
        false
      );
    });

    // Pure logic simulation of solutions_peer_approved_read RLS policy on problem_solutions
    function canReadPeerSolution({ authUid, solutionOwnerId, visibility, moderationStatus, isAdmin }) {
      if (authUid === solutionOwnerId) return true;
      if (isAdmin) return true;
      if ((visibility === "classroom" || visibility === "public") && moderationStatus === "approved") {
        return true;
      }
      return false;
    }

    it("problem_solutions: owner can read their own pending private solution", () => {
      assert.strictEqual(
        canReadPeerSolution({
          authUid: "student-1",
          solutionOwnerId: "student-1",
          visibility: "private",
          moderationStatus: "pending",
          isAdmin: false,
        }),
        true
      );
    });

    it("problem_solutions: peer CANNOT read another student's pending solution (never leaks pending)", () => {
      assert.strictEqual(
        canReadPeerSolution({
          authUid: "peer-1",
          solutionOwnerId: "student-1",
          visibility: "public",
          moderationStatus: "pending",
          isAdmin: false,
        }),
        false
      );
    });

    it("problem_solutions: peer CANNOT read another student's private solution even if approved", () => {
      assert.strictEqual(
        canReadPeerSolution({
          authUid: "peer-1",
          solutionOwnerId: "student-1",
          visibility: "private",
          moderationStatus: "approved",
          isAdmin: false,
        }),
        false
      );
    });

    it("problem_solutions: peer CAN read approved public or classroom solution", () => {
      assert.strictEqual(
        canReadPeerSolution({
          authUid: "peer-1",
          solutionOwnerId: "student-1",
          visibility: "public",
          moderationStatus: "approved",
          isAdmin: false,
        }),
        true
      );
    });
  });
});
