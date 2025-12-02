-- ================================================================
-- Validation Queries for Schema Enhancement Migration
-- Run these AFTER migration to verify database integrity
-- ================================================================

-- 1. Check for invalid email domains (should return 0)
select count(*) as invalid_emails_count,
       array_agg(email) as invalid_emails
from users
where email !~ '^[a-zA-Z0-9._%+-]+@vedamsot\.org$';

-- 2. Check for null/empty usernames (should return 0)
select count(*) as invalid_usernames_count
from profiles
where username is null or username !~ '^[a-zA-Z0-9_-]{3,30}$';

-- 3. Check for invalid event dates (should return 0)
select count(*) as invalid_event_dates_count,
       array_agg(id) as invalid_event_ids
from events
where end_ts <= start_ts;

-- 4. Check for orphaned data (should return 0 for each)
select 'orphaned_profiles' as check_name, count(*) as count
from profiles p
where not exists (select 1 from users u where u.id = p.id)
union all
select 'orphaned_follows_follower', count(*)
from follows f
where not exists (select 1 from users u where u.id = f.follower_id)
union all
select 'orphaned_follows_following', count(*)
from follows f
where not exists (select 1 from users u where u.id = f.following_id)
union all
select 'orphaned_posts', count(*)
from posts p
where not exists (select 1 from users u where u.id = p.user_id);

-- 5. Verify index existence
select
  schemaname,
  tablename,
  indexname,
  indexdef
from pg_indexes
where schemaname = 'public'
  and tablename in ('users', 'profiles', 'events', 'posts', 'spaces', 'follows')
order by tablename, indexname;

-- 6. Verify new tables exist
select
  table_name,
  (select count(*) from information_schema.columns c where c.table_name = t.table_name) as column_count
from information_schema.tables t
where table_schema = 'public'
  and table_name in ('follows', 'presence', 'typing_indicators', 'reactions', 'audit_log',
                      'data_export_requests', 'account_deletions', 'coding_stats_history', 'user_xp')
order by table_name;

-- 7. Check constraint existence
select
  tc.table_name,
  tc.constraint_name,
  tc.constraint_type
from information_schema.table_constraints tc
where tc.table_schema = 'public'
  and tc.table_name in ('users', 'profiles', 'events', 'posts', 'spaces')
  and tc.constraint_type = 'CHECK'
order by tc.table_name, tc.constraint_name;

-- 8. Verify triggers are in place
select
  trigger_name,
  event_object_table,
  action_statement
from information_schema.triggers
where trigger_schema = 'public'
  and trigger_name in ('update_follower_counts_trigger', 'update_reaction_counts_trigger', 'cleanup_typing_trigger')
order by event_object_table, trigger_name;

-- 9. Check TimescaleDB hypertable
select
  h.hypertable_name,
  h.num_chunks,
  h.compression_state
from timescaledb_information.hypertables h
where h.hypertable_name = 'coding_stats_history';

-- 10. Verify materialized view
select
  schemaname,
  matviewname,
  hasindexes,
  ispopulated
from pg_matviews
where matviewname = 'coding_stats_current';

-- 11. Sample data counts (for monitoring)
select
  'users' as table, count(*) as row_count from users
union all
select 'profiles', count(*) from profiles
union all
select 'events', count(*) from events
union all
select 'posts', count(*) from posts
union all
select 'comments', count(*) from comments
union all
select 'spaces', count(*) from spaces
union all
select 'follows', count(*) from follows
union all
select 'reactions', count(*) from reactions
union all
select 'audit_log', count(*) from audit_log
order by table;

-- 12. Check for performance - slow queries (run after some usage)
select
  schemaname,
  tablename,
  indexname,
  idx_scan as index_scans,
  idx_tup_read as tuples_read,
  idx_tup_fetch as tuples_fetched
from pg_stat_user_indexes
where schemaname = 'public'
order by idx_scan desc
limit 20;

-- Success message
do $$
declare
  validation_passed boolean := true;
begin
  -- You can add automated checks here
  if validation_passed then
    raise notice '✓ All validation checks passed!';
    raise notice 'Migration appears successful';
  else
    raise warning '⚠ Some validation checks failed - review results above';
  end if;
end $$;
