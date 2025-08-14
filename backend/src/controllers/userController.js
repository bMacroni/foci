import { createClient } from '@supabase/supabase-js';

export async function getUserSettings(req, res) {
  const user_id = req.user.id;
  const token = req.headers.authorization?.split(' ')[1];
  const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY, {
    global: { headers: { Authorization: `Bearer ${token}` } }
  });

  const { data, error } = await supabase
    .from('users')
    .select('timezone, email, full_name, avatar_url')
    .eq('id', user_id)
    .single();

  if (error) {
    return res.status(400).json({ error: error.message });
  }
  res.json(data);
}

export async function updateUserSettings(req, res) {
  const user_id = req.user.id;
  const { timezone } = req.body;
  const token = req.headers.authorization?.split(' ')[1];
  const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY, {
    global: { headers: { Authorization: `Bearer ${token}` } }
  });

  const updateFields = {};
  if (timezone !== undefined) updateFields.timezone = timezone;

  const { data, error } = await supabase
    .from('users')
    .update(updateFields)
    .eq('id', user_id)
    .select('timezone, email, full_name, avatar_url')
    .single();

  if (error) {
    return res.status(400).json({ error: error.message });
  }
  res.json(data);
} 

export async function getUserProfile(req, res) {
  const user_id = req.user.id;
  const token = req.headers.authorization?.split(' ')[1];
  const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY, {
    global: { headers: { Authorization: `Bearer ${token}` } }
  });

  const { data, error } = await supabase
    .from('users')
    .select('*')
    .eq('id', user_id)
    .single();

  if (error) {
    return res.status(400).json({ error: error.message });
  }
  // Fallback join_date using auth user's created_at if join_date column isn't present
  try {
    const { data: authData } = await supabase.auth.getUser(token);
    const joinDate = (data && 'join_date' in data && data.join_date) ? data.join_date : authData?.user?.created_at;
    res.json({
      id: data.id,
      email: data.email,
      full_name: data.full_name,
      avatar_url: data.avatar_url,
      join_date: joinDate,
      last_login: data.last_login,
      account_status: data.account_status,
      theme_preference: data.theme_preference,
      notification_preferences: data.notification_preferences,
      geographic_location: data.geographic_location,
      timezone: data.timezone,
    });
  } catch (_) {
    res.json(data);
  }
}

export async function updateUserProfile(req, res) {
  const user_id = req.user.id;
  const {
    full_name,
    avatar_url,
    geographic_location,
    theme_preference,
    notification_preferences,
  } = req.body;

  const token = req.headers.authorization?.split(' ')[1];
  const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY, {
    global: { headers: { Authorization: `Bearer ${token}` } }
  });

  const updateFields = {
    ...(full_name !== undefined && { full_name }),
    ...(avatar_url !== undefined && { avatar_url }),
    ...(geographic_location !== undefined && { geographic_location }),
    ...(theme_preference !== undefined && { theme_preference }),
    ...(notification_preferences !== undefined && { notification_preferences }),
  };

  const { data, error } = await supabase
    .from('users')
    .update(updateFields)
    .eq('id', user_id)
    .select('*')
    .single();

  if (error) {
    return res.status(400).json({ error: error.message });
  }
  res.json(data);
}