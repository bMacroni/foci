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
      updateTask: jest.fn().mockImplementation(async (id, body) => ({ id, title: id === '1' ? 'Focus A' : 'Task B', is_today_focus: id === '1' ? false : false, status: body.status || 'not_started', priority: id === '1' ? 'high' : 'medium' })),
      focusNext: jest.fn().mockResolvedValue({ id: '2', title: 'Task B', status: 'not_started', is_today_focus: true, priority: 'medium' }),
    },
    goalsAPI: { getGoals: jest.fn().mockResolvedValue([]) },
  };
});

jest.mock('@react-native-async-storage/async-storage', () => require('@react-native-async-storage/async-storage/jest/async-storage-mock'));

describe('Momentum Mode', () => {
  it('renders TasksScreen', () => {
    const tree = renderer.create(<TasksScreen />).toJSON();
    expect(tree).toBeTruthy();
  });
});


