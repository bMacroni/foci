import dotenv from 'dotenv';
dotenv.config();
import express from 'express'
import cors from 'cors'
import { createClient } from '@supabase/supabase-js'
import { requireAuth } from './middleware/auth.js'
import goalsRouter from './routes/goals.js'
import tasksRouter from './routes/tasks.js'
import googleAuthRoutes from './routes/googleAuth.js'
import authRouter from './routes/auth.js'
import calendarRouter from './routes/calendar.js'
import aiRouter from './routes/ai.js'
import conversationsRouter from './routes/conversations.js'
import userRouter from './routes/user.js'
import cron from 'node-cron';
import { syncGoogleCalendarEvents } from './utils/syncService.js';
import { autoScheduleTasks } from './controllers/autoSchedulingController.js';


const app = express()
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
  console.log('Supabase client initialized')
} else {
  console.warn('Supabase credentials not found. Some features may not work.')
}

// Environment check - only log non-sensitive info
console.log('NODE_ENV:', process.env.NODE_ENV);
console.log('PORT:', process.env.PORT);
console.log('Environment variables loaded:', Object.keys(process.env).filter(key => 
  key.includes('URL') || key.includes('GOOGLE') || key.includes('FRONTEND')
).length, 'configured');

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
    message: 'Welcome to Foci API',
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

console.log('Registering goals router...');
app.use('/api/goals', goalsRouter);
console.log('Goals router registered');

app.use('/api/tasks', tasksRouter);

app.use('/api/auth', authRouter);
app.use('/api/auth/google', googleAuthRoutes);

console.log('Registering calendar router...');
app.use('/api/calendar', calendarRouter);
console.log('Calendar router registered');

console.log('Registering AI router...');
app.use('/api/ai', aiRouter);
console.log('AI router registered');

console.log('Registering conversations router...');
app.use('/api/conversations', conversationsRouter);
console.log('Conversations router registered');

app.use('/api/user', userRouter);

async function getAllUserIds() {
  // Query all user_ids from google_tokens table
  const { data, error } = await supabase
    .from('google_tokens')
    .select('user_id');

  if (error) {
    console.error('Error fetching user IDs for Google Calendar sync:', error);
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
    console.error('Error fetching users with auto-scheduling enabled:', error);
    return [];
  }

  // Return unique user IDs as an array of strings
  return data.map(row => row.user_id);
}

// Schedule sync every day at 4:00 AM CST (America/Chicago)
cron.schedule('0 4 * * *', async () => {
  console.log('[CRON] Starting Google Calendar sync for all users at 4:00 AM CST');
  const userIds = await getAllUserIds();
  for (const userId of userIds) {
    try {
      await syncGoogleCalendarEvents(userId);
      console.log(`[CRON] Synced Google Calendar for user: ${userId}`);
    } catch (err) {
      console.error(`[CRON] Error syncing Google Calendar for user: ${userId}`, err);
    }
  }
}, {
  timezone: 'America/Chicago'
});

// Schedule auto-scheduling every day at 5:00 AM CST (after calendar sync)
cron.schedule('0 5 * * *', async () => {
  console.log('[CRON] Starting auto-scheduling for all enabled users at 5:00 AM CST');
  const userIds = await getUsersWithAutoSchedulingEnabled();
  
  if (userIds.length === 0) {
    console.log('[CRON] No users with auto-scheduling enabled found');
    return;
  }
  
  console.log(`[CRON] Found ${userIds.length} users with auto-scheduling enabled`);
  
  for (const userId of userIds) {
    try {
      // Get user's JWT token for API calls
      const { data: tokenData, error: tokenError } = await supabase
        .from('google_tokens')
        .select('access_token')
        .eq('user_id', userId)
        .single();
      
      if (tokenError || !tokenData?.access_token) {
        console.log(`[CRON] No valid token found for user: ${userId}, skipping auto-scheduling`);
        continue;
      }
      
      const token = tokenData.access_token;
      const result = await autoScheduleTasks(userId, token);
      
      if (result.error) {
        console.error(`[CRON] Error auto-scheduling for user ${userId}:`, result.error);
      } else {
        console.log(`[CRON] Auto-scheduling completed for user: ${userId}`);
        if (result.successful > 0) {
          console.log(`[CRON] Successfully scheduled ${result.successful} tasks for user: ${userId}`);
        }
      }
    } catch (err) {
      console.error(`[CRON] Error in auto-scheduling for user: ${userId}`, err);
    }
  }
}, {
  timezone: 'America/Chicago'
});

// Schedule auto-scheduling every 6 hours for recurring tasks and new tasks
cron.schedule('0 */6 * * *', async () => {
  console.log('[CRON] Starting periodic auto-scheduling check (every 6 hours)');
  const userIds = await getUsersWithAutoSchedulingEnabled();
  
  if (userIds.length === 0) {
    console.log('[CRON] No users with auto-scheduling enabled found for periodic check');
    return;
  }
  
  console.log(`[CRON] Found ${userIds.length} users for periodic auto-scheduling check`);
  
  for (const userId of userIds) {
    try {
      // Get user's JWT token for API calls
      const { data: tokenData, error: tokenError } = await supabase
        .from('google_tokens')
        .select('access_token')
        .eq('user_id', userId)
        .single();
      
      if (tokenError || !tokenData?.access_token) {
        console.log(`[CRON] No valid token found for user: ${userId}, skipping periodic auto-scheduling`);
        continue;
      }
      
      const token = tokenData.access_token;
      const result = await autoScheduleTasks(userId, token);
      
      if (result.error) {
        console.error(`[CRON] Error in periodic auto-scheduling for user ${userId}:`, result.error);
      } else if (result.successful > 0) {
        console.log(`[CRON] Periodically scheduled ${result.successful} tasks for user: ${userId}`);
      }
    } catch (err) {
      console.error(`[CRON] Error in periodic auto-scheduling for user: ${userId}`, err);
    }
  }
}, {
  timezone: 'America/Chicago'
});

// Start server only if run directly
if (process.env.NODE_ENV !== 'test') {
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 Foci API server running on port ${PORT}`);
    console.log(`📊 Health check: http://localhost:${PORT}/api/health`);
    console.log(`🌐 Network access: http://192.168.1.66:${PORT}/api/health`);
  });
}

// Add error handlers
process.on('uncaughtException', (err) => {
  console.error('Uncaught Exception:', err);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

export default app; 