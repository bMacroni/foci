import React, { useState, useRef, useEffect } from 'react';
import { aiAPI, goalsAPI, tasksAPI, conversationsAPI } from '../services/api';

const AIChat = ({ onNavigateToTab }) => {
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [userData, setUserData] = useState({ goals: [], tasks: [] });
  const [hasLoadedData, setHasLoadedData] = useState(false);
  const [conversationThreads, setConversationThreads] = useState([]);
  const [currentThreadId, setCurrentThreadId] = useState(null);
  const [isLoadingThreads, setIsLoadingThreads] = useState(false);
  const [showMobileSidebar, setShowMobileSidebar] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(true);
  const messagesEndRef = useRef(null);

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

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!inputMessage.trim() || isLoading) return;

    const userMessage = {
      id: Date.now(),
      type: 'user',
      content: inputMessage,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputMessage('');
    setIsLoading(true);
    setShowSuggestions(false); // Hide suggestions when user starts typing

    try {
      // Create a new thread if none exists and get the thread ID
      let threadId = currentThreadId;
      if (!threadId) {
        console.log('No current thread, creating new one');
        const title = `Conversation ${new Date().toLocaleDateString()}`;
        const threadResponse = await conversationsAPI.createThread(title);
        threadId = threadResponse.data.id;
        setCurrentThreadId(threadId);
        
        // Add the new thread to the list without refreshing the entire list
        const newThread = {
          ...threadResponse.data,
          message_count: 0,
          last_message: null
        };
        setConversationThreads(prev => Array.isArray(prev) ? [newThread, ...prev] : [newThread]);
      }

      const response = await aiAPI.sendMessage(inputMessage, threadId);
      
      const aiMessage = {
        id: Date.now() + 1,
        type: 'ai',
        content: response.data.message,
        actions: response.data.actions || [],
        timestamp: new Date()
      };

      setMessages(prev => [...prev, aiMessage]);
      
      // Update the current thread's last message in the list without full refresh
      if (threadId) {
        setConversationThreads(prev => {
          if (!Array.isArray(prev)) return prev;
          return prev.map(thread => 
            thread.id === threadId 
              ? {
                  ...thread,
                  message_count: (thread.message_count || 0) + 2, // +2 for user and AI messages
                  last_message: {
                    content: aiMessage.content.substring(0, 100) + (aiMessage.content.length > 100 ? '...' : ''),
                    role: 'assistant',
                    created_at: aiMessage.timestamp.toISOString()
                  },
                  updated_at: aiMessage.timestamp.toISOString()
                }
              : thread
          );
        });
      }
      
      // Only refresh user data, not conversation threads to avoid UI reset
      await refreshUserData();
    } catch (error) {
      console.error('Error sending message:', error);
      
      const errorMessage = {
        id: Date.now() + 1,
        type: 'ai',
        content: "I'm sorry, I encountered an error. Please try again or check your connection.",
        timestamp: new Date()
      };

      setMessages(prev => [...prev, errorMessage]);
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

  // Generate smart suggestions based on user data
  const generateSuggestions = () => {
    const hasGoals = Array.isArray(userData.goals) ? userData.goals.length > 0 : false;
    const hasTasks = Array.isArray(userData.tasks) ? userData.tasks.length > 0 : false;
    const tasksArray = Array.isArray(userData.tasks) ? userData.tasks : [];
    const incompleteTasks = tasksArray.filter(task => !task.completed);

    const suggestions = [];

    if (!hasGoals) {
      suggestions.push({
        text: "Create my first goal",
        action: () => setInputMessage("I want to create a goal to improve my productivity"),
        icon: "🎯"
      });
    }

    if (hasGoals && !hasTasks) {
      suggestions.push({
        text: "Break down my goals into tasks",
        action: () => setInputMessage("Help me break down my goals into actionable tasks"),
        icon: "📋"
      });
    }

    if (incompleteTasks.length > 0) {
      suggestions.push({
        text: `Review my ${incompleteTasks.length} incomplete tasks`,
        action: () => setInputMessage("Show me my incomplete tasks and help me prioritize them"),
        icon: "📝"
      });
    }

    suggestions.push({
      text: "Schedule something for today",
      action: () => setInputMessage("I want to schedule an event for today"),
      icon: "📅"
    });

    suggestions.push({
      text: "Get productivity advice",
      action: () => setInputMessage("Give me some productivity tips for today"),
      icon: "💡"
    });

    return suggestions;
  };

  // Show loading state while fetching user data
  if (!hasLoadedData) {
    return (
      <div className="bg-white/90 backdrop-blur-sm rounded-3xl shadow-2xl border border-black/10 h-[700px] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="bg-black text-white p-6 rounded-t-3xl">
          <div className="flex items-center">
            <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center mr-4 shadow-lg">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
              </svg>
            </div>
            <div>
              <h3 className="text-xl font-bold">Foci.ai</h3>
              <p className="text-gray-200 font-medium">Your intelligent productivity companion</p>
            </div>
          </div>
        </div>

        {/* Loading Content */}
        <div className="flex-1 flex items-center justify-center bg-white/80">
          <div className="text-center">
            <div className="flex space-x-1 mb-4">
              <div className="w-3 h-3 bg-blue-500 rounded-full animate-bounce"></div>
              <div className="w-3 h-3 bg-purple-500 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
              <div className="w-3 h-3 bg-indigo-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
            </div>
            <p className="text-gray-600 font-medium">Loading your personalized experience...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white/90 backdrop-blur-sm rounded-3xl shadow-2xl border border-black/10 h-[700px] flex overflow-hidden relative">
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
                  {conversationThreads.map((thread) => (
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
                            {thread.title}
                          </p>
                          <p className={`text-xs truncate ${
                            currentThreadId === thread.id ? 'text-gray-200' : 'text-gray-500'
                          }`}>
                            {new Date(thread.created_at).toLocaleDateString()}
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
                  ))}
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
                {conversationThreads.map((thread) => (
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
                          {thread.title}
                        </p>
                        <p className={`text-xs truncate ${
                          currentThreadId === thread.id ? 'text-gray-200' : 'text-gray-500'
                        }`}>
                          {new Date(thread.created_at).toLocaleDateString()}
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
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col">
        {/* Chat Header */}
        <div className="bg-black text-white p-6 rounded-t-3xl">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center mr-4 shadow-lg">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                </svg>
              </div>
              <div>
                <h3 className="text-xl font-bold">Foci.ai</h3>
                <p className="text-gray-200 font-medium">Your intelligent productivity companion</p>
              </div>
            </div>
            
            {/* Mobile menu button */}
            <button
              onClick={() => setShowMobileSidebar(true)}
              className="lg:hidden p-2 text-gray-300 hover:text-white transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
          </div>
        </div>

        {/* Contextual Information Bar */}
        <div className="bg-gray-50 border-b border-black/10 p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-6 text-sm">
              <div className="flex items-center space-x-2">
                <span className="text-gray-600">Goals:</span>
                <span className="font-medium text-black">{Array.isArray(userData.goals) ? userData.goals.length : 0}</span>
              </div>
              <div className="flex items-center space-x-2">
                <span className="text-gray-600">Tasks:</span>
                <span className="font-medium text-black">{Array.isArray(userData.tasks) ? userData.tasks.length : 0}</span>
              </div>
              <div className="flex items-center space-x-2">
                <span className="text-gray-600">Completed:</span>
                <span className="font-medium text-green-600">
                  {Array.isArray(userData.tasks) ? userData.tasks.filter(task => task.completed).length : 0}
                </span>
              </div>
            </div>
            
            <div className="flex items-center space-x-2">
              <button
                onClick={() => onNavigateToTab('goals')}
                className="px-3 py-1 text-xs bg-white border border-black/20 rounded-lg hover:bg-gray-50 transition-colors"
              >
                View Goals
              </button>
              <button
                onClick={() => onNavigateToTab('tasks')}
                className="px-3 py-1 text-xs bg-white border border-black/20 rounded-lg hover:bg-gray-50 transition-colors"
              >
                View Tasks
              </button>
            </div>
          </div>
          
          {/* Quick Stats */}
          {(Array.isArray(userData.goals) && userData.goals.length > 0) || (Array.isArray(userData.tasks) && userData.tasks.length > 0) ? (
            <div className="mt-3 pt-3 border-t border-black/10">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs">
                {Array.isArray(userData.goals) && userData.goals.length > 0 && (
                  <div className="text-center">
                    <div className="font-semibold text-black">{userData.goals.filter(g => g.is_active).length}</div>
                    <div className="text-gray-500">Active Goals</div>
                  </div>
                )}
                {Array.isArray(userData.tasks) && userData.tasks.length > 0 && (
                  <>
                    <div className="text-center">
                      <div className="font-semibold text-blue-600">{userData.tasks.filter(t => t.status === 'in_progress').length}</div>
                      <div className="text-gray-500">In Progress</div>
                    </div>
                    <div className="text-center">
                      <div className="font-semibold text-orange-600">{userData.tasks.filter(t => t.due_date && new Date(t.due_date) < new Date() && t.status !== 'completed').length}</div>
                      <div className="text-gray-500">Overdue</div>
                    </div>
                    <div className="text-center">
                      <div className="font-semibold text-green-600">{userData.tasks.filter(t => t.status === 'completed').length}</div>
                      <div className="text-gray-500">Completed</div>
                    </div>
                  </>
                )}
              </div>
            </div>
          ) : null}
        </div>

        {/* Messages Area */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {messages.map((message) => (
            <MessageBubble key={message.id} message={message} />
          ))}
          
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

        {/* Smart Suggestions */}
        {showSuggestions && messages.length <= 1 && (
          <div className="border-t border-black/10 p-4 bg-gray-50">
            <div className="mb-3">
              <h4 className="text-sm font-semibold text-gray-700 mb-2">Quick Actions</h4>
            </div>
            <div className="flex flex-wrap gap-2">
              {generateSuggestions().map((suggestion, index) => (
                <button
                  key={index}
                  onClick={() => {
                    suggestion.action();
                    setShowSuggestions(false);
                  }}
                  className="px-3 py-2 bg-white border border-black/20 rounded-lg hover:bg-gray-50 transition-colors text-sm flex items-center space-x-2"
                >
                  <span>{suggestion.icon}</span>
                  <span>{suggestion.text}</span>
                </button>
              ))}
            </div>
          </div>
        )}

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
          </form>
        </div>
      </div>
    </div>
  );
};

const MessageBubble = ({ message }) => {
  const formatAIContent = (content) => {
    // Convert markdown-style formatting to HTML
    return content
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.*?)\*/g, '<em>$1</em>')
      .replace(/•/g, '• ')
      .replace(/\n/g, '<br>');
  };

  return (
    <div className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}>
      <div
        className={`max-w-[80%] px-4 py-3 rounded-2xl ${
          message.type === 'user'
            ? 'bg-black text-white'
            : 'bg-gray-100 text-black'
        }`}
      >
        <div
          className="prose prose-sm max-w-none"
          dangerouslySetInnerHTML={{ __html: formatAIContent(message.content) }}
        />
        
        {message.actions && message.actions.length > 0 && (
          <div className="mt-3 pt-3 border-t border-black/10">
            <div className="text-xs text-gray-500 mb-2">Actions taken:</div>
            <div className="space-y-1">
              {message.actions.map((action, index) => (
                <div key={index} className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded">
                  ✓ {action}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AIChat; 