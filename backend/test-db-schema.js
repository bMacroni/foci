import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

async function checkStepsTable() {
  try {
    console.log('Checking steps table structure...');
    
    // Try to get a sample step
    const { data: steps, error } = await supabase
      .from('steps')
      .select('*')
      .limit(1);
    
    if (error) {
      console.error('Error fetching steps:', error);
      return;
    }
    
    if (steps && steps.length > 0) {
      console.log('Steps table columns:', Object.keys(steps[0]));
      console.log('Sample step data:', steps[0]);
      
      // Check if completed column exists
      if ('completed' in steps[0]) {
        console.log('✅ completed column exists in steps table');
      } else {
        console.log('❌ completed column does NOT exist in steps table');
      }
    } else {
      console.log('No steps found in database');
    }
    
    // Check milestones table too
    const { data: milestones, error: milestoneError } = await supabase
      .from('milestones')
      .select('*')
      .limit(1);
    
    if (milestoneError) {
      console.error('Error fetching milestones:', milestoneError);
      return;
    }
    
    if (milestones && milestones.length > 0) {
      console.log('Milestones table columns:', Object.keys(milestones[0]));
      console.log('Sample milestone data:', milestones[0]);
    }
    
  } catch (err) {
    console.error('Error:', err);
  }
}

checkStepsTable(); 