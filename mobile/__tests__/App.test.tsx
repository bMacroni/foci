/**
 * @format
 */

import React from 'react';
import ReactTestRenderer from 'react-test-renderer';
import App from '../App';

jest.mock('../src/screens/auth/LoginScreen', () => {
  const React = require('react');
  return {
    __esModule: true,
    default: () => React.createElement('View', null, React.createElement('Text', null, 'Login')),
  };
});

jest.mock('../src/services/auth', () => ({
  authService: {
    getAuthToken: jest.fn(async () => null),
    getInstance: jest.fn(() => ({
      subscribe: jest.fn(() => jest.fn()),
      getAuthState: jest.fn(() => ({ user: null, token: null, isAuthenticated: false, isLoading: false })),
    })),
  },
}));

test('renders correctly', async () => {
  await ReactTestRenderer.act(() => {
    ReactTestRenderer.create(<App />);
  });
});
