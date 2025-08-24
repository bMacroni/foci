import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { TaskCard } from '../TaskCard';

const mockTask = {
  id: '1',
  title: 'Test Task',
  description: 'This is a test task description',
  priority: 'medium' as const,
  status: 'not_started' as const,
  due_date: '2024-12-20T00:00:00.000Z',
  category: 'work',
  goal: {
    id: '1',
    title: 'Test Goal',
  },
};

describe('TaskCard', () => {
  it('renders without crashing', () => {
    const { getByText } = render(<TaskCard task={mockTask as any} onPress={() => {}} onDelete={() => {}} onToggleStatus={() => {}} />);
    expect(getByText('Test Task')).toBeTruthy();
  });

  it('calls onPress when task is pressed', () => {
    const mockOnPress = jest.fn();
    const mockOnDelete = jest.fn();
    const mockOnToggleStatus = jest.fn();

    const { getByText } = render(
      <TaskCard
        task={mockTask}
        onPress={mockOnPress}
        onDelete={mockOnDelete}
        onToggleStatus={mockOnToggleStatus}
      />
    );

    fireEvent.press(getByText('Test Task'));
    expect(mockOnPress).toHaveBeenCalled();
  });
});