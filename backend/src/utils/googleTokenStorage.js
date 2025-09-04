export async function storeGoogleTokens(userId, tokens) {
  try {
    // Storing tokens for user
    
    const { createClient } = await import('@supabase/supabase-js');
    const supabase = createClient(
      process.env.SUPABASE_URL, 
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );
    
    const tokenData = {
      user_id: userId,
      access_token: tokens.access_token,
      refresh_token: tokens.refresh_token,
      token_type: tokens.token_type,
      scope: tokens.scope,
      expiry_date: tokens.expiry_date,
      updated_at: new Date().toISOString()
    };
    
    // Token data to store
    
    const { data, error } = await supabase
      .from('google_tokens')
      .upsert(tokenData, {
        onConflict: 'user_id'
      });
      
    if (error) {
      console.error('[TokenStorage] Error storing Google tokens:', error);
      throw error;
    }
    
    // Successfully stored tokens for user
    return data;
  } catch (error) {
    console.error('[TokenStorage] Failed to store Google tokens:', error);
    throw error;
  }
}

export async function getGoogleTokens(userId) {
  try {
    // Retrieving tokens for user
    
    const { createClient } = await import('@supabase/supabase-js');
    const supabase = createClient(
      process.env.SUPABASE_URL, 
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );
    const { data, error } = await supabase
      .from('google_tokens')
      .select('*')
      .eq('user_id', userId)
      .single();
      
    if (error) {
      if (error.code === 'PGRST116') {
        // No tokens found for user
        return null;
      }
      console.error(`[TokenStorage] Error retrieving tokens for user ${userId}:`, error);
      throw error;
    }
    
    // Retrieved tokens for user
    
    return data;
  } catch (error) {
    console.error('[TokenStorage] Failed to get Google tokens:', error);
    throw error;
  }
}

export async function deleteGoogleTokens(userId) {
  try {
    const { createClient } = await import('@supabase/supabase-js');
    const supabase = createClient(
      process.env.SUPABASE_URL, 
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );
    const { error } = await supabase
      .from('google_tokens')
      .delete()
      .eq('user_id', userId);
    if (error) {
      throw error;
    }
    return true;
  } catch (error) {
    console.error('Failed to delete Google tokens:', error);
    throw error;
  }
} 