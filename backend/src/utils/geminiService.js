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
    this.systemPrompt = `You are Foci, an AI productivity coach and assistant.

Your primary role is to help users set, plan, and achieve their goals and tasks through natural conversation. You should:

1. **Understand the User's Intent:**  
   - Ask clarifying questions if the user's goal or request is vague.
   - Summarize and confirm the user's main objective before proceeding.

2. **Suggest and Break Down Goals:**  
   - Offer actionable suggestions, strategies, or steps to help the user achieve their goals.
   - When appropriate, break down large goals into smaller, manageable tasks.

3. **Propose Bulk Actions:**  
   - When you have a list of tasks or goals to add, present them to the user for review and approval.
   - Wait for explicit user approval (e.g., "Yes, add these") before sending any tasks/goals to the app for storage.

4. **Output for Bulk Actions:**  
   - When the user approves, output the list of tasks/goals in a clear, structured format (e.g., a JSON array or a numbered list).
   - Example JSON format for tasks:
     [
       { "type": "task", "title": "Buy running shoes" },
       { "type": "task", "title": "Create a training plan" }
     ]
   - Or, if using a list, make it easy for the backend to parse. Please return the tasks as a JSON array.

5. **Maintain Conversation History:**  
   - Keep the conversation context-aware, so you can refer back to previous goals, tasks, or user preferences.

6. **Be Proactive, but Not Pushy:**  
   - Offer to help with next steps (e.g., "Would you like to schedule these tasks?") but always wait for user confirmation.

7. **General Productivity Support:**  
   - Provide advice, encouragement, and best practices for productivity, focus, and goal achievement.

**Never add, delete, or modify tasks/goals/calendar events without explicit user approval. Always show the user what you plan to add before sending it to the app.**
`;
  }

  async processMessage(message, userId) {
    try {
      // If Gemini is not enabled, provide a helpful message
      if (!this.enabled) {
        return {
          message: "I'm currently in basic mode. To enable full AI features, please set up your Gemini API key in the environment variables.",
          actions: []
        };
      }

      // Send all requests through Gemini for intelligent interpretation
      console.log('Processing message through Gemini AI...');
      return await this.getGeminiResponse(message, userId);
    } catch (error) {
      console.error('Gemini Service Error:', error);
      
      return {
        message: "I'm sorry, I encountered an error processing your request. Please try again or rephrase your request.",
        actions: []
      };
    }
  }

  async handleDirectCommands(message, userId) {
    // Comment out direct command logic as per instructions
    return null;
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
      console.log('🔄 Starting Gemini processing for message:', message);
      
      // Step 1: Classify the request type and operation using Gemini
      console.log('📋 Classifying request type...');
      const classification = await this.classifyRequestType(message);
      console.log('✅ Classification result:', classification);
      
      const { type, operation, confidence } = classification;
      
      // Log confidence level and provide fallback for low confidence
      if (confidence === 'low') {
        console.warn('⚠️  Low confidence classification detected. Proceeding with caution.');
      }
      
      console.log(`🎯 Routing to: ${type} operation: ${operation} (confidence: ${confidence})`);
      
      // Step 2: Extract detailed information using Gemini based on type and operation
      let extractedData = null;
      let response = null;
      
      try {
        if (type === 'goal' || type === 'goals') {
          console.log('🎯 Processing goal operation:', operation);
          extractedData = await this.extractGoalDetails(message, operation);
          if (extractedData) {
            response = await this.executeGoalOperation(extractedData, userId, operation);
          } else {
            throw new Error('Failed to extract goal details');
          }
        } else if (type === 'task' || type === 'tasks') {
          console.log('📝 Processing task operation:', operation);
          extractedData = await this.extractTaskDetails(message, operation);
          if (extractedData) {
            response = await this.executeTaskOperation(extractedData, userId, operation);
          } else {
            throw new Error('Failed to extract task details');
          }
        } else if (type === 'calendar' || type === 'event' || type === 'events') {
          console.log('📅 Processing calendar operation:', operation);
          extractedData = await this.extractCalendarDetails(message, operation);
          if (extractedData) {
            response = await this.executeCalendarOperation(extractedData, userId, operation);
          } else {
            throw new Error('Failed to extract calendar details');
          }
        } else if (operation === 'help') {
          console.log('❓ Processing help request');
          response = await this.showHelp(message, userId);
        } else {
          // General conversation or advice request
          console.log('💬 Processing general conversation');
          response = await this.handleGeneralConversation(message, userId);
        }
      } catch (extractionError) {
        console.error('❌ Error during extraction/execution:', extractionError);
        
        // Provide helpful error messages based on the operation
        if (operation === 'create') {
          response = {
            message: `I understood you want to create something, but I need more details. Please try being more specific. For example:
• "Add a goal to learn React"
• "Create a task to review documents"
• "Schedule a meeting tomorrow at 2pm"`,
            actions: []
          };
        } else if (operation === 'read') {
          response = {
            message: `I'll help you view your items. You can also check the Goals, Tasks, or Calendar tabs for a complete overview.`,
            actions: []
          };
        } else {
          response = {
            message: `I encountered an issue processing your request. Please try again with more specific details.`,
            actions: []
          };
        }
      }
      
      // Validate response
      if (!response || !response.message) {
        console.error('❌ Invalid response structure');
        response = {
          message: "I'm sorry, I encountered an unexpected error. Please try again.",
          actions: []
        };
      }
      
      console.log('✅ Gemini processing completed successfully');
      return response;
      
    } catch (error) {
      console.error('❌ Gemini API Error:', error);
      
      // Provide more specific error messages based on error type
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
      } else if (error.message && error.message.includes('timeout')) {
        return {
          message: "The AI service is taking too long to respond. Please try again in a moment.",
          actions: []
        };
      } else if (error.message && error.message.includes('network')) {
        return {
          message: "I'm having trouble connecting to the internet. Please check your connection and try again.",
          actions: []
        };
      } else {
        return {
          message: "I'm having trouble processing your request right now. Please try again in a moment or use a simpler command like 'add goal' or 'show tasks'.",
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
      
      // Extract JSON from the response with multiple fallback strategies
      let jsonMatch = text.match(/\{[\s\S]*\}/);
      
      // If no JSON found, try to clean up the response
      if (!jsonMatch) {
        console.log('No JSON found, attempting to clean response...');
        // Remove any markdown formatting
        const cleanedText = text.replace(/```json\s*/g, '').replace(/```\s*/g, '').trim();
        jsonMatch = cleanedText.match(/\{[\s\S]*\}/);
      }
      
      // If still no JSON, try to extract just the object part
      if (!jsonMatch) {
        console.log('Still no JSON found, trying to extract object...');
        const objectMatch = text.match(/\{[^}]*"type"[^}]*"operation"[^}]*"confidence"[^}]*\}/);
        if (objectMatch) {
          jsonMatch = objectMatch;
        }
      }
      
      if (!jsonMatch) {
        console.error('No JSON found in classification response:', text);
        // Return a safe default classification
        return { 
          type: 'general', 
          operation: 'help', 
          confidence: 'low',
          reasoning: 'Could not parse classification response'
        };
      }

      let classification;
      try {
        classification = JSON.parse(jsonMatch[0]);
      } catch (parseError) {
        console.error('Error parsing classification JSON:', parseError);
        console.error('JSON string:', jsonMatch[0]);
        
        // Try to extract individual fields as fallback
        const typeMatch = jsonMatch[0].match(/"type"\s*:\s*"([^"]+)"/);
        const operationMatch = jsonMatch[0].match(/"operation"\s*:\s*"([^"]+)"/);
        const confidenceMatch = jsonMatch[0].match(/"confidence"\s*:\s*"([^"]+)"/);
        
        classification = {
          type: typeMatch ? typeMatch[1] : 'general',
          operation: operationMatch ? operationMatch[1] : 'help',
          confidence: confidenceMatch ? confidenceMatch[1] : 'low',
          reasoning: 'Parsed with fallback method due to JSON parsing error'
        };
      }
      
      console.log('Request classification - Parsed data:', classification);
      
      // Validate the classification
      const validTypes = ['goal', 'goals', 'task', 'tasks', 'calendar', 'event', 'events', 'general'];
      const validOperations = ['create', 'read', 'update', 'delete', 'complete', 'help'];
      const validConfidences = ['high', 'medium', 'low'];
      
      if (!validTypes.includes(classification.type)) {
        console.warn('Invalid type in classification:', classification.type);
        classification.type = 'general';
      }
      
      if (!validOperations.includes(classification.operation)) {
        console.warn('Invalid operation in classification:', classification.operation);
        classification.operation = 'help';
      }
      
      if (!validConfidences.includes(classification.confidence)) {
        console.warn('Invalid confidence in classification:', classification.confidence);
        classification.confidence = 'low';
      }
      
      return classification;

    } catch (error) {
      console.error('Error classifying request type:', error);
      return { 
        type: 'general', 
        operation: 'help', 
        confidence: 'low',
        reasoning: 'Classification failed due to error'
      };
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
      
      console.log('Goal parsing - Gemini raw response:', text);
      
      // Extract JSON from the response with multiple fallback strategies
      let jsonMatch = text.match(/\{[\s\S]*\}/);
      
      // If no JSON found, try to clean up the response
      if (!jsonMatch) {
        console.log('No JSON found in goal parsing, attempting to clean response...');
        const cleanedText = text.replace(/```json\s*/g, '').replace(/```\s*/g, '').trim();
        jsonMatch = cleanedText.match(/\{[\s\S]*\}/);
      }
      
      if (!jsonMatch) {
        console.error('No JSON found in goal parsing response:', text);
        return null;
      }

      let parsedData;
      try {
        parsedData = JSON.parse(jsonMatch[0]);
      } catch (parseError) {
        console.error('Error parsing goal JSON:', parseError);
        console.error('JSON string:', jsonMatch[0]);
        
        // Try to extract individual fields as fallback
        const titleMatch = jsonMatch[0].match(/"title"\s*:\s*"([^"]+)"/);
        const targetDateMatch = jsonMatch[0].match(/"targetDate"\s*:\s*"([^"]+)"/);
        const successMatch = jsonMatch[0].match(/"success"\s*:\s*(true|false)/);
        
        if (titleMatch && successMatch && successMatch[1] === 'true') {
          parsedData = {
            title: titleMatch[1],
            targetDate: targetDateMatch ? targetDateMatch[1] : 'next month',
            success: true
          };
        } else {
          return null;
        }
      }
      
      if (!parsedData.success) {
        console.log('Gemini goal parsing failed:', parsedData.error);
        return null;
      }

      // Validate required fields
      if (!parsedData.title || parsedData.title.trim() === '') {
        console.error('No title found in goal parsing');
        return null;
      }

      // Convert the parsed data to actual Date object
      const targetDate = this.parseDate(parsedData.targetDate);
      if (!targetDate) {
        console.error('Could not parse target date:', parsedData.targetDate);
        // Use a default date instead of failing
        const defaultDate = new Date();
        defaultDate.setMonth(defaultDate.getMonth() + 1); // Default to next month
        console.log('Using default target date:', defaultDate);
        return {
          title: parsedData.title,
          description: parsedData.description,
          targetDate: defaultDate
        };
      }

      return {
        title: parsedData.title.trim(),
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
        status: 'not_started'
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
  "priority": "low|medium|high (optional, default: medium)",
  "success": true/false,
  "error": "Error message if parsing failed"
}

Examples:
- "Add a task to review documents" → {"title": "review documents", "dueDate": "next week", "priority": "medium", "success": true}
- "Create a task to call the client by Friday" → {"title": "call the client", "dueDate": "Friday", "priority": "medium", "success": true}
- "Add a high priority task to fix the bug" → {"title": "fix the bug", "dueDate": "today", "priority": "high", "success": true}
- "Add goal to learn React" → {"success": false, "error": "Not a task request"}

User request: "${message}"

JSON response:`;

      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();
      
      console.log('Task parsing - Gemini raw response:', text);
      
      // Extract JSON from the response with multiple fallback strategies
      let jsonMatch = text.match(/\{[\s\S]*\}/);
      
      // If no JSON found, try to clean up the response
      if (!jsonMatch) {
        console.log('No JSON found in task parsing, attempting to clean response...');
        const cleanedText = text.replace(/```json\s*/g, '').replace(/```\s*/g, '').trim();
        jsonMatch = cleanedText.match(/\{[\s\S]*\}/);
      }
      
      if (!jsonMatch) {
        console.error('No JSON found in task parsing response:', text);
        return null;
      }

      let parsedData;
      try {
        parsedData = JSON.parse(jsonMatch[0]);
      } catch (parseError) {
        console.error('Error parsing task JSON:', parseError);
        console.error('JSON string:', jsonMatch[0]);
        
        // Try to extract individual fields as fallback
        const titleMatch = jsonMatch[0].match(/"title"\s*:\s*"([^"]+)"/);
        const dueDateMatch = jsonMatch[0].match(/"dueDate"\s*:\s*"([^"]+)"/);
        const priorityMatch = jsonMatch[0].match(/"priority"\s*:\s*"([^"]+)"/);
        const successMatch = jsonMatch[0].match(/"success"\s*:\s*(true|false)/);
        
        if (titleMatch && successMatch && successMatch[1] === 'true') {
          parsedData = {
            title: titleMatch[1],
            dueDate: dueDateMatch ? dueDateMatch[1] : 'next week',
            priority: priorityMatch ? priorityMatch[1] : 'medium',
            success: true
          };
        } else {
          return null;
        }
      }
      
      if (!parsedData.success) {
        console.log('Gemini task parsing failed:', parsedData.error);
        return null;
      }

      // Validate required fields
      if (!parsedData.title || parsedData.title.trim() === '') {
        console.error('No title found in task parsing');
        return null;
      }

      // Validate priority if provided
      if (parsedData.priority && !['low', 'medium', 'high'].includes(parsedData.priority)) {
        console.warn('Invalid priority in task parsing:', parsedData.priority);
        parsedData.priority = 'medium';
      }

      // Convert the parsed data to actual Date object
      const dueDate = this.parseDate(parsedData.dueDate);
      if (!dueDate) {
        console.error('Could not parse due date:', parsedData.dueDate);
        // Use a default date instead of failing
        const defaultDate = new Date();
        defaultDate.setDate(defaultDate.getDate() + 7); // Default to next week
        console.log('Using default due date:', defaultDate);
        return {
          title: parsedData.title.trim(),
          description: parsedData.description,
          dueDate: defaultDate,
          priority: parsedData.priority || 'medium'
        };
      }

      return {
        title: parsedData.title.trim(),
        description: parsedData.description,
        dueDate: dueDate,
        priority: parsedData.priority || 'medium'
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
        message: `Perfect! I've updated your event: **"${updatedEvent.summary}"**. You can view the changes in your Google Calendar or the Calendar tab.`,
        actions: [`Updated event: ${updatedEvent.summary}`]
      };
    } catch (error) {
      console.error('Error updating event with data:', error);
      return {
        message: "I couldn't update the event. Please try again or check the Calendar tab to update it manually.",
        actions: []
      };
    }
  }

  // Minimal required methods to complete the class
  async parseCalendarEventWithGemini(message) {
    // Placeholder - would need full implementation
    return null;
  }

  parseDate(dateString) {
    // Placeholder - would need full implementation
    return new Date();
  }

  async showHelp(message, userId) {
    return {
      message: "I'm here to help you manage your productivity! You can ask me to add goals, tasks, or schedule events.",
      actions: []
    };
  }
}

export default GeminiService;