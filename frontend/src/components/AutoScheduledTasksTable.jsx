import React, { useState } from 'react';
import { tasksAPI } from '../services/api';

const AutoScheduledTasksTable = ({ tasks, onTaskUpdate, showSuccess }) => {
  const [updatingTask, setUpdatingTask] = useState(null);

  const handleToggleAutoSchedule = async (taskId, currentStatus) => {
    setUpdatingTask(taskId);
    try {
      await tasksAPI.update(taskId, { auto_schedule_enabled: !currentStatus });
      showSuccess('Task auto-scheduling updated successfully!');
      onTaskUpdate(); // Refresh the parent component
    } catch (error) {
      console.error('Error updating task:', error);
      showSuccess('Failed to update task auto-scheduling');
    } finally {
      setUpdatingTask(null);
    }
  };

  const formatDateTime = (dateTimeString) => {
    if (!dateTimeString) return 'Not scheduled';
    const date = new Date(dateTimeString);
    return date.toLocaleString();
  };

  const formatDuration = (minutes) => {
    if (!minutes) return '-';
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;
  };

  const formatTravelTime = (minutes) => {
    if (!minutes) return '-';
    return `${minutes}m`;
  };

  if (!tasks || tasks.length === 0) {
    return (
      <div className="bg-white/90 rounded-md border border-gray-200 shadow mb-6">
        <div className="p-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">Auto-Scheduled Tasks</h3>
          <p className="text-sm text-gray-600 mt-1">
            Tasks with auto-scheduling enabled will appear here
          </p>
        </div>
        <div className="p-8 text-center text-gray-500">
          <p>No auto-scheduled tasks found.</p>
          <p className="text-sm mt-1">Enable auto-scheduling on your tasks to see them here.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white/90 rounded-md border border-gray-200 shadow mb-6">
      <div className="p-4 border-b border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900">Auto-Scheduled Tasks</h3>
        <p className="text-sm text-gray-600 mt-1">
          Tasks with auto-scheduling enabled ({tasks.length} tasks)
        </p>
      </div>
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Task
              </th>
                             <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                 Duration
               </th>
               <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                 Travel Time
               </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Scheduled Time
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Status
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {tasks.map((task) => (
              <tr key={task.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    <div className="flex-shrink-0 h-10 w-10">
                      <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                        <span className="text-sm font-medium text-blue-600">
                          {task.title.charAt(0).toUpperCase()}
                        </span>
                      </div>
                    </div>
                    <div className="ml-4">
                      <div className="text-sm font-medium text-gray-900">
                        {task.title}
                      </div>
                      {task.description && (
                        <div className="text-sm text-gray-500 truncate max-w-xs">
                          {task.description}
                        </div>
                      )}
                    </div>
                  </div>
                                 </td>
                 <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                   {formatDuration(task.estimated_duration_minutes)}
                 </td>
                 <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                   {formatTravelTime(task.travel_time_minutes)}
                 </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {formatDateTime(task.scheduled_time)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                    task.status === 'completed' ? 'bg-green-100 text-green-800' :
                    task.status === 'in_progress' ? 'bg-blue-100 text-blue-800' :
                    'bg-gray-100 text-gray-800'
                  }`}>
                    {task.status || 'pending'}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                  <button
                    onClick={() => handleToggleAutoSchedule(task.id, task.auto_schedule_enabled)}
                    disabled={updatingTask === task.id}
                    className="text-indigo-600 hover:text-indigo-900 disabled:opacity-50"
                  >
                    {updatingTask === task.id ? 'Updating...' : 'Disable Auto-Schedule'}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default AutoScheduledTasksTable; 