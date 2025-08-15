import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Alert,
} from 'react-native';
import { PanGestureHandler, State } from 'react-native-gesture-handler';
import { colors } from '../../themes/colors';
import { spacing, borderRadius } from '../../themes/spacing';
import { typography } from '../../themes/typography';
import Icon from 'react-native-vector-icons/Octicons';

interface Task {
  id: string;
  title: string;
  description?: string;
  priority: 'low' | 'medium' | 'high';
  status: 'not_started' | 'in_progress' | 'completed';
  due_date?: string;
  category?: string;
  goal?: {
    id: string;
    title: string;
  };
  // Auto-scheduling fields
  auto_schedule_enabled?: boolean;
  weather_dependent?: boolean;
  location?: string;
  travel_time_minutes?: number;
}

interface TaskCardProps {
  task: Task;
  onPress: (task: Task) => void;
  onDelete: (taskId: string) => void;
  onToggleStatus: (taskId: string, newStatus: 'not_started' | 'in_progress' | 'completed') => void;
  onAddToCalendar: (taskId: string) => void;
  onToggleAutoSchedule?: (taskId: string, enabled: boolean) => void;
  onScheduleNow?: (taskId: string) => void;
}

export const TaskCard: React.FC<TaskCardProps> = ({
  task,
  onPress,
  onDelete,
  onToggleStatus,
  onAddToCalendar,
  onToggleAutoSchedule,
  onScheduleNow,
}) => {
  const translateX = new Animated.Value(0);
  const [_isDeleting, _setIsDeleting] = React.useState(false);

  // helpers retained for future UI variants
   
  const _getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return colors.success;
      case 'in_progress':
        return colors.warning;
      default:
        return colors.info;
    }
  };

  const _getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high':
        return colors.error;
      case 'medium':
        return colors.warning;
      default:
        return colors.success;
    }
  };

  const _getStatusText = (status: string) => {
    switch (status) {
      case 'completed':
        return 'Completed';
      case 'in_progress':
        return 'In Progress';
      default:
        return 'Not Started';
    }
  };

  const _getPriorityText = (priority: string) => {
    if (!priority) {return 'Low';}
    return priority.charAt(0).toUpperCase() + priority.slice(1);
  };

  const formatDueDate = (dueDate?: string) => {
    if (!dueDate) {return null;}
    const date = new Date(dueDate);
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    if (date.toDateString() === today.toDateString()) {
      return 'Today';
    } else if (date.toDateString() === tomorrow.toDateString()) {
      return 'Tomorrow';
    } else {
      return date.toLocaleDateString();
    }
  };

  const formatScheduledTime = (dueDate?: string) => {
    if (!dueDate) {return null;}
    const date = new Date(dueDate);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const handleGestureEvent = Animated.event(
    [{ nativeEvent: { translationX: translateX } }],
    { useNativeDriver: false }
  );

  const handleStateChange = (event: any) => {
    if (event.nativeEvent.state === State.END) {
      const { translationX } = event.nativeEvent;
      
      if (translationX < -150) {
        // Swipe left - delete
        Alert.alert(
          'Delete Task',
          'Are you sure you want to delete this task?',
          [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Delete', style: 'destructive', onPress: () => onDelete(task.id) },
          ]
        );
      } else if (translationX > 150) {
        // Swipe right - toggle status
        const newStatus = task.status === 'completed' ? 'not_started' : 'completed';
        onToggleStatus(task.id, newStatus);
      }
      
      // Reset position
      Animated.spring(translateX, {
        toValue: 0,
        useNativeDriver: false,
      }).start();
    }
  };

  const _getNextStatus = () => {
    switch (task.status) {
      case 'not_started':
        return 'in_progress';
      case 'in_progress':
        return 'completed';
      default:
        return 'not_started';
    }
  };
   

  const handleToggleAutoSchedule = () => {
    if (onToggleAutoSchedule) {
      onToggleAutoSchedule(task.id, !task.auto_schedule_enabled);
    }
  };

  const handleScheduleNow = () => {
    if (onScheduleNow) {
      onScheduleNow(task.id);
    }
  };

  return (
    <View style={styles.container}>
      <PanGestureHandler
        onGestureEvent={handleGestureEvent}
        onHandlerStateChange={handleStateChange}
        activeOffsetX={[-20, 20]}
        failOffsetY={[-10, 10]}
        shouldCancelWhenOutside={true}
      >
        <Animated.View
          style={[
            styles.card,
            {
              transform: [{ translateX }],
            },
          ]}
        >
          <TouchableOpacity
            style={styles.content}
            onPress={() => onPress(task)}
            activeOpacity={0.7}
          >
            <View style={styles.header}>
              <Text 
                style={[
                  styles.title, 
                  task.status === 'completed' && styles.completedTitle
                ]} 
                numberOfLines={2}
              >
                {task.title}
              </Text>
              <View style={styles.headerRight}>
                {task.due_date && (
                  <Text style={styles.dueDate}>
                    {formatDueDate(task.due_date)}
                  </Text>
                )}
                <TouchableOpacity
                  style={styles.calendarButton}
                  onPress={() => onAddToCalendar(task.id)}
                  activeOpacity={0.7}
                >
                  <Icon name="calendar" size={20} color={colors.text.secondary} />
                </TouchableOpacity>
              </View>
            </View>

            {/* Auto-scheduling controls */}
            <View style={styles.autoScheduleSection}>
              <View style={styles.autoScheduleRow}>
                <TouchableOpacity
                  style={[
                    styles.autoScheduleToggle,
                    task.status === 'completed' && styles.autoScheduleToggleDisabled
                  ]}
                  onPress={handleToggleAutoSchedule}
                  activeOpacity={0.7}
                  disabled={task.status === 'completed'}
                >
                  <Icon 
                    name={task.auto_schedule_enabled ? "check-circle" : "circle"} 
                    size={20} 
                    color={task.status === 'completed' ? colors.text.disabled : (task.auto_schedule_enabled ? colors.primary : colors.text.disabled)} 
                  />
                  <Text style={[
                    styles.autoScheduleText,
                    task.auto_schedule_enabled && styles.autoScheduleTextEnabled,
                    task.status === 'completed' && styles.autoScheduleTextDisabled
                  ]}>
                    Auto-schedule
                  </Text>
                </TouchableOpacity>

                {task.auto_schedule_enabled && task.status !== 'completed' && (
                  <TouchableOpacity
                    style={styles.scheduleNowButton}
                    onPress={handleScheduleNow}
                    activeOpacity={0.7}
                  >
                    <Icon name="clock" size={16} color={colors.primary} />
                    <Text style={styles.scheduleNowText}>Schedule Now</Text>
                  </TouchableOpacity>
                )}
              </View>

              {/* Scheduled time display */}
              {task.due_date && task.auto_schedule_enabled && (
                <View style={styles.scheduledTimeRow}>
                  <Icon name="clock" size={14} color={colors.text.secondary} />
                  <Text style={styles.scheduledTimeText}>
                    Scheduled for {formatScheduledTime(task.due_date)}
                  </Text>
                </View>
              )}

              {/* Weather dependency indicator */}
              {task.weather_dependent && (
                <View style={styles.weatherIndicator}>
                  <Icon name="cloud" size={14} color={colors.text.secondary} />
                  <Text style={styles.weatherText}>Weather dependent</Text>
                </View>
              )}

              {/* Location indicator */}
              {task.location && (
                <View style={styles.locationIndicator}>
                  <Icon name="location" size={14} color={colors.text.secondary} />
                  <Text style={styles.locationText}>{task.location}</Text>
                </View>
              )}
            </View>
          </TouchableOpacity>
        </Animated.View>
      </PanGestureHandler>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: spacing.sm,
  },
  card: {
    backgroundColor: colors.background.surface,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.border.light,
    shadowColor: colors.primary,
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  content: {
    padding: spacing.md,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.sm,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  title: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.semibold as any,
    color: colors.text.primary,
    flex: 1,
    marginRight: spacing.sm,
  },
  completedTitle: {
    textDecorationLine: 'line-through',
    color: colors.text.disabled,
  },
  badges: {
    flexDirection: 'row',
    gap: spacing.xs,
  },
  statusBadge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.full,
  },
  priorityBadge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.full,
  },
  badgeText: {
    color: colors.secondary,
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.medium as any,
  },
  description: {
    fontSize: typography.fontSize.sm,
    color: colors.text.secondary,
    marginBottom: spacing.sm,
    lineHeight: typography.lineHeight.normal * typography.fontSize.sm,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  dueDate: {
    fontSize: typography.fontSize.xs,
    color: colors.text.disabled,
  },
  calendarButton: {
    padding: spacing.xs,
    borderRadius: borderRadius.sm,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border.light,
  },
  goalBadge: {
    backgroundColor: colors.surface,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.full,
    borderWidth: 1,
    borderColor: colors.border.light,
  },
  goalText: {
    fontSize: typography.fontSize.xs,
    color: colors.text.secondary,
    fontWeight: typography.fontWeight.medium as any,
  },
  // Auto-scheduling styles
  autoScheduleSection: {
    marginTop: spacing.sm,
    paddingTop: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.border.light,
  },
  autoScheduleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  autoScheduleToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  autoScheduleToggleDisabled: {
    opacity: 0.5,
  },
  autoScheduleText: {
    fontSize: typography.fontSize.sm,
    color: colors.text.disabled,
    fontWeight: typography.fontWeight.medium as any,
  },
  autoScheduleTextEnabled: {
    color: colors.text.primary,
  },
  autoScheduleTextDisabled: {
    color: colors.text.disabled,
  },
  scheduleNowButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    backgroundColor: colors.surface,
    borderRadius: borderRadius.sm,
    borderWidth: 1,
    borderColor: colors.border.light,
  },
  scheduleNowText: {
    fontSize: typography.fontSize.xs,
    color: colors.primary,
    fontWeight: typography.fontWeight.medium as any,
  },
  scheduledTimeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginBottom: spacing.xs,
  },
  scheduledTimeText: {
    fontSize: typography.fontSize.xs,
    color: colors.text.secondary,
  },
  weatherIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginBottom: spacing.xs,
  },
  weatherText: {
    fontSize: typography.fontSize.xs,
    color: colors.text.secondary,
  },
  locationIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  locationText: {
    fontSize: typography.fontSize.xs,
    color: colors.text.secondary,
  },
});
