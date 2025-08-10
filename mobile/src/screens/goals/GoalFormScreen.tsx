import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors } from '../../themes/colors';
import { typography } from '../../themes/typography';
import { spacing, borderRadius } from '../../themes/spacing';
import { Input, Button } from '../../components/common';
import { goalsAPI } from '../../services/api';

interface Milestone {
  id: string;
  title: string;
  description?: string;
  completed: boolean;
  steps?: Array<{
    id: string;
    text: string;
    completed: boolean;
    order: number;
  }>;
}

export default function GoalFormScreen({ navigation, route }: any) {
  const goalId = route.params?.goalId;
  const isEditing = !!goalId;
  
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [milestones, setMilestones] = useState<Milestone[]>([]);
  const [showAiHelp, setShowAiHelp] = useState(false);
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(isEditing);

  const loadExistingGoal = useCallback(async () => {
    try {
      setInitialLoading(true);
      const goalData = await goalsAPI.getGoalById(goalId);
      
      setTitle(goalData.title);
      setDescription(goalData.description);
      
      // Transform backend milestone format to UI format
      const uiMilestones: Milestone[] = (goalData.milestones || []).map(milestone => ({
        id: milestone.id,
        title: milestone.title,
        description: '', // Backend doesn't have description field
        completed: milestone.completed,
        steps: milestone.steps,
      }));
      
      setMilestones(uiMilestones);
    } catch (error) {
      console.error('Error loading existing goal:', error);
      Alert.alert('Error', 'Failed to load goal data. Please try again.');
      navigation.goBack();
    } finally {
      setInitialLoading(false);
    }
  }, [goalId, navigation]);

  // Load existing goal data when editing
  useEffect(() => {
    if (isEditing && goalId) {
      loadExistingGoal();
    }
  }, [goalId, isEditing, loadExistingGoal]);

  const handleSave = async () => {
    if (!title.trim()) {
      Alert.alert('Error', 'Please enter a goal title.');
      return;
    }

    setLoading(true);
    
    try {
      const goalData = {
        title: title.trim(),
        description: description.trim(),
        milestones: milestones.map(m => ({
          id: m.id,
          title: m.title,
          completed: m.completed,
          order: 0, // Will be set by backend
          steps: m.steps || [],
        })),
      };

      if (isEditing) {
        // Update existing goal
        await goalsAPI.updateGoal(goalId, goalData);
        Alert.alert('Success', 'Goal updated successfully!');
      } else {
        // Create new goal
        await goalsAPI.createGoal(goalData as any);
        Alert.alert('Success', 'Goal created successfully!');
      }
      
      navigation.goBack();
    } catch (error) {
      console.error('Error saving goal:', error);
      Alert.alert('Error', 'Failed to save goal. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleAiSubmit = async () => {
    if (!title.trim()) return;
    
    setLoading(true);
    
    try {
      // Import the API service
      const { goalsAPI } = await import('../../services/api');
      
      // Call the AI breakdown generation API
      const breakdown = await goalsAPI.generateBreakdown({
        title: title.trim(),
        description: description.trim(),
      });
      
      // Transform the API response to match our UI structure
      const aiMilestones: Milestone[] = breakdown.milestones.map((milestone, index) => ({
        id: Date.now().toString() + index,
        title: milestone.title,
        description: `AI-generated milestone: ${milestone.title}`,
        completed: false,
      }));
      
      setMilestones(aiMilestones);
      setShowAiHelp(false);
      setLoading(false);
    } catch (error) {
      console.error('Error generating AI breakdown:', error);
      setLoading(false);
      Alert.alert('Error', 'Failed to generate AI breakdown. Please try again.');
    }
  };

  const addMilestone = () => {
    const newMilestone: Milestone = {
      id: Date.now().toString(),
      title: '',
      description: '',
      completed: false,
    };
    setMilestones([...milestones, newMilestone]);
  };

  const updateMilestone = (id: string, field: keyof Milestone, value: any) => {
    setMilestones(milestones.map(m => 
      m.id === id ? { ...m, [field]: value } : m
    ));
  };

  const removeMilestone = (id: string) => {
    setMilestones(milestones.filter(m => m.id !== id));
  };

  const toggleMilestone = (id: string) => {
    setMilestones(milestones.map(m => 
      m.id === id ? { ...m, completed: !m.completed } : m
    ));
  };

  if (initialLoading) {
    return (
      <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Text style={styles.backButton}>Cancel</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>
            {isEditing ? 'Edit Goal' : 'New Goal'}
          </Text>
          <TouchableOpacity disabled={true}>
            <Text style={[styles.saveButton, styles.saveButtonDisabled]}>
              Loading...
            </Text>
          </TouchableOpacity>
        </View>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading goal data...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.backButton}>Cancel</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>
          {isEditing ? 'Edit Goal' : 'New Goal'}
        </Text>
        <TouchableOpacity onPress={handleSave} disabled={loading}>
          <Text style={[styles.saveButton, loading && styles.saveButtonDisabled]}>
            {loading ? 'Saving...' : 'Save'}
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView 
        style={styles.content} 
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Goal Details */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Goal Details</Text>
          
          <Input
            placeholder="What do you want to achieve?"
            value={title}
            onChangeText={setTitle}
            style={styles.titleInput}
          />
          
          <Input
            placeholder="Describe your goal in detail..."
            value={description}
            onChangeText={setDescription}
            multiline
            numberOfLines={4}
            style={styles.descriptionInput}
          />
        </View>

        {/* Milestones Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Milestones</Text>
          </View>
          
          {/* AI vs Manual Options - Only show for new goals */}
          {!isEditing && (
            <View style={styles.milestoneOptions}>
              <TouchableOpacity 
                style={styles.aiOptionButton}
                onPress={() => setShowAiHelp(true)}
              >
                <Text style={styles.aiOptionIcon}>🤖</Text>
                <Text style={styles.aiOptionTitle}>AI Generate</Text>
                <Text style={styles.aiOptionSubtitle}>Let AI break down your goal</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={styles.manualOptionButton}
                onPress={addMilestone}
              >
                <Text style={styles.manualOptionIcon}>✏️</Text>
                <Text style={styles.manualOptionTitle}>Manual Entry</Text>
                <Text style={styles.manualOptionSubtitle}>Create milestones yourself</Text>
              </TouchableOpacity>
            </View>
          )}

          {showAiHelp && (
            <View style={styles.aiSection}>
              <Text style={styles.aiPromptText}>
                Using your goal "{title}" to generate milestones...
              </Text>
              <View style={styles.aiActions}>
                <Button
                  title="Cancel"
                  onPress={() => {
                    setShowAiHelp(false);
                  }}
                  variant="secondary"
                  style={styles.aiCancelButton}
                />
                <Button
                  title={loading ? "Generating..." : "Generate Milestones"}
                  onPress={handleAiSubmit}
                  loading={loading}
                  style={styles.aiSubmitButton}
                />
              </View>
            </View>
          )}

          {milestones.length === 0 && !showAiHelp ? (
            <View style={styles.emptyMilestones}>
              <Text style={styles.emptyMilestonesText}>
                No milestones yet. Add them manually or use AI help to generate them.
              </Text>
            </View>
          ) : (
            <View style={styles.milestonesList}>
              {milestones.map((milestone, index) => (
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
                    <Text style={styles.milestoneNumber}>{index + 1}</Text>
                    <TouchableOpacity
                      style={styles.removeButton}
                      onPress={() => removeMilestone(milestone.id)}
                    >
                      <Text style={styles.removeButtonText}>×</Text>
                    </TouchableOpacity>
                  </View>
                  
                  <Input
                    placeholder="Milestone title"
                    value={milestone.title}
                    onChangeText={(value) => updateMilestone(milestone.id, 'title', value)}
                    style={styles.milestoneTitleInput}
                  />
                  
                  <Input
                    placeholder="Description (optional)"
                    value={milestone.description}
                    onChangeText={(value) => updateMilestone(milestone.id, 'description', value)}
                    multiline
                    numberOfLines={2}
                    style={styles.milestoneDescriptionInput}
                  />
                  
                  {/* Steps for this milestone */}
                  {milestone.steps && milestone.steps.length > 0 && (
                    <View style={styles.stepsContainer}>
                      <Text style={styles.stepsTitle}>Steps:</Text>
                      {milestone.steps.map((step, stepIndex) => (
                        <View key={step.id} style={styles.stepItem}>
                          <Text style={styles.stepNumber}>{stepIndex + 1}.</Text>
                          <Text style={styles.stepText}>{step.text}</Text>
                        </View>
                      ))}
                    </View>
                  )}
                </View>
              ))}
            </View>
          )}

          {!showAiHelp && (
            <Button
              title="Add Milestone"
              onPress={addMilestone}
              variant="outline"
              style={styles.addMilestoneButton}
            />
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.primary,
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
  headerTitle: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.bold,
    color: colors.text.primary,
  },
  saveButton: {
    fontSize: typography.fontSize.base,
    color: colors.primary,
    fontWeight: typography.fontWeight.bold,
  },
  saveButtonDisabled: {
    color: colors.text.disabled,
  },
  content: {
    flex: 1,
    padding: spacing.md,
  },
  scrollContent: {
    paddingBottom: spacing.xl * 2, // Extra padding for system navigation
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
  section: {
    marginBottom: spacing.xl,
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
    marginBottom: spacing.md,
  },
  aiHelpText: {
    fontSize: typography.fontSize.sm,
    color: colors.primary,
    fontWeight: typography.fontWeight.medium as any,
  },
  titleInput: {
    marginBottom: spacing.md,
  },
  descriptionInput: {
    marginBottom: spacing.sm,
  },
  aiSection: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.border.light,
  },
  aiPromptText: {
    fontSize: typography.fontSize.sm,
    color: colors.text.secondary,
    marginBottom: spacing.sm,
  },
  aiInput: {
    marginBottom: spacing.sm,
  },
  aiActions: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  aiCancelButton: {
    flex: 1,
  },
  aiSubmitButton: {
    flex: 1,
  },
  emptyMilestones: {
    alignItems: 'center',
    paddingVertical: spacing.lg,
  },
  emptyMilestonesText: {
    fontSize: typography.fontSize.sm,
    color: colors.text.secondary,
    textAlign: 'center',
  },
  milestonesList: {
    gap: spacing.md,
  },
  milestoneItem: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border.light,
  },
  milestoneHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  milestoneCheckbox: {
    marginRight: spacing.sm,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 4,
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
    fontSize: 12,
    fontWeight: typography.fontWeight.bold,
  },
  milestoneNumber: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.bold,
    color: colors.text.secondary,
    marginRight: 'auto',
  },
  removeButton: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: colors.error,
    alignItems: 'center',
    justifyContent: 'center',
  },
  removeButtonText: {
    color: colors.secondary,
    fontSize: 16,
    fontWeight: typography.fontWeight.bold,
  },
  milestoneTitleInput: {
    marginBottom: spacing.sm,
  },
  milestoneDescriptionInput: {
    marginBottom: spacing.sm,
  },
  addMilestoneButton: {
    marginTop: spacing.md,
  },
  milestoneOptions: {
    flexDirection: 'row',
    gap: spacing.md,
    marginBottom: spacing.md,
  },
  aiOptionButton: {
    flex: 1,
    backgroundColor: colors.primary,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.primary,
  },
  manualOptionButton: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border.medium,
  },
  aiOptionIcon: {
    fontSize: 24,
    marginBottom: spacing.xs,
  },
  aiOptionTitle: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.bold,
    color: colors.secondary,
    marginBottom: spacing.xs,
  },
  aiOptionSubtitle: {
    fontSize: typography.fontSize.xs,
    color: colors.secondary,
    textAlign: 'center',
    opacity: 0.8,
  },
  manualOptionIcon: {
    fontSize: 24,
    marginBottom: spacing.xs,
  },
  manualOptionTitle: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.bold,
    color: colors.text.primary,
    marginBottom: spacing.xs,
  },
  manualOptionSubtitle: {
    fontSize: typography.fontSize.xs,
    color: colors.text.secondary,
    textAlign: 'center',
  },
  stepsContainer: {
    marginTop: spacing.sm,
    paddingLeft: spacing.md,
  },
  stepsTitle: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.bold,
    color: colors.text.primary,
    marginBottom: spacing.xs,
  },
  stepItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: spacing.xs,
  },
  stepNumber: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.bold,
    color: colors.text.secondary,
    marginRight: spacing.xs,
    minWidth: 20,
  },
  stepText: {
    fontSize: typography.fontSize.sm,
    color: colors.text.primary,
    flex: 1,
  },
}); 