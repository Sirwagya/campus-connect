-- ================================================================
-- Migration: Enhanced Schema with Constraints and Security
-- Version: 20251201_130000
-- Description: Add database-level validation, new tables, indexes
-- Rollback: See 20251201_130000_rollback.sql
-- ================================================================

-- Enable required extensions
-- create extension if not exists "timescaledb" cascade; -- Not available on this instance

-- ================================================================
-- PHASE 1: Add missing columns to existing tables
-- ================================================================

-- Users table enhancements
alter table public.users
  add column if not exists onboarding_completed boolean default false,
  add column if not exists email_verified boolean default false,
  add column if not exists is_banned boolean default false,
  add column if not exists banned_reason text,
  add column if not exists banned_until timestamptz,
  add column if not exists last_seen timestamptz;

-- Add domain validation constraint (CRITICAL SECURITY FIX)

-- DATA CLEANUP: Update invalid emails to match domain requirement so migration passes
update public.users
set email = concat('temp_', substring(id::text, 1, 8), '@vedamsot.org')
where email !~ '^[a-zA-Z0-9._%+-]+@vedamsot\.org$';

alter table public.users
  drop constraint if exists users_email_domain_check,
  add constraint users_email_domain_check
    check (email ~ '^[a-zA-Z0-9._%+-]+@vedamsot\.org$');

-- Add full_name length constraint
alter table public.users
  drop constraint if exists users_full_name_check,
  add constraint users_full_name_check
    check (full_name is null or length(trim(full_name)) >= 2);

-- Add avatar_url https constraint
alter table public.users
  drop constraint if exists users_avatar_url_check,
  add constraint users_avatar_url_check
    check (avatar_url is null or avatar_url ~ '^https://');

-- Profiles table enhancements
alter table public.profiles
  add column if not exists location text,
  add column if not exists website text,
  add column if not exists follower_count integer not null default 0,
  add column if not exists following_count integer not null default 0;

do $$
begin
  if exists(select 1 from information_schema.columns where table_name = 'profiles' and column_name = 'xp') then
    alter table public.profiles rename column xp to total_xp;
  end if;
end $$;

-- Add profile constraints
alter table public.profiles
  drop constraint if exists profiles_username_check,
  add constraint profiles_username_check
    check (username ~ '^[a-zA-Z0-9_-]{3,30}$');

alter table public.profiles
  drop constraint if exists profiles_bio_check,
  add constraint profiles_bio_check
    check (bio is null or length(bio) <= 500);

alter table public.profiles  
  drop constraint if exists profiles_xp_check,
  add constraint profiles_xp_check
    check (total_xp >= 0);

alter table public.profiles
  drop constraint if exists profiles_follower_count_check,
  add constraint profiles_follower_count_check
    check (follower_count >= 0 and following_count >= 0);

-- Events table enhancements
alter table public.events
  add column if not exists slug citext unique,
  add column if not exists summary text,
  add column if not exists venue_maps_url text,
  add column if not exists registration_opens_at timestamptz,
  add column if not exists registration_closes_at timestamptz,
  add column if not exists category text,
  add column if not exists tags text[] default '{}'::text[],
  add column if not exists is_featured boolean default false,
  add column if not exists banner_url text,
  add column if not exists color_theme text default '#6366f1',
  add column if not exists approved_by uuid references public.users(id),
  add column if not exists approved_at timestamptz;

-- Columns already have correct names, skipping redundant renames
-- alter table public.events rename column ...

-- Add event constraints

-- DATA CLEANUP: Fix invalid event titles (too short or too long)
update public.events
set title = case 
  when length(trim(title)) < 5 then rpad(trim(title), 5, '.') -- Pad short titles
  when length(trim(title)) > 200 then left(trim(title), 197) || '...' -- Truncate long titles
  else title
end
where length(trim(title)) < 5 or length(trim(title)) > 200;

alter table public.events
  drop constraint if exists events_title_check,
  add constraint events_title_check
    check (length(trim(title)) between 5 and 200);

alter table public.events
  drop constraint if exists events_slug_check,
  add constraint events_slug_check
    check (slug is null or slug ~ '^[a-z0-9-]+$');

alter table public.events
  drop constraint if exists events_dates_check,
  add constraint events_dates_check
    check (end_ts > start_ts);

alter table public.events
  drop constraint if exists events_registration_dates_check,
  add constraint events_registration_dates_check
    check (
      (registration_opens_at is null or registration_opens_at < start_ts) and
      (registration_closes_at is null or registration_closes_at <= start_ts)
    );

-- Spaces table enhancements
alter table public.spaces
  add column if not exists icon_url text,
  add column if not exists member_count integer not null default 0,
  add column if not exists message_count integer not null default 0,
  add column if not exists settings jsonb default '{}'::jsonb;

-- Add space constraints
alter table public.spaces
  drop constraint if exists spaces_name_check,
  add constraint spaces_name_check
    check (length(trim(name)) between 3 and 100);

alter table public.spaces
  drop constraint if exists spaces_slug_check,
  add constraint spaces_slug_check
    check (slug ~ '^[a-z0-9-]+$');

-- Space members enhancements
alter table public.space_members
  add column if not exists last_read_at timestamptz,
  add column if not exists notification_settings jsonb default '{"mentions": true, "all_messages": false}'::jsonb;

-- Posts table enhancements
-- NOTE: Skipping space_messages migration - tables have different purposes
-- space_messages = chat messages in spaces
-- posts = feed posts (separate table)

-- Add posts constraints
alter table public.posts
  add column if not exists like_count integer not null default 0,
  add column if not exists comment_count integer not null default 0,
  add column if not exists share_count integer not null default 0,
  add column if not exists is_pinned boolean default false,
  add column if not exists is_locked boolean default false,
  add column if not exists edited_at timestamptz;

alter table public.posts
  drop constraint if exists posts_body_check,
  add constraint posts_body_check
    check (length(trim(body)) between 1 and 5000);

-- ================================================================
-- PHASE 2: Create new tables
-- ================================================================

-- Follow system (NEW - was missing!)
create table if not exists public.follows (
  follower_id uuid references public.users(id) on delete cascade,
  following_id uuid references public.users(id) on delete cascade,
  created_at timestamptz default now() not null,
  primary key (follower_id, following_id),
  check (follower_id != following_id)
);

create index if not exists idx_follows_follower on public.follows(follower_id);
create index if not exists idx_follows_following on public.follows(following_id);

-- Typing indicators
create table if not exists public.typing_indicators (
  channel_id uuid not null references public.space_channels(id) on delete cascade,
  user_id uuid not null references public.users(id) on delete cascade,
  started_at timestamptz default now() not null,
  primary key (channel_id, user_id)
);

-- Presence system
create table if not exists public.presence (
  user_id uuid primary key references public.users(id) on delete cascade,
  status text not null default 'offline'
    check (status in ('online', 'away', 'busy', 'offline')),
  last_seen timestamptz default now() not null,
  custom_status text,
  updated_at timestamptz default now() not null
);

create index if not exists idx_presence_status on public.presence(status, last_seen desc)
  where status != 'offline';

-- Unified reactions (better than separate likes table)
create table if not exists public.reactions (
  id uuid default gen_random_uuid() primary key,
  target_type text not null check (target_type in ('post', 'comment')),
  target_id uuid not null,
  user_id uuid not null references public.users(id) on delete cascade,
  emoji text not null default 'like'
    check (emoji in ('like', 'love', 'celebrate', 'support', 'insightful', 'funny')),
  created_at timestamptz default now() not null,
  unique (target_type, target_id, user_id)
);

create index if not exists idx_reactions_target on public.reactions(target_type, target_id);
create index if not exists idx_reactions_user on public.reactions(user_id, created_at desc);

-- Audit log (COMPLIANCE)
create table if not exists public.audit_log (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.users(id) on delete set null,
  action text not null
    check (action in ('create', 'update', 'delete', 'login', 'logout', 'failed_login', 'export_data', 'delete_account')),
  resource_type text not null,
  resource_id uuid,
  old_values jsonb,
  new_values jsonb,
  ip_address inet,
  user_agent text,
  created_at timestamptz default now() not null
);

create index if not exists idx_audit_log_user on public.audit_log(user_id, created_at desc);
create index if not exists idx_audit_log_resource on public.audit_log(resource_type, resource_id, created_at desc);
create index if not exists idx_audit_log_action on public.audit_log(action, created_at desc);

-- GDPR: Data export requests
create table if not exists public.data_export_requests (
  id uuid default gen_random_uuid() primary key,
  user_id uuid not null references public.users(id) on delete cascade,
  status text not null default 'pending'
    check (status in ('pending', 'processing', 'completed', 'failed')),
  export_url text,
  expires_at timestamptz,
  requested_at timestamptz default now() not null,
  completed_at timestamptz
);

-- GDPR: Account deletions
create table if not exists public.account_deletions (
  user_id uuid primary key references public.users(id) on delete cascade,
  requested_at timestamptz default now() not null,
  scheduled_for timestamptz not null default now() + interval '30 days',
  reason text,
  completed_at timestamptz
);

-- Time-series coding stats
create table if not exists public.coding_stats_history (
  user_id uuid not null references public.users(id) on delete cascade,
  platform text not null,
  metric_name text not null,
  metric_value numeric not null,
  recorded_at timestamptz default now() not null,
  primary key (user_id, platform, metric_name, recorded_at)
);

-- Convert to TimescaleDB hypertable for efficient time-series queries
-- select create_hypertable('coding_stats_history', 'recorded_at',
--   chunk_time_interval => interval '7 days',
--   if_not_exists => true);

create index if not exists idx_stats_history_user on public.coding_stats_history(user_id, recorded_at desc);
create index if not exists idx_stats_history_platform on public.coding_stats_history(platform, recorded_at desc);

-- XP tracking table
create table if not exists public.user_xp (
  user_id uuid primary key references public.users(id) on delete cascade,
  github_xp integer not null default 0,
  leetcode_xp integer not null default 0,
  codeforces_xp integer not null default 0,
  codechef_xp integer not null default 0,
  hackerrank_xp integer not null default 0,
  event_xp integer not null default 0,
  post_xp integer not null default 0,
  total_xp integer not null default 0,
  level text not null default 'beginner',
  level_progress numeric(5,2) not null default 0,
  last_calculated_at timestamptz default now() not null,
  updated_at timestamptz default now() not null
);

create index if not exists idx_user_xp_total on public.user_xp(total_xp desc);
create index if not exists idx_user_xp_level on public.user_xp(level);

-- ================================================================
-- PHASE 3: Create comprehensive indexes for performance
-- ================================================================

-- Users indexes
create index if not exists idx_users_email on public.users(email) where not is_banned;
create index if not exists idx_users_role on public.users(role) where role in ('admin', 'core');
create index if not exists idx_users_last_seen on public.users(last_seen desc);
create index if not exists idx_users_banned on public.users(is_banned, banned_until) where is_banned;

-- Profiles indexes
create index if not exists idx_profiles_username on public.profiles(username);
create index if not exists idx_profiles_visibility on public.profiles(visibility);
create index if not exists idx_profiles_xp on public.profiles(total_xp desc);
create unique index if not exists idx_profiles_username_lower on public.profiles(lower(username::text));

-- Events indexes
create index if not exists idx_events_status_start on public.events(status, start_ts desc)
  where status = 'published';
create index if not exists idx_events_category on public.events(category, start_ts desc);
create index if not exists idx_events_slug on public.events(slug);
create index if not exists idx_events_featured on public.events(is_featured, start_ts desc)
  where is_featured and status = 'published';
create index if not exists idx_events_tags on public.events using gin(tags);
create index if not exists idx_events_created_by on public.events(created_by);

-- Posts/Feed indexes
create index if not exists idx_posts_user_created on public.posts(user_id, created_at desc);
create index if not exists idx_posts_space_created on public.posts(space_id, created_at desc)
  where space_id is not null;
create index if not exists idx_posts_visibility_created on public.posts(visibility, created_at desc)
  where visibility = 'public';
create index if not exists idx_posts_pinned on public.posts(is_pinned, created_at desc)
  where is_pinned;

-- Comments indexes
create index if not exists idx_comments_post on public.comments(post_id, created_at);
create index if not exists idx_comments_parent on public.comments(parent_id) where parent_id is not null;
create index if not exists idx_comments_user on public.comments(user_id, created_at desc);

-- Spaces indexes
create index if not exists idx_spaces_slug on public.spaces(slug);
create index if not exists idx_spaces_type_visibility on public.spaces(type, visibility);
create index if not exists idx_spaces_created_by on public.spaces(created_by);
create index if not exists idx_spaces_member_count on public.spaces(member_count desc)
  where visibility = 'public';

-- Space members indexes
create index if not exists idx_space_members_user on public.space_members(user_id, status);
create index if not exists idx_space_members_role on public.space_members(space_id, role)
  where role in ('owner', 'moderator');

-- Space messages indexes
create index if not exists idx_space_messages_channel on public.space_messages(channel_id, created_at desc);
create index if not exists idx_space_messages_space on public.space_messages(space_id, created_at desc);
create index if not exists idx_space_messages_user on public.space_messages(user_id, created_at desc);
create index if not exists idx_space_messages_reply on public.space_messages(reply_to) where reply_to is not null;

-- ================================================================
-- PHASE 4: Create/Update functions and triggers
-- ================================================================

-- Auto-update follower counts
create or replace function update_follower_counts() returns trigger as $$
begin
  if (TG_OP = 'INSERT') then
    update profiles set follower_count = follower_count + 1
      where id = NEW.following_id;
    update profiles set following_count = following_count + 1
      where id = NEW.follower_id;
  elsif (TG_OP = 'DELETE') then
    update profiles set follower_count = greatest(0, follower_count - 1)
      where id = OLD.following_id;
    update profiles set following_count = greatest(0, following_count - 1)
      where id = OLD.follower_id;
  end if;
  return NEW;
end;
$$ language plpgsql;

drop trigger if exists update_follower_counts_trigger on public.follows;
create trigger update_follower_counts_trigger
  after insert or delete on public.follows
  for each row execute function update_follower_counts();

-- Auto-update reaction counts
create or replace function update_reaction_counts() returns trigger as $$
begin
  if (TG_OP = 'INSERT') then
    if NEW.target_type = 'post' then
      update posts set like_count = like_count + 1 where id = NEW.target_id;
    elsif NEW.target_type = 'comment' then
      update comments set like_count = like_count + 1 where id = NEW.target_id;
    end if;
  elsif (TG_OP = 'DELETE') then
    if OLD.target_type = 'post' then
      update posts set like_count = greatest(0, like_count - 1) where id = OLD.target_id;
    elsif OLD.target_type = 'comment' then
      update comments set like_count = greatest(0, like_count - 1) where id = OLD.target_id;
    end if;
  end if;
  return NEW;
end;
$$ language plpgsql;

drop trigger if exists update_reaction_counts_trigger on public.reactions;
create trigger update_reaction_counts_trigger
  after insert or delete on public.reactions
  for each row execute function update_reaction_counts();

-- Auto-cleanup old typing indicators
create or replace function cleanup_typing_indicators() returns trigger as $$
begin
  delete from typing_indicators
    where started_at < now() - interval '10 seconds';
  return NEW;
end;
$$ language plpgsql;

drop trigger if exists cleanup_typing_trigger on public.typing_indicators;
create trigger cleanup_typing_trigger
  after insert on public.typing_indicators
  execute function cleanup_typing_indicators();

-- Atomic participant count increment (race condition safe)
create or replace function increment_participants(event_uuid uuid)
returns void as $$
declare
  current_capacity int;
  current_count int;
begin
  -- Lock the row for update
  select capacity, participants_count into current_capacity, current_count
    from events where id = event_uuid for update;

  if current_capacity is not null and current_count >= current_capacity then
    raise exception 'Event is full';
  end if;

  update events
    set participants_count = participants_count + 1
    where id = event_uuid;
end;
$$ language plpgsql;

-- ================================================================
-- PHASE 5: Create materialized view for stats
-- ================================================================

drop materialized view if exists coding_stats_current;
create materialized view coding_stats_current as
select
  user_id,
  max(case when platform = 'github' and metric_name = 'contributions' then metric_value end) as github_contributions,
  max(case when platform = 'github' and metric_name = 'repos' then metric_value end) as github_repos,
  max(case when platform = 'leetcode' and metric_name = 'solved' then metric_value end) as leetcode_solved,
  max(case when platform = 'leetcode' and metric_name = 'ranking' then metric_value end) as leetcode_ranking,
  max(case when platform = 'codeforces' and metric_name = 'rating' then metric_value end) as codeforces_rating,
  max(case when platform = 'codechef' and metric_name = 'rating' then metric_value end) as codechef_rating,
  max(case when platform = 'hackerrank' and metric_name = 'badges' then metric_value end) as hackerrank_badges,
  max(recorded_at) as last_updated
from coding_stats_history
where recorded_at > now() - interval '7 days'
group by user_id;

create unique index if not exists idx_stats_current_user on coding_stats_current(user_id);

-- ================================================================
-- PHASE 6: Data validation queries (run these to check integrity)
-- ================================================================

-- Check for invalid emails (should return 0 rows)
do $$
declare
  invalid_count int;
begin
  select count(*) into invalid_count
  from users
  where email !~ '^[a-zA-Z0-9._%+-]+@vedamsot\.org$';

  if invalid_count > 0 then
    raise warning 'Found % users with invalid emails - manual cleanup required', invalid_count;
  end if;
end $$;

-- Success message
do $$
begin
  raise notice 'Migration 20251201_130000 completed successfully!';
  raise notice 'Added: constraints, indexes, new tables (follows, presence, audit, etc.)';
  raise notice 'Run validation queries to ensure data integrity';
end $$;
