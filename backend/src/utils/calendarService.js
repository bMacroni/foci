import { google } from 'googleapis';
import { getGoogleTokens } from './googleTokenStorage.js';
import { dateParser } from './dateParser.js';

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

export async function listCalendarEvents(userId, maxResults = 10) {
  try {
    const calendar = await getCalendarClient(userId);
    
    const response = await calendar.events.list({
      calendarId: 'primary',
      timeMin: new Date().toISOString(),
      maxResults: maxResults,
      singleEvents: true,
      orderBy: 'startTime',
    });

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
  try {
    const calendar = await getCalendarClient(userId);
    
    const event = {
      summary: eventData.summary,
      description: eventData.description,
      start: {
        dateTime: eventData.startTime,
        timeZone: eventData.timeZone || 'UTC',
      },
      end: {
        dateTime: eventData.endTime,
        timeZone: eventData.timeZone || 'UTC',
      },
    };

    const response = await calendar.events.insert({
      calendarId: 'primary',
      resource: event,
    });

    return response.data;
  } catch (error) {
    console.error('Error creating calendar event:', error);
    throw error;
  }
}

export async function updateCalendarEvent(userId, eventId, eventData) {
  try {
    const calendar = await getCalendarClient(userId);
    
    const event = {
      summary: eventData.summary,
      description: eventData.description,
      start: {
        dateTime: eventData.startTime,
        timeZone: eventData.timeZone || 'UTC',
      },
      end: {
        dateTime: eventData.endTime,
        timeZone: eventData.timeZone || 'UTC',
      },
    };

    const response = await calendar.events.update({
      calendarId: 'primary',
      eventId: eventId,
      resource: event,
    });

    return response.data;
  } catch (error) {
    console.error('Error updating calendar event:', error);
    throw error;
  }
}

export async function deleteCalendarEvent(userId, eventId) {
  try {
    const calendar = await getCalendarClient(userId);
    
    await calendar.events.delete({
      calendarId: 'primary',
      eventId: eventId,
    });

    return { success: true };
  } catch (error) {
    console.error('Error deleting calendar event:', error);
    throw error;
  }
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
  if (!dateInput) {
    // Default to today if no date provided
    const today = new Date();
    const yyyy = today.getFullYear();
    const mm = String(today.getMonth() + 1).padStart(2, '0');
    const dd = String(today.getDate()).padStart(2, '0');
    return {
      startDate: `${yyyy}-${mm}-${dd}`,
      endDate: `${yyyy}-${mm}-${dd}`
    };
  }

  // Try to parse as a specific date first (YYYY-MM-DD)
  if (/^\d{4}-\d{2}-\d{2}$/.test(dateInput)) {
    return {
      startDate: dateInput,
      endDate: dateInput
    };
  }

  // Use DateParser utility to parse natural language
  const parsedDate = dateParser.parse(dateInput);
  const parsed = new Date(parsedDate);
  
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
    } else if (dateInput.toLowerCase().includes('month')) {
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
    } else {
      // For specific dates like "tomorrow", "today", "next Friday"
      return {
        startDate: dateStr,
        endDate: dateStr
      };
    }
  }

  // Fallback to today if parsing fails
  const today = new Date();
  const yyyy = today.getFullYear();
  const mm = String(today.getMonth() + 1).padStart(2, '0');
  const dd = String(today.getDate()).padStart(2, '0');
  return {
    startDate: `${yyyy}-${mm}-${dd}`,
    endDate: `${yyyy}-${mm}-${dd}`
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
    const calendar = await getCalendarClient(userId);
    
    // Parse the date input (could be natural language like "tomorrow", "next week")
    const dateRange = parseDateRange(args.date);
    
    // Build query parameters
    const queryParams = {
      calendarId: 'primary',
      singleEvents: true,
      orderBy: 'startTime',
      maxResults: 50 // Limit results for performance
    };

    // Add date filtering based on parsed range
    if (dateRange.startDate && dateRange.endDate) {
      const timeMin = new Date(dateRange.startDate + 'T00:00:00Z').toISOString();
      const timeMax = new Date(dateRange.endDate + 'T23:59:59Z').toISOString();
      queryParams.timeMin = timeMin;
      queryParams.timeMax = timeMax;
    } else {
      // If no date specified, get events from now onwards
      queryParams.timeMin = new Date().toISOString();
    }

    const response = await calendar.events.list(queryParams);
    
    // Format events for AI consumption
    const events = response.data.items.map(event => ({
      id: event.id,
      title: event.summary || 'Untitled Event',
      description: event.description || '',
      start: event.start?.dateTime || event.start?.date,
      end: event.end?.dateTime || event.end?.date,
      location: event.location || '',
      timeZone: event.start?.timeZone || 'UTC'
    }));

    return events;
  } catch (error) {
    console.error('Error in readCalendarEventFromAI:', error);
    throw error;
  }
}

/**
 * AI-specific function to lookup calendar events by title
 * @param {string} userId - User ID
 * @param {string} token - User token (for consistency with other lookup functions)
 * @returns {Promise<Array>} events with IDs and titles
 */
export async function lookupCalendarEventbyTitle(userId, token) {
  try {
    if (!token) {
      console.log('ERROR: No token provided to lookupCalendarEventbyTitle');
      return [];
    }

    const calendar = await getCalendarClient(userId);
    
    // Get events from now onwards (last 30 days and next 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const thirtyDaysFromNow = new Date();
    thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);

    const response = await calendar.events.list({
      calendarId: 'primary',
      timeMin: thirtyDaysAgo.toISOString(),
      timeMax: thirtyDaysFromNow.toISOString(),
      singleEvents: true,
      orderBy: 'startTime',
      maxResults: 100 // Get more events for better lookup
    });

    // Format events for AI lookup (similar to task/goal lookup pattern)
    const events = response.data.items.map(event => ({
      id: event.id,
      title: event.summary || 'Untitled Event',
      start: event.start?.dateTime || event.start?.date,
      end: event.end?.dateTime || event.end?.date,
      location: event.location || '',
      description: event.description || ''
    }));

    return events;
  } catch (error) {
    console.error('Error in lookupCalendarEventbyTitle:', error);
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
    // Parse natural language date/time expressions
    let startDateTime = null;
    let endDateTime = null;
    
    // Handle different input formats
    if (args.start_time && args.end_time) {
      // Direct ISO timestamps provided
      startDateTime = args.start_time;
      endDateTime = args.end_time;
    } else if (args.date || args.time) {
      // Natural language date/time provided
      const dateStr = args.date ? dateParser.parse(args.date) : dateParser.parse('today');
      const timeStr = args.time ? parseTimeExpression(args.time) : '09:00'; // Default to 9 AM
      
      if (!dateStr) {
        throw new Error('Could not parse the date expression');
      }
      
      startDateTime = combineDateAndTime(dateStr, timeStr, args.time_zone);
      
      // Calculate end time (default to 1 hour duration)
      const duration = args.duration || 60; // minutes
      const endTime = new Date(startDateTime);
      endTime.setMinutes(endTime.getMinutes() + duration);
      endDateTime = endTime.toISOString();
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
    
    // Create the calendar event
    const createdEvent = await createCalendarEvent(userId, eventData);
    
    return {
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
  } catch (error) {
    console.error('Error in createCalendarEventFromAI:', error);
    throw error;
  }
} 