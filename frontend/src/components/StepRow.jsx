import React, { useState, useRef, useEffect } from 'react';

export default function StepRow({ step, onChange, onDelete }) {
  const [localText, setLocalText] = useState(step.text);
  const [completed, setCompleted] = useState(!!step.completed);
  const textareaRef = useRef(null);

  // Auto-expand textarea height
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = textareaRef.current.scrollHeight + 'px';
    }
  }, [localText]);

  // Update local completed state if prop changes
  useEffect(() => {
    setCompleted(!!step.completed);
  }, [step.completed]);

  const handleCheckbox = (e) => {
    const newCompleted = e.target.checked;
    setCompleted(newCompleted);
    onChange({ completed: newCompleted });
  };

  const handleTextBlur = (e) => {
    onChange({ text: e.target.value });
  };

  return (
    <div className="flex items-center w-full">
      <input
        type="checkbox"
        checked={completed}
        onChange={handleCheckbox}
        className="mr-2 h-4 w-4 accent-green-600"
        title="Mark step as completed"
      />
      <textarea
        ref={textareaRef}
        className={`flex-1 border rounded px-2 py-1 text-sm resize-none min-h-[32px] max-h-40 w-full ${completed ? 'line-through text-gray-400 bg-gray-100' : ''}`}
        value={localText}
        onChange={e => setLocalText(e.target.value)}
        onBlur={handleTextBlur}
        placeholder="Describe the step..."
        rows={1}
        disabled={completed}
      />
      <button
        className="text-red-500 hover:text-red-700 px-1 ml-2"
        onClick={onDelete}
        title="Delete"
      >✕</button>
    </div>
  );
} 