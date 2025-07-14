import React, { useState, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { goalsAPI } from '../services/api';
import GoalForm from './GoalForm';
import GoalBreakdownAssistant from './GoalBreakdownAssistant';
import { milestonesAPI } from '../services/api';
import { stepsAPI } from '../services/api';

const GoalList = ({ showSuccess }) => {
  const [goals, setGoals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingGoal, setEditingGoal] = useState(null);
  const [progressByGoal, setProgressByGoal] = useState({});

  // Category configuration with icons and colors
  const categoryConfig = {
    career: { 
      label: 'Career', 
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2-2v2m8 0V6a2 2 0 012 2v6a2 2 0 01-2 2H8a2 2 0 01-2-2V8a2 2 0 012-2V6" />
        </svg>
      ), 
      color: 'bg-gray-100 text-gray-800 border-gray-200' 
    },
    health: { 
      label: 'Health', 
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
        </svg>
      ), 
      color: 'bg-gray-100 text-gray-800 border-gray-200' 
    },
    personal: { 
      label: 'Personal', 
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
        </svg>
      ), 
      color: 'bg-gray-100 text-gray-800 border-gray-200' 
    },
    education: { 
      label: 'Education', 
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
        </svg>
      ), 
      color: 'bg-gray-100 text-gray-800 border-gray-200' 
    },
    finance: { 
      label: 'Finance', 
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
        </svg>
      ), 
      color: 'bg-gray-100 text-gray-800 border-gray-200' 
    },
    relationships: { 
      label: 'Relationships', 
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
        </svg>
      ), 
      color: 'bg-gray-100 text-gray-800 border-gray-200' 
    },
    other: { 
      label: 'Other', 
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
        </svg>
      ), 
      color: 'bg-gray-100 text-gray-800 border-gray-200' 
    },
  };

  const fetchGoals = async () => {
    try {
      setLoading(true);
      console.log('Fetching goals...');
      const response = await goalsAPI.getAll();
      console.log('Goals response:', response);
      console.log('Goals data:', response.data);
      setGoals(Array.isArray(response.data) ? response.data : []);
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

  // Fetch milestones and steps for each goal to calculate progress
  useEffect(() => {
    const fetchProgress = async () => {
      const progressMap = {};
      for (const goal of goals) {
        try {
          const token = localStorage.getItem('jwt_token') || '';
          const milestones = await milestonesAPI.readAll(goal.id, token);
          let totalSteps = 0;
          let completedSteps = 0;
          for (const milestone of milestones) {
            const steps = await stepsAPI.readAll(milestone.id, token);
            totalSteps += steps.length;
            completedSteps += steps.filter(s => s.completed).length;
          }
          progressMap[goal.id] = {
            total: totalSteps,
            completed: completedSteps,
            percent: totalSteps > 0 ? Math.round((completedSteps / totalSteps) * 100) : 0
          };
        } catch (e) {
          progressMap[goal.id] = { total: 0, completed: 0, percent: 0 };
        }
      }
      setProgressByGoal(progressMap);
    };
    if (goals.length > 0) fetchProgress();
  }, [goals]);

  // Add a function to refresh progress for a specific goal
  const refreshProgressForGoal = async (goalId) => {
    console.log('refreshProgressForGoal: Called for goalId:', goalId);
    try {
      const token = localStorage.getItem('jwt_token') || '';
      console.log('refreshProgressForGoal: Fetching milestones for goal:', goalId);
      const milestones = await milestonesAPI.readAll(goalId, token);
      console.log('refreshProgressForGoal: Milestones data:', milestones);
      
      let totalSteps = 0;
      let completedSteps = 0;
      for (const milestone of milestones) {
        console.log('refreshProgressForGoal: Fetching steps for milestone:', milestone.id);
        const steps = await stepsAPI.readAll(milestone.id, token);
        console.log('refreshProgressForGoal: Steps for milestone', milestone.id, ':', steps);
        totalSteps += steps.length;
        completedSteps += steps.filter(s => s.completed).length;
      }
      
      const newProgress = {
        total: totalSteps,
        completed: completedSteps,
        percent: totalSteps > 0 ? Math.round((completedSteps / totalSteps) * 100) : 0
      };
      
      console.log('refreshProgressForGoal: Calculated progress:', newProgress);
      setProgressByGoal(prev => ({
        ...prev,
        [goalId]: newProgress
      }));
      console.log('refreshProgressForGoal: Updated progressByGoal state');
    } catch (e) {
      console.error('refreshProgressForGoal: Error refreshing progress for goal:', goalId, e);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this goal?')) {
      try {
        await goalsAPI.delete(id);
        setGoals(prev => Array.isArray(prev) ? prev.filter(goal => goal.id !== id) : []);
        showSuccess('Goal deleted successfully!');
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
    showSuccess(editingGoal ? 'Goal updated successfully!' : 'Goal created successfully!');
  };

  const handleFormCancel = () => {
    setShowForm(false);
    setEditingGoal(null);
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'No due date';
    return new Date(dateString).toLocaleDateString();
  };

  // Group goals by category
  const goalsArray = Array.isArray(goals) ? goals : [];
  const groupedGoals = goalsArray.reduce((acc, goal) => {
    const category = goal.category || 'other';
    if (!acc[category]) {
      acc[category] = [];
    }
    acc[category].push(goal);
    return acc;
  }, {});

  // Sort categories in a logical order
  const categoryOrder = ['career', 'health', 'personal', 'education', 'finance', 'relationships', 'other'];

  if (loading) {
    return (
      <div className="flex justify-center items-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
            Your Goals
          </h2>
          <p className="text-gray-600 mt-1">Track your progress and stay motivated</p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="px-6 py-3 bg-black text-white rounded-2xl hover:bg-gray-900 focus:outline-none focus:ring-4 focus:ring-black/10 shadow-lg transition-all duration-200 transform hover:scale-105 font-medium"
        >
          <span className="flex items-center space-x-2">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
            <span>Add Goal</span>
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
        <GoalForm
          goal={editingGoal}
          onSuccess={handleFormSuccess}
          onCancel={handleFormCancel}
        />
      )}

      {(Array.isArray(goals) ? goals : []).length === 0 ? (
        <div className="text-center py-16">
          <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <svg className="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h3 className="text-xl font-semibold text-gray-900 mb-2">No goals yet</h3>
          <p className="text-gray-600">Create your first goal to start your journey!</p>
        </div>
      ) : (
        <div className="space-y-8">
          {categoryOrder.map(category => {
            const categoryGoals = groupedGoals[category];
            if (!categoryGoals || categoryGoals.length === 0) return null;
            
            const config = categoryConfig[category];
            
            return (
              <div key={category} className="space-y-4">
                <div className="flex items-center space-x-3">
                  <div className="text-gray-700">{config.icon}</div>
                  <h3 className="text-xl font-bold text-gray-900">{config.label}</h3>
                  <span className="text-sm text-gray-500">({categoryGoals.length} goal{categoryGoals.length !== 1 ? 's' : ''})</span>
                </div>
                
                {/* Change from grid to vertical stack for full-width cards */}
                <div className="flex flex-col gap-6">
                  {categoryGoals.map((goal) => (
                    <div key={goal.id} className="w-full bg-white/90 backdrop-blur-sm rounded-3xl shadow-xl border border-black/10 p-6 hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1 mx-auto">
                      <div className="flex justify-between items-start mb-4">
                        <h3 className="text-xl font-bold text-black leading-tight">{goal.title}</h3>
                        <div className="flex space-x-1">
                          <button
                            onClick={() => handleEdit(goal)}
                            className="p-2 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-xl transition-colors duration-200"
                            title="Edit goal"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                            </svg>
                          </button>
                          <button
                            onClick={() => handleDelete(goal.id)}
                            className="p-2 text-gray-600 hover:text-black hover:bg-gray-50 rounded-xl transition-colors duration-200"
                            title="Delete goal"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                        </div>
                      </div>
                      
                      {goal.description && (
                        <div className="mb-4 prose prose-sm max-w-none">
                          <div className="text-gray-600 leading-relaxed">
                            <ReactMarkdown 
                              remarkPlugins={[remarkGfm]}
                              components={{
                                // Custom styling for markdown elements
                                p: ({ children }) => <p className="mb-2">{children}</p>,
                                strong: ({ children }) => <strong className="font-bold text-gray-800">{children}</strong>,
                                em: ({ children }) => <em className="italic text-gray-700">{children}</em>,
                                ul: ({ children }) => <ul className="list-disc list-inside mb-2 space-y-1">{children}</ul>,
                                ol: ({ children }) => <ol className="list-decimal list-inside mb-2 space-y-1">{children}</ol>,
                                li: ({ children }) => <li className="text-gray-600">{children}</li>,
                                a: ({ href, children }) => (
                                  <a href={href} className="text-blue-600 hover:text-blue-800 underline" target="_blank" rel="noopener noreferrer">
                                    {children}
                                  </a>
                                ),
                                h1: ({ children }) => <h1 className="text-lg font-bold text-gray-900 mb-2">{children}</h1>,
                                h2: ({ children }) => <h2 className="text-base font-bold text-gray-900 mb-2">{children}</h2>,
                                h3: ({ children }) => <h3 className="text-sm font-bold text-gray-900 mb-1">{children}</h3>,
                                blockquote: ({ children }) => (
                                  <blockquote className="border-l-4 border-blue-200 pl-4 italic text-gray-600 mb-2">
                                    {children}
                                  </blockquote>
                                ),
                                code: ({ children }) => (
                                  <code className="bg-gray-100 px-1 py-0.5 rounded text-sm font-mono text-gray-800">
                                    {children}
                                  </code>
                                ),
                              }}
                            >
                              {goal.description}
                            </ReactMarkdown>
                          </div>
                        </div>
                      )}
                      
                      <GoalBreakdownAssistant goal={goal} subTasks={goal.subTasks || []} onSave={() => {}} refreshProgress={refreshProgressForGoal} />

                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center space-x-2 text-sm text-gray-500">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                          <span>{formatDate(goal.target_completion_date)}</span>
                        </div>
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <span className={`inline-flex items-center px-3 py-1.5 rounded-full text-sm font-medium border ${config.color}`}>
                          <div className={`w-2 h-2 rounded-full mr-2 ${
                            goal.completed ? 'bg-green-500' : 'bg-gray-400'
                          }`}></div>
                          {goal.completed ? 'Completed' : 'In Progress'}
                        </span>
                      </div>

                      {/* Progress Bar */}
                      <div className="mb-4">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-xs font-semibold text-gray-700">Progress</span>
                          <span className="text-xs font-semibold text-gray-700">
                            {progressByGoal[goal.id]?.percent ?? 0}%
                          </span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2.5">
                          <div
                            className="bg-green-500 h-2.5 rounded-full transition-all duration-300"
                            style={{ width: `${progressByGoal[goal.id]?.percent ?? 0}%` }}
                          ></div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default GoalList; 