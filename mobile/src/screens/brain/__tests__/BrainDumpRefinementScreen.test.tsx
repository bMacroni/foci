import React from 'react';
import ReactTestRenderer, { act } from 'react-test-renderer';
import BrainDumpRefinementScreen from '../BrainDumpRefinementScreen';

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
        <BrainDumpRefinementScreen navigation={{ navigate }} route={{ params: { items, threadId: 't1' } }} />
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
        <BrainDumpRefinementScreen navigation={{ navigate }} route={{ params: { items, threadId: 't1' } }} />
      );
    });
    const nextBtn = tree.root.findAllByProps({ testID: 'nextPrioritizeButton' })[0];
    expect(nextBtn.props.disabled).toBe(false);
  });
});


