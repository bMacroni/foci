-- Migration: Add missing task columns (completed, preferred_time_of_day, deadline_type)
-- This migration adds columns that exist in production but are missing from dev
-- Date: 2025-08-22

-- Add completed column to tasks table for task completion tracking
ALTER TABLE public.tasks 
ADD COLUMN IF NOT EXISTS completed BOOLEAN DEFAULT false;

-- Add preferred_time_of_day column for scheduling preferences
ALTER TABLE public.tasks 
ADD COLUMN IF NOT EXISTS preferred_time_of_day VARCHAR(20);

-- Add deadline_type column for hard/soft deadline tracking
ALTER TABLE public.tasks 
ADD COLUMN IF NOT EXISTS deadline_type VARCHAR(10);

-- Create index for completed status for better query performance
CREATE INDEX IF NOT EXISTS idx_tasks_completed ON public.tasks(completed);

-- Add comments for documentation
COMMENT ON COLUMN public.tasks.completed IS 'Whether this task has been completed';
COMMENT ON COLUMN public.tasks.preferred_time_of_day IS 'Preferred time of day for this task (morning, afternoon, evening, etc.)';
COMMENT ON COLUMN public.tasks.deadline_type IS 'Type of deadline: hard or soft';