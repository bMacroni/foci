[48 tools called]

# 🧠 MindGarden Codebase Comprehensive Overview

## Project Overview

**MindGarden** is an AI-powered mental health productivity platform designed to support users with anxiety and depression through:
- AI-assisted goal setting and task management
- Advanced automatic scheduling with weather and travel time integration
- Google Calendar synchronization
- Natural language AI chat interface
- Conversation thread management

The platform consists of three main applications:
- **Backend**: Node.js/Express API server with Supabase database
- **Frontend**: React web application with Vite
- **Mobile**: React Native mobile app

---

## 🔧 Backend Architecture

### Core Server Files

#### `backend/src/server.js` (9.3KB, 273 lines)
**Purpose**: Main Express server entry point that configures middleware, routes, and scheduled jobs.

**Key Functions:**
- `getAllUserIds()`: Retrieves all user IDs from Google tokens table for calendar sync
- `getUsersWithAutoSchedulingEnabled()`: Gets users who have auto-scheduling enabled
- Scheduled cron jobs for:
  - Daily calendar sync (4:00 AM CST)
  - Daily auto-scheduling (5:00 AM CST) 
  - Periodic auto-scheduling (every 6 hours)

**Features:**
- Environment variable loading with cascading overrides
- CORS configuration
- Supabase client initialization
- Firebase Admin SDK setup
- Health check endpoint
- Comprehensive error handling

### Controllers

#### `backend/src/controllers/tasksController.js` (29KB, 944 lines)
**Purpose**: Handles all task-related business logic including CRUD operations, AI integration, and auto-scheduling.

**Key Functions:**
- `normalizeSearchText()`: Cleans and normalizes user search input
- `createTask()`: Creates new tasks with validation and AI integration
- `getTasks()`: Retrieves filtered task list with pagination
- `getTaskById()`: Gets individual task details
- `updateTask()`: Updates existing tasks with validation
- `deleteTask()`: Soft deletes tasks
- `getNextFocusTask()`: Gets the next task marked as today's focus
- `bulkCreateTasks()`: Creates multiple tasks from AI suggestions
- `createTaskFromAI()`: AI-powered task creation with natural language processing
- `updateTaskFromAI()`: AI-powered task updates
- `deleteTaskFromAI()`: AI-powered task deletion
- `lookupTaskbyTitle()`: Searches tasks by title
- `readTaskFromAI()`: AI-powered task reading and explanation
- `toggleAutoSchedule()`: Enables/disables auto-scheduling for tasks
- `getAutoSchedulingDashboard()`: Gets dashboard data for auto-scheduling
- `getUserSchedulingPreferences()`: Gets user scheduling preferences
- `updateUserSchedulingPreferences()`: Updates user scheduling preferences
- `getTaskSchedulingHistory()`: Gets task scheduling history
- `triggerAutoScheduling()`: Manually triggers auto-scheduling

#### `backend/src/controllers/goalsController.js` (29KB, 976 lines)
**Purpose**: Manages goal hierarchy including goals, milestones, and steps with AI assistance.

**Key Functions:**
- `createGoal()`: Creates new goals with AI-generated breakdowns
- `getGoals()`: Retrieves user's goals with filtering
- `getGoalTitles()`: Gets goal titles for AI suggestions
- `getGoalById()`: Gets detailed goal information
- `updateGoal()`: Updates existing goals
- `deleteGoal()`: Soft deletes goals
- `createTaskFromNextGoalStep()`: Creates tasks from goal steps
- `lookupGoalbyTitle()`: Searches goals by title
- `createGoalFromAI()`: AI-powered goal creation
- `updateGoalFromAI()`: AI-powered goal updates
- `deleteGoalFromAI()`: AI-powered goal deletion
- `createMilestone()`: Creates milestones within goals
- `updateMilestone()`: Updates milestone information
- `deleteMilestone()`: Deletes milestones
- `readMilestones()`: Gets milestones for a goal
- `createStep()`: Creates steps within milestones
- `updateStep()`: Updates step information
- `deleteStep()`: Deletes steps
- `readSteps()`: Gets steps for a milestone
- `generateGoalBreakdown()`: AI-powered goal breakdown into milestones and steps

#### `backend/src/controllers/autoSchedulingController.js` (30KB, 1012 lines)
**Purpose**: Handles intelligent task scheduling with weather, travel time, and calendar integration.

**Key Functions:**
- `autoScheduleTasks()`: Main auto-scheduling algorithm
- `processRecurringTask()`: Handles recurring task scheduling
- `scheduleTaskWithWeather()`: Weather-aware task scheduling
- `calculateTravelTime()`: Calculates travel time between locations
- `findOptimalTimeSlot()`: Finds best time slots for tasks
- `checkCalendarConflicts()`: Checks for scheduling conflicts
- `updateTaskSchedule()`: Updates task scheduling information
- `getWeatherForLocation()`: Gets weather data for scheduling decisions

#### `backend/src/controllers/conversationController.js` (14KB, 442 lines)
**Purpose**: Manages AI conversation threads and message handling.

**Key Functions:**
- `createThread()`: Creates new conversation threads
- `getThreads()`: Retrieves user's conversation threads
- `getThread()`: Gets detailed thread with messages
- `updateThread()`: Updates thread information
- `deleteThread()`: Deletes conversation threads
- `addMessage()`: Adds messages to threads
- `getMessages()`: Retrieves thread messages

#### `backend/src/controllers/userController.js` (8.3KB, 238 lines)
**Purpose**: Handles user profile management and preferences.

**Key Functions:**
- `getUserProfile()`: Gets user profile information
- `updateUserProfile()`: Updates user profile
- `getUserPreferences()`: Gets user preferences
- `updateUserPreferences()`: Updates user preferences
- `deleteUserAccount()`: Handles account deletion

#### Other Controllers
- `milestonesController.js`: Milestone CRUD operations
- `stepsController.js`: Step CRUD operations  
- `feedbackController.js`: User feedback handling

### Services & Utilities

#### `backend/src/utils/geminiService.js` (58KB, 1120 lines)
**Purpose**: Integrates Google Gemini AI for natural language processing and intelligent features.

**Key Functions:**
- `processBrainDump()`: Parses free-form text into structured tasks/goals
- `generateConversationTitle()`: Creates titles for conversations
- `classifyIntent()`: Classifies user intent from natural language
- `generateResponse()`: Generates AI responses
- `extractEntities()`: Extracts entities from user input
- `executeFunctionCall()`: Executes structured function calls
- `_generateContentWithRetry()`: Handles API calls with retry logic

#### `backend/src/utils/calendarService.js` (31KB, 832 lines)
**Purpose**: Handles Google Calendar integration and synchronization.

**Key Functions:**
- `syncCalendarEvents()`: Syncs events from Google Calendar
- `createCalendarEvent()`: Creates events in Google Calendar
- `updateCalendarEvent()`: Updates existing calendar events
- `deleteCalendarEvent()`: Deletes calendar events
- `getCalendarEvents()`: Retrieves calendar events
- `handleCalendarConflicts()`: Manages scheduling conflicts

#### `backend/src/utils/syncService.js` (7.9KB, 251 lines)
**Purpose**: Database synchronization utilities for calendar events and user preferences.

**Key Functions:**
- `syncCalendarEvents()`: Syncs events from Google Calendar to database
- `getCalendarEventsFromDB(userId, maxResults, timeMin, timeMax, taskId)`: Retrieves calendar events from database with time range and task filtering
- `calculateDateRangeForTier()`: Calculates appropriate date ranges based on user subscription tier
- `handleSyncConflicts()`: Manages synchronization conflicts

#### `backend/src/utils/weatherService.js` (9.9KB, 317 lines)
**Purpose**: Provides weather data for intelligent task scheduling.

**Key Functions:**
- `getWeatherForecast()`: Gets weather forecast for location
- `isGoodWeatherForActivity()`: Determines if weather is suitable for outdoor tasks
- `getWeatherImpact()`: Assesses weather impact on scheduling

#### `backend/src/utils/travelTimeService.js` (7.9KB, 251 lines)
**Purpose**: Calculates travel times between locations for task scheduling.

**Key Functions:**
- `calculateTravelTime()`: Calculates travel time using GraphHopper API
- `getOptimalRoute()`: Finds optimal travel routes
- `estimateArrivalTime()`: Estimates arrival times

#### `backend/src/services/notificationService.js` (15KB, 436 lines)
**Purpose**: Handles email and in-app notifications.

**Key Functions:**
- `sendEmailNotification()`: Sends email notifications
- `createInAppNotification()`: Creates in-app notifications
- `scheduleNotification()`: Schedules future notifications
- `sendTaskReminders()`: Sends task reminder notifications

### Routes

#### `backend/src/routes/ai.js` (14KB, 402 lines)
**Purpose**: AI chat and conversation endpoints.

**Routes:**
- `POST /api/ai/chat`: Main chat endpoint
- `GET /api/ai/conversations`: Get conversation threads
- `POST /api/ai/conversations`: Create conversation thread
- `DELETE /api/ai/conversations/:id`: Delete conversation

#### `backend/src/routes/tasks.js` (2.9KB, 85 lines)
**Purpose**: Task management API endpoints.

**Routes:**
- `GET /api/tasks`: Get tasks
- `POST /api/tasks`: Create task
- `PUT /api/tasks/:id`: Update task
- `DELETE /api/tasks/:id`: Delete task

#### `backend/src/routes/calendar.js` (16KB, 461 lines)
**Purpose**: Calendar integration endpoints.

**Routes:**
- `GET /api/calendar/events`: Get calendar events
- `GET /api/calendar/events/date?date=YYYY-MM-DD`: Get events for specific date
- `GET /api/calendar/events/task/:taskId`: Get calendar events for specific task
- `POST /api/calendar/events`: Create calendar event
- `PUT /api/calendar/events/:id`: Update calendar event
- `DELETE /api/calendar/events/:id`: Delete calendar event
- `POST /api/calendar/sync`: Sync with Google Calendar

---

## 🌐 Frontend Architecture

### Main Application Files

#### `frontend/src/App.jsx` (1.7KB, 60 lines)
**Purpose**: Main React application component with routing and authentication.

**Key Functions:**
- `AppContent()`: Main app content with authentication checks
- `handleLogin()`: Handles user login
- `showSuccess()`: Shows success toast notifications
- `hideSuccess()`: Hides success notifications

#### `frontend/src/pages/Dashboard.jsx` (6.1KB, 152 lines)
**Purpose**: Main dashboard page with overview of goals, tasks, and calendar.

**Key Functions:**
- Dashboard component with navigation and data display

### Components

#### `frontend/src/components/AIChat.jsx` (88KB, 2027 lines)
**Purpose**: AI chat interface for natural language interaction.

**Key Functions:**
- `sendMessage()`: Sends messages to AI
- `handleFunctionCall()`: Processes AI function calls
- `displayResponse()`: Displays AI responses
- `manageConversations()`: Manages conversation threads

#### `frontend/src/components/CalendarEvents.jsx` (53KB, 1227 lines)
**Purpose**: Calendar display and event management interface.

**Key Functions:**
- `renderCalendar()`: Renders calendar view
- `handleEventDrag()`: Handles drag-and-drop event moving
- `syncWithGoogle()`: Syncs with Google Calendar
- `createEvent()`: Creates new calendar events

#### `frontend/src/components/TaskList.jsx` (25KB, 519 lines)
**Purpose**: Task management interface with filtering and actions.

**Key Functions:**
- `filterTasks()`: Filters tasks by various criteria
- `updateTaskStatus()`: Updates task completion status
- `bulkActions()`: Performs bulk operations on tasks

#### `frontend/src/components/GoalList.jsx` (30KB, 581 lines)
**Purpose**: Goal management interface with hierarchy display.

**Key Functions:**
- `expandGoal()`: Expands goal to show milestones
- `createMilestone()`: Creates new milestones
- `trackProgress()`: Tracks goal completion progress

#### `frontend/src/components/AutoSchedulingDashboard.jsx` (16KB, 379 lines)
**Purpose**: Dashboard for auto-scheduling features and preferences.

**Key Functions:**
- `displaySchedulingHistory()`: Shows scheduling history
- `updatePreferences()`: Updates user scheduling preferences
- `triggerAutoSchedule()`: Manually triggers auto-scheduling

### Services & Contexts

#### `frontend/src/services/api.js` (8.3KB, 215 lines)
**Purpose**: API client for backend communication.

**Key Functions:**
- `getTasks()`: Fetches tasks from API
- `createTask()`: Creates new tasks
- `updateTask()`: Updates existing tasks
- `deleteTask()`: Deletes tasks
- `getGoals()`: Fetches goals
- `chatWithAI()`: Sends messages to AI chat

#### `frontend/src/contexts/AuthContext.jsx` (4.7KB, 163 lines)
**Purpose**: Authentication context for user state management.

**Key Functions:**
- `loginWithCredentials()`: Handles user login
- `signup()`: Handles user registration
- `logout()`: Handles user logout
- `isAuthenticated()`: Checks authentication status

---

## 📱 Mobile Architecture

### Main Application Files

#### `mobile/App.tsx` (2.0KB, 54 lines)
**Purpose**: Main React Native application entry point.

**Key Functions:**
- Configures Google Sign-In
- Sets up navigation and providers

#### `mobile/src/navigation/AppNavigator.tsx` (2.1KB, 61 lines)
**Purpose**: Main navigation configuration with authentication flow.

**Screens:**
- Login
- Signup  
- Main (Tab Navigator)
- Goal Form/Detail
- Task Form/Detail

#### `mobile/src/navigation/TabNavigator.tsx` (3.9KB, 93 lines)
**Purpose**: Tab-based navigation for main app sections.

**Tabs:**
- Brain Dump (with nested stack navigation)
- AI Chat
- Goals
- Tasks
- Calendar
- Profile

### Screen Components

#### `mobile/src/screens/calendar/CalendarScreen.tsx` (62KB, 1876 lines)
**Purpose**: Main calendar interface for mobile with event management.

**Key Functions:**
- `renderCalendarView()`: Renders calendar grid
- `handleEventPress()`: Handles event selection
- `createNewEvent()`: Creates new calendar events
- `syncCalendar()`: Syncs with Google Calendar
- `handleDragDrop()`: Handles drag-and-drop operations

#### `mobile/src/screens/tasks/TasksScreen.tsx` (46KB, 1299 lines)
**Purpose**: Task management screen with filtering and actions.

**Key Functions:**
- `loadTasks()`: Loads and displays tasks
- `filterTasks()`: Applies filters to task list
- `updateTask()`: Updates task information
- `toggleComplete()`: Toggles task completion status
- `findAvailableTimeSlot()`: Finds optimal calendar slots for tasks
- `handleQuickSchedule()`: Schedules tasks to calendar with conflict detection
- Focus workflow: Automatically schedules today's focus tasks to calendar
- Event cleanup: Removes previous focus task's calendar events when changing focus

#### `mobile/src/screens/goals/GoalsScreen.tsx` (75KB, 2058 lines)
**Purpose**: Goal management screen with hierarchy display.

**Key Functions:**
- `displayGoalHierarchy()`: Shows goals with milestones and steps
- `createGoal()`: Creates new goals
- `editGoal()`: Edits existing goals
- `trackProgress()`: Updates goal progress

#### `mobile/src/screens/ai/AIChatScreen.tsx` (40KB, 1132 lines)
**Purpose**: AI chat interface for mobile with conversation threads.

**Key Functions:**
- `sendMessage()`: Sends messages to AI
- `displayTypingIndicator()`: Shows typing animation
- `manageThreads()`: Manages conversation threads
- `handleFunctionCalls()`: Processes AI function responses

### Component Libraries

#### `mobile/src/components/calendar/` (9 files)
**Purpose**: Calendar-specific reusable components.

**Key Components:**
- `EventCard.tsx`: Individual event display (16KB, 537 lines)
- `EventFormModal.tsx`: Event creation/editing form (16KB, 539 lines)
- `SearchAndFilter.tsx`: Search and filtering interface (34KB, 936 lines)
- `VirtualizedEventList.tsx`: Performance-optimized event list (5.5KB, 194 lines)

#### `mobile/src/components/tasks/` (4 files)
**Purpose**: Task-specific reusable components.

**Key Components:**
- `TaskForm.tsx`: Task creation/editing form (31KB, 1000 lines)
- `TaskCard.tsx`: Individual task display (19KB, 600 lines)
- `AutoSchedulingPreferencesModal.tsx`: Auto-scheduling preferences (15KB, 508 lines)

#### `mobile/src/components/ai/` (6 files)
**Purpose**: AI-related reusable components.

**Key Components:**
- `GoalBreakdownDisplay.tsx`: Goal breakdown visualization (15KB, 456 lines)
- `TaskDisplay.tsx`: Task display for AI responses (9.5KB, 300 lines)
- `ScheduleDisplay.tsx`: Schedule display for AI responses (11KB, 292 lines)

### Services

#### `mobile/src/services/api.ts` (33KB, 1052 lines)
**Purpose**: Mobile API client for backend communication.

**Key Functions:**
- `getTasks()`: Fetches tasks
- `createTask()`: Creates new tasks
- `updateTask()`: Updates tasks
- `getGoals()`: Fetches goals
- `syncCalendar()`: Syncs calendar events
- `chatWithAI()`: AI chat communication

#### `mobile/src/services/enhancedApi.ts` (9.9KB, 352 lines)
**Purpose**: Enhanced API client with offline support and caching.

**Key Functions:**
- `getEvents()`: Fetches calendar events
- `getEventsForDate()`: Fetches events for specific date
- `getEventsForTask()`: Fetches events linked to specific task
- `scheduleTaskOnCalendar()`: Creates calendar event linked to task
- `getWithCache()`: Cached API requests
- `queueOfflineRequest()`: Queues requests for offline processing
- `syncOfflineData()`: Syncs offline data when online

#### `mobile/src/services/auth.ts` (13KB, 418 lines)
**Purpose**: Authentication service for mobile app.

**Key Functions:**
- `login()`: User login
- `logout()`: User logout
- `refreshToken()`: Token refresh
- `getCurrentUser()`: Get current user info

### Utilities

#### `mobile/src/utils/dateUtils.ts` (7.3KB, 257 lines)
**Purpose**: Date manipulation utilities for mobile app.

**Key Functions:**
- `formatDate()`: Formats dates for display
- `parseDate()`: Parses date strings
- `calculateDuration()`: Calculates time durations
- `isSameDay()`: Compares dates for equality

#### `mobile/src/utils/errorHandling.ts` (23KB, 681 lines)
**Purpose**: Comprehensive error handling and recovery for mobile app.

**Key Functions:**
- `handleApiError()`: Handles API errors with user feedback
- `retryFailedRequest()`: Retries failed requests
- `logError()`: Logs errors for debugging
- `showErrorToast()`: Shows error messages to user

---

## 🗄️ Database & Documentation

### Database Schema (`SQL/schema/000_full_schema_snapshot.sql`)
**Purpose**: Complete database schema with all tables, indexes, and policies.

**Key Tables:**
- `users`: User profiles and preferences
- `goals`: Goal hierarchy with milestones and steps
- `tasks`: Task management with auto-scheduling fields
- `calendar_events`: Google Calendar integration
- `conversation_threads`: AI conversation management
- `notifications`: Notification system
- `user_scheduling_preferences`: Auto-scheduling preferences

### Migrations (`SQL/migrations/`)
**Purpose**: Database schema evolution and updates.

**Key Migrations:**
- Auto-scheduling core features
- Notification system
- Calendar integration
- User preferences
- Conversation threads

### API Documentation
- `backend/GOAL_HIERARCHY_API.md`: Goal management API documentation
- `backend/GOAL_TITLES_API.md`: Goal titles API documentation
- `documentation/api_endpoints.md`: Complete API endpoint reference

---

## 📋 Key Architecture Patterns

### AI Integration Pattern
- **Gemini Service**: Central AI processing with function calling
- **Intent Classification**: Automatic user request classification
- **Function Calling**: Structured API calls for CRUD operations
- **Conversation Threads**: Context preservation across sessions

### Auto-Scheduling Pattern
- **Weather Integration**: Real-time weather data for outdoor tasks
- **Travel Time Calculation**: GraphHopper API for accurate travel times
- **Conflict Resolution**: Intelligent calendar conflict handling
- **User Preferences**: Personalized scheduling based on preferences

### Error Handling Pattern
- **Graceful Degradation**: App continues functioning with reduced features
- **User Feedback**: Clear error messages and recovery options
- **Offline Support**: Queued operations for when connectivity returns
- **Retry Logic**: Automatic retry for transient failures

### State Management Pattern
- **Context Providers**: React Context for global state
- **Local Storage**: Persistent data across app restarts
- **API Caching**: Reduced API calls with intelligent caching
- **Optimistic Updates**: Immediate UI updates with server sync

---

## 🚀 Recent Improvements & Fixes

### Calendar & Task Integration Enhancements

#### Calendar Event Filtering Fix
- **Issue**: Calendar was filtering out events created earlier in the day due to incorrect time range calculation
- **Fix**: Updated `calculateDateRangeForTier()` to use start of day instead of current time
- **Impact**: All today's events now appear correctly in the calendar

#### Today's Focus Auto-Scheduling
- **Feature**: Automatically schedules today's focus tasks to available calendar slots
- **Implementation**: Smart slot finding algorithm with conflict detection
- **Workflow**: Set task as focus → Find available slot → Create calendar event → Show confirmation
- **Momentum Mode Integration**: Automatically schedules next focus task when current one is completed

#### Focus Task Calendar Event Cleanup
- **Issue**: Previous focus task's calendar event remained when changing focus
- **Fix**: Added automatic removal of previous focus task's calendar events
- **Implementation**: `getEventsForTask()` API + event deletion logic
- **Momentum Mode**: Automatically removes completed focus task events and schedules new ones

#### Enhanced API Methods
- **New Endpoints**:
  - `GET /api/calendar/events/task/:taskId`: Get events for specific task
  - Enhanced `getCalendarEventsFromDB()` with task filtering
- **Mobile API**: Added `getEventsForTask()` and improved error handling

#### Radial Menu Improvements
- **Touch Responsiveness**: Increased circle size (96px → 120px) and center button (72px → 90px)
- **Visual Feedback**: Added subtle scale animation for active quadrants
- **Conflict Prevention**: Improved angle detection to prevent cross-tap issues

#### Error Handling & UX
- **Proper API Error Handling**: Separated API failures from successful operations
- **Accurate Toast Messages**: Different messages for scheduling success/failure
- **Optimistic Updates**: Immediate UI updates for event deletion
- **Calendar Auto-Refresh**: Automatic refresh when navigating to calendar tab

---

This comprehensive overview covers the entire MindGarden codebase, highlighting the modular architecture, AI-first design, and mental health-focused features that make this platform unique.