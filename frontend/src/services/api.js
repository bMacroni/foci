import axios from 'axios';

// Create axios instance with base configuration
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('jwt_token');
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
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Token expired or invalid
      localStorage.removeItem('jwt_token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Goals API
export const goalsAPI = {
  getAll: () => api.get('/goals'),
  getById: (id) => api.get(`/goals/${id}`),
  create: (goalData) => api.post('/goals', goalData),
  update: (id, goalData) => api.put(`/goals/${id}`, goalData),
  delete: (id) => api.delete(`/goals/${id}`),
};

// Tasks API
export const tasksAPI = {
  getAll: () => api.get('/tasks'),
  getById: (id) => api.get(`/tasks/${id}`),
  create: (taskData) => api.post('/tasks', taskData),
  update: (id, taskData) => api.put(`/tasks/${id}`, taskData),
  delete: (id) => api.delete(`/tasks/${id}`),
  bulkCreate: (tasks) => api.post('/tasks/bulk', tasks),
  // Auto-scheduling endpoints
  toggleAutoSchedule: (id, enabled) => api.put(`/tasks/${id}/toggle-auto-schedule`, { auto_schedule_enabled: enabled }),
  getAutoSchedulingDashboard: () => api.get('/tasks/auto-scheduling/dashboard'),
  getUserSchedulingPreferences: () => api.get('/tasks/auto-scheduling/preferences'),
  updateUserSchedulingPreferences: (preferences) => api.put('/tasks/auto-scheduling/preferences', preferences),
  getTaskSchedulingHistory: (taskId) => api.get(`/tasks/auto-scheduling/history${taskId ? `/${taskId}` : ''}`),
  triggerAutoScheduling: () => api.post('/tasks/auto-scheduling/trigger'),
  // Notification endpoints
  getNotifications: (limit) => api.get(`/tasks/notifications${limit ? `?limit=${limit}` : ''}`),
  markNotificationAsRead: (id) => api.put(`/tasks/notifications/${id}/read`),
  markAllNotificationsAsRead: () => api.put('/tasks/notifications/read-all'),
};

// Calendar API
export const calendarAPI = {
  getStatus: () => api.get('/calendar/status'),
  getEvents: (maxResults = 10) => api.get(`/calendar/events?maxResults=${maxResults}`),
  createEvent: (eventData) => api.post('/calendar/events', eventData),
  updateEvent: (eventId, eventData) => api.put(`/calendar/events/${eventId}`, eventData),
  deleteEvent: (eventId) => api.delete(`/calendar/events/${eventId}`),
  getCalendarList: () => api.get('/calendar/list'),
  syncEvents: () => api.post('/calendar/sync'),
  scheduleTask: (taskId) => api.post('/calendar/schedule-task', { taskId }),
};

// AI API
export const aiAPI = {
  setMood: (mood) => {
    if (mood) {
      api.defaults.headers.common['X-User-Mood'] = mood;
    } else {
      delete api.defaults.headers.common['X-User-Mood'];
    }
  },
  sendMessage: (message, threadId) => api.post('/ai/chat', { message, threadId }),
  getGoalSuggestions: (goalTitle) => api.post('/ai/goal-suggestions', { goalTitle }),
  getGoalBreakdown: (goalTitle, goalDescription) => api.post('/ai/goal-breakdown', { goalTitle, goalDescription }),
  createThread: ({ title, summary, messages }) => api.post('/ai/threads', { title, summary, messages }),
  recommendTask: (userRequest) => api.post('/ai/recommend-task', { userRequest }),
};

// Conversations API
export const conversationsAPI = {
  getThreads: () => api.get('/conversations/threads'),
  getThread: (threadId) => api.get(`/conversations/threads/${threadId}`),
  createThread: ({ title, summary, messages }) => api.post('/conversations/threads', { title, summary, messages }),
  addMessage: (threadId, content, role, metadata) => api.post(`/conversations/threads/${threadId}/messages`, { content, role, metadata }),
  updateThread: (threadId, updates) => api.put(`/conversations/threads/${threadId}`, updates),
  deleteThread: (threadId) => api.delete(`/conversations/threads/${threadId}`),
  getStats: () => api.get('/conversations/stats'),
};

// Milestones API
export const milestonesAPI = {
  create: async (goalId, milestoneData, token) => {
    const res = await fetch(`${API_BASE_URL}/goals/${goalId}/milestones`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify(milestoneData),
    });
    if (!res.ok) throw new Error(await res.text());
    return res.json();
  },
  update: async (milestoneId, milestoneData, token) => {
    const res = await fetch(`${API_BASE_URL}/goals/milestones/${milestoneId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify(milestoneData),
    });
    if (!res.ok) throw new Error(await res.text());
    return res.json();
  },
  delete: async (milestoneId, token) => {
    const res = await fetch(`${API_BASE_URL}/goals/milestones/${milestoneId}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) throw new Error(await res.text());
    return res.json();
  },
  readAll: async (goalId, token) => {
    const res = await fetch(`${API_BASE_URL}/goals/${goalId}/milestones`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) throw new Error(await res.text());
    return res.json();
  },
  lookup: async ({ milestoneId, goalId, title, token }) => {
    let url;
    if (milestoneId) {
      url = `${API_BASE_URL}/goals/milestones/${milestoneId}`;
    } else if (goalId && title) {
      url = `${API_BASE_URL}/goals/${goalId}/milestones/lookup?title=${encodeURIComponent(title)}`;
    } else {
      throw new Error('Must provide milestoneId or goalId and title');
    }
    const res = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
    if (!res.ok) throw new Error(await res.text());
    return res.json();
  },
};

// Steps API
export const stepsAPI = {
  create: async (milestoneId, stepData, token) => {
    const res = await fetch(`${API_BASE_URL}/goals/milestones/${milestoneId}/steps`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify(stepData),
    });
    if (!res.ok) throw new Error(await res.text());
    return res.json();
  },
  update: async (stepId, stepData, token) => {
    const res = await fetch(`${API_BASE_URL}/goals/steps/${stepId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify(stepData),
    });
    if (!res.ok) {
      const errorText = await res.text();
      throw new Error(errorText);
    }
    const result = await res.json();
    return result;
  },
  delete: async (stepId, token) => {
    const res = await fetch(`${API_BASE_URL}/goals/steps/${stepId}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) throw new Error(await res.text());
    return res.json();
  },
  readAll: async (milestoneId, token) => {
    const res = await fetch(`${API_BASE_URL}/goals/milestones/${milestoneId}/steps`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) throw new Error(await res.text());
    return res.json();
  },
  lookup: async ({ stepId, milestoneId, text, token }) => {
    let url;
    if (stepId) {
      url = `${API_BASE_URL}/goals/steps/${stepId}`;
    } else if (milestoneId && text) {
      url = `${API_BASE_URL}/goals/milestones/${milestoneId}/steps/lookup?text=${encodeURIComponent(text)}`;
    } else {
      throw new Error('Must provide stepId or milestoneId and text');
    }
    const res = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
    if (!res.ok) throw new Error(await res.text());
    return res.json();
  },
};

// Health check
export const healthCheck = () => api.get('/health');

export default api; 