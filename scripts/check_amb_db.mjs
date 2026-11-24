import { queryDb } from "../src/lib/db-server.ts";

async function main() {
  const ambCols = await queryDb(`
    SELECT column_name, data_type 
    FROM information_schema.columns 
    WHERE table_name = 'ambassador_applications'
    ORDER BY ordinal_position;
  `);
  console.log("ambassador_applications columns:", ambCols.rows);

  const ambTableCols = await queryDb(`
    SELECT column_name, data_type 
    FROM information_schema.columns 
    WHERE table_name = 'ambassadors'
    ORDER BY ordinal_position;
  `);
  console.log("ambassadors columns:", ambTableCols.rows);

  process.exit(0);
}

main().catch(e => {
  console.error(e);
  process.exit(1);
});
