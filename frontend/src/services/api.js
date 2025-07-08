import axios from 'axios';

// Create axios instance with base configuration
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
console.log('API Base URL:', API_BASE_URL);
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
};

// Calendar API
export const calendarAPI = {
  getStatus: () => api.get('/calendar/status'),
  getEvents: (maxResults = 10) => api.get(`/calendar/events?maxResults=${maxResults}`),
  createEvent: (eventData) => api.post('/calendar/events', eventData),
  updateEvent: (eventId, eventData) => api.put(`/calendar/events/${eventId}`, eventData),
  deleteEvent: (eventId) => api.delete(`/calendar/events/${eventId}`),
  getCalendarList: () => api.get('/calendar/list'),
};

// AI API
export const aiAPI = {
  sendMessage: (message, threadId) => api.post('/ai/chat', { message, threadId }),
  getGoalSuggestions: (goalTitle) => api.post('/ai/goal-suggestions', { goalTitle }),
  createThread: (title, summary) => api.post('/ai/threads', { title, summary }),
  recommendTask: (userRequest) => api.post('/ai/recommend-task', { userRequest }),
};

// Conversations API
export const conversationsAPI = {
  getThreads: () => api.get('/conversations/threads'),
  getThread: (threadId) => api.get(`/conversations/threads/${threadId}`),
  createThread: (title, summary) => api.post('/conversations/threads', { title, summary }),
  addMessage: (threadId, content, role, metadata) => api.post(`/conversations/threads/${threadId}/messages`, { content, role, metadata }),
  updateThread: (threadId, updates) => api.put(`/conversations/threads/${threadId}`, updates),
  deleteThread: (threadId) => api.delete(`/conversations/threads/${threadId}`),
  getStats: () => api.get('/conversations/stats'),
};

// Health check
export const healthCheck = () => api.get('/health');

export default api; 