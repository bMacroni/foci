import express from 'express';
import { google } from 'googleapis';
import oauth2Client from '../utils/googleAuth.js';
import { createClient } from '@supabase/supabase-js';
import { storeGoogleTokens } from '../utils/googleTokenStorage.js';

const router = express.Router();
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY);

// 1. Start OAuth flow for login
router.get('/login', (req, res) => {
  const scopes = [
    'https://www.googleapis.com/auth/calendar',
    'https://www.googleapis.com/auth/userinfo.email'
  ];
  const url = oauth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: scopes,
    prompt: 'consent'
  });
  res.redirect(url);
});

// 2. Handle OAuth callback for login
router.get('/callback', async (req, res) => {
  const code = req.query.code;

  if (!code) return res.status(400).send('No code provided');

  try {
    // 1. Exchange code for tokens
    const { tokens } = await oauth2Client.getToken(code);
    console.log('Google tokens received successfully');

    // 2. Get user info from Google
    oauth2Client.setCredentials(tokens);
    const oauth2 = google.oauth2({ version: 'v2', auth: oauth2Client });
    const userInfo = await oauth2.userinfo.get();
    
    const googleEmail = userInfo.data.email;
    const googleName = userInfo.data.name;

    // 3. For now, just redirect with success and let the user log in manually
    // In a production app, you'd want to implement proper user creation/login
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
    res.redirect(`${frontendUrl}?google=info&email=${encodeURIComponent(googleEmail)}&name=${encodeURIComponent(googleName)}`);
    
  } catch (err) {
    console.error('Error in Google OAuth callback:', err);
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
    res.redirect(`${frontendUrl}?google=error&message=${encodeURIComponent('OAuth callback failed')}`);
  }
});

export default router;
