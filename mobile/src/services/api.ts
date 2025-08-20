// Real API implementation for backend integration
// For Android emulator, use 10.0.2.2 instead of localhost
// For physical device, use your computer's IP address (e.g., 192.168.1.100)
import { configService } from './config';
import {
  SchedulingPreferences,
  TaskSchedulingStatus,
  AutoSchedulingResult,
  TimeSlot,
} from '../types/autoScheduling';

interface GoalBreakdownRequest {
  title: string;
  description?: string;
}

interface Milestone {
  id: string;
  title: string;
  completed: boolean;
  order: number;
  steps: Array<{
    id: string;
    text: string;
    completed: boolean;
    order: number;
  }>;
}

interface GoalBreakdownResponse {
  milestones: Milestone[];
}

export interface Goal {
  id: string;
  title: string;
  description: string;
  target_completion_date?: string;
  category?: string;
  completed?: boolean;
  created_at?: string;
  milestones?: Milestone[];
}

// Brain Dump API
export const brainDumpAPI = {
  submit: async (text: string): Promise<{ threadId: string; items: Array<{ text: string; category?: string | null; stress_level: 'low'|'medium'|'high'; priority: 'low'|'medium'|'high' }>}> => {
    const response = await fetch(`${configService.getBaseUrl()}/ai/braindump`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${await getAuthToken()}`,
      },
      body: JSON.stringify({ text }),
    });
    if (!response.ok) {
      const body = await response.json().catch(()=>({}));
      throw new Error(body?.message || 'Failed to process brain dump');
    }
    return response.json();
  },
};

export const goalsAPI = {
  // Generate AI-powered goal breakdown using real backend
  generateBreakdown: async (data: GoalBreakdownRequest): Promise<GoalBreakdownResponse> => {
    try {
      const response = await fetch(`${configService.getBaseUrl()}/goals/generate-breakdown`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${await getAuthToken()}`,
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (_error) {
      console.error('Error generating goal breakdown:', _error);
      throw _error;
    }
  },

  // Create a milestone under a goal
  createMilestone: async (
    goalId: string,
    payload: { title: string; order: number }
  ): Promise<{ id: string; title: string; order: number; steps: any[] }> => {
    try {
      const token = await getAuthToken();
      const response = await fetch(`${configService.getBaseUrl()}/goals/${goalId}/milestones`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });
      if (!response.ok) {
        const text = await response.text();
        throw new Error(`HTTP error! status: ${response.status}, body: ${text}`);
      }
      return await response.json();
    } catch (_error) {
      console.error('🔍 API: Error creating milestone:', _error);
      throw _error;
    }
  },

  // Delete a milestone
  deleteMilestone: async (milestoneId: string): Promise<void> => {
    try {
      const token = await getAuthToken();
      const response = await fetch(`${configService.getBaseUrl()}/goals/milestones/${milestoneId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      if (!response.ok) {
        const text = await response.text();
        throw new Error(`HTTP error! status: ${response.status}, body: ${text}`);
      }
    } catch (_error) {
      console.error('🔍 API: Error deleting milestone:', _error);
      throw _error;
    }
  },

  // Create a step under a milestone
  createStep: async (
    milestoneId: string,
    payload: { text: string; order: number }
  ): Promise<{ id: string; text: string; order: number }> => {
    try {
      const token = await getAuthToken();
      const response = await fetch(`${configService.getBaseUrl()}/goals/milestones/${milestoneId}/steps`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });
      if (!response.ok) {
        const text = await response.text();
        throw new Error(`HTTP error! status: ${response.status}, body: ${text}`);
      }
      return await response.json();
    } catch (_error) {
      console.error('🔍 API: Error creating step:', _error);
      throw _error;
    }
  },

  // Delete a step
  deleteStep: async (stepId: string): Promise<void> => {
    try {
      const token = await getAuthToken();
      const response = await fetch(`${configService.getBaseUrl()}/goals/steps/${stepId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      if (!response.ok) {
        const text = await response.text();
        throw new Error(`HTTP error! status: ${response.status}, body: ${text}`);
      }
    } catch (_error) {
      console.error('🔍 API: Error deleting step:', _error);
      throw _error;
    }
  },

  // Create a new goal using real backend
  createGoal: async (goalData: Goal): Promise<Goal> => {
    try {
      const response = await fetch(`${configService.getBaseUrl()}/goals`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${await getAuthToken()}`,
        },
        body: JSON.stringify(goalData),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (_error) {
      console.error('Error creating goal:', _error);
      throw _error;
    }
  },

  // Get all goals for the user using real backend
  getGoals: async (signal?: AbortSignal): Promise<Goal[]> => {
    try {
      const token = await getAuthToken();
      
      const response = await fetch(`${configService.getBaseUrl()}/goals`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
        signal,
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('🔍 API: Error response body:', errorText);
        throw new Error(`HTTP error! status: ${response.status}, body: ${errorText}`);
      }

      const data = await response.json();
      
      // Cache the goals for offline use
      const { offlineService } = await import('./offline');
      await offlineService.cacheGoals(data);
      
      return data;
    } catch (_error) {
      if ((_error as any)?.name === 'AbortError') {
        // Silent for expected timeouts; caller handles gracefully
        throw _error;
      }
      console.error('🔍 API: Error fetching goals:', _error);
      
      // Try to get cached goals if offline
      const { offlineService } = await import('./offline');
      if (offlineService.shouldUseCache()) {
        const cachedGoals = await offlineService.getCachedGoals();
        if (cachedGoals) {
          console.warn('Using cached goals due to offline status');
          return cachedGoals;
        }
      }
      
      throw _error;
    }
  },

  // Get a single goal by ID with milestones and steps
  getGoalById: async (goalId: string): Promise<Goal> => {
    try {
      const token = await getAuthToken();
      const response = await fetch(`${configService.getBaseUrl()}/goals/${goalId}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('🔍 API: Error response body:', errorText);
        throw new Error(`HTTP error! status: ${response.status}, body: ${errorText}`);
      }

      const data = await response.json();
      return data;
    } catch (_error) {
      console.error('🔍 API: Error fetching goal by ID:', _error);
      throw _error;
    }
  },

  // Update milestone completion status
  updateMilestone: async (milestoneId: string, updates: { completed?: boolean; title?: string }): Promise<void> => {
    try {
      const token = await getAuthToken();
      const response = await fetch(`${configService.getBaseUrl()}/goals/milestones/${milestoneId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(updates),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`HTTP error! status: ${response.status}, body: ${errorText}`);
      }
    } catch (_error) {
      console.error('🔍 API: Error updating milestone:', _error);
      throw _error;
    }
  },

  // Update step completion status
  updateStep: async (stepId: string, updates: { completed?: boolean; text?: string }): Promise<void> => {
    try {
      const token = await getAuthToken();
      const response = await fetch(`${configService.getBaseUrl()}/goals/steps/${stepId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(updates),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`HTTP error! status: ${response.status}, body: ${errorText}`);
      }
    } catch (_error) {
      console.error('🔍 API: Error updating step:', _error);
      throw _error;
    }
  },

  // Update an existing goal with all its data
  updateGoal: async (goalId: string, goalData: Partial<Goal>): Promise<Goal> => {
    try {
      const token = await getAuthToken();
      const response = await fetch(`${configService.getBaseUrl()}/goals/${goalId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(goalData),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`HTTP error! status: ${response.status}, body: ${errorText}`);
      }

      const data = await response.json();
      return data;
    } catch (_error) {
      console.error('🔍 API: Error updating goal:', _error);
      throw _error;
    }
  },

  // Delete a goal by ID
  deleteGoal: async (goalId: string): Promise<void> => {
    try {
      const token = await getAuthToken();
      const response = await fetch(`${configService.getBaseUrl()}/goals/${goalId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`HTTP error! status: ${response.status}, body: ${errorText}`);
      }
    } catch (_error) {
      console.error('🔍 API: Error deleting goal:', _error);
      throw _error;
    }
  },
};

interface Task {
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
}

export const tasksAPI = {
  // Get all tasks for the user
  getTasks: async (signal?: AbortSignal): Promise<Task[]> => {
    try {
      const token = await getAuthToken();
      
      const response = await fetch(`${configService.getBaseUrl()}/tasks`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
        signal,
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('🔍 API: Error response body:', errorText);
        throw new Error(`HTTP error! status: ${response.status}, body: ${errorText}`);
      }

      const data = await response.json();
      
      // Cache the tasks for offline use
      const { offlineService } = await import('./offline');
      await offlineService.cacheTasks(data);
      
      return data;
    } catch (_error) {
      if ((_error as any)?.name === 'AbortError') {
        // Silent for expected timeouts; caller handles gracefully
        throw _error;
      }
      console.error('🔍 API: Error fetching tasks:', _error);
      
      // Try to get cached tasks if offline
      const { offlineService } = await import('./offline');
      if (offlineService.shouldUseCache()) {
        const cachedTasks = await offlineService.getCachedTasks();
        if (cachedTasks) {
          console.warn('Using cached tasks due to offline status');
          return cachedTasks;
        }
      }
      
      throw _error;
    }
  },

  // Bulk create tasks (atomic insert)
  bulkCreateTasks: async (tasks: Partial<Task>[]): Promise<Task[]> => {
    try {
      const response = await fetch(`${configService.getBaseUrl()}/tasks/bulk`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${await getAuthToken()}`,
        },
        body: JSON.stringify(tasks),
      });
      if (!response.ok) {
        const text = await response.text();
        throw new Error(`HTTP error! status: ${response.status}, body: ${text}`);
      }
      return await response.json();
    } catch (_error) {
      console.error('Error bulk creating tasks:', _error);
      throw _error;
    }
  },

  // Get a single task by ID
  getTaskById: async (taskId: string): Promise<Task> => {
    try {
      const token = await getAuthToken();
      const response = await fetch(`${configService.getBaseUrl()}/tasks/${taskId}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('🔍 API: Error response body:', errorText);
        throw new Error(`HTTP error! status: ${response.status}, body: ${errorText}`);
      }

      const data = await response.json();
      return data;
    } catch (_error) {
      console.error('🔍 API: Error fetching task by ID:', _error);
      throw _error;
    }
  },

  // Create a new task
  createTask: async (taskData: Partial<Task>): Promise<Task> => {
    try {
      const response = await fetch(`${configService.getBaseUrl()}/tasks`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${await getAuthToken()}`,
        },
        body: JSON.stringify(taskData),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (_error) {
      console.error('Error creating task:', _error);
      
      // Add to offline queue if network error
      const { offlineService } = await import('./offline');
      if (!offlineService.getNetworkStatus()) {
        const actionId = await offlineService.addToOfflineQueue({
          type: 'CREATE_TASK',
          data: taskData,
          id: `temp_${Date.now()}`,
        });
        console.warn('Added task creation to offline queue:', actionId);
        return { id: actionId, offline: true, ...taskData } as Task;
      }
      
      throw _error;
    }
  },

  // Update an existing task
  updateTask: async (taskId: string, taskData: Partial<Task>): Promise<Task> => {
    try {
      const token = await getAuthToken();
      const response = await fetch(`${configService.getBaseUrl()}/tasks/${taskId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(taskData),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`HTTP error! status: ${response.status}, body: ${errorText}`);
      }

      const data = await response.json();
      return data;
    } catch (_error) {
      console.error('🔍 API: Error updating task:', _error);
      
      // Add to offline queue if network error
      const { offlineService } = await import('./offline');
      if (!offlineService.getNetworkStatus()) {
        const actionId = await offlineService.addToOfflineQueue({
          type: 'UPDATE_TASK',
          data: taskData,
          id: taskId,
        });
        console.warn('Added task update to offline queue:', actionId);
        return { id: taskId, offline: true, ...taskData } as Task;
      }
      
      throw _error;
    }
  },

  // Delete a task
  deleteTask: async (taskId: string): Promise<void> => {
    try {
      const token = await getAuthToken();
      const response = await fetch(`${configService.getBaseUrl()}/tasks/${taskId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`HTTP error! status: ${response.status}, body: ${errorText}`);
      }
    } catch (_error) {
      console.error('🔍 API: Error deleting task:', _error);
      
      // Add to offline queue if network error
      const { offlineService } = await import('./offline');
      if (!offlineService.getNetworkStatus()) {
        const actionId = await offlineService.addToOfflineQueue({
          type: 'DELETE_TASK',
          id: taskId,
        });
        console.warn('Added task deletion to offline queue:', actionId);
        return;
      }
      
      throw _error;
    }
  },
};

// Calendar API
export const calendarAPI = {
  // Get all events from backend database
  getEvents: async (maxResults: number = 100): Promise<any> => {
    try {
      const token = await getAuthToken();
      const response = await fetch(`${configService.getBaseUrl()}/calendar/events?maxResults=${maxResults}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const events = await response.json();
      
      // Cache the events for offline use
      const { offlineService } = await import('./offline');
      await offlineService.cacheEvents(events);
      
      return events;
    } catch (_error) {
      console.error('Error fetching calendar events:', _error);
      
      // Try to get cached events if offline
      const { offlineService } = await import('./offline');
      if (offlineService.shouldUseCache()) {
        const cachedEvents = await offlineService.getCachedEvents();
        if (cachedEvents) {
          console.warn('Using cached events due to offline status');
          return cachedEvents;
        }
      }
      
      throw _error;
    }
  },

  // Get events for a specific date from backend database
  getEventsForDate: async (date: string): Promise<any> => {
    try {
      const token = await getAuthToken();
      const response = await fetch(`${configService.getBaseUrl()}/calendar/events/date?date=${date}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (_error) {
      console.error('Error fetching events for date:', _error);
      throw _error;
    }
  },

  // Create a new event (uses backend proxy)
  createEvent: async (eventData: {
    summary: string;
    description?: string;
    startTime: string;
    endTime: string;
    timeZone?: string;
    location?: string;
  }): Promise<any> => {
    try {
      const token = await getAuthToken();
      const response = await fetch(`${configService.getBaseUrl()}/calendar/events`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          ...eventData,
          useSupabase: true, // Use direct Supabase storage
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (_error) {
      console.error('Error creating calendar event:', _error);
      
      // Add to offline queue if network error
      const { offlineService } = await import('./offline');
      if (!offlineService.getNetworkStatus()) {
        const actionId = await offlineService.addToOfflineQueue({
          type: 'CREATE_EVENT',
          data: eventData,
          id: `temp_${Date.now()}`,
        });
        console.warn('Added event creation to offline queue:', actionId);
        return { id: actionId, offline: true };
      }
      
      throw _error;
    }
  },

  // Update an existing event (uses backend proxy)
  updateEvent: async (eventId: string, eventData: {
    summary: string;
    description?: string;
    startTime: string;
    endTime: string;
    timeZone?: string;
    location?: string;
  }): Promise<any> => {
    try {
      const token = await getAuthToken();
      const response = await fetch(`${configService.getBaseUrl()}/calendar/events/${eventId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          ...eventData,
          useSupabase: true, // Use direct Supabase storage
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (_error) {
      console.error('Error updating calendar event:', _error);
      
      // Add to offline queue if network error
      const { offlineService } = await import('./offline');
      if (!offlineService.getNetworkStatus()) {
        const actionId = await offlineService.addToOfflineQueue({
          type: 'UPDATE_EVENT',
          data: eventData,
          id: eventId,
        });
        console.warn('Added event update to offline queue:', actionId);
        return { id: actionId, offline: true };
      }
      
      throw _error;
    }
  },

  // Delete an event (uses backend proxy)
  deleteEvent: async (eventId: string): Promise<void> => {
    try {
      const token = await getAuthToken();
      const response = await fetch(`${configService.getBaseUrl()}/calendar/events/${eventId}?useSupabase=true`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
    } catch (_error) {
      console.error('Error deleting calendar event:', _error);
      
      // Add to offline queue if network error
      const { offlineService } = await import('./offline');
      if (!offlineService.getNetworkStatus()) {
        const actionId = await offlineService.addToOfflineQueue({
          type: 'DELETE_EVENT',
          id: eventId,
        });
        console.warn('Added event deletion to offline queue:', actionId);
        return;
      }
      
      throw _error;
    }
  },

  // Sync calendar (existing functionality)
  syncCalendar: async (): Promise<any> => {
    try {
      const token = await getAuthToken();
      const response = await fetch(`${configService.getBaseUrl()}/calendar/sync`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (_error) {
      console.error('Error syncing calendar:', _error);
      throw _error;
    }
  },
};

// Auto-scheduling API
export const autoSchedulingAPI = {
  // Bulk auto-schedule all eligible tasks
  autoScheduleTasks: async (): Promise<AutoSchedulingResult> => {
    try {
      const token = await getAuthToken();
      const response = await fetch(`${configService.getBaseUrl()}/ai/auto-schedule-tasks`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('🔍 API: Error response body:', errorText);
        throw new Error(`HTTP error! status: ${response.status}, body: ${errorText}`);
      }

      const data = await response.json();
      return data;
    } catch (_error) {
      console.error('🔍 API: Error auto-scheduling tasks:', _error);
      throw _error;
    }
  },

  // Get user scheduling preferences
  getPreferences: async (): Promise<SchedulingPreferences> => {
    try {
      const token = await getAuthToken();
      const response = await fetch(`${configService.getBaseUrl()}/ai/scheduling-preferences`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('🔍 API: Error response body:', errorText);
        throw new Error(`HTTP error! status: ${response.status}, body: ${errorText}`);
      }

      const data = await response.json();
      return data;
    } catch (_error) {
      console.error('🔍 API: Error fetching scheduling preferences:', _error);
      throw _error;
    }
  },

  // Update user scheduling preferences
  updatePreferences: async (preferences: Partial<SchedulingPreferences>): Promise<SchedulingPreferences> => {
    try {
      const token = await getAuthToken();
      const response = await fetch(`${configService.getBaseUrl()}/ai/scheduling-preferences`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(preferences),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('🔍 API: Error response body:', errorText);
        throw new Error(`HTTP error! status: ${response.status}, body: ${errorText}`);
      }

      const data = await response.json();
      return data;
    } catch (_error) {
      console.error('🔍 API: Error updating scheduling preferences:', _error);
      throw _error;
    }
  },

  // Get auto-scheduling status for a specific task
  getTaskSchedulingStatus: async (taskId: string): Promise<TaskSchedulingStatus> => {
    try {
      const token = await getAuthToken();
      const response = await fetch(`${configService.getBaseUrl()}/tasks/${taskId}/scheduling-status`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('🔍 API: Error response body:', errorText);
        throw new Error(`HTTP error! status: ${response.status}, body: ${errorText}`);
      }

      const data = await response.json();
      return data;
    } catch (_error) {
      console.error('🔍 API: Error fetching task scheduling status:', _error);
      throw _error;
    }
  },

  // Toggle auto-scheduling for a specific task
  toggleTaskAutoScheduling: async (taskId: string, enabled: boolean): Promise<void> => {
    try {
      const token = await getAuthToken();
      const response = await fetch(`${configService.getBaseUrl()}/tasks/${taskId}/auto-schedule`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ auto_schedule_enabled: enabled }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('🔍 API: Error response body:', errorText);
        throw new Error(`HTTP error! status: ${response.status}, body: ${errorText}`);
      }
    } catch (_error) {
      console.error('🔍 API: Error toggling task auto-scheduling:', _error);
      throw _error;
    }
  },

  // Get available time slots for a task
  getAvailableTimeSlots: async (taskId: string): Promise<TimeSlot[]> => {
    try {
      const token = await getAuthToken();
      const response = await fetch(`${configService.getBaseUrl()}/ai/available-time-slots?taskId=${taskId}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('🔍 API: Error response body:', errorText);
        throw new Error(`HTTP error! status: ${response.status}, body: ${errorText}`);
      }

      const data = await response.json();
      return data.map((slot: any) => ({
        ...slot,
        start_time: new Date(slot.start_time),
        end_time: new Date(slot.end_time),
      }));
    } catch (_error) {
      console.error('🔍 API: Error fetching available time slots:', _error);
      throw _error;
    }
  },
};

// Helper function to get auth token from auth service
async function getAuthToken(): Promise<string> {
  const { authService } = await import('./auth');
  const token = await authService.getAuthToken();
  if (!token) {
    throw new Error('No authentication token available');
  }
  return token;
}

// Users API for profile endpoints
export const usersAPI = {
  getMe: async (): Promise<any> => {
    const token = await getAuthToken();
    const response = await fetch(`${configService.getBaseUrl()}/user/me`, {
      method: 'GET',
      headers: { 'Authorization': `Bearer ${token}` },
    });
    if (!response.ok) {throw new Error(await response.text());}
    return response.json();
  },
  updateMe: async (payload: Partial<{ full_name: string; avatar_url: string; geographic_location: string; theme_preference: 'light'|'dark'; notification_preferences: any; }>): Promise<any> => {
    const token = await getAuthToken();
    const response = await fetch(`${configService.getBaseUrl()}/user/me`, {
      method: 'PUT',
      headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (!response.ok) {throw new Error(await response.text());}
    return response.json();
  }
};