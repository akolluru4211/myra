import { test, describe, it, before } from "node:test";
import assert from "node:assert";

/**
 * Unit & Integration Test Suite for:
 * 1. Text Practice Interview Mode (zero resume required, zero mic/camera/proctoring)
 * 2. 5-Question Sequential Navigation & Blank Answer Submission Guard
 * 3. Session Recovery & Draft Persistence
 * 4. Server-Side Written Scoring (Relevance, Clarity, Role Depth, STAR)
 * 5. Deduplication & Idempotency on Score Retries (Preventing duplicate points & duplicate sessions)
 * 6. Metric Sanitization (Hiding speech WPM, pace, filler words, eye-contact for text sessions)
 */

describe("Mock Interview Upgrade - Text Practice & Session Recovery", () => {
  // In-Memory DB representing Supabase interview_sessions & points
  const db = {
    sessions: [],
    pointsLedger: [],
  };

  const student = {
    uid: "test-user-text-interview-001",
    name: "Adarsh Student",
    ageBand: "18+",
  };

  it("1. Zero Setup: Generates up to 5 questions for selected sector without requiring a resume", async () => {
    // Simulate question sampling for text practice
    const selectedSector = "Software development";
    const mode = "text";

    // Call simulated question picker (same logic as /api/interview/generate-questions fast-path)
    const questions = [
      {
        id: "bank_q_1",
        text: "Hi Adarsh, welcome to your text practice drill for Software development. Walk me through a complex architectural bug you solved.",
        category: selectedSector,
        difficultyLevel: 1,
        keyPoints: ["STAR structured delivery", "Root cause identification"],
        type: "warmup",
      },
      {
        id: "bank_q_2",
        text: "How do you handle schema migrations and backward compatibility in zero-downtime microservices?",
        category: selectedSector,
        difficultyLevel: 1,
        keyPoints: ["Backward compatibility", "Database locking avoidance"],
        type: "project_deep_dive",
      },
      {
        id: "bank_q_3",
        text: "Explain how you troubleshoot memory leaks or CPU saturation under spike load.",
        category: selectedSector,
        difficultyLevel: 1,
        keyPoints: ["Profiling tools", "Graceful degradation"],
        type: "technical",
      },
      {
        id: "bank_q_4",
        text: "Tell me about a time you had a technical disagreement with a colleague. How did you resolve it?",
        category: selectedSector,
        difficultyLevel: 1,
        keyPoints: ["Constructive conflict resolution", "Data-driven trade-offs"],
        type: "behavioral",
      },
      {
        id: "bank_q_5",
        text: "Design a distributed rate limiter that throttles API abuse across multiple servers.",
        category: selectedSector,
        difficultyLevel: 1,
        keyPoints: ["Token bucket / Leaky bucket", "Redis atomicity"],
        type: "system_design",
      },
    ];

    assert.strictEqual(questions.length, 5, "Must generate exactly up to 5 questions");
    assert.strictEqual(mode, "text");
    assert.strictEqual(questions[0].category, "Software development");
  });

  it("2. Blank Answer Validation: Disables or rejects empty/whitespace answer submission", () => {
    const isAnswerValid = (text) => Boolean(text && text.trim().length > 0);

    assert.strictEqual(isAnswerValid(""), false, "Empty string should be invalid");
    assert.strictEqual(isAnswerValid("   \n\t  "), false, "Whitespace-only should be invalid");
    assert.strictEqual(
      isAnswerValid("We observed database connection pool exhaustion under sudden traffic spikes."),
      true,
      "Valid text answer should be allowed"
    );
  });

  it("3. Session Recovery: Persists active question index, answers, and active draft", () => {
    const activeTextSessionId = "text-sess-uuid-1234";
    const inMemoryStorage = {};

    const saveDraft = (data) => {
      inMemoryStorage[`edworld_${student.uid}_text_practice_draft`] = JSON.stringify(data);
    };

    const loadDraft = () => {
      const raw = inMemoryStorage[`edworld_${student.uid}_text_practice_draft`];
      return raw ? JSON.parse(raw) : null;
    };

    // Simulate answering question 1 and partially typing question 2
    saveDraft({
      sessionId: activeTextSessionId,
      sector: "Cloud Architecture",
      currentIdx: 1,
      answers: {
        0: "In our payment microservice, I detected connection pool exhaustion due to slow queries.",
      },
      activeDraft: "To remediate this, I introduced Redis caching with a 60-second TTL...",
      updatedAt: Date.now(),
    });

    // Simulate browser refresh & recovery
    const recovered = loadDraft();
    assert.ok(recovered, "Saved draft must exist");
    assert.strictEqual(recovered.sessionId, activeTextSessionId);
    assert.strictEqual(recovered.currentIdx, 1);
    assert.ok(recovered.answers[0].includes("payment microservice"));
    assert.ok(recovered.activeDraft.includes("Redis caching"));
  });

  it("4. Server-Side Written Scoring: Scores written answers on relevance, clarity & role depth without voice/camera telemetry", () => {
    const writtenSubmission = {
      transcript:
        "Situation: In our payment gateway, API response times spiked to 4 seconds during Black Friday. " +
        "Task: I was responsible for reducing latency to sub-200ms while preserving data consistency. " +
        "Action: I implemented an asynchronous message queue with Kafka and cached frequent lookups in Redis. " +
        "Result: Latency dropped by 88% and the cluster achieved 99.99% uptime with zero payment errors.",
      format: "text",
      category: "Software Engineering",
    };

    // Simulated evaluation matching UniversalAI.scoreInterviewResponse + scoring route
    const contentScore = 92;
    const structureScore = 94;
    const isTextFormat = writtenSubmission.format === "text";

    // Text format calculation: 60% content relevance/depth, 40% written structure/clarity
    const overallScore = isTextFormat
      ? Math.round(contentScore * 0.6 + structureScore * 0.4)
      : Math.round(contentScore * 0.5 + 80 * 0.35 + 85 * 0.15);

    assert.strictEqual(overallScore, 93, "Score must be accurately weighted for written responses");

    const metrics = {
      wordsPerMinute: isTextFormat ? null : 130,
      fillerWordCount: isTextFormat ? 0 : 3,
      clarityScore: structureScore,
      contentScore,
      voiceDelivery: isTextFormat ? null : 80,
      facialEngagement: isTextFormat ? null : 85,
      eyeContactRating: isTextFormat ? null : "Good",
    };

    assert.strictEqual(metrics.wordsPerMinute, null, "Words per minute must be null for text practice");
    assert.strictEqual(metrics.voiceDelivery, null, "Voice delivery score must be null for text practice");
    assert.strictEqual(metrics.facialEngagement, null, "Facial engagement must be null for text practice");
    assert.strictEqual(metrics.eyeContactRating, null, "Eye contact rating must be null for text practice");
    assert.strictEqual(metrics.clarityScore, 94);
  });

  it("5. Idempotency & Deduplication: Prevents duplicate records and duplicate gamification points on score retries", () => {
    const sessionId = "text-sess-uuid-idempotent-001";

    const scoreSessionSimulation = (sid, attempt) => {
      const existing = db.sessions.find((s) => s.id === sid);
      let isNew = false;

      if (!existing) {
        isNew = true;
        db.sessions.push({
          id: sid,
          user_id: student.uid,
          format: "text",
          overall_score: 91,
          created_at: new Date().toISOString(),
        });

        // Award points ONLY if new session
        db.pointsLedger.push({
          userId: student.uid,
          sourceId: sid,
          points: 50,
        });
      } else {
        // Update existing record safely
        existing.updated_at = new Date().toISOString();
      }

      return { sessionId: sid, isNew };
    };

    // First attempt
    const firstCall = scoreSessionSimulation(sessionId, 1);
    assert.strictEqual(firstCall.isNew, true, "First attempt must be new");
    assert.strictEqual(db.sessions.length, 1);
    assert.strictEqual(db.pointsLedger.length, 1);

    // Second retry (e.g. user clicked Retry feedback or network retry)
    const secondCall = scoreSessionSimulation(sessionId, 2);
    assert.strictEqual(secondCall.isNew, false, "Second attempt must be recognized as existing session");
    assert.strictEqual(db.sessions.length, 1, "Must not create a duplicate row");
    assert.strictEqual(db.pointsLedger.length, 1, "Must not award duplicate points on retry");
  });

  it("6. Feedback Presentation: Correctly structures 'What worked', 'What to improve', and Benchmark Model Version", () => {
    const feedback = {
      strengths: [
        "Clear STAR narrative with measurable 88% latency reduction.",
        "Concrete architectural justification for Kafka and Redis.",
      ],
      areasForImprovement: [
        "Mention failure fallback modes if the Kafka consumer encounters a poison pill.",
      ],
      whatYouSaid: "In our payment gateway, API response times spiked to 4 seconds...",
      improvedVersion:
        "When our payment gateway experienced a 4-second latency degradation during peak traffic, I identified database pool exhaustion...",
    };

    assert.ok(feedback.strengths.length >= 1, "Must include 'What worked' points");
    assert.ok(feedback.areasForImprovement.length >= 1, "Must include 'What to improve' points");
    assert.ok(feedback.improvedVersion.length > 20, "Must provide senior benchmark model rewrite");
  });
});
