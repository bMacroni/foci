import AsyncStorage from '@react-native-async-storage/async-storage';
import { jwtDecode } from 'jwt-decode';
import { apiFetch } from './apiService';

// Helper function to decode JWT token
function decodeJWT(token: string): any {
  try {
    return jwtDecode(token);
  } catch (error) {
    console.error('🔐 AuthService: Error decoding JWT:', error);
    return null;
  }
}

export interface User {
  id: string;
  email: string;
  email_confirmed_at?: string;
  created_at?: string;
  updated_at?: string;
}

export interface AuthState {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface SignupCredentials {
  email: string;
  password: string;
}

class AuthService {
  private static instance: AuthService;
  private authState: AuthState = {
    user: null,
    token: null,
    isLoading: true,
    isAuthenticated: false,
  };
  private listeners: ((state: AuthState) => void)[] = [];
  private initialized = false;

  private constructor() {
    console.warn('🔐 AuthService: Constructor called');
    this.initializeAuth();
  }

  public static getInstance(): AuthService {
    if (!AuthService.instance) {
      AuthService.instance = new AuthService();
    }
    return AuthService.instance;
  }

  // Initialize auth state from storage
  private async initializeAuth() {
    console.warn('🔐 AuthService: Starting initialization...');
    try {
      // Check all possible storage keys
      const allKeys = await AsyncStorage.getAllKeys();
      console.warn('🔐 AuthService: All AsyncStorage keys:', allKeys);
      
      // Try both key formats
      let token = await AsyncStorage.getItem('auth_token');
      let userData = await AsyncStorage.getItem('auth_user');
      
      // If not found, try alternative keys
      if (!token) {
        token = await AsyncStorage.getItem('authToken');
        console.warn('🔐 AuthService: Trying authToken key - found:', !!token);
      }
      if (!userData) {
        userData = await AsyncStorage.getItem('authUser');
        console.warn('🔐 AuthService: Trying authUser key - found:', !!userData);
      }
      
      // Check if authToken is present without logging the actual value
      const authTokenValue = await AsyncStorage.getItem('authToken');
      console.warn('🔐 AuthService: authToken present:', !!authTokenValue);
      
      console.warn('🔐 AuthService: Retrieved from storage - token present:', !!token, 'userData present:', !!userData);
      // Sensitive values redacted; avoid printing token/user contents
      
      if (token) {
        // Try to get user data from storage first
        let user: User | null = null;
        
        if (userData) {
          try {
            user = JSON.parse(userData);
            console.warn('🔐 AuthService: User data found in storage');
          } catch (error) {
            console.error('🔐 AuthService: Error parsing user data:', error);
          }
        }
        
        // If no user data in storage, try to extract from JWT token
        if (!user) {
          const decodedToken = decodeJWT(token);
          if (decodedToken && decodedToken.email) {
            user = {
              id: decodedToken.sub || decodedToken.user_id,
              email: decodedToken.email,
              email_confirmed_at: decodedToken.email_verified_at,
              created_at: decodedToken.iat ? new Date(decodedToken.iat * 1000).toISOString() : undefined,
              updated_at: decodedToken.iat ? new Date(decodedToken.iat * 1000).toISOString() : undefined,
            };
            console.warn('🔐 AuthService: User data extracted from JWT token');
          }
        }
        
        if (user) {
          this.authState = {
            user,
            token,
            isLoading: false,
            isAuthenticated: true,
          };
          console.warn('🔐 AuthService: User authenticated - user:', user.email);
        } else {
          this.authState = {
            user: null,
            token: null,
            isLoading: false,
            isAuthenticated: false,
          };
          console.warn('🔐 AuthService: Token found but could not extract user data');
        }
      } else {
        this.authState = {
          user: null,
          token: null,
          isLoading: false,
          isAuthenticated: false,
        };
        console.warn('🔐 AuthService: No stored auth data - user not authenticated');
      }
      
      this.initialized = true;
      console.warn('🔐 AuthService: Initialization complete, notifying listeners');
      this.notifyListeners();
    } catch (error) {
      console.error('🔐 AuthService: Error initializing auth:', error);
      this.authState = {
        user: null,
        token: null,
        isLoading: false,
        isAuthenticated: false,
      };
      this.initialized = true;
      this.notifyListeners();
    }
  }

  // Get current auth state
  public getAuthState(): AuthState {
    console.warn('🔐 AuthService: getAuthState called - state:', this.authState);
    return { ...this.authState };
  }

  // Subscribe to auth state changes
  public subscribe(listener: (state: AuthState) => void): () => void {
    console.warn('🔐 AuthService: New subscriber added');
    this.listeners.push(listener);
    
    // Immediately notify the new listener with current state
    if (this.initialized) {
      console.warn('🔐 AuthService: Immediately notifying new subscriber');
      listener(this.getAuthState());
    }
    
    // Return unsubscribe function
    return () => {
      const index = this.listeners.indexOf(listener);
      if (index > -1) {
        this.listeners.splice(index, 1);
        console.warn('🔐 AuthService: Subscriber removed');
      }
    };
  }

  // Notify all listeners of state changes
  private notifyListeners() {
    console.warn('🔐 AuthService: Notifying', this.listeners.length, 'listeners');
    const currentState = this.getAuthState();
    this.listeners.forEach(listener => listener(currentState));
  }

  // Sign up new user
  public async signup(credentials: SignupCredentials): Promise<{ success: boolean; message: string; user?: User }> {
    try {
      this.authState.isLoading = true;
      this.notifyListeners();

      const { ok, status, data } = await apiFetch('/auth/signup', {
        method: 'POST',
        body: JSON.stringify(credentials),
      });

      if (ok && data.token) {
        // Successfully created user and got token
        await this.setAuthData(data.token, data.user);
        return { success: true, message: data.message, user: data.user };
      } else if (ok && data.userCreated) {
        // User created but needs email confirmation
        return { success: true, message: data.message };
      } else {
        // Error occurred
        return { success: false, message: data.error || 'Signup failed' };
      }
    } catch (_error) {
      console.error('Signup error:', _error);
      return { success: false, message: 'Network error. Please try again.' };
    } finally {
      this.authState.isLoading = false;
      this.notifyListeners();
    }
  }

  // Login user
  public async login(credentials: LoginCredentials): Promise<{ success: boolean; message: string; user?: User }> {
    try {
      this.authState.isLoading = true;
      this.notifyListeners();

      const { ok, status, data } = await apiFetch('/auth/login', {
        method: 'POST',
        body: JSON.stringify(credentials),
      });

      if (ok && data.token) {
        await this.setAuthData(data.token, data.user);
        return { success: true, message: data.message, user: data.user };
      } else {
        return { success: false, message: data.error || 'Login failed' };
      }
    } catch (_error) {
      console.error('Login error:', _error);
      return { success: false, message: 'Network error. Please try again.' };
    } finally {
      this.authState.isLoading = false;
      this.notifyListeners();
    }
  }

  // Logout user
  public async logout(): Promise<void> {
    try {
      // Clear all possible keys to avoid stale sessions
      await AsyncStorage.multiRemove(['auth_token', 'authToken', 'auth_user', 'authUser']);
      
      this.authState = {
        user: null,
        token: null,
        isLoading: false,
        isAuthenticated: false,
      };
      
      this.notifyListeners();
    } catch (_error) {
      console.error('Logout error:', _error);
    }
  }

  // Get current user profile
  public async getProfile(): Promise<{ success: boolean; user?: User; message?: string }> {
    try {
      const token = await this.getAuthToken();
      if (!token) {
        return { success: false, message: 'No authentication token' };
      }

      const { ok, status, data } = await apiFetch('/auth/profile', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (ok) {
        return { success: true, user: data };
      } else {
        return { success: false, message: data.error || 'Failed to get profile' };
      }
    } catch (_error) {
      console.error('Get profile error:', _error);
      return { success: false, message: 'Network error' };
    }
  }

  // Get authentication token
  public async getAuthToken(): Promise<string | null> {
    if (this.authState.token) {
      return this.authState.token;
    }
    
    try {
      let token = await AsyncStorage.getItem('auth_token');
      if (!token) {
        token = await AsyncStorage.getItem('authToken');
      }
      if (token) {
        this.authState.token = token;
        this.notifyListeners();
      }
      return token;
    } catch (_error) {
      console.error('Error getting auth token:', _error);
      return null;
    }
  }

  // Set authentication data
  private async setAuthData(token: string, user: User): Promise<void> {
    try {
      // Validate token before storing
      if (!token || token === 'undefined' || token === 'null') {
        console.error('Invalid token provided to setAuthData:', token);
        throw new Error('Invalid authentication token');
      }

      await AsyncStorage.setItem('auth_token', token);
      await AsyncStorage.setItem('auth_user', JSON.stringify(user));
      
      this.authState = {
        user,
        token,
        isLoading: false,
        isAuthenticated: true,
      };
      
      this.notifyListeners();
    } catch (_error) {
      console.error('Error setting auth data:', _error);
    }
  }

  // Set session (public method for external use)
  public async setSession(token: string, user: User): Promise<void> {
    console.warn('🔐 AuthService: setSession called with token:', !!token, 'user:', user?.email);
    await this.setAuthData(token, user);
  }

  // Check if user is authenticated
  public isAuthenticated(): boolean {
    return this.authState.isAuthenticated && !!this.authState.token;
  }

  // Check if auth service is initialized
  public isInitialized(): boolean {
    return this.initialized;
  }

  // Get current user
  public getCurrentUser(): User | null {
    return this.authState.user;
  }

  // Debug method to re-initialize auth
  public async debugReinitialize(): Promise<void> {
    console.warn('🔐 AuthService: Debug re-initialization triggered');
    this.initialized = false;
    await this.initializeAuth();
  }

  // Refresh token (if needed)
  public async refreshToken(): Promise<boolean> {
    try {
      const token = await this.getAuthToken();
      if (!token) {
        return false;
      }

      const { ok, status, data } = await apiFetch('/auth/profile', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (ok) {
        return true;
      } else {
        // Token is invalid, logout user
        await this.logout();
        return false;
      }
    } catch (_error) {
      console.error('Token refresh error:', _error);
      await this.logout();
      return false;
    }
  }
}

// Export singleton instance
export const authService = AuthService.getInstance();
