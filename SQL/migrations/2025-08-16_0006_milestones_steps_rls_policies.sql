-- Enable Row Level Security for milestones and steps tables
ALTER TABLE public.milestones ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.steps ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for milestones table
-- Users can only access milestones for goals they own
CREATE POLICY "Users can view own milestones" ON public.milestones 
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.goals 
    WHERE goals.id = milestones.goal_id 
    AND goals.user_id = auth.uid()
  )
);

CREATE POLICY "Users can insert own milestones" ON public.milestones 
FOR INSERT WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.goals 
    WHERE goals.id = milestones.goal_id 
    AND goals.user_id = auth.uid()
  )
);

CREATE POLICY "Users can update own milestones" ON public.milestones 
FOR UPDATE USING (
  EXISTS (
    SELECT 1 FROM public.goals 
    WHERE goals.id = milestones.goal_id 
    AND goals.user_id = auth.uid()
  )
);

CREATE POLICY "Users can delete own milestones" ON public.milestones 
FOR DELETE USING (
  EXISTS (
    SELECT 1 FROM public.goals 
    WHERE goals.id = milestones.goal_id 
    AND goals.user_id = auth.uid()
  )
);

-- Create RLS policies for steps table
-- Users can only access steps for milestones they own
CREATE POLICY "Users can view own steps" ON public.steps 
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.milestones 
    JOIN public.goals ON goals.id = milestones.goal_id 
    WHERE milestones.id = steps.milestone_id 
    AND goals.user_id = auth.uid()
  )
);

CREATE POLICY "Users can insert own steps" ON public.steps 
FOR INSERT WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.milestones 
    JOIN public.goals ON goals.id = milestones.goal_id 
    WHERE milestones.id = steps.milestone_id 
    AND goals.user_id = auth.uid()
  )
);

CREATE POLICY "Users can update own steps" ON public.steps 
FOR UPDATE USING (
  EXISTS (
    SELECT 1 FROM public.milestones 
    JOIN public.goals ON goals.id = milestones.goal_id 
    WHERE milestones.id = steps.milestone_id 
    AND goals.user_id = auth.uid()
  )
);

CREATE POLICY "Users can delete own steps" ON public.steps 
FOR DELETE USING (
  EXISTS (
    SELECT 1 FROM public.milestones 
    JOIN public.goals ON goals.id = milestones.goal_id 
    WHERE milestones.id = steps.milestone_id 
    AND goals.user_id = auth.uid()
  )
);

-- Add updated_at triggers for milestones and steps tables
CREATE TRIGGER update_milestones_updated_at BEFORE UPDATE ON public.milestones FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_steps_updated_at BEFORE UPDATE ON public.steps FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Create indexes for better performance
CREATE INDEX idx_milestones_goal_id ON public.milestones(goal_id);
CREATE INDEX idx_milestones_order ON public.milestones("order");
CREATE INDEX idx_steps_milestone_id ON public.steps(milestone_id);
CREATE INDEX idx_steps_order ON public.steps("order");
CREATE INDEX idx_steps_completed ON public.steps(completed);


