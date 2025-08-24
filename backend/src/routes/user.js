import express from 'express';
import { requireAuth } from '../middleware/auth.js';
import { getUserSettings, updateUserSettings, updateUserProfile, getUserProfile, getAppPreferences, updateAppPreferences } from '../controllers/userController.js';

const router = express.Router();

// Get user settings
router.get('/settings', requireAuth, getUserSettings);

// Update user settings
router.put('/settings', requireAuth, updateUserSettings);

// Get current user full profile (includes new profile fields)
router.get('/me', requireAuth, getUserProfile);

// Update profile by authenticated user (ID is derived from token to avoid spoofing)
router.put('/me', requireAuth, updateUserProfile);

// App preferences (Momentum Mode, etc.)
router.get('/app-preferences', requireAuth, getAppPreferences);
router.put('/app-preferences', requireAuth, updateAppPreferences);

export default router; 