-- ================================================================
-- SAFE MIGRATION - Based on actual schema.sql
-- Version: 20251201_140000
-- All statements are idempotent (safe to re-run)
-- ================================================================

-- ================================================================
-- PHASE 1: Add new columns to EXISTING tables
-- (Only columns that DON'T already exist in schema.sql)
-- ================================================================

-- Users: Add optional enhancement columns
ALTER TABLE public.users 
  ADD COLUMN IF NOT EXISTS last_seen timestamptz;

-- Profiles: Add follower tracking columns  
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS location text,
  ADD COLUMN IF NOT EXISTS website text,
  ADD COLUMN IF NOT EXISTS follower_count integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS following_count integer NOT NULL DEFAULT 0;

-- Events: Add new feature columns
ALTER TABLE public.events
  ADD COLUMN IF NOT EXISTS slug citext UNIQUE,
  ADD COLUMN IF NOT EXISTS venue_maps_url text,
  ADD COLUMN IF NOT EXISTS registration_opens_at timestamptz,
  ADD COLUMN IF NOT EXISTS registration_closes_at timestamptz,
  ADD COLUMN IF NOT EXISTS category text,
  ADD COLUMN IF NOT EXISTS tags text[] DEFAULT '{}'::text[],
  ADD COLUMN IF NOT EXISTS is_featured boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS banner_url text,
  ADD COLUMN IF NOT EXISTS color_theme text DEFAULT '#6366f1';

-- Spaces: Add stats columns (icon_url and member_count may already exist)
ALTER TABLE public.spaces
  ADD COLUMN IF NOT EXISTS message_count integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS settings jsonb DEFAULT '{}'::jsonb;

-- Space members: Add notification settings
ALTER TABLE public.space_members
  ADD COLUMN IF NOT EXISTS last_read_at timestamptz,
  ADD COLUMN IF NOT EXISTS notification_settings jsonb DEFAULT '{"mentions": true, "all_messages": false}'::jsonb;

-- Posts: Add engagement columns (some may already exist)
ALTER TABLE public.posts
  ADD COLUMN IF NOT EXISTS share_count integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS is_pinned boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS is_locked boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS edited_at timestamptz;

-- Comments: Add like count and parent for threading
ALTER TABLE public.comments
  ADD COLUMN IF NOT EXISTS like_count integer DEFAULT 0,
  ADD COLUMN IF NOT EXISTS parent_id uuid REFERENCES public.comments(id);

-- ================================================================
-- PHASE 2: Create NEW tables
-- ================================================================

-- Follows table (social graph)
CREATE TABLE IF NOT EXISTS public.follows (
  follower_id uuid REFERENCES public.users(id) ON DELETE CASCADE,
  following_id uuid REFERENCES public.users(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now() NOT NULL,
  PRIMARY KEY (follower_id, following_id),
  CHECK (follower_id != following_id)
);

-- Typing indicators (real-time)
CREATE TABLE IF NOT EXISTS public.typing_indicators (
  channel_id uuid NOT NULL REFERENCES public.space_channels(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  started_at timestamptz DEFAULT now() NOT NULL,
  PRIMARY KEY (channel_id, user_id)
);

-- Presence system (online status)
CREATE TABLE IF NOT EXISTS public.presence (
  user_id uuid PRIMARY KEY REFERENCES public.users(id) ON DELETE CASCADE,
  status text NOT NULL DEFAULT 'offline' CHECK (status IN ('online', 'away', 'busy', 'offline')),
  last_seen timestamptz DEFAULT now() NOT NULL,
  custom_status text,
  updated_at timestamptz DEFAULT now() NOT NULL
);

-- Unified reactions (replaces post_reactions with more flexibility)
CREATE TABLE IF NOT EXISTS public.reactions (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  target_type text NOT NULL CHECK (target_type IN ('post', 'comment')),
  target_id uuid NOT NULL,
  user_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  emoji text NOT NULL DEFAULT 'like' CHECK (emoji IN ('like', 'love', 'celebrate', 'support', 'insightful', 'funny')),
  created_at timestamptz DEFAULT now() NOT NULL,
  UNIQUE (target_type, target_id, user_id)
);

-- Audit log (compliance/security)
CREATE TABLE IF NOT EXISTS public.audit_log (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES public.users(id) ON DELETE SET NULL,
  action text NOT NULL CHECK (action IN ('create', 'update', 'delete', 'login', 'logout', 'failed_login', 'export_data', 'delete_account')),
  resource_type text NOT NULL,
  resource_id uuid,
  old_values jsonb,
  new_values jsonb,
  ip_address inet,
  user_agent text,
  created_at timestamptz DEFAULT now() NOT NULL
);

-- GDPR: Data export requests
CREATE TABLE IF NOT EXISTS public.data_export_requests (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
  export_url text,
  expires_at timestamptz,
  requested_at timestamptz DEFAULT now() NOT NULL,
  completed_at timestamptz
);

-- GDPR: Account deletions
CREATE TABLE IF NOT EXISTS public.account_deletions (
  user_id uuid PRIMARY KEY REFERENCES public.users(id) ON DELETE CASCADE,
  requested_at timestamptz DEFAULT now() NOT NULL,
  scheduled_for timestamptz NOT NULL DEFAULT now() + interval '30 days',
  reason text,
  completed_at timestamptz
);

-- Coding stats history (time series)
CREATE TABLE IF NOT EXISTS public.coding_stats_history (
  user_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  platform text NOT NULL,
  metric_name text NOT NULL,
  metric_value numeric NOT NULL,
  recorded_at timestamptz DEFAULT now() NOT NULL,
  PRIMARY KEY (user_id, platform, metric_name, recorded_at)
);

-- XP tracking
CREATE TABLE IF NOT EXISTS public.user_xp (
  user_id uuid PRIMARY KEY REFERENCES public.users(id) ON DELETE CASCADE,
  github_xp integer NOT NULL DEFAULT 0,
  leetcode_xp integer NOT NULL DEFAULT 0,
  codeforces_xp integer NOT NULL DEFAULT 0,
  codechef_xp integer NOT NULL DEFAULT 0,
  hackerrank_xp integer NOT NULL DEFAULT 0,
  event_xp integer NOT NULL DEFAULT 0,
  post_xp integer NOT NULL DEFAULT 0,
  total_xp integer NOT NULL DEFAULT 0,
  level text NOT NULL DEFAULT 'beginner',
  level_progress numeric(5,2) NOT NULL DEFAULT 0,
  last_calculated_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);

-- ================================================================
-- PHASE 3: Create indexes (all use IF NOT EXISTS)
-- ================================================================

-- Follows indexes
CREATE INDEX IF NOT EXISTS idx_follows_follower ON public.follows(follower_id);
CREATE INDEX IF NOT EXISTS idx_follows_following ON public.follows(following_id);

-- Presence indexes
CREATE INDEX IF NOT EXISTS idx_presence_status ON public.presence(status, last_seen DESC) WHERE status != 'offline';

-- Reactions indexes
CREATE INDEX IF NOT EXISTS idx_reactions_target ON public.reactions(target_type, target_id);
CREATE INDEX IF NOT EXISTS idx_reactions_user ON public.reactions(user_id, created_at DESC);

-- Audit log indexes
CREATE INDEX IF NOT EXISTS idx_audit_log_user ON public.audit_log(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_log_resource ON public.audit_log(resource_type, resource_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_log_action ON public.audit_log(action, created_at DESC);

-- Stats history indexes
CREATE INDEX IF NOT EXISTS idx_stats_history_user ON public.coding_stats_history(user_id, recorded_at DESC);
CREATE INDEX IF NOT EXISTS idx_stats_history_platform ON public.coding_stats_history(platform, recorded_at DESC);

-- User XP indexes
CREATE INDEX IF NOT EXISTS idx_user_xp_total ON public.user_xp(total_xp DESC);
CREATE INDEX IF NOT EXISTS idx_user_xp_level ON public.user_xp(level);

-- Users indexes (based on actual columns)
CREATE INDEX IF NOT EXISTS idx_users_email ON public.users(email);
CREATE INDEX IF NOT EXISTS idx_users_last_seen ON public.users(last_seen DESC);

-- Profiles indexes
CREATE INDEX IF NOT EXISTS idx_profiles_xp ON public.profiles(xp DESC);

-- Events indexes
CREATE INDEX IF NOT EXISTS idx_events_status_start ON public.events(status, start_ts DESC);
CREATE INDEX IF NOT EXISTS idx_events_category ON public.events(category, start_ts DESC);
CREATE INDEX IF NOT EXISTS idx_events_slug ON public.events(slug);
CREATE INDEX IF NOT EXISTS idx_events_featured ON public.events(is_featured, start_ts DESC);
CREATE INDEX IF NOT EXISTS idx_events_tags ON public.events USING gin(tags);
CREATE INDEX IF NOT EXISTS idx_events_created_by ON public.events(created_by);

-- Posts indexes
CREATE INDEX IF NOT EXISTS idx_posts_user_created ON public.posts(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_posts_visibility_created ON public.posts(visibility, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_posts_pinned ON public.posts(is_pinned, created_at DESC);

-- Comments indexes
CREATE INDEX IF NOT EXISTS idx_comments_post ON public.comments(post_id, created_at);
CREATE INDEX IF NOT EXISTS idx_comments_parent ON public.comments(parent_id) WHERE parent_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_comments_user ON public.comments(user_id, created_at DESC);

-- Spaces indexes (additional) - based on actual columns
CREATE INDEX IF NOT EXISTS idx_spaces_visibility ON public.spaces(visibility);
CREATE INDEX IF NOT EXISTS idx_spaces_created_by ON public.spaces(created_by);
CREATE INDEX IF NOT EXISTS idx_spaces_owner_id ON public.spaces(owner_id);
CREATE INDEX IF NOT EXISTS idx_spaces_member_count ON public.spaces(member_count DESC);

-- Space members indexes (additional)
CREATE INDEX IF NOT EXISTS idx_space_members_user ON public.space_members(user_id, status);

-- Space messages indexes
CREATE INDEX IF NOT EXISTS idx_space_messages_channel ON public.space_messages(channel_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_space_messages_space ON public.space_messages(space_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_space_messages_user ON public.space_messages(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_space_messages_reply ON public.space_messages(reply_to) WHERE reply_to IS NOT NULL;

-- ================================================================
-- PHASE 4: Create functions and triggers
-- ================================================================

-- Auto-update follower counts
CREATE OR REPLACE FUNCTION update_follower_counts() RETURNS trigger AS $$
BEGIN
  IF (TG_OP = 'INSERT') THEN
    UPDATE profiles SET follower_count = follower_count + 1 WHERE id = NEW.following_id;
    UPDATE profiles SET following_count = following_count + 1 WHERE id = NEW.follower_id;
  ELSIF (TG_OP = 'DELETE') THEN
    UPDATE profiles SET follower_count = GREATEST(0, follower_count - 1) WHERE id = OLD.following_id;
    UPDATE profiles SET following_count = GREATEST(0, following_count - 1) WHERE id = OLD.follower_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_follower_counts_trigger ON public.follows;
CREATE TRIGGER update_follower_counts_trigger
  AFTER INSERT OR DELETE ON public.follows
  FOR EACH ROW EXECUTE FUNCTION update_follower_counts();

-- Auto-update reaction counts
CREATE OR REPLACE FUNCTION update_reaction_counts() RETURNS trigger AS $$
BEGIN
  IF (TG_OP = 'INSERT') THEN
    IF NEW.target_type = 'post' THEN
      UPDATE posts SET like_count = like_count + 1 WHERE id = NEW.target_id;
    ELSIF NEW.target_type = 'comment' THEN
      UPDATE comments SET like_count = COALESCE(like_count, 0) + 1 WHERE id = NEW.target_id;
    END IF;
  ELSIF (TG_OP = 'DELETE') THEN
    IF OLD.target_type = 'post' THEN
      UPDATE posts SET like_count = GREATEST(0, like_count - 1) WHERE id = OLD.target_id;
    ELSIF OLD.target_type = 'comment' THEN
      UPDATE comments SET like_count = GREATEST(0, COALESCE(like_count, 0) - 1) WHERE id = OLD.target_id;
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_reaction_counts_trigger ON public.reactions;
CREATE TRIGGER update_reaction_counts_trigger
  AFTER INSERT OR DELETE ON public.reactions
  FOR EACH ROW EXECUTE FUNCTION update_reaction_counts();

-- Auto-cleanup old typing indicators
CREATE OR REPLACE FUNCTION cleanup_typing_indicators() RETURNS trigger AS $$
BEGIN
  DELETE FROM typing_indicators WHERE started_at < now() - interval '10 seconds';
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS cleanup_typing_trigger ON public.typing_indicators;
CREATE TRIGGER cleanup_typing_trigger
  AFTER INSERT ON public.typing_indicators
  EXECUTE FUNCTION cleanup_typing_indicators();

-- Atomic participant count increment (race condition safe)
CREATE OR REPLACE FUNCTION increment_participants(event_uuid uuid)
RETURNS void AS $$
DECLARE
  current_capacity int;
  current_count int;
BEGIN
  SELECT capacity, participants_count INTO current_capacity, current_count
    FROM events WHERE id = event_uuid FOR UPDATE;

  IF current_capacity IS NOT NULL AND current_count >= current_capacity THEN
    RAISE EXCEPTION 'Event is full';
  END IF;

  UPDATE events SET participants_count = participants_count + 1 WHERE id = event_uuid;
END;
$$ LANGUAGE plpgsql;

-- Update presence trigger
CREATE OR REPLACE FUNCTION update_presence_timestamp() RETURNS trigger AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS set_timestamp_presence ON public.presence;
CREATE TRIGGER set_timestamp_presence
  BEFORE UPDATE ON public.presence
  FOR EACH ROW EXECUTE FUNCTION update_presence_timestamp();

-- ================================================================
-- PHASE 5: Create materialized view for stats
-- ================================================================

DROP MATERIALIZED VIEW IF EXISTS coding_stats_current;
CREATE MATERIALIZED VIEW coding_stats_current AS
SELECT
  user_id,
  MAX(CASE WHEN platform = 'github' AND metric_name = 'contributions' THEN metric_value END) AS github_contributions,
  MAX(CASE WHEN platform = 'github' AND metric_name = 'repos' THEN metric_value END) AS github_repos,
  MAX(CASE WHEN platform = 'leetcode' AND metric_name = 'solved' THEN metric_value END) AS leetcode_solved,
  MAX(CASE WHEN platform = 'leetcode' AND metric_name = 'ranking' THEN metric_value END) AS leetcode_ranking,
  MAX(CASE WHEN platform = 'codeforces' AND metric_name = 'rating' THEN metric_value END) AS codeforces_rating,
  MAX(CASE WHEN platform = 'codechef' AND metric_name = 'rating' THEN metric_value END) AS codechef_rating,
  MAX(CASE WHEN platform = 'hackerrank' AND metric_name = 'badges' THEN metric_value END) AS hackerrank_badges,
  MAX(recorded_at) AS last_updated
FROM coding_stats_history
WHERE recorded_at > now() - interval '7 days'
GROUP BY user_id;

CREATE UNIQUE INDEX IF NOT EXISTS idx_stats_current_user ON coding_stats_current(user_id);

-- ================================================================
-- SUCCESS MESSAGE
-- ================================================================

DO $$ 
BEGIN 
  RAISE NOTICE '✅ Migration 20251201_140000 completed successfully!';
  RAISE NOTICE 'Added: New tables (follows, presence, reactions, audit_log, etc.)';
  RAISE NOTICE 'Added: Indexes for performance';
  RAISE NOTICE 'Added: Triggers for auto-updating counts';
END $$;
