import express from 'express';
import logger from '../utils/logger.js';
import { createClient } from '@supabase/supabase-js';
import { verifyGoogleIdToken } from '../utils/firebaseAdmin.js';

const router = express.Router();

// Initialize Supabase client with service role key for admin operations (public schema)
const supabaseAdmin = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// Helper: admin find user by email using pagination (v2 SDK has no getUserByEmail)
async function findUserByEmail(email) {
  let page = 1;
  const perPage = 200;
  while (true) {
    const { data, error } = await supabaseAdmin.auth.admin.listUsers({ page, perPage });
    if (error) {
      return { error };
    }
    const found = data?.users?.find((u) => u?.email?.toLowerCase() === email.toLowerCase());
    if (found) return { user: found };
    if (!data || data.users.length < perPage) return { user: null };
    page += 1;
  }
}

// Initialize regular Supabase client for user operations
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

/**
 * POST /api/auth/google/mobile-signin
 * Handles Google Sign-In for mobile clients
 * Creates new users or signs in existing Google users
 * Returns linking_required status for existing password-based accounts
 */
router.post('/mobile-signin', async (req, res) => {
  try {
    const { idToken, accessToken } = req.body;

    // Validate required fields
    if (!idToken || !accessToken) {
      return res.status(400).json({
        error: 'idToken and accessToken are required'
      });
    }

    logger.info('Processing mobile Google sign-in request');

    // Verify Google ID token
    let decodedToken;
    try {
      decodedToken = await verifyGoogleIdToken(idToken);
    } catch (error) {
      logger.error('Google ID token verification failed:', error);
      
      // Handle specific error types
      if (error.message === 'Email must be verified') {
        return res.status(400).json({
          error: 'Email must be verified'
        });
      }
      
      return res.status(401).json({
        error: 'Invalid Google token'
      });
    }

    const { email, name, picture } = decodedToken;
    logger.info(`Google sign-in attempt for email: ${email}`);

    // Check if user exists in Supabase (use auth.users via service role)
    const { user: existingUserRow, error: userFetchError } = await findUserByEmail(email);
    if (userFetchError) {
      logger.error('Error checking existing user:', userFetchError);
      return res.status(500).json({ error: 'Failed to check existing user' });
    }

    let userId;
    let userSession;

    if (existingUserRow?.id) {
      // User exists - check if they were created with Google auth
      userId = existingUserRow.id;
      logger.info(`Existing user found: ${userId}`);

      // Check if this user was created with Google auth by looking at their metadata
      const userMetadata = existingUserRow.user_metadata || {};
      const isGoogleUser = userMetadata.provider === 'google' || userMetadata.google_linked;

      if (isGoogleUser) {
        // This is a Google user - create a session for them
        logger.info(`Existing Google user detected: ${userId}`);
        
        try {
          // Set a temporary password if they don't have one
          const { error: passwordError } = await supabaseAdmin.auth.admin.updateUserById(userId, {
            password: 'temp-google-password-123'
          });

          if (passwordError) {
            logger.error('Error setting temporary password:', passwordError);
            return res.status(500).json({
              error: 'Failed to create user session'
            });
          }

          // Sign in the user to get a proper session
          const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
            email,
            password: 'temp-google-password-123'
          });

          if (signInError) {
            logger.error('Error signing in existing Google user:', signInError);
            return res.status(500).json({
              error: 'Failed to create user session'
            });
          }

          userSession = signInData;
          logger.info(`Existing Google user signed in: ${userId}`);
        } catch (sessionError) {
          logger.error('Error creating session for existing Google user:', sessionError);
          return res.status(500).json({
            error: 'Failed to create user session'
          });
        }
      } else {
        // This is a password-based account - require linking
        logger.info(`Password-based account detected for ${email}, linking required`);
        return res.status(409).json({
          status: 'linking_required'
        });
      }
    } else {
      // User doesn't exist - create new user
      logger.info(`Creating new user for email: ${email}`);

      const { data: newUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
        email,
        email_confirm: true,
        user_metadata: {
          full_name: name,
          avatar_url: picture,
          provider: 'google'
        }
      });

      if (createError) {
        logger.error('Error creating new user:', createError);
        return res.status(500).json({
          error: createError.message
        });
      }

      userId = newUser.user.id;
      logger.info(`New user created: ${userId}`);

             // For new users, we need to create a proper Supabase session
       // Let's try to sign in the user with a temporary password and then get a session
       try {
         // First, set a temporary password for the user
         const { error: passwordError } = await supabaseAdmin.auth.admin.updateUserById(userId, {
           password: 'temp-google-password-123'
         });

         if (passwordError) {
           logger.error('Error setting temporary password:', passwordError);
           return res.status(500).json({
             error: 'Failed to create user session'
           });
         }

         // Now sign in the user to get a proper session
         const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
           email,
           password: 'temp-google-password-123'
         });

         if (signInError) {
           logger.error('Error signing in new user:', signInError);
           return res.status(500).json({
             error: 'Failed to create user session'
           });
         }

         userSession = signInData;
         logger.info('Proper Supabase session created for new Google user');
       } catch (sessionError) {
         logger.error('Error creating session:', sessionError);
         return res.status(500).json({
           error: 'Failed to create user session'
         });
       }
    }

    // Store Google tokens for calendar integration
    try {
      const { error: tokenError } = await supabaseAdmin
        .from('google_tokens')
        .upsert({
          user_id: userId,
          access_token: accessToken,
          token_type: 'Bearer',
          scope: 'https://www.googleapis.com/auth/calendar.events.readonly',
          expiry_date: Date.now() + (3600 * 1000) // 1 hour from now
        });

      if (tokenError) {
        logger.warn('Failed to store Google tokens:', tokenError);
        // Don't fail the sign-in for token storage issues
      } else {
        logger.info(`Google tokens stored for user: ${userId}`);
      }
    } catch (tokenError) {
      logger.warn('Error storing Google tokens:', tokenError);
      // Don't fail the sign-in for token storage issues
    }

    // Validate that we have a valid token before returning
    if (!userSession.session.access_token) {
      logger.error('No access token in session data');
      return res.status(500).json({
        error: 'Failed to generate valid session token'
      });
    }

    // Return successful response
    res.json({
      token: userSession.session.access_token,
      user: {
        id: userSession.user.id,
        email: userSession.user.email,
        full_name: userSession.user.user_metadata?.full_name,
        avatar_url: userSession.user.user_metadata?.avatar_url
      }
    });

  } catch (error) {
    logger.error('Mobile Google sign-in error:', error);
    res.status(500).json({
      error: 'Internal server error'
    });
  }
});

/**
 * POST /api/auth/google/link-account
 * Links a Google account to an existing password-based account
 * Requires password verification for security
 */
router.post('/link-account', async (req, res) => {
  try {
    const { idToken, accessToken, password } = req.body;

    // Validate required fields
    if (!idToken || !accessToken) {
      return res.status(400).json({
        error: 'idToken and accessToken are required'
      });
    }
    
    if (!password) {
      return res.status(400).json({
        error: 'Password is required'
      });
    }

    logger.info('Processing account linking request');

    // Verify Google ID token
    let decodedToken;
    try {
      decodedToken = await verifyGoogleIdToken(idToken);
    } catch (error) {
      logger.error('Google ID token verification failed:', error);
      
      // Handle specific error types
      if (error.message === 'Email must be verified') {
        return res.status(400).json({
          error: 'Email must be verified'
        });
      }
      
      return res.status(401).json({
        error: 'Invalid Google token'
      });
    }

    const { email } = decodedToken;
    logger.info(`Account linking attempt for email: ${email}`);

    // Check if user exists
    const { user: existingUser, error: getUserError } = await findUserByEmail(email);

    if (getUserError || !existingUser?.id) {
      logger.error('User not found for linking:', getUserError);
      return res.status(404).json({
        error: 'User not found'
      });
    }

    const userId = existingUser.id;

    // Verify password by attempting to sign in
    const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
      email,
      password
    });

    if (signInError) {
      logger.warn(`Invalid password for account linking: ${email}`);
      return res.status(401).json({
        error: 'Invalid password'
      });
    }

    // Password is correct - update user to enable Google auth
    try {
      const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(userId, {
        user_metadata: {
          ...(existingUserRow?.raw_user_meta_data || {}),
          google_linked: true,
          google_linked_at: new Date().toISOString()
        }
      });

      if (updateError) {
        logger.error('Error updating user for Google linking:', updateError);
        return res.status(500).json({
          error: 'Failed to link accounts'
        });
      }

      logger.info(`Account linked successfully for user: ${userId}`);
    } catch (updateError) {
      logger.error('Error updating user metadata:', updateError);
      return res.status(500).json({
        error: 'Failed to link accounts'
      });
    }

    // Store Google tokens for calendar integration
    try {
      const { error: tokenError } = await supabaseAdmin
        .from('google_tokens')
        .upsert({
          user_id: userId,
          access_token: accessToken,
          token_type: 'Bearer',
          scope: 'https://www.googleapis.com/auth/calendar.events.readonly',
          expiry_date: Date.now() + (3600 * 1000) // 1 hour from now
        });

      if (tokenError) {
        logger.warn('Failed to store Google tokens during linking:', tokenError);
        // Don't fail the linking for token storage issues
      } else {
        logger.info(`Google tokens stored during linking for user: ${userId}`);
      }
    } catch (tokenError) {
      logger.warn('Error storing Google tokens during linking:', tokenError);
      // Don't fail the linking for token storage issues
    }

    // Return successful response with session
    res.json({
      token: signInData.session.access_token,
      user: {
        id: signInData.user.id,
        email: signInData.user.email,
        full_name: signInData.user.user_metadata?.full_name,
        avatar_url: signInData.user.user_metadata?.avatar_url
      }
    });

  } catch (error) {
    logger.error('Account linking error:', error);
    res.status(500).json({
      error: 'Internal server error'
    });
  }
});

/**
 * DELETE /api/auth/google/delete-user (ADMIN ONLY - for testing)
 * Deletes a user by email - use only for development/testing
 */
router.delete('/delete-user', async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        error: 'Email is required'
      });
    }

    logger.info(`Admin delete user request for email: ${email}`);

    // Find the user
    const { user: existingUser, error: getUserError } = await findUserByEmail(email);

    if (getUserError || !existingUser?.id) {
      return res.status(404).json({
        error: 'User not found'
      });
    }

    // Delete the user
    const { error: deleteError } = await supabaseAdmin.auth.admin.deleteUser(existingUser.id);

    if (deleteError) {
      logger.error('Error deleting user:', deleteError);
      return res.status(500).json({
        error: 'Failed to delete user'
      });
    }

    // Also delete from google_tokens table if exists
    try {
      await supabaseAdmin
        .from('google_tokens')
        .delete()
        .eq('user_id', existingUser.id);
    } catch (tokenError) {
      logger.warn('Error deleting Google tokens:', tokenError);
      // Don't fail the deletion for token cleanup issues
    }

    logger.info(`User deleted successfully: ${existingUser.id}`);
    res.json({
      message: 'User deleted successfully',
      userId: existingUser.id
    });

  } catch (error) {
    logger.error('Delete user error:', error);
    res.status(500).json({
      error: 'Internal server error'
    });
  }
});

export default router;
