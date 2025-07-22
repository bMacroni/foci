# Automatic Task Scheduling Database Schema Documentation

## Overview
This document describes the database schema changes made to support the Automatic Task Scheduling feature as outlined in the PRD.

## New Fields Added to `tasks` Table

### Core Auto-Scheduling Fields
- **`auto_schedule_enabled`** (BOOLEAN, DEFAULT false)
  - Toggle to enable/disable auto-scheduling for individual tasks
  - Maps to PRD requirement: "Users can toggle auto-scheduling on/off for individual tasks"

- **`recurrence_pattern`** (JSONB)
  - Stores recurrence rules for recurring tasks
  - Example: `{"type": "daily", "interval": 1}` or `{"type": "weekly", "interval": 2, "days": ["monday", "wednesday"]}`
  - Maps to PRD requirement: "Recurring tasks automatically reschedule after completion"

- **`scheduling_preferences`** (JSONB)
  - User preferences for this specific task
  - Example: `{"preferred_time": "morning", "avoid_weather": true, "max_duration": 120}`

### Weather Integration Fields
- **`weather_dependent`** (BOOLEAN, DEFAULT false)
  - Indicates if task depends on weather conditions
  - Maps to PRD requirement: "Weather conditions are considered when scheduling outdoor tasks"

- **`location`** (TEXT)
  - Task location for weather and travel time calculations
  - Used by weather API and travel time APIs

### Travel Time Fields
- **`travel_time_minutes`** (INTEGER)
  - Calculated travel time to task location
  - Maps to PRD requirement: "Travel time is calculated and included in calendar event duration"

### Scheduling Preferences Fields
- **`preferred_time_windows`** (JSONB)
  - Preferred time windows for scheduling this task
  - Example: `[{"start": "09:00", "end": "12:00"}, {"start": "14:00", "end": "17:00"}]`

- **`max_daily_tasks`** (INTEGER, DEFAULT 5)
  - Maximum tasks per day for this user
  - Maps to PRD requirement: "Allow users to set a maximum daily task load"

- **`buffer_time_minutes`** (INTEGER, DEFAULT 15)
  - Buffer time between tasks
  - Maps to PRD requirement: "Implement configurable buffer times between tasks"

### Tracking Fields
- **`last_scheduled_date`** (TIMESTAMP WITH TIME ZONE)
  - Track when task was last scheduled
  - Used for recurrence logic and scheduling history

- **`task_type`** (ENUM: 'indoor', 'outdoor', 'travel', 'virtual', 'other')
  - Categorizes tasks for scheduling decisions
  - Helps determine weather dependency and travel requirements

## New Tables

### `task_scheduling_history`
Tracks the history of auto-scheduling decisions for audit and learning purposes.

**Fields:**
- `id` (UUID, PRIMARY KEY)
- `task_id` (UUID, REFERENCES tasks.id)
- `user_id` (UUID, REFERENCES users.id)
- `scheduled_date` (TIMESTAMP WITH TIME ZONE)
- `weather_conditions` (JSONB) - Weather data at time of scheduling
- `travel_time_minutes` (INTEGER)
- `calendar_event_id` (TEXT) - Reference to created calendar event
- `scheduling_reason` (TEXT) - Why this time slot was chosen
- `created_at` (TIMESTAMP WITH TIME ZONE)

### `user_scheduling_preferences`
Global scheduling preferences for each user.

**Fields:**
- `id` (UUID, PRIMARY KEY)
- `user_id` (UUID, REFERENCES users.id, UNIQUE)
- `preferred_start_time` (TIME, DEFAULT '09:00:00')
- `preferred_end_time` (TIME, DEFAULT '17:00:00')
- `work_days` (INTEGER[], DEFAULT '{1,2,3,4,5}') - Monday=1, Sunday=7
- `max_tasks_per_day` (INTEGER, DEFAULT 5)
- `buffer_time_minutes` (INTEGER, DEFAULT 15)
- `weather_check_enabled` (BOOLEAN, DEFAULT true)
- `travel_time_enabled` (BOOLEAN, DEFAULT true)
- `auto_scheduling_enabled` (BOOLEAN, DEFAULT false) - Global toggle
- `created_at` (TIMESTAMP WITH TIME ZONE)
- `updated_at` (TIMESTAMP WITH TIME ZONE)

## New Views

### `auto_scheduling_dashboard`
Provides a comprehensive view of auto-scheduling status for dashboard display.

**Returns:**
- User information
- Auto-scheduling enabled status
- Task counts (total, auto-scheduled, weather-dependent, pending)
- Scheduling history count

## Indexes Created
For performance optimization on frequently queried fields:
- `idx_tasks_auto_schedule_enabled`
- `idx_tasks_weather_dependent`
- `idx_tasks_task_type`
- `idx_tasks_last_scheduled_date`
- `idx_task_scheduling_history_task_id`
- `idx_task_scheduling_history_user_id`
- `idx_task_scheduling_history_scheduled_date`

## Row Level Security (RLS)
All new tables have RLS enabled with appropriate policies:
- Users can only access their own data
- Proper INSERT, SELECT, UPDATE policies for each table

## Triggers
- **`update_user_scheduling_preferences_updated_at`**: Automatically updates `updated_at` timestamp
- **`on_user_created_initialize_preferences`**: Creates default scheduling preferences for new users

## Migration Files
- `automatic_task_scheduling_migration.sql` - Apply the changes
- `automatic_task_scheduling_rollback.sql` - Rollback the changes if needed

## Usage Examples

### Enable auto-scheduling for a task
```sql
UPDATE tasks 
SET auto_schedule_enabled = true,
    weather_dependent = true,
    location = 'Central Park, New York',
    task_type = 'outdoor'
WHERE id = 'task-uuid';
```

### Set up recurring task
```sql
UPDATE tasks 
SET auto_schedule_enabled = true,
    recurrence_pattern = '{"type": "weekly", "interval": 1, "days": ["monday", "wednesday", "friday"]}'
WHERE id = 'task-uuid';
```

### Get user's auto-scheduling dashboard
```sql
SELECT * FROM auto_scheduling_dashboard WHERE user_id = 'user-uuid';
```

## Next Steps
After applying this migration:
1. Update backend API to handle new fields
2. Create UI components for auto-scheduling toggle
3. Implement weather API integration
4. Implement travel time API integration
5. Create auto-scheduling logic service 