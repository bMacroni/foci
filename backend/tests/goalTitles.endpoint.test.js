import request from 'supertest';
import app from '../src/server.js';
import { vi, describe, it, expect, beforeEach } from 'vitest';

// Mock auth middleware to inject a fake user
vi.mock('../src/middleware/auth.js', () => ({
  requireAuth: (req, _res, next) => {
    req.user = { id: 'test-user-id', email: 'test@example.com' };
    next();
  }
}));

// Mock Supabase client chain used by goals controller
vi.mock('@supabase/supabase-js', () => {
  const chain = () => {
    const obj = {
      select: vi.fn(() => obj),
      eq: vi.fn(() => obj),
      ilike: vi.fn(() => obj),
      order: vi.fn(() => ({ data: [{ title: 'Fitness' }, { title: 'Learn React' }], error: null })),
    };
    return obj;
  };
  const from = vi.fn(() => chain());
  return { createClient: vi.fn(() => ({ from })) };
});

describe('GET /api/goals/titles', () => {
  beforeEach(() => {
    process.env.NODE_ENV = 'test';
  });

  it('returns titles array in response body', async () => {
    const res = await request(app)
      .get('/api/goals/titles?search=ea')
      .set('Authorization', 'Bearer test')
      .expect(200);

    expect(Array.isArray(res.body.titles)).toBe(true);
    expect(res.body.titles).toEqual(['Fitness', 'Learn React']);
  });
});


