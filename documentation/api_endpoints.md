# API Endpoint Documentation

## Authentication

### `/api/auth`
- **POST `/signup`**  
  - Body: `{ email: string, password: string }`
  - Registers a new user. Returns a token if successful.

- **POST `/login`**  
  - Body: `{ email: string, password: string }`
  - Logs in a user. Returns a token if successful.

### `/api/auth/google`
- **GET `/login`**  
  - Starts Google OAuth flow. Redirects to Google.

- **GET `/callback`**  
  - Handles Google OAuth callback.  
  - Query: `?code=...&state=...` (state is JWT)

---

## Goals, Milestones, and Steps

### `/api/goals`
- **POST `/`**  
  - Body: `{ title, description?, target_completion_date?, category?, milestones? }`
  - Creates a new goal (optionally with milestones and steps).

- **GET `/`**  
  - Returns all goals for the authenticated user, including milestones and steps.

- **GET `/:id`**  
  - Returns a specific goal with its milestones and steps.

- **PUT `/:id`**  
  - Body: `{ ...fields to update }`
  - Updates a goal.

- **DELETE `/:id`**  
  - Deletes a goal.

#### Milestones (Nested under Goals)
- **POST `/:goalId/milestones`**  
  - Body: `{ title, order?, steps? }`
  - Adds a milestone to a goal.

- **GET `/:goalId/milestones`**  
  - Returns all milestones for a goal.

- **GET `/:goalId/milestones/lookup`**  
  - Query: `?title=...`
  - Looks up a milestone by title.

- **GET `/milestones/:milestoneId`**  
  - Returns a milestone by ID.

- **PUT `/milestones/:milestoneId`**  
  - Body: `{ ...fields to update }`
  - Updates a milestone.

- **DELETE `/milestones/:milestoneId`**  
  - Deletes a milestone.

#### Steps (Nested under Milestones)
- **POST `/milestones/:milestoneId/steps`**  
  - Body: `{ text, order?, completed? }`
  - Adds a step to a milestone.

- **GET `/milestones/:milestoneId/steps`**  
  - Returns all steps for a milestone.

- **GET `/milestones/:milestoneId/steps/lookup`**  
  - Query: `?text=...`
  - Looks up a step by text.

- **GET `/steps/:stepId`**  
  - Returns a step by ID.

- **PUT `/steps/:stepId`**  
  - Body: `{ ...fields to update }`
  - Updates a step.

- **DELETE `/steps/:stepId`**  
  - Deletes a step.

---

## Deprecated Endpoints

> **Warning:** The following endpoints are deprecated and will be removed in a future release. Please use the nested `/api/goals` endpoints for all milestone and step operations.
>
> - `/api/milestones` (all methods)
> - `/api/steps` (all methods)
>
> **Use instead:**
> - `/api/goals/:goalId/milestones` and related subroutes for all milestone operations
> - `/api/goals/milestones/:milestoneId/steps` and related subroutes for all step operations

---

## Tasks

### `/api/tasks`
- **POST `/`**  
  - Body: `{ ...task fields }`
  - Creates a new task.

- **POST `/bulk`**  
  - Body: `{ tasks: [...] }`
  - Bulk create tasks.

- **GET `/`**  
  - Returns all tasks for the authenticated user.

- **GET `/:id`**  
  - Returns a specific task.

- **PUT `/:id`**  
  - Body: `{ ...fields to update }`
  - Updates a task.

- **DELETE `/:id`**  
  - Deletes a task.

---

## Calendar

### `/api/calendar`
- **GET `/list`**  
  - Returns the user's calendar list.

- **GET `/events`**  
  - Query: `?maxResults=...`
  - Returns upcoming events from the local database.

- **GET `/events/date`**  
  - Query: `?date=YYYY-MM-DD`
  - Returns events for a specific date.

- **POST `/events`**  
  - Body: `{ summary, description?, startTime, endTime, timeZone? }`
  - Creates a new calendar event.

- **PUT `/events/:eventId`**  
  - Body: `{ summary, description?, startTime, endTime, timeZone? }`
  - Updates a calendar event.

- **DELETE `/events/:eventId`**  
  - Deletes a calendar event.

- **GET `/status`**  
  - Checks if Google Calendar is connected.

- **POST `/sync`**  
  - Manually syncs Google Calendar events.

---

## User

### `/api/user`
- **GET `/settings`**  
  - Returns user settings.

- **PUT `/settings`**  
  - Body: `{ ...fields to update }`
  - Updates user settings.

---

## AI

### `/api/ai`
- **POST `/chat`**  
  - Body: `{ message: string, threadId?: string }`
  - Chat with AI, optionally in a thread.

- **POST `/recommend-task`**  
  - Body: `{ userRequest: string }`
  - Get a recommended task.

- **POST `/threads`**  
  - Body: `{ title?: string, summary?: string }`
  - Create a new conversation thread.

- **GET `/threads`**  
  - Returns all conversation threads.

- **GET `/threads/:threadId`**  
  - Returns a specific conversation thread.

- **PUT `/threads/:threadId`**  
  - Body: `{ title?, summary? }`
  - Update a conversation thread.

- **DELETE `/threads/:threadId`**  
  - Deletes a conversation thread.

- **POST `/goal-suggestions`**  
  - Body: `{ goalTitle: string }`
  - Get goal suggestions from AI.

- **POST `/goal-breakdown`**  
  - Body: `{ goalTitle: string, goalDescription?: string }`
  - Get a breakdown of a goal from AI.

- **GET `/health`**  
  - Health check for AI service.

- **POST `/feedback`**  
  - Body: `{ ...feedback fields }`
  - Submit feedback.

---

## Conversations

### `/api/conversations`
- **GET `/threads`**  
  - Returns all conversation threads for the user.

- **GET `/stats`**  
  - Returns conversation statistics.

- **POST `/threads`**  
  - Creates a new conversation thread.

- **GET `/threads/:threadId`**  
  - Returns a specific conversation thread with all messages.

- **POST `/threads/:threadId/messages`**  
  - Body: `{ message: string }`
  - Adds a message to a conversation thread.

- **PUT `/threads/:threadId`**  
  - Body: `{ title?, summary? }`
  - Updates a conversation thread.

- **DELETE `/threads/:threadId`**  
  - Deletes a conversation thread.

---

**All endpoints (except `/auth` and `/auth/google`) require authentication via JWT in the `Authorization` header.** 