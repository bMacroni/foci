// Calendar types and interfaces
import { Goal } from '../services/api';

export interface CalendarEvent {
  id: string;
  title?: string; // Database format
  summary?: string; // Google Calendar API format
  description?: string;
  // Database format
  start_time?: string;
  end_time?: string;
  // Google Calendar API format
  start?: {
    dateTime: string;
    timeZone?: string;
  };
  end?: {
    dateTime: string;
    timeZone?: string;
  };
  location?: string;
  google_calendar_id?: string;
  created_at?: string;
  updated_at?: string;
  user_id?: string;
  task_id?: string; // If this event is linked to a task
}

export interface Task {
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
  goal?: {
    id: string;
    title: string;
    description?: string;
  };
  calendar_events?: CalendarEvent[];
}

export interface CalendarViewType {
  day: 'day';
  week: 'week';
  month: 'month';
}

export type ViewType = 'day' | 'week' | 'month';

export interface EventFormData {
  title: string;
  description?: string;
  startTime: string;
  endTime: string;
  location?: string;
  isRecurring?: boolean;
  recurrencePattern?: string;
}

export interface CalendarState {
  selectedDate: Date;
  viewType: ViewType;
  events: CalendarEvent[];
  tasks: Task[];
  goals: Goal[];
  loading: boolean;
  error: string | null;
}

export interface CalendarEventWithTask extends CalendarEvent {
  task?: Task;
}

export interface DayViewEvent {
  id: string;
  title: string;
  startTime: Date;
  endTime: Date;
  type: 'event' | 'task';
  data: CalendarEvent | Task;
  color: string;
}

export interface WeekViewEvent {
  id: string;
  title: string;
  startTime: Date;
  endTime: Date;
  day: number; // 0-6 for Sunday-Saturday
  type: 'event' | 'task';
  data: CalendarEvent | Task;
  color: string;
}

export interface MonthViewEvent {
  id: string;
  title: string;
  date: Date;
  type: 'event' | 'task';
  data: CalendarEvent | Task;
  color: string;
}