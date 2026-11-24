import { queryDb } from "../src/lib/db-server.ts";

async function main() {
  await queryDb(`
    -- 1. Unified Review Queue Schema
    CREATE TABLE IF NOT EXISTS public.admin_review_queue (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      review_type TEXT NOT NULL, -- 'ambassador_application', 'profile_correction', 'edbuild_submission', 'event_listing', 'job_listing', 'certification_request'
      requester_id TEXT NOT NULL,
      requester_name TEXT NOT NULL,
      requester_email TEXT,
      institution TEXT,
      title TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'pending', -- 'pending', 'changes_requested', 'approved', 'declined'
      evidence JSONB DEFAULT '{}'::jsonb,
      current_values JSONB DEFAULT '{}'::jsonb,
      proposed_values JSONB DEFAULT '{}'::jsonb,
      reviewer_id TEXT,
      reviewer_name TEXT,
      internal_notes TEXT,
      applicant_feedback TEXT,
      last_decision_at TIMESTAMPTZ,
      created_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW(),
      version INTEGER DEFAULT 1
    );

    -- 2. Audit Trail for All Staff Decisions and Profile Corrections
    CREATE TABLE IF NOT EXISTS public.staff_audit_history (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      item_type TEXT NOT NULL,
      item_id TEXT NOT NULL,
      action TEXT NOT NULL, -- 'approve', 'request_changes', 'decline', 'correct_profile'
      reviewer_id TEXT NOT NULL,
      reviewer_name TEXT,
      reason TEXT NOT NULL,
      previous_status TEXT,
      new_status TEXT,
      previous_values JSONB,
      new_values JSONB,
      internal_notes TEXT,
      applicant_message TEXT,
      created_at TIMESTAMPTZ DEFAULT NOW()
    );

    -- 3. College Ambassadors Tables
    CREATE TABLE IF NOT EXISTS public.ambassador_applications (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id TEXT NOT NULL,
      student_name TEXT NOT NULL,
      email TEXT NOT NULL,
      college_name TEXT NOT NULL,
      degree_year TEXT,
      why_ambassador TEXT NOT NULL,
      relevant_experience TEXT,
      social_links JSONB DEFAULT '{}'::jsonb,
      status TEXT NOT NULL DEFAULT 'submitted', -- 'draft', 'submitted', 'under_review', 'changes_requested', 'approved', 'declined'
      decision_message TEXT,
      internal_notes TEXT,
      reviewed_by TEXT,
      reviewed_at TIMESTAMPTZ,
      created_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS public.ambassadors (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id TEXT NOT NULL UNIQUE,
      college_name TEXT NOT NULL,
      referral_code TEXT NOT NULL UNIQUE,
      is_active BOOLEAN DEFAULT true,
      status TEXT NOT NULL DEFAULT 'active', -- 'active', 'suspended'
      status_reason TEXT,
      verified_rewards JSONB DEFAULT '{"total_points": 0, "verified_referrals": 0, "tier": "Bronze"}'::jsonb,
      assigned_tasks JSONB DEFAULT '[]'::jsonb,
      campus_events JSONB DEFAULT '[]'::jsonb,
      joined_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS public.ambassador_referrals (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      ambassador_id TEXT NOT NULL,
      referred_user_id TEXT NOT NULL UNIQUE,
      referral_code TEXT NOT NULL,
      is_verified BOOLEAN DEFAULT true,
      created_at TIMESTAMPTZ DEFAULT NOW()
    );

    -- Indexes
    CREATE INDEX IF NOT EXISTS idx_admin_queue_status ON public.admin_review_queue(status, review_type);
    CREATE INDEX IF NOT EXISTS idx_audit_history_item ON public.staff_audit_history(item_id, item_type);
    CREATE INDEX IF NOT EXISTS idx_amb_app_user ON public.ambassador_applications(user_id);
    CREATE INDEX IF NOT EXISTS idx_amb_user ON public.ambassadors(user_id);
  `);
  console.log("Admin review queue, audit history, and ambassador tables created successfully.");
  process.exit(0);
}

main().catch(err => {
  console.error("Migration error:", err);
  process.exit(1);
});
