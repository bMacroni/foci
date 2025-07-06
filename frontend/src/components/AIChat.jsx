import React, { useState, useRef, useEffect } from 'react';
import { aiAPI, goalsAPI, tasksAPI, conversationsAPI } from '../services/api';

const AIChat = () => {
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [userData, setUserData] = useState({ goals: [], tasks: [] });
  const [hasLoadedData, setHasLoadedData] = useState(false);
  const [conversationThreads, setConversationThreads] = useState([]);
  const [currentThreadId, setCurrentThreadId] = useState(null);
  const [isLoadingThreads, setIsLoadingThreads] = useState(false);
  const [showMobileSidebar, setShowMobileSidebar] = useState(false);
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
          goals: goalsResponse.data || [],
          tasks: tasksResponse.data || []
        });
        setConversationThreads(Array.isArray(threadsResponse.data) ? threadsResponse.data : []);
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
    if (hasLoadedData) {
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
  }, [hasLoadedData, userData]);

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
      
      setUserData({
        goals: goalsResponse.data || [],
        tasks: tasksResponse.data || []
      });
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
      
      setMessages(chatMessages);
      setCurrentThreadId(threadId);
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

    // Create a new thread if none exists
    if (!currentThreadId) {
      await createNewThread();
      // Wait a bit for the thread to be created
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    const userMessage = {
      id: Date.now(),
      type: 'user',
      content: inputMessage,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputMessage('');
    setIsLoading(true);

    try {
      const response = await aiAPI.sendMessage(inputMessage, currentThreadId);
      
      const aiMessage = {
        id: Date.now() + 1,
        type: 'ai',
        content: response.data.message,
        actions: response.data.actions || [],
        timestamp: new Date()
      };

      setMessages(prev => [...prev, aiMessage]);
      
      // Refresh user data and conversation threads after AI response
      await Promise.all([
        refreshUserData(),
        conversationsAPI.getThreads().then(res => setConversationThreads(Array.isArray(res.data) ? res.data : []))
      ]);
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
                <div className="flex justify-center py-8">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-black"></div>
                </div>
              ) : (Array.isArray(conversationThreads) ? conversationThreads : []).length === 0 ? (
                <div className="text-center py-8">
                  <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
                    <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                    </svg>
                  </div>
                  <p className="text-sm text-gray-500">No conversations yet</p>
                  <p className="text-xs text-gray-400 mt-1">Start a new conversation to begin</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {(Array.isArray(conversationThreads) ? conversationThreads : []).map((thread) => (
                    <div
                      key={thread.id}
                      className={`p-3 rounded-xl cursor-pointer transition-all duration-200 ${
                        currentThreadId === thread.id
                          ? 'bg-black text-white'
                          : 'bg-white hover:bg-gray-100 text-black'
                      }`}
                      onClick={() => {
                        loadConversationThread(thread.id);
                        setShowMobileSidebar(false);
                      }}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1 min-w-0">
                          <h4 className="font-medium text-sm truncate">{thread.title}</h4>
                          {thread.last_message && (
                            <p className={`text-xs mt-1 truncate ${
                              currentThreadId === thread.id ? 'text-gray-300' : 'text-gray-500'
                            }`}>
                              {thread.last_message.content}
                            </p>
                          )}
                          <div className={`flex items-center space-x-2 mt-2 text-xs ${
                            currentThreadId === thread.id ? 'text-gray-300' : 'text-gray-400'
                          }`}>
                            <span>{thread.message_count} messages</span>
                            <span>•</span>
                            <span>{new Date(thread.updated_at).toLocaleDateString()}</span>
                          </div>
                        </div>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            deleteThread(thread.id);
                          }}
                          className={`p-1 rounded transition-colors ${
                            currentThreadId === thread.id
                              ? 'hover:bg-white/20'
                              : 'hover:bg-gray-200'
                          }`}
                          title="Delete conversation"
                        >
                          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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

      {/* Conversation Threads Sidebar - Hidden on mobile, shown on desktop */}
      <div className="hidden lg:flex w-80 bg-gray-50/80 backdrop-blur-sm border-r border-black/10 flex-col">
        <div className="p-4 border-b border-black/10">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-bold text-black">Conversations</h3>
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
        
        <div className="flex-1 overflow-y-auto p-4">
          {isLoadingThreads ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-black"></div>
            </div>
          ) : (Array.isArray(conversationThreads) ? conversationThreads : []).length === 0 ? (
            <div className="text-center py-8">
              <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
              </div>
              <p className="text-sm text-gray-500">No conversations yet</p>
              <p className="text-xs text-gray-400 mt-1">Start a new conversation to begin</p>
            </div>
          ) : (
            <div className="space-y-2">
              {(Array.isArray(conversationThreads) ? conversationThreads : []).map((thread) => (
                <div
                  key={thread.id}
                  className={`p-3 rounded-xl cursor-pointer transition-all duration-200 ${
                    currentThreadId === thread.id
                      ? 'bg-black text-white'
                      : 'bg-white hover:bg-gray-100 text-black'
                  }`}
                  onClick={() => loadConversationThread(thread.id)}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <h4 className="font-medium text-sm truncate">{thread.title}</h4>
                      {thread.last_message && (
                        <p className={`text-xs mt-1 truncate ${
                          currentThreadId === thread.id ? 'text-gray-300' : 'text-gray-500'
                        }`}>
                          {thread.last_message.content}
                        </p>
                      )}
                      <div className={`flex items-center space-x-2 mt-2 text-xs ${
                        currentThreadId === thread.id ? 'text-gray-300' : 'text-gray-400'
                      }`}>
                        <span>{thread.message_count} messages</span>
                        <span>•</span>
                        <span>{new Date(thread.updated_at).toLocaleDateString()}</span>
                      </div>
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        deleteThread(thread.id);
                      }}
                      className={`p-1 rounded transition-colors ${
                        currentThreadId === thread.id
                          ? 'hover:bg-white/20'
                          : 'hover:bg-gray-200'
                      }`}
                      title="Delete conversation"
                    >
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <div className="bg-black text-white p-6 rounded-tr-3xl">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center mr-4 shadow-lg">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                </svg>
              </div>
              <div>
                <h3 className="text-xl font-bold">Foci.ai</h3>
                <p className="text-gray-200 font-medium hidden sm:block">Your intelligent productivity companion</p>
              </div>
            </div>
            {/* Mobile menu button */}
            <button
              onClick={() => setShowMobileSidebar(!showMobileSidebar)}
              className="lg:hidden p-2 text-white hover:bg-white/20 rounded-xl transition-colors duration-200"
              title="Toggle Conversations"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-white/80">
        {messages.map((message, index) => (
          <div 
            key={message.id} 
            className="animate-fadeIn"
            style={{ 
              animationDelay: `${index * 0.1}s`,
              animationFillMode: 'both'
            }}
          >
            <MessageBubble message={message} />
          </div>
        ))}
        
        {/* Quick action suggestions - show for new users or when there's only the welcome message */}
        {messages.length === 1 && hasLoadedData && (
          <div className="animate-fadeIn" style={{ animationDelay: '0.5s' }}>
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50/80 backdrop-blur-sm rounded-2xl p-6 border border-blue-200/50 shadow-lg">
              <p className="text-sm text-blue-800 font-medium mb-4 flex items-center space-x-2">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
                <span className="text-base">Quick Start Suggestions</span>
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {(() => {
                  const hasGoals = Array.isArray(userData.goals) ? userData.goals.length > 0 : false;
                  const hasTasks = Array.isArray(userData.tasks) ? userData.tasks.length > 0 : false;
                  
                  if (!hasGoals && !hasTasks) {
                    // New user suggestions
                    return [
                      {
                        text: "Help me set up my first goal",
                        category: "Goals",
                        icon: "🎯"
                      },
                      {
                        text: "Create a task for today",
                        category: "Tasks", 
                        icon: "📝"
                      },
                      {
                        text: "Show me productivity tips",
                        category: "Advice",
                        icon: "💡"
                      },
                      {
                        text: "Help me organize my week",
                        category: "Planning",
                        icon: "📅"
                      },
                      {
                        text: "What should I focus on today?",
                        category: "Focus",
                        icon: "🎯"
                      },
                      {
                        text: "Help me break down a big project",
                        category: "Planning",
                        icon: "📋"
                      }
                    ];
                  } else if (hasGoals && !hasTasks) {
                    // Has goals but no tasks
                    return [
                      {
                        text: "Break down my goals into tasks",
                        category: "Tasks",
                        icon: "📋"
                      },
                      {
                        text: "Create tasks for today",
                        category: "Tasks",
                        icon: "📝"
                      },
                      {
                        text: "Review my goals",
                        category: "Goals",
                        icon: "🎯"
                      },
                      {
                        text: "Plan my week around my goals",
                        category: "Planning",
                        icon: "📅"
                      },
                      {
                        text: "What's my next priority?",
                        category: "Focus",
                        icon: "🎯"
                      },
                      {
                        text: "Plan my week",
                        category: "Planning",
                        icon: "📅"
                      }
                    ];
                  } else {
                    // Has both goals and tasks
                    return [
                      {
                        text: "Review my progress",
                        category: "Progress",
                        icon: "📊"
                      },
                      {
                        text: "Create new tasks",
                        category: "Tasks",
                        icon: "📝"
                      },
                      {
                        text: "What should I focus on today?",
                        category: "Focus",
                        icon: "🎯"
                      },
                      {
                        text: "Plan my week",
                        category: "Planning",
                        icon: "📅"
                      },
                      {
                        text: "Show me productivity tips",
                        category: "Advice",
                        icon: "💡"
                      }
                    ];
                  }
                })().map((suggestion, idx) => (
                  <button
                    key={idx}
                    onClick={() => setInputMessage(suggestion.text)}
                    className="text-left text-sm text-blue-700 hover:text-blue-900 hover:bg-blue-100/50 rounded-xl px-4 py-3 transition-all duration-200 border border-blue-200/30 hover:border-blue-300/50 group"
                  >
                    <div className="flex items-center space-x-2">
                      <span className="text-lg">{suggestion.icon}</span>
                      <div>
                        <div className="font-medium group-hover:underline">{suggestion.text}</div>
                        <div className="text-xs text-blue-600 opacity-75">{suggestion.category}</div>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
              <div className="mt-4 pt-4 border-t border-blue-200/50">
                <p className="text-xs text-blue-700 opacity-80">
                  💡 <strong>Pro tip:</strong> You can also just tell me what's on your mind - I'll help you turn it into actionable goals and tasks!
                </p>
              </div>
            </div>
          </div>
        )}
        
        {isLoading && (
          <div className="flex items-center space-x-3 text-gray-600 bg-white/60 backdrop-blur-sm rounded-2xl p-4 shadow-sm animate-fadeIn">
            <div className="flex space-x-1">
              <div className="w-3 h-3 bg-blue-500 rounded-full animate-bounce"></div>
              <div className="w-3 h-3 bg-purple-500 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
              <div className="w-3 h-3 bg-indigo-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
            </div>
            <span className="font-medium">AI is thinking...</span>
            <div className="flex space-x-1 ml-2">
              <div className="w-1 h-1 bg-gray-400 rounded-full animate-pulse"></div>
              <div className="w-1 h-1 bg-gray-400 rounded-full animate-pulse" style={{ animationDelay: '0.2s' }}></div>
              <div className="w-1 h-1 bg-gray-400 rounded-full animate-pulse" style={{ animationDelay: '0.4s' }}></div>
            </div>
          </div>
        )}
        
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="bg-white/90 backdrop-blur-sm border-t border-black/10 p-6">
        <form onSubmit={handleSubmit} className="flex space-x-4">
          <div className="flex-1">
            <textarea
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Tell me what you'd like to work on today, or ask me to help you get organized..."
              className="w-full px-4 py-3 border-2 border-gray-200 rounded-2xl focus:outline-none focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 resize-none bg-white/80 backdrop-blur-sm shadow-sm transition-all duration-200"
              rows="2"
              disabled={isLoading}
            />
          </div>
          <button
            type="submit"
            disabled={!inputMessage.trim() || isLoading}
            className="px-6 py-3 bg-black text-white rounded-2xl hover:bg-gray-800 focus:outline-none focus:ring-4 focus:ring-black/20 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg transition-all duration-200 transform hover:scale-105"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
            </svg>
          </button>
        </form>
        
        <div className="mt-3 text-sm text-gray-500 font-medium text-center">
          Press Enter to send, Shift+Enter for new line
        </div>
      </div>
    </div>
  </div>
  );
};

// Message Bubble Component
const MessageBubble = ({ message }) => {
  const isUser = message.type === 'user';
  
  // Function to format AI message content
  const formatAIContent = (content) => {
    if (isUser) return content; // Don't format user messages
    
    // Split content into lines
    const lines = content.split('\n');
    
    return lines.map((line, index) => {
      const trimmedLine = line.trim();
      
      // Handle bullet points
      if (trimmedLine.startsWith('•') || trimmedLine.startsWith('-') || trimmedLine.startsWith('*')) {
        return (
          <div key={index} className="flex items-start space-x-2 mb-1">
            <span className="text-blue-600 font-bold mt-1">•</span>
            <span className="flex-1">{trimmedLine.substring(1).trim()}</span>
          </div>
        );
      }
      
      // Handle numbered lists
      if (/^\d+\./.test(trimmedLine)) {
        const match = trimmedLine.match(/^(\d+)\.\s*(.*)/);
        if (match) {
          return (
            <div key={index} className="flex items-start space-x-2 mb-1">
              <span className="text-blue-600 font-bold text-xs mt-1 min-w-[20px]">{match[1]}.</span>
              <span className="flex-1">{match[2]}</span>
            </div>
          );
        }
      }
      
      // Handle headers (lines that end with :)
      if (trimmedLine.endsWith(':') && trimmedLine.length < 50) {
        return (
          <div key={index} className="font-semibold text-blue-800 mb-2 mt-3 first:mt-0">
            {trimmedLine}
          </div>
        );
      }
      
      // Handle bold text (text between **)
      if (trimmedLine.includes('**')) {
        const parts = trimmedLine.split('**');
        return (
          <div key={index} className="mb-2">
            {parts.map((part, partIndex) => 
              partIndex % 2 === 1 ? (
                <span key={partIndex} className="font-semibold">{part}</span>
              ) : (
                part
              )
            )}
          </div>
        );
      }
      
      // Handle empty lines
      if (trimmedLine === '') {
        return <div key={index} className="h-2"></div>;
      }
      
      // Regular text
      return (
        <div key={index} className="mb-2 last:mb-0">
          {trimmedLine}
        </div>
      );
    });
  };
  
  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}>
      <div className={`max-w-xs lg:max-w-lg xl:max-w-xl px-6 py-4 rounded-3xl shadow-lg backdrop-blur-sm ${
        isUser 
          ? 'bg-black text-white' 
          : 'bg-white/90 text-black border border-black/10'
      }`}>
        <div className="text-sm leading-relaxed">
          {formatAIContent(message.content)}
        </div>
        
        {message.actions && message.actions.length > 0 && (
          <div className="mt-3 space-y-1">
            {message.actions.map((action, index) => (
              <div key={index} className="text-xs flex items-center space-x-2">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span className={isUser ? 'text-blue-100' : 'text-gray-600'}>{action}</span>
              </div>
            ))}
          </div>
        )}
        
        <div className={`text-xs mt-3 opacity-70 ${
          isUser ? 'text-blue-100' : 'text-gray-500'
        }`}>
          {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </div>
      </div>
    </div>
  );
};

export default AIChat; 