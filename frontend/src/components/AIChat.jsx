import React, { useState, useRef, useEffect } from 'react';
import { aiAPI, goalsAPI, tasksAPI, conversationsAPI, calendarAPI } from '../services/api';
import BulkApprovalPanel from './BulkApprovalPanel';
import { AIActionProvider, useAIAction } from '../contexts/AIActionContext';
import CalendarEvents from './CalendarEvents';
import SuccessToast from './SuccessToast';

// Utility function to generate unique IDs
let messageIdCounter = 0;
const generateUniqueId = () => {
  messageIdCounter += 1;
  return Date.now() + messageIdCounter;
};

// Utility function for better date formatting
const formatRelativeTime = (dateString) => {
  if (!dateString) return '';
  
  const date = new Date(dateString);
  const now = new Date();
  const diffInMs = now - date;
  const diffInMinutes = Math.floor(diffInMs / (1000 * 60));
  const diffInHours = Math.floor(diffInMs / (1000 * 60 * 60));
  const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));
  
  if (diffInMinutes < 1) return 'Just now';
  if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
  if (diffInHours < 24) return `${diffInHours}h ago`;
  if (diffInDays === 1) return 'Yesterday';
  if (diffInDays < 7) return `${diffInDays} days ago`;
  if (diffInDays < 30) {
    const weeks = Math.floor(diffInDays / 7);
    return `${weeks} week${weeks > 1 ? 's' : ''} ago`;
  }
  if (diffInDays < 365) {
    const months = Math.floor(diffInDays / 30);
    return `${months} month${months > 1 ? 's' : ''} ago`;
  }
  
  return date.toLocaleDateString();
};

// Remove getConversationTypeIcon and getConversationTypeColor utility functions

const AIChat = ({ onNavigateToTab, initialMessages }) => {
  const [messages, setMessages] = useState(initialMessages || []);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [userData, setUserData] = useState({ goals: [], tasks: [] });
  const [hasLoadedData, setHasLoadedData] = useState(false);
  const [conversationThreads, setConversationThreads] = useState([]);
  const [currentThreadId, setCurrentThreadId] = useState(null);
  const [isLoadingThreads, setIsLoadingThreads] = useState(false);
  const [showMobileSidebar, setShowMobileSidebar] = useState(false);
  const messagesEndRef = useRef(null);
  const [pendingApproval, setPendingApproval] = useState(null);
  const [taskListByMessageId, setTaskListByMessageId] = useState({});
  const [listByMessageId, setListByMessageId] = useState({});
  const { calendarEvents, error: calendarError, processAIResponse } = useAIAction();
  const [toast, setToast] = useState({ isVisible: false, message: '', type: 'success' });
  const showToast = (message, type = 'success') => {
    setToast({ isVisible: true, message, type });
  };
  const handleCloseToast = () => setToast({ ...toast, isVisible: false });
  const [showLoadingScreen, setShowLoadingScreen] = useState(false);
  
  // New state for conversation improvements
  const [searchQuery, setSearchQuery] = useState('');
  const [pinnedThreads, setPinnedThreads] = useState(new Set());
  const [showThreadMenu, setShowThreadMenu] = useState(null);

  // Load user data and conversation threads
  useEffect(() => {
    const loadUserData = async () => {
      try {
        const [goalsResponse, tasksResponse, threadsResponse] = await Promise.all([
          goalsAPI.getAll(),
          tasksAPI.getAll(),
          conversationsAPI.getThreads()
        ]);
        
        setUserData({
          goals: Array.isArray(goalsResponse.data) ? goalsResponse.data : [],
          tasks: Array.isArray(tasksResponse.data) ? tasksResponse.data : []
        });
        
        const threads = Array.isArray(threadsResponse.data) ? threadsResponse.data : [];
        setConversationThreads(threads);
        
        // Don't automatically load any threads - let user choose
        setHasLoadedData(true);
      } catch (error) {
        console.error('Error loading user data:', error);
        setHasLoadedData(true);
      }
    };

    loadUserData();
  }, []);

  // Initialize welcome message based on user data
  useEffect(() => {
    if (hasLoadedData && messages.length === 0) {
      const hasGoals = Array.isArray(userData.goals) ? userData.goals.length > 0 : false;
      const hasTasks = Array.isArray(userData.tasks) ? userData.tasks.length > 0 : false;
      
      let welcomeMessage = '';
      
      if (!hasGoals && !hasTasks) {
        // New user - comprehensive onboarding
        welcomeMessage = `🎯 **Welcome to Foci!** I'm your AI-powered productivity assistant, and I'm here to help you build a focused, organized life.

**Let's get started!** I can help you:

• **Set meaningful goals** - Create clear, achievable objectives
• **Organize tasks** - Break down goals into actionable steps  
• **Manage your calendar** - Schedule and track important events
• **Stay focused** - Get personalized productivity advice

**What would you like to work on today?** You can start by telling me about a goal you have, or I can help you get organized!`;
      } else if (hasGoals && !hasTasks) {
        // Has goals but no tasks
        const goalsCount = Array.isArray(userData.goals) ? userData.goals.length : 0;
        welcomeMessage = `🎯 **Welcome back!** I see you have ${goalsCount} goal${goalsCount !== 1 ? 's' : ''} set up. 

**Let's make progress!** I can help you:

• **Break down your goals** into actionable tasks
• **Create tasks** to move toward your objectives
• **Review and refine** your existing goals
• **Plan your week** around your priorities

**What would you like to focus on today?**`;
      } else if (hasGoals && hasTasks) {
        // Has both goals and tasks
        const goalsCount = Array.isArray(userData.goals) ? userData.goals.length : 0;
        const tasksArray = Array.isArray(userData.tasks) ? userData.tasks : [];
        const completedTasks = tasksArray.filter(task => task.completed).length;
        const totalTasks = tasksArray.length;
        
        welcomeMessage = `🎯 **Welcome back!** Great progress - you have ${goalsCount} goal${goalsCount !== 1 ? 's' : ''} and ${totalTasks} task${totalTasks !== 1 ? 's' : ''} (${completedTasks} completed).

**Let's keep the momentum going!** I can help you:

• **Review your progress** and celebrate wins
• **Create new tasks** for your goals
• **Prioritize what's next** for today
• **Adjust your goals** if needed

**What's your focus for today?**`;
      } else {
        // Has tasks but no goals
        const tasksCount = Array.isArray(userData.tasks) ? userData.tasks.length : 0;
        welcomeMessage = `📝 **Welcome back!** I see you have ${tasksCount} task${tasksCount !== 1 ? 's' : ''} to work on.

**Let's get organized!** I can help you:

• **Create goals** to give your tasks direction
• **Prioritize your tasks** for today
• **Review and organize** your task list
• **Plan your week** effectively

**What would you like to work on?**`;
      }

      setMessages([{
        id: 1,
        type: 'ai',
        content: welcomeMessage,
        timestamp: new Date()
      }]);
    }
  }, [hasLoadedData, userData, messages.length]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Close thread menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (showThreadMenu && !event.target.closest('.thread-menu-container')) {
        setShowThreadMenu(null);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showThreadMenu]);

  const refreshUserData = async () => {
    try {
      const [goalsResponse, tasksResponse] = await Promise.all([
        goalsAPI.getAll(),
        tasksAPI.getAll()
      ]);
      
      // Only update user data, don't trigger any other effects
      setUserData(prevData => ({
        goals: Array.isArray(goalsResponse.data) ? goalsResponse.data : [],
        tasks: Array.isArray(tasksResponse.data) ? tasksResponse.data : []
      }));
    } catch (error) {
      console.error('Error refreshing user data:', error);
    }
  };

  const loadConversationThread = async (threadId) => {
    try {
      setIsLoadingThreads(true);
      const response = await conversationsAPI.getThread(threadId);
      const { thread, messages } = response.data;
      
      // Convert database messages to chat format
      const chatMessages = messages.map(msg => ({
        id: msg.id,
        type: msg.role === 'user' ? 'user' : 'ai',
        content: msg.content,
        timestamp: new Date(msg.created_at),
        actions: msg.metadata?.actions || []
      }));
      
      setCurrentThreadId(threadId);
      setMessages(chatMessages);
    } catch (error) {
      console.error('Error loading conversation thread:', error);
    } finally {
      setIsLoadingThreads(false);
    }
  };

  const createNewThread = () => {
    // Instead of creating a thread, just clear the current thread and messages
    setCurrentThreadId(null);
    setMessages([]);
    // Optionally, set a welcome message or leave blank
    // setMessages([{ id: 1, type: 'ai', content: generateWelcomeMessage(), timestamp: new Date() }]);
  };

  const deleteThread = async (threadId) => {
    if (!window.confirm('Are you sure you want to delete this conversation?')) {
      return;
    }
    
    try {
      await conversationsAPI.deleteThread(threadId);
      setConversationThreads(prev => prev.filter(thread => thread.id !== threadId));
      
      if (currentThreadId === threadId) {
        setCurrentThreadId(null);
        setMessages([]);
      }
    } catch (error) {
      console.error('Error deleting thread:', error);
    }
  };

  // Handle pinning/unpinning threads
  const togglePinThread = (threadId) => {
    setPinnedThreads(prev => {
      const newPinned = new Set(prev);
      if (newPinned.has(threadId)) {
        newPinned.delete(threadId);
      } else {
        newPinned.add(threadId);
      }
      return newPinned;
    });
    setShowThreadMenu(null);
  };

  // Filter threads based on search query
  const filteredThreads = conversationThreads.filter(thread => {
    if (!searchQuery) return true;
    const searchLower = searchQuery.toLowerCase();
    const title = thread.title || '';
    const type = thread.title?.match(/^\[(.*?)\]/)?.[1] || '';
    return title.toLowerCase().includes(searchLower) || type.toLowerCase().includes(searchLower);
  });

  // Sort threads: pinned first, then by date
  const sortedThreads = filteredThreads.sort((a, b) => {
    const aPinned = pinnedThreads.has(a.id);
    const bPinned = pinnedThreads.has(b.id);
    
    if (aPinned && !bPinned) return -1;
    if (!aPinned && bPinned) return 1;
    
    // Both pinned or both unpinned, sort by date (newest first)
    const aDate = new Date(a.created_at || a.last_message?.created_at || 0);
    const bDate = new Date(b.created_at || b.last_message?.created_at || 0);
    return bDate - aDate;
  });

  const generateWelcomeMessage = () => {
    const hasGoals = Array.isArray(userData.goals) ? userData.goals.length > 0 : false;
    const hasTasks = Array.isArray(userData.tasks) ? userData.tasks.length > 0 : false;
    
    if (!hasGoals && !hasTasks) {
      return `🎯 **Welcome to Foci!** I'm your AI-powered productivity assistant, and I'm here to help you build a focused, organized life.

**Let's get started!** I can help you:

• **Set meaningful goals** - Create clear, achievable objectives
• **Organize tasks** - Break down goals into actionable steps  
• **Manage your calendar** - Schedule and track important events
• **Stay focused** - Get personalized productivity advice

**What would you like to work on today?** You can start by telling me about a goal you have, or I can help you get organized!`;
    } else if (hasGoals && !hasTasks) {
      const goalsCount = Array.isArray(userData.goals) ? userData.goals.length : 0;
      return `🎯 **Welcome back!** I see you have ${goalsCount} goal${goalsCount !== 1 ? 's' : ''} set up. 

**Let's make progress!** I can help you:

• **Break down your goals** into actionable tasks
• **Create tasks** to move toward your objectives
• **Review and refine** your existing goals
• **Plan your week** around your priorities

**What would you like to focus on today?**`;
    } else if (hasGoals && hasTasks) {
      const goalsCount = Array.isArray(userData.goals) ? userData.goals.length : 0;
      const tasksArray = Array.isArray(userData.tasks) ? userData.tasks : [];
      const completedTasks = tasksArray.filter(task => task.completed).length;
      const totalTasks = tasksArray.length;
      
      return `🎯 **Welcome back!**  
You’re making great strides!  
  
**Here’s how I can help you today:**  
• Review your progress and celebrate wins  
• Create, update, or organize your goals and tasks  
• Plan your day or week with the calendar  
• Get personalized suggestions and productivity tips  
• Ask for help breaking down big goals into manageable steps  
  
**What would you like to focus on or ask me today?**`;
    } else {
      const tasksCount = Array.isArray(userData.tasks) ? userData.tasks.length : 0;
      return `📝 **Welcome back!** I see you have ${tasksCount} task${tasksCount !== 1 ? 's' : ''} to work on.

**Let's get organized!** I can help you:

• **Create goals** to give your tasks direction
• **Prioritize your tasks** for today
• **Review and organize** your task list
• **Plan your week** effectively

**What would you like to work on?**`;
    }
  };

  const getRequestType = (message) => {
    // Simple keyword-based classification for demo; can be replaced with smarter logic
    if (/goal/i.test(message)) return 'Goal';
    if (/task/i.test(message)) return 'Task';
    if (/calendar|event|schedule/i.test(message)) return 'Calendar';
    return 'General';
  };

  const getSummary = (message) => {
    // Use the first 8 words as a summary
    return message.split(' ').slice(0, 8).join(' ') + (message.split(' ').length > 8 ? '...' : '');
  };

  // Refactored handleGeminiResponse for new backend flow
  const handleGeminiResponse = (response) => {
    console.log('🔍 Raw response from API:', response);
    try {
      // Extract the actual response data from the axios response
      const responseData = response.data || response;
      const message = responseData.message;
      const actions = responseData.actions || [];

      // Show the final AI message
      setMessages(prev => [
        ...prev,
        {
          id: generateUniqueId(),
          type: 'ai',
          content: message,
          timestamp: new Date(),
          actions: actions
        }
      ]);

      // For each action, show a toast and add a natural language message
      actions.forEach(action => {
        // Only handle create/update/delete actions
        if (["create", "update", "delete"].includes(action.action_type)) {
          let actionVerb = '';
          if (action.action_type === 'create') actionVerb = 'created';
          if (action.action_type === 'update') actionVerb = 'updated';
          if (action.action_type === 'delete') actionVerb = 'deleted';
          const entity = action.entity_type.replace('_', ' ');
          const title = action.details?.title || action.details?.name || '';
          // Toast
          showToast(`${entity.charAt(0).toUpperCase() + entity.slice(1)}${title ? ` "${title}"` : ''} ${actionVerb}.`, 'success');
          // Chat message
          setMessages(prev => [
            ...prev,
            {
              id: generateUniqueId(),
              type: 'ai',
              content: `I've ${actionVerb} ${entity}${title ? ` "${title}"` : ''}.`,
              timestamp: new Date()
            }
          ]);
        }
        // If error
        if (action.details && action.details.error) {
          showToast(`Failed to ${action.action_type} ${action.entity_type}: ${action.details.error}`, 'error');
          setMessages(prev => [
            ...prev,
            {
              id: generateUniqueId(),
              type: 'ai',
              content: `❌ Failed to ${action.action_type} ${action.entity_type}: ${action.details.error}`,
              timestamp: new Date()
            }
          ]);
        }
      });
    } catch (error) {
      console.error('❌ Error handling Gemini response:', error);
      setMessages(prev => [...prev, {
        id: generateUniqueId(),
        type: 'ai',
        content: "I'm sorry, I encountered an error processing the response. Please try again.",
        timestamp: new Date(),
        actions: []
      }]);
    }
  };

  // Modified: handleSubmit uses handleGeminiResponse
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!inputMessage.trim() || isLoading) return;

    const userMessage = {
      id: generateUniqueId(),
      type: 'user',
      content: inputMessage,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputMessage('');
    setIsLoading(true);

    try {
      let threadId = currentThreadId;
      if (!threadId) {
        // Send the first user message to backend for title generation
        const response = await conversationsAPI.createThread({ title: '', summary: '', messages: [{ role: 'user', content: inputMessage }] });
        threadId = response.data.id;
        setCurrentThreadId(threadId);
        setConversationThreads(prev => [response.data, ...prev]);
      }
      
      console.log('🚀 Sending message to AI API...');
      const response = await aiAPI.sendMessage(inputMessage, threadId);
      console.log('✅ Received response from AI API');
      handleGeminiResponse(response);
      
    } catch (error) {
      console.error('Error sending message:', error);
      
      setMessages(prev => [...prev, {
        id: generateUniqueId(),
        type: 'ai',
        content: "I'm sorry, I encountered an error. Please try again or check your connection.",
        timestamp: new Date()
      }]);
      showToast('Failed to send message. Please try again.', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  // Bulk approval handlers
  const handleBulkApprove = async (items) => {
    setIsLoading(true);
    try {
      // Extract task data from action objects if needed
      const taskData = items.map(item => 
        item.data ? item.data : item
      );
      
      await tasksAPI.bulkCreate(taskData);
      setPendingApproval(null);
      setMessages(prev => [
        ...prev,
        {
          id: generateUniqueId(),
          type: 'ai',
          content: 'Tasks have been added to your planner!',
          timestamp: new Date()
        }
      ]);
      // Only refresh user data, not conversation threads to avoid UI reset
      // await refreshUserData();
    } catch (error) {
      setPendingApproval(null);
      setMessages(prev => [
        ...prev,
        {
          id: generateUniqueId(),
          type: 'ai',
          content: 'There was an error adding your tasks. Please try again.',
          timestamp: new Date()
        }
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleBulkCancel = () => {
    setPendingApproval(null);
    setMessages(prev => [
      ...prev,
      {
        id: generateUniqueId(),
        type: 'ai',
        content: 'Bulk addition cancelled.',
        timestamp: new Date()
      }
    ]);
  };

  // Execute action based on type and operation
  const executeAction = async (action) => {
    console.log('Executing action:', action);
    
    try {
      switch (action.type) {
        case 'goal':
          if (action.operation === 'create') {
            await goalsAPI.create(action.data);
            setMessages(prev => [...prev, {
              id: generateUniqueId(),
              type: 'ai',
              content: `✅ Goal "${action.data.title}" has been created!`,
              timestamp: new Date()
            }]);
            showToast(`Goal "${action.data.title}" created!`, 'success');
            refreshUserData();
          }
          break;
          
        case 'task':
          if (action.operation === 'create') {
            await tasksAPI.create(action.data);
            setMessages(prev => [...prev, {
              id: generateUniqueId(),
              type: 'ai',
              content: `✅ Task "${action.data.title}" has been created!`,
              timestamp: new Date()
            }]);
            showToast(`Task "${action.data.title}" created!`, 'success');
            refreshUserData();
          }
          break;
          
        case 'calendar_event':
          if (action.operation === 'create') {
            const data = action.data || action.details || {};
            const eventPayload = {
              summary: data.title || data.summary || 'Untitled Event',
              description: data.description || '',
              startTime: data.start_time || data.startTime,
              endTime: data.end_time || data.endTime,
              timeZone: data.time_zone || data.timeZone || 'UTC',
            };
            await calendarAPI.createEvent(eventPayload);
            setMessages(prev => [...prev, {
              id: generateUniqueId(),
              type: 'ai',
              content: `✅ Calendar event "${eventPayload.summary}" has been scheduled!`,
              timestamp: new Date()
            }]);
            showToast(`Event "${eventPayload.summary}" created!`, 'success');
          } else if (action.operation === 'read') {
            // Use events from action.details.events or action.details
            let events = [];
            if (Array.isArray(action.details?.events)) {
              events = action.details.events;
            } else if (Array.isArray(action.details)) {
              events = action.details;
            }
            setMessages(prev => [...prev, {
              id: generateUniqueId(),
              type: 'calendar_events',
              content: events,
              timestamp: new Date()
            }]);
          }
          break;
          
        default:
          console.warn('Unknown action type:', action.type);
      }
    } catch (error) {
      console.error('Error executing action:', error);
      setMessages(prev => [...prev, {
        id: generateUniqueId(),
        type: 'ai',
        content: `❌ Error: Failed to ${action.operation} ${action.type}. Please try again.`,
        timestamp: new Date()
      }]);
      showToast(`Failed to ${action.operation} ${action.type}.`, 'error');
    }
  };

  // Helper to fetch tasks for a message
  const fetchTasksForMessage = async (messageId) => {
    setTaskListByMessageId(prev => ({
      ...prev,
      [messageId]: { loading: true, error: null, tasks: [] }
    }));
    try {
      const response = await tasksAPI.getAll();
      setTaskListByMessageId(prev => ({
        ...prev,
        [messageId]: { loading: false, error: null, tasks: response.data || [] }
      }));
    } catch (error) {
      setTaskListByMessageId(prev => ({
        ...prev,
        [messageId]: { loading: false, error: 'Failed to load tasks', tasks: [] }
      }));
    }
  };

  // Helper to fetch list (tasks or goals) for a message
  const fetchListForMessage = async (messageId, type) => {
    setListByMessageId(prev => ({
      ...prev,
      [messageId]: { type, loading: true, error: null, items: [] }
    }));
    try {
      let response;
      if (type === 'task') {
        response = await tasksAPI.getAll();
      } else if (type === 'goal') {
        response = await goalsAPI.getAll();
      }
      setListByMessageId(prev => ({
        ...prev,
        [messageId]: { type, loading: false, error: null, items: response.data || [] }
      }));
    } catch (error) {
      setListByMessageId(prev => ({
        ...prev,
        [messageId]: { type, loading: false, error: 'Failed to load ' + type + 's', items: [] }
      }));
    }
  };

  // Handler for recommending a low energy task
  const handleRecommendLowEnergyTask = async () => {
    setIsLoading(true);
    try {
      const userRequest = 'What is a good low energy task?';
      const response = await aiAPI.recommendTask(userRequest);
      const { recommendedTask } = response.data;
      if (recommendedTask) {
        setMessages(prev => ([
          ...prev,
          {
            id: generateUniqueId(),
            type: 'ai',
            content: `🪫 **Recommended Low Energy Task:**\n\n**${recommendedTask.title}**\n${recommendedTask.description ? recommendedTask.description : ''}\n(Priority: ${recommendedTask.priority})`,
            timestamp: new Date()
          }
        ]));
      } else {
        setMessages(prev => ([
          ...prev,
          {
            id: generateUniqueId(),
            type: 'ai',
            content: `I couldn't find a suitable low energy task right now.`,
            timestamp: new Date()
          }
        ]));
      }
    } catch (error) {
      setMessages(prev => ([
        ...prev,
        {
          id: generateUniqueId(),
          type: 'ai',
          content: `Sorry, there was an error fetching a low energy task recommendation.`,
          timestamp: new Date()
        }
      ]));
    } finally {
      setIsLoading(false);
    }
  };

  // Delay showing the loading screen by 300ms
  useEffect(() => {
    let timer;
    if (!hasLoadedData) {
      timer = setTimeout(() => setShowLoadingScreen(true), 300);
    } else {
      setShowLoadingScreen(false);
    }
    return () => clearTimeout(timer);
  }, [hasLoadedData]);

  return (
    <div className="bg-white h-full flex overflow-hidden relative">
      <SuccessToast
        message={toast.message}
        isVisible={toast.isVisible}
        onClose={handleCloseToast}
        type={toast.type}
      />
      {/* Mobile Sidebar Overlay */}
      {showMobileSidebar && (
        <div className="lg:hidden fixed inset-0 bg-black/50 z-50">
          <div className="absolute top-0 left-0 w-80 h-full bg-white/95 backdrop-blur-sm border-r border-black/10 flex flex-col">
            <div className="p-4 border-b border-black/10">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold text-black">Conversations</h3>
                <button
                  onClick={() => setShowMobileSidebar(false)}
                  className="p-2 text-gray-500 hover:text-black transition-colors"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              <button
                onClick={() => {
                  createNewThread();
                  setShowMobileSidebar(false);
                }}
                className="w-full px-4 py-2 bg-black text-white rounded-xl hover:bg-gray-800 transition-colors text-sm font-medium"
              >
                <span className="flex items-center justify-center space-x-2">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                  <span>New Conversation</span>
                </span>
              </button>
            </div>
            
            {/* Search Bar */}
            <div className="p-4 border-b border-black/10">
              <div className="relative">
                <input
                  type="text"
                  placeholder="Search conversations..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full px-3 py-2 pl-10 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-black/20 focus:border-black"
                />
                <svg className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
            </div>
            
            <div className="flex-1 overflow-y-auto p-4">
              {isLoadingThreads ? (
                <div className="flex items-center justify-center py-8">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-black"></div>
                </div>
              ) : (
                <div className="space-y-2">
                  {sortedThreads.map((thread) => {
                    // Try to extract type, summary, and created_at from thread
                    let type = 'General';
                    let summary = '';
                    let createdAt = thread.created_at;
                    if (thread.title && thread.title.startsWith('[')) {
                      const match = thread.title.match(/^\[(.*?)\]\s(.+)/);
                      if (match) {
                        type = match[1];
                        summary = match[2];
                      } else {
                        summary = thread.title;
                      }
                    } else {
                      summary = thread.title || '';
                    }
                    // Prefer thread.created_at, fallback to thread.last_message?.created_at
                    if (!createdAt && thread.last_message && thread.last_message.created_at) {
                      createdAt = thread.last_message.created_at;
                    }
                    const formattedDate = formatRelativeTime(createdAt);
                    const isPinned = pinnedThreads.has(thread.id);
                    
                    return (
                      <div
                        key={thread.id}
                        className={`group relative p-3 rounded-xl cursor-pointer transition-colors ${
                          currentThreadId === thread.id
                            ? 'bg-black text-white'
                            : 'hover:bg-gray-100'
                        }`}
                        onClick={() => {
                          loadConversationThread(thread.id);
                          setShowMobileSidebar(false);
                        }}
                      >
                        <div className="flex items-center justify-between">
                          <span className={`truncate text-sm font-medium ${currentThreadId === thread.id ? 'text-white' : 'text-black'}`}>{summary}</span>
                          <span className={`ml-2 text-xs whitespace-nowrap ${currentThreadId === thread.id ? 'text-white' : 'text-gray-500'}`}>{formattedDate}</span>
                          </div>
                        
                        {/* Thread Menu */}
                        {showThreadMenu === thread.id && (
                          <div className="thread-menu-container absolute right-0 top-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-10 min-w-[120px]">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                togglePinThread(thread.id);
                              }}
                              className="w-full px-3 py-2 text-left text-sm hover:bg-gray-100 flex items-center space-x-2"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
                              </svg>
                              <span>{isPinned ? 'Unpin' : 'Pin'}</span>
                            </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              deleteThread(thread.id);
                            }}
                              className="w-full px-3 py-2 text-left text-sm hover:bg-gray-100 flex items-center space-x-2 text-red-600"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                              <span>Delete</span>
                          </button>
                        </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Desktop Sidebar */}
      <div className="hidden lg:flex lg:w-80 flex-shrink-0 border-r border-black/10 h-screen">
        <div className="w-full flex flex-col h-full">
          {/* Sidebar Header */}
          <div className="p-4 border-b border-black/10">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-black">Conversations</h3>
              <button
                onClick={() => { createNewThread(); setShowMobileSidebar(false); }}
                className="p-2 text-gray-500 hover:text-black transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
              </button>
            </div>
            <button
              onClick={() => { createNewThread(); setShowMobileSidebar(false); }}
              className="w-full px-4 py-2 bg-black text-white rounded-xl hover:bg-gray-800 transition-colors text-sm font-medium"
            >
              <span className="flex items-center justify-center space-x-2">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
                <span>New Conversation</span>
              </span>
            </button>
          </div>
          {/* Search Bar */}
          <div className="p-4 border-b border-black/10">
            <div className="relative">
              <input
                type="text"
                placeholder="Search conversations..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full px-3 py-2 pl-10 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-black/20 focus:border-black"
              />
              <svg className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
          </div>
          {/* Conversation Threads */}
          <div className="flex-1 overflow-y-auto p-4 h-0 min-h-0 scrollbar-hover">
            {isLoadingThreads ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-black"></div>
              </div>
            ) : (
              <div className="space-y-2">
                {sortedThreads.map((thread) => {
                  // Try to extract type, summary, and created_at from thread
                  let type = 'General';
                  let summary = '';
                  let createdAt = thread.created_at;
                  if (thread.title && thread.title.startsWith('[')) {
                    const match = thread.title.match(/^\[(.*?)\]\s(.+)/);
                    if (match) {
                      type = match[1];
                      summary = match[2];
                    } else {
                      summary = thread.title;
                    }
                  } else {
                    summary = thread.title || '';
                  }
                  // Prefer thread.created_at, fallback to thread.last_message?.created_at
                  if (!createdAt && thread.last_message && thread.last_message.created_at) {
                    createdAt = thread.last_message.created_at;
                  }
                  const formattedDate = formatRelativeTime(createdAt);
                  const isPinned = pinnedThreads.has(thread.id);
                  
                  return (
                    <div
                      key={thread.id}
                      className={`group relative p-3 rounded-xl cursor-pointer transition-colors ${
                        currentThreadId === thread.id
                          ? 'bg-black text-white'
                          : 'hover:bg-gray-100'
                      }`}
                      onClick={() => loadConversationThread(thread.id)}
                    >
                      <div className="flex items-center justify-between">
                        <span className={`truncate text-sm font-medium ${currentThreadId === thread.id ? 'text-white' : 'text-black'}`}>{summary}</span>
                        <span className={`ml-2 text-xs whitespace-nowrap ${currentThreadId === thread.id ? 'text-white' : 'text-gray-500'}`}>{formattedDate}</span>
                        </div>
                      
                      {/* Thread Menu */}
                      {showThreadMenu === thread.id && (
                        <div className="thread-menu-container absolute right-0 top-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-10 min-w-[120px]">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              togglePinThread(thread.id);
                            }}
                            className="w-full px-3 py-2 text-left text-sm hover:bg-gray-100 flex items-center space-x-2"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
                            </svg>
                            <span>{isPinned ? 'Unpin' : 'Pin'}</span>
                          </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            deleteThread(thread.id);
                          }}
                            className="w-full px-3 py-2 text-left text-sm hover:bg-gray-100 flex items-center space-x-2 text-red-600"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                            <span>Delete</span>
                        </button>
                      </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col">
        {/* Messages Area */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4 mt-20 scrollbar-hover">
          {messages.map((message) => {
            switch (message.type) {
              case 'user':
                return <MessageBubble key={message.id} message={message} />;
              case 'ai':
                return <MessageBubble key={message.id} message={message} />;
              case 'calendar_events':
                // Handle Google Calendar disconnect error
                if (message.content && message.content.error === 'google_calendar_disconnected') {
                  return (
                    <div key={message.id} className="p-4 bg-red-100 rounded-lg">
                      <p className="font-semibold text-red-700">Your Google Calendar connection has expired or been revoked.</p>
                      <p className="text-red-700">Please reconnect your Google account in settings to restore calendar features.</p>
                    </div>
                  );
                }
                return (
                  <div key={message.id} className="p-4 bg-blue-100 rounded-lg">
                    <p className="font-semibold">Here are your upcoming events:</p>
                    <ul className="list-disc pl-5 mt-2">
                      {Array.isArray(message.content) && message.content.length > 0 ? (
                        message.content.map(event => (
                          <li key={event.id}>
                            <strong>{event.summary}</strong> on {new Date(event.start.dateTime || event.start.date).toLocaleDateString()}
                          </li>
                        ))
                      ) : (
                        <li>No upcoming events found.</li>
                      )}
                    </ul>
                  </div>
                );
              default:
                return null;
            }
          })}
          {pendingApproval && (
            <BulkApprovalPanel
              items={pendingApproval.items || pendingApproval}
              onApprove={handleBulkApprove}
              onCancel={handleBulkCancel}
            />
          )}
          {isLoading && (
            <div className="flex items-center space-x-2 text-gray-500">
              <div className="flex space-x-1">
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
              </div>
              <span className="text-sm">Foci.ai is thinking...</span>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        <div className="border-t border-black/10 p-4">
          <form onSubmit={handleSubmit} className="flex space-x-4">
            <div className="flex-1 relative">
              <textarea
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Tell me what you'd like to work on today..."
                className="w-full px-4 py-3 border border-black/20 rounded-xl focus:outline-none focus:ring-2 focus:ring-black/20 focus:border-transparent resize-none"
                rows="1"
                style={{ minHeight: '48px', maxHeight: '120px' }}
              />
            </div>
            <button
              type="submit"
              disabled={!inputMessage.trim() || isLoading}
              className="px-6 py-3 bg-black text-white rounded-xl hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center space-x-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
              </svg>
              <span>Send</span>
            </button>
            {/* New button for low energy task recommendation */}
            <button
              type="button"
              onClick={handleRecommendLowEnergyTask}
              disabled={isLoading}
              className="px-6 py-3 bg-gray-200 text-gray-800 rounded-xl hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center space-x-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
              <span>Suggest Low Energy Task</span>
            </button>
          </form>
        </div>
      </div>
      {/* Render CalendarEvents if calendarEvents is not null */}
      {calendarEvents !== null && (
        <CalendarEvents
          events={calendarEvents}
          error={calendarError}
        />
      )}
    </div>
  );
};

const MessageBubble = ({ message }) => {
  // Helper to detect and parse Markdown JSON code blocks - now handles multiple JSON objects
  const extractJsonFromCodeBlock = (content) => {
    const codeBlockMatches = content.match(/```json\s*([\s\S]*?)\s*```/gi);
    if (codeBlockMatches && codeBlockMatches.length > 0) {
      const jsonObjects = [];
      for (const match of codeBlockMatches) {
        try {
          const jsonContent = match.replace(/```json\s*/i, '').replace(/\s*```/i, '');
          const parsed = JSON.parse(jsonContent);
          jsonObjects.push(parsed);
        } catch (e) {
          console.error('Error parsing JSON from code block:', e);
        }
      }
      return jsonObjects.length > 0 ? jsonObjects : null;
    }
    return null;
  };

  // Editable Table State
  const [editingTaskId, setEditingTaskId] = React.useState(null);
  const [editField, setEditField] = React.useState(null); // 'due_date' or 'status'
  const [editValue, setEditValue] = React.useState('');
  const [saving, setSaving] = React.useState(false);
  const [tasksState, setTasksState] = React.useState(null); // For local UI update

  // Helper to update task in local state
  const updateTaskInState = (taskId, field, value) => {
    setTasksState((prev) =>
      prev.map((task) =>
        task.id === taskId ? { ...task, [field]: value } : task
      )
    );
  };

  // Save handler
  const handleSave = async (task, field) => {
    setSaving(true);
    try {
      const updated = { ...task, [field]: editValue };
      // For due_date, ensure ISO string
      if (field === 'due_date') {
        updated.due_date = editValue;
      }
      if (field === 'status') {
        updated.status = editValue;
      }
      await tasksAPI.update(task.id, updated);
      updateTaskInState(task.id, field, editValue);
      setEditingTaskId(null);
      setEditField(null);
      setEditValue('');
    } catch (e) {
      alert('Failed to update task.');
    } finally {
      setSaving(false);
    }
  };

  // Cancel handler
  const handleCancel = () => {
    setEditingTaskId(null);
    setEditField(null);
    setEditValue('');
  };

  // Responsive Task Table/Card rendering
  const renderTaskList = (tasks) => {
    if (!Array.isArray(tasks) || tasks.length === 0) {
      return <div className="text-gray-500 italic mt-2">No tasks found.</div>;
    }
    // Use local state for edits
    const displayTasks = Array.isArray(tasksState) ? tasksState : tasks;
    return (
      <div>
        {/* Desktop Table */}
        <div className="hidden sm:block">
          <table className="min-w-full border border-gray-200 rounded-lg overflow-hidden shadow-sm">
            <thead className="bg-gray-100">
              <tr>
                <th className="px-4 py-2 text-left text-sm font-semibold text-gray-700">Task</th>
                <th className="px-4 py-2 text-left text-sm font-semibold text-gray-700">Due Date</th>
                <th className="px-4 py-2 text-left text-sm font-semibold text-gray-700">Status</th>
              </tr>
            </thead>
            <tbody>
              {displayTasks.map((task) => (
                <tr key={task.id} className="border-t border-gray-100 hover:bg-gray-50">
                  <td className="px-4 py-2 font-medium text-gray-900">{task.title}</td>
                  {/* Due Date Cell */}
                  <td className="px-4 py-2 text-gray-700">
                    {editingTaskId === task.id && editField === 'due_date' ? (
                      <div className="flex items-center space-x-2">
                        <input
                          type="date"
                          className="border rounded px-2 py-1 text-sm"
                          value={editValue}
                          onChange={e => setEditValue(e.target.value)}
                          disabled={saving}
                        />
                        <button
                          className="text-green-600 hover:underline text-xs"
                          onClick={() => handleSave(task, 'due_date')}
                          disabled={saving}
                        >Save</button>
                        <button
                          className="text-gray-500 hover:underline text-xs"
                          onClick={handleCancel}
                          disabled={saving}
                        >Cancel</button>
                      </div>
                    ) : (
                      <span
                        className="cursor-pointer hover:underline"
                        onClick={() => {
                          setEditingTaskId(task.id);
                          setEditField('due_date');
                          setEditValue(task.due_date ? task.due_date.slice(0, 10) : '');
                        }}
                        title="Click to edit due date"
                      >
                        {task.due_date ? new Date(task.due_date).toLocaleDateString() : <span className="italic text-gray-400">None</span>}
                      </span>
                    )}
                  </td>
                  {/* Status Cell */}
                  <td className="px-4 py-2 text-gray-700 capitalize">
                    {editingTaskId === task.id && editField === 'status' ? (
                      <div className="flex items-center space-x-2">
                        <select
                          className="border rounded px-2 py-1 text-sm"
                          value={editValue}
                          onChange={e => setEditValue(e.target.value)}
                          disabled={saving}
                        >
                          <option value="not_started">Not Started</option>
                          <option value="in_progress">In Progress</option>
                          <option value="completed">Completed</option>
                        </select>
                        <button
                          className="text-green-600 hover:underline text-xs"
                          onClick={() => handleSave(task, 'status')}
                          disabled={saving}
                        >Save</button>
                        <button
                          className="text-gray-500 hover:underline text-xs"
                          onClick={handleCancel}
                          disabled={saving}
                        >Cancel</button>
                      </div>
                    ) : (
                      <span
                        className="cursor-pointer hover:underline"
                        onClick={() => {
                          setEditingTaskId(task.id);
                          setEditField('status');
                          setEditValue(task.status || 'not_started');
                        }}
                        title="Click to edit status"
                      >
                        {task.status ? task.status.replace('_', ' ') : '—'}
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {/* Mobile Card/List */}
        <div className="sm:hidden space-y-3 mt-2">
          {displayTasks.map((task) => (
            <div key={task.id} className="bg-white border border-gray-200 rounded-lg shadow-sm p-3 flex flex-col">
              <div className="font-semibold text-gray-900 text-base mb-1">{task.title}</div>
              <div className="text-sm text-gray-700">Due: {task.due_date ? new Date(task.due_date).toLocaleDateString() : <span className="italic text-gray-400">None</span>}</div>
              <div className="text-sm text-gray-700">Status: <span className="capitalize">{task.status ? task.status.replace('_', ' ') : '—'}</span></div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  const formatAIContent = (content = '') => {
    const jsonObjects = extractJsonFromCodeBlock(content);
    if (jsonObjects && jsonObjects.length > 0) {
      // Check for read actions first
      const readTask = jsonObjects.find(json => json.action_type === 'read' && json.entity_type === 'task');
      const readGoal = jsonObjects.find(json => json.action_type === 'read' && json.entity_type === 'goal');
      
      if (readTask) {
        // Render the task list responsively
        const tasks = readTask.details && (Array.isArray(readTask.details.tasks) ? readTask.details.tasks : readTask.details);
        return (
          <div>
            <div className="font-semibold mb-2">Here are your tasks:</div>
            {renderTaskList(tasks)}
          </div>
        );
      }
      if (readGoal) {
        return '<strong>Here are your goals:</strong>';
      }
      // For create/update/delete actions, show a summary
      const createActions = jsonObjects.filter(json => json.action_type === 'create');
      const updateActions = jsonObjects.filter(json => json.action_type === 'update');
      const deleteActions = jsonObjects.filter(json => json.action_type === 'delete');
      let summary = '';
      if (createActions.length > 0) {
        summary += `Created ${createActions.length} item${createActions.length > 1 ? 's' : ''}`;
      }
      if (updateActions.length > 0) {
        summary += `${summary ? ', ' : ''}Updated ${updateActions.length} item${updateActions.length > 1 ? 's' : ''}`;
      }
      if (deleteActions.length > 0) {
        summary += `${summary ? ', ' : ''}Deleted ${deleteActions.length} item${deleteActions.length > 1 ? 's' : ''}`;
      }
      return `<strong>${summary}</strong>`;
    }
    // Fallback to normal formatting
    let formatted = content
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.*?)\*/g, '<em>$1</em>')
      .replace(/•/g, '• ')
      .replace(/\n/g, '<br>');
    // Remove lines that start with 'Description:'
    formatted = formatted.replace(/<br>\s*Description:.*?(<br>|$)/gi, '<br>');
    return formatted;
  };

  if (message.type === 'calendar_events') {
    return (
      <div className="p-4 bg-blue-100 rounded-lg">
        <p className="font-semibold">Here are your upcoming events:</p>
        <ul className="list-disc pl-5 mt-2">
          {Array.isArray(message.content) && message.content.length > 0 ? (
            message.content.map(event => (
              <li key={event.id}>
                <strong>{event.summary}</strong> on {new Date(event.start.dateTime || event.start.date).toLocaleDateString()}
              </li>
            ))
          ) : (
            <li>No upcoming events found.</li>
          )}
        </ul>
      </div>
    );
  }

  if (message.type === 'user') {
    // User message: right-aligned bubble
    return (
      <div className="flex justify-end">
        <div className="max-w-[80%] px-4 py-3 rounded-2xl bg-black text-white">
          <div
            className="prose prose-sm max-w-none"
            dangerouslySetInnerHTML={{ __html: formatAIContent(message.content) }}
          />
        </div>
      </div>
    );
  }

  // AI message: left-justified, full-width, no bubble
  const jsonObjects = extractJsonFromCodeBlock(message.content);
  const readTask = jsonObjects && jsonObjects.find(json => json.action_type === 'read' && json.entity_type === 'task');
  if (readTask) {
    const tasks = readTask.details && (Array.isArray(readTask.details.tasks) ? readTask.details.tasks : readTask.details);
    return (
      <div className="flex">
        <div className="w-full text-left">
          {formatAIContent(message.content)}
        </div>
      </div>
    );
  }
  // Only render goal titles from backend/AI response */}
  const readGoal = jsonObjects && jsonObjects.find(json => json.action_type === 'read' && json.entity_type === 'goal');
  let goalTitles = [];
  if (readGoal && readGoal.details && Array.isArray(readGoal.details.goals)) {
    goalTitles = readGoal.details.goals;
  }
  return (
    <div className="flex">
      <div className="w-full text-left">
        <div
          className="prose prose-sm max-w-none text-black text-left"
          style={{ background: 'none', borderRadius: 0, padding: 0, marginLeft: 0, marginRight: 0 }}
          dangerouslySetInnerHTML={{ __html: formatAIContent(message.content) }}
        />
        {/* Only render goal titles from backend/AI response */}
        {goalTitles.length > 0 && (
          <ul className="list-disc pl-5 text-sm mt-1">
            {goalTitles.map((title, idx) => (
              <li key={idx}><strong>{title}</strong></li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
};

export default function AIChatWithProvider(props) {
  return (
    <AIActionProvider>
      <AIChat {...props} />
    </AIActionProvider>
  );
} 