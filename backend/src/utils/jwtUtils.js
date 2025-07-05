import { createClient } from '@supabase/supabase-js';

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY);

export async function verifyJwt(token) {
  try {
    const { data, error } = await supabase.auth.getUser(token);
    if (error || !data?.user) {
      throw new Error('Invalid or expired token');
    }
    return data.user;
  } catch (error) {
    throw new Error('JWT verification failed');
  }
} 