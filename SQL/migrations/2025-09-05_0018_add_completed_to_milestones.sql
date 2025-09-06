-- Migration: Add completed to milestones
-- Description: Adds a boolean 'completed' column to the milestones table.

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_schema = 'public'
        AND table_name = 'milestones'
        AND column_name = 'completed'
    ) THEN
        ALTER TABLE public.milestones
        ADD COLUMN completed BOOLEAN DEFAULT false NOT NULL;
    END IF;
END $$;

COMMENT ON COLUMN public.milestones.completed IS 'Whether the milestone is considered complete (all steps finished).';

CREATE INDEX IF NOT EXISTS idx_milestones_completed ON public.milestones(completed);
