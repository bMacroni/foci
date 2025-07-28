# AI Goal Integration Feature

## Overview

This feature integrates AI-powered goal breakdown generation using the Gemini service. Users can now create goals with AI-generated milestones and steps, or manually create them.

## Changes Made

### Backend Changes

1. **New API Endpoint**: `POST /api/goals/generate-breakdown`
   - Location: `mindgarden/backend/src/controllers/goalsController.js`
   - Uses Gemini service to generate goal breakdowns
   - Returns structured milestones and steps

2. **Route Addition**: 
   - Location: `mindgarden/backend/src/routes/goals.js`
   - Added route for the new endpoint

### Mobile App Changes

1. **API Service**: `mindgarden/mobile/src/services/api.ts`
   - Added `generateBreakdown` function
   - Added goal creation and fetching functions

2. **GoalsScreen Updates**: `mindgarden/mobile/src/screens/goals/GoalsScreen.tsx`
   - Updated header to show both AI and Manual options
   - Integrated with AI breakdown generation
   - Enhanced UI with AI vs Manual choice

3. **GoalFormScreen Updates**: `mindgarden/mobile/src/screens/goals/GoalFormScreen.tsx`
   - Added AI vs Manual milestone creation options
   - Integrated with AI breakdown generation
   - Enhanced UI with prominent AI option

## Features

### AI-Powered Goal Creation
- Users can describe their goal and get AI-generated milestones and steps
- AI considers mental health aspects (small, achievable steps)
- Supports users with anxiety and depression

### Manual Goal Creation
- Users can still create goals manually
- Less prominent but still accessible option

### User Experience
- Clear choice between AI and Manual options
- AI option is more prominent (primary color)
- Manual option is secondary (surface color)
- Error handling with user-friendly messages

## Testing

### Backend Testing
```bash
# Navigate to backend directory
cd mindgarden/backend

# Start the server
npm start

# In another terminal, test the API
node test_goal_breakdown.js
```

### Mobile Testing
1. Start the mobile app
2. Navigate to Goals screen
3. Try both "AI Goal" and "Manual" buttons
4. Test AI breakdown generation
5. Test manual goal creation

## API Endpoints

### Generate Goal Breakdown
```
POST /api/goals/generate-breakdown
Content-Type: application/json
Authorization: Bearer <token>

Body:
{
  "title": "Goal title",
  "description": "Goal description (optional)"
}

Response:
{
  "milestones": [
    {
      "title": "Milestone title",
      "order": 1,
      "steps": [
        {
          "text": "Step description",
          "order": 1
        }
      ]
    }
  ]
}
```

## Configuration

### Environment Variables
Make sure these are set in your backend:
- `GOOGLE_AI_API_KEY`: Your Gemini API key
- `SUPABASE_URL`: Your Supabase URL
- `SUPABASE_ANON_KEY`: Your Supabase anon key

### Mobile API Configuration
Update the `API_BASE_URL` in `mindgarden/mobile/src/services/api.ts` to match your backend URL.

## Future Enhancements

1. **Enhanced AI Prompts**: More sophisticated goal analysis
2. **User Preferences**: Remember user's preferred creation method
3. **Goal Templates**: Pre-built goal templates for common goals
4. **Progress Tracking**: AI suggestions for goal progress
5. **Collaboration**: Share AI-generated goals with others

## Troubleshooting

### Common Issues

1. **API Connection Error**: Check backend server is running
2. **Authentication Error**: Verify JWT token is valid
3. **AI Generation Fails**: Check Gemini API key is set
4. **Mobile App Crashes**: Check API URL configuration

### Debug Steps

1. Check backend logs for errors
2. Verify environment variables are set
3. Test API endpoint directly with curl or Postman
4. Check mobile app console for network errors 