export async function storeGoogleTokens(userId, tokens) {
  try {
    console.log(`[TokenStorage] Storing tokens for user ${userId}:`, {
      hasAccessToken: !!tokens.access_token,
      hasRefreshToken: !!tokens.refresh_token,
      scope: tokens.scope,
      tokenType: tokens.token_type,
      expiryDate: tokens.expiry_date
    });
    
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
    
    console.log(`[TokenStorage] Token data to store:`, {
      user_id: tokenData.user_id,
      hasAccessToken: !!tokenData.access_token,
      hasRefreshToken: !!tokenData.refresh_token,
      scope: tokenData.scope,
      tokenType: tokenData.token_type,
      expiryDate: tokenData.expiry_date
    });
    
    const { data, error } = await supabase
      .from('google_tokens')
      .upsert(tokenData, {
        onConflict: 'user_id'
      });
      
    if (error) {
      console.error('[TokenStorage] Error storing Google tokens:', error);
      throw error;
    }
    
    console.log(`[TokenStorage] Successfully stored tokens for user ${userId}`);
    return data;
  } catch (error) {
    console.error('[TokenStorage] Failed to store Google tokens:', error);
    throw error;
  }
}

export async function getGoogleTokens(userId) {
  try {
    console.log(`[TokenStorage] Retrieving tokens for user ${userId}`);
    
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
        console.log(`[TokenStorage] No tokens found for user ${userId}`);
        return null;
      }
      console.error(`[TokenStorage] Error retrieving tokens for user ${userId}:`, error);
      throw error;
    }
    
    console.log(`[TokenStorage] Retrieved tokens for user ${userId}:`, {
      hasAccessToken: !!data.access_token,
      hasRefreshToken: !!data.refresh_token,
      scope: data.scope,
      tokenType: data.token_type,
      expiryDate: data.expiry_date,
      updatedAt: data.updated_at
    });
    
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