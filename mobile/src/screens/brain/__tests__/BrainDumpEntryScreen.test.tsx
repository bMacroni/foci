import React from 'react';
import ReactTestRenderer, { act } from 'react-test-renderer';
import BrainDumpEntryScreen from '../BrainDumpEntryScreen';

jest.mock('@react-native-async-storage/async-storage', () => ({
  __esModule: true,
  default: {
    getItem: jest.fn(async () => null),
    setItem: jest.fn(async () => {}),
  },
}));

describe('BrainDumpEntryScreen', () => {
  it('navigates to onboarding when not dismissed', async () => {
    const replace = jest.fn();
    const navigation: any = { replace };
    const AsyncStorage = require('@react-native-async-storage/async-storage').default;
    (AsyncStorage.getItem as jest.Mock).mockResolvedValueOnce(null);

    await act(async () => {
      ReactTestRenderer.create(<BrainDumpEntryScreen navigation={navigation} />);
    });

    expect(replace).toHaveBeenCalledWith('BrainDumpOnboarding');
  });

  it('navigates to input when dismissed', async () => {
    const replace = jest.fn();
    const navigation: any = { replace };
    const AsyncStorage = require('@react-native-async-storage/async-storage').default;
    (AsyncStorage.getItem as jest.Mock).mockResolvedValueOnce('1');

    await act(async () => {
      ReactTestRenderer.create(<BrainDumpEntryScreen navigation={navigation} />);
    });

    expect(replace).toHaveBeenCalledWith('BrainDumpInput');
  });
});


