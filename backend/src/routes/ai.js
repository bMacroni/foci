import express from 'express';
import { requireAuth } from '../middleware/auth.js';
import GeminiService from '../utils/geminiService.js';
import AIService from '../utils/aiService.js';
import { conversationController } from '../controllers/conversationController.js';

const router = express.Router();
const geminiService = new GeminiService();
const aiService = new AIService(); // Fallback service

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

    // Try Gemini first, fallback to basic AI service if needed
    let response;
    try {
      response = await geminiService.processMessage(message, userId);
      console.log(`Gemini Response: ${response.message}`);
    } catch (error) {
      console.log('Gemini failed, using fallback AI service');
      response = await aiService.processMessage(message, userId);
      console.log(`Fallback AI Response: ${response.message}`);
    }

    // If threadId is provided, save the conversation
    if (threadId) {
      try {
        // Save user message
        await conversationController.addMessage({
          params: { threadId },
          body: { content: message, role: 'user' },
          user: { id: userId },
          headers: req.headers
        }, { status: () => ({ json: () => {} }) });

        // Save AI response
        await conversationController.addMessage({
          params: { threadId },
          body: { 
            content: response.message, 
            role: 'assistant',
            metadata: { actions: response.actions || [] }
          },
          user: { id: userId },
          headers: req.headers
        }, { status: () => ({ json: () => {} }) });
      } catch (saveError) {
        console.error('Error saving conversation:', saveError);
        // Don't fail the request if saving fails
      }
    }

    res.json({
      message: response.message,
      actions: response.actions || [],
      threadId: threadId
    });

  } catch (error) {
    console.error('AI Chat Error:', error);
    res.status(500).json({ 
      error: 'Failed to process message',
      message: "I'm sorry, I encountered an error. Please try again."
    });
  }
});

// Create new conversation thread
router.post('/threads', requireAuth, async (req, res) => {
  try {
    const { title, summary } = req.body;
    const userId = req.user.id;

    // Generate a title if not provided
    let threadTitle = title;
    if (!threadTitle) {
      threadTitle = `Conversation ${new Date().toLocaleDateString()} ${new Date().toLocaleTimeString()}`;
    }

    const thread = await conversationController.createThread({
      body: { title: threadTitle, summary },
      user: { id: userId },
      headers: req.headers
    }, res);

  } catch (error) {
    console.error('Error creating conversation thread:', error);
    res.status(500).json({ 
      error: 'Failed to create conversation thread',
      message: "I'm sorry, I couldn't create a new conversation thread."
    });
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