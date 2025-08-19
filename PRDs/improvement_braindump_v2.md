# PRD: Brain Dump Workflow V2

## Summary
This document outlines the requirements for enhancing the "Brain Dump" feature in the Foci mobile app. Based on user feedback, this update introduces a dedicated onboarding flow, inline editing capabilities, and a new prioritization step. The goal is to make the process of converting unstructured thoughts into actionable, prioritized tasks more intuitive, transparent, and user-friendly.

---

## Product Goals
- **Improve Onboarding:** Clearly explain the brain dump workflow to new users to set expectations and increase confidence.
- **Enhance Clarity:** Allow users to edit AI-generated text for tasks and goals during the refinement process, ensuring titles are clean and meaningful.
- **Introduce Explicit Prioritization:** Add a distinct step for users to order their tasks, making it easier to decide on a primary focus.
- **Reduce User Anxiety:** Reassure users that all items can be fully edited later, reducing the pressure to perfect everything upfront.

---

## User Stories

### Onboarding & Education
- As a new user, I want a brief introduction to the brain dump feature so I understand the steps involved before I start.
- As a user, I want to be reminded that I can edit task and goal details later, so I don't feel overwhelmed during the initial sorting process.

### Task & Goal Refinement
- As a user, I want to edit the text of each item directly on the refinement screen to ensure the titles are accurate and clear to me.
- As a user, I want to easily classify my thoughts as either a 'Task' or a 'Goal' before moving on.

### Prioritization
- As a user, I want to arrange my newly created tasks in order of importance so I can decide what to tackle first.
- As a user, I want to easily select one task as my "Today's Focus" from the prioritized list.

---

## Functional Requirements

### 1. Brain Dump Onboarding Flow
- [ ] **Create `BrainDumpOnboardingScreen.tsx`**: This screen will be displayed the first time a user navigates to the Brain Dump tab.
- [ ] **Implement Onboarding UI**: The screen should feature a simple, multi-step visual guide (e.g., a carousel or paginated view) explaining the three main steps:
  1. **Dump:** "Write down everything on your mind."
  2. **Refine:** "We'll help you clean up and sort your thoughts into tasks and goals."
  3. **Prioritize:** "Arrange your tasks and pick one to focus on today."
- [ ] **Add "Skip" and "Don't Show Again"**: Include a mechanism to skip the onboarding and an option to prevent it from showing on subsequent visits. Store this preference in `AsyncStorage`.
- [ ] **Navigation Logic**:
  - Modify `mobile/src/navigation/TabNavigator.tsx`.
  - On navigating to the 'BrainDump' stack, check the `AsyncStorage` preference.
  - If the user hasn't seen the onboarding or hasn't opted out, show `BrainDumpOnboardingScreen` first. Otherwise, navigate directly to `BrainDumpInputScreen`.

### 2. Refinement Screen Enhancements (`BrainDumpRefinementScreen.tsx`)
- [ ] **Enable Inline Editing**:
  - For each item in the tasks and goals lists, make the text label editable.
  - On tap, convert the `Text` component into a `TextInput` field, pre-filled with the current text.
  - On blur or submit, update the item's `text` property in the `editedItems` state. The `sanitizeText` and `normalizeKey` utility functions must be applied to the new text.
- [ ] **Add Helper Text**:
  - Implement a non-intrusive UI element (e.g., a small banner or text block at the top of the screen) with the message: "Tip: Don't worry about getting it perfect. You can edit all details later."
- [ ] **Update Primary Action**:
  - Remove the existing "Tap to make this Today’s Focus" action from individual task cards.
  - Replace the "Save All Tasks to Inbox" button with a primary button labeled **"Next: Prioritize Tasks"**. This button should be disabled if there are no items classified as tasks.
  - The action for tapping a goal ("Tap to break this goal...") remains unchanged.

### 3. New Prioritization Screen
- [ ] **Create `BrainDumpPrioritizationScreen.tsx`**: This screen will manage the final ordering and saving of tasks.
- [ ] **Navigation**: The "Next: Prioritize Tasks" button on the `BrainDumpRefinementScreen` will navigate to this new screen, passing the final list of task items as a route parameter.
- [ ] **Implement Draggable List**:
  - Display the incoming tasks in a vertically draggable list (e.g., using `react-native-draggable-flatlist`).
  - The first item in the list should be visually highlighted and labeled as "Today's Focus".
  - Each list item should still display its priority badge (`low`/`medium`/`high`) for context, but the dragged order is the source of truth for prioritization.
- [ ] **Implement Final Save Logic**:
  - Add a "Save and Finish" button at the bottom of the screen.
  - On tap, perform the following actions:
    1. Call `tasksAPI.createTask` for the top item in the list, setting `is_today_focus: true`.
    2. Call `tasksAPI.bulkCreateTasks` for all remaining tasks in the list, setting `is_today_focus: false` for each.
    3. After successful API calls, clear the relevant session data from `AsyncStorage` (`lastBrainDumpThreadId`, `lastBrainDumpItems`).
    4. Set the `needsTasksRefresh` flag in `AsyncStorage` to `true`.
    5. Navigate the user to the main 'Tasks' tab.
    6. Display a success toast message: "Tasks saved! Your focus for today is set."

---

## UX Notes
- **Onboarding Simplicity**: The onboarding flow should use minimal text and clear icons or simple graphics. It must be easily dismissible.
- **Seamless Editing**: The transition from text display to text input on the refinement screen should be smooth, without jarring layout shifts.
- **Drag-and-Drop Feedback**: When a user drags an item on the prioritization screen, provide clear visual cues, such as the item lifting with a drop shadow, to indicate it's movable.
- **State Persistence**: If the user navigates away from the prioritization screen and comes back, their reordered list should be preserved during that session.

---

## Edge Cases & Clarifying Questions
- **No Tasks, Only Goals**: If the user's brain dump results only in items classified as 'Goals', the "Next: Prioritize Tasks" button on the refinement screen should be disabled or hidden. The user would proceed by tapping on individual goals to break them down. How should we guide the user in this case? Suggestion: Display a message like "Ready to plan? Tap a goal to break it into steps."
- **Back Navigation**: If the user presses the back button from the `BrainDumpPrioritizationScreen`, should they return to the `BrainDumpRefinementScreen` with their items intact? Yes, the state on the refinement screen should be preserved.
- **Single Task**: If the brain dump results in only one task, does the prioritization screen still appear? Yes, it should appear to confirm this single task as "Today's Focus". The drag-and-drop functionality will be present but not useful, which is an acceptable state.
