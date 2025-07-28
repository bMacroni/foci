// Real API implementation for backend integration
// For Android emulator, use 10.0.2.2 instead of localhost
// For physical device, use your computer's IP address (e.g., 192.168.1.100)
const API_BASE_URL = 'http://192.168.1.66:5000/api'; // Backend runs on port 5000

interface GoalBreakdownRequest {
  title: string;
  description?: string;
}

interface Milestone {
  id: string;
  title: string;
  completed: boolean;
  order: number;
  steps: Array<{
    id: string;
    text: string;
    completed: boolean;
    order: number;
  }>;
}

interface GoalBreakdownResponse {
  milestones: Milestone[];
}

interface Goal {
  id: string;
  title: string;
  description: string;
  target_completion_date?: string;
  category?: string;
  completed?: boolean;
  created_at?: string;
  milestones?: Milestone[];
}

export const goalsAPI = {
  // Generate AI-powered goal breakdown using real backend
  generateBreakdown: async (data: GoalBreakdownRequest): Promise<GoalBreakdownResponse> => {
    try {
      const response = await fetch(`${API_BASE_URL}/goals/generate-breakdown`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${await getAuthToken()}`,
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error generating goal breakdown:', error);
      throw error;
    }
  },

  // Create a new goal using real backend
  createGoal: async (goalData: Goal): Promise<Goal> => {
    try {
      const response = await fetch(`${API_BASE_URL}/goals`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${await getAuthToken()}`,
        },
        body: JSON.stringify(goalData),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error creating goal:', error);
      throw error;
    }
  },

  // Get all goals for the user using real backend
  getGoals: async (): Promise<Goal[]> => {
    try {
      const token = await getAuthToken();
      
      const response = await fetch(`${API_BASE_URL}/goals`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('🔍 API: Error response body:', errorText);
        throw new Error(`HTTP error! status: ${response.status}, body: ${errorText}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('🔍 API: Error fetching goals:', error);
      throw error;
    }
  },

  // Get a single goal by ID with milestones and steps
  getGoalById: async (goalId: string): Promise<Goal> => {
    try {
      const token = await getAuthToken();
      const response = await fetch(`${API_BASE_URL}/goals/${goalId}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('🔍 API: Error response body:', errorText);
        throw new Error(`HTTP error! status: ${response.status}, body: ${errorText}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('🔍 API: Error fetching goal by ID:', error);
      throw error;
    }
  },

  // Update milestone completion status
  updateMilestone: async (milestoneId: string, updates: { completed?: boolean; title?: string }): Promise<void> => {
    try {
      const token = await getAuthToken();
      const response = await fetch(`${API_BASE_URL}/goals/milestones/${milestoneId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(updates),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`HTTP error! status: ${response.status}, body: ${errorText}`);
      }
    } catch (error) {
      console.error('🔍 API: Error updating milestone:', error);
      throw error;
    }
  },

  // Update step completion status
  updateStep: async (stepId: string, updates: { completed?: boolean; text?: string }): Promise<void> => {
    try {
      const token = await getAuthToken();
      const response = await fetch(`${API_BASE_URL}/goals/steps/${stepId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(updates),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`HTTP error! status: ${response.status}, body: ${errorText}`);
      }
    } catch (error) {
      console.error('🔍 API: Error updating step:', error);
      throw error;
    }
  },

  // Update an existing goal with all its data
  updateGoal: async (goalId: string, goalData: Partial<Goal>): Promise<Goal> => {
    try {
      const token = await getAuthToken();
      const response = await fetch(`${API_BASE_URL}/goals/${goalId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(goalData),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`HTTP error! status: ${response.status}, body: ${errorText}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('🔍 API: Error updating goal:', error);
      throw error;
    }
  },
};

// Helper function to get auth token from auth service
async function getAuthToken(): Promise<string> {
  const { authService } = await import('./auth');
  const token = await authService.getAuthToken();
  if (!token) {
    throw new Error('No authentication token available');
  }
  return token;
}
