import React from 'react';
import renderer from 'react-test-renderer';
import { TasksScreen } from '../../../screens/tasks/TasksScreen';

jest.mock('../../../services/api', () => {
  const actual = jest.requireActual('../../../services/api');
  return {
    ...actual,
    usersAPI: {
      getMe: jest.fn().mockResolvedValue({ notification_preferences: { momentum_mode: { enabled: true, travel_preference: 'allow_travel' } } }),
      updateMe: jest.fn().mockResolvedValue({}),
    },
    tasksAPI: {
      ...actual.tasksAPI,
      getTasks: jest.fn().mockResolvedValue([
        { id: '1', title: 'Focus A', status: 'in_progress', is_today_focus: true, priority: 'high' },
        { id: '2', title: 'Task B', status: 'not_started', is_today_focus: false, priority: 'medium' },
      ]),
      focusNext: jest.fn().mockResolvedValue({ id: '2', title: 'Task B', status: 'not_started', is_today_focus: true, priority: 'medium' }),
      updateTask: jest.fn().mockResolvedValue({ id: '1', title: 'Focus A', status: 'in_progress', is_today_focus: false, priority: 'high' }),
    },
    goalsAPI: { getGoals: jest.fn().mockResolvedValue([]) },
  };
});

jest.mock('@react-native-async-storage/async-storage', () => require('@react-native-async-storage/async-storage/jest/async-storage-mock'));

describe('Focus Skip', () => {
  it('renders TasksScreen', () => {
    const tree = renderer.create(<TasksScreen />).toJSON();
    expect(tree).toBeTruthy();
  });
});


