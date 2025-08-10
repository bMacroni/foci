# Goal Titles API

This document describes the new Goal Titles API endpoint that allows frontends to retrieve only goal titles with optional filtering capabilities.

## API Endpoint

### GET /api/goals/titles

Returns a list of goal titles for the authenticated user with optional filtering.

#### Authentication
Requires a valid JWT token in the Authorization header:
```
Authorization: Bearer <your-jwt-token>
```

#### Query Parameters

All parameters are optional:

- `search` (string): Keyword to search for in goal titles (case-insensitive, partial match)
- `category` (string): Filter by goal category (e.g., "health", "career", "personal")
- `priority` (string): Filter by goal priority ("high", "medium", "low")
- `status` (string): Filter by goal status (e.g., "not_started", "in_progress", "completed")
- `due_date` (string): Filter by due date (YYYY-MM-DD format)

#### Response Format

**Success (200):**
```json
{
  "titles": ["Goal Title 1", "Goal Title 2", "Goal Title 3"]
}
```

**Error (400/500):**
```json
{
  "error": "Error message"
}
```

#### Example Requests

1. **Get all goal titles:**
   ```
   GET /api/goals/titles
   ```

2. **Search for goals with "fitness" in the title:**
   ```
   GET /api/goals/titles?search=fitness
   ```

3. **Get high priority health goals:**
   ```
   GET /api/goals/titles?category=health&priority=high
   ```

4. **Get in-progress goals due by end of year:**
   ```
   GET /api/goals/titles?status=in_progress&due_date=2024-12-31
   ```

5. **Complex filter - career goals with "learn" in title:**
   ```
   GET /api/goals/titles?search=learn&category=career
   ```

## Gemini AI Integration

The API is also available through the Gemini AI service using the `get_goal_titles` function. This allows users to make natural language requests like:

- "Show me my goal titles"
- "List my fitness goals"
- "What are my high priority goal titles?"
- "Show me goals related to health"

### Function Declaration

```javascript
{
  name: 'get_goal_titles',
  description: 'Returns only the titles of goals for the user, with optional filtering capabilities...',
  parameters: {
    type: Type.OBJECT,
    properties: {
      search: { type: Type.STRING, description: 'Keyword to search for in goal title...' },
      category: { type: Type.STRING, description: 'Goal category to filter by...' },
      priority: { type: Type.STRING, enum: ['high', 'medium', 'low'], description: 'Goal priority to filter by' },
      status: { type: Type.STRING, description: 'Goal status to filter by...' },
      due_date: { type: Type.STRING, description: 'Due date to filter by (YYYY-MM-DD)' }
    },
    required: []
  }
}
```

## Implementation Details

### Backend Functions

1. **`getGoalTitlesForUser(userId, token, args)`** - Core function that queries the database
2. **`getGoalTitles(req, res)`** - HTTP controller function
3. **`get_goal_titles`** - Gemini function declaration

### Database Query

The function performs a filtered query on the `goals` table:
- Selects only the `title` field for efficiency
- Applies filters based on provided arguments
- Orders by `created_at` descending
- Returns array of title strings

### Error Handling

- Returns error object if database query fails
- Returns empty array if no goals found
- Handles authentication errors through middleware

## Usage Examples

### Frontend JavaScript

```javascript
// Get all goal titles
const response = await fetch('/api/goals/titles', {
  headers: {
    'Authorization': `Bearer ${token}`
  }
});
const { titles } = await response.json();

// Get filtered goal titles
const response = await fetch('/api/goals/titles?search=fitness&category=health', {
  headers: {
    'Authorization': `Bearer ${token}`
  }
});
const { titles } = await response.json();
```

### Gemini AI Usage

Users can make natural language requests that will be processed through the Gemini AI service and return goal titles based on their criteria.

## Benefits

1. **Efficiency**: Returns only titles, reducing data transfer
2. **Flexibility**: Multiple filtering options
3. **AI Integration**: Works seamlessly with Gemini AI
4. **Frontend Friendly**: Simple JSON response format
5. **Performance**: Optimized database queries 