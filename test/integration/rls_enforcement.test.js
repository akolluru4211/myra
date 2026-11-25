const assert = require("node:assert/strict");
const { randomUUID } = require("node:crypto");
const { Client } = require("pg");
const { requireTestDatabaseUrl } = require("../../scripts/database-url");

async function setAuthenticatedUser(client, userId) {
  await client.query(
    "SELECT set_config('request.jwt.claim.sub', $1, true), set_config('request.jwt.claims', $2, true)",
    [userId, JSON.stringify({ sub: userId, role: "authenticated" })]
  );
}

async function runRlsEnforcementSuite() {
  const client = new Client({ connectionString: requireTestDatabaseUrl() });
  await client.connect();

  try {
    await client.query("BEGIN");
    const expectedTables = ["profiles", "job_applications", "resumes", "audit_logs", "jobs"];
    const rlsStatus = await client.query(
      "SELECT tablename, rowsecurity FROM pg_tables WHERE schemaname = 'public' AND tablename = ANY($1::text[])",
      [expectedTables]
    );
    const enabledTables = new Set(rlsStatus.rows.filter((row) => row.rowsecurity).map((row) => row.tablename));
    for (const table of expectedTables) {
      assert.ok(enabledTables.has(table), "RLS must be enabled for " + table);
    }

    const applicant = randomUUID();
    const unrelatedUser = randomUUID();
    const employer = randomUUID();
    const fixtureName = "RLS Fixture " + randomUUID();
    await client.query(
      "INSERT INTO auth.users (id, email, raw_user_meta_data) " +
      "SELECT id, 'rls-fixture-' || id::text || '@example.invalid', jsonb_build_object('full_name', $2::text || ' ' || id::text) " +
      "FROM unnest($1::uuid[]) AS users(id)",
      [[applicant, unrelatedUser, employer], fixtureName]
    );
    const job = await client.query(
      "INSERT INTO public.jobs (posted_by, title, company, location, type, description, application_deadline, is_active, moderation_status) " +
      "VALUES ($1, 'RLS fixture job', 'Example', 'Remote', 'full_time', 'Temporary CI fixture', now() + interval '1 day', true, 'approved') " +
      "RETURNING id",
      [employer]
    );
    const application = await client.query(
      "INSERT INTO public.job_applications (job_id, user_id, resume_snapshot, cover_note) " +
      "VALUES ($1, $2, '{}'::jsonb, 'Private fixture note') RETURNING id",
      [job.rows[0].id, applicant]
    );
    const id = application.rows[0].id;

    await client.query("SET LOCAL ROLE authenticated");
    await setAuthenticatedUser(client, applicant);
    const learnerProfile = await client.query(
      "UPDATE public.profiles SET role = 'STUDENT' WHERE id = $1 RETURNING role",
      [applicant]
    );
    assert.equal(learnerProfile.rows[0]?.role, "STUDENT", "Learners must retain ordinary profile updates");

    await client.query("SAVEPOINT authorization_fields");
    await assert.rejects(
      client.query("UPDATE public.profiles SET is_admin = true WHERE id = $1", [applicant]),
      { code: "42501" },
      "Authenticated clients must not change server-managed authorization fields"
    );
    await client.query("ROLLBACK TO SAVEPOINT authorization_fields");

    const owner = await client.query("SELECT id FROM public.job_applications WHERE id = $1", [id]);
    assert.equal(owner.rowCount, 1, "The applicant must see their own application");

    await setAuthenticatedUser(client, unrelatedUser);
    const otherReader = await client.query("SELECT id FROM public.job_applications WHERE id = $1", [id]);
    assert.equal(otherReader.rowCount, 0, "An unrelated authenticated user must see no application");
    const otherWriter = await client.query(
      "UPDATE public.job_applications SET cover_note = 'Unexpected update' WHERE id = $1 RETURNING id",
      [id]
    );
    assert.equal(otherWriter.rowCount, 0, "An unrelated authenticated user must not update the application");

    await setAuthenticatedUser(client, employer);
    const employerReader = await client.query("SELECT id FROM public.job_applications WHERE id = $1", [id]);
    assert.equal(employerReader.rowCount, 1, "The posting employer must see applications for their own job");

    console.log("RLS is enabled on the expected tables and application access is correctly scoped.");
  } finally {
    try {
      await client.query("ROLLBACK");
    } finally {
      await client.end();
    }
  }
}

if (require.main === module) {
  runRlsEnforcementSuite().catch((error) => {
    console.error("RLS Enforcement Suite Failed:", error.message);
    process.exitCode = 1;
  });
}
