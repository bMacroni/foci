import React, { useState } from 'react';

const SidebarNav = ({ activeTab, onTabChange, onLogout, onShowFeedback }) => {
  const [hoveredItem, setHoveredItem] = useState(null);
  const [tooltipTimeout, setTooltipTimeout] = useState(null);

  const navigationItems = [
    {
      id: 'ai',
      label: 'AI Chat',
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
        </svg>
      )
    },
    {
      id: 'goals',
      label: 'Goals',
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m4 0h-1V7h-1m-4 0h1v4h1m-4 0h1v4h1" />
        </svg>
      )
    },
    {
      id: 'tasks',
      label: 'Tasks',
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-3-3v6m9 4a2 2 0 01-2 2H7a2 2 0 01-2-2V7a2 2 0 012-2h10a2 2 0 012 2v10z" />
        </svg>
      )
    },
    {
      id: 'calendar',
      label: 'Calendar',
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
      )
    }
  ];

  const handleMouseEnter = (itemId) => {
    if (tooltipTimeout) {
      clearTimeout(tooltipTimeout);
    }
    const timeout = setTimeout(() => {
      setHoveredItem(itemId);
    }, 300);
    setTooltipTimeout(timeout);
  };

  const handleMouseLeave = () => {
    if (tooltipTimeout) {
      clearTimeout(tooltipTimeout);
    }
    setHoveredItem(null);
  };

  return (
    <div className="fixed left-0 top-0 h-full w-16 bg-white border-r border-gray-200 flex flex-col items-center py-6 z-40 hidden lg:flex">
      {/* Logo/Brand */}
      <div className="mb-8">
        <div className="w-10 h-10 bg-black rounded-lg flex items-center justify-center">
          <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
          </svg>
        </div>
      </div>

      {/* Main Navigation Items */}
      <nav className="flex-1 flex flex-col items-center space-y-2">
        {navigationItems.map((item) => (
          <div key={item.id} className="relative">
            <button
              onClick={() => onTabChange(item.id)}
              onMouseEnter={() => handleMouseEnter(item.id)}
              onMouseLeave={handleMouseLeave}
              className={`w-10 h-10 rounded-lg flex items-center justify-center transition-all duration-200 ${
                activeTab === item.id
                  ? 'bg-black text-white'
                  : 'text-gray-600 hover:bg-gray-100 hover:text-black'
              }`}
            >
              {item.icon}
            </button>
            
            {/* Tooltip */}
            {hoveredItem === item.id && (
              <div className="absolute left-14 top-1/2 transform -translate-y-1/2 bg-black text-white text-sm px-3 py-2 rounded-lg shadow-lg whitespace-nowrap z-50">
                {item.label}
                <div className="absolute left-0 top-1/2 transform -translate-y-1/2 -translate-x-1 w-2 h-2 bg-black rotate-45"></div>
              </div>
            )}
          </div>
        ))}
      </nav>

      {/* Bottom Section - Help and Logout */}
      <div className="flex flex-col items-center space-y-2">
        {/* Help Button */}
        <div className="relative">
          <button
            onClick={onShowFeedback}
            onMouseEnter={() => handleMouseEnter('help')}
            onMouseLeave={handleMouseLeave}
            className="w-10 h-10 rounded-lg flex items-center justify-center text-blue-600 hover:bg-blue-100 transition-all duration-200"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M8 10h.01M12 14h.01M16 10h.01M21 12c0 4.418-4.03 8-9 8s-9-3.582-9-8 4.03-8 9-8 9 3.582 9 8z" />
            </svg>
          </button>
          
          {/* Tooltip */}
          {hoveredItem === 'help' && (
            <div className="absolute left-14 top-1/2 transform -translate-y-1/2 bg-black text-white text-sm px-3 py-2 rounded-lg shadow-lg whitespace-nowrap z-50">
              Help
              <div className="absolute left-0 top-1/2 transform -translate-y-1/2 -translate-x-1 w-2 h-2 bg-black rotate-45"></div>
            </div>
          )}
        </div>

        {/* Logout Button */}
        <div className="relative">
          <button
            onClick={onLogout}
            onMouseEnter={() => handleMouseEnter('logout')}
            onMouseLeave={handleMouseLeave}
            className="w-10 h-10 rounded-lg flex items-center justify-center text-red-600 hover:bg-red-100 transition-all duration-200"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a2 2 0 01-2 2H7a2 2 0 01-2-2V7a2 2 0 012-2h4a2 2 0 012 2v1" />
            </svg>
          </button>
          
          {/* Tooltip */}
          {hoveredItem === 'logout' && (
            <div className="absolute left-14 top-1/2 transform -translate-y-1/2 bg-black text-white text-sm px-3 py-2 rounded-lg shadow-lg whitespace-nowrap z-50">
              Logout
              <div className="absolute left-0 top-1/2 transform -translate-y-1/2 -translate-x-1 w-2 h-2 bg-black rotate-45"></div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SidebarNav; 