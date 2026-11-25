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
  const res = await client.query("SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'profiles' ORDER BY column_name");
  console.log(res.rows.map(r => `${r.column_name}: ${r.data_type}`));
  await client.end();
}

main().catch(console.error);
