import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { StatusBar } from 'react-native';
import { colors } from '../themes/colors';
import LoginScreen from '../screens/auth/LoginScreen';
import SignupScreen from '../screens/auth/SignupScreen';
import TabNavigator from './TabNavigator';
import GoalFormScreen from '../screens/goals/GoalFormScreen';
import GoalDetailScreen from '../screens/goals/GoalDetailScreen';
import { TaskFormScreen } from '../screens/tasks/TaskFormScreen';
import { TaskDetailScreen } from '../screens/tasks/TaskDetailScreen';
import { RootStackParamList } from './types';

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function AppNavigator() {
  return (
    <NavigationContainer>
      <StatusBar barStyle="dark-content" backgroundColor={colors.secondary} animated />
      <Stack.Navigator initialRouteName="Login">
        <Stack.Screen 
          name="Login" 
          component={LoginScreen} 
          options={{ headerShown: false }} 
        />
        <Stack.Screen 
          name="Signup" 
          component={SignupScreen} 
          options={{ headerShown: false }} 
        />
        <Stack.Screen 
          name="Main" 
          component={TabNavigator} 
          options={{ headerShown: false }} 
        />
        <Stack.Screen 
          name="GoalForm" 
          component={GoalFormScreen} 
          options={{ headerShown: false }} 
        />
        <Stack.Screen 
          name="GoalDetail" 
          component={GoalDetailScreen} 
          options={{ headerShown: false }} 
        />
        <Stack.Screen 
          name="TaskForm" 
          component={TaskFormScreen} 
          options={{ headerShown: false }} 
        />
        <Stack.Screen 
          name="TaskDetail" 
          component={TaskDetailScreen} 
          options={{ headerShown: false }} 
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
