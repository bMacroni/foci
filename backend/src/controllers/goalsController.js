import { createClient } from '@supabase/supabase-js';

export async function createGoal(req, res) {
  const { title, description, target_completion_date, category } = req.body;
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
  
  console.log('req.user:', req.user);
  console.log('user_id being inserted:', user_id);
  console.log('user_id type:', typeof user_id);
  
  const { data, error } = await supabase
    .from('goals')
    .insert([{ user_id, title, description, target_completion_date, category }])
    .select()
    .single();
  
  if (error) {
    console.log('Supabase error:', error);
    return res.status(400).json({ error: error.message });
  }
  res.status(201).json(data);
}

export async function getGoals(req, res) {
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
  
  console.log('=== GET GOALS DEBUG ===');
  console.log('User ID:', user_id);
  console.log('JWT Token (first 50 chars):', token ? token.substring(0, 50) + '...' : 'No token');
  console.log('Request headers:', req.headers.authorization ? 'Authorization header present' : 'No Authorization header');
  
  const { data, error } = await supabase
    .from('goals')
    .select('*')
    .eq('user_id', user_id)
    .order('created_at', { ascending: false });
  
  console.log('Supabase response data:', data);
  console.log('Supabase response error:', error);
  console.log('=== END GET GOALS DEBUG ===');
  
  if (error) {
    console.log('Supabase error:', error);
    return res.status(400).json({ error: error.message });
  }
  res.json(data);
}

export async function getGoalById(req, res) {
  const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY);
  const user_id = req.user.id;
  const { id } = req.params;
  const { data, error } = await supabase
    .from('goals')
    .select('*')
    .eq('id', id)
    .eq('user_id', user_id)
    .single();
  if (error) return res.status(404).json({ error: error.message });
  res.json(data);
}

export async function updateGoal(req, res) {
  const user_id = req.user.id;
  const { id } = req.params;
  const { title, description, target_completion_date, completed, category } = req.body;
  
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
    .from('goals')
    .update({ title, description, target_completion_date, completed, category })
    .eq('id', id)
    .eq('user_id', user_id)
    .select()
    .single();
    
  if (error) {
    console.log('Supabase update error:', error);
    return res.status(400).json({ error: error.message });
  }
  res.json(data);
}

export async function deleteGoal(req, res) {
  const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY);
  const user_id = req.user.id;
  const { id } = req.params;
  const { error } = await supabase
    .from('goals')
    .delete()
    .eq('id', id)
    .eq('user_id', user_id);
  if (error) return res.status(400).json({ error: error.message });
  res.status(204).send();
} 

export async function deleteGoalFromAI(args, userId, userContext) {
  const { id, title } = args;
  const token = userContext?.token;
  const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY, {
    global: {
      headers: {
        Authorization: `Bearer ${token}`
      }
    }
  });

  let goalId = id;
  if (!goalId && title) {
    // Fetch all goals for the user and find by title
    const { data: goals, error: fetchError } = await supabase
      .from('goals')
      .select('id, title')
      .eq('user_id', userId);
    if (fetchError) return { error: fetchError.message };
    const match = goals.find(g => g.title && g.title.trim().toLowerCase() === title.trim().toLowerCase());
    if (!match) return { error: `No goal found with title '${title}'` };
    goalId = match.id;
  }
  if (!goalId) {
    return { error: "Goal ID or title is required to delete a goal." };
  }
  const { error } = await supabase
    .from('goals')
    .delete()
    .eq('id', goalId)
    .eq('user_id', userId);
  if (error) return { error: error.message };
  return { success: true };
}

export async function getGoalsForUser(userId, token) {
  const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY, {
    global: {
      headers: {
        Authorization: `Bearer ${token}`
      }
    }
  });

  const { data, error } = await supabase
    .from('goals')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error) {
    return { error: error.message };
  }
  return data;
}

export async function lookupGoalbyTitle(userId, token) {
  console.log('=== LOOKUP GOAL DEBUG ===');
  console.log('User ID:', userId);
  console.log('Token (first 50 chars):', token ? token.substring(0, 50) + '...' : 'No token');
  console.log('Token type:', typeof token);
  console.log('Token length:', token ? token.length : 0);
  
  if (!token) {
    console.log('ERROR: No token provided to lookupGoalbyTitle');
    return { error: 'No authentication token provided' };
  }

  const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY, {
    global: {
      headers: {
        Authorization: `Bearer ${token}`
      }
    }
  });

  // Get ALL goals for this user
  const { data, error } = await supabase
    .from('goals')
    .select('id, title')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  console.log('All goals for user:', data);
  console.log('Supabase response error:', error);
  console.log('=== END LOOKUP GOAL DEBUG ===');

  if (error) {
    return { error: error.message };
  }
  
  // Return all goals with their IDs and titles
  if (data && data.length > 0) {
    console.log('Returning', data.length, 'goals');
    return data;
  } else {
    console.log('No goals found for user');
    return { error: 'No goals found for this user' };
  }
}

export async function createGoalFromAI(args, userId, userContext) {
  const { title, description, due_date, priority } = args;
  const token = userContext?.token;
  const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY, {
    global: {
      headers: {
        Authorization: `Bearer ${token}`
      }
    }
  });

  // Map due_date to target_completion_date for database consistency
  const { data, error } = await supabase
    .from('goals')
    .insert([{ 
      user_id: userId, 
      title, 
      description, 
      target_completion_date: due_date,
      category: priority // Map priority to category field
    }])
    .select()
    .single();

  if (error) {
    return { error: error.message };
  }
  return data;
}

export async function updateGoalFromAI(args, userId, userContext) {
  const { id, title, description, due_date, priority } = args;
  const token = userContext?.token;
  const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY, {
    global: {
      headers: {
        Authorization: `Bearer ${token}`
      }
    }
  });

  let goalId = id;
  if (!goalId && title) {
    // Fetch all goals for the user and find by title
    const { data: goals, error: fetchError } = await supabase
      .from('goals')
      .select('id, title')
      .eq('user_id', userId);
    if (fetchError) return { error: fetchError.message };
    const match = goals.find(g => g.title && g.title.trim().toLowerCase() === title.trim().toLowerCase());
    if (!match) return { error: `No goal found with title '${title}'` };
    goalId = match.id;
  }
  if (!goalId) {
    return { error: "Goal ID or title is required to update a goal." };
  }

  // Prepare update data
  const updateData = {};
  if (description !== undefined) updateData.description = description;
  if (due_date !== undefined) updateData.target_completion_date = due_date;
  if (priority !== undefined) updateData.category = priority;

  const { data, error } = await supabase
    .from('goals')
    .update(updateData)
    .eq('id', goalId)
    .eq('user_id', userId)
    .select()
    .single();

  if (error) {
    return { error: error.message };
  }
  return data;
} 