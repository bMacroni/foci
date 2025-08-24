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

// === App Preferences (new table: user_app_preferences) ===

async function ensureAppPreferencesTable() {
  try {
    // Use service role for DDL operations
    const admin = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
    await admin.rpc('exec_sql', {
      sql: `
        CREATE TABLE IF NOT EXISTS public.user_app_preferences (
          user_id UUID PRIMARY KEY REFERENCES public.users(id) ON DELETE CASCADE,
          momentum_mode_enabled BOOLEAN NOT NULL DEFAULT false,
          momentum_travel_preference TEXT NOT NULL DEFAULT 'allow_travel',
          created_at TIMESTAMPTZ DEFAULT NOW(),
          updated_at TIMESTAMPTZ DEFAULT NOW()
        );

        ALTER TABLE public.user_app_preferences ENABLE ROW LEVEL SECURITY;
        DO $$ BEGIN
          IF NOT EXISTS (
            SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'user_app_preferences' AND policyname = 'Users can view own app prefs'
          ) THEN
            CREATE POLICY "Users can view own app prefs" ON public.user_app_preferences FOR SELECT USING (auth.uid() = user_id);
          END IF;
          IF NOT EXISTS (
            SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'user_app_preferences' AND policyname = 'Users can insert own app prefs'
          ) THEN
            CREATE POLICY "Users can insert own app prefs" ON public.user_app_preferences FOR INSERT WITH CHECK (auth.uid() = user_id);
          END IF;
          IF NOT EXISTS (
            SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'user_app_preferences' AND policyname = 'Users can update own app prefs'
          ) THEN
            CREATE POLICY "Users can update own app prefs" ON public.user_app_preferences FOR UPDATE USING (auth.uid() = user_id);
          END IF;
        END $$;
      `
    });
  } catch (_e) {
    // Silent fail; endpoint will attempt without DDL
  }
}

export async function getAppPreferences(req, res) {
  const user_id = req.user.id;
  const token = req.headers.authorization?.split(' ')[1];
  const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY, {
    global: { headers: { Authorization: `Bearer ${token}` } }
  });
  try {
    const { data, error } = await supabase
      .from('user_app_preferences')
      .select('*')
      .eq('user_id', user_id)
      .single();
    if (error) {
      if (error.code === '42P01') {
        return res.status(400).json({ error: 'user_app_preferences table not found. Please run the SQL migration to create it.' });
      }
      if (error.code === 'PGRST116') {
        // No row yet; return defaults
        return res.json({
          user_id,
          momentum_mode_enabled: false,
          momentum_travel_preference: 'allow_travel',
        });
      }
      return res.status(400).json({ error: error.message });
    }
    res.json(data || {
      user_id,
      momentum_mode_enabled: false,
      momentum_travel_preference: 'allow_travel',
    });
  } catch (_e) {
    res.status(500).json({ error: 'Failed to fetch app preferences' });
  }
}

export async function updateAppPreferences(req, res) {
  const user_id = req.user.id;
  const { momentum_mode_enabled, momentum_travel_preference } = req.body || {};
  const token = req.headers.authorization?.split(' ')[1];
  const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY, {
    global: { headers: { Authorization: `Bearer ${token}` } }
  });
  const updates = {};
  if (typeof momentum_mode_enabled === 'boolean') updates.momentum_mode_enabled = momentum_mode_enabled;
  if (momentum_travel_preference && ['allow_travel','home_only'].includes(momentum_travel_preference)) {
    updates.momentum_travel_preference = momentum_travel_preference;
  }
  try {
    // Try update first
    const { data: updated, error: updErr } = await supabase
      .from('user_app_preferences')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('user_id', user_id)
      .select()
      .single();

    if (!updErr && updated) {
      return res.json(updated);
    }

    // If no row, insert
    const { data: inserted, error: insErr } = await supabase
      .from('user_app_preferences')
      .insert([{ user_id, ...updates }])
      .select()
      .single();
    if (insErr) {
      if (insErr.code === '42P01') {
        return res.status(400).json({ error: 'user_app_preferences table not found. Please run the SQL migration to create it.' });
      }
      return res.status(400).json({ error: insErr.message });
    }
    res.json(inserted);
  } catch (_e) {
    res.status(500).json({ error: 'Failed to update app preferences' });
  }
}