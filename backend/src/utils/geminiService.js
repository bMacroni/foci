import { GoogleGenerativeAI } from '@google/generative-ai';
import { goalsAPI, tasksAPI } from './apiService.js';
import { createCalendarEvent, listCalendarEvents, updateCalendarEvent, deleteCalendarEvent } from './calendarService.js';

export class GeminiService {
  constructor() {
    if (!process.env.GOOGLE_AI_API_KEY) {
      console.warn('GOOGLE_AI_API_KEY not found. Gemini AI features will be disabled.');
      this.enabled = false;
      return;
    }
    
    this.enabled = true;
    this.genAI = new GoogleGenerativeAI(process.env.GOOGLE_AI_API_KEY);
    this.model = this.genAI.getGenerativeModel({ model: "gemini-1.5-pro" });
    console.log('✅ Gemini AI initialized with model: gemini-1.5-pro');
    
    // Conversation memory for context
    this.conversationHistory = new Map();
    
    // System prompt that defines the AI's role and capabilities
    this.systemPrompt = `You are Foci AI, an intelligent productivity assistant that helps users manage their goals, tasks, and calendar events. You are the PRIMARY interface for users - they should interact with you for most of their productivity needs.

Your capabilities include:
- Creating and managing goals with titles, descriptions, target dates, and status
- Creating and managing tasks with titles, descriptions, due dates, priority, and status  
- Scheduling and managing calendar events
- Providing helpful productivity advice and motivation
- Answering questions about the user's productivity system
- Analyzing productivity patterns and suggesting improvements
- Helping with time management and prioritization

**AI-FIRST APPROACH:**
- You are the main interface - users should interact with you for most actions
- Only suggest using other tabs when users need detailed views or complex management
- Examples of when to suggest tabs:
  * "You can view all your goals in the Goals tab for a complete overview"
  * "Check the Tasks tab to see all tasks and their current status"
  * "The Calendar tab shows your scheduled events and upcoming commitments"
- For most actions, handle them directly through conversation

When users ask you to perform actions, you should:
1. Understand their intent clearly
2. Extract relevant information (titles, dates, descriptions, etc.)
3. Provide a helpful response that confirms what you understood
4. Suggest next steps or additional information they might need

For productivity advice, you can:
- Suggest time management techniques
- Help with goal setting and planning
- Provide motivation and encouragement
- Analyze patterns in their productivity data
- Suggest ways to improve focus and efficiency

**IMPORTANT: Format your responses for better readability:**
- Use bullet points (•) for lists
- Use numbered lists (1., 2., 3.) for steps
- Use **bold text** for emphasis
- Use headers ending with : for sections
- Add line breaks between different sections
- Keep paragraphs short and scannable

Keep responses friendly, concise, and actionable. If you're unsure about something, ask for clarification rather than making assumptions.

Current context: The user is interacting with their Foci productivity system through the AI-first interface.`;
  }

  async processMessage(message, userId) {
    try {
      // If Gemini is not enabled, fall back to basic command handling
      if (!this.enabled) {
        const commandResponse = await this.handleDirectCommands(message, userId);
        if (commandResponse) {
          return commandResponse;
        }
        return {
          message: "I'm currently in basic mode. Please use direct commands like 'add goal', 'show tasks', etc. To enable full AI features, please set up your Gemini API key.",
          actions: []
        };
      }

      // ALL requests go through Gemini for intelligent interpretation and routing
      console.log('Processing message through Gemini:', message);
      return await this.getGeminiResponse(message, userId);
    } catch (error) {
      console.error('Gemini Service Error:', error);
      return {
        message: "I'm sorry, I encountered an error. Please try again or rephrase your request.",
        actions: []
      };
    }
  }

  async handleDirectCommands(message, userId) {
    const lowerMessage = message.toLowerCase();
    
    console.log('Processing message:', message);
    console.log('Lower message:', lowerMessage);
    
    // Direct command patterns that should trigger immediate actions
    const directCommands = {
      'add goal': this.addGoal,
      'create goal': this.addGoal,
      'new goal': this.addGoal,
      'show goals': this.getGoals,
      'list goals': this.getGoals,
      'my goals': this.getGoals,
      'add task': this.addTask,
      'create task': this.addTask,
      'new task': this.addTask,
      'show tasks': this.getTasks,
      'list tasks': this.getTasks,
      'my tasks': this.getTasks,
      'schedule': this.addEvent,
      'add event': this.addEvent,
      'create event': this.addEvent,
      'add an event': this.addEvent,
      'schedule an event': this.addEvent,
      'show events': this.getEvents,
      'list events': this.getEvents,
      'my calendar': this.getEvents,
      'suggestions': this.getGoalSuggestions,
      'get suggestions': this.getGoalSuggestions,
      'goal suggestions': this.getGoalSuggestions,
    };

    // Check for direct commands with priority
    const commandMatches = [];
    
    for (const [command, handler] of Object.entries(directCommands)) {
      if (lowerMessage.includes(command)) {
        // Find the position of the command in the message
        const position = lowerMessage.indexOf(command);
        commandMatches.push({ command, handler, position });
      }
    }
    
    console.log('All command matches found:', commandMatches);
    
    // Sort by position (earlier in message = higher priority) and command length (longer commands = more specific)
    commandMatches.sort((a, b) => {
      if (a.position !== b.position) {
        return a.position - b.position; // Earlier position first
      }
      return b.command.length - a.command.length; // Longer command first
    });
    
    if (commandMatches.length > 0) {
      const bestMatch = commandMatches[0];
      console.log('Selected best match:', bestMatch.command, 'at position:', bestMatch.position);
      return await bestMatch.handler.call(this, message, userId);
    }

    // Enhanced natural language classification - only for create operations
    console.log('Checking if goal creation request...');
    if (this.isGoalCreationRequest(lowerMessage)) {
      console.log('Detected as goal creation request');
      return await this.addGoal(message, userId);
    }
    
    console.log('Checking if task creation request...');
    if (this.isTaskCreationRequest(lowerMessage)) {
      console.log('Detected as task creation request');
      return await this.addTask(message, userId);
    }
    
    console.log('Checking if calendar creation request...');
    if (this.isCalendarCreationRequest(lowerMessage)) {
      console.log('Detected as calendar creation request');
      return await this.addEvent(message, userId);
    }

    console.log('No direct command found, will use Gemini classification');
    return null; // No direct command found, let Gemini handle it
  }

  // Helper methods to classify natural language requests - only for creation
  isGoalCreationRequest(message) {
    const goalKeywords = [
      'goal', 'goals', 'objective', 'objectives', 'target', 'targets',
      'aim', 'aims', 'aspiration', 'aspirations', 'resolution', 'resolutions'
    ];
    
    const createActionKeywords = [
      'add', 'create', 'set', 'make', 'establish', 'define', 'formulate',
      'prepare', 'obtain', 'maintain', 'save', 'achieve', 'work towards'
    ];
    
    const hasGoalKeyword = goalKeywords.some(keyword => message.includes(keyword));
    const hasCreateAction = createActionKeywords.some(keyword => message.includes(keyword));
    
    // Check for patterns like "add the following goals:" or "create goals:"
    const goalPattern = /(?:add|create|set|make)\s+(?:the\s+following\s+)?goals?\s*:/i;
    
    // Check for keywords that should prevent creation classification
    const nonCreateKeywords = ['delete', 'remove', 'cancel', 'drop', 'eliminate', 'update', 'edit', 'change', 'modify'];
    const hasNonCreateAction = nonCreateKeywords.some(keyword => message.includes(keyword));
    
    const result = hasGoalKeyword && (hasCreateAction || goalPattern.test(message)) && !hasNonCreateAction;
    
    console.log('Goal creation request check:', {
      message,
      hasGoalKeyword,
      hasCreateAction,
      hasNonCreateAction,
      goalPatternMatch: goalPattern.test(message),
      result,
      matchedCreateKeywords: createActionKeywords.filter(keyword => message.includes(keyword)),
      matchedNonCreateKeywords: nonCreateKeywords.filter(keyword => message.includes(keyword))
    });
    
    return result;
  }

  isTaskCreationRequest(message) {
    const taskKeywords = [
      'task', 'tasks', 'todo', 'todos', 'to-do', 'to-dos', 'action', 'actions',
      'item', 'items', 'chore', 'chores', 'assignment', 'assignments'
    ];
    
    const createActionKeywords = [
      'add', 'create', 'set', 'make', 'assign', 'schedule', 'plan', 'organize'
    ];
    
    const hasTaskKeyword = taskKeywords.some(keyword => message.includes(keyword));
    const hasCreateAction = createActionKeywords.some(keyword => message.includes(keyword));
    
    // Check for keywords that should prevent creation classification
    const nonCreateKeywords = ['delete', 'remove', 'cancel', 'drop', 'eliminate', 'update', 'edit', 'change', 'modify'];
    const hasNonCreateAction = nonCreateKeywords.some(keyword => message.includes(keyword));
    
    const taskPattern = /(?:add|create|set|make)\s+(?:the\s+following\s+)?tasks?\s*:/i;
    
    return hasTaskKeyword && (hasCreateAction || taskPattern.test(message)) && !hasNonCreateAction;
  }

  isCalendarCreationRequest(message) {
    const calendarKeywords = [
      'event', 'events', 'meeting', 'meetings', 'appointment', 'appointments',
      'schedule', 'calendar', 'booking', 'bookings', 'session', 'sessions'
    ];
    
    const createActionKeywords = [
      'add', 'create', 'schedule', 'book'
    ];
    
    const timeKeywords = [
      'today', 'tomorrow', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday',
      'morning', 'afternoon', 'evening', 'night', 'am', 'pm', 'o\'clock', 'at', 'from', 'to', 'until'
    ];
    
    const hasCalendarKeyword = calendarKeywords.some(keyword => message.includes(keyword));
    const hasCreateAction = createActionKeywords.some(keyword => message.includes(keyword));
    const hasTimeKeyword = timeKeywords.some(keyword => message.includes(keyword));
    
    // Check for keywords that should prevent creation classification
    const nonCreateKeywords = ['delete', 'remove', 'cancel', 'drop', 'eliminate', 'update', 'edit', 'change', 'modify'];
    const hasNonCreateAction = nonCreateKeywords.some(keyword => message.includes(keyword));
    
    const calendarPattern = /(?:add|create|schedule)\s+(?:an?\s+)?(?:event|meeting|appointment)/i;
    
    return hasCalendarKeyword && (hasCreateAction || calendarPattern.test(message) || (hasTimeKeyword && (message.includes('schedule') || message.includes('add')))) && !hasNonCreateAction;
  }

  async getGeminiResponse(message, userId) {
    try {
      // Step 1: Classify the request type and operation using Gemini
      const classification = await this.classifyRequestType(message);
      console.log('Gemini classified request:', classification);
      
      const { type, operation, confidence } = classification;
      console.log('Routing to:', type, 'operation:', operation, 'confidence:', confidence);
      
      // Step 2: Extract detailed information using Gemini based on type and operation
      let extractedData = null;
      let response = null;
      
      if (type === 'goal' || type === 'goals') {
        console.log('Processing goal operation:', operation);
        extractedData = await this.extractGoalDetails(message, operation);
        response = await this.executeGoalOperation(extractedData, userId, operation);
      } else if (type === 'task' || type === 'tasks') {
        console.log('Processing task operation:', operation);
        extractedData = await this.extractTaskDetails(message, operation);
        response = await this.executeTaskOperation(extractedData, userId, operation);
      } else if (type === 'calendar' || type === 'event' || type === 'events') {
        console.log('Processing calendar operation:', operation);
        extractedData = await this.extractCalendarDetails(message, operation);
        response = await this.executeCalendarOperation(extractedData, userId, operation);
      } else if (operation === 'help') {
        console.log('Processing help request');
        response = await this.showHelp(message, userId);
      } else {
        // General conversation or advice request
        console.log('Processing general conversation');
        response = await this.handleGeneralConversation(message, userId);
      }
      
      return response;
    } catch (error) {
      console.error('Gemini API Error:', error);
      
      // Provide more specific error messages
      if (error.message && error.message.includes('404')) {
        return {
          message: "I'm having trouble connecting to the AI service. Please check your API key and try again.",
          actions: []
        };
      } else if (error.message && error.message.includes('quota')) {
        return {
          message: "I've reached my usage limit. Please try again later or check your API quota.",
          actions: []
        };
      } else {
        return {
          message: "I'm having trouble processing your request right now. Please try again in a moment.",
          actions: []
        };
      }
    }
  }

  // Use Gemini to classify the request type
  async classifyRequestType(message) {
    try {
      const prompt = `Classify this user request into one of the following types. Return ONLY a JSON object with the following structure:

{
  "type": "goal|goals|task|tasks|calendar|event|events|general",
  "operation": "create|read|update|delete|complete|help",
  "confidence": "high|medium|low",
  "reasoning": "Brief explanation of why this classification was chosen"
}

Classification rules:
- "goal" or "goals": User wants to manage goals/objectives/aspirations/targets/aims/resolutions
- "task" or "tasks": User wants to manage tasks/todos/actions/items/chores/assignments
- "calendar" or "event" or "events": User wants to manage calendar events/meetings/appointments/schedules/bookings/sessions
- "general": General conversation, questions, advice requests, or other requests

Operation types:
- "create": User wants to add/create new items (add, create, new, set, make, schedule, book, establish, define, formulate, prepare, obtain, maintain, save, achieve, work towards, assign, plan, organize)
- "read": User wants to view/list existing items (show, list, display, get, my, what are, see, view, check, review, look at)
- "update": User wants to modify existing items (update, edit, change, modify, move, reschedule, adjust, alter, revise, amend)
- "delete": User wants to remove items (delete, remove, cancel, drop, get rid of, eliminate, clear, wipe, erase)
- "complete": User wants to mark items as done (complete, finish, done, mark as complete, accomplish, achieve, fulfill, wrap up)
- "help": User is asking for help, instructions, suggestions, advice, or guidance

IMPORTANT CLASSIFICATION GUIDELINES:
1. Pay special attention to action words at the beginning of sentences
2. "Delete my goal" should be classified as delete operation, not create
3. "Update calendar for Oil Change Service" should be classified as calendar update
4. "Schedule a meeting" should be classified as calendar create
5. "Show my goals" should be classified as goal read
6. "Add a task" should be classified as task create
7. "Complete my goal" should be classified as goal complete
8. "Cancel my meeting" should be classified as event delete
9. "Get suggestions" or "goal suggestions" should be classified as general help
10. "How are you?" or general questions should be classified as general help

Examples:
- "Please add the following goals: Prepare for Kindergarten, Save money" → {"type": "goals", "operation": "create", "confidence": "high", "reasoning": "Contains 'goals' and 'add' operation"}
- "Show my tasks" → {"type": "tasks", "operation": "read", "confidence": "high", "reasoning": "Contains 'tasks' and 'show' operation"}
- "Update my goal to exercise daily" → {"type": "goal", "operation": "update", "confidence": "high", "reasoning": "Contains 'goal' and 'update' operation"}
- "Delete my goal to learn React" → {"type": "goal", "operation": "delete", "confidence": "high", "reasoning": "Contains 'goal' and 'delete' operation"}
- "Remove the task about reviewing documents" → {"type": "task", "operation": "delete", "confidence": "high", "reasoning": "Contains 'task' and 'remove' operation"}
- "Cancel my meeting tomorrow" → {"type": "event", "operation": "delete", "confidence": "high", "reasoning": "Contains 'meeting' and 'cancel' operation"}
- "Complete the goal to learn React" → {"type": "goal", "operation": "complete", "confidence": "high", "reasoning": "Contains 'goal' and 'complete' operation"}
- "Schedule a meeting tomorrow at 2pm" → {"type": "event", "operation": "create", "confidence": "high", "reasoning": "Contains time and scheduling information"}
- "Update calendar for Oil Change Service on July 9th at 10:00 AM CST" → {"type": "event", "operation": "update", "confidence": "high", "reasoning": "Contains 'calendar', 'update' operation, a date, and a time"}
- "Add a task to review documents" → {"type": "task", "operation": "create", "confidence": "high", "reasoning": "Contains 'task' and 'add' operation"}
- "Get suggestions for my goals" → {"type": "general", "operation": "help", "confidence": "high", "reasoning": "Asking for suggestions/advice"}
- "How are you today?" → {"type": "general", "operation": "help", "confidence": "high", "reasoning": "General conversation question"}

User request: "${message}"

JSON response:`;

      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();
      
      console.log('Request classification - Gemini raw response:', text);
      
      // Extract JSON from the response
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        console.error('No JSON found in classification response:', text);
        return 'general';
      }

      const classification = JSON.parse(jsonMatch[0]);
      console.log('Request classification - Parsed data:', classification);
      
      return classification || { type: 'general', operation: 'help' };

    } catch (error) {
      console.error('Error classifying request type:', error);
      return 'general';
    }
  }

  async getUserContext(userId) {
    try {
      const [goalsResponse, tasksResponse, eventsResponse] = await Promise.allSettled([
        goalsAPI.getAll(),
        tasksAPI.getAll(),
        listCalendarEvents(userId, 5)
      ]);

      let context = "User's current productivity data:\n";
      
      if (goalsResponse.status === 'fulfilled' && goalsResponse.value.data) {
        const goals = goalsResponse.value.data;
        context += `\nGoals (${goals.length}): ${goals.map(g => g.title).join(', ')}`;
      }
      
      if (tasksResponse.status === 'fulfilled' && tasksResponse.value.data) {
        const tasks = tasksResponse.value.data;
        context += `\nTasks (${tasks.length}): ${tasks.map(t => t.title).join(', ')}`;
      }
      
      if (eventsResponse.status === 'fulfilled' && eventsResponse.value) {
        const events = eventsResponse.value;
        context += `\nUpcoming Events (${events.length}): ${events.map(e => e.summary).join(', ')}`;
      }

      return context;
    } catch (error) {
      return "Unable to retrieve user context at this time.";
    }
  }

  // New unified extraction and execution methods
  async extractGoalDetails(message, operation) {
    try {
      switch (operation) {
        case 'create':
          return await this.parseGoalWithGemini(message);
        case 'update':
          return await this.parseGoalUpdateWithGemini(message);
        case 'delete':
          return await this.parseGoalDeleteWithGemini(message);
        case 'complete':
          return await this.parseGoalCompleteWithGemini(message);
        case 'read':
          return { operation: 'read' }; // No specific details needed for read
        default:
          return await this.parseGoalWithGemini(message); // Default to create
      }
    } catch (error) {
      console.error('Error extracting goal details:', error);
      return null;
    }
  }

  async extractTaskDetails(message, operation) {
    try {
      switch (operation) {
        case 'create':
          return await this.parseTaskWithGemini(message);
        case 'update':
          return await this.parseTaskUpdateWithGemini(message);
        case 'delete':
          return await this.parseTaskDeleteWithGemini(message);
        case 'complete':
          return await this.parseTaskCompleteWithGemini(message);
        case 'read':
          return { operation: 'read' }; // No specific details needed for read
        default:
          return await this.parseTaskWithGemini(message); // Default to create
      }
    } catch (error) {
      console.error('Error extracting task details:', error);
      return null;
    }
  }

  async extractCalendarDetails(message, operation) {
    try {
      switch (operation) {
        case 'create':
          return await this.parseCalendarEventWithGemini(message);
        case 'update':
          return await this.parseEventUpdateWithGemini(message);
        case 'delete':
          return await this.parseEventDeleteWithGemini(message);
        case 'read':
          return { operation: 'read' }; // No specific details needed for read
        default:
          return await this.parseCalendarEventWithGemini(message); // Default to create
      }
    } catch (error) {
      console.error('Error extracting calendar details:', error);
      return null;
    }
  }

  async executeGoalOperation(extractedData, userId, operation) {
    try {
      if (!extractedData) {
        return {
          message: `I couldn't understand the goal ${operation} request. Please try again with more details.`,
          actions: []
        };
      }

      switch (operation) {
        case 'create':
          return await this.addGoalWithData(extractedData, userId);
        case 'read':
          return await this.getGoals(null, userId);
        case 'update':
          return await this.updateGoalWithData(extractedData, userId);
        case 'delete':
          return await this.deleteGoalWithData(extractedData, userId);
        case 'complete':
          return await this.completeGoalWithData(extractedData, userId);
        default:
          return await this.addGoalWithData(extractedData, userId);
      }
    } catch (error) {
      console.error('Error executing goal operation:', error);
      return {
        message: `I couldn't ${operation} the goal. Please try again or check the Goals tab.`,
        actions: []
      };
    }
  }

  async executeTaskOperation(extractedData, userId, operation) {
    try {
      if (!extractedData) {
        return {
          message: `I couldn't understand the task ${operation} request. Please try again with more details.`,
          actions: []
        };
      }

      switch (operation) {
        case 'create':
          return await this.addTaskWithData(extractedData, userId);
        case 'read':
          return await this.getTasks(null, userId);
        case 'update':
          return await this.updateTaskWithData(extractedData, userId);
        case 'delete':
          return await this.deleteTaskWithData(extractedData, userId);
        case 'complete':
          return await this.completeTaskWithData(extractedData, userId);
        default:
          return await this.addTaskWithData(extractedData, userId);
      }
    } catch (error) {
      console.error('Error executing task operation:', error);
      return {
        message: `I couldn't ${operation} the task. Please try again or check the Tasks tab.`,
        actions: []
      };
    }
  }

  async executeCalendarOperation(extractedData, userId, operation) {
    try {
      if (!extractedData) {
        return {
          message: `I couldn't understand the calendar ${operation} request. Please try again with more details.`,
          actions: []
        };
      }

      switch (operation) {
        case 'create':
          return await this.addEventWithData(extractedData, userId);
        case 'read':
          return await this.getEvents(null, userId);
        case 'update':
          return await this.updateEventWithData(extractedData, userId);
        case 'delete':
          return await this.deleteEventWithData(extractedData, userId);
        default:
          return await this.addEventWithData(extractedData, userId);
      }
    } catch (error) {
      console.error('Error executing calendar operation:', error);
      return {
        message: `I couldn't ${operation} the event. Please try again or check the Calendar tab.`,
        actions: []
      };
    }
  }

  async handleGeneralConversation(message, userId) {
    try {
      const context = await this.getUserContext(userId);
      
      // Get conversation history for this user
      const history = this.conversationHistory.get(userId) || [];
      const recentHistory = history.slice(-5); // Keep last 5 exchanges for context
      
      const historyText = recentHistory.length > 0 
        ? `\nRecent conversation:\n${recentHistory.map(h => `${h.role}: ${h.content}`).join('\n')}`
        : '';
      
      const prompt = `${this.systemPrompt}

User Context:
${context}${historyText}

User Message: "${message}"

Please provide a helpful response. If the user is asking to create or manage something, extract the relevant information and provide a clear response about what you understood. If they're asking for advice or information, provide helpful guidance.

IMPORTANT: If the user might benefit from viewing detailed information in the Goals, Tasks, or Calendar tabs, suggest it naturally. For example:
- "You can view all your goals in the Goals tab to get a complete overview"
- "Check the Tasks tab to see all your tasks and their current status"
- "The Calendar tab shows your scheduled events and upcoming commitments"

Response:`;

      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();

      // Update conversation history
      const userHistory = this.conversationHistory.get(userId) || [];
      userHistory.push({ role: 'user', content: message });
      userHistory.push({ role: 'assistant', content: text });
      
      // Keep only last 20 exchanges to prevent memory bloat
      if (userHistory.length > 20) {
        userHistory.splice(0, userHistory.length - 20);
      }
      
      this.conversationHistory.set(userId, userHistory);

      return {
        message: text,
        actions: []
      };
    } catch (error) {
      console.error('Error handling general conversation:', error);
      return {
        message: "I'm having trouble processing your request right now. Please try again in a moment.",
        actions: []
      };
    }
  }

  // Goal handlers
  async addGoal(message, userId) {
    try {
      // Check if this is a multiple goals request
      if (this.isMultipleGoalsRequest(message)) {
        return await this.addMultipleGoals(message, userId);
      }

      // Use Gemini to parse the goal request
      const parsedGoal = await this.parseGoalWithGemini(message);
      
      if (!parsedGoal) {
        return {
          message: "I'd be happy to help you create a goal! Please specify what goal you'd like to add. For example: 'Add a goal to learn React'",
          actions: []
        };
      }

      return await this.addGoalWithData(parsedGoal, userId);
    } catch (error) {
      return {
        message: "I couldn't create the goal. Please try again or check the Goals tab to create it manually.",
        actions: []
      };
    }
  }

  // New execution methods that work with extracted data
  async addGoalWithData(parsedGoal, userId) {
    try {
      console.log('Adding goal with data:', parsedGoal);

      const goalData = {
        user_id: userId,
        title: parsedGoal.title,
        description: parsedGoal.description || `Goal: ${parsedGoal.title}`,
        target_completion_date: parsedGoal.targetDate.toISOString().split('T')[0], // Convert to date format
        is_active: true
      };

      await goalsAPI.create(goalData);
      return {
        message: `Great! I've created a new goal: **"${parsedGoal.title}"** with a target date of ${parsedGoal.targetDate.toLocaleDateString()}. You can view and manage it in the Goals tab.`,
        actions: [`Created goal: ${parsedGoal.title}`]
      };
    } catch (error) {
      console.error('Error adding goal with data:', error);
      return {
        message: "I couldn't create the goal. Please try again or check the Goals tab to create it manually.",
        actions: []
      };
    }
  }

  async updateGoalWithData(parsedGoal, userId) {
    try {
      console.log('Updating goal with data:', parsedGoal);

      // First, find the goal by title to get the actual UUID
      const goalsResponse = await goalsAPI.getAll();
      const goals = goalsResponse.data;
      
      // Find the goal that matches the title (case-insensitive)
      const goalToUpdate = goals.find(goal => 
        goal.title.toLowerCase().includes(parsedGoal.title.toLowerCase()) ||
        parsedGoal.title.toLowerCase().includes(goal.title.toLowerCase())
      );

      if (!goalToUpdate) {
        return {
          message: `I couldn't find a goal matching "${parsedGoal.title}". Please check your goals and try again.`,
          actions: []
        };
      }

      console.log('Found goal to update:', goalToUpdate);

      const goalData = {
        title: parsedGoal.title || goalToUpdate.title,
        description: parsedGoal.description || goalToUpdate.description,
        target_completion_date: parsedGoal.targetDate ? parsedGoal.targetDate.toISOString().split('T')[0] : goalToUpdate.target_completion_date,
        is_active: parsedGoal.isActive !== undefined ? parsedGoal.isActive : goalToUpdate.is_active
      };

      // Remove undefined values
      Object.keys(goalData).forEach(key => goalData[key] === undefined && delete goalData[key]);

      await goalsAPI.update(goalToUpdate.id, goalData);
      
      return {
        message: `Great! I've updated your goal: **"${goalToUpdate.title}"**. You can view the changes in the Goals tab.`,
        actions: [`Updated goal: ${goalToUpdate.title}`]
      };
    } catch (error) {
      console.error('Error updating goal with data:', error);
      return {
        message: "I couldn't update the goal. Please try again or check the Goals tab to update it manually.",
        actions: []
      };
    }
  }

  async deleteGoalWithData(parsedGoal, userId) {
    try {
      console.log('Deleting goal with data:', parsedGoal);

      // First, find the goal by title to get the actual UUID
      const goalsResponse = await goalsAPI.getAll();
      const goals = goalsResponse.data;
      
      // Find the goal that matches the title (case-insensitive)
      const goalToDelete = goals.find(goal => 
        goal.title.toLowerCase().includes(parsedGoal.title.toLowerCase()) ||
        parsedGoal.title.toLowerCase().includes(goal.title.toLowerCase())
      );

      if (!goalToDelete) {
        return {
          message: `I couldn't find a goal matching "${parsedGoal.title}". Please check your goals and try again.`,
          actions: []
        };
      }

      console.log('Found goal to delete:', goalToDelete);

      await goalsAPI.delete(goalToDelete.id);
      return {
        message: `I've deleted your goal: **"${goalToDelete.title}"**.`,
        actions: [`Deleted goal: ${goalToDelete.title}`]
      };
    } catch (error) {
      console.error('Error deleting goal with data:', error);
      return {
        message: "I couldn't delete the goal. Please try again or check the Goals tab to delete it manually.",
        actions: []
      };
    }
  }

  async completeGoalWithData(parsedGoal, userId) {
    try {
      console.log('Completing goal with data:', parsedGoal);

      // First, find the goal by title to get the actual UUID
      const goalsResponse = await goalsAPI.getAll();
      const goals = goalsResponse.data;
      
      // Find the goal that matches the title (case-insensitive)
      const goalToComplete = goals.find(goal => 
        goal.title.toLowerCase().includes(parsedGoal.title.toLowerCase()) ||
        parsedGoal.title.toLowerCase().includes(goal.title.toLowerCase())
      );

      if (!goalToComplete) {
        return {
          message: `I couldn't find a goal matching "${parsedGoal.title}". Please check your goals and try again.`,
          actions: []
        };
      }

      console.log('Found goal to complete:', goalToComplete);

      const goalData = {
        is_active: false,
        progress_percentage: 100
      };

      await goalsAPI.update(goalToComplete.id, goalData);
      return {
        message: `Congratulations! I've marked your goal as complete: **"${goalToComplete.title}"**. Great job!`,
        actions: [`Completed goal: ${goalToComplete.title}`]
      };
    } catch (error) {
      console.error('Error completing goal with data:', error);
      return {
        message: "I couldn't complete the goal. Please try again or check the Goals tab to mark it as complete manually.",
        actions: []
      };
    }
  }

  // Check if this is a request for multiple goals
  isMultipleGoalsRequest(message) {
    const lowerMessage = message.toLowerCase();
    return lowerMessage.includes('following goals:') || 
           lowerMessage.includes('goals:') && lowerMessage.split('\n').length > 2 ||
           lowerMessage.includes('goals') && (lowerMessage.includes('prepare') || lowerMessage.includes('obtain') || lowerMessage.includes('maintain'));
  }

  // Handle multiple goals creation
  async addMultipleGoals(message, userId) {
    try {
      const parsedGoals = await this.parseMultipleGoalsWithGemini(message);
      
      if (!parsedGoals || parsedGoals.length === 0) {
        return {
          message: "I couldn't parse the goals. Please try listing them one by one or check the Goals tab to create them manually.",
          actions: []
        };
      }

      console.log('Parsed multiple goals data:', parsedGoals);

      const createdGoals = [];
      const errors = [];

      for (const goal of parsedGoals) {
        try {
          const goalData = {
            user_id: userId,
            title: goal.title,
            description: goal.description || `Goal: ${goal.title}`,
            target_completion_date: goal.targetDate.toISOString().split('T')[0], // Convert to date format
            is_active: true
          };

          await goalsAPI.create(goalData);
          createdGoals.push(goal.title);
        } catch (error) {
          errors.push(goal.title);
          console.error(`Failed to create goal "${goal.title}":`, error);
        }
      }

      let responseMessage = '';
      if (createdGoals.length > 0) {
        responseMessage += `Great! I've created ${createdGoals.length} new goals:\n\n`;
        responseMessage += createdGoals.map(title => `• **"${title}"**`).join('\n');
        responseMessage += '\n\nYou can view and manage these in the Goals tab.';
      }

      if (errors.length > 0) {
        responseMessage += `\n\nNote: I couldn't create these goals: ${errors.join(', ')}. Please try creating them manually in the Goals tab.`;
      }

      return {
        message: responseMessage,
        actions: createdGoals.map(title => `Created goal: ${title}`)
      };
    } catch (error) {
      return {
        message: "I couldn't create the goals. Please try again or check the Goals tab to create them manually.",
        actions: []
      };
    }
  }

  // Use Gemini to parse multiple goals
  async parseMultipleGoalsWithGemini(message) {
    try {
      const prompt = `Parse this multiple goals creation request and extract all the goals. Return ONLY a JSON array with the following structure:

[
  {
    "title": "Goal title",
    "description": "Goal description (optional)",
    "targetDate": "Target date string (today, tomorrow, next week, specific date, or 'next month' if not specified)"
  }
]

Examples:
- "Please add the following goals: Prepare Matilda for Kindergarten, Obtain low maintenance yard" → [
    {"title": "Prepare Matilda for Kindergarten", "targetDate": "next month"},
    {"title": "Obtain low maintenance yard", "targetDate": "next month"}
  ]
- "Create goals: Save for down payment, Maintain workout schedule" → [
    {"title": "Save for down payment", "targetDate": "next month"},
    {"title": "Maintain workout schedule", "targetDate": "next month"}
  ]

User request: "${message}"

JSON response:`;

      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();
      
      console.log('Multiple goals parsing - Gemini raw response:', text);
      
      // Extract JSON from the response
      const jsonMatch = text.match(/\[[\s\S]*\]/);
      if (!jsonMatch) {
        console.error('No JSON array found in Gemini response:', text);
        return null;
      }

      const parsedGoals = JSON.parse(jsonMatch[0]);
      console.log('Multiple goals parsing - Parsed JSON data:', parsedGoals);

      if (!Array.isArray(parsedGoals) || parsedGoals.length === 0) {
        console.error('Invalid goals array:', parsedGoals);
        return null;
      }

      // Convert the parsed data to actual Date objects
      const goalsWithDates = [];
      for (const goal of parsedGoals) {
        const targetDate = this.parseDate(goal.targetDate);
        if (!targetDate) {
          console.error('Could not parse target date for goal:', goal.title, goal.targetDate);
          continue;
        }

        goalsWithDates.push({
          title: goal.title,
          description: goal.description,
          targetDate: targetDate
        });
      }

      return goalsWithDates;

    } catch (error) {
      console.error('Error parsing multiple goals with Gemini:', error);
      return null;
    }
  }

  // Use Gemini to parse goal requests
  async parseGoalWithGemini(message) {
    try {
      const prompt = `Parse this goal creation request and extract the goal details. Return ONLY a JSON object with the following structure:

{
  "title": "Goal title",
  "description": "Goal description (optional)",
  "targetDate": "Target date string (today, tomorrow, next week, specific date)",
  "success": true/false,
  "error": "Error message if parsing failed"
}

Examples:
- "Add a goal to learn React" → {"title": "learn React", "targetDate": "next month", "success": true}
- "Create a goal to exercise daily by next week" → {"title": "exercise daily", "targetDate": "next week", "success": true}
- "Add task to review documents" → {"success": false, "error": "Not a goal request"}

User request: "${message}"

JSON response:`;

      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();
      
      // Extract JSON from the response
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        console.error('No JSON found in Gemini response:', text);
        return null;
      }

      const parsedData = JSON.parse(jsonMatch[0]);
      
      if (!parsedData.success) {
        console.log('Gemini parsing failed:', parsedData.error);
        return null;
      }

      // Convert the parsed data to actual Date object
      const targetDate = this.parseDate(parsedData.targetDate);
      if (!targetDate) {
        console.error('Could not parse target date:', parsedData.targetDate);
        return null;
      }

      return {
        title: parsedData.title,
        description: parsedData.description,
        targetDate: targetDate
      };

    } catch (error) {
      console.error('Error parsing goal with Gemini:', error);
      return null;
    }
  }

  async getGoals(message, userId) {
    try {
      const response = await goalsAPI.getAll();
      const goals = response.data;
      
      if (goals.length === 0) {
        return {
          message: "You don't have any goals yet. Try saying 'Add a goal to learn something new' to get started!",
          actions: []
        };
      }

      const goalList = goals.map(goal => `• ${goal.title} (${goal.status})`).join('\n');
      return {
        message: `Here are your current goals:\n\n${goalList}\n\nYou can manage these in the Goals tab.`,
        actions: [`Retrieved ${goals.length} goals`]
      };
    } catch (error) {
      return {
        message: "I couldn't retrieve your goals. Please check the Goals tab to view them.",
        actions: []
      };
    }
  }

  // Task handlers
  async addTask(message, userId) {
    try {
      // Use Gemini to parse the task request
      const parsedTask = await this.parseTaskWithGemini(message);
      
      if (!parsedTask) {
        return {
          message: "I'd be happy to help you create a task! Please specify what task you'd like to add. For example: 'Add a task to review documents'",
          actions: []
        };
      }

      return await this.addTaskWithData(parsedTask, userId);
    } catch (error) {
      return {
        message: "I couldn't create the task. Please try again or check the Tasks tab to create it manually.",
        actions: []
      };
    }
  }

  // Task execution methods that work with extracted data
  async addTaskWithData(parsedTask, userId) {
    try {
      console.log('Adding task with data:', parsedTask);

      const taskData = {
        user_id: userId,
        title: parsedTask.title,
        description: parsedTask.description || `Task: ${parsedTask.title}`,
        due_date: parsedTask.dueDate.toISOString(),
        priority: parsedTask.priority || 'medium',
        status: 'pending'
      };

      await tasksAPI.create(taskData);
      return {
        message: `Perfect! I've created a new task: **"${parsedTask.title}"** due ${parsedTask.dueDate.toLocaleDateString()}. You can view and manage it in the Tasks tab.`,
        actions: [`Created task: ${parsedTask.title}`]
      };
    } catch (error) {
      console.error('Error adding task with data:', error);
      return {
        message: "I couldn't create the task. Please try again or check the Tasks tab to create it manually.",
        actions: []
      };
    }
  }

  async updateTaskWithData(parsedTask, userId) {
    try {
      console.log('Updating task with data:', parsedTask);

      // First, find the task by title to get the actual UUID
      const tasksResponse = await tasksAPI.getAll();
      const tasks = tasksResponse.data;
      
      // Find the task that matches the title (case-insensitive)
      const taskToUpdate = tasks.find(task => 
        task.title.toLowerCase().includes(parsedTask.title.toLowerCase()) ||
        parsedTask.title.toLowerCase().includes(task.title.toLowerCase())
      );

      if (!taskToUpdate) {
        return {
          message: `I couldn't find a task matching "${parsedTask.title}". Please check your tasks and try again.`,
          actions: []
        };
      }

      console.log('Found task to update:', taskToUpdate);

      const taskData = {
        title: parsedTask.title || taskToUpdate.title,
        description: parsedTask.description || taskToUpdate.description,
        due_date: parsedTask.dueDate ? parsedTask.dueDate.toISOString() : taskToUpdate.due_date,
        priority: parsedTask.priority || taskToUpdate.priority,
        status: parsedTask.status || taskToUpdate.status
      };

      // Remove undefined values
      Object.keys(taskData).forEach(key => taskData[key] === undefined && delete taskData[key]);

      await tasksAPI.update(taskToUpdate.id, taskData);
      return {
        message: `Perfect! I've updated your task: **"${taskToUpdate.title}"**. You can view the changes in the Tasks tab.`,
        actions: [`Updated task: ${taskToUpdate.title}`]
      };
    } catch (error) {
      console.error('Error updating task with data:', error);
      return {
        message: "I couldn't update the task. Please try again or check the Tasks tab to update it manually.",
        actions: []
      };
    }
  }

  async deleteTaskWithData(parsedTask, userId) {
    try {
      console.log('Deleting task with data:', parsedTask);

      // First, find the task by title to get the actual UUID
      const tasksResponse = await tasksAPI.getAll();
      const tasks = tasksResponse.data;
      
      // Find the task that matches the title (case-insensitive)
      const taskToDelete = tasks.find(task => 
        task.title.toLowerCase().includes(parsedTask.title.toLowerCase()) ||
        parsedTask.title.toLowerCase().includes(task.title.toLowerCase())
      );

      if (!taskToDelete) {
        return {
          message: `I couldn't find a task matching "${parsedTask.title}". Please check your tasks and try again.`,
          actions: []
        };
      }

      console.log('Found task to delete:', taskToDelete);

      await tasksAPI.delete(taskToDelete.id);
      return {
        message: `I've deleted your task: **"${taskToDelete.title}"**.`,
        actions: [`Deleted task: ${taskToDelete.title}`]
      };
    } catch (error) {
      console.error('Error deleting task with data:', error);
      return {
        message: "I couldn't delete the task. Please try again or check the Tasks tab to delete it manually.",
        actions: []
      };
    }
  }

  async completeTaskWithData(parsedTask, userId) {
    try {
      console.log('Completing task with data:', parsedTask);

      // First, find the task by title to get the actual UUID
      const tasksResponse = await tasksAPI.getAll();
      const tasks = tasksResponse.data;
      
      // Find the task that matches the title (case-insensitive)
      const taskToComplete = tasks.find(task => 
        task.title.toLowerCase().includes(parsedTask.title.toLowerCase()) ||
        parsedTask.title.toLowerCase().includes(task.title.toLowerCase())
      );

      if (!taskToComplete) {
        return {
          message: `I couldn't find a task matching "${parsedTask.title}". Please check your tasks and try again.`,
          actions: []
        };
      }

      console.log('Found task to complete:', taskToComplete);

      const taskData = {
        status: 'completed'
      };

      await tasksAPI.update(taskToComplete.id, taskData);
      return {
        message: `Great job! I've marked your task as complete: **"${taskToComplete.title}"**.`,
        actions: [`Completed task: ${taskToComplete.title}`]
      };
    } catch (error) {
      console.error('Error completing task with data:', error);
      return {
        message: "I couldn't complete the task. Please try again or check the Tasks tab to mark it as complete manually.",
        actions: []
      };
    }
  }

  // Use Gemini to parse task requests
  async parseTaskWithGemini(message) {
    try {
      const prompt = `Parse this task creation request and extract the task details. Return ONLY a JSON object with the following structure:

{
  "title": "Task title",
  "description": "Task description (optional)",
  "dueDate": "Due date string (today, tomorrow, next week, specific date)",
  "success": true/false,
  "error": "Error message if parsing failed"
}

Examples:
- "Add a task to review documents" → {"title": "review documents", "dueDate": "next week", "success": true}
- "Create a task to call the client by Friday" → {"title": "call the client", "dueDate": "Friday", "success": true}
- "Add goal to learn React" → {"success": false, "error": "Not a task request"}

User request: "${message}"

JSON response:`;

      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();
      
      // Extract JSON from the response
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        console.error('No JSON found in Gemini response:', text);
        return null;
      }

      const parsedData = JSON.parse(jsonMatch[0]);
      
      if (!parsedData.success) {
        console.log('Gemini parsing failed:', parsedData.error);
        return null;
      }

      // Convert the parsed data to actual Date object
      const dueDate = this.parseDate(parsedData.dueDate);
      if (!dueDate) {
        console.error('Could not parse due date:', parsedData.dueDate);
        return null;
      }

      return {
        title: parsedData.title,
        description: parsedData.description,
        dueDate: dueDate
      };

    } catch (error) {
      console.error('Error parsing task with Gemini:', error);
      return null;
    }
  }

  async getTasks(message, userId) {
    try {
      const response = await tasksAPI.getAll();
      const tasks = response.data;
      
      if (tasks.length === 0) {
        return {
          message: "You don't have any tasks yet. Try saying 'Add a task to organize your workspace' to get started!",
          actions: []
        };
      }

      const taskList = tasks.map(task => `• ${task.title} (${task.status})`).join('\n');
      return {
        message: `Here are your current tasks:\n\n${taskList}\n\nYou can manage these in the Tasks tab.`,
        actions: [`Retrieved ${tasks.length} tasks`]
      };
    } catch (error) {
      return {
        message: "I couldn't retrieve your tasks. Please check the Tasks tab to view them.",
        actions: []
      };
    }
  }

  // Calendar handlers
  async addEvent(message, userId) {
    try {
      // Use Gemini to parse the calendar event request
      const parsedEvent = await this.parseCalendarEventWithGemini(message);
      
      if (!parsedEvent) {
        return {
          message: "I'd be happy to help you schedule an event! Please specify what event you'd like to add. For example: 'Schedule a meeting tomorrow at 2pm' or 'Add an event on Friday from 3pm to 5pm for team lunch'",
          actions: []
        };
      }

      return await this.addEventWithData(parsedEvent, userId);
    } catch (error) {
      console.error('Calendar API Error:', error);
      if (error.message && error.message.includes('No Google tokens found')) {
        return {
          message: "I couldn't schedule the event because your Google Calendar isn't connected. Please connect your Google account in the Calendar tab first.",
          actions: []
        };
      }
      return {
        message: "I couldn't schedule the event. Please make sure your Google Calendar is connected or try creating it manually in the Calendar tab.",
        actions: []
      };
    }
  }

  // Calendar execution methods that work with extracted data
  async addEventWithData(parsedEvent, userId) {
    try {
      console.log('Adding event with data:', parsedEvent);

      // Create the event using the real calendar service
      const event = await createCalendarEvent(userId, {
        summary: parsedEvent.title,
        description: `Event: ${parsedEvent.title}`,
        startTime: parsedEvent.startTime.toISOString(),
        endTime: parsedEvent.endTime.toISOString(),
        timeZone: 'America/Chicago'
      });
      
      return {
        message: `Excellent! I've scheduled an event: **"${parsedEvent.title}"** for ${parsedEvent.startTime.toLocaleDateString()} from ${parsedEvent.startTime.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})} to ${parsedEvent.endTime.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}. You can view it in your Google Calendar or the Calendar tab.`,
        actions: [`Scheduled event: ${parsedEvent.title}`]
      };
    } catch (error) {
      console.error('Error adding event with data:', error);
      if (error.message && error.message.includes('No Google tokens found')) {
        return {
          message: "I couldn't schedule the event because your Google Calendar isn't connected. Please connect your Google account in the Calendar tab first.",
          actions: []
        };
      }
      return {
        message: "I couldn't schedule the event. Please make sure your Google Calendar is connected or try creating it manually in the Calendar tab.",
        actions: []
      };
    }
  }

  async updateEventWithData(parsedEvent, userId) {
    try {
      console.log('Updating event with data:', parsedEvent);

      // First, find the event by title to get the actual event ID
      const events = await listCalendarEvents(userId, 50);
      
      // Find the event that matches the title (case-insensitive)
      const eventToUpdate = events.find(event => 
        event.summary.toLowerCase().includes(parsedEvent.title.toLowerCase()) ||
        parsedEvent.title.toLowerCase().includes(event.summary.toLowerCase())
      );

      if (!eventToUpdate) {
        // If event doesn't exist, create it instead
        console.log('Event not found, creating new event instead');
        return await this.addEventWithData(parsedEvent, userId);
      }

      console.log('Found event to update:', eventToUpdate);

      // Update the event using the real calendar service
      const updatedEvent = await updateCalendarEvent(userId, eventToUpdate.id, {
        summary: parsedEvent.title || eventToUpdate.summary,
        description: parsedEvent.description || eventToUpdate.description || `Event: ${parsedEvent.title || eventToUpdate.summary}`,
        startTime: parsedEvent.startTime ? parsedEvent.startTime.toISOString() : eventToUpdate.start.dateTime,
        endTime: parsedEvent.endTime ? parsedEvent.endTime.toISOString() : eventToUpdate.end.dateTime,
        timeZone: 'America/Chicago'
      });
      
      return {
        message: `Perfect! I've updated your event: **"${eventToUpdate.summary}"**. You can view the changes in your Google Calendar or the Calendar tab.`,
        actions: [`Updated event: ${eventToUpdate.summary}`]
      };
    } catch (error) {
      console.error('Error updating event with data:', error);
      return {
        message: "I couldn't update the event. Please try again or check the Calendar tab to update it manually.",
        actions: []
      };
    }
  }

  async deleteEventWithData(parsedEvent, userId) {
    try {
      console.log('Deleting event with data:', parsedEvent);

      // First, find the event by title to get the actual event ID
      const events = await listCalendarEvents(userId, 50);
      
      // Find the event that matches the title (case-insensitive)
      const eventToDelete = events.find(event => 
        event.summary.toLowerCase().includes(parsedEvent.title.toLowerCase()) ||
        parsedEvent.title.toLowerCase().includes(event.summary.toLowerCase())
      );

      if (!eventToDelete) {
        return {
          message: `I couldn't find an event matching "${parsedEvent.title}". Please check your calendar and try again.`,
          actions: []
        };
      }

      console.log('Found event to delete:', eventToDelete);

      // Delete the event using the real calendar service
      await deleteCalendarEvent(userId, eventToDelete.id);
      
      return {
        message: `I've deleted your event: **"${eventToDelete.summary}"**.`,
        actions: [`Deleted event: ${eventToDelete.summary}`]
      };
    } catch (error) {
      console.error('Error deleting event with data:', error);
      return {
        message: "I couldn't delete the event. Please try again or check the Calendar tab to delete it manually.",
        actions: []
      };
    }
  }

  // Use Gemini to parse calendar event requests
  async parseCalendarEventWithGemini(message) {
    try {
      const prompt = `Parse this calendar event request and extract the event details. Return ONLY a JSON object with the following structure:

{
  "title": "Event title",
  "date": "Date string (today, tomorrow, specific date)",
  "startTime": "Start time string",
  "endTime": "End time string",
  "success": true/false,
  "error": "Error message if parsing failed"
}

Examples:
- "Add an event to my calendar from Mom visit today from 11:00 AM CST to 5:00 PM CST" → {"title": "Mom visit", "date": "today", "startTime": "11:00 AM CST", "endTime": "5:00 PM CST", "success": true}
- "Schedule a meeting tomorrow at 2pm for 1 hour" → {"title": "meeting", "date": "tomorrow", "startTime": "2:00 PM", "endTime": "3:00 PM", "success": true}
- "Add task to review documents" → {"success": false, "error": "Not a calendar event request"}

User request: "${message}"

JSON response:`;

      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();
      
      console.log('Calendar parsing - Gemini raw response:', text);
      
      // Extract JSON from the response
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        console.error('No JSON found in Gemini response:', text);
        return null;
      }

      const parsedData = JSON.parse(jsonMatch[0]);
      console.log('Calendar parsing - Parsed JSON data:', parsedData);
      
      if (!parsedData.success) {
        console.log('Gemini parsing failed:', parsedData.error);
        return null;
      }

      // Convert the parsed data to actual Date objects
      const eventDate = this.parseDate(parsedData.date);
      if (!eventDate) {
        console.error('Could not parse date:', parsedData.date);
        return null;
      }

      const startTime = this.parseTime(parsedData.startTime, eventDate);
      const endTime = this.parseTime(parsedData.endTime, eventDate);
      
      if (!startTime || !endTime) {
        console.error('Could not parse times:', parsedData.startTime, parsedData.endTime);
        return null;
      }

      return {
        title: parsedData.title,
        startTime: startTime,
        endTime: endTime
      };

    } catch (error) {
      console.error('Error parsing calendar event with Gemini:', error);
      return null;
    }
  }

  async getEvents(message, userId) {
    try {
      const events = await listCalendarEvents(userId, 10);
      
      if (events.length === 0) {
        return {
          message: "You don't have any upcoming events. Try saying 'Schedule a meeting' to add one!",
          actions: []
        };
      }

      const eventList = events.map(event => {
        const start = new Date(event.start.dateTime || event.start.date);
        return `• ${event.summary} (${start.toLocaleDateString()} at ${start.toLocaleTimeString()})`;
      }).join('\n');

      return {
        message: `Here are your upcoming events:\n\n${eventList}\n\nYou can manage these in the Calendar tab.`,
        actions: [`Retrieved ${events.length} events`]
      };
    } catch (error) {
      console.error('Error getting events:', error);
      if (error.message && error.message.includes('No Google tokens found')) {
        return {
          message: "I couldn't retrieve your events because your Google Calendar isn't connected. Please connect your Google account in the Calendar tab first.",
          actions: []
        };
      }
      return {
        message: "I couldn't retrieve your events. Please make sure your Google Calendar is connected or check the Calendar tab.",
        actions: []
      };
    }
  }

  // Utility method to parse natural language dates
  parseDate(dateText) {
    const lowerText = dateText.toLowerCase();
    const now = new Date();
    
    // Handle relative dates
    if (lowerText.includes('today')) {
      return new Date(now.getFullYear(), now.getMonth(), now.getDate());
    }
    if (lowerText.includes('tomorrow')) {
      return new Date(now.getTime() + 24 * 60 * 60 * 1000);
    }
    if (lowerText.includes('next week')) {
      return new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
    }
    if (lowerText.includes('next month')) {
      return new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
    }
    if (lowerText.includes('in a week')) {
      return new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
    }
    if (lowerText.includes('in a month')) {
      return new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
    }
    if (lowerText.includes('in 2 weeks')) {
      return new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000);
    }
    if (lowerText.includes('in 3 months')) {
      return new Date(now.getTime() + 90 * 24 * 60 * 60 * 1000);
    }
    
    // Handle specific dates (basic parsing)
    const dateMatch = lowerText.match(/(\d{1,2})\/(\d{1,2})\/(\d{4})/);
    if (dateMatch) {
      const [, month, day, year] = dateMatch;
      return new Date(year, month - 1, day);
    }
    
    // Handle month names
    const months = {
      'january': 0, 'february': 1, 'march': 2, 'april': 3, 'may': 4, 'june': 5,
      'july': 6, 'august': 7, 'september': 8, 'october': 9, 'november': 10, 'december': 11
    };
    
    for (const [monthName, monthIndex] of Object.entries(months)) {
      if (lowerText.includes(monthName)) {
        const yearMatch = lowerText.match(/(\d{4})/);
        const year = yearMatch ? parseInt(yearMatch[1]) : now.getFullYear();
        return new Date(year, monthIndex, 1);
    }
    }
    
    return null; // Could not parse date
  }

  // Utility method to parse date and time for calendar events
  parseDateTime(dateStr, startTimeStr, endTimeStr) {
    try {
      const now = new Date();
      let eventDate = now;
      
      // Parse the date
      const lowerDateStr = dateStr.toLowerCase();
      if (lowerDateStr.includes('today')) {
        eventDate = now;
      } else if (lowerDateStr.includes('tomorrow')) {
        eventDate = new Date(now.getTime() + 24 * 60 * 60 * 1000);
      } else if (lowerDateStr.includes('next week')) {
        eventDate = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
      } else {
        // Try to parse specific date
        const parsedDate = this.parseDate(dateStr);
        if (parsedDate) {
          eventDate = parsedDate;
        }
      }
      
      // Parse start time
      const startTime = this.parseTime(startTimeStr, eventDate);
      if (!startTime) return null;
      
      // Parse end time
      const endTime = this.parseTime(endTimeStr, eventDate);
      if (!endTime) return null;
      
      return { start: startTime, end: endTime };
    } catch (error) {
      console.error('Error parsing date/time:', error);
      return null;
    }
  }

  // Utility method to parse time strings
  parseTime(timeStr, baseDate) {
    try {
      const lowerTimeStr = timeStr.toLowerCase().trim();
      
      // Handle 12-hour format with AM/PM
      const timeMatch = lowerTimeStr.match(/(\d{1,2}):?(\d{2})?\s*(am|pm)/i);
      if (timeMatch) {
        let hours = parseInt(timeMatch[1]);
        const minutes = timeMatch[2] ? parseInt(timeMatch[2]) : 0;
        const period = timeMatch[3].toLowerCase();
        
        if (period === 'pm' && hours !== 12) hours += 12;
        if (period === 'am' && hours === 12) hours = 0;
        
        const result = new Date(baseDate);
        result.setHours(hours, minutes, 0, 0);
        return result;
      }
      
      // Handle 24-hour format
      const time24Match = lowerTimeStr.match(/(\d{1,2}):?(\d{2})/);
      if (time24Match) {
        const hours = parseInt(time24Match[1]);
        const minutes = parseInt(time24Match[2]);
        
        const result = new Date(baseDate);
        result.setHours(hours, minutes, 0, 0);
        return result;
      }
      
      // Handle timezone abbreviations (CST, EST, etc.)
      const timezoneMatch = lowerTimeStr.match(/(\d{1,2}):?(\d{2})?\s*(am|pm)?\s*(cst|est|pst|mst)/i);
      if (timezoneMatch) {
        let hours = parseInt(timezoneMatch[1]);
        const minutes = timezoneMatch[2] ? parseInt(timezoneMatch[2]) : 0;
        const period = timezoneMatch[3] ? timezoneMatch[3].toLowerCase() : null;
        const timezone = timezoneMatch[4].toLowerCase();
        
        if (period === 'pm' && hours !== 12) hours += 12;
        if (period === 'am' && hours === 12) hours = 0;
        
        // Simple timezone conversion (you might want to use a proper timezone library)
        const timezoneOffsets = {
          'cst': -6, 'est': -5, 'pst': -8, 'mst': -7
        };
        
        const offset = timezoneOffsets[timezone] || 0;
        const result = new Date(baseDate);
        result.setHours(hours - offset, minutes, 0, 0);
        return result;
      }
      
      return null;
    } catch (error) {
      console.error('Error parsing time:', error);
      return null;
    }
  }





  // Task CRUD operations
  async updateTask(message, userId) {
    try {
      const parsedTask = await this.parseTaskUpdateWithGemini(message);
      
      if (!parsedTask) {
        return {
          message: "I'd be happy to help you update a task! Please specify which task you'd like to update and what changes to make. For example: 'Update my task to review documents with a new due date of tomorrow'",
          actions: []
        };
      }

      console.log('Parsed task update data:', parsedTask);

      // First, find the task by title to get the actual UUID
      const tasksResponse = await tasksAPI.getAll();
      const tasks = tasksResponse.data;
      
      // Find the task that matches the title (case-insensitive)
      const taskToUpdate = tasks.find(task => 
        task.title.toLowerCase().includes(parsedTask.title.toLowerCase()) ||
        parsedTask.title.toLowerCase().includes(task.title.toLowerCase())
      );

      if (!taskToUpdate) {
        return {
          message: `I couldn't find a task matching "${parsedTask.title}". Please check your tasks and try again.`,
          actions: []
        };
      }

      console.log('Found task to update:', taskToUpdate);

      const taskData = {
        title: parsedTask.title || taskToUpdate.title,
        description: parsedTask.description || taskToUpdate.description,
        due_date: parsedTask.dueDate ? parsedTask.dueDate.toISOString() : taskToUpdate.due_date,
        priority: parsedTask.priority || taskToUpdate.priority,
        status: parsedTask.status || taskToUpdate.status
      };

      // Remove undefined values
      Object.keys(taskData).forEach(key => taskData[key] === undefined && delete taskData[key]);

      await tasksAPI.update(taskToUpdate.id, taskData);
      return {
        message: `Perfect! I've updated your task: **"${taskToUpdate.title}"**. You can view the changes in the Tasks tab.`,
        actions: [`Updated task: ${taskToUpdate.title}`]
      };
    } catch (error) {
      console.error('Error updating task:', error);
      return {
        message: "I couldn't update the task. Please try again or check the Tasks tab to update it manually.",
        actions: []
      };
    }
  }

  async deleteTask(message, userId) {
    try {
      const parsedTask = await this.parseTaskDeleteWithGemini(message);
      
      if (!parsedTask) {
        return {
          message: "I'd be happy to help you delete a task! Please specify which task you'd like to delete. For example: 'Delete my task to review documents'",
          actions: []
        };
      }

      console.log('Parsed task delete data:', parsedTask);

      // First, find the task by title to get the actual UUID
      const tasksResponse = await tasksAPI.getAll();
      const tasks = tasksResponse.data;
      
      // Find the task that matches the title (case-insensitive)
      const taskToDelete = tasks.find(task => 
        task.title.toLowerCase().includes(parsedTask.title.toLowerCase()) ||
        parsedTask.title.toLowerCase().includes(task.title.toLowerCase())
      );

      if (!taskToDelete) {
        return {
          message: `I couldn't find a task matching "${parsedTask.title}". Please check your tasks and try again.`,
          actions: []
        };
      }

      console.log('Found task to delete:', taskToDelete);

      await tasksAPI.delete(taskToDelete.id);
      return {
        message: `I've deleted your task: **"${taskToDelete.title}"**.`,
        actions: [`Deleted task: ${taskToDelete.title}`]
      };
    } catch (error) {
      console.error('Error deleting task:', error);
      return {
        message: "I couldn't delete the task. Please try again or check the Tasks tab to delete it manually.",
        actions: []
      };
    }
  }

  async completeTask(message, userId) {
    try {
      const parsedTask = await this.parseTaskCompleteWithGemini(message);
      
      if (!parsedTask) {
        return {
          message: "I'd be happy to help you complete a task! Please specify which task you'd like to mark as complete. For example: 'Complete my task to review documents'",
          actions: []
        };
      }

      console.log('Parsed task complete data:', parsedTask);

      // First, find the task by title to get the actual UUID
      const tasksResponse = await tasksAPI.getAll();
      const tasks = tasksResponse.data;
      
      // Find the task that matches the title (case-insensitive)
      const taskToComplete = tasks.find(task => 
        task.title.toLowerCase().includes(parsedTask.title.toLowerCase()) ||
        parsedTask.title.toLowerCase().includes(task.title.toLowerCase())
      );

      if (!taskToComplete) {
        return {
          message: `I couldn't find a task matching "${parsedTask.title}". Please check your tasks and try again.`,
          actions: []
        };
      }

      console.log('Found task to complete:', taskToComplete);

      const taskData = {
        status: 'completed'
      };

      await tasksAPI.update(taskToComplete.id, taskData);
      return {
        message: `Great job! I've marked your task as complete: **"${taskToComplete.title}"**.`,
        actions: [`Completed task: ${taskToComplete.title}`]
      };
    } catch (error) {
      console.error('Error completing task:', error);
      return {
        message: "I couldn't complete the task. Please try again or check the Tasks tab to mark it as complete manually.",
        actions: []
      };
    }
  }

  // Calendar CRUD operations
  async updateEvent(message, userId) {
    try {
      const parsedEvent = await this.parseEventUpdateWithGemini(message);
      
      if (!parsedEvent) {
        return {
          message: "I'd be happy to help you update an event! Please specify which event you'd like to update and what changes to make. For example: 'Update my meeting tomorrow to start at 3pm instead of 2pm'",
          actions: []
        };
      }

      console.log('Parsed event update data:', parsedEvent);

      // First, try to find the event by title
      const events = await listCalendarEvents(userId, 50);
      const eventToUpdate = events.find(event => 
        event.summary && event.summary.toLowerCase().includes(parsedEvent.title.toLowerCase())
      );

      if (!eventToUpdate) {
        // If event doesn't exist, create it instead
        console.log('Event not found, creating new event instead');
        
        // Parse the original message as a create request
        const createParsedEvent = await this.parseCalendarEventWithGemini(message);
        
        if (!createParsedEvent) {
          return {
            message: `I couldn't find an event matching "${parsedEvent.title}" and couldn't create a new one. Please try creating the event manually in the Calendar tab.`,
            actions: []
          };
        }

        // Create the new event
        const event = await createCalendarEvent(userId, {
          summary: createParsedEvent.title,
          description: `Event: ${createParsedEvent.title}`,
          startTime: createParsedEvent.startTime.toISOString(),
          endTime: createParsedEvent.endTime.toISOString(),
          timeZone: 'America/Chicago'
        });
        
        return {
          message: `I couldn't find an existing event called "${parsedEvent.title}", so I created a new one for you! **"${createParsedEvent.title}"** has been scheduled for ${createParsedEvent.startTime.toLocaleDateString()} from ${createParsedEvent.startTime.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})} to ${createParsedEvent.endTime.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}. You can view it in your Google Calendar or the Calendar tab.`,
          actions: [`Created event: ${createParsedEvent.title}`]
        };
      }

      console.log('Found event to update:', eventToUpdate);

      // Prepare the update data
      const updateData = {
        summary: parsedEvent.newTitle || eventToUpdate.summary,
        description: eventToUpdate.description || '',
        startTime: parsedEvent.newStartTime ? parsedEvent.newStartTime.toISOString() : eventToUpdate.start.dateTime || eventToUpdate.start.date,
        endTime: parsedEvent.newEndTime ? parsedEvent.newEndTime.toISOString() : eventToUpdate.end.dateTime || eventToUpdate.end.date,
        timeZone: 'America/Chicago'
      };

      // Update the event using the calendar service
      await updateCalendarEvent(userId, eventToUpdate.id, updateData);
      
      let responseMessage = `Perfect! I've updated your event: **"${eventToUpdate.summary}"**.`;
      
      if (parsedEvent.newTitle) {
        responseMessage += ` The title is now "${parsedEvent.newTitle}".`;
      }
      if (parsedEvent.newDate || parsedEvent.newStartTime) {
        responseMessage += ` The time has been updated.`;
      }
      
      responseMessage += ` You can view the changes in your Google Calendar or the Calendar tab.`;

      return {
        message: responseMessage,
        actions: [`Updated event: ${eventToUpdate.summary}`]
      };
    } catch (error) {
      console.error('Error updating event:', error);
      if (error.message && error.message.includes('No Google tokens found')) {
        return {
          message: "I couldn't update the event because your Google Calendar isn't connected. Please connect your Google account in the Calendar tab first.",
          actions: []
        };
      }
      return {
        message: "I couldn't update the event. Please try again or use the Calendar tab to update it manually.",
        actions: []
      };
    }
  }

  async deleteEvent(message, userId) {
    try {
      const parsedEvent = await this.parseEventDeleteWithGemini(message);
      
      if (!parsedEvent) {
        return {
          message: "I'd be happy to help you delete an event! Please specify which event you'd like to delete. For example: 'Delete my meeting tomorrow'",
          actions: []
        };
      }

      console.log('Parsed event delete data:', parsedEvent);

      // First, try to find the event by title
      const events = await listCalendarEvents(userId, 50);
      const eventToDelete = events.find(event => 
        event.summary && event.summary.toLowerCase().includes(parsedEvent.title.toLowerCase())
      );

      if (!eventToDelete) {
        return {
          message: `I couldn't find an event matching "${parsedEvent.title}". Please check your calendar and try again.`,
          actions: []
        };
      }

      console.log('Found event to delete:', eventToDelete);

      // Delete the event using the calendar service
      await deleteCalendarEvent(userId, eventToDelete.id);
      
      return {
        message: `Perfect! I've deleted your event: **"${eventToDelete.summary}"**. The event has been removed from your calendar.`,
        actions: [`Deleted event: ${eventToDelete.summary}`]
      };
    } catch (error) {
      console.error('Error deleting event:', error);
      if (error.message && error.message.includes('No Google tokens found')) {
        return {
          message: "I couldn't delete the event because your Google Calendar isn't connected. Please connect your Google account in the Calendar tab first.",
          actions: []
        };
      }
      return {
        message: "I couldn't delete the event. Please try again or use the Calendar tab to delete it manually.",
        actions: []
      };
    }
  }

  // Help method
  async showHelp(message, userId) {
    return {
      message: `I'm your Foci AI assistant! Here's what I can help you with:

🎯 **Goals:**
• "Add a goal to learn React" (create)
• "Show my goals" (read)
• "Update my goal to exercise daily" (update)
• "Delete my goal to learn Python" (delete)
• "Complete my goal to save money" (complete)
• "Get suggestions for my goal to learn React" (suggestions)

📋 **Tasks:**
• "Add a task to review documents" (create)
• "Show my tasks" (read)
• "Update my task to call the client" (update)
• "Delete my task to organize files" (delete)
• "Complete my task to send email" (complete)

📅 **Calendar:**
• "Schedule a meeting tomorrow at 2pm" (create)
• "Show my events" (read)
• "Update my meeting tomorrow" (update)
• "Delete my appointment" (delete)

💡 **AI Suggestions:**
• Use the "Get AI Suggestions" button in the goal form for personalized recommendations
• Ask me for suggestions on any goal: "Get suggestions for improving my fitness"

Try any of these commands to get started!`,
      actions: []
    };
  }

  // Gemini parsing methods for CRUD operations
  async parseGoalUpdateWithGemini(message) {
    try {
      const prompt = `Parse this goal update request and extract the goal details. Return ONLY a JSON object with the following structure:

{
  "goalId": "Goal ID or identifier",
  "title": "Updated goal title",
  "description": "Updated goal description (optional)",
  "targetDate": "Updated target date string (optional)",
  "isActive": true/false (optional),
  "success": true/false,
  "error": "Error message if parsing failed"
}

Examples:
- "Update my goal to exercise daily with a new target date of next month" → {"goalId": "exercise goal", "title": "exercise daily", "targetDate": "next month", "success": true}
- "Change my goal about learning React to be due by next week" → {"goalId": "learning React", "title": "learn React", "targetDate": "next week", "success": true}

User request: "${message}"

JSON response:`;

      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();
      
      console.log('Goal update parsing - Gemini raw response:', text);
      
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        console.error('No JSON found in goal update response:', text);
        return null;
      }

      const parsedData = JSON.parse(jsonMatch[0]);
      console.log('Goal update parsing - Parsed data:', parsedData);
      
      if (!parsedData.success) {
        console.log('Goal update parsing failed:', parsedData.error);
        return null;
      }

      // Convert target date if provided
      let targetDate = null;
      if (parsedData.targetDate) {
        targetDate = this.parseDate(parsedData.targetDate);
        if (!targetDate) {
          console.error('Could not parse target date:', parsedData.targetDate);
          return null;
        }
      }

      return {
        goalId: parsedData.goalId,
        title: parsedData.title,
        description: parsedData.description,
        targetDate: targetDate,
        isActive: parsedData.isActive
      };

    } catch (error) {
      console.error('Error parsing goal update with Gemini:', error);
      return null;
    }
  }

  async parseGoalDeleteWithGemini(message) {
    try {
      const prompt = `Parse this goal deletion request and extract the goal identifier. Return ONLY a JSON object with the following structure:

{
  "goalId": "Goal ID or identifier",
  "title": "Goal title for confirmation",
  "success": true/false,
  "error": "Error message if parsing failed"
}

Examples:
- "Delete my goal to learn React" → {"goalId": "learn React", "title": "learn React", "success": true}
- "Remove my goal about exercising daily" → {"goalId": "exercising daily", "title": "exercising daily", "success": true}

User request: "${message}"

JSON response:`;

      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();
      
      console.log('Goal delete parsing - Gemini raw response:', text);
      
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        console.error('No JSON found in goal delete response:', text);
        return null;
      }

      const parsedData = JSON.parse(jsonMatch[0]);
      console.log('Goal delete parsing - Parsed data:', parsedData);
      
      if (!parsedData.success) {
        console.log('Goal delete parsing failed:', parsedData.error);
        return null;
      }

      return {
        goalId: parsedData.goalId,
        title: parsedData.title
      };

    } catch (error) {
      console.error('Error parsing goal delete with Gemini:', error);
      return null;
    }
  }

  async parseGoalCompleteWithGemini(message) {
    try {
      const prompt = `Parse this goal completion request and extract the goal identifier. Return ONLY a JSON object with the following structure:

{
  "goalId": "Goal ID or identifier",
  "title": "Goal title for confirmation",
  "success": true/false,
  "error": "Error message if parsing failed"
}

Examples:
- "Complete my goal to learn React" → {"goalId": "learn React", "title": "learn React", "success": true}
- "Mark my goal about exercising daily as complete" → {"goalId": "exercising daily", "title": "exercising daily", "success": true}

User request: "${message}"

JSON response:`;

      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();
      
      console.log('Goal complete parsing - Gemini raw response:', text);
      
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        console.error('No JSON found in goal complete response:', text);
        return null;
      }

      const parsedData = JSON.parse(jsonMatch[0]);
      console.log('Goal complete parsing - Parsed data:', parsedData);
      
      if (!parsedData.success) {
        console.log('Goal complete parsing failed:', parsedData.error);
        return null;
      }

      return {
        goalId: parsedData.goalId,
        title: parsedData.title
      };

    } catch (error) {
      console.error('Error parsing goal complete with Gemini:', error);
      return null;
    }
  }

  // Task parsing methods (similar structure to goals)
  async parseTaskUpdateWithGemini(message) {
    try {
      const prompt = `Parse this task update request and extract the task details. Return ONLY a JSON object with the following structure:

{
  "taskId": "Task ID or identifier",
  "title": "Updated task title",
  "description": "Updated task description (optional)",
  "dueDate": "Updated due date string (optional)",
  "priority": "high|medium|low (optional)",
  "status": "pending|in_progress|completed (optional)",
  "success": true/false,
  "error": "Error message if parsing failed"
}

Examples:
- "Update my task to review documents with a new due date of tomorrow" → {"taskId": "review documents", "title": "review documents", "dueDate": "tomorrow", "success": true}
- "Change my task about calling the client to be due by Friday" → {"taskId": "calling the client", "title": "call the client", "dueDate": "Friday", "success": true}

User request: "${message}"

JSON response:`;

      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();
      
      console.log('Task update parsing - Gemini raw response:', text);
      
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        console.error('No JSON found in task update response:', text);
        return null;
      }

      const parsedData = JSON.parse(jsonMatch[0]);
      console.log('Task update parsing - Parsed data:', parsedData);
      
      if (!parsedData.success) {
        console.log('Task update parsing failed:', parsedData.error);
        return null;
      }

      // Convert due date if provided
      let dueDate = null;
      if (parsedData.dueDate) {
        dueDate = this.parseDate(parsedData.dueDate);
        if (!dueDate) {
          console.error('Could not parse due date:', parsedData.dueDate);
          return null;
        }
      }

      return {
        taskId: parsedData.taskId,
        title: parsedData.title,
        description: parsedData.description,
        dueDate: dueDate,
        priority: parsedData.priority,
        status: parsedData.status
      };

    } catch (error) {
      console.error('Error parsing task update with Gemini:', error);
      return null;
    }
  }

  async parseTaskDeleteWithGemini(message) {
    try {
      const prompt = `Parse this task deletion request and extract the task identifier. Return ONLY a JSON object with the following structure:

{
  "taskId": "Task ID or identifier",
  "title": "Task title for confirmation",
  "success": true/false,
  "error": "Error message if parsing failed"
}

Examples:
- "Delete my task to review documents" → {"taskId": "review documents", "title": "review documents", "success": true}
- "Remove my task about calling the client" → {"taskId": "calling the client", "title": "calling the client", "success": true}

User request: "${message}"

JSON response:`;

      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();
      
      console.log('Task delete parsing - Gemini raw response:', text);
      
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        console.error('No JSON found in task delete response:', text);
        return null;
      }

      const parsedData = JSON.parse(jsonMatch[0]);
      console.log('Task delete parsing - Parsed data:', parsedData);
      
      if (!parsedData.success) {
        console.log('Task delete parsing failed:', parsedData.error);
        return null;
      }

      return {
        taskId: parsedData.taskId,
        title: parsedData.title
      };

    } catch (error) {
      console.error('Error parsing task delete with Gemini:', error);
      return null;
    }
  }

  async parseTaskCompleteWithGemini(message) {
    try {
      const prompt = `Parse this task completion request and extract the task identifier. Return ONLY a JSON object with the following structure:

{
  "taskId": "Task ID or identifier",
  "title": "Task title for confirmation",
  "success": true/false,
  "error": "Error message if parsing failed"
}

Examples:
- "Complete my task to review documents" → {"taskId": "review documents", "title": "review documents", "success": true}
- "Mark my task about calling the client as complete" → {"taskId": "calling the client", "title": "calling the client", "success": true}

User request: "${message}"

JSON response:`;

      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();
      
      console.log('Task complete parsing - Gemini raw response:', text);
      
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        console.error('No JSON found in task complete response:', text);
        return null;
      }

      const parsedData = JSON.parse(jsonMatch[0]);
      console.log('Task complete parsing - Parsed data:', parsedData);
      
      if (!parsedData.success) {
        console.log('Task complete parsing failed:', parsedData.error);
        return null;
      }

      return {
        taskId: parsedData.taskId,
        title: parsedData.title
      };

    } catch (error) {
      console.error('Error parsing task complete with Gemini:', error);
      return null;
    }
  }

  // Event parsing methods (similar structure to goals)
  async parseEventUpdateWithGemini(message) {
    try {
      const prompt = `Parse this calendar event update request and extract the event details. Return ONLY a JSON object with the following structure:

{
  "title": "Event title to identify the event",
  "newTitle": "New event title (optional)",
  "newDate": "New date string (optional)",
  "newStartTime": "New start time string (optional)",
  "newEndTime": "New end time string (optional)",
  "success": true/false,
  "error": "Error message if parsing failed"
}

Examples:
- "Update calendar for Oil Change Service on July 9th at 10:00 AM CST" → {"title": "Oil Change Service", "newDate": "July 9th", "newStartTime": "10:00 AM CST", "success": true}
- "Change my meeting tomorrow to start at 3pm instead of 2pm" → {"title": "meeting", "newStartTime": "3pm", "success": true}
- "Update the team lunch event to be on Friday instead of Thursday" → {"title": "team lunch", "newDate": "Friday", "success": true}

User request: "${message}"

JSON response:`;

      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();
      
      console.log('Event update parsing - Gemini raw response:', text);
      
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        console.error('No JSON found in event update response:', text);
        return null;
      }

      const parsedData = JSON.parse(jsonMatch[0]);
      console.log('Event update parsing - Parsed data:', parsedData);
      
      if (!parsedData.success) {
        console.log('Event update parsing failed:', parsedData.error);
        return null;
      }

      // Convert dates and times if provided
      let newDate = null;
      let newStartTime = null;
      let newEndTime = null;

      if (parsedData.newDate) {
        newDate = this.parseDate(parsedData.newDate);
        if (!newDate) {
          console.error('Could not parse new date:', parsedData.newDate);
          return null;
        }
      }

      if (parsedData.newStartTime) {
        const baseDate = newDate || new Date();
        newStartTime = this.parseTime(parsedData.newStartTime, baseDate);
        if (!newStartTime) {
          console.error('Could not parse new start time:', parsedData.newStartTime);
          return null;
        }
      }

      if (parsedData.newEndTime) {
        const baseDate = newDate || new Date();
        newEndTime = this.parseTime(parsedData.newEndTime, baseDate);
        if (!newEndTime) {
          console.error('Could not parse new end time:', parsedData.newEndTime);
          return null;
        }
      }

      return {
        title: parsedData.title,
        newTitle: parsedData.newTitle,
        newDate: newDate,
        newStartTime: newStartTime,
        newEndTime: newEndTime
      };

    } catch (error) {
      console.error('Error parsing event update with Gemini:', error);
      return null;
    }
  }

  async parseEventDeleteWithGemini(message) {
    try {
      const prompt = `Parse this calendar event deletion request and extract the event identifier. Return ONLY a JSON object with the following structure:

{
  "title": "Event title to identify the event",
  "date": "Event date (optional, for disambiguation)",
  "success": true/false,
  "error": "Error message if parsing failed"
}

Examples:
- "Delete my meeting tomorrow" → {"title": "meeting", "date": "tomorrow", "success": true}
- "Remove the Oil Change Service event" → {"title": "Oil Change Service", "success": true}
- "Cancel my team lunch on Friday" → {"title": "team lunch", "date": "Friday", "success": true}

User request: "${message}"

JSON response:`;

      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();
      
      console.log('Event delete parsing - Gemini raw response:', text);
      
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        console.error('No JSON found in event delete response:', text);
        return null;
      }

      const parsedData = JSON.parse(jsonMatch[0]);
      console.log('Event delete parsing - Parsed data:', parsedData);
      
      if (!parsedData.success) {
        console.log('Event delete parsing failed:', parsedData.error);
        return null;
      }

      // Convert date if provided
      let date = null;
      if (parsedData.date) {
        date = this.parseDate(parsedData.date);
        if (!date) {
          console.error('Could not parse date:', parsedData.date);
          return null;
        }
      }

      return {
        title: parsedData.title,
        date: date
      };

    } catch (error) {
      console.error('Error parsing event delete with Gemini:', error);
      return null;
    }
  }

  // Generate AI suggestions for goal achievement
  async generateGoalSuggestions(goalTitle) {
    try {
      const prompt = `Generate 5-7 practical, actionable suggestions to help achieve this goal. Focus on specific, measurable steps that can be implemented immediately. Include a mix of planning, execution, and motivation strategies.

Format your response as a bulleted list with clear, actionable items. Each suggestion should be specific and practical.

Goal: "${goalTitle}"

**AI Suggestions for Success:**

Suggestions:`;

      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();
      
      console.log('Goal suggestions - Gemini raw response:', text);
      
      // Clean up the response to ensure it's properly formatted
      let cleanedText = text.trim();
      
      // If the response doesn't start with bullet points, add them
      if (!cleanedText.startsWith('•') && !cleanedText.startsWith('-') && !cleanedText.startsWith('*')) {
        // Split by lines and add bullet points
        const lines = cleanedText.split('\n').filter(line => line.trim());
        cleanedText = lines.map(line => line.trim()).map(line => {
          if (line.startsWith('•') || line.startsWith('-') || line.startsWith('*')) {
            return line;
          }
          return `• ${line}`;
        }).join('\n');
      }
      
      return cleanedText;
    } catch (error) {
      console.error('Error generating goal suggestions:', error);
      return `• Break down the goal into smaller, manageable steps with specific deadlines
• Create a detailed action plan with weekly milestones and progress tracking
• Set up regular check-ins (daily/weekly) to monitor your progress
• Identify potential obstacles and create backup plans for each
• Celebrate small wins along the way to maintain motivation
• Find an accountability partner or join a community for support
• Use productivity tools and apps to track your progress systematically`;
    }
  }

  // Handle goal suggestions requests from chat
  async getGoalSuggestions(message, userId) {
    // Extract goal title from the message
    const suggestionMatch = message.match(/(?:suggestions?|get suggestions?|goal suggestions?)\s+(?:for\s+)?(.+)/i);
    
    if (!suggestionMatch) {
      return {
        message: "I'd be happy to provide suggestions for your goal! Please specify which goal you'd like suggestions for. For example: 'Get suggestions for my goal to learn React' or 'Suggestions for improving my fitness'",
        actions: []
      };
    }

    const goalTitle = suggestionMatch[1].trim();
    
    try {
      // Use the existing generateGoalSuggestions method
      const suggestions = await this.generateGoalSuggestions(goalTitle);
      
      return {
        message: `Here are some actionable suggestions for your goal "${goalTitle}":\n\n${suggestions}\n\nYou can also use the "Get AI Suggestions" button in the goal form for more personalized recommendations!`,
        actions: [`Generated suggestions for: ${goalTitle}`]
      };
    } catch (error) {
      console.error('Error getting goal suggestions:', error);
      return {
        message: "I'm sorry, I couldn't generate suggestions right now. Please try again or use the 'Get AI Suggestions' button in the goal form.",
        actions: []
      };
    }
  }
}

export default GeminiService; 