-- ================================================================
-- Migration: Fix Profile Visibility
-- Version: 20251201_fix_profile_visibility
-- Description: Ensure avatars bucket is public and fix users update policy
-- ================================================================

-- 1. Force avatars bucket to be public
-- This fixes the issue where the bucket might have been created as private
update storage.buckets
set public = true
where id = 'avatars';

-- 2. Fix users_update_own policy
-- The previous policy failed when role was NULL because (NULL = NULL) is not true in SQL.
-- We use IS NOT DISTINCT FROM to handle NULLs correctly.

drop policy if exists "users_update_own" on public.users;

create policy "users_update_own" on public.users 
for update using (auth.uid() = id)
with check (
  auth.uid() = id and 
  (
    role is not distinct from (select role from public.users where id = auth.uid())
  )
);

do $$
begin
  raise notice 'Fixed avatars bucket visibility and users update policy';
end $$;
