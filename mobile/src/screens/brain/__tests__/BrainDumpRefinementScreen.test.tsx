import React from 'react';
import ReactTestRenderer, { act } from 'react-test-renderer';
import { NavigationContainer } from '@react-navigation/native';
import BrainDumpRefinementScreen from '../BrainDumpRefinementScreen';
import { BrainDumpProvider } from '../../../contexts/BrainDumpContext';

jest.mock('@react-native-async-storage/async-storage', () => ({
  __esModule: true,
  default: {
    getItem: jest.fn(async () => null),
    setItem: jest.fn(async () => {}),
    multiSet: jest.fn(async () => {}),
    multiRemove: jest.fn(async () => {}),
    getAllKeys: jest.fn(async () => []),
    multiGet: jest.fn(async () => []),
    clear: jest.fn(async () => {}),
  },
}));

jest.mock('../../../contexts/BrainDumpContext', () => {
  const React = require('react');
  return {
    __esModule: true,
    BrainDumpProvider: ({ children }: any) => React.createElement(React.Fragment, null, children),
    useBrainDump: () => ({
      threadId: 't1',
      items: [{ text: 'Task 1', type: 'task', stress_level: 'medium', priority: 'medium' }],
      setThreadId: jest.fn(),
      setItems: jest.fn(),
      clearSession: jest.fn(),
    }),
  };
});

jest.mock('@react-native-async-storage/async-storage', () => ({
  __esModule: true,
  default: { multiSet: jest.fn(async () => {}), setItem: jest.fn(async () => {}) },
}));

describe('BrainDumpRefinementScreen', () => {
  it('disables Next button when no tasks', async () => {
    const navigate = jest.fn();
    const items = [{ text: 'A goal', type: 'goal', stress_level: 'medium', priority: 'medium' } as any];
    let tree: any;
    await act(async () => {
      tree = ReactTestRenderer.create(
        <NavigationContainer>
          <BrainDumpProvider>
            <BrainDumpRefinementScreen navigation={{ navigate }} route={{ params: { items, threadId: 't1' } }} />
          </BrainDumpProvider>
        </NavigationContainer>
      );
    });
    const nextBtn = tree.root.findAllByProps({ testID: 'nextPrioritizeButton' })[0];
    expect(nextBtn.props.disabled).toBe(true);
  });

  it('enables Next button when has tasks', async () => {
    const navigate = jest.fn();
    const items = [
      { text: 'Task 1', type: 'task', stress_level: 'medium', priority: 'medium' },
      { text: 'Goal 1', type: 'goal', stress_level: 'low', priority: 'low' },
    ] as any;
    let tree: any;
    await act(async () => {
      tree = ReactTestRenderer.create(
        <NavigationContainer>
          <BrainDumpProvider>
            <BrainDumpRefinementScreen navigation={{ navigate }} route={{ params: { items, threadId: 't1' } }} />
          </BrainDumpProvider>
        </NavigationContainer>
      );
    });
    const nextBtn = tree.root.findAllByProps({ testID: 'nextPrioritizeButton' })[0];
    expect(nextBtn.props.disabled).toBe(false);
  });
});


