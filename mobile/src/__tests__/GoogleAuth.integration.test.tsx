import React from 'react';
import { render, fireEvent, waitFor, screen } from '@testing-library/react-native';
import { GoogleSignin } from '@react-native-google-signin/google-signin';
import { authService } from '../services/auth';
import { configService } from '../services/config';
import LoginScreen from '../screens/auth/LoginScreen';
import SignupScreen from '../screens/auth/SignupScreen';

// Mock the Google Sign-In library
jest.mock('@react-native-google-signin/google-signin', () => ({
  GoogleSignin: {
    configure: jest.fn(),
    hasPlayServices: jest.fn(),
    signIn: jest.fn(),
    getCurrentUser: jest.fn(),
    signOut: jest.fn(),
  },
}));

// Mock the auth service
jest.mock('../services/auth', () => ({
  authService: {
    setSession: jest.fn(),
    getAuthState: jest.fn(),
  },
}));

// Mock the config service
jest.mock('../services/config', () => ({
  configService: {
    getBaseUrl: jest.fn(() => 'http://localhost:5000/api'),
  },
}));

// Mock fetch for API calls
global.fetch = jest.fn();

describe('Google Authentication Integration', () => {
  const mockNavigation = {
    navigate: jest.fn(),
    replace: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    (GoogleSignin.configure as jest.Mock).mockResolvedValue(undefined);
    (GoogleSignin.hasPlayServices as jest.Mock).mockResolvedValue(true);
    (authService.setSession as jest.Mock).mockResolvedValue(undefined);
    (authService.getAuthState as jest.Mock).mockReturnValue({
      isAuthenticated: false,
      user: null,
      token: null,
      isLoading: false,
    });
  });

  describe('LoginScreen Google Sign-In', () => {
    it('should handle successful Google sign-in for new user', async () => {
      const mockGoogleUser = {
        idToken: 'mock-google-id-token',
        serverAuthCode: 'mock-auth-code',
        user: {
          email: 'test@example.com',
          name: 'Test User',
        },
      };

      const mockBackendResponse = {
        token: 'mock-supabase-token',
        user: {
          id: 'mock-user-id',
          email: 'test@example.com',
        },
      };

      // Mock Google Sign-In success
      (GoogleSignin.signIn as jest.Mock).mockResolvedValue(mockGoogleUser);

      // Mock successful backend response
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockBackendResponse,
      });

      render(<LoginScreen navigation={mockNavigation} />);

      // Find and press the Google Sign-In button
      const googleButton = screen.getByText('Sign in with Google');
      fireEvent.press(googleButton);

      await waitFor(() => {
        expect(GoogleSignin.signIn).toHaveBeenCalled();
      });

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith(
          'http://localhost:5000/api/auth/google/mobile-signin',
          expect.objectContaining({
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              idToken: mockGoogleUser.idToken,
              accessToken: mockGoogleUser.serverAuthCode,
            }),
          })
        );
      });

      await waitFor(() => {
        expect(authService.setSession).toHaveBeenCalledWith(
          mockBackendResponse.token,
          mockBackendResponse.user
        );
      });

      await waitFor(() => {
        expect(mockNavigation.replace).toHaveBeenCalledWith('Main');
      });
    });



    it('should handle Google Sign-In errors', async () => {
      // Mock Google Sign-In failure
      (GoogleSignin.signIn as jest.Mock).mockRejectedValue(
        new Error('Google Sign-In failed')
      );

      render(<LoginScreen navigation={mockNavigation} />);

      const googleButton = screen.getByText('Sign in with Google');
      fireEvent.press(googleButton);

      await waitFor(() => {
        expect(GoogleSignin.signIn).toHaveBeenCalled();
      });

      // Should show error message
      await waitFor(() => {
        expect(screen.getByText(/Google Sign-In failed/)).toBeTruthy();
      });
    });

    it('should handle backend API errors', async () => {
      const mockGoogleUser = {
        idToken: 'mock-google-id-token',
        serverAuthCode: 'mock-auth-code',
        user: {
          email: 'test@example.com',
          name: 'Test User',
        },
      };

      // Mock Google Sign-In success
      (GoogleSignin.signIn as jest.Mock).mockResolvedValue(mockGoogleUser);

      // Mock backend error
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 500,
        json: async () => ({ error: 'Internal server error' }),
      });

      render(<LoginScreen navigation={mockNavigation} />);

      const googleButton = screen.getByText('Sign in with Google');
      fireEvent.press(googleButton);

      await waitFor(() => {
        expect(GoogleSignin.signIn).toHaveBeenCalled();
      });

      await waitFor(() => {
        expect(screen.getByText(/Internal server error/)).toBeTruthy();
      });
    });
  });



  describe('SignupScreen Google Sign-In', () => {
    it('should handle Google sign-up for new user', async () => {
      const mockGoogleUser = {
        idToken: 'mock-google-id-token',
        serverAuthCode: 'mock-auth-code',
        user: {
          email: 'newuser@example.com',
          name: 'New User',
        },
      };

      const mockBackendResponse = {
        token: 'mock-supabase-token',
        user: {
          id: 'mock-user-id',
          email: 'newuser@example.com',
        },
      };

      // Mock Google Sign-In success
      (GoogleSignin.signIn as jest.Mock).mockResolvedValue(mockGoogleUser);

      // Mock successful backend response
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockBackendResponse,
      });

      render(<SignupScreen navigation={mockNavigation} />);

      // Find and press the Google Sign-In button
      const googleButton = screen.getByText('Sign up with Google');
      fireEvent.press(googleButton);

      await waitFor(() => {
        expect(GoogleSignin.signIn).toHaveBeenCalled();
      });

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith(
          'http://localhost:5000/api/auth/google/mobile-signin',
          expect.objectContaining({
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              idToken: mockGoogleUser.idToken,
              accessToken: mockGoogleUser.serverAuthCode,
            }),
          })
        );
      });

      await waitFor(() => {
        expect(authService.setSession).toHaveBeenCalledWith(
          mockBackendResponse.token,
          mockBackendResponse.user
        );
      });

      await waitFor(() => {
        expect(mockNavigation.replace).toHaveBeenCalledWith('Main');
      });
    });
  });
});
