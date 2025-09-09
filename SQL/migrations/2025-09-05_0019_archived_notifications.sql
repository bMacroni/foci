-- Migration: Create archived_user_notifications table
-- Description: Creates a table to store archived notifications.

CREATE TABLE IF NOT EXISTS public.archived_user_notifications (
    id UUID PRIMARY KEY,
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
    notification_type TEXT NOT NULL,
    title TEXT,
    message TEXT,
    details JSONB,
    created_at TIMESTAMP WITH TIME ZONE,
    archived_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_archived_user_notifications_user_id ON public.archived_user_notifications(user_id);

ALTER TABLE public.archived_user_notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own archived notifications" ON public.archived_user_notifications
    FOR SELECT
    USING (auth.uid() = user_id);

COMMENT ON TABLE public.archived_user_notifications IS 'Stores notifications that have been read and archived by the user.';
