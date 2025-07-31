import { listCalendarEvents } from './calendarService.js';
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

/**
 * Syncs Google Calendar events for a user into the local calendar_events table.
 * Upserts by user_id + google_event_id to prevent duplicates.
 * @param {string} userId
 * @returns {Promise<{success: boolean, count: number}>}
 */
export async function syncGoogleCalendarEvents(userId) {
  // 1. Fetch events from Google Calendar (90 days back + 365 days forward to match backend fetching)
  const maxResults = 2500; // Google API max
  
  // Calculate date range: 90 days back to 365 days forward (expanded to match backend)
  const now = new Date();
  const ninetyDaysAgo = new Date(now.getTime() - (90 * 24 * 60 * 60 * 1000));
  const oneYearFromNow = new Date(now.getTime() + (365 * 24 * 60 * 60 * 1000));
  
  const googleEvents = await listCalendarEvents(userId, maxResults, ninetyDaysAgo, oneYearFromNow);

  for (const event of googleEvents) {
    // 2. Upsert into calendar_events table
    const { id, summary, description, start, end, location } = event;
    const startTime = start?.dateTime || start?.date;
    const endTime = end?.dateTime || end?.date;

    // Upsert by google_calendar_id + user_id
    const { error } = await supabase
      .from('calendar_events')
      .upsert([
        {
          user_id: userId,
          google_calendar_id: id,
          title: summary || '',
          description: description || '',
          start_time: startTime,
          end_time: endTime,
          location: location || '',
          updated_at: new Date().toISOString()
        }
      ], { onConflict: 'google_calendar_id,user_id' });

    if (error) {
      console.error('Error upserting event:', error, event);
    }
  }
  return { success: true, count: googleEvents.length };
}

/**
 * Gets calendar events from the local database for a user
 * @param {string} userId
 * @param {number} maxResults - maximum number of events to return
 * @param {Date} timeMin - start time filter (optional)
 * @param {Date} timeMax - end time filter (optional)
 * @returns {Promise<Array>} events from database
 */
export async function getCalendarEventsFromDB(userId, maxResults = 100, timeMin = null, timeMax = null) {
  try {
    let query = supabase
      .from('calendar_events')
      .select('*')
      .eq('user_id', userId)
      .order('start_time', { ascending: true })
      .limit(maxResults);

    // Add time filters if provided
    if (timeMin) {
      query = query.gte('start_time', timeMin.toISOString());
    }
    if (timeMax) {
      query = query.lte('start_time', timeMax.toISOString());
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching events from database:', error);
      throw error;
    }

    // Transform database format to match Google Calendar API format
    return data.map(event => ({
      id: event.id, // Use the database ID instead of google_calendar_id
      summary: event.title,
      description: event.description,
      start: {
        dateTime: event.start_time,
        timeZone: 'UTC' // We store in UTC, frontend will handle timezone conversion
      },
      end: {
        dateTime: event.end_time,
        timeZone: 'UTC'
      },
      location: event.location,
      created: event.created_at,
      updated: event.updated_at
    }));
  } catch (error) {
    console.error('Error getting calendar events from database:', error);
    throw error;
  }
} 