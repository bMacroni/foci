-- Migration: Add event_type, goal_id, is_all_day to calendar_events
-- Run this in Supabase SQL Editor

-- 1) Create enum type if not exists
DO $$ BEGIN
  CREATE TYPE calendar_event_type AS ENUM ('event', 'task', 'goal');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- 2) Add columns (idempotent)
ALTER TABLE public.calendar_events
  ADD COLUMN IF NOT EXISTS event_type calendar_event_type NOT NULL DEFAULT 'event',
  ADD COLUMN IF NOT EXISTS goal_id UUID REFERENCES public.goals(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS is_all_day BOOLEAN NOT NULL DEFAULT false;

-- 3) Backfill: mark existing rows with task_id as 'task'
UPDATE public.calendar_events
SET event_type = 'task'
WHERE task_id IS NOT NULL
  AND event_type <> 'task';

-- 4) Constraints to keep data consistent
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'calendar_events_task_requires_task_id'
  ) THEN
    ALTER TABLE public.calendar_events
      ADD CONSTRAINT calendar_events_task_requires_task_id
        CHECK (event_type <> 'task' OR task_id IS NOT NULL);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'calendar_events_goal_requires_goal_id'
  ) THEN
    ALTER TABLE public.calendar_events
      ADD CONSTRAINT calendar_events_goal_requires_goal_id
        CHECK (event_type <> 'goal' OR goal_id IS NOT NULL);
  END IF;
END $$;

-- For event/task ensure valid time range; for goal, allow same-day markers
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'calendar_events_time_required_for_event_or_task'
  ) THEN
    ALTER TABLE public.calendar_events
      ADD CONSTRAINT calendar_events_time_required_for_event_or_task
        CHECK (
          (event_type IN ('event','task') AND end_time > start_time)
          OR event_type = 'goal'
        );
  END IF;
END $$;

-- Goal markers must be same day (stored as same-day timestamps)
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'calendar_events_goal_same_day'
  ) THEN
    ALTER TABLE public.calendar_events
      ADD CONSTRAINT calendar_events_goal_same_day
        CHECK (event_type <> 'goal' OR date_trunc('day', start_time) = date_trunc('day', end_time));
  END IF;
END $$;

-- 5) Indexes
CREATE INDEX IF NOT EXISTS idx_calendar_events_event_type ON public.calendar_events(event_type);
CREATE INDEX IF NOT EXISTS idx_calendar_events_goal_id ON public.calendar_events(goal_id);
CREATE INDEX IF NOT EXISTS idx_calendar_events_user_start ON public.calendar_events(user_id, start_time);


