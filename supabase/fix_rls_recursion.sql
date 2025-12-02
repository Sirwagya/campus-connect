-- Fix Infinite Recursion in RLS Policies
-- This script fixes the circular dependency between spaces and space_members policies

-- 1. Create a secure function to check membership (Bypasses RLS with SECURITY DEFINER)
create or replace function public.is_space_member(_space_id uuid, _user_id uuid)
returns boolean as $$
begin
  return exists (
    select 1 from public.space_members
    where space_id = _space_id and user_id = _user_id
  );
end;
$$ language plpgsql security definer set search_path = public;

-- 2. Create a function to check if space is private (Bypasses RLS)
create or replace function public.is_space_private(_space_id uuid)
returns boolean as $$
  select coalesce(is_private, false) from public.spaces where id = _space_id;
$$ language sql security definer set search_path = public;

-- 3. Drop ALL existing conflicting policies on spaces
drop policy if exists "Public spaces are viewable by everyone" on public.spaces;
drop policy if exists "Spaces are viewable by everyone" on public.spaces;
drop policy if exists "Users can create spaces" on public.spaces;
drop policy if exists "Owners can update spaces" on public.spaces;
drop policy if exists "Hosts can update their spaces" on public.spaces;

-- 4. Drop ALL existing conflicting policies on space_members  
drop policy if exists "Members are viewable by everyone in public spaces or members" on public.space_members;
drop policy if exists "Users can join public spaces" on public.space_members;
drop policy if exists "Participants are viewable by everyone" on public.space_members;
drop policy if exists "Users can join/leave (insert/update themselves)" on public.space_members;

-- 5. Re-create Spaces Policies (NO circular references)
create policy "Spaces select policy" on public.spaces
  for select using (
    -- Public spaces are viewable by everyone
    (is_private = false)
    OR
    -- Private spaces viewable if user is a member (uses security definer function)
    public.is_space_member(id, auth.uid())
    OR
    -- Owner can always see their spaces
    (owner_id = auth.uid())
  );

create policy "Spaces insert policy" on public.spaces
  for insert with check (auth.uid() = owner_id);

create policy "Spaces update policy" on public.spaces
  for update using (auth.uid() = owner_id);

create policy "Spaces delete policy" on public.spaces
  for delete using (auth.uid() = owner_id);

-- 6. Re-create Space Members Policies (NO circular references)
create policy "Space members select policy" on public.space_members
  for select using (
    -- I can see my own membership
    (user_id = auth.uid())
    OR
    -- I can see members of public spaces (uses security definer function)
    (public.is_space_private(space_id) = false)
    OR
    -- I can see members of spaces I belong to (uses security definer function)
    public.is_space_member(space_id, auth.uid())
  );

create policy "Space members insert policy" on public.space_members
  for insert with check (
    auth.uid() = user_id
  );

create policy "Space members update policy" on public.space_members
  for update using (
    -- Members can update their own record
    (user_id = auth.uid())
    OR
    -- Or space owner can update members
    exists (select 1 from public.spaces where id = space_id and owner_id = auth.uid())
  );

create policy "Space members delete policy" on public.space_members
  for delete using (
    -- Members can leave (delete their own record)
    (user_id = auth.uid())
    OR
    -- Or space owner can remove members
    exists (select 1 from public.spaces where id = space_id and owner_id = auth.uid())
  );

