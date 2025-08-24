-- Migration: Create user_app_preferences table (Momentum Mode persistence)
-- Date: 2025-08-24

-- Create table (idempotent)
DO $$ BEGIN
  CREATE TABLE public.user_app_preferences (
    user_id UUID PRIMARY KEY REFERENCES public.users(id) ON DELETE CASCADE,
    momentum_mode_enabled BOOLEAN NOT NULL DEFAULT false,
    momentum_travel_preference TEXT NOT NULL DEFAULT 'allow_travel',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
  );
EXCEPTION WHEN duplicate_table THEN NULL; END $$;

-- Enable RLS
ALTER TABLE public.user_app_preferences ENABLE ROW LEVEL SECURITY;

-- Policies (idempotent creation via checks)
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'user_app_preferences' AND policyname = 'Users can view own app prefs'
  ) THEN
    CREATE POLICY "Users can view own app prefs" ON public.user_app_preferences FOR SELECT USING (auth.uid() = user_id);
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'user_app_preferences' AND policyname = 'Users can insert own app prefs'
  ) THEN
    CREATE POLICY "Users can insert own app prefs" ON public.user_app_preferences FOR INSERT WITH CHECK (auth.uid() = user_id);
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'user_app_preferences' AND policyname = 'Users can update own app prefs'
  ) THEN
    CREATE POLICY "Users can update own app prefs" ON public.user_app_preferences FOR UPDATE USING (auth.uid() = user_id);
  END IF;
END $$;

-- Updated_at trigger
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.triggers WHERE event_object_table = 'user_app_preferences' AND trigger_name = 'update_user_app_preferences_updated_at'
  ) THEN
    CREATE TRIGGER update_user_app_preferences_updated_at
      BEFORE UPDATE ON public.user_app_preferences
      FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
  END IF;
END $$;

-- Comments
COMMENT ON TABLE public.user_app_preferences IS 'Per-user app preferences (e.g., Momentum Mode)';
COMMENT ON COLUMN public.user_app_preferences.momentum_mode_enabled IS 'Momentum Mode toggle';
COMMENT ON COLUMN public.user_app_preferences.momentum_travel_preference IS 'Momentum travel preference: allow_travel or home_only';


