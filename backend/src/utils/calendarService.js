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
  const { summary, title, description, startTime, endTime, location } = eventData;
  const eventTitle = title || summary || 'Untitled Event';
  let query = supabase
    .from('calendar_events')
    .update({
      title: eventTitle,
      description: description || '',
      start_time: startTime,
      end_time: endTime,
      location: location || '',
      updated_at: new Date().toISOString()
    })
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
  // Only include fields that are present in args
  const eventData = {};
  if (args.title !== undefined) eventData.title = args.title;
  if (args.description !== undefined) eventData.description = args.description;
  if (args.start_time !== undefined) eventData.startTime = args.start_time;
  if (args.end_time !== undefined) eventData.endTime = args.end_time;
  if (args.location !== undefined) eventData.location = args.location;
  // Add other fields as needed
  return await updateCalendarEvent(userId, args.id, eventData);
} 

export async function deleteCalendarEvent(userId, eventId) {
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
function parseDateRange(dateInput) {
  // Always use America/Chicago timezone for 'today' and natural language parsing
  function getChicagoToday() {
    const chicagoNow = new Date(new Date().toLocaleString('en-US', { timeZone: 'America/Chicago' }));
    const yyyy = chicagoNow.getFullYear();
    const mm = String(chicagoNow.getMonth() + 1).padStart(2, '0');
    const dd = String(chicagoNow.getDate()).padStart(2, '0');
    return { yyyy, mm, dd, dateStr: `${yyyy}-${mm}-${dd}` };
  }

  if (!dateInput) {
    // Default to today in CST/CDT
    const { dateStr } = getChicagoToday();
    return {
      startDate: dateStr,
      endDate: dateStr
    };
  }

  // Try to parse as a specific date first (YYYY-MM-DD)
  if (/^\d{4}-\d{2}-\d{2}$/.test(dateInput)) {
    return {
      startDate: dateInput,
      endDate: dateInput
    };
  }

  // Use DateParser utility to parse natural language, but base it on CST/CDT
  // Patch chrono-node to use CST as the base date
  let parsedDate;
  try {
    // If dateParser supports passing a base date, use it; otherwise, patch chrono-node directly
    const chicagoNow = new Date(new Date().toLocaleString('en-US', { timeZone: 'America/Chicago' }));
    parsedDate = dateParser.parseWithChrono ? dateParser.parseWithChrono(dateInput, chicagoNow) : null;
    if (!parsedDate) {
      // Fallback: temporarily override Date for chrono-node
      parsedDate = dateParser.parse(dateInput);
    }
  } catch (e) {
    parsedDate = null;
  }
  const parsed = parsedDate ? new Date(parsedDate) : null;

  if (parsed && !isNaN(parsed)) {
    const yyyy = parsed.getFullYear();
    const mm = String(parsed.getMonth() + 1).padStart(2, '0');
    const dd = String(parsed.getDate()).padStart(2, '0');
    const dateStr = `${yyyy}-${mm}-${dd}`;

    // Handle different types of date inputs
    if (dateInput.toLowerCase().includes('week')) {
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
    }
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
  } else if (parsed) {
    // For specific dates like "tomorrow", "today", "next Friday"
    return {
      startDate: dateStr,
      endDate: dateStr
    };
  }

  // Fallback to today in CST/CDT if parsing fails
  const { dateStr } = getChicagoToday();
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
    // console.log('=== READ CALENDAR EVENT DEBUG ===');
    // console.log('User ID:', userId);
    // console.log('Arguments:', JSON.stringify(args, null, 2));
    // console.log('User Context:', JSON.stringify(userContext, null, 2));

    // Parse the date input (could be natural language like "tomorrow", "next week")
    const dateRange = parseDateRange(args.date);
    // console.log('Parsed date range:', JSON.stringify(dateRange, null, 2));

    let timeMin, timeMax;
    // Add CST offset for date range (America/Chicago is UTC-5 or UTC-6, but we'll use -05:00 for now)
    // If you want to handle daylight saving, consider using a timezone library
    const CST_OFFSET = '-05:00'; // Adjust if needed for daylight saving
    if (dateRange.startDate && dateRange.endDate) {
      timeMin = new Date(dateRange.startDate + 'T00:00:00' + CST_OFFSET);
      timeMax = new Date(dateRange.endDate + 'T23:59:59' + CST_OFFSET);
      // console.log('Using CST date range:', { timeMin, timeMax });
    } else {
      // If no date specified, get events from now onwards (in CST)
      const now = new Date();
      // Convert now to CST string (approximate, for robust use a timezone lib)
      const nowCST = new Date(now.toLocaleString('en-US', { timeZone: 'America/Chicago' }));
      timeMin = nowCST;
      timeMax = null;
      // console.log('Using current time onwards (CST):', timeMin);
    }

    // Query the local database for events
    let dbEvents = await getCalendarEventsFromDB(userId, 50, timeMin, timeMax);
    // console.log('DB events count:', dbEvents.length);

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

    // console.log('Formatted events:', JSON.stringify(events, null, 2));
    // console.log('Returning', events.length, 'events');
    // console.log('=== END READ CALENDAR EVENT DEBUG ===');

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
export async function lookupCalendarEventbyTitle(userId, searchString, date) {
  try {
    if (!searchString || typeof searchString !== 'string') {
      return [];
    }
    // Enhanced logging for debugging
    const logLine = `LOOKUP SEARCH: ${searchString} DATE: ${date}\n`;
    console.log(logLine.trim());
    fs.appendFileSync('event_lookup_debug.log', logLine);
    let query = supabase
      .from('calendar_events')
      .select('id, title, start_time, end_time, location, description')
      .eq('user_id', userId)
      .ilike('title', `%${searchString}%`);
    // Date filtering
    if (date) {
      const dateRange = parseDateRange(date);
      if (dateRange.startDate && dateRange.endDate) {
        const CST_OFFSET = '-05:00'; // Adjust if needed for daylight saving
        const timeMin = new Date(dateRange.startDate + 'T00:00:00' + CST_OFFSET);
        const timeMax = new Date(dateRange.endDate + 'T23:59:59' + CST_OFFSET);
        query = query.gte('start_time', timeMin.toISOString()).lte('start_time', timeMax.toISOString());
      }
    }
    const { data, error } = await query;
    if (error) {
      // console.error('Error in lookupCalendarEventbyTitle:', error);
      throw error;
    }
    // Log only the count of DB results
    const countLog = `DB EVENTS COUNT: ${data ? data.length : 0}\n`;
    console.log(countLog.trim());
    fs.appendFileSync('event_lookup_debug.log', countLog);
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
  
  // Create a date object in the local timezone
  const dateTimeStr = `${dateStr}T${timeStr}:00`;
  
  // Create the date in local timezone (don't add Z to keep it local)
  const localDate = new Date(dateTimeStr);
  
  // Return ISO string in local timezone
  return localDate.toISOString();
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
    // console.log('=== CALENDAR EVENT CREATION DEBUG ===');
    // console.log('User ID:', userId);
    // console.log('Arguments:', JSON.stringify(args, null, 2));
    // console.log('User Context:', JSON.stringify(userContext, null, 2));
    
    // Parse natural language date/time expressions
    let startDateTime = null;
    let endDateTime = null;
    
    // Handle different input formats
    if (args.start_time && args.end_time) {
      // Direct ISO timestamps provided
      startDateTime = args.start_time;
      endDateTime = args.end_time;
      // console.log('Using direct timestamps:', { startDateTime, endDateTime });
    } else if (args.date || args.time) {
      // Natural language date/time provided
      const dateStr = args.date ? dateParser.parse(args.date) : dateParser.parse('today');
      const timeStr = args.time ? parseTimeExpression(args.time) : '09:00'; // Default to 9 AM
      
      // console.log('Parsed date/time:', { dateStr, timeStr });
      
      if (!dateStr) {
        throw new Error('Could not parse the date expression');
      }
      
      startDateTime = combineDateAndTime(dateStr, timeStr, args.time_zone);
      
      // Calculate end time (default to 1 hour duration)
      const duration = args.duration || 60; // minutes
      const endTime = new Date(startDateTime);
      endTime.setMinutes(endTime.getMinutes() + duration);
      endDateTime = endTime.toISOString();
      
      // console.log('Calculated times:', { startDateTime, endDateTime, duration });
    } else {
      throw new Error('Either start_time/end_time or date/time must be provided');
    }
    
    // Prepare event data
    const eventData = {
      summary: args.title || 'Untitled Event',
      description: args.description || '',
      startTime: startDateTime,
      endTime: endDateTime,
      timeZone: args.time_zone || 'UTC',
      location: args.location // Always include location, even if undefined
    };
    
    // console.log('Event data to create:', JSON.stringify(eventData, null, 2));
    
    // Create the calendar event
    // console.log('Attempting to create calendar event...');
    const createdEvent = await createCalendarEvent(userId, eventData);
    // console.log('Calendar event created successfully:', JSON.stringify(createdEvent, null, 2));
    
    const result = {
      success: true,
      event: {
        id: createdEvent.id,
        title: createdEvent.summary,
        description: createdEvent.description,
        start: createdEvent.start?.dateTime,
        end: createdEvent.end?.dateTime,
        location: createdEvent.location, // Always include location
        timeZone: createdEvent.start?.timeZone
      }
    };
    
    // console.log('Returning result:', JSON.stringify(result, null, 2));
    // console.log('=== END CALENDAR EVENT CREATION DEBUG ===');
    
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
