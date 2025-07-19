import dotenv from 'dotenv';
dotenv.config();
import { syncGoogleCalendarEvents } from './src/utils/syncService.js';
import { createClient } from '@supabase/supabase-js';

// Debug environment variables
console.log('SUPABASE_URL:', process.env.SUPABASE_URL ? 'SET' : 'NOT SET');
console.log('SUPABASE_SERVICE_ROLE_KEY:', process.env.SUPABASE_SERVICE_ROLE_KEY ? 'SET' : 'NOT SET');

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function getAllUserIds() {
  const { data, error } = await supabase.from('google_tokens').select('user_id');
  if (error) {
    console.error('Error fetching user IDs:', error);
    return [];
  }
  return data.map(row => row.user_id);
}

(async () => {
  const userIds = await getAllUserIds();
  for (const userId of userIds) {
    await syncGoogleCalendarEvents(userId);
    console.log(`Synced Google Calendar for user: ${userId}`);
  }
  process.exit(0);
})(); 