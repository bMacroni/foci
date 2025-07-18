import express from 'express';
import { requireAuth } from '../middleware/auth.js';
import { getUserSettings, updateUserSettings } from '../controllers/userController.js';

const router = express.Router();

// Get user settings
router.get('/settings', requireAuth, getUserSettings);

// Update user settings
router.put('/settings', requireAuth, updateUserSettings);

export default router; 