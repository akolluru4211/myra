/**
 * Unit Test Suite: Language Analysis Service
 * Target Module: src/lib/interview/language-analysis-service.ts
 *
 * Verifies:
 * 1. analyzeSpokenLanguage word count, duration calculation, and words per minute (WPM) accuracy across variable speech speeds.
 * 2. Sentence metrics: sentenceCount, avgSentenceLength, long/short sentence identification.
 * 3. Filler word detection across all patterns (actually, basically, like, you know, sort of, kind of, literally, um, uh),
 *    frequency breakdown, and topFiller identification.
 * 4. Grammar and phrasing issue matching from COMMON_GRAMMAR_AND_PHRASING_FIXES.
 * 5. STAR technique pattern recognition (situation, task, action, result, optimized, built, led, etc.).
 * 6. Composite scores: grammarScore, clarityScore, fluencyScore, vocabularyScore, professionalScore,
 *    and overallLanguageScore bounding (0-100 range) and mathematical accuracy.
 * 7. Feedback and coaching output generation: strengths, areasForImprovement, coachSuggestions, improvedVersion.
 * 8. compareInterviewAttempts / compareAttempts (deltas, score progression, filler word reduction percentage, structure verdicts).
 */

const { describe, it } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const Module = require("node:module");
const ts = require("typescript");

// Register on-the-fly TypeScript compilation hook for authentic source execution
if (!require.extensions[".ts"]) {
  require.extensions[".ts"] = function (module, filename) {
    const content = fs.readFileSync(filename, "utf8");
    const compiled = ts.transpileModule(content, {
      compilerOptions: {
        module: ts.ModuleKind.CommonJS,
        target: ts.ScriptTarget.ES2022,
        esModuleInterop: true,
      },
    }).outputText;
    module._compile(compiled, filename);
  };
}

// Intercept '@/lib/...' alias to point to 'src/lib/...'
const origResolve = Module._resolveFilename;
if (!Module.__tsPathAliasHooked) {
  Module._resolveFilename = function (request, parent, isMain, options) {
    if (request.startsWith("@/")) {
      const mapped = path.resolve(process.cwd(), "src", request.slice(2));
      return origResolve.call(this, mapped, parent, isMain, options);
    }
    return origResolve.call(this, request, parent, isMain, options);
  };
  Module.__tsPathAliasHooked = true;
}

// Authentically load the target module
const {
  analyzeSpokenLanguage,
  compareAttempts,
  syncUserCommunicationProfile,
} = require("../../src/lib/interview/language-analysis-service.ts");

// Export alias as requested in dispatch
const compareInterviewAttempts = compareAttempts;

describe("Language Analysis Service Unit Tests (src/lib/interview/language-analysis-service.ts)", () => {
  // --------------------------------------------------------------------------
  // 1. Word Count, Duration Calculation & WPM Accuracy
  // --------------------------------------------------------------------------
  describe("1. Word Count, Duration Calculation & Words Per Minute (WPM)", () => {
    it("should accurately calculate word count and WPM for standard conversational pacing", () => {
      // 130 words spoken in 60 seconds = 130 WPM
      const words = Array.from({ length: 130 }, (_, i) => `word${i + 1}`).join(" ");
      const result = analyzeSpokenLanguage(words, 60);

      assert.strictEqual(result.wordCount, 130, "wordCount must equal exactly 130");
      assert.strictEqual(result.wordsPerMinute, 130, "wordsPerMinute must equal 130 for 60-second speech");
    });

    it("should accurately scale WPM for fractional and variable durations", () => {
      // 60 words in 30 seconds = 120 WPM
      const text30s = Array.from({ length: 60 }, (_, i) => `token${i}`).join(" ");
      const res30s = analyzeSpokenLanguage(text30s, 30);
      assert.strictEqual(res30s.wordsPerMinute, 120, "60 words in 30s should equal 120 WPM");

      // 100 words in 120 seconds = 50 WPM
      const text120s = Array.from({ length: 100 }, (_, i) => `token${i}`).join(" ");
      const res120s = analyzeSpokenLanguage(text120s, 120);
      assert.strictEqual(res120s.wordsPerMinute, 50, "100 words in 120s should equal 50 WPM");
    });

    it("should enforce duration floor of 10 seconds to prevent division by zero or extreme spikes", () => {
      // 20 words with duration passed as 0 or negative
      const shortText = "One two three four five six seven eight nine ten eleven twelve thirteen fourteen fifteen sixteen seventeen eighteen nineteen twenty";
      
      const res0 = analyzeSpokenLanguage(shortText, 0);
      // Math.max(10, 0) = 10 -> (20 / 10) * 60 = 120 WPM
      assert.strictEqual(res0.wordsPerMinute, 120, "Zero duration must be clamped to 10 seconds minimum");

      const resNegative = analyzeSpokenLanguage(shortText, -5);
      assert.strictEqual(resNegative.wordsPerMinute, 120, "Negative duration must be clamped to 10 seconds minimum");
    });

    it("should handle empty or whitespace-only transcripts safely", () => {
      const emptyRes = analyzeSpokenLanguage("   \n\t  ", 60);
      assert.strictEqual(emptyRes.wordCount, 0, "Word count for whitespace must be 0");
      assert.strictEqual(emptyRes.wordsPerMinute, 0, "WPM for empty string must be 0");
      assert.strictEqual(emptyRes.sentenceCount, 1, "Sentence count should fallback to at least 1");
    });
  });

  // --------------------------------------------------------------------------
  // 2. Sentence Metrics: sentenceCount, avgSentenceLength & Long/Short Identification
  // --------------------------------------------------------------------------
  describe("2. Sentence Metrics (sentenceCount, avgSentenceLength, long/short)", () => {
    it("should correctly partition sentences by multiple punctuation delimiters (. ! ?)", () => {
      const multiPunctuationText = "First sentence is simple. Second sentence is exciting! Third sentence is a question? Fourth sentence is standard.";
      const res = analyzeSpokenLanguage(multiPunctuationText, 60);

      assert.strictEqual(res.sentenceCount, 4, "Should detect exactly 4 sentences");
      assert.ok(res.avgSentenceLength > 0, "avgSentenceLength must be greater than 0");
      assert.strictEqual(res.longSentenceCount, 0, "No sentence exceeds 28 words");
    });

    it("should accurately identify run-on long sentences (>28 words)", () => {
      // Create a 35-word sentence
      const longSentence = "In our previous high-volume payment processing system we noticed that during peak festival traffic database locks were escalating dramatically and causing severe thread pool starvation which cascaded into critical gateway timeout errors for all authenticated mobile clients.";
      const shortFollowUp = "We fixed it.";
      const fullText = `${longSentence} ${shortFollowUp}`;

      const res = analyzeSpokenLanguage(fullText, 60);
      assert.strictEqual(res.longSentenceCount, 1, "Must detect exactly 1 long sentence (>28 words)");
      assert.strictEqual(res.sentenceCount, 2, "Must detect 2 total sentences");
      assert.ok(
        res.areasForImprovement.some((a) => a.includes("over 28 words")),
        "Must flag long sentences in areasForImprovement"
      );
    });

    it("should detect short sentences (<4 words) and penalize grammarScore if >2 short sentences", () => {
      const choppyText = "Yes. I did. It worked. No problem.";
      const res = analyzeSpokenLanguage(choppyText, 60);

      assert.strictEqual(res.sentenceCount, 4, "Should detect 4 short sentences");
      // Starting grammarScore = 88. With >2 short sentences, -4 penalty applies -> 84 (unless other grammar issues)
      assert.ok(res.grammarScore <= 84, `Expected grammarScore <= 84 due to short sentence penalty, got ${res.grammarScore}`);
    });
  });

  // --------------------------------------------------------------------------
  // 3. Filler Word Detection Across All Patterns & topFiller
  // --------------------------------------------------------------------------
  describe("3. Filler Word Detection Across All 9 Patterns", () => {
    const ALL_FILLER_TERMS = [
      "actually",
      "basically",
      "like",
      "you know",
      "sort of",
      "kind of",
      "literally",
      "um",
      "uh",
    ];

    it("should detect each individual filler pattern accurately with exact counts", () => {
      ALL_FILLER_TERMS.forEach((term) => {
        const text = `This is ${term} our system architecture and ${term} we deployed it.`;
        const res = analyzeSpokenLanguage(text, 60);

        assert.strictEqual(
          res.fillerBreakdown[term],
          2,
          `Filler '${term}' should be detected exactly twice`
        );
        assert.strictEqual(res.topFiller, term, `topFiller should be '${term}'`);
      });
    });

    it("should be case-insensitive for all filler words", () => {
      const text = "ACTUALLY, Basically, LiKe, You Know, Sort Of, Kind Of, Literally, UM, Uh.";
      const res = analyzeSpokenLanguage(text, 60);

      assert.strictEqual(res.fillerWordCount, 9, "Should detect all 9 uppercase/mixed-case fillers");
      assert.strictEqual(res.fillerBreakdown["actually"], 1);
      assert.strictEqual(res.fillerBreakdown["basically"], 1);
      assert.strictEqual(res.fillerBreakdown["like"], 1);
      assert.strictEqual(res.fillerBreakdown["you know"], 1);
      assert.strictEqual(res.fillerBreakdown["sort of"], 1);
      assert.strictEqual(res.fillerBreakdown["kind of"], 1);
      assert.strictEqual(res.fillerBreakdown["literally"], 1);
      assert.strictEqual(res.fillerBreakdown["um"], 1);
      assert.strictEqual(res.fillerBreakdown["uh"], 1);
    });

    it("should enforce regex word boundaries and avoid false positive substring matches", () => {
      const nonFillerText = "The umbrella was alike the sort of other things. The human was illiterate.";
      // 'umbrella' has 'um', 'alike' has 'like', 'illiterate' has 'literal'
      const res = analyzeSpokenLanguage(nonFillerText, 60);

      assert.strictEqual(res.fillerBreakdown["um"], undefined, "'umbrella' must not trigger 'um'");
      assert.strictEqual(res.fillerBreakdown["like"], undefined, "'alike' must not trigger 'like'");
      assert.strictEqual(res.fillerBreakdown["literally"], undefined, "'illiterate' must not trigger 'literally'");
      assert.strictEqual(res.fillerBreakdown["sort of"], 1, "'sort of' should be legitimately detected");
    });

    it("should set topFiller to the most frequently occurring filler word", () => {
      const text = "Um, well um, basically um, like like.";
      const res = analyzeSpokenLanguage(text, 60);

      assert.strictEqual(res.fillerBreakdown["um"], 3);
      assert.strictEqual(res.fillerBreakdown["like"], 2);
      assert.strictEqual(res.fillerBreakdown["basically"], 1);
      assert.strictEqual(res.topFiller, "um", "topFiller must be 'um' with count 3");
    });

    it("should set topFiller to null when zero filler words are present", () => {
      const cleanSpeech = "Our microservices architecture decoupled user ingestion from the notification pipeline.";
      const res = analyzeSpokenLanguage(cleanSpeech, 60);

      assert.strictEqual(res.fillerWordCount, 0, "Zero filler words expected");
      assert.strictEqual(res.topFiller, null, "topFiller must be null when no fillers are found");
      assert.deepStrictEqual(res.fillerBreakdown, {}, "fillerBreakdown should be empty");
    });
  });

  // --------------------------------------------------------------------------
  // 4. Grammar & Phrasing Issue Matching (COMMON_GRAMMAR_AND_PHRASING_FIXES)
  // --------------------------------------------------------------------------
  describe("4. Grammar & Phrasing Check (COMMON_GRAMMAR_AND_PHRASING_FIXES)", () => {
    it("should flag 'i am having' experience phrasing", () => {
      const text = "I am having 3 years experience in full stack web development.";
      const res = analyzeSpokenLanguage(text, 60);

      assert.ok(
        res.areasForImprovement.some((item) => item.includes("'I have' rather than the continuous form 'I am having'")),
        "Must flag 'I am having' experience error"
      );
    });

    it("should flag reflexive 'myself' for introductions", () => {
      const text = "Hello everyone, myself Adarsh from the engineering team.";
      const res = analyzeSpokenLanguage(text, 60);

      assert.ok(
        res.areasForImprovement.some((item) => item.includes("'Myself' is a reflexive pronoun")),
        "Must flag reflexive 'myself' error"
      );
    });

    it("should flag 'did not + past tense' auxiliary error", () => {
      const text = "In the sprint we did not went to the legacy deployment.";
      const res = analyzeSpokenLanguage(text, 60);

      assert.ok(
        res.areasForImprovement.some((item) => item.includes("always use the base form of the verb")),
        "Must flag 'did not went' error"
      );
    });

    it("should flag redundant 'revert back'", () => {
      const text = "I will check the logs and revert back to you by tomorrow.";
      const res = analyzeSpokenLanguage(text, 60);

      assert.ok(
        res.areasForImprovement.some((item) => item.includes("'Revert' already means to return to a previous state")),
        "Must flag 'revert back' error"
      );
    });

    it("should flag colloquial 'passed out from'", () => {
      const text = "I passed out from IIT Hyderabad in 2024.";
      const res = analyzeSpokenLanguage(text, 60);

      assert.ok(
        res.areasForImprovement.some((item) => item.includes("'graduated from' is standard international professional terminology")),
        "Must flag 'passed out from' error"
      );
    });

    it("should flag double comparative 'more better'", () => {
      const text = "The new Redis caching approach is more better for low latency.";
      const res = analyzeSpokenLanguage(text, 60);

      assert.ok(
        res.areasForImprovement.some((item) => item.includes("double comparatives should be avoided")),
        "Must flag 'more better' error"
      );
    });
  });

  // --------------------------------------------------------------------------
  // 5. STAR Technique Pattern Recognition
  // --------------------------------------------------------------------------
  describe("5. STAR Technique Pattern Recognition", () => {
    it("should reward STAR methodology keywords (situation, task, action, result, optimized, built, led)", () => {
      const starText = "In that situation, our team faced high latency. My task was to optimize the backend. I led the refactoring, built a queue worker, and reduced p99 latency by 45%.";
      const res = analyzeSpokenLanguage(starText, 60);

      // Verify STAR rewards:
      // clarityScore bonus (+6), professionalScore bonus (+6)
      assert.ok(
        res.strengths.some((s) => s.includes("Logical structure with clear problem framing and outcome")),
        "Must include STAR structure strength"
      );
      assert.ok(
        res.coachSuggestions.some((c) => c.includes("Your technical explanation is well-structured")),
        "Must praise structured technical explanation"
      );
      assert.ok(res.clarityScore >= 85, "clarityScore should be >= 85 with STAR structure");
      assert.ok(res.professionalScore >= 85, "professionalScore should be >= 85 with STAR structure");
    });

    it("should detect absence of STAR structure and provide coaching guidance", () => {
      const unstructuredText = "We just wrote some code and clicked deploy and it was working fine on the server.";
      const res = analyzeSpokenLanguage(unstructuredText, 60);

      assert.ok(
        res.areasForImprovement.some((a) => a.includes("Situation → Action → Result")),
        "Must suggest STAR framework in areasForImprovement"
      );
      assert.ok(
        res.coachSuggestions.some((c) => c.includes("Context → What I personally built → Metric outcome")),
        "Must suggest 3-step arc in coachSuggestions"
      );
    });
  });

  // --------------------------------------------------------------------------
  // 6. Composite Score Calculations & Bounding (0-100 Range)
  // --------------------------------------------------------------------------
  describe("6. Composite Scores Calculation & Bounding", () => {
    it("should enforce all individual score sub-bounds", () => {
      // Test an adversarial worst-case speech: heavy fillers, bad grammar, run-ons
      const horribleSpeech = "Um, uh, basically myself Adarsh like you know actually literally sort of kind of um uh we did not went revert back passed out from more better and this was so long that we just talked and talked and talked and talked and talked and talked and talked and talked and talked and talked and talked and talked and talked and talked.";
      const res = analyzeSpokenLanguage(horribleSpeech, 10);

      // Grammar bounds: [50, 98]
      assert.ok(res.grammarScore >= 50 && res.grammarScore <= 98, `grammarScore ${res.grammarScore} must be within [50, 98]`);
      // Clarity bounds: [50, 96]
      assert.ok(res.clarityScore >= 50 && res.clarityScore <= 96, `clarityScore ${res.clarityScore} must be within [50, 96]`);
      // Fluency bounds: [50, 96]
      assert.ok(res.fluencyScore >= 50 && res.fluencyScore <= 96, `fluencyScore ${res.fluencyScore} must be within [50, 96]`);
      // Vocabulary bounds: [55, 95]
      assert.ok(res.vocabularyScore >= 55 && res.vocabularyScore <= 95, `vocabularyScore ${res.vocabularyScore} must be within [55, 95]`);
      // Professional bounds: [55, 98]
      assert.ok(res.professionalScore >= 55 && res.professionalScore <= 98, `professionalScore ${res.professionalScore} must be within [55, 98]`);
      // Overall language score: [0, 100]
      assert.ok(res.overallLanguageScore >= 0 && res.overallLanguageScore <= 100, `overallLanguageScore ${res.overallLanguageScore} must be within [0, 100]`);
    });

    it("should accurately compute the weighted overallLanguageScore according to the mathematical formula", () => {
      const sampleText = "I architected an asynchronous indexing pipeline that decoupled queries and reduced search latency.";
      const res = analyzeSpokenLanguage(sampleText, 60, "Software Engineering");

      const expectedScore = Math.round(
        res.grammarScore * 0.25 +
        res.clarityScore * 0.25 +
        res.fluencyScore * 0.20 +
        res.vocabularyScore * 0.15 +
        res.professionalScore * 0.15
      );

      assert.strictEqual(
        res.overallLanguageScore,
        expectedScore,
        `overallLanguageScore (${res.overallLanguageScore}) must exactly match weighted calculation (${expectedScore})`
      );
    });

    it("should award role-specific vocabulary bonuses for technical keywords", () => {
      const vocabText = "We architected an asynchronous worker and decoupled the database by refactored indexing.";
      const plainText = "We made a worker and separated the database by changing indexing.";

      const resVocab = analyzeSpokenLanguage(vocabText, 60, "Software Engineering");
      const resPlain = analyzeSpokenLanguage(plainText, 60, "Software Engineering");

      assert.ok(
        resVocab.vocabularyScore > resPlain.vocabularyScore,
        `Vocab score with technical keywords (${resVocab.vocabularyScore}) should exceed plain text (${resPlain.vocabularyScore})`
      );
    });
  });

  // --------------------------------------------------------------------------
  // 7. Feedback and Coaching Output Generation
  // --------------------------------------------------------------------------
  describe("7. Feedback, Improved Version & Coaching Outputs", () => {
    it("should generate structured strengths and areasForImprovement", () => {
      const text = "Basically, we built a tool that optimized our build pipeline. It was good.";
      const res = analyzeSpokenLanguage(text, 60);

      assert.ok(Array.isArray(res.strengths), "strengths must be an array");
      assert.ok(res.strengths.length > 0, "strengths must have at least one entry");
      assert.ok(Array.isArray(res.areasForImprovement), "areasForImprovement must be an array");
      assert.ok(Array.isArray(res.coachSuggestions), "coachSuggestions must be an array");
    });

    it("should generate improvedVersion fixing conversational colloquialisms and fillers", () => {
      const text = "Basically I am having 4 years experience and passed out from college.";
      const res = analyzeSpokenLanguage(text, 60);

      assert.strictEqual(res.whatYouSaid, text, "whatYouSaid must preserve verbatim input");
      assert.ok(!res.improvedVersion.includes("I am having"), "improvedVersion must fix 'I am having'");
      assert.ok(res.improvedVersion.includes("I have"), "improvedVersion should use 'I have'");
      assert.ok(!res.improvedVersion.includes("passed out from"), "improvedVersion must fix 'passed out from'");
      assert.ok(res.improvedVersion.includes("graduated from"), "improvedVersion should use 'graduated from'");
      assert.ok(res.improvementRationale.length > 0, "improvementRationale must explain fixes");
    });

    it("should generate actionable dailyPracticePrompt with focusArea, task, and guidelines", () => {
      const text = "Um, like, we did something with databases.";
      const res = analyzeSpokenLanguage(text, 60);

      assert.ok(res.dailyPracticePrompt, "dailyPracticePrompt must exist");
      assert.strictEqual(typeof res.dailyPracticePrompt.focusArea, "string");
      assert.strictEqual(typeof res.dailyPracticePrompt.task, "string");
      assert.ok(Array.isArray(res.dailyPracticePrompt.guidelines));
      assert.strictEqual(res.dailyPracticePrompt.guidelines.length, 3);
    });
  });

  // --------------------------------------------------------------------------
  // 8. Attempt Comparison (compareAttempts / compareInterviewAttempts)
  // --------------------------------------------------------------------------
  describe("8. compareInterviewAttempts & Multi-Attempt Progress Tracking", () => {
    it("should accurately calculate positive deltas and filler reduction on improvement", () => {
      // Attempt 1: Poor delivery with high fillers
      const attempt1Text = "Um, basically we, like, sort of built this API, you know, actually.";
      const a1 = analyzeSpokenLanguage(attempt1Text, 60);

      // Attempt 2: Structured delivery with STAR and zero fillers
      const attempt2Text = "In our project situation, I led the architecture of the caching layer and built an asynchronous queue that reduced response latency by 35%.";
      const a2 = analyzeSpokenLanguage(attempt2Text, 60);

      const comparison = compareInterviewAttempts(a1, a2);

      // Verify Attempt 1 and 2 records
      assert.strictEqual(comparison.attempt1.fillerCount, a1.fillerWordCount);
      assert.strictEqual(comparison.attempt2.fillerCount, a2.fillerWordCount);
      assert.strictEqual(comparison.attempt1.languageScore, a1.overallLanguageScore);
      assert.strictEqual(comparison.attempt2.languageScore, a2.overallLanguageScore);

      // Verify Deltas
      assert.strictEqual(
        comparison.deltas.languageScoreDelta,
        a2.overallLanguageScore - a1.overallLanguageScore,
        "languageScoreDelta must equal a2 - a1"
      );
      assert.ok(comparison.deltas.languageScoreDelta > 0, "Language score delta should be positive on improvement");

      // Verify Filler reduction percentage
      assert.ok(
        comparison.deltas.fillerReductionPercent > 0,
        "Filler reduction percent should be positive when fillers decrease"
      );
      assert.strictEqual(
        comparison.deltas.structureVerdict,
        "Significantly improved answer structure and pacing",
        "Verdict should reflect improved structure when clarity delta > 5"
      );
      assert.ok(
        comparison.overallVerdict.includes("Great progress!"),
        "Overall verdict must convey positive encouragement"
      );
    });

    it("should accurately reflect regression when second attempt is rushed or filler-heavy", () => {
      const goodText = "I led the development of our service and built the search indexing system.";
      const a1 = analyzeSpokenLanguage(goodText, 60);

      const rushedText = "Um, uh, basically like you know actually um sort of kind of uh.";
      const a2 = analyzeSpokenLanguage(rushedText, 60);

      const comparison = compareAttempts(a1, a2);

      assert.ok(comparison.deltas.languageScoreDelta < 0, "Language score delta must be negative on regression");
      assert.ok(comparison.deltas.fillerReductionPercent < 0, "Filler reduction percent should be negative");
      assert.strictEqual(
        comparison.deltas.structureVerdict,
        "Slightly rushed delivery compared to first attempt",
        "Should flag rushed delivery when clarity score drops"
      );
      assert.ok(
        comparison.overallVerdict.includes("First attempt was more structured"),
        "Verdict should advise organizing points before speaking"
      );
    });

    it("should handle identical attempts with zero score deltas and steady structure verdict", () => {
      // Case A: Identical attempts with non-zero fillers (e.g. 2 fillers each)
      const textWithFillers = "Um, I built the database schema, um, and reduced query latencies.";
      const a1WithFillers = analyzeSpokenLanguage(textWithFillers, 60);
      const a2WithFillers = analyzeSpokenLanguage(textWithFillers, 60);

      const compWithFillers = compareAttempts(a1WithFillers, a2WithFillers);

      assert.strictEqual(compWithFillers.deltas.languageScoreDelta, 0, "languageScoreDelta must be 0");
      assert.strictEqual(compWithFillers.deltas.grammarScoreDelta, 0, "grammarScoreDelta must be 0");
      assert.strictEqual(compWithFillers.deltas.clarityScoreDelta, 0, "clarityScoreDelta must be 0");
      assert.strictEqual(compWithFillers.deltas.fillerReductionPercent, 0, "fillerReductionPercent must be 0 when non-zero fillers are unchanged");
      assert.strictEqual(compWithFillers.deltas.structureVerdict, "Maintained solid structure");

      // Case B: Identical attempts with zero fillers (f1 is clamped to Math.max(1, 0) = 1, f2 = 0 -> 100% per formula)
      const zeroFillerText = "I built the database schema and reduced query latencies.";
      const a1Zero = analyzeSpokenLanguage(zeroFillerText, 60);
      const a2Zero = analyzeSpokenLanguage(zeroFillerText, 60);

      const compZero = compareAttempts(a1Zero, a2Zero);
      assert.strictEqual(compZero.deltas.languageScoreDelta, 0);
      assert.strictEqual(compZero.deltas.fillerReductionPercent, 100, "With 0 fillers, f1 clamps to 1 while f2 is 0 giving 100% per implementation formula");
      assert.strictEqual(compZero.deltas.structureVerdict, "Maintained solid structure");
    });
  });

  // --------------------------------------------------------------------------
  // 9. syncUserCommunicationProfile Resiliency
  // --------------------------------------------------------------------------
  describe("9. syncUserCommunicationProfile Null Safety", () => {
    it("should return cleanly without errors when userId is empty", async () => {
      const analysis = analyzeSpokenLanguage("Hello world", 60);
      await assert.doesNotReject(
        async () => {
          await syncUserCommunicationProfile("", analysis);
        },
        "syncUserCommunicationProfile with empty userId must resolve cleanly"
      );
    });
  });
});
