import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Modal,
  Alert,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { colors } from '../../themes/colors';
import { spacing, borderRadius } from '../../themes/spacing';
import { typography } from '../../themes/typography';
import { TaskCard } from '../../components/tasks/TaskCard';
import { TaskForm } from '../../components/tasks/TaskForm';
import { AutoSchedulingPreferencesModal } from '../../components/tasks/AutoSchedulingPreferencesModal';
import { SuccessToast } from '../../components/common/SuccessToast';
import { tasksAPI, goalsAPI, calendarAPI, autoSchedulingAPI } from '../../services/api';
import { offlineService } from '../../services/offline';
import Icon from 'react-native-vector-icons/Octicons';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface Task {
  id: string;
  title: string;
  description?: string;
  priority: 'low' | 'medium' | 'high';
  status: 'not_started' | 'in_progress' | 'completed';
  due_date?: string;
  category?: string;
  goal_id?: string;
  estimated_duration_minutes?: number;
  is_today_focus?: boolean;
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

interface Goal {
  id: string;
  title: string;
}

export const TasksScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [goals, setGoals] = useState<Goal[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | undefined>();
  const [saving, setSaving] = useState(false);
  const [bulkScheduling, setBulkScheduling] = useState(false);
  const [showPreferencesModal, setShowPreferencesModal] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [toastScheduledTime, setToastScheduledTime] = useState<string | undefined>();
  const [toastCalendarEvent, setToastCalendarEvent] = useState(false);
  const [showInbox, setShowInbox] = useState(false);
  const [selectingFocus, setSelectingFocus] = useState(false);
  const [showEodPrompt, setShowEodPrompt] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  // Auto refresh whenever the Tasks tab/screen gains focus (silent background refresh)
  useFocusEffect(
    React.useCallback(() => {
      // Avoid showing a spinner if we already have content; fetch fresh in background
      loadData({ silent: true });
      return () => {};
    }, [])
  );

  const loadData = async (options?: { silent?: boolean }) => {
    const silent = !!options?.silent;
    try {
      // Paint from cache immediately if available
      const [cachedTasks, cachedGoals] = await Promise.all([
        offlineService.getCachedTasks(),
        offlineService.getCachedGoals(),
      ]);
      let paintedFromCache = false;
      if (cachedTasks && Array.isArray(cachedTasks)) {
        setTasks(cachedTasks as any);
        paintedFromCache = true;
      }
      if (cachedGoals && Array.isArray(cachedGoals)) {
        setGoals(cachedGoals as any);
        paintedFromCache = true;
      }
      if (paintedFromCache) {
        // Dismiss spinner immediately; we will refresh in background
        setLoading(false);
      } else {
        if (!silent) {setLoading(true);}
      }

      // Fetch fresh in parallel
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 15000);
      const [tasksData, goalsData] = await Promise.all([
        tasksAPI.getTasks(controller.signal as any),
        goalsAPI.getGoals(controller.signal as any),
      ]).finally(() => clearTimeout(timeout));
      setTasks(tasksData);
      setGoals(goalsData);
      // Cache raw responses
      try {
        await Promise.all([
          offlineService.cacheTasks(tasksData as any),
          offlineService.cacheGoals(goalsData as any),
        ]);
      } catch {}
    } catch (error) {
      if ((error as any)?.name === 'AbortError') {
        console.warn('Tasks/Goals fetch aborted due to timeout');
        // Keep whatever cache we already showed; avoid alert
        return;
      }
      console.error('Error loading data:', error);
      Alert.alert('Error', 'Failed to load tasks and goals');
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  // Honor cross-screen refresh hints
  useEffect(() => {
    (async () => {
      try {
        const flag = await AsyncStorage.getItem('needsTasksRefresh');
        if (flag === '1') {
          await loadData({ silent: true });
          await AsyncStorage.removeItem('needsTasksRefresh');
        }
      } catch {}
    })();
  }, []);

  const handleTaskPress = (task: Task) => {
    setEditingTask(task);
    setShowModal(true);
  };

  const handleCreateTask = () => {
    setEditingTask(undefined);
    setShowModal(true);
  };

  const handleSaveTask = async (taskData: Partial<Task>) => {
    try {
      setSaving(true);
      if (editingTask) {
        // Update existing task
        const updatedTask = await tasksAPI.updateTask(editingTask.id, taskData);
        setTasks(prev => prev.map(task => 
          task.id === editingTask.id ? updatedTask : task
        ));
      } else {
        // Create new task
        const newTask = await tasksAPI.createTask(taskData);
        setTasks(prev => [newTask, ...prev]);
      }
      setShowModal(false);
      setEditingTask(undefined);
    } catch (error) {
      console.error('Error saving task:', error);
      Alert.alert('Error', 'Failed to save task');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteTask = async (taskId: string) => {
    try {
      await tasksAPI.deleteTask(taskId);
      setTasks(prev => prev.filter(task => task.id !== taskId));
    } catch (error) {
      console.error('Error deleting task:', error);
      Alert.alert('Error', 'Failed to delete task');
    }
  };

  const handleToggleStatus = async (taskId: string, newStatus: 'not_started' | 'in_progress' | 'completed') => {
    try {
      const updatedTask = await tasksAPI.updateTask(taskId, { status: newStatus });
      setTasks(prev => prev.map(task => 
        task.id === taskId ? updatedTask : task
      ));
    } catch (error) {
      console.error('Error updating task status:', error);
      Alert.alert('Error', 'Failed to update task status');
    }
  };

  const handleAddToCalendar = async (_taskId: string) => {
    try {
      const result = await calendarAPI.createEvent({
        summary: 'Task',
        description: '',
        startTime: new Date().toISOString(),
        endTime: new Date(Date.now() + 60 * 60 * 1000).toISOString(),
      });
      
      // Format the scheduled time for display
      const startTimeStr = result?.data?.scheduled_time;
      const startTime = startTimeStr ? new Date(startTimeStr) : null;
      const now = new Date();
      const tomorrow = new Date(now);
      tomorrow.setDate(tomorrow.getDate() + 1);
      const scheduledTime = startTime
        ? (startTime.toDateString() === now.toDateString()
            ? `today at ${startTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`
            : (startTime.toDateString() === tomorrow.toDateString()
                ? `tomorrow at ${startTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`
                : `${startTime.toLocaleDateString()} at ${startTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`))
        : 'today';

      Alert.alert('Success', `Task scheduled for ${scheduledTime}!`);
    } catch (error) {
      console.error('Error adding task to calendar:', error);
      Alert.alert('Error', 'Failed to add task to calendar');
    }
  };

  const handleToggleAutoSchedule = async (taskId: string, enabled: boolean) => {
    try {
      await autoSchedulingAPI.toggleTaskAutoScheduling(taskId, enabled);
      setTasks(prev => prev.map(task => 
        task.id === taskId ? { ...task, auto_schedule_enabled: enabled } : task
      ));
    } catch (error) {
      console.error('Error toggling auto-schedule:', error);
      Alert.alert('Error', 'Failed to update auto-schedule setting');
    }
  };

  const handleScheduleNow = async (_taskId: string) => {
    try {
      const result = await calendarAPI.createEvent({
        summary: 'Task',
        description: '',
        startTime: new Date().toISOString(),
        endTime: new Date(Date.now() + 60 * 60 * 1000).toISOString(),
      });
      
      // Build human-friendly scheduled time for toast
      const startTimeStr = result?.data?.scheduled_time;
      let formatted = '';
      if (startTimeStr) {
        const start = new Date(startTimeStr);
        const now = new Date();
        const tomorrow = new Date(now);
        tomorrow.setDate(tomorrow.getDate() + 1);
        if (start.toDateString() === now.toDateString()) {
          formatted = `today at ${start.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
        } else if (start.toDateString() === tomorrow.toDateString()) {
          formatted = `tomorrow at ${start.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
        } else {
          formatted = `${start.toLocaleDateString()} at ${start.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
        }
      }

      // Show success toast including scheduled date/time
      setToastMessage(formatted ? `Scheduled for ${formatted}` : 'Task scheduled successfully!');
      setToastScheduledTime(startTimeStr);
      setToastCalendarEvent(true);
      setShowToast(true);
      
      // Refresh tasks to get updated scheduling info
      await loadData();
    } catch (error) {
      console.error('Error scheduling task:', error);
      Alert.alert('Error', 'Failed to schedule task');
    }
  };

  const handleBulkAutoSchedule = async () => {
    try {
      setBulkScheduling(true);
      const result = await autoSchedulingAPI.autoScheduleTasks();
      
      // Show results in toast
      const successfulCount = result.successful;
      
      // Show success toast
      setToastMessage(`Successfully scheduled ${successfulCount} tasks`);
      setToastScheduledTime(undefined);
      setToastCalendarEvent(false);
      setShowToast(true);
      
      // Refresh tasks to get updated scheduling info
      await loadData();
    } catch (error) {
      console.error('Error bulk auto-scheduling:', error);
      Alert.alert('Error', 'Failed to auto-schedule tasks');
    } finally {
      setBulkScheduling(false);
    }
  };

  const handleAutoScheduleSettings = () => {
    setShowPreferencesModal(true);
  };

  const handlePreferencesSave = (_preferences: any) => {
    // Refresh data to reflect any changes
    loadData();
  };

  const handleCancelModal = () => {
    setShowModal(false);
    setEditingTask(undefined);
  };

  const getActiveTasks = () => {
    return tasks.filter(task => task.status !== 'completed');
  };

  const getCompletedTasks = () => {
    return tasks.filter(task => task.status === 'completed');
  };

  const getFocusTask = (): Task | undefined => {
    return tasks.find(task => task.is_today_focus && task.status !== 'completed');
  };

  const getInboxTasks = () => {
    return tasks.filter(task => !task.is_today_focus && task.status !== 'completed');
  };

  const getAutoScheduledTasks = () => {
    return tasks.filter(task => task.auto_schedule_enabled);
  };

  const getScheduledTasks = () => {
    return tasks.filter(task => task.due_date && task.auto_schedule_enabled);
  };

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <Text style={styles.emptyStateTitle}>No tasks yet</Text>
      <Text style={styles.emptyStateSubtitle}>
        Tap the + button to create your first task
      </Text>
    </View>
  );

  const renderTaskItem = ({ item }: { item: Task }) => (
    <TaskCard
      task={item}
      onPress={(task) => {
        if (selectingFocus) {
          tasksAPI.updateTask(task.id, { ...(undefined as any), is_today_focus: true } as any)
            .then(updated => {
              setTasks(prev => prev.map(t => t.id === updated.id ? updated : { ...t, is_today_focus: false }));
              setShowInbox(false);
              setSelectingFocus(false);
              setToastMessage("Set as Today's Focus.");
              setToastCalendarEvent(false);
              setShowToast(true);
            })
            .catch(() => {
              Alert.alert('Error', 'Failed to set Today\'s Focus');
            });
          return;
        }
        handleTaskPress(task);
      }}
      onDelete={handleDeleteTask}
      onToggleStatus={handleToggleStatus}
      onAddToCalendar={handleAddToCalendar}
      onToggleAutoSchedule={handleToggleAutoSchedule}
      onScheduleNow={handleScheduleNow}
    />
  );

  const renderHeaderActions = () => (
    <View style={styles.headerActions}>
      <View style={styles.autoScheduleSummary}>
        <Text style={styles.summaryText}>
          {getAutoScheduledTasks().length} auto-scheduled • {getScheduledTasks().length} scheduled
        </Text>
      </View>
      
      <View style={styles.actionButtons}>
        <TouchableOpacity
          style={styles.settingsButton}
          onPress={handleAutoScheduleSettings}
          activeOpacity={0.7}
        >
          <Icon name="gear" size={20} color={colors.text.secondary} />
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[
            styles.bulkScheduleButton,
            bulkScheduling && styles.bulkScheduleButtonDisabled
          ]}
          onPress={handleBulkAutoSchedule}
          disabled={bulkScheduling}
          activeOpacity={0.7}
        >
          {bulkScheduling ? (
            <ActivityIndicator size="small" color={colors.secondary} />
          ) : (
            <Icon name="checklist" size={16} color={colors.secondary} />
          )}
          <Text style={styles.bulkScheduleText}>
            {bulkScheduling ? 'Scheduling...' : 'Auto-Schedule All'}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  // End-of-day prompt logic: once per day if focus exists and is not completed
  useEffect(() => {
    const maybePromptEndOfDay = async () => {
      if (loading) {return;}
      const focus = getFocusTask();
      if (!focus) {return;}
      const todayStr = new Date().toISOString().slice(0, 10);
      try {
        const lastPrompt = await AsyncStorage.getItem('lastEODPromptDate');
        if (lastPrompt === todayStr) {return;}
        if (focus.status !== 'completed') {
          setShowEodPrompt(true);
        }
      } catch {}
    };
    maybePromptEndOfDay();
     
  }, [loading, tasks]);

  const markEodPrompted = async () => {
    const todayStr = new Date().toISOString().slice(0, 10);
    try { await AsyncStorage.setItem('lastEODPromptDate', todayStr); } catch {}
  };

  const handleEodMarkDone = async () => {
    const focus = getFocusTask();
    if (!focus) { setShowEodPrompt(false); return; }
    await handleFocusDone(focus);
    setShowEodPrompt(false);
    await markEodPrompted();
  };

  const handleEodRollover = async () => {
    const focus = getFocusTask();
    if (!focus) { setShowEodPrompt(false); return; }
    const today = new Date();
    const yyyy = today.getFullYear();
    const mm = String(today.getMonth() + 1).padStart(2, '0');
    const dd = String(today.getDate()).padStart(2, '0');
    try {
      const updated = await tasksAPI.updateTask(focus.id, { due_date: `${yyyy}-${mm}-${dd}` });
      setTasks(prev => prev.map(t => t.id === focus.id ? updated : t));
      setToastMessage('Rolled over to today.');
      setToastCalendarEvent(false);
      setShowToast(true);
    } catch (e) {
      Alert.alert('Error', 'Failed to roll over task');
    }
    setShowEodPrompt(false);
    await markEodPrompted();
  };

  const handleEodChooseNew = async () => {
    setShowEodPrompt(false);
    await markEodPrompted();
    navigation.navigate('BrainDump');
  };

  const handleFocusDone = async (task: Task) => {
    try {
      const updated = await tasksAPI.updateTask(task.id, { status: 'completed' });
      setTasks(prev => prev.map(t => t.id === task.id ? updated : t));
      setToastMessage('Great job! Focus task completed.');
      setToastCalendarEvent(false);
      setShowToast(true);
    } catch (e) {
      Alert.alert('Error', 'Failed to complete focus task');
    }
  };

  const handleFocusRollover = async (task: Task) => {
    try {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      const yyyy = tomorrow.getFullYear();
      const mm = String(tomorrow.getMonth() + 1).padStart(2, '0');
      const dd = String(tomorrow.getDate()).padStart(2, '0');
      const updated = await tasksAPI.updateTask(task.id, { due_date: `${yyyy}-${mm}-${dd}` });
      setTasks(prev => prev.map(t => t.id === task.id ? updated : t));
      setToastMessage('Rolled over to tomorrow.');
      setToastCalendarEvent(false);
      setShowToast(true);
    } catch (e) {
      Alert.alert('Error', 'Failed to roll over task');
    }
  };

  const handleChangeFocus = () => {
    // Let user pick a new focus from Inbox directly
    setShowInbox(true);
    setSelectingFocus(true);
    setToastMessage("Select a task from your Inbox to set as Today's Focus.");
    setToastCalendarEvent(false);
    setShowToast(true);
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>Loading tasks...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Tasks</Text>
        <Text style={styles.subtitle}>
          {tasks.length} task{tasks.length !== 1 ? 's' : ''}
        </Text>
        {renderHeaderActions()}
        {/* Today's Focus Card */}
        {(() => {
          const focus = getFocusTask();
          const inboxCount = getInboxTasks().length;
          return (
            <View>
              <View style={styles.focusHeaderRow}>
                <Text style={styles.focusTitle}>Today's Focus</Text>
                <TouchableOpacity style={styles.inboxButton} onPress={() => { setShowInbox(!showInbox); setSelectingFocus(false); }}>
                  <Icon name="inbox" size={14} color={colors.text.primary} />
                  <Text style={styles.inboxText}>Inbox{inboxCount > 0 ? ` (${inboxCount})` : ''}</Text>
                  <Icon name={showInbox ? 'chevron-up' : 'chevron-down'} size={14} color={colors.text.primary} />
                </TouchableOpacity>
              </View>
              {focus ? (
                <View style={styles.focusCard}>
                  <Text style={styles.focusTaskTitle}>{focus.title}</Text>
                  <View style={styles.focusBadges}>
                    {!!focus.category && (
                      <View style={styles.badge}><Text style={styles.badgeText}>{focus.category}</Text></View>
                    )}
                    <View style={[styles.badge, styles[focus.priority]]}><Text style={[styles.badgeText, styles.badgeTextDark]}>{focus.priority}</Text></View>
                  </View>
                  <View style={styles.focusActionsRow}>
                    <TouchableOpacity style={styles.focusBtn} onPress={() => handleFocusDone(focus)}>
                      <Icon name="check" size={16} color={colors.secondary} />
                      <Text style={styles.focusBtnText}>Done</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.focusBtn} onPress={() => handleFocusRollover(focus)}>
                      <Icon name="clock" size={16} color={colors.secondary} />
                      <Text style={styles.focusBtnText}>Rollover</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.focusBtn} onPress={handleChangeFocus}>
                      <Icon name="arrow-switch" size={16} color={colors.secondary} />
                      <Text style={styles.focusBtnText}>Change</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              ) : (
                <TouchableOpacity style={styles.focusCard} onPress={handleChangeFocus}>
                  <Text style={styles.focusTaskTitle}>No focus set</Text>
                  <Text style={styles.badgeText}>Set Today’s Focus to keep things simple.</Text>
                </TouchableOpacity>
              )}
            </View>
          );
        })()}
      </View>

      <FlatList
        data={showInbox ? getInboxTasks() : []}
        renderItem={renderTaskItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContainer}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            colors={[colors.primary]}
            tintColor={colors.primary}
          />
        }
        ListEmptyComponent={showInbox ? renderEmptyState : undefined}
        ListFooterComponent={() => {
          if (!showInbox) {return null;}
          const completedTasks = getCompletedTasks();
          if (completedTasks.length === 0) {return null;}
          
          return (
            <View style={styles.completedSection}>
              <Text style={styles.completedSectionTitle}>Completed</Text>
              {completedTasks.map(task => (
                <TaskCard
                  key={task.id}
                  task={task}
                  onPress={handleTaskPress}
                  onDelete={handleDeleteTask}
                  onToggleStatus={handleToggleStatus}
                  onAddToCalendar={handleAddToCalendar}
                  onToggleAutoSchedule={handleToggleAutoSchedule}
                  onScheduleNow={handleScheduleNow}
                />
              ))}
            </View>
          );
        }}
      />

      {/* Floating Action Button */}
      <TouchableOpacity
        style={styles.fab}
        onPress={handleCreateTask}
        activeOpacity={0.8}
      >
        <Text style={styles.fabText}>+</Text>
      </TouchableOpacity>

      {/* Task Form Modal */}
      <Modal
        visible={showModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={handleCancelModal}
      >
        <TaskForm
          task={editingTask}
          goals={goals}
          onSave={handleSaveTask}
          onCancel={handleCancelModal}
          loading={saving}
        />
      </Modal>

      {/* Auto-Scheduling Preferences Modal */}
      <AutoSchedulingPreferencesModal
        visible={showPreferencesModal}
        onClose={() => setShowPreferencesModal(false)}
        onSave={handlePreferencesSave}
      />

      {/* End-of-day prompt modal */}
      <Modal
        visible={showEodPrompt}
        animationType="fade"
        transparent
        onRequestClose={() => setShowEodPrompt(false)}
      >
        <View style={styles.eodOverlay}>
          <View style={styles.eodCard}>
            <Text style={styles.eodTitle}>How did today’s focus go?</Text>
            <Text style={styles.eodSubtitle}>No pressure—want to mark it done, roll it over to today, or choose something new?</Text>
            {(() => {
              const focus = getFocusTask();
              if (!focus) {return null;}
              return (
                <View style={[styles.focusCard, { marginTop: spacing.sm }]}> 
                  <Text style={styles.focusTaskTitle}>{focus.title}</Text>
                  <View style={styles.focusBadges}>
                    {!!focus.category && (
                      <View style={styles.badge}><Text style={styles.badgeText}>{focus.category}</Text></View>
                    )}
                    <View style={[styles.badge, styles[focus.priority]]}><Text style={[styles.badgeText, styles.badgeTextDark]}>{focus.priority}</Text></View>
                  </View>
                </View>
              );
            })()}
            <View style={styles.eodActionsRow}>
              <TouchableOpacity style={[styles.eodBtn, styles.eodPrimary]} onPress={handleEodMarkDone}>
                <Icon name="check" size={16} color={colors.secondary} />
                <Text style={styles.eodBtnText}>Mark done</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.eodBtn, styles.eodPrimary]} onPress={handleEodRollover}>
                <Icon name="clock" size={16} color={colors.secondary} />
                <Text style={styles.eodBtnText}>Roll over</Text>
              </TouchableOpacity>
            </View>
            <TouchableOpacity style={styles.eodSecondary} onPress={handleEodChooseNew}>
              <Text style={styles.eodSecondaryText}>Choose a new focus</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Success Toast */}
      <SuccessToast
        visible={showToast}
        message={toastMessage}
        scheduledTime={toastScheduledTime}
        calendarEventCreated={toastCalendarEvent}
        onClose={() => setShowToast(false)}
        duration={5000}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.surface,
  },
  header: {
    padding: spacing.md,
    paddingTop: spacing.lg,
    backgroundColor: colors.background.primary,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.light,
  },
  title: {
    fontSize: typography.fontSize['3xl'],
    fontWeight: typography.fontWeight.bold as any,
    color: colors.text.primary,
    marginBottom: spacing.xs,
  },
  subtitle: {
    fontSize: typography.fontSize.sm,
    color: colors.text.secondary,
    marginBottom: spacing.md,
  },
  headerActions: {
    marginTop: spacing.sm,
  },
  focusHeaderRow: {
    marginTop: spacing.md,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  focusTitle: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.bold as any,
    color: colors.text.primary,
  },
  inboxButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderWidth: 1,
    borderColor: colors.border.light,
    borderRadius: borderRadius.sm,
    backgroundColor: colors.background.surface,
  },
  inboxText: {
    color: colors.text.primary,
    fontSize: typography.fontSize.sm,
  },
  focusCard: {
    marginTop: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border.light,
    backgroundColor: colors.secondary,
    borderRadius: borderRadius.md,
    padding: spacing.md,
  },
  focusTaskTitle: {
    color: colors.text.primary,
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.semibold as any,
  },
  focusBadges: {
    flexDirection: 'row',
    marginTop: spacing.xs,
  },
  badge: {
    borderWidth: 1,
    borderColor: colors.border.light,
    borderRadius: 999,
    paddingVertical: 2,
    paddingHorizontal: 8,
    marginRight: spacing.xs,
  },
  badgeText: {
    color: colors.text.secondary,
    fontSize: typography.fontSize.xs,
  },
  badgeTextDark: { color: colors.text.primary },
  low: { backgroundColor: '#E8F5E9', borderColor: '#C8E6C9' },
  medium: { backgroundColor: '#FFFDE7', borderColor: '#FFF9C4' },
  high: { backgroundColor: '#FFEBEE', borderColor: '#FFCDD2' },
  focusActionsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: spacing.sm,
  },
  focusBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.sm,
  },
  focusBtnText: { color: colors.secondary, fontWeight: typography.fontWeight.bold as any },
  autoScheduleSummary: {
    marginBottom: spacing.sm,
  },
  summaryText: {
    fontSize: typography.fontSize.sm,
    color: colors.text.secondary,
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  settingsButton: {
    padding: spacing.sm,
    borderRadius: borderRadius.sm,
    backgroundColor: colors.background.surface,
    borderWidth: 1,
    borderColor: colors.border.light,
  },
  bulkScheduleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    backgroundColor: colors.primary,
    borderRadius: borderRadius.sm,
    flex: 1,
    marginLeft: spacing.sm,
  },
  bulkScheduleButtonDisabled: {
    opacity: 0.6,
  },
  bulkScheduleText: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.medium as any,
    color: colors.secondary,
  },
  listContainer: {
    padding: spacing.md,
    paddingBottom: spacing['2xl'], // Extra space for FAB
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background.surface,
  },
  loadingText: {
    marginTop: spacing.md,
    fontSize: typography.fontSize.base,
    color: colors.text.secondary,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
  },
  emptyStateTitle: {
    fontSize: typography.fontSize.xl,
    fontWeight: typography.fontWeight.bold as any,
    color: colors.text.primary,
    marginBottom: spacing.sm,
    textAlign: 'center',
  },
  emptyStateSubtitle: {
    fontSize: typography.fontSize.base,
    color: colors.text.secondary,
    textAlign: 'center',
    lineHeight: typography.lineHeight.normal * typography.fontSize.base,
  },
  fab: {
    position: 'absolute',
    bottom: spacing.lg,
    right: spacing.lg,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 8,
    shadowColor: colors.primary,
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  fabText: {
    fontSize: typography.fontSize['2xl'],
    fontWeight: typography.fontWeight.bold as any,
    color: colors.secondary,
  },
  completedSection: {
    marginTop: spacing.xl,
    paddingTop: spacing.lg,
    borderTopWidth: 1,
    borderTopColor: colors.border.light,
  },
  completedSectionTitle: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.semibold as any,
    color: colors.text.secondary,
    marginBottom: spacing.md,
    paddingHorizontal: spacing.md,
  },
  eodOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  eodCard: {
    width: '88%',
    backgroundColor: colors.background.surface,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.border.light,
    padding: spacing.lg,
  },
  eodTitle: {
    color: colors.text.primary,
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.bold as any,
    marginBottom: spacing.xs,
  },
  eodSubtitle: {
    color: colors.text.secondary,
    fontSize: typography.fontSize.sm,
    marginBottom: spacing.md,
  },
  eodActionsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  eodBtn: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 6,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.sm,
  },
  eodPrimary: {
    backgroundColor: colors.primary,
  },
  eodBtnText: {
    color: colors.secondary,
    fontWeight: typography.fontWeight.bold as any,
  },
  eodSecondary: {
    marginTop: spacing.sm,
    paddingVertical: spacing.sm,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border.light,
    borderRadius: borderRadius.sm,
  },
  eodSecondaryText: {
    color: colors.text.primary,
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.medium as any,
  },
});
