import request from 'supertest';
import app from '../src/server.js';

// Ensure test environment
process.env.NODE_ENV = 'test';

describe('Server health endpoint', () => {
  it('GET /api/health returns OK with environment', async () => {
    const res = await request(app).get('/api/health');
    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({ status: 'OK' });
    expect(res.body.environment).toBeDefined();
  });
});


