import React, { useEffect } from 'react';

const typeStyles = {
  success: {
    bg: 'bg-green-100/90 border-green-200 text-green-800',
    icon: (
      <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    )
  },
  error: {
    bg: 'bg-red-100/90 border-red-200 text-red-800',
    icon: (
      <svg className="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
      </svg>
    )
  },
  info: {
    bg: 'bg-blue-100/90 border-blue-200 text-blue-800',
    icon: (
      <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01" />
        <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth={2} fill="none" />
      </svg>
    )
  },
  warning: {
    bg: 'bg-yellow-100/90 border-yellow-200 text-yellow-800',
    icon: (
      <svg className="w-5 h-5 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M12 2a10 10 0 100 20 10 10 0 000-20z" />
      </svg>
    )
  }
};

const SuccessToast = ({ message, isVisible, onClose, type = 'success' }) => {
  useEffect(() => {
    if (isVisible) {
      const timer = setTimeout(() => {
        onClose();
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [isVisible, onClose]);

  if (!isVisible) return null;

  const { bg, icon } = typeStyles[type] || typeStyles.success;

  return (
    <div className="fixed top-4 right-4 z-50 animate-fadeIn">
      <div className={`min-w-[260px] max-w-xs ${bg} backdrop-blur-sm border px-6 py-4 rounded-2xl shadow-lg`}>
        <div className="flex items-center space-x-3">
          {icon}
          <span className="font-medium flex-1">{message}</span>
          <button
            onClick={onClose}
            className="ml-2 opacity-70 hover:opacity-100"
            aria-label="Close notification"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
};

export default SuccessToast; 