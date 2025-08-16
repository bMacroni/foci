-- Automatic Task Scheduling Migration Rollback
-- Use this script to undo the automatic task scheduling changes if needed

-- Drop the auto-scheduling dashboard view
DROP VIEW IF EXISTS public.auto_scheduling_dashboard;

-- Drop the trigger for user scheduling preferences
DROP TRIGGER IF EXISTS on_user_created_initialize_preferences ON public.users;

-- Drop the function for initializing user scheduling preferences
DROP FUNCTION IF EXISTS public.initialize_user_scheduling_preferences();

-- Drop RLS policies for new tables
DROP POLICY IF EXISTS "Users can view own task scheduling history" ON public.task_scheduling_history;
DROP POLICY IF EXISTS "Users can insert own task scheduling history" ON public.task_scheduling_history;
DROP POLICY IF EXISTS "Users can view own scheduling preferences" ON public.user_scheduling_preferences;
DROP POLICY IF EXISTS "Users can insert own scheduling preferences" ON public.user_scheduling_preferences;
DROP POLICY IF EXISTS "Users can update own scheduling preferences" ON public.user_scheduling_preferences;

-- Drop the trigger for user_scheduling_preferences updated_at
DROP TRIGGER IF EXISTS update_user_scheduling_preferences_updated_at ON public.user_scheduling_preferences;

-- Drop indexes for new fields
DROP INDEX IF EXISTS idx_tasks_auto_schedule_enabled;
DROP INDEX IF EXISTS idx_tasks_weather_dependent;
DROP INDEX IF EXISTS idx_tasks_task_type;
DROP INDEX IF EXISTS idx_tasks_last_scheduled_date;
DROP INDEX IF EXISTS idx_task_scheduling_history_task_id;
DROP INDEX IF EXISTS idx_task_scheduling_history_user_id;
DROP INDEX IF EXISTS idx_task_scheduling_history_scheduled_date;

-- Drop new tables
DROP TABLE IF EXISTS public.task_scheduling_history;
DROP TABLE IF EXISTS public.user_scheduling_preferences;

-- Remove new columns from tasks table
ALTER TABLE public.tasks 
DROP COLUMN IF EXISTS auto_schedule_enabled,
DROP COLUMN IF EXISTS recurrence_pattern,
DROP COLUMN IF EXISTS scheduling_preferences,
DROP COLUMN IF EXISTS last_scheduled_date,
DROP COLUMN IF EXISTS weather_dependent,
DROP COLUMN IF EXISTS location,
DROP COLUMN IF EXISTS travel_time_minutes,
DROP COLUMN IF EXISTS preferred_time_windows,
DROP COLUMN IF EXISTS max_daily_tasks,
DROP COLUMN IF EXISTS buffer_time_minutes,
DROP COLUMN IF EXISTS task_type;

-- Drop the task_type enum
DROP TYPE IF EXISTS task_type;


