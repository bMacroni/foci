import { vi, describe, it, expect, beforeAll, beforeEach, afterEach } from 'vitest';

describe('GeminiService', () => {
  let GeminiService;
  let geminiService;
  let originalApiKey;

  beforeAll(() => {
    // Store original API key
    originalApiKey = process.env.GOOGLE_AI_API_KEY;
    // Set a fake API key for testing
    process.env.GOOGLE_AI_API_KEY = 'fake-key';
  });

  beforeEach(async () => {
    ({ GeminiService } = await import('../src/utils/geminiService.js'));
    geminiService = new GeminiService();
    
    // Mock the Gemini model with different response scenarios
    geminiService.model = {
      generateContent: vi.fn(async (prompt) => {
        // Extract the user message from the prompt
        const userMsgMatch = prompt.match(/User Message: "([\s\S]*?)"/);
        const userMsg = userMsgMatch ? userMsgMatch[1].toLowerCase() : '';
        
        // Test goal creation
        if (userMsg.includes('add a goal') || userMsg.includes('create a goal')) {
          return { 
            response: { 
              text: () => `{
                "action_type": "create",
                "entity_type": "goal",
                "details": {
                  "title": "Learn React",
                  "description": "Master React development fundamentals",
                  "due_date": "2024-12-31",
                  "priority": "high"
                }
              }`
            } 
          };
        }
        
        // Test goal reading
        if (userMsg.includes('what are my goals') || userMsg.includes('show me my goals')) {
          return { 
            response: { 
              text: () => `{
                "action_type": "read",
                "entity_type": "goal",
                "details": {}
              }`
            } 
          };
        }
        
        // Test task creation
        if (userMsg.includes('add a task') || userMsg.includes('create a task')) {
          return { 
            response: { 
              text: () => `{
                "action_type": "create",
                "entity_type": "task",
                "details": {
                  "title": "Review documentation",
                  "description": "Read through project documentation",
                  "due_date": "2024-07-15",
                  "priority": "medium"
                }
              }`
            } 
          };
        }
        
        // Test task reading
        if (userMsg.includes('show me a list of my tasks') || userMsg.includes('what are my tasks')) {
          return { 
            response: { 
              text: () => `{
                "action_type": "read",
                "entity_type": "task",
                "details": {}
              }`
            } 
          };
        }
        
        // Test calendar event creation
        if (userMsg.includes('schedule') || userMsg.includes('meeting')) {
          return { 
            response: { 
              text: () => `{
                "action_type": "create",
                "entity_type": "calendar_event",
                "details": {
                  "title": "Team Meeting",
                  "description": "Weekly team sync",
                  "due_date": "2024-07-10",
                  "priority": "medium"
                }
              }`
            } 
          };
        }
        
        // Test clarifying questions (no JSON response)
        if (userMsg.includes('help me organize')) {
          return { 
            response: { 
              text: () => "I'd be happy to help you organize! What specific area would you like to focus on - your goals, tasks, or schedule?"
            } 
          };
        }
        
        // Test general conversation
        if (userMsg.includes('hello') || userMsg.includes('how are you')) {
          return { 
            response: { 
              text: () => "Hello! I'm here to help you manage your productivity. How can I assist you today?"
            } 
          };
        }
        
        // Test invalid JSON response
        if (userMsg.includes('invalid json')) {
          return { 
            response: { 
              text: () => "This is not valid JSON: { invalid json }"
            } 
          };
        }
        
        // Test malformed JSON response
        if (userMsg.includes('malformed json')) {
          return { 
            response: { 
              text: () => `{
                "action_type": "create",
                "entity_type": "goal",
                "details": {
                  "title": "Test Goal"
                }
              }`
            } 
          };
        }
        
        // Default response
        return { 
          response: { 
            text: () => "I understand you want to manage your productivity. How can I help you today?" 
          } 
        };
      })
    };
  });

  afterEach(() => {
    vi.clearAllMocks();
    geminiService.clearHistory('test-user');
  });

  afterAll(() => {
    // Restore original API key
    if (originalApiKey) {
      process.env.GOOGLE_AI_API_KEY = originalApiKey;
    } else {
      delete process.env.GOOGLE_AI_API_KEY;
    }
  });

  describe('Initialization', () => {
    it('should initialize with API key', () => {
      expect(geminiService.enabled).toBe(true);
      expect(geminiService.model).toBeDefined();
    });

    it('should handle missing API key', () => {
      // Temporarily remove API key
      const tempKey = process.env.GOOGLE_AI_API_KEY;
      delete process.env.GOOGLE_AI_API_KEY;
      
      const serviceWithoutKey = new GeminiService();
      expect(serviceWithoutKey.enabled).toBe(false);
      
      // Restore API key
      if (tempKey) {
        process.env.GOOGLE_AI_API_KEY = tempKey;
      }
    });
  });

  describe('Goal Management', () => {
    it('should process a goal creation request', async () => {
      const result = await geminiService.processMessage('add a goal to learn React', 'test-user');
      
      expect(result.message).toBeDefined();
      expect(result.actions).toBeDefined();
      expect(result.actions.length).toBe(1);
      expect(result.actions[0].action_type).toBe('create');
      expect(result.actions[0].entity_type).toBe('goal');
      expect(result.actions[0].details.title).toBe('Learn React');
      expect(result.actions[0].details.description).toBe('Master React development fundamentals');
      expect(result.actions[0].details.priority).toBe('high');
    });

    it('should handle goal creation with different phrasing', async () => {
      const result = await geminiService.processMessage('create a goal to learn React', 'test-user');
      
      expect(result.actions).toBeDefined();
      expect(result.actions.length).toBe(1);
      expect(result.actions[0].entity_type).toBe('goal');
    });

    it('should process a goal reading request', async () => {
      const result = await geminiService.processMessage('What are my goals?', 'test-user');
      
      expect(result.message).toBeDefined();
      expect(result.actions).toBeDefined();
      expect(result.actions.length).toBe(1);
      expect(result.actions[0].action_type).toBe('read');
      expect(result.actions[0].entity_type).toBe('goal');
      expect(result.actions[0].details).toBeDefined();
    });

    it('should handle goal reading with different phrasing', async () => {
      const result = await geminiService.processMessage('show me my goals', 'test-user');
      
      expect(result.actions).toBeDefined();
      expect(result.actions.length).toBe(1);
      expect(result.actions[0].action_type).toBe('read');
      expect(result.actions[0].entity_type).toBe('goal');
    });

    it('should process multiple actions in a single response', async () => {
      // Mock Gemini to return multiple JSON objects in one response
      geminiService.model.generateContent = vi.fn(async () => ({
        response: {
          text: () => `{
            "action_type": "create",
            "entity_type": "goal",
            "details": {
              "title": "Complete Couch to 5k program",
              "description": "Complete a Couch to 5k program to build a foundation for running longer distances.",
              "priority": "high",
              "related_goal": "Run a marathon"
            }
          }
          {
            "action_type": "create",
            "entity_type": "task",
            "details": {
              "title": "Download a Couch to 5k app or find a program online",
              "description": "Research and choose a Couch to 5k program that fits your schedule and preferences.",
              "due_date": "2024-07-17",
              "priority": "high",
              "related_goal": "Complete Couch to 5k program"
            }
          }
          {
            "action_type": "create",
            "entity_type": "task",
            "details": {
              "title": "Schedule first Couch to 5k run",
              "description": "Look at your calendar and schedule your first Couch to 5k run. Evenings or early mornings often work well.",
              "due_date": "2024-07-19",
              "priority": "high",
              "related_goal": "Complete Couch to 5k program"
            }
          }`
        }
      }));
      const result = await geminiService.processMessage('I want to run a marathon, where do I begin?', 'test-user');
      expect(result.message).toContain('created 3 actions');
      expect(result.actions).toBeDefined();
      expect(result.actions.length).toBe(3);
      expect(result.actions[0].entity_type).toBe('goal');
      expect(result.actions[1].entity_type).toBe('task');
      expect(result.actions[2].entity_type).toBe('task');
    });
  });

  describe('Task Management', () => {
    it('should process a task creation request', async () => {
      const result = await geminiService.processMessage('add a task to review documentation', 'test-user');
      
      expect(result.message).toBeDefined();
      expect(result.actions).toBeDefined();
      expect(result.actions.length).toBe(1);
      expect(result.actions[0].action_type).toBe('create');
      expect(result.actions[0].entity_type).toBe('task');
      expect(result.actions[0].details.title).toBe('Review documentation');
      expect(result.actions[0].details.priority).toBe('medium');
    });

    it('should handle task creation with different phrasing', async () => {
      const result = await geminiService.processMessage('create a task to review documentation', 'test-user');
      
      expect(result.actions).toBeDefined();
      expect(result.actions.length).toBe(1);
      expect(result.actions[0].entity_type).toBe('task');
    });
  });

  describe('Calendar Management', () => {
    it('should process a calendar event creation request', async () => {
      const result = await geminiService.processMessage('schedule a team meeting', 'test-user');
      
      expect(result.message).toBeDefined();
      expect(result.actions).toBeDefined();
      expect(result.actions.length).toBe(1);
      expect(result.actions[0].action_type).toBe('create');
      expect(result.actions[0].entity_type).toBe('calendar_event');
      expect(result.actions[0].details.title).toBe('Team Meeting');
    });
  });

  describe('Conversation Handling', () => {
    it('should handle general conversation without actions', async () => {
      const result = await geminiService.processMessage('Hello, how are you?', 'test-user');
      
      expect(result.message).toBeDefined();
      expect(result.actions).toBeDefined();
      expect(result.actions.length).toBe(0);
    });

    it('should handle clarifying questions', async () => {
      const result = await geminiService.processMessage('help me organize', 'test-user');
      
      expect(result.message).toBeDefined();
      expect(result.actions).toBeDefined();
      expect(result.actions.length).toBe(0);
      expect(result.message).toContain('help you organize');
    });
  });

  describe('Conversation History', () => {
    it('should maintain conversation history per user', async () => {
      await geminiService.processMessage('Hello', 'test-user');
      await geminiService.processMessage('add a goal to learn React', 'test-user');
      
      const history = geminiService.getHistory('test-user');
      expect(history.length).toBe(4); // 2 user messages + 2 AI responses
    });

    it('should clear conversation history', async () => {
      await geminiService.processMessage('Hello', 'test-user');
      geminiService.clearHistory('test-user');
      
      const history = geminiService.getHistory('test-user');
      expect(history.length).toBe(0);
    });

    it('should maintain separate history for different users', async () => {
      await geminiService.processMessage('Hello', 'user1');
      await geminiService.processMessage('Hello, user2!', 'user2'); // Make the message unique
      
      const history1 = geminiService.getHistory('user1');
      const history2 = geminiService.getHistory('user2');
      
      expect(history1.length).toBe(2);
      expect(history2.length).toBe(2);
      expect(history1).not.toEqual(history2);
    });
  });

  describe('JSON Response Validation', () => {
    it('should validate correct JSON structure', () => {
      const validJson = {
        action_type: 'create',
        entity_type: 'goal',
        details: {
          title: 'Test Goal',
          description: 'Test Description'
        }
      };
      
      expect(geminiService._validateJsonStructure(validJson)).toBe(true);
    });

    it('should reject invalid action_type', () => {
      const invalidJson = {
        action_type: 'invalid',
        entity_type: 'goal',
        details: { title: 'Test' }
      };
      
      expect(geminiService._validateJsonStructure(invalidJson)).toBe(false);
    });

    it('should reject invalid entity_type', () => {
      const invalidJson = {
        action_type: 'create',
        entity_type: 'invalid',
        details: { title: 'Test' }
      };
      
      expect(geminiService._validateJsonStructure(invalidJson)).toBe(false);
    });

    it('should reject missing required fields', () => {
      const invalidJson = {
        action_type: 'create',
        entity_type: 'goal'
        // missing details
      };
      
      expect(geminiService._validateJsonStructure(invalidJson)).toBe(false);
    });

    it('should reject missing title in details', () => {
      const invalidJson = {
        action_type: 'create',
        entity_type: 'goal',
        details: {
          description: 'Test Description'
          // missing title
        }
      };
      
      expect(geminiService._validateJsonStructure(invalidJson)).toBe(false);
    });
  });

  describe('Error Handling', () => {
    it('should handle invalid JSON response gracefully', async () => {
      const result = await geminiService.processMessage('invalid json', 'test-user');
      
      expect(result.message).toBeDefined();
      expect(result.actions).toBeDefined();
      expect(result.actions.length).toBe(0);
    });

    it('should handle malformed JSON response gracefully', async () => {
      // Use a malformed JSON that is valid JSON but fails structure validation
      geminiService.model.generateContent = vi.fn(async () => ({
        response: {
          text: () => `{"action_type": "create", "entity_type": "goal", "details": {}}` // missing title in details
        }
      }));
      const result = await geminiService.processMessage('malformed json', 'test-user');
      
      expect(result.message).toBeDefined();
      expect(result.actions).toBeDefined();
      expect(result.actions.length).toBe(0);
    });

    it('should handle API errors gracefully', async () => {
      // Mock API error
      geminiService.model.generateContent = vi.fn().mockRejectedValue(new Error('API Error'));
      
      const result = await geminiService.processMessage('test message', 'test-user');
      
      expect(result.message).toContain('encountered an error');
      expect(result.actions).toBeDefined();
      expect(result.actions.length).toBe(0);
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty message', async () => {
      const result = await geminiService.processMessage('', 'test-user');
      
      expect(result.message).toBeDefined();
      expect(result.actions).toBeDefined();
    });

    it('should handle very long messages', async () => {
      const longMessage = 'a'.repeat(1000);
      const result = await geminiService.processMessage(longMessage, 'test-user');
      
      expect(result.message).toBeDefined();
      expect(result.actions).toBeDefined();
    });

    it('should handle special characters in messages', async () => {
      const specialMessage = 'Add a goal: Learn React & TypeScript! 🚀';
      const result = await geminiService.processMessage(specialMessage, 'test-user');
      
      expect(result.message).toBeDefined();
      expect(result.actions).toBeDefined();
    });
  });

  describe('Integration Scenarios', () => {
    it('should handle a complete conversation flow', async () => {
      // Start conversation
      const result1 = await geminiService.processMessage('Hello', 'test-user');
      expect(result1.message).toBeDefined();
      
      // Ask for help
      const result2 = await geminiService.processMessage('help me organize', 'test-user');
      expect(result2.message).toBeDefined();
      expect(result2.actions.length).toBe(0);
      
      // Create a goal
      const result3 = await geminiService.processMessage('add a goal to learn React', 'test-user');
      expect(result3.actions.length).toBe(1);
      expect(result3.actions[0].entity_type).toBe('goal');
      
      // Create a task
      // The mock for 'add a task to review docs' will return a default response (no actions)
      geminiService.model.generateContent = vi.fn(async () => ({
        response: {
          text: () => `{"action_type": "create", "entity_type": "task", "details": {"title": "Review docs", "description": "Review documentation", "due_date": "2024-07-20", "priority": "medium"}}`
        }
      }));
      const result4 = await geminiService.processMessage('add a task to review docs', 'test-user');
      expect(result4.actions.length).toBe(1);
      expect(result4.actions[0].entity_type).toBe('task');
      
      // Verify conversation history
      const history = geminiService.getHistory('test-user');
      expect(history.length).toBe(8); // 4 user messages + 4 AI responses
    });
  });

  describe('Frontend Integration Issues', () => {
    it('should handle calendar event creation without calendarAPI import error', async () => {
      // Override the mock for this specific test
      geminiService.model.generateContent = vi.fn(async (prompt) => {
        return { 
          response: { 
            text: () => `{
              "action_type": "create",
              "entity_type": "calendar_event",
              "details": {
                "title": "Team Meeting",
                "description": "Weekly team sync",
                "start_time": "2024-01-15T10:00:00Z",
                "end_time": "2024-01-15T11:00:00Z"
              }
            }`
          } 
        };
      });

      const result = await geminiService.processMessage('Schedule a team meeting for tomorrow at 10 AM', 'test-user');
      
      expect(result.message).toBeDefined();
      expect(result.actions).toBeDefined();
      expect(result.actions.length).toBe(1);
      expect(result.actions[0].action_type).toBe('create');
      expect(result.actions[0].entity_type).toBe('calendar_event');
    });

    it('should handle bulk approval with correct items structure', async () => {
      // Override the mock for this specific test
      geminiService.model.generateContent = vi.fn(async (prompt) => {
        return { 
          response: { 
            text: () => `[
              {
                "action_type": "create",
                "entity_type": "task",
                "details": {
                  "title": "Task 1",
                  "description": "First task"
                }
              },
              {
                "action_type": "create",
                "entity_type": "task",
                "details": {
                  "title": "Task 2",
                  "description": "Second task"
                }
              }
            ]`
          } 
        };
      });

      const result = await geminiService.processMessage('Create multiple tasks for my project', 'test-user');
      
      expect(result.message).toBeDefined();
      expect(result.actions).toBeDefined();
      
      // Verify that multiple actions are returned for bulk processing
      expect(result.actions.length).toBeGreaterThanOrEqual(1);
      expect(result.actions[0].action_type).toBe('create');
      expect(result.actions[0].entity_type).toBe('task');
    });
  });

  describe('Due Date Normalization', () => {
    it('should normalize due_date to this year if Gemini returns a past year', async () => {
      geminiService.model.generateContent.mockResolvedValueOnce({
        response: {
          text: () => `{
            "action_type": "read",
            "entity_type": "calendar_event",
            "details": { "due_date": "2022-07-27", "title": "Test Event" }
          }`
        }
      });
      const result = await geminiService.processMessage('show me my schedule for July 27, 2022', 'test-user');
      expect(result.actions[0].details.due_date.startsWith(String(new Date().getFullYear()))).toBe(true);
    });
    it('should normalize due_date for natural language like "tomorrow"', async () => {
      geminiService.model.generateContent.mockResolvedValueOnce({
        response: {
          text: () => `{
            "action_type": "read",
            "entity_type": "calendar_event",
            "details": { "due_date": "tomorrow", "title": "Test Event" }
          }`
        }
      });
      const result = await geminiService.processMessage('show me my schedule for tomorrow', 'test-user');
      // Should be tomorrow's date
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      const yyyy = tomorrow.getFullYear();
      const mm = String(tomorrow.getMonth() + 1).padStart(2, '0');
      const dd = String(tomorrow.getDate()).padStart(2, '0');
      const expected = `${yyyy}-${mm}-${dd}`;
      expect(result.actions[0].details.due_date).toBe(expected);
    });
  });
}); 