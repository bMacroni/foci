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
      getUserByEmail: vi.fn(),
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
      // Mock Supabase to return no existing user
      mockSupabase.auth.admin.getUserByEmail.mockResolvedValue({
        data: { user: null },
        error: { message: 'User not found' },
      });

      // Mock successful user creation
      mockSupabase.auth.admin.createUser.mockResolvedValue({
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
      mockSupabase.auth.admin.getUserByEmail.mockResolvedValue({
        data: { user: null },
        error: { message: 'User not found' },
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
      mockSupabase.auth.admin.getUserByEmail.mockResolvedValue({
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

  describe('Account Linking Required', () => {
    it('should return linking_required when email exists but user signed up with password', async () => {
      // Mock existing user found
      mockSupabase.auth.admin.getUserByEmail.mockResolvedValue({
        data: { user: { id: mockUserId, email: mockEmail } },
        error: null,
      });

      // Mock failed sign in (indicating password-based account)
      mockSupabase.auth.signInWithPassword.mockResolvedValue({
        data: null,
        error: { message: 'Invalid login credentials' },
      });

      const response = await request(app)
        .post('/api/auth/google/mobile-signin')
        .send({
          idToken: mockIdToken,
          accessToken: mockAccessToken,
        })
        .expect(409);

      expect(response.body).toEqual({ status: 'linking_required' });
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

describe('POST /api/auth/google/link-account', () => {
  const mockIdToken = 'mock-google-id-token';
  const mockAccessToken = 'mock-google-access-token';
  const mockPassword = 'correct-password';
  const mockEmail = 'test@example.com';
  const mockUserId = 'mock-user-id';

  beforeEach(() => {
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

  describe('Successful Account Linking', () => {
    it('should link Google account to existing password-based account', async () => {
      // Mock existing user found
      mockSupabase.auth.admin.getUserByEmail.mockResolvedValue({
        data: { user: { id: mockUserId, email: mockEmail } },
        error: null,
      });

      // Mock successful password verification
      mockSupabase.auth.signInWithPassword.mockResolvedValue({
        data: {
          session: { access_token: 'mock-supabase-token' },
          user: { id: mockUserId, email: mockEmail },
        },
        error: null,
      });

      // Mock successful user update
      mockSupabase.auth.admin.updateUserById.mockResolvedValue({
        data: { user: { id: mockUserId, email: mockEmail } },
        error: null,
      });

      // Mock successful token storage
      mockSupabase.from().upsert.mockResolvedValue({
        data: [{ user_id: mockUserId }],
        error: null,
      });

      const response = await request(app)
        .post('/api/auth/google/link-account')
        .send({
          idToken: mockIdToken,
          accessToken: mockAccessToken,
          password: mockPassword,
        })
        .expect(200);

      expect(response.body).toHaveProperty('token');
      expect(response.body).toHaveProperty('user');
      expect(response.body.user.email).toBe(mockEmail);
    });
  });

  describe('Password Verification', () => {
    it('should reject incorrect password', async () => {
      mockSupabase.auth.admin.getUserByEmail.mockResolvedValue({
        data: { user: { id: mockUserId, email: mockEmail } },
        error: null,
      });

      // Mock failed password verification
      mockSupabase.auth.signInWithPassword.mockResolvedValue({
        data: null,
        error: { message: 'Invalid login credentials' },
      });

      const response = await request(app)
        .post('/api/auth/google/link-account')
        .send({
          idToken: mockIdToken,
          accessToken: mockAccessToken,
          password: 'wrong-password',
        })
        .expect(401);

      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toContain('Invalid password');
    });

    it('should handle missing password', async () => {
      const response = await request(app)
        .post('/api/auth/google/link-account')
        .send({
          idToken: mockIdToken,
          accessToken: mockAccessToken,
          // Missing password
        })
        .expect(400);

      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toContain('Password is required');
    });
  });

  describe('Error Handling', () => {
    it('should handle user not found', async () => {
      mockSupabase.auth.admin.getUserByEmail.mockResolvedValue({
        data: { user: null },
        error: { message: 'User not found' },
      });

      const response = await request(app)
        .post('/api/auth/google/link-account')
        .send({
          idToken: mockIdToken,
          accessToken: mockAccessToken,
          password: mockPassword,
        })
        .expect(404);

      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toContain('User not found');
    });

    it('should handle invalid Google ID token', async () => {
      admin.auth().verifyIdToken.mockRejectedValue(new Error('Invalid token'));

      const response = await request(app)
        .post('/api/auth/google/link-account')
        .send({
          idToken: 'invalid-token',
          accessToken: mockAccessToken,
          password: mockPassword,
        })
        .expect(401);

      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toContain('Invalid Google token');
    });
  });
});
