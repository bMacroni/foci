import { createClient } from '@supabase/supabase-js';

export async function createMilestone(req, res) {
  const { goalId } = req.params;
  const { title, order } = req.body;
  const token = req.headers.authorization?.split(' ')[1];
  const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY, {
    global: { headers: { Authorization: `Bearer ${token}` } }
  });

  const { data, error } = await supabase
    .from('milestones')
    .insert([{ goal_id: goalId, title, order }])
    .select()
    .single();

  if (error) return res.status(400).json({ error: error.message });
  res.status(201).json(data);
}

export async function updateMilestone(req, res) {
  const { milestoneId } = req.params;
  const { title, order } = req.body;
  const token = req.headers.authorization?.split(' ')[1];
  const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY, {
    global: { headers: { Authorization: `Bearer ${token}` } }
  });

  const { data, error } = await supabase
    .from('milestones')
    .update({ title, order, updated_at: new Date().toISOString() })
    .eq('id', milestoneId)
    .select()
    .single();

  if (error) return res.status(400).json({ error: error.message });
  res.json(data);
}

export async function deleteMilestone(req, res) {
  const { milestoneId } = req.params;
  const token = req.headers.authorization?.split(' ')[1];
  const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY, {
    global: { headers: { Authorization: `Bearer ${token}` } }
  });

  const { error } = await supabase
    .from('milestones')
    .delete()
    .eq('id', milestoneId);

  if (error) return res.status(400).json({ error: error.message });
  res.json({ success: true });
}

// Read all milestones for a goal (with steps)
export async function readMilestones(req, res) {
  const { goalId } = req.params;
  const token = req.headers.authorization?.split(' ')[1];
  const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY, {
    global: { headers: { Authorization: `Bearer ${token}` } }
  });

  // Get all milestones for the goal
  const { data: milestones, error } = await supabase
    .from('milestones')
    .select('*')
    .eq('goal_id', goalId)
    .order('order', { ascending: true });
  if (error) return res.status(400).json({ error: error.message });

  // For each milestone, get its steps
  const milestonesWithSteps = await Promise.all(milestones.map(async (milestone) => {
    const { data: steps } = await supabase
      .from('steps')
      .select('*')
      .eq('milestone_id', milestone.id)
      .order('order', { ascending: true });
    return { ...milestone, steps };
  }));

  res.json(milestonesWithSteps);
}

// Lookup a milestone by id or title (with steps)
export async function lookupMilestone(req, res) {
  const { milestoneId, goalId } = req.params;
  const { title } = req.query;
  const token = req.headers.authorization?.split(' ')[1];
  const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY, {
    global: { headers: { Authorization: `Bearer ${token}` } }
  });

  let milestone;
  let error;
  if (milestoneId) {
    // Lookup by id
    ({ data: milestone, error } = await supabase
      .from('milestones')
      .select('*')
      .eq('id', milestoneId)
      .single());
  } else if (goalId && title) {
    // Lookup by title within a goal
    ({ data: milestone, error } = await supabase
      .from('milestones')
      .select('*')
      .eq('goal_id', goalId)
      .ilike('title', title)
      .single());
  } else {
    return res.status(400).json({ error: 'Must provide milestoneId or goalId and title' });
  }
  if (error) return res.status(404).json({ error: error.message });

  // Get steps for this milestone
  const { data: steps, error: stepsError } = await supabase
    .from('steps')
    .select('*')
    .eq('milestone_id', milestone.id)
    .order('order', { ascending: true });
  if (stepsError) return res.status(400).json({ error: stepsError.message });

  res.json({ ...milestone, steps });
} 