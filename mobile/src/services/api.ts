// Real API implementation for backend integration
// For Android emulator, use 10.0.2.2 instead of localhost
// For physical device, use your computer's IP address (e.g., 192.168.1.100)
const API_BASE_URL = 'http://192.168.1.66:5000/api'; // Backend runs on port 5000

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

export const goalsAPI = {
  // Generate AI-powered goal breakdown using real backend
  generateBreakdown: async (data: GoalBreakdownRequest): Promise<GoalBreakdownResponse> => {
    try {
      const response = await fetch(`${API_BASE_URL}/goals/generate-breakdown`, {
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
    } catch (error) {
      console.error('Error generating goal breakdown:', error);
      throw error;
    }
  },

  // Create a new goal using real backend
  createGoal: async (goalData: Goal): Promise<Goal> => {
    try {
      const response = await fetch(`${API_BASE_URL}/goals`, {
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
    } catch (error) {
      console.error('Error creating goal:', error);
      throw error;
    }
  },

  // Get all goals for the user using real backend
  getGoals: async (): Promise<Goal[]> => {
    try {
      const token = await getAuthToken();
      
      const response = await fetch(`${API_BASE_URL}/goals`, {
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
      
      // Cache the goals for offline use
      const { offlineService } = await import('./offline');
      await offlineService.cacheGoals(data);
      
      return data;
    } catch (error) {
      console.error('🔍 API: Error fetching goals:', error);
      
      // Try to get cached goals if offline
      const { offlineService } = await import('./offline');
      if (offlineService.shouldUseCache()) {
        const cachedGoals = await offlineService.getCachedGoals();
        if (cachedGoals) {
          console.log('Using cached goals due to offline status');
          return cachedGoals;
        }
      }
      
      throw error;
    }
  },

  // Get a single goal by ID with milestones and steps
  getGoalById: async (goalId: string): Promise<Goal> => {
    try {
      const token = await getAuthToken();
      const response = await fetch(`${API_BASE_URL}/goals/${goalId}`, {
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
    } catch (error) {
      console.error('🔍 API: Error fetching goal by ID:', error);
      throw error;
    }
  },

  // Update milestone completion status
  updateMilestone: async (milestoneId: string, updates: { completed?: boolean; title?: string }): Promise<void> => {
    try {
      const token = await getAuthToken();
      const response = await fetch(`${API_BASE_URL}/goals/milestones/${milestoneId}`, {
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
    } catch (error) {
      console.error('🔍 API: Error updating milestone:', error);
      throw error;
    }
  },

  // Update step completion status
  updateStep: async (stepId: string, updates: { completed?: boolean; text?: string }): Promise<void> => {
    try {
      const token = await getAuthToken();
      const response = await fetch(`${API_BASE_URL}/goals/steps/${stepId}`, {
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
    } catch (error) {
      console.error('🔍 API: Error updating step:', error);
      throw error;
    }
  },

  // Update an existing goal with all its data
  updateGoal: async (goalId: string, goalData: Partial<Goal>): Promise<Goal> => {
    try {
      const token = await getAuthToken();
      const response = await fetch(`${API_BASE_URL}/goals/${goalId}`, {
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
    } catch (error) {
      console.error('🔍 API: Error updating goal:', error);
      throw error;
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
  getTasks: async (): Promise<Task[]> => {
    try {
      const token = await getAuthToken();
      
      const response = await fetch(`${API_BASE_URL}/tasks`, {
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
      
      // Cache the tasks for offline use
      const { offlineService } = await import('./offline');
      await offlineService.cacheTasks(data);
      
      return data;
    } catch (error) {
      console.error('🔍 API: Error fetching tasks:', error);
      
      // Try to get cached tasks if offline
      const { offlineService } = await import('./offline');
      if (offlineService.shouldUseCache()) {
        const cachedTasks = await offlineService.getCachedTasks();
        if (cachedTasks) {
          console.log('Using cached tasks due to offline status');
          return cachedTasks;
        }
      }
      
      throw error;
    }
  },

  // Get a single task by ID
  getTaskById: async (taskId: string): Promise<Task> => {
    try {
      const token = await getAuthToken();
      const response = await fetch(`${API_BASE_URL}/tasks/${taskId}`, {
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
    } catch (error) {
      console.error('🔍 API: Error fetching task by ID:', error);
      throw error;
    }
  },

  // Create a new task
  createTask: async (taskData: Partial<Task>): Promise<Task> => {
    try {
      const response = await fetch(`${API_BASE_URL}/tasks`, {
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
    } catch (error) {
      console.error('Error creating task:', error);
      
      // Add to offline queue if network error
      const { offlineService } = await import('./offline');
      if (!offlineService.getNetworkStatus()) {
        const actionId = await offlineService.addToOfflineQueue({
          type: 'CREATE_TASK',
          data: taskData,
          id: `temp_${Date.now()}`,
        });
        console.log('Added task creation to offline queue:', actionId);
        return { id: actionId, offline: true, ...taskData } as Task;
      }
      
      throw error;
    }
  },

  // Update an existing task
  updateTask: async (taskId: string, taskData: Partial<Task>): Promise<Task> => {
    try {
      const token = await getAuthToken();
      const response = await fetch(`${API_BASE_URL}/tasks/${taskId}`, {
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
    } catch (error) {
      console.error('🔍 API: Error updating task:', error);
      
      // Add to offline queue if network error
      const { offlineService } = await import('./offline');
      if (!offlineService.getNetworkStatus()) {
        const actionId = await offlineService.addToOfflineQueue({
          type: 'UPDATE_TASK',
          data: taskData,
          id: taskId,
        });
        console.log('Added task update to offline queue:', actionId);
        return { id: taskId, offline: true, ...taskData } as Task;
      }
      
      throw error;
    }
  },

  // Delete a task
  deleteTask: async (taskId: string): Promise<void> => {
    try {
      const token = await getAuthToken();
      const response = await fetch(`${API_BASE_URL}/tasks/${taskId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`HTTP error! status: ${response.status}, body: ${errorText}`);
      }
    } catch (error) {
      console.error('🔍 API: Error deleting task:', error);
      
      // Add to offline queue if network error
      const { offlineService } = await import('./offline');
      if (!offlineService.getNetworkStatus()) {
        const actionId = await offlineService.addToOfflineQueue({
          type: 'DELETE_TASK',
          id: taskId,
        });
        console.log('Added task deletion to offline queue:', actionId);
        return;
      }
      
      throw error;
    }
  },
};

// Calendar API
export const calendarAPI = {
  // Get all events from backend database
  getEvents: async (maxResults: number = 100): Promise<any> => {
    try {
      const token = await getAuthToken();
      const response = await fetch(`${API_BASE_URL}/calendar/events?maxResults=${maxResults}`, {
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
    } catch (error) {
      console.error('Error fetching calendar events:', error);
      
      // Try to get cached events if offline
      const { offlineService } = await import('./offline');
      if (offlineService.shouldUseCache()) {
        const cachedEvents = await offlineService.getCachedEvents();
        if (cachedEvents) {
          console.log('Using cached events due to offline status');
          return cachedEvents;
        }
      }
      
      throw error;
    }
  },

  // Get events for a specific date from backend database
  getEventsForDate: async (date: string): Promise<any> => {
    try {
      const token = await getAuthToken();
      const response = await fetch(`${API_BASE_URL}/calendar/events/date?date=${date}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error fetching events for date:', error);
      throw error;
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
      const response = await fetch(`${API_BASE_URL}/calendar/events`, {
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
    } catch (error) {
      console.error('Error creating calendar event:', error);
      
      // Add to offline queue if network error
      const { offlineService } = await import('./offline');
      if (!offlineService.getNetworkStatus()) {
        const actionId = await offlineService.addToOfflineQueue({
          type: 'CREATE_EVENT',
          data: eventData,
          id: `temp_${Date.now()}`,
        });
        console.log('Added event creation to offline queue:', actionId);
        return { id: actionId, offline: true };
      }
      
      throw error;
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
      const response = await fetch(`${API_BASE_URL}/calendar/events/${eventId}`, {
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
    } catch (error) {
      console.error('Error updating calendar event:', error);
      
      // Add to offline queue if network error
      const { offlineService } = await import('./offline');
      if (!offlineService.getNetworkStatus()) {
        const actionId = await offlineService.addToOfflineQueue({
          type: 'UPDATE_EVENT',
          data: eventData,
          id: eventId,
        });
        console.log('Added event update to offline queue:', actionId);
        return { id: actionId, offline: true };
      }
      
      throw error;
    }
  },

  // Delete an event (uses backend proxy)
  deleteEvent: async (eventId: string): Promise<void> => {
    try {
      const token = await getAuthToken();
      const response = await fetch(`${API_BASE_URL}/calendar/events/${eventId}?useSupabase=true`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
    } catch (error) {
      console.error('Error deleting calendar event:', error);
      
      // Add to offline queue if network error
      const { offlineService } = await import('./offline');
      if (!offlineService.getNetworkStatus()) {
        const actionId = await offlineService.addToOfflineQueue({
          type: 'DELETE_EVENT',
          id: eventId,
        });
        console.log('Added event deletion to offline queue:', actionId);
        return;
      }
      
      throw error;
    }
  },

  // Sync calendar (existing functionality)
  syncCalendar: async (): Promise<any> => {
    try {
      const token = await getAuthToken();
      const response = await fetch(`${API_BASE_URL}/calendar/sync`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error syncing calendar:', error);
      throw error;
    }
  },
};

// Auto-scheduling API
export const autoSchedulingAPI = {
  // Bulk auto-schedule all eligible tasks
  autoScheduleTasks: async (): Promise<AutoSchedulingResult> => {
    try {
      const token = await getAuthToken();
      const response = await fetch(`${API_BASE_URL}/ai/auto-schedule-tasks`, {
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
    } catch (error) {
      console.error('🔍 API: Error auto-scheduling tasks:', error);
      throw error;
    }
  },

  // Get user scheduling preferences
  getPreferences: async (): Promise<SchedulingPreferences> => {
    try {
      const token = await getAuthToken();
      const response = await fetch(`${API_BASE_URL}/ai/scheduling-preferences`, {
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
    } catch (error) {
      console.error('🔍 API: Error fetching scheduling preferences:', error);
      throw error;
    }
  },

  // Update user scheduling preferences
  updatePreferences: async (preferences: Partial<SchedulingPreferences>): Promise<SchedulingPreferences> => {
    try {
      const token = await getAuthToken();
      const response = await fetch(`${API_BASE_URL}/ai/scheduling-preferences`, {
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
    } catch (error) {
      console.error('🔍 API: Error updating scheduling preferences:', error);
      throw error;
    }
  },

  // Get auto-scheduling status for a specific task
  getTaskSchedulingStatus: async (taskId: string): Promise<TaskSchedulingStatus> => {
    try {
      const token = await getAuthToken();
      const response = await fetch(`${API_BASE_URL}/tasks/${taskId}/scheduling-status`, {
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
    } catch (error) {
      console.error('🔍 API: Error fetching task scheduling status:', error);
      throw error;
    }
  },

  // Toggle auto-scheduling for a specific task
  toggleTaskAutoScheduling: async (taskId: string, enabled: boolean): Promise<void> => {
    try {
      const token = await getAuthToken();
      const response = await fetch(`${API_BASE_URL}/tasks/${taskId}/auto-schedule`, {
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
    } catch (error) {
      console.error('🔍 API: Error toggling task auto-scheduling:', error);
      throw error;
    }
  },

  // Get available time slots for a task
  getAvailableTimeSlots: async (taskId: string): Promise<TimeSlot[]> => {
    try {
      const token = await getAuthToken();
      const response = await fetch(`${API_BASE_URL}/ai/available-time-slots?taskId=${taskId}`, {
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
    } catch (error) {
      console.error('🔍 API: Error fetching available time slots:', error);
      throw error;
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
