import React, { useState, useEffect } from 'react';
import TaskList from './TaskList';
import AutoSchedulingDashboard from './AutoSchedulingDashboard';
import { tasksAPI } from '../services/api';

function TasksPage({ showSuccess }) {
  const [activeSection, setActiveSection] = useState('tasks'); // 'tasks' or 'auto-scheduling'
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);

  // Load dashboard data
  useEffect(() => {
    const loadDashboardData = async () => {
      try {
        setLoading(true);
        const data = await tasksAPI.getAutoSchedulingDashboard();
        setDashboardData(data);
      } catch (error) {
        console.error('Error loading dashboard data:', error);
      } finally {
        setLoading(false);
      }
    };

    loadDashboardData();
  }, []);

  return (
    <div className="h-full flex flex-col space-y-6">
      {/* Auto-Scheduling Dashboard Section */}
      <div className="bg-white/90 rounded-md border border-gray-200 shadow p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Auto-Scheduling</h3>
          <div className="flex space-x-2">
            <button
              onClick={() => setActiveSection(activeSection === 'tasks' ? 'auto-scheduling' : 'tasks')}
              className="px-3 py-1 text-sm bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition-colors"
            >
              {activeSection === 'tasks' ? 'Show Details' : 'Hide Details'}
            </button>
          </div>
        </div>
        
        {activeSection === 'auto-scheduling' ? (
          <AutoSchedulingDashboard showSuccess={showSuccess} />
        ) : (
          <div className="space-y-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {/* Compact stats cards */}
              <div className="bg-blue-50 rounded-md p-4">
                <div className="text-2xl font-bold text-blue-600">
                  {loading ? '...' : (dashboardData?.total_tasks || 0)}
                </div>
                <div className="text-sm text-blue-700">Total Tasks</div>
              </div>
                            <div className="bg-green-50 rounded-md p-4">
              <div className="text-2xl font-bold text-green-600">
                {loading ? '...' : (dashboardData?.auto_scheduled_tasks || 0)}
              </div>
              <div className="text-sm text-green-700">Auto-Scheduled</div>
            </div>
            <div className="bg-yellow-50 rounded-md p-4">
              <div className="text-2xl font-bold text-orange-600">
                {loading ? '...' : (dashboardData?.weather_dependent_tasks || 0)}
              </div>
              <div className="text-sm text-orange-700">Weather Dependent</div>
            </div>
            <div className="bg-purple-50 rounded-md p-4">
                <div className="text-2xl font-bold text-purple-600">
                  {loading ? '...' : (dashboardData?.pending_auto_schedule || 0)}
                </div>
                <div className="text-sm text-purple-700">Pending Schedule</div>
              </div>
            </div>
            
            {/* Quick trigger button */}
            <div className="flex justify-center">
              <button
                onClick={async () => {
                  try {
                    await tasksAPI.triggerAutoScheduling();
                    showSuccess('Auto-scheduling triggered successfully!');
                    // Reload dashboard data
                    const data = await tasksAPI.getAutoSchedulingDashboard();
                    setDashboardData(data);
                  } catch (error) {
                    console.error('Error triggering auto-scheduling:', error);
                  }
                }}
                className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors font-medium"
              >
                Trigger Auto-Scheduling
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Tasks Section */}
      <div className="flex-1 bg-white/90 rounded-md border border-gray-200 shadow">
        <div className="p-6 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">Tasks</h3>
          <p className="text-sm text-gray-600 mt-1">
            Manage your tasks and enable auto-scheduling for automatic time slot assignment
          </p>
        </div>
        <div className="p-6">
          <TaskList showSuccess={showSuccess} />
        </div>
      </div>
    </div>
  );
}

export default TasksPage; 