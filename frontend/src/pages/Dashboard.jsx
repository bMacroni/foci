import React, { useState } from 'react'
import GoalList from '../components/GoalList'
import TaskList from '../components/TaskList'
import CalendarStatus from '../components/CalendarStatus'
import CalendarEvents from '../components/CalendarEvents'
import AIChat from '../components/AIChat'

function Dashboard({ showSuccess }) {
  const [activeTab, setActiveTab] = useState('ai');

  return (
    <div className="min-h-screen bg-white flex flex-col">
      {/* Main Content Area */}
      <div className="flex-1 flex flex-col">
        {/* Header - Only show on desktop */}
        <div className="hidden lg:block bg-white border-b border-gray-200 px-6 py-4">
          <div className="flex items-center space-x-4">
            <div className="w-10 h-10 bg-black rounded-xl flex items-center justify-center shadow-lg">
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
              </svg>
            </div>
            <div>
              <h1 className="text-2xl font-bold text-black">Foci</h1>
              <p className="text-gray-600 text-sm">AI-powered productivity</p>
            </div>
          </div>
        </div>

        {/* Content Area */}
        <div className={`flex-1 ${activeTab === 'ai' ? 'p-0' : 'p-4 lg:p-6'}`}>
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
                <button
                  onClick={() => setActiveTab('ai')}
                  className="flex items-center space-x-2 px-3 py-2 bg-black text-white rounded-xl hover:bg-gray-800 transition-colors text-sm font-medium"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                  </svg>
                  <span className="hidden sm:inline">Back to AI</span>
                </button>
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

      {/* Bottom Navigation */}
      <div className="bg-white border-t border-gray-200 px-4 py-2 lg:hidden">
        <nav className="flex justify-around">
          {[
            { 
              id: 'ai', 
              label: 'AI Chat',
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
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              )
            },
            { 
              id: 'tasks', 
              label: 'Tasks',
              icon: (
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
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
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex flex-col items-center space-y-1 p-2 rounded-lg transition-colors ${
                activeTab === tab.id
                  ? 'text-black bg-gray-100'
                  : 'text-gray-500 hover:text-black'
              }`}
            >
              {tab.icon}
              <span className="text-xs font-medium">{tab.label}</span>
            </button>
          ))}
        </nav>
      </div>

      {/* Desktop Sidebar */}
      <div className="hidden lg:block lg:fixed lg:right-6 lg:top-6 lg:w-80">
        <div className="bg-white/90 backdrop-blur-sm rounded-2xl p-4 shadow-xl border border-black/10">
          <div className="mb-4">
            <h3 className="text-lg font-bold text-black mb-2">Quick Access</h3>
            <p className="text-sm text-gray-600">
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
                onClick={() => setActiveTab(tab.id)}
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
        </div>
      </div>
    </div>
  )
}

export default Dashboard 