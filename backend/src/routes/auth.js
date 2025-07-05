import express from 'express';
import { createClient } from '@supabase/supabase-js';

const router = express.Router();
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY);

// Signup endpoint
router.post('/signup', async (req, res) => {
  try {
    const { email, password } = req.body;
    console.log('Signup attempt for email:', email);

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
    });

    if (error) {
      console.error('Signup error:', error);
      return res.status(400).json({ error: error.message });
    }

    console.log('Supabase signup response:', data);

    if (data.user) {
      console.log('User created successfully:', data.user.email);
      
      // Try to get the session token
      try {
        const { data: sessionData, error: sessionError } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (sessionError) {
          console.error('Auto-login error:', sessionError);
          
          // Check if it's an email confirmation error
          if (sessionError.message.includes('Email not confirmed') || sessionError.code === 'email_not_confirmed') {
            return res.status(200).json({ 
              message: 'User created successfully. Please check your email and confirm your account before logging in.',
              userCreated: true,
              error: 'Email confirmation required. Please check your email and click the confirmation link.'
            });
          }
          
          // Other auto-login errors
          return res.status(200).json({ 
            message: 'User created successfully. Please log in.',
            userCreated: true,
            error: 'Auto-login failed. Please log in manually.'
          });
        }

        res.json({
          message: 'User created and logged in successfully',
          token: sessionData.session.access_token,
          user: sessionData.user
        });
      } catch (loginError) {
        console.error('Login attempt error:', loginError);
        res.status(200).json({ 
          message: 'User created successfully. Please log in.',
          userCreated: true,
          error: 'Auto-login failed. Please log in manually.'
        });
      }
    } else {
      res.status(400).json({ error: 'Failed to create user' });
    }
  } catch (error) {
    console.error('Signup error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Login endpoint
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      console.error('Login error:', error);
      return res.status(400).json({ error: error.message });
    }

    res.json({
      message: 'Login successful',
      token: data.session.access_token,
      user: data.user
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router; 