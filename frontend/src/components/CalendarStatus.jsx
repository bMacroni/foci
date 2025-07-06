import React, { useState, useEffect } from 'react';
import { calendarAPI } from '../services/api';

const CalendarStatus = () => {
  const [status, setStatus] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    checkCalendarStatus();
  }, []);

  const checkCalendarStatus = async () => {
    try {
      setLoading(true);
      const response = await calendarAPI.getStatus();
      setStatus(response.data);
      setError(null);
    } catch (err) {
      console.error('Error checking calendar status:', err);
      setError('Failed to check calendar status');
      setStatus({ connected: false });
    } finally {
      setLoading(false);
    }
  };

  const connectGoogleCalendar = () => {
    const token = localStorage.getItem('jwt_token');
    if (token) {
      const url = `http://localhost:5000/api/auth/google/login?state=${token}`;
      window.location.href = url;
    } else {
      setError('Please log in first');
    }
  };

  const disconnectGoogleCalendar = async () => {
    // TODO: Implement disconnect functionality
    alert('Disconnect functionality coming soon!');
  };

  if (loading) {
    return (
      <div className="bg-white/90 backdrop-blur-sm rounded-3xl shadow-xl border border-black/10 p-8">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded-2xl w-1/3 mb-6"></div>
          <div className="h-12 bg-gray-200 rounded-2xl w-2/3"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white/90 backdrop-blur-sm rounded-3xl shadow-xl border border-black/10 p-8">
      <div className="flex items-center space-x-3 mb-6">
        <div className="w-12 h-12 bg-black rounded-2xl flex items-center justify-center">
          <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
        </div>
        <h3 className="text-2xl font-bold text-black">
          Google Calendar Status
        </h3>
      </div>
      
      {error && (
        <div className="mb-6 bg-red-50/80 backdrop-blur-sm border border-red-200 text-red-700 px-6 py-4 rounded-2xl shadow-sm">
          <div className="flex items-center space-x-2">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span className="font-medium">{error}</span>
          </div>
        </div>
      )}

      {status?.connected ? (
        <div className="space-y-6">
          <div className="flex items-center space-x-3">
            <div className="w-4 h-4 bg-gray-500 rounded-full animate-pulse"></div>
            <span className="text-gray-600 font-bold text-lg">Connected</span>
          </div>
          
          <div className="bg-gray-50/80 backdrop-blur-sm rounded-2xl p-6 space-y-3">
            <div className="flex items-center space-x-2">
              <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
              <span className="font-medium text-black">Email: {status.email}</span>
            </div>
            {status.lastUpdated && (
              <div className="flex items-center space-x-2">
                <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span className="font-medium text-black">Last Updated: {new Date(status.lastUpdated).toLocaleString()}</span>
              </div>
            )}
          </div>
          
          <div className="flex space-x-4">
            <button
              onClick={checkCalendarStatus}
              className="px-6 py-3 bg-black text-white rounded-2xl hover:bg-gray-900 focus:outline-none focus:ring-4 focus:ring-black/10 shadow-lg transition-all duration-200 transform hover:scale-105 font-medium"
            >
              <span className="flex items-center space-x-2">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                <span>Refresh Status</span>
              </span>
            </button>
            <button
              onClick={disconnectGoogleCalendar}
              className="px-6 py-3 bg-gray-200 text-black rounded-2xl hover:bg-gray-300 focus:outline-none focus:ring-4 focus:ring-black/10 shadow-lg transition-all duration-200 transform hover:scale-105 font-medium"
            >
              <span className="flex items-center space-x-2">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
                <span>Disconnect</span>
              </span>
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          <div className="flex items-center space-x-3">
            <div className="w-4 h-4 bg-red-500 rounded-full"></div>
            <span className="text-red-500 font-bold text-lg">Not Connected</span>
          </div>
          
          <div className="bg-gray-50/80 backdrop-blur-sm rounded-2xl p-6">
            <p className="text-black font-medium">
              Connect your Google Calendar to sync events with Foci and stay organized.
            </p>
          </div>
          
          <button
            onClick={connectGoogleCalendar}
            className="px-8 py-4 bg-black text-white rounded-2xl hover:bg-gray-900 focus:outline-none focus:ring-4 focus:ring-black/10 shadow-lg transition-all duration-200 transform hover:scale-105 font-medium"
          >
            <span className="flex items-center space-x-2">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
              </svg>
              <span>Connect Google Calendar</span>
            </span>
          </button>
        </div>
      )}
    </div>
  );
};

export default CalendarStatus; 