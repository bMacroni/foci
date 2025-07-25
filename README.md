# Foci - AI-Powered Mental Health Productivity Platform

Foci is an intelligent productivity platform designed to support users with anxiety and depression by providing AI-assisted goal setting, task management, and calendar integration.

## 🚀 Features

### Core Functionality
- **AI-Powered Goal Management**: Create and manage goals with AI suggestions and breakdown
- **Smart Task Management**: Organize tasks with priority, status, and intelligent scheduling
- **Calendar Integration**: Sync with Google Calendar and manage events seamlessly
- **Natural Language Interface**: Chat with AI to create goals, tasks, and calendar events
- **Auto-Scheduling**: AI-powered task scheduling based on preferences and availability

### User Experience
- **Modern Minimal UI**: Clean black and white design for reduced cognitive load
- **Responsive Design**: Works seamlessly across desktop and mobile devices
- **Success Feedback**: Toast notifications for all user actions
- **Error Handling**: Graceful error handling with user-friendly messages
- **Loading States**: Smooth loading indicators throughout the app

## 🛠️ Tech Stack

### Frontend
- **React** with Vite for fast development
- **Tailwind CSS** for styling
- **React DnD** for drag-and-drop functionality
- **Axios** for API communication

### Backend
- **Node.js** with Express
- **Supabase** for database and authentication
- **Google AI (Gemini)** for intelligent features
- **Google OAuth** for calendar integration

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

## 📱 User Testing

This version is ready for user testing with the following features:

### What Works
- ✅ User registration and authentication
- ✅ Goal creation, editing, and deletion
- ✅ Task management with auto-scheduling
- ✅ AI chat interface for natural language commands
- ✅ Google Calendar integration
- ✅ Modern, responsive UI
- ✅ Error handling and success feedback

### Known Limitations
- 📧 Email digest system not yet implemented
- 📱 Mobile app not yet available
- 🔧 Some advanced features still in development

### Testing Instructions
1. Share the deployed URL with test users
2. Ask users to create goals and tasks
3. Test the AI chat functionality
4. Verify calendar integration works
5. Collect feedback on UI/UX

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