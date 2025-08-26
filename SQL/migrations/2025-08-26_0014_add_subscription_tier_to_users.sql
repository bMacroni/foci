-- Migration: Add subscription_tier to users table
-- Date: 2025-01-27
-- Description: Adds subscription_tier column to users table for calendar sync tier management

-- Create subscription tier enum if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'subscription_tier_enum') THEN
    CREATE TYPE public.subscription_tier_enum AS ENUM ('free', 'basic', 'premium');
  END IF;
END$$;

-- Add subscription_tier column to users table (if not exists)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'users' 
    AND column_name = 'subscription_tier'
  ) THEN
    ALTER TABLE public.users 
    ADD COLUMN subscription_tier public.subscription_tier_enum NULL DEFAULT 'free'::subscription_tier_enum;
  END IF;
END$$;

-- Create index for better performance on subscription tier queries
CREATE INDEX IF NOT EXISTS idx_users_subscription_tier ON public.users(subscription_tier);
CREATE INDEX IF NOT EXISTS idx_users_last_login ON public.users(last_login);

-- Add comment to document the subscription tier field
COMMENT ON COLUMN public.users.subscription_tier IS 'User subscription tier: free (no sync), basic (60-day sync), or premium (365-day sync)';

-- Update existing users to have 'free' tier if they don't have one set
UPDATE public.users 
SET subscription_tier = 'free'::subscription_tier_enum 
WHERE subscription_tier IS NULL;
