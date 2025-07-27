import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { TouchableOpacity, Text, StyleSheet, View, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import AIChatScreen from '../screens/ai/AIChatScreen';
import { CustomTabBar } from '../components/common/CustomTabBar';
import { colors } from '../themes/colors';
import { typography } from '../themes/typography';
import { MainTabParamList } from './types';

const Tab = createBottomTabNavigator<MainTabParamList>();

// Placeholder screens for now
const GoalsScreen = () => (
  <Text style={styles.placeholderText}>Goals Screen - Coming Soon</Text>
);

const TasksScreen = () => (
  <Text style={styles.placeholderText}>Tasks Screen - Coming Soon</Text>
);

const CalendarScreen = () => (
  <Text style={styles.placeholderText}>Calendar Screen - Coming Soon</Text>
);

export default function TabNavigator() {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarHideOnKeyboard: true,
      }}
      tabBar={props => <CustomTabBar {...props} />}
    >
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

const styles = StyleSheet.create({
  placeholderText: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    fontSize: typography.fontSize.lg,
    color: colors.text.secondary,
    textAlign: 'center',
    marginTop: 100,
  },
});
