-- ================================================================
-- ROLLBACK Migration: 202512011300_schema_enhancements
-- Version: 20251201_130000_rollback
-- Description: Safely rollback schema enhancements while preserving data
-- ================================================================

-- WARNING: This rollback will:
-- 1. Drop new tables (audit_log, follows, presence, etc.)
-- 2. Remove new constraints (some data may become invalid after rollback)
-- 3. Drop new indexes
-- Run with caution and ensure you have a backup!

-- ================================================================
-- PHASE 1: Drop new tables (reverse order of creation)
-- ================================================================

drop materialized view if exists coding_stats_current cascade;
drop table if exists user_xp cascade;
drop table if exists coding_stats_history cascade;
drop table if exists account_deletions cascade;
drop table if exists data_export_requests cascade;
drop table if exists audit_log cascade;
drop table if exists reactions cascade;
drop table if exists presence cascade;
drop table if exists typing_indicators cascade;
drop table if exists follows cascade;

-- ================================================================
-- PHASE 2: Drop new functions and triggers
-- ================================================================

drop trigger if exists update_follower_counts_trigger on public.follows;
drop function if exists update_follower_counts() cascade;

drop trigger if exists update_reaction_counts_trigger on public.reactions;
drop function if exists update_reaction_counts() cascade;

drop trigger if exists cleanup_typing_trigger on public.typing_indicators;
drop function if exists cleanup_typing_indicators() cascade;

drop function if exists increment_participants(uuid) cascade;

-- ================================================================
-- PHASE 3: Drop new indexes
-- ================================================================

-- Users
drop index if exists public.idx_users_email;
drop index if exists public.idx_users_role;
drop index if exists public.idx_users_last_seen;
drop index if exists public.idx_users_banned;

-- Profiles
drop index if exists public.idx_profiles_username;
drop index if exists public.idx_profiles_visibility;
drop index if exists public.idx_profiles_xp;
drop index if exists public.idx_profiles_username_lower;

-- Events
drop index if exists public.idx_events_status_start;
drop index if exists public.idx_events_category;
drop index if exists public.idx_events_slug;
drop index if exists public.idx_events_featured;
drop index if exists public.idx_events_tags;
drop index if exists public.idx_events_created_by;

-- Posts
drop index if exists public.idx_posts_user_created;
drop index if exists public.idx_posts_space_created;
drop index if exists public.idx_posts_visibility_created;
drop index if exists public.idx_posts_pinned;

-- Comments
drop index if exists public.idx_comments_post;
drop index if exists public.idx_comments_parent;
drop index if exists public.idx_comments_user;

-- Spaces
drop index if exists public.idx_spaces_slug;
drop index if exists public.idx_spaces_type_visibility;
drop index if exists public.idx_spaces_created_by;
drop index if exists public.idx_spaces_member_count;

-- Space members
drop index if exists public.idx_space_members_user;
drop index if exists public.idx_space_members_role;

-- Space messages
drop index if exists public.idx_space_messages_channel;
drop index if exists public.idx_space_messages_space;
drop index if exists public.idx_space_messages_user;
drop index if exists public.idx_space_messages_reply;

-- ================================================================
-- PHASE 4: Remove constraints from existing tables
-- ================================================================

-- Users
alter table public.users drop constraint if exists users_email_domain_check;
alter table public.users drop constraint if exists users_full_name_check;
alter table public.users drop constraint if exists users_avatar_url_check;

-- Profiles
alter table public.profiles drop constraint if exists profiles_username_check;
alter table public.profiles drop constraint if exists profiles_bio_check;
alter table public.profiles drop constraint if exists profiles_xp_check;
alter table public.profiles drop constraint if exists profiles_follower_count_check;

-- Events
alter table public.events drop constraint if exists events_title_check;
alter table public.events drop constraint if exists events_slug_check;
alter table public.events drop constraint if exists events_dates_check;
alter table public.events drop constraint if exists events_registration_dates_check;

-- Spaces
alter table public.spaces drop constraint if exists spaces_name_check;
alter table public.spaces drop constraint if exists spaces_slug_check;

-- Posts
alter table public.posts drop constraint if exists posts_body_check;

-- ================================================================
-- PHASE 5: Remove new columns (OPTIONAL - preserves old schema)
-- ================================================================

-- Uncomment if you want to completely revert to old schema:

-- Users
-- alter table public.users drop column if exists onboarding_completed;
-- alter table public.users drop column if exists email_verified;
-- alter table public.users drop column if exists is_banned;
-- alter table public.users drop column if exists banned_reason;
-- alter table public.users drop column if exists banned_until;
-- alter table public.users drop column if exists last_seen;

-- Profiles
-- alter table public.profiles drop column if exists location;
-- alter table public.profiles drop column if exists website;
-- alter table public.profiles drop column if exists follower_count;
-- alter table public.profiles drop column if exists following_count;
-- alter table public.profiles rename column total_xp to xp;

-- Events
-- alter table public.events drop column if exists slug;
-- alter table public.events drop column if exists summary;
-- alter table public.events drop column if exists venue_maps_url;
-- alter table public.events drop column if exists registration_opens_at;
-- alter table public.events drop column if exists registration_closes_at;
-- alter table public.events drop column if exists category;
-- alter table public.events drop column if exists tags;
-- alter table public.events drop column if exists is_featured;
-- alter table public.events drop column if exists banner_url;
-- alter table public.events drop column if exists color_theme;
-- alter table public.events drop column if exists approved_by;
-- alter table public.events drop column if exists approved_at;

-- Spaces
-- alter table public.spaces drop column if exists icon_url;
-- alter table public.spaces drop column if exists member_count;
-- alter table public.spaces drop column if exists message_count;
-- alter table public.spaces drop column if exists settings;

-- Space members
-- alter table public.space_members drop column if exists last_read_at;
-- alter table public.space_members drop column if exists notification_settings;

-- Posts
-- alter table public.posts drop column if exists like_count;
-- alter table public.posts drop column if exists comment_count;
-- alter table public.posts drop column if exists share_count;
-- alter table public.posts drop column if exists is_pinned;
-- alter table public.posts drop column if exists is_locked;
-- alter table public.posts drop column if exists edited_at;

-- Success message
do $$
begin
  raise notice 'Rollback 20251201_130000 completed';
  raise notice 'New tables dropped: follows, presence, audit_log, reactions, etc.';
  raise notice 'Constraints and indexes removed';
  raise notice 'New columns preserved (uncomment section to remove)';
end $$;
