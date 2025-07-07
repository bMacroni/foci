import express from 'express';
import { requireAuth } from '../middleware/auth.js';
import GeminiService from '../utils/geminiService.js';
// import AIService from '../utils/aiService.js';
import { conversationController } from '../controllers/conversationController.js';

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

    // Process message with Gemini service
    const response = await geminiService.processMessage(message, userId);
    console.log(`Gemini Response: ${response.message}`);

    // Save conversation to database if threadId is provided
    if (threadId) {
      try {
        const token = req.headers.authorization?.replace('Bearer ', '');
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

    console.log(`Goal Suggestions - User ${userId}: ${goalTitle}`);

    // Try Gemini first, fallback to basic suggestions if needed
    let suggestions;
    try {
      suggestions = await geminiService.generateGoalSuggestions(goalTitle);
      console.log(`Goal suggestions generated for: ${goalTitle}`);
    } catch (error) {
      console.log('Gemini failed, using fallback suggestions');
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
    console.error('Goal Suggestions Error:', error);
    res.status(500).json({ 
      error: 'Failed to generate suggestions',
      message: "I'm sorry, I couldn't generate suggestions right now. Please try again."
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

export default router; 