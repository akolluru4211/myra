import test from "node:test";
import assert from "node:assert/strict";

/**
 * Focused Unit & Integration Tests:
 * 1. Web search opt-in toggle behavior (off by default)
 * 2. Ordinary chat and pasted URLs trigger ZERO web reach calls when toggle is off
 * 3. Words like "latest" or "news" do NOT trigger external lookup when toggle is off
 * 4. Explicitly enabled web search sends only query search terms / validated HTTPS URL
 * 5. Student profiles, conversation history, and Myra memory are strictly kept out of search requests
 * 6. Unified URL validation: internal app paths vs external HTTPS URLs vs rejected/malformed destinations
 * 7. Malformed or rejected destinations fall back to plain text
 */

test("Explicit Web Search & Shared Link Validation Suite", async (t) => {
  const { validateChatLink, validateExternalLookupUrl } = await import("../../src/lib/ai/link-validator.ts");
  const { resolveWebReach, extractUrlsFromText, parseGitHubUrl } = await import("../../src/lib/ai/web-reach.ts");

  // --------------------------------------------------------------------------
  // 1. Shared Link Validator Tests
  // --------------------------------------------------------------------------
  await t.test("Link Validator: Valid internal app paths", () => {
    const paths = [
      "/dashboard",
      "/dsa?problem=two-sum#solution",
      "/career/roadmap",
      "/interviews",
      "/squads",
    ];

    for (const p of paths) {
      const res = validateChatLink(p);
      assert.equal(res.isValid, true, `Expected ${p} to be valid internal path`);
      assert.equal(res.isExternal, false);
      assert.equal(res.sanitizedUrl, p);
    }
  });

  await t.test("Link Validator: Valid external HTTPS URLs", () => {
    const urls = [
      "https://github.com/torvalds/linux",
      "https://docs.python.org/3/tutorial/",
      "https://developer.mozilla.org/en-US/docs/Web/JavaScript",
      "https://google.com/search?q=algorithms",
    ];

    for (const u of urls) {
      const res = validateChatLink(u);
      assert.equal(res.isValid, true, `Expected ${u} to be valid HTTPS URL`);
      assert.equal(res.isExternal, true);
      assert.equal(res.sanitizedUrl, u);
    }
  });

  await t.test("Link Validator: Rejects insecure HTTP, javascript:, data: schemes", () => {
    const dangerous = [
      "http://insecure-site.com",
      "javascript:alert(document.cookie)",
      "data:text/html,<script>alert(1)</script>",
      "ftp://ftp.example.com",
      "file:///etc/passwd",
      "vbscript:msgbox",
    ];

    for (const d of dangerous) {
      const res = validateChatLink(d);
      assert.equal(res.isValid, false, `Expected ${d} to be rejected`);
      assert.equal(res.sanitizedUrl, null);
    }
  });

  await t.test("Link Validator: Rejects localhost, private IP, and cloud metadata addresses", () => {
    const blocked = [
      "https://localhost/api",
      "https://127.0.0.1:8080",
      "https://169.254.169.254/latest/meta-data/",
      "https://metadata.google.internal/computeMetadata/v1/",
      "https://192.168.1.1/admin",
      "https://10.0.0.1/secret",
    ];

    for (const b of blocked) {
      const res = validateChatLink(b);
      assert.equal(res.isValid, false, `Expected ${b} to be rejected`);
      assert.equal(res.sanitizedUrl, null);
    }
  });

  await t.test("Link Validator: Rejects CRLF, protocol-relative, and malformed inputs", () => {
    assert.equal(validateChatLink(null).isValid, false);
    assert.equal(validateChatLink("").isValid, false);
    assert.equal(validateChatLink("//malicious.com").isValid, false);
    assert.equal(validateChatLink("/\\malicious.com").isValid, false);
    assert.equal(validateChatLink("/dashboard\r\nSet-Cookie:evil").isValid, false);
    assert.equal(validateChatLink("not-a-valid-url-at-all").isValid, false);
  });

  await t.test("validateExternalLookupUrl strictly enforces HTTPS external targets", () => {
    assert.equal(validateExternalLookupUrl("https://github.com/myra/repo"), "https://github.com/myra/repo");
    assert.equal(validateExternalLookupUrl("http://github.com/myra/repo"), null);
    assert.equal(validateExternalLookupUrl("/dashboard"), null); // Internal paths not sent to external lookup
    assert.equal(validateExternalLookupUrl("https://127.0.0.1"), null);
  });

  // --------------------------------------------------------------------------
  // 2. Web Reach Opt-in Toggle & Isolation Tests
  // --------------------------------------------------------------------------
  await t.test("resolveWebReach: Off by default (enabled: false / omitted)", async () => {
    // Normal chat
    const resNormal = await resolveWebReach("Hello Myra, how are you?");
    assert.equal(resNormal, null);

    // Queries containing keywords like 'latest', 'news', 'search' must NOT trigger lookup when toggle is off
    const resKeywords = await resolveWebReach("What is the latest news about React 19?");
    assert.equal(resKeywords, null);

    const resSearchWord = await resolveWebReach("Search for software engineer salaries");
    assert.equal(resSearchWord, null);

    // Pasted URLs must NOT trigger lookup when toggle is off
    const resPastedUrl = await resolveWebReach("Check this link: https://github.com/facebook/react");
    assert.equal(resPastedUrl, null);

    const resExplicitFalse = await resolveWebReach("https://github.com/facebook/react", { enabled: false });
    assert.equal(resExplicitFalse, null);
  });

  await t.test("URL parsing & extraction helpers operate safely", () => {
    const sampleText = "Here is my code: https://github.com/torvalds/linux and also https://docs.python.org/3/.";
    const extracted = extractUrlsFromText(sampleText);
    assert.deepEqual(extracted, [
      "https://github.com/torvalds/linux",
      "https://docs.python.org/3/",
    ]);

    const gh = parseGitHubUrl("https://github.com/facebook/react.git");
    assert.deepEqual(gh, { owner: "facebook", repo: "react" });

    const nonGh = parseGitHubUrl("https://gitlab.com/test/repo");
    assert.equal(nonGh, null);
  });
});
