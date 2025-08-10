import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GeminiService } from '../src/utils/geminiService.js';

// Mock the GoogleGenerativeAI
vi.mock('@google/generative-ai', () => ({
  GoogleGenerativeAI: vi.fn().mockImplementation(() => ({
    getGenerativeModel: vi.fn().mockReturnValue({
      generateContent: vi.fn()
    })
  }))
}));

describe('Response Language Tests', () => {
  let geminiService;
  let mockModel;

  beforeEach(async () => {
    // Reset environment
    process.env.GOOGLE_AI_API_KEY = 'test-key';
    
    // Create service instance
    geminiService = new GeminiService();
    
    // Get the mock model
    const { GoogleGenerativeAI } = await import('@google/generative-ai');
    const mockGenAI = GoogleGenerativeAI.mock.results[0].value;
    mockModel = mockGenAI.getGenerativeModel();
    // Reset per-test implementations
    mockModel.generateContent.mockReset();
  });

  it('should use proper response language after creating a task', async () => {
    // Mock the Gemini response for task creation
    const mockResponse = {
      functionCalls: vi.fn().mockResolvedValue([
        {
          name: 'create_task',
          args: {
            title: 'Test task',
            due_date: '2024-12-25'
          }
        }
      ]),
      text: vi.fn().mockResolvedValue('I\'ve added "Test task" to your tasks.')
    };

    mockModel.generateContent.mockResolvedValue({
      response: mockResponse
    });

    // Mock the task controller
    const mockCreateTaskFromAI = vi.fn().mockResolvedValue({
      id: 'test-id',
      title: 'Test task',
      due_date: '2024-12-25'
    });

    // Replace the actual function with mock
    const tasksController = await import('../src/controllers/tasksController.js');
    vi.spyOn(tasksController, 'createTaskFromAI').mockImplementation(mockCreateTaskFromAI);

    const result = await geminiService.processMessage(
      'Create a task called "Test task" due on December 25th',
      'user123',
      { token: 'test-token' }
    );

    // Verify the response doesn't use "already" language
    expect(result.message).not.toContain('already');
    expect(result.message).toContain('added');
    expect(result.actions).toHaveLength(1);
    expect(result.actions[0].action_type).toBe('create');
    expect(result.actions[0].entity_type).toBe('task');
  });

  it('should use proper response language after creating a goal', async () => {
    // Mock the Gemini response for goal creation
    const mockResponse = {
      functionCalls: vi.fn().mockResolvedValue([
        {
          name: 'create_goal',
          args: {
            title: 'Test goal',
            description: 'A test goal'
          }
        }
      ]),
      text: vi.fn().mockResolvedValue('I\'ve created the goal "Test goal" for you.')
    };

    mockModel.generateContent
      .mockResolvedValueOnce({ response: mockResponse })
      .mockResolvedValueOnce({ response: { functionCalls: vi.fn().mockResolvedValue([]), text: vi.fn().mockResolvedValue("I've created the goal \"Test goal\" for you.") } });

    // Mock the goal controller
    const mockCreateGoalFromAI = vi.fn().mockResolvedValue({
      id: 'goal-id',
      title: 'Test goal',
      description: 'A test goal'
    });

    // Replace the actual function with mock
    const goalsController = await import('../src/controllers/goalsController.js');
    vi.spyOn(goalsController, 'createGoalFromAI').mockImplementation(mockCreateGoalFromAI);

    const result = await geminiService.processMessage(
      'Create a goal called "Test goal"',
      'user123',
      { token: 'test-token' }
    );

    // Verify the response doesn't use "already" language
    expect(result.message).not.toContain('already');
    expect(result.message).toContain('created');
    expect(result.actions).toHaveLength(1);
    expect(result.actions[0].action_type).toBe('create');
    expect(result.actions[0].entity_type).toBe('goal');
  });
}); 