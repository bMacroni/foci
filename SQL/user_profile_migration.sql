-- User Profile Migration
-- Adds profile fields and enums to public.users and ensures RLS remains enabled

-- Enums
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'account_status_enum') THEN
    CREATE TYPE public.account_status_enum AS ENUM ('active', 'suspended', 'deleted');
  END IF;
END$$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'theme_preference_enum') THEN
    CREATE TYPE public.theme_preference_enum AS ENUM ('light', 'dark');
  END IF;
END$$;

-- Columns on public.users (Supabase auth extended table)
ALTER TABLE public.users
  ADD COLUMN IF NOT EXISTS full_name TEXT,
  ADD COLUMN IF NOT EXISTS avatar_url TEXT,
  ADD COLUMN IF NOT EXISTS join_date TIMESTAMPTZ DEFAULT now(),
  ADD COLUMN IF NOT EXISTS last_login TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS account_status public.account_status_enum DEFAULT 'active',
  ADD COLUMN IF NOT EXISTS theme_preference public.theme_preference_enum DEFAULT 'light',
  ADD COLUMN IF NOT EXISTS notification_preferences JSONB DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS geographic_location TEXT;

-- Ensure RLS is enabled (Supabase usually enables on auth tables by default)
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- Policies (assumes basic self-access policies exist; create if missing)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'users' AND policyname = 'Users can view own profile'
  ) THEN
    CREATE POLICY "Users can view own profile" ON public.users FOR SELECT USING (auth.uid() = id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'users' AND policyname = 'Users can update own profile'
  ) THEN
    CREATE POLICY "Users can update own profile" ON public.users FOR UPDATE USING (auth.uid() = id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'users' AND policyname = 'Users can insert own profile'
  ) THEN
    CREATE POLICY "Users can insert own profile" ON public.users FOR INSERT WITH CHECK (auth.uid() = id);
  END IF;
END$$;


