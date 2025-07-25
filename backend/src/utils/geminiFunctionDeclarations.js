import { Type } from '@google/genai';

// Task Functions
export const createTaskFunctionDeclaration = {
  name: 'create_task',
  description: 'Creates a new task for the user. Use this ONLY when the user explicitly asks to add, create, or set up a new task. Do NOT use this for requests like "What are my tasks?" or "Show me my tasks". Example user prompts: "Add a task to buy groceries", "Create a new task for tomorrow", "Remind me to call mom".',
  parameters: {
    type: Type.OBJECT,
    properties: {
      title: { type: Type.STRING, description: 'Task title' },
      description: { type: Type.STRING, description: 'Task details' },
      due_date: { type: Type.STRING, description: 'Due date (YYYY-MM-DD)' },
      priority: { type: Type.STRING, enum: ['high', 'medium', 'low'], description: 'Task priority' },
      related_goal: { type: Type.STRING, description: 'Associated goal title' },
      preferred_time_of_day: { type: Type.STRING, description: 'Preferred time of day for the task (morning, afternoon, evening, any)' },
      deadline_type: { type: Type.STRING, description: 'Deadline type: hard (must be done by due date) or soft (flexible)' },
      travel_time_minutes: { type: Type.NUMBER, description: 'Estimated travel time in minutes to the task location' },
      category: { type: Type.STRING, description: 'Task category (e.g., work, personal, health, etc.)' },
      status: { type: Type.STRING, description: 'Task status (e.g., not_started, in_progress, completed)' },
      recurrence: { type: Type.STRING, description: 'Recurrence rule for repeating tasks (e.g., daily, weekly, custom RRULE)' }
    },
    required: ['title']
  }
};

export const updateTaskFunctionDeclaration = {
  name: 'update_task',
  description: `Updates an existing task for the user. If the user provides only the task title, first call 'read_task' to retrieve all tasks, find the task with the matching title, and then call this function with the correct ID. Use this when the user wants to change details of a task. Example user prompts: "Change the due date for my homework task", "Mark the laundry task as complete".`,
  parameters: {
    type: Type.OBJECT,
    properties: {
      id: { type: Type.STRING, description: 'The unique ID of the task to update (required if known)' },
      title: { type: Type.STRING, description: 'The title of the task to update (optional, use to look up the ID if not provided)' },
      description: { type: Type.STRING, description: 'Task details' },
      due_date: { type: Type.STRING, description: 'Due date (YYYY-MM-DD)' },
      priority: { type: Type.STRING, enum: ['high', 'medium', 'low'], description: 'Task priority' },
      related_goal: { type: Type.STRING, description: 'Associated goal title' },
      completed: { type: Type.BOOLEAN, description: 'Task completion status' },
      preferred_time_of_day: { type: Type.STRING, description: 'Preferred time of day for the task (morning, afternoon, evening, any)' },
      deadline_type: { type: Type.STRING, description: 'Deadline type: hard (must be done by due date) or soft (flexible)' },
      travel_time_minutes: { type: Type.NUMBER, description: 'Estimated travel time in minutes to the task location' },
      category: { type: Type.STRING, description: 'Task category (e.g., work, personal, health, etc.)' },
      status: { type: Type.STRING, description: 'Task status (e.g., not_started, in_progress, completed)' },
      recurrence: { type: Type.STRING, description: 'Recurrence rule for repeating tasks (e.g., daily, weekly, custom RRULE)' }
    },
    required: [] // id is required if known, but not always present
  }
};

export const deleteTaskFunctionDeclaration = {
  name: 'delete_task',
  description: `Deletes a task by its unique ID. If the user provides only the task title, first call 'read_task' to retrieve all tasks, find the task with the matching title, and then call this function with the correct ID. Use this when the user wants to remove a task. Example user prompts: "Delete my laundry task", "Remove the call mom task".`,
  parameters: {
    type: Type.OBJECT,
    properties: {
      id: { type: Type.STRING, description: 'The unique ID of the task to delete (required if known)' },
      title: { type: Type.STRING, description: 'The title of the task to delete (optional, use to look up the ID if not provided)' }
    },
    required: [] // id is required if known, but not always present
  }
};

export const readTaskFunctionDeclaration = {
  name: 'read_task',
  description: 'Reads or lists tasks for the user. You can also use the search parameter to filter tasks by keyword in the title or description (case-insensitive, partial match allowed). When returning a JSON code block for a filtered task query, only include the tasks that match the filter. Use this for any request where the user wants to see, list, or review their tasks. Example user prompts: "Show me my tasks", "List my tasks for today", "What are my tasks?", "What tasks are related to my fitness goal?", "Show me all my high priority tasks", "List my completed tasks in the work category", "Do I have any cleaning tasks?". Do NOT use this for requests to add or create new tasks.',
  parameters: {
    type: Type.OBJECT,
    properties: {
      search: { type: Type.STRING, description: 'Keyword to search for in task title or description (case-insensitive, partial match allowed)' },
      due_date: { type: Type.STRING, description: 'Due date (YYYY-MM-DD)' },
      related_goal: { type: Type.STRING, description: 'Associated goal title' },
      priority: { type: Type.STRING, enum: ['high', 'medium', 'low'], description: 'Task priority' },
      status: { type: Type.STRING, description: 'Task status (e.g., not_started, in_progress, completed)' },
      completed: { type: Type.BOOLEAN, description: 'Task completion status' },
      category: { type: Type.STRING, description: 'Task category (e.g., work, personal, health, etc.)' },
      preferred_time_of_day: { type: Type.STRING, description: 'Preferred time of day for the task (morning, afternoon, evening, any)' },
      deadline_type: { type: Type.STRING, description: 'Deadline type: hard (must be done by due date) or soft (flexible)' },
      recurrence: { type: Type.STRING, description: 'Recurrence rule for repeating tasks (e.g., daily, weekly, custom RRULE)' }
    },
    required: []
  }
};

export const lookupTaskbyTitleFunctionDeclaration = {
  name: 'lookup_task',
  description: 'This function is used as a precursor call to delete_task, update_task and read_task function calls. Returns all tasks for the user with their IDs and titles. The purpose of this function is to retrieve a list of current tasks that you must use to identify the requested task and obtain the ID. After getting the task list, use the ID from the most likely task to call update_task or delete_task.',
  parameters: {
    type: Type.OBJECT,
    properties: {},
    required: []
  }
};

// Goal Functions
export const createGoalFunctionDeclaration = {
  name: 'create_goal',
  description: 'Creates a new goal for the user with optional milestones and steps. Use this when the user wants to set a new goal. The AI should be conversational and help break down goals into milestones and steps. If the user only provides partial data, ask follow-up questions to determine the remaining data points. Before calling this function, call "lookup_goal" to check if the goal already exists. Example user prompts: "Set a goal to run a marathon", "Create a new goal for reading more books", "I want to learn React Native".',
  parameters: {
    type: Type.OBJECT,
    properties: {
      title: { type: Type.STRING, description: 'Goal title' },
      description: { type: Type.STRING, description: 'Goal details' },
      due_date: { type: Type.STRING, description: 'Due date (YYYY-MM-DD)' },
      priority: { type: Type.STRING, enum: ['high', 'medium', 'low'], description: 'Goal priority' },
      category: { type: Type.STRING, description: 'Goal category (e.g., health, career, personal, etc.)' },
      status: { type: Type.STRING, description: 'Goal status (e.g., not_started, in_progress, completed)' },
      milestones: { 
        type: Type.ARRAY, 
        description: 'Array of milestones for the goal. Each milestone should have a title and optional steps.',
        items: {
          type: Type.OBJECT,
          properties: {
            title: { type: Type.STRING, description: 'Milestone title' },
            order: { type: Type.NUMBER, description: 'Milestone order (optional, defaults to array index + 1)' },
            steps: {
              type: Type.ARRAY,
              description: 'Array of steps for this milestone',
              items: {
                type: Type.OBJECT,
                properties: {
                  text: { type: Type.STRING, description: 'Step description' },
                  order: { type: Type.NUMBER, description: 'Step order (optional, defaults to array index + 1)' },
                  completed: { type: Type.BOOLEAN, description: 'Step completion status (defaults to false)' }
                },
                required: ['text']
              }
            }
          },
          required: ['title']
        }
      }
    },
    required: ['title']
  }
};

export const updateGoalFunctionDeclaration = {
  name: 'update_goal',
  description: `Updates an existing goal for the user. First call 'lookup_goal' to get all goals, then use the appropriate goal ID from the list. Use this when the user wants to change details of a goal. If you find duplicates of a goal, you can delete one with the user's permission. Example user prompts: "Change the due date for my marathon goal", "Update the description of my reading goal".`,
  parameters: {
    type: Type.OBJECT,
    properties: {
      id: { type: Type.STRING, description: 'The unique ID of the goal to update (required)' },
      title: { type: Type.STRING, description: 'Goal title (optional, for renaming)' },
      description: { type: Type.STRING, description: 'Goal details' },
      due_date: { type: Type.STRING, description: 'Due date (YYYY-MM-DD)' },
      priority: { type: Type.STRING, enum: ['high', 'medium', 'low'], description: 'Goal priority' },
      category: { type: Type.STRING, description: 'Goal category (e.g., health, career, personal, etc.)' },
      status: { type: Type.STRING, description: 'Goal status (e.g., not_started, in_progress, completed)' },
      milestones: { 
        type: Type.ARRAY, 
        description: 'Array of milestones for the goal. Each milestone should have a title and optional steps.',
        items: {
          type: Type.OBJECT,
          properties: {
            title: { type: Type.STRING, description: 'Milestone title' },
            order: { type: Type.NUMBER, description: 'Milestone order (optional, defaults to array index + 1)' },
            steps: {
              type: Type.ARRAY,
              description: 'Array of steps for this milestone',
              items: {
                type: Type.OBJECT,
                properties: {
                  text: { type: Type.STRING, description: 'Step description' },
                  order: { type: Type.NUMBER, description: 'Step order (optional, defaults to array index + 1)' },
                  completed: { type: Type.BOOLEAN, description: 'Step completion status (defaults to false)' }
                },
                required: ['text']
              }
            }
          },
          required: ['title']
        }
      }
    },
    required: ['id'] // id is now required since we get it from lookup_goal
  }
};

export const deleteGoalFunctionDeclaration = {
  name: 'delete_goal',
  description: `Deletes a goal by its unique ID. If the user provides only the goal title, first call 'lookup_goal' to retrieve the unique ID of goal, Example user prompts: "Delete the goal 'Test goal'", "Remove my goal called 'Get fit'".`,
  parameters: {
    type: Type.OBJECT,
    properties: {
      id: { type: Type.STRING, description: 'The unique ID of the goal to delete (required if known)' },
      title: { type: Type.STRING, description: 'The title of the goal to delete (optional, use to look up the ID if not provided)' }
    },
    required: [] // id is required if known, but not always present
  }
};

export const lookupGoalbyTitleFunctionDeclaration = {
  name: 'lookup_goal',
  description: 'This function is used as a precursor call to delete_goal and update_goal function calls. Returns all goals for the user with their IDs and titles. The purpose of this function is to retrieve a list of current goals that you must use to identify the requested goal and obtain the ID. After getting the goals list, use the ID from the most likely goal to call update_goal or delete_goal.',
  parameters: {
    type: Type.OBJECT,
    properties: {},
    required: []
  }
};

export const readGoalFunctionDeclaration = {
  name: 'read_goal',
  description: `Reads or lists goals for the user. Use this when the user wants to see their current goals. 

When returning data to the frontend, always use this format for compatibility:
{
  "action_type": "read",
  "entity_type": "goal",
  "details": {
    "goals": ["Goal Title 1", "Goal Title 2", ...]
  }
}

Only include the goal title in the list unless the user specifically requests other data. Example user prompts: "Show me my goals", "List my goals", "What are my current goals?"`,
  parameters: {
    type: Type.OBJECT,
    properties: {},
    required: []
  }
};

// Calendar Event Functions
export const createCalendarEventFunctionDeclaration = {
  name: 'create_calendar_event',
  description: 'Creates a new calendar event for the user. Use this when the user wants to schedule an event. The calendar is in Central Time Zone (CST). You can parse natural language date/time expressions like "tomorrow at 10:00 AM", "next Friday at 2:30 PM", or use specific ISO timestamps. IMPORTANT: Always ask the user for a specific event title if they only say "schedule a meeting" or similar generic terms. Do not use generic titles like "meeting" or "event" - ask for a descriptive title. Example user prompts: "Schedule a meeting for tomorrow at 10am", "Add a calendar event for my doctor appointment next Friday at 2:30 PM", "Create an event called team meeting today at 3pm".',
  parameters: {
    type: Type.OBJECT,
    properties: {
      title: { type: Type.STRING, description: 'Event title - MUST be descriptive and specific. Do not use generic titles like "meeting" or "event". Ask the user for a specific title if needed.' },
      description: { type: Type.STRING, description: 'Event details' },
      start_time: { type: Type.STRING, description: 'Event start time (ISO 8601) - use this if you have exact timestamps' },
      end_time: { type: Type.STRING, description: 'Event end time (ISO 8601) - use this if you have exact timestamps' },
      date: { type: Type.STRING, description: 'Natural language date (e.g., "tomorrow", "next Friday", "2024-01-15") - use this with time parameter' },
      time: { type: Type.STRING, description: 'Natural language time (e.g., "10:00 AM", "2:30 PM", "15:30") - use this with date parameter' },
      duration: { type: Type.NUMBER, description: 'Event duration in minutes (default: 60) - use this with date/time parameters' },
      location: { type: Type.STRING, description: 'Event location' },
      time_zone: { type: Type.STRING, description: 'Time zone (e.g., UTC, America/New_York)' },
      recurrence: { type: Type.STRING, description: 'Recurrence rule for repeating events (e.g., daily, weekly, custom RRULE)' },
      attendees: { type: Type.ARRAY, description: 'List of attendees (emails or names)', items: { type: Type.STRING } },
      reminder_minutes_before: { type: Type.NUMBER, description: 'Number of minutes before event to send a reminder' }
    },
    required: ['title']
  }
};

export const lookupCalendarEventbyTitleFunctionDeclaration = {
  name: 'lookup_calendar_event',
  description: 'This function is used as a precursor call to delete_calendar_event and update_calendar_event function calls. If the user users the term meeting or event in their request, do not include it in the search; example: "update my eggs meeting", search for "eggs" not "eggs meeting". If the user uses terms like, "tomorrow" "today" "next week", convert the term into a proper date or date range. Returns all calendar events for the user with their IDs and titles. The purpose of this function is to retrieve a list of current calendar events that you must use to identify the requested calendar event and obtain the ID. After getting the calendar events list, use the ID from the most likely calendar event to call update_calendar_event or delete_calendar_event.',
  parameters: {
    type: Type.OBJECT,
    properties: {
      search: { type: Type.STRING, description: 'Search string for event title (e.g., "eggs" for "eggs meeting")' },
      date: { type: Type.STRING, description: 'Date to filter events (natural language like "today", "tomorrow", or specific date like "2025-07-21")' }
    },
    required: ['search']
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
      time_zone: { type: Type.STRING, description: 'Time zone (e.g., UTC, America/New_York)' },
      recurrence: { type: Type.STRING, description: 'Recurrence rule for repeating events (e.g., daily, weekly, custom RRULE)' },
      attendees: { type: Type.ARRAY, description: 'List of attendees (emails or names)', items: { type: Type.STRING } },
      reminder_minutes_before: { type: Type.NUMBER, description: 'Number of minutes before event to send a reminder' }
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
  description: 'Reads or lists calendar events for the user. Use this when the user wants to see their events or filter by date. You can pass natural language dates like "tomorrow", "next week", "today", "next Friday", or specific dates like "2024-01-15". Example user prompts: "Show me my calendar events", "List my events for next week", "What events do I have on Friday?"',
  parameters: {
    type: Type.OBJECT,
    properties: {
      date: { type: Type.STRING, description: 'Date to filter events (natural language like "tomorrow", "next week", or specific date like "2024-01-15")' },
      time_range: { type: Type.OBJECT, description: 'Time range filter for events', properties: { start: { type: Type.STRING, description: 'Start time (ISO 8601 or natural language)' }, end: { type: Type.STRING, description: 'End time (ISO 8601 or natural language)' } } },
      location: { type: Type.STRING, description: 'Event location to filter' },
      attendee: { type: Type.STRING, description: 'Attendee to filter events by (email or name)' },
      recurrence: { type: Type.STRING, description: 'Recurrence rule to filter events' }
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
  lookupTaskbyTitleFunctionDeclaration,
  createGoalFunctionDeclaration,
  updateGoalFunctionDeclaration,
  deleteGoalFunctionDeclaration,
  lookupGoalbyTitleFunctionDeclaration,
  readGoalFunctionDeclaration,
  createCalendarEventFunctionDeclaration,
  updateCalendarEventFunctionDeclaration,
  deleteCalendarEventFunctionDeclaration,
  lookupCalendarEventbyTitleFunctionDeclaration,
  readCalendarEventFunctionDeclaration
]; 