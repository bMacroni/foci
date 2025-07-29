import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert,
  Platform,
  Switch,
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { colors } from '../../themes/colors';
import { spacing, borderRadius } from '../../themes/spacing';
import { typography } from '../../themes/typography';
import { Button } from '../common/Button';
import Icon from 'react-native-vector-icons/Octicons';

interface Task {
  id?: string;
  title: string;
  description?: string;
  priority: 'low' | 'medium' | 'high';
  status: 'not_started' | 'in_progress' | 'completed';
  due_date?: string;
  category?: string;
  goal_id?: string;
  estimated_duration_minutes?: number;
  // Auto-scheduling fields
  auto_schedule_enabled?: boolean;
  weather_dependent?: boolean;
  location?: string;
  preferred_time_windows?: string[];
  travel_time_minutes?: number;
}

interface Goal {
  id: string;
  title: string;
}

interface TaskFormProps {
  task?: Task;
  goals?: Goal[];
  onSave: (task: Partial<Task>) => void;
  onCancel: () => void;
  loading?: boolean;
}

export const TaskForm: React.FC<TaskFormProps> = ({
  task,
  goals = [],
  onSave,
  onCancel,
  loading = false,
}) => {
  const [formData, setFormData] = useState<Partial<Task>>({
    title: '',
    description: '',
    priority: 'medium',
    status: 'not_started',
    due_date: undefined,
    category: '',
    goal_id: undefined,
    estimated_duration_minutes: undefined,
    // Auto-scheduling defaults
    auto_schedule_enabled: false,
    weather_dependent: false,
    location: '',
    preferred_time_windows: [],
    travel_time_minutes: undefined,
  });

  const [showDatePicker, setShowDatePicker] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);

  useEffect(() => {
    if (task) {
      setFormData({
        ...task,
        due_date: task.due_date ? new Date(task.due_date).toISOString() : undefined,
        // Ensure auto-scheduling fields are included
        auto_schedule_enabled: task.auto_schedule_enabled ?? false,
        weather_dependent: task.weather_dependent ?? false,
        location: task.location ?? '',
        preferred_time_windows: task.preferred_time_windows ?? [],
        travel_time_minutes: task.travel_time_minutes,
      });
      if (task.due_date) {
        setSelectedDate(new Date(task.due_date));
      }
    }
  }, [task]);

  const handleInputChange = (field: keyof Task, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleDateChange = (event: any, date?: Date) => {
    setShowDatePicker(Platform.OS === 'ios');
    if (date) {
      setSelectedDate(date);
      handleInputChange('due_date', date.toISOString());
    }
  };

  const handleSave = () => {
    if (!formData.title?.trim()) {
      Alert.alert('Error', 'Task title is required');
      return;
    }

    onSave(formData);
  };

  const clearDueDate = () => {
    setSelectedDate(null);
    handleInputChange('due_date', undefined);
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString();
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high':
        return colors.error;
      case 'medium':
        return colors.warning;
      default:
        return colors.success;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return colors.success;
      case 'in_progress':
        return colors.warning;
      default:
        return colors.info;
    }
  };

  const renderSwitch = (
    label: string,
    value: boolean,
    onValueChange: (value: boolean) => void,
    description?: string
  ) => (
    <View style={styles.switchGroup}>
      <View style={styles.switchHeader}>
        <Text style={styles.switchLabel}>{label}</Text>
        <Switch
          value={value}
          onValueChange={onValueChange}
          trackColor={{ false: colors.border.light, true: colors.primary }}
          thumbColor={colors.secondary}
        />
      </View>
      {description && (
        <Text style={styles.switchDescription}>{description}</Text>
      )}
    </View>
  );

  const renderTimeWindowSelector = () => {
    const timeWindows = [
      { label: 'Morning (9 AM - 12 PM)', value: 'morning' },
      { label: 'Afternoon (12 PM - 5 PM)', value: 'afternoon' },
      { label: 'Evening (5 PM - 9 PM)', value: 'evening' },
      { label: 'Flexible', value: 'flexible' },
    ];

    return (
      <View style={styles.field}>
        <Text style={styles.label}>Preferred Time Windows</Text>
        <View style={styles.timeWindowsContainer}>
          {timeWindows.map((window) => (
            <TouchableOpacity
              key={window.value}
              style={[
                styles.timeWindowButton,
                formData.preferred_time_windows?.includes(window.value) && 
                styles.timeWindowButtonSelected
              ]}
              onPress={() => {
                const currentWindows = formData.preferred_time_windows || [];
                const newWindows = currentWindows.includes(window.value)
                  ? currentWindows.filter(w => w !== window.value)
                  : [...currentWindows, window.value];
                handleInputChange('preferred_time_windows', newWindows);
              }}
            >
              <Text style={[
                styles.timeWindowText,
                formData.preferred_time_windows?.includes(window.value) && 
                styles.timeWindowTextSelected
              ]}>
                {window.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>
    );
  };

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <View style={styles.content}>
        <Text style={styles.title}>
          {task ? 'Edit Task' : 'Create New Task'}
        </Text>

        {/* Title */}
        <View style={styles.field}>
          <Text style={styles.label}>Title *</Text>
          <TextInput
            style={styles.textInput}
            value={formData.title}
            onChangeText={(text) => handleInputChange('title', text)}
            placeholder="Enter task title"
            placeholderTextColor={colors.text.disabled}
          />
        </View>

        {/* Description */}
        <View style={styles.field}>
          <Text style={styles.label}>Description</Text>
          <TextInput
            style={[styles.textInput, styles.textArea]}
            value={formData.description}
            onChangeText={(text) => handleInputChange('description', text)}
            placeholder="Enter task description"
            placeholderTextColor={colors.text.disabled}
            multiline
            numberOfLines={4}
            textAlignVertical="top"
          />
        </View>

        {/* Status */}
        <View style={styles.field}>
          <Text style={styles.label}>Status</Text>
          <View style={styles.segmentedControl}>
            {(['not_started', 'in_progress', 'completed'] as const).map((status) => (
              <TouchableOpacity
                key={status}
                style={[
                  styles.segment,
                  formData.status === status && {
                    backgroundColor: getStatusColor(status),
                  },
                ]}
                onPress={() => handleInputChange('status', status)}
              >
                <Text
                  style={[
                    styles.segmentText,
                    formData.status === status && styles.segmentTextActive,
                  ]}
                >
                  {status === 'not_started' ? 'Not Started' : 
                   status === 'in_progress' ? 'In Progress' : 'Completed'}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Priority */}
        <View style={styles.field}>
          <Text style={styles.label}>Priority</Text>
          <View style={styles.segmentedControl}>
            {(['low', 'medium', 'high'] as const).map((priority) => (
              <TouchableOpacity
                key={priority}
                style={[
                  styles.segment,
                  formData.priority === priority && {
                    backgroundColor: getPriorityColor(priority),
                  },
                ]}
                onPress={() => handleInputChange('priority', priority)}
              >
                <Text
                  style={[
                    styles.segmentText,
                    formData.priority === priority && styles.segmentTextActive,
                  ]}
                >
                  {priority.charAt(0).toUpperCase() + priority.slice(1)}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Due Date */}
        <View style={styles.field}>
          <Text style={styles.label}>Due Date</Text>
          <View style={styles.dateContainer}>
            <TouchableOpacity
              style={styles.dateButton}
              onPress={() => setShowDatePicker(true)}
            >
              <Text style={styles.dateButtonText}>
                {selectedDate ? formatDate(selectedDate) : 'Select date'}
              </Text>
            </TouchableOpacity>
            {selectedDate && (
              <TouchableOpacity
                style={styles.clearDateButton}
                onPress={clearDueDate}
              >
                <Text style={styles.clearDateText}>Clear</Text>
              </TouchableOpacity>
            )}
          </View>
          {showDatePicker && (
            <DateTimePicker
              value={selectedDate || new Date()}
              mode="date"
              display="default"
              onChange={handleDateChange}
              minimumDate={new Date()}
            />
          )}
        </View>

        {/* Category */}
        <View style={styles.field}>
          <Text style={styles.label}>Category</Text>
          <TextInput
            style={styles.textInput}
            value={formData.category}
            onChangeText={(text) => handleInputChange('category', text)}
            placeholder="Enter category"
            placeholderTextColor={colors.text.disabled}
          />
        </View>

        {/* Goal */}
        {goals.length > 0 && (
          <View style={styles.field}>
            <Text style={styles.label}>Linked Goal</Text>
            <View style={styles.pickerContainer}>
              <TouchableOpacity
                style={styles.pickerButton}
                onPress={() => {
                  // Show goal picker
                  const goalOptions = [
                    { label: 'No Goal', value: '' },
                    ...goals.map(goal => ({ label: goal.title, value: goal.id })),
                  ];
                  
                  Alert.alert(
                    'Select Goal',
                    'Choose a goal to link to this task',
                    [
                      ...goalOptions.map(option => ({
                        text: option.label,
                        onPress: () => handleInputChange('goal_id', option.value || undefined),
                      })),
                      { text: 'Cancel', style: 'cancel' },
                    ]
                  );
                }}
              >
                <Text style={styles.pickerButtonText}>
                  {formData.goal_id 
                    ? goals.find(g => g.id === formData.goal_id)?.title || 'Unknown Goal'
                    : 'Select a goal'
                  }
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Estimated Duration */}
        <View style={styles.field}>
          <Text style={styles.label}>Estimated Duration (minutes)</Text>
          <TextInput
            style={styles.textInput}
            value={formData.estimated_duration_minutes?.toString() || ''}
            onChangeText={(text) => {
              const value = parseInt(text) || undefined;
              handleInputChange('estimated_duration_minutes', value);
            }}
            placeholder="Enter estimated duration"
            placeholderTextColor={colors.text.disabled}
            keyboardType="numeric"
          />
        </View>

        {/* Auto-Scheduling Section */}
        <View style={styles.autoScheduleSection}>
          <Text style={styles.sectionTitle}>Auto-Scheduling</Text>
          
          {renderSwitch(
            'Enable Auto-Scheduling',
            formData.auto_schedule_enabled || false,
            (value) => handleInputChange('auto_schedule_enabled', value),
            'Automatically schedule this task based on your preferences'
          )}

          {formData.auto_schedule_enabled && (
            <>
              {/* Location */}
              <View style={styles.field}>
                <Text style={styles.label}>Location</Text>
                <View style={styles.locationInputContainer}>
                  <Icon name="location" size={16} color={colors.text.secondary} />
                  <TextInput
                    style={styles.locationInput}
                    value={formData.location}
                    onChangeText={(text) => handleInputChange('location', text)}
                    placeholder="Enter location (optional)"
                    placeholderTextColor={colors.text.disabled}
                  />
                </View>
              </View>

              {/* Weather Dependency */}
              {renderSwitch(
                'Weather Dependent',
                formData.weather_dependent || false,
                (value) => handleInputChange('weather_dependent', value),
                'Only schedule when weather is suitable for outdoor tasks'
              )}

              {/* Preferred Time Windows */}
              {renderTimeWindowSelector()}
            </>
          )}
        </View>

        {/* Action Buttons */}
        <View style={styles.actions}>
          <Button
            title="Cancel"
            onPress={onCancel}
            variant="outline"
            style={styles.cancelButton}
          />
          <Button
            title={task ? 'Update Task' : 'Create Task'}
            onPress={handleSave}
            loading={loading}
            style={styles.saveButton}
          />
        </View>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    padding: spacing.md,
  },
  title: {
    fontSize: typography.fontSize['2xl'],
    fontWeight: typography.fontWeight.bold as any,
    color: colors.text.primary,
    marginBottom: spacing.lg,
    textAlign: 'center',
  },
  field: {
    marginBottom: spacing.lg,
  },
  label: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.medium as any,
    color: colors.text.primary,
    marginBottom: spacing.xs,
  },
  textInput: {
    borderWidth: 1,
    borderColor: colors.border.medium,
    borderRadius: borderRadius.md,
    padding: spacing.sm,
    fontSize: typography.fontSize.base,
    color: colors.text.primary,
    backgroundColor: colors.background,
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  segmentedControl: {
    flexDirection: 'row',
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.border.medium,
    overflow: 'hidden',
  },
  segment: {
    flex: 1,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.xs,
    alignItems: 'center',
    backgroundColor: colors.surface,
  },
  segmentText: {
    fontSize: typography.fontSize.sm,
    color: colors.text.secondary,
    fontWeight: typography.fontWeight.medium as any,
  },
  segmentTextActive: {
    color: colors.secondary,
    fontWeight: typography.fontWeight.bold as any,
  },
  dateContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  dateButton: {
    flex: 1,
    borderWidth: 1,
    borderColor: colors.border.medium,
    borderRadius: borderRadius.md,
    padding: spacing.sm,
    backgroundColor: colors.background,
  },
  dateButtonText: {
    fontSize: typography.fontSize.base,
    color: colors.text.primary,
  },
  clearDateButton: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.sm,
  },
  clearDateText: {
    fontSize: typography.fontSize.sm,
    color: colors.error,
    fontWeight: typography.fontWeight.medium as any,
  },
  pickerContainer: {
    borderWidth: 1,
    borderColor: colors.border.medium,
    borderRadius: borderRadius.md,
    backgroundColor: colors.background,
  },
  pickerButton: {
    padding: spacing.sm,
  },
  pickerButtonText: {
    fontSize: typography.fontSize.base,
    color: colors.text.primary,
  },
  // Auto-scheduling styles
  autoScheduleSection: {
    marginTop: spacing.xl,
    paddingTop: spacing.lg,
    borderTopWidth: 1,
    borderTopColor: colors.border.light,
  },
  sectionTitle: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.semibold as any,
    color: colors.text.primary,
    marginBottom: spacing.md,
  },
  switchGroup: {
    marginBottom: spacing.md,
  },
  switchHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  switchLabel: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.medium as any,
    color: colors.text.primary,
    flex: 1,
  },
  switchDescription: {
    fontSize: typography.fontSize.sm,
    color: colors.text.secondary,
    lineHeight: typography.lineHeight.normal * typography.fontSize.sm,
  },
  locationInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border.medium,
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.sm,
    backgroundColor: colors.background,
  },
  locationInput: {
    flex: 1,
    paddingVertical: spacing.sm,
    fontSize: typography.fontSize.base,
    color: colors.text.primary,
    marginLeft: spacing.xs,
  },
  timeWindowsContainer: {
    gap: spacing.xs,
  },
  timeWindowButton: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.sm,
    borderWidth: 1,
    borderColor: colors.border.light,
    backgroundColor: colors.surface,
  },
  timeWindowButtonSelected: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  timeWindowText: {
    fontSize: typography.fontSize.sm,
    color: colors.text.secondary,
    fontWeight: typography.fontWeight.medium as any,
  },
  timeWindowTextSelected: {
    color: colors.secondary,
  },
  actions: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.xl,
  },
  cancelButton: {
    flex: 1,
  },
  saveButton: {
    flex: 1,
  },
});
