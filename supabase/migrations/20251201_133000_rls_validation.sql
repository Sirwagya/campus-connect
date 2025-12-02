-- ================================================================
-- Validation Queries for RLS Policies
-- Run these AFTER migration to verify security
-- ================================================================

-- 1. Check if RLS is enabled on all tables
select
  tablename,
  rowsecurity
from pg_tables
where schemaname = 'public'
  and tablename in (
    'users', 'profiles', 'follows', 'events', 'teams', 'event_registrations',
    'posts', 'comments', 'reactions', 'spaces', 'space_members', 'space_channels',
    'space_messages', 'typing_indicators', 'presence', 'profile_integrations',
    'coding_stats_history', 'user_xp', 'audit_log', 'data_export_requests', 'account_deletions'
  )
order by tablename;

-- 2. Count policies per table
select
  tablename,
  count(policyname) as policy_count
from pg_policies
where schemaname = 'public'
group by tablename
order by tablename;

-- 3. Verify helper functions exist
select
  routine_name,
  routine_type,
  security_type -- Should be 'DEFINER'
from information_schema.routines
where routine_schema = 'public'
  and routine_name in ('is_admin', 'is_space_moderator', 'can_view_profile');

-- Success message
do $$
declare
  unsecured_tables int;
begin
  select count(*) into unsecured_tables
  from pg_tables
  where schemaname = 'public'
    and rowsecurity = false
    and tablename in ('users', 'profiles', 'events', 'posts'); -- Critical tables

  if unsecured_tables > 0 then
    raise warning '⚠ Found % critical tables with RLS disabled!', unsecured_tables;
  else
    raise notice '✓ All critical tables have RLS enabled';
  end if;
end $$;
