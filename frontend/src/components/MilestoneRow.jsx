import React, { useState } from 'react';
import StepRow from './StepRow';
import { stepsAPI } from '../services/api';

export default function MilestoneRow({ milestone, onChange, onDelete, onMoveUp, onMoveDown, isFirst, isLast, reloadMilestones }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Add a new step
  const handleAddStep = async () => {
    setLoading(true);
    setError('');
    try {
      const token = localStorage.getItem('authToken') || '';
      await stepsAPI.create(milestone.id, { text: '', order: (milestone.steps?.length || 0) + 1 }, token);
      await reloadMilestones();
    } catch (err) {
      setError('Failed to add step');
    } finally {
      setLoading(false);
    }
  };

  // Update a step
  const handleEditStep = async (stepId, newStep) => {
    setLoading(true);
    setError('');
    try {
      const token = localStorage.getItem('authToken') || '';
      await stepsAPI.update(stepId, newStep, token);
      await reloadMilestones();
    } catch (err) {
      setError('Failed to update step');
    } finally {
      setLoading(false);
    }
  };

  // Delete a step
  const handleDeleteStep = async (stepId) => {
    if (!window.confirm('Delete this step?')) return;
    setLoading(true);
    setError('');
    try {
      const token = localStorage.getItem('authToken') || '';
      await stepsAPI.delete(stepId, token);
      await reloadMilestones();
    } catch (err) {
      setError('Failed to delete step');
    } finally {
      setLoading(false);
    }
  };

  // Move step up/down (reorder)
  const handleMoveStep = async (idx, direction) => {
    const steps = milestone.steps || [];
    const targetIdx = idx + direction;
    if (targetIdx < 0 || targetIdx >= steps.length) return;
    const token = localStorage.getItem('authToken') || '';
    const s1 = steps[idx];
    const s2 = steps[targetIdx];
    setLoading(true);
    setError('');
    try {
      await stepsAPI.update(s1.id, { ...s1, order: s2.order }, token);
      await stepsAPI.update(s2.id, { ...s2, order: s1.order }, token);
      await reloadMilestones();
    } catch (err) {
      setError('Failed to reorder steps');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white border border-gray-300 rounded-xl p-4 shadow-sm mb-2 relative">
      <div className="flex items-center space-x-2 mb-3">
        {/* Drag handle for milestone */}
        <span className="cursor-grab text-gray-400 hover:text-gray-700 mr-2" title="Drag to reorder">≡</span>
        <input
          className="flex-1 border rounded px-2 py-1 text-sm font-semibold bg-gray-50"
          value={milestone.title}
          onChange={e => onChange({ ...milestone, title: e.target.value })}
          placeholder="Milestone title..."
        />
        <button className="text-gray-400 hover:text-gray-700 px-1" onClick={onMoveUp} disabled={isFirst} title="Move up">▲</button>
        <button className="text-gray-400 hover:text-gray-700 px-1" onClick={onMoveDown} disabled={isLast} title="Move down">▼</button>
        <button className="text-red-500 hover:text-red-700 px-1" onClick={onDelete} title="Delete milestone">✕</button>
      </div>
      <div className="ml-6">
        <div className="text-xs text-gray-500 mb-1 font-semibold">Steps for this milestone:</div>
        {loading && <div className="text-xs text-gray-400">Loading steps...</div>}
        {error && <div className="text-xs text-red-500">{error}</div>}
        <div className="space-y-1">
          {(milestone.steps || []).map((step, idx) => (
            <div key={step.id} className="bg-gray-50 border border-gray-200 rounded-lg p-2 flex items-center">
              {/* Drag handle for step */}
              <span className="cursor-grab text-gray-300 hover:text-gray-500 mr-2" title="Drag to reorder">≡</span>
              <StepRow
                step={step}
                onChange={newStep => handleEditStep(step.id, newStep)}
                onDelete={() => handleDeleteStep(step.id)}
                onMoveUp={() => handleMoveStep(idx, -1)}
                onMoveDown={() => handleMoveStep(idx, 1)}
                isFirst={idx === 0}
                isLast={idx === (milestone.steps?.length || 0) - 1}
                reloadMilestones={reloadMilestones}
              />
            </div>
          ))}
        </div>
        <button className="mt-1 text-xs text-blue-700 underline hover:text-blue-900" onClick={handleAddStep}>+ Add step</button>
      </div>
    </div>
  );
} 