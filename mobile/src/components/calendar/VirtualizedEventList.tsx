import React, { useCallback, useMemo } from 'react';
import {
  View,
  FlatList,
  StyleSheet,
  RefreshControl,
  ActivityIndicator,
  Text,
} from 'react-native';
import { EventCard } from './EventCard';
import { EventCardSkeleton } from './EventCardSkeleton';
import { colors } from '../../themes/colors';
import { typography } from '../../themes/typography';
import { spacing } from '../../themes/spacing';
import { CalendarEvent, Task } from '../../types/calendar';

interface VirtualizedEventListProps {
  events: Array<{
    id: string;
    data: CalendarEvent | Task;
    type: 'event' | 'task';
  }>;
  loading?: boolean;
  refreshing?: boolean;
  onRefresh?: () => void;
  onLoadMore?: () => void;
  onEdit?: (event: CalendarEvent | Task) => void;
  onDelete?: (eventId: string) => void;
  onCompleteTask?: (taskId: string) => void;
  onReschedule?: (eventId: string, newDate: Date) => void;
  compact?: boolean;
  emptyMessage?: string;
  showLoadMore?: boolean;
}

// const ITEMS_PER_PAGE = 20; // Unused
const SKELETON_COUNT = 5;

export const VirtualizedEventList: React.FC<VirtualizedEventListProps> = React.memo(({
  events,
  loading = false,
  refreshing = false,
  onRefresh,
  onLoadMore,
  onEdit,
  onDelete,
  onCompleteTask,
  onReschedule,
  compact = false,
  emptyMessage = 'No events found',
  showLoadMore = false,
}) => {
  // Memoize the render item function to prevent unnecessary re-renders
  const renderItem = useCallback(({ item }: { item: { id: string; data: CalendarEvent | Task; type: 'event' | 'task' } }) => (
    <View style={styles.eventCardContainer}>
      <EventCard
        event={item.data}
        type={item.type}
        onEdit={onEdit}
        onDelete={onDelete}
        onCompleteTask={onCompleteTask}
        onReschedule={onReschedule}
        compact={compact}
      />
    </View>
  ), [onEdit, onDelete, onCompleteTask, onReschedule, compact]);

  // Memoize the key extractor
  const keyExtractor = useCallback((item: { id: string; data: CalendarEvent | Task; type: 'event' | 'task' }) => 
    item.id, []);

  // Memoize the skeleton data
  const skeletonData = useMemo(() => 
    Array.from({ length: SKELETON_COUNT }, (_, index) => ({
      id: `skeleton-${index}`,
      data: {} as CalendarEvent,
      type: 'event' as const,
    })), []);

  // Render skeleton item
  const renderSkeletonItem = useCallback(() => (
    <View style={styles.eventCardContainer}>
      <EventCardSkeleton compact={compact} />
    </View>
  ), [compact]);

  // Render empty state
  const renderEmptyComponent = useCallback(() => (
    <View style={styles.emptyContainer}>
      <Text style={styles.emptyText}>{emptyMessage}</Text>
    </View>
  ), [emptyMessage]);

  // Render footer with load more button
  const renderFooter = useCallback(() => {
    if (!showLoadMore || events.length === 0) {return null;}
    
    return (
      <View style={styles.footer}>
        <ActivityIndicator size="small" color={colors.primary} />
        <Text style={styles.loadingText}>Loading more events...</Text>
      </View>
    );
  }, [showLoadMore, events.length]);

  // Handle end reached for pagination
  const handleEndReached = useCallback(() => {
    if (onLoadMore && !loading && showLoadMore) {
      onLoadMore();
    }
  }, [onLoadMore, loading, showLoadMore]);

  // If loading and no events, show skeletons
  if (loading && events.length === 0) {
    return (
      <FlatList
        data={skeletonData}
        renderItem={renderSkeletonItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContainer}
        showsVerticalScrollIndicator={false}
        removeClippedSubviews={true}
        maxToRenderPerBatch={10}
        windowSize={10}
        initialNumToRender={5}
      />
    );
  }

  return (
    <FlatList
      data={events}
      renderItem={renderItem}
      keyExtractor={keyExtractor}
      contentContainerStyle={styles.listContainer}
      showsVerticalScrollIndicator={false}
      refreshControl={
        onRefresh ? (
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[colors.primary]}
            tintColor={colors.primary}
          />
        ) : undefined
      }
      onEndReached={handleEndReached}
      onEndReachedThreshold={0.1}
      ListEmptyComponent={renderEmptyComponent}
      ListFooterComponent={renderFooter}
      removeClippedSubviews={true}
      maxToRenderPerBatch={10}
      windowSize={10}
      initialNumToRender={10}
      getItemLayout={compact ? undefined : (_data, index) => ({
        length: 120, // Approximate height of event card
        offset: 120 * index,
        index,
      })}
    />
  );
});

const styles = StyleSheet.create({
  listContainer: {
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.lg,
  },
  eventCardContainer: {
    marginBottom: spacing.sm,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: spacing.xl * 2,
  },
  emptyText: {
    fontSize: typography.fontSize.lg,
    color: colors.text.secondary,
    textAlign: 'center',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: spacing.md,
  },
  loadingText: {
    fontSize: typography.fontSize.sm,
    color: colors.text.secondary,
    marginLeft: spacing.sm,
  },
}); 