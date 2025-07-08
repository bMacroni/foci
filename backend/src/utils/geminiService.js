import { GoogleGenerativeAI } from '@google/generative-ai';
import * as chrono from 'chrono-node';

export class GeminiService {
  constructor() {
    // Always initialize conversation history regardless of API key status
    this.conversationHistory = new Map();
    
    if (!process.env.GOOGLE_AI_API_KEY) {
      console.warn('GOOGLE_AI_API_KEY not found. Gemini AI features will be disabled.');
      this.enabled = false;
      return;
    }
    
    this.enabled = true;
    this.genAI = new GoogleGenerativeAI(process.env.GOOGLE_AI_API_KEY);
    this.model = this.genAI.getGenerativeModel({ model: "gemini-1.5-pro" });
    console.log('✅ Gemini AI initialized with model: gemini-1.5-pro');
    
    // System prompt that defines the AI's role and capabilities
    this.systemPrompt = `You are an AI service integrated within an app designed to help users manage their long-term goals, short-term tasks, and calendar events through a conversational chat interface. Your primary role is to clearly interpret the user's intent from their requests, collaborate with them through the conversation to define precise, actionable steps, and translate the outcome into structured JSON format for the app to process.

Workflow Instructions:

Intent Recognition:

Carefully analyze the user's input to determine their underlying goal or task.

Ask clarifying questions if necessary to understand exactly what the user wants.

Collaborative Action Definition:

Engage in conversation to refine the user's objective into clear, actionable items.

Suggest specific, achievable tasks or actions aligned with their stated objectives.

Ensure tasks or actions suggested are practical and relevant to the user's stated goal or request.

Structured JSON Response:

Once the user's action or task is clear and agreed upon, respond exclusively with structured JSON adhering to the following format:

{
  "action_type": "[create | read | update | delete]",
  "entity_type": "[goal | task | calendar_event]",
  "details": {
    "title": "Brief descriptive title of the action or task",
    "description": "Detailed explanation of the task or action",
    "due_date": "YYYY-MM-DD (if applicable)",
    "priority": "[high | medium | low] (if applicable)",
    "related_goal": "Associated long-term goal title (if applicable)"
  }
}

Include only fields relevant to the user's specific request.

Ensure clarity, conciseness, and accuracy in each JSON response, making it easy for the app to process and update accordingly.

Example User Request:
"What tasks can I work on this week to work toward my goal of running a marathon?"

Example JSON Response:

{
  "action_type": "create",
  "entity_type": "task",
  "details": {
    "title": "Complete a 5-mile run",
    "description": "Schedule and complete a 5-mile run to build endurance for marathon training.",
    "due_date": "2024-07-10",
    "priority": "medium",
    "related_goal": "Run a marathon"
  }
}

Always ensure the conversation leads clearly and logically to actionable outcomes that the app can easily manage through CRUD operations.`;
  }

  /**
   * Main entry point for processing a user message.
   * Handles conversation history and returns structured response.
   */
  async processMessage(message, userId) {
    try {
      if (!this.enabled) {
        return {
          message: "I'm currently in basic mode. To enable full AI features, please set up your Gemini API key in the environment variables.",
          actions: []
        };
      }

      // Update conversation history
      this._addToHistory(userId, { role: 'user', content: message });

      // Get conversation history for context
      const history = this.conversationHistory.get(userId) || [];
      const recentHistory = history.slice(-10); // Keep last 10 exchanges for context
      
      const historyText = recentHistory.length > 0 
        ? `\nRecent conversation:\n${recentHistory.map(h => `${h.role}: ${h.content}`).join('\n')}`
        : '';

      // Create the prompt with context
      const prompt = `${this.systemPrompt}

${historyText}

User Message: "${message}"

Please analyze the user's intent, collaborate with them to define clear actionable steps, and respond with either:
1. Clarifying questions if more information is needed
2. Structured JSON response if the action is clear and agreed upon

Response:`;

      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();

      // Check if the response contains JSON - now handle multiple JSON objects
      // Use a more precise regex that matches complete JSON objects
      const jsonMatches = [];
      let braceCount = 0;
      let startIndex = -1;
      
      for (let i = 0; i < text.length; i++) {
        if (text[i] === '{') {
          if (braceCount === 0) {
            startIndex = i;
          }
          braceCount++;
        } else if (text[i] === '}') {
          braceCount--;
          if (braceCount === 0 && startIndex !== -1) {
            const jsonString = text.substring(startIndex, i + 1);
            jsonMatches.push(jsonString);
            startIndex = -1;
          }
        }
      }
      
      if (jsonMatches.length > 0) {
        const validActions = [];
        
        for (const jsonMatch of jsonMatches) {
          try {
            const jsonResponse = JSON.parse(jsonMatch);
            
            // Validate JSON structure
            if (this._validateJsonStructure(jsonResponse)) {
              // Normalize any due_date in details
              this._normalizeDueDate(jsonResponse);
              validActions.push(jsonResponse);
            }
          } catch (parseError) {
            console.error('Error parsing JSON response:', parseError);
            // Continue with other JSON objects if one fails
          }
        }
        
        if (validActions.length > 0) {
          // Update conversation history with AI response
          this._addToHistory(userId, { role: 'assistant', content: text });
          
          return {
            message: `I've processed your request and created ${validActions.length} action${validActions.length > 1 ? 's' : ''}:`,
            actions: validActions
          };
        } else {
          // No valid JSON found, treat as regular response
          this._addToHistory(userId, { role: 'assistant', content: text });
          return {
            message: text,
            actions: []
          };
        }
      } else {
        // If no JSON found, but the response contains a code block, try to extract and parse it
        if (jsonMatches.length === 0 && text.includes('```json')) {
          console.log('🟡 Attempting to extract JSON from code block:', text);
          const codeBlockMatch = text.match(/```json\s*([\s\S]*?)\s*```/i);
          if (codeBlockMatch) {
            console.log('🟢 Code block matched:', codeBlockMatch[1]);
            try {
              const jsonResponse = JSON.parse(codeBlockMatch[1]);
              if (this._validateJsonStructure(jsonResponse)) {
                this._normalizeDueDate(jsonResponse);
                this._addToHistory(userId, { role: 'assistant', content: text });
                return {
                  message: text,
                  actions: [jsonResponse]
                };
              }
            } catch (parseError) {
              console.error('Error parsing JSON from code block:', parseError);
            }
          }
        }
        // No JSON found, treat as regular conversational response
        this._addToHistory(userId, { role: 'assistant', content: text });
        return {
          message: text,
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
   * Normalize due_date in Gemini JSON actions using chrono-node and current year logic
   */
  _normalizeDueDate(action) {
    if (!action.details || !action.details.due_date) return;
    let dueDateStr = action.details.due_date;
    let parsed = (chrono && chrono.parseDate) ? chrono.parseDate(dueDateStr, new Date(), { forwardDate: true }) : null;
    if (!parsed) {
      // fallback: try parsing as ISO
      parsed = new Date(dueDateStr);
    }
    if (parsed && !isNaN(parsed)) {
      const now = new Date();
      // If year is in the past, or not this year or next, set to this year
      if (parsed.getFullYear() < now.getFullYear() || parsed.getFullYear() > now.getFullYear() + 1) {
        parsed.setFullYear(now.getFullYear());
      }
      // If the date is in the past, move to next year
      if (parsed < now) {
        parsed.setFullYear(parsed.getFullYear() + 1);
      }
      // Format as YYYY-MM-DD
      const yyyy = parsed.getFullYear();
      const mm = String(parsed.getMonth() + 1).padStart(2, '0');
      const dd = String(parsed.getDate()).padStart(2, '0');
      action.details.due_date = `${yyyy}-${mm}-${dd}`;
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