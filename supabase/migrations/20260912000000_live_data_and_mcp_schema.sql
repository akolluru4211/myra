-- ==============================================================================
-- EDWORLD CO — LIVE DATA TABLES, MCP ENGINE INTEGRATION & DATABASE SEEDING
-- ==============================================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. INTERVIEW QUESTIONS TABLE HARDENING & BACKWARD COMPATIBILITY
-- Ensure interview_questions table has all required columns and text ID compatibility
CREATE TABLE IF NOT EXISTS public.interview_questions (
  id TEXT PRIMARY KEY,
  category TEXT NOT NULL,
  text TEXT NOT NULL,
  difficulty_level INTEGER DEFAULT 0,
  key_points JSONB DEFAULT '[]'::jsonb,
  suggested_duration_seconds INTEGER DEFAULT 120,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Ensure columns exist if table was created in an earlier migration with fewer columns
ALTER TABLE public.interview_questions ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT TRUE;
ALTER TABLE public.interview_questions ADD COLUMN IF NOT EXISTS key_points JSONB DEFAULT '[]'::jsonb;
ALTER TABLE public.interview_questions ADD COLUMN IF NOT EXISTS suggested_duration_seconds INTEGER DEFAULT 120;
ALTER TABLE public.interview_questions ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW();
ALTER TABLE public.interview_questions ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- Ensure id column can store text slugs if originally declared UUID
DO $$
BEGIN
  ALTER TABLE public.interview_questions ALTER COLUMN id TYPE TEXT;
EXCEPTION WHEN OTHERS THEN
  NULL;
END $$;

-- Relax difficulty_level check constraint to support levels 0, 1, 2, 3
DO $$
BEGIN
  ALTER TABLE public.interview_questions DROP CONSTRAINT IF EXISTS interview_questions_difficulty_level_check;
  ALTER TABLE public.interview_questions ADD CONSTRAINT interview_questions_difficulty_level_check CHECK (difficulty_level IN (0, 1, 2, 3));
EXCEPTION WHEN OTHERS THEN
  NULL;
END $$;

ALTER TABLE public.interview_questions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow public read on active interview questions" ON public.interview_questions;
CREATE POLICY "Allow public read on active interview questions"
ON public.interview_questions FOR SELECT
TO anon, authenticated
USING (is_active = true);

-- The initial profiles schema has is_admin but does not define role.
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS role TEXT;

-- Browser clients can update their learner role. Staff assignments are server-managed.
CREATE OR REPLACE FUNCTION public.guard_profile_authorization_fields()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = pg_catalog
AS $$
BEGIN
  IF current_user NOT IN ('anon', 'authenticated') THEN
    RETURN NEW;
  END IF;

  IF TG_OP = 'INSERT' THEN
    IF NEW.is_admin IS TRUE OR upper(NEW.role) NOT IN ('CLIENT', 'STUDENT') THEN
      RAISE EXCEPTION 'Profile authorization fields are server-managed' USING ERRCODE = '42501';
    END IF;
  ELSIF (NEW.is_admin IS TRUE) <> (OLD.is_admin IS TRUE)
    OR (
      NEW.role IS DISTINCT FROM OLD.role
      AND (
        upper(NEW.role) NOT IN ('CLIENT', 'STUDENT')
        OR upper(OLD.role) NOT IN ('CLIENT', 'STUDENT')
      )
    ) THEN
    RAISE EXCEPTION 'Profile authorization fields are server-managed' USING ERRCODE = '42501';
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS guard_profile_authorization_fields ON public.profiles;
CREATE TRIGGER guard_profile_authorization_fields
BEFORE INSERT OR UPDATE OF role, is_admin ON public.profiles
FOR EACH ROW EXECUTE FUNCTION public.guard_profile_authorization_fields();

DROP POLICY IF EXISTS "Allow admin manage on interview questions" ON public.interview_questions;
CREATE POLICY "Allow admin manage on interview questions"
ON public.interview_questions FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE profiles.id = (SELECT auth.uid()) 
    AND (profiles.is_admin = true OR profiles.role IN ('ADMIN', 'SUPER_ADMIN'))
  )
);

-- 2. SEED LIVE INTERVIEW QUESTIONS
INSERT INTO public.interview_questions (id, category, text, difficulty_level, key_points, suggested_duration_seconds)
VALUES
  ('swe-0-1', 'Software Engineering', 'Can you explain the difference between synchronous and asynchronous programming, and give a real-world example of when you would use each?', 0, '["Blocking vs non-blocking I/O", "UI responsiveness", "API network requests", "Real-world web or app scenario"]'::jsonb, 120),
  ('swe-0-2', 'Software Engineering', 'What is the Document Object Model (DOM) in web development, and how does React Virtual DOM improve rendering performance?', 0, '["Tree representation of HTML", "Browser reflows", "Reconciliation algorithm", "Batched updates"]'::jsonb, 120),
  ('swe-1-1', 'Software Engineering', 'Walk me through how you would optimize a web application experiencing slow initial page load times and heavy main-thread CPU usage.', 1, '["Profiling & waterfalls", "Asset code-splitting", "Database indexing & caching", "Client re-render reduction"]'::jsonb, 180),
  ('swe-1-2', 'Software Engineering', 'How do you handle database concurrency and race conditions when multiple users attempt to purchase the last available seat on a flight simultaneously?', 1, '["Optimistic vs pessimistic locking", "ACID transactions", "Distributed locks with Redis", "Idempotency keys"]'::jsonb, 180),
  ('swe-2-1', 'Software Engineering', 'Design a globally distributed rate limiter that handles 100,000 requests per second with sub-millisecond latency constraints and high availability.', 2, '["Token bucket / sliding window", "Redis cluster vs local memory", "CAP theorem trade-offs", "Edge gateway rate limiting"]'::jsonb, 240),
  ('beh-0-1', 'General Behavioral & Leadership', 'Tell me about a time you had to learn a new tool, programming language, or technology quickly to complete a project. What steps did you take?', 0, '["Situation context", "Structured self-learning strategy", "Overcoming roadblocks", "Positive project outcome"]'::jsonb, 120),
  ('beh-1-1', 'General Behavioral & Leadership', 'Describe a high-pressure situation where a production incident occurred or a critical deadline was at risk. How did you prioritize and communicate?', 1, '["Triage & root cause analysis", "Blameless post-mortem", "Stakeholder updates", "Long-term preventative fixes"]'::jsonb, 180),
  ('beh-2-1', 'General Behavioral & Leadership', 'How do you navigate a strategic disagreement between engineering feasibility and aggressive product timelines when executive leadership is pushing for launch?', 2, '["Quantifying technical debt", "Phased MVP negotiation", "Data-driven communication", "Alignment on success metrics"]'::jsonb, 240),
  ('pm-1-1', 'Product Management', 'How would you measure the success of an AI-assisted job matching feature and prioritize candidate feedback loops?', 1, '["North star metric", "Retention & conversion", "A/B testing", "Qualitative feedback"]'::jsonb, 180),
  ('ds-1-1', 'Data Science & AI', 'How do you detect and mitigate embedding drift in a production semantic retrieval pipeline over time?', 1, '["Vector similarity thresholds", "Data distribution shift", "Model fine-tuning", "Continuous evaluation benchmarks"]'::jsonb, 180)
ON CONFLICT (id) DO UPDATE SET
  text = EXCLUDED.text,
  key_points = EXCLUDED.key_points,
  suggested_duration_seconds = EXCLUDED.suggested_duration_seconds,
  updated_at = NOW();

-- 3. SEED LIVE PROBLEMS & RELAX CHECKS
-- Ensure category and difficulty checks accommodate modern tracks (AI, engineering, sustainability, levels 0-4)
DO $$
BEGIN
  ALTER TABLE public.problems DROP CONSTRAINT IF EXISTS problems_category_check;
  ALTER TABLE public.problems DROP CONSTRAINT IF EXISTS problems_difficulty_level_check;
  ALTER TABLE public.problems ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT TRUE;
  ALTER TABLE public.problems ADD COLUMN IF NOT EXISTS min_age_band TEXT DEFAULT '13-15';
  ALTER TABLE public.problems ADD COLUMN IF NOT EXISTS last_reviewed_at TIMESTAMPTZ DEFAULT NOW();
EXCEPTION WHEN OTHERS THEN
  NULL;
END $$;

-- Seed problems using deterministic UUIDs compatible with UUID primary keys and text lookup
INSERT INTO public.problems (id, title, description, category, difficulty_level, min_age_band, interest_tags, is_active, created_at, last_reviewed_at)
VALUES
  ('c1000001-0000-4000-8000-000000000001', 'Implement LoRA (Low-Rank Adaptation) in PyTorch', 'Implement a custom nn.Module for LoRA linear layers with trainable A and B rank decomposition matrices, alpha scaling factor, and zero-init initialization.', 'ai', 2, '18+', ARRAY['pytorch', 'deep-learning', 'transformers', 'lora', 'meta', 'openai', 'anthropic'], true, NOW(), NOW()),
  ('c1000001-0000-4000-8000-000000000002', 'Implement KV Cache for LLM Token Generation', 'Implement an efficient Key-Value cache in PyTorch that avoids quadratic re-computation of attention keys and values across autoregressive generation steps.', 'ai', 2, '18+', ARRAY['pytorch', 'llm-inference', 'kv-cache', 'anthropic', 'openai', 'perplexity'], true, NOW(), NOW()),
  ('c1000001-0000-4000-8000-000000000003', 'Direct Preference Optimization (DPO) Loss', 'Implement the closed-form DPO loss function in PyTorch comparing policy model log-probabilities against reference model log-probabilities on chosen vs rejected pairs.', 'ai', 3, '18+', ARRAY['pytorch', 'rlhf', 'dpo', 'alignment', 'deepmind', 'openai'], true, NOW(), NOW()),
  ('c1000001-0000-4000-8000-000000000004', 'GRPO (Group Relative Policy Optimization - DeepSeek-R1)', 'Implement group-relative policy optimization loss with group reward normalization and clipped surrogate objective for reasoning models.', 'ai', 4, '18+', ARRAY['pytorch', 'reasoning', 'deepseek', 'grpo', 'rl'], true, NOW(), NOW()),
  ('c1000001-0000-4000-8000-000000000005', 'Fused Softmax Kernel in Triton', 'Write a high-performance fused softmax GPU kernel in OpenAI Triton with row-wise online normalization and SRAM shared memory caching.', 'engineering', 4, '18+', ARRAY['triton', 'gpu-systems', 'cuda', 'nvidia', 'xai'], true, NOW(), NOW()),
  ('c1000001-0000-4000-8000-000000000006', 'Eco-Friendly Campus Energy Optimizer', 'Design an automated sensor dashboard to detect unnecessary classroom lighting and calculate daily kilowatt savings.', 'sustainability', 1, '13-15', ARRAY['sustainability', 'climate', 'iot'], true, NOW(), NOW())
ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  description = EXCLUDED.description,
  interest_tags = EXCLUDED.interest_tags,
  last_reviewed_at = NOW();

-- 4. SEED LIVE VERIFIED JOBS
-- Prepare jobs table for platform seed data (allow null posted_by and application_deadline defaults)
DO $$
BEGIN
  ALTER TABLE public.jobs ALTER COLUMN posted_by DROP NOT NULL;
  ALTER TABLE public.jobs ALTER COLUMN application_deadline DROP NOT NULL;
EXCEPTION WHEN OTHERS THEN
  NULL;
END $$;

INSERT INTO public.jobs (id, title, company, description, location, type, skills_required, salary_range, is_active, moderation_status, created_at)
VALUES
  ('d1000001-0000-4000-8000-000000000001', 'Full-Stack Software Engineer (Next.js & Supabase)', 'NexCorp Technologies', 'Join our core platform engineering team building scalable real-time applications with Next.js App Router, Supabase Postgres, and TypeScript.', 'Remote (India / Global)', 'full_time', '["React", "Next.js", "TypeScript", "PostgreSQL", "Supabase", "REST APIs"]'::jsonb, '₹14,00,000 - ₹22,00,000 / year', true, 'approved', NOW()),
  ('d1000001-0000-4000-8000-000000000002', 'AI & Machine Learning Engineer', 'Aether Dynamics', 'Develop and optimize LLM fine-tuning, RAG retrieval pipelines, and high-throughput model inference infrastructure.', 'Bengaluru, India (Hybrid)', 'full_time', '["Python", "PyTorch", "Transformers", "RAG", "FastAPI", "Docker"]'::jsonb, '₹18,00,000 - ₹30,00,000 / year', true, 'approved', NOW()),
  ('d1000001-0000-4000-8000-000000000003', 'Junior Frontend Developer Intern', 'PixelForge Interactive', 'Exciting 6-month paid engineering internship working on responsive UI components, Tailwind styling, and accessibility optimization.', 'Hyderabad, India (Remote Available)', 'internship', '["JavaScript", "React", "HTML5", "CSS3", "Tailwind CSS", "Git"]'::jsonb, '₹35,000 - ₹50,000 / month', true, 'approved', NOW()),
  ('d1000001-0000-4000-8000-000000000004', 'Cloud Infrastructure & DevOps Engineer', 'ScaleGrid Systems', 'Maintain Kubernetes clusters, automate Terraform provisioning, and optimize CI/CD pipelines across AWS and GCP environments.', 'Pune, India (Hybrid)', 'full_time', '["Kubernetes", "Docker", "AWS", "Terraform", "CI/CD", "Linux"]'::jsonb, '₹16,00,000 - ₹26,00,000 / year', true, 'approved', NOW())
ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  company = EXCLUDED.company,
  skills_required = EXCLUDED.skills_required,
  salary_range = EXCLUDED.salary_range,
  is_active = true,
  moderation_status = 'approved';
