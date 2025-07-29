// Auto-scheduling types and interfaces

export interface SchedulingPreferences {
  user_id: string;
  preferred_start_time: string; // Format: "HH:MM:SS"
  preferred_end_time: string; // Format: "HH:MM:SS"
  work_days: number[]; // 1=Monday, 7=Sunday
  max_tasks_per_day: number;
  buffer_time_minutes: number;
  weather_check_enabled: boolean;
  travel_time_enabled: boolean;
  auto_scheduling_enabled: boolean;
}

export interface TaskSchedulingStatus {
  task_id: string;
  auto_schedule_enabled: boolean;
  scheduled_time?: string;
  scheduled_date?: string;
  calendar_event_id?: string;
  weather_dependent?: boolean;
  location?: string;
  travel_time_minutes?: number;
}

export interface AutoSchedulingResult {
  message: string;
  results: Array<{
    task_id: string;
    task_title: string;
    status: 'scheduled' | 'failed' | 'error' | 'skipped';
    scheduled_time?: string;
    calendar_event_id?: string;
    reason?: string;
  }>;
  total_tasks: number;
  successful: number;
  failed: number;
  skipped: number;
  task_count_change: number;
}

export interface SingleTaskSchedulingResult {
  task_id: string;
  scheduled_time: string;
  calendar_event_id?: string;
  duration_minutes: number;
}

export interface TimeSlot {
  start_time: Date;
  end_time: Date;
  duration_minutes: number;
}

export interface WeatherData {
  suitable_for_outdoor: boolean;
  temperature?: number;
  conditions?: string;
  location?: string;
}

export interface TravelTimeData {
  duration_minutes: number;
  distance_miles?: number;
  mode: string;
  origin: string;
  destination: string;
}

// Task enhancement for auto-scheduling
export interface EnhancedTask {
  id: string;
  title: string;
  description?: string;
  priority: 'low' | 'medium' | 'high';
  status: 'not_started' | 'in_progress' | 'completed';
  due_date?: string;
  category?: string;
  goal_id?: string;
  estimated_duration_minutes?: number;
  created_at?: string;
  updated_at?: string;
  // Auto-scheduling specific fields
  auto_schedule_enabled?: boolean;
  weather_dependent?: boolean;
  location?: string;
  preferred_time_windows?: string[];
  travel_time_minutes?: number;
  goal?: {
    id: string;
    title: string;
    description?: string;
  };
}