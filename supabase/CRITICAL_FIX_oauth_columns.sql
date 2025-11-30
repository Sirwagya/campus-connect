-- =====================================================
-- CRITICAL FIX: Add Google OAuth Columns to Users Table
-- =====================================================
-- This fixes the 500/401 errors on /api/alerts/sync
-- Run this in your Supabase SQL Editor NOW

-- Add Google OAuth token columns to users table
ALTER TABLE public.users
ADD COLUMN IF NOT EXISTS google_access_token TEXT,
ADD COLUMN IF NOT EXISTS google_refresh_token TEXT,
ADD COLUMN IF NOT EXISTS token_expiry TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW(),
ADD COLUMN IF NOT EXISTS last_sync TIMESTAMPTZ;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_users_updated_at 
ON public.users(updated_at);

CREATE INDEX IF NOT EXISTS idx_users_token_expiry 
ON public.users(token_expiry);

-- Create auto-update trigger for updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_users_updated_at ON public.users;
CREATE TRIGGER update_users_updated_at
  BEFORE UPDATE ON public.users
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Verify the columns were created
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_schema = 'public' 
  AND table_name = 'users' 
  AND column_name IN (
    'google_access_token', 
    'google_refresh_token', 
    'token_expiry', 
    'updated_at',
    'last_sync'
  )
ORDER BY column_name;

-- You should see 5 rows returned
-- If you do, the migration was successful! ✅
