import { queryDb } from "../src/lib/db-server.ts";

async function main() {
  const users = await queryDb("SELECT id, name, email FROM public.users LIMIT 5");
  console.log("Existing users:", users.rows);
  process.exit(0);
}

main().catch(e => {
  console.error(e);
  process.exit(1);
});
