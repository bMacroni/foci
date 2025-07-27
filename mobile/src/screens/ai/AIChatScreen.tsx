import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, ActivityIndicator, Platform } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { KeyboardAvoidingView } from 'react-native';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { colors } from '../../themes/colors';
import { typography } from '../../themes/typography';
import { spacing, borderRadius } from '../../themes/spacing';

export default function AIChatScreen({ navigation }: any) {
  const insets = useSafeAreaInsets();
  const [messages, setMessages] = useState([
    { id: 1, text: 'Welcome to Foci! How can I help you today?', sender: 'ai' },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSignOut = async () => {
    await AsyncStorage.removeItem('authToken');
    navigation.replace('Login');
  };

  const handleSend = async () => {
    if (!input.trim() || loading) return;
    setMessages([...messages, { id: Date.now(), text: input, sender: 'user' }]);
    const userMessage = input;
    setInput('');
    setLoading(true);
    setError('');

    try {
      const token = await AsyncStorage.getItem('authToken');
      const response = await axios.post(
        'http://192.168.1.66:5000/api/ai/chat',
        { message: userMessage },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setMessages((prev) => [
        ...prev,
        { id: Date.now() + 1, text: response.data.message, sender: 'ai' },
      ]);
    } catch (err: any) {
      setError('AI failed to respond. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const renderMessage = (msg: any) => {
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

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Foci AI Chat</Text>
        <TouchableOpacity onPress={handleSignOut} style={styles.signOutBtn}>
          <Text style={styles.signOutText}>Sign Out</Text>
        </TouchableOpacity>
      </View>
             <ScrollView 
         style={styles.messagesContainer} 
         contentContainerStyle={{ 
           paddingBottom: Platform.OS === 'android' ? 120 + insets.bottom : 120 
         }}
       >
        {messages.map((msg) => renderMessage(msg))}
        {loading && (
          <View style={styles.aiMsg}>
            <ActivityIndicator color={colors.primary} />
          </View>
        )}
        {error ? <Text style={styles.error}>{error}</Text> : null}
      </ScrollView>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 30}
      >
        <View style={styles.inputRow}>
          <TextInput
            style={styles.input}
            placeholder="Type a message..."
            value={input}
            onChangeText={setInput}
            onSubmitEditing={handleSend}
            returnKeyType="send"
            editable={!loading}
          />
          <TouchableOpacity style={styles.sendBtn} onPress={handleSend} disabled={loading}>
            <Text style={styles.sendBtnText}>Send</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
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
  headerTitle: {
    fontSize: typography.fontSize.xl,
    fontWeight: typography.fontWeight.bold,
    color: colors.text.primary,
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
    height: 44,
    borderColor: colors.border.light,
    borderWidth: 1,
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.md,
    backgroundColor: colors.secondary,
    marginRight: spacing.sm,
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
});