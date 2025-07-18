/**
 * Sample React Native App
 * https://github.com/facebook/react-native
 *
 * @format
 */

import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { StatusBar, useColorScheme } from 'react-native';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { KeyboardAvoidingView, Platform } from 'react-native';

const Stack = createNativeStackNavigator();

// Placeholder screens
function LoginScreen({ navigation }: any) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    setError('');
    setLoading(true);
    try {
      const response = await axios.post('http://192.168.1.66:5000/api/auth/login', {
        email,
        password,
      });
      const { token, user } = response.data;
      await AsyncStorage.setItem('authToken', token);
      setLoading(false);
      navigation.replace('Home');
    } catch (err: any) {
      setLoading(false);
      if (err.response && err.response.data && err.response.data.error) {
        setError(err.response.data.error);
      } else {
        setError('Login failed. Please try again.');
      }
    }
  };

  return (
    <View style={loginStyles.container}>
      {/* Logo placeholder */}
      <View style={loginStyles.logoContainer}>
        <Text style={loginStyles.logoIcon}>📖</Text>
      </View>
      <Text style={loginStyles.title}>Welcome Back</Text>
      <Text style={loginStyles.subtitle}>Sign in to your Foci account</Text>
      <View style={loginStyles.tabContainer}>
        <View style={loginStyles.activeTab}><Text style={loginStyles.activeTabText}>Email & Password</Text></View>
        <View style={loginStyles.inactiveTab}><Text style={loginStyles.inactiveTabText}>JWT Token</Text></View>
      </View>
      <TextInput
        style={loginStyles.input}
        placeholder="Email"
        autoCapitalize="none"
        keyboardType="email-address"
        value={email}
        onChangeText={setEmail}
      />
      <TextInput
        style={loginStyles.input}
        placeholder="Password"
        secureTextEntry
        value={password}
        onChangeText={setPassword}
      />
      {error ? <Text style={loginStyles.error}>{error}</Text> : null}
      <TouchableOpacity style={loginStyles.button} onPress={handleLogin} disabled={loading}>
        {loading ? <ActivityIndicator color="#fff" /> : <Text style={loginStyles.buttonText}>Sign In</Text>}
      </TouchableOpacity>
      <TouchableOpacity onPress={() => navigation.navigate('Signup')}>
        <Text style={loginStyles.signupText}>Don't have an account? <Text style={loginStyles.signupLink}>Sign up</Text></Text>
      </TouchableOpacity>
    </View>
  );
}

function SignupScreen({ navigation }: any) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSignup = async () => {
    setError('');
    setLoading(true);
    try {
      const response = await axios.post('http://192.168.1.66:5000/api/auth/signup', {
        email,
        password,
      });
      // If auto-login is successful, token will be present
      if (response.data.token) {
        await AsyncStorage.setItem('authToken', response.data.token);
        setLoading(false);
        navigation.replace('Home');
      } else {
        setLoading(false);
        // If user needs to confirm email, show message
        if (response.data.error) {
          setError(response.data.error);
        } else if (response.data.message) {
          setError(response.data.message);
        } else {
          setError('Signup successful. Please check your email to confirm your account.');
        }
      }
    } catch (err: any) {
      setLoading(false);
      if (err.response && err.response.data && err.response.data.error) {
        setError(err.response.data.error);
      } else {
        setError('Signup failed. Please try again.');
      }
    }
  };

  return (
    <View style={signupStyles.container}>
      {/* Logo placeholder */}
      <View style={signupStyles.logoContainer}>
        <Text style={signupStyles.logoIcon}>📖</Text>
      </View>
      <Text style={signupStyles.title}>Create Account</Text>
      <Text style={signupStyles.subtitle}>Sign up for a Foci account</Text>
      <View style={signupStyles.tabContainer}>
        <View style={signupStyles.activeTab}><Text style={signupStyles.activeTabText}>Email & Password</Text></View>
        <View style={signupStyles.inactiveTab}><Text style={signupStyles.inactiveTabText}>JWT Token</Text></View>
      </View>
      <TextInput
        style={signupStyles.input}
        placeholder="Email"
        autoCapitalize="none"
        keyboardType="email-address"
        value={email}
        onChangeText={setEmail}
      />
      <TextInput
        style={signupStyles.input}
        placeholder="Password"
        secureTextEntry
        value={password}
        onChangeText={setPassword}
      />
      {error ? <Text style={signupStyles.error}>{error}</Text> : null}
      <TouchableOpacity style={signupStyles.button} onPress={handleSignup} disabled={loading}>
        {loading ? <ActivityIndicator color="#fff" /> : <Text style={signupStyles.buttonText}>Sign Up</Text>}
      </TouchableOpacity>
      <TouchableOpacity onPress={() => navigation.navigate('Login')}>
        <Text style={signupStyles.signupText}>Already have an account? <Text style={signupStyles.signupLink}>Sign in</Text></Text>
      </TouchableOpacity>
    </View>
  );
}

function GoalApprovalComponent({ data }: { data: any }) {
  if (!data.goal || !Array.isArray(data.milestones)) return null;
  return (
    <View style={{ backgroundColor: '#fff', borderRadius: 10, padding: 12, marginVertical: 8, borderWidth: 1, borderColor: '#eee' }}>
      <Text style={{ fontWeight: 'bold', fontSize: 16, marginBottom: 6 }}>Goal:</Text>
      <Text style={{ marginBottom: 10 }}>{data.goal}</Text>
      <Text style={{ fontWeight: 'bold', fontSize: 15, marginBottom: 4 }}>Milestones & Steps:</Text>
      {data.milestones.map((ms: any, idx: number) => (
        <View key={idx} style={{ marginBottom: 8 }}>
          <Text style={{ fontWeight: 'bold', color: '#222' }}>{idx + 1}. {ms.title}</Text>
          {Array.isArray(ms.steps) && ms.steps.length > 0 && (
            <View style={{ marginLeft: 12, marginTop: 2 }}>
              {ms.steps.map((step: string, sidx: number) => (
                <Text key={sidx} style={{ color: '#444' }}>- {step}</Text>
              ))}
            </View>
          )}
        </View>
      ))}
      <Text style={{ marginTop: 10, fontStyle: 'italic', color: '#666' }}>
        Approve or edit this plan in the chat below.
      </Text>
    </View>
  );
}

function HomeScreen({ navigation }: any) {
  const [messages, setMessages] = useState([
    { id: 1, text: 'Welcome to Foci! How can I help you today?', sender: 'ai' },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  // For future: const [threadId, setThreadId] = useState<string | null>(null);
  const [goalCreation, setGoalCreation] = useState<null | {
    title: string;
    milestones: { title: string; steps: string[] }[];
    awaitingApproval: boolean;
  }>(null);

  const handleSend = async () => {
    if (!input.trim() || loading) return;
    setMessages([...messages, { id: Date.now(), text: input, sender: 'user' }]);
    const userMessage = input;
    setInput('');
    setLoading(true);
    setError('');

    // Detect if this is a new goal (simple keyword check for demo)
    if (/goal|want to|plan to|my goal is|i will|i want/i.test(userMessage) && !goalCreation) {
      // Prompt AI for suggestions
      try {
        const token = await AsyncStorage.getItem('authToken');
        const response = await axios.post(
          'http://192.168.1.66:5000/api/ai/goal-suggestions',
          { goalTitle: userMessage },
          { headers: { Authorization: `Bearer ${token}` } }
        );
        // Assume response.suggestions is a string with milestones/steps
        setGoalCreation({
          title: userMessage,
          milestones: [], // Could parse from response if structured
          awaitingApproval: true,
        });
        setMessages((prev) => [
          ...prev,
          { id: Date.now() + 1, text: `Here are suggested milestones and steps for your goal:\n${response.data.suggestions}\nWould you like to use these? (yes/no or edit)`, sender: 'ai' },
        ]);
      } catch (err: any) {
        setError('AI failed to suggest milestones. Please try again.');
      } finally {
        setLoading(false);
      }
      return;
    }

    // If awaiting approval for milestones/steps
    if (goalCreation && goalCreation.awaitingApproval) {
      if (/yes|approve|ok|looks good|accept/i.test(userMessage)) {
        // Finalize goal creation (call backend to create goal)
        setMessages((prev) => [
          ...prev,
          { id: Date.now() + 2, text: 'Great! Your goal and milestones will be created.', sender: 'ai' },
        ]);
        // TODO: Call backend to create goal/milestones/steps here
        setGoalCreation(null);
        setLoading(false);
        return;
      } else if (/no|edit|change|reject/i.test(userMessage)) {
        setMessages((prev) => [
          ...prev,
          { id: Date.now() + 3, text: 'Please provide your preferred milestones and steps, or edit the suggestions.', sender: 'ai' },
        ]);
        setLoading(false);
        return;
      } else {
        // Assume user is editing the suggestions
        setMessages((prev) => [
          ...prev,
          { id: Date.now() + 4, text: 'Thank you! Your custom milestones and steps will be used.', sender: 'ai' },
        ]);
        // TODO: Parse user input and update milestones/steps, then create goal
        setGoalCreation(null);
        setLoading(false);
        return;
      }
    }

    // Default: normal AI chat
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

  const handleSignOut = async () => {
    await AsyncStorage.removeItem('authToken');
    navigation.replace('Login');
  };

  function formatDate(dateString: string) {
    if (!dateString) return '';
    const date = new Date(dateString);
    const day = date.getDate();
    const daySuffix = (d: number) => {
      if (d > 3 && d < 21) return 'th';
      switch (d % 10) {
        case 1: return 'st';
        case 2: return 'nd';
        case 3: return 'rd';
        default: return 'th';
      }
    };
    const month = date.toLocaleString('default', { month: 'long' });
    const year = date.getFullYear();
    return `${month} ${day}${daySuffix(day)}, ${year}`;
  }

  function renderMessage(msg: any) {
    // User message: white text
    if (msg.sender === 'user') {
      return (
        <View key={msg.id} style={homeStyles.userMsg}>
          <Text style={[homeStyles.msgText, { color: '#fff' }]}>{msg.text}</Text>
        </View>
      );
    }
    // AI message: check for task, goal, or plan JSON
    if (msg.sender === 'ai' && msg.text && msg.text.includes('```json')) {
      const match = msg.text.match(/```json\s*([\s\S]*?)```/);
      if (match) {
        try {
          const json = JSON.parse(match[1]);
          // Task list
          if (json.action_type === 'read' && json.entity_type === 'task' && json.details && Array.isArray(json.details.tasks)) {
            return (
              <View key={msg.id} style={homeStyles.aiMsg}>
                <Text style={homeStyles.msgText}>Here are your tasks:</Text>
                {json.details.tasks.length === 0 ? (
                  <Text style={homeStyles.msgText}>No tasks found.</Text>
                ) : (
                  <View style={{ marginTop: 8 }}>
                    {json.details.tasks.map((task: any, idx: number) => (
                      <View key={task.id || idx} style={{ marginBottom: 8, padding: 8, backgroundColor: '#fff', borderRadius: 8, borderWidth: 1, borderColor: '#eee' }}>
                        <Text style={{ fontWeight: 'bold', color: '#111' }}>{task.title || 'Untitled Task'}</Text>
                        {task.status && <Text style={{ color: '#444' }}>Status: {task.status.replace('_', ' ')}</Text>}
                        {task.due_date && <Text style={{ color: '#444' }}>Due: {formatDate(task.due_date)}</Text>}
                      </View>
                    ))}
                  </View>
                )}
              </View>
            );
          }
          // Goal list
          if (json.action_type === 'read' && json.entity_type === 'goal' && json.details && Array.isArray(json.details.goals)) {
            return (
              <View key={msg.id} style={homeStyles.aiMsg}>
                <Text style={homeStyles.msgText}>Here are your goals:</Text>
                {json.details.goals.length === 0 ? (
                  <Text style={homeStyles.msgText}>No goals found.</Text>
                ) : (
                  <View style={{ marginTop: 8 }}>
                    {json.details.goals.map((goal: string, idx: number) => (
                      <View key={idx} style={{ marginBottom: 8, padding: 8, backgroundColor: '#fff', borderRadius: 8, borderWidth: 1, borderColor: '#eee' }}>
                        <Text style={{ fontWeight: 'bold', color: '#111' }}>{goal}</Text>
                      </View>
                    ))}
                  </View>
                )}
              </View>
            );
          }
          // Goal plan approval (goal, milestones, steps)
          if (json.goal && Array.isArray(json.milestones)) {
            return (
              <View key={msg.id} style={homeStyles.aiMsg}>
                <GoalApprovalComponent data={json} />
              </View>
            );
          }
        } catch (e) {
          // Fall through to default rendering
        }
      }
    }
    // Default AI message
    return (
      <View key={msg.id} style={homeStyles.aiMsg}>
        <Text style={homeStyles.msgText}>{msg.text}</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={homeStyles.container} edges={['bottom', 'left', 'right', 'top']}>
      <View style={homeStyles.header}>
        <Text style={homeStyles.headerTitle}>Foci AI Chat</Text>
        <TouchableOpacity onPress={handleSignOut} style={homeStyles.signOutBtn}>
          <Text style={homeStyles.signOutText}>Sign Out</Text>
        </TouchableOpacity>
      </View>
      <ScrollView style={homeStyles.messagesContainer} contentContainerStyle={{ paddingBottom: 80 }}>
        {messages.map((msg) => renderMessage(msg))}
        {loading && (
          <View style={homeStyles.aiMsg}>
            <ActivityIndicator color="#000" />
          </View>
        )}
        {error ? <Text style={{ color: '#d00', marginTop: 8 }}>{error}</Text> : null}
      </ScrollView>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 30}
      >
        <View style={homeStyles.inputRow}>
          <TextInput
            style={homeStyles.input}
            placeholder="Type a message..."
            value={input}
            onChangeText={setInput}
            onSubmitEditing={handleSend}
            returnKeyType="send"
            editable={!loading}
          />
          <TouchableOpacity style={homeStyles.sendBtn} onPress={handleSend} disabled={loading}>
            <Text style={homeStyles.sendBtnText}>Send</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const loginStyles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#fff', padding: 24 },
  logoContainer: { marginBottom: 24, backgroundColor: '#000', borderRadius: 16, padding: 16 },
  logoIcon: { fontSize: 32, color: '#fff' },
  title: { fontSize: 28, fontWeight: 'bold', marginBottom: 4, color: '#111' },
  subtitle: { fontSize: 16, color: '#444', marginBottom: 24 },
  tabContainer: { flexDirection: 'row', marginBottom: 16 },
  activeTab: { backgroundColor: '#000', borderRadius: 8, paddingVertical: 6, paddingHorizontal: 16, marginRight: 8 },
  activeTabText: { color: '#fff', fontWeight: 'bold' },
  inactiveTab: { backgroundColor: '#eee', borderRadius: 8, paddingVertical: 6, paddingHorizontal: 16 },
  inactiveTabText: { color: '#888', fontWeight: 'bold' },
  input: { width: '100%', maxWidth: 320, height: 48, borderColor: '#ddd', borderWidth: 1, borderRadius: 8, paddingHorizontal: 16, marginBottom: 16, backgroundColor: '#f9f9f9' },
  button: { width: '100%', maxWidth: 320, height: 48, backgroundColor: '#000', borderRadius: 8, justifyContent: 'center', alignItems: 'center', marginTop: 8, marginBottom: 16 },
  buttonText: { color: '#fff', fontSize: 18, fontWeight: 'bold' },
  signupText: { color: '#444', marginTop: 8 },
  signupLink: { color: '#007AFF', fontWeight: 'bold' },
  error: { color: '#d00', marginBottom: 8 },
});

const signupStyles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#fff', padding: 24 },
  logoContainer: { marginBottom: 24, backgroundColor: '#000', borderRadius: 16, padding: 16 },
  logoIcon: { fontSize: 32, color: '#fff' },
  title: { fontSize: 28, fontWeight: 'bold', marginBottom: 4, color: '#111' },
  subtitle: { fontSize: 16, color: '#444', marginBottom: 24 },
  tabContainer: { flexDirection: 'row', marginBottom: 16 },
  activeTab: { backgroundColor: '#000', borderRadius: 8, paddingVertical: 6, paddingHorizontal: 16, marginRight: 8 },
  activeTabText: { color: '#fff', fontWeight: 'bold' },
  inactiveTab: { backgroundColor: '#eee', borderRadius: 8, paddingVertical: 6, paddingHorizontal: 16 },
  inactiveTabText: { color: '#888', fontWeight: 'bold' },
  input: { width: '100%', maxWidth: 320, height: 48, borderColor: '#ddd', borderWidth: 1, borderRadius: 8, paddingHorizontal: 16, marginBottom: 16, backgroundColor: '#f9f9f9' },
  button: { width: '100%', maxWidth: 320, height: 48, backgroundColor: '#000', borderRadius: 8, justifyContent: 'center', alignItems: 'center', marginTop: 8, marginBottom: 16 },
  buttonText: { color: '#fff', fontSize: 18, fontWeight: 'bold' },
  signupText: { color: '#444', marginTop: 8 },
  signupLink: { color: '#007AFF', fontWeight: 'bold' },
  error: { color: '#d00', marginBottom: 8 },
});

const homeStyles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16, borderBottomWidth: 1, borderColor: '#eee' },
  headerTitle: { fontSize: 20, fontWeight: 'bold', color: '#111' },
  signOutBtn: { padding: 8, borderRadius: 6, backgroundColor: '#eee' },
  signOutText: { color: '#d00', fontWeight: 'bold' },
  messagesContainer: { flex: 1, padding: 16 },
  userMsg: { alignSelf: 'flex-end', backgroundColor: '#000', borderRadius: 12, padding: 10, marginBottom: 8, maxWidth: '80%' },
  aiMsg: { alignSelf: 'flex-start', backgroundColor: '#f1f1f1', borderRadius: 12, padding: 10, marginBottom: 8, maxWidth: '80%' },
  msgText: { color: '#111', fontSize: 16 },
  inputRow: { flexDirection: 'row', alignItems: 'center', padding: 12, borderTopWidth: 1, borderColor: '#eee', backgroundColor: '#fafafa' },
  input: { flex: 1, height: 44, borderColor: '#ddd', borderWidth: 1, borderRadius: 8, paddingHorizontal: 12, backgroundColor: '#fff', marginRight: 8 },
  sendBtn: { backgroundColor: '#000', borderRadius: 8, paddingVertical: 10, paddingHorizontal: 18 },
  sendBtnText: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
});

function App() {
  const isDarkMode = useColorScheme() === 'dark';
  return (
    <NavigationContainer>
      <StatusBar barStyle={isDarkMode ? 'light-content' : 'dark-content'} />
      <Stack.Navigator initialRouteName="Login">
        <Stack.Screen name="Login" component={LoginScreen} options={{ headerShown: false }} />
        <Stack.Screen name="Signup" component={SignupScreen} options={{ headerShown: false }} />
        <Stack.Screen name="Home" component={HomeScreen} options={{ headerShown: false }} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}

export default App;
