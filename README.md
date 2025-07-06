# Foci 🎯

An AI-powered goal and task management system with Google Calendar integration and daily email digests.

## Features

- **Goal Management**: Set and track long-term goals with progress tracking
- **Task Management**: Create and manage short-term tasks with priority, duration, and status
- **AI Chat Interface**: Natural language input for creating and managing goals/tasks
- **Google Calendar Integration**: Two-way sync with Google Calendar
- **Daily Email Digest**: Receive daily summaries at 7:00 AM CST
- **Cross-Platform**: Web, iOS, and Android support

## Tech Stack

### Frontend
- **React 18** with Vite
- **Tailwind CSS** for styling
- **React Router** for navigation
- **Axios** for API calls
- **Google OAuth** for authentication

### Backend
- **Node.js** with Express.js
- **Supabase** for database and authentication
- **Google Calendar API** for calendar integration
- **SendGrid** for email delivery

## Project Structure

```
Foci/
├── frontend/          # React application
│   ├── src/
│   │   ├── components/    # Reusable React components
│   │   ├── pages/         # Page components
│   │   ├── App.jsx        # Main app component
│   │   └── main.jsx       # Entry point
│   ├── package.json
│   └── vite.config.js
├── backend/           # Express.js API server
│   ├── src/
│   │   ├── routes/        # API routes
│   │   ├── controllers/   # Route handlers
│   │   ├── middleware/    # Custom middleware
│   │   └── server.js      # Main server file
│   ├── package.json
│   └── env.example        # Environment variables template
└── README.md
```

## Getting Started

### Prerequisites

- Node.js (v18 or higher)
- npm or yarn
- Supabase account
- Google Cloud Console account (for Calendar API)

### Backend Setup

1. **Navigate to backend directory:**
   ```bash
   cd backend
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Set up environment variables:**
   ```bash
   cp env.example .env
   ```
   Edit `.env` with your actual credentials.

4. **Start the development server:**
   ```bash
   npm run dev
   ```

The backend will run on `http://localhost:5000`

### Frontend Setup

1. **Navigate to frontend directory:**
   ```bash
   cd frontend
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Start the development server:**
   ```bash
   npm run dev
   ```

The frontend will run on `http://localhost:3000`

## API Endpoints

- `GET /api/health` - Health check
- `GET /api` - API information
- `GET /api/goals` - Get all goals
- `POST /api/goals` - Create a new goal
- `GET /api/tasks` - Get all tasks
- `POST /api/tasks` - Create a new task

## Development Roadmap

### Phase 1 (0-3 months)
- [x] Project scaffolding
- [ ] User authentication
- [ ] Basic goal/task CRUD operations
- [ ] Basic UI components

### Phase 2 (3-6 months)
- [ ] Google Calendar integration
- [ ] AI chat interface
- [ ] Advanced UI/UX

### Phase 3 (6-9 months)
- [ ] Daily email digest
- [ ] Performance optimization
- [ ] Mobile app development

### Phase 4 (9-12 months)
- [ ] Testing and bug fixes
- [ ] Production deployment
- [ ] Launch

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

This project is licensed under the ISC License.

## Support

For support, email support@foci.app or create an issue in this repository. 