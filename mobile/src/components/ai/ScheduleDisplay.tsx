import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors } from '../../themes/colors';
import { typography } from '../../themes/typography';
import { spacing, borderRadius } from '../../themes/spacing';

interface ScheduleEvent {
  activity: string;
  startTime: string;
  endTime: string;
}

interface ScheduleDisplayProps {
  text: string;
}

export default function ScheduleDisplay({ text }: ScheduleDisplayProps) {
  // Extract the title/date from the AI response, preferring JSON title
  const extractScheduleDate = (scheduleText: string): string => {
    try {
      const jsonMatch = scheduleText.match(/```json\s*(\{[\s\S]*?\})\s*```/);
      if (jsonMatch) {
        const jsonData = JSON.parse(jsonMatch[1]);
        if (jsonData.title && typeof jsonData.title === 'string') {
          return jsonData.title;
        }
      }
    } catch {}
    // Look for patterns like "Here's your schedule for [date]:"
    const datePatterns = [
      /schedule for (.*?):/i,
      /schedule for (.*?)$/im,
      /for (.*?):/i,
    ];
    
    for (const pattern of datePatterns) {
      const match = scheduleText.match(pattern);
      if (match && match[1]) {
        return match[1].trim();
      }
    }
    
    // Fallback to "Today's Schedule" if no date found
    return "Today's Schedule";
  };

  // Parse schedule events from text
  const parseScheduleEvents = (scheduleText: string): ScheduleEvent[] => {
    try {
      // First try to parse standardized JSON format
      const jsonMatch = scheduleText.match(/```json\s*(\{[\s\S]*?\})\s*```/);
      if (jsonMatch) {
        const jsonData = JSON.parse(jsonMatch[1]);
        if (jsonData.category === 'schedule' && jsonData.events) {
          return jsonData.events.map((event: any) => ({
            activity: event.title || event.summary || 'Untitled',
            // Support both new keys (startTime/endTime) and ISO keys (start/end)
            startTime: event.startTime || event.start?.dateTime || event.start || event.start_time,
            endTime: event.endTime || event.end?.dateTime || event.end || event.end_time,
          }));
        }
      }
      
      // Also try to parse if the text is just JSON
      const directJsonMatch = scheduleText.match(/\{[\s\S]*\}/);
      if (directJsonMatch) {
        const jsonData = JSON.parse(directJsonMatch[0]);
        if (jsonData.category === 'schedule' && jsonData.events) {
          return jsonData.events.map((event: any) => ({
            activity: event.title || event.summary || 'Untitled',
            startTime: event.startTime || event.start?.dateTime || event.start || event.start_time,
            endTime: event.endTime || event.end?.dateTime || event.end || event.end_time,
          }));
        }
      }
    } catch (error) {
      console.error('Failed to parse JSON schedule data:', error);
    }
    
    // Fallback to old parsing method for backward compatibility
    const events: ScheduleEvent[] = [];
    
    // Split by lines and look for schedule patterns
    const lines = scheduleText.split('\n');
    
    for (const line of lines) {
      // Look for patterns like "Activity from time to time" with various bullet styles
      const schedulePatterns = [
        /^[•\-\*]?\s*(.+?)\s+from\s+(\d{1,2}:\d{2}\s*(?:AM|PM))\s+to\s+(\d{1,2}:\d{2}\s*(?:AM|PM))/i,
        /^\*\s*(.+?)\s+from\s+(\d{1,2}:\d{2}\s*(?:AM|PM))\s+to\s+(\d{1,2}:\d{2}\s*(?:AM|PM))/i,
        /^•\s*(.+?)\s+from\s+(\d{1,2}:\d{2}\s*(?:AM|PM))\s+to\s+(\d{1,2}:\d{2}\s*(?:AM|PM))/i,
      ];
      
      for (const pattern of schedulePatterns) {
        const match = line.trim().match(pattern);
        if (match) {
          // Strip out ** characters from activity name
          const cleanActivity = match[1].trim().replace(/\*\*/g, '');
          events.push({
            activity: cleanActivity,
            startTime: match[2].trim(),
            endTime: match[3].trim(),
          });
          break; // Found a match, move to next line
        }
      }
    }
    
    return events;
  };

  const events = parseScheduleEvents(text);
  const scheduleDate = extractScheduleDate(text);

  // If no events found, return null to fall back to regular text display
  if (events.length === 0) {
    return null;
  }

  // Format time for display
  const formatTime = (time: string) => {
    if (!time) return '';
    // If time already looks like 12:34 PM keep it
    if (/(AM|PM)$/i.test(time)) return time.toUpperCase();
    // Otherwise try to parse ISO
    const date = new Date(time);
    if (!isNaN(date.getTime())) {
      return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
    }
    return time;
  };

  return (
    <View style={styles.container}>
      <Text style={styles.scheduleTitle}>{scheduleDate}</Text>
      <View style={styles.eventsContainer}>
                 {events.map((event, index) => (
           <View key={index} style={styles.eventCard}>
             <Text style={styles.timeText}>
               {formatTime(event.startTime)} - {formatTime(event.endTime)}
             </Text>
              <Text selectable style={styles.activityText} numberOfLines={2}>{event.activity}</Text>
             {index < events.length - 1 && <View style={styles.separator} />}
           </View>
         ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginTop: spacing.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    maxWidth: '100%',
  },
  scheduleTitle: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.bold,
    color: colors.text.primary,
    marginBottom: spacing.md,
  },
  eventsContainer: {
    backgroundColor: colors.background.surface,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.border.light,
    overflow: 'hidden',
  },
  eventCard: {
    padding: spacing.md,
    flexDirection: 'column',
    alignItems: 'flex-start',
    minHeight: 60,
    width: '100%',
  },
  timeText: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.bold,
    color: colors.primary,
    fontFamily: 'monospace',
    marginBottom: spacing.xs,
  },
  activityText: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.medium,
    color: colors.text.primary,
  },
  separator: {
    height: 1,
    backgroundColor: colors.border.light,
    marginHorizontal: -spacing.md,
  },
}); 