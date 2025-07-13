import React, { useState } from 'react';
import MilestoneRow from './MilestoneRow';
import { milestonesAPI } from '../services/api';

export default function GoalBreakdownForm({ goal, initialMilestones = [], onSave, onCancel, reloadMilestones, loading, error }) {
  const [mainGoal, setMainGoal] = useState(goal.title || '');

  // Add a new milestone
  const handleAddMilestone = async () => {
    try {
      const token = localStorage.getItem('authToken') || '';
      await milestonesAPI.create(goal.id, { title: '', order: initialMilestones.length + 1 }, token);
      await reloadMilestones();
    } catch (err) {
      alert('Failed to add milestone');
    }
  };

  // Update a milestone
  const handleEditMilestone = async (milestoneId, newMilestone) => {
    try {
      const token = localStorage.getItem('authToken') || '';
      await milestonesAPI.update(milestoneId, newMilestone, token);
      await reloadMilestones();
    } catch (err) {
      alert('Failed to update milestone');
    }
  };

  // Delete a milestone
  const handleDeleteMilestone = async (milestoneId) => {
    if (!window.confirm('Delete this milestone?')) return;
    try {
      const token = localStorage.getItem('authToken') || '';
      await milestonesAPI.delete(milestoneId, token);
      await reloadMilestones();
    } catch (err) {
      alert('Failed to delete milestone');
    }
  };

  // Move milestone up/down (reorder)
  const handleMoveMilestone = async (idx, direction) => {
    const milestones = initialMilestones;
    const targetIdx = idx + direction;
    if (targetIdx < 0 || targetIdx >= milestones.length) return;
    // Swap order values and update both milestones
    const token = localStorage.getItem('authToken') || '';
    const m1 = milestones[idx];
    const m2 = milestones[targetIdx];
    await milestonesAPI.update(m1.id, { ...m1, order: m2.order }, token);
    await milestonesAPI.update(m2.id, { ...m2, order: m1.order }, token);
    await reloadMilestones();
  };

  return (
    <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 space-y-4">
      {/* Step 1: Main Goal Statement */}
      <div>
        <label className="block text-xs font-semibold text-gray-600 mb-1">Main Goal</label>
        <input
          className="w-full border rounded px-2 py-1 text-sm"
          value={mainGoal}
          onChange={e => setMainGoal(e.target.value)}
        />
      </div>

      {/* Step 2: Milestones */}
      <div>
        <label className="block text-xs font-semibold text-gray-600 mb-1">Milestones</label>
        {loading && <div className="text-xs text-gray-400">Loading milestones...</div>}
        {error && <div className="text-xs text-red-500">{error}</div>}
        <div className="space-y-4">
          {initialMilestones.map((milestone, idx) => (
            <MilestoneRow
              key={milestone.id}
              milestone={milestone}
              onChange={newMilestone => handleEditMilestone(milestone.id, newMilestone)}
              onDelete={() => handleDeleteMilestone(milestone.id)}
              onMoveUp={() => handleMoveMilestone(idx, -1)}
              onMoveDown={() => handleMoveMilestone(idx, 1)}
              isFirst={idx === 0}
              isLast={idx === initialMilestones.length - 1}
              reloadMilestones={reloadMilestones}
            />
          ))}
        </div>
        <button
          className="mt-2 text-xs text-blue-700 underline hover:text-blue-900"
          onClick={handleAddMilestone}
        >
          + Add another milestone
        </button>
      </div>

      {/* Save/Cancel */}
      <div className="flex space-x-2 mt-4">
        <button
          className="bg-blue-600 text-white px-3 py-1 rounded hover:bg-blue-700 text-sm"
          onClick={() => onSave(mainGoal, initialMilestones)}
        >
          Save Breakdown
        </button>
        <button
          className="bg-gray-200 text-gray-700 px-3 py-1 rounded hover:bg-gray-300 text-sm"
          onClick={onCancel}
        >
          Cancel
        </button>
      </div>
    </div>
  );
} 