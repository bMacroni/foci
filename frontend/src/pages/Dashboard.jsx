import React, { useState, useRef, useEffect } from 'react'
import GoalList from '../components/GoalList'
import TaskList from '../components/TaskList'
import CalendarStatus from '../components/CalendarStatus'
import CalendarEvents from '../components/CalendarEvents'
import AIChat from '../components/AIChat'

function Dashboard({ showSuccess }) {
  const [activeTab, setActiveTab] = useState('ai');
  const [showMobileSidebar, setShowMobileSidebar] = useState(false);

  // --- Draggable nav pill state ---
  const defaultPos = { x: 40, y: window.innerHeight / 2 - 140 };
  const [navPos, setNavPos] = useState(() => {
    const saved = localStorage.getItem('navPillPos');
    return saved ? JSON.parse(saved) : defaultPos;
  });
  const navRef = useRef();
  const dragOffset = useRef({ x: 0, y: 0 });
  const dragging = useRef(false);

  // Save position to localStorage
  useEffect(() => {
    localStorage.setItem('navPillPos', JSON.stringify(navPos));
  }, [navPos]);

  // Drag handlers
  const onDragStart = (e) => {
    dragging.current = true;
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    dragOffset.current = {
      x: clientX - navPos.x,
      y: clientY - navPos.y,
    };
    document.addEventListener('mousemove', onDragMove);
    document.addEventListener('mouseup', onDragEnd);
    document.addEventListener('touchmove', onDragMove, { passive: false });
    document.addEventListener('touchend', onDragEnd);
  };
  const onDragMove = (e) => {
    if (!dragging.current) return;
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    setNavPos({
      x: Math.max(0, Math.min(window.innerWidth - 80, clientX - dragOffset.current.x)),
      y: Math.max(0, Math.min(window.innerHeight - 300, clientY - dragOffset.current.y)),
    });
    if (e.touches) e.preventDefault();
  };
  const onDragEnd = () => {
    dragging.current = false;
    document.removeEventListener('mousemove', onDragMove);
    document.removeEventListener('mouseup', onDragEnd);
    document.removeEventListener('touchmove', onDragMove);
    document.removeEventListener('touchend', onDragEnd);
  };

  // Icon-only nav buttons (like CalendarStatus)
  const navTabs = [
    {
      id: 'ai',
      label: 'Foci.ai',
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
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      )
    },
    {
      id: 'tasks',
      label: 'Tasks',
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
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

  // Logout handler
  const handleLogout = () => {
    localStorage.removeItem('jwt_token');
    window.location.href = '/login';
  };

  return (
    <div className="min-h-screen bg-white flex">
      {/* Draggable pill nav */}
      <div
        ref={navRef}
        className="z-50 flex flex-col items-center shadow-2xl"
        style={{
          position: 'absolute',
          left: navPos.x,
          top: navPos.y,
          borderRadius: 9999,
          background: 'rgba(255,255,255,0.97)',
          padding: '16px 10px',
          boxShadow: '0 8px 32px 0 rgba(0,0,0,0.18)',
          minWidth: 72,
          transition: dragging.current ? 'none' : 'box-shadow 0.2s',
        }}
      >
        {/* Handle */}
        <div
          className="w-8 h-3 mb-3 flex items-center justify-center cursor-move select-none"
          style={{ borderRadius: 8, background: '#e5e7eb', boxShadow: '0 1px 4px 0 rgba(0,0,0,0.07)' }}
          onMouseDown={onDragStart}
          onTouchStart={onDragStart}
          title="Move navigation"
        >
          <div className="w-6 h-1 rounded-full bg-gray-400" />
        </div>
        {/* Nav buttons */}
        {navTabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`relative border rounded-full p-3 shadow hover:bg-gray-100 transition-colors flex items-center justify-center focus:outline-none focus:ring-2 focus:ring-blue-400 mb-2
              ${activeTab === tab.id ? 'bg-black border-white text-white' : 'bg-white border-black/10 text-black'}`}
            style={{ width: 52, height: 52 }}
            aria-label={tab.label}
            tabIndex={0}
            onMouseEnter={e => {
              const tooltip = e.currentTarget.querySelector('.nav-tooltip');
              if (tooltip) tooltip.style.opacity = 1;
            }}
            onMouseLeave={e => {
              const tooltip = e.currentTarget.querySelector('.nav-tooltip');
              if (tooltip) tooltip.style.opacity = 0;
            }}
          >
            {React.cloneElement(tab.icon, { className: 'w-6 h-6', color: activeTab === tab.id ? 'white' : 'black', stroke: activeTab === tab.id ? 'white' : 'currentColor' })}
            <span
              className="nav-tooltip absolute left-full top-1/2 -translate-y-1/2 ml-3 px-3 py-1 bg-black text-white text-xs rounded shadow-lg whitespace-nowrap opacity-0 pointer-events-none transition-opacity duration-150"
              style={{ zIndex: 100 }}
            >
              {tab.label}
            </span>
          </button>
        ))}
        {/* Logout button at the bottom */}
        <button
          onClick={handleLogout}
          className="relative mt-4 border rounded-full p-3 shadow hover:bg-red-100 text-red-600 hover:text-red-800 transition-colors flex items-center justify-center focus:outline-none focus:ring-2 focus:ring-red-400 bg-white border-black/10"
          style={{ width: 52, height: 52 }}
          aria-label="Logout"
          tabIndex={0}
          onMouseEnter={e => {
            const tooltip = e.currentTarget.querySelector('.nav-tooltip');
            if (tooltip) tooltip.style.opacity = 1;
          }}
          onMouseLeave={e => {
            const tooltip = e.currentTarget.querySelector('.nav-tooltip');
            if (tooltip) tooltip.style.opacity = 0;
          }}
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a2 2 0 01-2 2H7a2 2 0 01-2-2V7a2 2 0 012-2h4a2 2 0 012 2v1" />
          </svg>
          <span
            className="nav-tooltip absolute left-full top-1/2 -translate-y-1/2 ml-3 px-3 py-1 bg-black text-white text-xs rounded shadow-lg whitespace-nowrap opacity-0 pointer-events-none transition-opacity duration-150"
            style={{ zIndex: 100 }}
          >
            Logout
          </span>
        </button>
      </div>
      {/* Foci app name badge */}
      <div className="fixed top-6 left-1/2 -translate-x-1/2 z-40">
        <span className="inline-flex items-center px-4 py-1.5 rounded-full bg-black/90 text-white text-base font-bold shadow-md tracking-wide opacity-90" style={{letterSpacing: '0.08em'}}>Foci.ai</span>
      </div>
      {/* Main Content Area */}
      <div className="flex-1 flex flex-col relative">
        {/* Mobile Hamburger (top left) */}
        <button
          className="lg:hidden absolute top-4 left-4 z-20 p-2 rounded-md bg-white/80 shadow border border-gray-200"
          onClick={() => setShowMobileSidebar(true)}
        >
          <svg className="w-6 h-6 text-black" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>

        {/* Content Area */}
        <div className={`flex-1 ${activeTab === 'ai' ? 'p-0' : 'p-4 lg:p-6'}`}
          style={{ maxWidth: '100vw' }}
        >
          {activeTab === 'ai' && (
            <div className="h-full">
              <AIChat onNavigateToTab={setActiveTab} />
            </div>
          )}
          {activeTab !== 'ai' && (
            <div className="h-full flex flex-col">
              {/* Tab Header */}
              <div className="mb-4 flex items-center justify-between">
                <h2 className="text-xl lg:text-2xl font-bold text-black capitalize">
                  {activeTab === 'goals' ? 'Goals' : 
                   activeTab === 'tasks' ? 'Tasks' : 
                   activeTab === 'calendar' ? 'Calendar' : activeTab}
                </h2>
                {/* Removed Back to AI button */}
              </div>
              {/* Tab Content */}
              <div className="flex-1 overflow-y-auto">
                {activeTab === 'goals' && <GoalList showSuccess={showSuccess} />}
                {activeTab === 'tasks' && <TaskList showSuccess={showSuccess} />}
                {activeTab === 'calendar' && (
                  <div className="space-y-6">
                    <CalendarStatus />
                    <CalendarEvents />
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Mobile Sidebar Drawer */}
      {showMobileSidebar && (
        <div className="fixed inset-0 z-40 bg-black/50 lg:hidden">
          <div className="fixed left-0 top-0 h-full w-64 bg-white shadow-xl z-50 flex flex-col">
            <div className="p-4 border-b border-gray-200 flex items-center justify-between">
              <h2 className="text-xl font-bold text-gray-800">Foci</h2>
              <button
                onClick={() => setShowMobileSidebar(false)}
                className="p-2 text-gray-500 hover:text-gray-700"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <nav className="p-4 flex-1">
              <div className="space-y-2">
                {[
                  { id: 'ai', label: 'AI Chat' },
                  { id: 'goals', label: 'Goals' },
                  { id: 'tasks', label: 'Tasks' },
                  { id: 'calendar', label: 'Calendar' }
                ].map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => {
                      setActiveTab(tab.id);
                      setShowMobileSidebar(false);
                    }}
                    className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors ${
                      activeTab === tab.id
                        ? 'bg-black text-white'
                        : 'text-gray-600 hover:bg-gray-100'
                    }`}
                  >
                    <span className="font-medium">{tab.label}</span>
                  </button>
                ))}
              </div>
            </nav>
          </div>
        </div>
      )}
    </div>
  );
}

export default Dashboard 