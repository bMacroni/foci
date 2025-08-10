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