import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated } from 'react-native';
import { colors } from '../../themes/colors';
import { spacing } from '../../themes/spacing';
import { skeletonAnimation } from '../../utils/animations';

interface LoadingSkeletonProps {
  type: 'event' | 'task' | 'list';
  count?: number;
}

export const LoadingSkeleton: React.FC<LoadingSkeletonProps> = ({ 
  type, 
  count = 3 
}) => {
  const opacity = useRef(new Animated.Value(0.3)).current;

  useEffect(() => {
    skeletonAnimation(opacity).start();
  }, []);

  const renderEventSkeleton = () => (
    <View style={styles.eventSkeleton}>
      <View style={styles.eventHeader}>
        <Animated.View style={[styles.titleSkeleton, { opacity }]} />
        <Animated.View style={[styles.timeSkeleton, { opacity }]} />
      </View>
      <Animated.View style={[styles.descriptionSkeleton, { opacity }]} />
      <Animated.View style={[styles.descriptionSkeleton, { width: '60%', opacity }]} />
    </View>
  );

  const renderTaskSkeleton = () => (
    <View style={styles.taskSkeleton}>
      <View style={styles.taskHeader}>
        <Animated.View style={[styles.titleSkeleton, { opacity }]} />
        <Animated.View style={[styles.prioritySkeleton, { opacity }]} />
      </View>
      <Animated.View style={[styles.descriptionSkeleton, { opacity }]} />
      <View style={styles.taskFooter}>
        <Animated.View style={[styles.dateSkeleton, { opacity }]} />
        <Animated.View style={[styles.statusSkeleton, { opacity }]} />
      </View>
    </View>
  );

  const renderListSkeleton = () => (
    <View style={styles.listSkeleton}>
      <Animated.View style={[styles.listItemSkeleton, { opacity }]} />
      <Animated.View style={[styles.listItemSkeleton, { opacity }]} />
      <Animated.View style={[styles.listItemSkeleton, { opacity }]} />
    </View>
  );

  const renderSkeleton = () => {
    switch (type) {
      case 'event':
        return renderEventSkeleton();
      case 'task':
        return renderTaskSkeleton();
      case 'list':
        return renderListSkeleton();
      default:
        return renderEventSkeleton();
    }
  };

  return (
    <View style={styles.container}>
      {Array.from({ length: count }).map((_, index) => (
        <View key={index} style={styles.skeletonItem}>
          {renderSkeleton()}
        </View>
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: spacing.md,
  },
  skeletonItem: {
    marginBottom: spacing.md,
  },
  eventSkeleton: {
    backgroundColor: colors.surface,
    borderRadius: 8,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border.light,
  },
  eventHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  titleSkeleton: {
    height: 16,
    backgroundColor: colors.border.medium,
    borderRadius: 4,
    flex: 1,
    marginRight: spacing.sm,
  },
  timeSkeleton: {
    height: 12,
    width: 60,
    backgroundColor: colors.border.medium,
    borderRadius: 4,
  },
  descriptionSkeleton: {
    height: 12,
    backgroundColor: colors.border.medium,
    borderRadius: 4,
    marginBottom: spacing.xs,
  },
  taskSkeleton: {
    backgroundColor: colors.surface,
    borderRadius: 8,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border.light,
  },
  taskHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  prioritySkeleton: {
    height: 20,
    width: 40,
    backgroundColor: colors.border.medium,
    borderRadius: 10,
  },
  taskFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: spacing.sm,
  },
  dateSkeleton: {
    height: 12,
    width: 80,
    backgroundColor: colors.border.medium,
    borderRadius: 4,
  },
  statusSkeleton: {
    height: 12,
    width: 60,
    backgroundColor: colors.border.medium,
    borderRadius: 4,
  },
  listSkeleton: {
    backgroundColor: colors.surface,
    borderRadius: 8,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border.light,
  },
  listItemSkeleton: {
    height: 12,
    backgroundColor: colors.border.medium,
    borderRadius: 4,
    marginBottom: spacing.sm,
  },
}); 