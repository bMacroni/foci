import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/Octicons';
import { colors } from '../../themes/colors';
import { typography } from '../../themes/typography';
import { spacing, borderRadius } from '../../themes/spacing';
import { Input, Button } from '../../components/common';
import { goalsAPI } from '../../services/api';
import { offlineService } from '../../services/offline';
import { authService, AuthState } from '../../services/auth';
import GoalsListModal from '../../components/goals/GoalsListModal';
import Svg, { Circle } from 'react-native-svg';
import { format, isPast, isToday, formatDistanceToNow } from 'date-fns';
import DateTimePicker from '@react-native-community/datetimepicker';

interface Step {
  id: string;
  title: string;
  description: string;
  completed: boolean;
  order: number;
}

interface Milestone {
  id: string;
  title: string;
  description: string;
  completed: boolean;
  order: number;
  steps: Step[];
}

interface Goal {
  id: string;
  title: string;
  description: string;
  completedMilestones: number;
  totalMilestones: number;
  completedSteps: number;
  totalSteps: number;
  nextMilestone: string;
  nextStep: string;
  status: 'active' | 'completed' | 'paused';
  createdAt: Date;
  milestones: Milestone[];
  targetDate?: Date;
}

export default function GoalsScreen({ navigation }: any) {
  const [goals, setGoals] = useState<Goal[]>([]);
  const [loading, setLoading] = useState(false);
  const [goalsLoading, setGoalsLoading] = useState(true);
  const [expandedGoals, setExpandedGoals] = useState<Record<string, boolean>>({});
  const [editingGoals, setEditingGoals] = useState<Record<string, boolean>>({});
  const [editDrafts, setEditDrafts] = useState<Record<string, Array<{ id: string; title: string; steps: Array<{ id: string; title: string }> }>>>({});
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    token: null,
    isLoading: true,
    isAuthenticated: false,
  });
  const [aiInput, setAiInput] = useState('');
  const [showAiInput, setShowAiInput] = useState(false);
  const [showAiReview, setShowAiReview] = useState(false);
  const [aiSuggestion, setAiSuggestion] = useState<{
    title: string;
    description: string;
    milestones: Array<{
      title: string;
      description: string;
      steps: Array<{
        title: string;
        description: string;
      }>;
    }>;
  } | null>(null);
  const [showGoalsModal, setShowGoalsModal] = useState(false);
  const [editingDate, setEditingDate] = useState<Record<string, boolean>>({});
  const [dateDrafts, setDateDrafts] = useState<Record<string, Date>>({});
  const [androidDatePickerVisible, setAndroidDatePickerVisible] = useState<Record<string, boolean>>({});

  const loadGoals = React.useCallback(async () => {
    let paintedFromCache = false;
    try {
      // Try cache first for instant paint
      const cached = await offlineService.getCachedGoals();
      if (cached && Array.isArray(cached) && cached.length > 0) {
        const transformedFromCache: Goal[] = cached.map((goal: any) => {
          const milestones = goal.milestones || [];
          const totalMilestones = milestones.length;
          const completedMilestones = milestones.filter((m: any) => m.completed).length;
          const totalSteps = milestones.reduce((total: number, milestone: any) => total + (milestone.steps?.length || 0), 0);
          const completedSteps = milestones.reduce((total: number, milestone: any) => total + (milestone.steps?.filter((s: any) => s.completed).length || 0), 0);
          const nextMilestone = milestones.find((m: any) => !m.completed)?.title || '';
          const nextStep = milestones.find((m: any) => !m.completed)?.steps?.find((s: any) => !s.completed)?.text || '';
          return {
            id: goal.id,
            title: goal.title,
            description: goal.description,
            completedMilestones,
            totalMilestones,
            completedSteps,
            totalSteps,
            nextMilestone,
            nextStep,
            status: goal.status || 'active',
            createdAt: new Date(goal.created_at || goal.createdAt),
            targetDate: goal.target_completion_date ? new Date(goal.target_completion_date) : undefined,
            milestones: milestones.map((milestone: any) => ({
              id: milestone.id,
              title: milestone.title,
              description: milestone.description || '',
              completed: milestone.completed || false,
              order: milestone.order,
              steps: (milestone.steps || []).map((step: any) => ({
                id: step.id,
                title: step.text || step.title,
                description: step.description || '',
                completed: step.completed || false,
                order: step.order,
              })),
            })),
          } as Goal;
        });
        setGoals(transformedFromCache);
        setGoalsLoading(false);
        paintedFromCache = true;
      } else {
        setGoalsLoading(true);
      }

      const fetchedGoals = await goalsAPI.getGoals();
      
      // Transform backend data to match our UI structure
      const transformedGoals: Goal[] = fetchedGoals.map((goal: any) => {
        const milestones = goal.milestones || [];
        const totalMilestones = milestones.length;
        const completedMilestones = milestones.filter((m: any) => m.completed).length;
        
        const totalSteps = milestones.reduce((total: number, milestone: any) => {
          return total + (milestone.steps?.length || 0);
        }, 0);
        
        const completedSteps = milestones.reduce((total: number, milestone: any) => {
          return total + (milestone.steps?.filter((s: any) => s.completed).length || 0);
        }, 0);

        // Find next milestone and step
        const nextMilestone = milestones.find((m: any) => !m.completed)?.title || '';
        const nextStep = milestones.find((m: any) => !m.completed)?.steps?.find((s: any) => !s.completed)?.text || '';

        return {
          id: goal.id,
          title: goal.title,
          description: goal.description,
          completedMilestones,
          totalMilestones,
          completedSteps,
          totalSteps,
          nextMilestone,
          nextStep,
          status: goal.status || 'active',
          createdAt: new Date(goal.created_at || goal.createdAt),
          targetDate: goal.target_completion_date ? new Date(goal.target_completion_date) : undefined,
          milestones: milestones.map((milestone: any) => ({
            id: milestone.id,
            title: milestone.title,
            description: milestone.description || '',
            completed: milestone.completed || false,
            order: milestone.order,
            steps: (milestone.steps || []).map((step: any) => ({
              id: step.id,
              title: step.text || step.title,
              description: step.description || '',
              completed: step.completed || false,
              order: step.order,
            })),
          })),
        };
      });

      setGoals(transformedGoals);
      try { await offlineService.cacheGoals(fetchedGoals as any); } catch {}
    } catch (error) {
      // error loading goals
      
      // Check if it's an authentication error
      if (error instanceof Error && error.message.includes('No authentication token')) {
        // User needs to log in
        Alert.alert(
          'Authentication Required',
          'Please log in to view your goals.',
          [
            {
              text: 'Go to Login',
              onPress: () => navigation.navigate('Login'),
            },
            {
              text: 'Cancel',
              style: 'cancel',
            },
          ]
        );
      } else {
        Alert.alert('Error', 'Failed to load goals. Please try again.');
      }
    } finally {
      if (!paintedFromCache) setGoalsLoading(false);
    }
  }, [navigation]);

  // Subscribe to auth state changes
  useEffect(() => {
    const unsubscribe = authService.subscribe((state) => {
      setAuthState(state);
      
      // If user becomes authenticated, load goals
      if (state.isAuthenticated && !state.isLoading) {
        loadGoals();
      } else if (!state.isAuthenticated && !state.isLoading) {
        // User is not authenticated, clear goals and stop loading
        setGoals([]);
        setGoalsLoading(false);
      }
    });

    return unsubscribe;
  }, [navigation, loadGoals]);

  // Load goals from backend on component mount (only if authenticated)
  useEffect(() => {
    if (authState.isAuthenticated && !authState.isLoading) {
      loadGoals();
    } else if (!authState.isAuthenticated && !authState.isLoading) {
      setGoalsLoading(false);
    }
  }, [authState.isAuthenticated, authState.isLoading, loadGoals]);

  const handleAiSubmit = async () => {
    if (!aiInput.trim()) return;
    
    setLoading(true);
    
    try {
      // Extract goal title and description from user input
      const goalTitle = aiInput.trim();
      const goalDescription = ''; // Could be extracted from user input if they provide more details
      
      // Call the AI breakdown generation API
      const breakdown = await goalsAPI.generateBreakdown({
        title: goalTitle,
        description: goalDescription,
      });
      
      // Transform the API response to match our UI structure
      const suggestion = {
        title: goalTitle,
        description: goalDescription || `AI-generated breakdown for: ${goalTitle}`,
        milestones: breakdown.milestones.map((milestone, index) => ({
          title: milestone.title,
          description: `Milestone ${index + 1}: ${milestone.title}`,
          steps: milestone.steps.map((step, stepIndex) => ({
            title: step.text,
            description: `Step ${stepIndex + 1}: ${step.text}`,
          })),
        })),
      };
      
      setAiSuggestion(suggestion);
      setLoading(false);
      setShowAiInput(false);
      setShowAiReview(true);
    } catch (error) {
      // error generating AI breakdown
      setLoading(false);
      
      // Check if it's an authentication error
      if (error instanceof Error && error.message.includes('No authentication token')) {
        Alert.alert(
          'Authentication Required',
          'Please log in to use the AI assistant.',
          [
            {
              text: 'Go to Login',
              onPress: () => navigation.navigate('Login'),
            },
            {
              text: 'Cancel',
              style: 'cancel',
            },
          ]
        );
      } else {
        Alert.alert('Error', 'Failed to generate AI breakdown. Please try again.');
      }
    }
  };

  const handleAcceptSuggestion = React.useCallback(async () => {
    if (!aiSuggestion) return;
    
    try {
      setLoading(true);
      
      // Create goal data for backend
      const goalData = {
        title: aiSuggestion.title,
        description: aiSuggestion.description,
        milestones: aiSuggestion.milestones.map((milestone, index) => ({
          title: milestone.title,
          order: index + 1,
          steps: milestone.steps.map((step, stepIndex) => ({
            text: step.title,
            order: stepIndex + 1,
          })),
        })),
      };

      // Create goal in backend
      await goalsAPI.createGoal(goalData as any);
      
      // Reload goals to get the updated list
      await loadGoals();
      
      setAiSuggestion(null);
      setShowAiReview(false);
      setAiInput('');
      setLoading(false);
      
      Alert.alert('Success', 'Goal created successfully!');
    } catch (error) {
      // error creating goal
      setLoading(false);
      
      // Check if it's an authentication error
      if (error instanceof Error && error.message.includes('No authentication token')) {
        Alert.alert(
          'Authentication Required',
          'Please log in to create goals.',
          [
            {
              text: 'Go to Login',
              onPress: () => navigation.navigate('Login'),
            },
            {
              text: 'Cancel',
              style: 'cancel',
            },
          ]
        );
      } else {
        Alert.alert('Error', 'Failed to create goal. Please try again.');
      }
    }
  }, [aiSuggestion, loadGoals, navigation]);

  const handleRedoSuggestion = () => {
    setShowAiReview(false);
    setShowAiInput(true);
    // Keep the original input for refinement
  };

  const handleCancelSuggestion = () => {
    setAiSuggestion(null);
    setShowAiReview(false);
    setAiInput('');
  };

  const handleGoalPress = (goalId: string) => {
    setShowGoalsModal(false);
    navigation.navigate('GoalDetail', { goalId });
  };

  const handleGoalDelete = async (goalId: string) => {
    try {
      Alert.alert(
        'Delete Goal',
        'Are you sure you want to delete this goal? This action cannot be undone.',
        [
          {
            text: 'Cancel',
            style: 'cancel',
          },
          {
            text: 'Delete',
            style: 'destructive',
            onPress: async () => {
              try {
                await goalsAPI.deleteGoal(goalId);
                await loadGoals();
                Alert.alert('Success', 'Goal deleted successfully');
              } catch (error) {
                // error deleting goal
                Alert.alert('Error', 'Failed to delete goal. Please try again.');
              }
            },
          },
        ]
      );
    } catch (error) {
      // error deleting goal
      Alert.alert('Error', 'Failed to delete goal. Please try again.');
    }
  };

  const startEditDate = (goalId: string, current?: Date) => {
    setEditingDate((p) => ({ ...p, [goalId]: true }));
    setDateDrafts((p) => ({ ...p, [goalId]: current || new Date() }));
    if (Platform.OS === 'android') {
      setAndroidDatePickerVisible((p) => ({ ...p, [goalId]: true }));
    }
  };

  const cancelEditDate = (goalId: string) => {
    setEditingDate((p) => ({ ...p, [goalId]: false }));
    setDateDrafts((p) => {
      const { [goalId]: _, ...rest } = p as any;
      return rest;
    });
    if (Platform.OS === 'android') {
      setAndroidDatePickerVisible((p) => ({ ...p, [goalId]: false }));
    }
  };

  const saveEditDate = async (goalId: string, pickedDate?: Date) => {
    const draft = pickedDate || dateDrafts[goalId];
    if (!draft) return;
    try {
      setLoading(true);
      await goalsAPI.updateGoal(goalId, { target_completion_date: draft.toISOString() } as any);
      setGoals((prev) => prev.map((g) => (g.id === goalId ? { ...g, targetDate: draft } : g)));
      setEditingDate((p) => ({ ...p, [goalId]: false }));
      setDateDrafts((p) => {
        const { [goalId]: _, ...rest } = p as any;
        return rest;
      });
      if (Platform.OS === 'android') {
        setAndroidDatePickerVisible((p) => ({ ...p, [goalId]: false }));
      }
    } catch (e) {
      Alert.alert('Error', 'Failed to update target date.');
    } finally {
      setLoading(false);
    }
  };

  const toggleExpand = (goalId: string) => {
    setExpandedGoals((prev) => ({ ...prev, [goalId]: !prev[goalId] }));
  };

  const enterEditMode = (goal: Goal) => {
    setExpandedGoals((prev) => ({ ...prev, [goal.id]: true }));
    setEditingGoals((prev) => ({ ...prev, [goal.id]: true }));
    setEditDrafts((prev) => ({
      ...prev,
      [goal.id]: goal.milestones.map((m) => ({
        id: m.id,
        title: m.title,
        steps: m.steps.map((s) => ({ id: s.id, title: s.title })),
      })),
    }));
  };

  const cancelEdit = (goalId: string) => {
    setEditingGoals((prev) => ({ ...prev, [goalId]: false }));
    setEditDrafts((prev) => {
      const { [goalId]: _, ...rest } = prev as any;
      return rest;
    });
  };

  const saveEdits = async (goalId: string) => {
    const drafts = editDrafts[goalId];
    if (!drafts) return;
    const original = goals.find((g) => g.id === goalId);
    if (!original) return;

    try {
      setLoading(true);
      // Persist milestone title changes
      for (const draftMilestone of drafts) {
        const origMilestone = original.milestones.find((m) => m.id === draftMilestone.id);
        if (origMilestone && origMilestone.title !== draftMilestone.title) {
          await goalsAPI.updateMilestone(draftMilestone.id, { title: draftMilestone.title });
        }
        if (origMilestone) {
          for (const draftStep of draftMilestone.steps) {
            const origStep = origMilestone.steps.find((s) => s.id === draftStep.id);
            if (origStep && (origStep.title !== draftStep.title)) {
              await goalsAPI.updateStep(draftStep.id, { text: draftStep.title });
            }
          }
        }
      }

      // Update local state to reflect edits
      setGoals((prev) => prev.map((g) => {
        if (g.id !== goalId) return g;
        const updatedMilestones = g.milestones.map((m) => {
          const draft = drafts.find((dm) => dm.id === m.id);
          if (!draft) return m;
          return {
            ...m,
            title: draft.title,
            steps: m.steps.map((s) => {
              const dstep = draft.steps.find((ds) => ds.id === s.id);
              return dstep ? { ...s, title: dstep.title } : s;
            }),
          };
        });
        return { ...g, milestones: updatedMilestones };
      }));

      setEditingGoals((prev) => ({ ...prev, [goalId]: false }));
      setEditDrafts((prev) => {
        const { [goalId]: _, ...rest } = prev as any;
        return rest;
      });
    } catch (error) {
      Alert.alert('Error', 'Failed to save edits. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const toggleStepCompleted = async (goalId: string, milestoneId: string, stepId: string) => {
    // Optimistic UI update
    let newCompleted = false;
    setGoals((prev) => prev.map((g) => {
      if (g.id !== goalId) return g;
      let completedSteps = 0;
      const updatedMilestones = g.milestones.map((m) => {
        if (m.id !== milestoneId) {
          completedSteps += m.steps.filter((s) => s.completed).length;
          return m;
        }
        const updatedSteps = m.steps.map((s) => {
          if (s.id !== stepId) return s;
          newCompleted = !s.completed;
          return { ...s, completed: newCompleted };
        });
        completedSteps += updatedSteps.filter((s) => s.completed).length;
        return { ...m, completed: updatedSteps.every((s) => s.completed), steps: updatedSteps };
      });
      const totalSteps = updatedMilestones.reduce((acc, m) => acc + m.steps.length, 0);
      const nextMilestone = updatedMilestones.find((m) => !m.completed)?.title || '';
      const nextStep = updatedMilestones.find((m) => !m.completed)?.steps?.find((s) => !s.completed)?.title || '';
      return { ...g, milestones: updatedMilestones, completedSteps, totalSteps, nextMilestone, nextStep };
    }));

    try {
      await goalsAPI.updateStep(stepId, { completed: newCompleted });
    } catch (error) {
      Alert.alert('Error', 'Failed to update step status.');
      // Reload to reconcile from backend on failure
      try { await loadGoals(); } catch {}
    }
  };

  const getProgressPercentage = (completed: number, total: number) => {
    return total > 0 ? (completed / total) * 100 : 0;
  };

  const CircularProgress = ({ percentage, size = 56 }: { percentage: number; size?: number }) => {
    const strokeWidth = 6;
    const radius = (size - strokeWidth) / 2;
    const circumference = 2 * Math.PI * radius;
    const clamped = Math.max(0, Math.min(100, percentage));
    const strokeDashoffset = circumference - (clamped / 100) * circumference;

    return (
      <View style={{ width: size, height: size }}>
        <Svg width={size} height={size}>
          <Circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke={colors.border.light}
            strokeWidth={strokeWidth}
            fill="none"
          />
          <Circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke={colors.accent?.gold || colors.primary}
            strokeWidth={strokeWidth}
            fill="none"
            strokeDasharray={`${circumference} ${circumference}`}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            rotation="-90"
            origin={`${size / 2}, ${size / 2}`}
          />
        </Svg>
        <View style={styles.progressCenterTextContainer}>
          <Text style={styles.progressCenterText}>{Math.round(clamped)}%</Text>
        </View>
      </View>
    );
  };

  const formatTargetDate = (date?: Date): { text: string; tone: 'muted' | 'warn' | 'danger' } => {
    if (!date) return { text: 'No target', tone: 'muted' };
    if (isPast(date) && !isToday(date)) return { text: 'Overdue', tone: 'danger' };
    if (isToday(date)) return { text: 'Due today', tone: 'warn' };
    const distance = formatDistanceToNow(date, { addSuffix: true });
    // If within ~7 days, keep relative string; else show absolute
    const withinWeek = /\b(day|hour|minute|week)\b/.test(distance);
    return { text: withinWeek ? distance : format(date, 'MMM d, yyyy'), tone: withinWeek ? 'warn' : 'muted' };
  };

  

  const renderGoalCard = (goal: Goal) => {
    const stepsPct = getProgressPercentage(goal.completedSteps, goal.totalSteps);
    const due = formatTargetDate(goal.targetDate);
    const currentMilestone = goal.milestones.find((m) => !m.completed);
    const currentSteps = currentMilestone?.steps || [];
    const currentCompleted = currentSteps.filter((s) => s.completed).length;
    const currentTotal = currentSteps.length;
    return (
      <View 
        key={goal.id} 
        style={styles.goalCard}
      >
        <View style={styles.goalHeader}>
          <View style={{ flex: 1, paddingRight: spacing.md }}>
            <View style={styles.titleRow}>
              <Text style={styles.goalTitle}>{goal.title}</Text>
              <View style={styles.iconActions}>
                <TouchableOpacity
                  style={styles.iconButton}
                  onPress={() => (editingGoals[goal.id] ? cancelEdit(goal.id) : enterEditMode(goal))}
                >
                  <Icon name={editingGoals[goal.id] ? 'x' : 'pencil'} size={16} color={colors.text.secondary} />
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.iconButton}
                  onPress={(e: any) => {
                    try { e?.stopPropagation?.(); } catch {}
                    handleGoalDelete(goal.id);
                  }}
                >
                  <Icon name="trash" size={16} color={colors.text.secondary} />
                </TouchableOpacity>
              </View>
            </View>
            <Text style={styles.goalDescription}>{goal.description}</Text>
            <View style={styles.dueRow}>
              <Icon name="calendar" size={14} color={colors.accent?.gold || colors.text.secondary} />
              <TouchableOpacity
                onPress={() => (editingDate[goal.id] ? cancelEditDate(goal.id) : startEditDate(goal.id, goal.targetDate))}
              >
                <Text
                  style={[
                    styles.dueText,
                    due.tone === 'warn' && { color: colors.accent?.gold || colors.warning },
                    due.tone === 'danger' && { color: colors.error },
                  ]}
                >
                  {due.text}
                </Text>
              </TouchableOpacity>
            </View>
            {editingDate[goal.id] && (
              <View style={styles.dateEditContainer}>
                {Platform.OS === 'ios' ? (
                  <DateTimePicker
                    value={dateDrafts[goal.id] || goal.targetDate || new Date()}
                    mode="date"
                    display={'inline' as any}
                    onChange={(event: any, selected?: Date) => {
                      if (selected) {
                        setDateDrafts((p) => ({ ...p, [goal.id]: selected }));
                        // Auto-save on iOS inline picker selection
                        saveEditDate(goal.id, selected);
                      }
                    }}
                  />
                ) : (
                  <>
                    {androidDatePickerVisible[goal.id] && (
                      <DateTimePicker
                        value={dateDrafts[goal.id] || goal.targetDate || new Date()}
                        mode="date"
                        display={'default'}
                        onChange={(event: any, selected?: Date) => {
                          // On Android, picker emits once on open and once on set/cancel
                          if (event?.type === 'dismissed') {
                            setAndroidDatePickerVisible((p) => ({ ...p, [goal.id]: false }));
                            return;
                          }
                          if (selected) {
                            setDateDrafts((p) => ({ ...p, [goal.id]: selected }));
                            // Auto-save on Android OK
                            saveEditDate(goal.id, selected);
                          }
                          setAndroidDatePickerVisible((p) => ({ ...p, [goal.id]: false }));
                        }}
                      />
                    )}
                    {!androidDatePickerVisible[goal.id] && (
                      <TouchableOpacity onPress={() => setAndroidDatePickerVisible((p) => ({ ...p, [goal.id]: true }))}>
                        <Text style={styles.actionText}>Change date…</Text>
                      </TouchableOpacity>
                    )}
                  </>
                )}
                <View style={styles.dateEditActions}>
                  <TouchableOpacity onPress={() => cancelEditDate(goal.id)}>
                    <Text style={styles.actionText}>Close</Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}
          </View>
          <View style={styles.ringContainer}>
            <CircularProgress percentage={stepsPct} />
            <Text style={styles.ringCaption}>{goal.completedSteps}/{goal.totalSteps} steps</Text>
          </View>
        </View>
        
        <View style={styles.nextMilestoneContainer}>
          <View style={styles.inlineLabelRow}>
            <View style={styles.goldDot} />
            <Text style={styles.nextMilestoneLabel}>Current Milestone</Text>
          </View>
          <Text style={styles.nextMilestoneText}>{goal.nextMilestone}</Text>
        </View>
        <View style={styles.nextStepContainer}>
          <View style={styles.inlineLabelRow}>
            <Icon name="chevron-right" size={14} color={colors.text.secondary} />
            <Text style={styles.nextStepLabel}>Next Step</Text>
          </View>
          <Text style={styles.nextStepText}>{goal.nextStep}</Text>
        </View>

        {/* Steps expander below Next Step */}
        <TouchableOpacity style={styles.stepsHeader} onPress={() => toggleExpand(goal.id)}>
          <Text style={styles.stepsHeaderText}>
            Steps ({currentCompleted}/{currentTotal})
          </Text>
          <Icon name="chevron-right" size={16} color={colors.text.secondary} style={{ transform: [{ rotate: expandedGoals[goal.id] ? '90deg' : '0deg' }] as any }} />
        </TouchableOpacity>

        {expandedGoals[goal.id] && !editingGoals[goal.id] && (
          <View style={styles.stepsList}>
            {currentMilestone ? (
              <>
                {currentSteps.map((step) => (
                  <View key={step.id} style={styles.stepRow}>
                    <TouchableOpacity
                      style={styles.stepIconButton}
                      onPress={() => toggleStepCompleted(goal.id, currentMilestone.id, step.id)}
                    >
                      <Icon name={step.completed ? 'check' : 'circle'} size={18} color={step.completed ? (colors.accent?.gold || colors.primary) : colors.text.secondary} />
                    </TouchableOpacity>
                    <Text style={[styles.stepText, step.completed && styles.stepTextCompleted]}>
                      {step.title}
                    </Text>
                  </View>
                ))}
                <Text style={styles.unlockNote}>More steps will unlock once you complete this milestone.</Text>
              </>
            ) : (
              <Text style={styles.unlockNote}>All milestones are complete. Great job!</Text>
            )}
          </View>
        )}

        {expandedGoals[goal.id] && editingGoals[goal.id] && (
          <View style={styles.editContainer}>
            {editDrafts[goal.id]?.map((mDraft, mIndex) => (
              <View key={mDraft.id} style={styles.milestoneEditBlock}>
                <Text style={styles.milestoneEditLabel}>Milestone {mIndex + 1}</Text>
                <Input
                  placeholder="Milestone title"
                  value={mDraft.title}
                  onChangeText={(text) => setEditDrafts((prev) => ({
                    ...prev,
                    [goal.id]: prev[goal.id].map((md) => md.id === mDraft.id ? { ...md, title: text } : md),
                  }))}
                />
                {mDraft.steps.map((sDraft, sIndex) => (
                  <View key={sDraft.id} style={styles.stepEditRow}>
                    <Text style={styles.stepEditLabel}>Step {sIndex + 1}</Text>
                    <Input
                      placeholder="Step title"
                      value={sDraft.title}
                      onChangeText={(text) => setEditDrafts((prev) => ({
                        ...prev,
                        [goal.id]: prev[goal.id].map((md) => md.id === mDraft.id ? {
                          ...md,
                          steps: md.steps.map((sd) => sd.id === sDraft.id ? { ...sd, title: text } : sd),
                        } : md),
                      }))}
                    />
                  </View>
                ))}
              </View>
            ))}
            <View style={styles.editActions}>
              <Button title={loading ? 'Saving...' : 'Save'} onPress={() => saveEdits(goal.id)} loading={loading} />
              <Button title="Cancel" onPress={() => cancelEdit(goal.id)} variant="secondary" />
            </View>
          </View>
        )}

        <View style={styles.goalActions}>
          <TouchableOpacity style={styles.actionButton}>
            <Text style={styles.actionButtonText}>Schedule next step</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={styles.actionButton}
            onPress={() => {
              // Navigate to AI Chat tab and start a new conversation with pre-filled message
              navigation.navigate('AIChat', { 
                initialMessage: `Help me break down this goal: ${goal.title}`
              });
            }}
          >
            <Text style={styles.actionButtonText}>Ask AI Help</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  // Show loading state while checking authentication
  if (authState.isLoading) {
    return (
      <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Goals</Text>
        </View>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Checking authentication...</Text>
          <Text style={styles.debugText}>Debug: {authState.isAuthenticated ? 'Authenticated' : 'Not Authenticated'}</Text>
          <Button
            title="Debug: Force Not Authenticated"
            onPress={() => {
              // debug: forcing not authenticated
              setAuthState({
                user: null,
                token: null,
                isLoading: false,
                isAuthenticated: false,
              });
            }}
            variant="secondary"
            style={styles.debugButton}
          />
                                  <Button
                          title="Debug: Force Authenticated"
                          onPress={() => {
                            // debug: forcing authenticated
                            setAuthState({
                              user: { id: 'debug-user', email: 'debug@test.com' },
                              token: 'debug-token',
                              isLoading: false,
                              isAuthenticated: true,
                            });
                          }}
                          variant="secondary"
                          style={styles.debugButton}
                        />
                        <Button
                          title="Debug: Re-initialize Auth"
                          onPress={async () => {
                            // debug: re-initializing auth
                            await authService.debugReinitialize();
                          }}
                          variant="secondary"
                          style={styles.debugButton}
                        />
        </View>
      </SafeAreaView>
    );
  }

  // Show login prompt if user is not authenticated
  if (!authState.isAuthenticated) {
    return (
      <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Goals</Text>
        </View>
        <View style={styles.authContainer}>
          <Text style={styles.authIcon}>🔐</Text>
          <Text style={styles.authTitle}>Welcome to MindGarden</Text>
          <Text style={styles.authSubtitle}>
            Please log in to access your goals and use the AI assistant.
          </Text>
          <Button
            title="Log In"
            onPress={() => navigation.navigate('Login')}
            style={styles.authButton}
          />
          <Button
            title="Sign Up"
            onPress={() => navigation.navigate('Signup')}
            variant="outline"
            style={styles.authButton}
          />
        </View>
      </SafeAreaView>
    );
  }

  // Show loading state while fetching goals
  if (goalsLoading) {
    return (
      <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Goals</Text>
        </View>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading goals...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Goals</Text>
      </View>

      <ScrollView 
        style={styles.content} 
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* AI Assistant Section */}
        <View style={styles.aiSection}>
          <View style={styles.aiHeader}>
            <Text style={styles.aiIcon}>🪄</Text>
            <Text style={styles.aiTitle}>AI Assistant</Text>
          </View>
          
          {!showAiInput && !showAiReview ? (
            <View style={styles.aiPrompt}>
              <Text style={styles.aiPromptText}>Need help with your goals?</Text>
              <Button
                title="Ask AI Assistant"
                onPress={() => setShowAiInput(true)}
                variant="outline"
                style={styles.aiButton}
              />
            </View>
          ) : showAiInput ? (
            <View style={styles.aiInputContainer}>
              <Input
                placeholder="Describe your goal or ask for help..."
                value={aiInput}
                onChangeText={setAiInput}
                multiline
                numberOfLines={3}
                style={styles.aiInput}
              />
              <View style={styles.aiInputActions}>
                <Button
                  title="Cancel"
                  onPress={() => {
                    setShowAiInput(false);
                    setAiInput('');
                  }}
                  variant="secondary"
                  style={styles.aiCancelButton}
                />
                <Button
                  title={loading ? "Thinking..." : "Ask AI"}
                  onPress={handleAiSubmit}
                  loading={loading}
                  style={styles.aiSubmitButton}
                />
              </View>
            </View>
          ) : showAiReview && aiSuggestion ? (
            <View style={styles.aiReviewContainer}>
              <Text style={styles.aiReviewTitle}>AI Suggestion</Text>
              
              <View style={styles.suggestionCard}>
                <Text style={styles.suggestionGoalTitle}>{aiSuggestion.title}</Text>
                <Text style={styles.suggestionGoalDescription}>{aiSuggestion.description}</Text>
                
                <Text style={styles.milestonesTitle}>Suggested Milestones & Steps:</Text>
                {aiSuggestion.milestones.map((milestone, index) => (
                  <View key={index} style={styles.suggestionMilestone}>
                    <Text style={styles.milestoneNumber}>{index + 1}.</Text>
                    <View style={styles.milestoneContent}>
                      <Text style={styles.milestoneTitle}>{milestone.title}</Text>
                      <Text style={styles.milestoneDescription}>{milestone.description}</Text>
                      {milestone.steps && milestone.steps.length > 0 && (
                        <View style={styles.stepsContainer}>
                          {milestone.steps.map((step, stepIndex) => (
                            <View key={stepIndex} style={styles.suggestionStep}>
                              <Text style={styles.stepNumber}>•</Text>
                              <Text style={styles.stepTitle}>{step.title}</Text>
                            </View>
                          ))}
                        </View>
                      )}
                    </View>
                  </View>
                ))}
              </View>
              
              <View style={styles.aiReviewActions}>
                <Button
                  title="Accept & Edit"
                  onPress={() => {
                    handleAcceptSuggestion();
                    // Navigate to edit screen with the new goal
                    navigation.navigate('GoalForm', { 
                      editMode: true, 
                      goalData: aiSuggestion 
                    });
                  }}
                  style={styles.acceptButton}
                />
                <Button
                  title="Accept As-Is"
                  onPress={handleAcceptSuggestion}
                  variant="outline"
                  style={styles.acceptAsIsButton}
                />
                <Button
                  title="Re-do"
                  onPress={handleRedoSuggestion}
                  variant="outline"
                  style={styles.redoButton}
                />
                <Button
                  title="Cancel"
                  onPress={handleCancelSuggestion}
                  variant="secondary"
                  style={styles.cancelButton}
                />
              </View>
            </View>
          ) : null}
        </View>

        {/* Goals Section */}
        <View style={styles.goalsSection}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Active Goals ({goals.length})</Text>
            <TouchableOpacity onPress={() => setShowGoalsModal(true)}>
              <Text style={styles.viewAllText}>View All</Text>
            </TouchableOpacity>
          </View>

          {goals.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyStateIcon}>🎯</Text>
              <Text style={styles.emptyStateTitle}>No goals yet</Text>
              <Text style={styles.emptyStateText}>
                Start by asking the AI assistant to help you create your first goal!
              </Text>
              <Button
                title="Ask AI Assistant"
                onPress={() => setShowAiInput(true)}
                style={styles.emptyStateButton}
              />
            </View>
          ) : (
            <View style={styles.goalsList}>
              {goals.map(renderGoalCard)}
            </View>
          )}
        </View>

        {/* Bottom Actions */}
        <View style={styles.bottomActions}>
          <TouchableOpacity style={styles.bottomAction}>
            <Text style={styles.bottomActionText}>Completed Goals</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.bottomAction}>
            <Text style={styles.bottomActionText}>AI Suggestions</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Goals List Modal */}
      <GoalsListModal
        visible={showGoalsModal}
        onClose={() => setShowGoalsModal(false)}
        goals={goals}
        onGoalPress={handleGoalPress}
        onGoalDelete={handleGoalDelete}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.surface,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.light,
    backgroundColor: colors.background.primary,
  },
  headerTitle: {
    fontSize: typography.fontSize.xl,
    fontWeight: typography.fontWeight.bold,
    color: colors.text.primary,
  },
  content: {
    flex: 1,
    padding: spacing.md,
  },
  scrollContent: {
    paddingBottom: spacing.xl * 2, // Extra padding for system navigation
  },
  aiSection: {
    backgroundColor: colors.background.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    marginBottom: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border.light,
  },
  aiHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  aiIcon: {
    fontSize: 24,
    marginRight: spacing.sm,
  },
  aiTitle: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.bold,
    color: colors.text.primary,
  },
  aiPrompt: {
    alignItems: 'center',
  },
  aiPromptText: {
    fontSize: typography.fontSize.base,
    color: colors.text.secondary,
    marginBottom: spacing.sm,
    textAlign: 'center',
  },
  aiButton: {
    minWidth: 120,
  },
  aiInputContainer: {
    marginTop: spacing.sm,
  },
  aiInput: {
    marginBottom: spacing.sm,
  },
  aiInputActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  aiCancelButton: {
    flex: 1,
    marginRight: spacing.sm,
  },
  aiSubmitButton: {
    flex: 1,
  },
  aiReviewContainer: {
    marginTop: spacing.sm,
  },
  aiReviewTitle: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.bold,
    color: colors.text.primary,
    marginBottom: spacing.md,
    textAlign: 'center',
  },
  suggestionCard: {
    backgroundColor: colors.secondary,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.border.light,
  },
  suggestionGoalTitle: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.bold,
    color: colors.text.primary,
    marginBottom: spacing.sm,
  },
  suggestionGoalDescription: {
    fontSize: typography.fontSize.sm,
    color: colors.text.secondary,
    marginBottom: spacing.md,
    lineHeight: typography.lineHeight.normal * typography.fontSize.sm,
  },
  milestonesTitle: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.bold,
    color: colors.text.primary,
    marginBottom: spacing.sm,
  },
  suggestionMilestone: {
    flexDirection: 'row',
    marginBottom: spacing.sm,
  },
  milestoneNumber: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.bold,
    color: colors.text.secondary,
    marginRight: spacing.sm,
    minWidth: 20,
  },
  milestoneContent: {
    flex: 1,
  },
  milestoneTitle: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.bold,
    color: colors.text.primary,
    marginBottom: spacing.xs,
  },
  milestoneDescription: {
    fontSize: typography.fontSize.xs,
    color: colors.text.secondary,
    lineHeight: typography.lineHeight.normal * typography.fontSize.xs,
  },
  stepsContainer: {
    marginTop: spacing.xs,
    marginLeft: spacing.sm,
  },
  suggestionStep: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  stepNumber: {
    fontSize: typography.fontSize.xs,
    color: colors.text.secondary,
    marginRight: spacing.xs,
  },
  stepTitle: {
    fontSize: typography.fontSize.xs,
    color: colors.text.secondary,
    flex: 1,
  },
  aiReviewActions: {
    flexDirection: 'row',
    gap: spacing.sm,
    flexWrap: 'wrap',
  },
  acceptButton: {
    flex: 1,
    backgroundColor: colors.success,
    minWidth: '45%',
  },
  acceptAsIsButton: {
    flex: 1,
    minWidth: '45%',
  },
  redoButton: {
    flex: 1,
    minWidth: '45%',
  },
  cancelButton: {
    flex: 1,
    minWidth: '45%',
  },
  goalsSection: {
    marginBottom: spacing.lg,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
  },
  sectionTitle: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.bold,
    color: colors.text.primary,
  },
  viewAllText: {
    fontSize: typography.fontSize.sm,
    color: colors.primary,
    fontWeight: typography.fontWeight.medium as any,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: spacing.xl,
  },
  emptyStateIcon: {
    fontSize: 48,
    marginBottom: spacing.md,
  },
  emptyStateTitle: {
    fontSize: typography.fontSize.xl,
    fontWeight: typography.fontWeight.bold,
    color: colors.text.primary,
    marginBottom: spacing.sm,
  },
  emptyStateText: {
    fontSize: typography.fontSize.base,
    color: colors.text.secondary,
    textAlign: 'center',
    marginBottom: spacing.lg,
    paddingHorizontal: spacing.lg,
  },
  emptyStateButton: {
    minWidth: 200,
  },
  goalsList: {
    gap: spacing.md,
  },
  goalCard: {
    backgroundColor: colors.secondary,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border.light,
  },
  goalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.sm,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  iconActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  iconButton: {
    padding: spacing.xs,
    borderRadius: borderRadius.sm,
  },
  ringContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  ringCaption: {
    marginTop: spacing.xs,
    fontSize: typography.fontSize.xs,
    color: colors.accent?.gold || colors.text.secondary,
  },
  progressCenterTextContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
  progressCenterText: {
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.bold as any,
    color: colors.text.primary,
  },
  goalTitle: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.bold,
    color: colors.text.primary,
    flex: 1,
  },
  goalHeaderActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  statusIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  deleteButton: {
    padding: spacing.xs,
    borderRadius: borderRadius.sm,
  },
  goalDescription: {
    fontSize: typography.fontSize.sm,
    color: colors.text.secondary,
    marginBottom: spacing.sm,
  },
  dueRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6 as any,
  },
  dueText: {
    marginLeft: spacing.xs,
    fontSize: typography.fontSize.xs,
    color: colors.text.secondary,
    fontWeight: typography.fontWeight.medium as any,
  },
  stepsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.xs,
    marginTop: spacing.xs,
  },
  stepsHeaderText: {
    fontSize: typography.fontSize.sm,
    color: colors.accent?.gold || colors.text.primary,
    fontWeight: typography.fontWeight.medium as any,
  },
  stepsList: {
    marginTop: spacing.xs,
    marginBottom: spacing.sm,
  },
  unlockNote: {
    marginTop: spacing.xs,
    fontSize: typography.fontSize.xs,
    color: colors.text.secondary,
  },
  dateEditContainer: {
    marginTop: spacing.xs,
  },
  dateEditActions: {
    flexDirection: 'row',
    gap: spacing.md,
    marginTop: spacing.xs,
  },
  actionText: {
    color: colors.accent?.gold || colors.primary,
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.medium as any,
  },
  stepRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
  },
  stepIconButton: {
    padding: spacing.xs,
    marginRight: spacing.xs,
  },
  stepText: {
    fontSize: typography.fontSize.sm,
    color: colors.text.primary,
    flex: 1,
  },
  stepTextCompleted: {
    textDecorationLine: 'line-through',
    color: colors.text.secondary,
  },
  editContainer: {
    marginTop: spacing.xs,
    marginBottom: spacing.sm,
  },
  milestoneEditBlock: {
    marginBottom: spacing.sm,
  },
  milestoneEditLabel: {
    fontSize: typography.fontSize.xs,
    color: colors.accent?.gold || colors.text.secondary,
    marginBottom: spacing.xs,
  },
  stepEditRow: {
    marginTop: spacing.xs,
  },
  stepEditLabel: {
    fontSize: typography.fontSize.xs,
    color: colors.accent?.gold || colors.text.secondary,
    marginBottom: spacing.xs,
  },
  editActions: {
    marginTop: spacing.xs,
    gap: spacing.xs,
  },
  
  nextMilestoneContainer: {
    flexDirection: 'column',
    alignItems: 'flex-start',
    marginBottom: spacing.md,
  },
  inlineLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginBottom: spacing.xs,
  },
  goldDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.accent?.gold || colors.warning,
  },
  nextMilestoneLabel: {
    fontSize: typography.fontSize.sm,
    color: colors.text.secondary,
    marginRight: spacing.xs,
    fontWeight: typography.fontWeight.bold as any,
  },
  nextMilestoneText: {
    fontSize: typography.fontSize.sm,
    color: colors.text.primary,
    fontWeight: typography.fontWeight.medium as any,
    flex: 1,
    flexShrink: 1,
    flexWrap: 'wrap',
  },
  nextStepContainer: {
    flexDirection: 'column',
    alignItems: 'flex-start',
    marginBottom: spacing.md,
  },
  nextStepLabel: {
    fontSize: typography.fontSize.sm,
    color: colors.text.secondary,
    marginRight: spacing.xs,
    fontWeight: typography.fontWeight.bold as any,
  },
  nextStepText: {
    fontSize: typography.fontSize.sm,
    color: colors.text.primary,
    fontWeight: typography.fontWeight.medium as any,
    flex: 1,
    flexShrink: 1,
    flexWrap: 'wrap',
  },
  goalActions: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  actionButton: {
    flex: 1,
    backgroundColor: colors.background.surface,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: borderRadius.md,
    alignItems: 'center',
  },
  actionButtonText: {
    fontSize: typography.fontSize.sm,
    color: colors.text.primary,
    fontWeight: typography.fontWeight.medium as any,
  },
  bottomActions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.border.light,
  },
  bottomAction: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
  },
  bottomActionText: {
    fontSize: typography.fontSize.sm,
    color: colors.primary,
    fontWeight: typography.fontWeight.medium as any,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.md,
  },
  loadingText: {
    fontSize: typography.fontSize.lg,
    color: colors.text.secondary,
  },
  debugText: {
    fontSize: typography.fontSize.sm,
    color: colors.text.secondary,
    marginTop: spacing.sm,
  },
  debugButton: {
    marginTop: spacing.sm,
  },
  authContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.md,
    backgroundColor: colors.background.surface,
  },
  authIcon: {
    fontSize: 60,
    marginBottom: spacing.sm,
  },
  authTitle: {
    fontSize: typography.fontSize.xl,
    fontWeight: typography.fontWeight.bold,
    color: colors.text.primary,
    marginBottom: spacing.sm,
  },
  authSubtitle: {
    fontSize: typography.fontSize.base,
    color: colors.text.secondary,
    textAlign: 'center',
    marginBottom: spacing.lg,
    paddingHorizontal: spacing.lg,
  },
  authButton: {
    minWidth: 200,
    marginBottom: spacing.sm,
  },
});
