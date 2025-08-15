import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
} from 'react-native';
import { UserFriendlyError, ErrorSeverity } from '../../services/errorHandling';
import { colors } from '../../themes/colors';

interface ErrorDisplayProps {
  error: UserFriendlyError | null;
  onRetry?: () => void;
  onDismiss?: () => void;
  onAction?: (action: string) => void;
  style?: any;
}

const { width } = Dimensions.get('window');

export const ErrorDisplay: React.FC<ErrorDisplayProps> = ({
  error,
  onRetry,
  onDismiss,
  onAction,
  style,
}) => {
  if (!error) {return null;}

  const getErrorStyle = () => {
    switch (error.severity) {
      case ErrorSeverity.CRITICAL:
        return styles.critical;
      case ErrorSeverity.HIGH:
        return styles.high;
      case ErrorSeverity.MEDIUM:
        return styles.medium;
      case ErrorSeverity.LOW:
        return styles.low;
      default:
        return styles.medium;
    }
  };

  const getIcon = () => {
    switch (error.severity) {
      case ErrorSeverity.CRITICAL:
        return '🚨';
      case ErrorSeverity.HIGH:
        return '⚠️';
      case ErrorSeverity.MEDIUM:
        return '⚠️';
      case ErrorSeverity.LOW:
        return 'ℹ️';
      default:
        return '⚠️';
    }
  };

  const handleAction = () => {
    if (error.action === 'Retry' && onRetry) {
      onRetry();
    } else if (error.action === 'Sign In' && onAction) {
      onAction('signIn');
    } else if (error.action === 'Fix' && onAction) {
      onAction('fix');
    } else if (error.action === 'Retry Later' && onAction) {
      onAction('retryLater');
    } else if (onAction) {
      onAction(error.action || 'default');
    }
  };

  const handleDismiss = () => {
    if (onDismiss) {
      onDismiss();
    }
  };

  return (
    <View style={[styles.container, getErrorStyle(), style]}>
      <View style={styles.content}>
        <View style={styles.header}>
          <Text style={styles.icon}>{getIcon()}</Text>
          <Text style={styles.title}>{error.title}</Text>
          {onDismiss && (
            <TouchableOpacity onPress={handleDismiss} style={styles.dismissButton}>
              <Text style={styles.dismissText}>✕</Text>
            </TouchableOpacity>
          )}
        </View>
        
        <Text style={styles.message}>{error.message}</Text>
        
        {error.action && (
          <View style={styles.actionContainer}>
            <TouchableOpacity
              style={[
                styles.actionButton,
                error.severity === ErrorSeverity.CRITICAL && styles.criticalAction,
              ]}
              onPress={handleAction}
            >
              <Text
                style={[
                  styles.actionText,
                  error.severity === ErrorSeverity.CRITICAL && styles.criticalActionText,
                ]}
              >
                {error.action}
              </Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginHorizontal: 16,
    marginVertical: 8,
    borderRadius: 12,
    overflow: 'hidden',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  content: {
    padding: 16,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  icon: {
    fontSize: 20,
    marginRight: 8,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    flex: 1,
    color: '#1a1a1a',
  },
  dismissButton: {
    padding: 4,
  },
  dismissText: {
    fontSize: 16,
    color: '#666',
    fontWeight: '500',
  },
  message: {
    fontSize: 14,
    lineHeight: 20,
    color: '#4a4a4a',
    marginBottom: 12,
  },
  actionContainer: {
    alignItems: 'flex-start',
  },
  actionButton: {
    backgroundColor: colors.primary,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    minWidth: 80,
    alignItems: 'center',
  },
  actionText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  criticalAction: {
    backgroundColor: '#dc3545',
  },
  criticalActionText: {
    color: '#fff',
  },
  // Error severity styles
  critical: {
    backgroundColor: '#fef2f2',
    borderLeftWidth: 4,
    borderLeftColor: '#dc3545',
  },
  high: {
    backgroundColor: '#fff3cd',
    borderLeftWidth: 4,
    borderLeftColor: '#ffc107',
  },
  medium: {
    backgroundColor: '#e7f3ff',
    borderLeftWidth: 4,
    borderLeftColor: '#007bff',
  },
  low: {
    backgroundColor: '#f8f9fa',
    borderLeftWidth: 4,
    borderLeftColor: '#6c757d',
  },
});

// Error Banner component for top-level errors
export const ErrorBanner: React.FC<ErrorDisplayProps> = ({
  error,
  onRetry,
  onDismiss,
  onAction,
}) => {
  if (!error) {return null;}

  return (
    <View style={bannerStyles.bannerContainer}>
      <ErrorDisplay
        error={error}
        onRetry={onRetry}
        onDismiss={onDismiss}
        onAction={onAction}
        style={bannerStyles.banner}
      />
    </View>
  );
};

const bannerStyles = StyleSheet.create({
  bannerContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 1000,
  },
  banner: {
    marginHorizontal: 0,
    marginVertical: 0,
    borderRadius: 0,
    borderLeftWidth: 0,
  },
});

// Error Modal component for critical errors
export const ErrorModal: React.FC<ErrorDisplayProps & { visible: boolean }> = ({
  error,
  visible,
  onRetry,
  onDismiss,
  onAction,
}) => {
  if (!visible || !error) {return null;}

  return (
    <View style={modalStyles.overlay}>
      <View style={modalStyles.modal}>
        <ErrorDisplay
          error={error}
          onRetry={onRetry}
          onDismiss={onDismiss}
          onAction={onAction}
          style={modalStyles.modalContent}
        />
      </View>
    </View>
  );
};

const modalStyles = StyleSheet.create({
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 2000,
  },
  modal: {
    width: width - 32,
    maxWidth: 400,
    backgroundColor: '#fff',
    borderRadius: 16,
    overflow: 'hidden',
  },
  modalContent: {
    margin: 0,
    borderRadius: 0,
  },
});

export default ErrorDisplay; 