import express from 'express';
import { google } from 'googleapis';
import oauth2Client from '../utils/googleAuth.js';
import { verifyJwt } from '../utils/jwtUtils.js';
import { storeGoogleTokens } from '../utils/googleTokenStorage.js';

const router = express.Router();

// 1. Start OAuth flow
router.get('/login', (req, res) => {
  const scopes = [
    'https://www.googleapis.com/auth/calendar',
    'https://www.googleapis.com/auth/userinfo.email'
  ];
  const url = oauth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: scopes,
    prompt: 'consent',
    state: req.query.state
  });
  res.redirect(url);
});

// 2. Handle OAuth callback
router.get('/callback', async (req, res) => {
  const code = req.query.code;
  const state = req.query.state; // This should be the user's JWT

  if (!code) return res.status(400).send('No code provided');
  if (!state) return res.status(400).send('No state provided');

  // Verify the JWT (state) and get the user ID/email
  // Example: decode and verify JWT, then get user info
  // (You may already have a function for this in your auth middleware)

  try {
    // 1. Verify JWT (state)
    const user = await verifyJwt(state);
    console.log('User authenticated:', user.email);

    // 2. Exchange code for tokens
    const { tokens } = await oauth2Client.getToken(code);
    console.log('Google tokens received for user:', user.email);

    // 3. Store tokens in your database, associated with user.id
    await storeGoogleTokens(user.id, tokens);
    console.log('Google tokens stored for user:', user.email);

    // 4. Redirect to frontend with a success message
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
    console.log('FRONTEND_URL from env:', process.env.FRONTEND_URL);
    console.log('Using frontendUrl:', frontendUrl);
    res.redirect(`${frontendUrl}/dashboard?google=success`);
  } catch (err) {
    console.error('Error in Google OAuth callback:', err);
    res.status(500).send('Error processing Google OAuth callback');
  }
});

export default router;
