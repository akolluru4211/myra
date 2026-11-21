-- Create the learning profile storage used by Myra and its existing callers.
BEGIN;

CREATE TABLE IF NOT EXISTS public.user_ai_learning_profiles (
  user_id uuid PRIMARY KEY REFERENCES public.profiles(id) ON DELETE CASCADE,
  cognitive_memory jsonb NOT NULL CHECK (jsonb_typeof(cognitive_memory) = 'object'),
  total_interactions integer NOT NULL DEFAULT 0 CHECK (total_interactions >= 0),
  top_topics text[] NOT NULL DEFAULT '{}',
  top_technologies text[] NOT NULL DEFAULT '{}',
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.user_ai_learning_profiles ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.user_ai_learning_profiles FROM PUBLIC, anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.user_ai_learning_profiles TO authenticated;

DROP POLICY IF EXISTS "Students manage their own Myra learning profile" ON public.user_ai_learning_profiles;
CREATE POLICY "Students manage their own Myra learning profile"
  ON public.user_ai_learning_profiles
  FOR ALL TO authenticated
  USING ((SELECT auth.uid()) = user_id)
  WITH CHECK ((SELECT auth.uid()) = user_id);

COMMIT;

