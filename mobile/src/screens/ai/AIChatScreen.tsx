import React, { useState, useRef, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, ActivityIndicator, Platform, Animated, Dimensions } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { KeyboardAvoidingView } from 'react-native';
import Icon from 'react-native-vector-icons/Octicons';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { colors } from '../../themes/colors';
import { typography } from '../../themes/typography';
import { spacing, borderRadius } from '../../themes/spacing';

interface Message {
  id: number;
  text: string;
  sender: 'user' | 'ai';
}

interface Conversation {
  id: string;
  title: string;
  messages: Message[];
  isPinned: boolean;
  createdAt: Date;
  lastMessageAt: Date;
}

export default function AIChatScreen({ navigation, route }: any) {
  const insets = useSafeAreaInsets();
  const screenWidth = Dimensions.get('window').width;
  
  // Animation for sidebar
  const sidebarAnimation = useRef(new Animated.Value(-screenWidth * 0.8)).current;
  const overlayAnimation = useRef(new Animated.Value(0)).current;
  
  const [conversations, setConversations] = useState<Conversation[]>([
    {
      id: '1',
      title: 'General Chat',
      messages: [{ id: 1, text: 'Welcome to Foci! How can I help you today?', sender: 'ai' }],
      isPinned: false,
      createdAt: new Date(),
      lastMessageAt: new Date(),
    },
  ]);
  
  const [currentConversationId, setCurrentConversationId] = useState('1');
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [sidebarVisible, setSidebarVisible] = useState(false);

  const currentConversation = conversations.find(c => c.id === currentConversationId);

  const toggleSidebar = () => {
    if (sidebarVisible) {
      // Hide sidebar
      Animated.parallel([
        Animated.timing(sidebarAnimation, {
          toValue: -screenWidth * 0.8,
          duration: 300,
          useNativeDriver: false,
        }),
        Animated.timing(overlayAnimation, {
          toValue: 0,
          duration: 300,
          useNativeDriver: false,
        }),
      ]).start(() => setSidebarVisible(false));
    } else {
      // Show sidebar
      setSidebarVisible(true);
      Animated.parallel([
        Animated.timing(sidebarAnimation, {
          toValue: 0,
          duration: 300,
          useNativeDriver: false,
        }),
        Animated.timing(overlayAnimation, {
          toValue: 0.5,
          duration: 300,
          useNativeDriver: false,
        }),
      ]).start();
    }
  };

  const startNewConversation = () => {
    const newConversation: Conversation = {
      id: Date.now().toString(),
      title: 'New Conversation',
      messages: [{ id: 1, text: 'Welcome to Foci! How can I help you today?', sender: 'ai' }],
      isPinned: false,
      createdAt: new Date(),
      lastMessageAt: new Date(),
    };
    
    setConversations([newConversation, ...conversations]);
    setCurrentConversationId(newConversation.id);
    toggleSidebar();
  };

  const deleteConversation = (conversationId: string) => {
    const updatedConversations = conversations.filter(c => c.id !== conversationId);
    setConversations(updatedConversations);
    
    // If we deleted the current conversation, switch to the first available one
    if (conversationId === currentConversationId && updatedConversations.length > 0) {
      setCurrentConversationId(updatedConversations[0].id);
    } else if (updatedConversations.length === 0) {
      // If no conversations left, create a new one
      startNewConversation();
    }
  };

  const togglePinConversation = (conversationId: string) => {
    setConversations(conversations.map(c => 
      c.id === conversationId ? { ...c, isPinned: !c.isPinned } : c
    ));
  };

  const clearNonPinnedConversations = () => {
    const pinnedConversations = conversations.filter(c => c.isPinned);
    setConversations(pinnedConversations);
    
    if (pinnedConversations.length > 0 && !pinnedConversations.find(c => c.id === currentConversationId)) {
      setCurrentConversationId(pinnedConversations[0].id);
    } else if (pinnedConversations.length === 0) {
      startNewConversation();
    }
  };

  const updateConversationTitle = (conversationId: string, title: string) => {
    setConversations(conversations.map(c => 
      c.id === conversationId ? { ...c, title } : c
    ));
  };

  const handleSignOut = async () => {
    await AsyncStorage.removeItem('authToken');
    navigation.replace('Login');
  };

  const generateConversationTitle = (messages: Message[]): string => {
    // Get all user messages to analyze the conversation topic
    const userMessages = messages.filter(msg => msg.sender === 'user').map(msg => msg.text);
    
    if (userMessages.length === 0) {
      return 'New Conversation';
    }
    
    // If it's the first message, use it to generate a title
    if (userMessages.length === 1) {
      const firstMessage = userMessages[0].toLowerCase();
      
      // Common conversation starters and their topics
      const topicPatterns = [
        { pattern: /help.*goal|goal.*help/, title: 'Goal Planning' },
        { pattern: /schedule|calendar|plan.*day/, title: 'Scheduling Help' },
        { pattern: /anxiety|stress|worry|overwhelm/, title: 'Anxiety Support' },
        { pattern: /depression|sad|down|mood/, title: 'Mood Support' },
        { pattern: /productivity|focus|concentration/, title: 'Productivity Tips' },
        { pattern: /habit|routine|consistency/, title: 'Habit Building' },
        { pattern: /work|job|career/, title: 'Work & Career' },
        { pattern: /relationship|friend|family/, title: 'Relationships' },
        { pattern: /health|fitness|exercise/, title: 'Health & Fitness' },
        { pattern: /learning|study|education/, title: 'Learning & Education' },
        { pattern: /creativity|art|writing|music/, title: 'Creative Projects' },
        { pattern: /finance|money|budget/, title: 'Financial Planning' },
        { pattern: /travel|trip|vacation/, title: 'Travel Planning' },
        { pattern: /cooking|recipe|food/, title: 'Cooking & Food' },
        { pattern: /reading|book|literature/, title: 'Reading & Books' },
        { pattern: /technology|app|software/, title: 'Technology Help' },
        { pattern: /spirituality|meditation|mindfulness/, title: 'Mindfulness' },
        { pattern: /organization|declutter|clean/, title: 'Organization' },
        { pattern: /decision|choice|advice/, title: 'Decision Making' },
        { pattern: /motivation|inspiration|encouragement/, title: 'Motivation' },
      ];
      
      // Check for topic patterns
      for (const topic of topicPatterns) {
        if (topic.pattern.test(firstMessage)) {
          return topic.title;
        }
      }
      
      // If no specific pattern matches, create a title from the first message
      const words = firstMessage.split(' ').filter(word => word.length > 2);
      if (words.length > 0) {
        // Take first 2-3 meaningful words and capitalize them
        const titleWords = words.slice(0, 3).map(word => 
          word.charAt(0).toUpperCase() + word.slice(1)
        );
        return titleWords.join(' ');
      }
    }
    
    // For conversations with multiple messages, analyze the overall topic
    const allText = userMessages.join(' ').toLowerCase();
    
    // Check for recurring themes
    const themePatterns = [
      { pattern: /goal|objective|target/, title: 'Goal Setting' },
      { pattern: /schedule|plan|organize/, title: 'Planning & Organization' },
      { pattern: /anxiety|stress|worry/, title: 'Stress Management' },
      { pattern: /productivity|efficiency|focus/, title: 'Productivity' },
      { pattern: /habit|routine|consistency/, title: 'Habit Formation' },
      { pattern: /work|career|professional/, title: 'Work & Career' },
      { pattern: /relationship|communication/, title: 'Relationships' },
      { pattern: /health|wellness|fitness/, title: 'Health & Wellness' },
      { pattern: /learning|education|skill/, title: 'Learning' },
      { pattern: /creative|art|project/, title: 'Creative Work' },
      { pattern: /finance|money|budget/, title: 'Financial Planning' },
      { pattern: /travel|adventure/, title: 'Travel' },
      { pattern: /cooking|food|nutrition/, title: 'Food & Cooking' },
      { pattern: /reading|books|literature/, title: 'Reading' },
      { pattern: /technology|digital/, title: 'Technology' },
      { pattern: /mindfulness|meditation/, title: 'Mindfulness' },
      { pattern: /organization|declutter/, title: 'Organization' },
      { pattern: /decision|choice/, title: 'Decision Making' },
      { pattern: /motivation|inspiration/, title: 'Motivation' },
    ];
    
    for (const theme of themePatterns) {
      if (theme.pattern.test(allText)) {
        return theme.title;
      }
    }
    
    // Fallback: use the first few words of the first message
    const firstMessage = userMessages[0];
    const words = firstMessage.split(' ').filter(word => word.length > 2);
    if (words.length > 0) {
      const titleWords = words.slice(0, 2).map(word => 
        word.charAt(0).toUpperCase() + word.slice(1)
      );
      return titleWords.join(' ');
    }
    
    return 'Conversation';
  };

  const handleSend = async () => {
    if (!input.trim() || loading || !currentConversation) return;
    
    const userMessage = input.trim();
    setInput('');
    setLoading(true);
    setError('');

    // Add user message to conversation
    const updatedConversations = conversations.map(c => {
      if (c.id === currentConversationId) {
        const newMessage: Message = {
          id: Date.now(),
          text: userMessage,
          sender: 'user',
        };
        
        const updatedMessages = [...c.messages, newMessage];
        const newTitle = c.title === 'New Conversation' || c.title === 'Conversation' 
          ? generateConversationTitle(updatedMessages)
          : c.title;
        
        return {
          ...c,
          messages: updatedMessages,
          lastMessageAt: new Date(),
          title: newTitle,
        };
      }
      return c;
    });
    
    setConversations(updatedConversations);

    try {
      const token = await AsyncStorage.getItem('authToken');
      const response = await axios.post(
        'http://192.168.1.66:5000/api/ai/chat',
        { message: userMessage },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      // Add AI response to conversation
      const aiMessage: Message = {
        id: Date.now() + 1,
        text: response.data.message,
        sender: 'ai',
      };
      
      setConversations(prev => prev.map(c => {
        if (c.id === currentConversationId) {
          return {
            ...c,
            messages: [...c.messages, aiMessage],
            lastMessageAt: new Date(),
          };
        }
        return c;
      }));
    } catch (err: any) {
      setError('AI failed to respond. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Handle initial message from navigation
  useEffect(() => {
    if (route.params?.initialMessage) {
      const initialMessage = route.params.initialMessage;
      
      // Create a new conversation with the initial message
      const newConversation: Conversation = {
        id: Date.now().toString(),
        title: 'Goal Help',
        messages: [
          { id: 1, text: 'Welcome to Foci! How can I help you today?', sender: 'ai' },
          { id: 2, text: initialMessage, sender: 'user' }
        ],
        isPinned: false,
        createdAt: new Date(),
        lastMessageAt: new Date(),
      };
      
      setConversations([newConversation, ...conversations]);
      setCurrentConversationId(newConversation.id);
      
      // Clear the route params to prevent re-triggering
      navigation.setParams({ initialMessage: undefined });
      
      // Auto-send the message
      setInput(initialMessage);
      // Trigger handleSend after a short delay
      setTimeout(() => {
        handleSend();
      }, 100);
    }
  }, [route.params?.initialMessage]);

  const renderMessage = (msg: Message) => {
    if (msg.sender === 'user') {
      return (
        <View key={msg.id} style={styles.userMsg}>
          <Text style={styles.userMsgText}>{msg.text}</Text>
        </View>
      );
    }
    return (
      <View key={msg.id} style={styles.aiMsg}>
        <Text style={styles.aiMsgText}>{msg.text}</Text>
      </View>
    );
  };

  const renderConversationItem = (conversation: Conversation) => {
    const isActive = conversation.id === currentConversationId;
    const lastMessage = conversation.messages[conversation.messages.length - 1];
    
    return (
      <TouchableOpacity
        key={conversation.id}
        style={[styles.conversationItem, isActive && styles.activeConversationItem]}
        onPress={() => {
          setCurrentConversationId(conversation.id);
          toggleSidebar();
        }}
      >
        <View style={styles.conversationHeader}>
          <View style={styles.conversationTitleRow}>
            <Text style={[styles.conversationTitle, isActive && styles.activeConversationTitle]} numberOfLines={1}>
              {conversation.title}
            </Text>
                                      {conversation.isPinned && <Icon name="pin" size={12} color={colors.primary} style={styles.pinIcon} />}
           </View>
           <View style={styles.conversationActions}>
             <TouchableOpacity
               style={styles.actionButton}
               onPress={() => togglePinConversation(conversation.id)}
             >
               <Icon 
                 name={conversation.isPinned ? "pin-fill" : "pin"} 
                 size={16} 
                 color={colors.text.secondary} 
               />
             </TouchableOpacity>
             <TouchableOpacity
               style={styles.actionButton}
               onPress={() => deleteConversation(conversation.id)}
             >
               <Icon name="trash" size={16} color={colors.text.secondary} />
             </TouchableOpacity>
           </View>
        </View>
        <Text style={styles.conversationPreview} numberOfLines={1}>
          {lastMessage?.text || 'No messages yet'}
        </Text>
        <Text style={styles.conversationDate}>
          {conversation.lastMessageAt.toLocaleDateString()}
        </Text>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
             <View style={styles.header}>
         <TouchableOpacity onPress={toggleSidebar} style={styles.menuButton}>
           <Icon name="three-bars" size={20} color={colors.text.primary} />
         </TouchableOpacity>
         <Text style={styles.headerTitle}>
           {currentConversation?.title || 'Foci AI Chat'}
         </Text>
         <TouchableOpacity onPress={handleSignOut} style={styles.signOutBtn}>
           <Text style={styles.signOutText}>Sign Out</Text>
         </TouchableOpacity>
       </View>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
      >
        <ScrollView 
          style={styles.messagesContainer} 
          contentContainerStyle={{ 
            paddingBottom: Platform.OS === 'android' ? 120 + insets.bottom : 120 
          }}
          keyboardShouldPersistTaps="handled"
        >
          {currentConversation?.messages.map((msg) => renderMessage(msg))}
          {loading && (
            <View style={styles.aiMsg}>
              <ActivityIndicator color={colors.primary} />
            </View>
          )}
          {error ? <Text style={styles.error}>{error}</Text> : null}
        </ScrollView>
        
        <View style={styles.inputRow}>
          <TextInput
            style={styles.input}
            placeholder="Type a message..."
            value={input}
            onChangeText={setInput}
            onSubmitEditing={handleSend}
            returnKeyType="send"
            editable={!loading}
            multiline
          />
          <TouchableOpacity style={styles.sendBtn} onPress={handleSend} disabled={loading}>
            <Text style={styles.sendBtnText}>Send</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>

      {/* Sidebar Overlay */}
      {sidebarVisible && (
        <Animated.View
          style={[
            styles.overlay,
            {
              opacity: overlayAnimation,
            },
          ]}
          onTouchEnd={toggleSidebar}
        />
      )}

      {/* Sidebar */}
      <Animated.View
        style={[
          styles.sidebar,
          {
            transform: [{ translateX: sidebarAnimation }],
          },
        ]}
      >
                 <View style={styles.sidebarHeader}>
           <Text style={styles.sidebarTitle}>Conversations</Text>
           <TouchableOpacity onPress={toggleSidebar} style={styles.closeButton}>
             <Icon name="x" size={18} color={colors.text.secondary} />
           </TouchableOpacity>
         </View>

        <View style={styles.sidebarActions}>
          <TouchableOpacity style={styles.newConversationButton} onPress={startNewConversation}>
            <Text style={styles.newConversationButtonText}>+ New Conversation</Text>
          </TouchableOpacity>
          
          {conversations.some(c => !c.isPinned) && (
            <TouchableOpacity style={styles.clearButton} onPress={clearNonPinnedConversations}>
              <Text style={styles.clearButtonText}>Clear Non-Pinned</Text>
            </TouchableOpacity>
          )}
        </View>

        <ScrollView style={styles.conversationsList}>
          {conversations.map(renderConversationItem)}
        </ScrollView>
      </Animated.View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.light,
  },
  menuButton: {
    padding: spacing.sm,
    borderRadius: borderRadius.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.bold,
    color: colors.text.primary,
    flex: 1,
    textAlign: 'center',
  },
  messagesContainer: {
    flex: 1,
    padding: spacing.md,
  },
  userMsg: {
    alignSelf: 'flex-end',
    backgroundColor: colors.primary,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    marginBottom: spacing.sm,
    maxWidth: '80%',
  },
  userMsgText: {
    color: colors.secondary,
    fontSize: typography.fontSize.base,
  },
  aiMsg: {
    alignSelf: 'flex-start',
    backgroundColor: colors.aiMessage,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    marginBottom: spacing.sm,
    maxWidth: '80%',
  },
  aiMsgText: {
    color: colors.text.primary,
    fontSize: typography.fontSize.base,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.border.light,
    backgroundColor: colors.surface,
  },
  input: {
    flex: 1,
    minHeight: 44,
    maxHeight: 100,
    borderColor: colors.border.light,
    borderWidth: 1,
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    backgroundColor: colors.secondary,
    marginRight: spacing.sm,
    textAlignVertical: 'top',
  },
  sendBtn: {
    backgroundColor: colors.primary,
    borderRadius: borderRadius.md,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
  },
  sendBtnText: {
    color: colors.secondary,
    fontWeight: typography.fontWeight.bold,
    fontSize: typography.fontSize.base,
  },
  error: {
    color: colors.error,
    marginTop: spacing.sm,
  },
  signOutBtn: {
    padding: spacing.sm,
    borderRadius: borderRadius.sm,
    backgroundColor: colors.surface,
  },
  signOutText: {
    color: colors.error,
    fontWeight: typography.fontWeight.bold as any,
  },
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'black',
    zIndex: 1000,
  },
  sidebar: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: '80%',
    height: '100%',
    backgroundColor: colors.surface,
    borderRightWidth: 1,
    borderRightColor: colors.border.light,
    zIndex: 1001,
  },
  sidebarHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.light,
    paddingTop: 60, // Account for status bar
  },
  sidebarTitle: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.bold,
    color: colors.text.primary,
  },
  closeButton: {
    padding: spacing.sm,
    borderRadius: borderRadius.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sidebarActions: {
    padding: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.light,
  },
  newConversationButton: {
    backgroundColor: colors.primary,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  newConversationButtonText: {
    color: colors.secondary,
    fontWeight: typography.fontWeight.bold,
    fontSize: typography.fontSize.base,
  },
  clearButton: {
    backgroundColor: colors.error,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    alignItems: 'center',
  },
  clearButtonText: {
    color: colors.secondary,
    fontWeight: typography.fontWeight.bold,
    fontSize: typography.fontSize.base,
  },
  conversationsList: {
    flex: 1,
  },
  conversationItem: {
    padding: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.light,
  },
  activeConversationItem: {
    backgroundColor: colors.primary + '20',
  },
  conversationHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.xs,
  },
  conversationTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  conversationTitle: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.bold,
    color: colors.text.primary,
    flex: 1,
  },
  activeConversationTitle: {
    color: colors.primary,
  },
  pinIcon: {
    marginLeft: spacing.xs,
  },
  conversationActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  actionButton: {
    padding: spacing.xs,
    marginLeft: spacing.xs,
    minWidth: 24,
    minHeight: 24,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: borderRadius.sm,
  },
  conversationPreview: {
    fontSize: typography.fontSize.sm,
    color: colors.text.secondary,
    marginBottom: spacing.xs,
  },
  conversationDate: {
    fontSize: typography.fontSize.xs,
    color: colors.text.secondary,
  },
});