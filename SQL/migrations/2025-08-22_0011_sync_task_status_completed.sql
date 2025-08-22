-- Migration: Sync tasks.status and tasks.completed
-- Purpose: Transitional safety while deprecating the completed column
-- Ensures both fields remain consistent during reads/writes

-- 1) Backfill to ensure consistency for existing rows
UPDATE public.tasks
SET completed = TRUE
WHERE status = 'completed' AND (completed IS DISTINCT FROM TRUE);

UPDATE public.tasks
SET status = 'completed'
WHERE completed IS TRUE AND status <> 'completed';

-- 2) Create function to keep fields in sync on INSERT/UPDATE
CREATE OR REPLACE FUNCTION public.sync_task_status_completed()
RETURNS TRIGGER AS $$
BEGIN
  -- On INSERT, if status is not provided, infer it from completed
  IF TG_OP = 'INSERT' THEN
    IF NEW.status IS NULL THEN
      IF NEW.completed IS TRUE THEN
        NEW.status := 'completed'::task_status;
      ELSIF NEW.completed IS FALSE THEN
        NEW.status := 'not_started'::task_status;
      END IF;
    END IF;
    -- Ensure completed matches final status
    NEW.completed := (NEW.status = 'completed'::task_status);
    RETURN NEW;
  END IF;

  -- On UPDATE, prefer explicit status changes; otherwise mirror completed
  IF NEW.status IS DISTINCT FROM OLD.status THEN
    NEW.completed := (NEW.status = 'completed'::task_status);
  ELSIF NEW.completed IS DISTINCT FROM OLD.completed THEN
    NEW.status := CASE WHEN NEW.completed THEN 'completed'::task_status ELSE 'not_started'::task_status END;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 3) Attach trigger to tasks table
DROP TRIGGER IF EXISTS trg_sync_task_status_completed ON public.tasks;
CREATE TRIGGER trg_sync_task_status_completed
BEFORE INSERT OR UPDATE OF status, completed ON public.tasks
FOR EACH ROW
EXECUTE FUNCTION public.sync_task_status_completed();


