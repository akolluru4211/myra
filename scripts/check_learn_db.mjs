import { queryDb } from "../src/lib/db-server.ts";

async function main() {
  const tables = await queryDb(`
    SELECT table_name 
    FROM information_schema.tables 
    WHERE table_schema = 'public' 
    ORDER BY table_name
  `);
  console.log("Database tables:", tables.rows.map(r => r.table_name));

  const courses = await queryDb(`
    SELECT to_regclass('public.courses') as courses_table,
           to_regclass('public.certificates') as certs_table,
           to_regclass('public.student_certificates') as student_certs_table
  `);
  console.log("Key tables check:", courses.rows);
  process.exit(0);
}

main().catch(e => {
  console.error(e);
  process.exit(1);
});
