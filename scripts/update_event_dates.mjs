import { queryDb } from "../src/lib/db-server.ts";

async function main() {
  await queryDb("UPDATE public.events SET registration_deadline = NOW() + INTERVAL '7 days' WHERE id = '10000000-0000-0000-0000-000000000001'");
  await queryDb("UPDATE public.events SET registration_deadline = NOW() + INTERVAL '12 days' WHERE id = '10000000-0000-0000-0000-000000000002'");
  await queryDb("UPDATE public.events SET registration_deadline = NOW() + INTERVAL '15 days' WHERE id = '10000000-0000-0000-0000-000000000006'");
  await queryDb("UPDATE public.events SET registration_deadline = NOW() + INTERVAL '20 days' WHERE id = '10000000-0000-0000-0000-000000000005'");
  const res = await queryDb("SELECT id, title, registration_deadline FROM public.events ORDER BY display_order ASC");
  console.log(res.rows);
  process.exit(0);
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
