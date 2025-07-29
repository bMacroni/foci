import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { colors } from '../../themes/colors';
import { TaskForm } from '../../components/tasks/TaskForm';
import { tasksAPI, goalsAPI } from '../../services/api';

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
}

interface Goal {
  id: string;
  title: string;
}

interface TaskFormScreenProps {
  route: {
    params?: {
      taskId?: string;
    };
  };
  navigation: any;
}

export const TaskFormScreen: React.FC<TaskFormScreenProps> = ({
  route,
  navigation,
}) => {
  const { taskId } = route.params || {};
  const [task, setTask] = useState<Task | undefined>();
  const [goals, setGoals] = useState<Goal[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadData();
  }, [taskId]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [goalsData, taskData] = await Promise.all([
        goalsAPI.getGoals(),
        taskId ? tasksAPI.getTaskById(taskId) : Promise.resolve(undefined),
      ]);
      setGoals(goalsData);
      setTask(taskData);
    } catch (error) {
      console.error('Error loading data:', error);
      Alert.alert('Error', 'Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (taskData: Partial<Task>) => {
    try {
      setSaving(true);
      if (taskId) {
        // Update existing task
        await tasksAPI.updateTask(taskId, taskData);
      } else {
        // Create new task
        await tasksAPI.createTask(taskData);
      }
      navigation.goBack();
    } catch (error) {
      console.error('Error saving task:', error);
      Alert.alert('Error', 'Failed to save task');
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    navigation.goBack();
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <TaskForm
        task={task}
        goals={goals}
        onSave={handleSave}
        onCancel={handleCancel}
        loading={saving}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background,
  },
});
