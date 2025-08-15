import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Modal,
  Animated,
} from 'react-native';
import { colors } from '../../themes/colors';
import { typography } from '../../themes/typography';
import { spacing } from '../../themes/spacing';
import { CalendarEvent, Task, ViewType } from '../../types/calendar';
// import { format, startOfWeek, endOfWeek, startOfDay, endOfDay, isToday, isThisWeek, isOverdue } from '../../utils/dateUtils';
import { 
  useFadeAnimation, 
  useScaleAnimation, 
  triggerHaptic,
  ANIMATION_CONFIG 
} from '../../utils/animations';

// Filter types
export interface FilterOptions {
  searchText: string;
  eventType: 'all' | 'events' | 'tasks';
  priority: 'all' | 'low' | 'medium' | 'high';
  status: 'all' | 'not_started' | 'in_progress' | 'completed';
  dateRange: 'all' | 'today' | 'this_week' | 'overdue' | 'custom' | 'upcoming' | 'past';
  customStartDate?: Date;
  customEndDate?: Date;
  category?: string;
  // New meaningful filters
  timeOfDay: 'all' | 'morning' | 'afternoon' | 'evening' | 'night';
  duration: 'all' | 'short' | 'medium' | 'long';
  location: 'all' | 'online' | 'in_person' | 'hybrid';
  recurring: 'all' | 'one_time' | 'recurring';
  urgency: 'all' | 'urgent' | 'normal' | 'low_priority';
}

interface SearchAndFilterProps {
  events: CalendarEvent[];
  tasks: Task[];
  onFilterChange: (filteredEvents: CalendarEvent[], filteredTasks: Task[]) => void;
  viewType: ViewType;
}

export const SearchAndFilter: React.FC<SearchAndFilterProps> = ({
  events,
  tasks,
  onFilterChange,
}) => {
  const [searchText, setSearchText] = useState('');
  const [filterModalVisible, setFilterModalVisible] = useState(false);
  const [filterOptions, setFilterOptions] = useState<FilterOptions>({
    searchText: '',
    eventType: 'all',
    priority: 'all',
    status: 'all',
    dateRange: 'all',
    timeOfDay: 'all',
    duration: 'all',
    location: 'all',
    recurring: 'all',
    urgency: 'all',
  });

  // Animation hooks
  const { fadeIn: modalFadeIn, fadeOut: modalFadeOut } = useFadeAnimation(0);
  const { scale: buttonScale } = useScaleAnimation(1);
  const { scale: chipScale, scaleIn: chipScaleIn, scaleOut: chipScaleOut } = useScaleAnimation(1);
  
  // Modal slide animation
  const modalSlideY = useRef(new Animated.Value(300)).current;

  // Get unique categories from tasks
  const categories = Array.from(new Set(tasks.map(task => task.category).filter(Boolean)));

  // Apply filters and search
  const applyFilters = useCallback(() => {
    let filteredEvents = [...events];
    let filteredTasks = [...tasks];



    // Search by title/description
    if (searchText.trim()) {
      const searchLower = searchText.toLowerCase();
      filteredEvents = filteredEvents.filter(event => 
        (event.title?.toLowerCase().includes(searchLower) ||
         event.summary?.toLowerCase().includes(searchLower) ||
         event.description?.toLowerCase().includes(searchLower))
      );
      filteredTasks = filteredTasks.filter(task =>
        task.title.toLowerCase().includes(searchLower) ||
        task.description?.toLowerCase().includes(searchLower)
      );
    }

    // Filter by event type
    if (filterOptions.eventType !== 'all') {
      if (filterOptions.eventType === 'events') {
        filteredTasks = [];
      } else if (filterOptions.eventType === 'tasks') {
        filteredEvents = [];
      }
    }

    // Filter by priority (tasks only)
    if (filterOptions.priority !== 'all') {
      filteredTasks = filteredTasks.filter(task => task.priority === filterOptions.priority);
    }

    // Filter by status (tasks only)
    if (filterOptions.status !== 'all') {
      filteredTasks = filteredTasks.filter(task => task.status === filterOptions.status);
    }

    // Temporarily disable date range filtering for debugging
    // // Filter by date range
    // if (filterOptions.dateRange !== 'all') {
    //   const now = new Date();
    //   
    //   switch (filterOptions.dateRange) {
    //     case 'today':
    //       const todayStart = startOfDay(now);
    //       const todayEnd = endOfDay(now);
    //       filteredEvents = filteredEvents.filter(event => {
    //         const eventDate = new Date(event.start_time || event.start?.dateTime || '');
    //         return eventDate >= todayStart && eventDate <= todayEnd;
    //       });
    //       filteredTasks = filteredTasks.filter(task => {
    //         if (!task.due_date) return false;
    //         const taskDate = new Date(task.due_date);
    //         return taskDate >= todayStart && taskDate <= todayEnd;
    //       });
    //       break;
    //       
    //   case 'this_week':
    //     const weekStart = startOfWeek(now);
    //     const weekEnd = endOfWeek(now);
    //     filteredEvents = filteredEvents.filter(event => {
    //       const eventDate = new Date(event.start_time || event.start?.dateTime || '');
    //       return eventDate >= weekStart && eventDate <= weekEnd;
    //     });
    //     filteredTasks = filteredTasks.filter(task => {
    //       if (!task.due_date) return false;
    //       const taskDate = new Date(task.due_date);
    //       return taskDate >= weekStart && taskDate <= weekEnd;
    //     });
    //     break;
    //     
    //   case 'overdue':
    //     filteredTasks = filteredTasks.filter(task => {
    //       if (!task.due_date || task.status === 'completed') return false;
    //       const taskDate = new Date(task.due_date);
    //       return taskDate < now;
    //     });
    //     break;
    //     
    //   case 'upcoming':
    //     const upcomingStart = now;
    //     const upcomingEnd = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000); // Next 7 days
    //     filteredEvents = filteredEvents.filter(event => {
    //       const eventDate = new Date(event.start_time || event.start?.dateTime || '');
    //       return eventDate >= upcomingStart && eventDate <= upcomingEnd;
    //     });
    //     filteredTasks = filteredTasks.filter(task => {
    //       if (!task.due_date) return false;
    //       const taskDate = new Date(task.due_date);
    //       return taskDate >= upcomingStart && taskDate <= upcomingEnd;
    //     });
    //     break;
    //     
    //   case 'past':
    //     const pastEnd = now;
    //     const pastStart = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000); // Last 7 days
    //     filteredEvents = filteredEvents.filter(event => {
    //       const eventDate = new Date(event.start_time || event.start?.dateTime || '');
    //       return eventDate >= pastStart && eventDate <= pastEnd;
    //     });
    //     filteredEvents = filteredTasks.filter(task => {
    //       if (!task.due_date) return false;
    //       const taskDate = new Date(task.due_date);
    //       return taskDate >= pastStart && taskDate <= pastEnd;
    //     });
    //     break;
    //     
    //   case 'custom':
    //     if (filterOptions.customStartDate && filterOptions.customEndDate) {
    //       const customStart = startOfDay(filterOptions.customStartDate);
    //       const customEnd = endOfDay(filterText);
    //       filteredEvents = filteredEvents.filter(event => {
    //         const eventDate = new Date(event.start_time || event.start?.dateTime || '');
    //         return eventDate >= customStart && eventDate <= customEnd;
    //       });
    //       filteredTasks = filteredTasks.filter(task => {
    //         if (!task.due_date) return false;
    //         const taskDate = new Date(task.due_date);
    //         return taskDate >= customStart && taskDate <= customEnd;
    //       });
    //     }
    //     break;
    //   }
    // }

    // Temporarily disable all remaining filters for debugging
    // // Filter by time of day
    // if (filterOptions.timeOfDay !== 'all') {
    //   filteredEvents = filteredEvents.filter(event => {
    //     const eventDate = new Date(event.start_time || event.start?.dateTime || '');
    //     const hour = eventDate.getHours();
    //     
    //     switch (filterOptions.timeOfDay) {
    //       case 'morning': return hour >= 6 && hour < 12;
    //       case 'afternoon': return hour >= 12 && hour < 17;
    //       case 'evening': return hour >= 17 && hour < 21;
    //       case 'night': return hour >= 21 || hour < 6;
    //       default: return true;
    //     }
    //   });
    // }

    // // Filter by duration (for events)
    // if (filterOptions.duration !== 'all') {
    //   filteredEvents = filteredEvents.filter(event => {
    //     const start = new Date(event.start_time || event.start?.dateTime || '');
    //     const end = new Date(event.end_time || event.end?.dateTime || '');
    //     const durationHours = (end.getTime() - start.getTime()) / (1000 * 60 * 60);
    //     
    //     switch (filterOptions.duration) {
    //       case 'short': return durationHours <= 1;
    //       case 'medium': return durationHours > 1 && durationHours <= 4;
    //       case 'long': return durationHours > 4;
    //       default: return true;
    //     }
    //   });
    // }

    // // Filter by location type
    // if (filterOptions.location !== 'all') {
    //   filteredEvents = filteredEvents.filter(event => {
    //     const location = event.location?.toLowerCase() || '';
    //     const description = event.description?.toLowerCase() || '';
    //     const summary = event.summary?.toLowerCase() || '';
    //     const text = `${location} ${description} ${summary}`;
    //     
    //     switch (filterOptions.location) {
    //       case 'online': return text.includes('zoom') || text.includes('meet') || text.includes('teams') || text.includes('online') || text.includes('virtual');
    //       case 'in_person': return text.includes('office') || text.includes('room') || text.includes('building') || text.includes('venue') || text.includes('location');
    //       case 'hybrid': return text.includes('hybrid') || (text.includes('online') && (text.includes('office') || text.includes('room')));
    //       default: return true;
    //     }
    //   });
    // }

    // // Filter by recurring vs one-time
    // if (filterOptions.recurring !== 'all') {
    //   filteredEvents = filteredEvents.filter(event => {
    //     const description = event.description?.toLowerCase() || '';
    //     const isRecurring = description.includes('recurring') || 
    //                        description.includes('weekly') || 
    //                        description.includes('monthly') || 
    //                        description.includes('daily') ||
    //                        description.includes('repeat');
    //     
    //     switch (filterOptions.recurring) {
    //       case 'recurring': return isRecurring;
    //       case 'one_time': return !isRecurring;
    //       default: return true;
    //     }
    //   });
    // }

    // // Filter by urgency (combines priority and due date proximity)
    // if (filterOptions.urgency !== 'all') {
    //   const now = new Date();
    //   
    //   filteredTasks = filteredTasks.filter(task => {
    //     if (!task.due_date) return filterOptions.urgency === 'low_priority';
    //     
    //     const dueDate = new Date(task.due_date);
    //     const daysUntilDue = (dueDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24);
    //     const isHighPriority = task.priority === 'high';
    //     const isOverdue = dueDate < now;
    //     
    //     switch (filterOptions.urgency) {
    //       case 'urgent': return isOverdue || (daysUntilDue <= 1) || isHighPriority;
    //       case 'normal': return daysUntilDue > 1 && daysUntilDue <= 7 && task.priority !== 'high';
    //       case 'low_priority': return daysUntilDue > 7 && task.priority === 'low';
    //       default: return true;
    //     }
    //   });
    // }

    // // Filter by category
    // if (filterOptions.category) {
    //   filteredTasks = filteredTasks.filter(task => task.category === filterOptions.category);
    // }


    onFilterChange(filteredEvents, filteredTasks);
  }, [events, tasks, onFilterChange, searchText, filterOptions]);

  // Single useEffect to handle all filter changes
  useEffect(() => {
    applyFilters();
  }, [applyFilters]);

  const clearFilters = () => {
    setSearchText('');
    setFilterOptions({
      searchText: '',
      eventType: 'all',
      priority: 'all',
      status: 'all',
      dateRange: 'all',
      timeOfDay: 'all',
      duration: 'all',
      location: 'all',
      recurring: 'all',
      urgency: 'all',
    });
  };

  const getActiveFiltersCount = () => {
    let count = 0;
    if (searchText) {count++;}
    if (filterOptions.eventType !== 'all') {count++;}
    if (filterOptions.priority !== 'all') {count++;}
    if (filterOptions.status !== 'all') {count++;}
    if (filterOptions.dateRange !== 'all') {count++;}
    if (filterOptions.category) {count++;}
    if (filterOptions.timeOfDay !== 'all') {count++;}
    if (filterOptions.duration !== 'all') {count++;}
    if (filterOptions.location !== 'all') {count++;}
    if (filterOptions.recurring !== 'all') {count++;}
    if (filterOptions.urgency !== 'all') {count++;}
    return count;
  };

  // Modal animation handlers
  // open modal for filters
  const openModal = useCallback(() => {
    setFilterModalVisible(true);
    try {
      modalFadeIn();
      Animated.spring(modalSlideY, {
        toValue: 0,
        ...ANIMATION_CONFIG.SPRING,
      }).start();
      triggerHaptic('light');
    } catch (error) {
      console.error('Error in openModal animation:', error);
    }
  }, [modalFadeIn, modalSlideY]);

  // close modal for filters
  const closeModal = useCallback(() => {
    modalFadeOut();
    Animated.spring(modalSlideY, {
      toValue: 300,
      ...ANIMATION_CONFIG.SPRING,
    }).start(() => {
      setFilterModalVisible(false);
    });
    triggerHaptic('light');
  }, [modalFadeOut, modalSlideY]);

  // Button press handlers with animations
  const handleFilterButtonPress = openModal;

  const handleChipPress = (onPress: () => void) => {
    chipScaleOut();
    setTimeout(() => {
      chipScaleIn();
      onPress();
      triggerHaptic('light');
    }, 100);
  };

  const renderFilterChip = (label: string, value: string, onPress: () => void) => (
    <Animated.View style={{ transform: [{ scale: chipScale }] }}>
      <TouchableOpacity
        style={[styles.filterChip, { backgroundColor: colors.primary }]}
        onPress={() => handleChipPress(onPress)}
        activeOpacity={0.8}
      >
        <Text style={[styles.filterChipText, { color: colors.secondary }]}>{label}</Text>
      </TouchableOpacity>
    </Animated.View>
  );

  const renderFilterModal = () => {
    return (
    <Modal
      visible={filterModalVisible}
      animationType="slide"
      transparent={true}
      onRequestClose={closeModal}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Filter Options</Text>
            <TouchableOpacity onPress={closeModal}>
              <Text style={styles.closeButton}>✕</Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalBody}>
            {/* Event Type Filter */}
            <View style={styles.filterSection}>
              <Text style={styles.filterSectionTitle}>Event Type</Text>
              <View style={styles.filterOptions}>
                {[
                  { label: 'All', value: 'all' },
                  { label: 'Events', value: 'events' },
                  { label: 'Tasks', value: 'tasks' },
                ].map(option => (
                  <TouchableOpacity
                    key={option.value}
                    style={[
                      styles.filterOption,
                      filterOptions.eventType === option.value && styles.filterOptionActive
                    ]}
                    onPress={() => setFilterOptions(prev => ({ ...prev, eventType: option.value as any }))}
                  >
                    <Text style={[
                      styles.filterOptionText,
                      filterOptions.eventType === option.value && styles.filterOptionTextActive
                    ]}>
                      {option.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Priority Filter */}
            <View style={styles.filterSection}>
              <Text style={styles.filterSectionTitle}>Priority</Text>
              <View style={styles.filterOptions}>
                {[
                  { label: 'All', value: 'all' },
                  { label: 'Low', value: 'low' },
                  { label: 'Medium', value: 'medium' },
                  { label: 'High', value: 'high' },
                ].map(option => (
                  <TouchableOpacity
                    key={option.value}
                    style={[
                      styles.filterOption,
                      filterOptions.priority === option.value && styles.filterOptionActive
                    ]}
                    onPress={() => setFilterOptions(prev => ({ ...prev, priority: option.value as any }))}
                  >
                    <Text style={[
                      styles.filterOptionText,
                      filterOptions.priority === option.value && styles.filterOptionTextActive
                    ]}>
                      {option.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Status Filter */}
            <View style={styles.filterSection}>
              <Text style={styles.filterSectionTitle}>Status</Text>
              <View style={styles.filterOptions}>
                {[
                  { label: 'All', value: 'all' },
                  { label: 'Not Started', value: 'not_started' },
                  { label: 'In Progress', value: 'in_progress' },
                  { label: 'Completed', value: 'completed' },
                ].map(option => (
                  <TouchableOpacity
                    key={option.value}
                    style={[
                      styles.filterOption,
                      filterOptions.status === option.value && styles.filterOptionActive
                    ]}
                    onPress={() => setFilterOptions(prev => ({ ...prev, status: option.value as any }))}
                  >
                    <Text style={[
                      styles.filterOptionText,
                      filterOptions.status === option.value && styles.filterOptionTextActive
                    ]}>
                      {option.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Date Range Filter */}
            <View style={styles.filterSection}>
              <Text style={styles.filterSectionTitle}>Date Range</Text>
              <View style={styles.filterOptions}>
                {[
                  { label: 'All', value: 'all' },
                  { label: 'Today', value: 'today' },
                  { label: 'This Week', value: 'this_week' },
                  { label: 'Upcoming', value: 'upcoming' },
                  { label: 'Past', value: 'past' },
                  { label: 'Overdue', value: 'overdue' },
                ].map(option => (
                  <TouchableOpacity
                    key={option.value}
                    style={[
                      styles.filterOption,
                      filterOptions.dateRange === option.value && styles.filterOptionActive
                    ]}
                    onPress={() => setFilterOptions(prev => ({ ...prev, dateRange: option.value as any }))}
                  >
                    <Text style={[
                      styles.filterOptionText,
                      filterOptions.dateRange === option.value && styles.filterOptionTextActive
                    ]}>
                      {option.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Time of Day Filter */}
            <View style={styles.filterSection}>
              <Text style={styles.filterSectionTitle}>Time of Day</Text>
              <View style={styles.filterOptions}>
                {[
                  { label: 'All', value: 'all' },
                  { label: 'Morning', value: 'morning' },
                  { label: 'Afternoon', value: 'afternoon' },
                  { label: 'Evening', value: 'evening' },
                  { label: 'Night', value: 'night' },
                ].map(option => (
                  <TouchableOpacity
                    key={option.value}
                    style={[
                      styles.filterOption,
                      filterOptions.timeOfDay === option.value && styles.filterOptionActive
                    ]}
                    onPress={() => setFilterOptions(prev => ({ ...prev, timeOfDay: option.value as any }))}
                  >
                    <Text style={[
                      styles.filterOptionText,
                      filterOptions.timeOfDay === option.value && styles.filterOptionTextActive
                    ]}>
                      {option.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Duration Filter */}
            <View style={styles.filterSection}>
              <Text style={styles.filterSectionTitle}>Duration</Text>
              <View style={styles.filterOptions}>
                {[
                  { label: 'All', value: 'all' },
                  { label: 'Short (≤1h)', value: 'short' },
                  { label: 'Medium (1-4h)', value: 'medium' },
                  { label: 'Long (>4h)', value: 'long' },
                ].map(option => (
                  <TouchableOpacity
                    key={option.value}
                    style={[
                      styles.filterOption,
                      filterOptions.duration === option.value && styles.filterOptionActive
                    ]}
                    onPress={() => setFilterOptions(prev => ({ ...prev, duration: option.value as any }))}
                  >
                    <Text style={[
                      styles.filterOptionText,
                      filterOptions.duration === option.value && styles.filterOptionTextActive
                    ]}>
                      {option.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Location Filter */}
            <View style={styles.filterSection}>
              <Text style={styles.filterSectionTitle}>Location Type</Text>
              <View style={styles.filterOptions}>
                {[
                  { label: 'All', value: 'all' },
                  { label: 'Online', value: 'online' },
                  { label: 'In Person', value: 'in_person' },
                  { label: 'Hybrid', value: 'hybrid' },
                ].map(option => (
                  <TouchableOpacity
                    key={option.value}
                    style={[
                      styles.filterOption,
                      filterOptions.location === option.value && styles.filterOptionActive
                    ]}
                    onPress={() => setFilterOptions(prev => ({ ...prev, location: option.value as any }))}
                  >
                    <Text style={[
                      styles.filterOptionText,
                      filterOptions.location === option.value && styles.filterOptionTextActive
                    ]}>
                      {option.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Recurring Filter */}
            <View style={styles.filterSection}>
              <Text style={styles.filterSectionTitle}>Recurring</Text>
              <View style={styles.filterOptions}>
                {[
                  { label: 'All', value: 'all' },
                  { label: 'One Time', value: 'one_time' },
                  { label: 'Recurring', value: 'recurring' },
                ].map(option => (
                  <TouchableOpacity
                    key={option.value}
                    style={[
                      styles.filterOption,
                      filterOptions.recurring === option.value && styles.filterOptionActive
                    ]}
                    onPress={() => setFilterOptions(prev => ({ ...prev, recurring: option.value as any }))}
                  >
                    <Text style={[
                      styles.filterOptionText,
                      filterOptions.recurring === option.value && styles.filterOptionTextActive
                    ]}>
                      {option.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Urgency Filter */}
            <View style={styles.filterSection}>
              <Text style={styles.filterSectionTitle}>Urgency</Text>
              <View style={styles.filterOptions}>
                {[
                  { label: 'All', value: 'all' },
                  { label: 'Urgent', value: 'urgent' },
                  { label: 'Normal', value: 'normal' },
                  { label: 'Low Priority', value: 'low_priority' },
                ].map(option => (
                  <TouchableOpacity
                    key={option.value}
                    style={[
                      styles.filterOption,
                      filterOptions.urgency === option.value && styles.filterOptionActive
                    ]}
                    onPress={() => setFilterOptions(prev => ({ ...prev, urgency: option.value as any }))}
                  >
                    <Text style={[
                      styles.filterOptionText,
                      filterOptions.urgency === option.value && styles.filterOptionTextActive
                    ]}>
                      {option.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Category Filter */}
            {categories.length > 0 && (
              <View style={styles.filterSection}>
                <Text style={styles.filterSectionTitle}>Category</Text>
                <View style={styles.filterOptions}>
                  <TouchableOpacity
                    style={[
                      styles.filterOption,
                      !filterOptions.category && styles.filterOptionActive
                    ]}
                    onPress={() => setFilterOptions(prev => ({ ...prev, category: undefined }))}
                  >
                    <Text style={[
                      styles.filterOptionText,
                      !filterOptions.category && styles.filterOptionTextActive
                    ]}>
                      All
                    </Text>
                  </TouchableOpacity>
                  {categories.map(category => (
                    <TouchableOpacity
                      key={category}
                      style={[
                        styles.filterOption,
                        filterOptions.category === category && styles.filterOptionActive
                      ]}
                      onPress={() => setFilterOptions(prev => ({ ...prev, category }))}
                    >
                      <Text style={[
                        styles.filterOptionText,
                        filterOptions.category === category && styles.filterOptionTextActive
                      ]}>
                        {category}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            )}
          </ScrollView>

          <View style={styles.modalFooter}>
            <TouchableOpacity style={styles.clearButton} onPress={clearFilters}>
              <Text style={styles.clearButtonText}>Clear All</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.applyButton}
              onPress={closeModal}
            >
              <Text style={styles.applyButtonText}>Apply</Text>
            </TouchableOpacity>
                    </View>
        </View>
      </View>
    </Modal>
  );
  };

  return (
    <View style={styles.container}>
      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <TextInput
          style={styles.searchInput}
          placeholder="Search events and tasks..."
          placeholderTextColor={colors.text.secondary}
          value={searchText}
          onChangeText={setSearchText}
        />
        <Animated.View style={{ transform: [{ scale: buttonScale }] }}>
          <TouchableOpacity
            style={styles.filterButton}
            onPress={handleFilterButtonPress}
            activeOpacity={0.8}
          >
            <Text style={styles.filterButtonText}>Filter</Text>
            {getActiveFiltersCount() > 0 && (
              <View style={styles.filterBadge}>
                <Text style={styles.filterBadgeText}>{getActiveFiltersCount()}</Text>
              </View>
            )}
          </TouchableOpacity>
        </Animated.View>
      </View>

      {/* Quick Filters */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.quickFiltersContainer}>
        {renderFilterChip('Today', 'today', () => 
          setFilterOptions(prev => ({ ...prev, dateRange: 'today' }))
        )}
        {renderFilterChip('Upcoming', 'upcoming', () => 
          setFilterOptions(prev => ({ ...prev, dateRange: 'upcoming' }))
        )}
        {renderFilterChip('Urgent', 'urgent', () => 
          setFilterOptions(prev => ({ ...prev, urgency: 'urgent' }))
        )}
        {renderFilterChip('Online', 'online', () => 
          setFilterOptions(prev => ({ ...prev, location: 'online' }))
        )}
        {renderFilterChip('Short', 'short', () => 
          setFilterOptions(prev => ({ ...prev, duration: 'short' }))
        )}
      </ScrollView>

      {renderFilterModal()}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.background.primary,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  searchInput: {
    flex: 1,
    height: 40,
    backgroundColor: colors.surface,
    borderRadius: 8,
    paddingHorizontal: spacing.sm,
    marginRight: spacing.sm,
    color: colors.text.primary,
    fontSize: typography.fontSize.base,
    fontFamily: typography.fontFamily.regular,
  },
  filterButton: {
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
    position: 'relative',
  },
  filterButtonText: {
    color: colors.secondary,
    fontSize: typography.fontSize.base,
    fontFamily: typography.fontFamily.medium,
    fontWeight: '600',
  },
  filterBadge: {
    position: 'absolute',
    top: -5,
    right: -5,
    backgroundColor: colors.error,
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  filterBadgeText: {
    color: colors.secondary,
    fontSize: 12,
    fontWeight: 'bold',
  },
  quickFiltersContainer: {
    marginBottom: spacing.sm,
  },
  filterChip: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: 20,
    marginRight: spacing.sm,
  },
  filterChipText: {
    fontSize: typography.fontSize.base,
    fontFamily: typography.fontFamily.regular,
    fontWeight: '600',
    color: colors.text.primary,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: colors.background.primary,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.medium, // Fix: use correct color object path
  },
  modalTitle: {
    fontSize: typography.fontSize['2xl'], // Fix: no typography.h3, use explicit size
    fontFamily: typography.fontFamily.bold,
    fontWeight: '700',
    color: colors.text.primary, // Fix: use correct color object path
  },
  closeButton: {
    fontSize: 24,
    color: colors.secondary,
  },
  modalBody: {
    padding: spacing.lg,
  },
  filterSection: {
    marginBottom: spacing.lg,
  },
  filterSectionTitle: {
    fontSize: typography.fontSize.xl,
    fontFamily: typography.fontFamily.bold,
    fontWeight: '700',
    color: colors.text.primary,
    marginBottom: spacing.sm,
  },
  filterOptions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  filterOption: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: 8,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border.medium,
  },
  filterOptionActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  filterOptionText: {
    fontSize: typography.fontSize.base,
    fontFamily: typography.fontFamily.regular,
    color: colors.text.primary,
  },
  filterOptionTextActive: {
    color: colors.secondary,
    fontWeight: '600',
  },
  modalFooter: {
    flexDirection: 'row',
    padding: spacing.lg,
    borderTopWidth: 1,
    borderTopColor: colors.border.medium,
    gap: spacing.md,
  },
  clearButton: {
    flex: 1,
    paddingVertical: spacing.md,
    borderRadius: 8,
    backgroundColor: colors.surface,
    alignItems: 'center',
  },
  clearButtonText: {
    fontSize: typography.fontSize.base,
    fontFamily: typography.fontFamily.regular,
    color: colors.text.secondary,
    fontWeight: '600',
  },
  applyButton: {
    flex: 1,
    paddingVertical: spacing.md,
    borderRadius: 8,
    backgroundColor: colors.primary,
    alignItems: 'center',
  },
  applyButtonText: {
    fontSize: typography.fontSize.base,
    fontFamily: typography.fontFamily.regular,
    color: colors.secondary,
    fontWeight: '600',
  },
}); 