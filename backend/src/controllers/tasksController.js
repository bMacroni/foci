import { createClient } from '@supabase/supabase-js';
import { dateParser } from '../utils/dateParser.js';
import { autoScheduleTasks, processRecurringTask } from './autoSchedulingController.js';

export async function createTask(req, res) {
  const { 
    title, 
    description, 
    due_date, 
    priority, 
    goal_id, 
    completed, 
    preferred_time_of_day, 
    deadline_type, 
    travel_time_minutes,
    // Auto-scheduling fields
    auto_schedule_enabled,
    recurrence_pattern,
    scheduling_preferences,
    weather_dependent,
    location,
    preferred_time_windows,
    max_daily_tasks,
    buffer_time_minutes,
    task_type
  } = req.body;
  const user_id = req.user.id;
  
  // Get the JWT from the request
  const token = req.headers.authorization?.split(' ')[1];
  
  // Create Supabase client with the JWT
  const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY, {
    global: {
      headers: {
        Authorization: `Bearer ${token}`
      }
    }
  });
  
  console.log('Creating task for user:', user_id);
  
  // Convert empty string goal_id to null
  const sanitizedGoalId = goal_id === '' ? null : goal_id;
  
  // Convert empty string due_date to null
  const sanitizedDueDate = due_date === '' ? null : due_date;
  
  const { data, error } = await supabase
    .from('tasks')
    .insert([{ 
      user_id, 
      title, 
      description, 
      due_date: sanitizedDueDate, 
      priority, 
      goal_id: sanitizedGoalId, 
      completed, 
      preferred_time_of_day, 
      deadline_type, 
      travel_time_minutes,
      // Auto-scheduling fields
      auto_schedule_enabled,
      recurrence_pattern,
      scheduling_preferences,
      weather_dependent,
      location,
      preferred_time_windows,
      max_daily_tasks,
      buffer_time_minutes,
      task_type
    }])
    .select()
    .single();
  
  if (error) {
    console.log('Supabase error:', error);
    return res.status(400).json({ error: error.message });
  }
  res.status(201).json(data);
}

export async function getTasks(req, res) {
  const user_id = req.user.id;
  
  // Get the JWT from the request
  const token = req.headers.authorization?.split(' ')[1];
  
  // Create Supabase client with the JWT
  const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY, {
    global: {
      headers: {
        Authorization: `Bearer ${token}`
      }
    }
  });
  
  const { data, error } = await supabase
    .from('tasks')
    .select(`
      *,
      goals:goal_id (
        id,
        title,
        description
      ),
      calendar_events!task_id (
        id,
        start_time,
        end_time,
        title
      )
    `)
    .eq('user_id', user_id)
    .order('created_at', { ascending: false });
  
  if (error) {
    return res.status(400).json({ error: error.message });
  }

  res.json(data);
}

export async function getTaskById(req, res) {
  const user_id = req.user.id;
  const { id } = req.params;
  
  // Get the JWT from the request
  const token = req.headers.authorization?.split(' ')[1];
  
  // Create Supabase client with the JWT
  const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY, {
    global: {
      headers: {
        Authorization: `Bearer ${token}`
      }
    }
  });
  
  const { data, error } = await supabase
    .from('tasks')
    .select('*')
    .eq('id', id)
    .eq('user_id', user_id)
    .single();
  
  if (error) {
    return res.status(404).json({ error: error.message });
  }
  res.json(data);
}

export async function updateTask(req, res) {
  const user_id = req.user.id;
  const { id } = req.params;
  const { 
    title, 
    description, 
    due_date, 
    priority, 
    goal_id, 
    completed, 
    preferred_time_of_day, 
    deadline_type, 
    travel_time_minutes, 
    status,
    estimated_duration_minutes,
    scheduled_time,
    // Auto-scheduling fields
    auto_schedule_enabled,
    recurrence_pattern,
    scheduling_preferences,
    weather_dependent,
    location,
    preferred_time_windows,
    max_daily_tasks,
    buffer_time_minutes,
    task_type
  } = req.body;
  
  // Get the JWT from the request
  const token = req.headers.authorization?.split(' ')[1];
  
  // Create Supabase client with the JWT
  const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY, {
    global: {
      headers: {
        Authorization: `Bearer ${token}`
      }
    }
  });
  
  // Convert empty string goal_id to null
  const sanitizedGoalId = goal_id === '' ? null : goal_id;
  
  // Convert empty string due_date to null
  const sanitizedDueDate = due_date === '' ? null : due_date;
  
  const updateFields = {
    ...(title !== undefined && { title }),
    ...(description !== undefined && { description }),
    ...(due_date !== undefined && { due_date: sanitizedDueDate }),
    ...(priority !== undefined && { priority }),
    ...(goal_id !== undefined && { goal_id: sanitizedGoalId }),
    ...(completed !== undefined && { completed }),
    ...(preferred_time_of_day !== undefined && { preferred_time_of_day }),
    ...(deadline_type !== undefined && { deadline_type }),
    ...(travel_time_minutes !== undefined && { travel_time_minutes }),
    ...(status !== undefined && { status }),
    ...(estimated_duration_minutes !== undefined && { estimated_duration_minutes }),
    ...(scheduled_time !== undefined && { scheduled_time }),
    // Auto-scheduling fields
    ...(auto_schedule_enabled !== undefined && { auto_schedule_enabled }),
    ...(recurrence_pattern !== undefined && { recurrence_pattern }),
    ...(scheduling_preferences !== undefined && { scheduling_preferences }),
    ...(weather_dependent !== undefined && { weather_dependent }),
    ...(location !== undefined && { location }),
    ...(preferred_time_windows !== undefined && { preferred_time_windows }),
    ...(max_daily_tasks !== undefined && { max_daily_tasks }),
    ...(buffer_time_minutes !== undefined && { buffer_time_minutes }),
    ...(task_type !== undefined && { task_type })
  };

  // Check if this is a recurring task being completed
  const isRecurringTaskCompletion = status === 'completed' && recurrence_pattern;
  
  const { data, error } = await supabase
    .from('tasks')
    .update(updateFields)
    .eq('id', id)
    .eq('user_id', user_id)
    .select()
    .single();
  
  if (error) {
    console.log('Supabase error:', error);
    return res.status(400).json({ error: error.message });
  }

  // Handle recurring task completion
  if (isRecurringTaskCompletion && data.recurrence_pattern) {
    try {
      const updatedTask = await processRecurringTask(data, token);
      if (updatedTask) {
        // Return the updated task with new due date
        res.json(updatedTask);
        return;
      }
    } catch (recurringError) {
      console.log('Error processing recurring task:', recurringError);
      // Continue with normal response even if recurring processing fails
    }
  }

  res.json(data);
}

export async function deleteTask(req, res) {
  const user_id = req.user.id;
  const { id } = req.params;
  
  // Get the JWT from the request
  const token = req.headers.authorization?.split(' ')[1];
  
  // Create Supabase client with the JWT
  const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY, {
    global: {
      headers: {
        Authorization: `Bearer ${token}`
      }
    }
  });
  
  const { error } = await supabase
    .from('tasks')
    .delete()
    .eq('id', id)
    .eq('user_id', user_id);
  
  if (error) {
    console.log('Supabase error:', error);
    return res.status(400).json({ error: error.message });
  }
  res.status(204).send();
}

export async function bulkCreateTasks(req, res) {
  const tasks = req.body;
  const user_id = req.user.id;
  const token = req.headers.authorization?.split(' ')[1];
  const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY, {
    global: {
      headers: {
        Authorization: `Bearer ${token}`
      }
    }
  });

  if (!Array.isArray(tasks) || tasks.length === 0) {
    return res.status(400).json({ error: 'Request body must be a non-empty array of tasks.' });
  }

  // Attach user_id to each task and sanitize fields
  const tasksToInsert = tasks.map(task => ({
    user_id,
    title: task.title,
    description: task.description || '',
    due_date: task.due_date || null,
    priority: task.priority || null,
    goal_id: task.goal_id === '' ? null : (task.goal_id || null),
    completed: task.completed || false,
    preferred_time_of_day: task.preferred_time_of_day || null,
    deadline_type: task.deadline_type || null,
    travel_time_minutes: task.travel_time_minutes || null
  }));

  const { data, error } = await supabase
    .from('tasks')
    .insert(tasksToInsert)
    .select();

  if (error) {
    console.log('Supabase bulk insert error:', error);
    return res.status(400).json({ error: error.message });
  }
  res.status(201).json(data);
}

export async function createTaskFromAI(args, userId, userContext) {
  const { title, description, due_date, priority, related_goal, preferred_time_of_day, deadline_type, travel_time_minutes } = args;
  const token = userContext?.token;
  const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY, {
    global: {
      headers: {
        Authorization: `Bearer ${token}`
      }
    }
  });

  let goalId = null;
  if (related_goal) {
    // Fetch all goals for the user and find by title
    const { data: goals, error: fetchError } = await supabase
      .from('goals')
      .select('id, title')
      .eq('user_id', userId);
    if (fetchError) return { error: fetchError.message };
    const match = goals.find(g => g.title && g.title.trim().toLowerCase() === related_goal.trim().toLowerCase());
    if (match) goalId = match.id;
  }

  // Use DateParser utility for due_date parsing
  let parsedDueDate = due_date;
  if (due_date && typeof due_date === 'string') {
    parsedDueDate = dateParser.parse(due_date);
  }

  const { data, error } = await supabase
    .from('tasks')
    .insert([{ 
      user_id: userId, 
      title, 
      description, 
      due_date: parsedDueDate,
      priority,
      goal_id: goalId,
      completed: false,
      preferred_time_of_day,
      deadline_type,
      travel_time_minutes
    }])
    .select()
    .single();

  if (error) {
    return { error: error.message };
  }
  return data;
}

export async function updateTaskFromAI(args, userId, userContext) {
  const { id, title, description, due_date, priority, related_goal, completed, preferred_time_of_day, deadline_type, travel_time_minutes } = args;
  const token = userContext?.token;
  const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY, {
    global: {
      headers: {
        Authorization: `Bearer ${token}`
      }
    }
  });

  let taskId = id;
  if (!taskId && title) {
    // Fetch all tasks for the user and find by title
    const { data: tasks, error: fetchError } = await supabase
      .from('tasks')
      .select('id, title')
      .eq('user_id', userId);
    if (fetchError) return { error: fetchError.message };
    const match = tasks.find(t => t.title && t.title.trim().toLowerCase() === title.trim().toLowerCase());
    if (!match) return { error: `No task found with title '${title}'` };
    taskId = match.id;
  }
  if (!taskId) {
    return { error: "Task ID or title is required to update a task." };
  }

  let goalId = null;
  if (related_goal) {
    // Fetch all goals for the user and find by title
    const { data: goals, error: fetchError } = await supabase
      .from('goals')
      .select('id, title')
      .eq('user_id', userId);
    if (fetchError) return { error: fetchError.message };
    const match = goals.find(g => g.title && g.title.trim().toLowerCase() === related_goal.trim().toLowerCase());
    if (match) goalId = match.id;
  }

  // Prepare update data with DateParser for due_date
  const updateData = {};
  if (description !== undefined) updateData.description = description;
  if (due_date !== undefined) {
    updateData.due_date = typeof due_date === 'string' ? dateParser.parse(due_date) : due_date;
  }
  if (priority !== undefined) updateData.priority = priority;
  if (related_goal !== undefined) updateData.goal_id = goalId;
  if (completed !== undefined) updateData.completed = completed;
  if (preferred_time_of_day !== undefined) updateData.preferred_time_of_day = preferred_time_of_day;
  if (deadline_type !== undefined) updateData.deadline_type = deadline_type;
  if (travel_time_minutes !== undefined) updateData.travel_time_minutes = travel_time_minutes;

  const { data, error } = await supabase
    .from('tasks')
    .update(updateData)
    .eq('id', taskId)
    .eq('user_id', userId)
    .select()
    .single();

  if (error) {
    return { error: error.message };
  }
  return data;
}

export async function deleteTaskFromAI(args, userId, userContext) {
  const { id, title } = args;
  const token = userContext?.token;
  const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY, {
    global: {
      headers: {
        Authorization: `Bearer ${token}`
      }
    }
  });

  let taskId = id;
  if (!taskId && title) {
    // Fetch all tasks for the user and find by title
    const { data: tasks, error: fetchError } = await supabase
      .from('tasks')
      .select('id, title')
      .eq('user_id', userId);
    if (fetchError) return { error: fetchError.message };
    const match = tasks.find(t => t.title && t.title.trim().toLowerCase() === title.trim().toLowerCase());
    if (!match) return { error: `No task found with title '${title}'` };
    taskId = match.id;
  }
  if (!taskId) {
    return { error: "Task ID or title is required to delete a task." };
  }

  const { error } = await supabase
    .from('tasks')
    .delete()
    .eq('id', taskId)
    .eq('user_id', userId);

  if (error) {
    return { error: error.message };
  }
  return { success: true };
}

export async function lookupTaskbyTitle(userId, token) {
  if (!token) {
    return { error: 'No authentication token provided' };
  }

  const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY, {
    global: {
      headers: {
        Authorization: `Bearer ${token}`
      }
    }
  });

  // Get ALL tasks for this user
  const { data, error } = await supabase
    .from('tasks')
    .select('id, title')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error) {
    return { error: error.message };
  }
  
  // Return all tasks with their IDs and titles
  if (data && data.length > 0) {
    return data;
  } else {
    return { error: 'No tasks found for this user' };
  }
}


export async function readTaskFromAI(args, userId, userContext) {
  const { due_date, related_goal } = args;
  const token = userContext?.token;
  const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY, {
    global: {
      headers: {
        Authorization: `Bearer ${token}`
      }
    }
  });

  let query = supabase
    .from('tasks')
    .select('*')
    .eq('user_id', userId);

  if (due_date) {
    query = query.eq('due_date', due_date);
  }
  if (related_goal) {
    // First get the goal ID
    const { data: goals, error: goalError } = await supabase
      .from('goals')
      .select('id, title')
      .eq('user_id', userId);
    if (goalError) return { error: goalError.message };
    const match = goals.find(g => g.title && g.title.trim().toLowerCase() === related_goal.trim().toLowerCase());
    if (match) {
      query = query.eq('goal_id', match.id);
    }
  }
  if (args.priority) {
    query = query.eq('priority', args.priority);
  }
  if (args.status) {
    query = query.eq('status', args.status);
  }
  if (args.completed !== undefined) {
    query = query.eq('completed', args.completed);
  }
  if (args.category) {
    query = query.eq('category', args.category);
  }
  if (args.search) {
    // Case-insensitive partial match for title or description
    query = query.or(`title.ilike.%${args.search}%,description.ilike.%${args.search}%`);
  }
  if (args.preferred_time_of_day) {
    query = query.eq('preferred_time_of_day', args.preferred_time_of_day);
  }
  if (args.deadline_type) {
    query = query.eq('deadline_type', args.deadline_type);
  }
  if (args.recurrence) {
    query = query.eq('recurrence', args.recurrence);
  }

  const { data, error } = await query.order('created_at', { ascending: false });

  if (error) {
    return { error: error.message };
  }
  return data;
}

// Auto-scheduling API endpoints

export async function toggleAutoSchedule(req, res) {
  const user_id = req.user.id;
  const { id } = req.params;
  const { auto_schedule_enabled } = req.body;
  
  const token = req.headers.authorization?.split(' ')[1];
  const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY, {
    global: {
      headers: {
        Authorization: `Bearer ${token}`
      }
    }
  });

  const { data, error } = await supabase
    .from('tasks')
    .update({ auto_schedule_enabled })
    .eq('id', id)
    .eq('user_id', user_id)
    .select()
    .single();

  if (error) {
    console.log('Supabase error:', error);
    return res.status(400).json({ error: error.message });
  }
  res.json(data);
}

export async function getAutoSchedulingDashboard(req, res) {
  const user_id = req.user.id;
  
  const token = req.headers.authorization?.split(' ')[1];
  const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY, {
    global: {
      headers: {
        Authorization: `Bearer ${token}`
      }
    }
  });

  const { data, error } = await supabase
    .from('auto_scheduling_dashboard')
    .select('*')
    .eq('user_id', user_id)
    .single();

  if (error) {
    console.log('Supabase error:', error);
    return res.status(400).json({ error: error.message });
  }
  res.json(data);
}

export async function getUserSchedulingPreferences(req, res) {
  const user_id = req.user.id;
  
  const token = req.headers.authorization?.split(' ')[1];
  const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY, {
    global: {
      headers: {
        Authorization: `Bearer ${token}`
      }
    }
  });

  const { data, error } = await supabase
    .from('user_scheduling_preferences')
    .select('*')
    .eq('user_id', user_id)
    .single();

  if (error) {
    console.log('Supabase error:', error);
    return res.status(400).json({ error: error.message });
  }
  res.json(data);
}

export async function updateUserSchedulingPreferences(req, res) {
  const user_id = req.user.id;
  const {
    preferred_start_time,
    preferred_end_time,
    work_days,
    max_tasks_per_day,
    buffer_time_minutes,
    weather_check_enabled,
    travel_time_enabled,
    auto_scheduling_enabled
  } = req.body;
  
  const token = req.headers.authorization?.split(' ')[1];
  const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY, {
    global: {
      headers: {
        Authorization: `Bearer ${token}`
      }
    }
  });

  const updateFields = {
    ...(preferred_start_time !== undefined && { preferred_start_time }),
    ...(preferred_end_time !== undefined && { preferred_end_time }),
    ...(work_days !== undefined && { work_days }),
    ...(max_tasks_per_day !== undefined && { max_tasks_per_day }),
    ...(buffer_time_minutes !== undefined && { buffer_time_minutes }),
    ...(weather_check_enabled !== undefined && { weather_check_enabled }),
    ...(travel_time_enabled !== undefined && { travel_time_enabled }),
    ...(auto_scheduling_enabled !== undefined && { auto_scheduling_enabled })
  };

  const { data, error } = await supabase
    .from('user_scheduling_preferences')
    .update(updateFields)
    .eq('user_id', user_id)
    .select()
    .single();

  if (error) {
    console.log('Supabase error:', error);
    return res.status(400).json({ error: error.message });
  }
  res.json(data);
}

export async function getTaskSchedulingHistory(req, res) {
  const user_id = req.user.id;
  const { task_id } = req.params;
  
  const token = req.headers.authorization?.split(' ')[1];
  const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY, {
    global: {
      headers: {
        Authorization: `Bearer ${token}`
      }
    }
  });

  let query = supabase
    .from('task_scheduling_history')
    .select('*')
    .eq('user_id', user_id);

  if (task_id) {
    query = query.eq('task_id', task_id);
  }

  const { data, error } = await query.order('created_at', { ascending: false });

  if (error) {
    console.log('Supabase error:', error);
    return res.status(400).json({ error: error.message });
  }
  res.json(data);
}

export async function triggerAutoScheduling(req, res) {
  const user_id = req.user.id;
  const token = req.headers.authorization?.split(' ')[1];

  try {
    const result = await autoScheduleTasks(user_id, token);
    
    if (result.error) {
      return res.status(400).json({ error: result.error });
    }
    
    res.json(result);
  } catch (error) {
    console.log('Error in triggerAutoScheduling:', error);
    res.status(500).json({ error: 'Internal server error during auto-scheduling' });
  }
} 