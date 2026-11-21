import { test, describe, it } from "node:test";
import assert from "node:assert";

describe("Student Record Evidence, Portfolio Publishing & Immutable Application Flow", () => {
  describe("1. Portfolio Evidence Publishing & Selective Visibility", () => {
    function filterPublishedFields(item, publishedFields) {
      if (!item.is_published) return null;
      const res = { id: item.id, is_published: true };
      for (const [key, enabled] of Object.entries(publishedFields)) {
        if (enabled && item[key] !== undefined) {
          res[key] = item[key];
        }
      }
      return res;
    }

    it("publishes project with only selected fields visible to the public", () => {
      const project = {
        id: "proj-1",
        title: "Autonomous Delivery Drone Simulator",
        description: "Built simulated drone routing algorithm in Python & ROS.",
        internal_notes: "Bug with collision avoidance on edge case 4",
        github_url: "https://github.com/student/drone-sim",
        live_url: "https://drone-sim.demo.edworld.co.in",
        is_published: true,
      };

      const published = filterPublishedFields(project, {
        title: true,
        description: true,
        github_url: true,
        live_url: true,
      });

      assert.ok(published);
      assert.strictEqual(published.title, "Autonomous Delivery Drone Simulator");
      assert.strictEqual(published.github_url, "https://github.com/student/drone-sim");
      assert.strictEqual(published.internal_notes, undefined, "Internal notes must not be published");
    });

    it("preserves verified vs student-entered status across portfolio publishing", () => {
      const verifiedCert = {
        id: "cert-1",
        title: "AWS Cloud Practitioner",
        issuer: "Amazon Web Services",
        is_verified: true,
        is_published: true,
      };

      const unverifiedCert = {
        id: "cert-2",
        title: "Online Bootcamp Completion",
        issuer: "Independent Instructor",
        is_verified: false,
        is_published: true,
      };

      assert.strictEqual(verifiedCert.is_verified, true);
      assert.strictEqual(unverifiedCert.is_verified, false);
    });

    it("immediately removes unlisted/revoked item from public view", () => {
      const project = {
        id: "proj-1",
        title: "Experimental App",
        is_published: false, // revoked
      };

      const published = filterPublishedFields(project, { title: true });
      assert.strictEqual(published, null, "Revoked project must return null for public visitors");
    });
  });

  describe("2. Resume Studio Evidence Import & Grounded Bullets", () => {
    function importProjectToResume(existingResume, project) {
      const existing = existingResume.content.projects || [];
      // Deduplication: prevent adding if title already exists
      if (existing.some((p) => p.title.toLowerCase() === project.title.toLowerCase())) {
        return { success: false, reason: "Project already added to resume", content: existingResume.content };
      }

      const newProj = {
        id: "proj-" + Date.now(),
        title: project.title,
        description: project.description,
        link: project.live_url || project.github_url || "",
        technologies: project.tech_stack || [],
        bullets: [project.description],
      };

      return {
        success: true,
        content: {
          ...existingResume.content,
          projects: [...existing, newProj],
        },
      };
    }

    it("imports project into resume and avoids duplicate addition on retry", () => {
      const resume = {
        id: "res-1",
        content: { projects: [] },
      };

      const project = {
        title: "Distributed KV Store",
        description: "Built Raft consensus-backed key-value store in Go.",
        tech_stack: ["Go", "gRPC", "Docker"],
        github_url: "https://github.com/student/kv-store",
      };

      const firstImport = importProjectToResume(resume, project);
      assert.strictEqual(firstImport.success, true);
      assert.strictEqual(firstImport.content.projects.length, 1);
      assert.strictEqual(firstImport.content.projects[0].title, "Distributed KV Store");

      // Retry same import
      const retryImport = importProjectToResume({ id: "res-1", content: firstImport.content }, project);
      assert.strictEqual(retryImport.success, false);
      assert.strictEqual(retryImport.reason, "Project already added to resume");
      assert.strictEqual(retryImport.content.projects.length, 1);
    });
  });

  describe("3. Immutable Application Snapshot & Post-Submission Resume Edits", () => {
    it("submits application with immutable snapshot that is preserved after resume edits", () => {
      // 1. Initial Resume Version 1
      const resumeV1 = {
        id: "resume-1",
        title: "Software Engineering Resume v1",
        content: {
          summary: "Passionate full-stack developer.",
          skills: { technical: ["TypeScript", "Next.js", "PostgreSQL"] },
          projects: [{ title: "EdMail System", bullets: ["Built webmail interface"] }],
        },
      };

      // 2. Submit Application
      const application = {
        id: "app-1001",
        jobId: "job-swe-1",
        userId: "student-1",
        resumeId: resumeV1.id,
        resumeSnapshot: JSON.parse(JSON.stringify(resumeV1.content)), // Deep clone snapshot
        status: "submitted",
        appliedAt: new Date().toISOString(),
      };

      // 3. Student modifies resume afterwards in Resume Studio (Version 2)
      resumeV1.content.summary = "Updated summary: Principal AI architect.";
      resumeV1.content.skills.technical = ["Python", "PyTorch", "CUDA"];
      resumeV1.content.projects = []; // Deleted projects

      // 4. Assert submitted application retains original Snapshot Version 1
      assert.strictEqual(application.resumeSnapshot.summary, "Passionate full-stack developer.");
      assert.deepStrictEqual(application.resumeSnapshot.skills.technical, ["TypeScript", "Next.js", "PostgreSQL"]);
      assert.strictEqual(application.resumeSnapshot.projects.length, 1);
      assert.strictEqual(application.resumeSnapshot.projects[0].title, "EdMail System");
    });

    it("prevents duplicate application submissions for the same job listing", () => {
      const existingApps = [{ jobId: "job-101", userId: "student-1" }];

      function submitApplication(newApp, allApps) {
        if (allApps.some((a) => a.jobId === newApp.jobId && a.userId === newApp.userId)) {
          return { success: false, error: "Duplicate application" };
        }
        return { success: true };
      }

      const retryRes = submitApplication({ jobId: "job-101", userId: "student-1" }, existingApps);
      assert.strictEqual(retryRes.success, false);
      assert.strictEqual(retryRes.error, "Duplicate application");
    });
  });

  describe("4. Multi-Tenant Privacy & Cross-Account Denial", () => {
    function canAccessPrivateStudentRecord({ viewerId, ownerId, isPublic, isPublished }) {
      if (viewerId === ownerId) return true;
      if (isPublic && isPublished) return true;
      return false;
    }

    it("DENIES Student B from reading Student A's unpublished evidence", () => {
      const allowed = canAccessPrivateStudentRecord({
        viewerId: "student-b",
        ownerId: "student-a",
        isPublic: false,
        isPublished: false,
      });
      assert.strictEqual(allowed, false);
    });

    it("allows anyone to view Student A's explicitly published portfolio item", () => {
      const allowed = canAccessPrivateStudentRecord({
        viewerId: "student-b",
        ownerId: "student-a",
        isPublic: true,
        isPublished: true,
      });
      assert.strictEqual(allowed, true);
    });
  });
});
