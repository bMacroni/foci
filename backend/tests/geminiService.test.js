import { describe, it, expect, beforeEach, vi } from 'vitest';
import { GeminiService } from '../src/utils/geminiService.js';

// Mock the controllers
vi.mock('../src/controllers/tasksController.js', () => ({
  createTaskFromAI: vi.fn(),
  updateTaskFromAI: vi.fn(),
  deleteTaskFromAI: vi.fn(),
  readTaskFromAI: vi.fn(),
  lookupTaskbyTitle: vi.fn()
}));

vi.mock('../src/controllers/goalsController.js', () => ({
  createGoalFromAI: vi.fn(),
  updateGoalFromAI: vi.fn(),
  deleteGoalFromAI: vi.fn(),
  getGoalsForUser: vi.fn(),
  lookupGoalbyTitle: vi.fn()
}));

vi.mock('../src/utils/calendarService.js', () => ({
  createCalendarEventFromAI: vi.fn(),
  updateCalendarEventFromAI: vi.fn(),
  deleteCalendarEventFromAI: vi.fn(),
  readCalendarEventFromAI: vi.fn(),
  lookupCalendarEventbyTitle: vi.fn()
}));

describe('GeminiService - Duplication Issue', () => {
  let geminiService;
  let mockModel;

  beforeEach(() => {
    // Reset all mocks
    vi.clearAllMocks();
    
    // Create mock model
    mockModel = {
      generateContent: vi.fn()
    };
    
    geminiService = new GeminiService();
    geminiService.model = mockModel;
    geminiService.enabled = true;
  });

  it('should not execute the same function call twice', async () => {
    const userId = 'test-user-id';
    const userContext = { token: 'test-token' };
    const message = "Create a new task called 'Call mom' with high priority";

    // Mock the first response with function call
    const firstResponse = {
      functionCalls: vi.fn().mockResolvedValue([
        {
          name: 'create_task',
          args: { title: 'Call mom', priority: 'high' }
        }
      ]),
      text: vi.fn().mockResolvedValue('')
    };

    // Mock the final response with no additional function calls
    const finalResponse = {
      functionCalls: vi.fn().mockResolvedValue([]),
      text: vi.fn().mockResolvedValue('Task "Call mom" has been created successfully.')
    };

    // Mock the generateContent calls
    mockModel.generateContent
      .mockResolvedValueOnce({ response: firstResponse })
      .mockResolvedValueOnce({ response: finalResponse });

    // Mock the task creation to return a consistent result
    const { createTaskFromAI } = await import('../src/controllers/tasksController.js');
    createTaskFromAI.mockResolvedValue({
      id: 'test-task-id',
      title: 'Call mom',
      priority: 'high',
      status: 'not_started'
    });

    // Process the message
    const result = await geminiService.processMessage(message, userId, userContext);

    // Verify that createTaskFromAI was called exactly once
    expect(createTaskFromAI).toHaveBeenCalledTimes(1);
    expect(createTaskFromAI).toHaveBeenCalledWith(
      { title: 'Call mom', priority: 'high' },
      userId,
      userContext
    );

    // Verify the result contains only one action
    expect(result.actions).toHaveLength(1);
    expect(result.actions[0]).toEqual({
      action_type: 'create',
      entity_type: 'task',
      details: {
        id: 'test-task-id',
        title: 'Call mom',
        priority: 'high',
        status: 'not_started'
      }
    });

    // Verify the final message
    expect(result.message).toBe('Task "Call mom" has been created successfully.');
  });

  it('should not duplicate function calls when final response contains the same function call', async () => {
    const userId = 'test-user-id';
    const userContext = { token: 'test-token' };
    const message = "Create a new task called 'Call mom' with high priority";

    // Mock the first response with function call
    const firstResponse = {
      functionCalls: vi.fn().mockResolvedValue([
        {
          name: 'create_task',
          args: { title: 'Call mom', priority: 'high' }
        }
      ]),
      text: vi.fn().mockResolvedValue('')
    };

    // Mock the final response with the SAME function call (this is the bug scenario)
    const finalResponse = {
      functionCalls: vi.fn().mockResolvedValue([
        {
          name: 'create_task',
          args: { title: 'Call mom', priority: 'high' }
        }
      ]),
      text: vi.fn().mockResolvedValue('Task "Call mom" has been created successfully.')
    };

    // Mock the generateContent calls
    mockModel.generateContent
      .mockResolvedValueOnce({ response: firstResponse })
      .mockResolvedValueOnce({ response: finalResponse });

    // Mock the task creation to return different IDs to simulate the duplication
    const { createTaskFromAI } = await import('../src/controllers/tasksController.js');
    createTaskFromAI
      .mockResolvedValueOnce({
        id: 'first-task-id',
        title: 'Call mom',
        priority: 'high',
        status: 'not_started'
      })
      .mockResolvedValueOnce({
        id: 'second-task-id',
        title: 'Call mom',
        priority: 'high',
        status: 'not_started'
      });

    // Process the message
    const result = await geminiService.processMessage(message, userId, userContext);

    // This test should fail because the current code will execute the function twice
    // The fix should prevent this duplication
    expect(createTaskFromAI).toHaveBeenCalledTimes(1);
    expect(result.actions).toHaveLength(1);
  });

  it('should handle multiple different function calls correctly', async () => {
    const userId = 'test-user-id';
    const userContext = { token: 'test-token' };
    const message = "Create a task called 'Call mom' and a goal called 'Learn React'";

    // Mock the first response with multiple function calls
    const firstResponse = {
      functionCalls: vi.fn().mockResolvedValue([
        {
          name: 'create_task',
          args: { title: 'Call mom', priority: 'medium' }
        },
        {
          name: 'create_goal',
          args: { title: 'Learn React', description: 'Master React framework' }
        }
      ]),
      text: vi.fn().mockResolvedValue('')
    };

    // Mock the final response with no additional function calls
    const finalResponse = {
      functionCalls: vi.fn().mockResolvedValue([]),
      text: vi.fn().mockResolvedValue('Created task "Call mom" and goal "Learn React".')
    };

    // Mock the generateContent calls
    mockModel.generateContent
      .mockResolvedValueOnce({ response: firstResponse })
      .mockResolvedValueOnce({ response: finalResponse });

    // Mock the controllers
    const { createTaskFromAI } = await import('../src/controllers/tasksController.js');
    const { createGoalFromAI } = await import('../src/controllers/goalsController.js');
    
    createTaskFromAI.mockResolvedValue({
      id: 'task-id',
      title: 'Call mom',
      priority: 'medium'
    });
    
    createGoalFromAI.mockResolvedValue({
      id: 'goal-id',
      title: 'Learn React',
      description: 'Master React framework'
    });

    // Process the message
    const result = await geminiService.processMessage(message, userId, userContext);

    // Verify that each function was called exactly once
    expect(createTaskFromAI).toHaveBeenCalledTimes(1);
    expect(createGoalFromAI).toHaveBeenCalledTimes(1);

    // Verify the result contains exactly two actions
    expect(result.actions).toHaveLength(2);
    
    const taskAction = result.actions.find(a => a.entity_type === 'task');
    const goalAction = result.actions.find(a => a.entity_type === 'goal');
    
    expect(taskAction).toBeDefined();
    expect(goalAction).toBeDefined();
    expect(taskAction.action_type).toBe('create');
    expect(goalAction.action_type).toBe('create');
  });
}); 