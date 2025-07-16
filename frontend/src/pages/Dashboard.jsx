import React, { useState, useRef, useEffect } from 'react'
import GoalList from '../components/GoalList'
import TaskList from '../components/TaskList'
import CalendarStatus from '../components/CalendarStatus'
import CalendarEvents from '../components/CalendarEvents'
import AIChat from '../components/AIChat'
import FeedbackModal from '../components/FeedbackModal';

function Dashboard({ showSuccess }) {
  // Remove draggable nav pill state and drag logic
  // const [activeTab, setActiveTab] = useState('ai');
  const [activeTab, setActiveTab] = useState('ai');
  const [showMobileSidebar, setShowMobileSidebar] = useState(false);
  const [isHorizontal, setIsHorizontal] = useState(false); // Remove if not needed
  const [showFeedbackModal, setShowFeedbackModal] = useState(false);

  // Remove navPos, navRef, dragOffset, dragging, and related useEffect

  // Remove drag handlers

  // Icon-only nav buttons (like CalendarStatus)
  const navTabs = [
    {
      id: 'ai',
      label: 'Foci.ai',
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
        </svg>
      )
    },
    {
      id: 'goals',
      label: 'Goals',
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m4 0h-1V7h-1m-4 0h1v4h1m-4 0h1v4h1" />
        </svg>
      )
    },
    {
      id: 'tasks',
      label: 'Tasks',
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-3-3v6m9 4a2 2 0 01-2 2H7a2 2 0 01-2-2V7a2 2 0 012-2h10a2 2 0 012 2v10z" />
        </svg>
      )
    },
    {
      id: 'calendar',
      label: 'Calendar',
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
      )
    }
  ];

  // Logout handler
  const handleLogout = () => {
    localStorage.removeItem('jwt_token');
    window.location.href = '/login';
  };

  return (
    <div className="min-h-screen bg-white flex">
      {/* Top-Center Horizontal Nav Pill */}
      <div
        className="z-50 shadow-2xl bg-white/95 flex flex-row items-center fixed left-1/2 top-6 transform -translate-x-1/2 rounded-full px-8 py-3"
        style={{
          background: 'rgba(255,255,255,0.97)',
          boxShadow: '0 8px 32px 0 rgba(0,0,0,0.18)',
          minWidth: 0,
          minHeight: 0,
        }}
      >
        {/* Nav Buttons */}
        {[
          {
            id: 'ai',
            label: 'Foci.ai',
            icon: (
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
              </svg>
            )
          },
          {
            id: 'goals',
            label: 'Goals',
            icon: (
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m4 0h-1V7h-1m-4 0h1v4h1m-4 0h1v4h1" />
              </svg>
            )
          },
          {
            id: 'tasks',
            label: 'Tasks',
            icon: (
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-3-3v6m9 4a2 2 0 01-2 2H7a2 2 0 01-2-2V7a2 2 0 012-2h10a2 2 0 012 2v10z" />
              </svg>
            )
          },
          {
            id: 'calendar',
            label: 'Calendar',
            icon: (
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            )
          }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center space-x-2 px-4 py-2 rounded-full font-medium transition-colors duration-200 ${activeTab === tab.id ? 'bg-black text-white' : 'bg-white text-black hover:bg-gray-100'}`}
            style={{ margin: '0 4px' }}
          >
            {tab.icon}
            <span>{tab.label}</span>
          </button>
        ))}
        {/* Help Button */}
        <button
          onClick={() => setShowFeedbackModal(true)}
          className="flex items-center space-x-2 px-4 py-2 rounded-full font-medium transition-colors duration-200 bg-white text-blue-600 hover:bg-blue-100 ml-2"
          style={{ margin: '0 4px' }}
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M8 10h.01M12 14h.01M16 10h.01M21 12c0 4.418-4.03 8-9 8s-9-3.582-9-8 4.03-8 9-8 9 3.582 9 8z" />
          </svg>
          <span>Help</span>
        </button>
        {/* Logout Button */}
        <button
          onClick={handleLogout}
          className="flex items-center space-x-2 px-4 py-2 rounded-full font-medium transition-colors duration-200 bg-white text-red-600 hover:bg-red-100 ml-2"
          style={{ margin: '0 4px' }}
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a2 2 0 01-2 2H7a2 2 0 01-2-2V7a2 2 0 012-2h4a2 2 0 012 2v1" />
          </svg>
          <span>Logout</span>
        </button>
      </div>
      {/* Foci app name badge */}
      <div className="fixed top-6 left-1/2 -translate-x-1/2 z-40">
        <span className="inline-flex items-center px-4 py-1.5 rounded-full bg-black/90 text-white text-base font-bold shadow-md tracking-wide opacity-90" style={{letterSpacing: '0.08em'}}>Foci.ai</span>
      </div>
      {/* Main Content Area */}
      <div className="flex-1 flex flex-col relative">
        {/* Mobile Hamburger (top left) */}
        <button
          className="lg:hidden absolute top-4 left-4 z-20 p-2 rounded-md bg-white/80 shadow border border-gray-200"
          onClick={() => setShowMobileSidebar(true)}
        >
          <svg className="w-6 h-6 text-black" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>

        {/* Content Area */}
        <div className={`flex-1 ${activeTab === 'ai' ? 'p-0' : 'p-4 lg:p-6'}`}
          style={{ maxWidth: '100vw' }}
        >
          {activeTab === 'ai' && (
            <div className="h-full">
              <AIChat onNavigateToTab={setActiveTab} />
            </div>
          )}
          {activeTab !== 'ai' && (
            <div className="h-full flex flex-col">
              {/* Tab Header */}
              <div className="mb-4 flex items-center justify-between">
                <h2 className="text-xl lg:text-2xl font-bold text-black capitalize">
                  {activeTab === 'goals' ? 'Goals' : 
                   activeTab === 'tasks' ? 'Tasks' : 
                   activeTab === 'calendar' ? 'Calendar' : activeTab}
                </h2>
                {/* Removed Back to AI button */}
              </div>
              {/* Tab Content */}
              <div className="flex-1 overflow-y-auto">
                {activeTab === 'goals' && <GoalList showSuccess={showSuccess} />}
                {activeTab === 'tasks' && <TaskList showSuccess={showSuccess} />}
                {activeTab === 'calendar' && (
                  <div className="space-y-6">
                    <CalendarStatus />
                    <CalendarEvents />
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Mobile Sidebar Drawer */}
      {showMobileSidebar && (
        <div className="fixed inset-0 z-40 bg-black/50 lg:hidden">
          <div className="fixed left-0 top-0 h-full w-64 bg-white shadow-xl z-50 flex flex-col">
            <div className="p-4 border-b border-gray-200 flex items-center justify-between">
              <h2 className="text-xl font-bold text-gray-800">Foci</h2>
              <button
                onClick={() => setShowMobileSidebar(false)}
                className="p-2 text-gray-500 hover:text-gray-700"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <nav className="p-4 flex-1">
              <div className="space-y-2">
                {[
                  { id: 'ai', label: 'AI Chat' },
                  { id: 'goals', label: 'Goals' },
                  { id: 'tasks', label: 'Tasks' },
                  { id: 'calendar', label: 'Calendar' }
                ].map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => {
                      setActiveTab(tab.id);
                      setShowMobileSidebar(false);
                    }}
                    className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors ${
                      activeTab === tab.id
                        ? 'bg-black text-white'
                        : 'text-gray-600 hover:bg-gray-100'
                    }`}
                  >
                    <span className="font-medium">{tab.label}</span>
                  </button>
                ))}
              </div>
            </nav>
          </div>
        </div>
      )}
      {/* Feedback Modal */}
      {showFeedbackModal && (
        <FeedbackModal onClose={() => setShowFeedbackModal(false)} />
      )}
    </div>
  );
}

export default Dashboard 