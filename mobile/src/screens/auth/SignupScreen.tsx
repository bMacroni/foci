import React, { useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { colors } from '../../themes/colors';
import { typography } from '../../themes/typography';
import { spacing, borderRadius } from '../../themes/spacing';
import { Input, PasswordInput, Button, ApiToggle, GoogleSignInButton, AccountLinkingModal } from '../../components/common';
import { configService } from '../../services/config';
import { authService } from '../../services/auth';
import { googleAuthService } from '../../services/googleAuth';

export default function SignupScreen({ navigation }: any) {
  const [email, setEmail] = useState('');
  const [fullName, setFullName] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [showLinkingModal, setShowLinkingModal] = useState(false);
  const [linkingEmail, setLinkingEmail] = useState('');
  const [googleTokens, setGoogleTokens] = useState<{ idToken: string; accessToken: string } | null>(null);

  const handleSignup = async () => {
    setError('');
    setLoading(true);
    try {
      const baseUrl = configService.getBaseUrl();
      const response = await axios.post(`${baseUrl}/auth/signup`, {
        email,
        password,
        full_name: fullName,
      });
      // If auto-login is successful, token will be present
      if (response.data.token) {
        // Clear any stale session before storing the new one
        await AsyncStorage.multiRemove(['auth_token', 'authToken', 'auth_user', 'authUser']);
        await AsyncStorage.multiSet([
          ['auth_token', response.data.token],
          ['authToken', response.data.token],
          ['auth_user', JSON.stringify(response.data.user || {})],
          ['authUser', JSON.stringify(response.data.user || {})],
        ]);
        try { await authService.debugReinitialize(); } catch {}
        setLoading(false);
        navigation.replace('Main');
      } else {
        setLoading(false);
        // If user needs to confirm email, show message
        if (response.data.error) {
          setError(response.data.error);
        } else if (response.data.message) {
          setError(response.data.message);
        } else {
          setError('Signup successful. Please check your email to confirm your account.');
        }
      }
    } catch (err: any) {
      setLoading(false);
      if (err.response && err.response.data && err.response.data.error) {
        setError(err.response.data.error);
      } else {
        setError('Signup failed. Please try again.');
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
      } else if (result.linkingRequired) {
        // Account linking required
        setLinkingEmail(result.user?.email || '');
        setGoogleTokens({
          idToken: result.idToken || '',
          accessToken: result.accessToken || '',
        });
        setShowLinkingModal(true);
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

  const handleAccountLinking = async (password: string) => {
    if (!googleTokens) {
      throw new Error('Google tokens not available');
    }

    const result = await googleAuthService.linkAccount(
      googleTokens.idToken,
      googleTokens.accessToken,
      password
    );

    if (result.success) {
      setShowLinkingModal(false);
      navigation.replace('Main');
    } else {
      throw new Error(result.error || 'Account linking failed');
    }
  };

  const handleCloseLinkingModal = () => {
    setShowLinkingModal(false);
    setLinkingEmail('');
    setGoogleTokens(null);
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        {/* Logo placeholder */}
        <View style={styles.logoContainer}>
          <Text style={styles.logoIcon}>📖</Text>
        </View>
        <Text style={styles.title}>Create Account</Text>
        <Text style={styles.subtitle}>Sign up for a Mind Clear account</Text>
        
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
          placeholder="Full Name"
          value={fullName}
          onChangeText={setFullName}
        />

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
          title="Sign Up"
          onPress={handleSignup}
          loading={loading}
          style={styles.button}
        />
        
        <Button
          title="Sign In"
          onPress={() => navigation.navigate('Login')}
          variant="outline"
          style={styles.signinButton}
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
          variant="signup"
        />
      </View>

      {/* Account Linking Modal */}
      <AccountLinkingModal
        visible={showLinkingModal}
        onClose={handleCloseLinkingModal}
        onLinkAccount={handleAccountLinking}
        email={linkingEmail}
        maxRetries={3}
      />
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
  signinButton: {
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
    backgroundColor: colors.border,
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
