// Set NODE_ENV to 'test' before importing app
process.env.NODE_ENV = 'test';

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createCalendarEventFromAI } from '../src/utils/calendarService.js';

// Mock the Google Calendar API
vi.mock('googleapis', () => ({
  google: {
    auth: {
      OAuth2: vi.fn().mockImplementation(() => ({
        setCredentials: vi.fn(),
      })),
    },
    calendar: vi.fn(() => ({
      events: {
        insert: vi.fn().mockImplementation((params) => {
          // Return the actual event data that was passed in
          return Promise.resolve({
            data: {
              id: 'test-event-id',
              summary: params.resource.summary,
              description: params.resource.description,
              start: params.resource.start,
              end: params.resource.end,
              location: params.resource.location,
            },
          });
        }),
      },
    })),
  },
}));

// Mock the token storage
vi.mock('../src/utils/googleTokenStorage.js', () => ({
  getGoogleTokens: vi.fn().mockResolvedValue({
    access_token: 'test-access-token',
    refresh_token: 'test-refresh-token',
    scope: 'test-scope',
    token_type: 'Bearer',
    expiry_date: Date.now() + 3600000,
  }),
}));

let insertSpy;

describe('Calendar Event Creation with Natural Language Parsing', () => {
  const mockUserId = 'test-user-id';
  const mockUserContext = {};

  beforeEach(async () => {
    vi.clearAllMocks();
    // Set up the spy on the insert method
    const { google } = await import('googleapis');
    const mockCalendar = google.calendar();
    insertSpy = vi.spyOn(mockCalendar.events, 'insert');
  });

  it('should create an event with natural language date and time', async () => {
    const args = {
      title: 'Team Meeting',
      description: 'Weekly team sync',
      date: 'tomorrow',
      time: '10:00 AM',
      duration: 60,
    };

    const result = await createCalendarEventFromAI(args, mockUserId, mockUserContext);

    expect(result.success).toBe(true);
    expect(result.event.title).toBe('Team Meeting');
    expect(result.event.description).toBe('Weekly team sync');
    expect(result.event.start).toBeDefined();
    expect(result.event.end).toBeDefined();
  });

  it('should create an event with ISO timestamps', async () => {
    const args = {
      title: 'Doctor Appointment',
      description: 'Annual checkup',
      start_time: '2024-01-15T14:00:00Z',
      end_time: '2024-01-15T15:00:00Z',
      location: 'Medical Center',
    };

    const result = await createCalendarEventFromAI(args, mockUserId, mockUserContext);

    expect(result.success).toBe(true);
    expect(result.event.title).toBe('Doctor Appointment');
    expect(result.event.location).toBe('Medical Center');
  });

  it('should handle different time formats', async () => {
    const testCases = [
      { time: '10:00 AM', expected: '10:00' },
      { time: '2:30 PM', expected: '14:30' },
      { time: '15:30', expected: '15:30' },
      { time: '9:00 AM', expected: '09:00' },
    ];

    for (const testCase of testCases) {
      const args = {
        title: 'Test Event',
        date: 'today',
        time: testCase.time,
      };

      const result = await createCalendarEventFromAI(args, mockUserId, mockUserContext);
      expect(result.success).toBe(true);
    }
  });

  it('should use default duration when not specified', async () => {
    const args = {
      title: 'Quick Call',
      date: 'today',
      time: '3:00 PM',
      // No duration specified, should default to 60 minutes
    };

    const result = await createCalendarEventFromAI(args, mockUserId, mockUserContext);
    expect(result.success).toBe(true);
    
    // Verify the event duration is 1 hour
    const startTime = new Date(result.event.start);
    const endTime = new Date(result.event.end);
    const durationMinutes = (endTime - startTime) / (1000 * 60);
    expect(durationMinutes).toBe(60);
  });

  it('should handle custom duration', async () => {
    const args = {
      title: 'Long Meeting',
      date: 'today',
      time: '2:00 PM',
      duration: 120, // 2 hours
    };

    const result = await createCalendarEventFromAI(args, mockUserId, mockUserContext);
    expect(result.success).toBe(true);
    
    // Verify the event duration is 2 hours
    const startTime = new Date(result.event.start);
    const endTime = new Date(result.event.end);
    const durationMinutes = (endTime - startTime) / (1000 * 60);
    expect(durationMinutes).toBe(120);
  });

  it('should throw error for invalid date expression', async () => {
    const args = {
      title: 'Test Event',
      date: 'invalid-date-expression',
      time: '10:00 AM',
    };

    await expect(createCalendarEventFromAI(args, mockUserId, mockUserContext))
      .rejects.toThrow('Could not parse the date expression');
  });

  it('should throw error when neither date/time nor start_time/end_time provided', async () => {
    const args = {
      title: 'Test Event',
      // No date/time information provided
    };

    await expect(createCalendarEventFromAI(args, mockUserId, mockUserContext))
      .rejects.toThrow('Either start_time/end_time or date/time must be provided');
  });

  // NEW TESTS FOR IDENTIFIED ISSUES
  it('should only create one event per function call (no duplicates)', async () => {
    const args = {
      title: 'Single Meeting',
      date: 'Monday',
      time: '10:00 AM',
    };

    const { google } = await import('googleapis');
    const mockCalendar = google.calendar();
    const insertMock = mockCalendar.events.insert;

    const result = await createCalendarEventFromAI(args, mockUserId, mockUserContext);
    
    // Verify only one event was created
    expect(result.success).toBe(true);
    expect(result.event).toBeDefined();
    
    // Verify the Google Calendar API was only called once
    expect(insertMock.mock.calls.length).toBe(1);
  });

  it('should handle timezone correctly for "Monday at 10:00 AM"', async () => {
    const args = {
      title: 'Monday Meeting',
      date: 'Monday',
      time: '10:00 AM',
    };

    const result = await createCalendarEventFromAI(args, mockUserId, mockUserContext);
    
    expect(result.success).toBe(true);
    
    // Parse the start time and verify it's 10:00 AM in the local timezone
    const startTime = new Date(result.event.start);
    const localHours = startTime.getHours();
    const localMinutes = startTime.getMinutes();
    
    // The time should be 10:00 AM (10 hours, 0 minutes) in the local timezone
    expect(localHours).toBe(10);
    expect(localMinutes).toBe(0);
  });

  it('should handle timezone correctly for "2:30 PM"', async () => {
    const args = {
      title: 'Afternoon Meeting',
      date: 'today',
      time: '2:30 PM',
    };

    const result = await createCalendarEventFromAI(args, mockUserId, mockUserContext);
    
    expect(result.success).toBe(true);
    
    // Parse the start time and verify it's 2:30 PM in the local timezone
    const startTime = new Date(result.event.start);
    const localHours = startTime.getHours();
    const localMinutes = startTime.getMinutes();
    
    // The time should be 2:30 PM (14 hours, 30 minutes) in the local timezone
    expect(localHours).toBe(14);
    expect(localMinutes).toBe(30);
  });

  it('should handle timezone correctly for different time formats', async () => {
    const testCases = [
      { time: '9:00 AM', expectedHours: 9, expectedMinutes: 0 },
      { time: '3:45 PM', expectedHours: 15, expectedMinutes: 45 },
      { time: '12:00 PM', expectedHours: 12, expectedMinutes: 0 },
      { time: '12:00 AM', expectedHours: 0, expectedMinutes: 0 },
    ];

    for (const testCase of testCases) {
      const args = {
        title: `Test Meeting ${testCase.time}`,
        date: 'today',
        time: testCase.time,
      };

      const result = await createCalendarEventFromAI(args, mockUserId, mockUserContext);
      expect(result.success).toBe(true);
      
      const startTime = new Date(result.event.start);
      const localHours = startTime.getHours();
      const localMinutes = startTime.getMinutes();
      
      expect(localHours).toBe(testCase.expectedHours);
      expect(localMinutes).toBe(testCase.expectedMinutes);
    }
  });
}); 