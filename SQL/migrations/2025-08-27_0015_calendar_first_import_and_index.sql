-- Migration: Add calendar import flags to user_app_preferences and unique index on calendar_events
-- Date: 2025-08-27

-- Add columns (idempotent)
DO $$ BEGIN
  ALTER TABLE public.user_app_preferences
    ADD COLUMN IF NOT EXISTS calendar_first_import_completed BOOLEAN NOT NULL DEFAULT false,
    ADD COLUMN IF NOT EXISTS calendar_import_prompt_dismissed_at TIMESTAMPTZ NULL;
EXCEPTION WHEN undefined_table THEN
  -- If table doesn't exist yet, skip; earlier migration creates it
  NULL;
END $$;

-- Add unique index to ensure no duplicate Google events per user
DO $$ BEGIN
  CREATE UNIQUE INDEX IF NOT EXISTS calendar_events_uid_googleid
    ON public.calendar_events(user_id, google_calendar_id)
    WHERE google_calendar_id IS NOT NULL;
EXCEPTION WHEN undefined_table THEN
  NULL;
END $$;

-- Comment annotations
DO $$ BEGIN
  COMMENT ON COLUMN public.user_app_preferences.calendar_first_import_completed IS 'True once first-run Google Calendar import completed';
  COMMENT ON COLUMN public.user_app_preferences.calendar_import_prompt_dismissed_at IS 'Timestamp when user last dismissed the import prompt';
EXCEPTION WHEN undefined_table THEN
  NULL;
END $$;


