import React, { useState } from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { PasswordInput, Button } from './index';
import { colors } from '../../themes/colors';
import { typography } from '../../themes/typography';
import { spacing, borderRadius } from '../../themes/spacing';

interface AccountLinkingModalProps {
  visible: boolean;
  onClose: () => void;
  onLinkAccount: (password: string) => Promise<void>;
  email: string;
  maxRetries?: number;
}

export const AccountLinkingModal: React.FC<AccountLinkingModalProps> = ({
  visible,
  onClose,
  onLinkAccount,
  email,
  maxRetries = 3,
}) => {
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [retryCount, setRetryCount] = useState(0);

  const handleLinkAccount = async () => {
    if (!password.trim()) {
      setError('Please enter your password');
      return;
    }

    setLoading(true);
    setError('');

    try {
      await onLinkAccount(password);
      // Success - modal will be closed by parent component
    } catch (error: any) {
      const newRetryCount = retryCount + 1;
      setRetryCount(newRetryCount);

      if (newRetryCount >= maxRetries) {
        Alert.alert(
          'Too Many Attempts',
          'You\'ve entered an incorrect password too many times. Please use the "Forgot Password?" option to reset your password.',
          [
            { text: 'OK', onPress: onClose },
            {
              text: 'Forgot Password?',
              onPress: () => {
                // TODO: Navigate to forgot password screen
                onClose();
              },
            },
          ]
        );
      } else {
        setError(`Incorrect password. ${maxRetries - newRetryCount} attempts remaining.`);
        setPassword('');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    setPassword('');
    setError('');
    setRetryCount(0);
    onClose();
  };

  const handleForgotPassword = () => {
    Alert.alert(
      'Forgot Password?',
      'You can reset your password using the standard password reset flow.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reset Password',
          onPress: () => {
            // TODO: Navigate to forgot password screen
            onClose();
          },
        },
      ]
    );
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={handleCancel}
    >
      <View style={styles.overlay}>
        <View style={styles.modalContainer}>
          <View style={styles.header}>
            <Text style={styles.title}>Account Already Exists</Text>
            <Text style={styles.subtitle}>
              An account with the email <Text style={styles.email}>{email}</Text> already exists.
            </Text>
          </View>

          <View style={styles.content}>
            <Text style={styles.explanation}>
              To link your Google account, please enter the password for your existing Foci account.
              This is a one-time security step to connect your accounts.
            </Text>

            <PasswordInput
              placeholder="Enter your password"
              value={password}
              onChangeText={(text) => {
                setPassword(text);
                if (error) setError('');
              }}
              style={styles.passwordInput}
            />

            {error ? <Text style={styles.error}>{error}</Text> : null}

            <TouchableOpacity onPress={handleForgotPassword} style={styles.forgotPasswordLink}>
              <Text style={styles.forgotPasswordText}>Forgot Password?</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.actions}>
            <Button
              title="Cancel"
              onPress={handleCancel}
              variant="outline"
              style={styles.cancelButton}
              disabled={loading}
            />
            <Button
              title={loading ? 'Linking...' : 'Link Account'}
              onPress={handleLinkAccount}
              style={styles.linkButton}
              loading={loading}
              disabled={loading}
            />
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    margin: spacing.lg,
    width: '90%',
    maxWidth: 400,
    shadowColor: colors.shadow,
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  header: {
    marginBottom: spacing.lg,
  },
  title: {
    ...typography.h2,
    color: colors.text.primary,
    marginBottom: spacing.sm,
    textAlign: 'center',
  },
  subtitle: {
    ...typography.body,
    color: colors.text.secondary,
    textAlign: 'center',
    lineHeight: 20,
  },
  email: {
    fontWeight: 'bold',
    color: colors.text.primary,
  },
  content: {
    marginBottom: spacing.lg,
  },
  explanation: {
    ...typography.body,
    color: colors.text.secondary,
    marginBottom: spacing.md,
    lineHeight: 20,
  },
  passwordInput: {
    marginBottom: spacing.sm,
  },
  error: {
    ...typography.caption,
    color: colors.error,
    marginBottom: spacing.sm,
  },
  forgotPasswordLink: {
    alignSelf: 'flex-end',
    marginBottom: spacing.md,
  },
  forgotPasswordText: {
    ...typography.caption,
    color: colors.primary,
    textDecorationLine: 'underline',
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: spacing.md,
  },
  cancelButton: {
    flex: 1,
  },
  linkButton: {
    flex: 1,
  },
});
