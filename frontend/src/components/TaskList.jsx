import React, { useState, useEffect } from 'react';
import { tasksAPI } from '../services/api';
import TaskForm from './TaskForm';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';

// Remove the smokeStyle CSS and related logic

const TaskList = ({ showSuccess }) => {
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
      setTasks(Array.isArray(response.data) ? response.data : []);
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
        setTasks(prev => Array.isArray(prev) ? prev.filter(task => task.id !== id) : []);
        showSuccess('Task deleted successfully!');
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
    showSuccess(editingTask ? 'Task updated successfully!' : 'Task created successfully!');
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
        return 'bg-gray-100 text-gray-800';
      case 'medium':
        return 'bg-gray-100 text-gray-800';
      case 'low':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getPriorityLabel = (priority) => {
    return priority ? priority.charAt(0).toUpperCase() + priority.slice(1) : 'None';
  };

  // Helper to get border color class based on priority
  const getPriorityBorder = (priority) => {
    switch (priority) {
      case 'high':
        return 'border-orange-400';
      case 'medium':
        return 'border-yellow-300';
      case 'low':
      default:
        return 'border-gray-200';
    }
  };

  // Kanban status columns
  const statusColumns = [
    { key: 'todo', label: 'To Do', status: 'not_started' },
    { key: 'inprogress', label: 'In Progress', status: 'in_progress' },
    { key: 'done', label: 'Done', status: 'completed' }
  ];

  // Group tasks by status
  const groupedTasks = {
    not_started: [],
    in_progress: [],
    completed: []
  };
  (Array.isArray(tasks) ? tasks : []).forEach(task => {
    if (task.completed || task.status === 'completed') groupedTasks.completed.push(task);
    else if (task.status === 'in_progress') groupedTasks.in_progress.push(task);
    else groupedTasks.not_started.push(task);
  });

  // Drag-and-drop handler
  const onDragEnd = async (result) => {
    if (!result.destination) return;
    const { source, destination, draggableId } = result;
    if (source.droppableId === destination.droppableId && source.index === destination.index) return;
    // Find the task
    const allTasks = [...groupedTasks.not_started, ...groupedTasks.in_progress, ...groupedTasks.completed];
    const task = allTasks.find(t => t.id.toString() === draggableId);
    if (!task) return;
    // Determine new status
    let newStatus = 'not_started';
    if (destination.droppableId === 'inprogress') newStatus = 'in_progress';
    if (destination.droppableId === 'done') newStatus = 'completed';
    // Update status and completed
    const updated = { ...task, status: newStatus, completed: newStatus === 'completed' };
    // Optimistically update local state
    setTasks(prevTasks => prevTasks.map(t => t.id === task.id ? updated : t));
    // Send update to backend
    try {
      await tasksAPI.update(task.id, updated);
    } catch (err) {
      // Revert local state if backend update fails
      setTasks(prevTasks => prevTasks.map(t => t.id === task.id ? task : t));
      setError('Failed to update task status.');
    }
  };

  // Find the most urgent To Do or In Progress task for Today’s Focus
  const getTodaysFocusTask = () => {
    const now = new Date();
    const upcoming = [...groupedTasks.not_started, ...groupedTasks.in_progress].filter(
      t => !t.completed && t.due_date
    );
    if (upcoming.length === 0) return null;
    upcoming.sort((a, b) => new Date(a.due_date) - new Date(b.due_date));
    return upcoming[0];
  };
  const todaysFocus = getTodaysFocusTask();

  if (loading) {
    return (
      <div className="flex justify-center items-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8 bg-white min-h-screen py-8">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold text-black">Your Tasks</h2>
          <p className="text-gray-300 mt-1">Stay organized and productive</p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="px-6 py-3 bg-black text-white rounded-2xl hover:bg-gray-800 focus:outline-none focus:ring-4 focus:ring-white/20 shadow-lg transition-all duration-200 transform hover:scale-105 font-medium"
        >
          <span className="flex items-center space-x-2">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
            <span>Add Task</span>
          </span>
        </button>
      </div>

      {error && (
        <div className="bg-red-50/80 backdrop-blur-sm border border-red-200 text-red-700 px-6 py-4 rounded-2xl shadow-sm">
          <div className="flex items-center space-x-2">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span className="font-medium">{error}</span>
          </div>
        </div>
      )}

      {showForm && (
        <TaskForm
          task={editingTask}
          onSuccess={handleFormSuccess}
          onCancel={handleFormCancel}
        />
      )}

      {(Array.isArray(tasks) ? tasks : []).length === 0 ? (
        <div className="text-center py-16">
          <div className="w-24 h-24 bg-black rounded-full flex items-center justify-center mx-auto mb-6">
            <svg className="w-12 h-12 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
          </div>
          <h3 className="text-xl font-semibold text-black mb-2">No tasks yet</h3>
          <p className="text-gray-300">Create your first task to get organized!</p>
        </div>
      ) : (
        <DragDropContext onDragEnd={onDragEnd}>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {statusColumns.map(col => (
              <Droppable droppableId={col.key} key={col.key}>
                {(provided, snapshot) => (
                  <div
                    ref={provided.innerRef}
                    {...provided.droppableProps}
                    className={`rounded-2xl min-h-[200px] p-3 transition-all duration-200 ${snapshot.isDraggingOver ? 'bg-blue-100/60' : 'bg-blue-50/40'}`}
                  >
                    <div className="text-lg font-bold text-blue-900 mb-3 flex items-center space-x-2">
                      {col.label === 'To Do' && <span>📝</span>}
                      {col.label === 'In Progress' && <span>⏳</span>}
                      {col.label === 'Done' && <span>✅</span>}
                      <span>{col.label}</span>
                    </div>
                    {groupedTasks[col.status].map((task, idx) => (
                      <Draggable draggableId={task.id.toString()} index={idx} key={task.id}>
                        {(provided, snapshot) => (
                          <div
                            ref={provided.innerRef}
                            {...provided.draggableProps}
                            {...provided.dragHandleProps}
                            className={`bg-white border ${getPriorityBorder(task.priority)} rounded-3xl shadow-xl p-6 mb-4 transition-all duration-200 transform ${snapshot.isDragging ? 'scale-105 shadow-2xl' : 'hover:scale-[1.02] hover:shadow-2xl'} group`}
                          >
                            <div className="flex justify-between items-start mb-4">
                              <div className="flex-1">
                                <div className="flex items-center space-x-3 mb-2">
                                  <h3 className={`text-xl font-bold leading-tight ${task.completed ? 'line-through text-gray-500' : 'text-black'}`}>
                                    {task.title}
                                  </h3>
                                  <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getPriorityColor(task.priority)}`}>
                                    {getPriorityLabel(task.priority)}
                                  </span>
                                  <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                                    task.completed 
                                      ? 'bg-gray-100 text-gray-800 border border-gray-200' 
                                      : 'bg-gray-100 text-gray-800 border border-gray-200'
                                  }`}>
                                    <div className={`w-2 h-2 rounded-full mr-2 ${
                                      task.completed ? 'bg-gray-500' : 'bg-gray-400'
                                    }`}></div>
                                    {task.completed ? (
                                      <span className="flex items-center">
                                        <svg className="w-4 h-4 text-green-500 animate-bounce-in" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                        </svg>
                                        <span className="ml-1">Completed</span>
                                      </span>
                                    ) : 'Pending'}
                                  </span>
                                </div>
                              </div>
                              <div className="flex space-x-1">
                                <button
                                  onClick={() => handleEdit(task)}
                                  className="p-2 text-gray-600 hover:text-black hover:bg-gray-100 rounded-xl transition-colors duration-200 focus:ring-2 focus:ring-blue-400"
                                  title="Edit task"
                                >
                                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                  </svg>
                                </button>
                                <button
                                  onClick={() => handleDelete(task.id)}
                                  className="p-2 text-gray-600 hover:text-red-600 hover:bg-red-100 rounded-xl transition-colors duration-200 focus:ring-2 focus:ring-red-400"
                                  title="Delete task"
                                >
                                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                  </svg>
                                </button>
                              </div>
                            </div>
                            {task.description && (
                              <p className={`text-gray-600 mb-4 leading-relaxed ${task.completed ? 'line-through opacity-60' : ''}`}>
                                {task.description}
                              </p>
                            )}
                            {/* New fields for AI scheduling */}
                            <div className="flex flex-wrap gap-4 text-sm text-gray-500 mt-2">
                              {task.preferred_time_of_day && (
                                <div className="flex items-center space-x-1">
                                  <span className="font-medium">Preferred Time:</span>
                                  <span className="capitalize">{task.preferred_time_of_day}</span>
                                </div>
                              )}
                              {task.deadline_type && (
                                <div className="flex items-center space-x-1">
                                  <span className="font-medium">Deadline Type:</span>
                                  <span className="capitalize">{task.deadline_type}</span>
                                </div>
                              )}
                              {task.travel_time_minutes !== undefined && task.travel_time_minutes !== null && task.travel_time_minutes !== '' && (
                                <div className="flex items-center space-x-1">
                                  <span className="font-medium">Travel Time:</span>
                                  <span>{task.travel_time_minutes} min</span>
                                </div>
                              )}
                            </div>
                          </div>
                        )}
                      </Draggable>
                    ))}
                    {provided.placeholder}
                  </div>
                )}
              </Droppable>
            ))}
          </div>
        </DragDropContext>
      )}
    </div>
  );
};

export default TaskList; 