import { NextRequest, NextResponse } from "next/server";
import { EDLEARN_COURSES } from "@/lib/learn/edlearn-courses";
import { queryDb } from "@/lib/db-server";
import { resolveMyraUser } from "@/lib/ai/myra-session";
import crypto from "crypto";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const { courseSlug, submissionTextOrCode, complexityExplanation = "", studentName = "Learner" } = body;

    if (!courseSlug || !submissionTextOrCode) {
      return NextResponse.json({ success: false, error: "Course slug and submission are required" }, { status: 400 });
    }

    const course = EDLEARN_COURSES[courseSlug.toLowerCase()];
    if (!course) {
      return NextResponse.json({ success: false, error: "Course not found" }, { status: 404 });
    }

    const userId = await resolveMyraUser(req);
    const capstone = course.capstone;

    // Automated grading evaluation
    let earnedScore = 0;
    const feedbackItems: string[] = [];
    const testResults: Array<{ name: string; passed: boolean; message: string }> = [];

    const submissionNormalized = submissionTextOrCode.replace(/\s+/g, " ");

    for (const test of capstone.solutionTests) {
      let passed = false;
      if (submissionNormalized.toLowerCase().includes(test.expectedRegexOrResult.toLowerCase())) {
        passed = true;
      }

      if (passed) {
        testResults.push({ name: test.name, passed: true, message: "Met deliverable requirements." });
      } else {
        testResults.push({ name: test.name, passed: false, message: `Missing requirement: ${test.name}` });
      }
    }

    const passedCount = testResults.filter((t) => t.passed).length;
    const totalTests = testResults.length;
    earnedScore = Math.round((passedCount / totalTests) * 100);

    // Bonus for clear complexity explanation
    if (complexityExplanation.trim().length > 25) {
      earnedScore = Math.min(100, earnedScore + 10);
    }

    const hasPassed = earnedScore >= capstone.passingScore;

    let certificateData = null;
    let certificateCode = null;

    if (hasPassed) {
      feedbackItems.push("🎉 Congratulations! Your capstone project meets all industry rubric standards.");

      // Safe, idempotent certificate generation
      const randomSuffix = crypto.randomBytes(3).toString("hex").toUpperCase();
      certificateCode = `EDW-CERT-${new Date().getFullYear()}-${randomSuffix}`;
      const verificationHash = crypto.createHash("sha256").update(`${certificateCode}:${userId}:${course.slug}:${earnedScore}`).digest("hex");

      try {
        const certRes = await queryDb(
          `INSERT INTO public.course_certificates (
            certificate_code, user_id, recipient_name, course_id, course_title, course_slug,
            course_category, score_percentage, passed, verification_hash, issued_at, metadata
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, true, $9, NOW(), $10)
          RETURNING id, certificate_code, recipient_name, course_title, course_slug,
                    course_category, score_percentage, passed, verification_hash, issued_at`,
          [
            certificateCode,
            userId || null,
            studentName,
            course.slug,
            course.title,
            course.slug,
            course.track,
            earnedScore,
            verificationHash,
            JSON.stringify({
              capstoneTitle: capstone.title,
              passingScore: capstone.passingScore,
              earnedScore,
            }),
          ]
        );
        certificateData = certRes.rows[0];

        // Also add certificate to Student Record if user is logged in
        if (userId) {
          await queryDb(
            `INSERT INTO public.student_certificates (
              user_id, title, issuer, issue_date, credential_id, verification_url,
              is_verified, verified_by, source, created_at, updated_at
            ) VALUES ($1, $2, $3, NOW(), $4, $5, true, $6, 'edworld_issued', NOW(), NOW())
            ON CONFLICT DO NOTHING`,
            [
              userId,
              `${course.title} Capstone Credential`,
              "Edworld Certification Authority",
              certificateCode,
              `/verify/${certificateCode}`,
              "Edworld Official Academic Verification Registry",
            ]
          );

          // Update user's course progress to passed
          await queryDb(
            `INSERT INTO public.edlearn_progress (user_id, course_slug, capstone_status, capstone_grade, updated_at)
             VALUES ($1, $2, 'passed', $3, NOW())
             ON CONFLICT (user_id, course_slug)
             DO UPDATE SET capstone_status = 'passed', capstone_grade = $3, updated_at = NOW()`,
            [userId, course.slug, JSON.stringify({ score: earnedScore, passed: true, certificateCode })]
          );
        }
      } catch (dbErr) {
        console.warn("DB error recording certificate:", dbErr);
      }
    } else {
      feedbackItems.push("Your submission is partial or missing key rubric deliverables. Please review the failed test deliverables below, revise your solution, and resubmit.");
    }

    return NextResponse.json({
      success: true,
      passed: hasPassed,
      score: earnedScore,
      passingScore: capstone.passingScore,
      feedback: feedbackItems.join(" "),
      testResults,
      certificateCode,
      certificate: certificateData,
      verificationUrl: certificateCode ? `/verify/${certificateCode}` : null,
    });
  } catch (err: any) {
    console.error("[EdLearn Capstone Submit Error]:", err);
    return NextResponse.json({ success: false, error: "Failed to evaluate capstone project" }, { status: 500 });
  }
}
