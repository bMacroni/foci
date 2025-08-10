import { google } from 'googleapis';
import { getGoogleTokens } from './googleTokenStorage.js';
import { dateParser } from './dateParser.js';
import { getCalendarEventsFromDB } from './syncService.js';
import { createClient } from '@supabase/supabase-js';
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
import { v4 as uuidv4, validate as validateUUID } from 'uuid';
import fs from 'fs';

export async function getCalendarClient(userId) {
  try {
    // Get stored tokens for the user
    const tokens = await getGoogleTokens(userId);
    if (!tokens) {
      throw new Error('No Google tokens found for user');
    }

    // Create OAuth2 client with user's tokens
    const oauth2Client = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      process.env.GOOGLE_REDIRECT_URI
    );

    // Set credentials
    oauth2Client.setCredentials({
      access_token: tokens.access_token,
      refresh_token: tokens.refresh_token,
      scope: tokens.scope,
      token_type: tokens.token_type,
      expiry_date: tokens.expiry_date
    });

    // Create calendar client
    const calendar = google.calendar({ version: 'v3', auth: oauth2Client });
    return calendar;
  } catch (error) {
    console.error('Error creating calendar client:', error);
    throw error;
  }
}

export async function listCalendarEvents(userId, maxResults = 10, timeMin = null, timeMax = null) {
  try {
    const calendar = await getCalendarClient(userId);
    
    // Default to current time if no timeMin provided
    const startTime = timeMin ? timeMin.toISOString() : new Date().toISOString();
    
    // Build request parameters
    const params = {
      calendarId: 'primary',
      timeMin: startTime,
      maxResults: maxResults,
      singleEvents: true,
      orderBy: 'startTime',
    };
    
    // Only add timeMax if it's provided
    if (timeMax) {
      params.timeMax = timeMax.toISOString();
    }
    
    const response = await calendar.events.list(params);

    return response.data.items;
  } catch (error) {
    if (error.message && error.message.includes('No Google tokens found for user')) {
      // Graceful fallback: return empty array if no tokens
      return [];
    }
    console.error('Error listing calendar events:', error);
    throw error;
  }
}

export async function createCalendarEvent(userId, eventData) {
  const id = uuidv4();
  const { summary, title, description, startTime, endTime, location } = eventData;
  const eventTitle = title || summary || 'Untitled Event';
  const { data, error } = await supabase
    .from('calendar_events')
    .insert([
      {
        id,
        user_id: userId,
        title: eventTitle,
        description: description || '',
        start_time: startTime,
        end_time: endTime,
        location: location || '',
        google_calendar_id: null, // Not synced yet
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }
    ])
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function updateCalendarEvent(userId, eventId, eventData) {
  // Validate eventId
  if (!eventId) {
    throw new Error('Event ID is required');
  }
  const { summary, title, description, startTime, endTime, location } = eventData;
  // Build update object only with provided fields to avoid overwriting existing values
  const updateFields = { updated_at: new Date().toISOString() };
  if (title !== undefined || summary !== undefined) {
    updateFields.title = title || summary; // if provided
  }
  if (description !== undefined) {
    updateFields.description = description;
  }
  if (startTime !== undefined) {
    updateFields.start_time = startTime;
  }
  if (endTime !== undefined) {
    updateFields.end_time = endTime;
  }
  if (location !== undefined) {
    updateFields.location = location;
  }

  let query = supabase
    .from('calendar_events')
    .update(updateFields)
    .eq('user_id', userId);
  if (validateUUID(eventId)) {
    query = query.eq('id', eventId);
  } else {
    query = query.eq('google_calendar_id', eventId);
  }
  const { data, error } = await query.select().single();
  if (error) throw error;
  return data;
}


export async function updateCalendarEventFromAI(args, userId, userContext) {
  if (!args.id) throw new Error('Event ID is required to update a calendar event');
  const tz = userContext?.timeZone || 'America/Chicago';

  // Fetch existing event so we can compute new times from a time-only input
  const { data: current, error: fetchErr } = await supabase
    .from('calendar_events')
    .select('id, title, description, start_time, end_time, location')
    .eq('user_id', userId)
    .eq('id', args.id)
    .single();
  if (fetchErr) throw fetchErr;

  // Helper to get YYYY-MM-DD for a given ISO in a specific timezone
  const getYmdInTz = (iso) => {
    const local = new Date(new Date(iso).toLocaleString('en-US', { timeZone: tz }));
    const yyyy = local.getFullYear();
    const mm = String(local.getMonth() + 1).padStart(2, '0');
    const dd = String(local.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  };

  const eventData = {};

  // Title/description/location only if explicitly provided (avoid overwriting)
  if (args.title !== undefined) eventData.title = args.title;
  if (args.description !== undefined) eventData.description = args.description;
  if (args.location !== undefined) eventData.location = args.location;

  // Compute start/end when a time-only is provided
  let newStartISO = undefined;
  let newEndISO = undefined;

  const providedStart = args.start_time;
  const providedEnd = args.end_time;

  const isTimeOnly = (v) => typeof v === 'string' && /^\d{1,2}(:\d{2})?\s*(AM|PM|am|pm)?$/.test(v.trim());
  const isIsoLike = (v) => typeof v === 'string' && /\d{4}-\d{2}-\d{2}T/.test(v);

  if (providedStart !== undefined) {
    if (isTimeOnly(providedStart)) {
      const dateYmd = getYmdInTz(current.start_time);
      const timeStr = parseTimeExpression(providedStart);
      newStartISO = combineDateAndTime(dateYmd, timeStr, tz);
    } else if (isIsoLike(providedStart)) {
      newStartISO = providedStart;
    }
  }

  if (providedEnd !== undefined) {
    if (isTimeOnly(providedEnd)) {
      // If only end time provided, use existing date (or newStart date if also provided)
      const baseIso = newStartISO || current.start_time;
      const dateYmd = getYmdInTz(baseIso);
      const timeStr = parseTimeExpression(providedEnd);
      newEndISO = combineDateAndTime(dateYmd, timeStr, tz);
    } else if (isIsoLike(providedEnd)) {
      newEndISO = providedEnd;
    }
  }

  // If only start time given, preserve original duration
  if (newStartISO && providedEnd === undefined) {
    const originalDurationMs = new Date(current.end_time).getTime() - new Date(current.start_time).getTime();
    const end = new Date(newStartISO);
    end.setTime(end.getTime() + (isNaN(originalDurationMs) ? 60 * 60 * 1000 : originalDurationMs));
    newEndISO = end.toISOString();
  }

  if (newStartISO) eventData.startTime = newStartISO;
  if (newEndISO) eventData.endTime = newEndISO;

  return await updateCalendarEvent(userId, args.id, eventData);
} 

export async function deleteCalendarEvent(userId, eventId) {
  // Validate eventId
  if (!eventId) {
    throw new Error('Event ID is required');
  }
  
  let query = supabase
    .from('calendar_events')
    .delete()
    .eq('user_id', userId);
  if (validateUUID(eventId)) {
    query = query.eq('id', eventId);
  } else {
    query = query.eq('google_calendar_id', eventId);
  }
  const { error } = await query;
  if (error) throw error;
  return { success: true };
}

// AI wrapper: accept args shape { id }
export async function deleteCalendarEventFromAI(args, userId, userContext) {
  if (!args || !args.id) {
    throw new Error('Event ID is required to delete a calendar event');
  }
  // Fetch event details first so we can confirm to the user after deletion
  const { data: existing, error: fetchErr } = await supabase
    .from('calendar_events')
    .select('id, title, description, start_time, end_time, location')
    .eq('user_id', userId)
    .eq('id', args.id)
    .single();
  if (fetchErr) {
    // If fetch fails, still attempt delete but return minimal info
    await deleteCalendarEvent(userId, args.id);
    return { success: true };
  }
  await deleteCalendarEvent(userId, args.id);
  return {
    success: true,
    event: {
      id: existing.id,
      title: existing.title || 'Untitled Event',
      description: existing.description || '',
      start: existing.start_time || null,
      end: existing.end_time || null,
      location: existing.location || ''
    }
  };
}

export async function getCalendarList(userId) {
  try {
    const calendar = await getCalendarClient(userId);
    
    const response = await calendar.calendarList.list();
    return response.data.items;
  } catch (error) {
    console.error('Error getting calendar list:', error);
    throw error;
  }
} 

/**
 * Fetches all events for a specific date (YYYY-MM-DD) for the user's primary calendar.
 * @param {string} userId
 * @param {string} date - in YYYY-MM-DD format
 * @returns {Promise<Array>} events
 */
export async function getEventsForDate(userId, date) {
  try {
    const calendar = await getCalendarClient(userId);
    // Calculate timeMin and timeMax for the date
    const timeMin = new Date(date + 'T00:00:00Z').toISOString();
    const timeMax = new Date(date + 'T23:59:59Z').toISOString();

    const response = await calendar.events.list({
      calendarId: 'primary',
      timeMin,
      timeMax,
      singleEvents: true,
      orderBy: 'startTime',
    });
    return response.data.items.map(event => ({
      id: event.id,
      title: event.summary,
      start: event.start?.dateTime || event.start?.date,
      end: event.end?.dateTime || event.end?.date,
      location: event.location || '',
      description: event.description || '',
    }));
  } catch (error) {
    console.error('Error fetching events for date:', error);
    throw error;
  }
}

/**
 * Helper function to parse natural language dates and convert to date ranges
 * @param {string} dateInput - Natural language date (e.g., "tomorrow", "next week", "2024-01-15")
 * @returns {Object} Object with startDate and endDate in YYYY-MM-DD format
 */
function parseDateRange(dateInput, timeZone = 'America/Chicago') {
  const DEBUG = process.env.DEBUG_LOGS === 'true';
  if (DEBUG) {
    console.log('=== PARSE DATE RANGE DEBUG ===');
    console.log('Input dateInput:', dateInput);
    console.log('Using timeZone:', timeZone);
  }
  
  function getLocalToday() {
    const localNow = new Date(new Date().toLocaleString('en-US', { timeZone }));
    const yyyy = localNow.getFullYear();
    const mm = String(localNow.getMonth() + 1).padStart(2, '0');
    const dd = String(localNow.getDate()).padStart(2, '0');
    const result = { yyyy, mm, dd, dateStr: `${yyyy}-${mm}-${dd}`, date: localNow };
    if (DEBUG) console.log('Local today:', result);
    return result;
  }

  if (!dateInput) {
    // Default to today in local TZ
    const { dateStr } = getLocalToday();
    const result = {
      startDate: dateStr,
      endDate: dateStr
    };
    if (DEBUG) console.log('No date input, defaulting to today:', result);
    return result;
  }

  // Try to parse as a specific date first (YYYY-MM-DD)
  if (/^\d{4}-\d{2}-\d{2}$/.test(dateInput)) {
    return {
      startDate: dateInput,
      endDate: dateInput
    };
  }

  // Use DateParser utility to parse natural language based on local TZ
  // Patch chrono-node to use CST as the base date
  let parsedDate;
  try {
    const baseNow = new Date(new Date().toLocaleString('en-US', { timeZone }));
    parsedDate = dateParser.parseWithChrono ? dateParser.parseWithChrono(dateInput, baseNow) : null;
    if (!parsedDate) {
      // Fallback: temporarily override Date for chrono-node
      parsedDate = dateParser.parse(dateInput);
    }
  } catch (e) {
    parsedDate = null;
  }
  const parsed = parsedDate ? new Date(parsedDate) : null;

  // Handle explicit relative keywords first
  const lower = String(dateInput).toLowerCase();
  if (['today', 'tomorrow', 'yesterday'].some(k => lower.includes(k))) {
    const { date } = getLocalToday();
    const d = new Date(date);
    if (lower.includes('tomorrow')) d.setDate(d.getDate() + 1);
    if (lower.includes('yesterday')) d.setDate(d.getDate() - 1);
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    return { startDate: `${yyyy}-${mm}-${dd}`, endDate: `${yyyy}-${mm}-${dd}` };
  }

  // Handle "weekend" (Saturday-Sunday) in local week
  if (lower.includes('weekend')) {
    const { date } = getLocalToday();
    const base = parsed && !isNaN(parsed) ? parsed : date;
    const baseDow = base.getDay();
    const saturday = new Date(base);
    const daysUntilSaturday = (6 - baseDow + 7) % 7;
    saturday.setDate(saturday.getDate() + daysUntilSaturday);
    const sunday = new Date(saturday);
    sunday.setDate(sunday.getDate() + 1);
    const sY = saturday.getFullYear();
    const sM = String(saturday.getMonth() + 1).padStart(2, '0');
    const sD = String(saturday.getDate()).padStart(2, '0');
    const eY = sunday.getFullYear();
    const eM = String(sunday.getMonth() + 1).padStart(2, '0');
    const eD = String(sunday.getDate()).padStart(2, '0');
    return { startDate: `${sY}-${sM}-${sD}`, endDate: `${eY}-${eM}-${eD}` };
  }

  if (parsed && !isNaN(parsed)) {
    const yyyy = parsed.getFullYear();
    const mm = String(parsed.getMonth() + 1).padStart(2, '0');
    const dd = String(parsed.getDate()).padStart(2, '0');
    const dateStr = `${yyyy}-${mm}-${dd}`;

    // Handle different types of date inputs
    if (lower.includes('week')) {
      // For "next week", "this week", etc. - get the full week
      const startOfWeek = new Date(parsed);
      startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay());
      const endOfWeek = new Date(startOfWeek);
      endOfWeek.setDate(endOfWeek.getDate() + 6);

      const startYyyy = startOfWeek.getFullYear();
      const startMm = String(startOfWeek.getMonth() + 1).padStart(2, '0');
      const startDd = String(startOfWeek.getDate()).padStart(2, '0');
      const endYyyy = endOfWeek.getFullYear();
      const endMm = String(endOfWeek.getMonth() + 1).padStart(2, '0');
      const endDd = String(endOfWeek.getDate()).padStart(2, '0');

      return {
        startDate: `${startYyyy}-${startMm}-${startDd}`,
        endDate: `${endYyyy}-${endMm}-${endDd}`
      };
    } else if (lower.includes('month')) {
      // For "next month", "this month", etc. - get the full month
      const startOfMonth = new Date(parsed.getFullYear(), parsed.getMonth(), 1);
      const endOfMonth = new Date(parsed.getFullYear(), parsed.getMonth() + 1, 0);

      const startYyyy = startOfMonth.getFullYear();
      const startMm = String(startOfMonth.getMonth() + 1).padStart(2, '0');
      const startDd = String(startOfMonth.getDate()).padStart(2, '0');
      const endYyyy = endOfMonth.getFullYear();
      const endMm = String(endOfMonth.getMonth() + 1).padStart(2, '0');
      const endDd = String(endOfMonth.getDate()).padStart(2, '0');

      return {
        startDate: `${startYyyy}-${startMm}-${startDd}`,
        endDate: `${endYyyy}-${endMm}-${endDd}`
      };
    }
    // Default: single-day range for inputs like "today", "tomorrow", specific weekdays, or a concrete date
    return {
      startDate: dateStr,
      endDate: dateStr
    };
  }

  // Fallback to today in local TZ if parsing fails
  const { dateStr } = getLocalToday();
  return {
    startDate: dateStr,
    endDate: dateStr
  };
}

/**
 * AI-specific function to read calendar events with optional date filtering
 * @param {Object} args - Arguments from Gemini AI
 * @param {string} userId - User ID
 * @param {Object} userContext - User context
 * @returns {Promise<Array>} events
 */
export async function readCalendarEventFromAI(args, userId, userContext) {
  try {
    const DEBUG = process.env.DEBUG_LOGS === 'true';
    if (DEBUG) {
      console.log('=== READ CALENDAR EVENT DEBUG ===');
      console.log('Args:', args);
      console.log('UserId:', userId);
      console.log('Date parameter:', args.date);
    }

    // Read calendar event processing

    // Parse the date input (could be natural language like "tomorrow", "next week")
  const dateRange = parseDateRange(args.date, userContext?.timeZone || 'America/Chicago');
    if (DEBUG) console.log('Parsed date range:', dateRange);
    // Date range parsed

    let timeMin, timeMax;
  // Compute offset for the provided timezone for the start day
  const baseStartLocal = new Date(dateRange.startDate + 'T00:00:00');
  const tz = userContext?.timeZone || 'America/Chicago';
  const offsetStart = new Date(baseStartLocal.toLocaleString('en-US', { timeZone: tz }));
  const diffMs = offsetStart.getTime() - baseStartLocal.getTime();
  const offsetHours = Math.round(diffMs / (60 * 60 * 1000));
  const sign = offsetHours >= 0 ? '+' : '-';
  const abs = Math.abs(offsetHours);
  const hh = String(abs).padStart(2, '0');
  const OFFSET = `${sign}${hh}:00`;
    if (dateRange.startDate && dateRange.endDate) {
      timeMin = new Date(dateRange.startDate + 'T00:00:00' + OFFSET);
      timeMax = new Date(dateRange.endDate + 'T23:59:59' + OFFSET);
      if (DEBUG) console.log('Time range:', { timeMin: timeMin.toISOString(), timeMax: timeMax.toISOString() });
    } else {
      const now = new Date();
      const nowCST = new Date(now.toLocaleString('en-US', { timeZone: 'America/Chicago' }));
      timeMin = nowCST;
      timeMax = null;
      if (DEBUG) console.log('No date specified, using current time onwards:', { timeMin: timeMin.toISOString() });
    }

    // Query the local database for events (DB stores UTC timestamps)
    let dbEvents = await getCalendarEventsFromDB(userId, 50, timeMin, timeMax);
    if (DEBUG) console.log('Database events found:', dbEvents.length);
    if (DEBUG) console.log('First few events:', dbEvents.slice(0, 3));

    // Additional filters
    if (args.location) {
      dbEvents = dbEvents.filter(event => event.location && event.location.toLowerCase().includes(args.location.toLowerCase()));
    }
    if (args.attendee) {
      // If you store attendees as an array or string, adjust this logic accordingly
      dbEvents = dbEvents.filter(event => event.attendees && event.attendees.some(a => a.toLowerCase().includes(args.attendee.toLowerCase())));
    }
    if (args.recurrence) {
      dbEvents = dbEvents.filter(event => event.recurrence && event.recurrence === args.recurrence);
    }
    if (args.time_range && args.time_range.start && args.time_range.end) {
      const start = new Date(args.time_range.start);
      const end = new Date(args.time_range.end);
      dbEvents = dbEvents.filter(event => {
        const eventStart = new Date(event.start);
        return eventStart >= start && eventStart <= end;
      });
    }

    // Format events for AI consumption
    const events = dbEvents.map(event => ({
      id: event.id,
      title: event.summary || 'Untitled Event',
      description: event.description || '',
      start: event.start?.dateTime || event.start,
      end: event.end?.dateTime || event.end,
      location: event.location || '',
      timeZone: event.start?.timeZone || 'UTC'
    }));

    // Events formatted and ready to return

    return events;
  } catch (error) {
    // console.error('=== READ CALENDAR EVENT ERROR ===');
    // console.error('Error in readCalendarEventFromAI:', error);
    // console.error('Error message:', error.message);
    // console.error('Error stack:', error.stack);
    // console.error('=== END READ CALENDAR EVENT ERROR ===');
    throw error;
  }
}

/**
 * AI-specific function to lookup calendar events by title
 * @param {string} userId - User ID
 * @param {string} searchString - Search string for event title
 * @returns {Promise<Array>} events with IDs and titles
 */
export async function lookupCalendarEventbyTitle(userId, searchString, date, timeZone = 'America/Chicago') {
  try {
    if (!searchString || typeof searchString !== 'string') {
      return [];
    }
    // Extract meaningful tokens from the search phrase (drop stopwords)
    const rawTokens = (searchString.toLowerCase().match(/[a-z0-9]+/g) || []);
    const stopwords = new Set(['the','a','an','with','at','on','in','for','to','of','and','or','my','meeting','event','appointment']);
    const tokens = Array.from(new Set(rawTokens.filter(t => t.length >= 3 && !stopwords.has(t))));
    
    const runQueryForDate = async (dateLabel, mode = 'and', anyColumn = false) => {
      let q = supabase
        .from('calendar_events')
        .select('id, title, start_time, end_time, location, description')
        .eq('user_id', userId)
        .ilike('title', `%${searchString}%`)
        .order('start_time', { ascending: true });
      // Replace broad title search with tokenized search strategies
      if (tokens.length > 0) {
        // Reset to base query without the broad title search
        q = supabase
          .from('calendar_events')
          .select('id, title, start_time, end_time, location, description')
          .eq('user_id', userId)
          .order('start_time', { ascending: true });
        if (mode === 'and') {
          // Require every token to appear in title
          for (const t of tokens) {
            q = q.ilike('title', `%${t}%`);
          }
        } else {
          // OR across tokens, optionally searching multiple columns
          const fields = anyColumn ? ['title','description','location'] : ['title'];
          const ors = [];
          for (const t of tokens) {
            for (const f of fields) ors.push(`${f}.ilike.%${t}%`);
          }
          if (ors.length > 0) q = q.or(ors.join(','));
        }
      }
      if (dateLabel) {
        const range = parseDateRange(dateLabel, timeZone);
        if (range?.startDate && range?.endDate) {
          const startLocal = new Date(new Date(`${range.startDate}T00:00:00`).toLocaleString('en-US', { timeZone }));
          const endLocal = new Date(new Date(`${range.endDate}T23:59:59`).toLocaleString('en-US', { timeZone }));
          q = q.gte('start_time', startLocal.toISOString()).lte('start_time', endLocal.toISOString());
        }
      }
      const { data, error } = await q;
      if (error) throw error;
      return data;
    };

    // First try the provided date (or today)
    const primaryDate = date || 'today';
    let data = await runQueryForDate(primaryDate, 'and');
    if ((!data || data.length === 0) && tokens.length > 0) {
      data = await runQueryForDate(primaryDate, 'or');
    }

    // If nothing found for today, try tomorrow automatically (common follow-up flows)
    if ((!data || data.length === 0) && (!date || /^today$/i.test(date))) {
      data = await runQueryForDate('tomorrow', 'and');
      if ((!data || data.length === 0) && tokens.length > 0) {
        data = await runQueryForDate('tomorrow', 'or', true); // broaden to any column
      }
    }

    // Log only the count of DB results
    // Format events for AI lookup
    return data.map(event => ({
      id: event.id,
      title: event.title || 'Untitled Event',
      start: event.start_time,
      end: event.end_time,
      location: event.location || '',
      description: event.description || ''
    }));
  } catch (error) {
    // console.error('Error in lookupCalendarEventbyTitle:', error);
    throw error;
  }
} 

/**
 * Helper function to parse natural language time expressions
 * @param {string} timeExpression - Natural language time (e.g., "10:00 AM", "2:30 PM", "15:30")
 * @returns {string} Time in HH:MM format (24-hour)
 */
function parseTimeExpression(timeExpression) {
  if (!timeExpression) return null;
  
  // Handle 12-hour format with AM/PM
  const timePattern = /^(\d{1,2}):?(\d{2})?\s*(AM|PM|am|pm)?$/i;
  const match = timeExpression.trim().match(timePattern);
  
  if (match) {
    let hours = parseInt(match[1]);
    const minutes = match[2] ? parseInt(match[2]) : 0;
    const period = match[3] ? match[3].toUpperCase() : null;
    
    // Convert 12-hour to 24-hour format
    if (period === 'PM' && hours !== 12) {
      hours += 12;
    } else if (period === 'AM' && hours === 12) {
      hours = 0;
    }
    
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
  }
  
  // Handle 24-hour format
  const militaryPattern = /^(\d{1,2}):(\d{2})$/;
  const militaryMatch = timeExpression.trim().match(militaryPattern);
  
  if (militaryMatch) {
    const hours = parseInt(militaryMatch[1]);
    const minutes = parseInt(militaryMatch[2]);
    
    if (hours >= 0 && hours <= 23 && minutes >= 0 && minutes <= 59) {
      return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
    }
  }
  
  return null;
}

/**
 * Helper function to combine date and time into ISO string
 * @param {string} dateStr - Date in YYYY-MM-DD format
 * @param {string} timeStr - Time in HH:MM format
 * @param {string} timeZone - Time zone (default: 'UTC')
 * @returns {string} ISO 8601 timestamp
 */
function combineDateAndTime(dateStr, timeStr, timeZone = 'UTC') {
  if (!dateStr || !timeStr) return null;

  // Build components
  const [yyyy, mm, dd] = dateStr.split('-').map((v) => parseInt(v, 10));
  const [HH, MM] = timeStr.split(':').map((v) => parseInt(v, 10));
  if (!yyyy || !mm || !dd || isNaN(HH) || isNaN(MM)) return null;

  // Create a UTC date from the provided wall time
  const asUtc = new Date(Date.UTC(yyyy, mm - 1, dd, HH, MM, 0));

  // Determine the timezone offset for that instant in the target time zone
  // Trick: format the UTC instant in the target tz, parse back to Date (system local),
  // and compute the delta. This yields the tz offset (incl. DST) in ms.
  const tzView = new Date(asUtc.toLocaleString('en-US', { timeZone }));
  const offsetMs = tzView.getTime() - asUtc.getTime();

  // We want the UTC instant that shows the requested wall time in the target tz
  const correctUtc = new Date(asUtc.getTime() - offsetMs);
  return correctUtc.toISOString();
}

// Parse relative times like "in 1 hour", "in 30 minutes"
function parseRelativeTimeToMinutes(input) {
  if (!input || typeof input !== 'string') return null;
  const m = input.trim().toLowerCase().match(/^in\s+(\d+)\s*(minute|minutes|min|hour|hours|hr|hrs)$/);
  if (!m) return null;
  const amount = parseInt(m[1], 10);
  const unit = m[2];
  if (isNaN(amount) || amount <= 0) return null;
  if (unit.startsWith('hour') || unit.startsWith('hr')) return amount * 60;
  return amount; // minutes
}

/**
 * AI-specific function to create calendar events with natural language date/time parsing
 * @param {Object} args - Arguments from Gemini AI
 * @param {string} userId - User ID
 * @param {Object} userContext - User context
 * @returns {Promise<Object>} created event
 */
export async function createCalendarEventFromAI(args, userId, userContext) {
  try {
    // Calendar event creation processing
    
    // Parse natural language date/time expressions
    let startDateTime = null;
    let endDateTime = null;
    
    // Handle different input formats
    if (args.start_time && args.end_time) {
      // Direct ISO timestamps provided
      startDateTime = args.start_time;
      endDateTime = args.end_time;
      // Using direct timestamps
    } else if (args.date || args.time) {
      // Natural language date/time provided
      const tz = userContext?.timeZone || 'America/Chicago';
      const relativeMinutes = args.time ? parseRelativeTimeToMinutes(args.time) : null;
      if (relativeMinutes !== null) {
        // Compute from now in the user's timezone
        const nowLocal = new Date(new Date().toLocaleString('en-US', { timeZone: tz }));
        const startLocal = new Date(nowLocal.getTime() + relativeMinutes * 60 * 1000);
        startDateTime = startLocal.toISOString();
        const endLocal = new Date(startLocal.getTime() + ((args.duration || 60) * 60 * 1000));
        endDateTime = endLocal.toISOString();
      } else {
        const dateStr = args.date ? dateParser.parse(args.date) : dateParser.parse('today');
        const timeStr = args.time ? parseTimeExpression(args.time) : '09:00'; // Default to 9 AM
      
      // Date/time parsed
      
      if (!dateStr) {
        throw new Error('Could not parse the date expression');
      }
      
        startDateTime = combineDateAndTime(dateStr, timeStr, tz);
      
      // Calculate end time (default to 1 hour duration)
        const duration = args.duration || 60; // minutes
        const endTime = new Date(startDateTime);
        endTime.setMinutes(endTime.getMinutes() + duration);
        endDateTime = endTime.toISOString();
      }
      
      // Times calculated
    } else {
      throw new Error('Either start_time/end_time or date/time must be provided');
    }
    
    // Prepare event data
    const eventData = {
      summary: args.title || 'Untitled Event',
      description: args.description || '',
      startTime: startDateTime,
      endTime: endDateTime,
      timeZone: userContext?.timeZone || 'America/Chicago',
      location: args.location // Always include location, even if undefined
    };
    
    // Creating calendar event
    const createdEvent = await createCalendarEvent(userId, eventData);
    // Calendar event created successfully
    
    const result = {
      success: true,
      event: {
        id: createdEvent.id,
        title: createdEvent.title || createdEvent.summary || 'Untitled Event',
        description: createdEvent.description || '',
        start: createdEvent.start_time || createdEvent.start?.dateTime || createdEvent.start || null,
        end: createdEvent.end_time || createdEvent.end?.dateTime || createdEvent.end || null,
        location: createdEvent.location || '',
        timeZone: userContext?.timeZone || 'America/Chicago'
      }
    };
    
    // Calendar event creation completed
    
    return result;
  } catch (error) {
    // console.error('=== CALENDAR EVENT CREATION ERROR ===');
    // console.error('Error in createCalendarEventFromAI:', error);
    // console.error('Error message:', error.message);
    // console.error('Error stack:', error.stack);
    // console.error('=== END CALENDAR EVENT CREATION ERROR ===');
    throw error;
  }
} 
