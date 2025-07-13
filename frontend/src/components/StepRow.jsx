import React from 'react';

export default function StepRow({ step, onChange, onDelete, onMoveUp, onMoveDown, isFirst, isLast }) {
  return (
    <div className="flex items-center space-x-2">
      <input
        className="flex-1 border rounded px-2 py-1 text-sm"
        value={step.text}
        onChange={e => onChange({ ...step, text: e.target.value })}
        placeholder="Describe the step..."
      />
      <button
        className="text-gray-400 hover:text-gray-700 px-1"
        onClick={onMoveUp}
        disabled={isFirst}
        title="Move up"
      >▲</button>
      <button
        className="text-gray-400 hover:text-gray-700 px-1"
        onClick={onMoveDown}
        disabled={isLast}
        title="Move down"
      >▼</button>
      <button
        className="text-red-500 hover:text-red-700 px-1"
        onClick={onDelete}
        title="Delete"
      >✕</button>
    </div>
  );
} 