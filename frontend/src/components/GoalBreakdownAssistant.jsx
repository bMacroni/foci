import React, { useState, useEffect } from 'react';
import GoalBreakdownForm from './GoalBreakdownForm';
import { milestonesAPI } from '../services/api';

export default function GoalBreakdownAssistant({ goal, onSave, refreshProgress }) {
  const [expanded, setExpanded] = useState(false);
  const [milestones, setMilestones] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Fetch milestones for this goal
  const reloadMilestones = async () => {
    setLoading(true);
    setError('');
    try {
      // TODO: Replace with real auth token
      const token = localStorage.getItem('jwt_token') || '';
      const data = await milestonesAPI.readAll(goal.id, token);
      setMilestones(data);
      // Refresh progress after milestones are reloaded
      if (refreshProgress) {
        await refreshProgress(goal.id);
      }
    } catch (err) {
      setError('Failed to load milestones');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (expanded) reloadMilestones();
    // eslint-disable-next-line
  }, [expanded, goal.id]);

  return (
    <div className="my-2">
      {!expanded ? (
        <div className="flex items-center gap-3">
          {milestones.length > 0 && (
            <span className="text-sm text-gray-500">{milestones.length} milestone{milestones.length > 1 ? 's' : ''} defined</span>
          )}
          <button
            className="px-4 py-2 bg-blue-100 text-blue-700 rounded-2xl hover:bg-blue-200 transition-all flex items-center gap-2 text-sm font-medium shadow-sm"
            onClick={() => setExpanded(true)}
            title="Expand Goal Breakdown"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8v8h16V8M4 8l8 8 8-8" />
            </svg>
            Expand
          </button>
        </div>
      ) : (
        <GoalBreakdownForm
          goal={goal}
          initialMilestones={milestones}
          onSave={(mainGoal, newMilestones) => {
            onSave(mainGoal, newMilestones);
            setExpanded(false);
          }}
          onCancel={() => setExpanded(false)}
          reloadMilestones={reloadMilestones}
          loading={loading}
          error={error}
        />
      )}
    </div>
  );
} 