import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  Alert,
  Modal,
  ScrollView,
} from 'react-native';
// import { KeyboardAwareFlatList } from 'react-native-keyboard-aware-scroll-view';
import { Ionicons } from '@expo/vector-icons';
import { aiAPI, conversationsAPI, goalsAPI, tasksAPI } from '../services/api';
import { theme } from '../utils/theme';
import { ConversationThread, ConversationMessage, Goal, Task } from '../types';
// import Toast from 'react-native-toast-message';

interface Message {
  id: string;
  content: string;
  role: 'user' | 'assistant';
  timestamp: Date;
}

const AIAssistantScreen: React.FC = () => {
  const [threads, setThreads] = useState<ConversationThread[]>([]);
  const [selectedThread, setSelectedThread] = useState<ConversationThread | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showThreadsModal, setShowThreadsModal] = useState(false);
  const flatListRef = useRef<FlatList>(null);
  const [pinnedThreadIds, setPinnedThreadIds] = useState<Set<string>>(new Set());
  const [searchQuery, setSearchQuery] = useState('');
  const [userGoals, setUserGoals] = useState<Goal[]>([]);
  const [userTasks, setUserTasks] = useState<Task[]>([]);

  // Fetch threads on mount
  useEffect(() => {
    fetchThreads();
  }, []);

  const fetchThreads = async () => {
    try {
      const data = await conversationsAPI.getThreads();
      setThreads(data);
    } catch (err) {
      // Toast.show({ type: 'error', text1: 'Error', text2: 'Failed to load conversations' });
    }
  };

  // Fetch user goals and tasks for onboarding
  const fetchUserData = async () => {
    try {
      const [goals, tasks] = await Promise.all([
        goalsAPI.getAll(),
        tasksAPI.getAll(),
      ]);
      setUserGoals(goals);
      setUserTasks(tasks);
    } catch (err) {
      // Ignore errors for onboarding
    }
  };

  // Show onboarding message if thread is empty
  useEffect(() => {
    if (selectedThread) {
      fetchThreadMessages(selectedThread.id);
      fetchUserData();
    } else {
      setMessages([]);
    }
  }, [selectedThread]);

  // When thread messages are loaded, show onboarding if empty
  useEffect(() => {
    if (selectedThread && messages.length === 0) {
      // Context-aware welcome message
      let welcomeMessage = '';
      const hasGoals = userGoals.length > 0;
      const hasTasks = userTasks.length > 0;
      if (!hasGoals && !hasTasks) {
        welcomeMessage = `🎯 Welcome to Foci! I'm your AI-powered productivity assistant, and I'm here to help you build a focused, organized life.\n\nLet's get started! I can help you:\n• Set meaningful goals\n• Organize tasks\n• Manage your calendar\n• Stay focused\n\n**You can ask me things like:**\n- Help me break down my goal: Run a marathon\n- Suggest a task for today\n- How do I get started on my project?\n\nWhat would you like to work on today?`;
      } else if (hasGoals && !hasTasks) {
        welcomeMessage = `🎯 Welcome back! I see you have ${userGoals.length} goal${userGoals.length !== 1 ? 's' : ''} set up.\n\nLet's make progress! I can help you:\n• Break down your goals into actionable tasks\n• Create tasks to move toward your objectives\n• Review and refine your existing goals\n• Plan your week around your priorities\n\n**Try asking:**\n- Help me break down my goal: [your goal]\n- Suggest a task for today\n\nWhat would you like to focus on today?`;
      } else if (hasGoals && hasTasks) {
        const completedTasks = userTasks.filter((t: any) => t.status === 'completed').length;
        welcomeMessage = `🎯 Welcome back! Great progress - you have ${userGoals.length} goal${userGoals.length !== 1 ? 's' : ''} and ${userTasks.length} task${userTasks.length !== 1 ? 's' : ''} (${completedTasks} completed).\n\nLet's keep the momentum going! I can help you:\n• Review your progress and celebrate wins\n• Create new tasks for your goals\n• Prioritize what's next for today\n• Adjust your goals if needed\n\n**Try asking:**\n- Help me break down my goal: [your goal]\n- Suggest a task for today\n\nWhat's your focus for today?`;
      } else {
        welcomeMessage = `📝 Welcome back! I see you have ${userTasks.length} task${userTasks.length !== 1 ? 's' : ''} to work on.\n\nLet's get organized! I can help you:\n• Create goals to give your tasks direction\n• Prioritize your tasks for today\n• Review and organize your task list\n• Plan your week effectively\n\n**Try asking:**\n- Help me break down my goal: [your goal]\n- Suggest a task for today\n\nWhat would you like to work on?`;
      }
      setMessages([
        {
          id: 'welcome',
          content: welcomeMessage,
          role: 'assistant',
          timestamp: new Date(),
        },
      ]);
    }
  }, [selectedThread, messages.length, userGoals, userTasks]);

  const fetchThreadMessages = async (threadId: string) => {
    try {
      const thread = await conversationsAPI.getThread(threadId);
      setMessages(
        (thread.messages || []).map((msg: ConversationMessage) => ({
          id: msg.id,
          content: msg.content,
          role: msg.role,
          timestamp: new Date(msg.created_at),
        }))
      );
    } catch (err) {
      // Toast.show({ type: 'error', text1: 'Error', text2: 'Failed to load messages' });
    }
  };

  const handleSelectThread = (thread: ConversationThread) => {
    setSelectedThread(thread);
    setShowThreadsModal(false);
  };

  const handleCreateThread = async () => {
    try {
      const newThread = await conversationsAPI.createThread('New Conversation');
      setThreads([newThread, ...threads]);
      setSelectedThread(newThread);
      setShowThreadsModal(false);
    } catch (err) {
      // Toast.show({ type: 'error', text1: 'Error', text2: 'Failed to create conversation' });
    }
  };

  const handleDeleteThread = async (threadId: string) => {
    Alert.alert('Delete Conversation', 'Are you sure you want to delete this conversation?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete', style: 'destructive', onPress: async () => {
          try {
            await conversationsAPI.deleteThread(threadId);
            setThreads(threads.filter(t => t.id !== threadId));
            if (selectedThread?.id === threadId) {
              setSelectedThread(null);
              setMessages([]);
            }
          } catch (err) {
            // Toast.show({ type: 'error', text1: 'Error', text2: 'Failed to delete conversation' });
          }
        }
      }
    ]);
  };

  // Enhance sendMessage to detect goal breakdown or task suggestion requests
  const sendMessage = async () => {
    if (!inputText.trim() || !selectedThread) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      content: inputText.trim(),
      role: 'user',
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInputText('');
    setIsLoading(true);

    try {
      // Add message to thread
      await conversationsAPI.addMessage(selectedThread.id, userMessage.content, 'user');

      // Detect intent for goal breakdown or task suggestion
      const lower = userMessage.content.toLowerCase();
      let aiResponse: string | null = null;
      if (/break\s*down.*goal|goal.*break\s*down|decompose.*goal|help.*goal/i.test(lower)) {
        // Try to extract goal title
        const match = userMessage.content.match(/goal[:\-]?\s*(.*)/i);
        const goalTitle = match && match[1] ? match[1] : '';
        const suggestions = await aiAPI.getGoalSuggestions(goalTitle);
        aiResponse = `Here’s an AI-powered breakdown for your goal${goalTitle ? `: "${goalTitle}"` : ''}:
` + suggestions.join('\n- ');
      } else if (/suggest.*task|recommend.*task|what.*task.*do|task.*for.*today/i.test(lower)) {
        const task = await aiAPI.recommendTask(userMessage.content);
        aiResponse = `Here’s a suggested task for you:
- **${task.title}**\n${task.description ? task.description : ''}`;
      }

      if (aiResponse) {
        const assistantMessage: Message = {
          id: (Date.now() + 1).toString(),
          content: aiResponse,
          role: 'assistant',
          timestamp: new Date(),
        };
        setMessages(prev => [...prev, assistantMessage]);
        await conversationsAPI.addMessage(selectedThread.id, assistantMessage.content, 'assistant');
      } else {
        // Default: send to AI as usual
        const response = await aiAPI.sendMessage(userMessage.content, selectedThread.id);
        const assistantMessage: Message = {
          id: (Date.now() + 1).toString(),
          content: response.response,
          role: 'assistant',
          timestamp: new Date(),
        };
        setMessages(prev => [...prev, assistantMessage]);
        await conversationsAPI.addMessage(selectedThread.id, assistantMessage.content, 'assistant');
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      // Toast.show({ type: 'error', text1: 'Error', text2: `Failed to send message: ${errorMessage}` });
    } finally {
      setIsLoading(false);
    }
  };

  const renderMessage = ({ item }: { item: Message }) => (
    <View style={[
      styles.messageContainer,
      item.role === 'user' ? styles.userMessage : styles.assistantMessage
    ]}>
      <View style={[
        styles.messageBubble,
        item.role === 'user' ? styles.userBubble : styles.assistantBubble
      ]}>
        <Text style={[
          styles.messageText,
          item.role === 'user' ? styles.userText : styles.assistantText
        ]}>
          {item.content}
        </Text>
        <Text style={styles.timestamp}>
          {item.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </Text>
      </View>
    </View>
  );

  // Pin/unpin thread
  const togglePinThread = (threadId: string) => {
    setPinnedThreadIds(prev => {
      const newSet = new Set(prev);
      if (newSet.has(threadId)) {
        newSet.delete(threadId);
      } else {
        newSet.add(threadId);
      }
      return newSet;
    });
  };

  // Filter and sort threads
  const filteredThreads = threads.filter(thread => {
    if (!searchQuery) return true;
    const title = thread.title || '';
    return title.toLowerCase().includes(searchQuery.toLowerCase());
  });
  const sortedThreads = [
    ...filteredThreads.filter(t => pinnedThreadIds.has(t.id)),
    ...filteredThreads.filter(t => !pinnedThreadIds.has(t.id)),
  ];

  // Thread list modal
  const renderThreadsModal = () => (
    <Modal
      visible={showThreadsModal}
      animationType="slide"
      onRequestClose={() => setShowThreadsModal(false)}
      transparent={true}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Conversations</Text>
            <TouchableOpacity onPress={() => setShowThreadsModal(false)}>
              <Ionicons name="close" size={24} color={theme.colors.text} />
            </TouchableOpacity>
          </View>
          <TextInput
            style={styles.searchInput}
            placeholder="Search conversations..."
            placeholderTextColor={theme.colors.textSecondary}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          <TouchableOpacity style={styles.newThreadButton} onPress={handleCreateThread}>
            <Ionicons name="add" size={20} color={theme.colors.background} />
            <Text style={styles.newThreadButtonText}>New Conversation</Text>
          </TouchableOpacity>
          <FlatList
            data={sortedThreads}
            keyExtractor={item => item.id}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={[styles.threadItem, selectedThread?.id === item.id && styles.selectedThreadItem]}
                onPress={() => handleSelectThread(item)}
                onLongPress={() => handleDeleteThread(item.id)}
              >
                <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                  <View>
                    <Text style={styles.threadTitle}>{item.title || 'Untitled'}</Text>
                    <Text style={styles.threadDate}>{new Date(item.created_at).toLocaleDateString()}</Text>
                  </View>
                  <TouchableOpacity
                    onPress={() => togglePinThread(item.id)}
                    style={{ marginLeft: 8 }}
                  >
                    <Ionicons
                      name={pinnedThreadIds.has(item.id) ? 'star' : 'star-outline'}
                      size={20}
                      color={pinnedThreadIds.has(item.id) ? theme.colors.primary : theme.colors.textSecondary}
                    />
                  </TouchableOpacity>
                </View>
              </TouchableOpacity>
            )}
            ListEmptyComponent={<Text style={styles.emptyThreadsText}>No conversations yet.</Text>}
          />
        </View>
      </View>
    </Modal>
  );

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 64 : 0}
    >
      <View style={styles.header}>
        <TouchableOpacity onPress={() => setShowThreadsModal(true)}>
          <Ionicons name="chatbubble-ellipses-outline" size={28} color={theme.colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>AI Assistant</Text>
        <TouchableOpacity style={styles.settingsButton}>
          <Ionicons name="settings-outline" size={24} color={theme.colors.text} />
        </TouchableOpacity>
      </View>
      {renderThreadsModal()}
      {selectedThread ? (
        // <KeyboardAwareFlatList
        //   data={messages}
        //   renderItem={renderMessage}
        //   keyExtractor={(item: Message) => item.id}
        //   contentContainerStyle={styles.messagesContainer}
        //   showsVerticalScrollIndicator={false}
        //   extraScrollHeight={16}
        //   keyboardShouldPersistTaps="handled"
        //   style={{ flex: 1 }}
        // />
        <ScrollView
          contentContainerStyle={styles.messagesContainer}
          showsVerticalScrollIndicator={false}
          extraScrollHeight={16}
          keyboardShouldPersistTaps="handled"
          style={{ flex: 1 }}
        >
          {messages.map((item, index) => (
            <View key={item.id} style={[
              styles.messageContainer,
              item.role === 'user' ? styles.userMessage : styles.assistantMessage
            ]}>
              <View style={[
                styles.messageBubble,
                item.role === 'user' ? styles.userBubble : styles.assistantBubble
              ]}>
                <Text style={[
                  styles.messageText,
                  item.role === 'user' ? styles.userText : styles.assistantText
                ]}>
                  {item.content}
                </Text>
                <Text style={styles.timestamp}>
                  {item.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </Text>
              </View>
            </View>
          ))}
        </ScrollView>
      ) : (
        <View style={styles.noThreadContainer}>
          <Text style={styles.noThreadText}>Select or create a conversation to begin.</Text>
        </View>
      )}
      <View style={styles.inputContainer}>
        <TextInput
          style={styles.textInput}
          value={inputText}
          onChangeText={setInputText}
          placeholder={selectedThread ? 'Type your message...' : 'Select a conversation to start chatting'}
          placeholderTextColor={theme.colors.textSecondary}
          multiline
          maxLength={500}
          editable={!!selectedThread}
          returnKeyType="send"
        />
        <TouchableOpacity
          style={[styles.sendButton, (!inputText.trim() || isLoading || !selectedThread) && styles.sendButtonDisabled]}
          onPress={sendMessage}
          disabled={!inputText.trim() || isLoading || !selectedThread}
        >
          {isLoading ? (
            <Ionicons name="hourglass-outline" size={20} color={theme.colors.background} />
          ) : (
            <Ionicons name="send" size={20} color={theme.colors.background} />
          )}
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: theme.spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: theme.colors.text,
  },
  settingsButton: {
    padding: theme.spacing.xs,
  },
  messagesContainer: {
    padding: theme.spacing.lg,
    flexGrow: 1,
  },
  messageContainer: {
    marginBottom: theme.spacing.md,
  },
  userMessage: {
    alignItems: 'flex-end',
  },
  assistantMessage: {
    alignItems: 'flex-start',
  },
  messageBubble: {
    maxWidth: '80%',
    padding: theme.spacing.md,
    borderRadius: theme.borderRadius.lg,
  },
  userBubble: {
    backgroundColor: theme.colors.primary,
  },
  assistantBubble: {
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  messageText: {
    fontSize: 16,
    lineHeight: 22,
  },
  userText: {
    color: theme.colors.background,
  },
  assistantText: {
    color: theme.colors.text,
  },
  timestamp: {
    fontSize: 12,
    color: theme.colors.textSecondary,
    marginTop: theme.spacing.xs,
    alignSelf: 'flex-end',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    padding: theme.spacing.lg,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
    backgroundColor: theme.colors.background,
  },
  textInput: {
    flex: 1,
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.md,
    marginRight: theme.spacing.sm,
    fontSize: 16,
    color: theme.colors.text,
    maxHeight: 100,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  sendButton: {
    backgroundColor: theme.colors.primary,
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.md,
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendButtonDisabled: {
    opacity: 0.5,
  },
  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    width: '90%',
    maxHeight: '80%',
    backgroundColor: theme.colors.background,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.lg,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 5,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.md,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: theme.colors.text,
  },
  newThreadButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.primary,
    borderRadius: theme.borderRadius.md,
    paddingVertical: theme.spacing.sm,
    paddingHorizontal: theme.spacing.md,
    marginBottom: theme.spacing.md,
    alignSelf: 'flex-start',
  },
  newThreadButtonText: {
    color: theme.colors.background,
    fontWeight: '600',
    marginLeft: theme.spacing.xs,
  },
  threadItem: {
    paddingVertical: theme.spacing.md,
    paddingHorizontal: theme.spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  selectedThreadItem: {
    backgroundColor: theme.colors.surface,
  },
  threadTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: theme.colors.text,
  },
  threadDate: {
    fontSize: 12,
    color: theme.colors.textSecondary,
  },
  emptyThreadsText: {
    textAlign: 'center',
    color: theme.colors.textSecondary,
    marginTop: theme.spacing.lg,
  },
  noThreadContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  noThreadText: {
    color: theme.colors.textSecondary,
    fontSize: 16,
  },
  searchInput: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.md,
    fontSize: 16,
    color: theme.colors.text,
    borderWidth: 1,
    borderColor: theme.colors.border,
    marginBottom: theme.spacing.md,
  },
});

export default AIAssistantScreen; 