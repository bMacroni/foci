import 'react-native-gesture-handler/jestSetup';

jest.mock('react-native-reanimated', () => require('react-native-reanimated/mock'));
jest.mock('react-native', () => {
  const RN = jest.requireActual('react-native');
  RN.Animated = {
    ...RN.Animated,
    timing: () => ({ start: (cb) => cb && cb() }),
    parallel: () => ({ start: (cb) => cb && cb() }),
  };
  return RN;
});

jest.mock('react-native-vector-icons/Octicons', () => 'Icon');
jest.mock('react-native-draggable-flatlist', () => 'DraggableFlatList');
jest.mock('react-native-popable', () => {
  return { Popable: ({ children }) => children };
});

jest.mock('react-native-haptic-feedback', () => ({
  __esModule: true,
  default: { trigger: jest.fn() },
}));
jest.mock('./src/services/auth', () => ({
  authService: {
    getAuthToken: jest.fn(async () => null),
    getInstance: jest.fn(() => ({
      subscribe: jest.fn(() => jest.fn()),
      getAuthState: jest.fn(() => ({ user: null, token: null, isAuthenticated: false, isLoading: false })),
    })),
  },
}));
jest.mock('@react-native-async-storage/async-storage', () => ({
  __esModule: true,
  default: {
    getItem: jest.fn(async () => null),
    setItem: jest.fn(async () => {}),
    multiSet: jest.fn(async () => {}),
    multiRemove: jest.fn(async () => {}),
    removeItem: jest.fn(async () => {}),
    getAllKeys: jest.fn(async () => []),
    multiGet: jest.fn(async (keys) => (Array.isArray(keys) ? keys.map(k => [k, null]) : [])),
    clear: jest.fn(async () => {}),
  },
}));

jest.mock('@react-native-community/netinfo', () => ({
  __esModule: true,
  default: {
    addEventListener: jest.fn(),
    fetch: jest.fn(async () => ({ isConnected: true })),
  },
}));

jest.mock('react-native-safe-area-context', () => {
  const React = require('react');
  const SafeAreaContext = React.createContext({ top: 0, right: 0, bottom: 0, left: 0 });
  return {
    __esModule: true,
    SafeAreaProvider: ({ children }) => React.createElement('SafeAreaProvider', null, children),
    SafeAreaView: ({ children }) => React.createElement('SafeAreaView', null, children),
    useSafeAreaInsets: () => ({ top: 0, right: 0, bottom: 0, left: 0 }),
    useSafeAreaFrame: () => ({ x: 0, y: 0, width: 390, height: 844 }),
    SafeAreaInsetsContext: SafeAreaContext,
  };
});

// Note: Do not use fake timers globally; they can stall component effects.


