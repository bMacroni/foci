import { createClient } from '@supabase/supabase-js';

export async function createStep(req, res) {
  const { milestoneId } = req.params;
  const { text, order, completed = false } = req.body;
  const token = req.headers.authorization?.split(' ')[1];
  const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY, {
    global: { headers: { Authorization: `Bearer ${token}` } }
  });

  const { data, error } = await supabase
    .from('steps')
    .insert([{ milestone_id: milestoneId, text, order, completed }])
    .select()
    .single();

  if (error) return res.status(400).json({ error: error.message });
  res.status(201).json(data);
}

export async function updateStep(req, res) {
  const { stepId } = req.params;
  const { text, order, completed } = req.body;
  const token = req.headers.authorization?.split(' ')[1];
  
  console.log('updateStep: Received request for stepId:', stepId);
  console.log('updateStep: Request body:', req.body);
  console.log('updateStep: Token present:', !!token);
  
  const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY, {
    global: { headers: { Authorization: `Bearer ${token}` } }
  });

  const updateFields = { text, order, updated_at: new Date().toISOString() };
  if (typeof completed === 'boolean') updateFields.completed = completed;
  
  console.log('updateStep: Update fields:', updateFields);
  
  const { data, error } = await supabase
    .from('steps')
    .update(updateFields)
    .eq('id', stepId)
    .select()
    .single();

  if (error) {
    console.error('updateStep: Supabase error:', error);
    return res.status(400).json({ error: error.message });
  }
  
  console.log('updateStep: Successfully updated step:', data);
  res.json(data);
}

export async function deleteStep(req, res) {
  const { stepId } = req.params;
  const token = req.headers.authorization?.split(' ')[1];
  const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY, {
    global: { headers: { Authorization: `Bearer ${token}` } }
  });

  const { error } = await supabase
    .from('steps')
    .delete()
    .eq('id', stepId);

  if (error) return res.status(400).json({ error: error.message });
  res.json({ success: true });
}

// Read all steps for a milestone
export async function readSteps(req, res) {
  const { milestoneId } = req.params;
  const token = req.headers.authorization?.split(' ')[1];
  const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY, {
    global: { headers: { Authorization: `Bearer ${token}` } }
  });

  const { data, error } = await supabase
    .from('steps')
    .select('*')
    .eq('milestone_id', milestoneId)
    .order('order', { ascending: true });

  if (error) return res.status(400).json({ error: error.message });
  res.json(data);
}

// Lookup a step by id or text
export async function lookupStep(req, res) {
  const { stepId, milestoneId } = req.params;
  const { text } = req.query;
  const token = req.headers.authorization?.split(' ')[1];
  const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY, {
    global: { headers: { Authorization: `Bearer ${token}` } }
  });

  let step;
  let error;
  if (stepId) {
    // Lookup by id
    ({ data: step, error } = await supabase
      .from('steps')
      .select('*')
      .eq('id', stepId)
      .single());
  } else if (milestoneId && text) {
    // Lookup by text within a milestone
    ({ data: step, error } = await supabase
      .from('steps')
      .select('*')
      .eq('milestone_id', milestoneId)
      .ilike('text', text)
      .single());
  } else {
    return res.status(400).json({ error: 'Must provide stepId or milestoneId and text' });
  }
  if (error) return res.status(404).json({ error: error.message });

  res.json(step);
} 