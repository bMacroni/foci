// BulkApprovalPanel.jsx
import React, { useState } from 'react';

export default function BulkApprovalPanel({ items, onApprove, onCancel }) {
  const [editableItems, setEditableItems] = useState(items);

  const handleEdit = (index, newTitle) => {
    const updated = [...editableItems];
    updated[index].title = newTitle;
    setEditableItems(updated);
  };

  const handleRemove = (index) => {
    setEditableItems(editableItems.filter((_, i) => i !== index));
  };

  return (
    <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 my-4 shadow-sm">
      <div className="mb-2 font-semibold text-gray-800">
        Gemini suggests adding the following:
      </div>
      <ul className="mb-4 space-y-2">
        {editableItems.map((item, idx) => (
          <li key={idx} className="flex items-center space-x-2">
            <input
              className="flex-1 border rounded px-2 py-1"
              value={item.title}
              onChange={e => handleEdit(idx, e.target.value)}
            />
            <button
              className="text-red-500 hover:underline text-xs"
              onClick={() => handleRemove(idx)}
            >
              Remove
            </button>
          </li>
        ))}
      </ul>
      <div className="flex justify-end space-x-2">
        <button className="px-4 py-2 rounded bg-gray-200" onClick={onCancel}>Cancel</button>
        <button
          className="px-4 py-2 rounded bg-black text-white"
          onClick={() => onApprove(editableItems)}
          disabled={editableItems.length === 0}
        >
          Approve
        </button>
      </div>
    </div>
  );
}