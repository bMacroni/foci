import React, { useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { colors } from '../../themes/colors';
import { typography } from '../../themes/typography';
import { spacing, borderRadius } from '../../themes/spacing';
import { Input, PasswordInput, Button, ApiToggle } from '../../components/common';
import { configService, ApiConfig } from '../../services/config';

export default function LoginScreen({ navigation }: any) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    setError('');
    setLoading(true);
    try {
      const baseUrl = configService.getBaseUrl();
      const response = await axios.post(`${baseUrl}/auth/login`, {
        email,
        password,
      });
      const { token } = response.data;
      await AsyncStorage.setItem('authToken', token);
      setLoading(false);
      navigation.replace('Main');
    } catch (err: any) {
      setLoading(false);
      if (err.response && err.response.data && err.response.data.error) {
        setError(err.response.data.error);
      } else {
        setError('Login failed. Please try again.');
      }
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        {/* Logo placeholder */}
        <View style={styles.logoContainer}>
          <Text style={styles.logoIcon}>📖</Text>
        </View>
        <Text style={styles.title}>Welcome Back</Text>
        <Text style={styles.subtitle}>Sign in to your Foci account</Text>
        
        <View style={styles.tabContainer}>
          <View style={styles.activeTab}>
            <Text style={styles.activeTabText}>Email & Password</Text>
          </View>
          <View style={styles.inactiveTab}>
            <Text style={styles.inactiveTabText}>JWT Token</Text>
          </View>
        </View>
        
        <ApiToggle />
        
        <Input
          placeholder="Email"
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
        />
        
        <PasswordInput
          placeholder="Password"
          value={password}
          onChangeText={setPassword}
        />
        
        {error ? <Text style={styles.error}>{error}</Text> : null}
        
        <Button
          title="Sign In"
          onPress={handleLogin}
          loading={loading}
          style={styles.button}
        />
        
        <Button
          title="Sign Up"
          onPress={() => navigation.navigate('Signup')}
          variant="outline"
          style={styles.signupButton}
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.primary,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.lg,
  },
  logoContainer: {
    marginBottom: spacing.lg,
    backgroundColor: colors.primary,
    borderRadius: borderRadius.xl,
    padding: spacing.md,
  },
  logoIcon: {
    fontSize: 32,
    color: colors.secondary,
  },
  title: {
    fontSize: typography.fontSize['3xl'],
    fontWeight: typography.fontWeight.bold,
    marginBottom: spacing.xs,
    color: colors.text.primary,
  },
  subtitle: {
    fontSize: typography.fontSize.base,
    color: colors.text.secondary,
    marginBottom: spacing.lg,
  },
  tabContainer: {
    flexDirection: 'row',
    marginBottom: spacing.md,
  },
  activeTab: {
    backgroundColor: colors.primary,
    borderRadius: borderRadius.md,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    marginRight: spacing.sm,
  },
  activeTabText: {
    color: colors.secondary,
    fontWeight: typography.fontWeight.bold,
  },
  inactiveTab: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
  },
  inactiveTabText: {
    color: colors.text.disabled,
    fontWeight: typography.fontWeight.bold,
  },
  button: {
    width: '100%',
    maxWidth: 320,
    marginTop: spacing.sm,
    marginBottom: spacing.md,
  },
  signupButton: {
    width: '100%',
    maxWidth: 320,
  },
  error: {
    color: colors.error,
    marginBottom: spacing.sm,
  },
});