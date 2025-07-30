import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Alert,
  ActivityIndicator,
  Dimensions,
} from 'react-native';
import { Calendar, DateData } from 'react-native-calendars';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors } from '../../themes/colors';
import { typography } from '../../themes/typography';
import { spacing } from '../../themes/spacing';
import { Button } from '../../components/common/Button';
import { EventCard } from '../../components/calendar/EventCard';
import { EventFormModal } from '../../components/calendar/EventFormModal';
import { VirtualizedEventList } from '../../components/calendar/VirtualizedEventList';
import { OfflineIndicator } from '../../components/common/OfflineIndicator';
import { calendarAPI, tasksAPI, goalsAPI } from '../../services/api';
import {
  CalendarEvent,
  Task,
  ViewType,
  CalendarState,
  DayViewEvent,
  WeekViewEvent,
  MonthViewEvent,
} from '../../types/calendar';
import { Goal } from '../../services/api';
import { formatDateToYYYYMMDD } from '../../utils/dateUtils';
import { hapticFeedback } from '../../utils/hapticFeedback';

const { width } = Dimensions.get('window');

export default function CalendarScreen() {
  const insets = useSafeAreaInsets();
  const dayViewScrollRef = useRef<ScrollView>(null);
  const [state, setState] = useState<CalendarState>({
    selectedDate: new Date(),
    viewType: 'month',
    events: [],
    tasks: [],
    goals: [],
    loading: false,
    error: null,
  });

  const [refreshing, setRefreshing] = useState(false);
  const [formModalVisible, setFormModalVisible] = useState(false);
  const [editingEvent, setEditingEvent] = useState<CalendarEvent | Task | null>(null);
  const [formLoading, setFormLoading] = useState(false);
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [hasMoreEvents, setHasMoreEvents] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);

  // Load calendar data
  const loadCalendarData = useCallback(async (page = 1, append = false) => {
    if (page === 1) {
      setState(prev => ({ ...prev, loading: true, error: null }));
    } else {
      setLoadingMore(true);
    }
    
    try {
      console.log(`Loading calendar data page ${page}...`);
      
      // Load events from backend with pagination
      const eventsPerPage = 50;
      const events = await calendarAPI.getEvents(eventsPerPage * page);
      console.log(`Loaded ${events?.length || 0} events from backend`);
      
      // Load tasks from backend
      const tasks = await tasksAPI.getTasks();
      console.log(`Loaded ${tasks?.length || 0} tasks from backend`);
      
      // Load goals from backend
      const goals = await goalsAPI.getGoals();
      console.log(`Loaded ${goals?.length || 0} goals from backend`);
      
      setState(prev => ({
        ...prev,
        events: append ? [...prev.events, ...(events || [])] : (events || []),
        tasks: tasks || [],
        goals: goals || [],
        loading: false,
      }));
      
      // Update pagination state
      setCurrentPage(page);
      setHasMoreEvents((events?.length || 0) >= eventsPerPage);
      setLoadingMore(false);
    } catch (error) {
      console.error('Error loading calendar data:', error);
      
      // Check if we're offline and have cached data
      const { offlineService } = await import('../../services/offline');
      const offlineState = await offlineService.getOfflineState();
      
      if (!offlineState.isOnline) {
        // Try to load cached data
        const cachedEvents = await offlineService.getCachedEvents();
        const cachedTasks = await offlineService.getCachedTasks();
        const cachedGoals = await offlineService.getCachedGoals();
        
        if (cachedEvents || cachedTasks || cachedGoals) {
          console.log('Using cached data due to offline status');
          setState(prev => ({
            ...prev,
            events: cachedEvents || [],
            tasks: cachedTasks || [],
            goals: cachedGoals || [],
            loading: false,
            error: 'Offline - showing cached data',
          }));
          setLoadingMore(false);
          return;
        }
      }
      
      setState(prev => ({
        ...prev,
        loading: false,
        error: 'Failed to load calendar data',
      }));
      setLoadingMore(false);
    }
  }, []);

  // Load more events
  const loadMoreEvents = useCallback(async () => {
    if (!loadingMore && hasMoreEvents) {
      hapticFeedback.light();
      await loadCalendarData(currentPage + 1, true);
    }
  }, [loadCalendarData, currentPage, loadingMore, hasMoreEvents]);

  // Refresh data
  const onRefresh = useCallback(async () => {
    hapticFeedback.light();
    setRefreshing(true);
    await loadCalendarData(1, false);
    setRefreshing(false);
  }, [loadCalendarData]);

  // Load data on mount
  useEffect(() => {
    loadCalendarData();
  }, [loadCalendarData]);



  // Handle date selection
  const handleDateSelect = useCallback((day: DateData) => {
    hapticFeedback.selection();
    // The day object contains the date string in YYYY-MM-DD format
    if (day.dateString) {
      // Parse the date string properly to avoid timezone issues
      const [year, month, dayOfMonth] = day.dateString.split('-').map(Number);
      const selectedDate = new Date(year, month - 1, dayOfMonth); // month is 0-indexed
      setState(prev => ({
        ...prev,
        selectedDate: selectedDate,
        viewType: 'day', // Automatically switch to Day view when a date is selected
      }));
    }
  }, []);

  // Handle view type change
  const handleViewTypeChange = useCallback((viewType: ViewType) => {
    hapticFeedback.light();
    setState(prev => ({ ...prev, viewType }));
  }, []);

  // Handle event edit
  const handleEventEdit = useCallback((event: CalendarEvent | Task) => {
    hapticFeedback.medium();
    setEditingEvent(event);
    setFormModalVisible(true);
  }, []);

  // Handle event delete
  const handleEventDelete = useCallback(async (eventId: string) => {
    try {
      // Determine if it's an event or task based on the ID
      const event = state.events.find(e => e.id === eventId);
      const task = state.tasks.find(t => t.id === eventId);
      
      if (event) {
        await calendarAPI.deleteEvent(eventId);
      } else if (task) {
        await tasksAPI.deleteTask(eventId);
      }
      
      // Refresh data
      await loadCalendarData();
      hapticFeedback.success();
    } catch (error) {
      console.error('Error deleting event:', error);
      hapticFeedback.error();
      throw error;
    }
  }, [state.events, state.tasks, loadCalendarData]);

  // Handle task completion
  const handleTaskComplete = useCallback(async (taskId: string) => {
    // Find the task in the current state
    const taskIndex = state.tasks.findIndex(t => t.id === taskId);
    if (taskIndex === -1) {
      throw new Error('Task not found');
    }

    const currentTask = state.tasks[taskIndex];
    const isCurrentlyCompleted = currentTask.status === 'completed';
    const newStatus = isCurrentlyCompleted ? 'in_progress' : 'completed';

    try {
      // Optimistic update - immediately update the UI
      setState(prev => ({
        ...prev,
        tasks: prev.tasks.map(task => 
          task.id === taskId 
            ? { ...task, status: newStatus }
            : task
        )
      }));

      // Update the backend
      await tasksAPI.updateTask(taskId, { status: newStatus });
      
      // Success - no need to reload, UI is already updated
      hapticFeedback.success();
    } catch (error) {
      console.error('Error completing task:', error);
      hapticFeedback.error();
      
      // Revert the optimistic update on error
      setState(prev => ({
        ...prev,
        tasks: prev.tasks.map(task => 
          task.id === taskId 
            ? { ...task, status: currentTask.status } // Revert to original status
            : task
        )
      }));
      
      throw error;
    }
  }, [state.tasks]);

  // Handle event/task rescheduling
  const handleReschedule = useCallback(async (eventId: string, newDate: Date) => {
    try {
      // Determine if it's an event or task based on the ID
      const event = state.events.find(e => e.id === eventId);
      const task = state.tasks.find(t => t.id === eventId);
      
      if (event) {
        // Reschedule calendar event
        const startTime = event.start_time || event.start?.dateTime;
        const endTime = event.end_time || event.end?.dateTime;
        
        if (startTime && endTime) {
          const startDate = new Date(startTime);
          const endDate = new Date(endTime);
          const duration = endDate.getTime() - startDate.getTime();
          
          // Calculate new start and end times
          const newStartTime = new Date(newDate);
          newStartTime.setHours(startDate.getHours(), startDate.getMinutes(), 0, 0);
          
          const newEndTime = new Date(newStartTime.getTime() + duration);
          
          await calendarAPI.updateEvent(eventId, {
            summary: event.summary || event.title || 'Untitled Event',
            description: event.description,
            startTime: newStartTime.toISOString(),
            endTime: newEndTime.toISOString(),
            location: event.location,
          });
        }
      } else if (task) {
        // Reschedule task
        const newDueDate = new Date(newDate);
        if (task.due_date) {
          const originalDate = new Date(task.due_date);
          newDueDate.setHours(originalDate.getHours(), originalDate.getMinutes(), 0, 0);
        }
        
        await tasksAPI.updateTask(eventId, {
          due_date: newDueDate.toISOString(),
        });
      }
      
      // Refresh data
      await loadCalendarData();
      hapticFeedback.success();
    } catch (error) {
      console.error('Error rescheduling event:', error);
      hapticFeedback.error();
      throw error;
    }
  }, [state.events, state.tasks, loadCalendarData]);

  // Create new event
  const handleCreateEvent = useCallback(() => {
    hapticFeedback.medium();
    setEditingEvent(null);
    setFormModalVisible(true);
  }, []);

  // Handle form submission
  const handleFormSubmit = useCallback(async (formData: any) => {
    setFormLoading(true);
    try {
      if (editingEvent) {
        // Update existing event
        if ('start_time' in editingEvent) {
          // It's a calendar event
          await calendarAPI.updateEvent(editingEvent.id, {
            summary: formData.title,
            description: formData.description,
            startTime: formData.startTime.toISOString(),
            endTime: formData.endTime.toISOString(),
            location: formData.location,
          });
        } else {
          // It's a task
          await tasksAPI.updateTask(editingEvent.id, {
            title: formData.title,
            description: formData.description,
            due_date: formData.startTime.toISOString(),
            estimated_duration_minutes: Math.round((formData.endTime.getTime() - formData.startTime.getTime()) / (1000 * 60)),
          });
        }
      } else {
        // Create new event
        await calendarAPI.createEvent({
          summary: formData.title,
          description: formData.description,
          startTime: formData.startTime.toISOString(),
          endTime: formData.endTime.toISOString(),
          location: formData.location,
        });
      }
      
      // Refresh data
      await loadCalendarData();
      hapticFeedback.success();
    } catch (error) {
      console.error('Error saving event:', error);
      hapticFeedback.error();
      throw error;
    } finally {
      setFormLoading(false);
    }
  }, [editingEvent, loadCalendarData]);

  // Close form modal
  const handleCloseForm = useCallback(() => {
    setFormModalVisible(false);
    setEditingEvent(null);
    setFormLoading(false);
  }, []);

  // Handle Today button press
  const handleTodayPress = useCallback(() => {
    hapticFeedback.selection();
    setState(prev => ({ 
      ...prev, 
      selectedDate: new Date(),
      viewType: 'day' // Automatically switch to Day view when Today is pressed
    }));
  }, []);

  // Handle retry button press
  const handleRetryPress = useCallback(() => {
    hapticFeedback.medium();
    loadCalendarData(1, false);
  }, [loadCalendarData]);

  // Get events for selected date
  const getEventsForSelectedDate = useCallback(() => {
    const selectedDateStr = formatDateToYYYYMMDD(state.selectedDate);
    const dayEvents: DayViewEvent[] = [];

    // Add calendar events
    state.events.forEach((event, index) => {
      try {
        // Handle both database format and Google Calendar API format
        let eventStartTime: string;
        let eventEndTime: string;
        
        if (event.start_time && event.end_time) {
          // Database format
          eventStartTime = event.start_time;
          eventEndTime = event.end_time;

        } else if (event.start?.dateTime && event.end?.dateTime) {
          // Google Calendar API format
          eventStartTime = event.start.dateTime;
          eventEndTime = event.end.dateTime;

        } else {
          console.warn('Invalid event format:', event);
          return;
        }

        const eventDate = new Date(eventStartTime);
        const eventDateStr = formatDateToYYYYMMDD(eventDate);
        
        if (eventDateStr === selectedDateStr) {
          const dayEvent = {
            id: event.id,
            title: event.summary || event.title || 'Untitled Event',
            startTime: new Date(eventStartTime),
            endTime: new Date(eventEndTime),
            type: 'event' as const,
            data: event,
            color: colors.primary,
          };
          dayEvents.push(dayEvent);
        }
      } catch (error) {
        console.warn('Invalid event date:', event, error);
      }
    });

    // Add tasks
    state.tasks.forEach(task => {
      if (task.due_date) {
        try {
          const taskDate = new Date(task.due_date);
          if (formatDateToYYYYMMDD(taskDate) === selectedDateStr) {
            dayEvents.push({
              id: task.id,
              title: task.title,
              startTime: new Date(task.due_date),
              endTime: new Date(new Date(task.due_date).getTime() + (task.estimated_duration_minutes || 30) * 60 * 1000),
              type: 'task',
              data: task,
              color: task.priority === 'high' ? colors.error : task.priority === 'medium' ? colors.warning : colors.success,
            });
          }
        } catch (error) {
          console.warn('Invalid task date:', task.due_date);
        }
      }
    });

    return dayEvents.sort((a, b) => a.startTime.getTime() - b.startTime.getTime());
  }, [state.selectedDate, state.events, state.tasks]);

  // Get goals due in the current month
  const getGoalsForCurrentMonth = useCallback(() => {
    const currentMonth = state.selectedDate.getMonth();
    const currentYear = state.selectedDate.getFullYear();
    
    return state.goals.filter(goal => {
      if (!goal.target_completion_date) return false;
      
      try {
        const goalDate = new Date(goal.target_completion_date);
        return goalDate.getMonth() === currentMonth && goalDate.getFullYear() === currentYear;
      } catch (error) {
        console.warn('Invalid goal date:', goal.target_completion_date);
        return false;
      }
    }).sort((a, b) => {
      // Sort by completion date, then by title
      const dateA = new Date(a.target_completion_date || '');
      const dateB = new Date(b.target_completion_date || '');
      if (dateA.getTime() !== dateB.getTime()) {
        return dateA.getTime() - dateB.getTime();
      }
      return a.title.localeCompare(b.title);
    });
  }, [state.goals, state.selectedDate]);

  // Get marked dates for calendar
  const getMarkedDates = useCallback(() => {
    const marked: any = {};
    
    // Mark dates with events
    state.events.forEach(event => {
      try {
        // Handle both database format and Google Calendar API format
        let eventStartTime: string;
        
        if (event.start_time) {
          // Database format
          eventStartTime = event.start_time;
        } else if (event.start?.dateTime) {
          // Google Calendar API format
          eventStartTime = event.start.dateTime;
        } else {
          console.warn('Invalid event format for marking:', event);
          return;
        }

        const date = formatDateToYYYYMMDD(new Date(eventStartTime));
        if (!marked[date]) {
          marked[date] = { marked: true, dotColor: colors.primary };
        }
      } catch (error) {
        console.warn('Invalid event date:', event);
      }
    });

    // Mark dates with tasks
    state.tasks.forEach(task => {
      if (task.due_date) {
        try {
          const date = formatDateToYYYYMMDD(new Date(task.due_date));
          if (!marked[date]) {
            marked[date] = { marked: true, dotColor: colors.success };
          } else {
            // If both event and task on same date, use different styling
            marked[date] = { 
              marked: true, 
              dotColor: colors.primary,
              dots: [
                { color: colors.primary },
                { color: colors.success }
              ]
            };
          }
        } catch (error) {
          console.warn('Invalid task date:', task.due_date);
        }
      }
    });

    // Mark dates with goals
    state.goals.forEach(goal => {
      if (goal.target_completion_date) {
        try {
          const date = formatDateToYYYYMMDD(new Date(goal.target_completion_date));
          if (!marked[date]) {
            marked[date] = { marked: true, dotColor: colors.warning };
          } else {
            // If multiple items on same date, add to dots array
            if (marked[date].dots) {
              marked[date].dots.push({ color: colors.warning });
            } else {
              marked[date] = { 
                marked: true, 
                dotColor: colors.primary,
                dots: [
                  { color: colors.primary },
                  { color: colors.warning }
                ]
              };
            }
          }
        } catch (error) {
          console.warn('Invalid goal date:', goal.target_completion_date);
        }
      }
    });

    return marked;
  }, [state.events, state.tasks, state.goals]);

  // Render day view with list-based layout
  const renderDayView = useCallback(() => {
    const dayEvents = getEventsForSelectedDate();
    
    // Group events by time blocks
    const timeBlocks: Array<{
      name: string;
      start: number;
      end: number;
      events: DayViewEvent[];
    }> = [
      { name: 'Early Morning', start: 0, end: 6, events: [] },
      { name: 'Morning', start: 6, end: 12, events: [] },
      { name: 'Afternoon', start: 12, end: 18, events: [] },
      { name: 'Evening', start: 18, end: 24, events: [] },
    ];

    // Distribute events into time blocks
    dayEvents.forEach(event => {
      const eventHour = event.startTime.getHours();
      const block = timeBlocks.find(block => 
        eventHour >= block.start && eventHour < block.end
      );
      if (block) {
        block.events.push(event);
      }
    });

    // Sort events within each block by start time
    timeBlocks.forEach(block => {
      block.events.sort((a, b) => a.startTime.getTime() - b.startTime.getTime());
    });

    return (
      <ScrollView 
        ref={dayViewScrollRef}
        style={styles.dayViewContainer}
        contentContainerStyle={styles.dayViewContent}
        showsVerticalScrollIndicator={true}
        scrollIndicatorInsets={{ right: 1 }}
        bounces={true}
        scrollEventThrottle={16}
        directionalLockEnabled={true}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        <Text style={styles.dayViewTitle}>
          {state.selectedDate.toLocaleDateString([], {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric',
          })}
        </Text>
        
        {dayEvents.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyStateText}>No events scheduled for this day</Text>
            <Button
              title="Create Event"
              onPress={handleCreateEvent}
              variant="outline"
              style={styles.createButton}
            />
          </View>
        ) : (
          timeBlocks.map(block => (
            <View key={block.name} style={styles.timeBlock}>
              <View style={styles.timeBlockHeader}>
                <Text style={styles.timeBlockTitle}>{block.name}</Text>
                <Text style={styles.timeBlockTime}>
                  {block.start === 0 ? '12:00 AM' : `${block.start}:00`} - {block.end === 24 ? '12:00 AM' : `${block.end}:00`}
                </Text>
              </View>
              
              {block.events.length === 0 ? (
                <View style={styles.emptyTimeBlock}>
                  <Text style={styles.emptyTimeBlockText}>No events</Text>
                </View>
              ) : (
                <View style={styles.eventsList}>
                  {block.events.map(event => (
                    <View key={event.id} style={styles.eventCardContainer}>
                      <EventCard
                        event={event.data}
                        type={event.type}
                        onEdit={handleEventEdit}
                        onDelete={handleEventDelete}
                        onCompleteTask={handleTaskComplete}
                        onReschedule={handleReschedule}
                        compact={false}
                      />
                    </View>
                  ))}
                </View>
              )}
            </View>
          ))
        )}
      </ScrollView>
    );
  }, [state.selectedDate, state.events, state.tasks, state.loading, refreshing, onRefresh, handleEventEdit, handleEventDelete, handleTaskComplete, handleReschedule, handleCreateEvent]);

  // Render week view with list-based layout grouped by date
  const renderWeekView = useCallback(() => {
    const weekStart = new Date(state.selectedDate);
    weekStart.setDate(weekStart.getDate() - weekStart.getDay());
    
    // Create date groups for the week
    const dateGroups: Array<{
      date: Date;
      dayName: string;
      dateString: string;
      events: WeekViewEvent[];
    }> = [];
    
    // Initialize date groups for the week
    for (let i = 0; i < 7; i++) {
      const currentDate = new Date(weekStart);
      currentDate.setDate(currentDate.getDate() + i);
      const dateStr = formatDateToYYYYMMDD(currentDate);
      
      dateGroups.push({
        date: currentDate,
        dayName: currentDate.toLocaleDateString([], { weekday: 'long' }),
        dateString: dateStr,
        events: [],
      });
    }
    
    // Distribute events into date groups
    state.events.forEach(event => {
      try {
        // Handle both database format and Google Calendar API format
        let eventStartTime: string;
        let eventEndTime: string;

        if (event.start_time && event.end_time) {
          // Database format
          eventStartTime = event.start_time;
          eventEndTime = event.end_time;
        } else if (event.start?.dateTime && event.end?.dateTime) {
          // Google Calendar API format
          eventStartTime = event.start.dateTime;
          eventEndTime = event.end.dateTime;
        } else {
          console.warn('Invalid event format for week view:', event);
          return;
        }

        const eventDate = new Date(eventStartTime);
        const eventDateStr = formatDateToYYYYMMDD(eventDate);
        
        const dateGroup = dateGroups.find(group => group.dateString === eventDateStr);
        if (dateGroup) {
          dateGroup.events.push({
            id: event.id,
            title: event.summary || event.title || 'Untitled Event',
            startTime: new Date(eventStartTime),
            endTime: new Date(eventEndTime),
            day: dateGroups.indexOf(dateGroup),
            type: 'event',
            data: event,
            color: colors.primary,
          });
        }
      } catch (error) {
        console.warn('Invalid event date for week view:', event);
      }
    });
    
    // Add tasks to date groups
    state.tasks.forEach(task => {
      if (task.due_date) {
        try {
          const taskDate = new Date(task.due_date);
          const taskDateStr = formatDateToYYYYMMDD(taskDate);
          
          const dateGroup = dateGroups.find(group => group.dateString === taskDateStr);
          if (dateGroup) {
            dateGroup.events.push({
              id: task.id,
              title: task.title,
              startTime: new Date(task.due_date),
              endTime: new Date(new Date(task.due_date).getTime() + (task.estimated_duration_minutes || 30) * 60 * 1000),
              day: dateGroups.indexOf(dateGroup),
              type: 'task',
              data: task,
              color: task.priority === 'high' ? colors.error : task.priority === 'medium' ? colors.warning : colors.success,
            });
          }
        } catch (error) {
          console.warn('Invalid task date for week view:', task.due_date);
        }
      }
    });
    
    // Sort events within each date group by start time
    dateGroups.forEach(group => {
      group.events.sort((a, b) => a.startTime.getTime() - b.startTime.getTime());
    });
    
    // Filter out empty date groups or show them with empty state
    const nonEmptyGroups = dateGroups.filter(group => group.events.length > 0);
    const hasAnyEvents = nonEmptyGroups.length > 0;

    return (
      <ScrollView 
        style={styles.weekViewContainer}
        scrollEventThrottle={16}
        directionalLockEnabled={true}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        <Text style={styles.weekViewTitle}>
          Week of {weekStart.toLocaleDateString([], { month: 'short', day: 'numeric' })} - {
            new Date(weekStart.getTime() + 6 * 24 * 60 * 60 * 1000).toLocaleDateString([], { month: 'short', day: 'numeric' })
          }
        </Text>
        
        {!hasAnyEvents ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyStateText}>No events scheduled this week</Text>
            <Button
              title="Create Event"
              onPress={handleCreateEvent}
              variant="outline"
              style={styles.createButton}
            />
          </View>
        ) : (
          dateGroups.map(group => (
            <View key={group.dateString} style={styles.dateGroup}>
              <View style={styles.dateGroupHeader}>
                <Text style={styles.dateGroupTitle}>{group.dayName}</Text>
                <Text style={styles.dateGroupDate}>
                  {group.date.toLocaleDateString([], { 
                    month: 'short', 
                    day: 'numeric' 
                  })}
                </Text>
              </View>
              
              {group.events.length === 0 ? (
                <View style={styles.emptyDateGroup}>
                  <Text style={styles.emptyDateGroupText}>No events</Text>
                </View>
              ) : (
                <View style={styles.eventsList}>
                  {group.events.map(event => (
                    <View key={event.id} style={styles.eventCardContainer}>
                      <EventCard
                        event={event.data}
                        type={event.type}
                        onEdit={handleEventEdit}
                        onDelete={handleEventDelete}
                        onCompleteTask={handleTaskComplete}
                        onReschedule={handleReschedule}
                        compact={false}
                      />
                    </View>
                  ))}
                </View>
              )}
            </View>
          ))
        )}
      </ScrollView>
    );
  }, [state.selectedDate, state.events, state.tasks, state.loading, refreshing, onRefresh, handleEventEdit, handleEventDelete, handleTaskComplete, handleReschedule, handleCreateEvent]);

  // Render month view
  const renderMonthView = () => {
    const monthGoals = getGoalsForCurrentMonth();
    
    return (
      <ScrollView style={styles.monthViewContainer}>
        <Calendar
          current={formatDateToYYYYMMDD(state.selectedDate)}
          onDayPress={handleDateSelect}
          markedDates={getMarkedDates()}
          theme={{
            backgroundColor: colors.background,
            calendarBackground: colors.background,
            textSectionTitleColor: colors.text.primary,
            selectedDayBackgroundColor: colors.primary,
            selectedDayTextColor: colors.secondary,
            todayTextColor: colors.primary,
            dayTextColor: colors.text.primary,
            textDisabledColor: colors.text.disabled,
            dotColor: colors.primary,
            selectedDotColor: colors.secondary,
            arrowColor: colors.primary,
            monthTextColor: colors.text.primary,
            indicatorColor: colors.primary,
            textDayFontFamily: typography.fontFamily.regular,
            textMonthFontFamily: typography.fontFamily.bold,
            textDayHeaderFontFamily: typography.fontFamily.medium,
            textDayFontWeight: typography.fontWeight.medium as any,
            textMonthFontWeight: typography.fontWeight.bold as any,
            textDayHeaderFontWeight: typography.fontWeight.semibold as any,
            textDayFontSize: typography.fontSize.base,
            textMonthFontSize: typography.fontSize.lg,
            textDayHeaderFontSize: typography.fontSize.sm,
          }}
        />
        
        {/* Goals Section */}
        <View style={styles.goalsSection}>
          <View style={styles.goalsHeader}>
            <Text style={styles.goalsTitle}>Upcoming Goals</Text>
            <Text style={styles.goalsSubtitle}>
              {state.selectedDate.toLocaleDateString([], { month: 'long', year: 'numeric' })}
            </Text>
          </View>
          
          {monthGoals.length === 0 ? (
            <View style={styles.emptyGoals}>
              <Text style={styles.emptyGoalsText}>No goals due this month</Text>
            </View>
          ) : (
            <View style={styles.goalsList}>
              {monthGoals.map(goal => (
                <View key={goal.id} style={styles.goalCard}>
                  <View style={styles.goalHeader}>
                    <Text style={styles.goalTitle}>{goal.title}</Text>
                    <Text style={styles.goalDate}>
                      {goal.target_completion_date ? 
                        new Date(goal.target_completion_date).toLocaleDateString([], {
                          month: 'short',
                          day: 'numeric'
                        }) : 'No due date'
                      }
                    </Text>
                  </View>
                  
                  {goal.description && (
                    <Text style={styles.goalDescription} numberOfLines={2}>
                      {goal.description}
                    </Text>
                  )}
                  
                  {goal.category && (
                    <View style={styles.goalCategory}>
                      <Text style={styles.goalCategoryText}>{goal.category}</Text>
                    </View>
                  )}
                  
                  {goal.milestones && goal.milestones.length > 0 && (
                    <View style={styles.goalProgress}>
                      <Text style={styles.goalProgressText}>
                        {goal.milestones.filter(m => m.completed).length} of {goal.milestones.length} milestones completed
                      </Text>
                    </View>
                  )}
                </View>
              ))}
            </View>
          )}
        </View>
      </ScrollView>
    );
  };

  // Render view content based on view type
  const renderViewContent = () => {
    switch (state.viewType) {
      case 'day':
        return renderDayView();
      case 'week':
        return renderWeekView();
      case 'month':
        return renderMonthView();
      default:
        return renderMonthView();
    }
  };

  if (state.loading) {
    return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>Loading calendar...</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Offline Indicator */}
      <OfflineIndicator />
      
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Calendar</Text>
        <TouchableOpacity onPress={onRefresh} style={styles.refreshButton}>
          <Text style={styles.refreshButtonText}>↻</Text>
        </TouchableOpacity>
      </View>

      {/* View Type Selector */}
      <View style={styles.viewSelector}>
        {(['day', 'week', 'month'] as ViewType[]).map(viewType => (
          <TouchableOpacity
            key={viewType}
            style={[
              styles.viewButton,
              state.viewType === viewType && styles.viewButtonActive,
            ]}
            onPress={() => handleViewTypeChange(viewType)}
          >
            <Text
              style={[
                styles.viewButtonText,
                state.viewType === viewType && styles.viewButtonTextActive,
              ]}
            >
              {viewType.charAt(0).toUpperCase() + viewType.slice(1)}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Today Button */}
      <TouchableOpacity
        style={styles.todayButton}
        onPress={handleTodayPress}
      >
        <Text style={styles.todayButtonText}>Today</Text>
      </TouchableOpacity>

      {/* Content */}
      <View style={styles.content}>
        {state.error ? (
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>{state.error}</Text>
            <Button
              title="Retry"
              onPress={handleRetryPress}
              variant="outline"
              style={styles.retryButton}
            />
          </View>
        ) : (
          renderViewContent()
        )}
      </View>

      {/* Floating Action Button */}
      <TouchableOpacity
        style={styles.fab}
        onPress={handleCreateEvent}
        activeOpacity={0.8}
      >
        <Text style={styles.fabText}>+</Text>
      </TouchableOpacity>

      {/* Event Form Modal */}
      <EventFormModal
        visible={formModalVisible}
        event={editingEvent}
        onClose={handleCloseForm}
        onSubmit={handleFormSubmit}
        loading={formLoading}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.light,
  },
  title: {
    fontSize: typography.fontSize.xl,
    fontWeight: typography.fontWeight.bold as any,
    color: colors.text.primary,
  },
  refreshButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.surface,
    justifyContent: 'center',
    alignItems: 'center',
  },
  refreshButtonText: {
    fontSize: typography.fontSize.lg,
    color: colors.text.secondary,
  },
  viewSelector: {
    flexDirection: 'row',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.light,
  },
  viewButton: {
    flex: 1,
    paddingVertical: spacing.sm,
    marginHorizontal: spacing.xs,
    borderRadius: spacing.xs,
    backgroundColor: colors.surface,
    alignItems: 'center',
  },
  viewButtonActive: {
    backgroundColor: colors.primary,
  },
  viewButtonText: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.medium as any,
    color: colors.text.secondary,
  },
  viewButtonTextActive: {
    color: colors.secondary,
  },
  todayButton: {
    alignSelf: 'center',
    marginVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: spacing.xs,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border.medium,
  },
  todayButtonText: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.medium as any,
    color: colors.text.primary,
  },
  content: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: spacing.sm,
    fontSize: typography.fontSize.base,
    color: colors.text.secondary,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xl,
  },
  errorText: {
    fontSize: typography.fontSize.base,
    color: colors.error,
    textAlign: 'center',
    marginBottom: spacing.md,
  },
  retryButton: {
    marginTop: spacing.sm,
  },
  dayViewContainer: {
    padding: spacing.md,
  },
  dayViewContent: {
    flexGrow: 1, // Allow content to grow and take available space
    paddingBottom: 100, // Add padding at bottom for better scrolling
  },
  dayViewTitle: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.bold as any,
    color: colors.text.primary,
    marginBottom: spacing.md,
  },
  weekViewContainer: {
    padding: spacing.md,
  },
  weekViewTitle: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.bold as any,
    color: colors.text.primary,
    marginBottom: spacing.md,
  },
  monthViewContainer: {
    flex: 1,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xl,
  },
  emptyStateText: {
    fontSize: typography.fontSize.base,
    color: colors.text.secondary,
    textAlign: 'center',
    marginBottom: spacing.md,
  },
  createButton: {
    marginTop: spacing.sm,
  },
  fab: {
    position: 'absolute',
    bottom: spacing.xl,
    right: spacing.xl,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  fabText: {
    fontSize: typography.fontSize.xl,
    fontWeight: typography.fontWeight.bold as any,
    color: colors.secondary,
  },
  eventsContainer: {
    marginTop: spacing.md,
  },

  timeBlock: {
    marginBottom: spacing.lg,
    backgroundColor: colors.surface,
    borderRadius: spacing.sm,
    padding: spacing.md,
    shadowColor: colors.text.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  timeBlockHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
    paddingBottom: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.light,
  },
  timeBlockTitle: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.bold as any,
    color: colors.text.primary,
  },
  timeBlockTime: {
    fontSize: typography.fontSize.sm,
    color: colors.text.secondary,
    fontWeight: typography.fontWeight.medium as any,
  },
  emptyTimeBlock: {
    padding: spacing.md,
    alignItems: 'center',
  },
  emptyTimeBlockText: {
    fontSize: typography.fontSize.sm,
    color: colors.text.disabled,
    fontStyle: 'italic',
  },
  eventsList: {
    gap: spacing.sm,
  },
  eventCardContainer: {
    marginBottom: spacing.sm,
  },
  dateGroup: {
    marginBottom: spacing.lg,
    backgroundColor: colors.surface,
    borderRadius: spacing.sm,
    padding: spacing.md,
    shadowColor: colors.text.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  dateGroupHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
    paddingBottom: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.light,
  },
  dateGroupTitle: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.bold as any,
    color: colors.text.primary,
  },
  dateGroupDate: {
    fontSize: typography.fontSize.sm,
    color: colors.text.secondary,
    fontWeight: typography.fontWeight.medium as any,
  },
  emptyDateGroup: {
    padding: spacing.md,
    alignItems: 'center',
  },
  emptyDateGroupText: {
    fontSize: typography.fontSize.sm,
    color: colors.text.disabled,
    fontStyle: 'italic',
  },
  goalsSection: {
    padding: spacing.md,
    backgroundColor: colors.background,
  },
  goalsHeader: {
    marginBottom: spacing.md,
  },
  goalsTitle: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.bold as any,
    color: colors.text.primary,
    marginBottom: spacing.xs,
  },
  goalsSubtitle: {
    fontSize: typography.fontSize.sm,
    color: colors.text.secondary,
    fontWeight: typography.fontWeight.medium as any,
  },
  emptyGoals: {
    padding: spacing.lg,
    alignItems: 'center',
  },
  emptyGoalsText: {
    fontSize: typography.fontSize.sm,
    color: colors.text.disabled,
    fontStyle: 'italic',
  },
  goalsList: {
    gap: spacing.sm,
  },
  goalCard: {
    backgroundColor: colors.surface,
    borderRadius: spacing.sm,
    padding: spacing.md,
    marginBottom: spacing.sm,
    shadowColor: colors.text.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  goalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.sm,
  },
  goalTitle: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.bold as any,
    color: colors.text.primary,
    flex: 1,
  },
  goalDate: {
    fontSize: typography.fontSize.sm,
    color: colors.text.secondary,
    fontWeight: typography.fontWeight.medium as any,
  },
  goalDescription: {
    fontSize: typography.fontSize.sm,
    color: colors.text.secondary,
    marginBottom: spacing.sm,
  },
  goalCategory: {
    alignSelf: 'flex-start',
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: spacing.xs,
    marginBottom: spacing.sm,
  },
  goalCategoryText: {
    fontSize: typography.fontSize.xs,
    color: colors.secondary,
    fontWeight: typography.fontWeight.medium as any,
  },
  goalProgress: {
    marginTop: spacing.xs,
  },
  goalProgressText: {
    fontSize: typography.fontSize.xs,
    color: colors.text.secondary,
    fontWeight: typography.fontWeight.medium as any,
  },
});
