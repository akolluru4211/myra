import { queryDb } from "../src/lib/db-server.ts";

async function main() {
  const schema = await queryDb(`
    CREATE TABLE IF NOT EXISTS public.edlearn_progress (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id TEXT NOT NULL,
      course_slug TEXT NOT NULL,
      completed_lessons TEXT[] DEFAULT '{}',
      current_lesson_id TEXT,
      practice_scores JSONB DEFAULT '{}'::jsonb,
      capstone_status TEXT DEFAULT 'not_started',
      capstone_submission JSONB,
      capstone_grade JSONB,
      updated_at TIMESTAMPTZ DEFAULT NOW(),
      UNIQUE (user_id, course_slug)
    );

    CREATE TABLE IF NOT EXISTS public.edlearn_capstones (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      course_slug TEXT NOT NULL,
      user_id TEXT NOT NULL,
      status TEXT DEFAULT 'submitted', -- 'submitted', 'passed', 'revision_requested'
      submission_data JSONB NOT NULL,
      evaluation_result JSONB,
      score INTEGER,
      feedback TEXT,
      certificate_code TEXT,
      submitted_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS public.edlearn_papers (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      authors TEXT[] NOT NULL,
      year INTEGER NOT NULL,
      venue TEXT,
      url TEXT NOT NULL,
      license TEXT NOT NULL,
      can_store_pdf BOOLEAN DEFAULT false,
      pdf_url TEXT,
      course_slugs TEXT[] NOT NULL,
      topics TEXT[] NOT NULL,
      what_you_can_learn TEXT NOT NULL,
      abstract TEXT NOT NULL,
      key_sections JSONB NOT NULL,
      created_at TIMESTAMPTZ DEFAULT NOW()
    );

    CREATE INDEX IF NOT EXISTS idx_edlearn_progress_user ON public.edlearn_progress(user_id, course_slug);
    CREATE INDEX IF NOT EXISTS idx_edlearn_capstones_user ON public.edlearn_capstones(user_id, course_slug);
  `);
  console.log("EdLearn tables verified and created successfully.");
  process.exit(0);
}

main().catch(err => {
  console.error("Migration error:", err);
  process.exit(1);
});
