import assert from "node:assert";

async function runTests() {
  console.log("Starting Admin Bulk Mail Authorization & Clearance Tests...\n");

  const baseUrl = "http://localhost:3000";

  // 1. Unauthenticated Request
  console.log("1. Testing Unauthenticated Request...");
  const anonGet = await fetch(`${baseUrl}/api/admin/bulk-mail`);
  assert.strictEqual(anonGet.status === 401 || anonGet.status === 403, true, "Unauthenticated GET must return 401 or 403");
  const anonPost = await fetch(`${baseUrl}/api/admin/bulk-mail`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ isTest: true, subject: "Anon", message: "Test" }),
  });
  assert.strictEqual(anonPost.status === 401 || anonPost.status === 403, true, "Unauthenticated POST must return 401 or 403");
  console.log("   ✓ Unauthenticated requests rejected as expected.");

  // 2. Regular Student Request (teststudent_live@university.edu)
  console.log("\n2. Testing Regular Student Request...");
  await fetch(`${baseUrl}/api/auth/otp/send`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: "teststudent_live@university.edu" }),
  });
  const studentVerify = await fetch(`${baseUrl}/api/auth/otp/verify`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: "teststudent_live@university.edu", code: "123456" }),
  }).then((r) => r.json());
  const studentToken = studentVerify.token;
  assert.ok(studentToken, "Student must receive a session token");

  const studentGet = await fetch(`${baseUrl}/api/admin/bulk-mail`, {
    headers: {
      Authorization: `Bearer ${studentToken}`,
      Cookie: `edworld_session=${studentToken}`,
    },
  });
  assert.strictEqual(studentGet.status, 403, "Student GET must return 403 Forbidden");

  const studentPost = await fetch(`${baseUrl}/api/admin/bulk-mail`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${studentToken}`,
      Cookie: `edworld_session=${studentToken}`,
    },
    body: JSON.stringify({ isTest: true, subject: "Attempt", message: "By Student" }),
  });
  assert.strictEqual(studentPost.status, 403, "Student POST must return 403 Forbidden");
  console.log("   ✓ Student requests strictly rejected with 403 Forbidden.");

  // 3. College Administrator Request (college@edworld.co.in)
  console.log("\n3. Testing College Administrator Request...");
  await fetch(`${baseUrl}/api/auth/otp/send`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: "college@edworld.co.in" }),
  });
  const collegeVerify = await fetch(`${baseUrl}/api/auth/otp/verify`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: "college@edworld.co.in", code: "123456" }),
  }).then((r) => r.json());
  const collegeToken = collegeVerify.token;
  assert.ok(collegeToken, "College Admin must receive a session token");

  const collegeGet = await fetch(`${baseUrl}/api/admin/bulk-mail`, {
    headers: {
      Authorization: `Bearer ${collegeToken}`,
      Cookie: `edworld_session=${collegeToken}`,
    },
  });
  assert.strictEqual(collegeGet.status, 403, "College Admin GET must return 403 Forbidden");

  const collegePost = await fetch(`${baseUrl}/api/admin/bulk-mail`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${collegeToken}`,
      Cookie: `edworld_session=${collegeToken}`,
    },
    body: JSON.stringify({ isTest: true, subject: "Attempt", message: "By College Admin" }),
  });
  assert.strictEqual(collegePost.status, 403, "College Admin POST must return 403 Forbidden");
  console.log("   ✓ College Admin requests strictly rejected with 403 Forbidden.");

  // 4. Authorized Platform Administrator (admin@edworld.co.in)
  console.log("\n4. Testing Authorized Platform Administrator...");
  await fetch(`${baseUrl}/api/auth/otp/send`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: "admin@edworld.co.in" }),
  });
  const adminVerify = await fetch(`${baseUrl}/api/auth/otp/verify`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: "admin@edworld.co.in", code: "123456" }),
  }).then((r) => r.json());
  const adminToken = adminVerify.token;
  assert.ok(adminToken, "Admin must receive session token");

  const adminGet = await fetch(`${baseUrl}/api/admin/bulk-mail`, {
    headers: {
      Authorization: `Bearer ${adminToken}`,
      Cookie: `edworld_session=${adminToken}`,
    },
  });
  assert.strictEqual(adminGet.status, 200, "Admin GET must return 200 OK");
  const adminGetData = await adminGet.json();
  assert.strictEqual(adminGetData.success, true);
  assert.ok(typeof adminGetData.counts.allStudents === "number");
  console.log(`   ✓ Admin GET passed: ${adminGetData.counts.allStudents} students available in audience.`);

  // Test send preview to approved admin test inbox
  const adminPost = await fetch(`${baseUrl}/api/admin/bulk-mail`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${adminToken}`,
      Cookie: `edworld_session=${adminToken}`,
    },
    body: JSON.stringify({
      isTest: true,
      subject: "Automated Suite Test Dispatch",
      headline: "Verification Run",
      message: "Testing admin dispatch clearance.",
      ctaLabel: "View Details",
      ctaUrl: "/dashboard",
    }),
  });
  assert.strictEqual(adminPost.status, 200, "Admin test POST must return 200 OK");
  const adminPostData = await adminPost.json();
  assert.strictEqual(adminPostData.success, true);
  assert.strictEqual(adminPostData.isTest, true);
  assert.strictEqual(adminPostData.deliveredCount, 1);
  console.log(`   ✓ Admin test POST passed: preview dispatched to test inbox (${adminPostData.notice}).`);

  // 5. Test Direct Admin User ID Session
  console.log("\n5. Testing Direct Admin User ID Session (resilience against raw cookie IDs)...");
  const adminUid = "usr_079e0b331a701d41";
  const directUidGet = await fetch(`${baseUrl}/api/admin/bulk-mail`, {
    headers: {
      Authorization: `Bearer ${adminUid}`,
      Cookie: `edworld_session=${adminUid}`,
    },
  });
  assert.strictEqual(directUidGet.status, 200, "Direct admin UID GET must return 200 OK");
  console.log("   ✓ Direct admin UID successfully authenticated via database role lookup.");

  console.log("\n=========================================");
  console.log("ALL ADMIN BULK MAIL AUTHORIZATION TESTS PASSED!");
  console.log("=========================================\n");
}

runTests().catch((err) => {
  console.error("Test failed:", err);
  process.exit(1);
});
