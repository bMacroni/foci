import express from 'express';
import { requireAuth } from '../middleware/auth.js';
import {
  createGoal,
  getGoals,
  getGoalById,
  updateGoal,
  deleteGoal
} from '../controllers/goalsController.js';
import {
  createMilestone,
  updateMilestone,
  deleteMilestone,
  readMilestones,
  lookupMilestone
} from '../controllers/goalsController.js';
import {
  createStep,
  updateStep,
  deleteStep,
  readSteps,
  lookupStep
} from '../controllers/goalsController.js';

const router = express.Router();

console.log('Goals router being set up...');

// Goal endpoints
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

// Milestone endpoints
router.post('/:goalId/milestones', requireAuth, createMilestone);
router.get('/:goalId/milestones', requireAuth, readMilestones);
router.get('/:goalId/milestones/lookup', requireAuth, lookupMilestone); // lookup by title
router.get('/milestones/:milestoneId', requireAuth, lookupMilestone); // lookup by id
router.put('/milestones/:milestoneId', requireAuth, updateMilestone);
router.delete('/milestones/:milestoneId', requireAuth, deleteMilestone);

// Step endpoints
router.post('/milestones/:milestoneId/steps', requireAuth, createStep);
router.get('/milestones/:milestoneId/steps', requireAuth, readSteps);
router.get('/milestones/:milestoneId/steps/lookup', requireAuth, lookupStep); // lookup by text
router.get('/steps/:stepId', requireAuth, lookupStep); // lookup by id
router.put('/steps/:stepId', requireAuth, updateStep);
router.delete('/steps/:stepId', requireAuth, deleteStep);

export default router; 