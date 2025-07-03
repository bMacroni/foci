import express from 'express'
import cors from 'cors'
import dotenv from 'dotenv'
import { createClient } from '@supabase/supabase-js'

// Load environment variables
dotenv.config()

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

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    message: 'MindGarden API is running',
    timestamp: new Date().toISOString()
  })
})

// Basic API routes
app.get('/api', (req, res) => {
  res.json({ 
    message: 'Welcome to MindGarden API',
    version: '1.0.0',
    endpoints: {
      health: '/api/health',
      goals: '/api/goals',
      tasks: '/api/tasks'
    }
  })
})

// Start server
app.listen(PORT, () => {
  console.log(`🚀 MindGarden API server running on port ${PORT}`)
  console.log(`📊 Health check: http://localhost:${PORT}/api/health`)
}) 