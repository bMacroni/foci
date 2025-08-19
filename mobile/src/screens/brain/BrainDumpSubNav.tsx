import React from 'react';
import { View, TouchableOpacity, Text, StyleSheet } from 'react-native';
import { colors } from '../../themes/colors';
import { spacing, borderRadius } from '../../themes/spacing';
import { typography } from '../../themes/typography';

type Props = {
  active: 'dump' | 'refine' | 'prioritize';
  navigation: any;
  canRefine?: boolean;
  canPrioritize?: boolean;
};

export default function BrainDumpSubNav({ active, navigation, canRefine = true, canPrioritize = true }: Props) {
  const goDump = () => navigation.navigate('BrainDumpInput');
  const goRefine = () => { if (canRefine) { navigation.navigate('BrainDumpRefinement'); } };
  const goPrioritize = () => { if (canPrioritize) { navigation.navigate('BrainDumpPrioritization'); } };

  return (
    <View style={styles.container}>
      <NavBtn label="Dump" active={active==='dump'} onPress={goDump} />
      <NavBtn label="Refine" active={active==='refine'} onPress={goRefine} disabled={!canRefine} />
      <NavBtn label="Prioritize" active={active==='prioritize'} onPress={goPrioritize} disabled={!canPrioritize} />
    </View>
  );
}

function NavBtn({ label, active, onPress, disabled }: { label: string; active: boolean; onPress: ()=>void; disabled?: boolean }) {
  return (
    <TouchableOpacity onPress={onPress} activeOpacity={disabled ? 1 : 0.8} disabled={disabled} style={[styles.tab, active && styles.tabActive, disabled && styles.tabDisabled]}>
      <Text style={[styles.tabText, active && styles.tabTextActive, disabled && styles.tabTextDisabled]}>{label}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    marginHorizontal: spacing.md,
    marginBottom: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border.light,
    borderRadius: borderRadius.full,
    overflow: 'hidden',
    backgroundColor: colors.secondary,
  },
  tab: {
    flex: 1,
    paddingVertical: spacing.sm,
    alignItems: 'center',
    backgroundColor: colors.secondary,
  },
  tabActive: {
    backgroundColor: colors.primary,
  },
  tabText: {
    color: colors.text.primary,
    fontSize: typography.fontSize.sm,
  },
  tabTextActive: {
    color: colors.secondary,
    fontWeight: typography.fontWeight.bold as any,
  },
  tabDisabled: {
    opacity: 0.5,
  },
  tabTextDisabled: {
    color: colors.text.disabled,
  },
});


