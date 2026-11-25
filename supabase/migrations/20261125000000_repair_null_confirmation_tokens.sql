-- Supabase Auth expects an empty string when no confirmation token exists.
UPDATE auth.users
SET confirmation_token = ''
WHERE confirmation_token IS NULL;
