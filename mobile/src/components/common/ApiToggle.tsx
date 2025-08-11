import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { colors } from '../../themes/colors';
import { typography } from '../../themes/typography';
import { spacing, borderRadius } from '../../themes/spacing';
import { configService, ApiConfig } from '../../services/config';

interface ApiToggleProps {
  onConfigChange?: (config: ApiConfig) => void;
}

export const ApiToggle: React.FC<ApiToggleProps> = ({ onConfigChange }) => {
  const [currentConfigKey, setCurrentConfigKey] = useState<string>('local');
  const [showConfigs, setShowConfigs] = useState(false);

  useEffect(() => {
    loadCurrentConfig();
  }, []);

  const loadCurrentConfig = async () => {
    const configKey = await configService.getCurrentConfigKey();
    setCurrentConfigKey(configKey);
  };

  const handleConfigChange = async (configKey: string) => {
    await configService.setConfig(configKey);
    setCurrentConfigKey(configKey);
    setShowConfigs(false);
    
    const newConfig = configService.getCurrentConfig();
    onConfigChange?.(newConfig);
  };

  const currentConfig = configService.getCurrentConfig();
  const availableConfigs = configService.getAvailableConfigs();

  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={styles.toggleButton}
        onPress={() => setShowConfigs(!showConfigs)}
      >
        <Text style={styles.toggleLabel}>Backend:</Text>
        <Text style={styles.toggleValue}>{currentConfig.name}</Text>
        <Text style={styles.toggleIcon}>{showConfigs ? '▲' : '▼'}</Text>
      </TouchableOpacity>

      {showConfigs && (
        <View style={styles.configList}>
          {Object.entries(availableConfigs).map(([key, config]) => (
            <TouchableOpacity
              key={key}
              style={[
                styles.configOption,
                currentConfigKey === key && styles.configOptionActive
              ]}
              onPress={() => handleConfigChange(key)}
            >
              <Text style={[
                styles.configOptionName,
                currentConfigKey === key && styles.configOptionNameActive
              ]}>
                {config.name}
              </Text>
              <Text style={[
                styles.configOptionDescription,
                currentConfigKey === key && styles.configOptionDescriptionActive
              ]}>
                {config.description}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: spacing.md,
    width: '100%',
    maxWidth: 320,
  },
  toggleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.surface,
    padding: spacing.sm,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.border.light,
  },
  toggleLabel: {
    fontSize: typography.fontSize.sm,
    color: colors.text.secondary,
    fontWeight: typography.fontWeight.medium as any,
  },
  toggleValue: {
    fontSize: typography.fontSize.sm,
    color: colors.text.primary,
    fontWeight: typography.fontWeight.medium as any,
    flex: 1,
    textAlign: 'center',
  },
  toggleIcon: {
    fontSize: typography.fontSize.sm,
    color: colors.text.secondary,
  },
  configList: {
    marginTop: spacing.xs,
    backgroundColor: colors.background.surface,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.border.light,
    overflow: 'hidden',
  },
  configOption: {
    padding: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.light,
  },
  configOptionActive: {
    backgroundColor: colors.primary,
  },
  configOptionName: {
    fontSize: typography.fontSize.sm,
    color: colors.text.primary,
    fontWeight: typography.fontWeight.medium as any,
  },
  configOptionNameActive: {
    color: colors.secondary,
  },
  configOptionDescription: {
    fontSize: typography.fontSize.xs,
    color: colors.text.secondary,
    marginTop: spacing.xs,
  },
  configOptionDescriptionActive: {
    color: colors.secondary,
    opacity: 0.8,
  },
});
