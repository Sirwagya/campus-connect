-- ================================================================
-- ROLLBACK Migration: 202512011330_rls_policies
-- Version: 20251201_133000_rls_rollback
-- Description: Disable RLS and drop policies
-- ================================================================

-- Drop policies
drop policy if exists "users_select" on users;
drop policy if exists "users_update_own" on users;
drop policy if exists "users_admin_all" on users;

drop policy if exists "profiles_select" on profiles;
drop policy if exists "profiles_insert_own" on profiles;
drop policy if exists "profiles_update_own" on profiles;
drop policy if exists "profiles_delete_own" on profiles;

drop policy if exists "follows_select" on follows;
drop policy if exists "follows_insert_own" on follows;
drop policy if exists "follows_delete_own" on follows;

drop policy if exists "events_select_published" on events;
drop policy if exists "events_insert" on events;
drop policy if exists "events_update_own" on events;
drop policy if exists "events_admin_all" on events;

drop policy if exists "teams_select" on teams;
drop policy if exists "teams_insert" on teams;
drop policy if exists "teams_update_leader" on teams;

drop policy if exists "registrations_select_own" on event_registrations;
drop policy if exists "registrations_insert_own" on event_registrations;
drop policy if exists "registrations_update_own" on event_registrations;
drop policy if exists "registrations_delete_own" on event_registrations;

drop policy if exists "posts_select" on posts;
drop policy if exists "posts_insert" on posts;
drop policy if exists "posts_update_own" on posts;
drop policy if exists "posts_delete_own" on posts;

drop policy if exists "comments_select" on comments;
drop policy if exists "comments_insert" on comments;
drop policy if exists "comments_update_own" on comments;
drop policy if exists "comments_delete_own" on comments;

drop policy if exists "reactions_select" on reactions;
drop policy if exists "reactions_insert_own" on reactions;
drop policy if exists "reactions_delete_own" on reactions;

drop policy if exists "spaces_select" on spaces;
drop policy if exists "spaces_insert" on spaces;
drop policy if exists "spaces_update_owner" on spaces;

drop policy if exists "space_members_select" on space_members;
drop policy if exists "space_members_insert" on space_members;
drop policy if exists "space_members_update" on space_members;

drop policy if exists "space_channels_select" on space_channels;

drop policy if exists "messages_select" on space_messages;
drop policy if exists "messages_insert" on space_messages;
drop policy if exists "messages_update_own" on space_messages;
drop policy if exists "messages_delete_own_or_mod" on space_messages;

drop policy if exists "typing_select" on typing_indicators;
drop policy if exists "typing_insert_own" on typing_indicators;
drop policy if exists "typing_delete_own" on typing_indicators;

drop policy if exists "presence_select_all" on presence;
drop policy if exists "presence_upsert_own" on presence;
drop policy if exists "presence_update_own" on presence;

drop policy if exists "integrations_select" on profile_integrations;
drop policy if exists "integrations_manage_own" on profile_integrations;

drop policy if exists "stats_history_select" on coding_stats_history;

drop policy if exists "user_xp_select" on user_xp;

drop policy if exists "audit_log_select_own" on audit_log;
drop policy if exists "audit_log_select_admin" on audit_log;

drop policy if exists "export_requests_own" on data_export_requests;

drop policy if exists "account_deletions_own" on account_deletions;

-- Disable RLS (Optional - usually better to keep enabled but with no policies)
-- alter table public.users disable row level security;
-- alter table public.profiles disable row level security;
-- ...

-- Drop helper functions
drop function if exists is_admin();
drop function if exists is_space_moderator(uuid);
drop function if exists can_view_profile(uuid);

do $$
begin
  raise notice 'Rollback 20251201_133000 (RLS) completed';
end $$;
