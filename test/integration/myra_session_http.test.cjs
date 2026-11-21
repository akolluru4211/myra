const assert = require("node:assert/strict");
const { test } = require("node:test");

const base = process.env.MYRA_TEST_URL;
const json = { "Content-Type": "application/json" };

const checks = [
  ["memory read requires a session", "", { method: "GET" }, 401],
  ["memory reset requires a session", "", { method: "DELETE" }, 401],
  ["suggestion read requires a session", "/proactive-suggestion", { method: "GET" }, 401],
  ["suggestion update requires a session", "/proactive-suggestion", { method: "POST" }, 401],
  ["malformed chat body returns a client error", "", { method: "POST", headers: json, body: "{" }, 400],
  ["public onboarding greeting still works", "", { method: "POST", headers: json, body: JSON.stringify({ mode: "onboarding", message: "start" }) }, 200],
];

for (const [name, suffix, options, expected] of checks) {
  test(name, { skip: !base && "Set MYRA_TEST_URL to a running test server." }, async () => {
    const response = await fetch(new URL("/api/ai/myra" + suffix, base), {
      ...options,
      redirect: "manual",
      signal: AbortSignal.timeout(45000),
    });
    assert.equal(response.status, expected);
    const data = await response.json();
    if (expected === 200) assert.equal(data.stage, 1);
    else assert.equal(typeof data.error, "string");
  });
}
