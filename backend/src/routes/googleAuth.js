import express from 'express';
import logger from '../utils/logger.js';
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

// 2. Handle OAuth callback for login (supports both web and mobile)
router.get('/callback', async (req, res) => {
  const code = req.query.code;
  const state = req.query.state; // For mobile flow, state contains user info

  if (!code) return res.status(400).send('No code provided');

  try {
    // 1. Exchange code for tokens
    const { tokens } = await oauth2Client.getToken(code);
    logger.info('Google tokens received successfully');
    
    // Token exchange result

    // 2. Get user info from Google
    oauth2Client.setCredentials(tokens);
    const oauth2 = google.oauth2({ version: 'v2', auth: oauth2Client });
    const userInfo = await oauth2.userinfo.get();
    
    const googleEmail = userInfo.data.email;
    const googleName = userInfo.data.name;

    // 3. Check if this is a mobile flow (state contains user info)
    if (state && state.includes('mobile:')) {
      // Mobile flow - store tokens and redirect back to mobile app
      const userId = state.replace('mobile:', '');
      
      try {
        await storeGoogleTokens(userId, {
          access_token: tokens.access_token,
          refresh_token: tokens.refresh_token,
          token_type: tokens.token_type || 'Bearer',
          scope: tokens.scope || 'https://www.googleapis.com/auth/calendar.events.readonly',
          expiry_date: tokens.expiry_date || (Date.now() + 3600 * 1000),
        });
        logger.info(`Stored Google tokens for mobile user: ${userId}`);
        
        // Redirect to mobile app with success
        const mobileRedirectUrl = process.env.MOBILE_REDIRECT_URL || 'mindgarden://oauth-callback';
        res.redirect(`${mobileRedirectUrl}?success=true&email=${encodeURIComponent(googleEmail)}`);
      } catch (tokenError) {
        logger.error('Error storing tokens for mobile user:', tokenError);
        const mobileRedirectUrl = process.env.MOBILE_REDIRECT_URL || 'mindgarden://oauth-callback';
        res.redirect(`${mobileRedirectUrl}?error=token_storage_failed`);
      }
    } else {
      // Web flow - redirect to frontend
      const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
      res.redirect(`${frontendUrl}?google=info&email=${encodeURIComponent(googleEmail)}&name=${encodeURIComponent(googleName)}`);
    }
    
  } catch (err) {
    logger.error('Error in Google OAuth callback:', err);
    
    if (state && state.includes('mobile:')) {
      // Mobile flow error
      const mobileRedirectUrl = process.env.MOBILE_REDIRECT_URL || 'mindgarden://oauth-callback';
      res.redirect(`${mobileRedirectUrl}?error=oauth_failed`);
    } else {
      // Web flow error
      const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
      res.redirect(`${frontendUrl}?google=error&message=${encodeURIComponent('OAuth callback failed')}`);
    }
  }
});

export default router;
