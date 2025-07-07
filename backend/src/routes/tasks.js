import express from 'express';
import { requireAuth } from '../middleware/auth.js';
import {
  createTask,
  getTasks,
  getTaskById,
  updateTask,
  deleteTask,
  bulkCreateTasks
} from '../controllers/tasksController.js';

const router = express.Router();

router.post('/', requireAuth, createTask);
router.post('/bulk', requireAuth, bulkCreateTasks);
router.get('/', requireAuth, getTasks);
router.get('/:id', requireAuth, getTaskById);
router.put('/:id', requireAuth, updateTask);
router.delete('/:id', requireAuth, deleteTask);

export default router; 