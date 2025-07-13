import React, { useState, useEffect } from 'react';
import GoalBreakdownForm from './GoalBreakdownForm';
import { milestonesAPI } from '../services/api';

export default function GoalBreakdownAssistant({ goal, onSave }) {
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
      const token = localStorage.getItem('authToken') || '';
      const data = await milestonesAPI.readAll(goal.id, token);
      setMilestones(data);
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
        <button
          className="text-sm text-blue-700 underline hover:text-blue-900"
          onClick={() => setExpanded(true)}
        >
          {milestones.length
            ? `Goal Breakdown: ${milestones.length} milestones defined. [Expand ▼]`
            : 'Break Down This Goal ▼'}
        </button>
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