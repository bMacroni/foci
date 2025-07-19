import express from 'express';
import { requireAuth } from '../middleware/auth.js';
import {
  listCalendarEvents,
  createCalendarEvent,
  updateCalendarEvent,
  deleteCalendarEvent,
  getCalendarList,
  getEventsForDate
} from '../utils/calendarService.js';
import { getCalendarEventsFromDB, syncGoogleCalendarEvents } from '../utils/syncService.js';

const router = express.Router();

// Get user's calendar list
router.get('/list', requireAuth, async (req, res) => {
  try {
    const calendars = await getCalendarList(req.user.id);
    res.json(calendars);
  } catch (error) {
    console.error('Error getting calendar list:', error);
    res.status(500).json({ error: 'Failed to get calendar list' });
  }
});

// Get upcoming calendar events from local database
router.get('/events', requireAuth, async (req, res) => {
  try {
    const maxResults = parseInt(req.query.maxResults) || 100;
    
    console.log(`[Calendar API] Getting events for user ${req.user.id}, maxResults: ${maxResults}`);
    
    // Get events from local database instead of Google Calendar API
    const events = await getCalendarEventsFromDB(req.user.id, maxResults);
    
    console.log(`[Calendar API] Returning ${events.length} events`);
    
    // Always return 200 with an array (possibly empty)
    res.json(events);
  } catch (error) {
    console.error('Error getting calendar events from database:', error);
    res.status(500).json({ error: 'Failed to get calendar events' });
  }
});

// Get events for a specific date from local database
router.get('/events/date', requireAuth, async (req, res) => {
  const { date } = req.query;
  // Validate date (simple regex for YYYY-MM-DD)
  if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    return res.status(400).json({ error: 'Missing or invalid date parameter (expected YYYY-MM-DD)' });
  }
  try {
    // Calculate time range for the specific date
    const timeMin = new Date(date + 'T00:00:00Z');
    const timeMax = new Date(date + 'T23:59:59Z');
    
    const events = await getCalendarEventsFromDB(req.user.id, 100, timeMin, timeMax);
    res.json(events);
  } catch (error) {
    console.error('Error getting events for date from database:', error);
    res.status(500).json({ error: 'Failed to fetch events for date' });
  }
});

// Create a new calendar event
router.post('/events', requireAuth, async (req, res) => {
  try {
    const { summary, description, startTime, endTime, timeZone } = req.body;

    if (!summary || !startTime || !endTime) {
      return res.status(400).json({ 
        error: 'Summary, startTime, and endTime are required' 
      });
    }

    const eventData = {
      summary,
      description: description || '',
      startTime,
      endTime,
      timeZone: timeZone || 'UTC'
    };

    const event = await createCalendarEvent(req.user.id, eventData);
    res.status(201).json(event);
  } catch (error) {
    console.error('Error creating calendar event:', error);
    if (error.message.includes('No Google tokens found')) {
      res.status(401).json({ error: 'Google Calendar not connected. Please connect your Google account first.' });
    } else {
      res.status(500).json({ error: 'Failed to create calendar event' });
    }
  }
});

// Update a calendar event
router.put('/events/:eventId', requireAuth, async (req, res) => {
  try {
    const { eventId } = req.params;
    const { summary, description, startTime, endTime, timeZone } = req.body;

    if (!summary || !startTime || !endTime) {
      return res.status(400).json({ 
        error: 'Summary, startTime, and endTime are required' 
      });
    }

    const eventData = {
      summary,
      description: description || '',
      startTime,
      endTime,
      timeZone: timeZone || 'UTC'
    };

    const event = await updateCalendarEvent(req.user.id, eventId, eventData);
    res.json(event);
  } catch (error) {
    console.error('Error updating calendar event:', error);
    if (error.message.includes('No Google tokens found')) {
      res.status(401).json({ error: 'Google Calendar not connected. Please connect your Google account first.' });
    } else {
      res.status(500).json({ error: 'Failed to update calendar event' });
    }
  }
});

// Delete a calendar event
router.delete('/events/:eventId', requireAuth, async (req, res) => {
  try {
    const { eventId } = req.params;
    await deleteCalendarEvent(req.user.id, eventId);
    res.json({ message: 'Event deleted successfully' });
  } catch (error) {
    console.error('Error deleting calendar event:', error);
    if (error.message.includes('No Google tokens found')) {
      res.status(401).json({ error: 'Google Calendar not connected. Please connect your Google account first.' });
    } else {
      res.status(500).json({ error: 'Failed to delete calendar event' });
    }
  }
});

// Check if user has Google Calendar connected
router.get('/status', requireAuth, async (req, res) => {
  try {
    const { getGoogleTokens } = await import('../utils/googleTokenStorage.js');
    const tokens = await getGoogleTokens(req.user.id);
    if (!tokens) {
      return res.json({ connected: false });
    }
    // Try a lightweight Google Calendar API call to verify token validity
    try {
      const { google } = await import('googleapis');
      const oauth2Client = new google.auth.OAuth2(
        process.env.GOOGLE_CLIENT_ID,
        process.env.GOOGLE_CLIENT_SECRET,
        process.env.GOOGLE_REDIRECT_URI
      );
      oauth2Client.setCredentials({
        access_token: tokens.access_token,
        refresh_token: tokens.refresh_token,
        scope: tokens.scope,
        token_type: tokens.token_type,
        expiry_date: tokens.expiry_date
      });
      const calendar = google.calendar({ version: 'v3', auth: oauth2Client });
      // Try to list 1 event as a token check
      await calendar.events.list({ calendarId: 'primary', maxResults: 1 });
      // If successful, token is valid
      return res.json({ 
        connected: true, 
        email: req.user.email,
        lastUpdated: tokens.updated_at 
      });
    } catch (err) {
      // If token is invalid or expired
      if (
        (err.response && err.response.data && err.response.data.error === 'invalid_grant') ||
        (err.message && err.message.includes('Token has been expired or revoked'))
      ) {
        return res.json({ connected: false, error: 'google_calendar_disconnected' });
      }
      // Other errors
      return res.json({ connected: false, error: 'calendar_status_error', details: err.message });
    }
  } catch (error) {
    console.error('Error checking calendar status:', error);
    res.status(500).json({ error: 'Failed to check calendar status' });
  }
});

// Manual sync endpoint
router.post('/sync', requireAuth, async (req, res) => {
  try {
    console.log(`Manual sync requested for user: ${req.user.id}`);
    const result = await syncGoogleCalendarEvents(req.user.id);
    res.json({ 
      success: true, 
      message: `Synced ${result.count} events`,
      count: result.count 
    });
  } catch (error) {
    console.error('Error during manual sync:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to sync calendar events',
      details: error.message 
    });
  }
});

export default router; 