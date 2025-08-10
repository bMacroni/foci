# Technical Implementation Plan: Mobile AI Chat Onboarding

## 🎯 Overview

This document provides a comprehensive technical implementation plan for the Mobile AI Chat Onboarding feature as defined in `PRD_Mobile_AI_Chat_Onboarding.md`. The implementation integrates seamlessly with the existing `AIChatScreen.tsx` while maintaining all current functionality and following established patterns in the codebase.

## 📁 File Structure & Implementation

### Phase 1: Core Infrastructure

#### 1.1 Types and Interfaces (`src/types/onboarding.ts`)
```typescript
export interface OnboardingState {
  isCompleted: boolean;
  lastCompletedAt?: Date;
  currentStep?: 'welcome' | 'waiting' | 'completed';
}

export interface QuickAction {
  id: string;
  label: string;
  prefillText: string;
  icon: string;
}

export interface OnboardingMessage {
  id: string;
  text: string;
  type: 'welcome' | 'followup' | 'example';
  timestamp: Date;
}
```

#### 1.2 Onboarding Service (`src/services/onboarding.ts`)
```typescript
import AsyncStorage from '@react-native-async-storage/async-storage';
import { OnboardingState } from '../types/onboarding';

const ONBOARDING_KEY = 'foci_onboarding_state';

export class OnboardingService {
  static async getOnboardingState(): Promise<OnboardingState> {
    try {
      const stored = await AsyncStorage.getItem(ONBOARDING_KEY);
      return stored ? JSON.parse(stored) : { isCompleted: false };
    } catch {
      return { isCompleted: false };
    }
  }

  static async setOnboardingCompleted(): Promise<void> {
    const state: OnboardingState = {
      isCompleted: true,
      lastCompletedAt: new Date(),
      currentStep: 'completed'
    };
    await AsyncStorage.setItem(ONBOARDING_KEY, JSON.stringify(state));
  }

  static async resetOnboarding(): Promise<void> {
    await AsyncStorage.removeItem(ONBOARDING_KEY);
  }
}
```

#### 1.3 QuickActions Component (`src/components/ai/QuickActions.tsx`)
```typescript
import React from 'react';
import { View, TouchableOpacity, Text, StyleSheet } from 'react-native';
import Icon from 'react-native-vector-icons/Octicons';
import { colors } from '../../themes/colors';
import { typography } from '../../themes/typography';
import { spacing, borderRadius } from '../../themes/spacing';
import { QuickAction } from '../../types/onboarding';

interface QuickActionsProps {
  actions: QuickAction[];
  onActionPress: (action: QuickAction) => void;
  visible: boolean;
}

export default function QuickActions({ actions, onActionPress, visible }: QuickActionsProps) {
  if (!visible) return null;

  return (
    <View style={styles.container}>
      {actions.map((action) => (
        <TouchableOpacity
          key={action.id}
          style={styles.actionButton}
          onPress={() => onActionPress(action)}
        >
          <Icon name={action.icon} size={20} color={colors.text.primary} />
          <Text style={styles.actionText}>{action.label}</Text>
        </TouchableOpacity>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    backgroundColor: colors.background.secondary,
    borderRadius: borderRadius.md,
    marginHorizontal: spacing.md,
    marginVertical: spacing.sm,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.sm,
    backgroundColor: colors.background.primary,
    minWidth: 100,
    justifyContent: 'center',
  },
  actionText: {
    ...typography.body2,
    marginLeft: spacing.xs,
    color: colors.text.primary,
  },
});
```

### Phase 2: AIChatScreen Integration

#### 2.1 Extended AIChatScreen State Management
```typescript
// Add to existing state in AIChatScreen.tsx
const [onboardingState, setOnboardingState] = useState<OnboardingState>({ isCompleted: false });
const [showOnboarding, setShowOnboarding] = useState(false);
const [onboardingTimer, setOnboardingTimer] = useState<NodeJS.Timeout | null>(null);
const [hasUserInteracted, setHasUserInteracted] = useState(false);

// Quick actions configuration
const quickActions: QuickAction[] = [
  {
    id: 'create-goal',
    label: 'Create a Goal',
    prefillText: 'Create a new goal.',
    icon: 'target'
  },
  {
    id: 'add-task',
    label: 'Add a Task',
    prefillText: 'I need to add a new task.',
    icon: 'checklist'
  },
  {
    id: 'manage-calendar',
    label: 'Manage My Calendar',
    prefillText: 'I need to manage my calendar.',
    icon: 'calendar'
  }
];
```

#### 2.2 Onboarding Flow Logic
```typescript
// Add to AIChatScreen.tsx
const initializeOnboarding = async () => {
  const state = await OnboardingService.getOnboardingState();
  setOnboardingState(state);
  
  if (!state.isCompleted) {
    setShowOnboarding(true);
    startOnboardingTimer();
  }
};

const startOnboardingTimer = () => {
  const timer = setTimeout(() => {
    if (!hasUserInteracted && showOnboarding) {
      sendOnboardingFollowUp();
    }
  }, 10000); // 10 seconds
  
  setOnboardingTimer(timer);
};

const sendOnboardingFollowUp = () => {
  const followUpMessage: Message = {
    id: Date.now(),
    text: "You can also just tell me what's on your mind. For example, try saying: 'Help me plan to learn to play the guitar' or 'Schedule a dentist appointment for next Tuesday at 3 PM.'",
    sender: 'ai'
  };
  
  // Add to current conversation
  setConversations(prev => prev.map(c => {
    if (c.id === currentConversationId) {
      return {
        ...c,
        messages: [...c.messages, followUpMessage],
        lastMessageAt: new Date(),
      };
    }
    return c;
  }));
};

const handleQuickActionPress = (action: QuickAction) => {
  setHasUserInteracted(true);
  if (onboardingTimer) {
    clearTimeout(onboardingTimer);
    setOnboardingTimer(null);
  }
  
  // Pre-fill input and send
  setInput(action.prefillText);
  setTimeout(() => {
    handleSend();
  }, 100);
  
  // Hide onboarding after action
  setShowOnboarding(false);
  OnboardingService.setOnboardingCompleted();
};
```

#### 2.3 Modified Message Rendering
```typescript
// Update renderMessage function to handle onboarding messages
const renderMessage = (msg: Message) => {
  if (msg.sender === 'user') {
    return (
      <View key={msg.id} style={styles.userMsg}>
        <Text style={styles.userMsgText}>{msg.text}</Text>
      </View>
    );
  }
  
  return (
    <View key={msg.id} style={styles.aiMsg}>
      <Text style={styles.aiMsgText}>{msg.text}</Text>
      {showOnboarding && msg.text.includes('Welcome to Foci') && (
        <QuickActions
          actions={quickActions}
          onActionPress={handleQuickActionPress}
          visible={true}
        />
      )}
    </View>
  );
};
```

### Phase 3: Help Icon Integration

#### 3.1 Add Help Icon to Header
```typescript
// Add to AIChatScreen.tsx header section
<TouchableOpacity
  style={styles.helpButton}
  onPress={handleHelpPress}
>
  <Icon name="question" size={24} color={colors.text.primary} />
</TouchableOpacity>

// Add help handler
const handleHelpPress = async () => {
  await OnboardingService.resetOnboarding();
  setShowOnboarding(true);
  setHasUserInteracted(false);
  setOnboardingState({ isCompleted: false });
  
  // Reset current conversation to welcome message
  const resetConversation: Conversation = {
    id: currentConversationId,
    title: 'General Chat',
    messages: [{ id: 1, text: 'Hi there, and welcome to Foci! I\'m here to help you structure your goals and tasks in a way that feels manageable. What would you like to do first?', sender: 'ai' }],
    isPinned: false,
    createdAt: new Date(),
    lastMessageAt: new Date(),
  };
  
  setConversations(prev => prev.map(c => 
    c.id === currentConversationId ? resetConversation : c
  ));
  
  startOnboardingTimer();
};
```

### Phase 4: Enhanced User Interaction

#### 4.1 Input Change Handler
```typescript
// Add to existing input handling
const handleInputChange = (text: string) => {
  setInput(text);
  if (showOnboarding && !hasUserInteracted) {
    setHasUserInteracted(true);
    if (onboardingTimer) {
      clearTimeout(onboardingTimer);
      setOnboardingTimer(null);
    }
  }
};
```

#### 4.2 Cleanup on Component Unmount
```typescript
// Add to useEffect cleanup
useEffect(() => {
  return () => {
    if (onboardingTimer) {
      clearTimeout(onboardingTimer);
    }
  };
}, [onboardingTimer]);
```

## 🔧 Implementation Steps

### Step 1: Create Type Definitions
1. Create `src/types/onboarding.ts` with all interfaces
2. Update existing Message interface if needed

### Step 2: Implement Services
1. Create `src/services/onboarding.ts` with OnboardingService
2. Test AsyncStorage integration

### Step 3: Build QuickActions Component
1. Implement `src/components/ai/QuickActions.tsx`
2. Add proper styling and accessibility
3. Test component in isolation

### Step 4: Integrate with AIChatScreen
1. Add onboarding state management
2. Implement timer logic
3. Add quick action handlers
4. Update message rendering

### Step 5: Add Help Icon
1. Add help icon to header
2. Implement reset functionality
3. Test re-trigger flow

### Step 6: Testing and Polish
1. Test onboarding flow end-to-end
2. Test edge cases (timer cancellation, navigation)
3. Test persistence across app restarts
4. Validate accessibility

## 🚨 Risk Mitigation

### Edge Cases Handled:
1. **Timer Cancellation**: Clear timer when user interacts
2. **Navigation**: Preserve onboarding state across navigation
3. **Network Issues**: Graceful fallback for API calls
4. **Rapid Clicks**: Debounce quick action clicks
5. **App Restart**: Persist onboarding completion status

### Performance Considerations:
1. **Timer Management**: Proper cleanup to prevent memory leaks
2. **State Updates**: Optimize re-renders with proper state management
3. **AsyncStorage**: Handle storage errors gracefully

## 🧪 Testing Strategy

### Unit Tests:
- OnboardingService methods
- QuickActions component
- Timer management logic

### Integration Tests:
- Complete onboarding flow
- Help icon reset functionality
- State persistence

### Manual Testing:
- First-time user experience
- Re-trigger functionality
- Edge case scenarios

## 📊 Success Metrics

1. **Onboarding Completion Rate**: Track how many users complete the onboarding
2. **Quick Action Usage**: Monitor which actions are most popular
3. **Help Icon Usage**: Track how often users re-trigger onboarding
4. **User Engagement**: Measure if onboarding leads to increased chat usage

## 🔗 Related Documents

- [PRD_Mobile_AI_Chat_Onboarding.md](./PRD_Mobile_AI_Chat_Onboarding.md) - Product Requirements Document
- [AIChatScreen.tsx](../mobile/src/screens/ai/AIChatScreen.tsx) - Current chat implementation

## 📝 Implementation Notes

- This implementation maintains backward compatibility with existing chat functionality
- All onboarding state is persisted using AsyncStorage for consistency with existing patterns
- The QuickActions component follows the established design system using Octicons
- Timer management includes proper cleanup to prevent memory leaks
- The help icon integration provides a non-intrusive way to re-trigger onboarding

This technical implementation plan provides a robust, scalable solution that integrates seamlessly with the existing codebase while delivering the enhanced user experience outlined in the PRD. 