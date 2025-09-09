import express from 'express';
import rateLimit from 'express-rate-limit';
import logger from '../utils/logger.js';
import { requireAuth } from '../middleware/auth.js';
import {
  createTask,
  getTasks,
  getTaskById,
  updateTask,
  deleteTask,
  bulkCreateTasks,
  getNextFocusTask,
  // Auto-scheduling endpoints
  toggleAutoSchedule,
  getAutoSchedulingDashboard,
  getUserSchedulingPreferences,
  updateUserSchedulingPreferences,
  getTaskSchedulingHistory,
  triggerAutoScheduling
} from '../controllers/tasksController.js';
import {
  getUserNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  getUnreadNotificationsCount,
  markAllNotificationsAsReadAndArchive
} from '../services/notificationService.js';

// Rate limiter for archive-all endpoint to prevent abuse of expensive operation
const archiveLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute window
  limit: 2, // Maximum 2 requests per window per user
  keyGenerator: (req) => req.user?.id || req.ip, // Use user ID if authenticated, fallback to IP
  message: {
    error: 'Too many archive requests. Please wait a moment before trying again.',
    retryAfter: '1 minute'
  },
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
});

const router = express.Router();

router.post('/', requireAuth, createTask);
router.post('/bulk', requireAuth, bulkCreateTasks);
router.get('/', requireAuth, getTasks);

// Notification routes (must come before /:id routes)
router.get('/notifications', requireAuth, async (req, res) => {
  try {
    // Validate and normalize status parameter
    const validStatuses = ['all', 'read', 'unread'];
    const status = req.query.status || 'unread';
    const normalizedStatus = validStatuses.includes(status) ? status : 'unread';
    
    // Parse limit parameter if provided
    const limit = req.query.limit ? parseInt(req.query.limit, 10) : undefined;
    
    const notifications = await getUserNotifications(req.user.id, normalizedStatus, limit);
    res.json(notifications);
  } catch (error) {
    logger.error('Error fetching notifications:', error);
    res.status(500).json({ error: 'Failed to fetch notifications' });
  }
});

router.put('/notifications/:id/read', requireAuth, async (req, res) => {
  try {
    const result = await markNotificationAsRead(req.params.id, req.user.id);
    if (result.success) {
      res.json({ success: true });
    } else {
      res.status(400).json({ error: result.error });
    }
  } catch (error) {
    logger.error('Error marking notification as read:', error);
    res.status(500).json({ error: 'Failed to mark notification as read' });
  }
});

router.put('/notifications/read-all', requireAuth, async (req, res) => {
  try {
    const result = await markAllNotificationsAsRead(req.user.id);
    if (result.success) {
      res.json({ success: true });
    } else {
      res.status(400).json({ error: result.error });
    }
  } catch (error) {
    logger.error('Error marking all notifications as read:', error);
    res.status(500).json({ error: 'Failed to mark all notifications as read' });
  }
});

router.get('/notifications/unread-count', requireAuth, async (req, res) => {
  try {
    const count = await getUnreadNotificationsCount(req.user.id);
    res.json({ count });
  } catch (error) {
    logger.error('Error fetching unread notification count:', error);
    res.status(500).json({ error: 'Failed to fetch unread notification count' });
  }
});

router.put('/notifications/archive-all', requireAuth, archiveLimiter, async (req, res) => {
  try {
    const result = await markAllNotificationsAsReadAndArchive(req.user.id);
    if (result.success) {
      res.json({ success: true });
    } else {
      res.status(400).json({ error: result.error });
    }
  } catch (error) {
    logger.error('Error archiving all notifications:', error);
    res.status(500).json({ error: 'Failed to archive all notifications' });
  }
});

// Task-specific routes (must come after notification routes)
router.get('/:id', requireAuth, getTaskById);
router.put('/:id', requireAuth, updateTask);
router.delete('/:id', requireAuth, deleteTask);

// Momentum Mode endpoint
router.post('/focus/next', requireAuth, getNextFocusTask);

// Auto-scheduling routes
router.put('/:id/toggle-auto-schedule', requireAuth, toggleAutoSchedule);
router.get('/auto-scheduling/dashboard', requireAuth, getAutoSchedulingDashboard);
router.get('/auto-scheduling/preferences', requireAuth, getUserSchedulingPreferences);
router.put('/auto-scheduling/preferences', requireAuth, updateUserSchedulingPreferences);
router.get('/auto-scheduling/history/:task_id?', requireAuth, getTaskSchedulingHistory);
router.post('/auto-scheduling/trigger', requireAuth, triggerAutoScheduling);

export default router; 