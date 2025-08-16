# Foci - AI-Powered Productivity Platform

Foci is an intelligent productivity platform designed to support users with ADHD by providing AI-assisted goal setting, task management, and calendar integration with advanced automatic scheduling capabilities.

## 🚀 Features

### Core Functionality
- **AI-Powered Goal Management**: Create and manage goals with AI suggestions and breakdown into milestones and steps
- **Smart Task Management**: Organize tasks with priority, status, and intelligent scheduling
- **Advanced Auto-Scheduling**: AI-powered automatic task scheduling with weather and travel time integration
- **Calendar Integration**: Sync with Google Calendar and manage events seamlessly
- **Natural Language Interface**: Chat with AI to create goals, tasks, and calendar events
- **Conversation Management**: Thread-based conversations with AI for better context retention
- **Notification System**: Comprehensive notification center with email and in-app notifications

### Auto-Scheduling Features
- **Weather-Aware Scheduling**: Outdoor tasks automatically scheduled based on weather conditions
- **Travel Time Integration**: Location-based tasks consider travel time from GraphHopper API
- **Recurring Task Support**: Automatic rescheduling of recurring tasks (daily, weekly, monthly)
- **User Preferences**: Customizable scheduling preferences (work hours, buffer time, max tasks per day)
- **Background Processing**: Automated daily and periodic scheduling runs
- **Conflict Resolution**: Intelligent handling of calendar conflicts and weather issues

### User Experience
- **Modern Minimal UI**: Clean black and white design for reduced cognitive load
- **Responsive Design**: Works seamlessly across desktop and mobile devices
- **Success Feedback**: Toast notifications for all user actions
- **Error Handling**: Graceful error handling with user-friendly messages
- **Loading States**: Smooth loading indicators throughout the app
- **Drag & Drop**: Intuitive drag-and-drop for calendar events and task management

## 📁 Project Structure

```
mindgarden/
├── 📁 backend/                          # Backend API server
│   ├── 📁 src/
│   │   ├── 📁 controllers/              # Business logic controllers
│   │   │   ├── autoSchedulingController.js    # Auto-scheduling logic (30KB)
│   │   │   ├── goalsController.js             # Goal management (24KB)
│   │   │   ├── tasksController.js             # Task management (21KB)
│   │   │   ├── conversationController.js      # AI conversation handling (14KB)
│   │   │   ├── milestonesController.js        # Milestone operations (4.2KB)
│   │   │   ├── stepsController.js             # Step operations (4.0KB)
│   │   │   ├── userController.js              # User management (1.3KB)
│   │   │   └── feedbackController.js          # Feedback handling (996B)
│   │   ├── 📁 routes/                   # API route definitions
│   │   │   ├── ai.js                    # AI chat endpoints (12KB)
│   │   │   ├── calendar.js              # Calendar integration (8.3KB)
│   │   │   ├── tasks.js                 # Task CRUD operations (2.7KB)
│   │   │   ├── goals.js                 # Goal CRUD operations (1.8KB)
│   │   │   ├── auth.js                  # Authentication (4.2KB)
│   │   │   ├── googleAuth.js            # Google OAuth (1.9KB)
│   │   │   ├── conversations.js         # Conversation threads (1.1KB)
│   │   │   └── user.js                  # User settings (402B)
│   │   ├── 📁 utils/                    # Utility services
│   │   │   ├── geminiService.js         # AI service integration (30KB)
│   │   │   ├── calendarService.js       # Calendar operations (21KB)
│   │   │   ├── geminiFunctionDeclarations.js # AI function definitions (20KB)
│   │   │   ├── weatherService.js        # Weather API integration (9.9KB)
│   │   │   ├── travelTimeService.js     # Travel time calculations (7.9KB)
│   │   │   ├── apiService.js            # External API utilities (6.8KB)
│   │   │   ├── dateParser.js            # Date parsing utilities (9.1KB)
│   │   │   ├── googleTokenStorage.js    # Google token management (2.1KB)
│   │   │   ├── syncService.js           # Calendar sync service (3.6KB)
│   │   │   ├── googleAuth.js            # Google auth utilities (351B)
│   │   │   └── jwtUtils.js              # JWT utilities (456B)
│   │   ├── 📁 services/                 # Business services
│   │   │   └── notificationService.js   # Email & in-app notifications (15KB)
│   │   ├── 📁 middleware/               # Express middleware
│   │   │   └── auth.js                  # Authentication middleware (539B)
│   │   └── server.js                    # Main server file (7.9KB)
│   ├── 📁 tests/                        # Backend test files
│   ├── package.json                     # Backend dependencies
│   ├── env.example                      # Environment variables template
│   ├── vitest.config.js                 # Test configuration
│   ├── GOAL_HIERARCHY_API.md           # Goal API documentation
│   └── SECURITY_FIXES.md               # Security documentation
│
├── 📁 frontend/                         # React frontend application
│   ├── 📁 src/
│   │   ├── 📁 components/               # React components
│   │   │   ├── AIChat.jsx               # AI chat interface (65KB)
│   │   │   ├── CalendarEvents.jsx       # Calendar management (53KB)
│   │   │   ├── GoalList.jsx             # Goal display & management (30KB)
│   │   │   ├── TaskList.jsx             # Task display & management (25KB)
│   │   │   ├── AutoScheduledTasksTable.jsx # Auto-scheduling table (18KB)
│   │   │   ├── AutoSchedulingDashboard.jsx # Auto-scheduling dashboard (16KB)
│   │   │   ├── TasksPage.jsx            # Tasks page component (16KB)
│   │   │   ├── TaskForm.jsx             # Task creation/editing (16KB)
│   │   │   ├── GoalForm.jsx             # Goal creation/editing (19KB)
│   │   │   ├── InlineTaskEditor.jsx     # Inline task editing (13KB)
│   │   │   ├── GoalBreakdownForm.jsx    # Goal breakdown assistant (11KB)
│   │   │   ├── Login.jsx                # Authentication UI (10KB)
│   │   │   ├── NotificationCenter.jsx   # Notification system (7.2KB)
│   │   │   ├── CalendarStatus.jsx       # Calendar sync status (6.9KB)
│   │   │   ├── MilestoneRow.jsx         # Milestone component (6.6KB)
│   │   │   ├── FeedbackModal.jsx        # Feedback modal (3.5KB)
│   │   │   ├── Signup.jsx               # Registration UI (3.8KB)
│   │   │   ├── SuccessToast.jsx         # Success notifications (2.6KB)
│   │   │   ├── GoalBreakdownAssistant.jsx # Goal breakdown helper (2.3KB)
│   │   │   ├── BulkApprovalPanel.jsx    # Bulk action panel (1.7KB)
│   │   │   ├── StepRow.jsx              # Step component (1.7KB)
│   │   │   └── SubTaskRow.jsx           # Sub-task component (1.1KB)
│   │   ├── 📁 services/                 # API service layer
│   │   │   └── api.js                   # API client & endpoints (8.1KB)
│   │   ├── 📁 contexts/                 # React contexts
│   │   │   ├── AuthContext.jsx          # Authentication context (4.7KB)
│   │   │   └── AIActionContext.jsx      # AI action context (1.1KB)
│   │   ├── 📁 utils/                    # Frontend utilities
│   │   │   └── timezones.js             # Timezone utilities (4.7KB)
│   │   ├── 📁 pages/                    # Page components
│   │   │   └── Dashboard.jsx            # Main dashboard (11KB)
│   │   ├── 📁 assets/                   # Static assets
│   │   ├── 📁 tests/                    # Frontend test files
│   │   ├── App.jsx                      # Main app component (1.7KB)
│   │   ├── App.css                      # App styles (3.6KB)
│   │   ├── index.css                    # Global styles (2.2KB)
│   │   └── main.jsx                     # App entry point (244B)
│   ├── package.json                     # Frontend dependencies
│   ├── vite.config.js                   # Vite configuration
│   ├── tailwind.config.js               # Tailwind CSS configuration
│   ├── postcss.config.js                # PostCSS configuration
│   ├── vitest.config.js                 # Test configuration
│   ├── vercel.json                      # Vercel deployment config
│   └── index.html                       # HTML template
│
├── 📁 SQL/                              # Database schema & migrations
│   ├── database_schema.sql              # Main database schema (9.9KB)
│   ├── automatic_task_scheduling_migration.sql # Auto-scheduling migration (7.2KB)
│   ├── notifications_table_migration.sql # Notifications migration (3.5KB)
│   ├── milestones_steps_rls_policies.sql # RLS policies (3.0KB)
│   ├── automatic_task_scheduling_rollback.sql # Rollback script (2.3KB)
│   ├── fix_dashboard_view.sql           # Dashboard view fix (1.2KB)
│   ├── step_completed_migration.sql     # Step completion migration (256B)
│   └── automatic_task_scheduling_database_docs.md # Database documentation (5.7KB)
│
├── 📁 documentation/                    # Project documentation
│   ├── AUTO_SCHEDULING_API.md          # Auto-scheduling API docs (6.2KB)
│   ├── api_endpoints.md                 # API endpoint documentation (5.9KB)
│   ├── DEPLOYMENT.md                    # Deployment guide (4.5KB)
│   ├── MVP_DEPLOYMENT_CHECKLIST.md     # MVP deployment checklist (3.3KB)
│   └── DEPLOYMENT_CHECKLIST.md         # General deployment checklist (1.5KB)
│
├── 📁 ServerUtilities/                  # Development utilities
│   ├── start-all-servers.ps1           # PowerShell server startup (3.1KB)
│   ├── setup-bugbot.ps1                # BugBot setup script (3.1KB)
│   └── start-all-servers.bat           # Batch server startup (1.4KB)
│
├── 📁 mobile/                           # React Native mobile app (in development)
│   ├── 📁 src/                          # Mobile app source
│   │   ├── 📁 components/               # Reusable React Native components
│   │   │   ├── 📁 common/               # Common UI components
│   │   │   │   ├── Button.tsx           # Custom button component (2.7KB)
│   │   │   │   ├── CustomTabBar.tsx     # Custom tab bar component (3.4KB)
│   │   │   │   ├── Input.tsx            # Custom input component (1004B)
│   │   │   │   ├── SuccessToast.tsx     # Success notification component (5.2KB)
│   │   │   │   ├── Loading.tsx          # Loading spinner component (0B)
│   │   │   │   ├── Card.tsx             # Card container component (0B)
│   │   │   │   └── index.ts             # Common components export (117B)
│   │   │   ├── 📁 ai/                   # AI-related components
│   │   │   │   ├── MessageBubble.tsx    # AI message display component (0B)
│   │   │   │   └── QuickActions.tsx     # AI quick action buttons (0B)
│   │   │   ├── 📁 goals/                # Goal-related components
│   │   │   │   ├── GoalsListModal.tsx   # Goals list modal component (12KB)
│   │   │   │   ├── GoalCard.tsx         # Goal card display component (0B)
│   │   │   │   └── GoalForm.tsx         # Goal form component (0B)
│   │   │   └── 📁 tasks/                # Task-related components
│   │   │       ├── TaskForm.tsx         # Task form component (27KB)
│   │   │       ├── TaskCard.tsx         # Task card display component (13KB)
│   │   │       ├── AutoSchedulingPreferencesModal.tsx # Auto-scheduling preferences (14KB)
│   │   │       └── 📁 __tests__/        # Task component tests
│   │   ├── 📁 screens/                  # Screen components
│   │   │   ├── 📁 auth/                 # Authentication screens
│   │   │   │   ├── LoginScreen.tsx      # Login screen (4.5KB)
│   │   │   │   └── SignupScreen.tsx     # Signup screen (5.0KB)
│   │   │   ├── 📁 ai/                   # AI chat screens
│   │   │   │   └── AIChatScreen.tsx     # AI chat interface (24KB)
│   │   │   ├── 📁 calendar/             # Calendar screens
│   │   │   │   └── CalendarScreen.tsx   # Calendar view screen (0B)
│   │   │   ├── 📁 goals/                # Goal management screens
│   │   │   │   ├── GoalsScreen.tsx      # Goals list screen (32KB)
│   │   │   │   ├── GoalDetailScreen.tsx # Goal detail view (16KB)
│   │   │   │   └── GoalFormScreen.tsx   # Goal creation/editing (18KB)
│   │   │   └── 📁 tasks/                # Task management screens
│   │   │       ├── TasksScreen.tsx      # Tasks list screen (18KB)
│   │   │       ├── TaskDetailScreen.tsx # Task detail view (9.8KB)
│   │   │       └── TaskFormScreen.tsx   # Task creation/editing (2.8KB)
│   │   ├── 📁 navigation/               # Navigation configuration
│   │   │   ├── AppNavigator.tsx         # Main app navigation (2.1KB)
│   │   │   ├── TabNavigator.tsx         # Tab navigation setup (1.8KB)
│   │   │   └── types.ts                 # Navigation type definitions (423B)
│   │   ├── 📁 services/                 # API and business services
│   │   │   ├── api.ts                   # API client and endpoints (18KB)
│   │   │   ├── auth.ts                  # Authentication service (12KB)
│   │   │   └── storage.ts               # Local storage service (0B)
│   │   ├── 📁 themes/                   # Design system and theming
│   │   │   ├── colors.ts                # Color palette definitions (628B)
│   │   │   ├── spacing.ts               # Spacing and layout constants (235B)
│   │   │   └── typography.ts            # Typography definitions (723B)
│   │   ├── 📁 types/                    # TypeScript type definitions
│   │   │   └── autoScheduling.ts        # Auto-scheduling type definitions (2.3KB)
│   │   └── 📁 utils/                    # Utility functions
│   │       ├── dateUtils.ts             # Date manipulation utilities (2.2KB)
│   │       └── validation.ts            # Form validation utilities (0B)
│   ├── package.json                     # Mobile dependencies
│   ├── App.tsx                          # Mobile app entry point
│   ├── README.md                        # Mobile app documentation
│   ├── MOBILE_TASK_MANAGEMENT.md       # Mobile task management docs
│   ├── app.json                         # Expo configuration
│   ├── babel.config.js                  # Babel configuration
│   ├── metro.config.js                  # Metro bundler config
│   ├── jest.config.js                   # Test configuration
│   ├── tsconfig.json                    # TypeScript configuration
│   ├── .eslintrc.js                     # ESLint configuration
│   ├── .prettierrc.js                   # Prettier configuration
│   ├── .watchmanconfig                  # Watchman configuration
│   ├── Gemfile                          # Ruby dependencies
│   ├── index.js                         # Mobile app entry point
│   ├── 📁 android/                      # Android configuration
│   ├── 📁 ios/                          # iOS configuration
│   └── 📁 __tests__/                    # Mobile test files
│
├── 📁 FeaturePRDs/                      # Product Requirements Documents
│   └── PRD_ Foci Mobile Calendar Page.md # Mobile calendar PRD (6.0KB)
│
├── 📁 .github/                          # GitHub configuration
├── 📁 .cursor/                          # Cursor IDE configuration
├── .cursorrules                         # Cursor IDE rules (2.1KB)
├── .gitignore                           # Git ignore rules (1.4KB)
└── README.md                            # This file (8.4KB)
```

## 🛠️ Tech Stack

### Frontend
- **React 18** with Vite for fast development
- **Tailwind CSS** for styling
- **React DnD** for drag-and-drop functionality
- **Axios** for API communication
- **React Router** for navigation
- **Date-fns** for date manipulation and timezone handling

### Backend
- **Node.js** with Express
- **Supabase** for database and authentication
- **Google AI (Gemini 2.5 Flash)** for intelligent features
- **Google OAuth** for calendar integration
- **Open-Meteo API** for weather data (free, no API key required)
- **GraphHopper API** for travel time calculations (1000 free requests/day)
- **Nodemailer** for email notifications
- **Node-cron** for background job scheduling

### Database Schema
- **Users**: Extended Supabase auth with timezone and preferences
- **Goals**: Hierarchical structure with milestones and steps
- **Tasks**: Comprehensive task management with auto-scheduling fields
- **Calendar Events**: Google Calendar integration tracking
- **Chat History**: AI conversation tracking with intent classification
- **Auto-Scheduling**: User preferences, scheduling history, and task scheduling preferences
- **Notifications**: Comprehensive notification system with read/unread tracking

### Infrastructure
- **Railway** for backend deployment
- **Vercel** for frontend deployment
- **Supabase** for database hosting

## 📋 Prerequisites

Before running this application, you'll need:

1. **Node.js** (v18 or higher)
2. **Supabase** account and project
3. **Google Cloud Console** project with:
   - OAuth 2.0 credentials
   - Google AI API key
4. **Railway** account (for backend deployment)
5. **Vercel** account (for frontend deployment)

## 🔧 Environment Variables

### Backend (.env)
```env
NODE_ENV=production
PORT=5000
SUPABASE_URL=your_supabase_url
SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
GOOGLE_AI_API_KEY=your_google_ai_api_key
CORS_ORIGIN=your_frontend_url
```

### Frontend (.env)
```env
VITE_API_URL=your_backend_url
VITE_GOOGLE_CLIENT_ID=your_google_client_id
```

## 🚀 Quick Start

### Local Development

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/foci.git
   cd foci
   ```

2. **Backend Setup**
   ```bash
   cd backend
   npm install
   cp env.example .env
   # Edit .env with your credentials
   npm run dev
   ```

3. **Frontend Setup**
   ```bash
   cd frontend
   npm install
   cp .env.example .env
   # Edit .env with your credentials
   npm run dev
   ```

### Database Setup

1. **Run the database schema** in your Supabase SQL Editor:
   ```sql
   -- Run the contents of SQL/database_schema.sql
   ```

2. **Apply auto-scheduling migration** (if not already included):
   ```sql
   -- Run the contents of SQL/automatic_task_scheduling_migration.sql
   ```

### Production Deployment

1. **Backend (Railway)**
   - Connect your GitHub repository to Railway
   - Set root directory to `backend`
   - Add all environment variables
   - Deploy

2. **Frontend (Vercel)**
   - Import your GitHub repository to Vercel
   - Set root directory to `frontend`
   - Framework preset: Vite
   - Add environment variables
   - Deploy

3. **Google OAuth Setup**
   - Update authorized origins with your Vercel domain
   - Update redirect URIs with your Vercel domain
   - Update OAuth app name to "Foci"

## 📱 Current Implementation Status

### ✅ Fully Implemented Features
- **User Authentication**: Complete Supabase auth integration
- **Goal Management**: Create, edit, delete goals with AI breakdown
- **Task Management**: Full CRUD operations with auto-scheduling
- **AI Chat Interface**: Natural language processing with Gemini 2.5 Flash
- **Calendar Integration**: Google Calendar sync with drag-and-drop
- **Auto-Scheduling System**: Complete implementation with weather and travel time
- **Notification System**: Email and in-app notifications
- **Conversation Threads**: Thread-based AI conversations
- **User Preferences**: Comprehensive scheduling preferences
- **Background Jobs**: Automated scheduling runs
- **Error Handling**: Comprehensive error handling and fallbacks

### 🔄 In Progress
- **Performance Optimization**: Ongoing optimization of auto-scheduling algorithms
- **Mobile Responsiveness**: Further mobile UI improvements
- **Testing**: Comprehensive API and frontend testing

### ⏳ Planned Features
- **Email Digest System**: Daily/weekly email summaries
- **Mobile App**: Native mobile application
- **Advanced Analytics**: User productivity insights
- **Team Collaboration**: Shared goals and tasks

## 🧪 Testing

### API Testing
```bash
cd backend
npm test
```

### Frontend Testing
```bash
cd frontend
npm test
```

### Auto-Scheduling Test
```bash
cd backend
npm run test:ai
```

## 📊 Architecture Highlights

### AI Integration
- **Gemini 2.5 Flash**: Latest Google AI model for natural language processing
- **Function Calling**: Structured API calls for goal, task, and calendar operations
- **Intent Classification**: Automatic classification of user requests
- **Conversation Context**: Thread-based conversation management

### Auto-Scheduling Intelligence
- **Weather Integration**: Real-time weather data from Open-Meteo API
- **Travel Time**: Actual travel calculations from GraphHopper API
- **Conflict Resolution**: Intelligent handling of scheduling conflicts
- **User Preferences**: Personalized scheduling based on user preferences
- **Recurring Tasks**: Automatic handling of daily, weekly, and monthly tasks

### Database Design
- **Row Level Security**: Comprehensive RLS policies for data protection
- **Indexing**: Optimized database indexes for performance
- **Triggers**: Automatic timestamp updates and user preference initialization
- **Views**: Dashboard views for analytics and reporting

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

For support, email support@foci.app or create an issue in this repository.

---

**Foci** - Empowering productivity through intelligent assistance. 

*Built with ❤️ for users managing anxiety and depression through structured productivity.* 
