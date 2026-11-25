const fs = require('fs');
const path = require('path');
const { Pool } = require('pg');

let dbUrl = process.env.DATABASE_URL;
try {
  const envText = fs.readFileSync(path.join(__dirname, '..', '.env.local'), 'utf8');
  for (const line of envText.split('\n')) {
    const trimmed = line.trim();
    if (!dbUrl && trimmed.startsWith('DATABASE_URL=')) {
      dbUrl = trimmed.substring('DATABASE_URL='.length).trim().replace(/^["']|["']$/g, '');
    }
  }
} catch (error) {
  if (error.code !== 'ENOENT') throw error;
}

if (!dbUrl) {
  throw new Error('DATABASE_URL is required');
}

console.log('Pooler configured.');

const pool = new Pool({
  connectionString: dbUrl,
  ssl: { rejectUnauthorized: false }
});

async function main() {
  const client = await pool.connect();
  console.log('Connected to Postgres successfully!');
  
  const migrationPath = path.join(__dirname, '..', 'supabase', 'migrations', '20261016000000_career_paths_and_full_screen_dashboard.sql');
  const sql = fs.readFileSync(migrationPath, 'utf8');
  console.log('Loaded SQL file (' + sql.length + ' bytes). Executing...');
  
  await client.query(sql);
  console.log('Migration executed successfully!');
  
  const countPaths = await client.query('SELECT count(*) FROM public.career_paths;');
  console.log('Total career paths in DB:', countPaths.rows[0].count);
  
  const countMap = await client.query('SELECT count(*) FROM public.career_path_widget_map;');
  console.log('Total widget mappings in DB:', countMap.rows[0].count);
  
  const countUsers = await client.query('SELECT count(*) FROM public.user_career_paths;');
  console.log('Total user_career_paths seeded:', countUsers.rows[0].count);
  
  client.release();
  await pool.end();
  console.log('Done!');
}

main().catch(err => {
  console.error('Migration failed:', err);
  process.exit(1);
});
