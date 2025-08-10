import React, { useRef, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Animated } from 'react-native';
import { colors } from '../../themes/colors';
import { typography } from '../../themes/typography';
import { spacing } from '../../themes/spacing';
import { CalendarEvent, Task } from '../../types/calendar';
import { useScaleAnimation, triggerHaptic } from '../../utils/animations';

interface AnimatedEventCardProps {
  event: CalendarEvent | Task;
  index?: number;
  onPress?: () => void;
  onLongPress?: () => void;
  style?: any;
}

export const AnimatedEventCard: React.FC<AnimatedEventCardProps> = ({
  event,
  index = 0,
  onPress,
  onLongPress,
  style,
}) => {
  const { scale, scaleIn, scaleOut } = useScaleAnimation(1);
  const opacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(50)).current;

  useEffect(() => {
    // Stagger animation based on index
    Animated.parallel([
      Animated.timing(opacity, {
        toValue: 1,
        duration: 300,
        delay: index * 50,
        useNativeDriver: true,
      }),
      Animated.timing(translateY, {
        toValue: 0,
        duration: 300,
        delay: index * 50,
        useNativeDriver: true,
      }),
    ]).start();
  }, [index, opacity, translateY]);

  const handlePress = () => {
    scaleOut();
    triggerHaptic('light');
    setTimeout(() => {
      scaleIn();
      onPress?.();
    }, 100);
  };

  const handleLongPress = () => {
    triggerHaptic('medium');
    onLongPress?.();
  };

  const isTask = 'priority' in event;
  const priorityColors = {
    low: colors.success,
    medium: colors.warning,
    high: colors.error,
  };

  return (
    <Animated.View
      style={[
        styles.container,
        style,
        {
          opacity,
          transform: [
            { translateY },
            { scale },
          ],
        },
      ]}
    >
      <TouchableOpacity
        style={[
          styles.card,
          isTask && { borderLeftColor: priorityColors[event.priority] },
        ]}
        onPress={handlePress}
        onLongPress={handleLongPress}
        activeOpacity={0.8}
      >
        <View style={styles.header}>
          <Text style={styles.title} numberOfLines={1}>
            {isTask ? event.title : (event.title || event.summary || 'Untitled Event')}
          </Text>
          {isTask && (
            <View style={[styles.priorityBadge, { backgroundColor: priorityColors[event.priority] }]}>
              <Text style={styles.priorityText}>{event.priority}</Text>
            </View>
          )}
        </View>
        
        {event.description && (
          <Text style={styles.description} numberOfLines={2}>
            {event.description}
          </Text>
        )}
        
        <View style={styles.footer}>
          {isTask ? (
            <Text style={styles.statusText}>{event.status}</Text>
          ) : (
            <Text style={styles.timeText}>
              {event.start_time ? new Date(event.start_time).toLocaleTimeString() : 'All day'}
            </Text>
          )}
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: spacing.sm,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: 8,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border.light,
    borderLeftWidth: 4,
    borderLeftColor: colors.primary,
    shadowColor: colors.text.primary,
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  title: {
    fontSize: typography.fontSize.base,
    fontFamily: typography.fontFamily.medium,
    color: colors.text.primary,
    flex: 1,
    marginRight: spacing.sm,
  },
  priorityBadge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: 12,
  },
  priorityText: {
    fontSize: typography.fontSize.xs,
    fontFamily: typography.fontFamily.medium,
    color: colors.secondary,
    textTransform: 'uppercase',
  },
  description: {
    fontSize: typography.fontSize.sm,
    fontFamily: typography.fontFamily.regular,
    color: colors.text.secondary,
    marginBottom: spacing.sm,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  statusText: {
    fontSize: typography.fontSize.sm,
    fontFamily: typography.fontFamily.regular,
    color: colors.text.secondary,
    textTransform: 'capitalize',
  },
  timeText: {
    fontSize: typography.fontSize.sm,
    fontFamily: typography.fontFamily.regular,
    color: colors.text.secondary,
  },
}); 