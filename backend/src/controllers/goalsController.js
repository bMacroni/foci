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