import { createClient } from '@supabase/supabase-js';

export async function createGoal(req, res) {
  const { title, description, target_completion_date, category, milestones } = req.body;
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
  
  // Goal creation initiated
  
  try {
    // Start a transaction by creating the goal first
    const { data: goal, error: goalError } = await supabase
      .from('goals')
      .insert([{ user_id, title, description, target_completion_date, category }])
      .select()
      .single();
    
    if (goalError) {
      return res.status(400).json({ error: goalError.message });
    }

    // If milestones are provided, create them along with their steps
    if (milestones && Array.isArray(milestones) && milestones.length > 0) {
      for (let i = 0; i < milestones.length; i++) {
        const milestone = milestones[i];
        const { title: milestoneTitle, steps: milestoneSteps, order: milestoneOrder = i + 1 } = milestone;
        
        // Create the milestone
        const { data: createdMilestone, error: milestoneError } = await supabase
          .from('milestones')
          .insert([{ 
            goal_id: goal.id, 
            title: milestoneTitle, 
            order: milestoneOrder 
          }])
          .select()
          .single();
        
        if (milestoneError) {
          return res.status(400).json({ error: `Failed to create milestone: ${milestoneError.message}` });
        }

        // If steps are provided for this milestone, create them
        if (milestoneSteps && Array.isArray(milestoneSteps) && milestoneSteps.length > 0) {
          const stepsToInsert = milestoneSteps.map((step, stepIndex) => ({
            milestone_id: createdMilestone.id,
            text: step.text || step,
            order: step.order || stepIndex + 1,
            completed: step.completed || false
          }));

          const { error: stepsError } = await supabase
            .from('steps')
            .insert(stepsToInsert);

          if (stepsError) {
            return res.status(400).json({ error: `Failed to create steps: ${stepsError.message}` });
          }
        }
      }
    }

    // Fetch the complete goal with milestones and steps
    const { data: completeGoal, error: fetchError } = await supabase
      .from('goals')
      .select(`
        *,
        milestones (
          *,
          steps (*)
        )
      `)
      .eq('id', goal.id)
      .single();

    if (fetchError) {
      return res.status(400).json({ error: fetchError.message });
    }

    res.status(201).json(completeGoal);
  } catch (error) {
    return res.status(500).json({ error: 'Internal server error' });
  }
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
  // Fetching goals for user

  // Fetch all goals with nested milestones and steps in a single query
  const { data, error } = await supabase
    .from('goals')
    .select(`
      *,
      milestones (
        *,
        steps (*)
      )
    `)
    .eq('user_id', user_id)
    .order('created_at', { ascending: false });

  if (error) {
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
    .select(`
      *,
      milestones (
        *,
        steps (*)
      )
    `)
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
    return res.status(400).json({ error: error.message });
  }
  res.json(data);
}

export async function deleteGoal(req, res) {
  // Goal deletion initiated
  
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
  
  const user_id = req.user.id;
  const { id } = req.params;
  
  // Attempting to delete goal
  
  const { error } = await supabase
    .from('goals')
    .delete()
    .eq('id', id)
    .eq('user_id', user_id);
    
  if (error) {
    return res.status(400).json({ error: error.message });
  }
  
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

export async function getGoalsForUser(userId, token, args = {}) {
  const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY, {
    global: {
      headers: {
        Authorization: `Bearer ${token}`
      }
    }
  });

  let query = supabase
    .from('goals')
    .select(`
      *,
      milestones (
        *,
        steps (*)
      )
    `)
    .eq('user_id', userId);

  if (args.title) {
    query = query.ilike('title', `%${args.title}%`);
  }
  if (args.description) {
    query = query.ilike('description', `%${args.description}%`);
  }
  if (args.due_date) {
    query = query.eq('target_completion_date', args.due_date);
  }
  if (args.priority) {
    query = query.eq('category', args.priority); // Assuming priority maps to category
  }
  if (args.category) {
    query = query.eq('category', args.category);
  }
  if (args.status) {
    query = query.eq('status', args.status);
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

export async function lookupGoalbyTitle(userId, token) {
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

  // Get ALL goals for this user
  const { data, error } = await supabase
    .from('goals')
    .select('id, title')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error) {
    return { error: error.message };
  }
  
  // Return all goals with their IDs and titles
  if (data && data.length > 0) {
    return data;
  } else {
    return { error: 'No goals found for this user' };
  }
}

export async function createGoalFromAI(args, userId, userContext) {
  const { title, description, due_date, priority, milestones } = args;
  const token = userContext?.token;
  const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY, {
    global: {
      headers: {
        Authorization: `Bearer ${token}`
      }
    }
  });

  try {
    // Create the goal first
    const { data: goal, error: goalError } = await supabase
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

    if (goalError) {
      return { error: goalError.message };
    }

    // If milestones are provided, create them along with their steps
    if (milestones && Array.isArray(milestones) && milestones.length > 0) {
      for (let i = 0; i < milestones.length; i++) {
        const milestone = milestones[i];
        const { title: milestoneTitle, steps: milestoneSteps, order: milestoneOrder = i + 1 } = milestone;
        
        // Create the milestone
        const { data: createdMilestone, error: milestoneError } = await supabase
          .from('milestones')
          .insert([{ 
            goal_id: goal.id, 
            title: milestoneTitle, 
            order: milestoneOrder 
          }])
          .select()
          .single();
        
        if (milestoneError) {
          return { error: `Failed to create milestone: ${milestoneError.message}` };
        }

        // If steps are provided for this milestone, create them
        if (milestoneSteps && Array.isArray(milestoneSteps) && milestoneSteps.length > 0) {
          const stepsToInsert = milestoneSteps.map((step, stepIndex) => ({
            milestone_id: createdMilestone.id,
            text: step.text || step,
            order: step.order || stepIndex + 1,
            completed: step.completed || false
          }));

          const { error: stepsError } = await supabase
            .from('steps')
            .insert(stepsToInsert);

          if (stepsError) {
            return { error: `Failed to create steps: ${stepsError.message}` };
          }
        }
      }
    }

    // Fetch the complete goal with milestones and steps
    const { data: completeGoal, error: fetchError } = await supabase
      .from('goals')
      .select(`
        *,
        milestones (
          *,
          steps (*)
        )
      `)
      .eq('id', goal.id)
      .single();

    if (fetchError) {
      return { error: fetchError.message };
    }

    return completeGoal;
  } catch (error) {
    return { error: 'Internal server error' };
  }
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

// === Milestone Logic (migrated from milestonesController.js) ===

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

// === Step Logic (migrated from stepsController.js) ===

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
  
  // Step update initiated
  
  const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY, {
    global: { headers: { Authorization: `Bearer ${token}` } }
  });

  const updateFields = { text, order, updated_at: new Date().toISOString() };
  if (typeof completed === 'boolean') updateFields.completed = completed;
  
  // Updating step fields
  
  const { data, error } = await supabase
    .from('steps')
    .update(updateFields)
    .eq('id', stepId)
    .select()
    .single();

  if (error) {
    return res.status(400).json({ error: error.message });
  }
  
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