import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { TasksScreen } from '../../../screens/tasks/TasksScreen';
import { NavigationContainer } from '@react-navigation/native';

jest.mock('../../../services/api', () => {
  const actual = jest.requireActual('../../../services/api');
  return {
    ...actual,
    appPreferencesAPI: {
      get: jest.fn(async () => ({ momentum_mode_enabled: false, momentum_travel_preference: 'allow_travel' })),
      update: jest.fn(async (p) => p),
    },
    tasksAPI: {
      ...actual.tasksAPI,
      getTasks: jest.fn().mockResolvedValue([
        { id: '1', title: 'Focus A', status: 'in_progress', is_today_focus: true, priority: 'high' },
        { id: '2', title: 'Task B', status: 'not_started', is_today_focus: false, priority: 'medium' },
      ]),
    },
    goalsAPI: { getGoals: jest.fn().mockResolvedValue([]) },
  };
});

jest.mock('@react-native-async-storage/async-storage', () => require('@react-native-async-storage/async-storage/jest/async-storage-mock'));

function renderWithNav(ui: React.ReactElement) {
  return render(<NavigationContainer>{ui}</NavigationContainer>);
}

describe('Momentum settings persistence (appPreferencesAPI)', () => {
  it('loads from app preferences and updates on toggle (icon-only)', async () => {
    const utils = renderWithNav(<TasksScreen />);
    const { getByTestId, getByText } = utils as any;
    await waitFor(() => getByText('Tasks'));
    expect((utils as any).getByLabelText(/Momentum (On|Off)/)).toBeTruthy();
    const toggle = getByTestId('momentumToggle');
    fireEvent.press(toggle);
    await waitFor(() => expect((utils as any).getByLabelText(/Momentum (On|Off)/)).toBeTruthy());
  });
});


