import { describe, it } from "node:test";
import assert from "node:assert/strict";
import http from "node:http";

function postJson(url, data, headers = {}) {
  return new Promise((resolve, reject) => {
    const u = new URL(url);
    const req = http.request({
      hostname: u.hostname,
      port: u.port,
      path: u.pathname + u.search,
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...headers,
      },
    }, (res) => {
      let body = "";
      res.on("data", (c) => (body += c));
      res.on("end", () => {
        try {
          resolve({ status: res.statusCode, headers: res.headers, data: JSON.parse(body) });
        } catch {
          resolve({ status: res.statusCode, headers: res.headers, raw: body });
        }
      });
    });
    req.on("error", reject);
    req.write(JSON.stringify(data));
    req.end();
  });
}

function getJson(url, headers = {}) {
  return new Promise((resolve, reject) => {
    const u = new URL(url);
    const req = http.request({
      hostname: u.hostname,
      port: u.port,
      path: u.pathname + u.search,
      method: "GET",
      headers: {
        ...headers,
      },
    }, (res) => {
      let body = "";
      res.on("data", (c) => (body += c));
      res.on("end", () => {
        try {
          resolve({ status: res.statusCode, headers: res.headers, data: JSON.parse(body) });
        } catch {
          resolve({ status: res.statusCode, headers: res.headers, raw: body });
        }
      });
    });
    req.on("error", reject);
    req.end();
  });
}

describe("EdMail Activation & Session Authentication Verification", () => {
  const BASE_URL = "http://localhost:3000";

  it("1. Rejects unauthenticated activation request with 401 and does not authorize mailbox creation", async () => {
    const res = await postJson(`${BASE_URL}/api/edmail/mailbox`, {
      username: "unauth.test",
      guardianConsent: true,
    });
    assert.equal(res.status, 401);
  });

  it("2. Availability check succeeds for valid handle but NEVER creates a mailbox on its own", async () => {
    const testHandle = `checkonly.${Date.now()}`;
    const checkRes = await getJson(`${BASE_URL}/api/edmail/check-username?username=${testHandle}`);
    assert.equal(checkRes.status, 200);
    assert.equal(checkRes.data.available, true);
    assert.equal(checkRes.data.normalized, testHandle);

    // Unauthenticated GET /api/edmail/mailbox must still be 401
    const boxRes = await getJson(`${BASE_URL}/api/edmail/mailbox`);
    assert.equal(boxRes.status, 401);
  });

  it("3. End-to-end: OTP signed-in student can activate an available address and state is confirmed 'ready'", async () => {
    const uniqueEmail = `student_${Date.now()}@university.edu`;
    const sendRes = await postJson(`${BASE_URL}/api/auth/otp/send`, {
      identifier: uniqueEmail,
      purpose: "login",
    });
    assert.equal(sendRes.status, 200);
    const devOtp = sendRes.data.devOtp;
    assert.ok(devOtp, "devOtp should be present in local/dev test environment");

    const verifyRes = await postJson(`${BASE_URL}/api/auth/otp/verify`, {
      identifier: uniqueEmail,
      code: devOtp,
      purpose: "login",
    });
    assert.equal(verifyRes.status, 200);
    const sessionCookie = verifyRes.headers["set-cookie"]
      ?.map((c) => c.split(";")[0])
      ?.join("; ");
    assert.ok(sessionCookie, "Session cookie must be returned upon OTP verification");

    // 3a. Initial mailbox status should be unregistered (exists: false)
    const initialBox = await getJson(`${BASE_URL}/api/edmail/mailbox`, { Cookie: sessionCookie });
    assert.equal(initialBox.status, 200);
    assert.equal(initialBox.data.exists, false);

    // 3b. Activate available address
    const uniqueHandle = `alex.${Date.now().toString(36)}`;
    const activateRes = await postJson(
      `${BASE_URL}/api/edmail/mailbox`,
      { username: uniqueHandle, guardianConsent: true },
      { Cookie: sessionCookie }
    );
    assert.equal(activateRes.status, 200);
    assert.equal(activateRes.data.success, true);
    assert.equal(activateRes.data.mailbox.status, "ready");
    assert.equal(activateRes.data.mailbox.username, uniqueHandle);
    assert.equal(activateRes.data.mailbox.address, `${uniqueHandle}@edworld.co.in`);

    // 3c. Subsequent GET /api/edmail/mailbox (e.g. page reload) preserves confirmed mailbox state
    const reloadBox = await getJson(`${BASE_URL}/api/edmail/mailbox`, { Cookie: sessionCookie });
    assert.equal(reloadBox.status, 200);
    assert.equal(reloadBox.data.exists, true);
    assert.equal(reloadBox.data.mailbox.username, uniqueHandle);
    assert.equal(reloadBox.data.mailbox.status, "ready");

    // 3d. Retrying / repeat submission by the same student is idempotent (updates/returns existing mailbox without duplicate error)
    const repeatRes = await postJson(
      `${BASE_URL}/api/edmail/mailbox`,
      { username: uniqueHandle, guardianConsent: true },
      { Cookie: sessionCookie }
    );
    assert.equal(repeatRes.status, 200);
    assert.equal(repeatRes.data.success, true);
    assert.equal(repeatRes.data.mailbox.id, activateRes.data.mailbox.id);
  });

  it("4. Rejects activation if username is claimed by another student between availability check and submission", async () => {
    // Student 1 signs in and claims username
    const email1 = `student1_${Date.now()}@university.edu`;
    const send1 = await postJson(`${BASE_URL}/api/auth/otp/send`, { identifier: email1, purpose: "login" });
    const verify1 = await postJson(`${BASE_URL}/api/auth/otp/verify`, { identifier: email1, code: send1.data.devOtp, purpose: "login" });
    const cookie1 = verify1.headers["set-cookie"]?.map((c) => c.split(";")[0])?.join("; ");

    const claimHandle = `contested.${Date.now().toString(36)}`;
    const claimRes = await postJson(
      `${BASE_URL}/api/edmail/mailbox`,
      { username: claimHandle, guardianConsent: true },
      { Cookie: cookie1 }
    );
    assert.equal(claimRes.status, 200);

    // Student 2 signs in and tries to activate the same username
    const email2 = `student2_${Date.now()}@university.edu`;
    const send2 = await postJson(`${BASE_URL}/api/auth/otp/send`, { identifier: email2, purpose: "login" });
    const verify2 = await postJson(`${BASE_URL}/api/auth/otp/verify`, { identifier: email2, code: send2.data.devOtp, purpose: "login" });
    const cookie2 = verify2.headers["set-cookie"]?.map((c) => c.split(";")[0])?.join("; ");

    const conflictRes = await postJson(
      `${BASE_URL}/api/edmail/mailbox`,
      { username: claimHandle, guardianConsent: true },
      { Cookie: cookie2 }
    );
    assert.equal(conflictRes.status, 409);
    assert.match(conflictRes.data.error, /already claimed|not available/i);
  });

  it("5. Authorization header (Bearer token) successfully authenticates activation API", async () => {
    const email = `bearer_${Date.now()}@university.edu`;
    const sendRes = await postJson(`${BASE_URL}/api/auth/otp/send`, { identifier: email, purpose: "login" });
    const verifyRes = await postJson(`${BASE_URL}/api/auth/otp/verify`, { identifier: email, code: sendRes.data.devOtp, purpose: "login" });
    const token = verifyRes.data.token;
    assert.ok(token);

    const bearerHandle = `bearer.${Date.now().toString(36)}`;
    const activateRes = await postJson(
      `${BASE_URL}/api/edmail/mailbox`,
      { username: bearerHandle, guardianConsent: true },
      { Authorization: `Bearer ${token}` }
    );
    assert.equal(activateRes.status, 200);
    assert.equal(activateRes.data.success, true);
    assert.equal(activateRes.data.mailbox.username, bearerHandle);
  });
});
