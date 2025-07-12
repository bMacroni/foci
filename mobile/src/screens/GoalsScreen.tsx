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
import { Goal } from '../types';
import { goalsAPI } from '../services/api';
import { theme } from '../utils/theme';

const GoalsScreen: React.FC = () => {
  const [goals, setGoals] = useState<Goal[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadGoals();
  }, []);

  const loadGoals = async () => {
    try {
      setIsLoading(true);
      const goalsData = await goalsAPI.getAll();
      setGoals(goalsData);
    } catch (error) {
      Alert.alert('Error', 'Failed to load goals');
    } finally {
      setIsLoading(false);
    }
  };

  const getCategoryIcon = (category: Goal['category']) => {
    switch (category) {
      case 'career':
        return 'briefcase';
      case 'health':
        return 'fitness';
      case 'personal':
        return 'person';
      case 'education':
        return 'school';
      case 'finance':
        return 'card';
      case 'relationships':
        return 'heart';
      default:
        return 'flag';
    }
  };

  const getCategoryColor = (category: Goal['category']) => {
    return theme.colors.primary;
  };

  const renderGoal = ({ item }: { item: Goal }) => (
    <TouchableOpacity style={styles.goalCard}>
      <View style={styles.goalHeader}>
        <View style={styles.categoryContainer}>
          <Ionicons
            name={getCategoryIcon(item.category) as any}
            size={20}
            color={getCategoryColor(item.category)}
          />
          <Text style={styles.categoryText}>{item.category}</Text>
        </View>
        <View style={styles.statusContainer}>
          <Text style={[styles.statusText, { color: getStatusColor(item.status) }]}>
            {item.status}
          </Text>
        </View>
      </View>

      <Text style={styles.goalTitle}>{item.title}</Text>
      <Text style={styles.goalDescription} numberOfLines={2}>
        {item.description}
      </Text>

      <View style={styles.progressContainer}>
        <View style={styles.progressBar}>
          <View
            style={[
              styles.progressFill,
              { width: `${item.progress}%` },
            ]}
          />
        </View>
        <Text style={styles.progressText}>{item.progress}%</Text>
      </View>

      {item.target_date && (
        <Text style={styles.targetDate}>
          Target: {new Date(item.target_date).toLocaleDateString()}
        </Text>
      )}
    </TouchableOpacity>
  );

  const getStatusColor = (status: Goal['status']) => {
    switch (status) {
      case 'active':
        return theme.colors.primary;
      case 'completed':
        return theme.colors.success;
      case 'archived':
        return theme.colors.textSecondary;
      default:
        return theme.colors.textSecondary;
    }
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Goals</Text>
        <TouchableOpacity style={styles.addButton}>
          <Ionicons name="add" size={24} color={theme.colors.background} />
        </TouchableOpacity>
      </View>

      {goals.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Ionicons name="flag-outline" size={64} color={theme.colors.textSecondary} />
          <Text style={styles.emptyTitle}>No goals yet</Text>
          <Text style={styles.emptySubtitle}>Create your first goal to get started</Text>
          <TouchableOpacity style={styles.emptyButton}>
            <Text style={styles.emptyButtonText}>Create Goal</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={goals}
          renderItem={renderGoal}
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
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: theme.spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: theme.colors.text,
  },
  addButton: {
    backgroundColor: theme.colors.primary,
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.sm,
  },
  listContainer: {
    padding: theme.spacing.lg,
  },
  goalCard: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.lg,
    marginBottom: theme.spacing.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  goalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.sm,
  },
  categoryContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  categoryText: {
    marginLeft: theme.spacing.xs,
    fontSize: 12,
    color: theme.colors.textSecondary,
    textTransform: 'uppercase',
    fontWeight: '600',
  },
  statusContainer: {
    backgroundColor: theme.colors.background,
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.xs,
    borderRadius: theme.borderRadius.sm,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  goalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: theme.colors.text,
    marginBottom: theme.spacing.xs,
  },
  goalDescription: {
    fontSize: 14,
    color: theme.colors.textSecondary,
    marginBottom: theme.spacing.md,
  },
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: theme.spacing.sm,
  },
  progressBar: {
    flex: 1,
    height: 4,
    backgroundColor: theme.colors.border,
    borderRadius: 2,
    marginRight: theme.spacing.sm,
  },
  progressFill: {
    height: '100%',
    backgroundColor: theme.colors.primary,
    borderRadius: 2,
  },
  progressText: {
    fontSize: 12,
    color: theme.colors.textSecondary,
    fontWeight: '600',
  },
  targetDate: {
    fontSize: 12,
    color: theme.colors.textSecondary,
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

export default GoalsScreen; 