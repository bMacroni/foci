# Goal Hierarchy API Documentation

## Overview

The backend now supports creating goals with a complete hierarchy of milestones and steps in a single request. This allows for more structured goal planning and better user experience.

## Data Structure

### Goal with Milestones and Steps

```json
{
  "title": "Learn React Native",
  "description": "Master React Native development for mobile app creation",
  "target_completion_date": "2024-12-31",
  "category": "education",
  "milestones": [
    {
      "title": "Setup Development Environment",
      "order": 1,
      "steps": [
        {
          "text": "Install Node.js and npm",
          "order": 1,
          "completed": false
        },
        {
          "text": "Install React Native CLI",
          "order": 2,
          "completed": false
        }
      ]
    },
    {
      "title": "Learn Core Concepts",
      "order": 2,
      "steps": [
        {
          "text": "Understand React Native components",
          "order": 1,
          "completed": false
        }
      ]
    }
  ]
}
```

## API Endpoints

### Create Goal with Hierarchy

**POST** `/api/goals`

Creates a goal with optional milestones and steps in a single request.

**Request Body:**
- `title` (required): Goal title
- `description` (optional): Goal description
- `target_completion_date` (optional): Target completion date (YYYY-MM-DD)
- `category` (optional): Goal category
- `milestones` (optional): Array of milestone objects

**Milestone Object:**
- `title` (required): Milestone title
- `order` (optional): Milestone order (defaults to array index + 1)
- `steps` (optional): Array of step objects

**Step Object:**
- `text` (required): Step description
- `order` (optional): Step order (defaults to array index + 1)
- `completed` (optional): Completion status (defaults to false)

**Response:**
Returns the complete goal with all created milestones and steps.

### Get Goals with Hierarchy

**GET** `/api/goals`

Returns all goals for the authenticated user, including their milestones and steps.

**Response:**
```json
[
  {
    "id": "uuid",
    "title": "Learn React Native",
    "description": "Master React Native development",
    "milestones": [
      {
        "id": "uuid",
        "title": "Setup Development Environment",
        "order": 1,
        "steps": [
          {
            "id": "uuid",
            "text": "Install Node.js and npm",
            "order": 1,
            "completed": false
          }
        ]
      }
    ]
  }
]
```

### Get Single Goal with Hierarchy

**GET** `/api/goals/:id`

Returns a specific goal with its milestones and steps.

## Individual Milestone and Step Management

The existing endpoints for individual milestone and step management remain available:

### Milestones
- `POST /api/goals/:goalId/milestones` - Create milestone
- `GET /api/goals/:goalId/milestones` - Get all milestones for a goal
- `PUT /api/goals/milestones/:milestoneId` - Update milestone
- `DELETE /api/goals/milestones/:milestoneId` - Delete milestone

### Steps
- `POST /api/goals/milestones/:milestoneId/steps` - Create step
- `GET /api/goals/milestones/:milestoneId/steps` - Get all steps for a milestone
- `PUT /api/goals/steps/:stepId` - Update step
- `DELETE /api/goals/steps/:stepId` - Delete step

## AI Integration

The `createGoalFromAI` function has been updated to support creating goals with milestones and steps:

```javascript
// Example AI request
const result = await createGoalFromAI({
  title: "Learn React Native",
  description: "Master React Native development",
  due_date: "2024-12-31",
  priority: "high",
  milestones: [
    {
      title: "Setup Environment",
      steps: [
        { text: "Install Node.js", completed: false },
        { text: "Install React Native CLI", completed: false }
      ]
    }
  ]
}, userId, userContext);
```

## Database Schema

### Tables

1. **goals** - Main goal table
2. **milestones** - Milestones belonging to goals
3. **steps** - Steps belonging to milestones

### Relationships

```
goals (1) → (many) milestones (1) → (many) steps
```

### Key Fields

**goals:**
- `id` (UUID, Primary Key)
- `user_id` (UUID, Foreign Key to users)
- `title` (TEXT, Required)
- `description` (TEXT)
- `target_completion_date` (DATE)
- `category` (ENUM)
- `progress_percentage` (INTEGER)

**milestones:**
- `id` (UUID, Primary Key)
- `goal_id` (UUID, Foreign Key to goals)
- `title` (VARCHAR(255), Required)
- `order` (INTEGER, Required)
- `metadata` (JSONB)

**steps:**
- `id` (UUID, Primary Key)
- `milestone_id` (UUID, Foreign Key to milestones)
- `text` (VARCHAR(255), Required)
- `order` (INTEGER, Required)
- `completed` (BOOLEAN, Default: false)
- `metadata` (JSONB)

## Security

### Row Level Security (RLS)

All tables have RLS enabled with appropriate policies:

- Users can only access goals they own
- Users can only access milestones for goals they own
- Users can only access steps for milestones they own

### Authentication

All endpoints require authentication via JWT token in the Authorization header:

```
Authorization: Bearer <jwt_token>
```

## Error Handling

The API returns appropriate HTTP status codes and error messages:

- `400` - Bad Request (validation errors)
- `401` - Unauthorized (missing or invalid token)
- `404` - Not Found (goal/milestone/step not found)
- `500` - Internal Server Error

## Example Usage

### Creating a Goal with Milestones and Steps

```javascript
const response = await fetch('/api/goals', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  },
  body: JSON.stringify({
    title: 'Learn React Native',
    description: 'Master React Native development',
    target_completion_date: '2024-12-31',
    category: 'education',
    milestones: [
      {
        title: 'Setup Development Environment',
        order: 1,
        steps: [
          { text: 'Install Node.js and npm', order: 1, completed: false },
          { text: 'Install React Native CLI', order: 2, completed: false }
        ]
      }
    ]
  })
});

const goal = await response.json();
```

### Getting Goals with Hierarchy

```javascript
const response = await fetch('/api/goals', {
  headers: {
    'Authorization': `Bearer ${token}`
  }
});

const goals = await response.json();
```

## Migration Notes

If you're updating from a previous version:

1. Run the RLS policies migration: `SQL/milestones_steps_rls_policies.sql`
2. Ensure the `completed` field exists in the steps table (see `SQL/step_completed_migration.sql`)
3. The existing API endpoints remain backward compatible

## Testing

Run the test file to verify functionality:

```bash
cd mindgarden/backend
node test-goal-with-milestones.js
``` 