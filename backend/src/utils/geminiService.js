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
      // --- Add today's date to the prompt ---
      const today = new Date();
      const options = { year: 'numeric', month: 'long', day: 'numeric' };
      const todayString = today.toLocaleDateString('en-US', options);
      const systemPrompt = `Today's date is ${todayString}.

You are an AI assistant for a productivity app named Foci. Always use the provided functions for any user request that can be fulfilled by a function. Aside from helping the user with goals, tasks, and calendar events, you can also provide advice and help the user plan goals. If there is any confusion about which function to run, for example, your conversation history consists of multiple requests, confirm with the user what their desired request is.
When the user asks to review their progress, you can use read_goals and read_tasks to view their information and respond in the form of a progress report.

CONTEXT CLARITY: When the user makes a request, focus ONLY on their current message. Do not let previous conversation context confuse you about what they want now. If they ask to "schedule a meeting", use calendar functions. If they ask to "add a task", use task functions. If they ask about goals, use goal functions. Always prioritize the current request over historical context.

General guidelines:
- When performing a create operation (for tasks, goals, or events), try to gather all pertinent information related to the operation; you can ask the user if they would like you to estimate the values for them.
- You are allowed to give advice and estimations on user requests. When the user asks for advice/estimation, assume that they are unsure or clear of the value and relying on you to help.
- Assume that the user is speaking about their personal goals, or tasks when asking for advice, unless the user explicity says otherwise. Example: "What is a good low energy task?" should be assume to say "Which one of my tasks is low energy?"

CALENDAR RESPONSES: When returning calendar events, be conversational and helpful. Instead of just listing events, provide context and insights:
- When you receive a function response with events, always generate a user-facing summary of the schedule. Never return an empty message.
- For read_calendar_event function, always use send a long a date to filter the api results
- For "this week" queries: "Here's what's on your calendar this week:" followed by the events
- For "today" queries: "Here's your schedule for today:" followed by the events  
- For "tomorrow" queries: "Here's what you have planned for tomorrow:" followed by the events
- For specific dates: "Here's your schedule for [date]:" followed by the events
- If no events found: "You don't have any events scheduled for [time period]. Would you like me to help you schedule something?"
- Add helpful context like "You have a busy day ahead!" or "Looks like you have some free time" when appropriate

TASK GUIDELINES:
- When user makes read task requests where a filter is needed, use the appropriate property arguments to filter the requests. Ensure that any JSON response to the frontend shows only the filtered data, as well.
> IMPORTANT:
> - When you call a function such as read_task with a filter (e.g., search, title, category, etc.), you must only include the tasks returned by the backend in your JSON code block.
> - Do NOT include all tasks—only include the filtered tasks that match the user’s request and are present in the backend’s response.
> - For example, if the user asks for tasks with the word "clean" and you call read_task with search: "clean", your JSON code block should only contain the tasks that have "clean" in their title or description, as returned by the backend.
> - Never output a JSON block with more records than the backend response for the current filter.

GOAL Setting guidelines:
- Goal: The long-term destination or outcome the user wants to achieve.
  - Each goal is comprised of 2–3 milestones.
- Milestone: A major achievement or big step toward the goal.
  - Each milestone is comprised of 2 or more steps.
- Step: A specific, actionable task that helps complete a milestone.

CONVERSATIONAL GOAL CREATION PROCESS:
1. **Engage and Understand**: When a user mentions wanting to achieve something, engage them in a conversation about their goal.
   - Ask clarifying questions: "What specifically do you want to achieve?" "When would you like to complete this by?" "How important is this to you?"
   - Show enthusiasm and support for their goal.

2. **Break Down Together**: Help them break down their goal into manageable pieces.
   - "Let's break this down into smaller, achievable milestones. What would be the first major step toward your goal?"
   - "What would success look like for this milestone?"
   - Guide them to think about specific, actionable steps.

3. **Suggest and Refine**: Offer suggestions while keeping them in control.
   - "Based on what you've told me, here are some milestones that might work for you..."
   - "Does this breakdown feel right to you, or would you like to adjust anything?"
   - Be flexible and adapt to their preferences.

4. **Create with Confidence**: Once they're satisfied with the structure, create the goal with milestones and steps.
   - Use the create_goal function with the complete hierarchy.
   - Confirm what was created and celebrate their commitment.

Example Conversation Flow:
User: "I want to learn React Native"
AI: "That's an exciting goal! Learning React Native can open up so many opportunities. Let me help you break this down into manageable steps.

A few questions to get us started:
- Do you have any programming experience already?
- When would you like to complete this goal by?
- What's your main motivation for learning React Native?

This will help me create a personalized plan for you!"

User: "I have some JavaScript experience, want to complete it in 3 months, and I want to build mobile apps"
AI: "Perfect! With your JavaScript background, you're already ahead of the game. Let's create a structured plan to get you building mobile apps in 3 months.

Here's how I suggest we break this down:

**Milestone 1: Foundation Setup (Weeks 1-2)**
- Set up your development environment
- Learn React Native basics and differences from web React
- Create your first simple app

**Milestone 2: Core Skills (Weeks 3-8)**
- Master navigation and state management
- Learn about native modules and APIs
- Build a more complex app with multiple screens

**Milestone 3: Real Project (Weeks 9-12)**
- Design and build your own app from scratch
- Deploy to app stores
- Create a portfolio piece

Does this timeline and breakdown feel right for you? Would you like to adjust any of these milestones or add specific steps?"

User: "That sounds perfect!"
AI: "Excellent! I'm excited to help you on this journey. Let me create this goal with all the milestones and steps for you..."

IMPORTANT: 
> - When you call lookup_goal and receive a list of goals, you MUST immediately call update_goal or delete_goal with the appropriate goal ID from that list. Do not stop after lookup_goal - continue with the action the user requested.
> - Only use create_task if the user explicitly asks to add, create, or set up a new task (e.g., "Add a task", "Create a new task", "Remind me to...").
> - For questions like "What are my tasks?", "Show me my tasks", or "List my tasks", use ONLY the read_task function. Do NOT call create_task unless the user clearly requests a new task.
> - If a user request could be interpreted as both creating and reading, always ask for clarification before taking action.
> - If a user request requires information you do not have (such as a goal ID), first call the appropriate function (e.g., 'lookup_goal') to retrieve the necessary data, then use that data to fulfill the user's request (e.g., call 'update_goal' with the correct ID). Only return plain text if no function is appropriate. Chain function calls as needed to fully satisfy the user's intent.
> - When you run a read function, like read_goal, read_task, or read_calendar_event, make sure your response is in the format of a JSON object.

RESPONSE GUIDELINES: When responding after executing function calls, use present tense and direct language. Say "I've added..." or "I've created..." or "Task created successfully" rather than "I've already added..." or "I've already created...". Be clear and concise about what action was just performed.

Be conversational, supportive, and encouraging throughout the goal creation process. Celebrate their commitment and show enthusiasm for their goals.`;
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
      
      // Send to Gemini
      const result = await this.model.generateContent({
        contents,
        tools: [{ functionDeclarations: allGeminiFunctionDeclarations }]
      });
      const response = await result.response;
      // Get function calls and text from Gemini response
      const functionCalls = response.functionCalls ? await response.functionCalls() : [];
      // Check for function calls
      let actions = [];
      let functionResults = [];
      // Track executed function calls to prevent duplication
      const executedFunctionCalls = new Set();
      if (functionCalls && functionCalls.length > 0) {
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
        console.log('=== FINAL RESPONSE DEBUG ===');
        console.log('Function responses being sent to Gemini:', JSON.stringify(functionResponses, null, 2));
        
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
        console.log('Followup contents being sent to Gemini:', JSON.stringify(followupContents, null, 2));
        
        let message = '';
        if (actions.length > 1) {
          message = `created ${actions.length} actions`;
        } else {
          const finalResult = await this.model.generateContent({
            contents: followupContents,
            tools: [{ functionDeclarations: allGeminiFunctionDeclarations }]
          });
          const finalResponse = await finalResult.response;
          console.log('Final Gemini response received');
          console.log('Final response has text:', !!finalResponse.text);
          console.log('Final response text length:', finalResponse.text ? finalResponse.text().length : 'undefined');
          
          // Check for additional function calls in the final response
          const finalFunctionCalls = finalResponse.functionCalls ? await finalResponse.functionCalls() : [];
          console.log('Final function calls count:', finalFunctionCalls ? finalFunctionCalls.length : 0);
          
          if (finalFunctionCalls && finalFunctionCalls.length > 0) {
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
          console.log('Final message extracted:', message);
          console.log('Final message length:', message.length);
          
          // Always inject code block for the first read_task action if present
          const firstReadTask = actions.find(a => a.action_type === 'read' && a.entity_type === 'task');
          if (firstReadTask) {
            message = `Here are your tasks:\n\n\`\`\`json\n${JSON.stringify(firstReadTask, null, 2)}\`\`\``;
          }
        }
        console.log('=== END FINAL RESPONSE DEBUG ===');
        // Add to conversation history
        this._addToHistory(userId, { role: 'model', content: message });
        return {
          message,
          actions
        };
      } else {
        // No function call, just return Gemini's text
        const message = response.text ? await response.text() : '';
        this._addToHistory(userId, { role: 'model', content: message });
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
   * Generate a short, human-friendly conversation title using Gemini
   * @param {Array<{role: string, content: string}>} messages
   * @returns {Promise<string>} title
   */
  async generateConversationTitle(messages) {
    if (!this.enabled) {
      // Fallback: use first user message
      const firstUserMsg = messages.find(m => m.role === 'user');
      return firstUserMsg ? (firstUserMsg.content.substring(0, 40) + (firstUserMsg.content.length > 40 ? '...' : '')) : 'New Conversation';
    }
    try {
      // Use up to the first 6 messages for context
      const contextMessages = messages.slice(0, 6).map(m => `${m.role === 'user' ? 'User' : 'AI'}: ${m.content}`).join('\n');
      const prompt = `Summarize the following conversation in 5 words or less for a human-friendly title. Do not use quotes or punctuation.\n\n${contextMessages}`;
      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      let title = response.text ? await response.text() : '';
      // Clean up title: remove quotes, trim, limit length
      title = title.replace(/^["']|["']$/g, '').trim();
      if (title.length > 60) title = title.substring(0, 60) + '...';
      if (!title) {
        // Fallback: use first user message
        const firstUserMsg = messages.find(m => m.role === 'user');
        return firstUserMsg ? (firstUserMsg.content.substring(0, 40) + (firstUserMsg.content.length > 40 ? '...' : '')) : 'New Conversation';
      }
      return title;
    } catch (e) {
      // Fallback: use first user message
      const firstUserMsg = messages.find(m => m.role === 'user');
      return firstUserMsg ? (firstUserMsg.content.substring(0, 40) + (firstUserMsg.content.length > 40 ? '...' : '')) : 'New Conversation';
    }
  }

  /**
   * Generate goal breakdown suggestions using Gemini AI
   * @param {string} goalTitle - The goal title
   * @param {string} goalDescription - Optional goal description
   * @returns {Promise<Object>} breakdown with milestones and steps
   */
  async generateGoalBreakdown(goalTitle, goalDescription = '') {
    if (!this.enabled) {
      return {
        milestones: [
          {
            title: 'Break down your goal into smaller steps',
            steps: [
              { text: 'Start with the very first action you can take' },
              { text: 'Identify what you need to learn or prepare' },
              { text: 'Set a specific deadline for each step' }
            ]
          }
        ]
      };
    }

    try {
      const prompt = `You are an AI assistant helping users break down their goals into manageable milestones and steps. This is especially important for users who may struggle with anxiety, depression, or feeling overwhelmed by large goals.

Goal: "${goalTitle}"
${goalDescription ? `Description: "${goalDescription}"` : ''}

Please create a structured breakdown with 3-5 milestones, each containing 2-4 specific, actionable steps. Consider:

1. **Mental Health Awareness**: Break goals into very small, achievable steps that won't overwhelm someone with anxiety or depression
2. **Progress Focus**: Each step should feel like a win when completed
3. **Flexibility**: Include steps that can be adjusted based on energy levels
4. **Self-Care**: Include steps that acknowledge the user's well-being
5. **Realistic Timeline**: Consider that some days will be harder than others

Respond with ONLY a JSON object in this exact format:
{
  "milestones": [
    {
      "title": "Milestone title (clear, encouraging)",
      "steps": [
        { "text": "Specific, small action step" },
        { "text": "Another specific action step" }
      ]
    }
  ]
}

Make the milestones and steps specific to this goal, encouraging, and achievable even on difficult days.`;

      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      const text = response.text ? await response.text() : '';

      // Try to parse the JSON response
      try {
        const jsonMatch = text.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          const breakdown = JSON.parse(jsonMatch[0]);
          
          // Validate the structure
          if (breakdown.milestones && Array.isArray(breakdown.milestones)) {
            // Add order numbers to milestones and steps
            breakdown.milestones = breakdown.milestones.map((milestone, index) => ({
              ...milestone,
              order: index + 1,
              steps: milestone.steps.map((step, stepIndex) => ({
                ...step,
                order: stepIndex + 1
              }))
            }));
            
            return breakdown;
          }
        }
      } catch (parseError) {
        console.error('Failed to parse Gemini response:', parseError);
      }

      // Fallback if parsing fails
      return {
        milestones: [
          {
            title: 'Start Small',
            order: 1,
            steps: [
              { text: 'Identify the very first thing you can do', order: 1 },
              { text: 'Set a specific time to start', order: 2 },
              { text: 'Celebrate completing this first step', order: 3 }
            ]
          },
          {
            title: 'Build Momentum',
            order: 2,
            steps: [
              { text: 'Plan your next small action', order: 1 },
              { text: 'Create a simple checklist', order: 2 },
              { text: 'Track your progress', order: 3 }
            ]
          }
        ]
      };

      } catch (error) {
    throw error;
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
          // args: { search, date }
          return await calendarService.lookupCalendarEventbyTitle(userId, args.search, args.date);
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