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