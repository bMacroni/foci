import AsyncStorage from '@react-native-async-storage/async-storage';
import { configService } from './config';

// Helper function to decode JWT token
function decodeJWT(token: string): any {
  try {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(atob(base64).split('').map(function(c) {
      return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
    }).join(''));
    return JSON.parse(jsonPayload);
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
    console.log('🔐 AuthService: Constructor called');
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
    console.log('🔐 AuthService: Starting initialization...');
    try {
      // Check all possible storage keys
      const allKeys = await AsyncStorage.getAllKeys();
      console.log('🔐 AuthService: All AsyncStorage keys:', allKeys);
      
      // Try both key formats
      let token = await AsyncStorage.getItem('auth_token');
      let userData = await AsyncStorage.getItem('auth_user');
      
      // If not found, try alternative keys
      if (!token) {
        token = await AsyncStorage.getItem('authToken');
        console.log('🔐 AuthService: Trying authToken key - found:', !!token);
      }
      if (!userData) {
        userData = await AsyncStorage.getItem('authUser');
        console.log('🔐 AuthService: Trying authUser key - found:', !!userData);
      }
      
      // Also try to get the actual value of authToken to see what's stored
      const authTokenValue = await AsyncStorage.getItem('authToken');
      console.log('🔐 AuthService: authToken value:', authTokenValue);
      
      console.log('🔐 AuthService: Retrieved from storage - token:', !!token, 'userData:', !!userData);
      console.log('🔐 AuthService: Token value:', token);
      console.log('🔐 AuthService: UserData value:', userData);
      
      if (token) {
        // Try to get user data from storage first
        let user: User | null = null;
        
        if (userData) {
          try {
            user = JSON.parse(userData);
            console.log('🔐 AuthService: User data found in storage');
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
            console.log('🔐 AuthService: User data extracted from JWT token');
          }
        }
        
        if (user) {
          this.authState = {
            user,
            token,
            isLoading: false,
            isAuthenticated: true,
          };
          console.log('🔐 AuthService: User authenticated - user:', user.email);
        } else {
          this.authState = {
            user: null,
            token: null,
            isLoading: false,
            isAuthenticated: false,
          };
          console.log('🔐 AuthService: Token found but could not extract user data');
        }
      } else {
        this.authState = {
          user: null,
          token: null,
          isLoading: false,
          isAuthenticated: false,
        };
        console.log('🔐 AuthService: No stored auth data - user not authenticated');
      }
      
      this.initialized = true;
      console.log('🔐 AuthService: Initialization complete, notifying listeners');
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
    console.log('🔐 AuthService: getAuthState called - state:', this.authState);
    return { ...this.authState };
  }

  // Subscribe to auth state changes
  public subscribe(listener: (state: AuthState) => void): () => void {
    console.log('🔐 AuthService: New subscriber added');
    this.listeners.push(listener);
    
    // Immediately notify the new listener with current state
    if (this.initialized) {
      console.log('🔐 AuthService: Immediately notifying new subscriber');
      listener(this.getAuthState());
    }
    
    // Return unsubscribe function
    return () => {
      const index = this.listeners.indexOf(listener);
      if (index > -1) {
        this.listeners.splice(index, 1);
        console.log('🔐 AuthService: Subscriber removed');
      }
    };
  }

  // Notify all listeners of state changes
  private notifyListeners() {
    console.log('🔐 AuthService: Notifying', this.listeners.length, 'listeners');
    const currentState = this.getAuthState();
    this.listeners.forEach(listener => listener(currentState));
  }

  // Sign up new user
  public async signup(credentials: SignupCredentials): Promise<{ success: boolean; message: string; user?: User }> {
    try {
      this.authState.isLoading = true;
      this.notifyListeners();

      const response = await fetch(`${configService.getBaseUrl()}/auth/signup`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(credentials),
      });

      const data = await response.json();

      if (response.ok && data.token) {
        // Successfully created user and got token
        await this.setAuthData(data.token, data.user);
        return { success: true, message: data.message, user: data.user };
      } else if (response.ok && data.userCreated) {
        // User created but needs email confirmation
        return { success: true, message: data.message };
      } else {
        // Error occurred
        return { success: false, message: data.error || 'Signup failed' };
      }
    } catch (error) {
      console.error('Signup error:', error);
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

      const response = await fetch(`${configService.getBaseUrl()}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(credentials),
      });

      const data = await response.json();

      if (response.ok && data.token) {
        await this.setAuthData(data.token, data.user);
        return { success: true, message: data.message, user: data.user };
      } else {
        return { success: false, message: data.error || 'Login failed' };
      }
    } catch (error) {
      console.error('Login error:', error);
      return { success: false, message: 'Network error. Please try again.' };
    } finally {
      this.authState.isLoading = false;
      this.notifyListeners();
    }
  }

  // Logout user
  public async logout(): Promise<void> {
    try {
      await AsyncStorage.removeItem('auth_token');
      await AsyncStorage.removeItem('auth_user');
      
      this.authState = {
        user: null,
        token: null,
        isLoading: false,
        isAuthenticated: false,
      };
      
      this.notifyListeners();
    } catch (error) {
      console.error('Logout error:', error);
    }
  }

  // Get current user profile
  public async getProfile(): Promise<{ success: boolean; user?: User; message?: string }> {
    try {
      const token = await this.getAuthToken();
      if (!token) {
        return { success: false, message: 'No authentication token' };
      }

      const response = await fetch(`${configService.getBaseUrl()}/auth/profile`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      const data = await response.json();

      if (response.ok) {
        return { success: true, user: data };
      } else {
        return { success: false, message: data.error || 'Failed to get profile' };
      }
    } catch (error) {
      console.error('Get profile error:', error);
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
    } catch (error) {
      console.error('Error getting auth token:', error);
      return null;
    }
  }

  // Set authentication data
  private async setAuthData(token: string, user: User): Promise<void> {
    try {
      await AsyncStorage.setItem('auth_token', token);
      await AsyncStorage.setItem('auth_user', JSON.stringify(user));
      
      this.authState = {
        user,
        token,
        isLoading: false,
        isAuthenticated: true,
      };
      
      this.notifyListeners();
    } catch (error) {
      console.error('Error setting auth data:', error);
    }
  }

  // Check if user is authenticated
  public isAuthenticated(): boolean {
    return this.authState.isAuthenticated && !!this.authState.token;
  }

  // Get current user
  public getCurrentUser(): User | null {
    return this.authState.user;
  }

  // Debug method to re-initialize auth
  public async debugReinitialize(): Promise<void> {
    console.log('🔐 AuthService: Debug re-initialization triggered');
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

      const response = await fetch(`${configService.getBaseUrl()}/auth/profile`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        return true;
      } else {
        // Token is invalid, logout user
        await this.logout();
        return false;
      }
    } catch (error) {
      console.error('Token refresh error:', error);
      await this.logout();
      return false;
    }
  }
}

// Export singleton instance
export const authService = AuthService.getInstance();
