import React from 'react';
import { TextInput, TextInputProps, StyleSheet } from 'react-native';
import { colors } from '../../themes/colors';
import { spacing, borderRadius } from '../../themes/spacing';

interface InputProps extends TextInputProps {
  error?: boolean;
}

export const Input: React.FC<InputProps> = ({ error, style, ...props }) => {
  return (
    <TextInput
      style={[
        styles.input,
        error && styles.inputError,
        style,
      ]}
      placeholderTextColor={colors.text.disabled}
      {...props}
    />
  );
};

const styles = StyleSheet.create({
  input: {
    width: '100%',
    maxWidth: 320,
    height: 48,
    borderColor: colors.border.light,
    borderWidth: 1,
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.md,
    marginBottom: spacing.md,
    backgroundColor: colors.surface,
    color: colors.text.primary,
    fontSize: 16,
  },
  inputError: {
    borderColor: colors.error,
  },
});
