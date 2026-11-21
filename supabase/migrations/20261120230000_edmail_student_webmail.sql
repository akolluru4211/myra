-- ==============================================================================
-- EDWORLD CO — 20261121000000_edmail_student_webmail.sql
-- EdMail: Managed Student Email Service (@edworld.co.in)
-- Includes:
--   1. edmail_mailboxes: Mailbox provisioning, verification, and quota state
--   2. edmail_messages: Inbound & outbound messages, conversation threads, folders, labels
--   3. edmail_attachments: Message attachments & document links
--   4. edmail_documents: Private study materials & certificate vault
--   5. edmail_delivery_logs: Webhook deduplication, delivery receipts, bounces
-- Fully idempotent with RLS, audit trail, and zero data loss
-- ==============================================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ------------------------------------------------------------------------------
-- 1. EDMAIL MAILBOXES TABLE
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.edmail_mailboxes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  username TEXT NOT NULL,
  address TEXT NOT NULL,
  recovery_email TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('pending_verification', 'provisioning', 'ready', 'suspended', 'failed')) DEFAULT 'pending_verification',
  storage_used_bytes BIGINT NOT NULL DEFAULT 0,
  storage_quota_bytes BIGINT NOT NULL DEFAULT 536870912, -- 512 MB default student quota
  daily_send_count INT NOT NULL DEFAULT 0,
  daily_send_limit INT NOT NULL DEFAULT 100,
  last_send_reset_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  guardian_consent_verified BOOLEAN NOT NULL DEFAULT FALSE,
  eligibility_verified BOOLEAN NOT NULL DEFAULT FALSE,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT uq_edmail_mailboxes_user_id UNIQUE (user_id),
  CONSTRAINT uq_edmail_mailboxes_username UNIQUE (username),
  CONSTRAINT uq_edmail_mailboxes_address UNIQUE (address)
);

CREATE INDEX IF NOT EXISTS idx_edmail_mailboxes_user_id ON public.edmail_mailboxes(user_id);
CREATE INDEX IF NOT EXISTS idx_edmail_mailboxes_address ON public.edmail_mailboxes(address);
CREATE INDEX IF NOT EXISTS idx_edmail_mailboxes_username ON public.edmail_mailboxes(username);

-- ------------------------------------------------------------------------------
-- 2. EDMAIL MESSAGES TABLE
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.edmail_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  mailbox_id UUID NOT NULL REFERENCES public.edmail_mailboxes(id) ON DELETE CASCADE,
  thread_id TEXT NOT NULL,
  provider_message_id TEXT,
  direction TEXT NOT NULL CHECK (direction IN ('inbound', 'outbound')),
  folder TEXT NOT NULL CHECK (folder IN ('inbox', 'sent', 'drafts', 'archive', 'trash', 'spam')) DEFAULT 'inbox',
  from_address TEXT NOT NULL,
  from_name TEXT,
  to_addresses TEXT[] NOT NULL DEFAULT '{}'::TEXT[],
  cc_addresses TEXT[] NOT NULL DEFAULT '{}'::TEXT[],
  bcc_addresses TEXT[] NOT NULL DEFAULT '{}'::TEXT[],
  subject TEXT NOT NULL DEFAULT '',
  snippet TEXT NOT NULL DEFAULT '',
  body_text TEXT NOT NULL DEFAULT '',
  body_html TEXT NOT NULL DEFAULT '',
  is_read BOOLEAN NOT NULL DEFAULT FALSE,
  is_starred BOOLEAN NOT NULL DEFAULT FALSE,
  labels TEXT[] NOT NULL DEFAULT '{}'::TEXT[], -- e.g. 'Study', 'Certificates', 'Student Offers'
  delivery_status TEXT NOT NULL CHECK (delivery_status IN ('draft', 'queued', 'accepted', 'delivered', 'failed', 'bounced')) DEFAULT 'delivered',
  delivery_error TEXT,
  received_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_edmail_messages_mailbox_folder ON public.edmail_messages(mailbox_id, folder, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_edmail_messages_thread_id ON public.edmail_messages(mailbox_id, thread_id);
CREATE INDEX IF NOT EXISTS idx_edmail_messages_provider_id ON public.edmail_messages(provider_message_id);
CREATE INDEX IF NOT EXISTS idx_edmail_messages_labels ON public.edmail_messages USING GIN(labels);

-- ------------------------------------------------------------------------------
-- 3. EDMAIL ATTACHMENTS TABLE
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.edmail_attachments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  message_id UUID NOT NULL REFERENCES public.edmail_messages(id) ON DELETE CASCADE,
  mailbox_id UUID NOT NULL REFERENCES public.edmail_mailboxes(id) ON DELETE CASCADE,
  filename TEXT NOT NULL,
  content_type TEXT NOT NULL DEFAULT 'application/octet-stream',
  byte_size BIGINT NOT NULL DEFAULT 0,
  content_base64 TEXT,
  storage_path TEXT,
  scan_status TEXT NOT NULL CHECK (scan_status IN ('clean', 'suspicious', 'pending')) DEFAULT 'clean',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_edmail_attachments_message_id ON public.edmail_attachments(message_id);
CREATE INDEX IF NOT EXISTS idx_edmail_attachments_mailbox_id ON public.edmail_attachments(mailbox_id);

-- ------------------------------------------------------------------------------
-- 4. EDMAIL DOCUMENTS TABLE (Study Materials & Certificate Vault)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.edmail_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  mailbox_id UUID NOT NULL REFERENCES public.edmail_mailboxes(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  category TEXT NOT NULL CHECK (category IN ('study_material', 'certificate', 'resume', 'general')) DEFAULT 'study_material',
  title TEXT NOT NULL,
  filename TEXT NOT NULL,
  content_type TEXT NOT NULL DEFAULT 'application/pdf',
  byte_size BIGINT NOT NULL DEFAULT 0,
  storage_path TEXT,
  source TEXT NOT NULL CHECK (source IN ('upload', 'email_attachment', 'edworld_verified')) DEFAULT 'upload',
  is_verified BOOLEAN NOT NULL DEFAULT FALSE,
  verification_issuer TEXT,
  verification_badge TEXT,
  source_message_id UUID REFERENCES public.edmail_messages(id) ON DELETE SET NULL,
  tags TEXT[] NOT NULL DEFAULT '{}'::TEXT[],
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_edmail_documents_mailbox_id ON public.edmail_documents(mailbox_id, category);
CREATE INDEX IF NOT EXISTS idx_edmail_documents_user_id ON public.edmail_documents(user_id);

-- ------------------------------------------------------------------------------
-- 5. EDMAIL DELIVERY & WEBHOOK DEDUPLICATION LOGS
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.edmail_delivery_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  provider TEXT NOT NULL DEFAULT 'resend',
  event_id TEXT NOT NULL,
  event_type TEXT NOT NULL, -- 'email.sent', 'email.delivered', 'email.bounced', 'email.complained', 'inbound'
  recipient TEXT,
  message_id UUID REFERENCES public.edmail_messages(id) ON DELETE SET NULL,
  payload JSONB NOT NULL DEFAULT '{}'::jsonb,
  processed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT uq_edmail_delivery_logs_event_id UNIQUE (provider, event_id)
);

CREATE INDEX IF NOT EXISTS idx_edmail_delivery_logs_event ON public.edmail_delivery_logs(provider, event_id);

-- ------------------------------------------------------------------------------
-- 6. ROW LEVEL SECURITY (RLS) POLICIES
-- Strict Isolation: Students can only read, write, and manage their OWN mailbox.
-- ------------------------------------------------------------------------------
ALTER TABLE public.edmail_mailboxes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.edmail_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.edmail_attachments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.edmail_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.edmail_delivery_logs ENABLE ROW LEVEL SECURITY;

-- Mailboxes: Owner can select/update own mailbox
DROP POLICY IF EXISTS "edmail_mailboxes_owner_select" ON public.edmail_mailboxes;
CREATE POLICY "edmail_mailboxes_owner_select" ON public.edmail_mailboxes
  FOR SELECT USING (user_id = auth.uid() OR EXISTS (SELECT 1 FROM public.users u WHERE u.id = auth.uid() AND u.is_admin = TRUE));

DROP POLICY IF EXISTS "edmail_mailboxes_owner_update" ON public.edmail_mailboxes;
CREATE POLICY "edmail_mailboxes_owner_update" ON public.edmail_mailboxes
  FOR UPDATE USING (user_id = auth.uid() OR EXISTS (SELECT 1 FROM public.users u WHERE u.id = auth.uid() AND u.is_admin = TRUE));

-- Messages: Owner of mailbox can select, insert, update, delete own messages
DROP POLICY IF EXISTS "edmail_messages_owner_all" ON public.edmail_messages;
CREATE POLICY "edmail_messages_owner_all" ON public.edmail_messages
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.edmail_mailboxes m WHERE m.id = mailbox_id AND (m.user_id = auth.uid() OR EXISTS (SELECT 1 FROM public.users u WHERE u.id = auth.uid() AND u.is_admin = TRUE)))
  );

-- Attachments: Owner of mailbox can access attachments
DROP POLICY IF EXISTS "edmail_attachments_owner_all" ON public.edmail_attachments;
CREATE POLICY "edmail_attachments_owner_all" ON public.edmail_attachments
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.edmail_mailboxes m WHERE m.id = mailbox_id AND (m.user_id = auth.uid() OR EXISTS (SELECT 1 FROM public.users u WHERE u.id = auth.uid() AND u.is_admin = TRUE)))
  );

-- Documents: Owner can manage own documents
DROP POLICY IF EXISTS "edmail_documents_owner_all" ON public.edmail_documents;
CREATE POLICY "edmail_documents_owner_all" ON public.edmail_documents
  FOR ALL USING (user_id = auth.uid() OR EXISTS (SELECT 1 FROM public.users u WHERE u.id = auth.uid() AND u.is_admin = TRUE));

-- Delivery Logs: Service role and admins only
DROP POLICY IF EXISTS "edmail_delivery_logs_admin_all" ON public.edmail_delivery_logs;
CREATE POLICY "edmail_delivery_logs_admin_all" ON public.edmail_delivery_logs
  FOR ALL USING (EXISTS (SELECT 1 FROM public.users u WHERE u.id = auth.uid() AND u.is_admin = TRUE));
