import { createClient } from '@supabase/supabase-js';

export async function createTask(req, res) {
  const { title, description, due_date, priority, goal_id, completed } = req.body;
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
    .insert([{ user_id, title, description, due_date: sanitizedDueDate, priority, goal_id: sanitizedGoalId, completed }])
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
  
  console.log('=== GET TASKS DEBUG ===');
  console.log('User ID:', user_id);
  
  const { data, error } = await supabase
    .from('tasks')
    .select(`
      *,
      goals:goal_id (
        id,
        title,
        description
      )
    `)
    .eq('user_id', user_id)
    .order('created_at', { ascending: false });
  
  console.log('Supabase response data:', data);
  console.log('Supabase response error:', error);
  console.log('=== END GET TASKS DEBUG ===');
  
  if (error) {
    console.log('Supabase error:', error);
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
    console.log('Supabase error:', error);
    return res.status(404).json({ error: error.message });
  }
  res.json(data);
}

export async function updateTask(req, res) {
  const user_id = req.user.id;
  const { id } = req.params;
  const { title, description, due_date, priority, goal_id, completed } = req.body;
  
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
  
  const { data, error } = await supabase
    .from('tasks')
    .update({ title, description, due_date: sanitizedDueDate, priority, goal_id: sanitizedGoalId, completed })
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
    completed: task.completed || false
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