import React from 'react';
import { View, StyleSheet, Animated } from 'react-native';
import { colors } from '../../themes/colors';
import { spacing } from '../../themes/spacing';

interface EventCardSkeletonProps {
  compact?: boolean;
}

export const EventCardSkeleton: React.FC<EventCardSkeletonProps> = ({ compact = false }) => {
  const animatedValue = React.useRef(new Animated.Value(0)).current;

  React.useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(animatedValue, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(animatedValue, {
          toValue: 0,
          duration: 1000,
          useNativeDriver: true,
        }),
      ])
    );
    animation.start();
    return () => animation.stop();
  }, [animatedValue]);

  const opacity = animatedValue.interpolate({
    inputRange: [0, 1],
    outputRange: [0.3, 0.7],
  });

  if (compact) {
    return (
      <View style={styles.compactCard}>
        <Animated.View style={[styles.compactSkeleton, { opacity }]}>
          <View style={styles.compactTitleSkeleton} />
          <View style={styles.compactTimeSkeleton} />
        </Animated.View>
      </View>
    );
  }

  return (
    <View style={styles.card}>
      <Animated.View style={[styles.skeleton, { opacity }]}>
        <View style={styles.header}>
          <View style={styles.titleContainer}>
            <View style={styles.titleSkeleton} />
            <View style={styles.statusSkeleton} />
          </View>
          <View style={styles.timeSkeleton} />
        </View>
        <View style={styles.descriptionSkeleton} />
        <View style={styles.taskInfo}>
          <View style={styles.prioritySkeleton} />
          <View style={styles.statusTextSkeleton} />
        </View>
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: spacing.sm,
    marginBottom: spacing.sm,
    borderLeftWidth: 4,
    borderLeftColor: colors.border.light,
    padding: spacing.md,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  skeleton: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.sm,
  },
  titleContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  titleSkeleton: {
    height: 18,
    width: '70%',
    backgroundColor: colors.border.light,
    borderRadius: spacing.xs,
    marginRight: spacing.sm,
  },
  statusSkeleton: {
    height: 12,
    width: 12,
    backgroundColor: colors.border.light,
    borderRadius: 6,
  },
  timeSkeleton: {
    height: 14,
    width: 60,
    backgroundColor: colors.border.light,
    borderRadius: spacing.xs,
  },
  descriptionSkeleton: {
    height: 14,
    width: '90%',
    backgroundColor: colors.border.light,
    borderRadius: spacing.xs,
    marginBottom: spacing.sm,
  },
  taskInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  prioritySkeleton: {
    height: 16,
    width: 50,
    backgroundColor: colors.border.light,
    borderRadius: spacing.xs,
    marginRight: spacing.sm,
  },
  statusTextSkeleton: {
    height: 14,
    width: 80,
    backgroundColor: colors.border.light,
    borderRadius: spacing.xs,
  },
  compactCard: {
    backgroundColor: colors.surface,
    borderRadius: spacing.xs,
    marginBottom: spacing.xs,
    borderLeftWidth: 3,
    borderLeftColor: colors.border.light,
    padding: spacing.sm,
  },
  compactSkeleton: {
    flex: 1,
  },
  compactTitleSkeleton: {
    height: 14,
    width: '80%',
    backgroundColor: colors.border.light,
    borderRadius: spacing.xs,
    marginBottom: spacing.xs,
  },
  compactTimeSkeleton: {
    height: 12,
    width: '40%',
    backgroundColor: colors.border.light,
    borderRadius: spacing.xs,
  },
}); 