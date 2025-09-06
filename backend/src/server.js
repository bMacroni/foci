import dotenv from 'dotenv';
const env = process.env.NODE_ENV || 'development';
// Load base, then local, then env-specific, then env-specific local (highest precedence)
dotenv.config();
dotenv.config({ path: `.env.local`, override: true });
dotenv.config({ path: `.env.${env}`, override: true });
dotenv.config({ path: `.env.${env}.local`, override: true });
import express from 'express'
import http from 'http'
import cors from 'cors'
import { createClient } from '@supabase/supabase-js'
import { requireAuth } from './middleware/auth.js'
import goalsRouter from './routes/goals.js'
import tasksRouter from './routes/tasks.js'
import googleAuthRoutes from './routes/googleAuth.js'
import googleMobileAuthRoutes from './routes/googleMobileAuth.js'
import authRouter from './routes/auth.js'
import calendarRouter from './routes/calendar.js'
import aiRouter from './routes/ai.js'
import conversationsRouter from './routes/conversations.js'
import userRouter from './routes/user.js'
import cron from 'node-cron';
import { syncGoogleCalendarEvents } from './utils/syncService.js';
import { autoScheduleTasks } from './controllers/autoSchedulingController.js';
import { sendNotification } from './services/notificationService.js';
import { initializeFirebaseAdmin } from './utils/firebaseAdmin.js';
import webSocketManager from './utils/webSocketManager.js';
import logger from './utils/logger.js';


const app = express()
const server = http.createServer(app);
const PORT = process.env.PORT || 5000

// Middleware
app.use(cors())
app.use(express.json())

// Initialize Supabase client
const supabaseUrl = process.env.SUPABASE_URL
const supabaseKey = process.env.SUPABASE_ANON_KEY

let supabase
if (supabaseUrl && supabaseKey) {
  supabase = createClient(supabaseUrl, supabaseKey)
  logger.info('Supabase client initialized')
} else {
  logger.warn('Supabase credentials not found. Some features may not work.')
}

// Environment check - only log non-sensitive info
if (process.env.DEBUG_LOGS === 'true') {
  logger.info('NODE_ENV:', process.env.NODE_ENV);
  logger.info('PORT:', process.env.PORT);
  logger.info('Environment variables loaded:', Object.keys(process.env).filter(key =>
    key.includes('URL') || key.includes('GOOGLE') || key.includes('FRONTEND')
  ).length, 'configured');
} else {
  logger.info('NODE_ENV:', process.env.NODE_ENV);
  logger.info('PORT:', process.env.PORT);
  logger.info('Environment variables loaded:', Object.keys(process.env).filter(key =>
    key.includes('URL') || key.includes('GOOGLE') || key.includes('FRONTEND')
  ).length, 'configured');
}

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development'
  });
});

// Basic API routes
app.get('/api', (req, res) => {
  res.json({ 
    message: 'Welcome to Mind Clear API',
    version: '1.0.0',
    endpoints: {
      health: '/api/health',
      goals: '/api/goals',
      tasks: '/api/tasks'
    }
  })
})

app.get('/api/protected', requireAuth, (req, res) => {
  res.json({ message: `Hello, ${req.user.email}! You have accessed a protected route.` });
});

app.use('/api/goals', goalsRouter);

app.use('/api/tasks', tasksRouter);

app.use('/api/auth', authRouter);
app.use('/api/auth/google', googleAuthRoutes);
app.use('/api/auth/google', googleMobileAuthRoutes);

if (process.env.DEBUG_LOGS === 'true') logger.info('Registering calendar router...');
app.use('/api/calendar', calendarRouter);
if (process.env.DEBUG_LOGS === 'true') logger.info('Calendar router registered');

if (process.env.DEBUG_LOGS === 'true') logger.info('Registering AI router...');
app.use('/api/ai', aiRouter);
if (process.env.DEBUG_LOGS === 'true') logger.info('AI router registered');

if (process.env.DEBUG_LOGS === 'true') logger.info('Registering conversations router...');
app.use('/api/conversations', conversationsRouter);
if (process.env.DEBUG_LOGS === 'true') logger.info('Conversations router registered');

app.use('/api/user', userRouter);

async function getAllUserIds() {
  // Query all user_ids from google_tokens table
  const { data, error } = await supabase
    .from('google_tokens')
    .select('user_id');

  if (error) {
    logger.error('Error fetching user IDs for Google Calendar sync:', error);
    return [];
  }

  // Return unique user IDs as an array of strings
  return data.map(row => row.user_id);
}

async function getUsersWithAutoSchedulingEnabled() {
  // Query users who have auto-scheduling enabled
  const { data, error } = await supabase
    .from('user_scheduling_preferences')
    .select('user_id')
    .eq('auto_scheduling_enabled', true);

  if (error) {
    logger.error('Error fetching users with auto-scheduling enabled:', error);
    return [];
  }

  // Return unique user IDs as an array of strings
  return data.map(row => row.user_id);
}

// Schedule sync every day at 4:00 AM CST (America/Chicago)
cron.schedule('0 4 * * *', async () => {
  logger.cron('[CRON] Starting Google Calendar sync for all users at 4:00 AM CST');
  const userIds = await getAllUserIds();
  for (const userId of userIds) {
    try {
      await syncGoogleCalendarEvents(userId);
      logger.cron(`[CRON] Synced Google Calendar for user: ${userId}`);
    } catch (err) {
      logger.error(`[CRON] Error syncing Google Calendar for user: ${userId}`, err);
    }
  }
}, {
  timezone: 'America/Chicago'
});

// Schedule auto-scheduling every day at 5:00 AM CST (after calendar sync)
cron.schedule('0 5 * * *', async () => {
  logger.cron('[CRON] Starting auto-scheduling for all enabled users at 5:00 AM CST');
  const userIds = await getUsersWithAutoSchedulingEnabled();
  
  if (userIds.length === 0) {
    logger.cron('[CRON] No users with auto-scheduling enabled found');
    return;
  }
  
  logger.cron(`[CRON] Found ${userIds.length} users with auto-scheduling enabled`);
  
  for (const userId of userIds) {
    try {
      // Get user's JWT token for API calls
      const { data: tokenData, error: tokenError } = await supabase
        .from('google_tokens')
        .select('access_token')
        .eq('user_id', userId)
        .single();
      
      if (tokenError || !tokenData?.access_token) {
        logger.cron(`[CRON] No valid token found for user: ${userId}, skipping auto-scheduling`);
        continue;
      }
      
      const token = tokenData.access_token;
      const result = await autoScheduleTasks(userId, token);
      
      if (result.error) {
        logger.error(`[CRON] Error auto-scheduling for user ${userId}:`, result.error);
      } else {
        logger.cron(`[CRON] Auto-scheduling completed for user: ${userId}`);
        if (result.successful > 0) {
          logger.cron(`[CRON] Successfully scheduled ${result.successful} tasks for user: ${userId}`);
        }
      }
    } catch (err) {
      logger.error(`[CRON] Error in auto-scheduling for user: ${userId}`, err);
    }
  }
}, {
  timezone: 'America/Chicago'
});

// Schedule auto-scheduling every 6 hours for recurring tasks and new tasks
cron.schedule('0 */6 * * *', async () => {
  logger.cron('[CRON] Starting periodic auto-scheduling check (every 6 hours)');
  const userIds = await getUsersWithAutoSchedulingEnabled();
  
  if (userIds.length === 0) {
    logger.cron('[CRON] No users with auto-scheduling enabled found for periodic check');
    return;
  }
  
  logger.cron(`[CRON] Found ${userIds.length} users for periodic auto-scheduling check`);
  
  for (const userId of userIds) {
    try {
      // Get user's JWT token for API calls
      const { data: tokenData, error: tokenError } = await supabase
        .from('google_tokens')
        .select('access_token')
        .eq('user_id', userId)
        .single();
      
      if (tokenError || !tokenData?.access_token) {
        logger.cron(`[CRON] No valid token found for user: ${userId}, skipping periodic auto-scheduling`);
        continue;
      }
      
      const token = tokenData.access_token;
      const result = await autoScheduleTasks(userId, token);
      
      if (result.error) {
        logger.error(`[CRON] Error in periodic auto-scheduling for user ${userId}:`, result.error);
      } else if (result.successful > 0) {
        logger.cron(`[CRON] Periodically scheduled ${result.successful} tasks for user: ${userId}`);
      }
    } catch (err) {
      logger.error(`[CRON] Error in periodic auto-scheduling for user: ${userId}`, err);
    }
  }
}, {
  timezone: 'America/Chicago'
});

// --- Task Reminder Cron Job ---
const sendTaskReminders = async () => {
  const now = new Date();
  const reminderWindow = new Date(now.getTime() + 30 * 60 * 1000); // 30 minutes from now

  logger.cron('[CRON] Checking for task reminders...');

  try {
    const { data: tasks, error } = await supabase
      .from('tasks')
      .select('id, user_id, title, due_date')
      .lte('due_date', reminderWindow.toISOString())
      .gte('due_date', now.toISOString())
      .eq('status', 'not_started')
      .is('reminder_sent_at', null);

    if (error) {
      logger.error('[CRON] Error fetching tasks for reminders:', error);
      return;
    }

    if (tasks && tasks.length > 0) {
      logger.cron(`[CRON] Found ${tasks.length} tasks needing reminders.`);
      for (const task of tasks) {
        const notification = {
          notification_type: 'task_reminder',
          title: `Reminder: ${task.title}`,
          message: `This task is due at ${new Date(task.due_date).toLocaleTimeString()}.`,
          details: { taskId: task.id }
        };

        await sendNotification(task.user_id, notification);

        // Mark reminder as sent
        await supabase
          .from('tasks')
          .update({ reminder_sent_at: new Date().toISOString() })
          .eq('id', task.id);
      }
    } else {
      logger.cron('[CRON] No tasks need reminders at this time.');
    }
  } catch (err) {
    logger.error('[CRON] Exception in sendTaskReminders:', err);
  }
};

// Schedule task reminder check to run every 5 minutes
cron.schedule('*/5 * * * *', sendTaskReminders);

// Initialize Firebase Admin SDK
try {
  initializeFirebaseAdmin();
  logger.info('Firebase Admin SDK initialized successfully');
} catch (error) {
  logger.warn('Firebase Admin SDK initialization failed:', error.message);
  logger.warn('Google mobile authentication will not be available');
}

// Initialize WebSocket Server
webSocketManager.init(server);

// Start server only if run directly
if (process.env.NODE_ENV !== 'test') {
  server.listen(PORT, '0.0.0.0', () => {
    logger.info(`🚀 Mind Clear API server running on port ${PORT}`);
    logger.info(`📊 Health check: http://localhost:${PORT}/api/health`);
    logger.info(`🌐 Network access: http://192.168.1.66:${PORT}/api/health`);
  });
}

// Add error handlers
process.on('uncaughtException', (err) => {
  logger.error('Uncaught Exception:', err);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  logger.error('Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

export default app; 