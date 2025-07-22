# Automatic Task Scheduling API Documentation

## Overview
This document describes the new API endpoints added to support the Automatic Task Scheduling feature.

## Updated Task Endpoints

### Create Task
**POST** `/api/tasks`

**New Fields Added:**
```json
{
  "auto_schedule_enabled": false,
  "recurrence_pattern": {
    "type": "daily|weekly|monthly",
    "interval": 1,
    "days": ["monday", "wednesday", "friday"]
  },
  "scheduling_preferences": {
    "preferred_time": "morning",
    "avoid_weather": true,
    "max_duration": 120
  },
  "weather_dependent": false,
  "location": "Central Park, New York",
  "preferred_time_windows": [
    {
      "start": "09:00",
      "end": "12:00"
    }
  ],
  "max_daily_tasks": 5,
  "buffer_time_minutes": 15,
  "task_type": "outdoor|indoor|travel|virtual|other"
}
```

### Update Task
**PUT** `/api/tasks/:id`

Supports all the same fields as Create Task for updating auto-scheduling properties.

**Special Behavior:**
- When a recurring task is marked as completed (`status: "completed"`), the system automatically creates the next occurrence based on the recurrence pattern.

## New Auto-Scheduling Endpoints

### Toggle Auto-Scheduling for Task
**PUT** `/api/tasks/:id/toggle-auto-schedule`

**Request Body:**
```json
{
  "auto_schedule_enabled": true
}
```

**Response:**
```json
{
  "id": "task-uuid",
  "title": "Task Title",
  "auto_schedule_enabled": true,
  // ... other task fields
}
```

### Get Auto-Scheduling Dashboard
**GET** `/api/tasks/auto-scheduling/dashboard`

**Response:**
```json
{
  "user_id": "user-uuid",
  "email": "user@example.com",
  "full_name": "John Doe",
  "auto_scheduling_enabled": true,
  "max_tasks_per_day": 5,
  "total_tasks": 15,
  "auto_scheduled_tasks": 8,
  "weather_dependent_tasks": 3,
  "pending_auto_schedule": 2,
  "total_scheduling_events": 25
}
```

### Get User Scheduling Preferences
**GET** `/api/tasks/auto-scheduling/preferences`

**Response:**
```json
{
  "id": "pref-uuid",
  "user_id": "user-uuid",
  "preferred_start_time": "09:00:00",
  "preferred_end_time": "17:00:00",
  "work_days": [1, 2, 3, 4, 5],
  "max_tasks_per_day": 5,
  "buffer_time_minutes": 15,
  "weather_check_enabled": true,
  "travel_time_enabled": true,
  "auto_scheduling_enabled": false,
  "created_at": "2024-01-01T00:00:00Z",
  "updated_at": "2024-01-01T00:00:00Z"
}
```

### Update User Scheduling Preferences
**PUT** `/api/tasks/auto-scheduling/preferences`

**Request Body:**
```json
{
  "preferred_start_time": "08:00:00",
  "preferred_end_time": "18:00:00",
  "work_days": [1, 2, 3, 4, 5, 6],
  "max_tasks_per_day": 8,
  "buffer_time_minutes": 30,
  "weather_check_enabled": true,
  "travel_time_enabled": true,
  "auto_scheduling_enabled": true
}
```

**Response:** Updated preferences object

### Get Task Scheduling History
**GET** `/api/tasks/auto-scheduling/history/:task_id?`

**Parameters:**
- `task_id` (optional): If provided, returns history for specific task. If omitted, returns all history for user.

**Response:**
```json
[
  {
    "id": "history-uuid",
    "task_id": "task-uuid",
    "user_id": "user-uuid",
    "scheduled_date": "2024-01-01T10:00:00Z",
    "weather_conditions": {
      "temperature": 72,
      "condition": "sunny",
      "precipitation_chance": 0.1,
      "suitable_for_outdoor": true
    },
    "travel_time_minutes": 25,
    "calendar_event_id": "calendar-event-uuid",
    "scheduling_reason": "Auto-scheduled based on availability and preferences",
    "created_at": "2024-01-01T09:00:00Z"
  }
]
```

### Trigger Auto-Scheduling
**POST** `/api/tasks/auto-scheduling/trigger`

**Response:**
```json
{
  "message": "Auto-scheduling completed",
  "results": [
    {
      "task_id": "task-uuid",
      "task_title": "Walk the dog",
      "status": "scheduled",
      "scheduled_time": "2024-01-01T10:00:00Z",
      "calendar_event_id": "calendar-event-uuid"
    },
    {
      "task_id": "task-uuid-2",
      "task_title": "Grocery shopping",
      "status": "skipped",
      "reason": "Weather not suitable for outdoor task"
    }
  ],
  "total_tasks": 5,
  "successful": 3,
  "failed": 1,
  "skipped": 1
}
```

## Auto-Scheduling Logic

### Weather Integration
- Tasks marked as `weather_dependent: true` will check weather conditions before scheduling
- Outdoor tasks are skipped if weather is unsuitable (rain, snow, extreme temperatures)
- Weather data is stored in scheduling history for audit purposes

### Travel Time Calculation
- Tasks with `location` specified will have travel time calculated
- Travel time is added to task duration for scheduling purposes
- Multiple transportation modes supported (driving, walking, transit)

### Recurring Tasks
- When a recurring task is completed, the system automatically creates the next occurrence
- Recurrence patterns support daily, weekly, and monthly intervals
- Next occurrence inherits all task properties except due date and status

### Time Slot Finding
- System analyzes existing calendar events to find available time slots
- Respects user's preferred time windows and work days
- Considers buffer time between tasks
- Prioritizes tasks based on priority level

## Error Handling

All endpoints return appropriate HTTP status codes:
- `200` - Success
- `400` - Bad Request (validation errors)
- `401` - Unauthorized
- `500` - Internal Server Error

Error responses include a descriptive message:
```json
{
  "error": "Failed to fetch user preferences"
}
```

## Authentication

All endpoints require authentication via JWT token in the Authorization header:
```
Authorization: Bearer <jwt-token>
```

## Rate Limiting

The auto-scheduling trigger endpoint is rate-limited to prevent abuse:
- Maximum 10 requests per minute per user
- Maximum 100 requests per hour per user

## Future Enhancements

- Integration with actual weather APIs (OpenWeatherMap, WeatherAPI)
- Integration with Google Maps API for travel time calculations
- Machine learning for improved scheduling decisions
- Support for team/collaborative scheduling
- Mobile push notifications for scheduled tasks 