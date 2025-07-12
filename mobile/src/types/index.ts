// User types
export interface User {
  id: string;
  email: string;
  created_at: string;
  updated_at: string;
}

// Goal types
export interface Goal {
  id: string;
  title: string;
  description: string;
  category: 'career' | 'health' | 'personal' | 'education' | 'finance' | 'relationships';
  target_date: string | null;
  progress: number;
  status: 'active' | 'completed' | 'archived';
  user_id: string;
  created_at: string;
  updated_at: string;
}

// Task types
export interface Task {
  id: string;
  title: string;
  description: string;
  priority: 'low' | 'medium' | 'high';
  estimated_duration: number | null;
  due_date: string | null;
  status: 'not_started' | 'in_progress' | 'completed';
  goal_id: string | null;
  user_id: string;
  created_at: string;
  updated_at: string;
}

// Calendar types
export interface CalendarEvent {
  id: string;
  summary: string;
  description: string | null;
  start: {
    dateTime: string;
    timeZone: string;
  };
  end: {
    dateTime: string;
    timeZone: string;
  };
  location: string | null;
  attendees: Array<{
    email: string;
    displayName: string | null;
  }> | null;
  recurringEventId: string | null;
  originalStartTime: {
    dateTime: string;
    timeZone: string;
  } | null;
}

// AI Conversation types
export interface ConversationMessage {
  id: string;
  content: string;
  role: 'user' | 'assistant';
  metadata: any;
  created_at: string;
}

export interface ConversationThread {
  id: string;
  title: string;
  summary: string | null;
  user_id: string;
  created_at: string;
  updated_at: string;
  messages: ConversationMessage[];
}

// API Response types
export interface ApiResponse<T> {
  data: T;
  message?: string;
  error?: string;
}

export interface AuthResponse {
  token: string;
  user: User;
  message: string;
}

// Navigation types
export type RootStackParamList = {
  Auth: undefined;
  Main: undefined;
  GoalDetails: { goalId: string };
  TaskDetails: { taskId: string };
  AddGoal: undefined;
  AddTask: undefined;
  EditGoal: { goal: Goal };
  EditTask: { task: Task };
  AIChat: { threadId?: string };
};

export type MainTabParamList = {
  Goals: undefined;
  Tasks: undefined;
  Calendar: undefined;
  AIAssistant: undefined;
  Profile: undefined;
};

// Theme types
export interface Theme {
  colors: {
    primary: string;
    secondary: string;
    background: string;
    surface: string;
    text: string;
    textSecondary: string;
    border: string;
    error: string;
    success: string;
    warning: string;
  };
  spacing: {
    xs: number;
    sm: number;
    md: number;
    lg: number;
    xl: number;
  };
  borderRadius: {
    sm: number;
    md: number;
    lg: number;
  };
} 