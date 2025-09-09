-- Migration: Add reminder_sent_at to tasks
-- Description: Adds a column to the tasks table to track when a reminder notification has been sent.

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_schema = 'public'
        AND table_name = 'tasks'
        AND column_name = 'reminder_sent_at'
    ) THEN
        ALTER TABLE public.tasks
        ADD COLUMN reminder_sent_at TIMESTAMP WITH TIME ZONE;
    END IF;
END $$;

COMMENT ON COLUMN public.tasks.reminder_sent_at IS 'Timestamp of when a due date reminder was sent for this task.';

CREATE INDEX IF NOT EXISTS idx_tasks_reminder_sent_at ON public.tasks(reminder_sent_at);
