-- Fix Insert Policies for Space Members

-- 1. Drop existing restrictive policies
drop policy if exists "Users can join public spaces" on public.space_members;
-- (Drop any other potential insert policies just in case)

-- 2. Policy: Owners can add members (including themselves)
-- This covers the "Space Creation" case where the owner adds themselves.
create policy "Owners can add members" on public.space_members
  for insert with check (
    exists (
      select 1 from public.spaces
      where id = space_id
      and owner_id = auth.uid()
    )
  );

-- 3. Policy: Users can join public spaces
-- This covers the "Join" button case for public spaces.
create policy "Users can join public spaces" on public.space_members
  for insert with check (
    -- User is adding themselves
    auth.uid() = user_id
    AND
    -- Space is public
    exists (
      select 1 from public.spaces
      where id = space_id
      and is_private = false
    )
  );

-- 4. Grant permissions
grant insert on public.space_members to authenticated;
