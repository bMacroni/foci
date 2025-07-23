import { createClient } from '@supabase/supabase-js';

// Auto-scheduling service functions

export async function checkWeatherConditions(location, date) {
  // TODO: Integrate with weather API (OpenWeatherMap, WeatherAPI, etc.)
  // This is a placeholder implementation
  console.log(`Checking weather for ${location} on ${date}`);
  
  // Mock weather data for now
  return {
    temperature: 72,
    condition: 'sunny',
    precipitation_chance: 0.1,
    suitable_for_outdoor: true
  };
}

export async function calculateTravelTime(origin, destination, mode = 'driving') {
  // TODO: Integrate with Google Maps API or similar
  // This is a placeholder implementation
  console.log(`Calculating travel time from ${origin} to ${destination} via ${mode}`);
  
  // Mock travel time data for now
  return {
    duration_minutes: 25,
    distance_miles: 8.5,
    mode: mode
  };
}

export async function findAvailableTimeSlots(userId, taskDuration, preferredWindows, workDays, token) {
  const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY, {
    global: {
      headers: {
        Authorization: `Bearer ${token}`
      }
    }
  });

  // Get user's calendar events for the next 7 days
  const startDate = new Date();
  const endDate = new Date();
  endDate.setDate(endDate.getDate() + 7);

  let calendarEvents = [];
  try {
    const { data: events, error } = await supabase
      .from('calendar_events')
      .select('start_time, end_time')
      .eq('user_id', userId)
      .gte('start_time', startDate.toISOString())
      .lte('start_time', endDate.toISOString())
      .order('start_time');

    if (error) {
      console.log('Error fetching calendar events (table might not exist):', error);
      // Continue with empty calendar events
    } else {
      calendarEvents = events || [];
    }
  } catch (err) {
    console.log('Calendar events table might not exist, continuing with empty calendar');
  }

  // TODO: Implement actual time slot finding logic
  // This would analyze calendar events and find available slots
  // that match the preferred windows and work days

  return [
    {
      start_time: new Date(Date.now() + 24 * 60 * 60 * 1000), // Tomorrow
      end_time: new Date(Date.now() + 24 * 60 * 60 * 1000 + taskDuration * 60 * 1000),
      duration_minutes: taskDuration
    }
  ];
}

export async function createCalendarEvent(userId, task, scheduledTime, token) {
  const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY, {
    global: {
      headers: {
        Authorization: `Bearer ${token}`
      }
    }
  });

  const endTime = new Date(scheduledTime);
  endTime.setMinutes(endTime.getMinutes() + (task.estimated_duration_minutes || 60));

  console.log('Creating calendar event for task:', task.title, 'at:', scheduledTime.toISOString());
  
  const { data, error } = await supabase
    .from('calendar_events')
    .insert([{
      user_id: userId,
      task_id: task.id,
      title: task.title,
      description: task.description,
      start_time: scheduledTime.toISOString(),
      end_time: endTime.toISOString(),
      location: task.location
    }])
    .select()
    .single();

  if (error) {
    console.log('Error creating calendar event:', error);
    return null;
  }

  console.log('Successfully created calendar event:', data);
  return data;
}

export async function updateTaskSchedulingHistory(userId, taskId, scheduledTime, weatherData, travelTime, calendarEventId, reason, token) {
  const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY, {
    global: {
      headers: {
        Authorization: `Bearer ${token}`
      }
    }
  });

  const { data, error } = await supabase
    .from('task_scheduling_history')
    .insert([{
      user_id: userId,
      task_id: taskId,
      scheduled_date: scheduledTime.toISOString(),
      weather_conditions: weatherData,
      travel_time_minutes: travelTime,
      calendar_event_id: calendarEventId,
      scheduling_reason: reason
    }])
    .select()
    .single();

  if (error) {
    console.log('Error updating scheduling history:', error);
    return null;
  }

  return data;
}

export async function processRecurringTask(task, token) {
  const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY, {
    global: {
      headers: {
        Authorization: `Bearer ${token}`
      }
    }
  });

  if (!task.recurrence_pattern) {
    return null;
  }

  const pattern = task.recurrence_pattern;
  const now = new Date();
  let nextScheduledDate = new Date();

  // Calculate next occurrence based on recurrence pattern
  switch (pattern.type) {
    case 'daily':
      nextScheduledDate.setDate(now.getDate() + (pattern.interval || 1));
      break;
    case 'weekly':
      nextScheduledDate.setDate(now.getDate() + 7 * (pattern.interval || 1));
      break;
    case 'monthly':
      nextScheduledDate.setMonth(now.getMonth() + (pattern.interval || 1));
      break;
    default:
      return null;
  }

  // Update task with new due date and reset status
  const { data, error } = await supabase
    .from('tasks')
    .update({
      due_date: nextScheduledDate.toISOString(),
      status: 'not_started',
      last_scheduled_date: now.toISOString()
    })
    .eq('id', task.id)
    .select()
    .single();

  if (error) {
    console.log('Error updating recurring task:', error);
    return null;
  }

  return data;
}

export async function autoScheduleTasks(userId, token) {
  const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY, {
    global: {
      headers: {
        Authorization: `Bearer ${token}`
      }
    }
  });

  // Get user scheduling preferences
  let { data: preferences, error: prefsError } = await supabase
    .from('user_scheduling_preferences')
    .select('*')
    .eq('user_id', userId)
    .single();

  // If user preferences don't exist, create default ones
  if (prefsError && prefsError.code === 'PGRST116') {
    console.log('User preferences not found, creating default preferences');
    const { data: newPrefs, error: createError } = await supabase
      .from('user_scheduling_preferences')
      .insert([{
        user_id: userId,
        preferred_start_time: '09:00:00',
        preferred_end_time: '17:00:00',
        work_days: [1, 2, 3, 4, 5],
        max_tasks_per_day: 5,
        buffer_time_minutes: 15,
        weather_check_enabled: true,
        travel_time_enabled: true,
        auto_scheduling_enabled: true
      }])
      .select()
      .single();

    if (createError) {
      console.log('Error creating user preferences:', createError);
      return { error: 'Failed to create user preferences' };
    }
    preferences = newPrefs;
  } else if (prefsError) {
    console.log('Error fetching user preferences:', prefsError);
    return { error: 'Failed to fetch user preferences' };
  }

  if (!preferences.auto_scheduling_enabled) {
    return { message: 'Auto-scheduling is disabled for this user' };
  }

  // Get all tasks that need auto-scheduling
  const { data: tasks, error: tasksError } = await supabase
    .from('tasks')
    .select('*')
    .eq('user_id', userId)
    .eq('auto_schedule_enabled', true)
    .neq('status', 'completed')
    .order('priority', { ascending: false });

  if (tasksError) {
    console.log('Error fetching tasks:', tasksError);
    return { error: 'Failed to fetch tasks' };
  }

  const results = [];

  console.log(`Processing ${tasks.length} tasks for auto-scheduling`);
  
  for (const task of tasks) {
    console.log(`Processing task: ${task.title} (ID: ${task.id})`);
    try {
      // Check if task is weather dependent
      let weatherData = null;
      if (task.weather_dependent && task.location) {
        weatherData = await checkWeatherConditions(task.location, new Date());
        
        // Skip scheduling if weather is not suitable
        if (!weatherData.suitable_for_outdoor) {
          results.push({
            task_id: task.id,
            task_title: task.title,
            status: 'skipped',
            reason: 'Weather not suitable for outdoor task'
          });
          continue;
        }
      }

      // Calculate travel time if location is specified
      let travelTime = 0;
      if (task.location) {
        const travelData = await calculateTravelTime('current_location', task.location);
        travelTime = travelData.duration_minutes;
      }

      // Find available time slots
      const timeSlots = await findAvailableTimeSlots(
        userId,
        (task.estimated_duration_minutes || 60) + travelTime,
        task.preferred_time_windows,
        preferences.work_days,
        token
      );

      if (timeSlots.length === 0) {
        results.push({
          task_id: task.id,
          task_title: task.title,
          status: 'failed',
          reason: 'No available time slots found'
        });
        continue;
      }

      // Schedule the task in the first available slot
      const scheduledTime = timeSlots[0].start_time;
      
      // Create calendar event (optional - continue even if it fails)
      let calendarEvent = null;
      try {
        calendarEvent = await createCalendarEvent(userId, task, scheduledTime, token);
        if (!calendarEvent) {
          console.log('Failed to create calendar event for task:', task.title);
        }
      } catch (calendarError) {
        console.log('Failed to create calendar event (table might not exist):', calendarError);
        // Continue without calendar event
      }

      // Update task with scheduled time
      await supabase
        .from('tasks')
        .update({
          due_date: scheduledTime.toISOString(),
          status: 'scheduled',
          last_scheduled_date: new Date().toISOString(),
          travel_time_minutes: travelTime
        })
        .eq('id', task.id);

      // Update scheduling history (optional - continue even if it fails)
      try {
        await updateTaskSchedulingHistory(
          userId,
          task.id,
          scheduledTime,
          weatherData,
          travelTime,
          calendarEvent?.id,
          'Auto-scheduled based on availability and preferences',
          token
        );
      } catch (historyError) {
        console.log('Failed to update scheduling history (table might not exist):', historyError);
        // Continue without updating history
      }

      results.push({
        task_id: task.id,
        task_title: task.title,
        status: 'scheduled',
        scheduled_time: scheduledTime,
        calendar_event_id: calendarEvent?.id || null
      });

    } catch (error) {
      console.log(`Error auto-scheduling task ${task.id}:`, error);
      results.push({
        task_id: task.id,
        task_title: task.title,
        status: 'error',
        reason: error.message
      });
    }
  }

  return {
    message: 'Auto-scheduling completed',
    results: results,
    total_tasks: tasks.length,
    successful: results.filter(r => r.status === 'scheduled').length,
    failed: results.filter(r => r.status === 'failed' || r.status === 'error').length,
    skipped: results.filter(r => r.status === 'skipped').length
  };
} 