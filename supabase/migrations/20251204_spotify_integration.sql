-- Migration: Add Spotify Integration Fields
-- Version: 20251204_spotify_integration
-- Description: Add fields needed for Spotify OAuth and presence

-- Add external_data column to profile_integrations for storing OAuth tokens
ALTER TABLE public.profile_integrations
ADD COLUMN IF NOT EXISTS external_data jsonb DEFAULT '{}';

-- Add verified column if missing
ALTER TABLE public.profile_integrations
ADD COLUMN IF NOT EXISTS verified boolean DEFAULT false;

-- Add is_public column if missing
ALTER TABLE public.profile_integrations
ADD COLUMN IF NOT EXISTS is_public boolean DEFAULT true;

-- Add updated_at column if missing
ALTER TABLE public.profile_integrations
ADD COLUMN IF NOT EXISTS updated_at timestamptz DEFAULT now();

-- Create unique constraint for user_id + platform if not exists
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'profile_integrations_user_platform_unique'
  ) THEN
    ALTER TABLE public.profile_integrations
    ADD CONSTRAINT profile_integrations_user_platform_unique 
    UNIQUE (user_id, platform);
  END IF;
EXCEPTION
  WHEN duplicate_table THEN NULL;
END $$;

-- Create index on platform for faster lookups
CREATE INDEX IF NOT EXISTS idx_profile_integrations_platform 
ON public.profile_integrations(platform);

-- Create index on user_id + platform
CREATE INDEX IF NOT EXISTS idx_profile_integrations_user_platform 
ON public.profile_integrations(user_id, platform);

-- Success message
DO $$
BEGIN
  RAISE NOTICE 'Migration 20251204_spotify_integration completed successfully!';
  RAISE NOTICE 'Added: external_data, verified, is_public, updated_at columns to profile_integrations';
END $$;
