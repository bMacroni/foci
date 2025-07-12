import { GoogleGenerativeAI } from '@google/generative-ai';
import { dateParser } from './dateParser.js';
import {
  allGeminiFunctionDeclarations
} from './geminiFunctionDeclarations.js';
import * as tasksController from '../controllers/tasksController.js';
import * as goalsController from '../controllers/goalsController.js';
import * as calendarService from './calendarService.js';

export class GeminiService {
  constructor() {
    this.conversationHistory = new Map();
    if (!process.env.GOOGLE_AI_API_KEY) {
      console.warn('GOOGLE_AI_API_KEY not found. Gemini AI features will be disabled.');
      this.enabled = false;
      return;
    }
    this.enabled = true;
    this.genAI = new GoogleGenerativeAI(process.env.GOOGLE_AI_API_KEY);
    this.model = this.genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
    console.log('✅ Gemini AI initialized with model: gemini-2.5-flash');
  }

  /**
   * Main entry point for processing a user message using Gemini function calling API.
   */
  async processMessage(message, userId, userContext = {}) {
    try {
      if (!this.enabled) {
        return {
          message: "I'm currently in basic mode. To enable full AI features, please set up your Gemini API key in the environment variables.",
          actions: []
        };
      }
      // Update conversation history
      this._addToHistory(userId, { role: 'user', content: message });
      // Add a system prompt to instruct Gemini to use functions
      const systemPrompt = `
You are an AI assistant for a productivity app named Foci. Always use the provided functions for any user request that can be fulfilled by a function. Aside from helping the user with goals, tasks, and calendar events, you can also provide advice and help the user plan goals. If there is any confusion about which function to run, for example, your converation history consists of multiple requests, confirm with the user what their desired request is.

IMPORTANT: When you call lookup_goal and receive a list of goals, you MUST immediately call update_goal or delete_goal with the appropriate goal ID from that list. Do not stop after lookup_goal - continue with the action the user requested.

If a user request requires information you do not have (such as a goal ID), first call the appropriate function (e.g., 'lookup_goal') to retrieve the necessary data, then use that data to fulfill the user's request (e.g., call 'update_goal' with the correct ID). Only return plain text if no function is appropriate. Chain function calls as needed to fully satisfy the user's intent.

IMPORTANT: When you run a read function, like read_goal, read_task, or read_calendar_event, make sure your response is in the format of a JSON object.

RESPONSE GUIDELINES: When responding after executing function calls, use present tense and direct language. Say "I've added..." or "I've created..." or "Task created successfully" rather than "I've already added..." or "I've already created...". Be clear and concise about what action was just performed.`;
      // Trim conversation history to the last MAX_HISTORY_MESSAGES
      const MAX_HISTORY_MESSAGES = 10;
      const fullHistory = this.conversationHistory.get(userId) || [];
      const trimmedHistory = fullHistory.slice(-MAX_HISTORY_MESSAGES);
      const contents = [
        { role: 'user', parts: [{ text: systemPrompt }] },
        ...trimmedHistory.map(msg => ({
          role: msg.role,
          parts: [{ text: msg.content }]
        })),
        { role: 'user', parts: [{ text: message }] }
      ];
      // DEBUG: Log the incoming user message and contents
      console.log('DEBUG: Incoming user message:', message);
      console.log('DEBUG: Contents sent to Gemini:', JSON.stringify(contents, null, 2));
      // Send to Gemini
      const result = await this.model.generateContent({
        contents,
        tools: [{ functionDeclarations: allGeminiFunctionDeclarations }]
      });
      const response = await result.response;
      // Get function calls and text from Gemini response
      const functionCalls = response.functionCalls ? await response.functionCalls() : [];
      // DEBUG: Log the raw Gemini response and functionCalls
      console.log('DEBUG: Raw Gemini response:', response);
      console.log('DEBUG: Gemini functionCalls (evaluated):', functionCalls);
      // Check for function calls
      let actions = [];
      let functionResults = [];
      // Track executed function calls to prevent duplication
      const executedFunctionCalls = new Set();
      if (functionCalls && functionCalls.length > 0) {
        // DEBUG: Log function calls
        console.log('DEBUG: Gemini functionCalls:', functionCalls);
        for (const functionCall of functionCalls) {
          // Create a unique key for the function call (name + args JSON)
          const callKey = `${functionCall.name}:${JSON.stringify(functionCall.args)}`;
          executedFunctionCalls.add(callKey);
          let execResult = await this._executeFunctionCall(functionCall, userId, userContext);
          // Due date normalization for tests (mock mode)
          let details = execResult !== undefined && execResult !== null ? execResult : functionCall.args;
          // Gemini API expects functionResponse.response to be an object, not an array
          if (functionCall.name === 'read_goal' && Array.isArray(details)) {
            details = { goals: details };
          }
          if (functionCall.name === 'read_task' && Array.isArray(details)) {
            details = { tasks: details };
          }
          if (functionCall.name === 'read_calendar_event' && Array.isArray(details)) {
            details = { events: details };
          }
          if (details && details.due_date) {
            // Normalize past year to current year
            const yearMatch = details.due_date.match(/^\(\d{4}\)-(\d{2})-(\d{2})$/);
            if (yearMatch && parseInt(yearMatch[1]) < new Date().getFullYear()) {
              const currentYear = String(new Date().getFullYear());
              details.due_date = currentYear + '-' + yearMatch[2] + '-' + yearMatch[3];
            }
            // Normalize 'tomorrow' to tomorrow's date
            if (details.due_date.toLowerCase && details.due_date.toLowerCase() === 'tomorrow') {
              const tomorrow = new Date();
              tomorrow.setDate(tomorrow.getDate() + 1);
              const yyyy = tomorrow.getFullYear();
              const mm = String(tomorrow.getMonth() + 1).padStart(2, '0');
              const dd = String(tomorrow.getDate()).padStart(2, '0');
              details.due_date = `${yyyy}-${mm}-${dd}`;
            }
          }
          // Only add to actions if it's not a lookup operation
          if (functionCall.name !== 'lookup_goal') {
            // Map function call to action object
            let action_type = 'unknown';
            let entity_type = 'unknown';
            if (functionCall.name.startsWith('create_')) action_type = 'create';
            else if (functionCall.name.startsWith('read_')) action_type = 'read';
            else if (functionCall.name.startsWith('update_')) action_type = 'update';
            else if (functionCall.name.startsWith('delete_')) action_type = 'delete';
            const entityMatch = functionCall.name.match(/^(create|read|update|delete)_(.*)$/);
            if (entityMatch) entity_type = entityMatch[2];
            actions.push({
              action_type,
              entity_type,
              details
            });
          }
          functionResults.push({ name: functionCall.name, response: details });
        }
        // Send function results back to Gemini for final message
        const functionResponses = functionResults.map(fr => ({
          name: fr.name,
          response: fr.response
        }));
        const followupContents = [
          ...contents,
          ...functionResponses.map(fr => ({
            role: 'model',
            parts: [{ 
              functionResponse: { 
                name: fr.name, 
                response: Array.isArray(fr.response) ? { goals: fr.response } : fr.response 
              } 
            }]
          }))
        ];
        // DEBUG: Log followup contents sent for final Gemini response
        console.log('DEBUG: Followup contents sent to Gemini:', JSON.stringify(followupContents, null, 2));
        let message = '';
        if (actions.length > 1) {
          message = `created ${actions.length} actions`;
        } else {
          const finalResult = await this.model.generateContent({
            contents: followupContents,
            tools: [{ functionDeclarations: allGeminiFunctionDeclarations }]
          });
          const finalResponse = await finalResult.response;
          
          // Check for additional function calls in the final response
          const finalFunctionCalls = finalResponse.functionCalls ? await finalResponse.functionCalls() : [];
          console.log('DEBUG: Final function calls:', finalFunctionCalls);
          
          if (finalFunctionCalls && finalFunctionCalls.length > 0) {
            console.log('DEBUG: Found additional function calls, processing them...');
            // Process the additional function calls
            for (const functionCall of finalFunctionCalls) {
              // Create a unique key for the function call (name + args JSON)
              const callKey = `${functionCall.name}:${JSON.stringify(functionCall.args)}`;
              if (executedFunctionCalls.has(callKey)) {
                // Skip duplicate function call
                continue;
              }
              executedFunctionCalls.add(callKey);
              const details = await this._executeFunctionCall(functionCall, userId, userContext);
              console.log('DEBUG: Additional function result:', details);
              
              // Determine action type and entity type
              let action_type = 'unknown';
              let entity_type = 'unknown';
              if (functionCall.name.startsWith('create_')) action_type = 'create';
              else if (functionCall.name.startsWith('read_')) action_type = 'read';
              else if (functionCall.name.startsWith('update_')) action_type = 'update';
              else if (functionCall.name.startsWith('delete_')) action_type = 'delete';
              const entityMatch = functionCall.name.match(/^(create|read|update|delete)_(.*)$/);
              if (entityMatch) entity_type = entityMatch[2];
              
              actions.push({
                action_type,
                entity_type,
                details
              });
            }
          }
          
          message = finalResponse.text ? await finalResponse.text() : '';
          // Always inject code block for the first read_task action if present
          const firstReadTask = actions.find(a => a.action_type === 'read' && a.entity_type === 'task');
          if (firstReadTask) {
            message = `Here are your tasks:\n\n\`\`\`json\n${JSON.stringify(firstReadTask, null, 2)}\`\`\``;
          }
          // DEBUG: Log the final Gemini response
          console.log('DEBUG: Final Gemini response:', finalResponse);
          console.log('DEBUG: Final message:', message);
        }
        // Add to conversation history
        this._addToHistory(userId, { role: 'model', content: message });
        // DEBUG: Log the final actions array
        console.log('DEBUG: Final actions array:', actions);
        return {
          message,
          actions
        };
      } else {
        // No function call, just return Gemini's text
        const message = response.text ? await response.text() : '';
        this._addToHistory(userId, { role: 'model', content: message });
        // DEBUG: Log the final message and empty actions
        console.log('DEBUG: No function call. Final message:', message);
        return {
          message,
          actions: []
        };
      }
    } catch (error) {
      console.error('Gemini Service Error:', error);
      return {
        message: "I'm sorry, I encountered an error processing your request. Please try again or rephrase your request.",
        actions: []
      };
    }
  }

  /**
   * Map Gemini function call to backend logic and execute.
   */
  async _executeFunctionCall(functionCall, userId, userContext) {
    const { name, args } = functionCall;
    try {
      console.log('Gemini function call name:', name);
      switch (name) {
        case 'create_task':
          // args: { title, description, due_date, priority, related_goal }
          // Map related_goal to goal_id if needed
          // ...implement mapping logic as needed
          return await tasksController.createTaskFromAI(args, userId, userContext);
        case 'update_task':
          return await tasksController.updateTaskFromAI(args, userId, userContext);
        case 'delete_task':
          return await tasksController.deleteTaskFromAI(args, userId, userContext);
        case 'read_task':
          return await tasksController.readTaskFromAI(args, userId, userContext);
        case 'lookup_task':
          console.log('Calling lookupTaskbyTitle with:', { userId, token: userContext.token });
          return await tasksController.lookupTaskbyTitle(userId, userContext.token);
        case 'create_goal':
          return await goalsController.createGoalFromAI(args, userId, userContext);
        case 'update_goal':
          return await goalsController.updateGoalFromAI(args, userId, userContext);
        case 'delete_goal':
          return await goalsController.deleteGoalFromAI(args, userId, userContext);
        case 'lookup_goal':
          return await goalsController.lookupGoalbyTitle(userId, userContext.token);
        case 'read_goal':
          // Use the new utility function, pass userId and token from userContext
          return await goalsController.getGoalsForUser(userId, userContext.token);
        case 'create_calendar_event':
          return await calendarService.createCalendarEventFromAI(args, userId, userContext);
        case 'update_calendar_event':
          return await calendarService.updateCalendarEventFromAI(args, userId, userContext);
        case 'delete_calendar_event':
          return await calendarService.deleteCalendarEventFromAI(args, userId, userContext);
        case 'read_calendar_event':
          return await calendarService.readCalendarEventFromAI(args, userId, userContext);
        case 'lookup_calendar_event':
          return await calendarService.lookupCalendarEventbyTitle(userId, userContext.token);
        default:
          return { error: `Unknown function call: ${name}` };
      }
    } catch (err) {
      return { error: err.message || String(err) };
    }
  }

  /**
   * Recommend a task from a list based on user query (e.g., low energy day)
   */
  async recommendTaskFromList(userRequest, tasks, userId) {
    if (!this.enabled) {
      return { recommendedTask: null, message: "Gemini AI is not enabled." };
    }
    // Format the task list for the prompt
    const taskListText = tasks.map((t, i) => `Task ${i + 1}:\nTitle: ${t.title}\nDescription: ${t.description}\nPriority: ${t.priority}`).join('\n\n');
    const prompt = `You are an AI assistant helping users choose tasks based on their current needs.\n\nUser Request: "${userRequest}"\n\nHere is the user's current task list:\n${taskListText}\n\nBased on the user's request, recommend ONE task from the list that best fits. Respond ONLY with a JSON object in the following format:\n\n{\n  "recommendedTask": {\n    "title": "...",\n    "description": "...",\n    "priority": "..."\n  }\n}`;

    const result = await this.model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
    // Try to parse the JSON response
    try {
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const jsonResponse = JSON.parse(jsonMatch[0]);
        if (jsonResponse.recommendedTask) {
          return { recommendedTask: jsonResponse.recommendedTask, message: text };
        }
      }
    } catch (e) {
      // Parsing failed
    }
    return { recommendedTask: null, message: text };
  }

  /**
   * Normalize due_date in Gemini JSON actions using DateParser utility
   */
  _normalizeDueDate(action) {
    if (!action.details || !action.details.due_date) return;
    let dueDateStr = action.details.due_date;
    let parsed = dateParser.parse(dueDateStr);
    if (parsed) {
      const parsedDate = new Date(parsed);
      if (parsedDate && !isNaN(parsedDate)) {
        const now = new Date();
        // If year is in the past, or not this year or next, set to this year
        if (parsedDate.getFullYear() < now.getFullYear() || parsedDate.getFullYear() > now.getFullYear() + 1) {
          parsedDate.setFullYear(now.getFullYear());
        }
        // If the date is in the past, move to next year
        if (parsedDate < now) {
          parsedDate.setFullYear(parsedDate.getFullYear() + 1);
        }
        // Format as YYYY-MM-DD
        const yyyy = parsedDate.getFullYear();
        const mm = String(parsedDate.getMonth() + 1).padStart(2, '0');
        const dd = String(parsedDate.getDate()).padStart(2, '0');
        action.details.due_date = `${yyyy}-${mm}-${dd}`;
      }
    }
  }

  /**
   * Validate the JSON structure matches the expected format
   */
  _validateJsonStructure(json) {
    const requiredFields = ['action_type', 'entity_type', 'details'];
    const validActionTypes = ['create', 'read', 'update', 'delete'];
    const validEntityTypes = ['goal', 'task', 'calendar_event'];
    
    // Check required fields exist
    for (const field of requiredFields) {
      if (!json.hasOwnProperty(field)) {
        return false;
      }
    }
    
    // Check action_type is valid
    if (!validActionTypes.includes(json.action_type)) {
      return false;
    }
    
    // Check entity_type is valid
    if (!validEntityTypes.includes(json.entity_type)) {
      return false;
    }
    
    // Check details is an object
    if (typeof json.details !== 'object' || json.details === null) {
      return false;
    }
    
    // Check details has at least a title
    if (!json.details.title) {
      return false;
    }
    
    return true;
  }

  /**
   * Add message to conversation history
   */
  _addToHistory(userId, message) {
    const userHistory = this.conversationHistory.get(userId) || [];
    userHistory.push(message);
    
    // Keep only last 20 exchanges to prevent memory bloat
    if (userHistory.length > 20) {
      userHistory.splice(0, userHistory.length - 20);
    }
    
    this.conversationHistory.set(userId, userHistory);
  }

  /**
   * Clear conversation history for a user
   */
  clearHistory(userId) {
    this.conversationHistory.delete(userId);
  }

  /**
   * Get conversation history for a user
   */
  getHistory(userId) {
    return this.conversationHistory.get(userId) || [];
  }
}

export default GeminiService; 