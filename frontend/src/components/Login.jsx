import React, { useState } from 'react';
import {useNavigate} from 'react-router-dom'

const Login = ({ onLogin, onSwitchToSignup }) => {
  const [loginMethod, setLoginMethod] = useState('credentials'); // 'credentials' or 'jwt'
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [jwtToken, setJwtToken] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleCredentialsSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const result = await onLogin(email, password);
    if (!result.success) {
      setError(result.error || 'Login failed');
    } else {
      navigate('/');
    }
    setLoading(false);
  };

  const handleJwtSubmit = (e) => {
    e.preventDefault();
    if (jwtToken.trim()) {
      onLogin(jwtToken);
      navigate('/');
    }
  };

  return (
    <div className="min-h-screen bg-white flex items-center justify-center p-6">
      <div className="bg-white/90 backdrop-blur-sm rounded-3xl shadow-2xl border border-black/10 p-8 max-w-md w-full animate-scaleIn">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-black rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
            <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
            </svg>
          </div>
          <h2 className="text-3xl font-bold text-black">
            Welcome Back
          </h2>
          <p className="text-gray-600 mt-2">Sign in to your Foci account</p>
        </div>

        {/* Login Method Toggle */}
        <div className="flex mb-8 bg-gray-100/80 backdrop-blur-sm rounded-2xl p-1">
          <button
            type="button"
            onClick={() => setLoginMethod('credentials')}
            className={`flex-1 py-3 px-6 rounded-xl text-sm font-medium transition-all duration-200 ${
              loginMethod === 'credentials'
                ? 'bg-black text-white shadow-lg transform scale-105'
                : 'text-gray-600 hover:text-black hover:bg-gray-100'
            }`}
          >
            Email & Password
          </button>
          <button
            type="button"
            onClick={() => setLoginMethod('jwt')}
            className={`flex-1 py-3 px-6 rounded-xl text-sm font-medium transition-all duration-200 ${
              loginMethod === 'jwt'
                ? 'bg-black text-white shadow-lg transform scale-105'
                : 'text-gray-600 hover:text-black hover:bg-gray-100'
            }`}
          >
            JWT Token
          </button>
        </div>

        {/* Email & Password Login */}
        {loginMethod === 'credentials' && (
          <form onSubmit={handleCredentialsSubmit} className="space-y-6">
            <div>
              <label htmlFor="email" className="block text-sm font-semibold text-gray-700 mb-2">
                Email
              </label>
              <input
                type="email"
                id="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-2xl focus:outline-none focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 bg-white/80 backdrop-blur-sm shadow-sm transition-all duration-200"
                placeholder="Enter your email"
              />
            </div>
            <div>
              <label htmlFor="password" className="block text-sm font-semibold text-gray-700 mb-2">
                Password
              </label>
              <input
                type="password"
                id="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-2xl focus:outline-none focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 bg-white/80 backdrop-blur-sm shadow-sm transition-all duration-200"
                placeholder="Enter your password"
              />
            </div>
            {error && (
              <div className="bg-red-50/80 backdrop-blur-sm border border-red-200 text-red-700 px-4 py-3 rounded-2xl text-sm">
                <div className="flex items-center space-x-2">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span>{error}</span>
                </div>
              </div>
            )}
            <button
              type="submit"
              disabled={loading}
              className="w-full px-6 py-4 bg-black text-white rounded-2xl hover:bg-gray-900 focus:outline-none focus:ring-4 focus:ring-black/10 disabled:opacity-50 shadow-lg transition-all duration-200 transform hover:scale-105 font-medium"
            >
              {loading ? (
                <span className="flex items-center justify-center space-x-2">
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  <span>Signing in...</span>
                </span>
              ) : (
                <span className="flex items-center justify-center space-x-2">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
                  </svg>
                  <span>Sign In</span>
                </span>
              )}
            </button>
          </form>
        )}

        {/* JWT Token Login */}
        {loginMethod === 'jwt' && (
          <form onSubmit={handleJwtSubmit} className="space-y-6">
            <div>
              <label htmlFor="jwt" className="block text-sm font-semibold text-gray-700 mb-2">
                JWT Token
              </label>
              <textarea
                id="jwt"
                value={jwtToken}
                onChange={(e) => setJwtToken(e.target.value)}
                rows="4"
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-2xl focus:outline-none focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 bg-white/80 backdrop-blur-sm shadow-sm transition-all duration-200 resize-none"
                placeholder="Paste your JWT token here..."
              />
            </div>
            <button
              type="submit"
              className="w-full px-6 py-4 bg-black text-white rounded-2xl hover:bg-gray-900 focus:outline-none focus:ring-4 focus:ring-black/10 shadow-lg transition-all duration-200 transform hover:scale-105 font-medium"
            >
              <span className="flex items-center justify-center space-x-2">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
                </svg>
                <span>Login with Token</span>
              </span>
            </button>
            <div className="bg-blue-50/60 backdrop-blur-sm border border-blue-200 text-blue-700 px-4 py-3 rounded-2xl text-sm">
              <div className="flex items-center space-x-2">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span>Get your JWT token from the backend or Supabase dashboard</span>
              </div>
            </div>
          </form>
        )}

        {/* Signup Link */}
        <div className="mt-8 text-center">
          <button
            onClick={onSwitchToSignup}
            className="text-sm text-blue-600 hover:text-blue-800 font-medium hover:underline transition-all duration-200"
          >
            Don't have an account? Sign up
          </button>
        </div>
      </div>
    </div>
  );
};

export default Login; 