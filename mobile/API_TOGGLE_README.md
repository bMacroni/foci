# API Toggle Feature

This feature allows you to easily switch between local and hosted backend endpoints in the mobile app.

## How to Use

1. **Access the Toggle**: The API toggle is available on both the Login and Signup screens
2. **Select Backend**: Tap on the "Backend:" dropdown to see available options:
   - **Local Development**: Points to `http://192.168.1.66:5000/api`
   - **Hosted (Railway)**: Points to `https://foci-production.up.railway.app/api`

## Configuration

The available backends are configured in `src/services/config.ts`:

```typescript
export const API_CONFIGS: Record<string, ApiConfig> = {
  local: {
    baseUrl: 'http://192.168.1.66:5000/api',
    name: 'Local Development',
    description: 'Local backend server'
  },
  hosted: {
    baseUrl: 'https://foci-production.up.railway.app/api',
    name: 'Hosted (Railway)',
    description: 'Production backend on Railway'
  }
};
```

## How It Works

1. **Configuration Service**: The `configService` manages the current API endpoint
2. **Persistent Storage**: Your selection is saved in AsyncStorage and persists between app sessions
3. **Dynamic Updates**: All API calls automatically use the selected endpoint
4. **Visual Feedback**: The toggle shows the current selection and allows easy switching

## Files Modified

- `src/services/config.ts` - Configuration service
- `src/components/common/ApiToggle.tsx` - Toggle component
- `src/screens/auth/LoginScreen.tsx` - Added toggle to login screen
- `src/screens/auth/SignupScreen.tsx` - Added toggle to signup screen
- `src/services/enhancedApi.ts` - Updated to use config service
- `src/services/auth.ts` - Updated to use config service
- `src/services/api.ts` - Updated to use config service
- `src/screens/ai/AIChatScreen.tsx` - Updated to use config service

## Adding New Backends

To add a new backend endpoint:

1. Add a new entry to `API_CONFIGS` in `src/services/config.ts`
2. The toggle will automatically include the new option

Example:
```typescript
staging: {
  baseUrl: 'https://your-staging-url.com/api',
  name: 'Staging Environment',
  description: 'Staging backend for testing'
}
```

## Notes

- The toggle is only visible on authentication screens for security
- All API calls throughout the app will use the selected endpoint
- The selection persists across app restarts
- Default is set to local development
