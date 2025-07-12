import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { CalendarEvent } from '../types';
import { calendarAPI } from '../services/api';
import { theme } from '../utils/theme';

const CalendarScreen: React.FC = () => {
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [calendarStatus, setCalendarStatus] = useState<{ connected: boolean; email?: string }>({ connected: false });

  useEffect(() => {
    loadCalendarData();
  }, []);

  const loadCalendarData = async () => {
    try {
      setIsLoading(true);
      const status = await calendarAPI.getStatus();
      setCalendarStatus(status);
      
      if (status.connected) {
        const eventsData = await calendarAPI.getEvents();
        setEvents(eventsData);
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to load calendar data');
    } finally {
      setIsLoading(false);
    }
  };

  const formatEventTime = (dateTime: string) => {
    const date = new Date(dateTime);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const formatEventDate = (dateTime: string) => {
    const date = new Date(dateTime);
    return date.toLocaleDateString();
  };

  const renderEvent = ({ item }: { item: CalendarEvent }) => (
    <TouchableOpacity style={styles.eventCard}>
      <View style={styles.eventHeader}>
        <View style={styles.timeContainer}>
          <Text style={styles.timeText}>
            {formatEventTime(item.start.dateTime)} - {formatEventTime(item.end.dateTime)}
          </Text>
          <Text style={styles.dateText}>{formatEventDate(item.start.dateTime)}</Text>
        </View>
        {item.location && (
          <View style={styles.locationContainer}>
            <Ionicons name="location-outline" size={16} color={theme.colors.textSecondary} />
            <Text style={styles.locationText}>{item.location}</Text>
          </View>
        )}
      </View>

      <Text style={styles.eventTitle}>{item.summary}</Text>
      {item.description && (
        <Text style={styles.eventDescription} numberOfLines={2}>
          {item.description}
        </Text>
      )}

      {item.attendees && item.attendees.length > 0 && (
        <View style={styles.attendeesContainer}>
          <Ionicons name="people-outline" size={16} color={theme.colors.textSecondary} />
          <Text style={styles.attendeesText}>
            {item.attendees.length} attendee{item.attendees.length !== 1 ? 's' : ''}
          </Text>
        </View>
      )}
    </TouchableOpacity>
  );

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </View>
    );
  }

  if (!calendarStatus.connected) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Calendar</Text>
          <TouchableOpacity style={styles.connectButton}>
            <Ionicons name="link" size={20} color={theme.colors.background} />
            <Text style={styles.connectButtonText}>Connect</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.emptyContainer}>
          <Ionicons name="calendar-outline" size={64} color={theme.colors.textSecondary} />
          <Text style={styles.emptyTitle}>Calendar not connected</Text>
          <Text style={styles.emptySubtitle}>
            Connect your Google Calendar to see your events
          </Text>
          <TouchableOpacity style={styles.emptyButton}>
            <Text style={styles.emptyButtonText}>Connect Calendar</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Calendar</Text>
        <View style={styles.headerInfo}>
          <Text style={styles.connectedText}>Connected to {calendarStatus.email}</Text>
        </View>
      </View>

      {events.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Ionicons name="calendar-outline" size={64} color={theme.colors.textSecondary} />
          <Text style={styles.emptyTitle}>No events today</Text>
          <Text style={styles.emptySubtitle}>Your calendar is clear for today</Text>
        </View>
      ) : (
        <FlatList
          data={events}
          renderItem={renderEvent}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContainer}
          showsVerticalScrollIndicator={false}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: theme.colors.background,
  },
  header: {
    padding: theme.spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: theme.colors.text,
    marginBottom: theme.spacing.xs,
  },
  headerInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  connectedText: {
    fontSize: 14,
    color: theme.colors.textSecondary,
  },
  connectButton: {
    backgroundColor: theme.colors.primary,
    borderRadius: theme.borderRadius.md,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    flexDirection: 'row',
    alignItems: 'center',
  },
  connectButtonText: {
    color: theme.colors.background,
    fontSize: 14,
    fontWeight: '600',
    marginLeft: theme.spacing.xs,
  },
  listContainer: {
    padding: theme.spacing.lg,
  },
  eventCard: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.lg,
    marginBottom: theme.spacing.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  eventHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: theme.spacing.sm,
  },
  timeContainer: {
    flex: 1,
  },
  timeText: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.colors.primary,
  },
  dateText: {
    fontSize: 12,
    color: theme.colors.textSecondary,
    marginTop: theme.spacing.xs,
  },
  locationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    justifyContent: 'flex-end',
  },
  locationText: {
    fontSize: 12,
    color: theme.colors.textSecondary,
    marginLeft: theme.spacing.xs,
  },
  eventTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: theme.colors.text,
    marginBottom: theme.spacing.xs,
  },
  eventDescription: {
    fontSize: 14,
    color: theme.colors.textSecondary,
    marginBottom: theme.spacing.sm,
  },
  attendeesContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  attendeesText: {
    fontSize: 12,
    color: theme.colors.textSecondary,
    marginLeft: theme.spacing.xs,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: theme.spacing.xl,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: theme.colors.text,
    marginTop: theme.spacing.md,
    marginBottom: theme.spacing.xs,
  },
  emptySubtitle: {
    fontSize: 16,
    color: theme.colors.textSecondary,
    textAlign: 'center',
    marginBottom: theme.spacing.lg,
  },
  emptyButton: {
    backgroundColor: theme.colors.primary,
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
  },
  emptyButtonText: {
    color: theme.colors.background,
    fontSize: 16,
    fontWeight: '600',
  },
});

export default CalendarScreen; 