import { GoogleGenerativeAI } from '@google/generative-ai';
import dotenv from 'dotenv';

dotenv.config();



// Test-specific GeminiService class
class TestGeminiService {
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

**YOUR CAPABILITIES:**
- **Goals Management**: Create, update, delete, and complete goals with titles, descriptions, target dates, and status
- **Tasks Management**: Create, update, delete, and complete tasks with titles, descriptions, due dates, priority, and status  
- **Calendar Management**: Schedule, update, and delete calendar events and meetings
- **Productivity Advice**: Provide time management techniques, goal setting help, and motivation
- **System Analysis**: Answer questions about the user's productivity system and suggest improvements
- **Natural Language Understanding**: Interpret any user request and take appropriate action

**HOW TO HANDLE REQUESTS:**
1. **Understand Intent**: Determine what the user wants to do (create, read, update, delete, or get advice)
2. **Extract Information**: Pull out relevant details like titles, dates, descriptions, priorities
3. **Take Action**: Use the appropriate API calls to perform the requested operation
4. **Provide Feedback**: Give clear, helpful responses about what was done

**COMMON REQUEST PATTERNS:**
- **Goals**: "I want to learn React", "Create a goal to exercise daily", "Show my goals", "Update my goal", "Delete my goal"
- **Tasks**: "I need to review documents", "Add a task to call the dentist", "List my tasks", "Mark task as complete"
- **Calendar**: "Schedule a meeting tomorrow at 2pm", "Book an appointment", "Show my events", "Reschedule my meeting"
- **General**: "Help me get organized", "Give me productivity tips", "What should I focus on today?"

**RESPONSE FORMAT:**
- Use bullet points (•) for lists
- Use numbered lists (1., 2., 3.) for steps  
- Use **bold text** for emphasis
- Use headers ending with : for sections
- Add line breaks between different sections
- Keep paragraphs short and scannable

**IMPORTANT:**
- Always be friendly, helpful, and actionable
- If you're unsure about something, ask for clarification
- Provide specific, actionable responses
- Suggest next steps when appropriate
- Celebrate user progress and achievements

Current context: The user is interacting with their Foci productivity system through the AI-first interface.`;
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

  





  async getGeminiResponse(message, userId) {
    try {
      const chat = this.model.startChat({
        history: this.conversationHistory.get(userId) || [],
        generationConfig: {
          maxOutputTokens: 1000,
          temperature: 0.7,
        },
      });

      const result = await chat.sendMessage(message);
      const response = await result.response;
      const text = response.text();

      // Update conversation history
      if (!this.conversationHistory.has(userId)) {
        this.conversationHistory.set(userId, []);
      }
      this.conversationHistory.get(userId).push(
        { role: "user", parts: [{ text: message }] },
        { role: "model", parts: [{ text }] }
      );

      return {
        message: text,
        actions: ['ai_response']
      };
    } catch (error) {
      console.error('Gemini API Error:', error);
      return {
        message: "I'm sorry, I'm having trouble connecting to my AI service right now. Please try again later or use direct commands like 'add goal' or 'show tasks'.",
        actions: []
      };
    }
  }
}

// Test cases for AI functionality
const testCases = [
  // Goal creation tests
  "Add a goal to learn React",
  "Create a goal to exercise daily",
  "I want to set a goal to save money",
  
  // Task creation tests
  "Add a task to review documents",
  "Create a task to call the dentist",
  "I need to schedule a task for tomorrow",
  
  // Calendar tests
  "Schedule a meeting tomorrow at 2pm",
  "Add an event for the dentist appointment",
  "Book a session with the client",
  
  // Read operations
  "Show my goals",
  "List my tasks",
  "What events do I have?",
  
  // Update operations
  "Update my goal to exercise daily",
  "Change my task to review documents",
  "Reschedule my meeting",
  
  // Delete operations
  "Delete my goal to learn React",
  "Remove the task about reviewing documents",
  "Cancel my meeting tomorrow",
  
  // Complete operations
  "Complete my goal to learn React",
  "Mark my task as done",
  "Finish the goal to exercise daily",
  
  // Help and general
  "Help",
  "What can you do?",
  "Get suggestions for my goals",
  
  // Edge cases
  "Add a high priority task to fix the bug",
  "Create a goal to learn React by next month",
  "Schedule a meeting with John tomorrow at 3pm for project review"
];

async function testAI() {
  console.log('🤖 Testing Foci AI Service...\n');
  
  const aiService = new TestGeminiService();
  
  if (!aiService.enabled) {
    console.log('❌ Gemini AI is not enabled. Please check your GOOGLE_AI_API_KEY environment variable.');
    return;
  }
  
  console.log('✅ Gemini AI is enabled\n');
  
  // Test each case
  for (let i = 0; i < testCases.length; i++) {
    const testCase = testCases[i];
    console.log(`\n--- Test ${i + 1}: "${testCase}" ---`);
    
    try {
      const startTime = Date.now();
      const response = await aiService.processMessage(testCase, 'test-user-id');
      const endTime = Date.now();
      
      console.log(`⏱️  Response time: ${endTime - startTime}ms`);
      console.log(`📝 Response: ${response.message}`);
      
      if (response.actions && response.actions.length > 0) {
        console.log(`✅ Actions: ${response.actions.join(', ')}`);
      }
      
    } catch (error) {
      console.log(`❌ Error: ${error.message}`);
    }
    
    // Add a small delay between tests
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
  
  console.log('\n🎉 AI testing completed!');
}

// Run the test
testAI().catch(console.error); 