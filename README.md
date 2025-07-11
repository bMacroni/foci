# Foci 🎯

An AI-powered goal and task management system with Google Calendar integration and intelligent conversation capabilities.

## ✨ Features

### 🤖 AI-Powered Assistant
- **Natural Language Processing**: Chat with AI using everyday language
- **Smart Intent Recognition**: Automatically detects and processes requests
- **Conversation Memory**: AI remembers context from previous interactions
- **Goal & Task Creation**: "Add a goal to learn React" or "Create a task to review documents"
- **Calendar Management**: "Schedule a meeting tomorrow at 2pm"
- **Productivity Insights**: Get personalized advice and suggestions
- **Advanced Function Calling**: Structured AI operations with Gemini function calling API
- **Multi-step Operations**: Complex requests handled through lookup → action workflows
- **Context Awareness**: AI maintains conversation history and user preferences

### 🎯 Goal Management
- Create and track long-term goals with progress tracking
- Categorize goals (career, health, personal, education, finance, relationships)
- Set target completion dates and monitor progress
- Link tasks to specific goals for better organization

### 📋 Task Management
- Create tasks with priorities, estimated duration, and due dates
- Link tasks to goals for better context
- Track task status (not started, in progress, completed)
- Add categories and tags for organization

### 📅 Calendar Integration
- **Google Calendar Sync**: Two-way integration with your Google Calendar
- **Smart Event Creation**: AI helps schedule events with natural language
- **Event Management**: View, edit, and delete calendar events
- **Recurring Events**: Support for recurring calendar events

### 🔐 Authentication & Security
- **Google OAuth**: Secure authentication with Google accounts
- **JWT Tokens**: Secure session management
- **Row Level Security**: Database-level security with Supabase
- **User Profiles**: Manage personal settings and preferences

### 💬 Conversation Management
- **Threaded Conversations**: Organize AI chats into conversation threads
- **Persistent History**: Save and retrieve previous conversations
- **Context Awareness**: AI maintains context across conversation sessions

## 🛠 Tech Stack

### Testing
- **Vitest** for fast unit and integration testing
- **Comprehensive test coverage** for API endpoints and React components
- **Mock testing** for external services (Google APIs, Supabase)
- **End-to-end testing** for critical user workflows

### Frontend
- **React 18** with Vite for fast development
- **Tailwind CSS** for modern, responsive styling
- **React Router** for navigation
- **Axios** for API communication
- **Google OAuth** for authentication
- **Vitest** for component testing

### Backend
- **Node.js** with Express.js
- **Supabase** for database and authentication
- **Google Calendar API** for calendar integration
- **Google Gemini AI** (2.5 Flash) for intelligent conversations with function calling
- **JWT** for secure authentication
- **Vitest** for comprehensive testing

### Database (Supabase)
- **PostgreSQL** with Row Level Security
- **Real-time subscriptions** for live updates
- **Built-in authentication** with Google OAuth
- **Automatic backups** and scaling

## 📁 Project Structure

```
foci/
├── frontend/                 # React application
│   ├── src/
│   │   ├── components/       # Reusable React components
│   │   │   ├── AIChat.jsx    # AI conversation interface
│   │   │   ├── GoalForm.jsx  # Goal creation/editing
│   │   │   ├── GoalList.jsx  # Goals display
│   │   │   ├── TaskForm.jsx  # Task creation/editing
│   │   │   ├── TaskList.jsx  # Tasks display
│   │   │   ├── CalendarEvents.jsx # Calendar integration
│   │   │   └── CalendarStatus.jsx # Calendar connection status
│   │   ├── pages/
│   │   │   └── Dashboard.jsx # Main application dashboard
│   │   ├── contexts/
│   │   │   └── AuthContext.jsx # Authentication state management
│   │   ├── services/
│   │   │   └── api.js        # API service layer
│   │   └── App.jsx           # Main app component
│   ├── package.json
│   └── vite.config.js
├── backend/                  # Express.js API server
│   ├── src/
│   │   ├── routes/           # API route handlers
│   │   │   ├── ai.js         # AI conversation endpoints
│   │   │   ├── goals.js      # Goal management endpoints
│   │   │   ├── tasks.js      # Task management endpoints
│   │   │   ├── calendar.js   # Calendar integration endpoints
│   │   │   ├── conversations.js # Conversation thread management
│   │   │   ├── auth.js       # Authentication endpoints
│   │   │   └── googleAuth.js # Google OAuth endpoints
│   │   ├── controllers/      # Business logic handlers
│   │   ├── middleware/       # Custom middleware (auth, etc.)
│   │   ├── utils/            # Utility services
│   │   │   ├── geminiService.js # Google Gemini AI integration
│   │   │   ├── geminiFunctionDeclarations.js # AI function definitions
│   │   │   ├── calendarService.js # Google Calendar integration
│   │   │   ├── dateParser.js # Date parsing utilities
│   │   │   └── apiService.js # Internal API service layer
│   │   └── server.js         # Main server file
│   ├── package.json
│   └── env.example           # Environment variables template
├── database_schema.sql       # Complete database schema
├── DEPLOYMENT.md             # Deployment guide
├── MVP_DEPLOYMENT_CHECKLIST.md # Deployment checklist
└── README.md
```

## 🚀 Current Status

### ✅ Recently Completed (Q4 2024)
- **Gemini Function Calling**: Implemented advanced AI capabilities using Google's function calling API
- **Comprehensive Testing**: Added Vitest testing infrastructure for both backend and frontend
- **Enhanced UI/UX**: Improved error handling, loading states, and responsive design
- **Production Ready**: MVP is polished and ready for deployment
- **Advanced AI Features**: Multi-step operations, context awareness, and structured function execution

### 🎯 Ready for Deployment
The application is now production-ready with:
- Complete user authentication system
- Full CRUD operations for goals and tasks
- Advanced AI conversation interface
- Google Calendar integration
- Comprehensive error handling and user feedback
- Responsive design for all devices
- Extensive testing coverage

## 🚀 Getting Started

### Prerequisites

- Node.js (v18 or higher)
- npm or yarn
- Supabase account (free tier)
- Google Cloud Console account (for Calendar API)
- Google AI Studio account (for Gemini API)

### 1. Backend Setup

```bash
cd backend
npm install
cp env.example .env
```

Configure your `.env` file with:
```env
NODE_ENV=development
PORT=5000
SUPABASE_URL=your_supabase_url
SUPABASE_ANON_KEY=your_supabase_anon_key
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
GOOGLE_AI_API_KEY=your_gemini_api_key
GOOGLE_REDIRECT_URI=http://localhost:3000
CORS_ORIGIN=http://localhost:3000
```

Start the backend:
```bash
npm run dev
```

### 2. Frontend Setup

```bash
cd frontend
npm install
```

Create `.env` file:
```env
VITE_API_URL=http://localhost:5000/api
VITE_GOOGLE_CLIENT_ID=your_google_client_id
```

Start the frontend:
```bash
npm run dev
```

### 3. Database Setup

1. Create a new Supabase project
2. Run the SQL from `database_schema.sql` in your Supabase SQL Editor
3. Configure Row Level Security policies
4. Set up Google OAuth in Supabase Auth settings

### 4. Google API Setup

1. **Google Cloud Console**:
   - Enable Google Calendar API
   - Create OAuth 2.0 credentials
   - Add authorized origins and redirect URIs

2. **Google AI Studio**:
   - Get your Gemini API key
   - Add it to your backend `.env` file

## 🎯 Core Features in Detail

### AI Conversation Interface
- **Natural Language Processing**: "Add a goal to learn React" → Creates a goal
- **Smart Classification**: Automatically detects intent (create, update, delete, query)
- **Context Awareness**: Remembers previous conversation context
- **Multi-step Operations**: Handle complex requests with follow-up questions
- **Advanced Function Calling**: Uses Gemini's function calling API for structured operations
- **Lookup → Action Workflows**: Automatically finds existing items before updating/deleting
- **Conversation Threading**: Organize conversations into persistent threads

### Goal Management
- **Categories**: career, health, personal, education, finance, relationships
- **Progress Tracking**: Visual progress indicators
- **Target Dates**: Set and track completion targets
- **Status Management**: Active, completed, archived goals

### Task Management
- **Priority Levels**: low, medium, high
- **Duration Estimation**: Track time estimates
- **Goal Linking**: Connect tasks to specific goals
- **Status Tracking**: not_started, in_progress, completed

### Calendar Integration
- **Google Calendar Sync**: Real-time two-way synchronization
- **Event Creation**: Natural language event scheduling
- **Recurring Events**: Support for RRULE patterns
- **Location Support**: Add locations to events

## 🔧 API Endpoints

### Authentication
- `POST /api/auth/login` - User login
- `POST /api/auth/google` - Google OAuth
- `GET /api/auth/profile` - Get user profile

### Goals
- `GET /api/goals` - Get all goals
- `POST /api/goals` - Create goal
- `PUT /api/goals/:id` - Update goal
- `DELETE /api/goals/:id` - Delete goal

### Tasks
- `GET /api/tasks` - Get all tasks
- `POST /api/tasks` - Create task
- `PUT /api/tasks/:id` - Update task
- `DELETE /api/tasks/:id` - Delete task

### AI & Conversations
- `POST /api/ai/chat` - Send message to AI (with Gemini function calling)
- `GET /api/conversations/threads` - Get conversation threads
- `POST /api/conversations/threads` - Create new thread
- `GET /api/conversations/threads/:id` - Get thread messages
- `DELETE /api/conversations/threads/:id` - Delete conversation thread

### Calendar
- `GET /api/calendar/events` - Get calendar events
- `POST /api/calendar/events` - Create calendar event
- `PUT /api/calendar/events/:id` - Update event
- `DELETE /api/calendar/events/:id` - Delete event

## 🚀 Deployment

See [DEPLOYMENT.md](DEPLOYMENT.md) for detailed deployment instructions using:
- **Frontend**: Vercel (Free)
- **Backend**: Railway or Render (Free tier)
- **Database**: Supabase (Free tier)

## 🎨 Design Philosophy

- **Minimal & Clean**: Black and white design for focus
- **AI-First**: Natural language interface as primary interaction method
- **Contextual**: AI understands your goals and tasks
- **Integrated**: Seamless connection between goals, tasks, and calendar
- **Responsive**: Works on desktop, tablet, and mobile

## 🔮 Roadmap

### Phase 1: Core Features ✅
- [x] User authentication with Google OAuth
- [x] Goal and task management
- [x] AI conversation interface
- [x] Google Calendar integration
- [x] Conversation threading
- [x] Gemini function calling implementation
- [x] Comprehensive testing infrastructure (Vitest)
- [x] Modern black/white minimal UI
- [x] Responsive design for all screen sizes
- [x] Error handling and success notifications
- [x] Empty states and loading indicators

### Phase 2: Enhanced AI ✅ (Recently Completed)
- [x] Advanced natural language understanding with Gemini function calling
- [x] Structured function declarations for all CRUD operations
- [x] Multi-step function execution (lookup → action)
- [x] Context-aware conversation memory
- [x] Smart intent recognition and classification
- [x] Comprehensive API testing with Vitest
- [x] Frontend component testing

### Phase 3: Mobile & Advanced Features (In Progress)
- [ ] React Native mobile app development
- [ ] Daily email digests
- [ ] Team collaboration features
- [ ] Advanced calendar features
- [ ] Productivity insights and analytics
- [ ] Smart task prioritization
- [ ] Goal achievement predictions

### Phase 4: Enterprise Features (Planned)
- [ ] Team management
- [ ] Advanced analytics dashboard
- [ ] API for third-party integrations
- [ ] White-label solutions
- [ ] Advanced reporting and insights
- [ ] Custom integrations marketplace

### Phase 5: AI Enhancement & Scale (Future)
- [ ] Advanced productivity insights
- [ ] Predictive goal completion
- [ ] Smart scheduling optimization
- [ ] Natural language goal breakdown
- [ ] AI-powered productivity coaching
- [ ] Integration with external productivity tools

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the ISC License.

## 🆘 Support

- **Documentation**: Check the deployment guide and API documentation
- **Issues**: Create an issue in this repository
- **Email**: support@foci.app (coming soon)

## 🙏 Acknowledgments

- **Google Gemini AI** for intelligent conversation capabilities
- **Supabase** for the excellent backend-as-a-service platform
- **Vercel** for seamless frontend deployment
- **Tailwind CSS** for the beautiful utility-first CSS framework

---

**Built with ❤️ for productivity enthusiasts who want to focus on what matters most.** 