import React, { useState } from 'react'
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import { AuthProvider, useAuth } from './contexts/AuthContext'
import Dashboard from './pages/Dashboard'
import Signup from './components/Signup'
import Login from './components/Login'
import './App.css'



// Main app content
const AppContent = () => {
  const { user, login, loginWithCredentials, signup, logout, isAuthenticated } = useAuth();
  const [showSignup, setShowSignup] = useState(false);

  const handleLogin = async (emailOrToken, password) => {
    // If password is provided, it's email/password login
    if (password) {
      return await loginWithCredentials(emailOrToken, password);
    } else {
      // Otherwise it's JWT token login
      login(emailOrToken);
      return { success: true };
    }
  };

  if (!isAuthenticated()) {
    if (showSignup) {
      return <Signup onSignup={signup} onSwitchToLogin={() => setShowSignup(false)} />;
    }
    return <Login onLogin={handleLogin} onSwitchToSignup={() => setShowSignup(true)} />;
  }

  return (
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
  );
};

function App() {
  return (
    <Router>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </Router>
  );
}

export default App 