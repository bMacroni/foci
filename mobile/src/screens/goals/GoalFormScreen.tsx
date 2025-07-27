import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors } from '../../themes/colors';
import { typography } from '../../themes/typography';
import { spacing, borderRadius } from '../../themes/spacing';
import { Input, Button } from '../../components/common';

interface Milestone {
  id: string;
  title: string;
  description: string;
  completed: boolean;
}

export default function GoalFormScreen({ navigation, route }: any) {
  const isEditing = route.params?.goalId;
  
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [milestones, setMilestones] = useState<Milestone[]>([]);
  const [showAiHelp, setShowAiHelp] = useState(false);
  const [aiInput, setAiInput] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSave = async () => {
    if (!title.trim()) {
      // TODO: Show error message
      return;
    }

    setLoading(true);
    
    // TODO: Save goal to backend
    const goalData = {
      title: title.trim(),
      description: description.trim(),
      milestones: milestones.map(m => ({ ...m, id: undefined })),
    };

    console.log('Saving goal:', goalData);
    
    // Simulate API call
    setTimeout(() => {
      setLoading(false);
      navigation.goBack();
    }, 1000);
  };

  const handleAiSubmit = async () => {
    if (!aiInput.trim()) return;
    
    setLoading(true);
    // TODO: Integrate with AI service to generate milestones
    console.log('AI Milestone Request:', aiInput);
    
    // Simulate AI response with sample milestones
    setTimeout(() => {
      const aiMilestones: Milestone[] = [
        {
          id: Date.now().toString(),
          title: 'Research and Planning',
          description: 'Gather information and create a detailed plan',
          completed: false,
        },
        {
          id: (Date.now() + 1).toString(),
          title: 'Take First Steps',
          description: 'Begin implementation with small, manageable tasks',
          completed: false,
        },
        {
          id: (Date.now() + 2).toString(),
          title: 'Review and Adjust',
          description: 'Evaluate progress and make necessary adjustments',
          completed: false,
        },
      ];
      
      setMilestones(aiMilestones);
      setAiInput('');
      setShowAiHelp(false);
      setLoading(false);
    }, 2000);
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

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
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
            <TouchableOpacity onPress={() => setShowAiHelp(true)}>
              <Text style={styles.aiHelpText}>🤖 AI Help</Text>
            </TouchableOpacity>
          </View>

          {showAiHelp && (
            <View style={styles.aiSection}>
              <Text style={styles.aiPromptText}>
                Describe your goal and I'll help you break it down into milestones:
              </Text>
              <Input
                placeholder="e.g., I want to learn React Native and build a mobile app..."
                value={aiInput}
                onChangeText={setAiInput}
                multiline
                numberOfLines={3}
                style={styles.aiInput}
              />
              <View style={styles.aiActions}>
                <Button
                  title="Cancel"
                  onPress={() => {
                    setShowAiHelp(false);
                    setAiInput('');
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
}); 