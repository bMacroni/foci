import React, { createContext, useContext, useState, useEffect } from 'react';
import { goalsAPI, tasksAPI } from '../services/api';
import api from '../services/api';

// Debug: Log the API URL being used
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
console.log('AuthContext - API Base URL:', API_BASE_URL);

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check if user is logged in on app start
    const token = localStorage.getItem('jwt_token');
    if (token) {
      // You could decode the JWT here to get user info
      // For now, we'll just set a basic user object
      setUser({ token });
    }
    setLoading(false);
  }, []);

  const login = (token) => {
    localStorage.setItem('jwt_token', token);
    setUser({ token });
  };

  const loginWithCredentials = async (email, password) => {
    try {
      const response = await api.post('/auth/login', { email, password });
      
      if (response.data.token) {
        localStorage.setItem('jwt_token', response.data.token);
        setUser({ token: response.data.token });
        return { success: true };
      } else {
        throw new Error('No token received');
      }
    } catch (error) {
      console.error('Login error:', error);
      return { 
        success: false, 
        error: error.response?.data?.error || error.message || 'Login failed' 
      };
    }
  };

  const signup = async (email, password) => {
    try {
      const response = await api.post('/auth/signup', { email, password });
      const data = response.data;
      
      if (data.token) {
        // Auto-login succeeded
        localStorage.setItem('jwt_token', data.token);
        setUser({ token: data.token });
        return { success: true };
      } else if (data.userCreated) {
        // User was created but auto-login failed
        return { success: true, message: 'Account created! Please log in.', userCreated: true };
      } else {
        return { success: false, error: data.error || 'Signup failed' };
      }
    } catch (error) {
      console.error('Signup error:', error);
      return { 
        success: false, 
        error: error.response?.data?.error || error.message || 'Signup failed' 
      };
    }
  };

  const logout = () => {
    localStorage.removeItem('jwt_token');
    setUser(null);
  };

  const isAuthenticated = () => {
    return !!user?.token;
  };

  const value = {
    user,
    login,
    loginWithCredentials,
    signup,
    logout,
    isAuthenticated,
    loading,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}; 