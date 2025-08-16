-- Notifications Table Migration
-- Creates the user_notifications table for auto-scheduling notifications
-- Based on PRD: Feature_ Automatic Task Scheduling.md

-- Create notifications table
CREATE TABLE IF NOT EXISTS public.user_notifications (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
    type TEXT NOT NULL,
    title TEXT,
    message TEXT,
    details JSONB,
    read BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_user_notifications_user_id ON public.user_notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_user_notifications_read ON public.user_notifications(read);
CREATE INDEX IF NOT EXISTS idx_user_notifications_created_at ON public.user_notifications(created_at);
CREATE INDEX IF NOT EXISTS idx_user_notifications_type ON public.user_notifications(type);

-- Enable Row Level Security
ALTER TABLE public.user_notifications ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view own notifications" ON public.user_notifications 
    FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can update own notifications" ON public.user_notifications 
    FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own notifications" ON public.user_notifications 
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Add updated_at trigger
CREATE TRIGGER update_user_notifications_updated_at 
    BEFORE UPDATE ON public.user_notifications 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Add updated_at column if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'user_notifications' AND column_name = 'updated_at') THEN
        ALTER TABLE public.user_notifications 
        ADD COLUMN updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
    END IF;
END $$;

-- Create function to clean up old notifications (optional)
CREATE OR REPLACE FUNCTION cleanup_old_notifications()
RETURNS void AS $$
BEGIN
    -- Delete notifications older than 30 days that are marked as read
    DELETE FROM public.user_notifications 
    WHERE read = true 
    AND created_at < NOW() - INTERVAL '30 days';
END;
$$ LANGUAGE plpgsql;

-- Create a scheduled job to clean up old notifications (optional)
-- This would need to be set up in your database scheduler
-- SELECT cron.schedule('cleanup-notifications', '0 2 * * *', 'SELECT cleanup_old_notifications();');

-- Insert some sample notification types for reference
-- These are the notification types supported by the system:
-- 'auto_scheduling_completed' - When auto-scheduling completes successfully
-- 'auto_scheduling_error' - When auto-scheduling encounters errors
-- 'weather_conflict' - When weather affects outdoor task scheduling
-- 'calendar_conflict' - When calendar conflicts are detected
-- 'generic' - For general notifications

COMMENT ON TABLE public.user_notifications IS 'Stores user notifications for auto-scheduling events and other system notifications';
COMMENT ON COLUMN public.user_notifications.type IS 'Type of notification: auto_scheduling_completed, auto_scheduling_error, weather_conflict, calendar_conflict, generic';
COMMENT ON COLUMN public.user_notifications.details IS 'Additional JSON data for the notification (e.g., task lists, error details)';


