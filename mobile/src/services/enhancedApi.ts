import { errorHandlingService, ErrorCategory, ErrorContext, UserFriendlyError } from './errorHandling';
import { authService } from './auth';
import { configService } from './config';

// Real API implementation for backend integration

// Enhanced API wrapper with retry logic and error handling
class EnhancedAPI {
  private async makeRequest<T>(
    url: string,
    options: RequestInit,
    category: ErrorCategory,
    operation: string,
    retryCount: number = 0
  ): Promise<T> {
    const context: ErrorContext = {
      operation,
      endpoint: url,
      timestamp: Date.now(),
      retryCount,
    };

    try {
      // Add auth token if not present
      if (!options.headers || !(options.headers as Record<string, string>).Authorization) {
        const token = await authService.getAuthToken();
        options.headers = {
          ...options.headers,
          'Authorization': `Bearer ${token}`,
        };
      }

      const response = await fetch(url, options);

      if (!response.ok) {
        const errorText = await response.text();
        const error = new Error(`HTTP error! status: ${response.status}, body: ${errorText}`);
        (error as any).status = response.status;
        (error as any).response = { status: response.status, data: errorText };
        
        // Handle error with retry logic
        const userError = await errorHandlingService.handleError(error, category, context);
        
        // Check if we should retry
        if (userError.retryable && retryCount < 3) {
          const delay = Math.pow(2, retryCount) * 1000; // Exponential backoff
          await new Promise(resolve => setTimeout(resolve, delay));
          return this.makeRequest(url, options, category, operation, retryCount + 1);
        }
        
        throw userError;
      }

      return await response.json();
    } catch (error) {
      // If it's already a UserFriendlyError, re-throw it
      if ((error as any).title && (error as any).message) {
        throw error;
      }
      
      // Handle the error and potentially retry
      const userError = await errorHandlingService.handleError(error, category, context);
      
      // Check if we should retry
      if (userError.retryable && retryCount < 3) {
        const delay = Math.pow(2, retryCount) * 1000; // Exponential backoff
        await new Promise(resolve => setTimeout(resolve, delay));
        return this.makeRequest(url, options, category, operation, retryCount + 1);
      }
      
      throw userError;
    }
  }

  // Calendar API methods
  async getEvents(maxResults: number = 100): Promise<any> {
    return this.makeRequest(
      `${configService.getBaseUrl()}/calendar/events?maxResults=${maxResults}`,
      { method: 'GET' },
      ErrorCategory.CALENDAR,
      'getEvents'
    );
  }

  async getEventsForDate(date: string): Promise<any> {
    return this.makeRequest(
      `${configService.getBaseUrl()}/calendar/events/date?date=${date}`,
      { method: 'GET' },
      ErrorCategory.CALENDAR,
      'getEventsForDate'
    );
  }

  async createEvent(eventData: {
    summary: string;
    description?: string;
    startTime: string;
    endTime: string;
    timeZone?: string;
    location?: string;
    eventType?: 'event'|'task'|'goal';
    taskId?: string;
    goalId?: string;
    isAllDay?: boolean;
  }): Promise<any> {
    return this.makeRequest(
      `${configService.getBaseUrl()}/calendar/events`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...eventData,
          useSupabase: true,
          eventType: eventData.eventType,
          taskId: eventData.taskId,
          goalId: eventData.goalId,
          isAllDay: eventData.isAllDay,
        }),
      },
      ErrorCategory.CALENDAR,
      'createEvent'
    );
  }

  async updateEvent(eventId: string, eventData: {
    summary: string;
    description?: string;
    startTime: string;
    endTime: string;
    timeZone?: string;
    location?: string;
    eventType?: 'event'|'task'|'goal';
    taskId?: string;
    goalId?: string;
    isAllDay?: boolean;
  }): Promise<any> {
    return this.makeRequest(
      `${configService.getBaseUrl()}/calendar/events/${eventId}`,
      {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...eventData,
          useSupabase: true,
          eventType: eventData.eventType,
          taskId: eventData.taskId,
          goalId: eventData.goalId,
          isAllDay: eventData.isAllDay,
        }),
      },
      ErrorCategory.CALENDAR,
      'updateEvent'
    );
  }

  async deleteEvent(eventId: string): Promise<void> {
    return this.makeRequest(
      `${configService.getBaseUrl()}/calendar/events/${eventId}?useSupabase=true`,
      { method: 'DELETE' },
      ErrorCategory.CALENDAR,
      'deleteEvent'
    );
  }

  async syncCalendar(): Promise<any> {
    return this.makeRequest(
      `${configService.getBaseUrl()}/calendar/sync`,
      { method: 'POST' },
      ErrorCategory.SYNC,
      'syncCalendar'
    );
  }

  async getCalendarStatus(): Promise<{ connected: boolean; email?: string; lastUpdated?: string; error?: string; details?: string; }>{
    return this.makeRequest(
      `${configService.getBaseUrl()}/calendar/status`,
      { method: 'GET' },
      ErrorCategory.CALENDAR,
      'getCalendarStatus'
    );
  }



  async importCalendarFirstRun(): Promise<{ success: boolean; count?: number; warning?: string; error?: string; details?: string; }>{
    return this.makeRequest(
      `${configService.getBaseUrl()}/calendar/import/first-run`,
      { method: 'POST' },
      ErrorCategory.SYNC,
      'importCalendarFirstRun'
    );
  }

  async getAppPreferences(): Promise<any> {
    return this.makeRequest(
      `${configService.getBaseUrl()}/user/app-preferences`,
      { method: 'GET' },
      ErrorCategory.SYNC,
      'getAppPreferences'
    );
  }

  async updateAppPreferences(preferences: any): Promise<any> {
    return this.makeRequest(
      `${configService.getBaseUrl()}/user/app-preferences`,
      {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(preferences),
      },
      ErrorCategory.SYNC,
      'updateAppPreferences'
    );
  }

  // Tasks API methods
  async getTasks(): Promise<any> {
    return this.makeRequest(
      `${configService.getBaseUrl()}/tasks`,
      { method: 'GET' },
      ErrorCategory.TASKS,
      'getTasks'
    );
  }

  async getTaskById(taskId: string): Promise<any> {
    return this.makeRequest(
      `${configService.getBaseUrl()}/tasks/${taskId}`,
      { method: 'GET' },
      ErrorCategory.TASKS,
      'getTaskById'
    );
  }

  async createTask(taskData: any): Promise<any> {
    return this.makeRequest(
      `${configService.getBaseUrl()}/tasks`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(taskData),
      },
      ErrorCategory.TASKS,
      'createTask'
    );
  }

  async updateTask(taskId: string, taskData: any): Promise<any> {
    return this.makeRequest(
      `${configService.getBaseUrl()}/tasks/${taskId}`,
      {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(taskData),
      },
      ErrorCategory.TASKS,
      'updateTask'
    );
  }

  async deleteTask(taskId: string): Promise<void> {
    return this.makeRequest(
      `${configService.getBaseUrl()}/tasks/${taskId}`,
      { method: 'DELETE' },
      ErrorCategory.TASKS,
      'deleteTask'
    );
  }

  // Goals API methods
  async getGoals(): Promise<any> {
    return this.makeRequest(
      `${configService.getBaseUrl()}/goals`,
      { method: 'GET' },
      ErrorCategory.GOALS,
      'getGoals'
    );
  }

  async createGoal(goalData: any): Promise<any> {
    return this.makeRequest(
      `${configService.getBaseUrl()}/goals`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(goalData),
      },
      ErrorCategory.GOALS,
      'createGoal'
    );
  }

  async updateGoal(goalId: string, goalData: any): Promise<any> {
    return this.makeRequest(
      `${configService.getBaseUrl()}/goals/${goalId}`,
      {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(goalData),
      },
      ErrorCategory.GOALS,
      'updateGoal'
    );
  }

  async deleteGoal(goalId: string): Promise<void> {
    return this.makeRequest(
      `${configService.getBaseUrl()}/goals/${goalId}`,
      { method: 'DELETE' },
      ErrorCategory.GOALS,
      'deleteGoal'
    );
  }

  // Auto-scheduling API methods
  async autoScheduleTasks(): Promise<any> {
    return this.makeRequest(
      `${configService.getBaseUrl()}/ai/auto-schedule-tasks`,
      { method: 'POST' },
      ErrorCategory.SYNC,
      'autoScheduleTasks'
    );
  }

  async getSchedulingPreferences(): Promise<any> {
    return this.makeRequest(
      `${configService.getBaseUrl()}/ai/scheduling-preferences`,
      { method: 'GET' },
      ErrorCategory.SYNC,
      'getSchedulingPreferences'
    );
  }

  async updateSchedulingPreferences(preferences: any): Promise<any> {
    return this.makeRequest(
      `${configService.getBaseUrl()}/ai/scheduling-preferences`,
      {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(preferences),
      },
      ErrorCategory.SYNC,
      'updateSchedulingPreferences'
    );
  }
}

// Export singleton instance
export const enhancedAPI = new EnhancedAPI();

// Export types for use in other files
export type { UserFriendlyError, ErrorContext }; 