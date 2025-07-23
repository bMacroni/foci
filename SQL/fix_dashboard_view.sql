-- Fix auto-scheduling dashboard view to prevent counting issues
-- Drop the existing view
DROP VIEW IF EXISTS public.auto_scheduling_dashboard;

-- Recreate the view with DISTINCT counting to prevent multiplication
CREATE VIEW auto_scheduling_dashboard AS
SELECT 
    u.id as user_id,
    u.email,
    u.full_name,
    usp.auto_scheduling_enabled,
    usp.max_tasks_per_day,
    COUNT(DISTINCT t.id) as total_tasks,
    COUNT(DISTINCT CASE WHEN t.auto_schedule_enabled = true THEN t.id END) as auto_scheduled_tasks,
    COUNT(DISTINCT CASE WHEN t.weather_dependent = true THEN t.id END) as weather_dependent_tasks,
    COUNT(DISTINCT CASE WHEN t.status = 'not_started' AND t.auto_schedule_enabled = true THEN t.id END) as pending_auto_schedule,
    COUNT(tsh.id) as total_scheduling_events
FROM public.users u
LEFT JOIN public.user_scheduling_preferences usp ON u.id = usp.user_id
LEFT JOIN public.tasks t ON u.id = t.user_id
LEFT JOIN public.task_scheduling_history tsh ON u.id = tsh.user_id
GROUP BY u.id, u.email, u.full_name, usp.auto_scheduling_enabled, usp.max_tasks_per_day;

-- Grant permissions
GRANT ALL ON public.auto_scheduling_dashboard TO anon, authenticated; 