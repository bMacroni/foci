import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { TasksScreen } from '../../../screens/tasks/TasksScreen';

// Prefix with mock to be allowed in jest.mock factory closure
const mockUpdateMe = jest.fn().mockResolvedValue({});

jest.mock('../../../services/api', () => {
  const actual = jest.requireActual('../../../services/api');
  return {
    ...actual,
    usersAPI: {
      getMe: jest.fn().mockResolvedValue({ notification_preferences: { momentum_mode: { enabled: false, travel_preference: 'allow_travel' } } }),
      updateMe: (...args: any[]) => mockUpdateMe(...args),
    },
    tasksAPI: {
      ...actual.tasksAPI,
      getTasks: jest.fn().mockResolvedValue([]),
    },
    goalsAPI: { getGoals: jest.fn().mockResolvedValue([]) },
  };
});

jest.mock('@react-native-async-storage/async-storage', () => require('@react-native-async-storage/async-storage/jest/async-storage-mock'));

describe('Momentum settings persistence', () => {
  it('persists toggle and travel preference to user profile', async () => {
    const { getByText } = render(<TasksScreen />);
    await waitFor(() => expect(getByText('Tasks')).toBeTruthy());

    // Toggle momentum on
    const momentumToggle = getByText(/Momentum Off/);
    fireEvent.press(momentumToggle);
    await waitFor(() => expect(mockUpdateMe).toHaveBeenCalled());

    // Toggle travel preference
    const travelPref = getByText(/Allow Travel/);
    fireEvent.press(travelPref);
    await waitFor(() => expect(mockUpdateMe).toHaveBeenCalledTimes(2));
  });
});


