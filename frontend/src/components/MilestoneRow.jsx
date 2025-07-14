import React, { useState, useCallback } from 'react';
import StepRow from './StepRow';
import { stepsAPI } from '../services/api';
import { useDrag, useDrop } from 'react-dnd';

const ItemTypes = { STEP: 'step' };

function DraggableStep({ step, index, moveStep, onDrop, ...props }) {
  const ref = React.useRef(null);
  const [, drop] = useDrop({
    accept: ItemTypes.STEP,
    hover(item) {
      if (item.index === index) return;
      moveStep(item.index, index);
      item.index = index;
    },
    drop() {
      if (onDrop) onDrop();
    },
  });
  const [{ isDragging }, drag] = useDrag({
    type: ItemTypes.STEP,
    item: { type: ItemTypes.STEP, id: step.id, index },
    collect: (monitor) => ({ isDragging: monitor.isDragging() }),
  });
  drag(drop(ref));
  return (
    <div
      ref={ref}
      className={`bg-gray-50 border border-gray-200 rounded-lg p-2 flex items-center ${isDragging ? 'opacity-50' : ''}`}
      style={{ cursor: 'grab' }}
    >
      <span className="cursor-grab text-gray-300 hover:text-gray-500 mr-2" title="Drag to reorder">≡</span>
      <StepRow {...props} step={step} />
    </div>
  );
}

export default function MilestoneRow({ milestone, onChange, onDelete, onMoveUp, onMoveDown, isFirst, isLast, reloadMilestones, refreshProgress }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [localTitle, setLocalTitle] = useState(milestone.title);
  // Local state for step order
  const [orderedSteps, setOrderedSteps] = useState(milestone.steps || []);

  // Keep local order in sync with backend when milestone.steps changes
  React.useEffect(() => {
    setOrderedSteps(milestone.steps || []);
  }, [milestone.steps]);

  // Add a new step
  const handleAddStep = async () => {
    setLoading(true);
    setError('');
    try {
      const token = localStorage.getItem('jwt_token') || '';
      await stepsAPI.create(milestone.id, { text: '', order: (milestone.steps?.length || 0) + 1 }, token);
      await reloadMilestones();
      // Refresh progress after adding step
      if (refreshProgress) {
        await refreshProgress(milestone.goal_id);
      }
    } catch (err) {
      setError('Failed to add step');
    } finally {
      setLoading(false);
    }
  };

  // Update a step (save on blur)
  const handleEditStep = async (stepId, newStep) => {
    setLoading(true);
    setError('');
    try {
      const token = localStorage.getItem('jwt_token') || '';
      // Find the current step
      const currentStep = (milestone.steps || []).find(s => s.id === stepId) || {};
      // Merge the new values with the current step
      const updatePayload = { ...currentStep, ...newStep };
      // Only send the fields that should be updated
      await stepsAPI.update(stepId, { completed: updatePayload.completed, text: updatePayload.text }, token);
      await reloadMilestones();
      if (refreshProgress) {
        await refreshProgress(milestone.goal_id);
      }
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
      const token = localStorage.getItem('jwt_token') || '';
      await stepsAPI.delete(stepId, token);
      await reloadMilestones();
      // Refresh progress after deleting step
      if (refreshProgress) {
        await refreshProgress(milestone.goal_id);
      }
    } catch (err) {
      setError('Failed to delete step');
    } finally {
      setLoading(false);
    }
  };

  // Drag-and-drop reorder logic (local only)
  const moveStep = useCallback((fromIdx, toIdx) => {
    if (fromIdx === toIdx) return;
    const updated = [...orderedSteps];
    const [moved] = updated.splice(fromIdx, 1);
    updated.splice(toIdx, 0, moved);
    setOrderedSteps(updated.map((step, idx) => ({ ...step, order: idx + 1 })));
  }, [orderedSteps]);

  // Save new order to backend after drag
  const handleDrop = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('jwt_token') || '';
      for (let i = 0; i < orderedSteps.length; i++) {
        await stepsAPI.update(orderedSteps[i].id, { ...orderedSteps[i], order: i + 1 }, token);
      }
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
        {/* Removed drag handle for milestone */}
        <input
          className="flex-1 border rounded px-2 py-1 text-sm font-semibold bg-gray-50"
          value={localTitle}
          onChange={e => setLocalTitle(e.target.value)}
          onBlur={e => onChange({ ...milestone, title: e.target.value })}
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
          {orderedSteps.map((step, idx) => (
            <DraggableStep
              key={step.id}
              step={step}
              index={idx}
              moveStep={moveStep}
              onChange={newStep => handleEditStep(step.id, newStep)}
              onDelete={() => handleDeleteStep(step.id)}
              reloadMilestones={reloadMilestones}
              onDrop={handleDrop}
            />
          ))}
        </div>
        <button className="mt-1 text-xs text-blue-700 underline hover:text-blue-900" onClick={handleAddStep}>+ Add step</button>
      </div>
    </div>
  );
} 