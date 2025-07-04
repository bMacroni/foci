import express from 'express';
import { requireAuth } from '../middleware/auth.js';
import {
  createGoal,
  getGoals,
  getGoalById,
  updateGoal,
  deleteGoal
} from '../controllers/goalsController.js';

const router = express.Router();

console.log('Goals router being set up...');

// Test route to verify the router is working (must come before /:id routes)
router.get('/test', (req, res) => {
  console.log('Goals router test route hit!');
  res.json({ message: 'Goals router is working' });
});

router.post('/', requireAuth, createGoal);
router.get('/', requireAuth, (req, res, next) => {
  console.log('Goals GET / route hit!');
  getGoals(req, res, next);
});
router.get('/:id', requireAuth, (req, res, next) => {
  console.log('Goals :id route hit with id:', req.params.id);
  getGoalById(req, res, next);
});
router.put('/:id', requireAuth, updateGoal);
router.delete('/:id', requireAuth, deleteGoal);

console.log('Goals router setup complete');

export default router; 