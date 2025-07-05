import React, { useState, useRef, useEffect } from 'react';
import { aiAPI } from '../services/api';

const AIChat = () => {
  const [messages, setMessages] = useState([
    {
      id: 1,
      type: 'ai',
      content: "Hello! I'm your MindGarden AI assistant. I can help you manage your goals, tasks, and calendar events. Try saying something like 'Add a goal to learn React' or 'Show me my tasks for today'.",
      timestamp: new Date()
    }
  ]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

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

    try {
      const response = await aiAPI.sendMessage(inputMessage);
      
      const aiMessage = {
        id: Date.now() + 1,
        type: 'ai',
        content: response.data.message,
        actions: response.data.actions || [],
        timestamp: new Date()
      };

      setMessages(prev => [...prev, aiMessage]);
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
            <h3 className="text-xl font-bold">MindGarden AI Assistant</h3>
            <p className="text-gray-200 font-medium">Your intelligent productivity companion</p>
          </div>
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
        
        {/* Quick action suggestions */}
        {messages.length === 1 && (
          <div className="animate-fadeIn" style={{ animationDelay: '0.5s' }}>
            <div className="bg-blue-50/80 backdrop-blur-sm rounded-2xl p-4 border border-blue-200/50">
              <p className="text-sm text-blue-800 font-medium mb-3 flex items-center space-x-1">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                </svg>
                <span>Try asking me:</span>
              </p>
              <div className="space-y-2">
                {[
                  "How can I improve my focus?",
                  "Add a goal to learn React by next month",
                  "Create a task to review documents by Friday",
                  "What productivity tips do you have?"
                ].map((suggestion, idx) => (
                  <button
                    key={idx}
                    onClick={() => setInputMessage(suggestion)}
                    className="block w-full text-left text-xs text-blue-700 hover:text-blue-900 hover:bg-blue-100/50 rounded-lg px-3 py-2 transition-colors"
                  >
                    "{suggestion}"
                  </button>
                ))}
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
      <div className="bg-white/90 backdrop-blur-sm border-t border-black/10 p-6 rounded-b-3xl">
        <form onSubmit={handleSubmit} className="flex space-x-4">
          <div className="flex-1">
            <textarea
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Ask me to add a goal, create a task, or check your calendar..."
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