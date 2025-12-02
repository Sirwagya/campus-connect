-- ================================================================
-- Migration: Row-Level Security (RLS) Policies
-- Version: 20251201_133000
-- Description: Enable RLS and add security policies for all tables
-- Rollback: See 20251201_133000_rls_rollback.sql
-- ================================================================

-- ================================================================
-- PHASE 1: Helper Functions
-- ================================================================

-- Check if user is admin
create or replace function is_admin()
returns boolean as $$
begin
  return exists (
    select 1 from users where id = auth.uid() and role = 'admin'
  );
end;
$$ language plpgsql security definer;

-- Check if user is space owner/moderator
create or replace function is_space_moderator(space_uuid uuid)
returns boolean as $$
begin
  return exists (
    select 1 from space_members
    where space_id = space_uuid and user_id = auth.uid() and role in ('owner', 'moderator')
  );
end;
$$ language plpgsql security definer;

-- Check if user can view profile
create or replace function can_view_profile(profile_uuid uuid)
returns boolean as $$
declare
  profile_visibility text;
begin
  select visibility into profile_visibility from profiles where id = profile_uuid;
  
  return (
    profile_visibility = 'public' or
    profile_uuid = auth.uid() or
    (profile_visibility = 'followers_only' and exists (
      select 1 from follows where follower_id = auth.uid() and following_id = profile_uuid
    ))
  );
end;
$$ language plpgsql security definer;

-- ================================================================
-- PHASE 2: Enable RLS on All Tables
-- ================================================================

alter table public.users enable row level security;
alter table public.profiles enable row level security;
alter table public.follows enable row level security;
alter table public.events enable row level security;
alter table public.teams enable row level security;
alter table public.event_registrations enable row level security;
alter table public.posts enable row level security;
alter table public.comments enable row level security;
alter table public.reactions enable row level security;
alter table public.spaces enable row level security;
alter table public.space_members enable row level security;
alter table public.space_channels enable row level security;
alter table public.space_messages enable row level security;
alter table public.typing_indicators enable row level security;
alter table public.presence enable row level security;
alter table public.profile_integrations enable row level security;
alter table public.coding_stats_history enable row level security;
alter table public.user_xp enable row level security;
alter table public.audit_log enable row level security;
alter table public.data_export_requests enable row level security;
alter table public.account_deletions enable row level security;

-- ================================================================
-- PHASE 3: Define Policies
-- ================================================================

-- ----------------------------------------------------------------
-- USERS & PROFILES
-- ----------------------------------------------------------------

-- Users: Publicly readable, admin-only write (except own profile updates)
create policy "users_select" on users for select using (true);

create policy "users_update_own" on users for update using (auth.uid() = id)
  with check (auth.uid() = id and role = (select role from users where id = auth.uid())); -- Can't change own role

create policy "users_admin_all" on users for all using (is_admin());

-- Profiles: Visibility-based access
create policy "profiles_select" on profiles for select using (can_view_profile(id));

create policy "profiles_insert_own" on profiles for insert with check (id = auth.uid());

create policy "profiles_update_own" on profiles for update using (id = auth.uid());

create policy "profiles_delete_own" on profiles for delete using (id = auth.uid());

-- Follows
create policy "follows_select" on follows for select using (true);

create policy "follows_insert_own" on follows for insert with check (follower_id = auth.uid());

create policy "follows_delete_own" on follows for delete using (follower_id = auth.uid());

-- ----------------------------------------------------------------
-- EVENTS SYSTEM
-- ----------------------------------------------------------------

-- Events
create policy "events_select_published" on events for select 
  using (status = 'published' or created_by = auth.uid());

create policy "events_insert" on events for insert with check (created_by = auth.uid());

create policy "events_update_own" on events for update using (created_by = auth.uid());

create policy "events_admin_all" on events for all using (is_admin());

-- Teams
create policy "teams_select" on teams for select using (
  exists (
    select 1 from event_registrations
    where event_registrations.event_id = teams.event_id
      and event_registrations.user_id = auth.uid()
  ) or leader_id = auth.uid()
);

create policy "teams_insert" on teams for insert with check (leader_id = auth.uid());

create policy "teams_update_leader" on teams for update using (leader_id = auth.uid());

-- Event Registrations
create policy "registrations_select_own" on event_registrations for select 
  using (user_id = auth.uid() or exists (
    select 1 from events where events.id = event_registrations.event_id and events.created_by = auth.uid()
  ));

create policy "registrations_insert_own" on event_registrations for insert with check (user_id = auth.uid());

create policy "registrations_update_own" on event_registrations for update using (user_id = auth.uid());

create policy "registrations_delete_own" on event_registrations for delete using (user_id = auth.uid());

-- ----------------------------------------------------------------
-- FEED (POSTS, COMMENTS, REACTIONS)
-- ----------------------------------------------------------------

-- Posts
create policy "posts_select" on posts for select using (
  visibility = 'public' or
  user_id = auth.uid() or
  (visibility = 'followers' and exists (
    select 1 from follows where follower_id = auth.uid() and following_id = user_id
  )) or
  (space_id is not null and exists (
    select 1 from space_members 
    where space_id = posts.space_id and user_id = auth.uid() and status = 'active'
  ))
);

create policy "posts_insert" on posts for insert with check (user_id = auth.uid());

create policy "posts_update_own" on posts for update using (user_id = auth.uid());

create policy "posts_delete_own" on posts for delete using (user_id = auth.uid());

-- Comments
create policy "comments_select" on comments for select using (
  exists (select 1 from posts where posts.id = comments.post_id) -- Inherits post visibility
);

create policy "comments_insert" on comments for insert with check (user_id = auth.uid());

create policy "comments_update_own" on comments for update using (user_id = auth.uid());

create policy "comments_delete_own" on comments for delete using (user_id = auth.uid());

-- Reactions
create policy "reactions_select" on reactions for select using (true);

create policy "reactions_insert_own" on reactions for insert with check (user_id = auth.uid());

create policy "reactions_delete_own" on reactions for delete using (user_id = auth.uid());

-- ----------------------------------------------------------------
-- SPACES & MESSAGES
-- ----------------------------------------------------------------

-- Spaces
create policy "spaces_select" on spaces for select using (
  visibility in ('public', 'hidden') or
  created_by = auth.uid() or
  exists (
    select 1 from space_members 
    where space_id = spaces.id and user_id = auth.uid() and status = 'active'
  )
);

create policy "spaces_insert" on spaces for insert with check (created_by = auth.uid());

create policy "spaces_update_owner" on spaces for update using (
  exists (select 1 from space_members where space_id = spaces.id and user_id = auth.uid() and role = 'owner')
);

-- Space Members
create policy "space_members_select" on space_members for select using (
  user_id = auth.uid() or
  exists (
    select 1 from space_members sm
    where sm.space_id = space_members.space_id and sm.user_id = auth.uid() and sm.status = 'active'
  )
);

create policy "space_members_insert" on space_members for insert with check (
  exists (
    select 1 from space_members
    where space_id = space_members.space_id and user_id = auth.uid() and role in ('owner', 'moderator')
  ) or user_id = auth.uid() -- Can join self
);

create policy "space_members_update" on space_members for update using (
  exists (
    select 1 from space_members sm
    where sm.space_id = space_members.space_id and sm.user_id = auth.uid() and sm.role in ('owner', 'moderator')
  )
);

-- Space Channels
create policy "space_channels_select" on space_channels for select using (
  exists (
    select 1 from space_members
    where space_id = space_channels.space_id and user_id = auth.uid() and status = 'active'
  ) or exists (select 1 from spaces where id = space_channels.space_id and visibility = 'public')
);

-- Space Messages
create policy "messages_select" on space_messages for select using (
  exists (
    select 1 from space_members
    where space_id = space_messages.space_id and user_id = auth.uid() and status = 'active'
  )
);

create policy "messages_insert" on space_messages for insert with check (
  user_id = auth.uid() and
  exists (
    select 1 from space_members
    where space_id = space_messages.space_id and user_id = auth.uid() and status = 'active'
  )
);

create policy "messages_update_own" on space_messages for update using (user_id = auth.uid());

create policy "messages_delete_own_or_mod" on space_messages for delete using (
  user_id = auth.uid() or
  is_space_moderator(space_id)
);

-- Typing Indicators
create policy "typing_select" on typing_indicators for select using (
  exists (
    select 1 from space_members sm, space_channels sc
    where sc.id = typing_indicators.channel_id and sm.space_id = sc.space_id and sm.user_id = auth.uid()
  )
);

create policy "typing_insert_own" on typing_indicators for insert with check (user_id = auth.uid());

create policy "typing_delete_own" on typing_indicators for delete using (user_id = auth.uid());

-- Presence
create policy "presence_select_all" on presence for select using (true);

create policy "presence_upsert_own" on presence for insert with check (user_id = auth.uid());

create policy "presence_update_own" on presence for update using (user_id = auth.uid());

-- ----------------------------------------------------------------
-- INTEGRATIONS & STATS
-- ----------------------------------------------------------------

-- Profile Integrations
create policy "integrations_select" on profile_integrations for select 
  using (user_id = auth.uid() or (is_public and verified_at is not null));

create policy "integrations_manage_own" on profile_integrations for all using (user_id = auth.uid());

-- Coding Stats History
create policy "stats_history_select" on coding_stats_history for select using (
  user_id = auth.uid() or
  exists (select 1 from profile_integrations where user_id = coding_stats_history.user_id and is_public)
);

-- User XP
create policy "user_xp_select" on user_xp for select using (true);

-- ----------------------------------------------------------------
-- AUDIT & COMPLIANCE
-- ----------------------------------------------------------------

-- Audit Log
create policy "audit_log_select_own" on audit_log for select using (user_id = auth.uid());

create policy "audit_log_select_admin" on audit_log for select using (is_admin());

-- Data Export Requests
create policy "export_requests_own" on data_export_requests for all using (user_id = auth.uid());

-- Account Deletions
create policy "account_deletions_own" on account_deletions for all using (user_id = auth.uid());

-- Success message
do $$
begin
  raise notice 'Migration 20251201_133000 (RLS) completed successfully!';
  raise notice 'All tables secured with Row-Level Security policies';
end $$;
