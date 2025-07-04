import React, { useState, useEffect } from 'react';
import { goalsAPI } from '../services/api';
import GoalForm from './GoalForm';

const GoalList = () => {
  const [goals, setGoals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingGoal, setEditingGoal] = useState(null);

  const fetchGoals = async () => {
    try {
      setLoading(true);
      console.log('Fetching goals...');
      const response = await goalsAPI.getAll();
      console.log('Goals response:', response);
      console.log('Goals data:', response.data);
      setGoals(response.data);
    } catch (err) {
      console.error('Error fetching goals:', err);
      setError('Failed to load goals');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGoals();
  }, []);

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this goal?')) {
      try {
        await goalsAPI.delete(id);
        setGoals(goals.filter(goal => goal.id !== id));
      } catch (err) {
        setError('Failed to delete goal');
        console.error('Error deleting goal:', err);
      }
    }
  };

  const handleEdit = (goal) => {
    setEditingGoal(goal);
    setShowForm(true);
  };

  const handleFormSuccess = () => {
    setShowForm(false);
    setEditingGoal(null);
    fetchGoals();
  };

  const handleFormCancel = () => {
    setShowForm(false);
    setEditingGoal(null);
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'No due date';
    return new Date(dateString).toLocaleDateString();
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
        <h2 className="text-2xl font-bold text-gray-900">Goals</h2>
        <button
          onClick={() => setShowForm(true)}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          Add Goal
        </button>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      )}

      {showForm && (
        <GoalForm
          goal={editingGoal}
          onSuccess={handleFormSuccess}
          onCancel={handleFormCancel}
        />
      )}

      {goals.length === 0 ? (
        <div className="text-center py-8">
          <p className="text-gray-500">No goals yet. Create your first goal to get started!</p>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {goals.map((goal) => (
            <div key={goal.id} className="bg-white rounded-lg shadow-md p-6">
              <div className="flex justify-between items-start mb-3">
                <h3 className="text-lg font-semibold text-gray-900">{goal.title}</h3>
                <div className="flex space-x-2">
                  <button
                    onClick={() => handleEdit(goal)}
                    className="text-blue-600 hover:text-blue-800 text-sm"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDelete(goal.id)}
                    className="text-red-600 hover:text-red-800 text-sm"
                  >
                    Delete
                  </button>
                </div>
              </div>
              
              {goal.description && (
                <p className="text-gray-600 mb-3">{goal.description}</p>
              )}
              
              <div className="text-sm text-gray-500">
                Due: {formatDate(goal.due_date)}
              </div>
              
              <div className="mt-3">
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                  goal.completed 
                    ? 'bg-green-100 text-green-800' 
                    : 'bg-yellow-100 text-yellow-800'
                }`}>
                  {goal.completed ? 'Completed' : 'In Progress'}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default GoalList; 