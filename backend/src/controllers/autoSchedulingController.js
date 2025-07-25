import { createClient } from '@supabase/supabase-js';
import { checkWeatherConditions } from '../utils/weatherService.js';
import { getTravelTime } from '../utils/travelTimeService.js';
import { sendAutoSchedulingNotification } from '../services/notificationService.js';

// Auto-scheduling service functions

export async function calculateTravelTime(origin, destination, mode = 'driving') {
  return await getTravelTime(origin, destination, mode);
}

export async function findAvailableTimeSlots(userId, taskDuration, preferredWindows, workDays, token, additionalCommitments = []) {
  const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY, {
    global: {
      headers: {
        Authorization: `Bearer ${token}`
      }
    }
  });

  // Get user preferences for buffer time and work hours
  const { data: userPrefs } = await supabase
    .from('user_scheduling_preferences')
    .select('preferred_start_time, preferred_end_time, buffer_time_minutes')
    .eq('user_id', userId)
    .single();

  const bufferTimeMinutes = userPrefs?.buffer_time_minutes || 15;
  const workStartTime = userPrefs?.preferred_start_time || '09:00:00';
  const workEndTime = userPrefs?.preferred_end_time || '17:00:00';

  // Parse work hours
  const [workStartHour, workStartMinute] = workStartTime.split(':').map(Number);
  const [workEndHour, workEndMinute] = workEndTime.split(':').map(Number);

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

  // Get already scheduled tasks (tasks with due dates in the next 7 days)
  let scheduledTasks = [];
  try {
    const { data: tasks, error } = await supabase
      .from('tasks')
      .select('due_date, estimated_duration_minutes')
      .eq('user_id', userId)
      .not('due_date', 'is', null)
      .gte('due_date', startDate.toISOString())
      .lte('due_date', endDate.toISOString())
      .order('due_date');

    if (error) {
      console.log('Error fetching scheduled tasks:', error);
    } else {
      scheduledTasks = tasks || [];
    }
  } catch (err) {
    console.log('Error fetching scheduled tasks:', err);
  }

  // Combine all existing commitments including additional ones from current run
  const existingCommitments = [
    ...calendarEvents.map(event => ({
      start: new Date(event.start_time),
      end: new Date(event.end_time),
      type: 'calendar'
    })),
    ...scheduledTasks.map(task => ({
      start: new Date(task.due_date),
      end: new Date(new Date(task.due_date).getTime() + (task.estimated_duration_minutes || 60) * 60 * 1000),
      type: 'task'
    })),
    ...additionalCommitments
  ].sort((a, b) => a.start.getTime() - b.start.getTime());

  console.log(`[findAvailableTimeSlots] Found ${existingCommitments.length} existing commitments:`, 
    existingCommitments.map(c => ({
      type: c.type,
      start: c.start.toISOString(),
      end: c.end.toISOString()
    }))
  );

  // Generate available time slots
  const availableSlots = [];
  const now = new Date();
  
  // Look for slots in the next 7 days
  for (let day = 0; day < 7; day++) {
    const checkDate = new Date();
    checkDate.setDate(checkDate.getDate() + day);
    
    // Check if it's a work day (1=Monday, 7=Sunday)
    const dayOfWeek = checkDate.getDay();
    const adjustedDayOfWeek = dayOfWeek === 0 ? 7 : dayOfWeek; // Convert Sunday=0 to Sunday=7
    if (!workDays.includes(adjustedDayOfWeek)) {
      continue; // Skip non-work days
    }

    // Set work hours for this day
    const dayStart = new Date(checkDate);
    dayStart.setHours(workStartHour, workStartMinute, 0, 0);
    
    const dayEnd = new Date(checkDate);
    dayEnd.setHours(workEndHour, workEndMinute, 0, 0);

    // Find commitments for this day
    const dayCommitments = existingCommitments.filter(commitment => {
      const commitmentDate = new Date(commitment.start);
      return commitmentDate.toDateString() === checkDate.toDateString();
    });

    // Start with the beginning of the work day, but not before now
    let currentTime = new Date(Math.max(dayStart.getTime(), now.getTime()));

    // If current time is after work hours for today, skip to next day
    if (day === 0 && currentTime.getTime() >= dayEnd.getTime()) {
      continue;
    }

    // Check each commitment and find gaps
    for (const commitment of dayCommitments) {
      // If there's enough time before this commitment
      const timeBeforeCommitment = commitment.start.getTime() - currentTime.getTime();
      const requiredTime = (taskDuration + bufferTimeMinutes) * 60 * 1000;
      
      if (timeBeforeCommitment >= requiredTime) {
        const slotEnd = new Date(currentTime.getTime() + taskDuration * 60 * 1000);
        const slot = {
          start_time: new Date(currentTime),
          end_time: slotEnd,
          duration_minutes: taskDuration
        };
        console.log(`[findAvailableTimeSlots] Found available slot:`, {
          start: slot.start_time.toISOString(),
          end: slot.end_time.toISOString(),
          duration: taskDuration
        });
        availableSlots.push(slot);
        return availableSlots; // Return first available slot
      }
      
      // Move current time to after this commitment (plus buffer)
      currentTime = new Date(commitment.end.getTime() + bufferTimeMinutes * 60 * 1000);
    }

    // Check if there's time after the last commitment
    const timeAfterLastCommitment = dayEnd.getTime() - currentTime.getTime();
    const requiredTime = (taskDuration + bufferTimeMinutes) * 60 * 1000;
    
    if (timeAfterLastCommitment >= requiredTime) {
      const slotEnd = new Date(currentTime.getTime() + taskDuration * 60 * 1000);
      const slot = {
        start_time: new Date(currentTime),
        end_time: slotEnd,
        duration_minutes: taskDuration
      };
      console.log(`[findAvailableTimeSlots] Found available slot after last commitment:`, {
        start: slot.start_time.toISOString(),
        end: slot.end_time.toISOString(),
        duration: taskDuration
      });
      availableSlots.push(slot);
      return availableSlots; // Return first available slot
    }
  }

  // If no slots found in the next 7 days, return a fallback slot (next work day at start time)
  const fallbackDate = new Date();
  let daysToAdd = 1;
  while (daysToAdd <= 7) {
    fallbackDate.setDate(fallbackDate.getDate() + daysToAdd);
    const dayOfWeek = fallbackDate.getDay();
    const adjustedDayOfWeek = dayOfWeek === 0 ? 7 : dayOfWeek;
    
    if (workDays.includes(adjustedDayOfWeek)) {
      fallbackDate.setHours(workStartHour, workStartMinute, 0, 0);
      const fallbackEnd = new Date(fallbackDate.getTime() + taskDuration * 60 * 1000);
      
      const fallbackSlot = {
        start_time: new Date(fallbackDate),
        end_time: fallbackEnd,
        duration_minutes: taskDuration
      };
      console.log(`[findAvailableTimeSlots] Using fallback slot (next work day):`, {
        start: fallbackSlot.start_time.toISOString(),
        end: fallbackSlot.end_time.toISOString(),
        duration: taskDuration
      });
      
      return [fallbackSlot];
    }
    daysToAdd++;
  }

  // Ultimate fallback - tomorrow at 9 AM
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  tomorrow.setHours(9, 0, 0, 0);
  
  const ultimateFallbackSlot = {
    start_time: tomorrow,
    end_time: new Date(tomorrow.getTime() + taskDuration * 60 * 1000),
    duration_minutes: taskDuration
  };
  
  console.log(`[findAvailableTimeSlots] Using ultimate fallback slot:`, {
    start: ultimateFallbackSlot.start_time.toISOString(),
    end: ultimateFallbackSlot.end_time.toISOString(),
    duration: taskDuration
  });
  
  return [ultimateFallbackSlot];
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

  // Get total task count before auto-scheduling
  const { count: totalTasksBefore } = await supabase
    .from('tasks')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId);
  
  console.log(`Total tasks before auto-scheduling: ${totalTasksBefore}`);

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

  console.log(`Found ${tasks.length} tasks eligible for auto-scheduling`);
  console.log('Task IDs:', tasks.map(t => t.id));

  const results = [];
  const newlyScheduledTasks = []; // Track tasks scheduled in this run

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

      // Find available time slots, considering newly scheduled tasks
      const timeSlots = await findAvailableTimeSlots(
        userId,
        (task.estimated_duration_minutes || 60) + travelTime,
        task.preferred_time_windows,
        preferences.work_days,
        token,
        newlyScheduledTasks
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
      const { error: updateError } = await supabase
        .from('tasks')
        .update({
          due_date: scheduledTime.toISOString(),
          status: 'in_progress', // Changed from 'scheduled' to 'in_progress' since 'scheduled' is not a valid enum value
          last_scheduled_date: new Date().toISOString(),
          travel_time_minutes: travelTime
        })
        .eq('id', task.id);

      if (updateError) {
        console.log('Error updating task with scheduled time:', updateError);
        results.push({
          task_id: task.id,
          task_title: task.title,
          status: 'error',
          reason: 'Failed to update task with scheduled time'
        });
        continue;
      }

      // Add the newly scheduled task to our tracking array
      newlyScheduledTasks.push({
        start: scheduledTime,
        end: new Date(scheduledTime.getTime() + (task.estimated_duration_minutes || 60) * 60 * 1000),
        type: 'newly_scheduled_task'
      });

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
        // Continue without updating history
      }

      results.push({
        task_id: task.id,
        task_title: task.title,
        status: 'scheduled', // This is fine for result tracking, not database enum
        scheduled_time: scheduledTime,
        calendar_event_id: calendarEvent?.id || null
      });

    } catch (error) {
      results.push({
        task_id: task.id,
        task_title: task.title,
        status: 'error',
        reason: error.message
      });
    }
  }

  // Get total task count after auto-scheduling
  const { count: totalTasksAfter } = await supabase
    .from('tasks')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId);

  // Prepare notification data
  const successfulTasks = results.filter(r => r.status === 'scheduled');
  const failedTasks = results.filter(r => r.status === 'failed' || r.status === 'error');
  const skippedTasks = results.filter(r => r.status === 'skipped');

  // Send notification based on results
  try {
    if (successfulTasks.length > 0 || failedTasks.length > 0) {
      const notificationData = {
        type: failedTasks.length > 0 ? 'auto_scheduling_error' : 'auto_scheduling_completed',
        title: failedTasks.length > 0 ? 'Auto-Scheduling Issues Detected' : 'Auto-Scheduling Completed',
        message: failedTasks.length > 0 
          ? `Auto-scheduling completed with ${successfulTasks.length} tasks scheduled and ${failedTasks.length} issues encountered.`
          : `Successfully scheduled ${successfulTasks.length} tasks automatically.`,
        details: failedTasks.length > 0 
          ? `Some tasks couldn't be scheduled due to conflicts or missing information.`
          : `All eligible tasks have been scheduled according to your preferences.`,
        scheduledTasks: successfulTasks,
        failedTasks: failedTasks
      };

      await sendAutoSchedulingNotification(userId, notificationData);
    }
  } catch (notificationError) {
    // Don't fail the entire auto-scheduling process if notification fails
  }

  return {
    message: 'Auto-scheduling completed',
    results: results,
    total_tasks: tasks.length,
    successful: successfulTasks.length,
    failed: failedTasks.length,
    skipped: skippedTasks.length,
    task_count_change: totalTasksAfter - totalTasksBefore
  };
} 