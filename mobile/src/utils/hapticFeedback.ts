import ReactNativeHapticFeedback from 'react-native-haptic-feedback';

const hapticOptions = {
  enableVibrateFallback: true,
  ignoreAndroidSystemSettings: false,
};

export const hapticFeedback = {
  // Light impact for subtle interactions
  light: () => {
    ReactNativeHapticFeedback.trigger('impactLight', hapticOptions);
  },

  // Medium impact for standard interactions
  medium: () => {
    ReactNativeHapticFeedback.trigger('impactMedium', hapticOptions);
  },

  // Heavy impact for important actions
  heavy: () => {
    ReactNativeHapticFeedback.trigger('impactHeavy', hapticOptions);
  },

  // Success feedback for completed actions
  success: () => {
    ReactNativeHapticFeedback.trigger('notificationSuccess', hapticOptions);
  },

  // Warning feedback for caution actions
  warning: () => {
    ReactNativeHapticFeedback.trigger('notificationWarning', hapticOptions);
  },

  // Error feedback for failed actions
  error: () => {
    ReactNativeHapticFeedback.trigger('notificationError', hapticOptions);
  },

  // Selection feedback for menu selections
  selection: () => {
    ReactNativeHapticFeedback.trigger('selection', hapticOptions);
  },
}; 