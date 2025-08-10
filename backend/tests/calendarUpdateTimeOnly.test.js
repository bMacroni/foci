import { describe, it, expect, vi, beforeEach } from 'vitest';
import { updateCalendarEventFromAI } from '../src/utils/calendarService.js';

// Mock Supabase client used inside calendarService.js
vi.mock('@supabase/supabase-js', () => {
  const chain = () => {
    const obj = {
      select: vi.fn(() => obj),
      update: vi.fn(() => obj),
      insert: vi.fn(() => obj),
      delete: vi.fn(() => obj),
      eq: vi.fn(() => obj),
      order: vi.fn(() => obj),
      gte: vi.fn(() => obj),
      lte: vi.fn(() => obj),
      single: vi.fn(async () => ({
        data: {
          id: 'evt-1',
          title: 'Standup',
          description: 'Daily sync',
          start_time: '2025-01-10T15:00:00.000Z',
          end_time: '2025-01-10T15:30:00.000Z',
          location: 'Zoom'
        },
        error: null
      })),
    };
    return obj;
  };
  const from = vi.fn(() => chain());
  return { createClient: vi.fn(() => ({ from })) };
});

describe('Calendar update with time-only input', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('preserves date and duration when only start_time is a time-of-day string', async () => {
    const userId = 'user-1';
    const args = { id: 'evt-1', start_time: '10:00 AM' }; // only time provided
    const userContext = { timeZone: 'America/Chicago' };

    const updated = await updateCalendarEventFromAI(args, userId, userContext);

    expect(updated).toBeDefined();
    expect(updated.id).toBe('evt-1');
    // Should preserve original 30m duration
    const start = new Date(updated.start_time);
    const end = new Date(updated.end_time);
    expect((end - start) / (1000 * 60)).toBe(30);
  });
});


