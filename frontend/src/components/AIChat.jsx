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

  const createNewThread = async () => {
    try {
      const title = `New Conversation ${new Date().toLocaleDateString()}`;
      const response = await conversationsAPI.createThread(title);
      const newThread = response.data;
      
      setConversationThreads(prev => Array.isArray(prev) ? [newThread, ...prev] : [newThread]);
      setCurrentThreadId(newThread.id);
      setMessages([]);
      
      // Set initial welcome message
      const welcomeMessage = generateWelcomeMessage();
      setMessages([{
        id: 1,
        type: 'ai',
        content: welcomeMessage,
        timestamp: new Date()
      }]);
    } catch (error) {
      console.error('Error creating new thread:', error);
    }
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
      
      return `🎯 **Welcome back!** Great progress - you have ${goalsCount} goal${goalsCount !== 1 ? 's' : ''} and ${totalTasks} task${totalTasks !== 1 ? 's' : ''} (${completedTasks} completed).

**Let's keep the momentum going!** I can help you:

• **Review your progress** and celebrate wins
• **Create new tasks** for your goals
• **Prioritize what's next** for today
• **Adjust your goals** if needed

**What's your focus for today?**`;
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
        const response = await conversationsAPI.createThread({ title: getSummary(inputMessage) });
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
            
            <div className="flex-1 overflow-y-auto p-4">
              {isLoadingThreads ? (
                <div className="flex items-center justify-center py-8">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-black"></div>
                </div>
              ) : (
                <div className="space-y-2">
                  {conversationThreads.map((thread) => {
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
                    const formattedDate = createdAt ? new Date(createdAt).toLocaleString() : '';
                    return (
                      <div
                        key={thread.id}
                        className={`p-3 rounded-xl cursor-pointer transition-colors ${
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
                          <div className="flex-1 min-w-0">
                            <p className={`text-sm font-medium truncate ${
                              currentThreadId === thread.id ? 'text-white' : 'text-black'
                            }`}>
                              [{type}] {summary}
                            </p>
                            <p className={`text-xs truncate ${
                              currentThreadId === thread.id ? 'text-gray-200' : 'text-gray-500'
                            }`}>
                              {formattedDate}
                            </p>
                          </div>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              deleteThread(thread.id);
                            }}
                            className={`p-1 rounded ${
                              currentThreadId === thread.id
                                ? 'hover:bg-white/20'
                                : 'hover:bg-gray-200'
                            }`}
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                        </div>
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
      <div className="hidden lg:flex lg:w-80 flex-shrink-0 border-r border-black/10">
        <div className="w-full flex flex-col">
          {/* Sidebar Header */}
          <div className="p-4 border-b border-black/10">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-black">Conversations</h3>
              <button
                onClick={createNewThread}
                className="p-2 text-gray-500 hover:text-black transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
              </button>
            </div>
            <button
              onClick={createNewThread}
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
          
          {/* Conversation Threads */}
          <div className="flex-1 overflow-y-auto p-4">
            {isLoadingThreads ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-black"></div>
              </div>
            ) : (
              <div className="space-y-2">
                {conversationThreads.map((thread) => {
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
                  const formattedDate = createdAt ? new Date(createdAt).toLocaleString() : '';
                  return (
                    <div
                      key={thread.id}
                      className={`p-3 rounded-xl cursor-pointer transition-colors ${
                        currentThreadId === thread.id
                          ? 'bg-black text-white'
                          : 'hover:bg-gray-100'
                      }`}
                      onClick={() => loadConversationThread(thread.id)}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex-1 min-w-0">
                          <p className={`text-sm font-medium truncate ${
                            currentThreadId === thread.id ? 'text-white' : 'text-black'
                          }`}>
                            [{type}] {summary}
                          </p>
                          <p className={`text-xs truncate ${
                            currentThreadId === thread.id ? 'text-gray-200' : 'text-gray-500'
                          }`}>
                            {formattedDate}
                          </p>
                        </div>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            deleteThread(thread.id);
                          }}
                          className={`p-1 rounded ${
                            currentThreadId === thread.id
                              ? 'hover:bg-white/20'
                              : 'hover:bg-gray-200'
                          }`}
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </div>
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
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {messages.map((message) => {
            switch (message.type) {
              case 'user':
                return <MessageBubble key={message.id} message={message} />;
              case 'ai':
                return <MessageBubble key={message.id} message={message} fetchListForMessage={fetchListForMessage} listState={listByMessageId[message.id]} />;
              case 'calendar_events':
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

const MessageBubble = ({ message, fetchListForMessage, listState }) => {
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

  // New: If this is a 'read task' or 'read goal' code block, fetch list on first render
  useEffect(() => {
    const jsonObjects = extractJsonFromCodeBlock(message.content);
    if (
      jsonObjects &&
      jsonObjects.length > 0 &&
      fetchListForMessage &&
      !listState // Only fetch if not already fetched
    ) {
      // Check if any of the JSON objects are read actions
      const readAction = jsonObjects.find(json => 
        json.action_type === 'read' && 
        (json.entity_type === 'task' || json.entity_type === 'goal')
      );
      
      if (readAction) {
        fetchListForMessage(message.id, readAction.entity_type);
      }
    }
  }, [message, fetchListForMessage, listState]);

  const formatAIContent = (content = '') => {
    const jsonObjects = extractJsonFromCodeBlock(content);
    if (jsonObjects && jsonObjects.length > 0) {
      // Check for read actions first
      const readTask = jsonObjects.find(json => json.action_type === 'read' && json.entity_type === 'task');
      const readGoal = jsonObjects.find(json => json.action_type === 'read' && json.entity_type === 'goal');
      
      if (readTask) {
        return '<strong>Here are your tasks:</strong>';
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
  } else {
    // AI message: left-justified, full-width, no bubble
    const jsonObjects = extractJsonFromCodeBlock(message.content);
    const readTask = jsonObjects && jsonObjects.find(json => json.action_type === 'read' && json.entity_type === 'task');
    const isReadTask = !!readTask;
    const isReadGoal = jsonObjects && jsonObjects.some(json => json.action_type === 'read' && json.entity_type === 'goal');
    const hasActions = jsonObjects && jsonObjects.length > 0;
    // --- ADDED: Render goals from message.actions if present ---
    let goals = [];
    if (message.actions && Array.isArray(message.actions)) {
      const readGoalAction = message.actions.find(
        a => a.action_type === 'read' && a.entity_type === 'goal'
      );
      if (readGoalAction) {
        if (Array.isArray(readGoalAction.details)) {
          goals = readGoalAction.details;
        } else if (Array.isArray(readGoalAction.details?.goals)) {
          goals = readGoalAction.details.goals;
        }
      }
    }
    // --- END ADDED ---
    return (
      <div className="flex">
        <div className="w-full text-left">
          <div
            className="prose prose-sm max-w-none text-black text-left"
            style={{ background: 'none', borderRadius: 0, padding: 0, marginLeft: 0, marginRight: 0 }}
            dangerouslySetInnerHTML={{ __html: formatAIContent(message.content) }}
          />
          {/* Render task or goal list if this is a read-task or read-goal action */}
          {(isReadTask || isReadGoal) && (
            <div className="mt-2">
              {/* Always use tasks from the code block if present */}
              {isReadTask && Array.isArray(readTask.details?.tasks) && readTask.details.tasks.length > 0 && (
                <ul className="list-disc pl-5 text-sm mt-1">
                  {readTask.details.tasks.map((item) => (
                    <li key={item.id} className={item.completed ? 'line-through text-gray-400' : ''}>
                      {item.title}
                      {item.due_date && (
                        <span className="ml-2 text-xs text-gray-500">(Due: {new Date(item.due_date).toLocaleDateString()})</span>
                      )}
                    </li>
                  ))}
                </ul>
              )}
              {isReadTask && Array.isArray(readTask.details?.tasks) && readTask.details.tasks.length === 0 && (
                <div className="text-xs text-gray-500">No tasks found.</div>
              )}
              {/* Fallback to listState for goals */}
              {isReadGoal && listState?.items && Array.isArray(listState.items) && listState.items.length > 0 && (
                <ul className="list-disc pl-5 text-sm mt-1">
                  {listState.items.map((item) => (
                    <li key={item.id} className={item.completed ? 'line-through text-gray-400' : ''}>
                      {item.title}
                      {item.due_date && (
                        <span className="ml-2 text-xs text-gray-500">(Due: {new Date(item.due_date).toLocaleDateString()})</span>
                      )}
                    </li>
                  ))}
                </ul>
              )}
              {isReadGoal && listState?.items && Array.isArray(listState.items) && listState.items.length === 0 && (
                <div className="text-xs text-gray-500">No goals found.</div>
              )}
            </div>
          )}
          {/* Render goals from message.actions if present */}
          {goals.length > 0 && (
            <ul className="list-disc pl-5 text-sm mt-1">
              {goals.map(goal => (
                <li key={goal.id}>
                  <strong>{goal.title}</strong>
                  {goal.description && (
                    <div className="text-xs text-gray-500">{goal.description}</div>
                  )}
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    );
  }
};

export default function AIChatWithProvider(props) {
  return (
    <AIActionProvider>
      <AIChat {...props} />
    </AIActionProvider>
  );
} 