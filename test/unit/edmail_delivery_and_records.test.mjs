import test from "node:test";
import assert from "node:assert/strict";

const BASE_URL = "http://localhost:3000";
const STUDENT_A_COOKIE = "edworld_session=usr_8c9f5e133bea2b4a162a0749"; // priya.student
const STUDENT_B_COOKIE = "edworld_session=usr_df343677944e70d59505580d"; // alex.mwu5fui6

test("EdMail Inbound Webhook delivers email with marksheet and event invitation", async () => {
  const eventId = "evt_suite_test_" + Date.now();
  const res = await fetch(`${BASE_URL}/api/edmail/inbound-webhook`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      eventId,
      from: "registrar@university.edu",
      to: "priya.student@edworld.co.in",
      subject: "Semester 5 Results & Tech Fest Invitation",
      text: "Congratulations Priya, your semester 5 results and Tech Fest invitation are attached.",
      attachments: [
        {
          filename: "sem5_marksheet.pdf",
          mimeType: "application/pdf",
          size: 54321,
          content: Buffer.from("%PDF-1.4 sample content").toString("base64")
        }
      ]
    })
  });

  assert.equal(res.status, 200);
  const data = await res.json();
  assert.equal(data.success, true);
  assert.equal(data.targetAddress, "priya.student@edworld.co.in");
  assert.ok(data.messageId);

  // Test deduplication on replay of same eventId
  const dupRes = await fetch(`${BASE_URL}/api/edmail/inbound-webhook`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      eventId,
      from: "registrar@university.edu",
      to: "priya.student@edworld.co.in",
      subject: "Semester 5 Results & Tech Fest Invitation"
    })
  });

  assert.equal(dupRes.status, 200);
  const dupData = await dupRes.json();
  assert.equal(dupData.success, true);
  assert.match(dupData.notice, /idempotent/i);
});

test("EdMail Outbound Send delivers via sandbox and enforces idempotency", async () => {
  const idempotencyKey = "idem_suite_send_" + Date.now();
  const sendRes = await fetch(`${BASE_URL}/api/edmail/send`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Cookie": STUDENT_A_COOKIE
    },
    body: JSON.stringify({
      to: ["delivered@resend.dev"],
      subject: "Thank You for Results",
      bodyText: "I have received my results safely.",
      idempotencyKey
    })
  });

  assert.equal(sendRes.status, 200);
  const sendData = await sendRes.json();
  assert.equal(sendData.success, true);
  assert.equal(sendData.deliveryStatus, "accepted");
  assert.ok(sendData.messageId);

  // Immediate double-click retry with same idempotencyKey returns cached response
  const retryRes = await fetch(`${BASE_URL}/api/edmail/send`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Cookie": STUDENT_A_COOKIE
    },
    body: JSON.stringify({
      to: ["delivered@resend.dev"],
      subject: "Thank You for Results",
      bodyText: "I have received my results safely.",
      idempotencyKey
    })
  });

  assert.equal(retryRes.status, 200);
  const retryData = await retryRes.json();
  assert.equal(retryData.success, true);
  assert.equal(retryData.messageId, sendData.messageId);
  assert.match(retryData.notice, /idempotent/i);
});

test("EdMail preserves draft on validation error", async () => {
  // Create draft
  const draftRes = await fetch(`${BASE_URL}/api/edmail/drafts`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Cookie": STUDENT_A_COOKIE
    },
    body: JSON.stringify({
      to: ["professor@university.edu"],
      subject: "Research Project Inquiry",
      bodyText: "Dear Professor, I would like to join your research lab."
    })
  });

  assert.equal(draftRes.status, 200);
  const draftData = await draftRes.json();
  const draftId = draftData.draft?.id || draftData.draftId;
  assert.ok(draftId);

  // Send with invalid empty recipients
  const failSend = await fetch(`${BASE_URL}/api/edmail/send`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Cookie": STUDENT_A_COOKIE
    },
    body: JSON.stringify({
      draftId,
      to: [],
      subject: "Research Project Inquiry"
    })
  });

  assert.equal(failSend.status, 400);

  // Verify draft remains in Drafts folder
  const checkDraft = await fetch(`${BASE_URL}/api/edmail/messages?folder=drafts`, {
    headers: { "Cookie": STUDENT_A_COOKIE }
  });
  const checkData = await checkDraft.json();
  const exists = checkData.messages?.some((m) => m.id === draftId);
  assert.equal(exists, true);
});

test("Student Record: Save to Marks and Add to Calendar prevent duplicate entries", async () => {
  const sourceMessageId = "evt_source_msg_" + Date.now();

  // Save mark
  const mark1 = await fetch(`${BASE_URL}/api/edmail/records/marks`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Cookie": STUDENT_A_COOKIE
    },
    body: JSON.stringify({
      subject: "Operating Systems",
      score: 95,
      maxMarks: 100,
      sourceMessageId
    })
  });
  assert.equal(mark1.status, 200);
  const markData1 = await mark1.json();
  assert.equal(markData1.success, true);

  // Duplicate mark save
  const mark2 = await fetch(`${BASE_URL}/api/edmail/records/marks`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Cookie": STUDENT_A_COOKIE
    },
    body: JSON.stringify({
      subject: "Operating Systems",
      score: 95,
      maxMarks: 100,
      sourceMessageId
    })
  });
  assert.equal(mark2.status, 200);
  const markData2 = await mark2.json();
  assert.equal(markData2.success, true);
  assert.match(markData2.notice, /already saved/i);

  // Add event
  const event1 = await fetch(`${BASE_URL}/api/edmail/records/events`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Cookie": STUDENT_A_COOKIE
    },
    body: JSON.stringify({
      title: "Placement Preparation Workshop",
      eventType: "workshop",
      startTime: "2026-05-10T10:00:00Z",
      sourceMessageId
    })
  });
  assert.equal(event1.status, 200);
  const eventData1 = await event1.json();
  assert.equal(eventData1.success, true);

  // Duplicate event save
  const event2 = await fetch(`${BASE_URL}/api/edmail/records/events`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Cookie": STUDENT_A_COOKIE
    },
    body: JSON.stringify({
      title: "Placement Preparation Workshop",
      startTime: "2026-05-10T10:00:00Z",
      sourceMessageId
    })
  });
  assert.equal(event2.status, 200);
  const eventData2 = await event2.json();
  assert.equal(eventData2.success, true);
  assert.match(eventData2.notice, /already added/i);
});

test("Multi-tenant Isolation: Student B cannot read Student A messages or access Student A records", async () => {
  // Student A message list
  const listA = await (await fetch(`${BASE_URL}/api/edmail/messages`, { headers: { "Cookie": STUDENT_A_COOKIE } })).json();
  assert.ok(listA.messages?.length > 0);
  const studentAMessageId = listA.messages[0].id;

  // Student B tries to fetch Student A message
  const bReadA = await fetch(`${BASE_URL}/api/edmail/messages/${studentAMessageId}`, {
    headers: { "Cookie": STUDENT_B_COOKIE }
  });
  assert.equal(bReadA.status, 404);

  // Student B tries to spoof Student A address
  const bSend = await fetch(`${BASE_URL}/api/edmail/send`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Cookie": STUDENT_B_COOKIE
    },
    body: JSON.stringify({
      to: ["delivered@resend.dev"],
      fromAddress: "priya.student@edworld.co.in",
      subject: "Spoof check",
      bodyText: "Attempt"
    })
  });
  assert.equal(bSend.status, 200);

  // Check that the saved message in Student B's sent box owns Student B's address
  const bSent = await (await fetch(`${BASE_URL}/api/edmail/messages?folder=sent`, { headers: { "Cookie": STUDENT_B_COOKIE } })).json();
  assert.equal(bSent.messages[0].from_address, "alex.mwu5fui6@edworld.co.in");
});
