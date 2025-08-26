import { GoogleSignin } from '@react-native-google-signin/google-signin';
import auth from '@react-native-firebase/auth';
import { Platform } from 'react-native';
import { configService } from './config';
import { authService } from './auth';

export interface GoogleAuthResult {
  success: boolean;
  token?: string;
  idToken?: string;
  accessToken?: string;
  user?: any;
  error?: string;
}

class GoogleAuthService {
  private static instance: GoogleAuthService;
  private isConfigured = false;

  private constructor() {
    this.configureGoogleSignIn();
  }

  public static getInstance(): GoogleAuthService {
    if (!GoogleAuthService.instance) {
      GoogleAuthService.instance = new GoogleAuthService();
    }
    return GoogleAuthService.instance;
  }

  private configureGoogleSignIn() {
    if (this.isConfigured) {
      return;
    }

    try {
      const baseConfig: any = {
        // These will be set from environment variables or config
        webClientId: configService.getGoogleWebClientId(), // Required for getting the ID token
        offlineAccess: true, // Required for getting the access token
        forceCodeForRefreshToken: true, // Required for getting the refresh token
        scopes: [
          'openid', 
          'email', 
          'profile',
          'https://www.googleapis.com/auth/calendar.events.readonly'
        ],
      };

      if (Platform.OS === 'ios') {
        baseConfig.iosClientId = configService.getGoogleIosClientId();
      }

      GoogleSignin.configure(baseConfig);
      this.isConfigured = true;
    } catch (error) {
      console.error('Failed to configure Google Sign-In:', error);
    }
  }

  /**
   * Initiates Google Sign-In flow
   * Returns authentication result or linking required status
   */
  async signInWithGoogle(): Promise<GoogleAuthResult> {
    try {
      if (!this.isConfigured) {
        this.configureGoogleSignIn();
      }

      // Check if Google Play Services are available (Android only)
      await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });

      // Sign in with Google
      const userInfo = await GoogleSignin.signIn();
      
      if (!userInfo.idToken) {
        throw new Error('No ID token received from Google');
      }

      // Sign into Firebase to obtain a Firebase ID token (matches Firebase Admin expectations)
      const googleCredential = auth.GoogleAuthProvider.credential(userInfo.idToken);
      await auth().signInWithCredential(googleCredential);

      const firebaseUser = auth().currentUser;
      const firebaseIdToken = await firebaseUser?.getIdToken(true);

      if (!firebaseIdToken) {
        throw new Error('Failed to retrieve Firebase ID token');
      }

      // Send Firebase ID token to backend (accessToken remains Google code/token if needed)
      const result = await this.authenticateWithBackend(
        firebaseIdToken,
        userInfo.serverAuthCode || userInfo.idToken
      );

      return result;
    } catch (error: any) {
      console.error('Google Sign-In error:', error);
      
      // Handle specific Google Sign-In errors
      if (error.code === 'SIGN_IN_CANCELLED') {
        return {
          success: false,
          error: 'Sign-in was cancelled'
        };
      }
      
      if (error.code === 'PLAY_SERVICES_NOT_AVAILABLE') {
        return {
          success: false,
          error: 'Google Play Services not available'
        };
      }

      return {
        success: false,
        error: error.message || 'Google Sign-In failed'
      };
    }
  }

  /**
   * Authenticates with the backend using Google tokens
   */
  private async authenticateWithBackend(idToken: string, accessToken: string): Promise<GoogleAuthResult> {
    try {
      const baseUrl = configService.getBaseUrl();
      const response = await fetch(`${baseUrl}/auth/google/mobile-signin`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          idToken,
          accessToken,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        // Successful authentication
        await authService.setSession(data.token, data.user);
        return {
          success: true,
          token: data.token,
          idToken,
          accessToken,
          user: data.user,
        };
      } else {
        // Authentication failed
        return {
          success: false,
          error: data.error || 'Authentication failed',
        };
      }
    } catch (error: any) {
      console.error('Backend authentication error:', error);
      return {
        success: false,
        error: error.message || 'Network error',
      };
    }
  }



  /**
   * Signs out from Google
   */
  async signOut(): Promise<void> {
    try {
      await GoogleSignin.signOut();
    } catch (error) {
      console.error('Google Sign-Out error:', error);
    }
  }

  /**
   * Gets current Google user (if signed in)
   */
  async getCurrentUser() {
    try {
      const currentUser = await GoogleSignin.getCurrentUser();
      return currentUser;
    } catch (error) {
      console.error('Error getting current Google user:', error);
      return null;
    }
  }

  /**
   * Checks if user is signed in to Google
   */
  async isSignedIn(): Promise<boolean> {
    try {
      const isSignedIn = await GoogleSignin.isSignedIn();
      return isSignedIn;
    } catch (error) {
      console.error('Error checking Google sign-in status:', error);
      return false;
    }
  }
}

export const googleAuthService = GoogleAuthService.getInstance();
