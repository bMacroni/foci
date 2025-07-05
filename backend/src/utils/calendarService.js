import { google } from 'googleapis';
import { getGoogleTokens } from './googleTokenStorage.js';

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