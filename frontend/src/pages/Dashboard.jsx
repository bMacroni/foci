import React, { useState } from 'react'
import GoalList from '../components/GoalList'
import TaskList from '../components/TaskList'

function Dashboard() {
  const [activeTab, setActiveTab] = useState('goals');

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            Welcome to MindGarden
          </h1>
          <p className="text-gray-600">
            Your AI-powered goal and task management system
          </p>
        </div>

        {/* Tab Navigation */}
        <div className="border-b border-gray-200 mb-8">
          <nav className="-mb-px flex space-x-8">
            <button
              onClick={() => setActiveTab('goals')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'goals'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Goals
            </button>
            <button
              onClick={() => setActiveTab('tasks')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'tasks'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Tasks
            </button>
          </nav>
        </div>

        {/* Tab Content */}
        <div>
          {activeTab === 'goals' && <GoalList />}
          {activeTab === 'tasks' && <TaskList />}
        </div>
      </div>
    </div>
  )
}

export default Dashboard 