import dotenv from 'dotenv';
dotenv.config();
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL, 
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function confirmUser(email) {
  try {
    // Get the user
    const { data: users, error: fetchError } = await supabase.auth.admin.listUsers();
    
    if (fetchError) {
      console.error('Error fetching users:', fetchError);
      return;
    }

    const user = users.users.find(u => u.email === email);
    
    if (!user) {
      console.error('User not found:', email);
      return;
    }

    console.log('Found user:', user.email, 'Confirmed:', user.email_confirmed_at);

    if (!user.email_confirmed_at) {
      // Confirm the user
      const { data, error } = await supabase.auth.admin.updateUserById(
        user.id,
        { email_confirm: true }
      );

      if (error) {
        console.error('Error confirming user:', error);
      } else {
        console.log('User confirmed successfully:', email);
      }
    } else {
      console.log('User already confirmed:', email);
    }
  } catch (err) {
    console.error('Error:', err);
  }
}

// Confirm the user
confirmUser('bmcornell88@gmail.com'); 