import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { colors } from '../../themes/colors';
import { typography } from '../../themes/typography';
import { spacing } from '../../themes/spacing';

interface GoalDueCardProps {
  goal: any;
  onPress?: (goalId: string) => void;
}

export const GoalDueCard: React.FC<GoalDueCardProps> = ({ goal, onPress }) => {
  const { title, description } = goal || {};

  // Derive current milestone and next step from goal.milestones
  const computeMilestoneAndStep = () => {
    const milestones = goal?.milestones || [];
    if (!milestones.length) {return { milestoneTitle: undefined, nextStep: undefined };}
    const active = milestones.find((m: any) => (m?.steps || []).some((s: any) => !s.completed)) || milestones[0];
    const milestoneTitle = active?.title;
    const step = (active?.steps || []).find((s: any) => !s.completed) || (active?.steps || [])[0];
    const nextStep = step?.text || step?.title;
    return { milestoneTitle, nextStep };
  };

  const { milestoneTitle, nextStep } = computeMilestoneAndStep();

  return (
    <TouchableOpacity
      activeOpacity={0.85}
      onPress={() => onPress?.(goal.id)}
      style={[styles.card, { borderLeftColor: colors.warning }]}
    >
      <View style={styles.headerRow}>
        <Text style={styles.title} numberOfLines={2}>Goal Due</Text>
        <View style={styles.badge}><Text style={styles.badgeText}>Due Today</Text></View>
      </View>
      <Text style={styles.goalTitle} numberOfLines={2}>{title}</Text>
      {description ? (
        <Text style={styles.description} numberOfLines={2}>{description}</Text>
      ) : null}
      {milestoneTitle ? (
        <View style={styles.meta}>
          <Text style={styles.metaLabel}>Current Milestone</Text>
          <Text style={styles.metaValue} numberOfLines={2}>{milestoneTitle}</Text>
        </View>
      ) : null}
      {nextStep ? (
        <View style={styles.meta}>
          <Text style={styles.metaLabel}>Next Step</Text>
          <Text style={styles.metaValue} numberOfLines={2}>{nextStep}</Text>
        </View>
      ) : null}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: spacing.sm,
    padding: spacing.md,
    marginBottom: spacing.sm,
    borderLeftWidth: 4,
    shadowColor: colors.text.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.xs,
  },
  title: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.medium as any,
    color: colors.text.secondary,
  },
  badge: {
    backgroundColor: colors.warning,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: spacing.xs,
  },
  badgeText: {
    fontSize: typography.fontSize.xs,
    color: colors.secondary,
    fontWeight: typography.fontWeight.medium as any,
  },
  goalTitle: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.bold as any,
    color: colors.text.primary,
    marginBottom: spacing.xs,
  },
  description: {
    fontSize: typography.fontSize.sm,
    color: colors.text.secondary,
    marginBottom: spacing.sm,
  },
  meta: {
    marginTop: spacing.xs,
  },
  metaLabel: {
    fontSize: typography.fontSize.xs,
    color: colors.text.secondary,
  },
  metaValue: {
    fontSize: typography.fontSize.sm,
    color: colors.text.primary,
    fontWeight: typography.fontWeight.medium as any,
  },
});


