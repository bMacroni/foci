# Foci Mobile App 🎯

A React Native mobile application for the Foci goal and task management system.

## Features

### 🤖 AI-Powered Assistant
- Natural language conversation with AI
- Quick action buttons for common tasks
- Context-aware responses

### 🎯 Goal Management
- View and manage goals by category
- Progress tracking with visual indicators
- Goal status management (active, completed, archived)

### 📋 Task Management
- Create and manage tasks with priorities
- Link tasks to goals
- Task status tracking (not started, in progress, completed)

### 📅 Calendar Integration
- View Google Calendar events
- Calendar connection status
- Event details with time and location

### 🔐 Authentication
- Secure login and signup
- JWT token management with secure storage
- User profile management

## Tech Stack

- **React Native** with Expo
- **TypeScript** for type safety
- **React Navigation** for navigation
- **Expo Secure Store** for secure token storage
- **Axios** for API communication
- **Ionicons** for icons

## Getting Started

### Prerequisites

- Node.js (v18 or higher)
- npm or yarn
- Expo CLI (`npm install -g @expo/cli`)
- Expo Go app on your mobile device

### Installation

1. Install dependencies:
```bash
npm install
```

2. Create environment file:
```bash
echo "EXPO_PUBLIC_API_URL=http://localhost:5000/api" > .env
```

3. Start the development server:
```bash
npm start
```

4. Scan the QR code with Expo Go app on your mobile device

### Development

- **iOS Simulator**: Press `i` in the terminal
- **Android Emulator**: Press `a` in the terminal
- **Web**: Press `w` in the terminal

## Project Structure

```
src/
├── components/          # Reusable React components
├── contexts/           # React contexts (AuthContext)
├── navigation/         # Navigation configuration
├── screens/           # Screen components
├── services/          # API services
├── types/             # TypeScript type definitions
└── utils/             # Utility functions and theme
```

## API Integration

The mobile app connects to the same backend API as the web application:

- **Authentication**: Login, signup, and profile management
- **Goals**: CRUD operations for goals
- **Tasks**: CRUD operations for tasks
- **Calendar**: Google Calendar integration
- **AI**: Conversation and AI assistant features

## Design System

The app follows a minimal black and white design:

- **Primary Color**: Black (#000000)
- **Background**: White (#FFFFFF)
- **Surface**: Light gray (#F8F8F8)
- **Text**: Black (#000000)
- **Secondary Text**: Gray (#666666)

## Navigation

- **Bottom Tabs**: Goals, Tasks, Calendar, AI Assistant, Profile
- **Authentication Flow**: Login/Signup screens
- **Stack Navigation**: Detail screens and forms

## Security

- JWT tokens stored securely using Expo Secure Store
- Automatic token refresh and logout on authentication errors
- Secure API communication with HTTPS

## Testing

Run tests with:
```bash
npm test
```

## Building for Production

### iOS
```bash
eas build --platform ios
```

### Android
```bash
eas build --platform android
```

## Deployment

The app can be deployed using Expo Application Services (EAS):

1. Install EAS CLI:
```bash
npm install -g @expo/eas-cli
```

2. Configure EAS:
```bash
eas build:configure
```

3. Build for production:
```bash
eas build --platform all
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

This project is licensed under the ISC License. 