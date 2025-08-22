-- Migration: Drop completed column from tasks (final deprecation step)
-- PRECONDITIONS: Ensure all app clients have been updated to rely on status only.

-- 1) Final backfill to be extra safe
UPDATE public.tasks SET completed = (status = 'completed') WHERE completed IS DISTINCT FROM (status = 'completed');

-- 2) Drop sync trigger and function
DROP TRIGGER IF EXISTS trg_sync_task_status_completed ON public.tasks;
DROP FUNCTION IF EXISTS public.sync_task_status_completed();

-- 3) Drop index and column
DROP INDEX IF EXISTS idx_tasks_completed;
ALTER TABLE public.tasks DROP COLUMN IF EXISTS completed;


