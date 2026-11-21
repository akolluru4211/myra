-- ==============================================================================
-- EDWORLD CO — 20261121020000_edmail_retention_and_export.sql
-- EdMail: Production Lifecycle States, Retention Policies, and Data Export Audits
-- Includes:
--   1. Update edmail_mailboxes status check constraint to include 'closed'
--   2. Add closed_at, retention_until, and export_requested_at timestamps to edmail_mailboxes
--   3. Create edmail_export_requests table for GDPR/DPDP compliant data portability
-- ==============================================================================

-- 1. Alter status check constraint on edmail_mailboxes to allow 'closed'
ALTER TABLE public.edmail_mailboxes 
  DROP CONSTRAINT IF EXISTS edmail_mailboxes_status_check;

ALTER TABLE public.edmail_mailboxes 
  ADD CONSTRAINT edmail_mailboxes_status_check 
  CHECK (status IN ('pending_verification', 'provisioning', 'ready', 'suspended', 'closed', 'failed'));

-- 2. Add retention and closure lifecycle tracking columns
ALTER TABLE public.edmail_mailboxes
  ADD COLUMN IF NOT EXISTS closed_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS retention_until TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS export_requested_at TIMESTAMPTZ;

-- 3. Create edmail_export_requests table
CREATE TABLE IF NOT EXISTS public.edmail_export_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  mailbox_id UUID NOT NULL REFERENCES public.edmail_mailboxes(id) ON DELETE CASCADE,
  status TEXT NOT NULL CHECK (status IN ('pending', 'processing', 'completed', 'failed')) DEFAULT 'pending',
  export_type TEXT NOT NULL CHECK (export_type IN ('full_archive', 'student_records_only', 'messages_only')) DEFAULT 'full_archive',
  download_url TEXT,
  file_size_bytes BIGINT DEFAULT 0,
  expires_at TIMESTAMPTZ NOT NULL DEFAULT (NOW() + INTERVAL '7 days'),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_edmail_export_requests_user ON public.edmail_export_requests(user_id);

-- Row Level Security
ALTER TABLE public.edmail_export_requests ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "edmail_export_requests_owner" ON public.edmail_export_requests;
CREATE POLICY "edmail_export_requests_owner" ON public.edmail_export_requests
  FOR ALL USING (user_id = auth.uid() OR EXISTS (SELECT 1 FROM public.users u WHERE u.id = auth.uid() AND u.is_admin = TRUE));
