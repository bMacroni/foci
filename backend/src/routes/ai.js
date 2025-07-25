import express from 'express';
import { requireAuth } from '../middleware/auth.js';
import GeminiService from '../utils/geminiService.js';
// import AIService from '../utils/aiService.js';
import { conversationController } from '../controllers/conversationController.js';
import { sendFeedback } from '../controllers/feedbackController.js';

const router = express.Router();
const geminiService = new GeminiService();
// const aiService = new AIService(); // Fallback service

// Chat endpoint with conversation history support
router.post('/chat', requireAuth, async (req, res) => {
  try {
    const { message, threadId } = req.body;
    const userId = req.user.id;

    if (!message || typeof message !== 'string') {
      return res.status(400).json({ 
        error: 'Message is required and must be a string' 
      });
    }

    console.log(`AI Chat - User ${userId}: ${message}${threadId ? ` (Thread: ${threadId})` : ''}`);

    // Extract JWT token from Authorization header
    const token = req.headers.authorization?.split(' ')[1];
    
    console.log('=== AI ROUTE DEBUG ===');
    console.log('Authorization header:', req.headers.authorization ? 'Present' : 'Missing');
    console.log('Token (first 50 chars):', token ? token.substring(0, 50) + '...' : 'No token');
    console.log('Token type:', typeof token);
    console.log('Token length:', token ? token.length : 0);
    console.log('=== END AI ROUTE DEBUG ===');

    // Process message with Gemini service, passing token in userContext
    const response = await geminiService.processMessage(message, userId, { token });
    console.log(`Gemini Response: ${response.message}`);

    // Save conversation to database if threadId is provided
    if (threadId) {
      try {
        await conversationController.addMessage(threadId, message, 'user', {}, token);
        await conversationController.addMessage(threadId, response.message, 'assistant', { actions: response.actions }, token);
      } catch (dbError) {
        console.error('Error saving conversation to database:', dbError);
        // Continue with response even if database save fails
      }
    }

    res.json({
      message: response.message,
      actions: response.actions || []
    });

  } catch (error) {
    console.error('AI Chat Error:', error);
    res.status(500).json({ 
      error: 'Failed to process message',
      message: 'I\'m sorry, I encountered an error processing your request. Please try again.'
    });
  }
});

// Recommend a task based on user query and current tasks
router.post('/recommend-task', requireAuth, async (req, res) => {
  try {
    const { userRequest } = req.body;
    const userId = req.user.id;
    if (!userRequest || typeof userRequest !== 'string') {
      return res.status(400).json({ error: 'userRequest is required and must be a string' });
    }
    // Fetch the user's tasks (reuse logic from getTasks controller)
    const token = req.headers.authorization?.split(' ')[1];
    const { createClient } = await import('@supabase/supabase-js');
    const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY, {
      global: {
        headers: {
          Authorization: `Bearer ${token}`
        }
      }
    });
    const { data: tasks, error } = await supabase
      .from('tasks')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });
    if (error) {
      return res.status(400).json({ error: error.message });
    }
    // Call Gemini to recommend a task
    const result = await geminiService.recommendTaskFromList(userRequest, tasks, userId);
    res.json(result);
  } catch (error) {
    console.error('Recommend Task Error:', error);
    res.status(500).json({ error: 'Failed to recommend a task' });
  }
});

// Create new conversation thread
router.post('/threads', requireAuth, async (req, res) => {
  try {
    const { title, summary } = req.body;
    const userId = req.user.id;

    const thread = await conversationController.createThread(userId, title || 'New Conversation', summary);
    res.json(thread);
  } catch (error) {
    console.error('Create Thread Error:', error);
    res.status(500).json({ error: 'Failed to create conversation thread' });
  }
});

// Get conversation threads for user
router.get('/threads', requireAuth, async (req, res) => {
  try {
    const userId = req.user.id;
    const threads = await conversationController.getThreads(userId);
    res.json(threads);
  } catch (error) {
    console.error('Get Threads Error:', error);
    res.status(500).json({ error: 'Failed to get conversation threads' });
  }
});

// Get specific conversation thread
router.get('/threads/:threadId', requireAuth, async (req, res) => {
  try {
    const { threadId } = req.params;
    const userId = req.user.id;
    
    const thread = await conversationController.getThread(threadId, userId);
    if (!thread) {
      return res.status(404).json({ error: 'Thread not found' });
    }
    
    res.json(thread);
  } catch (error) {
    console.error('Get Thread Error:', error);
    res.status(500).json({ error: 'Failed to get conversation thread' });
  }
});

// Update conversation thread
router.put('/threads/:threadId', requireAuth, async (req, res) => {
  try {
    const { threadId } = req.params;
    const { title, summary } = req.body;
    const userId = req.user.id;
    
    const updatedThread = await conversationController.updateThread(threadId, userId, { title, summary });
    if (!updatedThread) {
      return res.status(404).json({ error: 'Thread not found' });
    }
    
    res.json(updatedThread);
  } catch (error) {
    console.error('Update Thread Error:', error);
    res.status(500).json({ error: 'Failed to update conversation thread' });
  }
});

// Delete conversation thread
router.delete('/threads/:threadId', requireAuth, async (req, res) => {
  try {
    const { threadId } = req.params;
    const userId = req.user.id;
    
    const deleted = await conversationController.deleteThread(threadId, userId);
    if (!deleted) {
      return res.status(404).json({ error: 'Thread not found' });
    }
    
    res.json({ message: 'Thread deleted successfully' });
  } catch (error) {
    console.error('Delete Thread Error:', error);
    res.status(500).json({ error: 'Failed to delete conversation thread' });
  }
});

// Goal suggestions endpoint
router.post('/goal-suggestions', requireAuth, async (req, res) => {
  try {
    const { goalTitle } = req.body;
    const userId = req.user.id;

    if (!goalTitle || typeof goalTitle !== 'string') {
      return res.status(400).json({ 
        error: 'Goal title is required and must be a string' 
      });
    }

    // Goal suggestions requested

    // Try Gemini first, fallback to basic suggestions if needed
    let suggestions;
    try {
      suggestions = await geminiService.generateGoalSuggestions(goalTitle);
    } catch (error) {
      // Using fallback suggestions
      suggestions = `• Break down the goal into smaller, manageable steps
• Set specific milestones and deadlines
• Track your progress regularly
• Stay motivated by celebrating small wins
• Create a detailed action plan with timelines`;
    }

    res.json({
      suggestions: suggestions,
      goalTitle: goalTitle
    });

  } catch (error) {
    res.status(500).json({ 
      error: 'Failed to generate suggestions',
      message: "I'm sorry, I couldn't generate suggestions right now. Please try again."
    });
  }
});

// Goal breakdown suggestions endpoint
router.post('/goal-breakdown', requireAuth, async (req, res) => {
  try {
    const { goalTitle, goalDescription } = req.body;
    const userId = req.user.id;

    if (!goalTitle || typeof goalTitle !== 'string') {
      return res.status(400).json({ 
        error: 'Goal title is required and must be a string' 
      });
    }

    // Goal breakdown requested

    // Generate breakdown suggestions using Gemini
    let breakdown;
    try {
      breakdown = await geminiService.generateGoalBreakdown(goalTitle, goalDescription);
    } catch (error) {
      return res.status(500).json({ 
        error: 'Failed to generate goal breakdown',
        message: "I'm sorry, I couldn't generate a breakdown right now. Please try again."
      });
    }

    res.json({
      breakdown: breakdown,
      goalTitle: goalTitle,
      goalDescription: goalDescription
    });

  } catch (error) {
    res.status(500).json({ 
      error: 'Failed to generate breakdown',
      message: "I'm sorry, I couldn't generate a breakdown right now. Please try again."
    });
  }
});

// Health check for AI service
router.get('/health', requireAuth, (req, res) => {
  res.json({ 
    status: 'OK', 
    message: 'AI service is running',
    timestamp: new Date().toISOString()
  });
});

router.post('/feedback', sendFeedback);

export default router; 