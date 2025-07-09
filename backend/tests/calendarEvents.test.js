// Set NODE_ENV to 'test' before importing app
process.env.NODE_ENV = 'test';

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { readCalendarEventFromAI, lookupCalendarEventbyTitle } from '../src/utils/calendarService.js';

// Mock the Google Calendar API
vi.mock('googleapis', () => ({
  google: {
    auth: {
      OAuth2: vi.fn().mockImplementation(() => ({
        setCredentials: vi.fn()
      }))
    },
    calendar: vi.fn().mockReturnValue({
      events: {
        list: vi.fn()
      }
    })
  }
}));

// Mock the token storage
vi.mock('../src/utils/googleTokenStorage.js', () => ({
  getGoogleTokens: vi.fn().mockResolvedValue({
    access_token: 'mock_access_token',
    refresh_token: 'mock_refresh_token',
    scope: 'https://www.googleapis.com/auth/calendar',
    token_type: 'Bearer',
    expiry_date: Date.now() + 3600000
  })
}));

// Mock chrono-node
vi.mock('chrono-node', () => ({
  parseDate: vi.fn()
}));

describe('Calendar AI Functions', () => {
  const mockUserId = 'test-user-123';
  const mockToken = 'mock-token';
  const mockUserContext = { token: mockToken };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('readCalendarEventFromAI', () => {
    it('should return formatted events when specific date is provided', async () => {
      const mockEvents = [
        {
          id: 'event1',
          summary: 'Test Meeting',
          description: 'A test meeting',
          start: { dateTime: '2024-01-15T10:00:00Z' },
          end: { dateTime: '2024-01-15T11:00:00Z' },
          location: 'Conference Room A',
          timeZone: 'America/New_York'
        }
      ];

      const { google } = await import('googleapis');
      const mockCalendar = google.calendar();
      mockCalendar.events.list.mockResolvedValue({
        data: { items: mockEvents }
      });

      const result = await readCalendarEventFromAI(
        { date: '2024-01-15' },
        mockUserId,
        mockUserContext
      );

      expect(result).toEqual([
        {
          id: 'event1',
          title: 'Test Meeting',
          description: 'A test meeting',
          start: '2024-01-15T10:00:00Z',
          end: '2024-01-15T11:00:00Z',
          location: 'Conference Room A',
          timeZone: 'America/New_York'
        }
      ]);
    });

    it('should handle natural language dates like "tomorrow"', async () => {
      const mockEvents = [
        {
          id: 'event2',
          summary: 'Future Meeting',
          description: 'A future meeting',
          start: { dateTime: '2024-12-16T14:00:00Z' },
          end: { dateTime: '2024-12-16T15:00:00Z' },
          location: '',
          timeZone: 'UTC'
        }
      ];

      const { google } = await import('googleapis');
      const mockCalendar = google.calendar();
      mockCalendar.events.list.mockResolvedValue({
        data: { items: mockEvents }
      });

      // Mock chrono to return tomorrow's date
      const { parseDate } = await import('chrono-node');
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      parseDate.mockReturnValue(tomorrow);

      const result = await readCalendarEventFromAI(
        { date: 'tomorrow' },
        mockUserId,
        mockUserContext
      );

      expect(result).toEqual([
        {
          id: 'event2',
          title: 'Future Meeting',
          description: 'A future meeting',
          start: '2024-12-16T14:00:00Z',
          end: '2024-12-16T15:00:00Z',
          location: '',
          timeZone: 'UTC'
        }
      ]);
    });

    it('should handle "next week" and return week range', async () => {
      const mockEvents = [
        {
          id: 'event3',
          summary: 'Weekly Meeting',
          description: 'Weekly team sync',
          start: { dateTime: '2024-12-16T09:00:00Z' },
          end: { dateTime: '2024-12-16T10:00:00Z' },
          location: 'Zoom',
          timeZone: 'UTC'
        }
      ];

      const { google } = await import('googleapis');
      const mockCalendar = google.calendar();
      mockCalendar.events.list.mockResolvedValue({
        data: { items: mockEvents }
      });

      // Mock chrono to return next Monday
      const { parseDate } = await import('chrono-node');
      const nextMonday = new Date();
      nextMonday.setDate(nextMonday.getDate() + (8 - nextMonday.getDay())); // Next Monday
      parseDate.mockReturnValue(nextMonday);

      const result = await readCalendarEventFromAI(
        { date: 'next week' },
        mockUserId,
        mockUserContext
      );

      expect(result).toEqual([
        {
          id: 'event3',
          title: 'Weekly Meeting',
          description: 'Weekly team sync',
          start: '2024-12-16T09:00:00Z',
          end: '2024-12-16T10:00:00Z',
          location: 'Zoom',
          timeZone: 'UTC'
        }
      ]);
    });

    it('should return events from now onwards when no date is provided', async () => {
      const mockEvents = [
        {
          id: 'event2',
          summary: 'Future Meeting',
          description: 'A future meeting',
          start: { dateTime: '2024-12-15T14:00:00Z' },
          end: { dateTime: '2024-12-15T15:00:00Z' },
          location: '',
          timeZone: 'UTC'
        }
      ];

      const { google } = await import('googleapis');
      const mockCalendar = google.calendar();
      mockCalendar.events.list.mockResolvedValue({
        data: { items: mockEvents }
      });

      const result = await readCalendarEventFromAI(
        {},
        mockUserId,
        mockUserContext
      );

      expect(result).toEqual([
        {
          id: 'event2',
          title: 'Future Meeting',
          description: 'A future meeting',
          start: '2024-12-15T14:00:00Z',
          end: '2024-12-15T15:00:00Z',
          location: '',
          timeZone: 'UTC'
        }
      ]);
    });
  });

  describe('lookupCalendarEventbyTitle', () => {
    it('should return formatted events for lookup', async () => {
      const mockEvents = [
        {
          id: 'event1',
          summary: 'Team Meeting',
          description: 'Weekly team sync',
          start: { dateTime: '2024-01-15T09:00:00Z' },
          end: { dateTime: '2024-01-15T10:00:00Z' },
          location: 'Zoom',
          timeZone: 'America/New_York'
        },
        {
          id: 'event2',
          summary: 'Doctor Appointment',
          description: 'Annual checkup',
          start: { dateTime: '2024-01-16T14:00:00Z' },
          end: { dateTime: '2024-01-16T15:00:00Z' },
          location: 'Medical Center',
          timeZone: 'America/New_York'
        }
      ];

      const { google } = await import('googleapis');
      const mockCalendar = google.calendar();
      mockCalendar.events.list.mockResolvedValue({
        data: { items: mockEvents }
      });

      const result = await lookupCalendarEventbyTitle(mockUserId, mockToken);

      expect(result).toEqual([
        {
          id: 'event1',
          title: 'Team Meeting',
          start: '2024-01-15T09:00:00Z',
          end: '2024-01-15T10:00:00Z',
          location: 'Zoom',
          description: 'Weekly team sync'
        },
        {
          id: 'event2',
          title: 'Doctor Appointment',
          start: '2024-01-16T14:00:00Z',
          end: '2024-01-16T15:00:00Z',
          location: 'Medical Center',
          description: 'Annual checkup'
        }
      ]);
    });

    it('should return empty array when no token is provided', async () => {
      const result = await lookupCalendarEventbyTitle(mockUserId, null);
      expect(result).toEqual([]);
    });
  });
}); 