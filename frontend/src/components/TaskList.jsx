import React, { useState, useEffect } from 'react';
import { tasksAPI } from '../services/api';
import TaskForm from './TaskForm';

const TaskList = () => {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingTask, setEditingTask] = useState(null);

  const fetchTasks = async () => {
    try {
      setLoading(true);
      const response = await tasksAPI.getAll();
      console.log('Frontend received tasks data:', response.data);
      setTasks(response.data);
    } catch (err) {
      setError('Failed to load tasks');
      console.error('Error fetching tasks:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTasks();
  }, []);

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this task?')) {
      try {
        await tasksAPI.delete(id);
        setTasks(tasks.filter(task => task.id !== id));
      } catch (err) {
        setError('Failed to delete task');
        console.error('Error deleting task:', err);
      }
    }
  };

  const handleEdit = (task) => {
    setEditingTask(task);
    setShowForm(true);
  };

  const handleFormSuccess = () => {
    setShowForm(false);
    setEditingTask(null);
    fetchTasks();
  };

  const handleFormCancel = () => {
    setShowForm(false);
    setEditingTask(null);
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'No due date';
    return new Date(dateString).toLocaleDateString();
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'high':
        return 'bg-red-100 text-red-800';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800';
      case 'low':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getPriorityLabel = (priority) => {
    return priority ? priority.charAt(0).toUpperCase() + priority.slice(1) : 'None';
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-900">Tasks</h2>
        <button
          onClick={() => setShowForm(true)}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          Add Task
        </button>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      )}

      {showForm && (
        <TaskForm
          task={editingTask}
          onSuccess={handleFormSuccess}
          onCancel={handleFormCancel}
        />
      )}

      {tasks.length === 0 ? (
        <div className="text-center py-8">
          <p className="text-gray-500">No tasks yet. Create your first task to get started!</p>
        </div>
      ) : (
        <div className="space-y-4">
          {tasks.map((task) => (
            <div key={task.id} className="bg-white rounded-lg shadow-md p-6">
              <div className="flex justify-between items-start mb-3">
                <div className="flex-1">
                  <div className="flex items-center space-x-3">
                    <h3 className={`text-lg font-semibold ${task.completed ? 'line-through text-gray-500' : 'text-gray-900'}`}>
                      {task.title}
                    </h3>
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getPriorityColor(task.priority)}`}>
                      {getPriorityLabel(task.priority)}
                    </span>
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      task.completed 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-yellow-100 text-yellow-800'
                    }`}>
                      {task.completed ? 'Completed' : 'Pending'}
                    </span>
                  </div>
                </div>
                <div className="flex space-x-2">
                  <button
                    onClick={() => handleEdit(task)}
                    className="text-blue-600 hover:text-blue-800 text-sm"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDelete(task.id)}
                    className="text-red-600 hover:text-red-800 text-sm"
                  >
                    Delete
                  </button>
                </div>
              </div>
              
              {task.description && (
                <p className={`text-gray-600 mb-3 ${task.completed ? 'line-through' : ''}`}>
                  {task.description}
                </p>
              )}
              
              <div className="flex flex-wrap gap-4 text-sm text-gray-500">
                <div>Due: {formatDate(task.due_date)}</div>
                {task.goals && (
                  <div className="flex items-center">
                    <span className="text-blue-600 font-medium">Goal:</span>
                    <span className="ml-1">{task.goals.title}</span>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default TaskList; 