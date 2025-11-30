-- Add new fields to profiles table
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS batch text,
ADD COLUMN IF NOT EXISTS department text,
ADD COLUMN IF NOT EXISTS resume_url text;

-- Add new fields to coding_integrations table
ALTER TABLE profile_integrations
ADD COLUMN IF NOT EXISTS codechef_username text,
ADD COLUMN IF NOT EXISTS hackerrank_username text;

-- Add new fields to coding_stats_unified table
ALTER TABLE coding_stats_unified
ADD COLUMN IF NOT EXISTS codechef_rating integer DEFAULT 0,
ADD COLUMN IF NOT EXISTS codechef_global_rank integer DEFAULT 0,
ADD COLUMN IF NOT EXISTS hackerrank_badges integer DEFAULT 0,
ADD COLUMN IF NOT EXISTS hackerrank_certificates integer DEFAULT 0;
