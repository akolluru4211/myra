-- ============================================================================
-- Migration: 20261110000000_daily_habit_loop_and_gamification.sql
-- Description: EdWorld Co. Daily Habit Loop & Unified Gamification Engine
-- Features:
--   1. IST Date Helper (Asia/Kolkata timezone native)
--   2. Unified user_stats (total_xp, level, streaks, freezes, weekly_xp)
--   3. Unified xp_events with strict (user_id, source, source_id) deduplication
--   4. Daily Challenges & Progress (1 DSA + 3 Aptitude + 1 Interview question)
--   5. Badges & User Badges with Streak and Leaderboard milestones
--   6. Study Squads, Squad Members (max 2/user), and Squad Realtime Messages
--   7. Leaderboard Snapshots & Weekly Leaderboard Materialized View
--   8. Notification Preferences & Quiet Hours (Asia/Kolkata)
--   9. Habit Analytics Events
--  10. Postgres Security Definer Functions:
--      - award_xp(user_id, source, source_id, xp)
--      - record_streak_action(user_id, action_type)
--      - purchase_streak_freeze(user_id)
--      - reconcile_nightly_streaks()
--      - reset_weekly_leaderboard_and_grant_freezes()
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1. IST HELPER FUNCTION (Asia/Kolkata)
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.ist_today()
RETURNS DATE AS $$
BEGIN
    RETURN (CURRENT_TIMESTAMP AT TIME ZONE 'Asia/Kolkata')::DATE;
END;
$$ LANGUAGE plpgsql STABLE;

CREATE OR REPLACE FUNCTION public.ist_now()
RETURNS TIMESTAMPTZ AS $$
BEGIN
    RETURN CURRENT_TIMESTAMP AT TIME ZONE 'Asia/Kolkata';
END;
$$ LANGUAGE plpgsql STABLE;

-- ----------------------------------------------------------------------------
-- 2. UNIFIED USER_STATS (Evolution & Migration from points)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.user_stats (
    user_id UUID PRIMARY KEY REFERENCES public.users(id) ON DELETE CASCADE,
    total_xp INTEGER NOT NULL DEFAULT 0,
    level INTEGER NOT NULL DEFAULT 1 CHECK (level >= 1 AND level <= 5),
    current_streak INTEGER NOT NULL DEFAULT 0,
    longest_streak INTEGER NOT NULL DEFAULT 0,
    last_streak_date DATE,
    streak_freezes INTEGER NOT NULL DEFAULT 1 CHECK (streak_freezes >= 0 AND streak_freezes <= 3),
    weekly_xp INTEGER NOT NULL DEFAULT 0,
    hide_from_global_leaderboard BOOLEAN NOT NULL DEFAULT FALSE,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Ensure all required columns exist if user_stats already existed
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'user_stats' AND column_name = 'total_xp') THEN
        ALTER TABLE public.user_stats ADD COLUMN total_xp INTEGER NOT NULL DEFAULT 0;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'user_stats' AND column_name = 'level') THEN
        ALTER TABLE public.user_stats ADD COLUMN level INTEGER NOT NULL DEFAULT 1 CHECK (level >= 1 AND level <= 5);
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'user_stats' AND column_name = 'last_streak_date') THEN
        ALTER TABLE public.user_stats ADD COLUMN last_streak_date DATE;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'user_stats' AND column_name = 'streak_freezes') THEN
        ALTER TABLE public.user_stats ADD COLUMN streak_freezes INTEGER NOT NULL DEFAULT 1 CHECK (streak_freezes >= 0 AND streak_freezes <= 3);
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'user_stats' AND column_name = 'weekly_xp') THEN
        ALTER TABLE public.user_stats ADD COLUMN weekly_xp INTEGER NOT NULL DEFAULT 0;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'user_stats' AND column_name = 'hide_from_global_leaderboard') THEN
        ALTER TABLE public.user_stats ADD COLUMN hide_from_global_leaderboard BOOLEAN NOT NULL DEFAULT FALSE;
    END IF;

    -- Migrate legacy points if points column exists
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'user_stats' AND column_name = 'points') THEN
        UPDATE public.user_stats
        SET total_xp = GREATEST(total_xp, points)
        WHERE points > 0;
    END IF;

    -- Migrate legacy last_active_date if present
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'user_stats' AND column_name = 'last_active_date') THEN
        UPDATE public.user_stats
        SET last_streak_date = COALESCE(last_streak_date, last_active_date)
        WHERE last_streak_date IS NULL AND last_active_date IS NOT NULL;
    END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_user_stats_weekly_xp ON public.user_stats(weekly_xp DESC);
CREATE INDEX IF NOT EXISTS idx_user_stats_total_xp ON public.user_stats(total_xp DESC);
CREATE INDEX IF NOT EXISTS idx_user_stats_streak ON public.user_stats(current_streak DESC);

-- ----------------------------------------------------------------------------
-- 3. UNIFIED XP_EVENTS (Server-Side Deduped Action Ledger)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.xp_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    source TEXT NOT NULL CHECK (source IN ('daily_challenge', 'problem', 'aptitude', 'interview', 'prep_task', 'squad_goal', 'badge', 'streak_freeze_purchase')),
    source_id TEXT NOT NULL,
    xp INTEGER NOT NULL,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Ensure source and xp columns exist if legacy xp_events existed
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'xp_events' AND column_name = 'source') THEN
        IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'xp_events' AND column_name = 'source_feature') THEN
            ALTER TABLE public.xp_events ADD COLUMN source TEXT DEFAULT 'problem';
            UPDATE public.xp_events SET source = 'problem' WHERE source IS NULL;
            ALTER TABLE public.xp_events ALTER COLUMN source SET NOT NULL;
        END IF;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'xp_events' AND column_name = 'xp') THEN
        IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'xp_events' AND column_name = 'amount') THEN
            ALTER TABLE public.xp_events ADD COLUMN xp INTEGER DEFAULT 0;
            UPDATE public.xp_events SET xp = COALESCE(amount, 0) WHERE xp IS NULL;
            ALTER TABLE public.xp_events ALTER COLUMN xp SET NOT NULL;
        END IF;
    END IF;
END $$;

CREATE UNIQUE INDEX IF NOT EXISTS uq_xp_events_user_source ON public.xp_events(user_id, source, source_id);
CREATE INDEX IF NOT EXISTS idx_xp_events_user_created ON public.xp_events(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_xp_events_source ON public.xp_events(source, source_id);

-- ----------------------------------------------------------------------------
-- 4. DAILY_CHALLENGES & CHALLENGE_PROGRESS
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.daily_challenges (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    challenge_date DATE NOT NULL,
    level TEXT NOT NULL CHECK (level IN ('beginner', 'intermediate', 'advanced')),
    problem_id UUID REFERENCES public.problems(id) ON DELETE SET NULL,
    aptitude_question_ids INT[] NOT NULL DEFAULT '{}',
    interview_question_id TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_daily_challenges_date_level UNIQUE (challenge_date, level)
);

ALTER TABLE public.daily_challenges
    ADD COLUMN IF NOT EXISTS level TEXT NOT NULL DEFAULT 'beginner'
        CHECK (level IN ('beginner', 'intermediate', 'advanced')),
    ADD COLUMN IF NOT EXISTS problem_id UUID REFERENCES public.problems(id) ON DELETE SET NULL,
    ADD COLUMN IF NOT EXISTS aptitude_question_ids INT[] NOT NULL DEFAULT '{}',
    ADD COLUMN IF NOT EXISTS interview_question_id TEXT;

ALTER TABLE public.daily_challenges DROP CONSTRAINT IF EXISTS daily_challenges_challenge_date_key;
CREATE UNIQUE INDEX IF NOT EXISTS uq_daily_challenges_date_level ON public.daily_challenges(challenge_date, level);
CREATE INDEX IF NOT EXISTS idx_daily_challenges_date_level ON public.daily_challenges(challenge_date, level);

CREATE TABLE IF NOT EXISTS public.challenge_progress (
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    challenge_id UUID NOT NULL REFERENCES public.daily_challenges(id) ON DELETE CASCADE,
    items JSONB NOT NULL DEFAULT '[]'::jsonb,
    items_done INTEGER NOT NULL DEFAULT 0 CHECK (items_done >= 0 AND items_done <= 5),
    completed BOOLEAN NOT NULL DEFAULT FALSE,
    completed_at TIMESTAMPTZ,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    PRIMARY KEY (user_id, challenge_id)
);

CREATE INDEX IF NOT EXISTS idx_challenge_progress_user ON public.challenge_progress(user_id);
CREATE INDEX IF NOT EXISTS idx_challenge_progress_challenge ON public.challenge_progress(challenge_id);
CREATE INDEX IF NOT EXISTS idx_challenge_progress_completed ON public.challenge_progress(completed, completed_at DESC);

-- ----------------------------------------------------------------------------
-- 5. BADGES & USER_BADGES
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.badges (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    description TEXT NOT NULL,
    category TEXT NOT NULL CHECK (category IN ('streak', 'xp', 'leaderboard', 'squad', 'special')),
    icon TEXT NOT NULL DEFAULT 'Flame',
    tier TEXT NOT NULL DEFAULT 'bronze' CHECK (tier IN ('bronze', 'silver', 'gold', 'platinum', 'legendary')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.badges
    ADD COLUMN IF NOT EXISTS category TEXT NOT NULL DEFAULT 'special'
        CHECK (category IN ('streak', 'xp', 'leaderboard', 'squad', 'special')),
    ADD COLUMN IF NOT EXISTS tier TEXT NOT NULL DEFAULT 'bronze'
        CHECK (tier IN ('bronze', 'silver', 'gold', 'platinum', 'legendary')),
    ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ NOT NULL DEFAULT NOW();

CREATE TABLE IF NOT EXISTS public.user_badges (
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    badge_id UUID NOT NULL REFERENCES public.badges(id) ON DELETE CASCADE,
    earned_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    PRIMARY KEY (user_id, badge_id)
);

CREATE INDEX IF NOT EXISTS idx_user_badges_user_id ON public.user_badges(user_id);
CREATE INDEX IF NOT EXISTS idx_user_badges_badge_id ON public.user_badges(badge_id);

-- Seed Canonical Habit Milestone Badges
INSERT INTO public.badges (code, name, description, category, icon, tier)
VALUES 
    ('streak-3', '3-Day Spark', 'Completed streak actions 3 days in a row', 'streak', 'Zap', 'bronze'),
    ('streak-7', '7-Day Unstoppable', 'Maintained a solid 7-day learning habit', 'streak', 'Flame', 'silver'),
    ('streak-14', 'Fortnight Warrior', '14 consecutive days of engineering discipline', 'streak', 'ShieldCheck', 'silver'),
    ('streak-30', 'Monthly Titan', '30-day streak unbroken', 'streak', 'Award', 'gold'),
    ('streak-60', 'Diamond Habit', '60 days of relentless growth', 'streak', 'Gem', 'platinum'),
    ('streak-100', 'Centurion Legend', '100 days of placement readiness', 'streak', 'Crown', 'legendary'),
    ('squad-weekly-goal', 'Squad Goal Master', 'Hit squad weekly XP target together', 'squad', 'Users', 'gold'),
    ('top-10-week', 'Weekly Top 10 Elite', 'Ranked in the top 10 on the weekly leaderboard', 'leaderboard', 'Trophy', 'gold'),
    ('lvl-2-learner', 'Level 2 Learner', 'Earned 500 XP and unlocked Level 2', 'xp', 'CheckCircle', 'bronze'),
    ('lvl-3-builder', 'Level 3 Builder', 'Earned 1,500 XP and unlocked Level 3', 'xp', 'Layers', 'silver'),
    ('lvl-4-pro', 'Level 4 Pro', 'Earned 4,000 XP and unlocked Level 4', 'xp', 'Star', 'gold'),
    ('lvl-5-placement-ready', 'Level 5 Placement Ready', 'Earned 8,000 XP and reached top platform readiness', 'xp', 'Target', 'platinum')
ON CONFLICT (code) DO UPDATE
SET name = EXCLUDED.name,
    description = EXCLUDED.description,
    category = EXCLUDED.category,
    icon = EXCLUDED.icon,
    tier = EXCLUDED.tier;

-- ----------------------------------------------------------------------------
-- 6. STUDY SQUADS & SQUAD MEMBERS
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.squads (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    college_id UUID REFERENCES public.colleges(id) ON DELETE SET NULL,
    goal_type TEXT NOT NULL DEFAULT 'placement' CHECK (goal_type IN ('placement', 'dsa', 'gate', 'core_engineering', 'general')),
    weekly_target_xp INTEGER NOT NULL DEFAULT 1000,
    invite_code VARCHAR(6) UNIQUE NOT NULL,
    squad_streak INTEGER NOT NULL DEFAULT 0,
    max_members INTEGER NOT NULL DEFAULT 6,
    created_by UUID REFERENCES public.users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.squads
    ADD COLUMN IF NOT EXISTS college_id UUID REFERENCES public.colleges(id) ON DELETE SET NULL,
    ADD COLUMN IF NOT EXISTS goal_type TEXT NOT NULL DEFAULT 'placement'
        CHECK (goal_type IN ('placement', 'dsa', 'gate', 'core_engineering', 'general')),
    ADD COLUMN IF NOT EXISTS weekly_target_xp INTEGER NOT NULL DEFAULT 1000,
    ADD COLUMN IF NOT EXISTS invite_code VARCHAR(6) UNIQUE,
    ADD COLUMN IF NOT EXISTS squad_streak INTEGER NOT NULL DEFAULT 0;

CREATE INDEX IF NOT EXISTS idx_squads_college ON public.squads(college_id);
CREATE INDEX IF NOT EXISTS idx_squads_invite_code ON public.squads(invite_code);
CREATE INDEX IF NOT EXISTS idx_squads_created_by ON public.squads(created_by);

CREATE TABLE IF NOT EXISTS public.squad_members (
    squad_id UUID NOT NULL REFERENCES public.squads(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    role TEXT NOT NULL DEFAULT 'member' CHECK (role IN ('leader', 'member')),
    joined_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    PRIMARY KEY (squad_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_squad_members_user ON public.squad_members(user_id);
CREATE INDEX IF NOT EXISTS idx_squad_members_squad ON public.squad_members(squad_id);

-- Enforce Max 2 Squads Per Student via Trigger
CREATE OR REPLACE FUNCTION public.check_max_squads_per_user()
RETURNS TRIGGER AS $$
BEGIN
    IF (SELECT COUNT(*) FROM public.squad_members WHERE user_id = NEW.user_id) >= 2 THEN
        RAISE EXCEPTION 'A student can participate in at most 2 study squads simultaneously.';
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_check_max_squads_per_user ON public.squad_members;
CREATE TRIGGER trg_check_max_squads_per_user
    BEFORE INSERT ON public.squad_members
    FOR EACH ROW
    EXECUTE FUNCTION public.check_max_squads_per_user();

-- ----------------------------------------------------------------------------
-- 7. SQUAD MESSAGES (Supabase Realtime Chat with 1000 char limit)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.squad_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    squad_id UUID NOT NULL REFERENCES public.squads(id) ON DELETE CASCADE,
    sender_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    body TEXT NOT NULL CHECK (char_length(body) > 0 AND char_length(body) <= 1000),
    is_system BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_squad_messages_squad_created ON public.squad_messages(squad_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_squad_messages_sender ON public.squad_messages(sender_id);

-- Enable Supabase Realtime for Squad Messages
ALTER PUBLICATION supabase_realtime ADD TABLE public.squad_messages;

-- ----------------------------------------------------------------------------
-- 8. LEADERBOARD SNAPSHOTS
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.leaderboard_snapshots (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    scope TEXT NOT NULL CHECK (scope IN ('college', 'branch', 'squad', 'global')),
    scope_id TEXT NOT NULL DEFAULT 'global',
    week TEXT NOT NULL, -- Format: YYYY-Www, e.g. 2026-W45
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    rank INTEGER NOT NULL,
    xp INTEGER NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_leaderboard_snapshots_lookup 
    ON public.leaderboard_snapshots(scope, scope_id, week, rank);
CREATE INDEX IF NOT EXISTS idx_leaderboard_snapshots_user 
    ON public.leaderboard_snapshots(user_id, week);

-- ----------------------------------------------------------------------------
-- 9. NOTIFICATION PREFERENCES
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.notification_prefs (
    user_id UUID PRIMARY KEY REFERENCES public.users(id) ON DELETE CASCADE,
    streak_reminder BOOLEAN NOT NULL DEFAULT TRUE,
    squad_activity BOOLEAN NOT NULL DEFAULT TRUE,
    reminder_hour INTEGER NOT NULL DEFAULT 20 CHECK (reminder_hour >= 0 AND reminder_hour <= 23),
    quiet_start INTEGER NOT NULL DEFAULT 23 CHECK (quiet_start >= 0 AND quiet_start <= 23),
    quiet_end INTEGER NOT NULL DEFAULT 7 CHECK (quiet_end >= 0 AND quiet_end <= 23),
    email_channel BOOLEAN NOT NULL DEFAULT TRUE,
    in_app_channel BOOLEAN NOT NULL DEFAULT TRUE,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ----------------------------------------------------------------------------
-- 10. HABIT ANALYTICS EVENTS
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.habit_analytics_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_name TEXT NOT NULL,
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_habit_analytics_event ON public.habit_analytics_events(event_name, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_habit_analytics_user ON public.habit_analytics_events(user_id, created_at DESC);

-- ----------------------------------------------------------------------------
-- 11. MATERIALIZED VIEW: WEEKLY LEADERBOARDS (Refreshed Every 5 Minutes)
-- ----------------------------------------------------------------------------
CREATE MATERIALIZED VIEW IF NOT EXISTS public.mv_weekly_leaderboards AS
SELECT 
    'global'::TEXT AS scope,
    'global'::TEXT AS scope_id,
    u.id AS user_id,
    COALESCE(p.name, u.name, 'Student') AS display_name,
    p.avatar_url,
    c.name AS college_name,
    c.id::TEXT AS college_id,
    p.branch,
    s.weekly_xp,
    s.current_streak,
    s.level,
    DENSE_RANK() OVER (ORDER BY s.weekly_xp DESC, s.total_xp DESC) AS rank
FROM public.user_stats s
JOIN public.users u ON u.id = s.user_id
LEFT JOIN public.profiles p ON p.id = u.id
LEFT JOIN public.colleges c ON c.id = p.college_id
WHERE s.hide_from_global_leaderboard IS FALSE AND s.weekly_xp > 0

UNION ALL

SELECT 
    'college'::TEXT AS scope,
    c.id::TEXT AS scope_id,
    u.id AS user_id,
    COALESCE(p.name, u.name, 'Student') AS display_name,
    p.avatar_url,
    c.name AS college_name,
    c.id::TEXT AS college_id,
    p.branch,
    s.weekly_xp,
    s.current_streak,
    s.level,
    DENSE_RANK() OVER (PARTITION BY c.id ORDER BY s.weekly_xp DESC, s.total_xp DESC) AS rank
FROM public.user_stats s
JOIN public.users u ON u.id = s.user_id
JOIN public.profiles p ON p.id = u.id
JOIN public.colleges c ON c.id = p.college_id
WHERE s.weekly_xp > 0

UNION ALL

SELECT 
    'branch'::TEXT AS scope,
    CONCAT(c.id::TEXT, ':', p.branch) AS scope_id,
    u.id AS user_id,
    COALESCE(p.name, u.name, 'Student') AS display_name,
    p.avatar_url,
    c.name AS college_name,
    c.id::TEXT AS college_id,
    p.branch,
    s.weekly_xp,
    s.current_streak,
    s.level,
    DENSE_RANK() OVER (PARTITION BY c.id, p.branch ORDER BY s.weekly_xp DESC, s.total_xp DESC) AS rank
FROM public.user_stats s
JOIN public.users u ON u.id = s.user_id
JOIN public.profiles p ON p.id = u.id
JOIN public.colleges c ON c.id = p.college_id
WHERE p.branch IS NOT NULL AND s.weekly_xp > 0

UNION ALL

SELECT 
    'squad'::TEXT AS scope,
    sq.id::TEXT AS scope_id,
    u.id AS user_id,
    COALESCE(p.name, u.name, 'Student') AS display_name,
    p.avatar_url,
    c.name AS college_name,
    c.id::TEXT AS college_id,
    p.branch,
    s.weekly_xp,
    s.current_streak,
    s.level,
    DENSE_RANK() OVER (PARTITION BY sq.id ORDER BY s.weekly_xp DESC, s.total_xp DESC) AS rank
FROM public.squad_members sm
JOIN public.squads sq ON sq.id = sm.squad_id
JOIN public.user_stats s ON s.user_id = sm.user_id
JOIN public.users u ON u.id = sm.user_id
LEFT JOIN public.profiles p ON p.id = u.id
LEFT JOIN public.colleges c ON c.id = p.college_id;

CREATE UNIQUE INDEX IF NOT EXISTS uq_mv_weekly_leaderboards 
    ON public.mv_weekly_leaderboards(scope, scope_id, user_id);
CREATE INDEX IF NOT EXISTS idx_mv_weekly_leaderboards_rank 
    ON public.mv_weekly_leaderboards(scope, scope_id, rank);

-- ----------------------------------------------------------------------------
-- 12. ROW LEVEL SECURITY (RLS) POLICIES
-- ----------------------------------------------------------------------------
ALTER TABLE public.user_stats ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.xp_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.daily_challenges ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.challenge_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.badges ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_badges ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.squads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.squad_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.squad_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.leaderboard_snapshots ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notification_prefs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.habit_analytics_events ENABLE ROW LEVEL SECURITY;

-- user_stats: Users read own or limited via leaderboard view; write only via server functions
DROP POLICY IF EXISTS "user_stats_select_own" ON public.user_stats;
CREATE POLICY "user_stats_select_own" ON public.user_stats
    FOR SELECT TO authenticated
    USING (user_id = (SELECT auth.uid()));

DROP POLICY IF EXISTS "user_stats_update_own_prefs" ON public.user_stats;
CREATE POLICY "user_stats_update_own_prefs" ON public.user_stats
    FOR UPDATE TO authenticated
    USING (user_id = (SELECT auth.uid()))
    WITH CHECK (user_id = (SELECT auth.uid()));

-- xp_events: Users can only read their own XP transactions; inserts only via SECURITY DEFINER
DROP POLICY IF EXISTS "xp_events_select_own" ON public.xp_events;
CREATE POLICY "xp_events_select_own" ON public.xp_events
    FOR SELECT TO authenticated
    USING (user_id = (SELECT auth.uid()));

-- daily_challenges: Readable by all signed-in users
DROP POLICY IF EXISTS "daily_challenges_select_all" ON public.daily_challenges;
CREATE POLICY "daily_challenges_select_all" ON public.daily_challenges
    FOR SELECT TO authenticated
    USING (TRUE);

-- challenge_progress: Users read and write own progress
DROP POLICY IF EXISTS "challenge_progress_select_own" ON public.challenge_progress;
CREATE POLICY "challenge_progress_select_own" ON public.challenge_progress
    FOR SELECT TO authenticated
    USING (user_id = (SELECT auth.uid()));

DROP POLICY IF EXISTS "challenge_progress_upsert_own" ON public.challenge_progress;
CREATE POLICY "challenge_progress_upsert_own" ON public.challenge_progress
    FOR ALL TO authenticated
    USING (user_id = (SELECT auth.uid()))
    WITH CHECK (user_id = (SELECT auth.uid()));

-- badges: Readable by all users
DROP POLICY IF EXISTS "badges_select_all" ON public.badges;
CREATE POLICY "badges_select_all" ON public.badges
    FOR SELECT TO authenticated
    USING (TRUE);

-- user_badges: Users can read anyone's earned badges (for profile verification)
DROP POLICY IF EXISTS "user_badges_select_all" ON public.user_badges;
CREATE POLICY "user_badges_select_all" ON public.user_badges
    FOR SELECT TO authenticated
    USING (TRUE);

-- squads: Signed in users can read public/college squads or squads they belong to
DROP POLICY IF EXISTS "squads_select_members_or_open" ON public.squads;
CREATE POLICY "squads_select_members_or_open" ON public.squads
    FOR SELECT TO authenticated
    USING (TRUE);

DROP POLICY IF EXISTS "squads_insert_authenticated" ON public.squads;
CREATE POLICY "squads_insert_authenticated" ON public.squads
    FOR INSERT TO authenticated
    WITH CHECK (created_by = (SELECT auth.uid()));

DROP POLICY IF EXISTS "squads_update_leader" ON public.squads;
CREATE POLICY "squads_update_leader" ON public.squads
    FOR UPDATE TO authenticated
    USING (created_by = (SELECT auth.uid()))
    WITH CHECK (created_by = (SELECT auth.uid()));

-- squad_members: Members can read fellow members' basic info; insert/delete for self or leader
DROP POLICY IF EXISTS "squad_members_select" ON public.squad_members;
CREATE POLICY "squad_members_select" ON public.squad_members
    FOR SELECT TO authenticated
    USING (
        squad_id IN (
            SELECT sm.squad_id FROM public.squad_members sm 
            WHERE sm.user_id = (SELECT auth.uid())
        )
    );

DROP POLICY IF EXISTS "squad_members_insert_self" ON public.squad_members;
CREATE POLICY "squad_members_insert_self" ON public.squad_members
    FOR INSERT TO authenticated
    WITH CHECK (user_id = (SELECT auth.uid()));

DROP POLICY IF EXISTS "squad_members_delete_self_or_leader" ON public.squad_members;
CREATE POLICY "squad_members_delete_self_or_leader" ON public.squad_members
    FOR DELETE TO authenticated
    USING (
        user_id = (SELECT auth.uid()) 
        OR squad_id IN (
            SELECT sq.id FROM public.squads sq 
            WHERE sq.created_by = (SELECT auth.uid())
        )
    );

-- squad_messages: Only active squad members can read and post
DROP POLICY IF EXISTS "squad_messages_select_members" ON public.squad_messages;
CREATE POLICY "squad_messages_select_members" ON public.squad_messages
    FOR SELECT TO authenticated
    USING (
        squad_id IN (
            SELECT sm.squad_id FROM public.squad_members sm 
            WHERE sm.user_id = (SELECT auth.uid())
        )
    );

DROP POLICY IF EXISTS "squad_messages_insert_members" ON public.squad_messages;
CREATE POLICY "squad_messages_insert_members" ON public.squad_messages
    FOR INSERT TO authenticated
    WITH CHECK (
        sender_id = (SELECT auth.uid())
        AND squad_id IN (
            SELECT sm.squad_id FROM public.squad_members sm 
            WHERE sm.user_id = (SELECT auth.uid())
        )
    );

-- leaderboard_snapshots: Readable by authenticated users
DROP POLICY IF EXISTS "leaderboard_snapshots_select" ON public.leaderboard_snapshots;
CREATE POLICY "leaderboard_snapshots_select" ON public.leaderboard_snapshots
    FOR SELECT TO authenticated
    USING (TRUE);

-- notification_prefs: Users read and modify their own preferences
DROP POLICY IF EXISTS "notification_prefs_all_own" ON public.notification_prefs;
CREATE POLICY "notification_prefs_all_own" ON public.notification_prefs
    FOR ALL TO authenticated
    USING (user_id = (SELECT auth.uid()))
    WITH CHECK (user_id = (SELECT auth.uid()));

-- habit_analytics_events: Authenticated users can insert their own events
DROP POLICY IF EXISTS "habit_analytics_insert_own" ON public.habit_analytics_events;
CREATE POLICY "habit_analytics_insert_own" ON public.habit_analytics_events
    FOR INSERT TO authenticated
    WITH CHECK (user_id = (SELECT auth.uid()));

-- ----------------------------------------------------------------------------
-- 13. SERVER-SIDE FUNCTIONS (SECURITY DEFINER)
-- ----------------------------------------------------------------------------

-- A) award_xp(user_id, source, source_id, xp)
-- Single atomic entry point for awarding XP. Clients cannot modify XP directly.
CREATE OR REPLACE FUNCTION public.award_xp(
    p_user_id UUID,
    p_source TEXT,
    p_source_id TEXT,
    p_xp INTEGER,
    p_metadata JSONB DEFAULT '{}'::jsonb
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
    v_inserted_id UUID;
    v_total_xp INTEGER;
    v_weekly_xp INTEGER;
    v_old_level INTEGER;
    v_new_level INTEGER;
    v_level_up BOOLEAN := FALSE;
    v_badge_earned TEXT := NULL;
BEGIN
    -- 1. Ensure user_stats record exists
    INSERT INTO public.user_stats (user_id, total_xp, weekly_xp, level, current_streak, longest_streak)
    VALUES (p_user_id, 0, 0, 1, 0, 0)
    ON CONFLICT (user_id) DO NOTHING;

    -- 2. Insert into xp_events ledger with deduplication check
    INSERT INTO public.xp_events (user_id, source, source_id, xp, metadata)
    VALUES (p_user_id, p_source, p_source_id, p_xp, p_metadata)
    ON CONFLICT (user_id, source, source_id) DO NOTHING
    RETURNING id INTO v_inserted_id;

    -- If duplicate action, return current state without double-awarding
    IF v_inserted_id IS NULL AND p_xp > 0 THEN
        SELECT total_xp, weekly_xp, level INTO v_total_xp, v_weekly_xp, v_new_level
        FROM public.user_stats WHERE user_id = p_user_id;

        RETURN jsonb_build_object(
            'success', FALSE,
            'reason', 'DUPLICATE_ACTION',
            'awarded', 0,
            'total_xp', v_total_xp,
            'weekly_xp', v_weekly_xp,
            'level', v_new_level,
            'level_up', FALSE
        );
    END IF;

    -- 3. Update user_stats total_xp and weekly_xp
    UPDATE public.user_stats
    SET 
        total_xp = GREATEST(0, total_xp + p_xp),
        weekly_xp = GREATEST(0, weekly_xp + p_xp),
        updated_at = NOW()
    WHERE user_id = p_user_id
    RETURNING total_xp, weekly_xp, level INTO v_total_xp, v_weekly_xp, v_old_level;

    -- 4. Calculate new Level based on total_xp
    -- Levels: 1 Foundations (0) · 2 Learner (500) · 3 Builder (1,500) · 4 Pro (4,000) · 5 Placement Ready (8,000)
    IF v_total_xp >= 8000 THEN
        v_new_level := 5;
    ELSIF v_total_xp >= 4000 THEN
        v_new_level := 4;
    ELSIF v_total_xp >= 1500 THEN
        v_new_level := 3;
    ELSIF v_total_xp >= 500 THEN
        v_new_level := 2;
    ELSE
        v_new_level := 1;
    END IF;

    IF v_new_level > v_old_level THEN
        v_level_up := TRUE;
        UPDATE public.user_stats SET level = v_new_level WHERE user_id = p_user_id;

        -- Award level badge
        IF v_new_level = 2 THEN
            INSERT INTO public.user_badges (user_id, badge_id)
            SELECT p_user_id, b.id FROM public.badges b WHERE b.code = 'lvl-2-learner'
            ON CONFLICT DO NOTHING;
            v_badge_earned := 'lvl-2-learner';
        ELSIF v_new_level = 3 THEN
            INSERT INTO public.user_badges (user_id, badge_id)
            SELECT p_user_id, b.id FROM public.badges b WHERE b.code = 'lvl-3-builder'
            ON CONFLICT DO NOTHING;
            v_badge_earned := 'lvl-3-builder';
        ELSIF v_new_level = 4 THEN
            INSERT INTO public.user_badges (user_id, badge_id)
            SELECT p_user_id, b.id FROM public.badges b WHERE b.code = 'lvl-4-pro'
            ON CONFLICT DO NOTHING;
            v_badge_earned := 'lvl-4-pro';
        ELSIF v_new_level = 5 THEN
            INSERT INTO public.user_badges (user_id, badge_id)
            SELECT p_user_id, b.id FROM public.badges b WHERE b.code = 'lvl-5-placement-ready'
            ON CONFLICT DO NOTHING;
            v_badge_earned := 'lvl-5-placement-ready';
        END IF;
    END IF;

    RETURN jsonb_build_object(
        'success', TRUE,
        'awarded', p_xp,
        'total_xp', v_total_xp,
        'weekly_xp', v_weekly_xp,
        'level', v_new_level,
        'level_up', v_level_up,
        'badge_earned', v_badge_earned
    );
END;
$$;

-- B) record_streak_action(user_id, action_type)
-- Evaluates streak criteria against Asia/Kolkata date boundary
CREATE OR REPLACE FUNCTION public.record_streak_action(
    p_user_id UUID,
    p_action_type TEXT -- 'daily_challenge' or 'prep_task'
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
    v_today DATE;
    v_yesterday DATE;
    v_last_streak_date DATE;
    v_current_streak INTEGER;
    v_longest_streak INTEGER;
    v_new_streak INTEGER;
    v_badge_earned TEXT := NULL;
    v_streak_updated BOOLEAN := FALSE;
BEGIN
    v_today := public.ist_today();
    v_yesterday := v_today - INTERVAL '1 day';

    -- Fetch current streak state
    SELECT last_streak_date, current_streak, longest_streak 
    INTO v_last_streak_date, v_current_streak, v_longest_streak
    FROM public.user_stats 
    WHERE user_id = p_user_id;

    IF v_last_streak_date IS NULL THEN
        -- First ever streak activity
        v_new_streak := 1;
        v_streak_updated := TRUE;
    ELSIF v_last_streak_date = v_today THEN
        -- Already completed a streak action today; keep current streak intact
        v_new_streak := v_current_streak;
        v_streak_updated := FALSE;
    ELSIF v_last_streak_date = v_yesterday THEN
        -- Consecutive day: increment streak
        v_new_streak := v_current_streak + 1;
        v_streak_updated := TRUE;
    ELSE
        -- Missed days without an active freeze: streak resets to 1
        v_new_streak := 1;
        v_streak_updated := TRUE;
    END IF;

    IF v_streak_updated THEN
        UPDATE public.user_stats
        SET 
            current_streak = v_new_streak,
            longest_streak = GREATEST(longest_streak, v_new_streak),
            last_streak_date = v_today,
            updated_at = NOW()
        WHERE user_id = p_user_id;

        -- Check streak milestone badges: 3, 7, 14, 30, 60, 100 days
        IF v_new_streak >= 100 THEN
            INSERT INTO public.user_badges (user_id, badge_id)
            SELECT p_user_id, b.id FROM public.badges b WHERE b.code = 'streak-100'
            ON CONFLICT DO NOTHING;
            v_badge_earned := 'streak-100';
        ELSIF v_new_streak >= 60 THEN
            INSERT INTO public.user_badges (user_id, badge_id)
            SELECT p_user_id, b.id FROM public.badges b WHERE b.code = 'streak-60'
            ON CONFLICT DO NOTHING;
            v_badge_earned := 'streak-60';
        ELSIF v_new_streak >= 30 THEN
            INSERT INTO public.user_badges (user_id, badge_id)
            SELECT p_user_id, b.id FROM public.badges b WHERE b.code = 'streak-30'
            ON CONFLICT DO NOTHING;
            v_badge_earned := 'streak-30';
        ELSIF v_new_streak >= 14 THEN
            INSERT INTO public.user_badges (user_id, badge_id)
            SELECT p_user_id, b.id FROM public.badges b WHERE b.code = 'streak-14'
            ON CONFLICT DO NOTHING;
            v_badge_earned := 'streak-14';
        ELSIF v_new_streak >= 7 THEN
            INSERT INTO public.user_badges (user_id, badge_id)
            SELECT p_user_id, b.id FROM public.badges b WHERE b.code = 'streak-7'
            ON CONFLICT DO NOTHING;
            v_badge_earned := 'streak-7';
        ELSIF v_new_streak >= 3 THEN
            INSERT INTO public.user_badges (user_id, badge_id)
            SELECT p_user_id, b.id FROM public.badges b WHERE b.code = 'streak-3'
            ON CONFLICT DO NOTHING;
            v_badge_earned := 'streak-3';
        END IF;

        -- Log analytics event
        INSERT INTO public.habit_analytics_events (event_name, user_id, metadata)
        VALUES ('streak_incremented', p_user_id, jsonb_build_object(
            'streak', v_new_streak,
            'action_type', p_action_type,
            'date', v_today
        ));
    END IF;

    RETURN jsonb_build_object(
        'current_streak', v_new_streak,
        'longest_streak', GREATEST(v_longest_streak, v_new_streak),
        'last_streak_date', v_today,
        'streak_updated', v_streak_updated,
        'badge_earned', v_badge_earned
    );
END;
$$;

-- C) purchase_streak_freeze(user_id)
-- Consumes 200 XP to purchase 1 extra freeze (max 3 stored, max 1 purchase/week)
CREATE OR REPLACE FUNCTION public.purchase_streak_freeze(p_user_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
    v_total_xp INTEGER;
    v_freezes INTEGER;
    v_current_week TEXT;
    v_recent_purchase BOOLEAN;
BEGIN
    v_current_week := TO_CHAR(public.ist_today(), 'IYYY-IW');

    SELECT total_xp, streak_freezes INTO v_total_xp, v_freezes
    FROM public.user_stats WHERE user_id = p_user_id;

    IF v_freezes >= 3 THEN
        RETURN jsonb_build_object('success', FALSE, 'error', 'MAX_FREEZES_REACHED');
    END IF;

    IF v_total_xp < 200 THEN
        RETURN jsonb_build_object('success', FALSE, 'error', 'INSUFFICIENT_XP');
    END IF;

    -- Check if user already purchased a freeze this week
    SELECT EXISTS (
        SELECT 1 FROM public.xp_events
        WHERE user_id = p_user_id 
          AND source = 'streak_freeze_purchase'
          AND source_id = v_current_week
    ) INTO v_recent_purchase;

    IF v_recent_purchase THEN
        RETURN jsonb_build_object('success', FALSE, 'error', 'WEEKLY_LIMIT_EXCEEDED');
    END IF;

    -- Deduct 200 XP via xp_events ledger
    INSERT INTO public.xp_events (user_id, source, source_id, xp, metadata)
    VALUES (p_user_id, 'streak_freeze_purchase', v_current_week, -200, jsonb_build_object('week', v_current_week));

    -- Update user_stats
    UPDATE public.user_stats
    SET 
        total_xp = total_xp - 200,
        streak_freezes = streak_freezes + 1,
        updated_at = NOW()
    WHERE user_id = p_user_id
    RETURNING total_xp, streak_freezes INTO v_total_xp, v_freezes;

    INSERT INTO public.habit_analytics_events (event_name, user_id, metadata)
    VALUES ('freeze_purchased', p_user_id, jsonb_build_object('freezes_held', v_freezes));

    RETURN jsonb_build_object('success', TRUE, 'total_xp', v_total_xp, 'streak_freezes', v_freezes);
END;
$$;

-- D) reconcile_nightly_streaks() (Runs at 00:10 IST)
-- For students who missed yesterday: use a freeze if available; otherwise reset streak to 0
CREATE OR REPLACE FUNCTION public.reconcile_nightly_streaks()
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
    v_today DATE;
    v_yesterday DATE;
    v_freezes_used INTEGER := 0;
    v_streaks_reset INTEGER := 0;
BEGIN
    v_today := public.ist_today();
    v_yesterday := v_today - INTERVAL '1 day';

    -- 1. Apply streak freezes for users with active streak who missed yesterday
    WITH frozen_users AS (
        UPDATE public.user_stats
        SET 
            streak_freezes = streak_freezes - 1,
            last_streak_date = v_yesterday, -- Protect streak by pretending yesterday was active
            updated_at = NOW()
        WHERE current_streak > 0 
          AND (last_streak_date IS NULL OR last_streak_date < v_yesterday)
          AND streak_freezes > 0
        RETURNING user_id
    )
    SELECT COUNT(*) INTO v_freezes_used FROM frozen_users;

    -- 2. Reset streaks for users who missed yesterday and had zero freezes remaining
    WITH reset_users AS (
        UPDATE public.user_stats
        SET 
            current_streak = 0,
            updated_at = NOW()
        WHERE current_streak > 0
          AND (last_streak_date IS NULL OR last_streak_date < v_yesterday)
          AND streak_freezes = 0
        RETURNING user_id
    )
    SELECT COUNT(*) INTO v_streaks_reset FROM reset_users;

    RETURN jsonb_build_object(
        'success', TRUE,
        'date', v_today,
        'freezes_consumed', v_freezes_used,
        'streaks_reset', v_streaks_reset
    );
END;
$$;

-- E) reset_weekly_leaderboard_and_grant_freezes() (Runs Monday 00:05 IST)
-- Grants 1 free freeze (max 3), snapshots final rankings, awards Top 10 badges, and resets weekly_xp
CREATE OR REPLACE FUNCTION public.reset_weekly_leaderboard_and_grant_freezes()
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
    v_past_week TEXT;
    v_snapshot_count INTEGER := 0;
BEGIN
    -- Past week ISO code: e.g. 2026-W44
    v_past_week := TO_CHAR(public.ist_today() - INTERVAL '1 day', 'IYYY-IW');

    -- 1. Snapshot top 50 in each scope to leaderboard_snapshots
    INSERT INTO public.leaderboard_snapshots (scope, scope_id, week, user_id, rank, xp)
    SELECT scope, scope_id, v_past_week, user_id, rank, weekly_xp
    FROM public.mv_weekly_leaderboards
    WHERE rank <= 50;

    GET DIAGNOSTICS v_snapshot_count = ROW_COUNT;

    -- 2. Award "top-10-week" badge to top 10 global students
    INSERT INTO public.user_badges (user_id, badge_id)
    SELECT ml.user_id, b.id
    FROM public.mv_weekly_leaderboards ml
    CROSS JOIN public.badges b
    WHERE ml.scope = 'global' AND ml.rank <= 10 AND b.code = 'top-10-week'
    ON CONFLICT DO NOTHING;

    -- 3. Grant 1 free streak freeze every Monday (max 3 stored)
    UPDATE public.user_stats
    SET streak_freezes = LEAST(3, streak_freezes + 1)
    WHERE streak_freezes < 3;

    -- 4. Reset weekly_xp for all users
    UPDATE public.user_stats
    SET weekly_xp = 0;

    -- 5. Refresh Materialized View
    REFRESH MATERIALIZED VIEW CONCURRENTLY public.mv_weekly_leaderboards;

    RETURN jsonb_build_object(
        'success', TRUE,
        'week_snapshotted', v_past_week,
        'records_snapshotted', v_snapshot_count
    );
END;
$$;
