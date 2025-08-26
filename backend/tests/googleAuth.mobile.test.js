import { describe, it, expect, beforeEach, vi } from 'vitest';
import request from 'supertest';
import { createClient } from '@supabase/supabase-js';
import admin from 'firebase-admin';

// Mock Firebase Admin SDK
vi.mock('firebase-admin', () => ({
  default: {
    auth: vi.fn(() => ({
      verifyIdToken: vi.fn(),
    })),
    initializeApp: vi.fn(() => ({
      auth: vi.fn(() => ({
        verifyIdToken: vi.fn(),
      })),
    })),
    apps: [],
    credential: {
      cert: vi.fn(),
    },
  },
}));

// Mock Supabase
const mockUpsert = vi.fn();
const mockSelect = vi.fn(() => ({
  eq: vi.fn(),
}));

const mockSupabase = {
  auth: {
    signUp: vi.fn(),
    signInWithPassword: vi.fn(),
    getUser: vi.fn(),
    admin: {
      listUsers: vi.fn(),
      createUser: vi.fn(),
      updateUserById: vi.fn(),
      generateLink: vi.fn(),
    },
  },
  from: vi.fn(() => ({
    upsert: mockUpsert,
    select: mockSelect,
  })),
};

vi.mock('@supabase/supabase-js', () => ({
  createClient: vi.fn(() => mockSupabase),
}));

// Import the app after mocking
let app;
beforeEach(async () => {
  vi.clearAllMocks();
  const { default: serverApp } = await import('../src/server.js');
  app = serverApp;
});

describe('POST /api/auth/google/mobile-signin', () => {
  const mockIdToken = 'mock-google-id-token';
  const mockAccessToken = 'mock-google-access-token';
  const mockEmail = 'test@example.com';
  const mockUserId = 'mock-user-id';

  beforeEach(() => {
    // Mock Firebase token verification
    const mockAuth = {
      verifyIdToken: vi.fn().mockResolvedValue({
        email: mockEmail,
        email_verified: true,
        sub: 'google-user-id',
        name: 'Test User',
        picture: 'https://example.com/avatar.jpg',
      }),
    };
    
    admin.auth.mockReturnValue(mockAuth);
  });

  describe('New User Sign Up', () => {
    it('should create a new user when email does not exist', async () => {
      // Mock Supabase to return no existing user (user not found)
      mockSupabase.auth.admin.listUsers.mockResolvedValue({
        data: { users: [] },
        error: null,
      });

      // Mock successful user creation
      mockSupabase.auth.admin.createUser.mockResolvedValue({
        data: { user: { id: mockUserId, email: mockEmail } },
        error: null,
      });

      // Mock successful password update
      mockSupabase.auth.admin.updateUserById.mockResolvedValue({
        data: { user: { id: mockUserId, email: mockEmail } },
        error: null,
      });

      // Mock successful sign in
      mockSupabase.auth.signInWithPassword.mockResolvedValue({
        data: {
          session: { access_token: 'mock-supabase-token' },
          user: { id: mockUserId, email: mockEmail },
        },
        error: null,
      });

      // Mock successful token storage
      mockSupabase.from().upsert.mockResolvedValue({
        data: [{ user_id: mockUserId }],
        error: null,
      });

      const response = await request(app)
        .post('/api/auth/google/mobile-signin')
        .send({
          idToken: mockIdToken,
          accessToken: mockAccessToken,
        })
        .expect(200);

      expect(response.body).toHaveProperty('token');
      expect(response.body).toHaveProperty('user');
      expect(response.body.user.email).toBe(mockEmail);
      expect(admin.auth().verifyIdToken).toHaveBeenCalledWith(mockIdToken);
      expect(mockSupabase.auth.admin.createUser).toHaveBeenCalled();
      expect(mockUpsert).toHaveBeenCalled();
    });

    it('should handle Supabase user creation errors', async () => {
      mockSupabase.auth.admin.listUsers.mockResolvedValue({
        data: { users: [] },
        error: null,
      });

      mockSupabase.auth.admin.createUser.mockResolvedValue({
        data: null,
        error: { message: 'User creation failed' },
      });

      const response = await request(app)
        .post('/api/auth/google/mobile-signin')
        .send({
          idToken: mockIdToken,
          accessToken: mockAccessToken,
        })
        .expect(500);

      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toContain('User creation failed');
    });
  });

  describe('Existing Google User Sign In', () => {
    it('should sign in existing Google user', async () => {
      // Mock existing user found
      mockSupabase.auth.admin.listUsers.mockResolvedValue({
        data: { users: [{ id: mockUserId, email: mockEmail }] },
        error: null,
      });

      // Mock successful password update
      mockSupabase.auth.admin.updateUserById.mockResolvedValue({
        data: { user: { id: mockUserId, email: mockEmail } },
        error: null,
      });

      // Mock successful sign in
      mockSupabase.auth.signInWithPassword.mockResolvedValue({
        data: {
          session: { access_token: 'mock-supabase-token' },
          user: { id: mockUserId, email: mockEmail },
        },
        error: null,
      });

      // Mock successful token storage
      mockSupabase.from().upsert.mockResolvedValue({
        data: [{ user_id: mockUserId }],
        error: null,
      });

      const response = await request(app)
        .post('/api/auth/google/mobile-signin')
        .send({
          idToken: mockIdToken,
          accessToken: mockAccessToken,
        })
        .expect(200);

      expect(response.body).toHaveProperty('token');
      expect(response.body).toHaveProperty('user');
    });
  });



  describe('Error Handling', () => {
    it('should handle invalid Google ID token', async () => {
      admin.auth().verifyIdToken.mockRejectedValue(new Error('Invalid token'));

      const response = await request(app)
        .post('/api/auth/google/mobile-signin')
        .send({
          idToken: 'invalid-token',
          accessToken: mockAccessToken,
        })
        .expect(401);

      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toContain('Invalid Google token');
    });

    it('should handle missing required fields', async () => {
      const response = await request(app)
        .post('/api/auth/google/mobile-signin')
        .send({
          idToken: mockIdToken,
          // Missing accessToken
        })
        .expect(400);

      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toContain('idToken and accessToken are required');
    });

    it('should handle unverified email', async () => {
      admin.auth().verifyIdToken.mockResolvedValue({
        email: mockEmail,
        email_verified: false,
        sub: 'google-user-id',
      });

      const response = await request(app)
        .post('/api/auth/google/mobile-signin')
        .send({
          idToken: mockIdToken,
          accessToken: mockAccessToken,
        })
        .expect(400);

      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toContain('Email must be verified');
    });
  });
});


