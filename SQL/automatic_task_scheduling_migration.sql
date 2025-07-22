-- Automatic Task Scheduling Migration
-- Add new fields to support automatic task scheduling feature
-- Based on PRD: Feature_ Automatic Task Scheduling.md

-- Add new fields to tasks table for auto-scheduling functionality
ALTER TABLE public.tasks 
ADD COLUMN auto_schedule_enabled BOOLEAN DEFAULT false,
ADD COLUMN recurrence_pattern JSONB, -- For storing recurrence rules (daily, weekly, monthly, etc.)
ADD COLUMN scheduling_preferences JSONB, -- For storing user scheduling preferences
ADD COLUMN last_scheduled_date TIMESTAMP WITH TIME ZONE, -- Track when task was last scheduled
ADD COLUMN weather_dependent BOOLEAN DEFAULT false, -- Whether task depends on weather
ADD COLUMN location TEXT, -- Task location for weather and travel time calculations
ADD COLUMN travel_time_minutes INTEGER, -- Calculated travel time to task location
ADD COLUMN preferred_time_windows JSONB, -- Preferred time windows for scheduling
ADD COLUMN max_daily_tasks INTEGER DEFAULT 5, -- Maximum tasks per day for this user
ADD COLUMN buffer_time_minutes INTEGER DEFAULT 15; -- Buffer time between tasks

-- Add new enum for task types that might affect scheduling
CREATE TYPE task_type AS ENUM ('indoor', 'outdoor', 'travel', 'virtual', 'other');

-- Add task_type column to tasks table
ALTER TABLE public.tasks 
ADD COLUMN task_type task_type DEFAULT 'other';

-- Create new table for scheduling history
CREATE TABLE public.task_scheduling_history (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    task_id UUID REFERENCES public.tasks(id) ON DELETE CASCADE NOT NULL,
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
    scheduled_date TIMESTAMP WITH TIME ZONE NOT NULL,
    weather_conditions JSONB, -- Store weather data at time of scheduling
    travel_time_minutes INTEGER,
    calendar_event_id TEXT, -- Reference to created calendar event
    scheduling_reason TEXT, -- Why this time slot was chosen
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create new table for user scheduling preferences
CREATE TABLE public.user_scheduling_preferences (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
    preferred_start_time TIME DEFAULT '09:00:00',
    preferred_end_time TIME DEFAULT '17:00:00',
    work_days INTEGER[] DEFAULT '{1,2,3,4,5}', -- Monday=1, Sunday=7
    max_tasks_per_day INTEGER DEFAULT 5,
    buffer_time_minutes INTEGER DEFAULT 15,
    weather_check_enabled BOOLEAN DEFAULT true,
    travel_time_enabled BOOLEAN DEFAULT true,
    auto_scheduling_enabled BOOLEAN DEFAULT false, -- Global toggle
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id)
);

-- Create indexes for better performance on new fields
CREATE INDEX idx_tasks_auto_schedule_enabled ON public.tasks(auto_schedule_enabled);
CREATE INDEX idx_tasks_weather_dependent ON public.tasks(weather_dependent);
CREATE INDEX idx_tasks_task_type ON public.tasks(task_type);
CREATE INDEX idx_tasks_last_scheduled_date ON public.tasks(last_scheduled_date);
CREATE INDEX idx_task_scheduling_history_task_id ON public.task_scheduling_history(task_id);
CREATE INDEX idx_task_scheduling_history_user_id ON public.task_scheduling_history(user_id);
CREATE INDEX idx_task_scheduling_history_scheduled_date ON public.task_scheduling_history(scheduled_date);

-- Add updated_at trigger for user_scheduling_preferences
CREATE TRIGGER update_user_scheduling_preferences_updated_at 
    BEFORE UPDATE ON public.user_scheduling_preferences 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Enable Row Level Security for new tables
ALTER TABLE public.task_scheduling_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_scheduling_preferences ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for new tables
CREATE POLICY "Users can view own task scheduling history" 
    ON public.task_scheduling_history FOR SELECT 
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own task scheduling history" 
    ON public.task_scheduling_history FOR INSERT 
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view own scheduling preferences" 
    ON public.user_scheduling_preferences FOR SELECT 
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own scheduling preferences" 
    ON public.user_scheduling_preferences FOR INSERT 
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own scheduling preferences" 
    ON public.user_scheduling_preferences FOR UPDATE 
    USING (auth.uid() = user_id);

-- Create function to initialize user scheduling preferences
CREATE OR REPLACE FUNCTION public.initialize_user_scheduling_preferences()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.user_scheduling_preferences (user_id)
    VALUES (NEW.id);
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger to initialize scheduling preferences for new users
CREATE TRIGGER on_user_created_initialize_preferences
    AFTER INSERT ON public.users
    FOR EACH ROW EXECUTE FUNCTION public.initialize_user_scheduling_preferences();

-- Create view for auto-scheduling dashboard
CREATE VIEW auto_scheduling_dashboard AS
SELECT 
    u.id as user_id,
    u.email,
    u.full_name,
    usp.auto_scheduling_enabled,
    usp.max_tasks_per_day,
    COUNT(t.id) as total_tasks,
    COUNT(CASE WHEN t.auto_schedule_enabled = true THEN 1 END) as auto_scheduled_tasks,
    COUNT(CASE WHEN t.weather_dependent = true THEN 1 END) as weather_dependent_tasks,
    COUNT(CASE WHEN t.status = 'not_started' AND t.auto_schedule_enabled = true THEN 1 END) as pending_auto_schedule,
    COUNT(tsh.id) as total_scheduling_events
FROM public.users u
LEFT JOIN public.user_scheduling_preferences usp ON u.id = usp.user_id
LEFT JOIN public.tasks t ON u.id = t.user_id
LEFT JOIN public.task_scheduling_history tsh ON u.id = tsh.user_id
GROUP BY u.id, u.email, u.full_name, usp.auto_scheduling_enabled, usp.max_tasks_per_day;

-- Grant permissions for new tables
GRANT ALL ON public.task_scheduling_history TO anon, authenticated;
GRANT ALL ON public.user_scheduling_preferences TO anon, authenticated;
GRANT ALL ON public.auto_scheduling_dashboard TO anon, authenticated;

-- Add comments for documentation
COMMENT ON COLUMN public.tasks.auto_schedule_enabled IS 'Whether this task should be automatically scheduled';
COMMENT ON COLUMN public.tasks.recurrence_pattern IS 'JSON object defining recurrence rules (e.g., {"type": "daily", "interval": 1})';
COMMENT ON COLUMN public.tasks.scheduling_preferences IS 'User preferences for this specific task scheduling';
COMMENT ON COLUMN public.tasks.weather_dependent IS 'Whether this task depends on weather conditions';
COMMENT ON COLUMN public.tasks.location IS 'Task location for weather and travel time calculations';
COMMENT ON COLUMN public.tasks.preferred_time_windows IS 'Preferred time windows for scheduling this task';
COMMENT ON COLUMN public.tasks.max_daily_tasks IS 'Maximum number of tasks per day for this user';
COMMENT ON COLUMN public.tasks.buffer_time_minutes IS 'Buffer time in minutes between tasks'; 