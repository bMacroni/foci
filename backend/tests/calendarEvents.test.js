// Set NODE_ENV to 'test' before importing app
process.env.NODE_ENV = 'test';

import { vi } from 'vitest';
// Mock requireAuth before importing app
vi.mock('../src/middleware/auth.js', () => ({
  requireAuth: (req, res, next) => {
    req.user = { id: 'test-user', email: 'test@example.com' };
    next();
  },
}));

import request from 'supertest';
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import app from '../src/server';
import * as calendarService from '../src/utils/calendarService';

let server;
beforeAll((done) => {
  server = app.listen(0, done);
});
afterAll((done) => {
  server.close(done);
});

describe('GET /api/calendar/events/date', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should return events for a valid date with events', async () => {
    vi.spyOn(calendarService, 'getEventsForDate').mockResolvedValue([
      {
        id: 'event1',
        title: 'Team Meeting',
        start: '2024-06-10T10:00:00',
        end: '2024-06-10T11:00:00',
        location: 'Zoom',
      },
    ]);
    const res = await request(server).get('/api/calendar/events/date?date=2024-06-10');
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBe(1);
    expect(res.body[0].title).toBe('Team Meeting');
  });

  it('should return an empty array for a valid date with no events', async () => {
    vi.spyOn(calendarService, 'getEventsForDate').mockResolvedValue([]);
    const res = await request(server).get('/api/calendar/events/date?date=2024-06-11');
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBe(0);
  });

  it('should return 400 for missing date parameter', async () => {
    const res = await request(server).get('/api/calendar/events/date');
    expect(res.status).toBe(400);
    expect(res.body.error).toBeDefined();
  });

  it('should return 400 for invalid date format', async () => {
    const res = await request(server).get('/api/calendar/events/date?date=not-a-date');
    expect(res.status).toBe(400);
    expect(res.body.error).toBeDefined();
  });

  it('should return 500 for internal server error', async () => {
    vi.spyOn(calendarService, 'getEventsForDate').mockRejectedValue(new Error('DB error'));
    const res = await request(server).get('/api/calendar/events/date?date=2024-06-10');
    expect(res.status).toBe(500);
    expect(res.body.error).toBeDefined();
  });
}); 