# PRD: Momentum Mode for Today's Focus (Version 3)

## Summary
This document outlines requirements for "Momentum Mode," a feature designed to help users seamlessly transition from one task to the next. When enabled, completing the "Today's Focus" task will automatically designate the next highest-priority task as the new focus. This flow is designed to be lightweight, avoiding calendar event creation to prevent clutter. Users will have explicit control to toggle the mode, skip suggestions, and define whether tasks requiring travel should be included in the suggestion algorithm.

---

## Product Goals
-   **Increase Task Throughput:** Encourage users to complete more tasks by automating the decision of what to do next.
-   **Improve Workflow Control:** Provide users with simple, powerful controls to toggle the feature, skip unwanted tasks, and set location preferences.
-   **Maintain a Clean Workspace:** Ensure the rapid completion of tasks does not clutter the user's calendar with unnecessary, past-due events.
-   **Leverage Existing Systems:** Utilize the existing `is_today_focus` flag and task properties to deliver this feature with minimal schema changes.

---

## User Stories

### Core Functionality
-   As a user, I want to toggle a "Momentum Mode" so that when I complete my focus task, the app automatically gives me the next one without me having to ask.
-   As a user, if I'm not ready to tackle my current focus task, I want a "Skip" button to immediately get a new suggestion.
-   As a user, I want to specify if I'm working from home or am open to tasks that require travel, so the suggestions are relevant to my current context.
-   As a user, when I complete a task that was on my calendar, I want the corresponding calendar event to be removed automatically so my schedule stays clean.

---

## Functional Requirements

### 1. Backend API Enhancements

-   [ ] **Enhance `POST /api/tasks/focus/next` Endpoint:**
    -   This endpoint will serve as the core engine for finding the next focus task, used when completing or skipping a task.
    -   The request body should accept:
        -   `current_task_id` (The ID of the task being completed or skipped)
        -   `travel_preference` (A string, e.g., `'home_only'` or `'allow_travel'`)
        -   `exclude_ids` (An array of task IDs to ignore in the search, used by the 'Skip' feature)
    -   **Logic:**
        1.  Set `is_today_focus = false` for the `current_task_id`.
        2.  Find the next candidate task. The selection logic should filter and prioritize tasks that:
            -   Are not complete and are not in `exclude_ids`.
            -   Adhere to the `travel_preference` (e.g., if `'home_only'`, filter for tasks where `location` is null or matches a user's home address).
            -   Have an `estimated_duration` set.
            -   Have the highest priority and are due soonest.
        3.  **Handle Missing Duration:** If the best candidate task lacks an `estimated_duration`, assign a default value of 30 minutes.
        4.  Update the chosen candidate task by setting `is_today_focus = true`.
        5.  Return the full object of the new focus task to the frontend. **This process will not create any calendar events.**
-   [ ] **[Optional] Auto-delete Linked Calendar Events on Task Completion:**
    -   Modify the existing `PUT /api/tasks/:id` endpoint where a task's status is updated.
    -   When a task is marked as complete, the backend should perform a lookup in the `calendar_events` table for an event linked to that task.
    -   If a linked event is found, it should be deleted. [cite_start]This functionality is based on the logic from `utils/calendarService.js`[cite: 38].

### 2. Frontend: `TasksScreen.tsx` and Components

-   [ ] **Implement "Momentum Mode" Toggle Button:**
    -   In `TasksScreen.tsx`, add a new toggle button next to the existing "Inbox" button. This button will enable or disable Momentum Mode.
    -   The state of this toggle must be persisted (e.g., in user settings or local storage) and should be visually distinct (on/off states).
-   [ ] **Implement Travel Preference Control:**
    -   Add a UI control (e.g., a small dropdown or icon button) near the Momentum Mode toggle to allow users to select their travel preference (`'Home Only'` vs. `'Allow Travel'`).
    -   This preference should be passed to the `POST /api/tasks/focus/next` endpoint.
-   [ ] **Update "Today's Focus" Task Card:**
    -   Add a "Skip" button to the UI for the task currently marked as `is_today_focus`.
    -   Clicking "Skip" will call `POST /api/tasks/focus/next`, passing the current focus task's ID in the `exclude_ids` array to get a new suggestion.
-   [ ] **Automate the Core "Momentum" Flow:**
    -   Modify the `onComplete` handler for tasks.
    -   When a task is completed, check if it was the focus task (`is_today_focus === true`) AND if the Momentum Mode toggle is enabled.
    -   If both conditions are met, automatically call `POST /api/tasks/focus/next` with the appropriate `travel_preference`.
    -   Upon receiving a successful response, update the application state to reflect the new focus task and show a brief, non-blocking `SuccessToast` (e.g., "Next up: [New Task Title]").

---

## UX Notes
-   **Clear State Indication:** The Momentum Mode and Travel Preference toggles must have very clear visual states so the user always understands the app's current behavior.
-   **Immediate Feedback:** The transition from completing a task to seeing the new focus task should feel instantaneous to maintain the feeling of momentum.
-   **Graceful Fallback:** If no other tasks are available, the app should display a positive, celebratory message (e.g., "Great work, you've cleared all your tasks!").

---

## Edge Cases & Clarifying Questions
-   **Travel Time Origin:** For calculating travel time, what is the user's starting point?
    -   **Suggestion:** We should define a hierarchy: 1) Use the location of the previously completed task if it exists. 2) If not, use a "Home" or "Work" address from the user's profile settings. 3) If neither exists, we cannot calculate travel time and should default to suggesting a task without a location when `'Allow Travel'` is selected.
-   **"Skip" Exhaustion:** What happens if the user keeps hitting "Skip" until there are no more tasks that meet the criteria?
    -   **Suggestion:** The API should return a message indicating no more tasks are available, and the frontend should inform the user (e.g., "No other tasks match your criteria."). The original focus task should remain the focus in this case.