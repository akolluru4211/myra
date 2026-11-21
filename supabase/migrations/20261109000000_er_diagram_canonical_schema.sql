-- ============================================================================
-- Migration: 20261109000000_er_diagram_canonical_schema.sql
-- Description: Canonical Schema Alignment for 24 Entities & 23 Relationships:
--   COLLEGES ||--o{ USERS
--   USERS ||--o{ USER_SKILLS }o--|| SKILLS
--   USERS ||--o{ SUBMISSIONS }o--|| PROBLEMS ||--o{ TEST_CASES
--   USERS ||--o{ APTITUDE_ATTEMPTS }o--|| APTITUDE_TESTS
--   USERS ||--o{ CHALLENGE_COMPLETIONS }o--|| DAILY_CHALLENGES
--   USERS ||--|| USER_STATS
--   USERS ||--o{ XP_EVENTS
--   USERS ||--o{ USER_BADGES }o--|| BADGES
--   USERS ||--o{ SQUAD_MEMBERS }o--|| SQUADS
--   USERS ||--o{ PROJECTS (owns)
--   PROJECTS ||--o{ PROJECT_MEMBERS
--   PROJECTS ||--o{ PROJECT_APPLICATIONS
--   PROJECTS ||--o{ PROJECT_TASKS
--   USERS ||--o{ INTERVIEW_SESSIONS ||--o{ INTERVIEW_FEEDBACK
--   USERS ||--o{ NOTIFICATIONS
-- Includes:
--   - Foreign keys with ON DELETE CASCADE / SET NULL
--   - B-tree indexing on all foreign keys to prevent full sequential scans
--   - Row-Level Security (RLS) with cached (SELECT auth.uid()) subqueries
--   - Zero data loss, fully idempotent IF NOT EXISTS guards
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1. COLLEGES & USERS
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.colleges (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    slug TEXT UNIQUE,
    location TEXT NOT NULL,
    state TEXT,
    tier TEXT DEFAULT 'tier-2',
    courses TEXT[] NOT NULL DEFAULT '{}',
    fee_range TEXT,
    typical_cutoff_range TEXT,
    source_url TEXT,
    verified BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_colleges_slug ON public.colleges(slug);
CREATE INDEX IF NOT EXISTS idx_colleges_location ON public.colleges(location);

-- Add college_id reference to users and profiles if missing
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'users') THEN
        IF NOT EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_schema = 'public' AND table_name = 'users' AND column_name = 'college_id'
        ) THEN
            ALTER TABLE public.users ADD COLUMN college_id UUID REFERENCES public.colleges(id) ON DELETE SET NULL;
            CREATE INDEX IF NOT EXISTS idx_users_college_id ON public.users(college_id);
        END IF;
    END IF;

    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'profiles') THEN
        IF NOT EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_schema = 'public' AND table_name = 'profiles' AND column_name = 'college_id'
        ) THEN
            ALTER TABLE public.profiles ADD COLUMN college_id UUID REFERENCES public.colleges(id) ON DELETE SET NULL;
            CREATE INDEX IF NOT EXISTS idx_profiles_college_id ON public.profiles(college_id);
        END IF;
    END IF;
END $$;

-- ----------------------------------------------------------------------------
-- 2. SKILLS & USER_SKILLS (USERS ||--o{ USER_SKILLS }o--|| SKILLS)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.skills (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    slug TEXT UNIQUE NOT NULL,
    category TEXT NOT NULL DEFAULT 'general' CHECK (category IN ('frontend', 'backend', 'dsa', 'database', 'devops', 'ai_ml', 'soft_skill', 'general')),
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_skills_slug ON public.skills(slug);
CREATE INDEX IF NOT EXISTS idx_skills_category ON public.skills(category);

CREATE TABLE IF NOT EXISTS public.user_skills (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    skill_id UUID NOT NULL REFERENCES public.skills(id) ON DELETE CASCADE,
    proficiency TEXT NOT NULL DEFAULT 'intermediate' CHECK (proficiency IN ('beginner', 'intermediate', 'advanced', 'expert')),
    verified BOOLEAN DEFAULT FALSE,
    verified_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT uq_user_skills_user_skill UNIQUE (user_id, skill_id)
);

CREATE INDEX IF NOT EXISTS idx_user_skills_user_id ON public.user_skills(user_id);
CREATE INDEX IF NOT EXISTS idx_user_skills_skill_id ON public.user_skills(skill_id);

-- ----------------------------------------------------------------------------
-- 3. PROBLEMS, TEST_CASES & SUBMISSIONS
--    PROBLEMS ||--o{ TEST_CASES
--    PROBLEMS ||--o{ SUBMISSIONS
--    USERS ||--o{ SUBMISSIONS
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.problems (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    slug TEXT UNIQUE NOT NULL,
    difficulty TEXT NOT NULL CHECK (difficulty IN ('easy', 'medium', 'hard')),
    category TEXT NOT NULL,
    description TEXT NOT NULL,
    constraints TEXT[] DEFAULT '{}',
    starter_code JSONB DEFAULT '{}'::jsonb,
    is_published BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_problems_slug ON public.problems(slug);
CREATE INDEX IF NOT EXISTS idx_problems_difficulty ON public.problems(difficulty);
CREATE INDEX IF NOT EXISTS idx_problems_category ON public.problems(category);

CREATE TABLE IF NOT EXISTS public.test_cases (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    problem_id UUID NOT NULL REFERENCES public.problems(id) ON DELETE CASCADE,
    input TEXT NOT NULL,
    expected_output TEXT NOT NULL,
    is_hidden BOOLEAN DEFAULT FALSE,
    explanation TEXT,
    time_limit_ms INTEGER DEFAULT 2000,
    memory_limit_kb INTEGER DEFAULT 128000,
    order_index INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_test_cases_problem_id ON public.test_cases(problem_id);
CREATE INDEX IF NOT EXISTS idx_test_cases_order ON public.test_cases(problem_id, order_index);

CREATE TABLE IF NOT EXISTS public.submissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    problem_id UUID NOT NULL REFERENCES public.problems(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    code TEXT NOT NULL,
    language TEXT NOT NULL,
    status TEXT NOT NULL CHECK (status IN ('pending', 'running', 'accepted', 'wrong_answer', 'time_limit_exceeded', 'runtime_error', 'compilation_error')),
    runtime_ms INTEGER,
    memory_kb INTEGER,
    passed_test_cases INTEGER DEFAULT 0,
    total_test_cases INTEGER DEFAULT 0,
    error_message TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_submissions_user_id ON public.submissions(user_id);
CREATE INDEX IF NOT EXISTS idx_submissions_problem_id ON public.submissions(problem_id);
CREATE INDEX IF NOT EXISTS idx_submissions_status ON public.submissions(status);
CREATE INDEX IF NOT EXISTS idx_submissions_created_at ON public.submissions(created_at DESC);

-- ----------------------------------------------------------------------------
-- 4. APTITUDE_TESTS & APTITUDE_ATTEMPTS (APTITUDE_TESTS ||--o{ APTITUDE_ATTEMPTS)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.aptitude_tests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    slug TEXT UNIQUE NOT NULL,
    category TEXT NOT NULL CHECK (category IN ('quantitative', 'logical', 'verbal', 'technical', 'mixed')),
    duration_minutes INTEGER NOT NULL DEFAULT 30,
    total_questions INTEGER NOT NULL DEFAULT 15,
    passing_score INTEGER NOT NULL DEFAULT 60,
    is_published BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_aptitude_tests_slug ON public.aptitude_tests(slug);
CREATE INDEX IF NOT EXISTS idx_aptitude_tests_category ON public.aptitude_tests(category);

-- Ensure aptitude_attempts has test_id FK
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'aptitude_attempts') THEN
        IF NOT EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_schema = 'public' AND table_name = 'aptitude_attempts' AND column_name = 'test_id'
        ) THEN
            ALTER TABLE public.aptitude_attempts ADD COLUMN test_id UUID REFERENCES public.aptitude_tests(id) ON DELETE CASCADE;
            CREATE INDEX IF NOT EXISTS idx_aptitude_attempts_test_id ON public.aptitude_attempts(test_id);
        END IF;
    ELSE
        CREATE TABLE public.aptitude_attempts (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            test_id UUID REFERENCES public.aptitude_tests(id) ON DELETE CASCADE,
            user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
            answers JSONB NOT NULL DEFAULT '{}'::jsonb,
            score INTEGER NOT NULL DEFAULT 0,
            total_questions INTEGER NOT NULL DEFAULT 10,
            time_spent_seconds INTEGER NOT NULL DEFAULT 0,
            passed BOOLEAN DEFAULT FALSE,
            created_at TIMESTAMPTZ DEFAULT NOW()
        );
        CREATE INDEX idx_aptitude_attempts_user_id ON public.aptitude_attempts(user_id);
        CREATE INDEX idx_aptitude_attempts_test_id ON public.aptitude_attempts(test_id);
    END IF;
END $$;

-- ----------------------------------------------------------------------------
-- 5. DAILY_CHALLENGES & CHALLENGE_COMPLETIONS
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.daily_challenges (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    challenge_date DATE UNIQUE NOT NULL,
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    challenge_type TEXT NOT NULL CHECK (challenge_type IN ('dsa', 'aptitude', 'project_task', 'quiz', 'interview')),
    target_entity_id TEXT,
    xp_reward INTEGER NOT NULL DEFAULT 50,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_daily_challenges_date ON public.daily_challenges(challenge_date);

CREATE TABLE IF NOT EXISTS public.challenge_completions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    challenge_id UUID NOT NULL REFERENCES public.daily_challenges(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    completed_at TIMESTAMPTZ DEFAULT NOW(),
    xp_awarded INTEGER NOT NULL DEFAULT 50,
    CONSTRAINT uq_challenge_completions_user_challenge UNIQUE (challenge_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_challenge_completions_user_id ON public.challenge_completions(user_id);
CREATE INDEX IF NOT EXISTS idx_challenge_completions_challenge_id ON public.challenge_completions(challenge_id);

-- ----------------------------------------------------------------------------
-- 6. USERS ||--|| USER_STATS (1:1 Strict) & USERS ||--o{ XP_EVENTS
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.user_stats (
    user_id UUID PRIMARY KEY REFERENCES public.users(id) ON DELETE CASCADE,
    points INT DEFAULT 0,
    current_streak INT DEFAULT 0,
    longest_streak INT DEFAULT 0,
    last_active_date DATE,
    timezone TEXT DEFAULT 'UTC',
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.xp_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    amount INTEGER NOT NULL,
    source_feature TEXT NOT NULL,
    source_id TEXT,
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_xp_events_user_created ON public.xp_events(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_xp_events_source ON public.xp_events(source_feature, source_id);

-- ----------------------------------------------------------------------------
-- 7. BADGES & USER_BADGES (BADGES ||--o{ USER_BADGES }o--|| USERS)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.badges (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    description TEXT,
    icon TEXT DEFAULT 'Award',
    tier TEXT DEFAULT 'bronze' CHECK (tier IN ('bronze', 'silver', 'gold', 'platinum', 'legendary')),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_badges_code ON public.badges(code);

CREATE TABLE IF NOT EXISTS public.user_badges (
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    badge_id UUID NOT NULL REFERENCES public.badges(id) ON DELETE CASCADE,
    earned_at TIMESTAMPTZ DEFAULT NOW(),
    PRIMARY KEY (user_id, badge_id)
);

CREATE INDEX IF NOT EXISTS idx_user_badges_user_id ON public.user_badges(user_id);
CREATE INDEX IF NOT EXISTS idx_user_badges_badge_id ON public.user_badges(badge_id);

-- ----------------------------------------------------------------------------
-- 8. SQUADS & SQUAD_MEMBERS (SQUADS ||--o{ SQUAD_MEMBERS }o--|| USERS)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.squads (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    slug TEXT UNIQUE,
    description TEXT,
    access_type TEXT NOT NULL DEFAULT 'public' CHECK (access_type IN ('public', 'private', 'invite_only')),
    max_members INTEGER NOT NULL DEFAULT 6,
    avatar_url TEXT,
    created_by UUID REFERENCES public.users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_squads_slug ON public.squads(slug);
CREATE INDEX IF NOT EXISTS idx_squads_created_by ON public.squads(created_by);

CREATE TABLE IF NOT EXISTS public.squad_members (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    squad_id UUID NOT NULL REFERENCES public.squads(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    role TEXT NOT NULL DEFAULT 'member' CHECK (role IN ('leader', 'co_lead', 'member')),
    joined_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT uq_squad_members_squad_user UNIQUE (squad_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_squad_members_squad_id ON public.squad_members(squad_id);
CREATE INDEX IF NOT EXISTS idx_squad_members_user_id ON public.squad_members(user_id);

-- ----------------------------------------------------------------------------
-- 9. PROJECTS HIERARCHY
--    USERS ||--o{ PROJECTS (owns)
--    PROJECTS ||--o{ PROJECT_MEMBERS
--    PROJECTS ||--o{ PROJECT_APPLICATIONS
--    PROJECTS ||--o{ PROJECT_TASKS
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.projects (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    skills TEXT[] DEFAULT '{}',
    github_url TEXT,
    live_url TEXT,
    images TEXT[] DEFAULT '{}',
    is_verified BOOLEAN DEFAULT FALSE,
    is_public BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_projects_user_id ON public.projects(user_id);

CREATE TABLE IF NOT EXISTS public.project_members (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    role TEXT NOT NULL DEFAULT 'contributor' CHECK (role IN ('owner', 'maintainer', 'contributor')),
    joined_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT uq_project_members_project_user UNIQUE (project_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_project_members_project_id ON public.project_members(project_id);
CREATE INDEX IF NOT EXISTS idx_project_members_user_id ON public.project_members(user_id);

CREATE TABLE IF NOT EXISTS public.project_applications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    desired_role TEXT,
    pitch TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected', 'withdrawn')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_project_applications_project_id ON public.project_applications(project_id);
CREATE INDEX IF NOT EXISTS idx_project_applications_user_id ON public.project_applications(user_id);
CREATE INDEX IF NOT EXISTS idx_project_applications_status ON public.project_applications(status);

CREATE TABLE IF NOT EXISTS public.project_tasks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
    assigned_to UUID REFERENCES public.users(id) ON DELETE SET NULL,
    title TEXT NOT NULL,
    description TEXT,
    status TEXT NOT NULL DEFAULT 'todo' CHECK (status IN ('todo', 'in_progress', 'review', 'done')),
    priority TEXT NOT NULL DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'critical')),
    due_date DATE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_project_tasks_project_id ON public.project_tasks(project_id);
CREATE INDEX IF NOT EXISTS idx_project_tasks_assigned_to ON public.project_tasks(assigned_to);
CREATE INDEX IF NOT EXISTS idx_project_tasks_status ON public.project_tasks(status);

-- ----------------------------------------------------------------------------
-- 10. INTERVIEW_SESSIONS & INTERVIEW_FEEDBACK
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.interview_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    category TEXT NOT NULL,
    difficulty_level INTEGER NOT NULL DEFAULT 1,
    format TEXT DEFAULT 'standard',
    status TEXT DEFAULT 'completed',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_interview_sessions_user_id ON public.interview_sessions(user_id);

CREATE TABLE IF NOT EXISTS public.interview_feedback (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id UUID NOT NULL REFERENCES public.interview_sessions(id) ON DELETE CASCADE,
    overall_score INTEGER CHECK (overall_score BETWEEN 0 AND 100),
    technical_accuracy_score INTEGER CHECK (technical_accuracy_score BETWEEN 0 AND 100),
    communication_clarity_score INTEGER CHECK (communication_clarity_score BETWEEN 0 AND 100),
    strengths TEXT[] DEFAULT '{}',
    improvements TEXT[] DEFAULT '{}',
    detailed_summary TEXT,
    next_practice_advice TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_interview_feedback_session_id ON public.interview_feedback(session_id);

-- ----------------------------------------------------------------------------
-- 11. NOTIFICATIONS (USERS ||--o{ NOTIFICATIONS)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    type TEXT DEFAULT 'info' CHECK (type IN ('info', 'success', 'warning', 'achievement', 'reminder', 'invite')),
    is_read BOOLEAN DEFAULT FALSE,
    action_url TEXT,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_notifications_user_unread ON public.notifications(user_id, is_read, created_at DESC);

-- ----------------------------------------------------------------------------
-- 12. ROW-LEVEL SECURITY (RLS) POLICIES
--     Optimized with cached (SELECT auth.uid()) subqueries per Supabase rules
-- ----------------------------------------------------------------------------
ALTER TABLE public.colleges ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.skills ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_skills ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.problems ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.test_cases ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.aptitude_tests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.aptitude_attempts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.daily_challenges ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.challenge_completions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_stats ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.xp_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.badges ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_badges ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.squads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.squad_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.interview_feedback ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- 12.1 Public & Authenticated Read Catalogs
DO $$
BEGIN
    DROP POLICY IF EXISTS "Public can view colleges" ON public.colleges;
    CREATE POLICY "Public can view colleges" ON public.colleges FOR SELECT TO authenticated, anon USING (true);

    DROP POLICY IF EXISTS "Public can view skills" ON public.skills;
    CREATE POLICY "Public can view skills" ON public.skills FOR SELECT TO authenticated, anon USING (true);

    DROP POLICY IF EXISTS "Users can view published problems" ON public.problems;
    CREATE POLICY "Users can view published problems" ON public.problems FOR SELECT TO authenticated, anon USING (is_published = true);

    DROP POLICY IF EXISTS "Users view non-hidden test cases" ON public.test_cases;
    CREATE POLICY "Users view non-hidden test cases" ON public.test_cases FOR SELECT TO authenticated USING (is_hidden = false);

    DROP POLICY IF EXISTS "Users can view published aptitude tests" ON public.aptitude_tests;
    CREATE POLICY "Users can view published aptitude tests" ON public.aptitude_tests FOR SELECT TO authenticated, anon USING (is_published = true);

    DROP POLICY IF EXISTS "Users can view daily challenges" ON public.daily_challenges;
    CREATE POLICY "Users can view daily challenges" ON public.daily_challenges FOR SELECT TO authenticated, anon USING (true);

    DROP POLICY IF EXISTS "Public can view badges" ON public.badges;
    CREATE POLICY "Public can view badges" ON public.badges FOR SELECT TO authenticated, anon USING (true);

    DROP POLICY IF EXISTS "Public can view squads" ON public.squads;
    CREATE POLICY "Public can view squads" ON public.squads FOR SELECT TO authenticated USING (access_type = 'public');
END $$;

-- 12.2 User-Owned Private Records
DO $$
BEGIN
    -- user_skills
    DROP POLICY IF EXISTS "Users manage own skills" ON public.user_skills;
    CREATE POLICY "Users manage own skills" ON public.user_skills 
    FOR ALL TO authenticated 
    USING (user_id = (SELECT auth.uid()))
    WITH CHECK (user_id = (SELECT auth.uid()));

    -- submissions
    DROP POLICY IF EXISTS "Users view own submissions" ON public.submissions;
    CREATE POLICY "Users view own submissions" ON public.submissions FOR SELECT TO authenticated USING (user_id = (SELECT auth.uid()));

    DROP POLICY IF EXISTS "Users insert own submissions" ON public.submissions;
    CREATE POLICY "Users insert own submissions" ON public.submissions FOR INSERT TO authenticated WITH CHECK (user_id = (SELECT auth.uid()));

    -- aptitude_attempts
    DROP POLICY IF EXISTS "Users view own aptitude attempts" ON public.aptitude_attempts;
    CREATE POLICY "Users view own aptitude attempts" ON public.aptitude_attempts FOR SELECT TO authenticated USING (user_id = (SELECT auth.uid()));

    DROP POLICY IF EXISTS "Users insert own aptitude attempts" ON public.aptitude_attempts;
    CREATE POLICY "Users insert own aptitude attempts" ON public.aptitude_attempts FOR INSERT TO authenticated WITH CHECK (user_id = (SELECT auth.uid()));

    -- challenge_completions
    DROP POLICY IF EXISTS "Users view own challenge completions" ON public.challenge_completions;
    CREATE POLICY "Users view own challenge completions" ON public.challenge_completions FOR SELECT TO authenticated USING (user_id = (SELECT auth.uid()));

    DROP POLICY IF EXISTS "Users insert own challenge completions" ON public.challenge_completions;
    CREATE POLICY "Users insert own challenge completions" ON public.challenge_completions FOR INSERT TO authenticated WITH CHECK (user_id = (SELECT auth.uid()));

    -- user_stats
    DROP POLICY IF EXISTS "Users view own stats" ON public.user_stats;
    CREATE POLICY "Users view own stats" ON public.user_stats FOR SELECT TO authenticated USING (user_id = (SELECT auth.uid()));

    -- xp_events
    DROP POLICY IF EXISTS "Users view own xp events" ON public.xp_events;
    CREATE POLICY "Users view own xp events" ON public.xp_events FOR SELECT TO authenticated USING (user_id = (SELECT auth.uid()));

    -- user_badges
    DROP POLICY IF EXISTS "Users view own badges" ON public.user_badges;
    CREATE POLICY "Users view own badges" ON public.user_badges FOR SELECT TO authenticated USING (user_id = (SELECT auth.uid()));

    -- squad_members
    DROP POLICY IF EXISTS "Members view their squad members" ON public.squad_members;
    CREATE POLICY "Members view their squad members" ON public.squad_members FOR SELECT TO authenticated USING (true);

    DROP POLICY IF EXISTS "Users join squads" ON public.squad_members;
    CREATE POLICY "Users join squads" ON public.squad_members FOR INSERT TO authenticated WITH CHECK (user_id = (SELECT auth.uid()));

    -- projects & project sub-entities
    DROP POLICY IF EXISTS "Anyone can view public projects" ON public.projects;
    CREATE POLICY "Anyone can view public projects" ON public.projects FOR SELECT TO authenticated, anon USING (is_public = true);

    DROP POLICY IF EXISTS "Users manage own projects" ON public.projects;
    CREATE POLICY "Users manage own projects" ON public.projects FOR ALL TO authenticated USING (user_id = (SELECT auth.uid())) WITH CHECK (user_id = (SELECT auth.uid()));

    DROP POLICY IF EXISTS "Members view project members" ON public.project_members;
    CREATE POLICY "Members view project members" ON public.project_members FOR SELECT TO authenticated USING (true);

    DROP POLICY IF EXISTS "Users view project tasks" ON public.project_tasks;
    CREATE POLICY "Users view project tasks" ON public.project_tasks FOR SELECT TO authenticated 
    USING (EXISTS (SELECT 1 FROM public.projects p WHERE p.id = project_id AND (p.is_public = true OR p.user_id = (SELECT auth.uid()))));

    DROP POLICY IF EXISTS "Project owners manage tasks" ON public.project_tasks;
    CREATE POLICY "Project owners manage tasks" ON public.project_tasks FOR ALL TO authenticated 
    USING (EXISTS (SELECT 1 FROM public.projects p WHERE p.id = project_id AND p.user_id = (SELECT auth.uid())));

    DROP POLICY IF EXISTS "Applicants view own applications" ON public.project_applications;
    CREATE POLICY "Applicants view own applications" ON public.project_applications FOR SELECT TO authenticated 
    USING (user_id = (SELECT auth.uid()) OR EXISTS (SELECT 1 FROM public.projects p WHERE p.id = project_id AND p.user_id = (SELECT auth.uid())));

    DROP POLICY IF EXISTS "Users submit project application" ON public.project_applications;
    CREATE POLICY "Users submit project application" ON public.project_applications FOR INSERT TO authenticated WITH CHECK (user_id = (SELECT auth.uid()));

    -- interview_feedback
    DROP POLICY IF EXISTS "Users view feedback for their sessions" ON public.interview_feedback;
    CREATE POLICY "Users view feedback for their sessions" ON public.interview_feedback FOR SELECT TO authenticated 
    USING (EXISTS (SELECT 1 FROM public.interview_sessions s WHERE s.id = session_id AND s.user_id = (SELECT auth.uid())));

    -- notifications
    DROP POLICY IF EXISTS "Users view own notifications" ON public.notifications;
    CREATE POLICY "Users view own notifications" ON public.notifications FOR SELECT TO authenticated USING (user_id = (SELECT auth.uid()));

    DROP POLICY IF EXISTS "Users update own notifications" ON public.notifications;
    CREATE POLICY "Users update own notifications" ON public.notifications FOR UPDATE TO authenticated USING (user_id = (SELECT auth.uid()));
END $$;
