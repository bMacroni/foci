import React from 'react';
import ReactTestRenderer, { act } from 'react-test-renderer';
import BrainDumpPrioritizationScreen from '../BrainDumpPrioritizationScreen';

jest.mock('@react-native-async-storage/async-storage', () => ({
  __esModule: true,
  default: { setItem: jest.fn(async () => {}), getItem: jest.fn(async () => null), multiRemove: jest.fn(async () => {}) },
}));

jest.mock('../../../services/api', () => ({
  __esModule: true,
  tasksAPI: {
    createTask: jest.fn(async () => ({})),
    bulkCreateTasks: jest.fn(async () => ([])),
  },
}));

describe('BrainDumpPrioritizationScreen', () => {
  it('calls createTask and bulkCreateTasks on save', async () => {
    const navigate = jest.fn();
    const tasks = [
      { text: 'A', priority: 'high' },
      { text: 'B', priority: 'low' },
    ];
    let tree: any;
    await act(async () => {
      tree = ReactTestRenderer.create(
        <BrainDumpPrioritizationScreen navigation={{ navigate }} route={{ params: { tasks } }} />
      );
    });
    const saveBtn = tree.root.findAllByProps({ testID: 'saveAndFinishButton' })[0];
    await act(async () => {
      saveBtn.props.onPress();
    });
    const { tasksAPI } = require('../../../services/api');
    expect(tasksAPI.createTask).toHaveBeenCalled();
    expect(tasksAPI.bulkCreateTasks).toHaveBeenCalled();
  });
});


