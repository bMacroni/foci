// Goals API
export const goalsAPI = {
  getAll: async () => {
    const { createClient } = await import('@supabase/supabase-js');
    const supabase = createClient(
      process.env.SUPABASE_URL, 
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );
    const { data, error } = await supabase
      .from('goals')
      .select('*')
      .order('created_at', { ascending: false });
    if (error) throw error;
    return { data };
  },

  create: async (goalData) => {
    const { createClient } = await import('@supabase/supabase-js');
    const supabase = createClient(
      process.env.SUPABASE_URL, 
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );
    const { data, error } = await supabase
      .from('goals')
      .insert(goalData)
      .select()
      .single();
    if (error) throw error;
    return { data };
  },

  update: async (id, goalData) => {
    const { createClient } = await import('@supabase/supabase-js');
    const supabase = createClient(
      process.env.SUPABASE_URL, 
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );
    const { data, error } = await supabase
      .from('goals')
      .update(goalData)
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    return { data };
  },

  delete: async (id) => {
    const { createClient } = await import('@supabase/supabase-js');
    const supabase = createClient(
      process.env.SUPABASE_URL, 
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );
    const { error } = await supabase
      .from('goals')
      .delete()
      .eq('id', id);
    if (error) throw error;
    return { success: true };
  }
};

// Tasks API
export const tasksAPI = {
  getAll: async () => {
    const { createClient } = await import('@supabase/supabase-js');
    const supabase = createClient(
      process.env.SUPABASE_URL, 
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );
    const { data, error } = await supabase
      .from('tasks')
      .select(`
        *,
        goals (
          id,
          title
        )
      `)
      .order('created_at', { ascending: false });
    if (error) throw error;
    return { data };
  },

  create: async (taskData) => {
    const { createClient } = await import('@supabase/supabase-js');
    const supabase = createClient(
      process.env.SUPABASE_URL, 
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );
    const { data, error } = await supabase
      .from('tasks')
      .insert(taskData)
      .select()
      .single();
    if (error) throw error;
    return { data };
  },

  update: async (id, taskData) => {
    const { createClient } = await import('@supabase/supabase-js');
    const supabase = createClient(
      process.env.SUPABASE_URL, 
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );
    const { data, error } = await supabase
      .from('tasks')
      .update(taskData)
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    return { data };
  },

  delete: async (id) => {
    const { createClient } = await import('@supabase/supabase-js');
    const supabase = createClient(
      process.env.SUPABASE_URL, 
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );
    const { error } = await supabase
      .from('tasks')
      .delete()
      .eq('id', id);
    if (error) throw error;
    return { success: true };
  }
};

// Calendar API
export const calendarAPI = {
  getEvents: async (maxResults = 10) => {
    try {
      const response = await fetch(`http://localhost:5000/api/calendar/events?maxResults=${maxResults}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.JWT_TOKEN || 'mock-token'}`
        }
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      return { data };
    } catch (error) {
      console.error('Error fetching calendar events:', error);
      // Return mock data as fallback
      return { 
        data: [
          {
            id: 'mock-event-1',
            summary: 'Sample Event',
            description: 'This is a sample event',
            start: { dateTime: new Date().toISOString() },
            end: { dateTime: new Date(Date.now() + 3600000).toISOString() }
          }
        ]
      };
    }
  },

  createEvent: async (eventData) => {
    try {
      const response = await fetch('http://localhost:5000/api/calendar/events', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.JWT_TOKEN || 'mock-token'}`
        },
        body: JSON.stringify({
          summary: eventData.summary,
          description: eventData.description,
          startTime: eventData.startTime,
          endTime: eventData.endTime,
          timeZone: 'America/Chicago' // Default to CST
        })
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      return { data };
    } catch (error) {
      console.error('Error creating calendar event:', error);
      throw error;
    }
  },

  updateEvent: async (eventId, eventData) => {
    try {
      const response = await fetch(`http://localhost:5000/api/calendar/events/${eventId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.JWT_TOKEN || 'mock-token'}`
        },
        body: JSON.stringify({
          summary: eventData.summary,
          description: eventData.description,
          startTime: eventData.startTime,
          endTime: eventData.endTime,
          timeZone: 'America/Chicago'
        })
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      return { data };
    } catch (error) {
      console.error('Error updating calendar event:', error);
      throw error;
    }
  },

  deleteEvent: async (eventId) => {
    try {
      const response = await fetch(`http://localhost:5000/api/calendar/events/${eventId}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.JWT_TOKEN || 'mock-token'}`
        }
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      return { success: true };
    } catch (error) {
      console.error('Error deleting calendar event:', error);
      throw error;
    }
  }
}; 