import dotenv from 'dotenv';
dotenv.config();
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY);

async function getJwtForUser(email, password) {
  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    
    if (error) {
      console.error('Login error:', error);
    } else {
      console.log('JWT for', email, ':', data.session.access_token);
    }
  } catch (err) {
    console.error('Error:', err);
  }
}

// Replace with your actual email and password
getJwtForUser('bmcornell88@gmail.com', 'your-password-here'); 