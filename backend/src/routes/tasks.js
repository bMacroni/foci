import express from 'express';
import { requireAuth } from '../middleware/auth.js';
import {
  createTask,
  getTasks,
  getTaskById,
  updateTask,
  deleteTask,
  bulkCreateTasks,
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
  markAllNotificationsAsRead
} from '../services/notificationService.js';

const router = express.Router();

router.post('/', requireAuth, createTask);
router.post('/bulk', requireAuth, bulkCreateTasks);
router.get('/', requireAuth, getTasks);
router.get('/:id', requireAuth, getTaskById);
router.put('/:id', requireAuth, updateTask);
router.delete('/:id', requireAuth, deleteTask);

// Auto-scheduling routes
router.put('/:id/toggle-auto-schedule', requireAuth, toggleAutoSchedule);
router.get('/auto-scheduling/dashboard', requireAuth, getAutoSchedulingDashboard);
router.get('/auto-scheduling/preferences', requireAuth, getUserSchedulingPreferences);
router.put('/auto-scheduling/preferences', requireAuth, updateUserSchedulingPreferences);
router.get('/auto-scheduling/history/:task_id?', requireAuth, getTaskSchedulingHistory);
router.post('/auto-scheduling/trigger', requireAuth, triggerAutoScheduling);

// Notification routes
router.get('/notifications', requireAuth, async (req, res) => {
  try {
    const notifications = await getUserNotifications(req.user.id, req.query.limit ? parseInt(req.query.limit) : 10);
    res.json(notifications);
  } catch (error) {
    console.error('Error fetching notifications:', error);
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
    console.error('Error marking notification as read:', error);
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
    console.error('Error marking all notifications as read:', error);
    res.status(500).json({ error: 'Failed to mark all notifications as read' });
  }
});

export default router; 