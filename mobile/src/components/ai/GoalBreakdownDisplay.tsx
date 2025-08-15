import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Icon from 'react-native-vector-icons/Octicons';
import { colors } from '../../themes/colors';
import { typography } from '../../themes/typography';
import { spacing, borderRadius } from '../../themes/spacing';

interface GoalStep {
  text: string;
}

interface GoalMilestone {
  title: string;
  steps: GoalStep[];
}

interface GoalData {
  title: string;
  description: string;
  dueDate?: string;
  priority?: string;
  milestones: GoalMilestone[];
}

interface GoalBreakdownDisplayProps {
  text: string;
}

export default function GoalBreakdownDisplay({ text }: GoalBreakdownDisplayProps) {
  // Parse goal breakdown from text
  const parseGoalBreakdown = (breakdownText: string): GoalData => {
    try {
      // First try to parse standardized JSON format
      const jsonMatch = breakdownText.match(/```json\s*(\{[\s\S]*?\})\s*```/);
      if (jsonMatch) {
        const jsonData = JSON.parse(jsonMatch[1]);
        // Case A: { category: 'goal', milestones: [...] } (older schema)
        if (jsonData.category === 'goal' && jsonData.milestones) {
          return {
            title: jsonData.title || '',
            description: jsonData.description || '',
            dueDate: jsonData.due_date || jsonData.dueDate,
            priority: jsonData.priority,
            milestones: jsonData.milestones
          };
        }
        // Case B: { category: 'goal', goal: { ...full goal... } } (current backend schema)
        if (jsonData.category === 'goal' && jsonData.goal) {
          const g = jsonData.goal || {};
          return {
            title: g.title || jsonData.title || '',
            description: g.description || '',
            dueDate: g.target_completion_date || g.due_date || g.dueDate,
            priority: g.priority,
            milestones: Array.isArray(g.milestones) ? g.milestones : [],
          };
        }
        // Case C: read action wrapper { action_type:'read', entity_type:'goal', details: {...} }
        if (jsonData.action_type === 'read' && jsonData.entity_type === 'goal') {
          const details = jsonData.details || {};
          const first = Array.isArray(details?.goals) ? details.goals[0] : (Array.isArray(details) ? details[0] : details);
          const g = first || {};
          if (g && typeof g === 'object') {
            return {
              title: g.title || '',
              description: g.description || '',
              dueDate: g.target_completion_date || g.due_date || g.dueDate,
              priority: g.priority,
              milestones: Array.isArray(g.milestones) ? g.milestones : [],
            };
          }
        }
      }
      
      // Also try to parse if the text is just JSON
      const directJsonMatch = breakdownText.match(/\{[\s\S]*\}/);
      if (directJsonMatch) {
        const jsonData = JSON.parse(directJsonMatch[0]);
        // Mirror the same three cases for direct JSON
        if (jsonData.category === 'goal' && jsonData.milestones) {
          return {
            title: jsonData.title || '',
            description: jsonData.description || '',
            dueDate: jsonData.due_date || jsonData.dueDate,
            priority: jsonData.priority,
            milestones: jsonData.milestones
          };
        }
        if (jsonData.category === 'goal' && jsonData.goal) {
          const g = jsonData.goal || {};
          return {
            title: g.title || jsonData.title || '',
            description: g.description || '',
            dueDate: g.target_completion_date || g.due_date || g.dueDate,
            priority: g.priority,
            milestones: Array.isArray(g.milestones) ? g.milestones : [],
          };
        }
        if (jsonData.action_type === 'read' && jsonData.entity_type === 'goal') {
          const details = jsonData.details || {};
          const first = Array.isArray(details?.goals) ? details.goals[0] : (Array.isArray(details) ? details[0] : details);
          const g = first || {};
          if (g && typeof g === 'object') {
            return {
              title: g.title || '',
              description: g.description || '',
              dueDate: g.target_completion_date || g.due_date || g.dueDate,
              priority: g.priority,
              milestones: Array.isArray(g.milestones) ? g.milestones : [],
            };
          }
        }
      }
    } catch (error) {
      console.error('Failed to parse JSON goal data:', error);
    }
    
    // Fallback to old parsing method for backward compatibility
    const goalData: GoalData = {
      title: '',
      description: '',
      dueDate: undefined,
      priority: undefined,
      milestones: []
    };
    
    // Split by lines and look for goal information
    const lines = breakdownText.split('\n');
    let currentMilestone: GoalMilestone | null = null;

    for (const line of lines) {
      const trimmedLine = line.trim();

      // Extract goal title
      const goalTitleMatch = trimmedLine.match(/\*\*goal\*\*:\s*(.+)/i);
      if (goalTitleMatch) {
        goalData.title = goalTitleMatch[1].trim();
        continue;
      }

      // Extract goal description
      const goalDescMatch = trimmedLine.match(/\*\*description\*\*:\s*(.+)/i);
      if (goalDescMatch) {
        goalData.description = goalDescMatch[1].trim();
        continue;
      }

      // Extract due date
      const dueDateMatch = trimmedLine.match(/\*\*due\s*date\*\*:\s*([^\n*]+)/i);
      if (dueDateMatch) {
        goalData.dueDate = dueDateMatch[1].trim();
        continue;
      }

      // Extract priority
      const priorityMatch = trimmedLine.match(/\*\*priority\*\*:\s*([^\n*]+)/i);
      if (priorityMatch) {
        const raw = priorityMatch[1].trim();
        goalData.priority = raw.split('(')[0].trim();
        continue;
      }

      // Ignore any explicit "Steps:" label lines
      if (/^([•\-\*]\s*)?\*\*?\s*steps\s*:\s*\*\*?/i.test(trimmedLine)) {
        continue;
      }

      // Skip a plain "Milestones:" header line so it doesn't render as a milestone card
      if (/^([•\-\*]\s*)?\*\*?\s*milestones\s*:\s*\*\*?$/i.test(trimmedLine)) {
        continue;
      }

      // Detect milestone headers in multiple common formats, even without a
      // preceding "Milestones:" section header.
      // Examples handled:
      // * **Milestone 3: React Native Core (Approx. 3–4 months)**
      // * Milestone 1: Fundamentals
      // Milestone 2: Advanced Topics
      const milestoneHeaderRegexes: RegExp[] = [
        /^([•\-\*]\s*)?\*\*(.+?)\*\*:?\s*$/i, // bullet with bold title
        /^([•\-\*]\s*)?\s*(Milestone\s*\d+[^:]*)\s*:?.*$/i, // bullet no bold
        /^\s*(Milestone\s*\d+[^:]*)\s*:?.*$/i, // no bullet
      ];

      let newMilestoneTitle: string | null = null;
      for (const rx of milestoneHeaderRegexes) {
        const m = trimmedLine.match(rx);
        if (m) {
          // If the match captured the whole bold title (case 1), prefer group 2; otherwise group 2 or 1 depending on pattern
          newMilestoneTitle = (m[2] || m[1] || '').trim();
          // Ensure this looks like a milestone title
          if (!/milestone/i.test(newMilestoneTitle)) {
            // In the bold-title case, the bold content might include "Milestone" or not.
            // If it does not, skip; this prevents treating bold regular lines as milestones.
            newMilestoneTitle = null;
          }
        }
        if (newMilestoneTitle) {break;}
      }

      if (newMilestoneTitle) {
        // Save previous milestone if exists
        if (currentMilestone) {
          goalData.milestones.push(currentMilestone);
        }

        currentMilestone = {
          title: newMilestoneTitle.replace(/\*\*/g, '').trim(),
          steps: [],
        };
        continue;
      }

      // Accumulate steps only if within a milestone block
      if (currentMilestone) {
        // Look for step patterns (bullet points with step content)
        const stepPattern = /^[•\-\*]\s*(.+)$/;
        const stepMatch = trimmedLine.match(stepPattern);

        if (stepMatch) {
          const stepText = stepMatch[1].replace(/\*\*/g, '').trim();
          if (
            stepText &&
            !/^steps\s*:/i.test(stepText) &&
            !/^(milestone\s*\d+\b)/i.test(stepText)
          ) {
            currentMilestone.steps.push({ text: stepText });
          }
        }
      }
    }
    
    // Add the last milestone
    if (currentMilestone) {
      goalData.milestones.push(currentMilestone);
    }
    
    return goalData;
  };

  const goalData = parseGoalBreakdown(text);

  // If no milestones found, return null to fall back to regular text display
  if (goalData.milestones.length === 0) {
    return null;
  }

  return (
    <View style={styles.container}>
      <Text style={styles.breakdownTitle}>Goal Breakdown</Text>
      {goalData.title && (
        <View style={styles.goalHeader}>
          <Text style={styles.goalTitle} numberOfLines={0}>
            {goalData.title}
          </Text>
          {(goalData.dueDate || goalData.priority) && (
            <View style={styles.metaRow}>
              {goalData.dueDate && (
                <View style={styles.metaItem}>
                  <Icon name="calendar" size={14} color={colors.text.secondary} style={styles.metaIcon} />
                  <Text style={styles.metaText}>{formatDate(goalData.dueDate)}</Text>
                </View>
              )}
              {goalData.priority && (
                <View style={styles.metaItem}>
                  <Icon name="arrow-up" size={14} color={colors.text.secondary} style={styles.metaIcon} />
                  <Text style={styles.metaText}>Priority: {goalData.priority}</Text>
                </View>
              )}
            </View>
          )}
          {goalData.description && (
            <Text style={styles.goalDescription}>{goalData.description}</Text>
          )}
        </View>
      )}
      <View style={styles.milestonesContainer}>
        {goalData.milestones.map((milestone, milestoneIndex) => (
          <View key={milestoneIndex} style={styles.milestoneCard}>
            <View style={styles.leftAccent} />
            <View style={styles.milestoneHeader}>
              <Icon name="milestone" size={16} color={colors.primary} style={styles.milestoneIcon} />
              <Text style={styles.milestoneTitle} numberOfLines={0}>
                {milestone.title}
              </Text>
            </View>
            <View style={styles.stepsContainer}>
              {milestone.steps.map((step, stepIndex) => (
                <View key={stepIndex} style={styles.stepRow}>
                  <View style={styles.stepNumber}>
                  <Text style={styles.stepNumberText}>{stepIndex + 1}</Text>
                  </View>
                  <Text style={styles.stepText} numberOfLines={0}>
                    {step.text}
                  </Text>
                </View>
              ))}
            </View>
            {milestoneIndex < goalData.milestones.length - 1 && <View style={styles.separator} />}
          </View>
        ))}
      </View>
    </View>
  );
}

// Use explicit pixel line-heights for reliable wrapping on Android
const BASE_LINE_HEIGHT = Math.round(typography.fontSize.base * 1.6);
const SM_LINE_HEIGHT = Math.round(typography.fontSize.sm * 1.6);

// Local date formatting helper
function formatDate(input?: string) {
  if (!input) {return '';}
  try {
    const d = new Date(input);
    if (!isNaN(d.getTime())) {
      return d.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
    }
    return input;
  } catch {
    return input;
  }
}

const styles = StyleSheet.create({
  container: {
    marginTop: spacing.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    maxWidth: '100%',
  },
  breakdownTitle: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.bold,
    color: colors.text.primary,
    marginBottom: spacing.md,
  },
  goalHeader: {
    marginBottom: spacing.md,
    padding: spacing.md,
    backgroundColor: colors.background.surface,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.border.light,
  },
  goalTitle: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.bold,
    color: colors.primary,
    marginBottom: spacing.xs,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    marginBottom: spacing.xs,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: spacing.md,
    marginBottom: spacing.xs,
  },
  metaIcon: {
    marginRight: spacing.xs,
  },
  metaText: {
    fontSize: typography.fontSize.sm,
    color: colors.text.secondary,
    lineHeight: SM_LINE_HEIGHT,
  },
  goalDescription: {
    fontSize: typography.fontSize.sm,
    color: colors.text.secondary,
    lineHeight: SM_LINE_HEIGHT,
  },
  milestonesContainer: {
    backgroundColor: colors.background.surface,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.border.light,
    overflow: 'hidden',
  },
  milestoneCard: {
    padding: spacing.md,
    paddingLeft: spacing.md + 6,
    width: '100%',
    position: 'relative',
  },
  leftAccent: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: 6,
    backgroundColor: colors.accent?.gold || '#D4AF37',
    borderTopLeftRadius: borderRadius.md,
    borderBottomLeftRadius: borderRadius.md,
  },
  milestoneHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  milestoneIcon: {
    marginRight: spacing.sm,
  },
  milestoneTitle: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.bold,
    color: colors.primary,
    flex: 1,
    flexShrink: 1,
    minWidth: 0,
  },
  stepsContainer: {
    marginLeft: spacing.md,
  },
  stepRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: spacing.md,
  },
  stepNumber: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.sm,
    marginTop: 2,
  },
  stepNumberText: {
    color: colors.secondary,
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.bold,
  },
  stepText: {
    fontSize: typography.fontSize.base,
    color: colors.text.primary,
    flex: 1,
    flexGrow: 1,
    flexBasis: 0,
    flexShrink: 1,
    minWidth: 0,
    lineHeight: BASE_LINE_HEIGHT,
    marginTop: 2,
    flexWrap: 'wrap',
  },
  separator: {
    height: 1,
    backgroundColor: colors.border.light,
    marginHorizontal: -spacing.md,
  },
}); 