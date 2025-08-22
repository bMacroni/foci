// Test script to verify focus constraint handling
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY);

async function testFocusConstraint() {
  console.log('Testing focus constraint handling...');
  
  // This would need a valid user_id and auth token to work properly
  // For now, this is just a demonstration of the logic
  
  try {
    // Simulate creating a task with is_today_focus = true
    const taskData = {
      user_id: 'test-user-id',
      title: 'Test Focus Task',
      description: '',
      priority: 'high',
      is_today_focus: true
    };
    
    console.log('Attempting to create focus task...');
    const { data, error } = await supabase
      .from('tasks')
      .insert([taskData])
      .select()
      .single();
    
    if (error) {
      console.log('Error:', error.message);
      if (error.message.includes('uniq_tasks_user_focus')) {
        console.log('✅ Focus constraint violation detected correctly');
      } else {
        console.log('❌ Unexpected error:', error.message);
      }
    } else {
      console.log('✅ Task created successfully:', data);
    }
    
  } catch (error) {
    console.log('Test error:', error.message);
  }
}

// testFocusConstraint();
console.log('Test script created. Run with proper auth to test focus constraint handling.');
