import React, { useState } from 'react'
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import { AuthProvider, useAuth } from './contexts/AuthContext'
import Dashboard from './pages/Dashboard'
import './App.css'

// Simple login component for testing
const Login = ({ onLogin }) => {
  const [token, setToken] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (token.trim()) {
      onLogin(token);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center">
      <div className="bg-white rounded-lg shadow-md p-8 max-w-md w-full">
        <h2 className="text-2xl font-bold text-gray-900 mb-6 text-center">
          MindGarden Login
        </h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="token" className="block text-sm font-medium text-gray-700 mb-1">
              JWT Token
            </label>
            <textarea
              id="token"
              value={token}
              onChange={(e) => setToken(e.target.value)}
              rows="4"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Paste your JWT token here..."
            />
          </div>
          <button
            type="submit"
            className="w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            Login
          </button>
        </form>
        <p className="text-sm text-gray-500 mt-4 text-center">
          Get your JWT token from the backend or Supabase dashboard
        </p>
      </div>
    </div>
  );
};

// Main app content
const AppContent = () => {
  const { user, login, logout, isAuthenticated } = useAuth();

  if (!isAuthenticated()) {
    return <Login onLogin={login} />;
  }

  return (
    <Router>
      <div className="App">
        <nav className="bg-white shadow-sm border-b">
          <div className="container mx-auto px-4 py-3">
            <div className="flex justify-between items-center">
              <h1 className="text-xl font-bold text-gray-900">MindGarden</h1>
              <button
                onClick={logout}
                className="px-3 py-1 text-sm text-gray-600 hover:text-gray-800"
              >
                Logout
              </button>
            </div>
          </div>
        </nav>
        <Routes>
          <Route path="/" element={<Dashboard />} />
        </Routes>
      </div>
    </Router>
  );
};

function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

export default App 