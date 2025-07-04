import React, { createContext, useContext, useState, useEffect } from 'react';
import { goalsAPI, tasksAPI } from '../services/api';

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