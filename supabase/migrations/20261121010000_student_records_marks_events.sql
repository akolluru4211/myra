-- ==============================================================================
-- EDWORLD CO — 20261121010000_student_records_marks_events.sql
-- Private Student Record Alongside EdMail: Marks & Academic Events
-- Includes:
--   1. student_marks: Subjects, assessments, scores, max marks, grades, verified status, source message
--   2. student_events: Workshops, classes, exams, competitions, deadlines, reminders, meet links, ics export
-- Strict RLS: Student isolation on every read, write, and search request
-- ==============================================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ------------------------------------------------------------------------------
-- 1. STUDENT MARKS TABLE
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.student_marks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  mailbox_id UUID REFERENCES public.edmail_mailboxes(id) ON DELETE SET NULL,
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
  source_message_id UUID REFERENCES public.edmail_messages(id) ON DELETE SET NULL,
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
  mailbox_id UUID REFERENCES public.edmail_mailboxes(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  event_type TEXT NOT NULL CHECK (event_type IN ('workshop', 'class', 'exam', 'competition', 'deadline', 'general')) DEFAULT 'general',
  start_time TIMESTAMPTZ NOT NULL,
  end_time TIMESTAMPTZ,
  timezone TEXT NOT NULL DEFAULT 'Asia/Kolkata',
  location_or_link TEXT,
  description TEXT,
  reminder_minutes INT DEFAULT 30, -- minutes before event
  source TEXT NOT NULL CHECK (source IN ('manual', 'email_invitation', 'edworld_platform')) DEFAULT 'manual',
  source_message_id UUID REFERENCES public.edmail_messages(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_student_events_user_time ON public.student_events(user_id, start_time ASC);

-- ------------------------------------------------------------------------------
-- 3. ROW LEVEL SECURITY
-- ------------------------------------------------------------------------------
ALTER TABLE public.student_marks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.student_events ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "student_marks_owner_all" ON public.student_marks;
CREATE POLICY "student_marks_owner_all" ON public.student_marks
  FOR ALL USING (user_id = auth.uid() OR EXISTS (SELECT 1 FROM public.users u WHERE u.id = auth.uid() AND u.is_admin = TRUE));

DROP POLICY IF EXISTS "student_events_owner_all" ON public.student_events;
CREATE POLICY "student_events_owner_all" ON public.student_events
  FOR ALL USING (user_id = auth.uid() OR EXISTS (SELECT 1 FROM public.users u WHERE u.id = auth.uid() AND u.is_admin = TRUE));
