-- Migration: Notification Preferences and Device Tokens
-- Description: Adds tables for user notification preferences and device tokens for push notifications.
-- Based on PRD: AI-Driven Productivity App - Robust Notification System (Updated)

-- 1. Create user_notification_preferences table
CREATE TABLE IF NOT EXISTS public.user_notification_preferences (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
    notification_type TEXT NOT NULL, -- e.g., 'task_reminder', 'goal_completed'
    channel TEXT NOT NULL, -- 'email', 'in_app', 'push'
    enabled BOOLEAN DEFAULT true NOT NULL,
    snooze_duration_minutes INTEGER, -- User-configurable snooze duration in minutes
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE (user_id, notification_type, channel)
);

-- Add indexes
CREATE INDEX IF NOT EXISTS idx_user_notification_preferences_user_id ON public.user_notification_preferences(user_id);
CREATE INDEX IF NOT EXISTS idx_user_notification_preferences_type ON public.user_notification_preferences(notification_type);

-- Enable Row Level Security
ALTER TABLE public.user_notification_preferences ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can manage their own notification preferences" ON public.user_notification_preferences
    FOR ALL
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- Add updated_at trigger
CREATE TRIGGER update_user_notification_preferences_updated_at
    BEFORE UPDATE ON public.user_notification_preferences
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Comments for clarity
COMMENT ON TABLE public.user_notification_preferences IS 'Stores user-specific settings for different notification types and channels.';
COMMENT ON COLUMN public.user_notification_preferences.notification_type IS 'The type of notification, e.g., task_reminder, goal_completed.';
COMMENT ON COLUMN public.user_notification_preferences.channel IS 'The delivery channel for the notification: email, in_app, push.';
COMMENT ON COLUMN public.user_notification_preferences.snooze_duration_minutes IS 'User-defined snooze duration in minutes for reminders.';


-- 2. Create user_device_tokens table
CREATE TABLE IF NOT EXISTS public.user_device_tokens (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
    device_token TEXT NOT NULL,
    device_type TEXT, -- 'phone', 'desktop', 'web'
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE (user_id, device_token)
);

-- Add indexes
CREATE INDEX IF NOT EXISTS idx_user_device_tokens_user_id ON public.user_device_tokens(user_id);

-- Enable Row Level Security
ALTER TABLE public.user_device_tokens ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can manage their own device tokens" ON public.user_device_tokens
    FOR ALL
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- Comments for clarity
COMMENT ON TABLE public.user_device_tokens IS 'Stores user device tokens for sending push notifications.';
COMMENT ON COLUMN public.user_device_tokens.device_token IS 'The push notification token provided by FCM or similar service.';
COMMENT ON COLUMN public.user_device_tokens.device_type IS 'The type of device, e.g., phone, desktop, web.';

-- 3. Rename 'type' column in user_notifications to 'notification_type' for consistency
-- This avoids using a reserved keyword and aligns with the new preferences table.
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns
               WHERE table_name = 'user_notifications' AND column_name = 'type') THEN
        ALTER TABLE public.user_notifications RENAME COLUMN type TO notification_type;
    END IF;
END $$;
