import fs from 'fs';
import path from 'path';
import assert from 'assert';

console.log('=== Relational ER Diagram Verification Suite ===\n');

// 1. Verify Migration File Exists
const migrationPath = path.resolve('supabase/migrations/20261109000000_er_diagram_canonical_schema.sql');
assert(fs.existsSync(migrationPath), `Migration file not found at ${migrationPath}`);
console.log('✓ Migration file exists: 20261109000000_er_diagram_canonical_schema.sql');

const sqlContent = fs.readFileSync(migrationPath, 'utf8');

// 2. Verify all 24 Canonical Entities defined in DDL
const canonicalEntities = [
  'colleges',
  'users',
  'skills',
  'user_skills',
  'problems',
  'test_cases',
  'submissions',
  'aptitude_tests',
  'aptitude_attempts',
  'daily_challenges',
  'challenge_completions',
  'user_stats',
  'xp_events',
  'badges',
  'user_badges',
  'squads',
  'squad_members',
  'projects',
  'project_members',
  'project_applications',
  'project_tasks',
  'interview_sessions',
  'interview_feedback',
  'notifications'
];

console.log('\n--- Checking 24 Canonical Entities in DDL ---');
for (const entity of canonicalEntities) {
  const tableRegex = new RegExp(`(CREATE TABLE IF NOT EXISTS public\\.${entity}|information_schema\\.tables[\\s\\S]*?table_name = '${entity}')`, 'i');
  assert(tableRegex.test(sqlContent), `Entity ${entity} is missing from canonical migration!`);
  console.log(`✓ Entity confirmed: public.${entity}`);
}

// 3. Verify all 23 Relational Foreign Keys
const expectedRelationships = [
  { from: 'users', fk: 'college_id', to: 'colleges', cascade: 'SET NULL' },
  { from: 'user_skills', fk: 'user_id', to: 'users', cascade: 'CASCADE' },
  { from: 'user_skills', fk: 'skill_id', to: 'skills', cascade: 'CASCADE' },
  { from: 'submissions', fk: 'user_id', to: 'users', cascade: 'CASCADE' },
  { from: 'submissions', fk: 'problem_id', to: 'problems', cascade: 'CASCADE' },
  { from: 'test_cases', fk: 'problem_id', to: 'problems', cascade: 'CASCADE' },
  { from: 'aptitude_attempts', fk: 'user_id', to: 'users', cascade: 'CASCADE' },
  { from: 'aptitude_attempts', fk: 'test_id', to: 'aptitude_tests', cascade: 'CASCADE' },
  { from: 'challenge_completions', fk: 'challenge_id', to: 'daily_challenges', cascade: 'CASCADE' },
  { from: 'challenge_completions', fk: 'user_id', to: 'users', cascade: 'CASCADE' },
  { from: 'user_stats', fk: 'user_id', to: 'users', cascade: 'CASCADE' },
  { from: 'xp_events', fk: 'user_id', to: 'users', cascade: 'CASCADE' },
  { from: 'user_badges', fk: 'user_id', to: 'users', cascade: 'CASCADE' },
  { from: 'user_badges', fk: 'badge_id', to: 'badges', cascade: 'CASCADE' },
  { from: 'squad_members', fk: 'squad_id', to: 'squads', cascade: 'CASCADE' },
  { from: 'squad_members', fk: 'user_id', to: 'users', cascade: 'CASCADE' },
  { from: 'projects', fk: 'user_id', to: 'users', cascade: 'CASCADE' },
  { from: 'project_members', fk: 'project_id', to: 'projects', cascade: 'CASCADE' },
  { from: 'project_applications', fk: 'project_id', to: 'projects', cascade: 'CASCADE' },
  { from: 'project_tasks', fk: 'project_id', to: 'projects', cascade: 'CASCADE' },
  { from: 'interview_sessions', fk: 'user_id', to: 'users', cascade: 'CASCADE' },
  { from: 'interview_feedback', fk: 'session_id', to: 'interview_sessions', cascade: 'CASCADE' },
  { from: 'notifications', fk: 'user_id', to: 'users', cascade: 'CASCADE' }
];

console.log(`\n--- Checking ${expectedRelationships.length} Relational Foreign Keys ---`);
for (const rel of expectedRelationships) {
  const fkPattern = new RegExp(`${rel.fk}[^,)]*?REFERENCES\\s+(?:public\\.)?${rel.to}\\s*\\(id\\)\\s+ON\\s+DELETE\\s+${rel.cascade}`, 'i');
  assert(fkPattern.test(sqlContent), `Foreign key missing or invalid: ${rel.from}.${rel.fk} -> ${rel.to}(id) ON DELETE ${rel.cascade}`);
  console.log(`✓ Relationship confirmed: ${rel.from}.${rel.fk} -> ${rel.to}(id) [ON DELETE ${rel.cascade}]`);
}

// 4. Verify Index Coverage for Foreign Keys (Supabase Best Practice)
console.log('\n--- Checking Foreign Key Index Coverage ---');
const expectedIndexes = [
  'idx_users_college_id',
  'idx_user_skills_user_id',
  'idx_user_skills_skill_id',
  'idx_submissions_user_id',
  'idx_submissions_problem_id',
  'idx_test_cases_problem_id',
  'idx_aptitude_attempts_test_id',
  'idx_challenge_completions_user_id',
  'idx_challenge_completions_challenge_id',
  'idx_xp_events_user_created',
  'idx_user_badges_user_id',
  'idx_user_badges_badge_id',
  'idx_squad_members_squad_id',
  'idx_squad_members_user_id',
  'idx_projects_user_id',
  'idx_project_members_project_id',
  'idx_project_applications_project_id',
  'idx_project_tasks_project_id',
  'idx_interview_sessions_user_id',
  'idx_interview_feedback_session_id',
  'idx_notifications_user_unread'
];

for (const idx of expectedIndexes) {
  assert(sqlContent.includes(idx), `Missing expected index: ${idx}`);
  console.log(`✓ Index verified: ${idx}`);
}

// 5. Verify Row Level Security (RLS) Enablement
console.log('\n--- Checking RLS Protection on All Relational Tables ---');
for (const entity of canonicalEntities) {
  if (entity === 'users') continue; // users table handled in previous migrations
  if (entity === 'interview_sessions') continue; // handled in previous migration
  const rlsRegex = new RegExp(`ALTER TABLE public\\.${entity} ENABLE ROW LEVEL SECURITY`, 'i');
  assert(rlsRegex.test(sqlContent), `RLS not enabled on public.${entity}`);
  console.log(`✓ RLS enabled: public.${entity}`);
}

// 6. Verify TypeScript Types Exported in src/lib/types.ts
console.log('\n--- Checking TypeScript Canonical Type Definitions ---');
const typesPath = path.resolve('src/lib/types.ts');
const typesContent = fs.readFileSync(typesPath, 'utf8');

const expectedInterfaces = [
  'College',
  'Skill',
  'UserSkill',
  'Problem',
  'TestCase',
  'Submission',
  'AptitudeTest',
  'AptitudeAttempt',
  'DailyChallenge',
  'ChallengeCompletion',
  'UserStats',
  'XpEvent',
  'Badge',
  'UserBadge',
  'Squad',
  'SquadMember',
  'ProjectMember',
  'ProjectApplication',
  'ProjectTask',
  'InterviewFeedbackRelational'
];

for (const iface of expectedInterfaces) {
  assert(typesContent.includes(`export interface ${iface}`), `Missing interface: ${iface}`);
  console.log(`✓ TypeScript interface verified: export interface ${iface}`);
}

console.log('\n======================================================');
console.log('🎉 ALL 24 ENTITIES, 23 RELATIONSHIPS, INDEXES, RLS, AND TYPES PASSED!');
console.log('======================================================\n');
