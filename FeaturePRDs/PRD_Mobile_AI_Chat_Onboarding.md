# PRD: Mobile AI Chat Onboarding

## Summary

This document defines the requirements for a new, guided onboarding experience for the mobile AI Chat page. This enhancement replaces the current static welcome message with an interactive flow designed to reduce friction for new users, proactively demonstrate the app's core functionalities (goals, tasks, and calendar), and guide them toward their first meaningful action.

## Product Goals

- Guide new mobile users through core functionality with a clear, low-friction onboarding flow.
- Proactively showcase the AI's capabilities for goal creation, task management, and calendar scheduling.
- Leverage the existing chat interface and components to create a seamless, integrated experience.

## User Stories

### Onboarding

- **As a new user**, I want to be shown what the AI can do so I'm not intimidated by a blank chat window.
- **As a new user**, I want a clear path to getting started with the app's core features (goals, tasks, calendar).
- **As a new user**, I want the AI to give me examples of how to phrase a request so I can provide a more effective prompt.

## Functional Requirements

### 1. Mobile AI Chat Onboarding Flow

- [ ] On initial load for new users, display a welcome message: *"Hi there, and welcome to Foci! I'm here to help you structure your goals and tasks in a way that feels manageable. What would you like to do first?"*

- [ ] Below the welcome message, render three quick action buttons with the following labels:
  - Create a Goal
  - Add a Task
  - Manage My Calendar

- [ ] On click of the **Create a Goal** button, the chat input must be pre-filled with the text *"Create a new goal."* and sent to the AI.

- [ ] On click of the **Add a Task** button, the chat input must be pre-filled with the text *"I need to add a new task."* and sent to the AI.

- [ ] On click of the **Manage My Calendar** button, the chat input must be pre-filled with the text *"I need to manage my calendar."* and sent to the AI.

- [ ] After the user initiates a goal creation by tapping the button, the AI must respond with a follow-up question and provide concrete examples of effective prompts. The response should be structured like: *"Great! What's the goal you have in mind? For example, you could say: 'Help me plan to learn to play the guitar' or 'Create a goal to run a marathon.'"*

- [ ] If no user interaction (typing or clicking a button) occurs for 10 seconds, send a second AI message to the user with conversational examples: *"You can also just tell me what's on your mind. For example, try saying: 'Help me plan to learn to play the guitar' or 'Schedule a dentist appointment for next Tuesday at 3 PM.'"*

### 2. UX Considerations

- [ ] Use the `mobile/src/components/ai/QuickActions.tsx` component to render the quick action buttons.

- [ ] Ensure a conversational, encouraging, and supportive tone in all initial AI messages.

- [ ] The initial welcome message and quick action buttons should be visually distinct from the standard chat conversation to signal the onboarding state.

## Edge Cases & Decisions

### Interaction Conflict
If a user starts typing a message before the AI's second, example-based message is sent, the timer for the second message will be canceled, and the message will not be displayed.

### One-time Onboarding
This onboarding experience is a one-time event triggered on a user's first login to the app. The chat page is the landing page after the initial sign-in, making this a natural point for the onboarding to occur.

### Re-triggering Onboarding
A user can re-trigger the onboarding flow manually. An octicon help icon will be added to the AI chat page. Tapping this icon will reset the chat and restart the onboarding flow from the initial welcome message.