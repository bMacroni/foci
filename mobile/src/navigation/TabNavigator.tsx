import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import AIChatScreen from '../screens/ai/AIChatScreen';
import BrainDumpInputScreen from '../screens/brain/BrainDumpInputScreen';
import BrainDumpRefinementScreen from '../screens/brain/BrainDumpRefinementScreen';
import GoalsScreen from '../screens/goals/GoalsScreen';
import { TasksScreen } from '../screens/tasks/TasksScreen';
import CalendarScreen from '../screens/calendar/CalendarScreen';
import { CustomTabBar } from '../components/common/CustomTabBar';
import { MainTabParamList } from './types';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

const Tab = createBottomTabNavigator<MainTabParamList>();

export default function TabNavigator() {
  const BrainStack = createNativeStackNavigator();
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarHideOnKeyboard: true,
      }}
      tabBar={props => <CustomTabBar {...props} />}
    >
      <Tab.Screen 
        name="BrainDump" 
        options={{ title: 'Brain Dump' }}
      >
        {() => (
          <BrainStack.Navigator screenOptions={{ headerShown: false }}>
            <BrainStack.Screen name="BrainDumpInput" component={BrainDumpInputScreen} />
            <BrainStack.Screen name="BrainDumpRefinement" component={BrainDumpRefinementScreen} />
          </BrainStack.Navigator>
        )}
      </Tab.Screen>
      <Tab.Screen 
        name="AIChat" 
        component={AIChatScreen}
        options={{ title: 'AI Chat' }}
      />
      <Tab.Screen 
        name="Goals" 
        component={GoalsScreen}
        options={{ title: 'Goals' }}
      />
      <Tab.Screen 
        name="Tasks" 
        component={TasksScreen}
        options={{ title: 'Tasks' }}
      />
      <Tab.Screen 
        name="Calendar" 
        component={CalendarScreen}
        options={{ title: 'Calendar' }}
      />
    </Tab.Navigator>
  );
}
