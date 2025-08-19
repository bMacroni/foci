import React, { useEffect } from 'react';
import { View } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function BrainDumpEntryScreen({ navigation }: any) {
  useEffect(() => {
    (async () => {
      try {
        const dismissed = await AsyncStorage.getItem('brainDumpOnboardingDismissed');
        if (dismissed) {
          navigation.replace('BrainDumpInput');
        } else {
          navigation.replace('BrainDumpOnboarding');
        }
      } catch {
        navigation.replace('BrainDumpOnboarding');
      }
    })();
  }, [navigation]);

  return <View />;
}


