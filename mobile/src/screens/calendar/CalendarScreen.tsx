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
  Animated,
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
import { ErrorDisplay, ErrorBanner } from '../../components/common/ErrorDisplay';
import { SearchAndFilter } from '../../components/calendar/SearchAndFilter';
import { enhancedAPI } from '../../services/enhancedApi';
import { errorHandlingService, ErrorCategory, UserFriendlyError } from '../../services/errorHandling';
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
import { LoadingSkeleton } from '../../components/common/LoadingSkeleton';
import { 
  useFadeAnimation, 
  useScaleAnimation, 
  staggerAnimation,
  fadeIn,
  ANIMATION_CONFIG 
} from '../../utils/animations';

const { width } = Dimensions.get('window');

export default function CalendarScreen() {
  const insets = useSafeAreaInsets();
  const dayViewScrollRef = useRef<ScrollView>(null);
  
  // Animation hooks
  const { opacity: contentOpacity, fadeIn: contentFadeIn, fadeOut: contentFadeOut } = useFadeAnimation(1); // Start visible
  const { scale: buttonScale, scaleIn: buttonScaleIn, scaleOut: buttonScaleOut } = useScaleAnimation(1);
  const { scale: cardScale, scaleIn: cardScaleIn, scaleOut: cardScaleOut } = useScaleAnimation(1);
  
  // Stagger animation for event cards
  const eventAnimations = useRef<Animated.Value[]>([]).current;
  
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
  
  // Enhanced error handling state
  const [currentError, setCurrentError] = useState<UserFriendlyError | null>(null);
  const [errorVisible, setErrorVisible] = useState(false);
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [hasMoreEvents, setHasMoreEvents] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);

  // Filtered state for search and filtering
  const [filteredEvents, setFilteredEvents] = useState<CalendarEvent[]>([]);
  const [filteredTasks, setFilteredTasks] = useState<Task[]>([]);

  // Handle filter changes
  const handleFilterChange = useCallback((filteredEvents: CalendarEvent[], filteredTasks: Task[]) => {
    console.log('CalendarScreen handleFilterChange:', {
      filteredEvents: filteredEvents.length,
      filteredTasks: filteredTasks.length
    });
    setFilteredEvents(filteredEvents);
    setFilteredTasks(filteredTasks);
  }, []);

  // Load calendar data with enhanced error handling
  const loadCalendarData = useCallback(async (page = 1, append = false) => {
    if (page === 1) {
      setState(prev => ({ ...prev, loading: true, error: null }));
      setCurrentError(null);
      // Only fade out content if we're not in initial load
      // Temporarily disabled animations for debugging
      // if (!append) {
      //   contentFadeOut(); // Fade out content while loading
      // }
    } else {
      setLoadingMore(true);
    }
    
    try {
      console.log(`Loading calendar data page ${page}...`);
      
      // Load events from backend with proper pagination using enhanced API
      // For initial load, request a larger number to get all upcoming events
      const initialMaxResults = 500; // Increased from 50 to get more events initially
      const maxResults = page === 1 ? initialMaxResults : 50 * page;
      const events = await enhancedAPI.getEvents(maxResults);
      console.log(`Loaded ${events?.length || 0} events from backend (maxResults: ${maxResults})`);
      
      // Load tasks from backend using enhanced API
      const tasks = await enhancedAPI.getTasks();
      console.log(`Loaded ${tasks?.length || 0} tasks from backend`);
      
      // Load goals from backend using enhanced API
      const goals = await enhancedAPI.getGoals();
      console.log(`Loaded ${goals?.length || 0} goals from backend`);
      
      setState(prev => ({
        ...prev,
        events: append ? [...prev.events, ...(events || [])] : (events || []),
        tasks: tasks || [],
        goals: goals || [],
        loading: false,
        error: null,
      }));
      
      // Initialize filtered state with all data
      if (!append) {
        setFilteredEvents(events || []);
        setFilteredTasks(tasks || []);
        console.log('Calendar data loaded:', {
          events: events?.length || 0,
          tasks: tasks?.length || 0,
          goals: goals?.length || 0
        });
      }
      
      // Animate content in for initial load
      if (page === 1) {
        // Temporarily disabled animations for debugging
        // contentFadeIn();
        // // Initialize event animations for stagger effect
        // const totalEvents = (events?.length || 0) + (tasks?.length || 0);
        // eventAnimations.length = 0; // Clear existing animations
        // for (let i = 0; i < totalEvents; i++) {
        //   eventAnimations.push(new Animated.Value(0));
        // }
        
        // // Stagger animation for event cards
        // setTimeout(() => {
        //   const animations = eventAnimations.map((anim, index) => 
        //     Animated.timing(anim, {
        //       toValue: 1,
        //       duration: 300,
        //       delay: index * 50,
        //       useNativeDriver: true,
        //     })
        //   );
        //   Animated.parallel(animations).start();
        // }, 100);
      }
      
      // Update pagination state
      setCurrentPage(page);
      setHasMoreEvents((events?.length || 0) >= 50); // Check if we got a full page
      setLoadingMore(false);
    } catch (error) {
      console.error('Error loading calendar data:', error);
      
      // Handle error with enhanced error handling service
      if (error && typeof error === 'object' && 'title' in error) {
        // This is a UserFriendlyError from our enhanced API
        setCurrentError(error as UserFriendlyError);
        setErrorVisible(true);
      } else {
        // Fallback error handling
        const userError = await errorHandlingService.handleError(
          error,
          ErrorCategory.CALENDAR,
          {
            operation: 'loadCalendarData',
            endpoint: 'calendar/events',
            timestamp: Date.now(),
            retryCount: 0,
          }
        );
        setCurrentError(userError);
        setErrorVisible(true);
      }
      
      setState(prev => ({
        ...prev,
        loading: false,
        error: 'Failed to load calendar data',
      }));
      setLoadingMore(false);
      // Ensure content is visible even on error
      // contentFadeIn();
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

  // Handle event delete with enhanced error handling
  const handleEventDelete = useCallback(async (eventId: string) => {
    let event: CalendarEvent | undefined;
    let task: Task | undefined;
    
    try {
      // Determine if it's an event or task based on the ID
      event = state.events.find(e => e.id === eventId);
      task = state.tasks.find(t => t.id === eventId);
      
      if (event) {
        await enhancedAPI.deleteEvent(eventId);
      } else if (task) {
        await enhancedAPI.deleteTask(eventId);
      } else {
        throw new Error('Event or task not found');
      }
      
      // Reload data to reflect changes
      await loadCalendarData();
      hapticFeedback.success();
    } catch (error) {
      console.error('Error deleting event:', error);
      hapticFeedback.error();
      
      // Handle error with enhanced error handling
      if (error && typeof error === 'object' && 'title' in error) {
        setCurrentError(error as UserFriendlyError);
        setErrorVisible(true);
      } else {
        const userError = await errorHandlingService.handleError(
          error,
          event ? ErrorCategory.CALENDAR : ErrorCategory.TASKS,
          {
            operation: 'deleteEvent',
            endpoint: event ? `calendar/events/${eventId}` : `tasks/${eventId}`,
            timestamp: Date.now(),
            retryCount: 0,
          }
        );
        setCurrentError(userError);
        setErrorVisible(true);
      }
    }
  }, [state.events, state.tasks, loadCalendarData]);

  // Handle task completion with enhanced error handling
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

      // Update the backend using enhanced API
      await enhancedAPI.updateTask(taskId, { status: newStatus });
      
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
      
      // Handle error with enhanced error handling
      if (error && typeof error === 'object' && 'title' in error) {
        setCurrentError(error as UserFriendlyError);
        setErrorVisible(true);
      } else {
        const userError = await errorHandlingService.handleError(
          error,
          ErrorCategory.TASKS,
          {
            operation: 'completeTask',
            endpoint: `tasks/${taskId}`,
            timestamp: Date.now(),
            retryCount: 0,
          }
        );
        setCurrentError(userError);
        setErrorVisible(true);
      }
    }
  }, [state.tasks]);

  // Handle event/task rescheduling with enhanced error handling
  const handleReschedule = useCallback(async (eventId: string, newDate: Date) => {
    let event: CalendarEvent | undefined;
    let task: Task | undefined;
    
    try {
      // Determine if it's an event or task based on the ID
      event = state.events.find(e => e.id === eventId);
      task = state.tasks.find(t => t.id === eventId);
      
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
          const newEndTime = new Date(newStartTime.getTime() + duration);
          
          await enhancedAPI.updateEvent(eventId, {
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
        
        await enhancedAPI.updateTask(eventId, {
          due_date: newDueDate.toISOString(),
        });
      }
      
      // Refresh data
      await loadCalendarData();
      hapticFeedback.success();
    } catch (error) {
      console.error('Error rescheduling event:', error);
      hapticFeedback.error();
      
      // Handle error with enhanced error handling
      if (error && typeof error === 'object' && 'title' in error) {
        setCurrentError(error as UserFriendlyError);
        setErrorVisible(true);
      } else {
        const userError = await errorHandlingService.handleError(
          error,
          event ? ErrorCategory.CALENDAR : ErrorCategory.TASKS,
          {
            operation: 'rescheduleEvent',
            endpoint: event ? `calendar/events/${eventId}` : `tasks/${eventId}`,
            timestamp: Date.now(),
            retryCount: 0,
          }
        );
        setCurrentError(userError);
        setErrorVisible(true);
      }
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
          await enhancedAPI.updateEvent(editingEvent.id, {
            summary: formData.title,
            description: formData.description,
            startTime: formData.startTime.toISOString(),
            endTime: formData.endTime.toISOString(),
            location: formData.location,
          });
        } else {
          // It's a task
          await enhancedAPI.updateTask(editingEvent.id, {
            title: formData.title,
            description: formData.description,
            due_date: formData.startTime.toISOString(),
            estimated_duration_minutes: Math.round((formData.endTime.getTime() - formData.startTime.getTime()) / (1000 * 60)),
          });
        }
      } else {
        // Create new event
        await enhancedAPI.createEvent({
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

  // Handle retry button press with enhanced error handling
  const handleRetryPress = useCallback(() => {
    hapticFeedback.medium();
    setCurrentError(null);
    setErrorVisible(false);
    loadCalendarData(1, false);
  }, [loadCalendarData]);

  // Get events for selected date
  const getEventsForSelectedDate = useCallback(() => {
    const selectedDateStr = formatDateToYYYYMMDD(state.selectedDate);
    const dayEvents: DayViewEvent[] = [];

    // Add calendar events
    filteredEvents.forEach((event, index) => {
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
    filteredTasks.forEach(task => {
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
  }, [filteredEvents, filteredTasks, state.selectedDate]);

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
    filteredEvents.forEach(event => {
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
    filteredTasks.forEach(task => {
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
  }, [filteredEvents, filteredTasks, state.goals]);

  // Render day view with time blocks
  const renderDayView = useCallback(() => {
    const selectedDateStr = formatDateToYYYYMMDD(state.selectedDate);
    
    // Get events for the selected date
    const dayEvents = getEventsForSelectedDate();
    console.log('Day view rendering:', {
      selectedDate: selectedDateStr,
      dayEvents: dayEvents.length,
      filteredEvents: filteredEvents.length,
      filteredTasks: filteredTasks.length
    });
    
    // Group events by time blocks (6-hour segments)
    const timeBlocks: Array<{
      name: string;
      start: number;
      end: number;
      events: DayViewEvent[];
    }> = [
      {
        name: 'Early Morning',
        start: 0,
        end: 6,
        events: [],
      },
      {
        name: 'Morning',
        start: 6,
        end: 12,
        events: [],
      },
      {
        name: 'Afternoon',
        start: 12,
        end: 18,
        events: [],
      },
      {
        name: 'Evening',
        start: 18,
        end: 24,
        events: [],
      },
    ];
    
    // Distribute events into time blocks
    dayEvents.forEach(event => {
      const eventHour = event.startTime.getHours();
      let blockIndex = -1;
      
      if (eventHour >= 0 && eventHour < 6) {
        blockIndex = 0; // Early Morning
      } else if (eventHour >= 6 && eventHour < 12) {
        blockIndex = 1; // Morning
      } else if (eventHour >= 12 && eventHour < 18) {
        blockIndex = 2; // Afternoon
      } else if (eventHour >= 18 && eventHour < 24) {
        blockIndex = 3; // Evening
      }
      
      if (blockIndex >= 0 && blockIndex < timeBlocks.length) {
        timeBlocks[blockIndex].events.push(event);
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
                  {block.start === 0 ? '12:00 AM' : block.start === 12 ? '12:00 PM' : block.start > 12 ? `${block.start - 12}:00 PM` : `${block.start}:00 AM`} - {block.end === 24 ? '12:00 AM' : block.end === 12 ? '12:00 PM' : block.end > 12 ? `${block.end - 12}:00 PM` : `${block.end}:00 AM`}
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
  }, [state.selectedDate, filteredEvents, filteredTasks, state.loading, refreshing, onRefresh, handleEventEdit, handleEventDelete, handleTaskComplete, handleReschedule, handleCreateEvent]);

  // Render week view with list-based layout grouped by date
  const renderWeekView = useCallback(() => {
    const weekStart = new Date(state.selectedDate);
    weekStart.setDate(weekStart.getDate() - weekStart.getDay());
    console.log('Week view rendering:', {
      weekStart: weekStart.toISOString(),
      filteredEvents: filteredEvents.length,
      filteredTasks: filteredTasks.length
    });
    
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
    filteredEvents.forEach(event => {
      try {
        // Handle both database format and Google Calendar API format
        const eventDate = new Date(event.start_time || event.start?.dateTime || '');
        const eventDateStr = formatDateToYYYYMMDD(eventDate);
        
        const group = dateGroups.find(g => g.dateString === eventDateStr);
        if (group) {
          group.events.push({
            id: event.id,
            title: event.title || event.summary || 'Untitled Event',
            startTime: eventDate,
            endTime: new Date(event.end_time || event.end?.dateTime || eventDate.getTime() + 60 * 60 * 1000),
            day: eventDate.getDay(),
            type: 'event' as const,
            data: event,
            color: colors.primary,
          });
        }
      } catch (error) {
        console.error('Error processing event:', error);
      }
    });
    
    // Add tasks to date groups
    filteredTasks.forEach(task => {
      if (task.due_date) {
        try {
          const taskDate = new Date(task.due_date);
          const taskDateStr = formatDateToYYYYMMDD(taskDate);
          
          const group = dateGroups.find(g => g.dateString === taskDateStr);
          if (group) {
            group.events.push({
              id: task.id,
              title: task.title,
              startTime: taskDate,
              endTime: new Date(taskDate.getTime() + (task.estimated_duration_minutes || 60) * 60 * 1000),
              day: taskDate.getDay(),
              type: 'task' as const,
              data: task,
              color: task.priority === 'high' ? colors.error : task.priority === 'medium' ? colors.warning : colors.success,
            });
          }
        } catch (error) {
          console.error('Error processing task:', error);
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
  }, [state.selectedDate, filteredEvents, filteredTasks, state.loading, refreshing, onRefresh, handleEventEdit, handleEventDelete, handleTaskComplete, handleReschedule, handleCreateEvent]);

  // Render month view
  const renderMonthView = () => {
    const monthGoals = getGoalsForCurrentMonth();
    console.log('Month view rendering:', {
      selectedDate: state.selectedDate.toISOString(),
      monthGoals: monthGoals.length,
      filteredEvents: filteredEvents.length,
      filteredTasks: filteredTasks.length
    });
    
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
            textDayFontSize: typography.fontSize.sm,
            textMonthFontSize: typography.fontSize.lg,
            textDayHeaderFontSize: typography.fontSize.sm,
          }}
        />
        
        {/* Month Goals Section */}
        {monthGoals.length > 0 && (
          <View style={styles.monthGoalsSection}>
            <Text style={styles.monthGoalsTitle}>This Month's Goals</Text>
            {monthGoals.map(goal => (
              <View key={goal.id} style={styles.goalCard}>
                <Text style={styles.goalTitle}>{goal.title}</Text>
                {goal.description && (
                  <Text style={styles.goalDescription}>{goal.description}</Text>
                )}
              </View>
            ))}
          </View>
        )}
        
        {/* Quick Actions */}
        <View style={styles.quickActionsSection}>
          <Text style={styles.quickActionsTitle}>Quick Actions</Text>
          <View style={styles.quickActionsGrid}>
            <TouchableOpacity
              style={styles.quickActionButton}
              onPress={handleCreateEvent}
            >
              <Text style={styles.quickActionButtonText}>Create Event</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.quickActionButton}
              onPress={() => {
                // Navigate to tasks screen or create task modal
                console.log('Create task');
              }}
            >
              <Text style={styles.quickActionButtonText}>Create Task</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    );
  };

  // Render view content based on selected view type
  const renderViewContent = () => {
    console.log('Rendering view content:', {
      viewType: state.viewType,
      loading: state.loading,
      error: state.error
    });
    
    switch (state.viewType) {
      case 'day':
        return renderDayView();
      case 'week':
        return renderWeekView();
      case 'month':
        return renderMonthView();
      default:
        return renderDayView();
    }
  };

  // Only show loading skeleton for initial load, not for pagination
  if (state.loading && currentPage === 1) {
    return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <View style={styles.header}>
          <Text style={styles.title}>Calendar</Text>
        </View>
        <LoadingSkeleton type="event" count={5} />
      </View>
    );
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Error Banner for critical errors */}
      {currentError && currentError.severity === 'CRITICAL' && (
        <ErrorBanner
          error={currentError}
          onRetry={() => {
            setCurrentError(null);
            setErrorVisible(false);
            loadCalendarData();
          }}
          onDismiss={() => {
            setCurrentError(null);
            setErrorVisible(false);
          }}
          onAction={(action) => {
            if (action === 'signIn') {
              // Handle sign in action
              console.log('Navigate to sign in');
            }
          }}
        />
      )}
      
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

      {/* Search and Filter */}
      <SearchAndFilter
        events={state.events}
        tasks={state.tasks}
        onFilterChange={handleFilterChange}
        viewType={state.viewType}
      />

      {/* Content with Animation */}
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

      {/* Error Display for non-critical errors */}
      {currentError && currentError.severity !== 'CRITICAL' && (
        <ErrorDisplay
          error={currentError}
          onRetry={() => {
            setCurrentError(null);
            setErrorVisible(false);
            loadCalendarData();
          }}
          onDismiss={() => {
            setCurrentError(null);
            setErrorVisible(false);
          }}
          onAction={(action) => {
            if (action === 'signIn') {
              // Handle sign in action
              console.log('Navigate to sign in');
            }
          }}
        />
      )}

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
  monthGoalsSection: {
    padding: spacing.md,
    backgroundColor: colors.background,
    borderTopWidth: 1,
    borderTopColor: colors.border.light,
  },
  monthGoalsTitle: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.bold as any,
    color: colors.text.primary,
    marginBottom: spacing.sm,
  },
  quickActionsSection: {
    padding: spacing.md,
    backgroundColor: colors.background,
    borderTopWidth: 1,
    borderTopColor: colors.border.light,
  },
  quickActionsTitle: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.bold as any,
    color: colors.text.primary,
    marginBottom: spacing.sm,
  },
  quickActionsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    flexWrap: 'wrap',
  },
  quickActionButton: {
    width: '45%', // Adjust as needed for grid layout
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.sm,
    borderRadius: spacing.sm,
    backgroundColor: colors.primary,
    alignItems: 'center',
    marginVertical: spacing.xs,
  },
  quickActionButtonText: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.medium as any,
    color: colors.secondary,
  },
});
