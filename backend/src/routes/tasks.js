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

export default router; 