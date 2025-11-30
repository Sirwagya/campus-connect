-- Gmail Integration Database Schema
-- Run this in your Supabase SQL Editor

-- Add Gmail token columns to users table
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS google_access_token TEXT,
ADD COLUMN IF NOT EXISTS google_refresh_token TEXT,
ADD COLUMN IF NOT EXISTS token_expiry TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS last_sync TIMESTAMPTZ;

-- Create index for faster token lookups
CREATE INDEX IF NOT EXISTS idx_users_token_expiry ON users(token_expiry);

-- Add comment
COMMENT ON COLUMN users.google_access_token IS 'Google access token for Gmail API';
COMMENT ON COLUMN users.google_refresh_token IS 'Google refresh token for token renewal';
COMMENT ON COLUMN users.token_expiry IS 'When the access token expires';
COMMENT ON COLUMN users.last_sync IS 'Last time Gmail was synced for this user';
