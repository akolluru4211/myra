-- ==============================================================================
-- EDWORLD CO — 20261121000000_student_records.sql
-- Canonical Private Student Record System:
--   1. student_marks: Subjects, assessments, scores, max marks, grades, verified status, attachments
--   2. student_events: Workshops, classes, exams, competitions, deadlines, reminders, timezones, meet links
--   3. student_notes: Study files, lecture notes, assignments, tags, private storage paths
--   4. student_certificates: Issuer, issue date, credential ID, verification URL, personal vs verified badge
--   5. student_projects: Title, description, GitHub URL, live demo, tech stack, documentation
--   6. student_applications: Internships & jobs applied, company, status, resume snapshot
-- Multi-tenant Row-Level Security (RLS) on every table: Student isolation guaranteed
-- ==============================================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ------------------------------------------------------------------------------
-- 1. STUDENT MARKS TABLE
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.student_marks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  mailbox_id UUID,
  subject TEXT NOT NULL,
  assessment_name TEXT NOT NULL,
  score NUMERIC(6, 2) NOT NULL,
  max_marks NUMERIC(6, 2) NOT NULL DEFAULT 100,
  grade TEXT,
  term_or_semester TEXT,
  source TEXT NOT NULL CHECK (source IN ('student_entered', 'email_attachment', 'institution_verified')) DEFAULT 'student_entered',
  is_verified BOOLEAN NOT NULL DEFAULT FALSE,
  verified_by TEXT,
  verified_at TIMESTAMPTZ,
  mark_sheet_filename TEXT,
  mark_sheet_storage_path TEXT,
  source_message_id UUID,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_student_marks_user_id ON public.student_marks(user_id);
CREATE INDEX IF NOT EXISTS idx_student_marks_subject ON public.student_marks(user_id, subject);

-- ------------------------------------------------------------------------------
-- 2. STUDENT EVENTS TABLE
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.student_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  mailbox_id UUID,
  title TEXT NOT NULL,
  event_type TEXT NOT NULL CHECK (event_type IN ('workshop', 'class', 'exam', 'competition', 'deadline', 'general')) DEFAULT 'general',
  start_time TIMESTAMPTZ NOT NULL,
  end_time TIMESTAMPTZ,
  timezone TEXT NOT NULL DEFAULT 'Asia/Kolkata',
  location_or_link TEXT,
  description TEXT,
  reminder_minutes INT DEFAULT 30,
  source TEXT NOT NULL CHECK (source IN ('manual', 'email_invitation', 'edworld_platform')) DEFAULT 'manual',
  source_message_id UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_student_events_user_time ON public.student_events(user_id, start_time ASC);

-- ------------------------------------------------------------------------------
-- 3. STUDENT NOTES & STUDY FILES TABLE
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.student_notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  mailbox_id UUID,
  title TEXT NOT NULL,
  category TEXT NOT NULL CHECK (category IN ('study_material', 'lecture_note', 'assignment', 'research', 'general')) DEFAULT 'study_material',
  content_text TEXT,
  filename TEXT,
  content_type TEXT DEFAULT 'application/pdf',
  byte_size BIGINT DEFAULT 0,
  storage_path TEXT,
  tags TEXT[] NOT NULL DEFAULT '{}'::TEXT[],
  source TEXT NOT NULL CHECK (source IN ('upload', 'email_attachment', 'manual_entry')) DEFAULT 'upload',
  source_message_id UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_student_notes_user_id ON public.student_notes(user_id);
CREATE INDEX IF NOT EXISTS idx_student_notes_category ON public.student_notes(user_id, category);

-- ------------------------------------------------------------------------------
-- 4. STUDENT CERTIFICATES TABLE
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.student_certificates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  mailbox_id UUID,
  title TEXT NOT NULL,
  issuer TEXT NOT NULL,
  issue_date DATE,
  credential_id TEXT,
  verification_url TEXT,
  is_verified BOOLEAN NOT NULL DEFAULT FALSE,
  verified_by TEXT,
  filename TEXT,
  storage_path TEXT,
  byte_size BIGINT DEFAULT 0,
  is_published BOOLEAN NOT NULL DEFAULT FALSE,
  published_fields JSONB NOT NULL DEFAULT '{"title": true, "issuer": true, "issue_date": true, "verification_url": true}'::jsonb,
  source TEXT NOT NULL CHECK (source IN ('upload', 'email_attachment', 'edworld_issued')) DEFAULT 'upload',
  source_message_id UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_student_certificates_user_id ON public.student_certificates(user_id);

-- ------------------------------------------------------------------------------
-- 5. STUDENT PROJECTS TABLE
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.student_projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  github_url TEXT,
  live_url TEXT,
  tech_stack TEXT[] NOT NULL DEFAULT '{}'::TEXT[],
  role TEXT DEFAULT 'Creator',
  start_date DATE,
  end_date DATE,
  is_featured BOOLEAN NOT NULL DEFAULT FALSE,
  is_published BOOLEAN NOT NULL DEFAULT FALSE,
  published_fields JSONB NOT NULL DEFAULT '{"title": true, "description": true, "github_url": true, "live_url": true, "tech_stack": true}'::jsonb,
  portfolio_slug TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_student_projects_user_id ON public.student_projects(user_id);

-- ------------------------------------------------------------------------------
-- 6. STUDENT APPLICATIONS TABLE (Career & Internship Tracker)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.student_applications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  company TEXT NOT NULL,
  role_title TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('saved', 'applied', 'interviewing', 'offered', 'rejected', 'withdrawn')) DEFAULT 'applied',
  applied_date DATE DEFAULT CURRENT_DATE,
  location TEXT,
  salary_or_stipend TEXT,
  job_url TEXT,
  notes TEXT,
  source TEXT NOT NULL CHECK (source IN ('edworld_job', 'external', 'referral')) DEFAULT 'external',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_student_applications_user_id ON public.student_applications(user_id);

-- ------------------------------------------------------------------------------
-- 7. ROW LEVEL SECURITY (RLS) POLICIES
-- ------------------------------------------------------------------------------
ALTER TABLE public.student_marks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.student_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.student_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.student_certificates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.student_projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.student_applications ENABLE ROW LEVEL SECURITY;

-- Marks Policies
DROP POLICY IF EXISTS "student_marks_owner_all" ON public.student_marks;
CREATE POLICY "student_marks_owner_all" ON public.student_marks
  FOR ALL USING (user_id = auth.uid() OR EXISTS (SELECT 1 FROM public.users u WHERE u.id = auth.uid() AND u.is_admin = TRUE));

-- Events Policies
DROP POLICY IF EXISTS "student_events_owner_all" ON public.student_events;
CREATE POLICY "student_events_owner_all" ON public.student_events
  FOR ALL USING (user_id = auth.uid() OR EXISTS (SELECT 1 FROM public.users u WHERE u.id = auth.uid() AND u.is_admin = TRUE));

-- Notes Policies
DROP POLICY IF EXISTS "student_notes_owner_all" ON public.student_notes;
CREATE POLICY "student_notes_owner_all" ON public.student_notes
  FOR ALL USING (user_id = auth.uid() OR EXISTS (SELECT 1 FROM public.users u WHERE u.id = auth.uid() AND u.is_admin = TRUE));

-- Certificates Policies
DROP POLICY IF EXISTS "student_certificates_owner_all" ON public.student_certificates;
CREATE POLICY "student_certificates_owner_all" ON public.student_certificates
  FOR ALL USING (user_id = auth.uid() OR EXISTS (SELECT 1 FROM public.users u WHERE u.id = auth.uid() AND u.is_admin = TRUE));

-- Projects Policies
DROP POLICY IF EXISTS "student_projects_owner_all" ON public.student_projects;
CREATE POLICY "student_projects_owner_all" ON public.student_projects
  FOR ALL USING (user_id = auth.uid() OR EXISTS (SELECT 1 FROM public.users u WHERE u.id = auth.uid() AND u.is_admin = TRUE));

-- Applications Policies
DROP POLICY IF EXISTS "student_applications_owner_all" ON public.student_applications;
CREATE POLICY "student_applications_owner_all" ON public.student_applications
  FOR ALL USING (user_id = auth.uid() OR EXISTS (SELECT 1 FROM public.users u WHERE u.id = auth.uid() AND u.is_admin = TRUE));
