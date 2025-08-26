import React, { useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { colors } from '../../themes/colors';
import { typography } from '../../themes/typography';
import { spacing, borderRadius } from '../../themes/spacing';
import { Input, PasswordInput, Button, ApiToggle, GoogleSignInButton } from '../../components/common';
import { configService, ApiConfig } from '../../services/config';
import { authService } from '../../services/auth';
import { googleAuthService } from '../../services/googleAuth';
import OwlLogo from '../../assets/icon.svg';

export default function LoginScreen({ navigation }: any) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  const handleLogin = async () => {
    setError('');
    setLoading(true);
    try {
      const baseUrl = configService.getBaseUrl();
      const response = await axios.post(`${baseUrl}/auth/login`, {
        email,
        password,
      });
      const { token, user } = response.data;
      // Clear any stale session before storing the new one
      await AsyncStorage.multiRemove(['auth_token', 'authToken', 'auth_user', 'authUser']);
      await AsyncStorage.multiSet([
        ['auth_token', token],
        ['authToken', token],
        ['auth_user', JSON.stringify(user || {})],
        ['authUser', JSON.stringify(user || {})],
      ]);
      try { await authService.debugReinitialize(); } catch {}
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

  const handleGoogleSignIn = async () => {
    setError('');
    setGoogleLoading(true);
    
    try {
      const result = await googleAuthService.signInWithGoogle();
      
      if (result.success) {
        // Successful sign-in
        navigation.replace('Main');
      } else {
        // Error
        setError(result.error || 'Google Sign-In failed');
      }
    } catch (err: any) {
      setError(err.message || 'Google Sign-In failed');
    } finally {
      setGoogleLoading(false);
    }
  };



  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        {/* Logo */}
        <View style={styles.logoContainer}>
          <OwlLogo width={175} height={175} />
        </View>
        <Text style={styles.title}>Welcome Back</Text>
        <Text style={styles.subtitle}>Sign in to your Mind Clear account</Text>
        
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

        {/* Divider */}
        <View style={styles.divider}>
          <View style={styles.dividerLine} />
          <Text style={styles.dividerText}>or</Text>
          <View style={styles.dividerLine} />
        </View>

        {/* Google Sign-In Button */}
        <GoogleSignInButton
          onPress={handleGoogleSignIn}
          loading={googleLoading}
          disabled={loading || googleLoading}
          variant="signin"
        />
        
        {/* Bottom spacing to ensure button is visible */}
        <View style={{ height: spacing.xl }} />
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
    alignItems: 'center',
    padding: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing.md,
  },
  logoContainer: {
    marginBottom: spacing.lg,
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
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    maxWidth: 320,
    marginVertical: spacing.lg,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: colors.border.medium,
  },
  dividerText: {
    marginHorizontal: spacing.md,
    color: colors.text.secondary,
    fontSize: typography.fontSize.sm,
  },
  error: {
    color: colors.error,
    marginBottom: spacing.sm,
  },
});