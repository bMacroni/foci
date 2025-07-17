// import axios, { AxiosInstance, AxiosResponse } from 'axios';
import * as SecureStore from 'expo-secure-store';
import { User, Goal, Task, CalendarEvent, ConversationThread, ConversationMessage, AuthResponse } from '../types';

// Create axios instance with base configuration
const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'http://192.168.1.66:5000/api';
console.log('API_BASE_URL:', API_BASE_URL);
const api = {
  // baseURL: API_BASE_URL,
  // headers: {
  //   'Content-Type': 'application/json',
  // },
};


// Request interceptor to add auth token
api.interceptors.request.use(
  async (config) => {
    const token = await SecureStore.getItemAsync('jwt_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for error handling
api.interceptors.response.use(
  (response: any) => response,
  async (error) => {
    if (error.response?.status === 401) {
      // Token expired or invalid
      await SecureStore.deleteItemAsync('jwt_token');
      // You might want to trigger a navigation to login here
    }
    return Promise.reject(error);
  }
);

// Auth API
export const authAPI = {
  login: async (email: string, password: string): Promise<AuthResponse> => {
    const response = await api.post('/auth/login', { email, password });
    const { token, user } = response.data;
    await SecureStore.setItemAsync('jwt_token', token);
    return response.data;
  },

  signup: async (email: string, password: string): Promise<AuthResponse> => {
    const response = await api.post('/auth/signup', { email, password });
    const { token, user } = response.data;
    if (token) {
      await SecureStore.setItemAsync('jwt_token', token);
    }
    return response.data;
  },

  logout: async (): Promise<void> => {
    await SecureStore.deleteItemAsync('jwt_token');
  },

  getProfile: async (): Promise<User> => {
    const response = await api.get('/auth/profile');
    return response.data;
  },
};

// Goals API
export const goalsAPI = {
  getAll: async (): Promise<Goal[]> => {
    const response = await api.get('/goals');
    return response.data;
  },

  getById: async (id: string): Promise<Goal> => {
    const response = await api.get(`/goals/${id}`);
    return response.data;
  },

  create: async (goalData: Partial<Goal>): Promise<Goal> => {
    const response = await api.post('/goals', goalData);
    return response.data;
  },

  update: async (id: string, goalData: Partial<Goal>): Promise<Goal> => {
    const response = await api.put(`/goals/${id}`, goalData);
    return response.data;
  },

  delete: async (id: string): Promise<void> => {
    await api.delete(`/goals/${id}`);
  },
};

// Tasks API
export const tasksAPI = {
  getAll: async (): Promise<Task[]> => {
    const response = await api.get('/tasks');
    return response.data;
  },

  getById: async (id: string): Promise<Task> => {
    const response = await api.get(`/tasks/${id}`);
    return response.data;
  },

  create: async (taskData: Partial<Task>): Promise<Task> => {
    const response = await api.post('/tasks', taskData);
    return response.data;
  },

  update: async (id: string, taskData: Partial<Task>): Promise<Task> => {
    const response = await api.put(`/tasks/${id}`, taskData);
    return response.data;
  },

  delete: async (id: string): Promise<void> => {
    await api.delete(`/tasks/${id}`);
  },

  bulkCreate: async (tasks: Partial<Task>[]): Promise<Task[]> => {
    const response = await api.post('/tasks/bulk', tasks);
    return response.data;
  },
};

// Calendar API
export const calendarAPI = {
  getStatus: async (): Promise<{ connected: boolean; email?: string }> => {
    const response = await api.get('/calendar/status');
    return response.data;
  },

  getEvents: async (maxResults: number = 10): Promise<CalendarEvent[]> => {
    const response = await api.get(`/calendar/events?maxResults=${maxResults}`);
    return response.data;
  },

  createEvent: async (eventData: Partial<CalendarEvent>): Promise<CalendarEvent> => {
    const response = await api.post('/calendar/events', eventData);
    return response.data;
  },

  updateEvent: async (eventId: string, eventData: Partial<CalendarEvent>): Promise<CalendarEvent> => {
    const response = await api.put(`/calendar/events/${eventId}`, eventData);
    return response.data;
  },

  deleteEvent: async (eventId: string): Promise<void> => {
    await api.delete(`/calendar/events/${eventId}`);
  },

  getCalendarList: async (): Promise<any[]> => {
    const response = await api.get('/calendar/list');
    return response.data;
  },
};

// AI API
export const aiAPI = {
  sendMessage: async (message: string, threadId?: string): Promise<{ response: string; threadId?: string }> => {
    const response = await api.post('/ai/chat', { message, threadId });
    return {
      response: response.data.message, // Map 'message' to 'response' for mobile app
      threadId: response.data.threadId
    };
  },

  getGoalSuggestions: async (goalTitle: string): Promise<string[]> => {
    const response = await api.post('/ai/goal-suggestions', { goalTitle });
    return response.data;
  },

  createThread: async (title: string, summary?: string): Promise<ConversationThread> => {
    const response = await api.post('/ai/threads', { title, summary });
    return response.data;
  },

  recommendTask: async (userRequest: string): Promise<Task> => {
    const response = await api.post('/ai/recommend-task', { userRequest });
    return response.data;
  },
};

// Conversations API
export const conversationsAPI = {
  getThreads: async (): Promise<ConversationThread[]> => {
    const response = await api.get('/conversations/threads');
    return response.data;
  },

  getThread: async (threadId: string): Promise<ConversationThread> => {
    const response = await api.get(`/conversations/threads/${threadId}`);
    return response.data;
  },

  createThread: async (title: string, summary?: string): Promise<ConversationThread> => {
    const response = await api.post('/conversations/threads', { title, summary });
    return response.data;
  },

  addMessage: async (
    threadId: string,
    content: string,
    role: 'user' | 'assistant',
    metadata?: any
  ): Promise<ConversationMessage> => {
    const response = await api.post(`/conversations/threads/${threadId}/messages`, {
      content,
      role,
      metadata,
    });
    return response.data;
  },

  updateThread: async (threadId: string, updates: Partial<ConversationThread>): Promise<ConversationThread> => {
    const response = await api.put(`/conversations/threads/${threadId}`, updates);
    return response.data;
  },

  deleteThread: async (threadId: string): Promise<void> => {
    await api.delete(`/conversations/threads/${threadId}`);
  },

  getStats: async (): Promise<any> => {
    const response = await api.get('/conversations/stats');
    return response.data;
  },
};

// Health check
export const healthCheck = async (): Promise<{ status: string }> => {
  const response = await api.get('/health');
  return response.data;
};

export default api; 