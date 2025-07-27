import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors } from '../../themes/colors';
import { typography } from '../../themes/typography';
import { spacing, borderRadius } from '../../themes/spacing';
import { Input, Button } from '../../components/common';

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

export default function GoalsScreen({ navigation }: any) {
  const [goals, setGoals] = useState<Goal[]>([
    {
      id: '1',
      title: 'Learn React Native',
      description: 'Master mobile app development with React Native',
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
          id: 'm1',
          title: 'Learn React Native Basics',
          description: 'Understand core concepts and fundamentals',
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
          id: 'm2',
          title: 'Build Simple Components',
          description: 'Create reusable UI components',
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
          id: 'm3',
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
    },
    {
      id: '2',
      title: 'Exercise Regularly',
      description: 'Establish a consistent fitness routine',
      completedMilestones: 1,
      totalMilestones: 3,
      completedSteps: 3,
      totalSteps: 9,
      nextMilestone: 'Create workout plan',
      nextStep: 'Research exercise types',
      status: 'active',
      createdAt: new Date('2024-01-20'),
      milestones: [
        {
          id: 'm4',
          title: 'Assess Current Fitness',
          description: 'Evaluate current physical condition',
          completed: true,
          order: 1,
          steps: [
            { id: 's13', title: 'Measure body metrics', description: 'Record weight, measurements, and body composition', completed: true, order: 1 },
            { id: 's14', title: 'Test basic fitness', description: 'Assess strength, flexibility, and endurance', completed: true, order: 2 },
            { id: 's15', title: 'Set baseline goals', description: 'Define initial fitness targets', completed: true, order: 3 },
          ],
        },
        {
          id: 'm5',
          title: 'Create Workout Plan',
          description: 'Design a personalized exercise routine',
          completed: false,
          order: 2,
          steps: [
            { id: 's16', title: 'Research exercise types', description: 'Learn about different workout styles', completed: false, order: 1 },
            { id: 's17', title: 'Choose workout frequency', description: 'Decide on weekly exercise schedule', completed: false, order: 2 },
            { id: 's18', title: 'Plan progressive overload', description: 'Design gradual intensity increases', completed: false, order: 3 },
          ],
        },
        {
          id: 'm6',
          title: 'Establish Routine',
          description: 'Build consistent exercise habits',
          completed: false,
          order: 3,
          steps: [
            { id: 's19', title: 'Start with basics', description: 'Begin with simple, achievable workouts', completed: false, order: 1 },
            { id: 's20', title: 'Track progress', description: 'Monitor improvements and adjustments', completed: false, order: 2 },
            { id: 's21', title: 'Maintain consistency', description: 'Build long-term exercise habits', completed: false, order: 3 },
          ],
        },
      ],
    },
    {
      id: '3',
      title: 'Read 12 Books This Year',
      description: 'Expand knowledge through reading',
      completedMilestones: 0,
      totalMilestones: 3,
      completedSteps: 0,
      totalSteps: 9,
      nextMilestone: 'Choose first book',
      nextStep: 'Research book genres',
      status: 'active',
      createdAt: new Date('2024-01-25'),
      milestones: [
        {
          id: 'm7',
          title: 'Choose First Book',
          description: 'Select and plan your reading journey',
          completed: false,
          order: 1,
          steps: [
            { id: 's22', title: 'Research book genres', description: 'Explore different types of books', completed: false, order: 1 },
            { id: 's23', title: 'Create reading list', description: 'Compile 12 books for the year', completed: false, order: 2 },
            { id: 's24', title: 'Set reading schedule', description: 'Plan daily/weekly reading time', completed: false, order: 3 },
          ],
        },
        {
          id: 'm8',
          title: 'Establish Reading Habit',
          description: 'Build consistent reading routine',
          completed: false,
          order: 2,
          steps: [
            { id: 's25', title: 'Create reading environment', description: 'Set up comfortable reading space', completed: false, order: 1 },
            { id: 's26', title: 'Start first book', description: 'Begin reading the selected book', completed: false, order: 2 },
            { id: 's27', title: 'Track reading progress', description: 'Monitor pages read and time spent', completed: false, order: 3 },
          ],
        },
        {
          id: 'm9',
          title: 'Complete Reading Goal',
          description: 'Finish all 12 books successfully',
          completed: false,
          order: 3,
          steps: [
            { id: 's28', title: 'Maintain reading pace', description: 'Stay on track with reading schedule', completed: false, order: 1 },
            { id: 's29', title: 'Review and reflect', description: 'Take notes and reflect on learnings', completed: false, order: 2 },
            { id: 's30', title: 'Celebrate completion', description: 'Acknowledge achievement of reading goal', completed: false, order: 3 },
          ],
        },
      ],
    },
  ]);
  
  const [aiInput, setAiInput] = useState('');
  const [showAiInput, setShowAiInput] = useState(false);
  const [showAiReview, setShowAiReview] = useState(false);
  const [loading, setLoading] = useState(false);
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

  const handleAiSubmit = async () => {
    if (!aiInput.trim()) return;
    
    setLoading(true);
    // TODO: Integrate with AI service
    console.log('AI Goal Request:', aiInput);
    
    // Simulate AI response with structured data
    setTimeout(() => {
      const suggestion = {
        title: 'Learn React Native Development',
        description: 'Master mobile app development with React Native by building real projects and understanding core concepts.',
        milestones: [
          {
            title: 'Learn React Native Basics',
            description: 'Understand components, props, state, and navigation fundamentals',
            steps: [
              { title: 'Install React Native CLI', description: 'Set up development environment' },
              { title: 'Learn React Components', description: 'Understand component structure and lifecycle' },
              { title: 'Master Props and State', description: 'Learn data flow and state management' },
              { title: 'Practice Navigation', description: 'Implement stack and tab navigation' },
            ],
          },
          {
            title: 'Build Simple Components',
            description: 'Create reusable UI components and basic screens',
            steps: [
              { title: 'Create Button Component', description: 'Build reusable button with variants' },
              { title: 'Design Input Fields', description: 'Create styled input components' },
              { title: 'Build Card Layouts', description: 'Create card-based UI components' },
              { title: 'Implement Lists', description: 'Create scrollable list components' },
            ],
          },
          {
            title: 'Implement Navigation',
            description: 'Set up stack and tab navigation between screens',
            steps: [
              { title: 'Plan Navigation Structure', description: 'Design app navigation flow' },
              { title: 'Set up Stack Navigator', description: 'Configure screen navigation' },
              { title: 'Add Tab Navigation', description: 'Implement bottom tab navigation' },
              { title: 'Handle Navigation Events', description: 'Manage navigation state and events' },
            ],
          },
          {
            title: 'Build Complete App',
            description: 'Create a full-featured mobile application with real functionality',
            steps: [
              { title: 'Design App Architecture', description: 'Plan app structure and data flow' },
              { title: 'Implement Core Features', description: 'Build main app functionality' },
              { title: 'Add Error Handling', description: 'Implement proper error management' },
              { title: 'Test and Deploy', description: 'Final testing and app store deployment' },
            ],
          },
        ],
      };
      
      setAiSuggestion(suggestion);
      setLoading(false);
      setShowAiInput(false);
      setShowAiReview(true);
    }, 2000);
  };

  const handleAcceptSuggestion = () => {
    if (!aiSuggestion) return;
    
    // Create new goal with AI suggestions
    const newGoal: Goal = {
      id: Date.now().toString(),
      title: aiSuggestion.title,
      description: aiSuggestion.description,
      completedMilestones: 0,
      totalMilestones: aiSuggestion.milestones.length,
      completedSteps: 0,
      totalSteps: aiSuggestion.milestones.reduce((total, milestone) => total + (milestone.steps?.length || 0), 0),
      nextMilestone: aiSuggestion.milestones[0]?.title || '',
      nextStep: aiSuggestion.milestones[0]?.steps?.[0]?.title || '',
      status: 'active',
      createdAt: new Date(),
      milestones: aiSuggestion.milestones.map((milestone, index) => ({
        id: `m${Date.now()}_${index}`,
        title: milestone.title,
        description: milestone.description,
        completed: false,
        order: index + 1,
        steps: milestone.steps?.map((step, stepIndex) => ({
          id: `s${Date.now()}_${index}_${stepIndex}`,
          title: step.title,
          description: step.description,
          completed: false,
          order: stepIndex + 1,
        })) || [],
      })),
    };
    
    setGoals([...goals, newGoal]);
    setAiSuggestion(null);
    setShowAiReview(false);
    setAiInput('');
  };

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
        <Text style={styles.progressText}>{completed}/{total} {type}</Text>
      </View>
    );
  };

  const renderGoalCard = (goal: Goal) => {
    return (
      <TouchableOpacity 
        key={goal.id} 
        style={styles.goalCard}
        onPress={() => navigation.navigate('GoalDetail', { goalId: goal.id })}
      >
        <View style={styles.goalHeader}>
          <Text style={styles.goalTitle}>{goal.title}</Text>
          <View style={[
            styles.statusIndicator,
            { backgroundColor: goal.status === 'active' ? colors.success : colors.warning }
          ]} />
        </View>
        
        <Text style={styles.goalDescription}>{goal.description}</Text>
        
                 {renderProgressBar(goal.completedMilestones, goal.totalMilestones, 'milestones')}
         {renderProgressBar(goal.completedSteps, goal.totalSteps, 'steps')}
        
                 <View style={styles.nextMilestoneContainer}>
           <Text style={styles.nextMilestoneLabel}>Current Milestone:</Text>
           <Text style={styles.nextMilestoneText}>{goal.nextMilestone}</Text>
         </View>
         <View style={styles.nextStepContainer}>
           <Text style={styles.nextStepLabel}>Next Step:</Text>
           <Text style={styles.nextStepText}>{goal.nextStep}</Text>
         </View>
        
        <View style={styles.goalActions}>
          <TouchableOpacity style={styles.actionButton}>
            <Text style={styles.actionButtonText}>View Details</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionButton}>
            <Text style={styles.actionButtonText}>Ask AI Help</Text>
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Goals</Text>
        <TouchableOpacity 
          style={styles.addButton}
          onPress={() => navigation.navigate('GoalForm')}
        >
          <Text style={styles.addButtonText}>Add Goal</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
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
                   title="Accept"
                   onPress={handleAcceptSuggestion}
                   style={styles.acceptButton}
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
            <TouchableOpacity>
              <Text style={styles.viewAllText}>View All</Text>
            </TouchableOpacity>
          </View>

          {goals.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyStateIcon}>🎯</Text>
              <Text style={styles.emptyStateTitle}>No goals yet</Text>
              <Text style={styles.emptyStateText}>
                Start by creating your first goal or ask the AI assistant for help!
              </Text>
              <Button
                title="Create Your First Goal"
                onPress={() => navigation.navigate('GoalForm')}
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
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.light,
  },
  headerTitle: {
    fontSize: typography.fontSize.xl,
    fontWeight: typography.fontWeight.bold,
    color: colors.text.primary,
  },
  addButton: {
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.md,
  },
  addButtonText: {
    color: colors.secondary,
    fontWeight: typography.fontWeight.bold,
    fontSize: typography.fontSize.sm,
  },
  content: {
    flex: 1,
    padding: spacing.md,
  },
  aiSection: {
    backgroundColor: colors.surface,
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
  },
  acceptButton: {
    flex: 1,
    backgroundColor: colors.success,
  },
  redoButton: {
    flex: 1,
  },
  cancelButton: {
    flex: 1,
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
  goalTitle: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.bold,
    color: colors.text.primary,
    flex: 1,
  },
  statusIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  goalDescription: {
    fontSize: typography.fontSize.sm,
    color: colors.text.secondary,
    marginBottom: spacing.md,
  },
  progressContainer: {
    marginBottom: spacing.md,
  },
  progressBar: {
    height: 6,
    backgroundColor: colors.border.light,
    borderRadius: 3,
    marginBottom: spacing.xs,
  },
  progressFill: {
    height: '100%',
    backgroundColor: colors.primary,
    borderRadius: 3,
  },
  progressText: {
    fontSize: typography.fontSize.sm,
    color: colors.text.secondary,
  },
  nextMilestoneContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  nextMilestoneLabel: {
    fontSize: typography.fontSize.sm,
    color: colors.text.secondary,
    marginRight: spacing.xs,
  },
  nextMilestoneText: {
    fontSize: typography.fontSize.sm,
    color: colors.text.primary,
    fontWeight: typography.fontWeight.medium as any,
  },
  nextStepContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  nextStepLabel: {
    fontSize: typography.fontSize.sm,
    color: colors.text.secondary,
    marginRight: spacing.xs,
  },
  nextStepText: {
    fontSize: typography.fontSize.sm,
    color: colors.text.primary,
    fontWeight: typography.fontWeight.medium as any,
  },
  goalActions: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  actionButton: {
    flex: 1,
    backgroundColor: colors.surface,
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
});
