const { Client } = require('pg');
const fs = require('fs');

let connStr = process.env.DATABASE_URL;
try {
  const envContent = fs.readFileSync('.env.local', 'utf8');
  for (const line of envContent.split('\n')) {
    if (!connStr && line.startsWith('DATABASE_URL=')) {
      connStr = line.slice('DATABASE_URL='.length).trim().replace(/^["']|["']$/g, '');
    }
  }
} catch (error) {
  if (error.code !== 'ENOENT') throw error;
}

if (!connStr) throw new Error('DATABASE_URL is required');

async function main() {
  const client = new Client({ connectionString: connStr, ssl: { rejectUnauthorized: false } });
  await client.connect();
  console.log("Connected to Supabase PostgreSQL.");
  
  await client.query("ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS cgpa text;");
  console.log("Successfully ensured 'cgpa' column exists on public.profiles.");

  const res = await client.query("SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'cgpa'");
  console.log("Verified column:", res.rows);

  await client.end();
}

main().catch(err => {
  console.error("Migration error:", err);
  process.exit(1);
});
