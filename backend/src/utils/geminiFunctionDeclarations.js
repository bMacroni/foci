import { Type } from '@google/genai';

// Task Functions
export const createTaskFunctionDeclaration = {
  name: 'create_task',
  description: 'Creates a new task for the user. Use this when the user wants to add a new task to their planner. Example user prompts: "Add a task to buy groceries", "Create a new task for tomorrow", "Remind me to call mom".',
  parameters: {
    type: Type.OBJECT,
    properties: {
      title: { type: Type.STRING, description: 'Task title' },
      description: { type: Type.STRING, description: 'Task details' },
      due_date: { type: Type.STRING, description: 'Due date (YYYY-MM-DD)' },
      priority: { type: Type.STRING, enum: ['high', 'medium', 'low'], description: 'Task priority' },
      related_goal: { type: Type.STRING, description: 'Associated goal title' }
    },
    required: ['title']
  }
};

export const updateTaskFunctionDeclaration = {
  name: 'update_task',
  description: 'Updates an existing task for the user. Use this when the user wants to change details of a task. Example user prompts: "Change the due date for my homework task", "Mark the laundry task as complete".',
  parameters: {
    type: Type.OBJECT,
    properties: {
      id: { type: Type.STRING, description: 'Task ID' },
      title: { type: Type.STRING, description: 'Task title' },
      description: { type: Type.STRING, description: 'Task details' },
      due_date: { type: Type.STRING, description: 'Due date (YYYY-MM-DD)' },
      priority: { type: Type.STRING, enum: ['high', 'medium', 'low'], description: 'Task priority' },
      related_goal: { type: Type.STRING, description: 'Associated goal title' },
      completed: { type: Type.BOOLEAN, description: 'Task completion status' }
    },
    required: ['id']
  }
};

export const deleteTaskFunctionDeclaration = {
  name: 'delete_task',
  description: 'Deletes a task for the user. Use this when the user wants to remove a task. Example user prompts: "Delete my laundry task", "Remove the call mom task".',
  parameters: {
    type: Type.OBJECT,
    properties: {
      id: { type: Type.STRING, description: 'Task ID' }
    },
    required: ['id']
  }
};

export const readTaskFunctionDeclaration = {
  name: 'read_task',
  description: 'Reads or lists tasks for the user. Use this when the user wants to see their tasks or filter by due date or goal. Example user prompts: "Show me my tasks", "List my tasks for today", "What tasks are related to my fitness goal?"',
  parameters: {
    type: Type.OBJECT,
    properties: {
      due_date: { type: Type.STRING, description: 'Due date (YYYY-MM-DD)' },
      related_goal: { type: Type.STRING, description: 'Associated goal title' }
    },
    required: []
  }
};

// Goal Functions
export const createGoalFunctionDeclaration = {
  name: 'create_goal',
  description: 'Creates a new goal for the user. Use this when the user wants to set a new goal. Example user prompts: "Set a goal to run a marathon", "Create a new goal for reading more books".',
  parameters: {
    type: Type.OBJECT,
    properties: {
      title: { type: Type.STRING, description: 'Goal title' },
      description: { type: Type.STRING, description: 'Goal details' },
      due_date: { type: Type.STRING, description: 'Due date (YYYY-MM-DD)' },
      priority: { type: Type.STRING, enum: ['high', 'medium', 'low'], description: 'Goal priority' }
    },
    required: ['title']
  }
};

export const updateGoalFunctionDeclaration = {
  name: 'update_goal',
  description: 'Updates an existing goal for the user. Use this when the user wants to change details of a goal. Example user prompts: "Change the due date for my marathon goal", "Update the description of my reading goal".',
  parameters: {
    type: Type.OBJECT,
    properties: {
      id: { type: Type.STRING, description: 'Goal ID' },
      title: { type: Type.STRING, description: 'Goal title' },
      description: { type: Type.STRING, description: 'Goal details' },
      due_date: { type: Type.STRING, description: 'Due date (YYYY-MM-DD)' },
      priority: { type: Type.STRING, enum: ['high', 'medium', 'low'], description: 'Goal priority' }
    },
    required: ['id']
  }
};

export const deleteGoalFunctionDeclaration = {
  name: 'delete_goal',
  description: `Deletes a goal by its unique ID. If the user provides only the goal title, first call 'read_goal' to retrieve all goals, find the goal with the matching title, and then call this function with the correct ID. Example user prompts: "Delete the goal 'Test goal'", "Remove my goal called 'Get fit'".`,
  parameters: {
    type: Type.OBJECT,
    properties: {
      id: { type: Type.STRING, description: 'The unique ID of the goal to delete (required if known)' },
      title: { type: Type.STRING, description: 'The title of the goal to delete (optional, use to look up the ID if not provided)' }
    },
    required: [] // id is required if known, but not always present
  }
};

export const readGoalFunctionDeclaration = {
  name: 'read_goal',
  description: 'Reads or lists goals for the user. Use this when the user wants to see their current goals. Example user prompts: "Show me my goals", "List my goals", "What are my current goals?"',
  parameters: {
    type: Type.OBJECT,
    properties: {},
    required: []
  }
};

// Calendar Event Functions
export const createCalendarEventFunctionDeclaration = {
  name: 'create_calendar_event',
  description: 'Creates a new calendar event for the user. Use this when the user wants to schedule an event. Example user prompts: "Schedule a meeting for tomorrow at 10am", "Add a calendar event for my doctor appointment".',
  parameters: {
    type: Type.OBJECT,
    properties: {
      title: { type: Type.STRING, description: 'Event title' },
      description: { type: Type.STRING, description: 'Event details' },
      start_time: { type: Type.STRING, description: 'Event start time (ISO 8601)' },
      end_time: { type: Type.STRING, description: 'Event end time (ISO 8601)' },
      location: { type: Type.STRING, description: 'Event location' },
      time_zone: { type: Type.STRING, description: 'Time zone (e.g., UTC, America/New_York)' }
    },
    required: ['title', 'start_time', 'end_time']
  }
};

export const updateCalendarEventFunctionDeclaration = {
  name: 'update_calendar_event',
  description: 'Updates an existing calendar event for the user. Use this when the user wants to change event details. Example user prompts: "Change the time of my meeting", "Update the location for my doctor appointment".',
  parameters: {
    type: Type.OBJECT,
    properties: {
      id: { type: Type.STRING, description: 'Event ID' },
      title: { type: Type.STRING, description: 'Event title' },
      description: { type: Type.STRING, description: 'Event details' },
      start_time: { type: Type.STRING, description: 'Event start time (ISO 8601)' },
      end_time: { type: Type.STRING, description: 'Event end time (ISO 8601)' },
      location: { type: Type.STRING, description: 'Event location' },
      time_zone: { type: Type.STRING, description: 'Time zone (e.g., UTC, America/New_York)' }
    },
    required: ['id']
  }
};

export const deleteCalendarEventFunctionDeclaration = {
  name: 'delete_calendar_event',
  description: 'Deletes a calendar event for the user. Use this when the user wants to remove an event. Example user prompts: "Delete my meeting on Friday", "Remove the doctor appointment from my calendar".',
  parameters: {
    type: Type.OBJECT,
    properties: {
      id: { type: Type.STRING, description: 'Event ID' }
    },
    required: ['id']
  }
};

export const readCalendarEventFunctionDeclaration = {
  name: 'read_calendar_event',
  description: 'Reads or lists calendar events for the user. Use this when the user wants to see their events or filter by date. Example user prompts: "Show me my calendar events", "List my events for next week", "What events do I have on Friday?"',
  parameters: {
    type: Type.OBJECT,
    properties: {
      date: { type: Type.STRING, description: 'Date to filter events (YYYY-MM-DD)' }
    },
    required: []
  }
};

// Export all as an array for easy import
export const allGeminiFunctionDeclarations = [
  createTaskFunctionDeclaration,
  updateTaskFunctionDeclaration,
  deleteTaskFunctionDeclaration,
  readTaskFunctionDeclaration,
  createGoalFunctionDeclaration,
  updateGoalFunctionDeclaration,
  deleteGoalFunctionDeclaration,
  readGoalFunctionDeclaration,
  createCalendarEventFunctionDeclaration,
  updateCalendarEventFunctionDeclaration,
  deleteCalendarEventFunctionDeclaration,
  readCalendarEventFunctionDeclaration
]; 