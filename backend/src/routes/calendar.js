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

// Get upcoming calendar events
router.get('/events', requireAuth, async (req, res) => {
  try {
    const maxResults = parseInt(req.query.maxResults) || 10;
    const events = await listCalendarEvents(req.user.id, maxResults);
    // Always return 200 with an array (possibly empty)
    res.json(events);
  } catch (error) {
    console.error('Error getting calendar events:', error);
    res.status(500).json({ error: 'Failed to get calendar events' });
  }
});

// Get events for a specific date
router.get('/events/date', requireAuth, async (req, res) => {
  const { date } = req.query;
  // Validate date (simple regex for YYYY-MM-DD)
  if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    return res.status(400).json({ error: 'Missing or invalid date parameter (expected YYYY-MM-DD)' });
  }
  try {
    const events = await getEventsForDate(req.user.id, date);
    res.json(events);
  } catch (error) {
    if (error.message.includes('No Google tokens found')) {
      res.status(401).json({ error: 'Google Calendar not connected. Please connect your Google account first.' });
    } else {
      res.status(500).json({ error: 'Failed to fetch events for date' });
    }
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
    
    if (tokens) {
      res.json({ 
        connected: true, 
        email: req.user.email,
        lastUpdated: tokens.updated_at 
      });
    } else {
      res.json({ connected: false });
    }
  } catch (error) {
    console.error('Error checking calendar status:', error);
    res.status(500).json({ error: 'Failed to check calendar status' });
  }
});

export default router; 