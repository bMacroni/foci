import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors } from '../../themes/colors';
import { typography } from '../../themes/typography';
import { spacing, borderRadius } from '../../themes/spacing';
import { Button } from '../../components/common';

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
}

export default function GoalDetailScreen({ navigation, route }: any) {
  const { goalId } = route.params;
  const [goal, setGoal] = useState<Goal | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // TODO: Fetch goal details from backend
    // For now, simulate loading with mock data
    setTimeout(() => {
      setGoal({
        id: goalId,
        title: 'Learn React Native',
        description: 'Master mobile app development with React Native by building real projects and understanding core concepts.',
        completedMilestones: 2,
        totalMilestones: 3,
        completedSteps: 8,
        totalSteps: 12,
        nextMilestone: 'Build first app',
        nextStep: 'Create navigation structure',
        status: 'active',
        createdAt: new Date('2024-01-15'),
        milestones: [
          {
            id: '1',
            title: 'Learn React Native Basics',
            description: 'Understand components, props, state, and navigation',
            completed: true,
            order: 1,
            steps: [
              { id: 's1', title: 'Install React Native', description: 'Set up development environment', completed: true, order: 1 },
              { id: 's2', title: 'Learn Components', description: 'Understand React components', completed: true, order: 2 },
              { id: 's3', title: 'Study Props & State', description: 'Master data flow concepts', completed: true, order: 3 },
              { id: 's4', title: 'Practice Navigation', description: 'Learn stack and tab navigation', completed: true, order: 4 },
            ],
          },
          {
            id: '2',
            title: 'Build Simple Components',
            description: 'Create reusable UI components and screens',
            completed: true,
            order: 2,
            steps: [
              { id: 's5', title: 'Create Button Component', description: 'Build reusable button with variants', completed: true, order: 1 },
              { id: 's6', title: 'Design Input Fields', description: 'Create styled input components', completed: true, order: 2 },
              { id: 's7', title: 'Build Card Layouts', description: 'Create card-based UI components', completed: true, order: 3 },
              { id: 's8', title: 'Implement Lists', description: 'Create scrollable list components', completed: true, order: 4 },
            ],
          },
          {
            id: '3',
            title: 'Build First App',
            description: 'Create a complete mobile application',
            completed: false,
            order: 3,
            steps: [
              { id: 's9', title: 'Plan App Structure', description: 'Design app architecture and screens', completed: true, order: 1 },
              { id: 's10', title: 'Create navigation structure', description: 'Set up app navigation flow', completed: false, order: 2 },
              { id: 's11', title: 'Implement core features', description: 'Build main app functionality', completed: false, order: 3 },
              { id: 's12', title: 'Test and deploy', description: 'Final testing and app store deployment', completed: false, order: 4 },
            ],
          },
        ],
      });
      setLoading(false);
    }, 1000);
  }, [goalId]);

  const toggleMilestone = (milestoneId: string) => {
    if (!goal) return;
    
    setGoal({
      ...goal,
      milestones: goal.milestones.map(m => 
        m.id === milestoneId ? { ...m, completed: !m.completed } : m
      ),
    });
  };

  const toggleStep = (milestoneId: string, stepId: string) => {
    if (!goal) return;
    
    setGoal({
      ...goal,
      milestones: goal.milestones.map(m => 
        m.id === milestoneId ? {
          ...m,
          steps: m.steps.map(s => 
            s.id === stepId ? { ...s, completed: !s.completed } : s
          )
        } : m
      ),
    });
  };

  const getProgressPercentage = (completed: number, total: number) => {
    return total > 0 ? (completed / total) * 100 : 0;
  };

  const renderProgressBar = (completed: number, total: number, type: 'milestones' | 'steps') => {
    const percentage = getProgressPercentage(completed, total);
    
    return (
      <View style={styles.progressContainer}>
        <View style={styles.progressBar}>
          <View style={[styles.progressFill, { width: `${percentage}%` as any }]} />
        </View>
        <Text style={styles.progressText}>{completed}/{total} {type} completed</Text>
      </View>
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading goal...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!goal) {
    return (
      <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>Goal not found</Text>
          <Button
            title="Go Back"
            onPress={() => navigation.goBack()}
            style={styles.errorButton}
          />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.backButton}>← Back</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => navigation.navigate('GoalForm', { goalId: goal.id })}>
          <Text style={styles.editButton}>Edit</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Goal Header */}
        <View style={styles.goalHeader}>
          <View style={styles.goalTitleContainer}>
            <Text style={styles.goalTitle}>{goal.title}</Text>
            <View style={[
              styles.statusIndicator,
              { backgroundColor: goal.status === 'active' ? colors.success : colors.warning }
            ]} />
          </View>
          
          <Text style={styles.goalDescription}>{goal.description}</Text>
          
          {renderProgressBar(goal.completedMilestones, goal.totalMilestones, 'milestones')}
          {renderProgressBar(goal.completedSteps, goal.totalSteps, 'steps')}
        </View>

        {/* Next Milestone */}
        <View style={styles.nextMilestoneSection}>
          <Text style={styles.sectionTitle}>Next Milestone</Text>
          <View style={styles.nextMilestoneCard}>
            <Text style={styles.nextMilestoneTitle}>{goal.nextMilestone}</Text>
            <Text style={styles.nextMilestoneDescription}>
              This is your next step to achieve your goal
            </Text>
          </View>
        </View>

        {/* All Milestones */}
        <View style={styles.milestonesSection}>
          <Text style={styles.sectionTitle}>All Milestones</Text>
          
          {goal.milestones.map((milestone, index) => (
            <View key={milestone.id} style={styles.milestoneItem}>
              <View style={styles.milestoneHeader}>
                <TouchableOpacity
                  style={styles.milestoneCheckbox}
                  onPress={() => toggleMilestone(milestone.id)}
                >
                  <View style={[
                    styles.checkbox,
                    milestone.completed && styles.checkboxChecked
                  ]}>
                    {milestone.completed && <Text style={styles.checkmark}>✓</Text>}
                  </View>
                </TouchableOpacity>
                
                <View style={styles.milestoneContent}>
                  <Text style={[
                    styles.milestoneTitle,
                    milestone.completed && styles.milestoneTitleCompleted
                  ]}>
                    {index + 1}. {milestone.title}
                  </Text>
                  <Text style={[
                    styles.milestoneDescription,
                    milestone.completed && styles.milestoneDescriptionCompleted
                  ]}>
                    {milestone.description}
                  </Text>
                  
                  {/* Steps */}
                  {milestone.steps && milestone.steps.length > 0 && (
                    <View style={styles.stepsContainer}>
                      {milestone.steps.map((step, stepIndex) => (
                        <View key={step.id} style={styles.stepItem}>
                          <TouchableOpacity
                            style={styles.stepCheckbox}
                            onPress={() => toggleStep(milestone.id, step.id)}
                          >
                            <View style={[
                              styles.stepCheckboxInner,
                              step.completed && styles.stepCheckboxChecked
                            ]}>
                              {step.completed && <Text style={styles.stepCheckmark}>✓</Text>}
                            </View>
                          </TouchableOpacity>
                          
                          <View style={styles.stepContent}>
                            <Text style={[
                              styles.stepTitle,
                              step.completed && styles.stepTitleCompleted
                            ]}>
                              {stepIndex + 1}. {step.title}
                            </Text>
                            <Text style={[
                              styles.stepDescription,
                              step.completed && styles.stepDescriptionCompleted
                            ]}>
                              {step.description}
                            </Text>
                          </View>
                        </View>
                      ))}
                    </View>
                  )}
                </View>
              </View>
            </View>
          ))}
        </View>

        {/* Actions */}
        <View style={styles.actionsSection}>
          <Button
            title="Ask AI for Help"
            onPress={() => navigation.navigate('AIChat')}
            variant="outline"
            style={styles.aiHelpButton}
          />
          
          <Button
            title="Mark as Completed"
            onPress={() => {
              // TODO: Mark goal as completed
              console.log('Marking goal as completed');
            }}
            style={styles.completeButton}
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: typography.fontSize.lg,
    color: colors.text.secondary,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.lg,
  },
  errorText: {
    fontSize: typography.fontSize.lg,
    color: colors.error,
    marginBottom: spacing.lg,
    textAlign: 'center',
  },
  errorButton: {
    minWidth: 120,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.light,
  },
  backButton: {
    fontSize: typography.fontSize.base,
    color: colors.text.secondary,
  },
  editButton: {
    fontSize: typography.fontSize.base,
    color: colors.primary,
    fontWeight: typography.fontWeight.bold,
  },
  content: {
    flex: 1,
    padding: spacing.md,
  },
  goalHeader: {
    marginBottom: spacing.xl,
  },
  goalTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  goalTitle: {
    fontSize: typography.fontSize['2xl'],
    fontWeight: typography.fontWeight.bold,
    color: colors.text.primary,
    flex: 1,
  },
  statusIndicator: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  goalDescription: {
    fontSize: typography.fontSize.base,
    color: colors.text.secondary,
    marginBottom: spacing.lg,
    lineHeight: typography.lineHeight.normal * typography.fontSize.base,
  },
  progressContainer: {
    marginBottom: spacing.sm,
  },
  progressBar: {
    height: 8,
    backgroundColor: colors.border.light,
    borderRadius: 4,
    marginBottom: spacing.xs,
  },
  progressFill: {
    height: '100%',
    backgroundColor: colors.primary,
    borderRadius: 4,
  },
  progressText: {
    fontSize: typography.fontSize.sm,
    color: colors.text.secondary,
  },
  nextMilestoneSection: {
    marginBottom: spacing.xl,
  },
  sectionTitle: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.bold,
    color: colors.text.primary,
    marginBottom: spacing.md,
  },
  nextMilestoneCard: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border.light,
  },
  nextMilestoneTitle: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.bold,
    color: colors.text.primary,
    marginBottom: spacing.xs,
  },
  nextMilestoneDescription: {
    fontSize: typography.fontSize.sm,
    color: colors.text.secondary,
  },
  milestonesSection: {
    marginBottom: spacing.xl,
  },
  milestoneItem: {
    backgroundColor: colors.secondary,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.border.light,
  },
  milestoneHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  milestoneCheckbox: {
    marginRight: spacing.md,
    marginTop: 2,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: colors.border.medium,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxChecked: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  checkmark: {
    color: colors.secondary,
    fontSize: 14,
    fontWeight: typography.fontWeight.bold,
  },
  milestoneContent: {
    flex: 1,
  },
  milestoneTitle: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.bold,
    color: colors.text.primary,
    marginBottom: spacing.xs,
  },
  milestoneTitleCompleted: {
    textDecorationLine: 'line-through',
    color: colors.text.disabled,
  },
  milestoneDescription: {
    fontSize: typography.fontSize.sm,
    color: colors.text.secondary,
    lineHeight: typography.lineHeight.normal * typography.fontSize.sm,
  },
  milestoneDescriptionCompleted: {
    color: colors.text.disabled,
  },
  stepsContainer: {
    marginTop: spacing.md,
    marginLeft: spacing.lg,
  },
  stepItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: spacing.sm,
  },
  stepCheckbox: {
    marginRight: spacing.sm,
    marginTop: 2,
  },
  stepCheckboxInner: {
    width: 18,
    height: 18,
    borderRadius: 4,
    borderWidth: 1.5,
    borderColor: colors.border.medium,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepCheckboxChecked: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  stepCheckmark: {
    color: colors.secondary,
    fontSize: 12,
    fontWeight: typography.fontWeight.bold,
  },
  stepContent: {
    flex: 1,
  },
  stepTitle: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.medium,
    color: colors.text.primary,
    marginBottom: spacing.xs,
  },
  stepTitleCompleted: {
    textDecorationLine: 'line-through',
    color: colors.text.disabled,
  },
  stepDescription: {
    fontSize: typography.fontSize.xs,
    color: colors.text.secondary,
    lineHeight: typography.lineHeight.normal * typography.fontSize.xs,
  },
  stepDescriptionCompleted: {
    color: colors.text.disabled,
  },
  actionsSection: {
    gap: spacing.md,
    paddingBottom: spacing.xl,
  },
  aiHelpButton: {
    marginBottom: spacing.sm,
  },
  completeButton: {
    backgroundColor: colors.success,
  },
});
