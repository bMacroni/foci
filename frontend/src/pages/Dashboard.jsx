import React, { useState } from 'react'
import GoalList from '../components/GoalList'
import TaskList from '../components/TaskList'
import CalendarStatus from '../components/CalendarStatus'
import CalendarEvents from '../components/CalendarEvents'
import AIChat from '../components/AIChat'

function Dashboard({ showSuccess }) {
  const [activeTab, setActiveTab] = useState('ai');
  const [showSidebar, setShowSidebar] = useState(false);

  return (
    <div className="min-h-screen bg-white">
      <div className="container mx-auto px-6 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-black rounded-xl flex items-center justify-center shadow-lg">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                </svg>
              </div>
              <div>
                <h1 className="text-4xl font-bold text-black">
                  Foci
                </h1>
                <p className="text-gray-600 font-medium">
                  Your AI-powered productivity ecosystem
                </p>
              </div>
            </div>
            
            {/* Mobile menu button */}
            <button
              onClick={() => setShowSidebar(!showSidebar)}
              className="lg:hidden p-2 text-gray-600 hover:text-black transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
          </div>
        </div>

        {/* AI-First Layout */}
        <div className="flex gap-8">
          {/* Main AI Chat Area - Takes up most of the space */}
          <div className="flex-1">
            {activeTab === 'ai' && (
              <div className="animate-fadeIn">
                <AIChat onNavigateToTab={setActiveTab} />
              </div>
            )}
            
            {/* Other tabs in a more compact format */}
            {activeTab !== 'ai' && (
              <div className="animate-fadeIn">
                <div className="mb-6 flex items-center justify-between">
                  <h2 className="text-2xl font-bold text-black capitalize">
                    {activeTab === 'goals' ? 'Goals' : 
                     activeTab === 'tasks' ? 'Tasks' : 
                     activeTab === 'calendar' ? 'Calendar' : activeTab}
                  </h2>
                  <button
                    onClick={() => setActiveTab('ai')}
                    className="flex items-center space-x-2 px-4 py-2 bg-black text-white rounded-xl hover:bg-gray-800 transition-colors text-sm font-medium"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                    </svg>
                    <span>Back to AI</span>
                  </button>
                </div>
                
                {activeTab === 'goals' && <GoalList showSuccess={showSuccess} />}
                {activeTab === 'tasks' && <TaskList showSuccess={showSuccess} />}
                {activeTab === 'calendar' && (
                  <div className="space-y-6">
                    <CalendarStatus />
                    <CalendarEvents />
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Sidebar with secondary navigation */}
          <div className={`lg:block ${showSidebar ? 'block' : 'hidden'} w-80`}>
            <div className="bg-white/90 backdrop-blur-sm rounded-2xl p-4 shadow-xl border border-black/10 sticky top-8">
              <div className="mb-6">
                <h3 className="text-lg font-bold text-black mb-3">Quick Access</h3>
                <p className="text-sm text-gray-600 mb-4">
                  Use the AI chat for most interactions, or access these tools when needed.
                </p>
              </div>

              <nav className="space-y-2">
                {[
                  { 
                    id: 'ai', 
                    label: 'Foci.ai', 
                    description: 'Your AI assistant',
                    icon: (
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                      </svg>
                    ),
                    primary: true
                  },
                  { 
                    id: 'goals', 
                    label: 'Goals', 
                    description: 'View and manage goals',
                    icon: (
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    )
                  },
                  { 
                    id: 'tasks', 
                    label: 'Tasks', 
                    description: 'View and manage tasks',
                    icon: (
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                      </svg>
                    )
                  },
                  { 
                    id: 'calendar', 
                    label: 'Calendar', 
                    description: 'View calendar events',
                    icon: (
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                    )
                  }
                ].map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => {
                      setActiveTab(tab.id);
                      setShowSidebar(false); // Close mobile sidebar
                    }}
                    className={`w-full flex items-center space-x-3 p-3 rounded-xl font-medium text-sm transition-all duration-200 ${
                      activeTab === tab.id
                        ? tab.primary 
                          ? 'bg-black text-white shadow-lg transform scale-105'
                          : 'bg-gray-100 text-black'
                        : 'text-gray-600 hover:text-black hover:bg-gray-50'
                    }`}
                  >
                    {tab.icon}
                    <div className="text-left">
                      <div className="font-medium">{tab.label}</div>
                      <div className="text-xs opacity-75">{tab.description}</div>
                    </div>
                  </button>
                ))}
              </nav>

              {/* Quick Actions Section */}
              <div className="mt-8 pt-6 border-t border-gray-200">
                <h4 className="text-sm font-semibold text-gray-700 mb-3">Quick Actions</h4>
                <div className="space-y-2">
                  <button
                    onClick={() => {
                      setActiveTab('ai');
                      // This will be handled by the AI component to suggest goal creation
                    }}
                    className="w-full text-left p-2 text-sm text-gray-600 hover:text-black hover:bg-gray-50 rounded-lg transition-colors"
                  >
                    ✨ Create a new goal
                  </button>
                  <button
                    onClick={() => {
                      setActiveTab('ai');
                      // This will be handled by the AI component to suggest task creation
                    }}
                    className="w-full text-left p-2 text-sm text-gray-600 hover:text-black hover:bg-gray-50 rounded-lg transition-colors"
                  >
                    📝 Add a new task
                  </button>
                  <button
                    onClick={() => {
                      setActiveTab('ai');
                      // This will be handled by the AI component to suggest calendar event
                    }}
                    className="w-full text-left p-2 text-sm text-gray-600 hover:text-black hover:bg-gray-50 rounded-lg transition-colors"
                  >
                    📅 Schedule an event
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Dashboard 