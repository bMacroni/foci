import React, { useState } from 'react';
import MilestoneRow from './MilestoneRow';
import { milestonesAPI, stepsAPI, aiAPI } from '../services/api';
import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';

export default function GoalBreakdownForm({ goal, initialMilestones = [], onSave, onCancel, reloadMilestones, loading, error, refreshProgress }) {
  const [mainGoal, setMainGoal] = useState(goal.title || '');
  const [aiSuggestions, setAiSuggestions] = useState(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState('');

  // Generate AI suggestions
  const generateAISuggestions = async () => {
    setAiLoading(true);
    setAiError('');
    try {
      const response = await aiAPI.getGoalBreakdown(goal.title, goal.description || '');
      setAiSuggestions(response.data.breakdown);
    } catch (err) {
      setAiError('Failed to generate AI suggestions');
      console.error('AI suggestion error:', err);
    } finally {
      setAiLoading(false);
    }
  };

  // Accept AI suggestions
  const acceptAISuggestions = async () => {
    if (!aiSuggestions) return;
    
    try {
      const token = localStorage.getItem('jwt_token') || '';
      
      // Create all milestones and steps from AI suggestions
      for (const milestone of aiSuggestions.milestones) {
        const milestoneResponse = await milestonesAPI.create(goal.id, {
          title: milestone.title,
          order: milestone.order
        }, token);
        
        // Create steps for this milestone
        for (const step of milestone.steps) {
          await stepsAPI.create(milestoneResponse.id, {
            text: step.text,
            order: step.order
          }, token);
        }
      }
      
      await reloadMilestones();
      setAiSuggestions(null); // Clear suggestions after accepting
    } catch (err) {
      alert('Failed to apply AI suggestions');
    }
  };

  // Add a new milestone
  const handleAddMilestone = async () => {
    try {
      const token = localStorage.getItem('jwt_token') || '';
      await milestonesAPI.create(goal.id, { title: '', order: initialMilestones.length + 1 }, token);
      await reloadMilestones();
    } catch (err) {
      alert('Failed to add milestone');
    }
  };

  // Update a milestone (save on blur)
  const handleEditMilestone = async (milestoneId, newMilestone) => {
    try {
      const token = localStorage.getItem('jwt_token') || '';
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
      const token = localStorage.getItem('jwt_token') || '';
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
    const token = localStorage.getItem('jwt_token') || '';
    const m1 = milestones[idx];
    const m2 = milestones[targetIdx];
    await milestonesAPI.update(m1.id, { ...m1, order: m2.order }, token);
    await milestonesAPI.update(m2.id, { ...m2, order: m1.order }, token);
    await reloadMilestones();
  };

  return (
    <DndProvider backend={HTML5Backend}>
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

        {/* AI Suggestions Section */}
        <div className="border-t pt-4">
          <div className="flex items-center justify-between mb-3">
            <label className="block text-xs font-semibold text-gray-600">AI-Powered Breakdown</label>
            <button
              className="text-xs bg-blue-600 text-white px-3 py-1 rounded hover:bg-blue-700 disabled:opacity-50"
              onClick={generateAISuggestions}
              disabled={aiLoading}
            >
              {aiLoading ? 'Generating...' : '🤖 Get AI Suggestions'}
            </button>
          </div>
          
          {aiError && <div className="text-xs text-red-500 mb-2">{aiError}</div>}
          
          {aiSuggestions && (
            <div className="bg-white border border-blue-200 rounded-lg p-3 mb-3">
              <div className="text-xs text-blue-600 font-semibold mb-2">AI Suggestions:</div>
              <div className="space-y-2">
                {aiSuggestions.milestones.map((milestone, idx) => (
                  <div key={idx} className="bg-blue-50 border border-blue-200 rounded p-2">
                    <div className="text-xs font-semibold text-blue-800 mb-1">
                      {milestone.title}
                    </div>
                    <div className="space-y-1">
                      {milestone.steps.map((step, stepIdx) => (
                        <div key={stepIdx} className="text-xs text-blue-700 ml-2">
                          • {step.text}
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
              <div className="flex space-x-2 mt-3">
                <button
                  className="text-xs bg-green-600 text-white px-2 py-1 rounded hover:bg-green-700"
                  onClick={acceptAISuggestions}
                >
                  ✅ Accept All
                </button>
                <button
                  className="text-xs bg-gray-200 text-gray-700 px-2 py-1 rounded hover:bg-gray-300"
                  onClick={() => setAiSuggestions(null)}
                >
                  ❌ Reject
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Step 2: Milestones */}
        <div>
          <label className="block text-xs font-semibold text-gray-600 mb-1">Milestones</label>
          {loading && <div className="text-xs text-gray-400">Loading milestones...</div>}
          {error && <div className="text-xs text-red-500">{error}</div>}
          <div className="space-y-4">
            {/* Only show milestones up to the first incomplete one */}
            {(() => {
              let showNext = true;
              let lastVisibleIdx = -1;
              const milestoneNodes = initialMilestones.map((milestone, idx) => {
                const steps = milestone.steps || [];
                const isComplete = steps.length > 0 && steps.every(s => s.completed);
                if (!showNext && !isComplete) return null;
                const render = showNext;
                if (!isComplete) showNext = false;
                if (render) lastVisibleIdx = idx;
                return render ? (
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
                    refreshProgress={refreshProgress}
                  />
                ) : null;
              });
              // Calculate hidden milestones
              const hiddenCount = initialMilestones.length - (lastVisibleIdx + 1);
              return <>
                {milestoneNodes}
                {hiddenCount > 0 && (
                  <div className="flex items-center mt-2 text-sm text-gray-500 bg-blue-50 border border-blue-200 rounded-xl px-3 py-2">
                    <svg className="w-5 h-5 mr-2 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M12 20a8 8 0 100-16 8 8 0 000 16z" />
                    </svg>
                    {hiddenCount} more milestone{hiddenCount > 1 ? 's' : ''} will unlock as you progress.
                  </div>
                )}
              </>;
            })()}
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
    </DndProvider>
  );
} 