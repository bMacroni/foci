-- Guided Brain Dump migration (Refs: FeaturePRDs/PRD_guided-brain-dump.md L54-L57)
-- Adds is_today_focus field with single-focus enforcement per user

-- 1) Add column to tasks
ALTER TABLE public.tasks
ADD COLUMN IF NOT EXISTS is_today_focus BOOLEAN DEFAULT false;

-- 2) Enforce at most one focused task per user via partial unique index
CREATE UNIQUE INDEX IF NOT EXISTS uniq_tasks_user_focus
ON public.tasks(user_id)
WHERE is_today_focus IS TRUE;

-- 3) Trigger to automatically unset previous focus when setting a new one
CREATE OR REPLACE FUNCTION public.unset_previous_focus()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.is_today_focus IS TRUE THEN
    UPDATE public.tasks
    SET is_today_focus = FALSE
    WHERE user_id = NEW.user_id
      AND id <> NEW.id
      AND is_today_focus IS TRUE;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_unset_previous_focus ON public.tasks;
CREATE TRIGGER trg_unset_previous_focus
BEFORE INSERT OR UPDATE OF is_today_focus ON public.tasks
FOR EACH ROW
EXECUTE FUNCTION public.unset_previous_focus();




